"""Fetch and validate a COBOL file from a GitHub URL.

Only github.com file links are accepted. The fetch has a timeout and a size limit.
The content is read as text and is never executed.
"""
import re
import urllib.error
import urllib.request
from urllib.parse import urlparse

ALLOWED_EXTENSIONS = (".cbl", ".cob", ".cpy")
MAX_BYTES = 1_000_000
TIMEOUT_SECONDS = 10

# https://github.com/{owner}/{repo}/blob/{ref}/{path...}
BLOB_PATH = re.compile(r"^/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$")


class SourceError(Exception):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def parse_github_file_url(url):
    """Return (owner, repo, ref, path) for a github.com file link, or raise SourceError."""
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or parsed.netloc not in ("github.com", "www.github.com"):
        raise SourceError(422, "Only github.com file links are supported")
    match = BLOB_PATH.match(parsed.path)
    if not match:
        raise SourceError(422, "Link must point to one file: https://github.com/<owner>/<repo>/blob/<ref>/<path>")
    owner, repo, ref, path = match.groups()
    if not path.lower().endswith(ALLOWED_EXTENSIONS):
        raise SourceError(422, f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    return owner, repo, ref, path


def raw_url(owner, repo, ref, path):
    return f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}"


def fetch_bytes(url):
    """Download a file with a timeout and a size limit. Separated so tests can replace it."""
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as response:
            data = response.read(MAX_BYTES + 1)
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise SourceError(502, f"Could not fetch the file from GitHub: {error}")
    if len(data) > MAX_BYTES:
        raise SourceError(422, f"File is larger than {MAX_BYTES} bytes")
    return data


def fetch_cobol_from_github(url):
    """Fetch and validate one COBOL file. Returns file info and its text."""
    owner, repo, ref, path = parse_github_file_url(url)
    data = fetch_bytes(raw_url(owner, repo, ref, path))
    if b"\x00" in data:
        raise SourceError(422, "File looks binary, not source text")
    try:
        content = data.decode("utf-8")
    except UnicodeDecodeError:
        raise SourceError(422, "File is not UTF-8 text")
    return {
        "owner": owner,
        "repo": repo,
        "ref": ref,
        "path": path,
        "file_name": path.rsplit("/", 1)[-1],
        "extension": "." + path.rsplit(".", 1)[-1].lower(),
        "size_bytes": len(data),
        "line_count": len(content.splitlines()),
        "content": content,
    }
