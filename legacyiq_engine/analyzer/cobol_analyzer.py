"""Generic, line-based COBOL analyzer.

Works on any COBOL source the user uploads. No project names are hardcoded.
The source is read as text and never compiled or executed.

Recognized subset:
- Paragraphs in the PROCEDURE DIVISION (treated as functions).
- IF and WHEN conditions, with their line numbers.
- PERFORM and CALL (treated as calls).

A COBOL MOVE is an assignment, not a return, so it is not reported as a return value.
Anything else is left out. Full COBOL grammar is not attempted, so a construct we
do not recognize is never guessed at.
"""
import re

from legacyiq_engine.models.schemas import (
    ASTAnalysisResult,
    CodeCondition,
    CodeFunction,
    CodeFunctionCall,
)

PARAGRAPH = re.compile(r"^([A-Za-z0-9][A-Za-z0-9-]*)\.$")
IF_STATEMENT = re.compile(r"^IF\s+(.+)$", re.IGNORECASE)
WHEN_STATEMENT = re.compile(r"^WHEN\s+(.+)$", re.IGNORECASE)
PERFORM = re.compile(r"\bPERFORM\s+([A-Za-z0-9][A-Za-z0-9-]*)", re.IGNORECASE)
CALL = re.compile(r"\bCALL\s+['\"]?([A-Za-z0-9-]+)['\"]?", re.IGNORECASE)

NOT_PARAGRAPH_WORDS = {
    "DIVISION", "SECTION", "ELSE", "OTHER", "CONTINUE", "EXIT", "GOBACK", "NEXT",
    "END-IF", "END-EVALUATE", "END-PERFORM", "END-READ", "END-CALL", "END-WRITE",
}
NOT_PERFORM_TARGETS = {"UNTIL", "VARYING", "TIMES", "WITH", "TEST", "INLINE"}


def _clean(raw):
    """Remove the sequence area (columns 1-6) and inline comments, then trim."""
    line = raw[6:] if len(raw) > 6 and raw[:6].strip().isdigit() else raw
    if "*>" in line:
        line = line.split("*>", 1)[0]
    return line.strip()


def _is_comment(raw):
    """Fixed-format comments have '*' in column 7. Free-format comments start with '*'."""
    return len(raw) > 6 and raw[6] == "*" or raw.lstrip().startswith("*")


def _clean_condition(text):
    text = text.strip()
    if text.endswith("."):
        text = text[:-1].rstrip()
    if text.upper().endswith(" THEN"):
        text = text[:-5].rstrip()
    return text


def analyze_cobol(file_path, source):
    """Parse one COBOL source file. Returns an ASTAnalysisResult.

    Sets syntax_valid to False when no PROCEDURE DIVISION is found, so the caller
    can report it instead of silently returning nothing.
    """
    lines = source.splitlines()
    functions = []
    current = None
    in_procedure = False

    def close_current(last_line):
        if current is not None:
            current.end_line = last_line
            functions.append(current)

    for number, raw in enumerate(lines, 1):
        if _is_comment(raw):
            continue
        text = _clean(raw)
        if not text:
            continue

        if re.match(r"^PROCEDURE\s+DIVISION\b", text, re.IGNORECASE):
            in_procedure = True
            continue
        if not in_procedure:
            continue

        paragraph = PARAGRAPH.match(text)
        if paragraph and paragraph.group(1).upper() not in NOT_PARAGRAPH_WORDS:
            close_current(number - 1)
            current = CodeFunction(name=paragraph.group(1), start_line=number, end_line=number)
            continue
        if current is None:
            continue

        when = WHEN_STATEMENT.match(text)
        if when and when.group(1).strip().upper() != "OTHER":
            current.conditions.append(CodeCondition(
                condition_text=_clean_condition(when.group(1)),
                line_number=number,
                condition_type="when",
            ))
            continue

        statement_if = IF_STATEMENT.match(text)
        if statement_if:
            current.conditions.append(CodeCondition(
                condition_text=_clean_condition(statement_if.group(1)),
                line_number=number,
                condition_type="if",
            ))

        for target in PERFORM.findall(text):
            if target.upper() not in NOT_PERFORM_TARGETS and not target.isdigit():
                current.calls.append(CodeFunctionCall(callee_name=target, line_number=number))
        for program in CALL.findall(text):
            current.calls.append(CodeFunctionCall(callee_name=f"CALL:{program}", line_number=number))

    close_current(len(lines))

    if not in_procedure:
        return ASTAnalysisResult(
            file_path=file_path,
            total_lines=len(lines),
            syntax_valid=False,
            error_message=f"{file_path}: no PROCEDURE DIVISION found",
        )

    paragraph_names = {function.name for function in functions}
    dependencies = {}
    for function in functions:
        function.called_internal_functions = sorted({
            call.callee_name for call in function.calls if call.callee_name in paragraph_names
        })
        dependencies[function.name] = sorted({call.callee_name for call in function.calls})

    return ASTAnalysisResult(
        file_path=file_path,
        functions=functions,
        total_lines=len(lines),
        dependencies=dependencies,
        syntax_valid=True,
    )
