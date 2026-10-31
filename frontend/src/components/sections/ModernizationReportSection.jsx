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
    stagedFiles,
    isReassessed,
    isBackendOnline,
    impactMap,
    overview
  } = useProject();

  const [activeStageId, setActiveStageId] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive component 4R strategies
  const componentStrategies = useMemo(() => {
    if (findings && findings.length > 0) {
      return findings.map((f, idx) => {
        const strat = f.recommendation?.toUpperCase() || (f.risk_category === 'HIGH' ? 'REFACTOR' : 'RETAIN');
        const isDisputed = f.evidence_status === 'CONFLICTED_BY_EVIDENCE' || (f.function.includes('2100') && isReassessed);

        return {
          id: f.id,
          paragraph: f.function,
          ruleId: `BR-00${idx + 1}`,
          lines: `Line ${f.start_line}`,
          sourceFile: f.file || activeFile?.name || 'PENALTY.cbl',
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
        sourceFile: activeFile?.name || 'PENALTY.cbl',
        strategy: isReassessed ? 'RETAIN' : 'REFACTOR',
        strategyBadge: isReassessed ? 'warning' : 'info',
        verdict: isReassessed ? 'REVIEW REQUIRED (Gated by INC-101)' : 'READY FOR REFACTOR',
        targetArtifact: 'PenaltyCalculationService.java (@Service)',
        recommendation: isReassessed
          ? 'Retain current routine in place or halt automated conversion until retail banking domain owners verify the payment extension exemption policy.'
          : 'Refactor into Java 21 Spring Boot service utilizing immutable AccountRecord and BigDecimal arithmetic.',
        risk: isReassessed ? 'Critical Risk (Disputed Behavior)' : 'Medium Risk'
      },
      {
        id: 'COMP-02',
        paragraph: '2000-PROCESS-PAYMENT',
        ruleId: 'BR-002',
        lines: 'Lines 31–35',
        sourceFile: activeFile?.name || 'PENALTY.cbl',
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
        sourceFile: activeFile?.name || 'PENALTY.cbl',
        strategy: 'RETAIN',
        strategyBadge: 'neutral',
        verdict: 'MAP TO ENUM',
        targetArtifact: 'AccountStatus.java (Enum: ACTIVE, OVERDRAWN)',
        recommendation: 'Deterministic classification logic with zero side effects. Direct mapping to type-safe Java 21 enum. Lowest migration effort.',
        risk: 'Low Risk (Zero Side Effects)'
      }
    ];
  }, [findings, isReassessed, activeFile]);

  // Migration phases
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

  // Live regression tests from impact map
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

  // 8 Flow Stages Definition
  const flowStages = useMemo(() => {
    const filesCount = stagedFiles.length || 1;
    const rulesCount = findings.length > 0 ? findings.length : 2;
    const hasConflicts = isReassessed || (overview?.evidence_conflicts && overview.evidence_conflicts > 0);
    const hasHighRisks = isReassessed || (overview?.risks && overview.risks > 0);

    return [
      {
        id: 1,
        title: 'Source Discovery',
        subtitle: 'Inventory & Format Verification',
        metric: `${filesCount} File(s) Staged`,
        status: filesCount > 0 ? 'Completed' : 'Pending',
        statusVariant: filesCount > 0 ? 'success' : 'neutral',
        description: 'Discovers COBOL source programs, copybooks, and auxiliary scripts. Validates fixed 80-column formatting.'
      },
      {
        id: 2,
        title: 'Program Understanding',
        subtitle: 'AST Parsing & Call Hierarchy',
        metric: report?.analysis?.paragraphs?.length ? `${report.analysis.paragraphs.length} Paragraphs` : '4 Paragraphs Mapped',
        status: 'Completed',
        statusVariant: 'success',
        description: 'Parses IDENTIFICATION, DATA, and PROCEDURE divisions into abstract syntax trees. Discovers PERFORM and CALL routines.'
      },
      {
        id: 3,
        title: 'Rule Extraction',
        subtitle: 'Conditions & Computations',
        metric: `${rulesCount} Business Rules`,
        status: rulesCount > 0 ? 'Completed' : 'Pending',
        statusVariant: rulesCount > 0 ? 'success' : 'neutral',
        description: 'Isolates conditional statements (IF, WHEN, COMPUTE) and formulates verifiable business logic candidates with source citations.'
      },
      {
        id: 4,
        title: 'Risk Assessment',
        subtitle: 'Blast Radius & Heuristics',
        metric: hasHighRisks ? 'High Risk Identified' : 'Medium / Low Risk',
        status: hasHighRisks ? 'Needs Review' : 'Completed',
        statusVariant: hasHighRisks ? 'warning' : 'success',
        description: 'Evaluates financial computation severity, global variable side-effects, and external routine coupling.'
      },
      {
        id: 5,
        title: 'Evidence Verification',
        subtitle: 'Operational Ticket Corroboration',
        metric: hasConflicts ? 'INC-101 Disputed' : 'Baseline Verified',
        status: hasConflicts ? 'Blocked' : 'Needs Review',
        statusVariant: hasConflicts ? 'danger' : 'warning',
        description: 'Reconciles code findings against production incident stream (INC-101) and specification documents to uncover logic blindspots.'
      },
      {
        id: 6,
        title: 'Modernization Strategy',
        subtitle: '4R Component Allocation',
        metric: hasConflicts ? 'Review Required' : '4R Formulated',
        status: hasConflicts ? 'Needs Review' : 'Completed',
        statusVariant: hasConflicts ? 'warning' : 'success',
        description: 'Assigns Retain, Refactor, Replace, or Remove strategies per paragraph based on evidence gating and risk score.'
      },
      {
        id: 7,
        title: 'Migration Planning',
        subtitle: 'Dependency-Ordered Sequencing',
        metric: hasConflicts ? 'Execution Locked' : `${migrationPhases.length} Phases`,
        status: hasConflicts ? 'Blocked' : 'Completed',
        statusVariant: hasConflicts ? 'danger' : 'success',
        description: 'Constructs phased roadmap towards Java 21 LTS and Spring Boot 3.3.x clean hexagonal architecture.'
      },
      {
        id: 8,
        title: 'Regression Verification',
        subtitle: 'Characterization Test Suites',
        metric: `${liveRegressionTests.length || REGRESSION_TEST_SCENARIOS.length} Scenarios`,
        status: 'Needs Review',
        statusVariant: 'warning',
        description: 'Synthesizes golden-master boundary tests (JUnit 5) to guarantee zero functional divergence during transition.'
      }
    ];
  }, [stagedFiles, findings, isReassessed, overview, report, migrationPhases, liveRegressionTests]);

  const activeStage = flowStages.find(s => s.id === activeStageId) || flowStages[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner - White-Primary Design System */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Interactive Modernization Journey
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Backend Engine Connected' : 'Offline Reference Model'}
            </Badge>
            <Badge variant="info" size="xs">
              COBOL-85 → Java 21 LTS + Spring Boot 3.x
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Interactive Modernization Roadmap & Governance Gate
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl mt-0.5">
            Step through the 8-stage modernization journey. Inspect evidence-backed facts, blast-radius dependencies, unresolved incident conflicts, and characterization test specifications.
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

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Files Analyzed</span>
          <div className="font-bold text-slate-900 text-base">
            {overview?.files_analyzed ?? stagedFiles.length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">{activeFile?.name || 'PENALTY.cbl'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Rules Discovered</span>
          <div className="font-bold text-slate-900 text-base">
            {overview?.rule_candidates ?? (findings.length > 0 ? findings.length : 2)}
          </div>
          <div className="text-[11px] text-slate-500">AST-grounded logic</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Risks Requiring Attention</span>
          <div className={`font-bold text-base ${isReassessed || (overview?.risks && overview.risks > 0) ? 'text-amber-700' : 'text-slate-900'}`}>
            {overview?.risks ?? (isReassessed ? 1 : 0)}
          </div>
          <div className="text-[11px] text-slate-500">Heuristic assessment</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Validation Requirements</span>
          <div className={`font-bold text-base ${isReassessed ? 'text-rose-700' : 'text-emerald-700'}`}>
            {isReassessed ? '1 Incident Gate' : 'Verified Baseline'}
          </div>
          <div className="text-[11px] text-slate-500">{isReassessed ? 'INC-101 Waiver Conflict' : 'No open blockers'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Migration Phases</span>
          <div className="font-bold text-blue-700 text-base">
            {migrationPhases.length} Phases
          </div>
          <div className="text-[11px] text-slate-500">Java 21 Architecture</div>
        </div>
      </div>

      {/* 3. INTERACTIVE 8-STAGE VISUAL ROADMAP FLOW */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Modernization Pipeline Flow (Stages 1 – 8)
            </h3>
            <p className="text-xs text-slate-500">
              Click any stage node to inspect its evidence facts, risks, and Java 21 modernization artifacts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Needs Review
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Blocked
            </span>
          </div>
        </div>

        {/* Desktop Horizontal / Responsive Grid Roadmap */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {flowStages.map((stage, idx) => {
            const isSelected = activeStageId === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageId(stage.id)}
                className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200'
                }`}
              >
                {/* Connecting arrow indicator for sequence */}
                {idx < flowStages.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300 z-10 text-[10px] font-bold pointer-events-none">
                    &rarr;
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {stage.id}
                    </span>
                    <Badge variant={stage.statusVariant} size="xs" dot>
                      {stage.status}
                    </Badge>
                  </div>
                  <div className={`font-semibold text-xs leading-snug line-clamp-2 ${
                    isSelected ? 'text-blue-900' : 'text-slate-900'
                  }`}>
                    {stage.title}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100/80 mt-1">
                  <span className="font-mono text-[10px] text-slate-600 font-medium block truncate">
                    {stage.metric}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIVE STAGE DEEP-DIVE INSPECTION PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Stage Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm font-mono shadow-xs shrink-0">
              {activeStage.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{activeStage.title}</h3>
                <Badge variant={activeStage.statusVariant} size="xs" dot>
                  {activeStage.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{activeStage.subtitle} — {activeStage.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-mono">
              Stage {activeStage.id} of 8
            </span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setActiveStageId(prev => Math.max(1, prev - 1))}
                disabled={activeStageId === 1}
                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                &larr; Prev
              </button>
              <button
                type="button"
                onClick={() => setActiveStageId(prev => Math.min(8, prev + 1))}
                disabled={activeStageId === 8}
                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 border-l border-slate-200 cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Stage Body Content Switcher */}
        <div className="p-5">
          {/* STAGE 1: SOURCE DISCOVERY */}
          {activeStageId === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Active Source File</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">{activeFile?.name || 'PENALTY.cbl'}</div>
                  <div className="text-[11px] text-slate-500">{activeFile?.loc || 44} lines • {activeFile?.size || '1.8 KB'}</div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Format Standard</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">ANSI COBOL-85</div>
                  <div className="text-[11px] text-slate-500">Fixed 80-col layout (Columns 1–6 seq, 7 indicator, 8–72 text)</div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Ingestion Status</span>
                  <div className="font-bold text-emerald-700 text-sm">Verified & Staged</div>
                  <div className="text-[11px] text-slate-500">{stagedFiles.length} file(s) in active project workspace</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mb-2">Staged Project Files</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  {stagedFiles.map((file, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-800">{file.relativePath || file.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({file.loc || file.content?.split('\n').length} LOC)</span>
                      </div>
                      <Badge variant={file.extension === 'cbl' || file.extension === 'cob' ? 'info' : 'neutral'} size="xs">
                        {file.category || file.extension?.toUpperCase() || 'COBOL'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: PROGRAM UNDERSTANDING */}
          {activeStageId === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                The AST parser processed the COBOL PROCEDURE DIVISION, cataloged control routines, and identified invocation sequences between paragraphs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Identified Paragraphs</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">4</span>
                  <p className="text-[11px] text-slate-500">1000, 2000, 2100, 9000-EXIT</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">PERFORM Invocations</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">2</span>
                  <p className="text-[11px] text-slate-500">Internal subroutine execution</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">External Subprograms</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">0</span>
                  <p className="text-[11px] text-slate-500">Zero dynamic CALL dependencies</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mb-2">Paragraph Call Hierarchy</h4>
                <div className="font-mono text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1 text-slate-700">
                  <div>1000-CHECK-ACCOUNT-STATUS (Lines 24–29) &rarr; Entry check</div>
                  <div className="pl-4 text-blue-700">&rarr; PERFORM 2000-PROCESS-PAYMENT (Lines 31–35)</div>
                  <div className="pl-8 text-amber-700">&rarr; PERFORM 2100-CALCULATE-PENALTY (Lines 37–44)</div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: BUSINESS RULE EXTRACTION */}
          {activeStageId === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Rules extracted directly from conditional statements in the source code. Each candidate is assigned a unique finding ID and verifiable line citation.
              </p>

              <div className="space-y-2">
                {componentStrategies.map((rule) => (
                  <div key={rule.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">{rule.ruleId}</span>
                        <span className="font-mono text-slate-800 font-semibold">{rule.paragraph}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({rule.lines})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{rule.recommendation}</p>
                    </div>
                    <Badge variant="neutral" size="xs">
                      {rule.sourceFile}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 4: DEPENDENCY & RISK ASSESSMENT */}
          {activeStageId === 4 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                <strong>Heuristic Risk Evaluation:</strong> Routine <code>2100-CALCULATE-PENALTY</code> performs direct financial arithmetic (<code className="font-mono">WS-BALANCE - 50.00</code>) affecting deposit account balances. Any modernization divergence causes fiscal audit non-compliance.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block font-mono">Blast Radius: 2100-CALCULATE-PENALTY</span>
                  <p className="text-slate-600 text-[11px]">
                    Direct caller: <code>2000-PROCESS-PAYMENT</code>. Shared working storage: <code>WS-BALANCE</code>, <code>WS-PENALTY-FEE</code>.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block font-mono">Data Mutation Risk</span>
                  <p className="text-slate-600 text-[11px]">
                    Side-effect: Mutates global balance field in-place without rollback transaction wrapper.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: EVIDENCE VERIFICATION */}
          {activeStageId === 5 && (
            <div className="space-y-4">
              {isReassessed ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-xs uppercase text-rose-900">
                      Governance Blocker: Incident INC-101 Conflicted
                    </span>
                    <Badge variant="danger" size="xs">Migration Approval Locked</Badge>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Evidence from production ticket <strong>INC-101</strong> conflicts with COBOL code: Customer accounts granted an approved payment extension (<code className="font-mono">WS-PAYMENT-EXT-FLAG = 'Y'</code>) were incorrectly charged penalty fees. The copybook <code>ACCTREC.cpy</code> defines the flag, but the PROCEDURE DIVISION ignores it. Automated Java 21 translation is locked until domain owners verify the waiver rule.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-xs text-slate-900">
                      Baseline Code Analysis (No Conflict Evidence Added Yet)
                    </span>
                    <Badge variant="success" size="xs">Baseline Observed</Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Code analysis reflects the current COBOL source behavior. To simulate evidence governance, submit ticket INC-101 in the Business Logic section to trigger the evidence-gating mechanism.
                  </p>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => onNavigate('business-logic')}
                  >
                    Open Business Logic to Submit INC-101 &rarr;
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 6: MODERNIZATION STRATEGY */}
          {activeStageId === 6 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                4R component modernization allocations formulated from evidence corroboration, side-effect boundaries, and risk factors.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {componentStrategies.map((comp) => (
                  <div key={comp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900 text-xs">{comp.paragraph}</span>
                        <Badge variant={comp.strategyBadge} size="xs">{comp.strategy}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{comp.recommendation}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-[10px] text-blue-700 font-mono truncate">
                      {comp.targetArtifact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 7: MIGRATION PLANNING */}
          {activeStageId === 7 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-950 text-xs">
                <strong>Target Architecture:</strong> Java 21 LTS + Spring Boot 3.3.x using hexagonal clean domain core, immutable Java Records, and BigDecimal financial precision.
              </div>

              <div className="space-y-2.5">
                {migrationPhases.map((phase, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-mono text-[10px]">
                        {pIdx + 1}
                      </span>
                      {phase.name}
                    </div>
                    <ul className="text-slate-600 text-[11px] list-disc list-inside pl-5 space-y-1">
                      {phase.actions.map((act, aIdx) => (
                        <li key={aIdx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 8: REGRESSION VERIFICATION */}
          {activeStageId === 8 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                <strong>Characterization Testing Contract:</strong> Golden-master test cases synthesized from AST condition boundary inputs. Assertions must match COBOL behavior before retiring legacy routines.
              </div>

              <div className="space-y-3">
                {(liveRegressionTests.length > 0 ? liveRegressionTests : REGRESSION_TEST_SCENARIOS).map((test, idx) => (
                  <div key={test.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{test.title || test.id}</span>
                      <Badge variant="success" size="xs">Synthesized</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2.5 rounded border border-slate-200">
                      <div><span className="text-slate-400">Boundary Input:</span> {test.inputs || test.boundary}</div>
                      <div><span className="text-slate-400">Expected Outcome:</span> {test.expected}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. TARGET JAVA 21 ARTIFACT SPECIFICATIONS & CODE PREVIEW */}
      <Card
        title="Synthesized Java 21 Target Service Specification"
        subtitle="PenaltyCalculationService.java — Hexagonal domain core with BigDecimal precision"
        badge={<Badge variant="info" size="xs">Java 21 LTS</Badge>}
        actions={
          <Button
            variant="secondary"
            size="xs"
            onClick={() => handleCopyCode('java-service', `package com.bank.modernization.domain.service;

import java.math.BigDecimal;
import com.bank.modernization.domain.model.AccountRecord;
import com.bank.modernization.domain.model.PenaltyResult;
import org.springframework.stereotype.Service;

/**
 * Modernized from COBOL routine: 2100-CALCULATE-PENALTY
 * Source Program: PENALTY.cbl (Lines 37-44)
 * Target Architecture: Java 21 LTS + Spring Boot 3.3.x
 */
@Service
public class PenaltyCalculationService {

    private static final BigDecimal MINIMUM_BALANCE_THRESHOLD = new BigDecimal("1000.00");
    private static final BigDecimal STANDARD_PENALTY_FEE = new BigDecimal("50.00");

    public PenaltyResult evaluateMaintenanceFee(AccountRecord account) {
        // Gated check: Reconciled per incident INC-101 waiver policy
        if (account.hasApprovedPaymentExtension()) {
            return PenaltyResult.waived("Waiver applied: Approved customer payment extension");
        }

        if (account.balance().compareTo(MINIMUM_BALANCE_THRESHOLD) < 0) {
            BigDecimal newBalance = account.balance().subtract(STANDARD_PENALTY_FEE);
            return PenaltyResult.assessed(STANDARD_PENALTY_FEE, newBalance);
        }

        return PenaltyResult.noFeeRequired();
    }
}`)}
          >
            {copiedId === 'java-service' ? 'Copied!' : 'Copy Java 21 Code'}
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-72">
            <pre className="text-[11px] leading-relaxed">
{`package com.bank.modernization.domain.service;

import java.math.BigDecimal;
import com.bank.modernization.domain.model.AccountRecord;
import com.bank.modernization.domain.model.PenaltyResult;
import org.springframework.stereotype.Service;

/**
 * Modernized from COBOL routine: 2100-CALCULATE-PENALTY
 * Source Program: PENALTY.cbl (Lines 37-44)
 * Target Architecture: Java 21 LTS + Spring Boot 3.3.x
 */
@Service
public class PenaltyCalculationService {

    private static final BigDecimal MINIMUM_BALANCE_THRESHOLD = new BigDecimal("1000.00");
    private static final BigDecimal STANDARD_PENALTY_FEE = new BigDecimal("50.00");

    public PenaltyResult evaluateMaintenanceFee(AccountRecord account) {
        // Gated check: Reconciled per incident INC-101 waiver policy
        if (account.hasApprovedPaymentExtension()) {
            return PenaltyResult.waived("Waiver applied: Approved customer payment extension");
        }

        if (account.balance().compareTo(MINIMUM_BALANCE_THRESHOLD) < 0) {
            BigDecimal newBalance = account.balance().subtract(STANDARD_PENALTY_FEE);
            return PenaltyResult.assessed(STANDARD_PENALTY_FEE, newBalance);
        }

        return PenaltyResult.noFeeRequired();
    }
}`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
