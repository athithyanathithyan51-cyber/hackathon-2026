"""Tests for business-rule candidate extraction."""
from legacyiq_engine.analyzer.rule_extractor import (
    extract_rule_candidates,
    extract_rules_from_source,
)
from legacyiq_engine.models.schemas import EvidenceStatus


def test_extract_banking_legacy_rule():
    code = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""
    rules = extract_rules_from_source(code, file_path="banking_legacy.py")

    assert len(rules) == 1
    rule = rules[0]

    assert rule.function_name == "calculate_penalty"
    assert rule.source_file == "banking_legacy.py"
    assert rule.start_line == 2
    assert rule.end_line == 4
    assert rule.observed_condition == "balance < 1000"
    assert "50" in rule.observed_behavior
    assert "0" in rule.observed_behavior
    assert rule.evidence_status == EvidenceStatus.OBSERVED_IN_CODE
    assert rule.is_approved_policy is False
    assert "not an approved business policy" in rule.uncertainty_explanation


def test_finding_id_stability():
    code = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""
    rules_run1 = extract_rules_from_source(code, file_path="banking_legacy.py")
    rules_run2 = extract_rules_from_source(code, file_path="banking_legacy.py")

    assert len(rules_run1) == 1
    assert len(rules_run2) == 1
    # Finding ID must be completely stable across multiple executions
    assert rules_run1[0].finding_id == rules_run2[0].finding_id
    assert rules_run1[0].finding_id.startswith("BR-calculate_penalty-L2-")


def test_multiple_conditions_extraction():
    code = """def fee_tier(tier, amount):
    if tier == "GOLD":
        return 0
    if amount > 5000:
        return 10
    return 20
"""
    rules = extract_rules_from_source(code, file_path="tiers.py")

    assert len(rules) == 2
    conds = [r.observed_condition for r in rules]
    assert "tier == 'GOLD'" in conds
    assert "amount > 5000" in conds
    for r in rules:
        assert r.is_approved_policy is False
        assert r.evidence_status == EvidenceStatus.OBSERVED_IN_CODE


def test_syntax_error_returns_empty_candidates():
    bad_code = "def bad_func():\n   if x <"
    rules = extract_rules_from_source(bad_code, file_path="bad.py")
    assert rules == []
