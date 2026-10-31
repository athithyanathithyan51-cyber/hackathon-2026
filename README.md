# Hackathon

## Team

**Coders**
- You: Backend + team lead (API, core logic, merges)
- Nishanth: Frontend (UI, components, styling)
- Nagulan: Data/AI (data source, model logic, sample data, testing)

**Pitch**
- Preneeth: Lead presenter (2-minute pitch, Q&A)
- Ajmal: Slides and demo script

All members use AI tools in their own role (TCS AI Hackathon).

## Idea

**Challenge 03: Autonomous Legacy Modernization Agent** (Theme 1: AI for Tech)

Build an AI system that reads a legacy application's evidence (source code, database schema, config, interface definitions, docs, production incidents, change tickets) and produces an evidence-based modernization strategy.

**Must-have features**
1. Evidence ingestion: accept the artifacts above and index them.
2. Analysis: business-rule extraction, dependency and database dependency mapping, obsolete-code detection, undocumented-behaviour detection, tech-debt scoring.
3. Strategy output: modernization heat map, risk analysis, alternatives, phased roadmap, regression test strategy.

**Critical rule:** code that looks obsolete must not be marked removable if it implements an undocumented but critical business rule. Old technology alone is never a reason to delete or rewrite.

## API Contract (v3)

Base path `/api`. JSON in and out. Status codes: `200` success, `404` unknown project or finding, `422` invalid body or Python that does not parse.

**Status:** all endpoints below are implemented and tested on this branch. Not built yet: the `functions` listing and the `report` endpoint (planned for the COBOL and Java step).

**Rules for every endpoint**
- Uploaded code is parsed, never executed.
- Every finding carries a real `file` and `start_line`.
- Each finding is versioned. Adding evidence creates a new version; earlier versions are kept.
- Each project has its own history database, so projects never share findings.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/health` | - | `{ "status": "ok" }` |
| POST | `/api/projects` | `{ "name", "files": [{ "path", "content" }] }` | `{ "id", "name", "status": "done", "file_count", "function_count", "rule_count" }` |
| GET | `/api/projects/{id}` | - | `{ "id", "name", "file_count", "rule_count" }` |
| GET | `/api/projects/{id}/dependencies` | - | `{ "<file>:<function>": ["<called function>"] }` |
| POST | `/api/projects/{id}/evidence` | `{ "name", "content" }` | `{ "evidence", "linked_findings": [{ "finding_id", "match": "SUPPORTED\|CONFLICTED", "new_version" }] }` |
| GET | `/api/projects/{id}/findings` | - | `[{ "id", "function", "file", "start_line", "version", "description", "evidence_status", "risk_score", "risk_category", "recommendation", "evidence": [{ "source", "match", "explanation" }] }]` |
| GET | `/api/projects/{id}/findings/{fid}/history` | - | `[{ "version", "timestamp", "change_reason", "evidence_status", "risk_score", "risk_category" }]` |
| POST | `/api/projects/{id}/impact` | `{ "finding_id" }` | `{ "finding_id", "risk_score", "risk_category", "risk_reasons": [str], "affected": ["<file>:<function>"], "regression_tests": [{ "input", "expected", "note" }], "recommendation" }` |
| GET | `/api/projects/{id}/overview` | - | `{ "files_analyzed", "rule_candidates", "risks", "evidence_conflicts" }` |

**Enums**
- `evidence_status`: `OBSERVED_IN_CODE`, `SUPPORTED_BY_EVIDENCE`, `CONFLICTED_BY_EVIDENCE`, `UNCERTAIN_EVIDENCE`
- `risk_category`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `recommendation`: `retain`, `refactor`, `replace`, `investigate`. `investigate` when risk is CRITICAL or evidence conflicts. `refactor` when risk is HIGH. Otherwise `retain`. Always a suggestion for human review.

## Setup

Run everything from the repository root.

```bash
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
```

## Run

```bash
uvicorn backend.main:app --reload
python -m pytest
```

Health check: http://127.0.0.1:8000/api/health

## Tech Stack

Project: **LegacyIQ**, an evidence-driven legacy application modernization assistant. Core flow: **Understand, Verify, Adapt, Assess, Recommend**.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Builds the user interface |
| Frontend | Tailwind CSS | Styles the interface |
| Frontend | React Flow | Displays component relationships |
| Frontend | Recharts | Displays risk and analysis summaries |
| Backend | FastAPI | Connects frontend requests to Python logic |
| Backend | Pydantic | Validates structured inputs and outputs |
| Analysis | Python `ast` (stdlib) | Reads Python structure without executing it |
| Analysis | SQLGlot | Parses SQL and finds database relationships |
| AI | External LLM API | Explains business meaning and correlates evidence |
| Storage | SQLite | Stores findings, evidence and analysis history |

**Static analysis states facts, AI explains them.** The `ast` and SQLGlot layers say what the code does (a function exists, a condition checks a balance, a call happens on line 12). The LLM only suggests what it may mean. Its output must never replace a verified fact.

**Rules for everyone**
1. Never execute uploaded source code.
2. Never invent line numbers. Every finding points to a real file and line.
3. Keep code behaviour separate from inferred business requirements.
4. Incidents are evidence, not approved policy.
5. "No references found" does not mean unused.
6. Every risk score and recommendation must explain its reasons.
7. Keep previous findings when new evidence arrives.
8. A human reviews every consequential modernization decision.

**Scope for the hackathon:** Python only. Java, C++ and other parsers, automatic code rewriting, runtime monitoring, and multi-agent systems are out of scope until the core workflow works.
