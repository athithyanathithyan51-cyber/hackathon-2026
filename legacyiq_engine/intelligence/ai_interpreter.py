"""AI interpretation module for LegacyIQ.

Strict Rules:
1. Static analysis states facts, AI explains them.
2. AI never replaces or contradicts verified AST line numbers or conditions.
3. Uses Groq when configured via environment variable `GROQ_API_KEY`.
4. Validates all outputs using Pydantic v2 schemas.
5. Provides deterministic fallback behavior when API is offline or unconfigured.
6. Never fabricates successful external API calls.
"""
from __future__ import annotations

import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Optional

from legacyiq_engine.config import GROQ_API_KEY, GROQ_MODEL, GROQ_TIMEOUT_SECONDS
from legacyiq_engine.models.schemas import AIInterpretation, BusinessRuleCandidate

logger = logging.getLogger(__name__)


class BaseAIProvider(ABC):
    """Abstract base class for AI interpretation providers."""

    @abstractmethod
    def interpret_rule(
        self,
        candidate: BusinessRuleCandidate,
        evidence_context: Optional[str] = None,
    ) -> AIInterpretation:
        """Interpret a business rule candidate and return a validated AIInterpretation."""
        pass


class DeterministicFallbackProvider(BaseAIProvider):
    """Deterministic, offline rule interpreter.

    Provides explainability, business context hypotheses, and human validation
    questions without requiring an external network connection or API credentials.
    """

    def interpret_rule(
        self,
        candidate: BusinessRuleCandidate,
        evidence_context: Optional[str] = None,
    ) -> AIInterpretation:
        func = candidate.function_name
        cond = candidate.observed_condition

        # Identify condition characteristics
        is_threshold = any(op in cond for op in ["<", "<=", ">", ">="])

        if "penalty" in func.lower() or "fee" in func.lower():
            business_explanation = (
                f"Function `{func}` applies a penalty or fee condition: `{cond}`. "
                f"Observable code outcome: {candidate.observed_behavior}"
            )
            significance = (
                "Automates monetary fee/penalty assessment based on balance or transaction criteria. "
                "Such legacy rules often lack soft-delete, temporary waivers, or dynamic rate configurations."
            )
        elif is_threshold:
            business_explanation = (
                f"Function `{func}` enforces a boundary threshold check `{cond}`. "
                f"Observable code outcome: {candidate.observed_behavior}"
            )
            significance = (
                "Serves as a gatekeeping condition determining tiered processing or eligibility."
            )
        else:
            business_explanation = (
                f"Function `{func}` implements logic for `{cond}`. "
                f"Observable code outcome: {candidate.observed_behavior}"
            )
            significance = "Internal operational logic observed in legacy source."

        if evidence_context:
            ev_summary = f"External evidence provided: {evidence_context[:300]}"
            if len(evidence_context) > 300:
                ev_summary += "..."
        else:
            ev_summary = "No external incident or policy evidence correlated yet."

        uncertainty = (
            "Code AST confirms the exact branch and return values, but does not capture "
            "business intent, undocumented exemptions (such as extension waivers), or regulatory changes."
        )

        questions = [
            f"Are there authorized business exemptions where `{cond}` should not trigger the default behavior?",
            f"Is the threshold in `{cond}` still accurate according to current business specifications?",
            "Should edge-case values (such as boundary equality or negative amounts) be handled differently?",
        ]

        return AIInterpretation(
            finding_id=candidate.finding_id,
            business_explanation=business_explanation,
            possible_business_significance=significance,
            evidence_summary=ev_summary,
            uncertainty_explanation=uncertainty,
            questions_for_human_validation=questions,
            model_used="deterministic-fallback-rules",
            is_fallback=True,
        )


class GroqAIProvider(BaseAIProvider):
    """Groq API provider for LLM-assisted interpretation with Pydantic validation."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: int = GROQ_TIMEOUT_SECONDS,
    ):
        self.api_key = api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        self.model = model or GROQ_MODEL or "llama-3.3-70b-versatile"
        self.timeout = timeout
        self.fallback = DeterministicFallbackProvider()

    def interpret_rule(
        self,
        candidate: BusinessRuleCandidate,
        evidence_context: Optional[str] = None,
    ) -> AIInterpretation:
        if not self.api_key:
            logger.info("GROQ_API_KEY not configured. Using deterministic fallback interpreter.")
            return self.fallback.interpret_rule(candidate, evidence_context)

        try:
            from groq import Groq

            client = Groq(api_key=self.api_key, timeout=self.timeout)

            system_prompt = (
                "You are LegacyIQ's modernization AI assistant.\n"
                "Strict rule: Static analysis states facts; AI explains them. You must never invent line numbers "
                "or contradict verified code facts.\n"
                "Respond ONLY with a valid JSON object matching this schema:\n"
                "{\n"
                '  "business_explanation": str,\n'
                '  "possible_business_significance": str,\n'
                '  "evidence_summary": str,\n'
                '  "uncertainty_explanation": str,\n'
                '  "questions_for_human_validation": list[str]\n'
                "}"
            )

            user_prompt = (
                f"Candidate Finding ID: {candidate.finding_id}\n"
                f"Function: {candidate.function_name}\n"
                f"Source File: {candidate.source_file} (lines {candidate.start_line}-{candidate.end_line})\n"
                f"Observed Condition: {candidate.observed_condition}\n"
                f"Observed Behavior: {candidate.observed_behavior}\n"
                f"Associated Evidence Context: {evidence_context or 'None'}\n\n"
                "Explain the business meaning, assess potential risks, note what is uncertain, "
                "and ask 2-4 clarifying questions for human business analysts."
            )

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )

            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)

            return AIInterpretation(
                finding_id=candidate.finding_id,
                business_explanation=parsed.get(
                    "business_explanation", candidate.observed_behavior
                ),
                possible_business_significance=parsed.get(
                    "possible_business_significance", "Modernization candidate."
                ),
                evidence_summary=parsed.get(
                    "evidence_summary", evidence_context or "No evidence attached."
                ),
                uncertainty_explanation=parsed.get(
                    "uncertainty_explanation", candidate.uncertainty_explanation
                ),
                questions_for_human_validation=parsed.get(
                    "questions_for_human_validation", []
                ),
                model_used=self.model,
                is_fallback=False,
            )
        except Exception as exc:
            logger.warning("Groq API call failed (%s). Falling back to deterministic engine.", exc)
            fallback_result = self.fallback.interpret_rule(candidate, evidence_context)
            fallback_result.uncertainty_explanation += f" (Note: Groq provider fallback triggered: {str(exc)[:100]})"
            return fallback_result


def get_ai_interpreter(
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> BaseAIProvider:
    """Factory to get the appropriate AI interpretation provider."""
    key = api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if key:
        return GroqAIProvider(api_key=key, model=model)
    return DeterministicFallbackProvider()


def interpret_rule_candidate(
    candidate: BusinessRuleCandidate,
    evidence_context: Optional[str] = None,
    provider: Optional[BaseAIProvider] = None,
) -> AIInterpretation:
    """Convenience entry point for interpreting a business rule candidate."""
    active_provider = provider or get_ai_interpreter()
    return active_provider.interpret_rule(candidate, evidence_context=evidence_context)
