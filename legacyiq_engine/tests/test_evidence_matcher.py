"""Tests for contextual evidence matching."""
from legacyiq_engine.intelligence.evidence_matcher import (
    match_evidence_to_rules,
    parse_evidence_text,
)
from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceStatus,
    RelationshipStatus,
)


def _penalty_candidate() -> BusinessRuleCandidate:
    return BusinessRuleCandidate(
        finding_id="BR-calculate_penalty-L2-ABCD1234",
        function_name="calculate_penalty",
        business_rule_description="Conditional check balance < 1000",
        observed_condition="balance < 1000",
        observed_behavior="If True returns 50; otherwise returns 0",
        source_file="banking_legacy.py",
        start_line=2,
        end_line=4,
        evidence_status=EvidenceStatus.OBSERVED_IN_CODE,
        uncertainty_explanation="Observable AST behavior.",
        version=1,
        is_approved_policy=False,
    )


def test_match_incident_101_conflicted_missing_exemption():
    incident_text = """Incident ID: INC-101

Customers with an approved payment extension should be exempt
from the minimum balance penalty.

The application appears to charge them incorrectly.
"""
    candidate = _penalty_candidate()
    matches = match_evidence_to_rules(
        incident_text, [candidate], source_reference="incident_101.txt"
    )

    assert len(matches) == 1
    match = matches[0]
    assert match.evidence_id == "INC-101"
    assert match.finding_id == candidate.finding_id
    assert match.relationship_status == RelationshipStatus.CONFLICTED
    assert "exemption_for_payment_extension" in match.missing_conditions_detected
    assert "not constitute approved business policy" in match.explanation.lower() or "not approved" in match.explanation.lower()
    assert match.confidence_score >= 0.70


def test_match_supported_business_spec():
    doc_text = """DOC-202: Approved Policy Specification

The standard minimum balance penalty is strictly $50 when balance is below $1000.
This is approved spec and expected behavior for standard retail accounts.
"""
    candidate = _penalty_candidate()
    matches = match_evidence_to_rules(doc_text, [candidate], source_reference="policy_spec.txt")

    assert len(matches) == 1
    match = matches[0]
    assert match.evidence_id == "DOC-202"
    assert match.relationship_status == RelationshipStatus.SUPPORTED
    assert "supports the observed code logic" in match.explanation


def test_match_uncertain_evidence():
    inquiry_text = """CR-303: Review Inquiry

We should review the balance penalty fee tiering next quarter.
No decision has been taken on exemptions or rate changes.
"""
    candidate = _penalty_candidate()
    matches = match_evidence_to_rules(inquiry_text, [candidate], source_reference="cr_303.txt")

    assert len(matches) == 1
    match = matches[0]
    assert match.relationship_status == RelationshipStatus.UNCERTAIN


def test_unrelated_evidence_returns_no_matches():
    unrelated_text = """INC-999: Database Connection Pool Exhausted

The PostgreSQL connection pool exceeded maximum connections during peak batch processing.
"""
    candidate = _penalty_candidate()
    matches = match_evidence_to_rules(unrelated_text, [candidate], source_reference="db_incident.txt")

    # Should not match penalty rule
    assert len(matches) == 0
