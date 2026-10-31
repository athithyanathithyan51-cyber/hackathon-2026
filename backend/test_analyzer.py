import pytest

from ast_analyzer import analyze_python

PENALTY = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""


def test_extracts_penalty_rule_with_line_number():
    result = analyze_python("billing.py", PENALTY)
    assert len(result["rules"]) == 1
    rule = result["rules"][0]
    assert rule.function == "calculate_penalty"
    assert rule.line == 2
    assert rule.condition == "balance < 1000"
    assert rule.returns_if_true == "50"
    assert rule.returns_otherwise == "0"


def test_module_level_code_is_not_executed():
    source = 'raise RuntimeError("must never run")\n' + PENALTY
    result = analyze_python("billing.py", source)
    assert len(result["rules"]) == 1


def test_function_calls_are_dependencies():
    source = """def fee(balance):
    return calculate_penalty(balance)


def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""
    result = analyze_python("billing.py", source)
    assert result["dependencies"]["fee"] == ["calculate_penalty"]


def test_syntax_error_is_raised():
    with pytest.raises(SyntaxError):
        analyze_python("bad.py", "def broken(:\n")
