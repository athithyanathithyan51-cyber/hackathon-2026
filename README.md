# Hackathon

## Team

**Coders**
- You: Backend + team lead (API, core logic, merges)
- Nishanth: Frontend (UI, components, styling)
- Nagukan: Data/AI (data source, model logic, sample data, testing)

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
