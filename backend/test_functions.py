import pytest
from fastapi.testclient import TestClient

from backend.main import app

PROGRAM = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. LEDGER.
       PROCEDURE DIVISION.
       MAIN-PARA.
           PERFORM CHECK-BALANCE
           STOP RUN.
       CHECK-BALANCE.
           IF WS-BALANCE < 1000
              DISPLAY 'Low balance'
           END-IF.
"""


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("LEGACYIQ_DATA_DIR", str(tmp_path))
    return TestClient(app)


def test_functions_list_callers_and_callees(client):
    project_id = client.post("/api/projects", json={
        "name": "ledger", "files": [{"path": "ledger.cbl", "content": PROGRAM}],
    }).json()["id"]
    functions = client.get(f"/api/projects/{project_id}/functions").json()
    by_name = {f["function"]: f for f in functions}
    assert by_name["MAIN-PARA"]["calls"] == ["CHECK-BALANCE"]
    assert by_name["CHECK-BALANCE"]["called_by"] == ["ledger.cbl:MAIN-PARA"]
    assert by_name["CHECK-BALANCE"]["start_line"] == 7
    assert by_name["CHECK-BALANCE"]["conditions"] == 1


def test_functions_unknown_project_returns_404(client):
    assert client.get("/api/projects/nope/functions").status_code == 404
