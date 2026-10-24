import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router

app = FastAPI(
    title="ModelPilot API",
    description="Autonomous ML experimentation and optimization",
    version="0.1.0",
)

# Configurable CORS origins for deployment and local development
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()

allow_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://model-pilot-iota.vercel.app",
]

if cors_origins_env and cors_origins_env != "*":
    for origin in cors_origins_env.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in allow_origins:
            allow_origins.append(cleaned)

# Regex to match any Vercel deployment (preview branches and production)
# e.g., https://model-pilot-iota.vercel.app, https://*-divyanshudubey10s-projects.vercel.app
allow_origin_regex = (
    r".*" if cors_origins_env == "*"
    else r"^https:\/\/.*\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to ModelPilot",
        "docs": "/docs",
    }
