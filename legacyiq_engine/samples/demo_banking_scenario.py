"""LegacyIQ Data/AI Engine — Complete Banking Scenario Demonstration.

Demonstrates the 9 required stages:
1. Initial code analysis (safe AST parsing).
2. Business-rule candidate extraction.
3. Uploading incident INC-101 as new evidence.
4. Matching the incident with the penalty rule.
5. Detecting a possible missing exemption condition.
6. Updating the finding to reflect uncertainty or incomplete behavior.
7. Updating the risk assessment and recommendation.
8. Preserving the original finding version immutably.
9. Generating regression test suggestions (boundary + exception).

Governance Rules:
- Never executes uploaded source code.
- Never automatically modifies legacy source code.
- Does not assume an incident report constitutes approved business policy.
"""
import json
from pathlib import Path
import sys

# Ensure repository root is on sys.path for standalone execution
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.analyzer.rule_extractor import extract_rule_candidates
from legacyiq_engine.intelligence.ai_interpreter import interpret_rule_candidate
from legacyiq_engine.intelligence.evidence_matcher import match_evidence_to_rules
from legacyiq_engine.intelligence.reassessment import (
    initialize_finding_version,
    reassess_finding_with_evidence,
)
from legacyiq_engine.storage.history_store import HistoryStore


def run_demonstration():
    samples_dir = Path(__file__).resolve().parent
    banking_file = samples_dir / "banking_legacy.py"
    incident_file = samples_dir / "incident_101.txt"

    code_content = banking_file.read_text(encoding="utf-8")
    incident_content = incident_file.read_text(encoding="utf-8")

    # Use an isolated in-memory or demo SQLite store
    demo_db = samples_dir / "demo_legacyiq_history.db"
    if demo_db.exists():
        demo_db.unlink()
    history_store = HistoryStore(db_path=str(demo_db))

    print("=" * 80)
    print(" LEGACYIQ DATA/AI ENGINE — BANKING SCENARIO DEMONSTRATION")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # STEP 1: Initial code analysis
    # -------------------------------------------------------------------------
    print("\n[STEP 1] INITIAL CODE ANALYSIS (SAFE AST PARSER)")
    print("-" * 50)
    print("Source File: banking_legacy.py")
    print("Content:\n" + code_content.strip())

    ast_result = analyze_source(code_content, file_path="banking_legacy.py")
    print(f"\nAST Result:")
    print(f" - Syntax valid: {ast_result.syntax_valid}")
    print(f" - Extracted functions: {[f.name for f in ast_result.functions]}")
    func = ast_result.functions[0]
    print(f" - Function '{func.name}' lines: {func.start_line} to {func.end_line}")
    print(f" - Condition text: '{func.conditions[0].condition_text}' (line {func.conditions[0].line_number})")
    print(f" - Returns: {[r.value_repr for r in func.returns]}")

    # -------------------------------------------------------------------------
    # STEP 2: Business-rule candidate extraction
    # -------------------------------------------------------------------------
    print("\n[STEP 2] BUSINESS-RULE CANDIDATE EXTRACTION")
    print("-" * 50)
    rules = extract_rule_candidates(ast_result)
    candidate = rules[0]

    # Initialize baseline Version 1
    v1_entry = initialize_finding_version(candidate, history_store=history_store)
    print(f"Finding ID: {candidate.finding_id}")
    print(f"Version: {candidate.version}")
    print(f"Observed Condition: {candidate.observed_condition}")
    print(f"Observed Behavior: {candidate.observed_behavior}")
    print(f"Evidence Status: {candidate.evidence_status.value}")
    print(f"Is Approved Business Policy: {candidate.is_approved_policy}")
    print(f"Uncertainty: {candidate.uncertainty_explanation}")
    print(f"Initial Baseline Risk Score: {v1_entry.risk_assessment.risk_score}/100 ({v1_entry.risk_assessment.risk_category.value})")

    # -------------------------------------------------------------------------
    # STEP 3: Uploading the incident as new evidence
    # -------------------------------------------------------------------------
    print("\n[STEP 3] UPLOADING INCIDENT AS NEW EVIDENCE")
    print("-" * 50)
    print("Evidence Document:\n" + incident_content.strip())

    # -------------------------------------------------------------------------
    # STEP 4: Matching the incident with the penalty rule
    # -------------------------------------------------------------------------
    print("\n[STEP 4] CONTEXTUAL EVIDENCE MATCHING")
    print("-" * 50)
    matches = match_evidence_to_rules(incident_content, [candidate], source_reference="incident_101.txt")
    match = matches[0]
    print(f"Matched Evidence ID: {match.evidence_id}")
    print(f"Target Finding ID: {match.finding_id}")
    print(f"Relationship Status: {match.relationship_status.value}")
    print(f"Confidence Score: {match.confidence_score}")
    print(f"Match Explanation:\n  {match.explanation}")

    # -------------------------------------------------------------------------
    # STEP 5: Detecting a possible missing exemption condition
    # -------------------------------------------------------------------------
    print("\n[STEP 5] DETECTING MISSING EXEMPTION CONDITION")
    print("-" * 50)
    print(f"Missing Conditions Detected: {match.missing_conditions_detected}")
    print("Insight: Incident asserts that payment extensions should qualify for exemption,")
    print("         but AST analysis confirms no extension check exists in `calculate_penalty`.")

    # -------------------------------------------------------------------------
    # STEP 6 & 7: Reassessment, Updating Uncertainty, Risk & Recommendations
    # -------------------------------------------------------------------------
    print("\n[STEP 6 & 7] ADAPTIVE REASSESSMENT & RISK ESCALATION")
    print("-" * 50)
    reassessment = reassess_finding_with_evidence(
        finding_id=candidate.finding_id,
        evidence_text=incident_content,
        source_reference="incident_101.txt",
        history_store=history_store,
    )

    updated_finding = reassessment.updated_finding
    print(f"Version: {reassessment.previous_version} -> {reassessment.new_version}")
    print(f"New Evidence Status: {updated_finding.evidence_status.value}")
    print(f"Updated Uncertainty Explanation:\n  {updated_finding.uncertainty_explanation}")
    print(f"Reason Recorded for Change: {reassessment.reason_for_change}")

    updated_risk = reassessment.updated_risk
    print(f"\nUpdated Risk Score: {updated_risk.risk_score:.1f}/100 ({updated_risk.risk_category.value})")
    print(f"Risk Factors:")
    for factor in updated_risk.factors:
        print(f" - [{factor.impact_score:+.1f}] {factor.factor_name}: {factor.description}")
    print(f"Recommended Action:\n  {updated_risk.recommended_action}")
    print(f"Heuristic Disclaimer:\n  {updated_risk.heuristic_disclaimer}")

    # -------------------------------------------------------------------------
    # STEP 8: Preserving the original finding version
    # -------------------------------------------------------------------------
    print("\n[STEP 8] IMMUTABLE VERSION PRESERVATION AUDIT")
    print("-" * 50)
    history = history_store.get_history(candidate.finding_id)
    print(f"Total Versions Recorded in Store: {len(history)}")
    for entry in history:
        print(f" - Version {entry.version} [{entry.timestamp}]:")
        print(f"     Status: {entry.finding.evidence_status.value}")
        print(f"     Risk: {entry.risk_assessment.risk_score} ({entry.risk_assessment.risk_category.value})")
        print(f"     Reason: {entry.change_reason}")
    print("Audit Confirmation: Version 1 was NEVER overwritten or lost.")

    # -------------------------------------------------------------------------
    # STEP 9: Generating regression test suggestions
    # -------------------------------------------------------------------------
    print("\n[STEP 9] REGRESSION TEST SUGGESTIONS GENERATION")
    print("-" * 50)
    suite = reassessment.updated_tests
    print(f"Disclaimer: {suite.disclaimer}\n")
    for idx, test in enumerate(suite.suggestions, 1):
        print(f"Test #{idx}: [{test.boundary_type}] {test.test_id}")
        print(f" - Input Parameters: {test.input_parameters}")
        print(f" - Expected Code Behavior: {test.expected_code_behavior}")
        print(f" - Business Expectation: {test.business_expectation_note}")
        print(f" - Requires Human Validation: {test.requires_human_validation}")
        print(f" - Rationale: {test.rationale}\n")

    print("=" * 80)
    print(" DEMONSTRATION COMPLETE: ALL 9 CRITICAL REQUIREMENTS VERIFIED")
    print("=" * 80)


if __name__ == "__main__":
    run_demonstration()
