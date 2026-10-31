/**
 * cobolAnalysisHelper.js
 * 
 * Provides deterministic client-side extraction of data items, paragraphs,
 * and structural hierarchy for individual COBOL programs and copybooks.
 * Mirrors the regex profiling patterns in legacyiq_engine/analyzer/cobol_profile.py.
 */

const PROGRAM_ID_REGEX = /PROGRAM-ID\.\s*([A-Za-z0-9-]+)/i;
const DATA_ITEM_REGEX = /^\s*(\d{2})\s+([A-Za-z0-9-]+)\b(.*)$/;
const PIC_REGEX = /\bPIC(?:TURE)?\s+(?:IS\s+)?(\S+)/i;
const USAGE_REGEX = /\b(COMP-3|COMP-5|COMP|BINARY|PACKED-DECIMAL|DISPLAY)\b/i;
const VALUE_REGEX = /\bVALUE\s+(?:IS\s+)?([^\s.]+|"[^"]*"|'[^']*')/i;
const COPY_REGEX = /\bCOPY\s+([A-Za-z0-9-]+)/i;
const PERFORM_REGEX = /\bPERFORM\s+([A-Za-z0-9-]+)/gi;
const CALL_REGEX = /\bCALL\s+['"]([A-Za-z0-9-]+)['"]/gi;
const SECTION_REGEX = /^\s*([A-Za-z0-9-]+)\s+SECTION\.\s*$/i;
const PARAGRAPH_REGEX = /^\s*([A-Za-z0-9-]+)\.\s*$/;

// Strips fixed 80-column sequence numbers (cols 1-6) and inline comments
function cleanLine(raw) {
  let line = raw;
  if (line.length > 6 && /^\d{6}/.test(line.slice(0, 6))) {
    line = line.slice(6);
  }
  if (line.includes('*>')) {
    line = line.split('*>')[0];
  }
  return line;
}

function isCommentLine(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('*') || trimmed.startsWith('/')) return true;
  if (raw.length > 6 && raw[6] === '*') return true;
  return false;
}

/**
 * Calculates byte size estimation from a PIC clause string (e.g. S9(7)V99 -> 9 bytes)
 */
export function estimatePicBytes(pic) {
  if (!pic) return 0;
  const clean = pic.toUpperCase().replace(/\.$/, '');
  let total = 0;

  // Handle repeated patterns like X(10) or 9(5)
  const expanded = clean.replace(/([9XASV])\((\d+)\)/g, (_, char, count) => {
    return char.repeat(parseInt(count, 10));
  });

  for (const char of expanded) {
    if (char === '9' || char === 'X' || char === 'A') {
      total += 1;
    }
    // S and V are virtual signs/decimal points in COBOL, taking 0 physical display bytes
  }
  return total || 1;
}

/**
 * Analyzes source code of any file and returns file-specific analysis:
 * - Data items (levels, PIC, usage, initial value)
 * - Structural hierarchy (PROGRAM-ID, divisions, sections, paragraphs, calls)
 * - Extracted rule candidates (if not already provided by backend)
 */
export function analyzeFileContent(file) {
  if (!file || !file.content) {
    return {
      fileType: 'unknown',
      programId: null,
      dataItems: [],
      paragraphs: [],
      divisions: [],
      sections: [],
      copies: [],
      rules: [],
      summary: 'No source content available.'
    };
  }

  const ext = (file.extension || '').toLowerCase().replace(/^\./, '');
  const lines = file.content.split('\n');

  // Handle non-COBOL files (JCL, SQL, Markdown, Config, Unsupported)
  if (ext !== 'cbl' && ext !== 'cob' && ext !== 'cpy') {
    return {
      fileType: ext || 'text',
      isCobol: false,
      isCopybook: false,
      programId: null,
      dataItems: [],
      paragraphs: [],
      divisions: [],
      sections: [],
      copies: [],
      rules: [],
      summary: `Non-COBOL project file (${file.classification || ext.toUpperCase()}). AST parsing and COBOL data declarations are not applicable.`
    };
  }

  // Handle Copybooks (.cpy)
  if (ext === 'cpy') {
    const dataItems = [];
    let currentParent = null;

    lines.forEach((raw, idx) => {
      if (isCommentLine(raw)) return;
      const text = cleanLine(raw).trim();
      if (!text) return;

      const itemMatch = text.match(DATA_ITEM_REGEX);
      if (itemMatch) {
        const level = parseInt(itemMatch[1], 10);
        const name = itemMatch[2];
        const rest = itemMatch[3];
        const pic = rest ? rest.match(PIC_REGEX) : null;
        const usage = rest ? rest.match(USAGE_REGEX) : null;
        const value = rest ? rest.match(VALUE_REGEX) : null;

        const isGroup = !pic;
        if (level === 1) {
          currentParent = name;
        }

        dataItems.push({
          id: `var-${idx}`,
          name,
          level,
          pic: pic ? pic[1].replace(/\.$/, '') : '(Group)',
          usage: usage ? usage[1].toUpperCase() : 'DISPLAY',
          value: value ? value[1].replace(/\.$/, '') : null,
          line: idx + 1,
          isGroup,
          parentGroup: level > 1 ? currentParent : null,
          bytes: pic ? estimatePicBytes(pic[1]) : 0,
          role: isGroup ? 'Record Group Header' : 'Elementary Copybook Field'
        });
      }
    });

    const totalBytes = dataItems.reduce((acc, d) => acc + (d.bytes || 0), 0);

    return {
      fileType: 'copybook',
      isCobol: true,
      isCopybook: true,
      programId: dataItems[0]?.name || file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
      dataItems,
      paragraphs: [],
      divisions: [],
      sections: [],
      copies: [],
      rules: [],
      totalRecordBytes: totalBytes,
      summary: `COBOL Copybook defining record structure with ${dataItems.length} field declaration(s). Total estimated footprint: ${totalBytes} bytes.`
    };
  }

  // Handle COBOL Programs (.cbl, .cob)
  let programId = null;
  const divisions = [];
  const sections = [];
  const dataItems = [];
  const paragraphs = [];
  const copies = [];
  const internalRules = [];

  let inDataDivision = false;
  let inProcedureDivision = false;
  let currentSection = 'GLOBAL';
  let currentParagraph = null;
  let currentParentGroup = null;

  lines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    if (isCommentLine(raw)) return;
    const text = cleanLine(raw).trim();
    if (!text) return;

    // PROGRAM-ID
    const progMatch = text.match(PROGRAM_ID_REGEX);
    if (progMatch) {
      programId = progMatch[1].replace(/\.$/, '');
    }

    // COPY
    const copyMatch = text.match(COPY_REGEX);
    if (copyMatch) {
      copies.push({
        copybook: copyMatch[1].replace(/\.$/, ''),
        line: lineNum
      });
    }

    // DIVISIONS
    if (/IDENTIFICATION\s+DIVISION/i.test(text)) {
      divisions.push({ name: 'IDENTIFICATION DIVISION', line: lineNum });
      inDataDivision = false;
      inProcedureDivision = false;
      return;
    }
    if (/ENVIRONMENT\s+DIVISION/i.test(text)) {
      divisions.push({ name: 'ENVIRONMENT DIVISION', line: lineNum });
      inDataDivision = false;
      inProcedureDivision = false;
      return;
    }
    if (/DATA\s+DIVISION/i.test(text)) {
      divisions.push({ name: 'DATA DIVISION', line: lineNum });
      inDataDivision = true;
      inProcedureDivision = false;
      return;
    }
    if (/PROCEDURE\s+DIVISION/i.test(text)) {
      divisions.push({ name: 'PROCEDURE DIVISION', line: lineNum });
      inDataDivision = false;
      inProcedureDivision = true;
      return;
    }

    // SECTIONS
    const secMatch = text.match(SECTION_REGEX);
    if (secMatch && !/DIVISION/i.test(text)) {
      currentSection = secMatch[1];
      sections.push({ name: currentSection, line: lineNum, inProcedure: inProcedureDivision });
      return;
    }

    // DATA DIVISION ITEM PARSING
    if (inDataDivision) {
      const itemMatch = text.match(DATA_ITEM_REGEX);
      if (itemMatch) {
        const level = parseInt(itemMatch[1], 10);
        const name = itemMatch[2];
        const rest = itemMatch[3];
        const pic = rest ? rest.match(PIC_REGEX) : null;
        const usage = rest ? rest.match(USAGE_REGEX) : null;
        const value = rest ? rest.match(VALUE_REGEX) : null;

        const isGroup = !pic;
        if (level === 1) {
          currentParentGroup = name;
        }

        dataItems.push({
          id: `var-${lineNum}`,
          name,
          level,
          pic: pic ? pic[1].replace(/\.$/, '') : '(Group Record)',
          usage: usage ? usage[1].toUpperCase() : 'DISPLAY',
          value: value ? value[1].replace(/\.$/, '') : null,
          line: lineNum,
          section: currentSection || 'WORKING-STORAGE',
          isGroup,
          parentGroup: level > 1 ? currentParentGroup : null,
          bytes: pic ? estimatePicBytes(pic[1]) : 0,
          role: isGroup ? 'Composite Record Group' : 'Working Variable'
        });
      }
    }

    // PROCEDURE DIVISION PARAGRAPH & CALL PARSING
    if (inProcedureDivision) {
      // Check if this line is a paragraph definition (ends with period and has no keywords)
      const paraMatch = text.match(PARAGRAPH_REGEX);
      if (paraMatch && !/^(IF|ELSE|END-IF|PERFORM|MOVE|COMPUTE|CALL|STOP|GO|EXIT)\b/i.test(text)) {
        const name = paraMatch[1];
        if (currentParagraph) {
          currentParagraph.lineEnd = lineNum - 1;
        }
        currentParagraph = {
          id: `para-${name}`,
          name,
          lineStart: lineNum,
          lineEnd: lineNum,
          performs: [],
          calls: [],
          summary: `PROCEDURE routine ${name}`
        };
        paragraphs.push(currentParagraph);
        return;
      }

      // Check PERFORM statements
      let pMatch;
      while ((pMatch = PERFORM_REGEX.exec(text)) !== null) {
        const target = pMatch[1];
        if (currentParagraph && !currentParagraph.performs.includes(target)) {
          currentParagraph.performs.push(target);
        }
      }

      // Check CALL statements
      let cMatch;
      while ((cMatch = CALL_REGEX.exec(text)) !== null) {
        const target = cMatch[1];
        if (currentParagraph && !currentParagraph.calls.includes(target)) {
          currentParagraph.calls.push(target);
        }
      }

      // Extract conditional business rule candidate (IF or WHEN)
      if (/^IF\b/i.test(text) || /^WHEN\b/i.test(text)) {
        const condition = text.replace(/^IF\s+/i, '').replace(/^WHEN\s+/i, '').replace(/\bTHEN\b/i, '').trim();
        internalRules.push({
          id: `BR-${file.name.split('.')[0]}-${lineNum}`,
          title: `Rule in ${currentParagraph?.name || 'PROCEDURE'} (Line ${lineNum})`,
          paragraph: currentParagraph?.name || 'PROCEDURE',
          file: file.relativePath || file.name,
          lines: `Line ${lineNum}`,
          startLine: lineNum,
          endLine: Math.min(lineNum + 4, lines.length),
          observedCondition: condition,
          status: 'OBSERVED_IN_CODE',
          riskCategory: condition.includes('<') || condition.includes('>') ? 'HIGH' : 'MEDIUM',
          recommendation: 'refactor',
          isLiveBackend: false
        });
      }
    }
  });

  // Close the last paragraph's lineEnd
  if (currentParagraph) {
    currentParagraph.lineEnd = lines.length;
  }

  return {
    fileType: 'cobol_program',
    isCobol: true,
    isCopybook: false,
    programId: programId || file.name.split('.')[0].toUpperCase(),
    dataItems,
    paragraphs,
    divisions,
    sections,
    copies,
    rules: internalRules,
    summary: `COBOL Source Program (${programId || 'UNSPECIFIED'}) containing ${paragraphs.length} paragraph(s) and ${dataItems.length} declared variable(s).`
  };
}
