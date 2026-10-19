
from fastapi import FastAPI
from backend.api.routes import router

app = FastAPI(
    title="ModelPilot API",
    description="Autonomous ML experimentation and optimization",
    version="0.1.0",
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to ModelPilot",
        "docs": "/docs",
    }
