import json
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.report import build_report
from backend.sources import SourceError, fetch_cobol_from_github
from backend.store import history_for, load_project, save_project
from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.analyzer.cobol_analyzer import analyze_cobol
from legacyiq_engine.analyzer.rule_extractor import extract_rule_candidates
from legacyiq_engine.assessment.risk_assessor import assess_risk
from legacyiq_engine.assessment.test_generator import generate_test_suggestions
from legacyiq_engine.intelligence.ai_interpreter import interpret_rule_candidate
from legacyiq_engine.intelligence.evidence_matcher import match_evidence_to_rules
from legacyiq_engine.intelligence.reassessment import (
    initialize_finding_version,
    reassess_finding_with_evidence,
)
from legacyiq_engine.models.schemas import RelationshipStatus

app = FastAPI(title="LegacyIQ API")

# Allow the frontend (Nishanth) to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SourceFile(BaseModel):
    path: str
    content: str


class ProjectRequest(BaseModel):
    name: str
    files: list[SourceFile]


class EvidenceRequest(BaseModel):
    name: str
    content: str


class ImpactRequest(BaseModel):
    finding_id: str


def _project_or_404(project_id):
    project = load_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _finding_or_404(project, finding_id):
    if finding_id not in project["finding_ids"]:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding_id


def _latest(history, finding_id):
    version = history.get_latest_version(finding_id)
    if version is None:
        raise HTTPException(status_code=404, detail="Finding not found")
    return version


def _analyze(source):
    """Pick the analyzer by file extension. Returns None for files that are stored as evidence only.

    Copybooks (.cpy) and data files are not programs, so they are stored but not analyzed.
    """
    path = source.path.lower()
    if path.endswith(".py"):
        return analyze_source(source.content, file_path=source.path)
    if path.endswith((".cbl", ".cob")):
        return analyze_cobol(source.content, file_path=source.path)
    return None


def _risk_for(project, version):
    """Risk with live context: external calls from the project's dependency map."""
    key_prefix = version.finding.source_file
    calls = project["dependencies"].get(f"{key_prefix}:{version.finding.function_name}", [])
    known = {key.split(":")[-1] for key in project["dependencies"]}
    external = [call for call in calls if call.split(":")[-1] not in known]
    return assess_risk(version.finding, evidence_matches=version.evidence_matches, external_calls=external)


def _recommend(risk, matches):
    """Suggest an action. Always a suggestion for human review, never applied automatically."""
    if risk.risk_category.value == "CRITICAL" or any(
        m.relationship_status == RelationshipStatus.CONFLICTED for m in matches
    ):
        return "investigate"
    if risk.risk_category.value == "HIGH":
        return "refactor"
    return "retain"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/projects")
def create_project(request: ProjectRequest):
    project_id = uuid4().hex
    history = history_for(project_id)
    dependencies = {}
    finding_ids = []
    function_count = 0

    for source in request.files:
        result = _analyze(source)
        if result is None:
            continue
        if not result.syntax_valid:
            raise HTTPException(status_code=422, detail=result.error_message)

        function_count += len(result.functions)
        for name, calls in result.dependencies.items():
            dependencies[f"{source.path}:{name}"] = calls
        for candidate in extract_rule_candidates(result):
            initialize_finding_version(candidate, history_store=history)
            if candidate.finding_id not in finding_ids:
                finding_ids.append(candidate.finding_id)

    save_project(
        project_id,
        request.name,
        [source.model_dump() for source in request.files],
        dependencies,
        finding_ids,
    )
    return {
        "id": project_id,
        "name": request.name,
        "status": "done",
        "file_count": len(request.files),
        "function_count": function_count,
        "rule_count": len(finding_ids),
    }


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    project = _project_or_404(project_id)
    return {
        "id": project["id"],
        "name": project["name"],
        "file_count": len(project["files"]),
        "rule_count": len(project["finding_ids"]),
    }


@app.get("/api/projects/{project_id}/dependencies")
def get_dependencies(project_id: str):
    return _project_or_404(project_id)["dependencies"]


@app.post("/api/projects/{project_id}/evidence")
def add_evidence(project_id: str, request: EvidenceRequest):
    project = _project_or_404(project_id)
    history = history_for(project_id)
    candidates = [_latest(history, fid).finding for fid in project["finding_ids"]]

    matches = match_evidence_to_rules(request.content, candidates, source_reference=request.name)
    linked = []
    for match in matches:
        if match.relationship_status == RelationshipStatus.UNCERTAIN:
            continue
        reassessment = reassess_finding_with_evidence(
            finding_id=match.finding_id,
            evidence_text=request.content,
            source_reference=request.name,
            history_store=history,
        )
        linked.append({
            "finding_id": match.finding_id,
            "match": match.relationship_status.value,
            "new_version": reassessment.new_version if reassessment else None,
        })
    return {"evidence": request.name, "linked_findings": linked}


@app.get("/api/projects/{project_id}/findings")
def list_findings(project_id: str):
    project = _project_or_404(project_id)
    history = history_for(project_id)
    findings = []
    for fid in project["finding_ids"]:
        version = _latest(history, fid)
        risk = _risk_for(project, version)
        findings.append({
            "id": fid,
            "function": version.finding.function_name,
            "file": version.finding.source_file,
            "start_line": version.finding.start_line,
            "version": version.version,
            "description": version.finding.business_rule_description,
            "evidence_status": version.finding.evidence_status.value,
            "risk_score": risk.risk_score if risk else None,
            "risk_category": risk.risk_category.value if risk else None,
            "recommendation": _recommend(risk, version.evidence_matches) if risk else "investigate",
            "evidence": [
                {"source": m.source_reference, "match": m.relationship_status.value, "explanation": m.explanation}
                for m in version.evidence_matches
            ],
        })
    return findings


@app.get("/api/projects/{project_id}/findings/{finding_id}/history")
def finding_history(project_id: str, finding_id: str):
    project = _project_or_404(project_id)
    _finding_or_404(project, finding_id)
    history = history_for(project_id)
    return [
        {
            "version": v.version,
            "timestamp": v.timestamp,
            "change_reason": v.change_reason,
            "evidence_status": v.finding.evidence_status.value,
            "risk_score": v.risk_assessment.risk_score if v.risk_assessment else None,
            "risk_category": v.risk_assessment.risk_category.value if v.risk_assessment else None,
        }
        for v in history.get_history(finding_id)
    ]


@app.post("/api/projects/{project_id}/impact")
def impact(project_id: str, request: ImpactRequest):
    project = _project_or_404(project_id)
    _finding_or_404(project, request.finding_id)
    version = _latest(history_for(project_id), request.finding_id)

    candidate = version.finding
    matches = version.evidence_matches
    risk = _risk_for(project, version)
    tests = generate_test_suggestions(candidate, evidence_matches=matches)
    affected = [key for key, calls in project["dependencies"].items() if candidate.function_name in calls]

    return {
        "finding_id": request.finding_id,
        "risk_score": risk.risk_score,
        "risk_category": risk.risk_category.value,
        "risk_reasons": [factor.description for factor in risk.factors],
        "affected": affected,
        "regression_tests": [
            {
                "input": json.dumps(test.input_parameters),
                "expected": test.expected_code_behavior,
                "note": test.business_expectation_note,
            }
            for test in tests.suggestions
        ],
        "recommendation": _recommend(risk, matches),
    }


@app.get("/api/projects/{project_id}/overview")
def overview(project_id: str):
    project = _project_or_404(project_id)
    history = history_for(project_id)
    versions = [_latest(history, fid) for fid in project["finding_ids"]]
    return {
        "files_analyzed": len(project["files"]),
        "rule_candidates": len(versions),
        "risks": sum(
            1 for v in versions
            if _risk_for(project, v).risk_category.value in ("HIGH", "CRITICAL")
        ),
        "evidence_conflicts": sum(
            1 for v in versions
            if any(m.relationship_status == RelationshipStatus.CONFLICTED for m in v.evidence_matches)
        ),
    }


@app.post("/api/projects/{project_id}/plan")
def generate_plan(project_id: str):
    """Build a modernization plan from the findings. Suggestions only; nothing is changed."""
    project = _project_or_404(project_id)
    history = history_for(project_id)
    items = []
    for fid in project["finding_ids"]:
        version = _latest(history, fid)
        candidate = version.finding
        risk = _risk_for(project, version)
        interpretation = interpret_rule_candidate(candidate)
        items.append({
            "id": fid,
            "function": candidate.function_name,
            "file": candidate.source_file,
            "start_line": candidate.start_line,
            "condition": candidate.observed_condition,
            "risk_category": risk.risk_category.value,
            "risk_score": risk.risk_score,
            "blocked": any(f.factor_name == "External Command Execution" for f in risk.factors),
            "recommendation": _recommend(risk, version.evidence_matches),
            "interpretation": {
                "business_explanation": interpretation.business_explanation,
                "questions": interpretation.questions_for_human_validation,
                "model": interpretation.model_used,
                "is_fallback": interpretation.is_fallback,
            },
        })

    def where(item):
        return f"{item['function']} ({item['file']}:{item['start_line']})"

    phases = [
        {
            "name": "Stop and fix first",
            "actions": [
                f"{where(i)} runs an operating-system command. Replace it with an explicit, tested service call."
                for i in items if i["blocked"]
            ],
        },
        {
            "name": "Phase 1: validate and characterize",
            "actions": [
                f"Get business sign-off on {where(i)}, then write golden-master tests for its boundary values."
                for i in items if i["recommendation"] == "investigate" and not i["blocked"]
            ],
        },
        {
            "name": "Phase 2: refactor with tests",
            "actions": [
                f"Refactor {where(i)} only after its tests pass on the current system."
                for i in items if i["recommendation"] == "refactor"
            ],
        },
        {
            "name": "Phase 3: migrate low-risk rules",
            "actions": [
                f"Migrate {where(i)} after Phase 1 tests are green."
                for i in items if i["recommendation"] == "retain"
            ],
        },
    ]
    return {
        "project_id": project_id,
        "summary": {
            "rules": len(items),
            "blocked": sum(1 for i in items if i["blocked"]),
            "investigate": sum(1 for i in items if i["recommendation"] == "investigate"),
        },
        "phases": phases,
        "findings": items,
    }


class GitHubSourceRequest(BaseModel):
    url: str


@app.post("/api/sources/github")
def fetch_github_source(request: GitHubSourceRequest):
    """Fetch and validate one COBOL file from a GitHub link. Returns its info and source text."""
    try:
        return fetch_cobol_from_github(request.url)
    except SourceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail)


@app.get("/api/projects/{project_id}/report")
def get_report(project_id: str):
    project = _project_or_404(project_id)
    plan = generate_plan(project_id)
    history = history_for(project_id)
    return build_report(project, plan, lambda version: _risk_for(project, version), history)
