"""Tests for safe COBOL source code analyzer and core-banking evaluation."""
from pathlib import Path

from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.analyzer.cobol_analyzer import analyze_cobol
from legacyiq_engine.analyzer.rule_extractor import extract_rule_candidates
from legacyiq_engine.intelligence.evidence_matcher import match_evidence_to_rules
from legacyiq_engine.models.schemas import EvidenceStatus, RelationshipStatus


def test_analyze_cobol_penalty():
    samples_dir = Path(__file__).resolve().parent.parent / "samples"
    cbl_path = samples_dir / "PENALTY.cbl"
    cbl_content = cbl_path.read_text(encoding="utf-8")

    result = analyze_source(cbl_content, file_path="PENALTY.cbl")

    assert result.syntax_valid is True
    assert len(result.functions) >= 3

    func_names = [f.name for f in result.functions]
    assert "0000-MAIN-PROCESS" in func_names
    assert "1000-CALCULATE-PENALTY" in func_names
    assert "2000-APPLY-PENALTY" in func_names

    # Check dependencies: 0000-MAIN-PROCESS calls 1000 and 2000
    main_func = next(f for f in result.functions if f.name == "0000-MAIN-PROCESS")
    assert "1000-CALCULATE-PENALTY" in main_func.called_internal_functions
    assert "2000-APPLY-PENALTY" in main_func.called_internal_functions

    # Check 1000-CALCULATE-PENALTY condition and returns
    calc_func = next(f for f in result.functions if f.name == "1000-CALCULATE-PENALTY")
    assert len(calc_func.conditions) == 1
    cond = calc_func.conditions[0]
    assert "WS-BALANCE < 1000" in cond.condition_text
    assert len(cond.comparisons) == 1
    assert cond.comparisons[0].left == "WS-BALANCE"
    assert cond.comparisons[0].operator == "<"
    assert cond.comparisons[0].right == "1000"

    ret_vals = [r.value_repr for r in calc_func.returns]
    assert "50" in ret_vals
    assert "0" in ret_vals


def test_analyze_core_banking_trans_proc():
    samples_dir = Path(__file__).resolve().parent.parent / "samples"
    trans_path = samples_dir / "TRANS_PROC.cbl"
    trans_content = trans_path.read_text(encoding="utf-8")

    result = analyze_source(trans_content, file_path="TRANS_PROC.cbl")

    assert result.syntax_valid is True
    func_names = [f.name for f in result.functions]
    assert "1000-CHECK-STATUS" in func_names
    assert "2000-HANDLE-WITHDRAWAL" in func_names

    # Verify rule extraction from TRANS_PROC.cbl
    rules = extract_rule_candidates(result)
    assert len(rules) >= 2

    conditions = [r.observed_condition for r in rules]
    assert any("ACC-STATUS = 'S'" in c for c in conditions)
    assert any("ACC-BALANCE < WS-WITHDRAW-AMOUNT" in c for c in conditions)

    # Dynamic evidence matching against withdrawal logic
    withdrawal_incident = """INC-202: Overdraft dispute
Customers with authorized overdraft lines are encountering 'No Funds.' when withdrawing.
The application should permit withdrawals up to approved limit.
"""
    matches = match_evidence_to_rules(withdrawal_incident, rules, source_reference="incident_202.txt")
    assert len(matches) >= 1
    match = matches[0]
    assert match.relationship_status == RelationshipStatus.CONFLICTED
    assert match.confidence_score >= 0.70
