import pandas as pd

from backend.ml_engine.preprocessor import (
    prepare_data,
    identify_feature_types,
    build_preprocessor,
)

df = pd.DataFrame({
    "age": [25, 32, 28],
    "city": ["Delhi", "Mumbai", "Delhi"],
    "income": [40000, None, 50000],
    "fraud": [0, 1, 0],
})

X, y = prepare_data(df, "fraud")

numerical, categorical = identify_feature_types(X)

preprocessor = build_preprocessor(numerical, categorical)

X_processed = preprocessor.fit_transform(X)

print("Numerical columns:", numerical)
print("Categorical columns:", categorical)
print("Processed data:")
print(X_processed)
print("Target:")
print(y)