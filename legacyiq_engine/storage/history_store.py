"""Persistent history store for LegacyIQ findings and reassessment versions.

Rules:
1. Every change appends a new immutable version.
2. Previous versions and rationale are NEVER overwritten.
3. Uses SQLite standard library without heavyweight ORM dependencies.
"""
from __future__ import annotations

import json
import sqlite3
from typing import Optional

from legacyiq_engine.config import LEGACYIQ_DB_PATH
from legacyiq_engine.models.schemas import (
    AIInterpretation,
    BusinessRuleCandidate,
    EvidenceMatchResult,
    FindingVersion,
    RiskAssessment,
)


class HistoryStore:
    """Manages immutable version history for business rule candidates."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or LEGACYIQ_DB_PATH
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._get_connection()
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS finding_history (
                    finding_id TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    finding_data TEXT NOT NULL,
                    risk_data TEXT,
                    interpretation_data TEXT,
                    evidence_matches_data TEXT,
                    change_reason TEXT NOT NULL,
                    PRIMARY KEY (finding_id, version)
                )
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_finding_id 
                ON finding_history (finding_id)
                """
            )
        conn.close()

    def save_version(self, version_entry: FindingVersion) -> None:
        """Saves a new finding version. Fails if the same version already exists (immutable)."""
        conn = self._get_connection()
        with conn:
            conn.execute(
                """
                INSERT INTO finding_history (
                    finding_id, version, timestamp, finding_data,
                    risk_data, interpretation_data, evidence_matches_data, change_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    version_entry.finding.finding_id,
                    version_entry.version,
                    version_entry.timestamp,
                    version_entry.finding.model_dump_json(),
                    version_entry.risk_assessment.model_dump_json() if version_entry.risk_assessment else None,
                    version_entry.interpretation.model_dump_json() if version_entry.interpretation else None,
                    json.dumps([m.model_dump() for m in version_entry.evidence_matches]),
                    version_entry.change_reason,
                ),
            )
        conn.close()

    def get_history(self, finding_id: str) -> list[FindingVersion]:
        """Retrieve all versions of a finding in ascending order of version."""
        conn = self._get_connection()
        rows = conn.execute(
            """
            SELECT * FROM finding_history 
            WHERE finding_id = ? 
            ORDER BY version ASC
            """,
            (finding_id,),
        ).fetchall()
        conn.close()

        history: list[FindingVersion] = []
        for row in rows:
            finding = BusinessRuleCandidate.model_validate_json(row["finding_data"])
            risk = (
                RiskAssessment.model_validate_json(row["risk_data"])
                if row["risk_data"]
                else None
            )
            interp = (
                AIInterpretation.model_validate_json(row["interpretation_data"])
                if row["interpretation_data"]
                else None
            )
            raw_matches = json.loads(row["evidence_matches_data"]) if row["evidence_matches_data"] else []
            matches = [EvidenceMatchResult.model_validate(m) for m in raw_matches]

            history.append(
                FindingVersion(
                    version=row["version"],
                    timestamp=row["timestamp"],
                    finding=finding,
                    risk_assessment=risk,
                    interpretation=interp,
                    evidence_matches=matches,
                    change_reason=row["change_reason"],
                )
            )
        return history

    def get_latest_version(self, finding_id: str) -> Optional[FindingVersion]:
        """Retrieve the most recent version of a finding, or None if not found."""
        history = self.get_history(finding_id)
        if not history:
            return None
        return history[-1]

    def clear(self) -> None:
        """Clear the history table (useful for isolated testing)."""
        conn = self._get_connection()
        with conn:
            conn.execute("DELETE FROM finding_history")
        conn.close()
