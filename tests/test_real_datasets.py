
import pandas as pd

from backend.ml_engine.analyzer import analyze_dataset

df = pd.read_csv("backend/datasets/AIDS_Classification.csv")

results = analyze_dataset(df, target="infected")

print("Dataset profile:")
print(results["profile"])

print("\nProblem detection:")
print(results["problem"])

print("\nTarget distribution:")
print(df["infected"].value_counts())
