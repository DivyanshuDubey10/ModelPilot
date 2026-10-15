import pandas as pd


def detect_problem_type(df: pd.DataFrame, target: str) -> dict:
    if target not in df.columns:
        raise ValueError(
            f"Target column '{target}' not found in dataset"
    )
    
    target_data = df[target]

    if target_data.dtype == "object":
        problem_type = "classification"
    elif target_data.nunique() <= 8:
        problem_type = "classification"
    else:
        problem_type = "regression"
        
    if problem_type == "classification":
        class_counts = target_data.value_counts()
        minority_count = class_counts.min()
        total_count = len(target_data)
        minority_ratio = minority_count / total_count
        
        if minority_ratio < 0.20:
            imbalanced = True
        else:
            imbalanced = False
    else:
        imbalanced = False        

    return {
        "problem_type": problem_type,
        "imbalanced": imbalanced
    }