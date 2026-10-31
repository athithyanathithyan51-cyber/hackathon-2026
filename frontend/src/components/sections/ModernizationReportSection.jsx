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

  const [selectedNodeId, setSelectedNodeId] = useState('evidence');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive component 4R strategies from live findings or reference
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

    return [
      {
        id: 'COMP-01',
        paragraph: '2100-CALCULATE-PENALTY',
        ruleId: 'BR-001',
        lines: 'Lines 37–44',
        sourceFile: 'PENALTY.cbl',
        strategy: isReassessed ? 'RETAIN' : 'REFACTOR',
        strategyBadge: isReassessed ? 'warning' : 'info',
        verdict: isReassessed ? 'REVIEW REQUIRED (Gated by INC-101)' : 'READY FOR REFACTOR',
        targetArtifact: 'PenaltyCalculationService.java (@Service)',
        recommendation: isReassessed
          ? 'Retain routine in place or halt automated conversion until retail banking domain owners verify the payment extension exemption policy.'
          : 'Refactor into Java 21 Spring Boot service utilizing immutable AccountRecord and BigDecimal arithmetic.',
        risk: isReassessed ? 'Critical Risk (Disputed Behavior)' : 'Medium Risk'
      },
      {
        id: 'COMP-02',
        paragraph: '2000-PROCESS-PAYMENT',
        ruleId: 'BR-002',
        lines: 'Lines 31–35',
        sourceFile: 'PENALTY.cbl',
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
        sourceFile: 'PENALTY.cbl',
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

  // Live regression tests
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

  // 10 Flow Nodes with Dual Explanation Pattern (Technical Label + Plain-English)
  const flowNodes = useMemo(() => {
    const filesCount = stagedFiles.length || 1;
    const rulesCount = findings.length > 0 ? findings.length : 2;
    const hasConflicts = isReassessed || (overview?.evidence_conflicts && overview.evidence_conflicts > 0);
    const hasHighRisks = isReassessed || (overview?.risks && overview.risks > 0);

    return [
      {
        id: 'project',
        step: '1',
        techLabel: 'Source Project Repository',
        plainEnglish: 'The collection of COBOL programs and copybooks submitted for modernization.',
        status: filesCount > 0 ? 'Completed' : 'Pending',
        statusColor: 'emerald',
        badge: `${filesCount} Files Staged`,
        summaryText: `Analyzed repository files including COBOL programs (.cbl), copybook records (.cpy), and scripts.`
      },
      {
        id: 'discovery',
        step: '2',
        techLabel: 'Source Discovery & Validation',
        plainEnglish: 'Checks file formats, line counts, and ensures the code is readable COBOL.',
        status: 'Completed',
        statusColor: 'emerald',
        badge: 'ANSI COBOL-85 Verified',
        summaryText: 'Verified standard fixed 80-column formatting, IDENTIFICATION DIVISION headers, and data layouts.'
      },
      {
        id: 'understanding',
        step: '3',
        techLabel: 'Program Understanding & AST Hierarchy',
        plainEnglish: 'Breaks down the COBOL code into a structured map of routines and subprogram calls.',
        status: 'Completed',
        statusColor: 'emerald',
        badge: 'Routines Mapped',
        summaryText: 'Parsed PROCEDURE DIVISION routines and mapped internal PERFORM execution paths.'
      },
      {
        id: 'extraction',
        step: '4',
        techLabel: 'Business Rule Extraction',
        plainEnglish: 'Pulls out the actual business logic (such as fees, interest, or status checks) from IF/WHEN conditions.',
        status: 'Completed',
        statusColor: 'teal',
        badge: `${rulesCount} Rules Discovered`,
        summaryText: 'Extracted rule candidates with exact line citations and input/output variables.'
      },
      {
        id: 'risk',
        step: '5',
        techLabel: 'Dependency & Blast Radius Analysis',
        plainEnglish: 'Checks which other parts of the banking system could break if this code is modified.',
        status: hasHighRisks ? 'Needs Review' : 'Completed',
        statusColor: hasHighRisks ? 'amber' : 'emerald',
        badge: hasHighRisks ? 'High Risk Flagged' : 'Low/Medium Risk',
        summaryText: 'Calculated global variable mutations (WS-BALANCE) and identified caller blast radii.'
      },
      {
        id: 'evidence',
        step: '6',
        isDecisionGate: true,
        techLabel: 'Evidence Verification & Governance Gate',
        plainEnglish: 'Compares the code against real production incidents to check if the code matches what the bank actually intends.',
        status: hasConflicts ? 'Blocked' : 'Needs Review',
        statusColor: hasConflicts ? 'rose' : 'amber',
        badge: hasConflicts ? 'INC-101 Disputed' : 'Baseline Verified',
        conflictDetails: hasConflicts ? {
          ticket: 'INC-101 (Production Billing Dispute)',
          description: 'Deposit accounts with approved customer payment extensions were incorrectly charged penalty fees because the PROCEDURE DIVISION omits checking WS-PAYMENT-EXT-FLAG.',
          actionNeeded: 'Requires retail credit policy owner validation before modernization approval can be granted.'
        } : null,
        summaryText: hasConflicts 
          ? 'INC-101 detected a logic conflict: Code omits customer payment extension waiver logic.'
          : 'Code logic verified against observed baseline specifications.'
      },
      {
        id: 'decision',
        step: '7',
        is4RBranch: true,
        techLabel: 'Modernization Decision (4R Framework)',
        plainEnglish: 'Decides whether each part should be kept as-is, refactored into Java, replaced with a library, or removed.',
        status: hasConflicts ? 'Needs Review' : 'Completed',
        statusColor: hasConflicts ? 'amber' : 'emerald',
        badge: hasConflicts ? 'Review Required' : '4R Formulated',
        summaryText: 'Assigned Retain, Refactor, Replace, or Remove strategies per routine based on risk and evidence.'
      },
      {
        id: 'plan',
        step: '8',
        techLabel: 'Java 21 + Spring Boot 3.x Migration Plan',
        plainEnglish: 'Creates an ordered step-by-step roadmap to build the new Java application without breaking existing banking operations.',
        status: hasConflicts ? 'Blocked' : 'Completed',
        statusColor: hasConflicts ? 'rose' : 'emerald',
        badge: hasConflicts ? 'Execution Gated' : `${migrationPhases.length} Phases`,
        summaryText: 'Structured phased migration into hexagonal domain services, records, and repositories.'
      },
      {
        id: 'testing',
        step: '9',
        techLabel: 'Characterization Regression Testing',
        plainEnglish: 'Runs tests on boundary numbers (like $1,000 balance) to prove the Java code behaves identically to the COBOL code.',
        status: 'Needs Review',
        statusColor: 'amber',
        badge: `${liveRegressionTests.length || REGRESSION_TEST_SCENARIOS.length} Scenarios`,
        summaryText: 'Synthesized golden-master JUnit 5 assertion suites for boundary values.'
      },
      {
        id: 'verified',
        step: '10',
        techLabel: 'Verified Modernization Outcome',
        plainEnglish: 'The final sign-off confirming that the modernized system is correct, safe, and ready for production.',
        status: hasConflicts ? 'Pending Validation' : 'Ready for Sign-Off',
        statusColor: hasConflicts ? 'slate' : 'emerald',
        badge: hasConflicts ? 'Locked' : 'Audit Ready',
        summaryText: hasConflicts
          ? 'Modernization approval is locked until retail banking domain owners resolve incident INC-101.'
          : 'Ready for architecture governance board review.'
      }
    ];
  }, [stagedFiles, findings, isReassessed, overview, migrationPhases, liveRegressionTests]);

  const activeNode = flowNodes.find(n => n.id === selectedNodeId) || flowNodes[5];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Visual Modernization Journey
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Backend Engine Connected' : 'Offline Reference Model'}
            </Badge>
            <Badge variant="info" size="xs">
              COBOL-85 → Java 21 LTS + Spring Boot 3.x
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            End-to-End Modernization Flow & Governance Diagram
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl mt-0.5">
            Designed for software architects, engineering leads, and business domain owners. Follow the journey from legacy COBOL code discovery to evidence-gated Java 21 migration.
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

      {/* 2. Top Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Source Scope</span>
          <div className="font-bold text-slate-900 text-sm">
            {overview?.files_analyzed ?? stagedFiles.length} File(s)
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">{activeFile?.name || 'PENALTY.cbl'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Rules Discovered</span>
          <div className="font-bold text-slate-900 text-sm">
            {overview?.rule_candidates ?? (findings.length > 0 ? findings.length : 2)} Rules
          </div>
          <div className="text-[11px] text-slate-500">AST Conditionals</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Governance Gate</span>
          <div className={`font-bold text-sm ${isReassessed ? 'text-rose-700' : 'text-emerald-700'}`}>
            {isReassessed ? 'INC-101 Conflict' : 'Baseline Verified'}
          </div>
          <div className="text-[11px] text-slate-500">{isReassessed ? 'Payment waiver dispute' : 'Zero unhandled conflicts'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono block">Target Architecture</span>
          <div className="font-bold text-blue-700 text-sm">Java 21 + Spring Boot</div>
          <div className="text-[11px] text-slate-500">Clean Domain Core</div>
        </div>
      </div>

      {/* 3. THE INTUITIVE VISUAL MODERNIZATION FLOW DIAGRAM */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Interactive Modernization Flow Diagram
            </h3>
            <p className="text-xs text-slate-500">
              Click any stage or decision diamond to inspect detailed evidence, risks, and Java 21 specifications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed
            </span>
            <span className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Verified
            </span>
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Needs Review
            </span>
            <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Blocked
            </span>
          </div>
        </div>

        {/* Visual Pipeline Flow Container */}
        <div className="space-y-4">
          {/* STAGE ROW 1: Discovery to Understanding (Steps 1 to 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
            {flowNodes.slice(0, 5).map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {node.step}
                      </span>
                      <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.2 rounded border ${
                        node.statusColor === 'emerald'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : node.statusColor === 'teal'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {node.techLabel}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {node.plainEnglish}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-600 font-medium">
                    {node.badge}
                  </div>
                </button>
              );
            })}
          </div>

          {/* CONNECTOR ARROW TO DECISION GATE */}
          <div className="flex justify-center my-1 text-slate-400 font-bold text-sm">
            &darr;
          </div>

          {/* DECISION GATE: EVIDENCE VERIFICATION (STEP 6) */}
          <div className="p-4 rounded-xl border-2 transition-all bg-white relative max-w-4xl mx-auto shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedNodeId('evidence')}
              className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-all ${
                selectedNodeId === 'evidence'
                  ? 'ring-2 ring-blue-500/20 border-blue-400'
                  : 'border-slate-200'
              } ${
                isReassessed ? 'bg-rose-50/70 border-rose-300' : 'bg-amber-50/50 border-amber-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs font-mono text-white ${
                    isReassessed ? 'bg-rose-600' : 'bg-amber-600'
                  }`}>
                    6
                  </span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      DECISION GATE: Evidence Verification & Governance Check
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Reconciles code findings with real production incident reports (INC-101)
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold self-start sm:self-auto ${
                  isReassessed 
                    ? 'bg-rose-600 text-white shadow-2xs' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isReassessed ? 'GOVERNANCE BLOCKER: INC-101' : 'BASELINE VERIFIED'}
                </span>
              </div>

              {isReassessed ? (
                <div className="p-3 rounded bg-white border border-rose-200 text-xs text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <span>⚠️ Conflict Discovered:</span>
                    <span>Customer Payment Extension Exemption Missing in PROCEDURE DIVISION</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Customer incident <strong>INC-101</strong> confirmed accounts with approved payment extensions were incorrectly assessed the $50 penalty. Copybook <code>ACCTREC.cpy</code> defines <code>WS-PAYMENT-EXT-FLAG</code>, but the code omits checking it. <strong>Automated conversion to Java 21 is blocked until retail banking domain owners validate waiver policy.</strong>
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  No active customer dispute stream conflicts detected. The code behavior is currently verified against observed baseline specifications.
                </div>
              )}
            </button>
          </div>

          {/* CONNECTOR ARROW TO 4R BRANCH */}
          <div className="flex justify-center my-1 text-slate-400 font-bold text-sm">
            &darr;
          </div>

          {/* STEP 7: 4R MODERNIZATION DECISION BRANCHING */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] font-mono flex items-center justify-center">
                  7
                </span>
                <span className="font-bold text-xs text-slate-900">
                  Step 7: Modernization Decision (4R Framework Branching)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Allocates strategy per COBOL routine based on side-effects and risk
              </span>
            </div>

            {/* 4R Strategy Branches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-xs">RETAIN</span>
                  <Badge variant="neutral" size="xs">Low Risk</Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Keep behavior unchanged or map directly to type-safe Java enum (e.g. <code>AccountStatus.java</code>).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-blue-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700 text-xs">REFACTOR</span>
                  <Badge variant="info" size="xs">Recommended</Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Re-engineer into clean Spring Boot domain service with BigDecimal arithmetic (e.g. <code>PenaltyCalculationService.java</code>).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-xs">REPLACE</span>
                  <Badge variant="neutral" size="xs">Infrastructure</Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Replace legacy batch flat-file storage with modern PostgreSQL database and transactional ledger.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-xs">REMOVE</span>
                  <Badge variant="neutral" size="xs">Dead Code</Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Eliminate redundant operating system calls and obsolete batch control paragraphs.
                </p>
              </div>
            </div>
          </div>

          {/* CONNECTOR ARROW TO EXECUTION STEPS */}
          <div className="flex justify-center my-1 text-slate-400 font-bold text-sm">
            &darr;
          </div>

          {/* STAGE ROW 2: Steps 8, 9, 10 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {flowNodes.slice(7).map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {node.step}
                      </span>
                      <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.2 rounded border ${
                        node.statusColor === 'emerald'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : node.statusColor === 'rose'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {node.techLabel}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {node.plainEnglish}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-600 font-medium">
                    {node.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE NODE DETAILS PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm">
              {activeNode.step}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{activeNode.techLabel}</h3>
                <Badge variant={activeNode.statusColor === 'emerald' ? 'success' : activeNode.statusColor === 'rose' ? 'danger' : 'warning'} size="xs" dot>
                  {activeNode.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Plain English: &ldquo;{activeNode.plainEnglish}&rdquo;
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
            Node: {activeNode.id.toUpperCase()}
          </span>
        </div>

        <div className="p-5 text-xs text-slate-700 space-y-4">
          {/* EVIDENCE & CONFLICT DETAILS (Node 6) */}
          {activeNode.id === 'evidence' && (
            <div className="space-y-3">
              {isReassessed ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 text-rose-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-xs text-rose-900">
                      GOVERNANCE BLOCKER: Incident INC-101 Corroboration Conflict
                    </span>
                    <Badge variant="danger" size="xs">Execution Approval Locked</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div><strong>Incident Context:</strong> Customer payment dispute ticket INC-101.</div>
                    <div><strong>Observed Conflict:</strong> Deposit accounts granted approved payment extensions were assessed $50 penalty fees because PROCEDURE DIVISION logic in <code>2100-CALCULATE-PENALTY</code> omits evaluating copybook field <code>WS-PAYMENT-EXT-FLAG</code>.</div>
                    <div><strong>Business Validation Required:</strong> Retail deposit credit policy owners must sign off on whether extensions unconditionally waive the penalty fee.</div>
                  </div>
                  <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Resolution Action:</span>
                    <Button variant="secondary" size="xs" onClick={() => onNavigate('business-logic')}>
                      View Conflict in Business Logic &rarr;
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-xs">
                    Baseline Verification Observed
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Code analysis reflects the observed source code rules. No operational disputes have been submitted. You can simulate incident corroboration by submitting ticket INC-101 in the Business Logic section.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4R STRATEGY DETAILS (Node 7) */}
          {activeNode.id === 'decision' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">
                Component Modernization Allocations
              </h4>
              <div className="space-y-2">
                {componentStrategies.map((comp) => (
                  <div key={comp.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{comp.paragraph}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({comp.lines})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{comp.recommendation}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={comp.strategyBadge} size="xs">{comp.strategy}</Badge>
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {comp.targetArtifact.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MIGRATION PLAN DETAILS (Node 8) */}
          {activeNode.id === 'plan' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">
                Phased Migration Roadmap (Java 21 LTS + Spring Boot 3.3.x)
              </h4>
              <div className="space-y-2">
                {migrationPhases.map((phase, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono flex items-center justify-center">
                        {pIdx + 1}
                      </span>
                      {phase.name}
                    </div>
                    <ul className="text-slate-600 text-[11px] list-disc list-inside pl-5 space-y-0.5">
                      {phase.actions.map((act, aIdx) => (
                        <li key={aIdx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TESTING DETAILS (Node 9) */}
          {activeNode.id === 'testing' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase font-mono">
                Characterization Regression Test Cases
              </h4>
              <div className="space-y-2">
                {(liveRegressionTests.length > 0 ? liveRegressionTests : REGRESSION_TEST_SCENARIOS).map((test, idx) => (
                  <div key={test.id || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-xs">
                      <span>{test.title || test.id}</span>
                      <Badge variant="success" size="xs">Synthesized</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2 rounded border border-slate-200">
                      <div><span className="text-slate-400">Input:</span> {test.inputs || test.boundary}</div>
                      <div><span className="text-slate-400">Expected:</span> {test.expected}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GENERIC SUMMARY FOR NODES 1-5, 10 */}
          {activeNode.id !== 'evidence' && activeNode.id !== 'decision' && activeNode.id !== 'plan' && activeNode.id !== 'testing' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-xs">
                {activeNode.techLabel} Summary
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {activeNode.summaryText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. TARGET ARCHITECTURE DIAGRAM (PROPOSED JAVA 21 APPLICATION) */}
      <Card
        title="Proposed Modernization Target Architecture"
        subtitle="Hexagonal Clean Architecture for Java 21 LTS + Spring Boot 3.3.x"
        badge={<Badge variant="info" size="xs">Target Architecture</Badge>}
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
            {copiedId === 'java-service' ? 'Copied!' : 'Copy Java 21 Service Code'}
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Target Architecture Flow Diagram */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-[11px]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex-1 w-full">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Existing System</span>
                <span className="font-bold text-slate-900 block mt-1">COBOL-85 Source</span>
                <span className="text-[10px] text-slate-500">PENALTY.cbl, ACCTREC.cpy</span>
              </div>

              <span className="text-slate-400 font-bold">&rarr;</span>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex-1 w-full">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Governance Validation</span>
                <span className="font-bold text-blue-700 block mt-1">Validated Business Rules</span>
                <span className="text-[10px] text-slate-500">AST Conditionals + INC-101</span>
              </div>

              <span className="text-slate-400 font-bold">&rarr;</span>

              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 shadow-2xs flex-1 w-full">
                <span className="text-[10px] text-blue-600 uppercase font-bold block">3. Proposed Java 21 App</span>
                <span className="font-bold text-blue-900 block mt-1">Spring Boot 3.3.x</span>
                <span className="text-[10px] text-blue-700">Hexagonal Domain Core</span>
              </div>

              <span className="text-slate-400 font-bold">&rarr;</span>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex-1 w-full">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Regression Verification</span>
                <span className="font-bold text-emerald-700 block mt-1">JUnit 5 Test Suite</span>
                <span className="text-[10px] text-slate-500">Zero-Divergence Parity</span>
              </div>
            </div>
          </div>

          {/* Java 21 Spring Boot Code Preview */}
          <div className="rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-64 shadow-inner">
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

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <strong>Architecture Notice:</strong> The target Java 21 service implementation is formulated as an architectural recommendation based on extracted AST conditionals and validated incident evidence. LegacyIQ does not claim unverified automatic code conversion.
          </div>
        </div>
      </Card>
    </div>
  );
}
