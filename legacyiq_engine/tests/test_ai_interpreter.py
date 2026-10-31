"""Tests for AI interpretation and fallback behavior."""
from unittest.mock import MagicMock, patch

from legacyiq_engine.intelligence.ai_interpreter import (
    DeterministicFallbackProvider,
    GroqAIProvider,
    interpret_rule_candidate,
)
from legacyiq_engine.models.schemas import (
    AIInterpretation,
    BusinessRuleCandidate,
    EvidenceStatus,
)


def _sample_candidate() -> BusinessRuleCandidate:
    return BusinessRuleCandidate(
        finding_id="BR-calculate_penalty-L2-TEST1234",
        function_name="calculate_penalty",
        business_rule_description="Checks balance < 1000",
        observed_condition="balance < 1000",
        observed_behavior="If True returns 50; otherwise returns 0",
        source_file="banking_legacy.py",
        start_line=2,
        end_line=4,
        evidence_status=EvidenceStatus.OBSERVED_IN_CODE,
        uncertainty_explanation="Observable code only.",
        version=1,
        is_approved_policy=False,
    )


def test_deterministic_fallback_provider():
    provider = DeterministicFallbackProvider()
    candidate = _sample_candidate()

    result = provider.interpret_rule(candidate, evidence_context="Customer dispute INC-101")

    assert isinstance(result, AIInterpretation)
    assert result.finding_id == candidate.finding_id
    assert result.is_fallback is True
    assert "penalty" in result.business_explanation.lower()
    assert len(result.questions_for_human_validation) >= 2
    assert "INC-101" in result.evidence_summary
    assert len(result.uncertainty_explanation) > 0


def test_groq_provider_fallback_when_no_key():
    # When api_key is None or empty, should seamlessly fall back
    provider = GroqAIProvider(api_key=None)
    candidate = _sample_candidate()

    result = provider.interpret_rule(candidate)
    assert result.is_fallback is True
    assert result.finding_id == candidate.finding_id


def test_groq_provider_mocked_success():
    candidate = _sample_candidate()
    mock_payload = {
        "business_explanation": "Implements an automated $50 penalty for balances below 1000.",
        "possible_business_significance": "Core revenue fee logic for minimum balance maintenance.",
        "evidence_summary": "Linked to incident INC-101.",
        "uncertainty_explanation": "Exemption logic appears absent in source.",
        "questions_for_human_validation": [
            "Are payment extensions intended to waive this fee?",
            "Who authorizes fee waivers?",
        ],
    }

    mock_client = MagicMock()
    mock_choice = MagicMock()
    import json
    mock_choice.message.content = json.dumps(mock_payload)
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    provider = GroqAIProvider(api_key="gsk_mock_test_key_12345")

    with patch("groq.Groq", return_value=mock_client):
        result = provider.interpret_rule(candidate, evidence_context="INC-101 details")

        assert isinstance(result, AIInterpretation)
        assert result.is_fallback is False
        assert result.business_explanation == mock_payload["business_explanation"]
        assert len(result.questions_for_human_validation) == 2
        assert "payment extensions" in result.questions_for_human_validation[0]


def test_groq_provider_graceful_recovery_on_api_error():
    candidate = _sample_candidate()

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RuntimeError("Groq API rate limit or outage")

    provider = GroqAIProvider(api_key="gsk_mock_test_key_12345")

    with patch("groq.Groq", return_value=mock_client):
        result = provider.interpret_rule(candidate)

        assert isinstance(result, AIInterpretation)
        # Never crashes; triggers fallback
        assert result.is_fallback is True
        assert "fallback" in result.model_used.lower() or "fallback" in result.uncertainty_explanation.lower()
