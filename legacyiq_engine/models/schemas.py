"""Data models and Pydantic schemas for the LegacyIQ Data/AI Engine.

These schemas define the data contracts between the AST parser, business-rule
extractor, AI interpreter, evidence matcher, risk assessor, regression test
generator, and the history store.

Strict Principle: Code facts (AST) are separated from unverified business interpretations.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class EvidenceStatus(str, Enum):
    OBSERVED_IN_CODE = "OBSERVED_IN_CODE"
    SUPPORTED_BY_EVIDENCE = "SUPPORTED_BY_EVIDENCE"
    CONFLICTED_BY_EVIDENCE = "CONFLICTED_BY_EVIDENCE"
    UNCERTAIN_EVIDENCE = "UNCERTAIN_EVIDENCE"


class RelationshipStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    CONFLICTED = "CONFLICTED"
    UNCERTAIN = "UNCERTAIN"


class RiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# 1. AST Analysis Schemas
# ---------------------------------------------------------------------------

class CodeParameter(BaseModel):
    name: str
    type_annotation: Optional[str] = None
    default_value: Optional[str] = None


class CodeComparison(BaseModel):
    left: str
    operator: str
    right: str
    line_number: int


class CodeCondition(BaseModel):
    condition_text: str
    line_number: int
    condition_type: str = "if"  # if, elif, while
    comparisons: list[CodeComparison] = Field(default_factory=list)


class CodeReturn(BaseModel):
    value_repr: Optional[str] = None
    line_number: int
    is_constant: bool = False


class CodeFunctionCall(BaseModel):
    callee_name: str
    line_number: int
    arguments: list[str] = Field(default_factory=list)


class CodeFunction(BaseModel):
    name: str
    class_name: Optional[str] = None
    parameters: list[CodeParameter] = Field(default_factory=list)
    start_line: int
    end_line: int
    docstring: Optional[str] = None
    conditions: list[CodeCondition] = Field(default_factory=list)
    returns: list[CodeReturn] = Field(default_factory=list)
    calls: list[CodeFunctionCall] = Field(default_factory=list)
    called_internal_functions: list[str] = Field(default_factory=list)


class CodeClass(BaseModel):
    name: str
    start_line: int
    end_line: int
    docstring: Optional[str] = None
    base_classes: list[str] = Field(default_factory=list)
    methods: list[str] = Field(default_factory=list)


class ASTAnalysisResult(BaseModel):
    file_path: str
    functions: list[CodeFunction] = Field(default_factory=list)
    classes: list[CodeClass] = Field(default_factory=list)
    total_lines: int = 0
    dependencies: dict[str, list[str]] = Field(default_factory=dict)
    syntax_valid: bool = True
    error_message: Optional[str] = None


# ---------------------------------------------------------------------------
# 2. Business-Rule Extraction Schemas
# ---------------------------------------------------------------------------

class BusinessRuleCandidate(BaseModel):
    finding_id: str = Field(description="Stable finding ID computed deterministically")
    function_name: str
    business_rule_description: str
    observed_condition: str
    observed_behavior: str
    source_file: str
    start_line: int
    end_line: int
    evidence_status: EvidenceStatus = EvidenceStatus.OBSERVED_IN_CODE
    uncertainty_explanation: str = "Code behavior extracted from AST; business policy not yet independently verified."
    version: int = 1
    is_approved_policy: bool = False
    is_obsolete_candidate: bool = False


# ---------------------------------------------------------------------------
# 3. AI Interpretation Schemas
# ---------------------------------------------------------------------------

class AIInterpretation(BaseModel):
    finding_id: str
    business_explanation: str
    possible_business_significance: str
    evidence_summary: str
    uncertainty_explanation: str
    questions_for_human_validation: list[str] = Field(default_factory=list)
    model_used: str = "deterministic-fallback"
    is_fallback: bool = False


# ---------------------------------------------------------------------------
# 4. Evidence Matching Schemas
# ---------------------------------------------------------------------------

class EvidenceArtifact(BaseModel):
    evidence_id: str
    title: str = ""
    content: str
    artifact_type: str = "incident"  # incident, change_request, business_doc, ticket
    source_reference: Optional[str] = None


class EvidenceMatchResult(BaseModel):
    evidence_id: str
    finding_id: str
    relationship_status: RelationshipStatus
    explanation: str
    source_reference: str
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    missing_conditions_detected: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# 5. Risk Assessment Schemas
# ---------------------------------------------------------------------------

class RiskFactor(BaseModel):
    factor_name: str
    impact_score: float
    description: str


class RiskAssessment(BaseModel):
    finding_id: str
    risk_score: float = Field(ge=0.0, le=100.0)
    risk_category: RiskCategory
    factors: list[RiskFactor] = Field(default_factory=list)
    explanation: str
    recommended_action: str
    heuristic_disclaimer: str = (
        "Heuristic score based on observable code & unapproved evidence; not a validated probability."
    )


# ---------------------------------------------------------------------------
# 6. Regression Test Suggestion Schemas
# ---------------------------------------------------------------------------

class TestCaseSuggestion(BaseModel):
    test_id: str
    function_name: str
    input_parameters: dict[str, Any]
    boundary_type: str  # BELOW, EXACT, ABOVE, EXCEPTION_CONDITION, PARTITION
    expected_code_behavior: str
    business_expectation_note: str
    requires_human_validation: bool = True
    rationale: str


class RegressionTestSuiteSuggestion(BaseModel):
    finding_id: str
    function_name: str
    suggestions: list[TestCaseSuggestion] = Field(default_factory=list)
    disclaimer: str = (
        "Auto-generated regression test suggestions derived from AST conditions and evidence. "
        "These have NOT been executed; code-derived expectations must be validated by business owners."
    )


# ---------------------------------------------------------------------------
# 7. History & Reassessment Schemas
# ---------------------------------------------------------------------------

class FindingVersion(BaseModel):
    version: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    finding: BusinessRuleCandidate
    risk_assessment: Optional[RiskAssessment] = None
    interpretation: Optional[AIInterpretation] = None
    evidence_matches: list[EvidenceMatchResult] = Field(default_factory=list)
    change_reason: str = "Initial extraction"


class ReassessmentResult(BaseModel):
    finding_id: str
    previous_version: int
    new_version: int
    updated_finding: BusinessRuleCandidate
    new_evidence_matches: list[EvidenceMatchResult] = Field(default_factory=list)
    updated_risk: RiskAssessment
    updated_tests: RegressionTestSuiteSuggestion
    reason_for_change: str
