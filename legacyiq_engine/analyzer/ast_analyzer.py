"""Safe Python source code analyzer using the Python Standard Library AST module.

Rules:
1. Source is parsed, NEVER executed.
2. Syntax errors are caught and returned safely without raising unhandled exceptions.
3. Every finding preserves accurate line numbers from the original source.
"""
from __future__ import annotations

import ast
from typing import Any, Optional

from legacyiq_engine.models.schemas import (
    ASTAnalysisResult,
    CodeClass,
    CodeComparison,
    CodeCondition,
    CodeFunction,
    CodeFunctionCall,
    CodeParameter,
    CodeReturn,
)


def _safe_unparse(node: Optional[ast.AST]) -> Optional[str]:
    """Safely convert an AST node to source text representation."""
    if node is None:
        return None
    try:
        return ast.unparse(node)
    except Exception:
        return None


def _operator_symbol(op: ast.AST) -> str:
    """Return standard string symbol for comparison operators."""
    op_map = {
        ast.Eq: "==",
        ast.NotEq: "!=",
        ast.Lt: "<",
        ast.LtE: "<=",
        ast.Gt: ">",
        ast.GtE: ">=",
        ast.Is: "is",
        ast.IsNot: "is not",
        ast.In: "in",
        ast.NotIn: "not in",
    }
    return op_map.get(type(op), type(op).__name__)


class _FunctionExtractor(ast.NodeVisitor):
    """Walks the AST to safely extract functions, classes, and statements."""

    def __init__(self, source_code: str, file_path: str):
        self.source_code = source_code
        self.file_path = file_path
        self.functions: list[CodeFunction] = []
        self.classes: list[CodeClass] = []
        self.known_function_names: set[str] = set()
        self._current_class: Optional[str] = None

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        prev_class = self._current_class
        self._current_class = node.name

        base_classes = [_safe_unparse(base) or "" for base in node.bases]
        methods = [
            n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]

        docstring = ast.get_docstring(node)
        self.classes.append(
            CodeClass(
                name=node.name,
                start_line=node.lineno,
                end_line=getattr(node, "end_lineno", node.lineno),
                docstring=docstring,
                base_classes=base_classes,
                methods=methods,
            )
        )

        self.generic_visit(node)
        self._current_class = prev_class

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._extract_function(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._extract_function(node)

    def _extract_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        self.known_function_names.add(node.name)

        # 1. Parameters
        parameters: list[CodeParameter] = []
        all_args = node.args.posonlyargs + node.args.args
        defaults_offset = len(all_args) - len(node.args.defaults)

        for i, arg in enumerate(all_args):
            default_val = None
            if i >= defaults_offset:
                default_idx = i - defaults_offset
                default_val = _safe_unparse(node.args.defaults[default_idx])

            annotation_str = _safe_unparse(arg.annotation) if arg.annotation else None
            parameters.append(
                CodeParameter(
                    name=arg.arg,
                    type_annotation=annotation_str,
                    default_value=default_val,
                )
            )

        if node.args.vararg:
            parameters.append(
                CodeParameter(
                    name=f"*{node.args.vararg.arg}",
                    type_annotation=_safe_unparse(node.args.vararg.annotation),
                )
            )

        if node.args.kwarg:
            parameters.append(
                CodeParameter(
                    name=f"**{node.args.kwarg.arg}",
                    type_annotation=_safe_unparse(node.args.kwarg.annotation),
                )
            )

        # 2. Conditions, Returns, and Function Calls inside this function
        conditions: list[CodeCondition] = []
        returns: list[CodeReturn] = []
        calls: list[CodeFunctionCall] = []

        for subnode in ast.walk(node):
            # Skip nested functions/classes when collecting inner statements
            if subnode is not node and isinstance(subnode, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                continue

            # Conditions
            if isinstance(subnode, (ast.If, ast.While)):
                cond_type = "if" if isinstance(subnode, ast.If) else "while"
                cond_text = _safe_unparse(subnode.test) or ""
                comparisons: list[CodeComparison] = []

                for cmp_node in ast.walk(subnode.test):
                    if isinstance(cmp_node, ast.Compare):
                        left_str = _safe_unparse(cmp_node.left) or ""
                        for op, right_node in zip(cmp_node.ops, cmp_node.comparators):
                            op_str = _operator_symbol(op)
                            right_str = _safe_unparse(right_node) or ""
                            comparisons.append(
                                CodeComparison(
                                    left=left_str,
                                    operator=op_str,
                                    right=right_str,
                                    line_number=cmp_node.lineno,
                                )
                            )

                conditions.append(
                    CodeCondition(
                        condition_text=cond_text,
                        line_number=subnode.lineno,
                        condition_type=cond_type,
                        comparisons=comparisons,
                    )
                )

            # Returns
            elif isinstance(subnode, ast.Return):
                val_repr = _safe_unparse(subnode.value) if subnode.value is not None else None
                is_const = isinstance(subnode.value, ast.Constant)
                returns.append(
                    CodeReturn(
                        value_repr=val_repr,
                        line_number=subnode.lineno,
                        is_constant=is_const,
                    )
                )

            # Calls
            elif isinstance(subnode, ast.Call):
                callee = _safe_unparse(subnode.func) or "unknown"
                arg_strs = [_safe_unparse(a) or "" for a in subnode.args]
                calls.append(
                    CodeFunctionCall(
                        callee_name=callee,
                        line_number=subnode.lineno,
                        arguments=arg_strs,
                    )
                )

        # Sort extracted items by line number
        conditions.sort(key=lambda c: c.line_number)
        returns.sort(key=lambda r: r.line_number)
        calls.sort(key=lambda c: c.line_number)

        self.functions.append(
            CodeFunction(
                name=node.name,
                class_name=self._current_class,
                parameters=parameters,
                start_line=node.lineno,
                end_line=getattr(node, "end_lineno", node.lineno),
                docstring=ast.get_docstring(node),
                conditions=conditions,
                returns=returns,
                calls=calls,
            )
        )

        # Continue traversing inner definitions if any
        self.generic_visit(node)


def analyze_source(source_code: str, file_path: str = "source.py") -> ASTAnalysisResult:
    """Analyze Python source code safely without executing it.

    Parameters:
        source_code: Raw Python code string.
        file_path: Optional display path for the source file.

    Returns:
        ASTAnalysisResult containing extracted classes, functions, conditions,
        returns, calls, and internal dependency links.
    """
    total_lines = len(source_code.splitlines()) if source_code else 0

    try:
        tree = ast.parse(source_code, filename=file_path)
    except SyntaxError as err:
        return ASTAnalysisResult(
            file_path=file_path,
            functions=[],
            classes=[],
            total_lines=total_lines,
            dependencies={},
            syntax_valid=False,
            error_message=f"SyntaxError in {file_path} line {err.lineno}: {err.msg}",
        )

    extractor = _FunctionExtractor(source_code=source_code, file_path=file_path)
    extractor.visit(tree)

    # Resolve internal function-call dependencies
    dependencies: dict[str, list[str]] = {}
    known_names = extractor.known_function_names

    for func in extractor.functions:
        called_internals: list[str] = []
        for call in func.calls:
            if call.callee_name in known_names and call.callee_name != func.name:
                if call.callee_name not in called_internals:
                    called_internals.append(call.callee_name)
        func.called_internal_functions = called_internals
        dependencies[func.name] = called_internals

    return ASTAnalysisResult(
        file_path=file_path,
        functions=extractor.functions,
        classes=extractor.classes,
        total_lines=total_lines,
        dependencies=dependencies,
        syntax_valid=True,
        error_message=None,
    )
