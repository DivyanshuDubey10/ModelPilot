from pyexpat import model

from backend.ml_engine.trainer import train_model
from backend.ml_engine.evaluator import evaluate_model

def run_experiment(
    X, y, preprocessor,
    model_name="logistic_regression",
    n_estimators=100,
):
    model, y_test, predictions = train_model(
        X, y, preprocessor, model_name, n_estimators
    )

    metrics = evaluate_model(y_test, predictions)

    return {
        "model": model,
        "model_name": model_name,
        "n_estimators": n_estimators,
        "metrics": metrics,
        "y_test": y_test.tolist(),
        "predictions": predictions.tolist(),
    }
    
def select_best_experiment(
    results,
    metric="f1",
    min_precision=None,
):
    eligible = results

    if min_precision is not None:
        eligible = [
            result for result in results
            if result["metrics"]["precision"] >= min_precision
        ]

    if not eligible:
        return None

    return max(
        eligible,
        key=lambda result: result["metrics"][metric]
    )

def record_experiment(history, result):
    history.append({
        "model_name": result["model_name"],
        "n_estimators": result["n_estimators"],
        "metrics": result["metrics"],
    })
    return history


def suggest_next_experiment(history):
    tested = {
        result["n_estimators"]
        for result in history
    }

    candidates = [50, 100, 200, 300, 500]

    for trees in candidates:
        if trees not in tested:
            return trees

    return None
