import os
import pytest
from backend.agent.nvidia_client import ask_nemotron


def test_nvidia_client():
    if not os.getenv("NVIDIA_API_KEY"):
        pytest.skip("NVIDIA_API_KEY is missing. Skipping live NVIDIA API call.")

    answer = ask_nemotron(
        "For fraud classification, we want to maximize recall "
        "while keeping precision at or above 0.70. "
        "Briefly explain what this objective means."
    )
    assert answer is not None
    print(answer)


if __name__ == "__main__":
    if os.getenv("NVIDIA_API_KEY"):
        test_nvidia_client()
    else:
        print("NVIDIA_API_KEY is missing. Set it in .env to run this test.")
