# Frontend API Guide (for Nishanth)

How the React screens connect to the LegacyIQ backend. Every example below is a real response from the current backend, so field names are exact.

## 1. Run the backend

From the repository root:

```bash
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
uvicorn backend.main:app --reload
```

- Base URL: `http://127.0.0.1:8000`
- Health check: `GET /api/health` returns `{"status": "ok"}`
- CORS is open for development, so the Vite dev server can call it directly.
- Data is stored in `backend/data/` (SQLite). Deleting that folder resets all projects.

## 2. Conventions

- All bodies are JSON. Send `Content-Type: application/json`.
- Errors return `{"detail": "message"}`.
  - `404` unknown project or finding
  - `422` invalid input, for example a Python or COBOL file that does not parse, or an unsupported GitHub link
  - `502` GitHub could not be reached
- IDs: `project_id` is a 32-character hex string. `finding_id` looks like `BR-1000_CALCULATE_PENALTY-L20-450DC533`. Always use the exact ID the backend returned.
- Every finding has a real `file` and `start_line`. Show these in the UI so users can trace each claim to its source.

Enum values (use these exact strings in the UI):

| Field | Values |
|---|---|
| `evidence_status` | `OBSERVED_IN_CODE`, `SUPPORTED_BY_EVIDENCE`, `CONFLICTED_BY_EVIDENCE`, `UNCERTAIN_EVIDENCE` |
| `risk_category` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `recommendation` | `retain`, `refactor`, `replace`, `investigate` |
| `match` (evidence) | `SUPPORTED`, `CONFLICTED` |

## 3. Screen-by-screen

### Upload and create a project

`POST /api/projects`

Request:
```json
{
  "name": "core-banking demo",
  "files": [
    { "path": "PENALTY.cbl", "content": "       IDENTIFICATION DIVISION. ..." },
    { "path": "ACCOUNTS.CPY", "content": "       01 ACCOUNT-RECORD. ..." }
  ]
}
```

Response (`200`):
```json
{
  "id": "fa4d453e7c0348a89b1557abcc6ebe6e",
  "name": "demo",
  "status": "done",
  "file_count": 2,
  "function_count": 7,
  "rule_count": 5
}
```

Rules:
- `.py`, `.cbl` and `.cob` files are analyzed.
- `.cpy` (copybooks) and other files are stored as evidence only.
- A file that does not parse returns `422` with the reason in `detail`.

Use this for: the upload screen. After success, store the `id` and move to the overview.

### Overview

`GET /api/projects/{id}/overview`

```json
{ "files_analyzed": 2, "rule_candidates": 5, "risks": 3, "evidence_conflicts": 3 }
```

Use this for: the summary cards at the top of the dashboard.

### Findings (business rules)

`GET /api/projects/{id}/findings`

Response is a list:
```json
[
  {
    "id": "BR-1000_CALCULATE_PENALTY-L20-450DC533",
    "function": "1000-CALCULATE-PENALTY",
    "file": "PENALTY.cbl",
    "start_line": 20,
    "version": 1,
    "description": "Conditional rule in `1000-CALCULATE-PENALTY`: checks `WS-BALANCE < 1000`. ...",
    "evidence_status": "OBSERVED_IN_CODE",
    "risk_score": 45.0,
    "risk_category": "MEDIUM",
    "recommendation": "retain",
    "evidence": []
  }
]
```

After evidence is added, `evidence` lists the matches:
```json
"evidence": [
  { "source": "INC-101", "match": "CONFLICTED", "explanation": "..." }
]
```

Use this for: the business rules table, the risk badges, and the file and line links. Sort or filter on `risk_category` and `evidence_status`.

### Finding history (versions)

`GET /api/projects/{id}/findings/{finding_id}/history`

```json
[
  {
    "version": 1,
    "timestamp": "2026-10-31T07:09:09.353278+00:00",
    "change_reason": "Initial code AST baseline extraction",
    "evidence_status": "OBSERVED_IN_CODE",
    "risk_score": 45.0,
    "risk_category": "MEDIUM"
  },
  {
    "version": 2,
    "change_reason": "...",
    "evidence_status": "CONFLICTED_BY_EVIDENCE",
    "risk_score": 90.0,
    "risk_category": "CRITICAL"
  }
]
```

Use this for: the "before and after" view. Show the change in risk and evidence status between versions. Earlier versions are never removed.

### Add evidence (incident, change request, document)

`POST /api/projects/{id}/evidence`

Request:
```json
{ "name": "INC-101", "content": "Customers with an approved payment extension should be exempt from the minimum balance penalty." }
```

Response:
```json
{
  "evidence": "INC-101",
  "linked_findings": [
    { "finding_id": "BR-1000_CALCULATE_PENALTY-L20-450DC533", "match": "CONFLICTED", "new_version": 2 }
  ]
}
```

Use this for: the incident upload form. After it returns, reload the findings and the history for every `finding_id` in `linked_findings`. Only `SUPPORTED` and `CONFLICTED` matches are returned, because `UNCERTAIN` ones are skipped.

Note for the demo: the matcher can link one incident to several rules. Show all of them and say which rule the user should review.

### Impact of a change

`POST /api/projects/{id}/impact`

Request:
```json
{ "finding_id": "BR-1000_CALCULATE_PENALTY-L20-450DC533" }
```

Response:
```json
{
  "finding_id": "BR-1000_CALCULATE_PENALTY-L20-450DC533",
  "risk_score": 90.0,
  "risk_category": "CRITICAL",
  "risk_reasons": ["Baseline uncertainty ...", "Function ... affects customer billing ...", "..."],
  "affected": ["PENALTY.cbl:0000-MAIN-PROCESS"],
  "regression_tests": [
    {
      "input": "{\"WS-BALANCE\": 999}",
      "expected": "If 'WS-BALANCE < 1000' evaluates to True, returns 50; otherwise returns 0.",
      "note": "Verify whether boundary below threshold (999) satisfies expected business policy."
    }
  ],
  "recommendation": "investigate"
}
```

Use this for: the impact simulator. Show `risk_reasons` as a list, `affected` as links, and `regression_tests` as a table. Label the tests as **suggestions, not verified results**.

### Modernization plan

`POST /api/projects/{id}/plan`

```json
{
  "project_id": "fa4d453e...",
  "summary": { "rules": 5, "blocked": 0, "investigate": 3 },
  "phases": [
    { "name": "Stop and fix first", "actions": [] },
    { "name": "Phase 1: validate and characterize", "actions": ["Get business sign-off on ..."] },
    { "name": "Phase 2: refactor with tests", "actions": ["..."] },
    { "name": "Phase 3: migrate low-risk rules", "actions": ["..."] }
  ],
  "findings": [
    {
      "id": "...", "function": "...", "file": "...", "start_line": 20, "condition": "WS-BALANCE < 1000",
      "risk_category": "MEDIUM", "risk_score": 45.0, "blocked": false, "recommendation": "retain",
      "interpretation": { "business_explanation": "...", "questions": ["..."], "model": "deterministic-fallback", "is_fallback": true }
    }
  ]
}
```

Use this for: the roadmap view. Show the phases in order. Show `blocked: true` items in red under "Stop and fix first". Show `interpretation.questions` as the questions for the business owner.

Note: `POST` on this endpoint does not change any data. It is safe to call again.

### Full report

`GET /api/projects/{id}/report`

Top-level keys:

| Key | Contents | Use it for |
|---|---|---|
| `source` | `[{ "file", "lines" }]` | file list |
| `analysis` | `programs`, `paragraphs`, `variables` (count), `dependencies` | COBOL analysis screen |
| `verification` | `rules`, `unsupported`, `inconsistencies` | business logic verification screen |
| `assessment` | `summary`, `risks`, `target` | modernization assessment screen |
| `recommendations` | list of strings | the advice list |
| `migration_phases` | same as the plan's `phases` | roadmap |

Details:
- `analysis.programs`: `[{ "name", "line", "file" }]`
- `analysis.dependencies`: `{ "FILE:PARAGRAPH": ["CALLED_NAME", ...] }`. Use this to draw the dependency graph.
- `verification.unsupported`: `[{ "construct", "line", "text", "file" }]`. Constructs are `GO TO`, `ALTER`, `EXEC SQL`, `REDEFINES`.
- `verification.inconsistencies`: `[{ "item", "detail" }]`
- `assessment.target` is always `"Java 21 + Spring Boot (recommendation only; no code is generated)"`. Show it as a recommendation, not as generated output.

Use this for: the final analysis report page. Every row should show its `file:line`.

### GitHub file fetch

`POST /api/sources/github`

Request:
```json
{ "url": "https://github.com/fzn0x/core-banking-system/blob/main/TRANS-PROC.CBL" }
```

Response (`line_count` and `size_bytes` are the real values for the returned file):
```json
{
  "owner": "fzn0x", "repo": "core-banking-system", "ref": "main", "path": "TRANS-PROC.CBL",
  "file_name": "TRANS-PROC.CBL", "extension": ".cbl", "size_bytes": 3415, "line_count": 96,
  "content": "       IDENTIFICATION DIVISION. ..."
}
```

Rules:
- Only single-file links on github.com are accepted (`/blob/` links).
- Allowed types: `.cbl`, `.cob`, `.cpy`. Max size 1 MB.
- Errors: `422` for a bad link, wrong type, or binary file. `502` if GitHub cannot be reached.

Use this for: step 1 of the workflow. Show the file info, then let the user confirm, then send `content` to `POST /api/projects` as one file.

**Do not fetch GitHub from the browser directly.** Use this endpoint, so validation is the same everywhere.

## 4. Suggested call order

1. `POST /api/sources/github` (optional, for a GitHub link) or upload the files
2. `POST /api/projects`
3. `GET /api/projects/{id}/overview`
4. `GET /api/projects/{id}/findings`
5. `GET /api/projects/{id}/findings/{fid}/history` when a finding is opened
6. `POST /api/projects/{id}/evidence` when the user adds an incident
7. Reload `findings` and `history` for the linked findings
8. `POST /api/projects/{id}/impact` when a finding is selected for impact
9. `POST /api/projects/{id}/plan` and `GET /api/projects/{id}/report` for the report pages

## 5. Things to keep in mind

- **Recommendations, not decisions.** Every recommendation is a suggestion for a human. Label it that way in the UI.
- **Nothing is converted or changed.** The product plans and assesses modernization. Do not show generated code.
- **Evidence is not approval.** An incident only shows a conflict. A rule is not approved until a business owner signs off.
- **Mock data.** Components that still import `mockBankingData`, `mockAdaptiveData`, `mockCobolData` or `mockDecisionData` need to switch to these endpoints. The mock files can stay as an offline fallback, but label it clearly.
- **Stale comment.** `services/decisionService.js` still says the backend has no decision endpoints. Update that comment when you connect the screen.
