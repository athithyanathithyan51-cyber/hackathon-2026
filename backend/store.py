"""SQLite storage for projects and their analysis results."""
import json
import os
import sqlite3

DEFAULT_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "legacyiq.db")


def _connect():
    conn = sqlite3.connect(os.environ.get("LEGACYIQ_DB", DEFAULT_DB))
    conn.row_factory = sqlite3.Row
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects ("
        " id TEXT PRIMARY KEY,"
        " name TEXT NOT NULL,"
        " files TEXT NOT NULL,"
        " rules TEXT NOT NULL,"
        " dependencies TEXT NOT NULL,"
        " created_at TEXT NOT NULL DEFAULT (datetime('now')))"
    )
    return conn


def save_project(project_id, name, files, rules, dependencies):
    conn = _connect()
    with conn:
        conn.execute(
            "INSERT INTO projects (id, name, files, rules, dependencies) VALUES (?, ?, ?, ?, ?)",
            (project_id, name, json.dumps(files), json.dumps(rules), json.dumps(dependencies)),
        )
    conn.close()


def load_project(project_id):
    conn = _connect()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "files": json.loads(row["files"]),
        "rules": json.loads(row["rules"]),
        "dependencies": json.loads(row["dependencies"]),
    }
