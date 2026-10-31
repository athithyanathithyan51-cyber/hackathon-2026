from legacyiq_engine.analyzer.cobol_analyzer import analyze_cobol
from legacyiq_engine.analyzer.rule_extractor import extract_rule_candidates

# Small generic COBOL program written for this test. It is not taken from any project.
SOURCE = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. FEE-CALC.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-BALANCE  PIC 9(7)V99.
       PROCEDURE DIVISION.
      * Charge a fee when the balance is low
       MAIN-PARA.
           PERFORM CHECK-BALANCE
           CALL 'AUDIT-LOG'
           STOP RUN.
       CHECK-BALANCE.
           IF WS-BALANCE < 1000
              DISPLAY 'Low balance'
           END-IF
           EVALUATE WS-BALANCE
              WHEN 0
                 DISPLAY 'Empty'
              WHEN OTHER
                 DISPLAY 'Has funds'
           END-EVALUATE.
"""


def test_paragraphs_become_functions_with_line_ranges():
    result = analyze_cobol("fee.cbl", SOURCE)
    assert result.syntax_valid is True
    names = [f.name for f in result.functions]
    assert names == ["MAIN-PARA", "CHECK-BALANCE"]
    assert result.functions[1].start_line == 12


def test_if_and_when_conditions_keep_real_line_numbers():
    result = analyze_cobol("fee.cbl", SOURCE)
    check = result.functions[1]
    assert [(c.condition_type, c.condition_text, c.line_number) for c in check.conditions] == [
        ("if", "WS-BALANCE < 1000", 13),
        ("when", "0", 17),
    ]


def test_comment_lines_are_ignored():
    commented = SOURCE.replace("      * Charge a fee when the balance is low",
                               "      * IF WS-BALANCE > 1 THEN")
    result = analyze_cobol("fee.cbl", commented)
    assert all(c.condition_text != "WS-BALANCE > 1" for f in result.functions for c in f.conditions)


def test_perform_and_call_become_dependencies():
    result = analyze_cobol("fee.cbl", SOURCE)
    assert result.dependencies["MAIN-PARA"] == ["CALL:AUDIT-LOG", "CHECK-BALANCE"]
    assert result.functions[0].called_internal_functions == ["CHECK-BALANCE"]


def test_program_without_procedure_division_is_reported_not_guessed():
    result = analyze_cobol("copy.cpy", "       01 ACCOUNT-RECORD.\n           05 ACC-NUMBER PIC 9(10).\n")
    assert result.syntax_valid is False
    assert "no PROCEDURE DIVISION" in result.error_message


def test_conditions_become_business_rule_candidates():
    result = analyze_cobol("fee.cbl", SOURCE)
    candidates = extract_rule_candidates(result)
    lines = {c.start_line for c in candidates}
    assert 13 in lines
    assert all(c.is_approved_policy is False for c in candidates)
