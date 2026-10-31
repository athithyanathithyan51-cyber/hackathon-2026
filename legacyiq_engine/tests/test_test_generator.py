"""Tests for regression test suggestions generator."""
from legacyiq_engine.assessment.test_generator import generate_test_suggestions
from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceMatchResult,
    EvidenceStatus,
    RelationshipStatus,
)


def _penalty_candidate() -> BusinessRuleCandidate:
    return BusinessRuleCandidate(
        finding_id="BR-calculate_penalty-TEST",
        function_name="calculate_penalty",
        business_rule_description="Checks balance < 1000",
        observed_condition="balance < 1000",
        observed_behavior="If True returns 50; otherwise returns 0",
        source_file="banking_legacy.py",
        start_line=2,
        end_line=4,
        evidence_status=EvidenceStatus.OBSERVED_IN_CODE,
        uncertainty_explanation="AST behavior.",
        version=1,
        is_approved_policy=False,
    )


def test_generate_boundary_tests_for_penalty():
    candidate = _penalty_candidate()
    suite = generate_test_suggestions(candidate, evidence_matches=[])

    assert suite.finding_id == candidate.finding_id
    assert suite.function_name == "calculate_penalty"
    assert "NOT been executed" in suite.disclaimer

    suggestions = {s.boundary_type: s for s in suite.suggestions}
    assert "BOUNDARY_BELOW" in suggestions
    assert "BOUNDARY_EXACT" in suggestions
    assert "BOUNDARY_ABOVE" in suggestions

    # Balance 999: below boundary threshold
    below = suggestions["BOUNDARY_BELOW"]
    assert below.input_parameters == {"balance": 999}
    assert "50" in below.expected_code_behavior
    assert below.requires_human_validation is True

    # Balance 1000: exact boundary threshold
    exact = suggestions["BOUNDARY_EXACT"]
    assert exact.input_parameters == {"balance": 1000}
    assert "0" in exact.expected_code_behavior
    assert exact.requires_human_validation is True

    # Balance 1001: above boundary threshold
    above = suggestions["BOUNDARY_ABOVE"]
    assert above.input_parameters == {"balance": 1001}
    assert "0" in above.expected_code_behavior
    assert above.requires_human_validation is True


def test_generate_evidence_exemption_test_when_incident_present():
    candidate = _penalty_candidate()
    conflicted_match = EvidenceMatchResult(
        evidence_id="INC-101",
        finding_id=candidate.finding_id,
        relationship_status=RelationshipStatus.CONFLICTED,
        explanation="Customers with payment extensions should be exempt from minimum balance penalty.",
        source_reference="incident_101.txt",
        confidence_score=0.85,
        missing_conditions_detected=["exemption_for_payment_extension"],
    )

    suite = generate_test_suggestions(candidate, evidence_matches=[conflicted_match])

    # Should contain 3 boundary tests + 1 evidence-derived exception test
    assert len(suite.suggestions) == 4
    exemption_tests = [s for s in suite.suggestions if s.boundary_type == "EVIDENCE_EXCEPTION"]
    assert len(exemption_tests) == 1

    ex_test = exemption_tests[0]
    assert ex_test.test_id == "TEST-calculate_penalty-EXEMPTION-EXTENSION"
    assert ex_test.input_parameters["approved_payment_extension"] is True
    assert "Current code will charge 50" in ex_test.expected_code_behavior
    assert "INC-101" in ex_test.business_expectation_note
    assert ex_test.requires_human_validation is True
