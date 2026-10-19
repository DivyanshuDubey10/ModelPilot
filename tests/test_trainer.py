import pandas as pd

from backend.ml_engine.preprocessor import (
    identify_feature_types,
    build_preprocessor,
    prepare_data,
)
from backend.ml_engine.trainer import train_model

df = pd.DataFrame({
    "age": [22, 35, 28, 45, 31, 50, 26, 40, 33, 29,
            55, 24, 38, 42, 27, 48, 36, 30, 44, 25],
    "amount": [100, 900, 200, 1200, 300, 1500, 150, 800, 400, 250,
               1800, 120, 700, 1100, 180, 1400, 600, 220, 950, 130],
    "city": ["Delhi", "Mumbai", "Delhi", "Pune", "Mumbai",
             "Pune", "Delhi", "Mumbai", "Pune", "Delhi",
             "Mumbai", "Pune", "Delhi", "Mumbai", "Pune",
             "Delhi", "Mumbai", "Pune", "Delhi", "Mumbai"],
    "fraud": [0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
              1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
})

X, y = prepare_data(df, "fraud")
numerical, categorical = identify_feature_types(X)
preprocessor = build_preprocessor(numerical, categorical)

model, y_test, predictions = train_model(X, y, preprocessor)

print("Actual values:", y_test.tolist())
print("Predictions:", predictions.tolist())
print("Test samples:", len(y_test))
