from backend.ml_engine.preprocessor import (
    prepare_data,
    identify_feature_types,
    build_preprocessor,
)
from backend.ml_engine.experiment_runner import run_experiment
from tests.test_trainer import df

# Reuse the same df from test_trainer.py
X, y = prepare_data(df, "fraud")
numerical, categorical = identify_feature_types(X)
preprocessor = build_preprocessor(numerical, categorical)

result = run_experiment(X, y, preprocessor)

print("Evaluation metrics:", result["metrics"])