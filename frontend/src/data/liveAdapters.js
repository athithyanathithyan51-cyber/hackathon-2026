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

/**
 * Timeline events from live analysis: baseline versions, evidence submissions and new versions.
 * Shape matches EvidenceTimeline and AnalysisHistorySection.
 */
export function toTimelineEvents(findings, historyMap, evidenceLog) {
  const events = [];
  findings.forEach((f) => {
    const versions = historyMap[f.id] || [];
    versions.forEach((v) => {
      const isBaseline = v.version === 1;
      events.push({
        id: `${f.id}-v${v.version}`,
        timestamp: v.timestamp,
        title: isBaseline ? 'Business rule extracted' : `Version ${v.version} recorded`,
        category: isBaseline ? 'Analysis' : 'Reassessment',
        description: `${f.function} (${f.file}:${f.start_line}): ${v.change_reason}`,
        badge: isBaseline ? 'v1.0 Baseline' : `v${v.version}.0`,
        badgeVariant: isBaseline ? 'neutral' : 'success',
        linkedId: f.id
      });
    });
  });
  (evidenceLog || []).forEach((entry, idx) => {
    const linked = entry.linked_findings || [];
    events.push({
      id: `evidence-${idx}`,
      timestamp: 'This session',
      title: `Evidence ${entry.evidence} processed`,
      category: 'Evidence',
      description: linked.length
        ? `Linked to ${linked.length} rule(s): ${linked.map((l) => `${l.match.toLowerCase()} (${l.finding_id})`).join(', ')}`
        : 'No rule matched this evidence.',
      badge: `${linked.length} linked`,
      badgeVariant: linked.length ? 'warning' : 'neutral',
      linkedId: entry.evidence
    });
  });
  return events;
}

/**
 * Version comparison rows (v1 baseline vs latest) for the first finding that has more than one version.
 * Returns an empty list when nothing has been reassessed yet.
 */
export function toComparisonRows(findings, historyMap) {
  const changed = findings.find((f) => (historyMap[f.id] || []).length > 1);
  if (!changed) return [];
  const versions = historyMap[changed.id];
  const first = versions[0];
  const last = versions[versions.length - 1];
  const row = (field, a, b) => ({
    field,
    v1: String(a ?? '—'),
    v2: String(b ?? '—'),
    changed: String(a) !== String(b)
  });
  return [
    row('Business understanding', first.change_reason, last.change_reason),
    row('Evidence status', first.evidence_status, last.evidence_status),
    row('Risk category', first.risk_category, last.risk_category),
    row('Risk score', first.risk_score, last.risk_score),
    row('Version', `v${first.version}`, `v${last.version}`)
  ];
}

/**
 * Evidence-to-rule association for the latest evidence submission.
 * Shape matches EvidenceAssociationCard.
 */
export function toAssociation(evidenceEntry, findings) {
  if (!evidenceEntry || !(evidenceEntry.linked_findings || []).length) return null;
  const link = evidenceEntry.linked_findings[0];
  const f = findings.find((x) => x.id === link.finding_id);
  if (!f) return null;
  const match = (f.evidence || []).find((e) => e.source === evidenceEntry.evidence);
  return {
    evidenceId: evidenceEntry.evidence,
    matchedFunction: f.function,
    matchedRuleId: f.id,
    matchedRuleName: f.function,
    sourceFile: f.file,
    lineReference: `Lines ${f.start_line}`,
    relationship: link.match,
    relationshipType: link.match === 'CONFLICTED' ? 'conflicting' : 'supporting',
    reason: match ? match.explanation : f.description,
    confidenceImpact: `Evidence status now ${f.evidence_status.replace(/_/g, ' ').toLowerCase()}`,
    uncertaintyFlag: 'Incident text is evidence, not approved policy. A business owner must confirm it.'
  };
}
