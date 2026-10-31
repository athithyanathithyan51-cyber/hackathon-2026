import JSZip from 'jszip';

// Security and safety limits for archive processing
export const ZIP_LIMITS = {
  MAX_ZIP_SIZE_BYTES: 25 * 1024 * 1024,      // 25 MB max compressed upload
  MAX_UNCOMPRESSED_BYTES: 50 * 1024 * 1024,  // 50 MB max extracted footprint
  MAX_ENTRIES: 500                            // Max 500 files (zip bomb protection)
};

const TEXT_EXTENSIONS = new Set([
  'cbl', 'cob', 'cpy', 'jcl', 'sql', 'txt', 'md', 'json', 'xml', 
  'properties', 'yaml', 'yml', 'csv', 'java', 'py', 'sh', 'bat'
]);

/**
 * Classifies an extracted archive entry by extension and determines backend support
 */
export function classifyFile(extension) {
  const ext = (extension || '').toLowerCase();
  
  if (ext === 'cbl' || ext === 'cob') {
    return {
      type: 'cobol_program',
      category: 'COBOL Programs',
      analysisSupport: 'supported',
      description: 'COBOL Source Program — Full AST & business rule extraction supported by legacyiq_engine',
      badgeVariant: 'info',
      isCobol: true
    };
  }

  if (ext === 'cpy') {
    return {
      type: 'copybook',
      category: 'Copybooks',
      analysisSupport: 'staged_reference',
      description: 'COBOL Copybook — Staged in project repository for field layout reference. Backend identifies COPY directives without recursive AST parsing.',
      badgeVariant: 'neutral',
      isCobol: true
    };
  }

  if (ext === 'jcl') {
    return {
      type: 'jcl',
      category: 'Job Control Files',
      analysisSupport: 'inspect_only',
      description: 'Mainframe JCL Script — Inspectable in project file explorer. Batch execution flows not parsed by COBOL AST.',
      badgeVariant: 'neutral',
      isCobol: false
    };
  }

  if (ext === 'sql') {
    return {
      type: 'sql',
      category: 'SQL Files',
      analysisSupport: 'inspect_only',
      description: 'Relational Database Script — Inspectable in project file explorer.',
      badgeVariant: 'neutral',
      isCobol: false
    };
  }

  if (ext === 'md' || ext === 'txt') {
    return {
      type: 'documentation',
      category: 'Documentation',
      analysisSupport: 'inspect_only',
      description: 'Project Documentation / Specification — Text readable in project explorer.',
      badgeVariant: 'neutral',
      isCobol: false
    };
  }

  if (ext === 'json' || ext === 'xml' || ext === 'properties' || ext === 'yaml' || ext === 'yml') {
    return {
      type: 'configuration',
      category: 'Configuration',
      analysisSupport: 'inspect_only',
      description: 'System Configuration — Text readable in project explorer.',
      badgeVariant: 'neutral',
      isCobol: false
    };
  }

  return {
    type: 'unsupported',
    category: 'Unsupported Files',
    analysisSupport: 'unsupported',
    description: 'Binary or non-analyzable format. Not ingested into COBOL analysis pipeline.',
    badgeVariant: 'neutral',
    isCobol: false
  };
}

/**
 * Validates entry path against path traversal vulnerabilities
 */
function isSafePath(path) {
  if (!path || typeof path !== 'string') return false;
  
  // Disallow absolute paths
  if (path.startsWith('/') || path.startsWith('\\')) return false;

  // Disallow drive letters (e.g. C:)
  if (/^[a-zA-Z]:/.test(path)) return false;

  // Disallow directory traversal segments
  const segments = path.split(/[/\\]/);
  for (const segment of segments) {
    if (segment === '..' || segment === '.') return false;
  }

  return true;
}

/**
 * Checks whether entry is an OS/editor metadata artifact to ignore
 */
function isIgnoredEntry(path) {
  const normalized = path.replace(/\\/g, '/');
  return (
    normalized.includes('__MACOSX/') ||
    normalized.includes('.DS_Store') ||
    normalized.includes('Thumbs.db') ||
    normalized.includes('.git/') ||
    normalized.endsWith('.gitignore') ||
    normalized.endsWith('.gitattributes') ||
    normalized.includes('/.vscode/') ||
    normalized.includes('/.idea/')
  );
}

/**
 * Extracts and inspects a client-provided ZIP file
 * 
 * @param {File} zipFile - Browser File object from drop or input
 * @param {Function} onProgress - Optional callback for extraction progress
 * @returns {Promise<{ files: Array, summary: Object, projectName: string }>}
 */
export async function extractZipProject(zipFile, onProgress = null) {
  if (!zipFile) {
    throw new Error('No file provided for ZIP project extraction.');
  }

  // 1. Validate file size
  if (zipFile.size > ZIP_LIMITS.MAX_ZIP_SIZE_BYTES) {
    const sizeMb = (zipFile.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `ZIP file size (${sizeMb} MB) exceeds the maximum allowed upload limit of ${ZIP_LIMITS.MAX_ZIP_SIZE_BYTES / (1024 * 1024)} MB.`
    );
  }

  // 2. Load zip with JSZip
  let zip;
  try {
    zip = await JSZip.loadAsync(zipFile);
  } catch (err) {
    throw new Error(`Failed to read ZIP archive: Invalid or corrupted archive format (${err.message}).`, { cause: err });
  }

  const entries = Object.values(zip.files);

  if (entries.length === 0) {
    throw new Error('The selected ZIP archive is empty.');
  }

  if (entries.length > ZIP_LIMITS.MAX_ENTRIES) {
    throw new Error(
      `ZIP archive contains ${entries.length} entries, exceeding the maximum safe limit of ${ZIP_LIMITS.MAX_ENTRIES} entries.`
    );
  }

  let totalUncompressedBytes = 0;
  const extractedFiles = [];
  const projectName = zipFile.name.replace(/\.[^/.]+$/, '').toLowerCase() || 'legacy-project';

  let processedCount = 0;
  const fileEntries = entries.filter(e => !e.dir && !isIgnoredEntry(e.name));

  if (fileEntries.length === 0) {
    throw new Error('The ZIP archive contains no readable project files (only directories or ignored metadata).');
  }

  for (const entry of fileEntries) {
    const relativePath = entry.name.replace(/\\/g, '/');

    // Security check: path traversal
    if (!isSafePath(relativePath)) {
      throw new Error(`Security validation failed: Archive contains unsafe relative path "${relativePath}".`);
    }

    const pathParts = relativePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
    const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

    const classification = classifyFile(ext);
    const isText = TEXT_EXTENSIONS.has(ext);

    let content;
    let loc = 0;
    let sizeBytes = 0;

    if (isText) {
      try {
        content = await entry.async('string');
        sizeBytes = new Blob([content]).size;
        totalUncompressedBytes += sizeBytes;

        if (totalUncompressedBytes > ZIP_LIMITS.MAX_UNCOMPRESSED_BYTES) {
          throw new Error(
            `Total uncompressed project size exceeds maximum safe limit of ${ZIP_LIMITS.MAX_UNCOMPRESSED_BYTES / (1024 * 1024)} MB.`
          );
        }

        loc = content ? content.split('\n').length : 0;
      } catch (err) {
        content = `/* Unable to read text content: ${err.message} */`;
        loc = 0;
      }
    } else {
      // Binary / unsupported entry - do not load into string memory
      content = '/* Binary or non-text file content not previewed */';
      sizeBytes = entry._data ? entry._data.uncompressedSize || 0 : 0;
      totalUncompressedBytes += sizeBytes;
    }

    extractedFiles.push({
      id: `zip-${Date.now()}-${extractedFiles.length}`,
      name: fileName,
      relativePath,
      folder,
      extension: ext,
      sizeBytes,
      sizeFormatted: sizeBytes < 1024 
        ? `${sizeBytes} B` 
        : sizeBytes < 1024 * 1024 
        ? `${(sizeBytes / 1024).toFixed(1)} KB` 
        : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
      loc,
      classification: classification.type,
      category: classification.category,
      analysisSupport: classification.analysisSupport,
      badgeVariant: classification.badgeVariant,
      description: classification.description,
      isCobol: classification.isCobol,
      isText,
      content,
      programId: ext === 'cbl' || ext === 'cob' ? fileName.split('.')[0].toUpperCase() : null,
      source: 'ZIP Project Archive'
    });

    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount / fileEntries.length) * 100));
    }
  }

  // Generate breakdown summary
  const summary = {
    totalFiles: extractedFiles.length,
    totalSizeBytes: totalUncompressedBytes,
    totalSizeFormatted: totalUncompressedBytes < 1024 * 1024 
      ? `${(totalUncompressedBytes / 1024).toFixed(1)} KB`
      : `${(totalUncompressedBytes / (1024 * 1024)).toFixed(2)} MB`,
    cobolPrograms: extractedFiles.filter(f => f.classification === 'cobol_program').length,
    copybooks: extractedFiles.filter(f => f.classification === 'copybook').length,
    jclFiles: extractedFiles.filter(f => f.classification === 'jcl').length,
    sqlFiles: extractedFiles.filter(f => f.classification === 'sql').length,
    docFiles: extractedFiles.filter(f => f.classification === 'documentation').length,
    configFiles: extractedFiles.filter(f => f.classification === 'configuration').length,
    unsupportedFiles: extractedFiles.filter(f => f.classification === 'unsupported').length,
    supportedForAnalysis: extractedFiles.filter(f => f.analysisSupport === 'supported').length,
    stagedForReference: extractedFiles.filter(f => f.analysisSupport === 'staged_reference').length
  };

  return {
    projectName,
    files: extractedFiles,
    summary
  };
}
