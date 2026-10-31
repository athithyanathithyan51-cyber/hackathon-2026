"""Extracts structured business-rule candidates from AST analysis results.

Core Principle:
- Accurately captures observable code facts (condition, outcomes, line numbers).
- Explicitly marks all findings as NOT approved business policy (`is_approved_policy=False`).
- Does not invent facts or make unverified assumptions.
"""
from __future__ import annotations

import hashlib
from typing import Optional

from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.models.schemas import (
    ASTAnalysisResult,
    BusinessRuleCandidate,
    CodeCondition,
    CodeFunction,
    EvidenceStatus,
)


def _compute_stable_id(file_path: str, func_name: str, line: int, cond_text: str) -> str:
    """Generate a stable, deterministic ID for a business rule candidate."""
    raw = f"{file_path}:{func_name}:{line}:{cond_text}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:8].upper()
    sanitized_func = "".join(c if c.isalnum() else "_" for c in func_name)
    return f"BR-{sanitized_func}-L{line}-{digest}"


def _summarize_function_behavior(func: CodeFunction, cond: CodeCondition) -> tuple[str, str, int]:
    """Inspects returns and calls in a function to derive factual observed behavior."""
    # Returns at or immediately following the condition line
    true_return = None
    otherwise_return = None

    for ret in func.returns:
        if ret.line_number > cond.line_number:
            if true_return is None:
                true_return = ret
            elif otherwise_return is None and ret.line_number > true_return.line_number:
                otherwise_return = ret

    true_repr = true_return.value_repr if true_return else "proceeds with execution"
    otherwise_repr = (
        otherwise_return.value_repr if otherwise_return else "none or alternative path"
    )

    observed_behavior = (
        f"If '{cond.condition_text}' evaluates to True, returns {true_repr}; "
        f"otherwise returns {otherwise_repr}."
    )

    description = (
        f"Conditional rule in `{func.name}`: checks `{cond.condition_text}`. "
        f"Yields {true_repr} when satisfied, falls back to {otherwise_repr}."
    )

    end_line = otherwise_return.line_number if otherwise_return else func.end_line
    return description, observed_behavior, end_line


def extract_rule_candidates(analysis: ASTAnalysisResult) -> list[BusinessRuleCandidate]:
    """Convert AST analysis into structured business-rule candidates.

    Parameters:
        analysis: ASTAnalysisResult from analyze_source.

    Returns:
        List of BusinessRuleCandidate models with stable IDs and line numbers.
    """
    if not analysis.syntax_valid:
        return []

    candidates: list[BusinessRuleCandidate] = []

    for func in analysis.functions:
        # Check if function has internal references (is it an unreferenced candidate?)
        is_isolated = len(func.called_internal_functions) == 0 and not any(
            func.name in deps for deps in analysis.dependencies.values()
        )

        if func.conditions:
            for cond in func.conditions:
                stable_id = _compute_stable_id(
                    analysis.file_path, func.name, cond.line_number, cond.condition_text
                )
                description, behavior, end_line = _summarize_function_behavior(func, cond)

                uncertainty = (
                    "Extracted strictly from AST code structure. This is observable code behavior, "
                    "not an approved business policy. Potential missing exemptions or edge cases "
                    "require external evidence verification."
                )

                if is_isolated:
                    uncertainty += " Note: No internal callers detected in this file; may be invoked externally."

                candidate = BusinessRuleCandidate(
                    finding_id=stable_id,
                    function_name=func.name,
                    business_rule_description=description,
                    observed_condition=cond.condition_text,
                    observed_behavior=behavior,
                    source_file=analysis.file_path,
                    start_line=cond.line_number,
                    end_line=end_line,
                    evidence_status=EvidenceStatus.OBSERVED_IN_CODE,
                    uncertainty_explanation=uncertainty,
                    version=1,
                    is_approved_policy=False,
                    is_obsolete_candidate=False,
                )
                candidates.append(candidate)
        else:
            # Fallback for unconditional logic with return statement
            if func.returns:
                stable_id = _compute_stable_id(
                    analysis.file_path, func.name, func.start_line, "unconditional"
                )
                ret_val = func.returns[0].value_repr or "None"
                candidate = BusinessRuleCandidate(
                    finding_id=stable_id,
                    function_name=func.name,
                    business_rule_description=f"Unconditional computation in `{func.name}` returning {ret_val}.",
                    observed_condition="None (unconditional)",
                    observed_behavior=f"Always returns {ret_val}.",
                    source_file=analysis.file_path,
                    start_line=func.start_line,
                    end_line=func.end_line,
                    evidence_status=EvidenceStatus.OBSERVED_IN_CODE,
                    uncertainty_explanation=(
                        "Unconditional return extracted via AST. Implementation fact, not approved policy."
                    ),
                    version=1,
                    is_approved_policy=False,
                    is_obsolete_candidate=False,
                )
                candidates.append(candidate)

    return candidates


def extract_rules_from_source(
    source_code: str, file_path: str = "source.py"
) -> list[BusinessRuleCandidate]:
    """Convenience helper to parse source and extract business-rule candidates in one step."""
    ast_result = analyze_source(source_code, file_path=file_path)
    return extract_rule_candidates(ast_result)
