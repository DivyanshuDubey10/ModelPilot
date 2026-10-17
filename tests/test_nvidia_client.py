
from backend.agent.nvidia_client import ask_nemotron

answer = ask_nemotron(
    "For fraud classification, we want to maximize recall "
    "while keeping precision at or above 0.70. "
    "Briefly explain what this objective means."
)

print(answer)
