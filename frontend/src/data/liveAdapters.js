/**
 * Converts backend API responses into the shapes the existing screens render.
 *
 * Notes:
 * - Confidence values are a display convention, not an engine score:
 *   code that is observed gets 1.0 ("the code does this"), and a rule
 *   contradicted by evidence gets 0.64 (the value the UI already shows for a disputed rule).
 * - Nothing here generates code. Java names and snippets are not produced.
 */

const CONTRADICTED = 0.64;

function confidenceFor(finding) {
  return finding.evidence_status === 'CONFLICTED_BY_EVIDENCE' ? CONTRADICTED : 1.0;
}

function riskVariantFor(category) {
  if (category === 'CRITICAL' || category === 'HIGH') return 'danger';
  if (category === 'MEDIUM') return 'amber';
  return 'success';
}

function verificationFor(finding) {
  if (finding.evidence_status === 'CONFLICTED_BY_EVIDENCE') return 'CONFLICTING';
  if (finding.evidence_status === 'SUPPORTED_BY_EVIDENCE') return 'SUPPORTED';
  return 'OBSERVED IN CODE (not yet validated)';
}

function locationOf(finding) {
  return `${finding.file}:${finding.start_line}`;
}

function fnDomId(name) {
  return `fn-${name.replace(/_/g, '-')}`;
}

/** Shape used by BusinessRulesSection (rule cards). */
export function toRuleCards(findings) {
  return findings.map((f) => {
    const confidence = confidenceFor(f);
    return {
      id: f.id,
      title: f.function,
      program: f.file,
      paragraph: f.function,
      lines: `Lines ${f.start_line}`,
      observedCondition: `IF ${f.condition}`,
      expectedBehavior: f.observed_behavior,
      interpretation: f.description,
      provenance: 'OBSERVED CODE',
      evidenceReferences: [locationOf(f), ...f.evidence.map((e) => e.source)],
      confidence: confidence === 1.0 ? 'Observed in code' : 'Contradicted by evidence',
      confidenceScore: confidence,
      risk: `${f.risk_category} (score ${f.risk_score})`,
      riskVariant: riskVariantFor(f.risk_category),
      verificationStatus: verificationFor(f)
    };
  });
}

/** Shape used by BusinessRuleTable (rule candidates). */
export function toRuleCandidates(findings) {
  return findings.map((f) => ({
    id: f.id,
    ruleName: `${f.function} condition`,
    category: 'Business rule candidate',
    functionName: f.function,
    file: f.file,
    lineReference: `Lines ${f.start_line}`,
    extractedCondition: f.condition,
    observedResult: f.observed_behavior,
    interpretation: f.description,
    confidenceScore: confidenceFor(f),
    provenance: 'OBSERVED CODE'
  }));
}

/**
 * Shape used by FunctionExplorer. `functions` comes from /functions,
 * `findings` supplies conditions and behaviour, `sourceByFile` supplies the code snippet.
 */
export function toFunctions(functions, findings, sourceByFile) {
  return functions.map((fn) => {
    const own = findings.filter((f) => f.function === fn.function && f.file === fn.file);
    const lines = (sourceByFile[fn.file] || '').split('\n');
    const snippet = lines.slice(fn.start_line - 1, fn.end_line).join('\n');
    return {
      id: fnDomId(fn.function),
      name: fn.function,
      file: fn.file,
      lineStart: fn.start_line,
      lineEnd: fn.end_line,
      parameters: [],
      conditions: own.map((f) => `IF ${f.condition}`),
      returnBehavior: own.length ? own.map((f) => f.observed_behavior).join(' ') : 'No conditional behaviour recorded',
      callers: fn.called_by,
      callees: fn.calls,
      cyclomaticComplexity: fn.conditions + 1,
      codeSnippet: snippet,
      summary: own.length ? own[0].description : `Paragraph or function at lines ${fn.start_line}-${fn.end_line}.`
    };
  });
}

/** Regression suggestions flattened from every finding's impact result. */
export function toRegressionScenarios(impactMap, findings) {
  const byId = Object.fromEntries(findings.map((f) => [f.id, f]));
  const scenarios = [];
  Object.entries(impactMap).forEach(([findingId, impact]) => {
    const finding = byId[findingId];
    (impact?.regression_tests || []).forEach((test) => {
      scenarios.push({
        id: `REG-${String(scenarios.length + 1).padStart(3, '0')}`,
        title: test.note,
        boundary: test.input,
        inputs: test.input,
        expectedCobol: test.expected,
        sourceGrounding: finding ? `${locationOf(finding)} (${finding.function})` : findingId,
        status: 'Suggested (Needs Validation)'
      });
    });
  });
  return scenarios;
}
