
import json

from fastapi.testclient import TestClient

from backend.main import app
from backend.database import history_store


client = TestClient(app)


def test_save_and_load_optimization_run(tmp_path, monkeypatch):
    monkeypatch.setattr(
        history_store,
        "RUNS_DIR",
        tmp_path,
    )

    run_id = "test-run-123"
    metadata = {
        "dataset_path": "test.csv",
        "target": "label",
        "objective": "recall",
        "min_precision": 0.7,
        "max_experiments": 1,
    }
    experiments = [
        {
            "model_name": "random_forest",
            "n_estimators": 50,
            "metrics": {
                "accuracy": 0.9,
                "precision": 0.8,
                "recall": 0.75,
                "f1": 0.77,
            },
        }
    ]

    history_store.save_optimization_run(
        run_id,
        metadata,
        experiments,
    )

    loaded = history_store.load_optimization_run(run_id)

    assert loaded["run_id"] == run_id
    assert loaded["metadata"] == metadata
    assert loaded["experiments"] == experiments
    assert "created_at" in loaded


def test_get_existing_optimization_run(tmp_path, monkeypatch):
    monkeypatch.setattr(
        history_store,
        "RUNS_DIR",
        tmp_path,
    )

    run_id = "test-run-456"

    history_store.save_optimization_run(
        run_id,
        {"target": "label"},
        [],
    )

    response = client.get(f"/api/optimize/{run_id}")

    assert response.status_code == 200
    assert response.json()["run_id"] == run_id


def test_get_missing_optimization_run():
    response = client.get(
        "/api/optimize/00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Optimization run not found."
