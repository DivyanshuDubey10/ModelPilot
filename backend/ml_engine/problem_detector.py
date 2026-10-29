
import pandas as pd


def detect_problem_type(df: pd.DataFrame, target: str) -> dict:
    if target not in df.columns:
        raise ValueError(
            f"Target column '{target}' not found in dataset"
        )

    target_data = df[target].dropna()

    if target_data.empty:
        return {
            "problem_type": "unknown",
            "imbalanced": False,
            "reason": "The target column contains no usable values.",
        }

    unique_count = target_data.nunique()
    row_count = len(target_data)
    unique_ratio = unique_count / row_count

    if unique_count < 2:
        return {
            "problem_type": "unknown",
            "imbalanced": False,
            "reason": "The target has fewer than two distinct values.",
        }

    # Flag likely identifiers instead of treating them as targets.
    name = target.strip().lower()
    id_like_name = (
        name == "id"
        or name.endswith("_id")
        or name.endswith(" id")
        or name in {"uuid", "identifier", "transaction_id"}
    )

    if id_like_name or unique_ratio >= 0.95:
        return {
            "problem_type": "unknown",
            "imbalanced": False,
            "reason": (
                "The selected target appears identifier-like or "
                "has too many unique values. Select a meaningful "
                "outcome column."
            ),
        }

    is_numeric = pd.api.types.is_numeric_dtype(target_data)

    # Numeric targets with few distinct values are ambiguous.
    # Treat them as classification only when cardinality is low.
    if not is_numeric:
        problem_type = (
            "binary_classification"
            if unique_count == 2
            else "multiclass_classification"
        )
    elif unique_count <= 8:
        problem_type = (
            "binary_classification"
            if unique_count == 2
            else "multiclass_classification"
        )
    else:
        problem_type = "regression"

    imbalanced = False

    if "classification" in problem_type:
        class_counts = target_data.value_counts()
        imbalanced = (
            class_counts.min() / class_counts.sum()
        ) < 0.20

    return {
        "problem_type": problem_type,
        "imbalanced": imbalanced,
        "unique_values": int(unique_count),
        "missing_values": int(df[target].isna().sum()),
        "reason": "Detected using target data type and cardinality heuristics.",
    }
