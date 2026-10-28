
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def get_nvidia_client():
    api_key = os.getenv("NVIDIA_API_KEY")

    if not api_key:
        raise ValueError(
            "NVIDIA_API_KEY is missing. Add it to your .env file."
        )

    return OpenAI(
        base_url=os.getenv(
            "NVIDIA_BASE_URL",
            "https://integrate.api.nvidia.com/v1",
        ),
        api_key=api_key,
        timeout=5.0,
    )


def ask_nemotron(prompt):
    client = get_nvidia_client()

    response = client.chat.completions.create(
        model=os.getenv(
            "NVIDIA_MODEL",
            "nvidia/nemotron-3.5-super-vl-120b-a12b",
        ),
        messages=[
            {
                "role": "system",
                "content": (
                    "You are ModelPilot, an ML experimentation assistant. "
                    "Give concise, practical recommendations."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=128,
        stream=False,
    )

    return response.choices[0].message.content
