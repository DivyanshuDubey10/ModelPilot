from backend.main import app
from starlette.testclient import TestClient
import io

client = TestClient(app)


def test_cors_preflight_production():
    """Verify production Vercel frontend is accepted in CORS preflight."""
    res = client.options(
        "/api/optimize",
        headers={
            "Origin": "https://model-pilot-iota.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://model-pilot-iota.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_preflight_preview_branch():
    """Verify any Vercel preview branch is accepted via regex."""
    res = client.options(
        "/api/optimize",
        headers={
            "Origin": "https://model-pilot-git-fix-divyanshudubey10s-projects.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://model-pilot-git-fix-divyanshudubey10s-projects.vercel.app"


def test_health_check():
    """Verify /api/health returns healthy status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_runs_list():
    """Verify /api/runs returns a list of run summaries."""
    res = client.get("/api/runs")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_run_by_id_routes():
    """Verify /api/optimize/{run_id} and /api/runs/{run_id} both work."""
    runs = client.get("/api/runs").json()
    if runs:
        run_id = runs[0]["run_id"]
        res_opt = client.get(f"/api/optimize/{run_id}")
        res_runs = client.get(f"/api/runs/{run_id}")
        assert res_opt.status_code == 200
        assert res_runs.status_code == 200
        assert res_opt.json() == res_runs.json()


def test_upload_endpoint():
    """Verify /api/upload accepts a CSV file and profiles it."""
    import os
    csv_content = b"col_a,col_b,target\n1,2,0\n3,4,1\n5,6,0\n7,8,1\n"
    file = io.BytesIO(csv_content)
    res = client.post(
        "/api/upload",
        files={"file": ("test_upload_temp.csv", file, "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert "dataset_path" in data
    assert data["rows"] == 4
    assert data["columns"] == 3
    assert "target" in data["column_names"]
    if os.path.exists(data["dataset_path"]):
        os.remove(data["dataset_path"])
