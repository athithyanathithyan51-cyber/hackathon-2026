from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import app

SAMPLES = Path(__file__).resolve().parent.parent / "legacyiq_engine" / "samples"
BANKING = (SAMPLES / "banking_legacy.py").read_text(encoding="utf8")
INCIDENT = (SAMPLES / "incident_101.txt").read_text(encoding="utf8")


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("LEGACYIQ_DATA_DIR", str(tmp_path))
    return TestClient(app)


def _create(client, files, name="banking"):
    return client.post("/api/projects", json={"name": name, "files": files})


def _banking_project(client):
    response = _create(client, [{"path": "banking_legacy.py", "content": BANKING}])
    assert response.status_code == 200
    return response.json()["id"]


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_upload_creates_rule_candidate_with_baseline_version(client):
    project_id = _banking_project(client)
    findings = client.get(f"/api/projects/{project_id}/findings").json()
    assert len(findings) == 1
    assert findings[0]["function"] == "calculate_penalty"
    assert findings[0]["start_line"] == 2
    assert findings[0]["version"] == 1
    assert findings[0]["evidence_status"] == "OBSERVED_IN_CODE"


def test_incident_reassesses_finding_and_keeps_history(client):
    project_id = _banking_project(client)
    finding_id = client.get(f"/api/projects/{project_id}/findings").json()[0]["id"]

    evidence = client.post(
        f"/api/projects/{project_id}/evidence",
        json={"name": "INC-101", "content": INCIDENT},
    )
    assert evidence.status_code == 200
    linked = evidence.json()["linked_findings"]
    assert linked[0]["finding_id"] == finding_id
    assert linked[0]["match"] == "CONFLICTED"
    assert linked[0]["new_version"] == 2

    updated = client.get(f"/api/projects/{project_id}/findings").json()[0]
    assert updated["evidence_status"] == "CONFLICTED_BY_EVIDENCE"
    assert updated["risk_category"] == "CRITICAL"
    assert updated["recommendation"] == "investigate"

    history = client.get(f"/api/projects/{project_id}/findings/{finding_id}/history").json()
    assert [v["version"] for v in history] == [1, 2]


def test_impact_returns_suggestions_and_regression_tests(client):
    project_id = _banking_project(client)
    finding_id = client.get(f"/api/projects/{project_id}/findings").json()[0]["id"]
    client.post(f"/api/projects/{project_id}/evidence", json={"name": "INC-101", "content": INCIDENT})

    impact = client.post(f"/api/projects/{project_id}/impact", json={"finding_id": finding_id})
    assert impact.status_code == 200
    body = impact.json()
    assert body["recommendation"] == "investigate"
    assert body["regression_tests"]
    assert isinstance(body["regression_tests"][0]["note"], str)


def test_overview_counts_conflicts(client):
    project_id = _banking_project(client)
    client.post(f"/api/projects/{project_id}/evidence", json={"name": "INC-101", "content": INCIDENT})
    overview = client.get(f"/api/projects/{project_id}/overview").json()
    assert overview["rule_candidates"] == 1
    assert overview["evidence_conflicts"] == 1


def test_projects_do_not_share_history(client):
    first = _banking_project(client)
    second = _banking_project(client)
    client.post(f"/api/projects/{first}/evidence", json={"name": "INC-101", "content": INCIDENT})

    finding_id = client.get(f"/api/projects/{second}/findings").json()[0]["id"]
    history = client.get(f"/api/projects/{second}/findings/{finding_id}/history").json()
    assert [v["version"] for v in history] == [1]


def test_syntax_error_returns_422_with_location(client):
    response = _create(client, [{"path": "bad.py", "content": "def broken(:\n"}])
    assert response.status_code == 422
    assert "line 1" in response.json()["detail"]


def test_non_python_files_are_stored_but_not_analyzed(client):
    response = _create(client, [{"path": "schema.sql", "content": "CREATE TABLE x (id int);"}])
    assert response.status_code == 200
    assert response.json()["rule_count"] == 0


def test_unknown_project_returns_404(client):
    assert client.get("/api/projects/does-not-exist").status_code == 404
    assert client.get("/api/projects/does-not-exist/overview").status_code == 404


COBOL_FEE = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. FEE-CALC.
       PROCEDURE DIVISION.
       MAIN-PARA.
           PERFORM CHECK-BALANCE
           STOP RUN.
       CHECK-BALANCE.
           IF WS-BALANCE < 1000
              DISPLAY 'Low balance'
           END-IF.
"""


def test_any_cobol_program_is_analyzed_without_project_specific_code(client):
    response = _create(client, [{"path": "any-system/fee.cbl", "content": COBOL_FEE}])
    assert response.status_code == 200
    project_id = response.json()["id"]
    findings = client.get(f"/api/projects/{project_id}/findings").json()
    assert len(findings) == 1
    assert findings[0]["function"] == "CHECK-BALANCE"
    assert findings[0]["file"] == "any-system/fee.cbl"
    assert findings[0]["start_line"] == 8


def test_copybook_is_stored_but_not_analyzed(client):
    response = _create(client, [{"path": "ACCOUNTS.CPY", "content": "       01 ACCOUNT-RECORD.\n"}])
    assert response.status_code == 200
    assert response.json()["rule_count"] == 0


def test_cobol_without_procedure_division_returns_422(client):
    response = _create(client, [{"path": "broken.cbl", "content": "       01 X PIC 9.\n"}])
    assert response.status_code == 422
    assert "PROCEDURE DIVISION" in response.json()["detail"]


COBOL_SHELL = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLEANUP.
       PROCEDURE DIVISION.
       MAIN-PARA.
           IF WS-BALANCE < 0
              CALL 'SYSTEM' USING WS-CMD
           END-IF.
"""


def test_shell_call_is_flagged_critical_and_blocks_plan(client):
    response = _create(client, [{"path": "cleanup.cbl", "content": COBOL_SHELL}])
    project_id = response.json()["id"]
    findings = client.get(f"/api/projects/{project_id}/findings").json()
    assert findings[0]["risk_category"] == "CRITICAL"

    plan = client.post(f"/api/projects/{project_id}/plan").json()
    assert plan["summary"]["blocked"] == 1
    assert plan["phases"][0]["name"] == "Stop and fix first"
    assert "CALL:SYSTEM" not in plan["phases"][0]["actions"][0]
    assert plan["findings"][0]["blocked"] is True


def test_plan_returns_phases_and_ai_interpretation(client):
    project_id = _banking_project(client)
    plan = client.post(f"/api/projects/{project_id}/plan").json()
    assert [p["name"] for p in plan["phases"]][:2] == ["Stop and fix first", "Phase 1: validate and characterize"]
    item = plan["findings"][0]
    assert "java_skeleton" not in item
    assert item["interpretation"]["model"]
