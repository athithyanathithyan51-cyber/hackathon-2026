from legacyiq_engine.analyzer.cobol_profile import find_inconsistencies, profile_cobol

# Generic COBOL written for these tests. Not taken from any project.
MAIN = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. LEDGER.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-TOTAL     PIC S9(9)V99 COMP-3.
       01 WS-CODE      PIC X(2).
       PROCEDURE DIVISION.
       MAIN-PARA.
           IF WS-CODE = 'AA'
              GO TO OTHER-PARA
           END-IF
           EXEC SQL SELECT 1 FROM DUAL END-EXEC
           STOP RUN.
       OTHER-PARA.
           STOP RUN.
"""

OTHER = """\
       IDENTIFICATION DIVISION.
       PROGRAM-ID. AUDIT.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-TOTAL     PIC 9(9)V99.
       PROCEDURE DIVISION.
       AUDIT-PARA.
           STOP RUN.
"""


def test_programs_and_data_items_are_listed_with_pic_and_usage():
    profile = profile_cobol("ledger.cbl", MAIN)
    assert [p["name"] for p in profile["programs"]] == ["LEDGER"]
    total = next(v for v in profile["variables"] if v["name"] == "WS-TOTAL")
    assert total["pic"] == "S9(9)V99"
    assert total["usage"] == "COMP-3"
    assert total["line"] == 5


def test_unsupported_constructs_are_reported_with_line_numbers():
    profile = profile_cobol("ledger.cbl", MAIN)
    found = {(u["construct"], u["line"]) for u in profile["unsupported"]}
    assert ("GO TO", 10) in found
    assert ("EXEC SQL", 12) in found


def test_copy_statements_are_listed():
    profile = profile_cobol("ledger.cbl", "       COPY ACCOUNTS.\n" + MAIN)
    assert profile["copies"] == [{"copybook": "ACCOUNTS", "line": 1}]


def test_same_item_with_different_shape_is_an_inconsistency():
    profiles = [profile_cobol("ledger.cbl", MAIN), profile_cobol("audit.cbl", OTHER)]
    issues = find_inconsistencies(profiles)
    assert [i["item"] for i in issues] == ["WS-TOTAL"]
    assert "COMP-3" in issues[0]["detail"] and "DISPLAY" in issues[0]["detail"]


def test_identical_declarations_are_not_inconsistent():
    profiles = [profile_cobol("a.cbl", MAIN), profile_cobol("b.cbl", MAIN)]
    assert find_inconsistencies(profiles) == []
