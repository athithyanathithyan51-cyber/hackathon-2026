"""Adaptive reassessment module for LegacyIQ.

When new evidence arrives:
1. Finds relevant existing findings in history.
2. Compares new evidence against existing findings and interpretations.
3. Classifies evidence relationship (SUPPORTED, CONFLICTED, UNCERTAIN).
4. Updates finding status and uncertainty explanations where justified.
5. Recalculates transparent heuristic risk.
6. Generates updated regression test suggestions.
7. Preserves previous versions immutably in HistoryStore.
8. Records the explicit reason for every version increment.
"""
from __future__ import annotations

from typing import Optional

from legacyiq_engine.assessment.risk_assessor import assess_risk
from legacyiq_engine.assessment.test_generator import generate_test_suggestions
from legacyiq_engine.intelligence.ai_interpreter import interpret_rule_candidate
from legacyiq_engine.intelligence.evidence_matcher import (
    match_evidence_to_candidate,
    parse_evidence_text,
)
from legacyiq_engine.models.schemas import (
    BusinessRuleCandidate,
    EvidenceMatchResult,
    EvidenceStatus,
    FindingVersion,
    ReassessmentResult,
    RelationshipStatus,
)
from legacyiq_engine.storage.history_store import HistoryStore


def initialize_finding_version(
    candidate: BusinessRuleCandidate,
    history_store: Optional[HistoryStore] = None,
) -> FindingVersion:
    """Store the initial (Version 1) baseline for an extracted business rule."""
    store = history_store or HistoryStore()

    existing = store.get_latest_version(candidate.finding_id)
    if existing:
        return existing

    risk = assess_risk(candidate, evidence_matches=[])
    interp = interpret_rule_candidate(candidate)

    v1 = FindingVersion(
        version=1,
        finding=candidate,
        risk_assessment=risk,
        interpretation=interp,
        evidence_matches=[],
        change_reason="Initial code AST baseline extraction",
    )
    store.save_version(v1)
    return v1


def reassess_finding_with_evidence(
    finding_id: str,
    evidence_text: str,
    source_reference: str = "evidence.txt",
    history_store: Optional[HistoryStore] = None,
) -> Optional[ReassessmentResult]:
    """Reassesses a finding when new evidence arrives, preserving history and updating risk.

    Parameters:
        finding_id: The stable ID of the finding to reassess.
        evidence_text: Plain-text content of the new incident or documentation.
        source_reference: File name or reference identifier.
        history_store: Optional HistoryStore instance.

    Returns:
        ReassessmentResult containing old and new versions, updated risk, and test suggestions,
        or None if finding is unknown or evidence is completely unrelated.
    """
    store = history_store or HistoryStore()
    latest_entry = store.get_latest_version(finding_id)
    if not latest_entry:
        return None

    current_finding = latest_entry.finding
    artifact = parse_evidence_text(evidence_text, source_reference=source_reference)

    match = match_evidence_to_candidate(artifact, current_finding)
    if match is None:
        # Evidence has no bearing on this finding; do not mutate history
        return None

    # Determine updated evidence status and change reason
    prev_version = latest_entry.version
    new_version = prev_version + 1

    updated_candidate = current_finding.model_copy(deep=True)
    updated_candidate.version = new_version

    all_matches = list(latest_entry.evidence_matches)
    # Deduplicate matches by evidence_id
    all_matches = [m for m in all_matches if m.evidence_id != match.evidence_id]
    all_matches.append(match)

    if match.relationship_status == RelationshipStatus.CONFLICTED:
        updated_candidate.evidence_status = EvidenceStatus.CONFLICTED_BY_EVIDENCE
        missing_desc = (
            f" Missing condition detected: {', '.join(match.missing_conditions_detected)}."
            if match.missing_conditions_detected
            else ""
        )
        updated_candidate.uncertainty_explanation = (
            f"Conflict reported by evidence {match.evidence_id}: {match.explanation}.{missing_desc} "
            "Reported defect demonstrates code/business discrepancy; requires business analyst verification."
        )
        reason = f"Evidence {match.evidence_id} introduced conflicting defect report ({', '.join(match.missing_conditions_detected) or 'discrepancy'})."

    elif match.relationship_status == RelationshipStatus.SUPPORTED:
        updated_candidate.evidence_status = EvidenceStatus.SUPPORTED_BY_EVIDENCE
        updated_candidate.uncertainty_explanation = (
            f"Supported by evidence {match.evidence_id}: Verified documentation confirms observed behavior."
        )
        reason = f"Evidence {match.evidence_id} validates observed code behavior."

    else:
        updated_candidate.evidence_status = EvidenceStatus.UNCERTAIN_EVIDENCE
        updated_candidate.uncertainty_explanation = (
            f"Evidence {match.evidence_id} references domain but remains inconclusive."
        )
        reason = f"Evidence {match.evidence_id} evaluated with uncertain relationship."

    # Recalculate heuristic risk
    updated_risk = assess_risk(updated_candidate, evidence_matches=all_matches)

    # Re-interpret with evidence context
    updated_interp = interpret_rule_candidate(
        updated_candidate,
        evidence_context=f"Evidence {match.evidence_id}: {match.explanation}",
    )

    # Generate updated regression test suite suggestions
    updated_tests = generate_test_suggestions(updated_candidate, evidence_matches=all_matches)

    # Save new version immutably into history store
    new_version_entry = FindingVersion(
        version=new_version,
        finding=updated_candidate,
        risk_assessment=updated_risk,
        interpretation=updated_interp,
        evidence_matches=all_matches,
        change_reason=reason,
    )
    store.save_version(new_version_entry)

    return ReassessmentResult(
        finding_id=finding_id,
        previous_version=prev_version,
        new_version=new_version,
        updated_finding=updated_candidate,
        new_evidence_matches=all_matches,
        updated_risk=updated_risk,
        updated_tests=updated_tests,
        reason_for_change=reason,
    )
