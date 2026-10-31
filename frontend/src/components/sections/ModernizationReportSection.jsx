import { useState, useMemo } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useProject } from '../../context/ProjectContext';
import { REGRESSION_TEST_SCENARIOS } from '../../data/mockCobolData';

export default function ModernizationReportSection({ onNavigate }) {
  const {
    report,
    plan,
    findings,
    activeFile,
    isReassessed,
    isBackendOnline,
    impactMap
  } = useProject();

  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive component strategy recommendations from live findings or fallback
  const componentStrategies = useMemo(() => {
    if (findings && findings.length > 0) {
      return findings.map((f, idx) => {
        const strat = f.recommendation?.toUpperCase() || (f.risk_category === 'HIGH' ? 'REFACTOR' : 'RETAIN');
        const isDisputed = f.evidence_status === 'CONFLICTED_BY_EVIDENCE';

        return {
          id: f.id,
          paragraph: f.function,
          ruleId: `BR-00${idx + 1}`,
          lines: `Line ${f.start_line}`,
          strategy: strat === 'INVESTIGATE' ? 'RETAIN' : strat,
          strategyBadge: strat === 'INVESTIGATE' ? 'warning' : strat === 'REFACTOR' ? 'info' : 'neutral',
          verdict: strat === 'INVESTIGATE' ? 'INVESTIGATE (REVIEW REQUIRED)' : `${strat} CANDIDATE`,
          targetArtifact: f.function.includes('2100') 
            ? 'PenaltyCalculationService.java (@Service)' 
            : f.function.includes('2000') 
            ? 'PaymentSettlementService.java (@Transactional)' 
            : 'AccountStatus.java (Enum)',
          recommendation: isDisputed 
            ? 'Gated by incident evidence INC-101. Reconcile payment extension policy before attempting modernization.' 
            : `Modernize ${f.function} into a clean Java 21 service method after characterization tests pass.`,
          risk: `${f.risk_category || 'MEDIUM'} Risk (${f.risk_score || 50}/100)`
        };
      });
    }

    // Default reference model
    return [
      {
        id: 'COMP-01',
        paragraph: '2100-CALCULATE-PENALTY',
        ruleId: 'BR-001',
        lines: 'Lines 37–44',
        strategy: isReassessed ? 'RETAIN' : 'REFACTOR',
        strategyBadge: isReassessed ? 'warning' : 'info',
        verdict: isReassessed ? 'REVIEW REQUIRED (Gated by INC-101)' : 'READY FOR REFACTOR',
        targetArtifact: 'PenaltyCalculationService.java (@Service)',
        recommendation: isReassessed
          ? 'Retain current routine in place or halt automated conversion until retail banking domain owners verify the payment extension exemption policy.'
          : 'Refactor into Java 21 Spring Boot service utilizing immutable AccountRecord and BigDecimal arithmetic.',
        risk: isReassessed ? 'High Risk (Disputed Behavior)' : 'Medium Risk'
      },
      {
        id: 'COMP-02',
        paragraph: '2000-PROCESS-PAYMENT',
        ruleId: 'BR-002',
        lines: 'Lines 31–35',
        strategy: 'REFACTOR',
        strategyBadge: 'info',
        verdict: 'REVIEW TRANSACTION CONTRACT',
        targetArtifact: 'PaymentSettlementUseCase.java (@Transactional)',
        recommendation: 'Extract as Spring Boot transactional orchestrator. Requires database ledger schema to log deducted penalty fees idempotently.',
        risk: 'High (Direct Balance Mutation)'
      },
      {
        id: 'COMP-03',
        paragraph: '1000-CHECK-ACCOUNT-STATUS',
        ruleId: 'BR-003',
        lines: 'Lines 24–29',
        strategy: 'RETAIN',
        strategyBadge: 'neutral',
        verdict: 'MAP TO ENUM',
        targetArtifact: 'AccountStatus.java (Enum: ACTIVE, OVERDRAWN)',
        recommendation: 'Deterministic classification logic with zero side effects. Direct mapping to type-safe Java 21 enum. Lowest migration effort.',
        risk: 'Low Risk (Zero Side Effects)'
      }
    ];
  }, [findings, isReassessed]);

  // Migration phases from live backend report/plan or fallback
  const migrationPhases = useMemo(() => {
    if (report?.migration_phases && report.migration_phases.length > 0) {
      return report.migration_phases.filter(p => p.actions && p.actions.length > 0);
    }
    if (plan?.phases && plan.phases.length > 0) {
      return plan.phases.filter(p => p.actions && p.actions.length > 0);
    }

    return [
      {
        name: 'Phase 1: Validate and Characterize',
        actions: [
          'Confirm business rule in 2100-CALCULATE-PENALTY with domain owners regarding extension waivers.',
          'Execute golden-master characterization regression tests on boundary balance inputs (1000.00, 850.00, 2500.00).'
        ]
      },
      {
        name: 'Phase 2: Refactor with Automated Unit Tests',
        actions: [
          'Synthesize PenaltyCalculationService.java in Java 21 LTS using Spring Boot 3.3.x.',
          'Assert exact boundary behavior match using JUnit 5 assertions.'
        ]
      },
      {
        name: 'Phase 3: Migrate Low-Risk Rules',
        actions: [
          'Model 1000-CHECK-ACCOUNT-STATUS as type-safe Java 21 enum AccountStatus { ACTIVE, OVERDRAWN }.'
        ]
      }
    ];
  }, [report, plan]);

  // Engine recommendations from backend
  const engineRecommendations = report?.recommendations || [];

  // Live regression tests from impact map if available
  const liveRegressionTests = useMemo(() => {
    const tests = [];
    Object.values(impactMap).forEach(imp => {
      if (imp?.regression_tests && Array.isArray(imp.regression_tests)) {
        imp.regression_tests.forEach((t, i) => {
          tests.push({
            id: `ENG-TEST-${i + 1}`,
            title: `Engine Test: ${imp.finding_id.slice(0, 10)}`,
            boundary: t.note || 'AST Boundary',
            inputs: t.input,
            expected: t.expected,
            status: 'Synthesized by test_generator'
          });
        });
      }
    });
    return tests;
  }, [impactMap]);

  return (
    <div className="space-y-6">
      {/* Header Banner - White-Primary */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Consolidated Modernization Assessment
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Live Backend Report' : 'Reference Model'}
            </Badge>
            <Badge variant="info" size="xs">
              Java 21 LTS + Spring Boot 3.x
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Evidence-Gated Modernization Report
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl mt-0.5">
            Comprehensive modernization assessment synthesizing code facts, risk factors, 4R strategy recommendations, dependency-ordered migration phases, and characterization regression tests.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('cobol-analysis')}
          >
            &larr; Return to Workspace
          </Button>
        </div>
      </div>

      {/* Target Disclaimer Note */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs flex items-center justify-between gap-3">
        <div>
          <strong>Modernization Planning Scope:</strong> LegacyIQ formulates architectural recommendations and test specifications for COBOL-85 to Java 21 LTS and Spring Boot 3.x clean architecture. It does <em>not</em> claim automatic code conversion.
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-100 font-mono text-[10px] text-blue-800 shrink-0 font-bold">
          PLANNING & GATING
        </span>
      </div>

      {/* 1. Executive Summary & Program Baseline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Program Identity</span>
          <div className="font-mono font-bold text-slate-900 text-sm">{activeFile?.name || 'PENALTY.cbl'}</div>
          <div className="text-[11px] text-slate-500">PROGRAM-ID: {activeFile?.programId || 'PENALTY-CALCULATOR'}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Rules Analyzed</span>
          <div className="font-bold text-slate-900 text-sm">
            {report?.verification?.rules?.length || findings?.length || 2} Rules
          </div>
          <div className="text-[11px] text-slate-500">100% cited with source lines</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Evidence Gating</span>
          <div className={`font-bold text-sm ${isReassessed ? 'text-amber-700' : 'text-emerald-700'}`}>
            {isReassessed ? 'Gated by INC-101' : 'Baseline Verified'}
          </div>
          <div className="text-[11px] text-slate-500">
            {isReassessed ? 'Exemption policy conflict' : 'Deterministic code baseline'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Target Architecture</span>
          <div className="font-bold text-blue-700 text-sm">Java 21 + Spring Boot</div>
          <div className="text-[11px] text-slate-500">Hexagonal Clean Domain Core</div>
        </div>
      </div>

      {/* 2. Unresolved Evidence Conflicts (INC-101) */}
      {isReassessed && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase font-mono tracking-wider">
              Governance Gate: Unresolved Incident Evidence (INC-101)
            </span>
            <Badge variant="danger" size="xs">Migration Approval Locked</Badge>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Customer dispute stream incident <strong>INC-101</strong> reported that retail deposit accounts with approved payment extensions were incorrectly assessed the ₹50 fee. While the copybook <code>ACCTREC.cpy</code> defines the field <code>WS-PAYMENT-EXT-FLAG</code>, the PROCEDURE DIVISION logic in <code>2100-CALCULATE-PENALTY</code> omits this check. Modernizing as-is into Java 21 will replicate the bug. Automated conversion is halted until retail banking domain owners verify the waiver policy contract.
          </p>
        </div>
      )}

      {/* 3. Component Modernization Verdicts (4R Strategy) */}
      <Card
        title="Component Modernization Recommendations (4R Assessment)"
        subtitle="Retain, Refactor, Replace, or Remove strategies assigned per COBOL paragraph"
        badge={<Badge variant="info" size="xs">4R Strategy</Badge>}
      >
        <div className="space-y-3">
          {componentStrategies.map((comp) => (
            <div
              key={comp.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {comp.paragraph}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {comp.lines}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={comp.strategyBadge} size="xs">
                    Strategy: {comp.strategy}
                  </Badge>
                  <span className="font-mono text-[11px] font-semibold text-slate-700">
                    {comp.verdict}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-[11px]">
                {comp.recommendation}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                <span>Target: {comp.targetArtifact}</span>
                <span>{comp.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Engine Recommendations List from Backend Report */}
      {engineRecommendations.length > 0 && (
        <Card
          title="Engine Recommendations (From /api/projects/{id}/report)"
          subtitle="Specific architectural instructions generated by backend report engine"
          badge={<Badge variant="neutral" size="xs">{engineRecommendations.length} Recommendations</Badge>}
        >
          <div className="space-y-2 text-xs text-slate-700">
            {engineRecommendations.map((rec, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Recommended Migration Sequence */}
      <Card
        title="Dependency-Ordered Migration Sequence"
        subtitle="Phased migration sequence derived from call graphs and risk scores"
        badge={<Badge variant="neutral" size="xs">{migrationPhases.length} Phases</Badge>}
      >
        <div className="space-y-2.5 text-xs">
          {migrationPhases.map((phase, pIdx) => (
            <div key={pIdx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                  {pIdx + 1}
                </span>
                <span className="font-semibold text-slate-900 text-xs">
                  {phase.name}
                </span>
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside pl-6">
                {phase.actions.map((act, aIdx) => (
                  <li key={aIdx}>{act}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. JUnit 5 Characterization Regression Test Suggestions */}
      <Card
        title="Suggested Characterization Regression Scenarios (JUnit 5)"
        subtitle="Boundary test cases synthesized from AST conditions to guarantee zero divergence"
        badge={<Badge variant="success" size="xs">Regression Suite</Badge>}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
            <strong>Characterization Testing Principle:</strong> Verify legacy behavior across all boundary edge-cases before retiring the COBOL routine. These assertions provide the acceptance criteria for the Java 21 implementation.
          </div>

          <div className="space-y-2.5">
            {/* Live regression tests from test_generator if available */}
            {liveRegressionTests.map((scen) => (
              <div
                key={scen.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{scen.title}</span>
                  <Badge variant="info" size="xs">{scen.status}</Badge>
                </div>
                <div className="text-[11px] text-slate-600">
                  <div><strong>Inputs:</strong> <code className="font-mono">{scen.inputs}</code></div>
                  <div><strong>Expected:</strong> <span className="text-slate-800">{scen.expected}</span></div>
                </div>
              </div>
            ))}

            {/* Standard Grounded Regression Scenarios */}
            {REGRESSION_TEST_SCENARIOS.map((scen) => (
              <div
                key={scen.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 px-1.5 py-0.2 rounded bg-white border border-slate-200">
                      {scen.id}
                    </span>
                    <span className="font-semibold text-slate-900">{scen.title}</span>
                  </div>
                  <Badge variant={scen.status.includes('Validation') ? 'warning' : 'success'} size="xs">
                    {scen.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div><strong>Boundary:</strong> <code className="font-mono text-slate-800">{scen.boundary}</code></div>
                  <div><strong>Inputs:</strong> <code className="font-mono text-slate-800">{scen.inputs}</code></div>
                </div>

                {/* Java Assertion Snippet with Copy */}
                <div className="p-2.5 rounded-md bg-slate-900 text-slate-100 font-mono text-[11px] flex items-center justify-between gap-2 border border-slate-800">
                  <span className="truncate text-emerald-400">{scen.targetJavaAssertion}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(scen.id, scen.targetJavaAssertion)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] shrink-0 cursor-pointer"
                  >
                    {copiedId === scen.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
