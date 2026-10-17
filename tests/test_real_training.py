
import pandas as pd

from backend.ml_engine.preprocessor import (
    prepare_data,
    identify_feature_types,
    build_preprocessor,
)
from backend.ml_engine.experiment_runner import (
    run_experiment,
    select_best_experiment,
    record_experiment,
    suggest_next_experiment,
)

df = pd.read_csv("backend/datasets/AIDS_Classification.csv")

X, y = prepare_data(df, target="infected")
numerical, categorical = identify_feature_types(X)
preprocessor = build_preprocessor(numerical, categorical)

results = []

for model_name in ["logistic_regression", "random_forest"]:
    result = run_experiment(
        X, y, preprocessor, model_name=model_name
    )
    results.append(result)

    print(f"\n{model_name}:")
    print(result["metrics"])

best = select_best_experiment(
    results,
    metric="recall",
    min_precision=0.70,
)

print("\nBest experiment by recall (precision >= 0.70):")
print(best["model_name"], best["metrics"])


from backend.ml_engine.experiment_runner import record_experiment


history = []
max_experiments = 5

for _ in range(max_experiments):
    trees = suggest_next_experiment(history)

    if trees is None:
        print("All candidate configurations tested.")
        break

    result = run_experiment(
        X,
        y,
        preprocessor,
        model_name="random_forest",
        n_estimators=trees,
    )

    record_experiment(history, result)

    print(f"\nRandom Forest — {trees} trees")
    print("Metrics:", result["metrics"])

best = select_best_experiment(
    history,
    metric="recall",
    min_precision=0.70,
)

print("\nBest configuration:")
if best is not None:
    print("Trees:", best["n_estimators"])
    print("Metrics:", best["metrics"])
else:
    print("No configuration met the precision requirement.")
