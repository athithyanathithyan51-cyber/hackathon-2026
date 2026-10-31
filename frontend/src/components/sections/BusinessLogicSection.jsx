import { useState, useMemo } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useProject } from '../../context/ProjectContext';

export default function BusinessLogicSection({ onNavigate }) {
  const {
    findings,
    plan,
    isReassessed,
    submitEvidence,
    referenceRules,
    isBackendOnline,
    activeFile,
    navigationTarget,
    clearNavigationTarget
  } = useProject();

  const [userSelectedRuleId, setUserSelectedRuleId] = useState(null);
  const [prevNavTimestamp, setPrevNavTimestamp] = useState(navigationTarget?.timestamp);

  if (navigationTarget?.timestamp !== prevNavTimestamp) {
    setPrevNavTimestamp(navigationTarget?.timestamp);
    setUserSelectedRuleId(null);
  }

  const [fileFilter, setFileFilter] = useState('ALL');
  const [evidenceInput, setEvidenceInput] = useState(
    'Customers with an approved payment extension should be exempt from the minimum balance penalty. The application appears to charge these customers unconditionally.'
  );
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Map backend findings or reference rules
  const rules = useMemo(() => {
    if (findings && findings.length > 0) {
      return findings.map((f, idx) => {
        const planFinding = plan?.findings?.find(pf => pf.id === f.id);
        const isDisputed = f.evidence_status === 'CONFLICTED_BY_EVIDENCE';
        
        return {
          id: f.id,
          displayId: `BR-00${idx + 1}`,
          title: f.description?.split(':')[0] || `Rule in ${f.function}`,
          program: f.file || activeFile?.name || 'PENALTY.cbl',
          paragraph: f.function,
          lines: `Line ${f.start_line}`,
          startLine: f.start_line,
          observedCondition: planFinding?.condition || f.description,
          expectedBehavior: f.recommendation ? `Action: ${f.recommendation}` : 'Standard path',
          interpretation: planFinding?.interpretation?.business_explanation || f.description,
          questions: planFinding?.interpretation?.questions || [],
          modelUsed: planFinding?.interpretation?.model || 'deterministic-ast',
          isFallback: planFinding?.interpretation?.is_fallback ?? true,
          verificationStatus: isDisputed ? 'CONFLICTED_BY_EVIDENCE' : f.evidence_status,
          risk: `${f.risk_category || 'MEDIUM'} (${f.risk_score || 50}/100)`,
          riskVariant: f.risk_category === 'CRITICAL' ? 'danger' : f.risk_category === 'HIGH' ? 'danger' : f.risk_category === 'LOW' ? 'success' : 'warning',
          evidence: f.evidence || [],
          isLiveBackend: true
        };
      });
    }

    // Reference model fallback when backend findings are empty
    return referenceRules.map(r => ({
      ...r,
      displayId: r.id,
      program: activeFile?.name || 'PENALTY.cbl',
      riskVariant: r.risk.includes('High') ? 'danger' : r.risk.includes('Medium') ? 'warning' : 'neutral',
      isLiveBackend: false
    }));
  }, [findings, plan, referenceRules, activeFile]);

  // Unique programs for grouping filter
  const uniquePrograms = useMemo(() => {
    const set = new Set(rules.map(r => r.program).filter(Boolean));
    return Array.from(set);
  }, [rules]);

  // Filtered rules by selected program
  const filteredRules = useMemo(() => {
    if (fileFilter === 'ALL') return rules;
    return rules.filter(r => r.program === fileFilter);
  }, [rules, fileFilter]);

  // Determine matched rule ID from navigationTarget if provided
  const navRuleId = useMemo(() => {
    if (!navigationTarget?.ruleId) return null;
    const match = rules.find(
      r => r.id === navigationTarget.ruleId || r.displayId === navigationTarget.ruleId
    );
    return match ? match.id : null;
  }, [navigationTarget, rules]);

  // Select active rule: user manual selection -> deep navigation link -> default first
  const activeSelectedId = userSelectedRuleId || navRuleId || filteredRules[0]?.id || rules[0]?.id;
  const selectedRule = rules.find(r => r.id === activeSelectedId) || filteredRules[0] || rules[0];
  const setSelectedRuleId = setUserSelectedRuleId;

  const handleSimulateEvidence = async () => {
    setIsSubmittingEvidence(true);
    try {
      await submitEvidence('INC-101', evidenceInput);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Return to Modernization Report banner when navigated from report */}
      {navigationTarget?.from === 'modernization-report' && (
        <div className="flex items-center justify-between p-3 px-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
              Modernization Flow
            </span>
            <span>Deep dive active: Inspecting business rules & evidence reconciliation linked from Modernization Report</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearNavigationTarget();
              onNavigate('modernization-report');
            }}
            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
          >
            &larr; Back to Modernization Report
          </button>
        </div>
      )}

      {/* Header Banner - White Primary, Soft-Neutral */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Extracted Business Logic
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Live Engine Findings' : 'Offline Reference Model'}
            </Badge>
            <Badge variant={isReassessed ? 'warning' : 'neutral'} size="xs">
              {isReassessed ? 'Evidence Reassessment Active' : 'Baseline Extraction'}
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Business Rules & Evidence Provenance
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Traceable business rules extracted from COBOL PROCEDURE DIVISION statements. Code facts are derived deterministically from the AST; interpretations and incident claims are clearly demarcated.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('dependencies-risks')}
          >
            Dependencies & Risks &rarr;
          </Button>
        </div>
      </div>

      {/* Incident Evidence Ingestion / Simulation Panel */}
      <div className={`p-4 rounded-xl border text-xs transition-colors ${
        isReassessed 
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-xs uppercase font-mono tracking-wider block">
                {isReassessed ? 'Active Dispute: Incident INC-101 Correlated' : 'Operational Evidence Ingestion (INC-101)'}
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {isReassessed 
                  ? 'The backend evidence matcher linked INC-101 to the penalty calculation routine, detecting a missing exemption check and elevating risk.'
                  : 'Ingest production tickets or dispute streams to test adaptive evidence reconciliation with source code.'
                }
              </p>
            </div>
            <Badge variant={isReassessed ? 'danger' : 'neutral'} size="xs">
              {isReassessed ? 'Status: CONFLICTED_BY_EVIDENCE' : 'Awaiting New Evidence'}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={evidenceInput}
              onChange={(e) => setEvidenceInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter incident or policy evidence..."
              disabled={isSubmittingEvidence}
            />
            <Button
              variant={isReassessed ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleSimulateEvidence}
              disabled={isSubmittingEvidence}
              className="shrink-0"
            >
              {isSubmittingEvidence ? 'Reassessing...' : isReassessed ? 'Re-run Reassessment' : 'Submit Incident INC-101'}
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Business Rules Table */}
      <Card
        title="Business Rules Inventory"
        subtitle={`Scope: ${activeFile?.name || 'PENALTY.cbl'} • Source AST Grounded`}
        badge={
          <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs">
            {filteredRules.length} of {rules.length} Rules
          </Badge>
        }
      >
        {/* Multi-File Program Filter Pills */}
        {uniquePrograms.length > 1 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 font-mono">Filter by Program:</span>
            <button
              type="button"
              onClick={() => setFileFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                fileFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Programs ({rules.length})
            </button>
            {uniquePrograms.map((prog) => (
              <button
                key={prog}
                type="button"
                onClick={() => setFileFilter(prog)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                  fileFilter === prog
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {prog.split('/').pop()} ({rules.filter(r => r.program === prog).length})
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Program</th>
                <th className="py-2.5 px-3">Paragraph / Function</th>
                <th className="py-2.5 px-3">Lines</th>
                <th className="py-2.5 px-3">Condition (Code Fact)</th>
                <th className="py-2.5 px-3">Evidence Status</th>
                <th className="py-2.5 px-3">Risk Category</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRules.map((rule) => {
                const isSelected = rule.id === activeSelectedId;
                const isDisputed = rule.verificationStatus === 'CONFLICTED_BY_EVIDENCE' || (rule.paragraph.includes('2100') && isReassessed);

                return (
                  <tr
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/70 font-medium text-slate-900' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {rule.displayId || rule.id.slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {rule.program.split('/').pop()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">
                      {rule.paragraph}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {rule.lines}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-[240px] truncate">
                      {rule.observedCondition}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={isDisputed ? 'danger' : 'success'} size="xs">
                        {isDisputed ? 'CONFLICTED' : rule.verificationStatus || 'OBSERVED_IN_CODE'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={rule.riskVariant || 'neutral'} size="xs">
                        {rule.risk ? rule.risk.split(' ')[0] : 'MEDIUM'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600 capitalize">
                      {rule.expectedBehavior?.replace('Action: ', '') || 'Refactor'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Rule Inspection & Grounding */}
      {selectedRule && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Rule Detail & Traceability */}
          <div className="lg:col-span-7 space-y-4">
            <Card
              title={`${selectedRule.displayId || selectedRule.id.slice(0, 10)}: ${selectedRule.paragraph}`}
              subtitle={`Source Grounding: ${selectedRule.program} (${selectedRule.lines})`}
              badge={
                <Badge 
                  variant={selectedRule.verificationStatus === 'CONFLICTED_BY_EVIDENCE' || (selectedRule.paragraph.includes('2100') && isReassessed) ? 'danger' : 'success'} 
                  size="xs"
                >
                  {selectedRule.verificationStatus === 'CONFLICTED_BY_EVIDENCE' || (selectedRule.paragraph.includes('2100') && isReassessed) ? 'Conflicted by Evidence' : 'Observed Code Fact'}
                </Badge>
              }
            >
              <div className="space-y-3.5 text-xs">
                {/* Code Fact (AST) */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider font-mono">
                    Deterministic Code Fact (AST)
                  </span>
                  <p className="text-slate-800 font-mono text-[11px] leading-relaxed">
                    {selectedRule.observedCondition}
                  </p>
                </div>

                {/* AI / Heuristic Interpretation */}
                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-blue-700 font-mono">
                    <span className="font-semibold uppercase tracking-wider">Business Interpretation</span>
                    <span>Model: {selectedRule.modelUsed || 'deterministic-fallback'}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {selectedRule.interpretation}
                  </p>
                </div>

                {/* Questions for Human Validation if provided by engine */}
                {selectedRule.questions && selectedRule.questions.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Questions for Human Business Owner Validation:
                    </span>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                      {selectedRule.questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exact Source Code Snippet */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span>Source Grounding ({selectedRule.lines})</span>
                    <span>{selectedRule.paragraph}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800">
                    <div className="text-slate-400">{`* ${selectedRule.paragraph} Routine`}</div>
                    <div className="text-amber-300">{selectedRule.observedCondition}</div>
                    <div className="text-slate-400">END-IF.</div>
                  </div>
                </div>

                {/* Linked Evidence Items from Backend */}
                {selectedRule.evidence && selectedRule.evidence.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-900 block text-[11px]">
                      Correlated Evidence Artifacts:
                    </span>
                    {selectedRule.evidence.map((ev, i) => (
                      <div key={i} className="p-2.5 rounded bg-rose-50 border border-rose-200 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between font-bold text-rose-900">
                          <span>{ev.source}</span>
                          <Badge variant="danger" size="xs">{ev.match}</Badge>
                        </div>
                        <p className="text-rose-800 text-[10px]">{ev.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: Modernization Target Specification */}
          <div className="lg:col-span-5 space-y-4">
            <Card
              title="Target Modernization Architecture"
              subtitle="Java 21 + Spring Boot 3.3.x Domain Service Specification"
              badge={<Badge variant="info" size="xs">Java 21 LTS</Badge>}
            >
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Domain Component</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">
                    PenaltyCalculationService.java (@Service)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto">
                  <pre>
{`// Target Architecture: Java 21 LTS + Spring Boot 3.3.x
package com.bank.penalty.domain.service;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import com.bank.account.domain.model.AccountRecord;

@Service
public class PenaltyCalculationService {
    private static final BigDecimal THRESHOLD = new BigDecimal("1000.00");
    private static final BigDecimal PENALTY   = new BigDecimal("50.00");

    public BigDecimal calculate(AccountRecord account) {
        // [AUDIT]: Flagged by INC-101
        if (account.paymentExtensionApproved()) {
            return BigDecimal.ZERO;
        }
        if (account.balance().compareTo(THRESHOLD) < 0) {
            return PENALTY;
        }
        return BigDecimal.ZERO;
    }
}`}
                  </pre>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => onNavigate('cobol-analysis')}
                  >
                    Locate in Source Viewer
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => onNavigate('dependencies-risks')}
                  >
                    Analyze Dependencies &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
