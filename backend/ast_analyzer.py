"""Finds business-rule candidates in Python source using the ast module.

The source is parsed, never executed. Every candidate points at a real line.
"""
import ast
from dataclasses import dataclass
from typing import Optional


@dataclass
class RuleCandidate:
    function: str
    file: str
    line: int
    condition: str
    returns_if_true: Optional[str]
    returns_otherwise: Optional[str]


def _is_comparison(test):
    return any(isinstance(node, ast.Compare) for node in ast.walk(test))


def _returned_constant(stmt):
    if isinstance(stmt, ast.Return) and isinstance(stmt.value, ast.Constant):
        return repr(stmt.value.value)
    return None


def _outcomes(function, index, node):
    """Constants returned when the condition is true, and when it is false."""
    true_value = _returned_constant(node.body[-1]) if node.body else None
    if node.orelse:
        false_value = _returned_constant(node.orelse[-1])
    elif index + 1 < len(function.body):
        false_value = _returned_constant(function.body[index + 1])
    else:
        false_value = None
    return true_value, false_value


def _calls_within(function, known_functions):
    called = set()
    for node in ast.walk(function):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in known_functions and node.func.id != function.name:
                called.add(node.func.id)
    return sorted(called)


def analyze_python(file_name, source):
    """Parse one Python file. Returns its rule candidates and function calls.

    Raises SyntaxError if the file cannot be parsed.
    """
    tree = ast.parse(source, filename=file_name)
    functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
    known = {function.name for function in functions}

    rules = []
    dependencies = {}
    seen = set()
    for function in functions:
        dependencies[function.name] = _calls_within(function, known)
        top_level = {id(stmt): index for index, stmt in enumerate(function.body)}
        for node in ast.walk(function):
            if not isinstance(node, ast.If) or id(node) in seen or not _is_comparison(node.test):
                continue
            seen.add(id(node))
            true_value, false_value = None, None
            if id(node) in top_level:
                true_value, false_value = _outcomes(function, top_level[id(node)], node)
            rules.append(RuleCandidate(
                function=function.name,
                file=file_name,
                line=node.lineno,
                condition=ast.get_source_segment(source, node.test),
                returns_if_true=true_value,
                returns_otherwise=false_value,
            ))

    rules.sort(key=lambda rule: rule.line)
    return {"rules": rules, "dependencies": dependencies}
