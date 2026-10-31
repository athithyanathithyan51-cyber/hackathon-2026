# LegacyIQ — Data & AI Engine

**Author:** Nagulan (Data / AI Engineer)  
**Challenge:** Challenge 03 — Autonomous Legacy Modernization Agent  
**Module:** `legacyiq_engine` (Independent Data & AI Subsystem)

---

## 1. Subsystem Overview & Responsibilities

The `legacyiq_engine` provides an evidence-driven analysis and adaptive reasoning engine for legacy modernization. It is built as a modular, importable Python library that the backend developer (Athithyan) can directly plug into the FastAPI endpoints without running competing servers or violating role boundaries.

### Team Role Boundaries:
- **Athithyan (Backend Lead):** Main FastAPI app, endpoint routing (`/api/analyses`, `/api/projects`), and Git merges.
- **Nishanth (Frontend):** React components, Tailwind styling, visual graphs.
- **Nagulan (Data/AI - this engine):** Safe AST code analysis, rule extraction, AI interpretation, evidence correlation, adaptive reassessment, heuristic risk assessment, and regression test generation.

---

## 2. Core Governance Principles

1. **Zero Code Execution:** Uploaded legacy code is parsed strictly using Python Standard Library `ast.parse()`; it is NEVER executed or evaluated.
2. **Static Analysis States Facts, AI Explains Them:** Line numbers, conditions, and return values are verified mathematical AST facts. AI models provide hypotheses and human questions—they never invent or alter code facts.
3. **No Automatic Source Modification:** The engine observes and correlates; it does not rewrite or delete legacy code.
4. **Code $\ne$ Approved Business Policy:** Extracted rules start with `is_approved_policy = False`.
5. **Incidents $\ne$ Policy:** Incidents establish operational conflict and discrepancy; they require human validation to become approved policy.
6. **Immutable History:** When new evidence arrives, findings increment to version 2, 3, etc. Previous baseline versions are NEVER overwritten.
7. **Transparent Heuristics:** Risk scores explain their contributory factors and carry explicit disclaimers: they are not statistical probabilities.

---

## 3. Backend Integration Guide (For FastAPI Lead)

All engine functions are pure Python functions that accept primitive types or Pydantic models and return Pydantic v2 validated schemas.

### Primary Entry Points:

```python
from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.analyzer.rule_extractor import extract_rules_from_source, extract_rule_candidates
from legacyiq_engine.intelligence.evidence_matcher import match_evidence_to_rules
from legacyiq_engine.intelligence.reassessment import initialize_finding_version, reassess_finding_with_evidence
from legacyiq_engine.assessment.risk_assessor import assess_risk
from legacyiq_engine.assessment.test_generator import generate_test_suggestions
from legacyiq_engine.storage.history_store import HistoryStore
```

### FastAPI Integration Example (Plug-and-Play):

```python
# In backend/main.py (Backend lead can import directly):
from fastapi import FastAPI, HTTPException
from legacyiq_engine.analyzer.ast_analyzer import analyze_source
from legacyiq_engine.analyzer.rule_extractor import extract_rule_candidates
from legacyiq_engine.intelligence.reassessment import reassess_finding_with_evidence, initialize_finding_version

app = FastAPI()

@app.post("/api/analyses/{id}/evidence")
def upload_evidence(id: str, evidence_text: str, finding_id: str):
    reassessment = reassess_finding_with_evidence(
        finding_id=finding_id,
        evidence_text=evidence_text,
        source_reference=f"analysis_{id}_upload.txt"
    )
    if not reassessment:
        raise HTTPException(status_code=404, detail="Finding not found or evidence unrelated")
    return reassessment.model_dump()
```

---

## 4. JSON Schemas & Data Contracts

### 4.1 BusinessRuleCandidate
```json
{
  "finding_id": "BR-calculate_penalty-L2-50913D6B",
  "function_name": "calculate_penalty",
  "business_rule_description": "Conditional rule in `calculate_penalty`: checks `balance < 1000`. Yields 50 when satisfied, falls back to 0.",
  "observed_condition": "balance < 1000",
  "observed_behavior": "If 'balance < 1000' evaluates to True, returns 50; otherwise returns 0.",
  "source_file": "banking_legacy.py",
  "start_line": 2,
  "end_line": 4,
  "evidence_status": "OBSERVED_IN_CODE",
  "uncertainty_explanation": "Extracted strictly from AST code structure. This is observable code behavior, not an approved business policy...",
  "version": 1,
  "is_approved_policy": false,
  "is_obsolete_candidate": false
}
```

### 4.2 EvidenceMatchResult
```json
{
  "evidence_id": "INC-101",
  "finding_id": "BR-calculate_penalty-L2-50913D6B",
  "relationship_status": "CONFLICTED",
  "explanation": "Evidence 'INC-101' highlights a discrepancy with `calculate_penalty`. The evidence indicates that certain conditions (such as exemptions) should apply...",
  "source_reference": "incident_101.txt",
  "confidence_score": 0.95,
  "missing_conditions_detected": ["exemption_for_payment_extension"]
}
```

### 4.3 RiskAssessment
```json
{
  "finding_id": "BR-calculate_penalty-L2-50913D6B",
  "risk_score": 90.0,
  "risk_category": "CRITICAL",
  "factors": [
    {
      "factor_name": "Legacy Code Base Risk",
      "impact_score": 20.0,
      "description": "Baseline uncertainty associated with unmaintained or legacy code structure."
    },
    {
      "factor_name": "Direct Financial Impact",
      "impact_score": 25.0,
      "description": "Function `calculate_penalty` directly affects customer billing or monetary penalty assessments."
    },
    {
      "factor_name": "Unaccounted Exemption Discrepancy",
      "impact_score": 45.0,
      "description": "External evidence identifies reported discrepancies/missing conditions..."
    }
  ],
  "explanation": "Assigned heuristic risk score of 90.0/100 (CRITICAL)...",
  "recommended_action": "CRITICAL: Immediate business analyst and engineering review required...",
  "heuristic_disclaimer": "Heuristic assessment based on observable code structure and unapproved evidence. Does not represent a mathematically validated statistical probability."
}
```

### 4.4 RegressionTestSuiteSuggestion
```json
{
  "finding_id": "BR-calculate_penalty-L2-50913D6B",
  "function_name": "calculate_penalty",
  "suggestions": [
    {
      "test_id": "TEST-calculate_penalty-BOUNDARY-BELOW",
      "function_name": "calculate_penalty",
      "input_parameters": { "balance": 999 },
      "boundary_type": "BOUNDARY_BELOW",
      "expected_code_behavior": "Returns 50 (condition met)",
      "business_expectation_note": "Verify whether threshold of 999 should incur standard penalty.",
      "requires_human_validation": true,
      "rationale": "Evaluates boundary just below threshold 1000.0."
    },
    {
      "test_id": "TEST-calculate_penalty-BOUNDARY-EXACT",
      "function_name": "calculate_penalty",
      "input_parameters": { "balance": 1000 },
      "boundary_type": "BOUNDARY_EXACT",
      "expected_code_behavior": "Returns 0 (strict inequality not satisfied)",
      "business_expectation_note": "Verify whether exact threshold of 1000 should be exempt or charged.",
      "requires_human_validation": true,
      "rationale": "Evaluates exact threshold boundary equality for 1000.0."
    },
    {
      "test_id": "TEST-calculate_penalty-BOUNDARY-ABOVE",
      "function_name": "calculate_penalty",
      "input_parameters": { "balance": 1001 },
      "boundary_type": "BOUNDARY_ABOVE",
      "expected_code_behavior": "Returns 0 (condition not met)",
      "business_expectation_note": "Verify whether balance above 1000 properly incurs no penalty.",
      "requires_human_validation": true,
      "rationale": "Evaluates boundary just above threshold 1000.0."
    },
    {
      "test_id": "TEST-calculate_penalty-EXEMPTION-EXTENSION",
      "function_name": "calculate_penalty",
      "input_parameters": { "balance": 500, "approved_payment_extension": true },
      "boundary_type": "EVIDENCE_EXCEPTION",
      "expected_code_behavior": "Current code will charge 50 (AST confirms missing exemption logic).",
      "business_expectation_note": "Incident INC-101 claims customers with approved payment extensions should be exempt (expected outcome: 0 penalty). Requires business policy sign-off.",
      "requires_human_validation": true,
      "rationale": "Validates reported discrepancy: code currently lacks logic to handle payment extension exemptions."
    }
  ]
}
```

---

## 5. Verification & Tests

Run all unit and end-to-end integration tests:
```bash
python -m pytest
```

Execute the full 9-step banking scenario demonstration:
```bash
python legacyiq_engine/samples/demo_banking_scenario.py
```
