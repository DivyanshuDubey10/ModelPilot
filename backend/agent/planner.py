
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


_nemotron_available = True


def reset_planner_state():
    """Reset the Nemotron availability flag (useful for retries or tests)."""
    global _nemotron_available
    _nemotron_available = True


def recommend_experiment(history, objective="recall", min_precision=0.70):
    global _nemotron_available

    # Fast baseline start: for the very first experiment (iteration 0), start immediately
    # with a standard 100-tree baseline. This saves ~20s of remote LLM latency on empty history.
    if not history:
        return {
            "model_name": "random_forest",
            "n_estimators": 100,
            "reason": "Baseline benchmark: initialized with 100 trees before exploring parameter trade-offs.",
        }

    fallback = fallback_recommendation(history)

    if fallback["n_estimators"] is None:
        return fallback

    # If Nemotron failed previously in this session, skip calling it to prevent repeated timeouts
    if not _nemotron_available:
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
        cleaned = response.strip()

        # Handle markdown fences like ```json { ... } ```
        if "```" in cleaned:
            parts = cleaned.split("```")
            for part in parts:
                p = part.strip()
                if p.startswith("json"):
                    p = p[4:].strip()
                if p.startswith("{") and p.endswith("}"):
                    cleaned = p
                    break

        recommendation = json.loads(cleaned)

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
        print("Using Python fallback planner for this and remaining iterations.")
        _nemotron_available = False
        return fallback
