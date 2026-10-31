"""Project metadata in SQLite, plus one engine history database per project.

Findings and their versions live in the engine's HistoryStore, which keeps every
version immutably. This module only remembers which findings belong to which project.
"""
import json
import os
import sqlite3

from legacyiq_engine.storage.history_store import HistoryStore

DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


def _data_dir():
    path = os.environ.get("LEGACYIQ_DATA_DIR", DEFAULT_DATA_DIR)
    os.makedirs(path, exist_ok=True)
    return path


def _meta_connection():
    conn = sqlite3.connect(os.path.join(_data_dir(), "projects.db"))
    conn.row_factory = sqlite3.Row
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects ("
        " id TEXT PRIMARY KEY,"
        " name TEXT NOT NULL,"
        " files TEXT NOT NULL,"
        " dependencies TEXT NOT NULL,"
        " finding_ids TEXT NOT NULL,"
        " created_at TEXT NOT NULL DEFAULT (datetime('now')))"
    )
    return conn


def history_for(project_id):
    """Return the engine history store that belongs to one project only."""
    return HistoryStore(db_path=os.path.join(_data_dir(), f"{project_id}.db"))


def save_project(project_id, name, files, dependencies, finding_ids):
    conn = _meta_connection()
    with conn:
        conn.execute(
            "INSERT INTO projects (id, name, files, dependencies, finding_ids) VALUES (?, ?, ?, ?, ?)",
            (project_id, name, json.dumps(files), json.dumps(dependencies), json.dumps(finding_ids)),
        )
    conn.close()


def load_project(project_id):
    conn = _meta_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "files": json.loads(row["files"]),
        "dependencies": json.loads(row["dependencies"]),
        "finding_ids": json.loads(row["finding_ids"]),
    }
