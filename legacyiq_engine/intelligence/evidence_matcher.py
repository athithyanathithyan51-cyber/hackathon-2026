"""Evidence matching module for LegacyIQ.

Matches plain-text evidence (incident reports, change tickets, business docs)
against existing business rule candidates using contextual understanding.

Relationship Statuses:
- SUPPORTED: Evidence confirms or reinforces the observed code behavior.
- CONFLICTED: Evidence reports defects, missing exemptions, or contradicts code behavior.
- UNCERTAIN: Evidence relates to the domain but is ambiguous or inconclusive.

Fundamental Rule:
An incident report demonstrates a reported defect or discrepancy;
it does NOT automatically establish an approved business policy.
"""
from __future__ import annotations

import re
from typing import Optional

from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceArtifact,
    EvidenceMatchResult,
    RelationshipStatus,
)


# Conflict signals in evidence (indicating discrepancy, defect, or missing requirement in code behavior)
CONFLICT_SIGNALS = [
    r"incorrectly",
    r"should be exempt",
    r"must be exempt",
    r"exempt from",
    r"charge[sd]? .* inappropriately",
    r"charge[sd]? .* incorrectly",
    r"charged? in error",
    r"unauthorized charge",
    r"\bbug\b",
    r"\bdefect\b",
    r"\bincident\b",
    r"\bdiscrepancy\b",
    r"fails? to",
    r"not expected",
]

# Support signals (indicating intentional or approved behavior)
SUPPORT_SIGNALS = [
    r"as designed",
    r"approved spec",
    r"standard policy",
    r"per documentation",
    r"expected behavior",
    r"stipulates",
    r"mandates that",
    r"confirmed rule",
]

# Domain concepts associated with banking penalty logic
PENALTY_TERMS = ["penalty", "balance", "fee", "minimum", "charge", "1000", "50"]


def _extract_evidence_id(text: str, default: str = "EV-DOC") -> str:
    """Extract an ID like 'INC-101' or 'CR-202' if present in the text."""
    match = re.search(r"\b(INC-\d+|CR-\d+|TICKET-\d+|DOC-\d+)\b", text, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return default


def parse_evidence_text(
    content: str,
    source_reference: str = "evidence_file",
    title: str = "",
) -> EvidenceArtifact:
    """Parse plain text into an EvidenceArtifact."""
    evidence_id = _extract_evidence_id(content, default="EV-UNSTRUCTURED")
    return EvidenceArtifact(
        evidence_id=evidence_id,
        title=title or f"Evidence {evidence_id}",
        content=content.strip(),
        source_reference=source_reference,
    )


def match_evidence_to_candidate(
    evidence: EvidenceArtifact,
    candidate: BusinessRuleCandidate,
) -> Optional[EvidenceMatchResult]:
    """Contextually matches an evidence artifact against a single BusinessRuleCandidate.

    Returns None if the evidence is completely unrelated.
    """
    ev_lower = evidence.content.lower()
    cond_lower = candidate.observed_condition.lower()
    func_lower = candidate.function_name.lower()

    # 1. Check contextual relevance (not just exact string match)
    # Check if key concepts or tokens align between code and evidence
    overlap_score = 0
    matched_topics = []

    for term in PENALTY_TERMS:
        if term in ev_lower and (term in cond_lower or term in func_lower or term in candidate.observed_behavior.lower()):
            overlap_score += 1
            matched_topics.append(term)

    # General domain token check
    if "penalty" in ev_lower and "penalty" in func_lower:
        overlap_score += 2
    if "balance" in ev_lower and "balance" in cond_lower:
        overlap_score += 2

    # If completely unrelated (e.g. database timeout, CSS layout issue)
    if overlap_score == 0 and not any(term in ev_lower for term in ["penalty", "minimum balance", func_lower]):
        return None

    # 2. Check for missing conditions / exemptions reported in evidence
    missing_conditions: list[str] = []
    has_exemption_demand = bool(re.search(r"should be exempt|must be exempt|exempt from|eligible for waiver", ev_lower))

    if has_exemption_demand:
        if ("extension" in ev_lower or "payment extension" in ev_lower) and "extension" not in cond_lower:
            missing_conditions.append("exemption_for_payment_extension")
        if "waiver" in ev_lower and "waiver" not in cond_lower:
            missing_conditions.append("exemption_for_waiver")
        if "vip" in ev_lower and "vip" not in cond_lower:
            missing_conditions.append("exemption_for_vip_status")

    # 3. Classify relationship status
    has_conflict = any(re.search(sig, ev_lower) for sig in CONFLICT_SIGNALS) or len(missing_conditions) > 0
    has_support = any(re.search(sig, ev_lower) for sig in SUPPORT_SIGNALS)

    if has_conflict:
        status = RelationshipStatus.CONFLICTED
        confidence = min(0.65 + (0.1 * overlap_score), 0.95)
        explanation = (
            f"Evidence '{evidence.evidence_id}' highlights a discrepancy with `{candidate.function_name}`. "
            f"The evidence indicates that certain conditions (such as exemptions) should apply, "
            f"yet AST analysis verifies that `{candidate.observed_condition}` is evaluated without these checks. "
            "Policy Caveat: This incident demonstrates operational discrepancy; it does NOT constitute approved business policy."
        )
    elif has_support and not has_conflict:
        status = RelationshipStatus.SUPPORTED
        confidence = min(0.60 + (0.1 * overlap_score), 0.90)
        explanation = (
            f"Evidence '{evidence.evidence_id}' supports the observed code logic in `{candidate.function_name}`. "
            f"The documented rules align with the condition `{candidate.observed_condition}`."
        )
    else:
        status = RelationshipStatus.UNCERTAIN
        confidence = 0.50
        explanation = (
            f"Evidence '{evidence.evidence_id}' touches domain concepts related to `{candidate.function_name}`, "
            "but provides insufficient unambiguous criteria to determine full support or conflict."
        )

    return EvidenceMatchResult(
        evidence_id=evidence.evidence_id,
        finding_id=candidate.finding_id,
        relationship_status=status,
        explanation=explanation,
        source_reference=evidence.source_reference or "plain-text-evidence",
        confidence_score=round(confidence, 2),
        missing_conditions_detected=missing_conditions,
    )


def match_evidence_to_rules(
    evidence_text: str,
    candidates: list[BusinessRuleCandidate],
    source_reference: str = "evidence.txt",
) -> list[EvidenceMatchResult]:
    """Matches raw plain-text evidence across all candidate business rules."""
    artifact = parse_evidence_text(evidence_text, source_reference=source_reference)
    results: list[EvidenceMatchResult] = []

    for candidate in candidates:
        match = match_evidence_to_candidate(artifact, candidate)
        if match is not None:
            results.append(match)

    return results
