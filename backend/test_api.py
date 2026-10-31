import pytest
from fastapi.testclient import TestClient

from main import app

PENALTY = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("LEGACYIQ_DB", str(tmp_path / "test.db"))
    return TestClient(app)


def _create(client, files):
    return client.post("/api/projects", json={"name": "banking", "files": files})


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_upload_returns_rules_with_file_and_line(client):
    response = _create(client, [{"path": "billing.py", "content": PENALTY}])
    assert response.status_code == 200
    body = response.json()
    assert body["rule_count"] == 1
    rules = client.get(f"/api/projects/{body['id']}/rules").json()
    assert rules[0]["file"] == "billing.py"
    assert rules[0]["line"] == 2


def test_syntax_error_returns_422_with_location(client):
    response = _create(client, [{"path": "bad.py", "content": "def broken(:\n"}])
    assert response.status_code == 422
    assert "bad.py line 1" in response.json()["detail"]


def test_non_python_files_are_stored_but_not_analyzed(client):
    response = _create(client, [{"path": "schema.sql", "content": "CREATE TABLE x (id int);"}])
    assert response.status_code == 200
    assert response.json()["rule_count"] == 0


def test_unknown_project_returns_404(client):
    assert client.get("/api/projects/does-not-exist").status_code == 404
