import pandas as pd
from backend.ml_engine.problem_detector import detect_problem_type
from backend.ml_engine.profiler import profile_dataset
from backend.ml_engine.analyzer import analyze_dataset

df = pd.DataFrame({
    "fraud": [0,0,0,0,0,0,0,0,0,1],
})
profile = profile_dataset(df)
print(profile)
result = analyze_dataset(df, "fraud")
print(result)
try: 
    detect_problem_type(df, "wrong_columns")
except ValueError as e:
    print(e)