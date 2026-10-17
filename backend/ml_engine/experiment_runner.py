from backend.ml_engine.trainer import train_model
from backend.ml_engine.evaluator import evaluate_model

def run_experiment(X, y, preprocessor, model_name="logistic_regression"):
    model, y_test, predictions = train_model(
        X, y, preprocessor, model_name
    )

    metrics = evaluate_model(y_test, predictions)

    return {
        "model": model,
        "model_name": model_name,
        "metrics": metrics,
    }