
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from backend.ml_engine.preprocessor import (
    prepare_data,
    identify_feature_types,
    build_preprocessor,
)
from backend.agent.planner import recommend_experiment
from backend.ml_engine.experiment_runner import (
    run_experiment,
    select_best_experiment,
    record_experiment,
)
from backend.database.history_store import (
    save_experiment,
    save_optimization_run,
    load_optimization_run,
    load_history,
    list_optimization_runs,
)
import uuid
import pandas as pd
from pathlib import Path

from backend.ml_engine.profiler import profile_dataset
from backend.ml_engine.problem_detector import detect_problem_type

# Directory where uploaded datasets are saved
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "backend" / "datasets"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def resolve_dataset_path(path_str: str) -> Path:
    """Safely resolve dataset path across different platforms, relative paths, and uploads."""
    p = Path(path_str)
    if p.is_file():
        return p

    repo_root = Path(__file__).resolve().parents[2]
    cand1 = repo_root / path_str
    if cand1.is_file():
        return cand1

    cand2 = UPLOAD_DIR / p.name
    if cand2.is_file():
        return cand2

    cand3 = repo_root / "backend" / "datasets" / p.name
    if cand3.is_file():
        return cand3

    return p


router = APIRouter()


class OptimizeRequest(BaseModel):
    dataset_path: str
    target: str
    objective: str = "recall"
    min_precision: float = 0.70
    max_experiments: int = 5


def build_optimization_summary(experiments, best, objective, min_precision):
    if not experiments:
        return {
            "decision": "No experiments completed.",
            "reason": "No valid candidate configuration was available.",
            "next_step": "Check the dataset and experiment configuration.",
        }

    if best is None:
        return {
            "decision": "No configuration satisfied the precision constraint.",
            "reason": (
                f"Every tested model was evaluated against the minimum "
                f"precision requirement of {min_precision:.2f}."
            ),
            "next_step": "Review the precision requirement or test new configurations.",
        }

    best_score = best["metrics"][objective]

    alternatives = [
        experiment for experiment in experiments
        if experiment["n_estimators"] != best["n_estimators"]
    ]

    lower_scoring = [
        experiment for experiment in alternatives
        if experiment["metrics"][objective] < best_score
    ]

    return {
        "decision": (
            f"Selected Random Forest with {best['n_estimators']} trees."
        ),
        "reason": (
            f"It achieved the highest {objective} score "
            f"({best_score:.4f}) among the tested configurations "
            f"while satisfying the minimum precision requirement "
            f"of {min_precision:.2f}."
        ),
        "configurations_tested": len(experiments),
        "alternatives_with_lower_objective_score": len(lower_scoring),
        "precision_constraint_satisfied": bool(
            best["metrics"]["precision"] >= min_precision
        ),
        "next_step": (
            "Test additional configurations or validate the selected model "
            "on an independent dataset."
        ),
    }

@router.post("/optimize")
def optimize_dataset(request: OptimizeRequest):
    if request.objective not in {"recall", "f1", "accuracy"}:
        raise HTTPException(
            status_code=400,
            detail="Objective must be recall, f1, or accuracy.",
        )

    if not 0 < request.min_precision <= 1:
        raise HTTPException(
            status_code=400,
            detail="min_precision must be greater than 0 and at most 1.",
        )

    if not 1 <= request.max_experiments <= 5:
        raise HTTPException(
            status_code=400,
            detail="max_experiments must be between 1 and 5.",
        )

    try:
        dataset_file = resolve_dataset_path(request.dataset_path)
        df = pd.read_csv(dataset_file)

        if request.target not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target}' not found.",
            )

        X, y = prepare_data(df, request.target)
        numerical, categorical = identify_feature_types(X)
        preprocessor = build_preprocessor(numerical, categorical)

        # Start with a fresh history for this optimization request.
        run_id = str(uuid.uuid4())
        run_history = []
        saved_results = []

        for _ in range(request.max_experiments):
            recommendation = recommend_experiment(
                run_history,
                objective=request.objective,
                min_precision=request.min_precision,
            )

            trees = recommendation["n_estimators"]

            if trees is None:
                break

            result = run_experiment(
                X,
                y,
                preprocessor,
                model_name="random_forest",
                n_estimators=trees,
            )

            record_experiment(run_history, result)

            saved_record = {
                "dataset_path": request.dataset_path,
                "target": request.target,
                "objective": request.objective,
                "min_precision": request.min_precision,
                "model_name": result["model_name"],
                "n_estimators": result["n_estimators"],
                "metrics": result["metrics"],
            }

            save_experiment(saved_record)
            saved_results.append(saved_record)

       
        best = select_best_experiment(
            run_history,
            metric=request.objective,
            min_precision=request.min_precision,
        )

        summary = build_optimization_summary(
            experiments=saved_results,
            best=best,
            objective=request.objective,
            min_precision=request.min_precision,
        )
        run_data = save_optimization_run(
    run_id=run_id,
    metadata={
        "dataset_path": request.dataset_path,
        "target": request.target,
        "objective": request.objective,
        "min_precision": request.min_precision,
        "max_experiments": request.max_experiments,
    },
    experiments=saved_results,
)

        return {
            "run_id": run_id,
            "experiments_run": len(run_history),
            "experiments": saved_results,
            "best_experiment": best,
            "constraint_satisfied": bool(best is not None),
            "optimization_summary": summary,
        }


    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {exc}",
        )
        

@router.get("/optimize/{run_id}")
@router.get("/runs/{run_id}")
def get_optimization_run(run_id: str):
    try:
        run_data = load_optimization_run(run_id)

        if run_data is None:
            raise HTTPException(
                status_code=404,
                detail="Optimization run not found.",
            )

        return run_data

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve optimization run: {exc}",
        )



class ExperimentRequest(BaseModel):
    dataset_path: str
    target: str
    model_name: str = "logistic_regression"
    n_estimators: int = 100


@router.post("/experiment")
def execute_experiment(request: ExperimentRequest):
    try:
        dataset_file = resolve_dataset_path(request.dataset_path)
        df = pd.read_csv(dataset_file)

        if request.target not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target}' not found.",
            )

        if request.model_name not in {
            "logistic_regression",
            "random_forest",
        }:
            raise HTTPException(
                status_code=400,
                detail="Unsupported model name.",
            )

        if not 50 <= request.n_estimators <= 500:
            raise HTTPException(
                status_code=400,
                detail="n_estimators must be between 50 and 500.",
            )

        X, y = prepare_data(df, request.target)

        numerical, categorical = identify_feature_types(X)

        preprocessor = build_preprocessor(
            numerical,
            categorical,
        )

        result = run_experiment(
            X,
            y,
            preprocessor,
            model_name=request.model_name,
            n_estimators=request.n_estimators,
        )

        return {
            "model_name": result["model_name"],
            "n_estimators": result["n_estimators"],
            "metrics": result["metrics"],
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Experiment failed: {exc}",
        )


class DatasetRequest(BaseModel):
    dataset_path: str
    target: str


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ModelPilot API",
    }


@router.post("/profile")
def profile_dataset_endpoint(request: DatasetRequest):
    try:
        dataset_file = resolve_dataset_path(request.dataset_path)
        df = pd.read_csv(dataset_file)

        if request.target not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target}' not found.",
            )

        profile = profile_dataset(df)
        problem_type = detect_problem_type(df, request.target)

        return {
            "filename": request.dataset_path,
            "profile": profile,
            "problem_type": problem_type,
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not profile dataset: {exc}",
        )


@router.post("/analyze")
def analyze_dataset(request: DatasetRequest):
    try:
        dataset_file = resolve_dataset_path(request.dataset_path)
        df = pd.read_csv(dataset_file)

        if request.target not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target}' not found.",
            )

        result = detect_problem_type(df, request.target)

        return {
            "dataset_path": request.dataset_path,
            "target": request.target,
            "analysis": result,
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not analyze dataset: {exc}",
        )


# ── File Upload ───────────────────────────────────────────────


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Save and profile a CSV without retaining the entire file in memory."""
    import os
    import uuid

    MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
    MAX_ROWS = 50_000
    MAX_COLUMNS = 100

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    # Generate a safe, unique filename.
    safe_filename = f"{uuid.uuid4().hex}.csv"
    dest = UPLOAD_DIR / safe_filename
    total_bytes = 0

    try:
        # Stream the upload to disk with a hard size limit.
        with dest.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break

                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="CSV exceeds the 10 MB upload limit.",
                    )

                output.write(chunk)

        # Read only the first 100 rows to check the column structure.
        header = pd.read_csv(dest, nrows=100)

        if len(header.columns) > MAX_COLUMNS:
            raise HTTPException(
                status_code=400,
                detail=f"CSV exceeds the {MAX_COLUMNS}-column limit.",
            )

        # Check the total row count without loading the full DataFrame.
        row_count = 0
        with dest.open("rb") as csv_file:
            for chunk in pd.read_csv(csv_file, chunksize=5000):
                row_count += len(chunk)
                if row_count > MAX_ROWS:
                    raise HTTPException(
                        status_code=413,
                        detail=f"CSV exceeds the {MAX_ROWS}-row limit.",
                    )

        # Profile a bounded sample to keep memory usage predictable.
        sample = pd.read_csv(dest, nrows=min(row_count, 5000))
        profile = profile_dataset(sample)

        return {
            "dataset_path": str(dest),
            "filename": file.filename,
            "rows": row_count,
            "columns": len(header.columns),
            "column_names": header.columns.tolist(),
            "data_types": header.dtypes.astype(str).to_dict(),
            "missing_values": profile["missing_values"],
            "duplicates": None,
            "profile_note": (
                "Missing-value counts are based on a sample of up to 5,000 rows. "
                "Duplicate count was not calculated during upload."
            ),
        }

    except HTTPException:
        if dest.exists():
            dest.unlink()
        raise
    except Exception as exc:
        if dest.exists():
            dest.unlink()
        raise HTTPException(
            status_code=400,
            detail=f"Could not process uploaded file: {exc}",
        )
    finally:
        await file.close()



# ── History list ──────────────────────────────────────────────

@router.get("/history")
def get_history():
    """Return all saved experiment records from experiment_history.json."""
    try:
        return load_history()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load history: {exc}",
        )


# ── Optimization runs list ────────────────────────────────────

@router.get("/runs")
def list_runs():
    """Return summary list of all saved optimization run JSON files."""
    try:
        return list_optimization_runs()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not list runs: {exc}",
        )
