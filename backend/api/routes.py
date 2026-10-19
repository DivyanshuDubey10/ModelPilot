
from fastapi import APIRouter, HTTPException
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
)
import uuid
import pandas as pd

from backend.ml_engine.profiler import profile_dataset
from backend.ml_engine.problem_detector import detect_problem_type

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
        df = pd.read_csv(request.dataset_path)

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
        df = pd.read_csv(request.dataset_path)

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
        df = pd.read_csv(request.dataset_path)

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
        df = pd.read_csv(request.dataset_path)

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
