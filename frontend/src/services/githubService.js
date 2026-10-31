/**
 * GitHub COBOL File Ingestion Service
 * 
 * Secure, client-side retrieval and parsing of public COBOL source files
 * (.cbl, .cob, .cpy) from GitHub repositories.
 */

export const SUPPORTED_EXTENSIONS = ['.cbl', '.cob', '.cpy'];
export const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB limit for responsive in-browser AST analysis

/**
 * Parses GitHub URLs into structured repository, branch, and file metadata.
 * 
 * Supported patterns:
 * - https://github.com/:owner/:repo/blob/:branch/:filepath
 * - https://raw.githubusercontent.com/:owner/:repo/:branch/:filepath
 */
export function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Please enter a valid GitHub file URL.' };
  }

  const cleanUrl = url.trim();

  // Pattern 1: Standard GitHub web blob view
  // https://github.com/owner/repo/blob/main/folder/file.cbl
  const blobRegex = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i;
  const blobMatch = cleanUrl.match(blobRegex);

  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch;
    const fileName = filePath.split('/').pop() || '';
    const extension = getExtension(fileName);

    return {
      valid: true,
      owner,
      repo,
      branch,
      filePath,
      fileName,
      extension,
      rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
    };
  }

  // Pattern 2: Raw GitHub usercontent
  // https://raw.githubusercontent.com/owner/repo/main/folder/file.cbl
  const rawRegex = /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i;
  const rawMatch = cleanUrl.match(rawRegex);

  if (rawMatch) {
    const [, owner, repo, branch, filePath] = rawMatch;
    const fileName = filePath.split('/').pop() || '';
    const extension = getExtension(fileName);

    return {
      valid: true,
      owner,
      repo,
      branch,
      filePath,
      fileName,
      extension,
      rawUrl: cleanUrl
    };
  }

  return {
    valid: false,
    error: 'Unrecognized GitHub URL format. Expected: https://github.com/{owner}/{repo}/blob/{branch}/{filename.cbl}'
  };
}

/**
 * Extracts lowercase file extension (e.g., '.cbl')
 */
export function getExtension(fileName) {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Validates if the file extension is a supported COBOL type (.cbl, .cob, .cpy)
 */
export function isSupportedCobolFile(fileName) {
  const ext = getExtension(fileName);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Retrieves public COBOL source file directly from GitHub.
 * Validates extension, handles errors, and measures line counts.
 */
export async function fetchGitHubCobolFile(inputUrl) {
  const parsed = parseGitHubUrl(inputUrl);

  if (!parsed.valid) {
    throw new Error(parsed.error);
  }

  if (!isSupportedCobolFile(parsed.fileName)) {
    throw new Error(
      `Unsupported file extension "${parsed.extension}". Supported COBOL formats: ${SUPPORTED_EXTENSIONS.join(', ')}`
    );
  }

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    response = await fetch(parsed.rawUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain'
      }
    });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while connecting to GitHub.', { cause: err });
    }
    throw new Error(
      `Network failure connecting to GitHub raw endpoint. Please check your internet connection or verify the URL.`,
      { cause: err }
    );
  }

  if (response.status === 404) {
    throw new Error(
      `File not found (HTTP 404). Please ensure the repository is public and the file path "${parsed.filePath}" on branch "${parsed.branch}" exists.`
    );
  }

  if (response.status === 403) {
    throw new Error(
      `GitHub access rate limit reached or access forbidden (HTTP 403). Try again in a few moments.`
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve file from GitHub (HTTP ${response.status}: ${response.statusText}).`);
  }

  const content = await response.text();

  if (content.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(content.length / 1024).toFixed(1)} KB) exceeds the 1 MB analysis limit.`
    );
  }

  const lines = content.split('\n');

  return {
    source: 'github',
    name: parsed.fileName,
    extension: parsed.extension,
    owner: parsed.owner,
    repo: parsed.repo,
    branch: parsed.branch,
    filePath: parsed.filePath,
    rawUrl: parsed.rawUrl,
    content: content,
    lineCount: lines.length,
    sizeKb: (content.length / 1024).toFixed(2),
    retrievedAt: new Date().toLocaleTimeString(),
    status: 'Retrieved & Verified'
  };
}

/**
 * Pre-configured public GitHub samples for quick testing
 */
export const SAMPLE_GITHUB_COBOL_URLS = [
  {
    name: 'PENALTY.cbl (Banking Core Minimum Balance)',
    url: 'https://github.com/facebookresearch/CodeGen/blob/main/README.md', // sample format reference
    demoValue: 'https://github.com/legacyiq-demo/banking-core/blob/main/PENALTY.cbl',
    description: 'COBOL-85 retail banking fee calculation with copybook dependency'
  },
  {
    name: 'ACCTREC.cpy (Account Record Layout Copybook)',
    demoValue: 'https://github.com/legacyiq-demo/banking-core/blob/main/ACCTREC.cpy',
    description: 'Shared 01/05 record layout defining WS-PAYMENT-EXT-FLAG'
  }
];
