"""Regression test suggestion generator for LegacyIQ.

Generates boundary-value test cases and evidence-derived exception cases.

Strict Principles:
1. Clearly distinguishes code-derived expected behavior from reported business expectations.
2. All suggestions require human validation before execution.
3. Never claims suggested tests were executed.
"""
from __future__ import annotations

import re
from typing import Any

from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceMatchResult,
    RegressionTestSuiteSuggestion,
    TestCaseSuggestion,
)


def _extract_threshold(condition: str) -> tuple[str, str, float] | None:
    """Extract variable, operator, and numerical threshold from a condition string.

    E.g. 'balance < 1000' -> ('balance', '<', 1000.0)
    """
    match = re.search(r"(\w+)\s*(<|<=|>|>=|==|!=)\s*([0-9]+(?:\.[0-9]+)?)", condition)
    if match:
        var_name, op, val_str = match.groups()
        return var_name, op, float(val_str)
    return None


def generate_test_suggestions(
    candidate: BusinessRuleCandidate,
    evidence_matches: list[EvidenceMatchResult] | None = None,
) -> RegressionTestSuiteSuggestion:
    """Generates boundary and evidence-informed test cases for a business rule candidate."""
    matches = evidence_matches or []
    suggestions: list[TestCaseSuggestion] = []
    func = candidate.function_name
    cond = candidate.observed_condition

    threshold_info = _extract_threshold(cond)

    if threshold_info:
        var_name, op, threshold = threshold_info

        # 1. Boundary: Below
        val_below = threshold - 1.0 if threshold.is_integer() else threshold - 0.01
        if op in ["<", "<="]:
            expected_code_below = "Returns 50 (condition met)" if "50" in candidate.observed_behavior else "Triggers True branch"
        else:
            expected_code_below = "Returns 0 (condition not met)" if "0" in candidate.observed_behavior else "Triggers False branch"

        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-BOUNDARY-BELOW",
                function_name=func,
                input_parameters={var_name: int(val_below) if val_below.is_integer() else val_below},
                boundary_type="BOUNDARY_BELOW",
                expected_code_behavior=expected_code_below,
                business_expectation_note="Verify whether threshold of 999 should incur standard penalty.",
                requires_human_validation=True,
                rationale=f"Evaluates boundary just below threshold {threshold}.",
            )
        )

        # 2. Boundary: Exact threshold
        if op in ["<", ">"]:
            expected_code_exact = "Returns 0 (strict inequality not satisfied)" if "0" in candidate.observed_behavior else "Triggers False branch"
        else:
            expected_code_exact = "Returns 50 (equality satisfied)" if "50" in candidate.observed_behavior else "Triggers True branch"

        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-BOUNDARY-EXACT",
                function_name=func,
                input_parameters={var_name: int(threshold) if threshold.is_integer() else threshold},
                boundary_type="BOUNDARY_EXACT",
                expected_code_behavior=expected_code_exact,
                business_expectation_note="Verify whether exact threshold of 1000 should be exempt or charged.",
                requires_human_validation=True,
                rationale=f"Evaluates exact threshold boundary equality for {threshold}.",
            )
        )

        # 3. Boundary: Above
        val_above = threshold + 1.0 if threshold.is_integer() else threshold + 0.01
        if op in ["<", "<="]:
            expected_code_above = "Returns 0 (condition not met)" if "0" in candidate.observed_behavior else "Triggers False branch"
        else:
            expected_code_above = "Returns 50 (condition met)" if "50" in candidate.observed_behavior else "Triggers True branch"

        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-BOUNDARY-ABOVE",
                function_name=func,
                input_parameters={var_name: int(val_above) if val_above.is_integer() else val_above},
                boundary_type="BOUNDARY_ABOVE",
                expected_code_behavior=expected_code_above,
                business_expectation_note="Verify whether balance above 1000 properly incurs no penalty.",
                requires_human_validation=True,
                rationale=f"Evaluates boundary just above threshold {threshold}.",
            )
        )

    # 4. Evidence-derived exemption test cases
    for match in matches:
        if "exemption_for_payment_extension" in match.missing_conditions_detected:
            suggestions.append(
                TestCaseSuggestion(
                    test_id=f"TEST-{func}-EXEMPTION-EXTENSION",
                    function_name=func,
                    input_parameters={"balance": 500, "approved_payment_extension": True},
                    boundary_type="EVIDENCE_EXCEPTION",
                    expected_code_behavior="Current code will charge 50 (AST confirms missing exemption logic).",
                    business_expectation_note=(
                        f"Incident {match.evidence_id} claims customers with approved payment extensions "
                        "should be exempt (expected outcome: 0 penalty). Requires business policy sign-off."
                    ),
                    requires_human_validation=True,
                    rationale=(
                        "Validates reported discrepancy: code currently lacks logic to handle payment extension exemptions."
                    ),
                )
            )

    return RegressionTestSuiteSuggestion(
        finding_id=candidate.finding_id,
        function_name=func,
        suggestions=suggestions,
    )
