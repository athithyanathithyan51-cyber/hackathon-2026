"""Builds the analysis report: source, analysis, verification, assessment and migration recommendations.

Recommendations only. Nothing is converted or changed.
"""
from legacyiq_engine.analyzer.cobol_profile import find_inconsistencies, profile_cobol

COBOL_EXTENSIONS = (".cbl", ".cob", ".cpy")
TARGET = "Java 21 + Spring Boot (recommendation only; no code is generated)"

UNSUPPORTED_ADVICE = {
    "GO TO": "Restructure the GO TO flow at {file}:{line} into explicit paragraphs before migration.",
    "ALTER": "Remove ALTER at {file}:{line}; replace it with explicit control flow.",
    "EXEC SQL": "Map the embedded SQL at {file}:{line} to a repository layer and verify its behaviour.",
    "REDEFINES": "Map the REDEFINES at {file}:{line} explicitly and check every overlapping use.",
}


def _finding_advice(item):
    name = item["function"]
    if item["blocked"]:
        return f"Remove or isolate the operating-system call in {name} before any migration; replace it with an explicit service."
    if item["recommendation"] == "investigate":
        return f"Confirm the business rule in {name} with its owner and add characterization tests before changing it."
    if item["recommendation"] == "refactor":
        return f"Refactor {name} into a Java 21 Spring Boot service method after its tests pass."
    return f"Keep the behaviour of {name}; migrate it as a service method with the same inputs and outputs."


def build_report(project, plan, risk_for, history):
    """project: stored project dict. plan: output of generate_plan. risk_for(version) -> RiskAssessment."""
    sources = [f for f in project["files"] if f["path"].lower().endswith(COBOL_EXTENSIONS)]
    profiles = [profile_cobol(f["path"], f["content"]) for f in sources]

    programs = [dict(program, file=p["file"]) for p in profiles for program in p["programs"]]
    variables = sum(len(p["variables"]) for p in profiles)
    unsupported = [u for p in profiles for u in p["unsupported"]]
    inconsistencies = find_inconsistencies(profiles)

    risks = []
    rules = []
    for item in plan["findings"]:
        version = history.get_latest_version(item["id"])
        risk = risk_for(version)
        risks.append({
            "function": item["function"],
            "file": item["file"],
            "start_line": item["start_line"],
            "risk_category": risk.risk_category.value,
            "risk_score": risk.risk_score,
            "blocked": item["blocked"],
            "reasons": [factor.description for factor in risk.factors],
        })
        rules.append({
            "id": item["id"],
            "function": item["function"],
            "source": f"{item['file']}:{item['start_line']}",
            "condition": item["condition"],
            "validated": False,
        })

    recommendations = [_finding_advice(item) for item in plan["findings"]]
    recommendations += [
        UNSUPPORTED_ADVICE.get(u["construct"], "Review {file}:{line} manually.").format(**u)
        for u in unsupported
    ]
    recommendations += [f"Reconcile the declarations of {i['item']}: {i['detail']}" for i in inconsistencies]

    return {
        "source": [{"file": f["path"], "lines": len(f["content"].splitlines())} for f in sources],
        "analysis": {
            "programs": programs,
            "paragraphs": sorted(project["dependencies"].keys()),
            "variables": variables,
            "dependencies": project["dependencies"],
        },
        "verification": {
            "rules": rules,
            "unsupported": unsupported,
            "inconsistencies": inconsistencies,
        },
        "assessment": {
            "summary": plan["summary"],
            "risks": risks,
            "target": TARGET,
        },
        "recommendations": recommendations,
        "migration_phases": plan["phases"],
    }
