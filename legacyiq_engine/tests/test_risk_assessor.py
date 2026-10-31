"""Tests for transparent heuristic risk assessment."""
from legacyiq_engine.assessment.risk_assessor import assess_risk
from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceMatchResult,
    EvidenceStatus,
    RelationshipStatus,
    RiskCategory,
)


def _make_candidate(func_name: str, condition: str, behavior: str) -> BusinessRuleCandidate:
    return BusinessRuleCandidate(
        finding_id=f"BR-{func_name}-TEST",
        function_name=func_name,
        business_rule_description=f"Rule in {func_name}",
        observed_condition=condition,
        observed_behavior=behavior,
        source_file="banking.py",
        start_line=1,
        end_line=5,
        evidence_status=EvidenceStatus.OBSERVED_IN_CODE,
        uncertainty_explanation="AST observation only.",
        version=1,
        is_approved_policy=False,
    )


def test_baseline_risk_without_financial_or_incident():
    candidate = _make_candidate("format_display_name", "len(name) > 20", "Truncates name")
    risk = assess_risk(candidate, evidence_matches=[])

    assert risk.risk_category == RiskCategory.LOW
    assert risk.risk_score < 35.0
    assert "not represent a mathematically validated statistical probability" in risk.heuristic_disclaimer


def test_high_risk_for_unverified_financial_penalty():
    candidate = _make_candidate("calculate_penalty", "balance < 1000", "Returns 50")
    risk = assess_risk(candidate, evidence_matches=[])

    # Financial penalty + baseline maintenance
    assert risk.risk_category == RiskCategory.MEDIUM or risk.risk_category == RiskCategory.HIGH
    assert any(f.factor_name == "Direct Financial Impact" for f in risk.factors)


def test_critical_risk_when_conflicted_by_production_incident():
    candidate = _make_candidate("calculate_penalty", "balance < 1000", "Returns 50")
    conflicted_match = EvidenceMatchResult(
        evidence_id="INC-101",
        finding_id=candidate.finding_id,
        relationship_status=RelationshipStatus.CONFLICTED,
        explanation="Customers with payment extensions should be exempt.",
        source_reference="incident_101.txt",
        confidence_score=0.85,
        missing_conditions_detected=["exemption_for_payment_extension"],
    )

    risk = assess_risk(candidate, evidence_matches=[conflicted_match])

    assert risk.risk_category == RiskCategory.CRITICAL
    assert risk.risk_score >= 80.0
    assert any("Exemption Discrepancy" in f.factor_name for f in risk.factors)
    assert "CRITICAL" in risk.recommended_action


def test_risk_reduction_when_supported_by_verified_policy():
    candidate = _make_candidate("calculate_penalty", "balance < 1000", "Returns 50")
    supported_match = EvidenceMatchResult(
        evidence_id="DOC-POL-01",
        finding_id=candidate.finding_id,
        relationship_status=RelationshipStatus.SUPPORTED,
        explanation="Matches approved 2026 banking policy.",
        source_reference="policy_doc.txt",
        confidence_score=0.90,
    )

    risk = assess_risk(candidate, evidence_matches=[supported_match])
    # Baseline 20 + Financial 25 - Policy 15 = 30 (LOW/MEDIUM)
    assert risk.risk_score == 30.0
    assert any(f.factor_name == "Documented Policy Alignment" for f in risk.factors)
