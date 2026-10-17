from backend.ml_engine.preprocessor import (
    prepare_data,
    identify_feature_types,
    build_preprocessor,
)
from backend.ml_engine.experiment_runner import run_experiment
from tests.test_trainer import df
from backend.ml_engine.experiment_runner import select_best_experiment
from backend.ml_engine.experiment_runner import record_experiment

# Reuse the same df from test_trainer.py
X, y = prepare_data(df, "fraud")
numerical, categorical = identify_feature_types(X)
preprocessor = build_preprocessor(numerical, categorical)

logistic_result = run_experiment(
    X, y, preprocessor,
    model_name="logistic_regression",
    n_estimators=100,
)

forest_result = run_experiment(
    X, y, preprocessor,
    model_name="random_forest",
)

print("Logistic Regression:", logistic_result["metrics"])
print("Random Forest:", forest_result["metrics"])

best = select_best_experiment(
    [logistic_result, forest_result],
    metric="recall",
    min_precision=0.70,
)

print(
    "Best model:",
    best["model_name"] if best else "No model met the constraint",
)

no_eligible_model = select_best_experiment(
    [logistic_result, forest_result],
    metric="recall",
    min_precision=1.1,
)

print("No eligible model:", no_eligible_model)

def record_experiment(history, result):
    history.append({
        "model_name": result["model_name"],
        "n_estimators": result["n_estimators"],
        "metrics": result["metrics"],
    })
    return history

history = []

for trees in [50, 100, 200]:
    result = run_experiment(
        X, y, preprocessor,
        model_name="random_forest",
        n_estimators=trees,
    )

    record_experiment(history, result)

print("Experiment history:")

for experiment in history:
    print(
        experiment["n_estimators"],
        experiment["metrics"],
    )
    
best = select_best_experiment(history, metric="f1")

print("Best configuration:", best["n_estimators"])
print("Best metrics:", best["metrics"])
best = select_best_experiment(
    history,
    metric="recall",
    min_precision=0.70,
)

print("Best experiment for fraud detection:", best)