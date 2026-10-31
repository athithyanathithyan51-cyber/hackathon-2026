import pytest
from fastapi.testclient import TestClient

from backend import sources
from backend.main import app

# Generic COBOL written for these tests. Not taken from any project.
PROGRAM = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. LEDGER.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-TOTAL     PIC S9(9)V99 COMP-3.
       PROCEDURE DIVISION.
       MAIN-PARA.
           IF WS-TOTAL < 1000
              GO TO LOW-PARA
           END-IF
           CALL 'SYSTEM' USING WS-TOTAL
           STOP RUN.
       LOW-PARA.
           STOP RUN.
"""

COPY_OTHER = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. AUDIT.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-TOTAL     PIC 9(9)V99.
       PROCEDURE DIVISION.
       AUDIT-PARA.
           STOP RUN.
"""


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("LEGACYIQ_DATA_DIR", str(tmp_path))
    return TestClient(app)


def _project(client):
    response = client.post("/api/projects", json={
        "name": "ledger",
        "files": [
            {"path": "ledger.cbl", "content": PROGRAM},
            {"path": "audit.cbl", "content": COPY_OTHER},
        ],
    })
    assert response.status_code == 200
    return response.json()["id"]


def test_report_has_all_sections(client):
    project_id = _project(client)
    report = client.get(f"/api/projects/{project_id}/report").json()
    assert set(report) == {"source", "analysis", "verification", "assessment", "recommendations", "migration_phases"}
    assert {s["file"] for s in report["source"]} == {"ledger.cbl", "audit.cbl"}
    assert report["analysis"]["programs"][0]["name"] == "LEDGER"
    assert report["assessment"]["target"].startswith("Java 21 + Spring Boot")


def test_report_flags_unsupported_constructs_and_inconsistencies(client):
    report = client.get(f"/api/projects/{_project(client)}/report").json()
    assert any(u["construct"] == "GO TO" and u["file"] == "ledger.cbl" for u in report["verification"]["unsupported"])
    assert [i["item"] for i in report["verification"]["inconsistencies"]] == ["WS-TOTAL"]


def test_report_risk_and_advice_are_source_grounded(client):
    report = client.get(f"/api/projects/{_project(client)}/report").json()
    shell = [r for r in report["assessment"]["risks"] if r["blocked"]]
    assert shell and shell[0]["risk_category"] == "CRITICAL"
    assert any("operating-system call" in advice for advice in report["recommendations"])
    assert all(rule["validated"] is False for rule in report["verification"]["rules"])


def test_github_link_must_be_a_file_on_github(client):
    response = client.post("/api/sources/github", json={"url": "https://example.com/a/b/blob/main/x.cbl"})
    assert response.status_code == 422


def test_github_link_must_be_a_cobol_file(client):
    response = client.post("/api/sources/github", json={"url": "https://github.com/a/b/blob/main/readme.md"})
    assert response.status_code == 422
    assert "Unsupported file type" in response.json()["detail"]


def test_github_fetch_returns_validated_source(client, monkeypatch):
    monkeypatch.setattr(sources, "fetch_bytes", lambda url: PROGRAM.encode("utf-8"))
    response = client.post("/api/sources/github", json={"url": "https://github.com/a/b/blob/main/src/LEDGER.CBL"})
    assert response.status_code == 200
    body = response.json()
    assert body["file_name"] == "LEDGER.CBL"
    assert body["extension"] == ".cbl"
    assert body["line_count"] == PROGRAM.count("\n")


def test_github_binary_file_is_rejected(client, monkeypatch):
    monkeypatch.setattr(sources, "fetch_bytes", lambda url: b"\x00\x01binary")
    response = client.post("/api/sources/github", json={"url": "https://github.com/a/b/blob/main/x.cbl"})
    assert response.status_code == 422
