"""Configuration settings for the LegacyIQ Data/AI Engine.

Reads environment variables with sensible defaults.
Zero external framework dependencies.
"""
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

# Groq API configuration
GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
# llama-3.3-70b-versatile is no longer available to the project key. Override with GROQ_MODEL.
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_TIMEOUT_SECONDS: int = int(os.getenv("GROQ_TIMEOUT_SECONDS", "15"))

# Storage configuration
LEGACYIQ_DB_PATH: str = os.getenv(
    "LEGACYIQ_DB_PATH",
    str(BASE_DIR / "storage" / "legacyiq_history.db")
)
