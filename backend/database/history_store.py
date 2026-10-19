import json 
from pathlib import Path

HISTORY_FILE = (
    Path(__file__).resolve().parents[2]
    / "experiment_history.json"
)

def load_history():
    if not HISTORY_FILE.exists():
        return []
    with HISTORY_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)
    
def save_experiment(experiment):
    history = load_history()
    history.append(experiment)

    with HISTORY_FILE.open("w", encoding="utf-8") as file:
        json.dump(history, file, indent=2)

    return history


from datetime import datetime, timezone


RUNS_DIR = (
    Path(__file__).resolve().parents[2]
    / "experiment_runs"
)


def save_optimization_run(run_id, metadata, experiments):
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    run_data = {
        "run_id": run_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata,
        "experiments": experiments,
    }

    run_file = RUNS_DIR / f"{run_id}.json"

    with run_file.open("w", encoding="utf-8") as file:
        json.dump(run_data, file, indent=2)

    return run_data


def load_optimization_run(run_id):
    run_file = RUNS_DIR / f"{run_id}.json"

    if not run_file.exists():
        return None

    with run_file.open("r", encoding="utf-8") as file:
        return json.load(file)


def list_optimization_runs():
    """Return a list of summaries for all saved optimization runs."""
    if not RUNS_DIR.exists():
        return []

    summaries = []
    for run_file in sorted(RUNS_DIR.glob("*.json"), reverse=True):
        try:
            with run_file.open("r", encoding="utf-8") as f:
                data = json.load(f)
            # Build a lightweight summary
            experiments = data.get("experiments", [])
            meta = data.get("metadata", {})
            best_metrics = None
            if experiments:
                # Pick the experiment with highest objective score
                objective = meta.get("objective", "recall")
                best = max(
                    experiments,
                    key=lambda e: e.get("metrics", {}).get(objective, 0),
                )
                best_metrics = best.get("metrics", {})
            summaries.append({
                "run_id": data.get("run_id"),
                "created_at": data.get("created_at"),
                "dataset_path": meta.get("dataset_path", ""),
                "target": meta.get("target", ""),
                "objective": meta.get("objective", ""),
                "min_precision": meta.get("min_precision"),
                "total_experiments": len(experiments),
                "best_metrics": best_metrics,
            })
        except Exception:
            continue

    return summaries
