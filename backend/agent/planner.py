
import json

from backend.agent.nvidia_client import ask_nemotron

ALLOWED_TREES = [50, 100, 200, 300, 500]


def fallback_recommendation(history):
    tested = {item["n_estimators"] for item in history}
    remaining = [n for n in ALLOWED_TREES if n not in tested]

    if not remaining:
        return {
            "n_estimators": None,
            "reason": "All configurations have been tested.",
        }

    eligible = [
        item for item in history
        if item["metrics"]["precision"] >= 0.70
    ]

    if eligible:
        best = max(
            eligible,
            key=lambda item: item["metrics"]["recall"],
        )
        better = [
            n for n in remaining
            if n > best["n_estimators"]
        ]
        if better:
            next_trees = min(better)
        else:
            next_trees = remaining[0]
    else:
        next_trees = remaining[0]

    return {
        "model_name": "random_forest",
        "n_estimators": next_trees,
        "reason": "Python fallback selected an untested configuration.",
    }


def recommend_experiment(history, objective="recall", min_precision=0.70):
    fallback = fallback_recommendation(history)

    if fallback["n_estimators"] is None:
        return fallback

    prompt = f"""
You are ModelPilot's ML experiment planner.

Objective: maximize {objective}.
Constraint: precision >= {min_precision}.

Experiment history:
{json.dumps(history, indent=2)}

Available tree counts: {ALLOWED_TREES}

Choose one untested tree count. Return ONLY valid JSON:
{{
  "model_name": "random_forest",
  "n_estimators": 200,
  "reason": "Brief explanation"
}}
"""

    try:
        response = ask_nemotron(prompt)
        recommendation = json.loads(response)

        trees = recommendation.get("n_estimators")

        if (
            recommendation.get("model_name") != "random_forest"
            or trees not in ALLOWED_TREES
            or trees in {item["n_estimators"] for item in history}
        ):
            raise ValueError("Invalid or previously tested recommendation.")

        recommendation["reason"] = str(
            recommendation.get("reason", "No reason provided.")
        )
        return recommendation

    except Exception as exc:
        print(f"Nemotron unavailable or returned an invalid response: {exc}")
        print("Using Python fallback planner.")
        return fallback
