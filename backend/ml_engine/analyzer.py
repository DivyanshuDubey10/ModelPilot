from backend.ml_engine.profiler import profile_dataset
from backend.ml_engine.problem_detector import detect_problem_type

def analyze_dataset(df, target):
    profile = profile_dataset(df)
    problem = detect_problem_type(df, target)
    return {
        "profile": profile,
        "problem": problem
    }