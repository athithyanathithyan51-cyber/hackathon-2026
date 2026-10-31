"""Loads backend/.env (if present) before the engine reads its settings.

Skipped under pytest, so tests never call the live AI API.
"""
import os

_ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")


def _load_env_file(path):
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key and value and key not in os.environ:
                os.environ[key] = value


if "PYTEST_CURRENT_TEST" not in os.environ:
    _load_env_file(_ENV_FILE)
