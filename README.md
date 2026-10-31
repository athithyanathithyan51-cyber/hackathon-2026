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

## API Contract (v1)

All responses are JSON. Base path: `/api`.

| Method | Path | Body / Query | Response |
|---|---|---|---|
| POST | `/api/analyses` | `{ "name": str, "artifacts": [{ "type": "code\|schema\|config\|interface\|doc\|incident\|ticket", "path": str, "content": str }] }` | `{ "id": str, "status": "queued" }` |
| GET | `/api/analyses/{id}` | - | `{ "id", "name", "status": "queued\|running\|done\|failed" }` |
| GET | `/api/analyses/{id}/business-rules` | - | `[{ "id", "description", "source", "evidence", "confidence", "critical", "documented" }]` |
| GET | `/api/analyses/{id}/dependencies` | - | `{ "nodes": [{ "id", "type" }], "edges": [{ "from", "to", "kind" }] }` |
| GET | `/api/analyses/{id}/heatmap` | - | `[{ "component", "risk", "tech_debt", "obsolete", "verdict" }]` where `verdict` is `keep`, `review`, or `modernize` |
| GET | `/api/analyses/{id}/report` | - | `{ "current_state", "tech_debt", "risks", "alternatives", "target_architecture", "roadmap", "test_strategy" }` |

Status codes: `200` success, `404` unknown id, `422` invalid body.

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Run

```bash
cd backend
uvicorn main:app --reload
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
