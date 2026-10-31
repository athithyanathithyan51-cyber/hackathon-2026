"""Tests for adaptive reassessment and immutable history preservation."""
import pytest
from legacyiq_engine.analyzer.rule_extractor import extract_rules_from_source
from legacyiq_engine.intelligence.reassessment import (
    initialize_finding_version,
    reassess_finding_with_evidence,
)
from legacyiq_engine.models.schemas import EvidenceStatus, RiskCategory
from legacyiq_engine.storage.history_store import HistoryStore


@pytest.fixture
def temp_history_store(tmp_path):
    db_file = tmp_path / "test_history.db"
    return HistoryStore(db_path=str(db_file))


def test_reassessment_preserves_history_and_updates_version(temp_history_store):
    code = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""
    rules = extract_rules_from_source(code, file_path="banking_legacy.py")
    assert len(rules) == 1
    rule = rules[0]

    # 1. Baseline initialization (Version 1)
    v1 = initialize_finding_version(rule, history_store=temp_history_store)
    assert v1.version == 1
    assert v1.finding.evidence_status == EvidenceStatus.OBSERVED_IN_CODE
    assert v1.risk_assessment.risk_category in [RiskCategory.MEDIUM, RiskCategory.HIGH]

    # 2. Upload Incident 101 as new evidence
    incident_text = """Incident ID: INC-101

Customers with an approved payment extension should be exempt
from the minimum balance penalty.

The application appears to charge them incorrectly.
"""
    result = reassess_finding_with_evidence(
        finding_id=rule.finding_id,
        evidence_text=incident_text,
        source_reference="incident_101.txt",
        history_store=temp_history_store,
    )

    assert result is not None
    assert result.previous_version == 1
    assert result.new_version == 2
    assert result.updated_finding.evidence_status == EvidenceStatus.CONFLICTED_BY_EVIDENCE
    assert "INC-101" in result.reason_for_change

    # 3. Verify history preservation: BOTH versions exist immutably
    history = temp_history_store.get_history(rule.finding_id)
    assert len(history) == 2

    stored_v1 = history[0]
    stored_v2 = history[1]

    # Verify Version 1 was NEVER mutated or overwritten
    assert stored_v1.version == 1
    assert stored_v1.finding.evidence_status == EvidenceStatus.OBSERVED_IN_CODE
    assert stored_v1.change_reason == "Initial code AST baseline extraction"

    # Verify Version 2 has updated risk and detected conflict
    assert stored_v2.version == 2
    assert stored_v2.finding.evidence_status == EvidenceStatus.CONFLICTED_BY_EVIDENCE
    assert stored_v2.risk_assessment.risk_score > stored_v1.risk_assessment.risk_score
    assert stored_v2.risk_assessment.risk_category == RiskCategory.CRITICAL

    # Verify updated regression tests include the missing exemption scenario
    test_ids = [t.test_id for t in result.updated_tests.suggestions]
    assert "TEST-calculate_penalty-EXEMPTION-EXTENSION" in test_ids


def test_unrelated_evidence_does_not_mutate_history(temp_history_store):
    code = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""
    rules = extract_rules_from_source(code, file_path="banking_legacy.py")
    rule = rules[0]
    initialize_finding_version(rule, history_store=temp_history_store)

    unrelated = "INC-888: SSL certificate renewal failed on edge gateway."
    result = reassess_finding_with_evidence(
        finding_id=rule.finding_id,
        evidence_text=unrelated,
        history_store=temp_history_store,
    )

    assert result is None
    history = temp_history_store.get_history(rule.finding_id)
    # Only Version 1 remains
    assert len(history) == 1
