from dataclasses import asdict
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ast_analyzer import analyze_python
from store import load_project, save_project

app = FastAPI(title="LegacyIQ API")

# Allow the frontend (Nishanth) to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SourceFile(BaseModel):
    path: str
    content: str


class ProjectRequest(BaseModel):
    name: str
    files: list[SourceFile]


def _project_or_404(project_id):
    project = load_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/projects")
def create_project(request: ProjectRequest):
    rules = []
    dependencies = {}
    for source in request.files:
        # Only Python is analyzed in this version; other files are stored as evidence
        if not source.path.endswith(".py"):
            continue
        try:
            result = analyze_python(source.path, source.content)
        except SyntaxError as error:
            raise HTTPException(
                status_code=422,
                detail=f"{source.path} line {error.lineno}: {error.msg}",
            )
        rules += [asdict(rule) for rule in result["rules"]]
        for name, calls in result["dependencies"].items():
            dependencies[f"{source.path}:{name}"] = calls

    project_id = uuid4().hex
    save_project(
        project_id,
        request.name,
        [source.model_dump() for source in request.files],
        rules,
        dependencies,
    )
    return {"id": project_id, "name": request.name, "status": "done", "rule_count": len(rules)}


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    project = _project_or_404(project_id)
    return {
        "id": project["id"],
        "name": project["name"],
        "file_count": len(project["files"]),
        "rule_count": len(project["rules"]),
    }


@app.get("/api/projects/{project_id}/rules")
def get_rules(project_id: str):
    return _project_or_404(project_id)["rules"]


@app.get("/api/projects/{project_id}/dependencies")
def get_dependencies(project_id: str):
    return _project_or_404(project_id)["dependencies"]
