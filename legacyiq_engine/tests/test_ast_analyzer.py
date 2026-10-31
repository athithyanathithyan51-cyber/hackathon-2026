"""Tests for the safe Python AST analyzer."""
import pytest
from legacyiq_engine.analyzer.ast_analyzer import analyze_source


def test_analyze_valid_banking_legacy():
    code = """def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0
"""
    result = analyze_source(code, file_path="banking_legacy.py")

    assert result.syntax_valid is True
    assert result.error_message is None
    assert len(result.functions) == 1

    func = result.functions[0]
    assert func.name == "calculate_penalty"
    assert len(func.parameters) == 1
    assert func.parameters[0].name == "balance"

    # Line numbers: function starts at line 1
    assert func.start_line == 1
    assert func.end_line == 4

    # Conditions
    assert len(func.conditions) == 1
    cond = func.conditions[0]
    assert cond.condition_text == "balance < 1000"
    assert cond.line_number == 2
    assert len(cond.comparisons) == 1
    assert cond.comparisons[0].left == "balance"
    assert cond.comparisons[0].operator == "<"
    assert cond.comparisons[0].right == "1000"

    # Returns
    assert len(func.returns) == 2
    assert func.returns[0].value_repr == "50"
    assert func.returns[0].line_number == 3
    assert func.returns[0].is_constant is True

    assert func.returns[1].value_repr == "0"
    assert func.returns[1].line_number == 4
    assert func.returns[1].is_constant is True


def test_analyze_syntax_error_handled_safely():
    bad_code = """def broken_function(x):
    if x <
        return 1
"""
    result = analyze_source(bad_code, file_path="broken.py")

    assert result.syntax_valid is False
    assert result.error_message is not None
    assert "SyntaxError in broken.py line" in result.error_message
    assert len(result.functions) == 0


def test_parameter_extraction_with_types_and_defaults():
    code = """def process_account(account_id: str, balance: float = 0.0, *flags, **extra):
    return True
"""
    result = analyze_source(code, file_path="account.py")

    assert result.syntax_valid is True
    func = result.functions[0]
    param_names = [p.name for p in func.parameters]
    assert param_names == ["account_id", "balance", "*flags", "**extra"]

    assert func.parameters[0].type_annotation == "str"
    assert func.parameters[1].default_value == "0.0"
    assert func.parameters[1].type_annotation == "float"


def test_dependency_mapping():
    code = """def fetch_balance(acc_id):
    return 1500

def apply_fee(acc_id):
    bal = fetch_balance(acc_id)
    if bal < 1000:
        return 25
    return 0
"""
    result = analyze_source(code, file_path="fees.py")

    assert result.syntax_valid is True
    assert "apply_fee" in result.dependencies
    assert "fetch_balance" in result.dependencies["apply_fee"]
    assert result.dependencies["fetch_balance"] == []


def test_class_and_method_extraction():
    code = """class AccountService(BaseService):
    '''Service for handling banking accounts.'''
    def get_tier(self, score):
        if score > 750:
            return "GOLD"
        return "STANDARD"
"""
    result = analyze_source(code, file_path="service.py")

    assert result.syntax_valid is True
    assert len(result.classes) == 1
    cls = result.classes[0]
    assert cls.name == "AccountService"
    assert cls.base_classes == ["BaseService"]
    assert cls.docstring == "Service for handling banking accounts."
    assert "get_tier" in cls.methods

    assert len(result.functions) == 1
    method = result.functions[0]
    assert method.name == "get_tier"
    assert method.class_name == "AccountService"


def test_never_executes_source_code():
    # A dangerous command that would raise an exception or fail if executed
    code = """def harmless_signature():
    raise SystemExit("Should NEVER execute!")
"""
    result = analyze_source(code, file_path="dangerous.py")
    assert result.syntax_valid is True
    assert len(result.functions) == 1
    assert result.functions[0].name == "harmless_signature"
