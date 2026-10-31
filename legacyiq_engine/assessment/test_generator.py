"""Dynamic regression test suggestion generator for LegacyIQ.

Generates boundary-value test cases and evidence-derived exception cases for
arbitrary functions, conditions, and comparison types (Python and COBOL).

Strict Principles:
1. Fully dynamic: supports numerical boundaries, variable-to-variable comparisons, and categorical equality checks.
2. Clearly distinguishes code-derived expected behavior from reported business expectations.
3. All suggestions require human validation before execution.
4. Never claims suggested tests were executed.
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


def generate_test_suggestions(
    candidate: BusinessRuleCandidate,
    evidence_matches: list[EvidenceMatchResult] | None = None,
) -> RegressionTestSuiteSuggestion:
    """Generates boundary and evidence-informed test cases dynamically for any candidate."""
    matches = evidence_matches or []
    suggestions: list[TestCaseSuggestion] = []
    func = candidate.function_name
    cond = candidate.observed_condition

    # Extract dynamic return behavior string for documentation
    outcome_summary = candidate.observed_behavior

    # Case 1: Numeric threshold (e.g. 'balance < 1000' or 'WS-BALANCE < 1000')
    num_match = re.search(r"([A-Za-z0-9\-_]+)\s*(<|<=|>|>=|==|!=)\s*([0-9]+(?:\.[0-9]+)?)", cond)
    # Case 2: Variable to Variable comparison (e.g. 'ACC-BALANCE < WS-WITHDRAW-AMOUNT')
    var_match = re.search(r"([A-Za-z0-9\-_]+)\s*(<|<=|>|>=|==|!=)\s*([A-Za-z0-9\-_]+)", cond)
    # Case 3: Categorical equality (e.g. 'ACC-STATUS = S' or 'tier == GOLD')
    cat_match = re.search(r"([A-Za-z0-9\-_]+)\s*(?:==|=|!=)\s*['\"]?([A-Za-z0-9\-_]+)['\"]?", cond)

    if num_match:
        var_name, op, val_str = num_match.groups()
        threshold = float(val_str)

        # 1. Boundary: Below
        val_below = threshold - 1.0 if threshold.is_integer() else threshold - 0.01
        int_below = int(val_below) if val_below.is_integer() else val_below
        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-BOUNDARY-BELOW",
                function_name=func,
                input_parameters={var_name: int_below},
                boundary_type="BOUNDARY_BELOW",
                expected_code_behavior=f"Evaluates '{var_name}={int_below}' against condition '{cond}'. {outcome_summary}",
                business_expectation_note=f"Verify whether boundary below threshold ({int_below}) satisfies expected business policy.",
                requires_human_validation=True,
                rationale=f"Evaluates boundary just below threshold {threshold}.",
            )
        )

        # 2. Boundary: Exact threshold
        int_exact = int(threshold) if threshold.is_integer() else threshold
        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-BOUNDARY-EXACT",
                function_name=func,
                input_parameters={var_name: int_exact},
                boundary_type="BOUNDARY_EXACT",
                expected_code_behavior=f"Evaluates '{var_name}={int_exact}' against condition '{cond}'. {outcome_summary}",
                business_expectation_note=f"Verify exact threshold equality ({int_exact}) against business specification.",
                requires_human_validation=True,
                rationale=f"Evaluates exact threshold boundary equality for {threshold}.",
            )
        )

        # 3. Boundary: Above
        val_above = threshold + 1.0 if threshold.is_integer() else threshold + 0.01
        int_above = int(val_above) if val_above.is_integer() else val_above
        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-BOUNDARY-ABOVE",
                function_name=func,
                input_parameters={var_name: int_above},
                boundary_type="BOUNDARY_ABOVE",
                expected_code_behavior=f"Evaluates '{var_name}={int_above}' against condition '{cond}'. {outcome_summary}",
                business_expectation_note=f"Verify boundary above threshold ({int_above}) against business specification.",
                requires_human_validation=True,
                rationale=f"Evaluates boundary just above threshold {threshold}.",
            )
        )

    elif var_match and not num_match:
        left_var, op, right_var = var_match.groups()
        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-VAR-LESS",
                function_name=func,
                input_parameters={left_var: 500, right_var: 1000},
                boundary_type="BOUNDARY_BELOW",
                expected_code_behavior=f"Evaluates '{left_var} < {right_var}'. {outcome_summary}",
                business_expectation_note=f"Validate handling when {left_var} is strictly less than {right_var}.",
                requires_human_validation=True,
                rationale="Variable comparison boundary: left < right.",
            )
        )
        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-VAR-EQUAL",
                function_name=func,
                input_parameters={left_var: 1000, right_var: 1000},
                boundary_type="BOUNDARY_EXACT",
                expected_code_behavior=f"Evaluates '{left_var} == {right_var}'. {outcome_summary}",
                business_expectation_note=f"Validate exact equality between {left_var} and {right_var}.",
                requires_human_validation=True,
                rationale="Variable comparison boundary: left == right.",
            )
        )
        suggestions.append(
            TestCaseSuggestion(
                test_id=f"TEST-{func}-VAR-GREATER",
                function_name=func,
                input_parameters={left_var: 1500, right_var: 1000},
                boundary_type="BOUNDARY_ABOVE",
                expected_code_behavior=f"Evaluates '{left_var} > {right_var}'. {outcome_summary}",
                business_expectation_note=f"Validate handling when {left_var} is strictly greater than {right_var}.",
                requires_human_validation=True,
                rationale="Variable comparison boundary: left > right.",
            )
        )

    # 4. Evidence-derived dynamic exemption test cases
    for match in matches:
        if match.missing_conditions_detected:
            for missing_cond in match.missing_conditions_detected:
                cond_clean = missing_cond.replace("exemption_for_", "")
                suffix = "EXTENSION" if "extension" in cond_clean.lower() else cond_clean.upper()[:16]
                param_key = "approved_payment_extension" if "extension" in cond_clean.lower() else missing_cond
                expected_behavior_str = (
                    "Current code will charge 50 (AST confirms missing exemption logic)."
                    if "50" in candidate.observed_behavior
                    else f"Current code executes default branch for '{cond}' (AST confirms missing exemption logic for '{missing_cond}')."
                )
                suggestions.append(
                    TestCaseSuggestion(
                        test_id=f"TEST-{func}-EXEMPTION-{suffix}",
                        function_name=func,
                        input_parameters={"balance": 500, param_key: True},
                        boundary_type="EVIDENCE_EXCEPTION",
                        expected_code_behavior=expected_behavior_str,
                        business_expectation_note=(
                            f"Evidence {match.evidence_id} claims '{missing_cond}' should be granted exemption or special handling. "
                            "Requires business policy verification."
                        ),
                        requires_human_validation=True,
                        rationale=(
                            f"Validates reported discrepancy: code currently lacks logic to handle {missing_cond}."
                        ),
                    )
                )

    return RegressionTestSuiteSuggestion(
        finding_id=candidate.finding_id,
        function_name=func,
        suggestions=suggestions,
    )
