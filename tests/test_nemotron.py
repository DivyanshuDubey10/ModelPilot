
import os
import time
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Load configuration from environment variables.
API_KEY = os.getenv("NVIDIA_API_KEY")
BASE_URL = os.getenv("NVIDIA_BASE_URL")
MODEL = os.getenv("NVIDIA_MODEL")

if not API_KEY or not BASE_URL or not MODEL:
    raise SystemExit(
        "Set NVIDIA_API_KEY, NVIDIA_BASE_URL, and "
        "NVIDIA_MODEL before running this test."
    )

client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL,
)

# Optional: supply a text file containing the prompt.
prompt_file = Path("nemotron_test_prompt.txt")

if prompt_file.exists():
    prompt = prompt_file.read_text(encoding="utf-8")
else:
    prompt = (
        "You are the experiment planner for ModelPilot. "
        "Recommend a Random Forest experiment. "
        "Return a short explanation and a suggested n_estimators value."
    )

print(f"Testing model: {MODEL}")
start = time.perf_counter()

try:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a concise ML experiment planning assistant."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=300,
        temperature=0.2,
    )

    elapsed = time.perf_counter() - start
    content = response.choices[0].message.content

    print(f"\nResponse time: {elapsed:.2f} seconds")
    print(f"Finish reason: {response.choices[0].finish_reason}")

    if not isinstance(content, str) or not content.strip():
        print("FAIL: The model returned empty or non-text content.")
    else:
        print("\nSUCCESS: Model returned text.")
        print(content)

except Exception as exc:
    elapsed = time.perf_counter() - start
    print(f"\nFAILED after {elapsed:.2f} seconds")
    print(f"{type(exc).__name__}: {exc}")
