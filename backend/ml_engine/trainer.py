
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier


def train_model(
    X, y, preprocessor,
    model_name="logistic_regression",
    n_estimators=100,
):
    class_counts = y.value_counts(dropna=False)

    if len(class_counts) < 2:
        raise ValueError(
            "Classification requires at least two target classes."
        )

    # Stratification requires at least two samples per class.
    use_stratify = (
        len(class_counts) >= 2
        and class_counts.min() >= 2
        and int(len(y) * 0.2) >= len(class_counts)
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if use_stratify else None,
    )

    if model_name == "random_forest":
        classifier = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=42,
            n_jobs=-1,
        )
    else:
        classifier = LogisticRegression(max_iter=1000)

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    return model, y_test, predictions
