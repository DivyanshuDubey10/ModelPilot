
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router

app = FastAPI(
    title="ModelPilot API",
    description="Autonomous ML experimentation and optimization",
    version="0.1.0",
)

import os

# Configurable CORS origins for deployment and local development
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env == "*":
    allow_origins = ["*"]
else:
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    if cors_origins_env:
        allow_origins.extend([o.strip() for o in cors_origins_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
