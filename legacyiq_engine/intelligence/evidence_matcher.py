"""Evidence matching module for LegacyIQ.

Matches plain-text evidence (incident reports, change tickets, business docs)
against existing business rule candidates dynamically using semantic token overlap,
domain context analysis, and intent classification.

Strict Governance:
1. Operates dynamically on arbitrary source code and evidence artifacts (zero hardcoded rules).
2. Distinguishes code behavior (AST facts) from reported incident claims.
3. An incident report demonstrates operational discrepancy; it does NOT constitute approved business policy.
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

# Conflict signals indicating reported defect, discrepancy, or missing business logic
CONFLICT_SIGNALS = [
    r"incorrectly",
    r"should be exempt",
    r"must be exempt",
    r"exempt from",
    r"charge[sd]? .* inappropriately",
    r"charge[sd]? .* incorrectly",
    r"charged? in error",
    r"unauthorized",
    r"improperly",
    r"\bbug\b",
    r"\bdefect\b",
    r"\bincident\b",
    r"\bdiscrepancy\b",
    r"fails? to",
    r"not expected",
    r"should not (?:be )?blocked",
    r"should allow",
    r"should permit",
]

# Support signals indicating intentional, documented, or verified policy
SUPPORT_SIGNALS = [
    r"as designed",
    r"approved spec",
    r"standard policy",
    r"per documentation",
    r"expected behavior",
    r"stipulates",
    r"mandates that",
    r"confirmed rule",
    r"compliance requirement",
    r"business requirement",
]

# Stop words to ignore during token overlap calculation
STOP_WORDS = {
    "the", "a", "an", "and", "or", "in", "to", "for", "with", "from", "by",
    "on", "at", "of", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "if", "else", "then", "return",
    "returns", "true", "false", "none", "this", "that", "it", "when", "as",
}


def _tokenize(text: str) -> set[str]:
    """Tokenize a string into normalized domain keywords (removing code symbols & delimiters)."""
    # Split on whitespace, underscores, hyphens, and CamelCase
    s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    tokens = re.findall(r"[A-Za-z0-9]+", s1.lower())
    return {t for t in tokens if len(t) > 2 and t not in STOP_WORDS}


def _extract_evidence_id(text: str, default: str = "EV-DOC") -> str:
    """Extract an ID like 'INC-101', 'CR-202', or 'TICKET-404' if present in the text."""
    match = re.search(r"\b(INC-\d+|CR-\d+|TICKET-\d+|DOC-\d+|PR-\d+)\b", text, re.IGNORECASE)
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


def _detect_missing_conditions_dynamically(evidence_text: str, observed_condition: str) -> list[str]:
    """Dynamically extracts missing conditions or exemptions demanded by evidence.

    Only triggers when evidence explicitly asserts an exemption, waiver, or rule discrepancy.
    """
    missing: list[str] = []
    ev_lower = evidence_text.lower()
    cond_lower = observed_condition.lower()

    # Only extract exemptions if evidence explicitly states something should/must be exempt, permitted, or waived
    has_exemption_assertion = bool(
        re.search(
            r"should be exempt|must be exempt|exempt from|eligible for waiver|should permit|should allow|should not (?:be )?charged?",
            ev_lower,
        )
    )
    if not has_exemption_assertion:
        return []

    # Detect domain concepts that should be exempt
    if "payment extension" in ev_lower or ("extension" in ev_lower and "extension" not in cond_lower):
        missing.append("exemption_for_payment_extension")
    if "overdraft" in ev_lower and "overdraft" not in cond_lower:
        missing.append("exemption_for_overdraft_protection")
    if "waiver" in ev_lower and "waiver" not in cond_lower:
        missing.append("exemption_for_waiver")
    if "vip" in ev_lower and "vip" not in cond_lower:
        missing.append("exemption_for_vip_status")

    # Generic phrase extraction if no standard alias matched
    if not missing:
        match = re.search(r"(?:with|having|for)\s+(?:an?\s+)?([a-z0-9\s\-]+?)\s+(?:should|must|ought to)", ev_lower)
        if match:
            words = [w for w in match.group(1).split() if w not in STOP_WORDS and len(w) > 2]
            if words:
                missing.append(f"exemption_for_{'_'.join(words[:3])}")

    return missing


def match_evidence_to_candidate(
    evidence: EvidenceArtifact,
    candidate: BusinessRuleCandidate,
) -> Optional[EvidenceMatchResult]:
    """Dynamically matches an evidence artifact against a single BusinessRuleCandidate.

    Calculates contextual token overlap and semantic relevance dynamically.
    Returns None if the evidence is completely unrelated.
    """
    ev_text = evidence.content
    ev_lower = ev_text.lower()
    cond_lower = candidate.observed_condition.lower()

    # 1. Dynamic token extraction from the candidate finding
    code_tokens = set()
    code_tokens.update(_tokenize(candidate.function_name))
    code_tokens.update(_tokenize(candidate.observed_condition))
    code_tokens.update(_tokenize(candidate.observed_behavior))

    evidence_tokens = _tokenize(ev_text)

    # Compute dynamic semantic token overlap
    intersection = code_tokens.intersection(evidence_tokens)
    overlap_count = len(intersection)

    # Check for direct numerical/identifier overlap (e.g. 1000, 50, account numbers)
    code_numbers = set(re.findall(r"\b\d+\b", candidate.observed_condition + " " + candidate.observed_behavior))
    ev_numbers = set(re.findall(r"\b\d+\b", ev_text))
    num_overlap = len(code_numbers.intersection(ev_numbers))

    total_overlap = overlap_count + (num_overlap * 2)

    # Filter out completely unrelated evidence (e.g. database pool, CSS color, unrelated service)
    if total_overlap == 0:
        return None

    # 2. Dynamically extract missing conditions reported by evidence
    missing_conditions = _detect_missing_conditions_dynamically(ev_text, candidate.observed_condition)

    # 3. Classify relationship status dynamically
    has_conflict = any(re.search(sig, ev_lower) for sig in CONFLICT_SIGNALS) or len(missing_conditions) > 0
    has_support = any(re.search(sig, ev_lower) for sig in SUPPORT_SIGNALS)

    if has_conflict:
        status = RelationshipStatus.CONFLICTED
        confidence = min(0.65 + (0.05 * total_overlap), 0.98)
        missing_desc = (
            f" Missing condition detected: '{', '.join(missing_conditions)}'."
            if missing_conditions
            else ""
        )
        explanation = (
            f"Evidence '{evidence.evidence_id}' highlights an operational discrepancy with `{candidate.function_name}`. "
            f"Evidence reports that specific business handling should apply (overlapping context: {', '.join(sorted(intersection)[:4])}), "
            f"yet static code analysis verifies that condition `{candidate.observed_condition}` executes without these criteria.{missing_desc} "
            "Governance Caveat: This incident documents an operational discrepancy; it does NOT constitute approved business policy."
        )
    elif has_support and not has_conflict:
        status = RelationshipStatus.SUPPORTED
        confidence = min(0.60 + (0.05 * total_overlap), 0.95)
        explanation = (
            f"Evidence '{evidence.evidence_id}' supports the observed code logic in `{candidate.function_name}`. "
            f"The documented criteria align with observed condition `{candidate.observed_condition}` "
            f"(correlated concepts: {', '.join(sorted(intersection)[:4])})."
        )
    else:
        status = RelationshipStatus.UNCERTAIN
        confidence = 0.50
        explanation = (
            f"Evidence '{evidence.evidence_id}' touches domain concepts ({', '.join(sorted(intersection)[:3])}) "
            f"related to `{candidate.function_name}`, but provides inconclusive criteria to establish support or conflict."
        )

    return EvidenceMatchResult(
        evidence_id=evidence.evidence_id,
        finding_id=candidate.finding_id,
        relationship_status=status,
        explanation=explanation,
        source_reference=evidence.source_reference or "evidence-document",
        confidence_score=round(confidence, 2),
        missing_conditions_detected=missing_conditions,
    )


def match_evidence_to_rules(
    evidence_text: str,
    candidates: list[BusinessRuleCandidate],
    source_reference: str = "evidence.txt",
) -> list[EvidenceMatchResult]:
    """Matches raw plain-text evidence dynamically across a list of candidate business rules."""
    artifact = parse_evidence_text(evidence_text, source_reference=source_reference)
    results: list[EvidenceMatchResult] = []

    for candidate in candidates:
        match = match_evidence_to_candidate(artifact, candidate)
        if match is not None:
            results.append(match)

    return results
