"""COBOL source profile: programs, data items, unsupported constructs and inconsistencies.

Line-based and generic. Works on any uploaded COBOL source and never executes it.
Anything not recognized is reported as unsupported, never guessed.
"""
import re
from collections import defaultdict

PROGRAM_ID = re.compile(r"^PROGRAM-ID\.\s*([A-Za-z0-9-]+)", re.IGNORECASE)
DATA_ITEM = re.compile(r"^(\d{2})\s+([A-Za-z0-9-]+)\b(.*)$")
PIC = re.compile(r"\bPIC(?:TURE)?\s+(?:IS\s+)?(\S+)", re.IGNORECASE)
USAGE = re.compile(r"\b(COMP-3|COMP-5|COMP|BINARY|PACKED-DECIMAL|DISPLAY)\b", re.IGNORECASE)
COPY = re.compile(r"^COPY\s+([A-Za-z0-9-]+)", re.IGNORECASE)

UNSUPPORTED = [
    ("GO TO", re.compile(r"\bGO\s+TO\b", re.IGNORECASE)),
    ("ALTER", re.compile(r"^ALTER\b", re.IGNORECASE)),
    ("EXEC SQL", re.compile(r"\bEXEC\s+SQL\b", re.IGNORECASE)),
    ("REDEFINES", re.compile(r"\bREDEFINES\b", re.IGNORECASE)),
]


def _clean(raw):
    line = raw[6:] if len(raw) > 6 and raw[:6].strip().isdigit() else raw
    if "*>" in line:
        line = line.split("*>", 1)[0]
    return line.strip()


def _is_comment(raw):
    return (len(raw) > 6 and raw[6] == "*") or raw.lstrip().startswith("*")


def profile_cobol(file_name, source):
    """Return programs, data items, copy statements and unsupported constructs for one file."""
    programs = []
    variables = []
    copies = []
    unsupported = []
    in_data = False
    in_procedure = False

    for number, raw in enumerate(source.splitlines(), 1):
        if _is_comment(raw):
            continue
        text = _clean(raw)
        if not text:
            continue

        if re.match(r"^DATA\s+DIVISION\b", text, re.IGNORECASE):
            in_data, in_procedure = True, False
            continue
        if re.match(r"^PROCEDURE\s+DIVISION\b", text, re.IGNORECASE):
            in_data, in_procedure = False, True
            continue

        program = PROGRAM_ID.match(text)
        if program:
            programs.append({"name": program.group(1), "line": number})

        copy = COPY.match(text)
        if copy:
            copies.append({"copybook": copy.group(1), "line": number})

        if in_data:
            item = DATA_ITEM.match(text)
            if item:
                rest = item.group(3)
                pic = PIC.search(rest)
                usage = USAGE.search(rest)
                variables.append({
                    "name": item.group(2),
                    "level": int(item.group(1)),
                    "pic": pic.group(1).rstrip(".") if pic else None,
                    "usage": usage.group(1).upper() if usage else "DISPLAY",
                    "line": number,
                    "file": file_name,
                })

        if in_procedure:
            for construct, pattern in UNSUPPORTED:
                if pattern.search(text):
                    unsupported.append({"construct": construct, "line": number, "text": text, "file": file_name})

    return {
        "file": file_name,
        "lines": len(source.splitlines()),
        "programs": programs,
        "variables": variables,
        "copies": copies,
        "unsupported": unsupported,
    }


def find_inconsistencies(profiles):
    """Same data-item name declared with different PIC or USAGE in different places."""
    declarations = defaultdict(list)
    for profile in profiles:
        for var in profile["variables"]:
            declarations[var["name"]].append(var)

    issues = []
    for name, items in declarations.items():
        shapes = {(v["pic"], v["usage"]) for v in items}
        if len(shapes) > 1:
            issues.append({
                "item": name,
                "detail": "declared with different PIC/USAGE: "
                          + "; ".join(f"{v['file']}:{v['line']} PIC {v['pic']} {v['usage']}" for v in items),
            })
    return issues
