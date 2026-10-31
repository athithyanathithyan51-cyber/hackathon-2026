"""Transparent heuristic risk assessment for LegacyIQ findings.

Principles:
1. Heuristic scoring is transparent, explainable, and rules-based.
2. Scores are NEVER described as verified probabilities.
3. Categories: LOW, MEDIUM, HIGH, CRITICAL.
"""
from __future__ import annotations

from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceMatchResult,
    RelationshipStatus,
    RiskAssessment,
    RiskCategory,
    RiskFactor,
)


def assess_risk(
    candidate: BusinessRuleCandidate,
    evidence_matches: list[EvidenceMatchResult] | None = None,
) -> RiskAssessment:
    """Calculates an explainable heuristic risk score for a business-rule finding.

    Base scoring guidelines (0.0 to 100.0 scale):
    - Base technical debt / obscurity: 20 points
    - Monetary impact (penalty, fee, billing logic): +25 points
    - Conflicted evidence (reported defect/missing exemption in production): +35 points
    - Missing exemption conditions detected: +15 points
    - Unverified policy (code not vetted by business): +10 points
    - Supported evidence reduces risk: -15 points
    """
    matches = evidence_matches or []
    factors: list[RiskFactor] = []
    score = 20.0  # Base legacy maintenance risk

    factors.append(
        RiskFactor(
            factor_name="Legacy Code Base Risk",
            impact_score=20.0,
            description="Baseline uncertainty associated with unmaintained or legacy code structure.",
        )
    )

    func_lower = candidate.function_name.lower()
    if any(term in func_lower for term in ["penalty", "fee", "charge", "payment", "rate"]):
        score += 25.0
        factors.append(
            RiskFactor(
                factor_name="Direct Financial Impact",
                impact_score=25.0,
                description=f"Function `{candidate.function_name}` directly affects customer billing or monetary penalty assessments.",
            )
        )

    # Check evidence conflicts
    has_conflict = any(m.relationship_status == RelationshipStatus.CONFLICTED for m in matches)
    conflicted_matches = [m for m in matches if m.relationship_status == RelationshipStatus.CONFLICTED]

    if has_conflict:
        score += 30.0
        missing_count = sum(len(m.missing_conditions_detected) for m in conflicted_matches)
        if missing_count > 0:
            score += 15.0
            factors.append(
                RiskFactor(
                    factor_name="Unaccounted Exemption Discrepancy",
                    impact_score=45.0,
                    description=(
                        f"External evidence identifies reported discrepancies/missing conditions "
                        f"(e.g. {missing_count} missing exemption paths). Customers may experience incorrect charges."
                    ),
                )
            )
        else:
            factors.append(
                RiskFactor(
                    factor_name="Production Incident Conflict",
                    impact_score=30.0,
                    description="Reported incident contradicts observable code execution path.",
                )
            )

    # Check supported evidence
    has_support = any(m.relationship_status == RelationshipStatus.SUPPORTED for m in matches)
    if has_support and not has_conflict:
        score = max(5.0, score - 15.0)
        factors.append(
            RiskFactor(
                factor_name="Documented Policy Alignment",
                impact_score=-15.0,
                description="Verified business documentation aligns with observed logic.",
            )
        )

    # Cap score between 0.0 and 100.0
    final_score = min(max(score, 0.0), 100.0)

    # Categorization
    if final_score >= 80.0:
        category = RiskCategory.CRITICAL
        recommended_action = (
            "CRITICAL: Immediate business analyst and engineering review required. "
            "Evidence indicates customers are actively subjected to incorrect fees or missing exemptions. "
            "Do not modernize or delete without resolving the discrepancy."
        )
    elif final_score >= 60.0:
        category = RiskCategory.HIGH
        recommended_action = (
            "HIGH: Prioritize review. Significant financial logic or unverified policy identified. "
            "Draft targeted regression tests and obtain product sign-off."
        )
    elif final_score >= 35.0:
        category = RiskCategory.MEDIUM
        recommended_action = (
            "MEDIUM: Standard modernization candidate. Verify internal dependencies before refactoring."
        )
    else:
        category = RiskCategory.LOW
        recommended_action = (
            "LOW: Safe for routine maintenance or modernization."
        )

    explanation = (
        f"Assigned heuristic risk score of {final_score:.1f}/100 ({category.value}). "
        f"Primary drivers: {', '.join(f.factor_name for f in factors)}."
    )

    return RiskAssessment(
        finding_id=candidate.finding_id,
        risk_score=final_score,
        risk_category=category,
        factors=factors,
        explanation=explanation,
        recommended_action=recommended_action,
        heuristic_disclaimer=(
            "Heuristic assessment based on observable code structure and unapproved evidence. "
            "Does not represent a mathematically validated statistical probability."
        ),
    )
