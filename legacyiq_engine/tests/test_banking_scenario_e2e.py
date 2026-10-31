"""End-to-end integration test for the full 9-step banking scenario."""
from pathlib import Path

from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.analyzer.rule_extractor import extract_rule_candidates
from legacyiq_engine.intelligence.evidence_matcher import match_evidence_to_rules
from legacyiq_engine.intelligence.reassessment import (
    initialize_finding_version,
    reassess_finding_with_evidence,
)
from legacyiq_engine.models.schemas import EvidenceStatus, RelationshipStatus, RiskCategory
from legacyiq_engine.storage.history_store import HistoryStore


def test_complete_banking_scenario_e2e(tmp_path):
    samples_dir = Path(__file__).resolve().parent.parent / "samples"
    code_path = samples_dir / "banking_legacy.py"
    incident_path = samples_dir / "incident_101.txt"

    code_content = code_path.read_text(encoding="utf-8")
    incident_content = incident_path.read_text(encoding="utf-8")

    db_path = tmp_path / "e2e_history.db"
    store = HistoryStore(db_path=str(db_path))

    # Step 1: Initial code analysis
    ast_result = analyze_source(code_content, file_path="banking_legacy.py")
    assert ast_result.syntax_valid is True
    assert len(ast_result.functions) == 1
    func = ast_result.functions[0]
    assert func.name == "calculate_penalty"
    assert func.conditions[0].condition_text == "balance < 1000"

    # Step 2: Rule candidate extraction & baseline storage
    candidates = extract_rule_candidates(ast_result)
    assert len(candidates) == 1
    candidate = candidates[0]
    assert candidate.is_approved_policy is False
    assert candidate.evidence_status == EvidenceStatus.OBSERVED_IN_CODE

    v1 = initialize_finding_version(candidate, history_store=store)
    assert v1.version == 1

    # Step 3 & 4: Upload incident & match contextually
    matches = match_evidence_to_rules(incident_content, [candidate], source_reference="incident_101.txt")
    assert len(matches) == 1
    match = matches[0]
    assert match.evidence_id == "INC-101"
    assert match.relationship_status == RelationshipStatus.CONFLICTED

    # Step 5: Detect missing condition
    assert "exemption_for_payment_extension" in match.missing_conditions_detected

    # Step 6 & 7: Reassessment, uncertainty update, and risk escalation
    reassessment = reassess_finding_with_evidence(
        finding_id=candidate.finding_id,
        evidence_text=incident_content,
        source_reference="incident_101.txt",
        history_store=store,
    )
    assert reassessment is not None
    assert reassessment.previous_version == 1
    assert reassessment.new_version == 2
    assert reassessment.updated_finding.evidence_status == EvidenceStatus.CONFLICTED_BY_EVIDENCE
    assert reassessment.updated_risk.risk_category == RiskCategory.CRITICAL
    assert reassessment.updated_risk.risk_score >= 80.0

    # Step 8: Preserve original finding version
    history = store.get_history(candidate.finding_id)
    assert len(history) == 2
    assert history[0].version == 1
    assert history[0].finding.evidence_status == EvidenceStatus.OBSERVED_IN_CODE
    assert history[1].version == 2
    assert history[1].finding.evidence_status == EvidenceStatus.CONFLICTED_BY_EVIDENCE

    # Step 9: Regression test suggestions
    tests = reassessment.updated_tests.suggestions
    test_params = [t.input_parameters for t in tests]
    assert {"balance": 999} in test_params
    assert {"balance": 1000} in test_params
    assert {"balance": 1001} in test_params
    assert {"balance": 500, "approved_payment_extension": True} in test_params
