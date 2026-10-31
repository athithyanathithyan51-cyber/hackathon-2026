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

  // The 10 Report Stages with What We Did, Why It Matters, What We Found, Where to See It
  const flowNodes = useMemo(() => {
    const filesCount = stagedFiles.length || 1;
    const rulesCount = findings.length > 0 ? findings.length : 3;
    const hasConflicts = isReassessed || (overview?.evidence_conflicts && overview.evidence_conflicts > 0);
    const hasHighRisks = isReassessed || (overview?.risks && overview.risks > 0);

    return [
      {
        id: 'project',
        step: '1',
        stageName: 'Source Project Repository',
        plainEnglish: 'The collection of COBOL programs and copybooks submitted for modernization.',
        category: 'Completed',
        categoryVariant: 'success',
        badge: `${filesCount} Files Staged`,
        destination: { section: 'cobol-analysis', tab: 'EXPLORER', from: 'modernization-report' },
        destinationLabel: 'Open in COBOL Analysis File Explorer →',
        whatWeDid: 'LegacyIQ scanned the submitted project archive and organized all source programs, copybooks, and auxiliary scripts into a structured workspace.',
        whyItMatters: 'Retail banking systems rely on multiple interconnected programs and shared copybooks. Having all files staged ensures no missing data definitions.',
        whatWeFound: `Discovered ${filesCount} file(s) (${stagedFiles.filter(f => f.extension === 'cbl' || f.extension === 'cob').length || 2} COBOL programs including PENALTY.cbl and TRANS_PROC.cbl, plus copybook ACCTREC.cpy).`
      },
      {
        id: 'discovery',
        step: '2',
        stageName: 'Source Discovery & Validation',
        plainEnglish: 'Checks file formats, line counts, and ensures the code is readable COBOL.',
        category: 'Completed',
        categoryVariant: 'success',
        badge: 'COBOL-85 Verified',
        destination: { section: 'cobol-analysis', tab: 'EXPLORER', from: 'modernization-report' },
        destinationLabel: 'Inspect Files in COBOL Workspace →',
        whatWeDid: 'Checked each file for ANSI COBOL-85 fixed 80-column standard layout (columns 1-6 sequence numbers, column 7 indicators, columns 8-72 code area).',
        whyItMatters: 'Legacy mainframes use strict column formatting. Detecting syntax boundaries upfront prevents incorrect interpretation of business rules.',
        whatWeFound: 'All programs validated against ANSI COBOL-85 standard. IDENTIFICATION and DATA divisions are properly structured.'
      },
      {
        id: 'understanding',
        step: '3',
        stageName: 'Program Understanding & Hierarchy',
        plainEnglish: 'Examines the COBOL program structure to identify its main sections, operations, and relationships.',
        category: 'Completed',
        categoryVariant: 'success',
        badge: 'Routines Mapped',
        destination: { section: 'cobol-analysis', tab: 'STRUCTURE', from: 'modernization-report' },
        destinationLabel: 'Examine Program Structure in COBOL Analysis →',
        whatWeDid: 'Parsed the PROCEDURE DIVISION into individual routines and mapped control flow connections (PERFORM and CALL invocations).',
        whyItMatters: 'Modern Java services must be organized into clear methods. Understanding the COBOL routine structure shows how to modularize the new service.',
        whatWeFound: 'Mapped 4 main routines in PENALTY.cbl: 0000-MAIN-PROCESS, 1000-CHECK-ACCOUNT-STATUS, 2000-PROCESS-PAYMENT, and 2100-CALCULATE-PENALTY.'
      },
      {
        id: 'extraction',
        step: '4',
        stageName: 'Business Rule Extraction',
        plainEnglish: 'Pulls out the actual business logic (such as fees, interest, or status checks) from conditional statements.',
        category: 'Identified',
        categoryVariant: 'info',
        badge: `${rulesCount} Rules Extracted`,
        destination: { section: 'business-logic', from: 'modernization-report' },
        destinationLabel: 'View All Rules in Business Logic →',
        whatWeDid: 'Isolated IF, WHEN, and COMPUTE statements and formulated verifiable rule specifications with source line citations.',
        whyItMatters: 'Banks cannot afford to lose business rules during modernization. Documenting every condition prevents logic loss.',
        whatWeFound: 'Identified core rules: BR-001 (Minimum balance penalty at $1,000 threshold), BR-002 (Payment settlement fee recovery), and BR-003 (Overdraft classification).'
      },
      {
        id: 'risk',
        step: '5',
        stageName: 'Dependency & Blast Radius Analysis',
        plainEnglish: 'Identifies which other programs or operations could be affected if this part of the system changes.',
        category: hasHighRisks ? 'Identified (Action Required)' : 'Identified',
        categoryVariant: hasHighRisks ? 'warning' : 'info',
        badge: hasHighRisks ? 'High Risk Flagged' : 'Low/Medium Risk',
        destination: { section: 'dependencies-risks', paragraph: '2100-CALCULATE-PENALTY', from: 'modernization-report' },
        destinationLabel: 'Inspect Blast Radius in Dependencies & Risks →',
        whatWeDid: 'Mapped call relationships and tracked shared working storage variables (WS-BALANCE, WS-PENALTY) across routines.',
        whyItMatters: 'Changing a calculation in one routine could silently break a downstream payment settlement or reporting routine.',
        whatWeFound: 'Routine 2100-CALCULATE-PENALTY directly mutates WS-BALANCE, affecting caller 2000-PROCESS-PAYMENT and the core banking ledger.'
      },
      {
        id: 'evidence',
        step: '6',
        stageName: 'Evidence Verification & Governance Gate',
        plainEnglish: 'Compares code against real production incidents to check if the code matches what the bank actually intends.',
        category: hasConflicts ? 'Pending Validation' : 'Completed',
        categoryVariant: hasConflicts ? 'danger' : 'success',
        badge: hasConflicts ? 'INC-101 Disputed' : 'Baseline Verified',
        destination: { section: 'business-logic', view: 'evidence', from: 'modernization-report' },
        destinationLabel: 'Resolve Conflict in Business Logic →',
        whatWeDid: 'Reconciled code rules against production dispute ticket INC-101 to uncover logic blindspots.',
        whyItMatters: 'Legacy code often contains unhandled edge cases or outdated policies. Automated translation of flawed code replicates the flaw in Java.',
        whatWeFound: hasConflicts
          ? 'GOVERNANCE BLOCKER: Incident INC-101 reports customer accounts with approved payment extensions were incorrectly charged penalty fees because 2100-CALCULATE-PENALTY omits checking copybook field WS-PAYMENT-EXT-FLAG. Approval is locked until credit policy owners validate waiver policy.'
          : 'Code logic verified against observed baseline specifications.'
      },
      {
        id: 'decision',
        step: '7',
        stageName: 'Modernization Decision (4R Framework)',
        plainEnglish: 'Decides whether each part should be kept as-is, refactored into Java, replaced with a library, or removed.',
        category: 'Proposed',
        categoryVariant: 'neutral',
        badge: hasConflicts ? 'Review Required' : '4R Formulated',
        destination: null, // Internal toggle
        destinationLabel: 'Review 4R Strategy Allocations Below ↓',
        whatWeDid: 'Evaluated each routine against the 4R framework (RETAIN, REFACTOR, REPLACE, REMOVE) based on side-effects and risk.',
        whyItMatters: 'Not all legacy code should be rewritten from scratch; low-risk deterministic checks can be mapped directly, while high-risk logic requires careful re-engineering.',
        whatWeFound: 'REFACTOR recommended for 2100-CALCULATE-PENALTY (Spring service) and 2000-PROCESS-PAYMENT (Transactional orchestrator); RETAIN recommended for 1000-CHECK-ACCOUNT-STATUS (Java enum AccountStatus).'
      },
      {
        id: 'plan',
        step: '8',
        stageName: 'Java 21 + Spring Boot 3.x Migration Plan',
        plainEnglish: 'Orders the migration steps so independent parts are modernized before dependent ones.',
        category: 'Proposed',
        categoryVariant: 'neutral',
        badge: `${migrationPhases.length} Phases Sequenced`,
        destination: null, // Internal toggle
        destinationLabel: 'Inspect Phased Migration Sequence Below ↓',
        whatWeDid: 'Formulated a dependency-ordered, 3-phase migration sequence targeting Java 21 LTS, Spring Boot 3.3.x, and BigDecimal precision.',
        whyItMatters: 'Modernizing in dependency order guarantees that foundational data models and characterization tests exist before writing business services.',
        whatWeFound: '3 phased steps: Phase 1 (Validate & Characterize), Phase 2 (Refactor with unit tests into PenaltyCalculationService.java), Phase 3 (Migrate low-risk rules).'
      },
      {
        id: 'testing',
        step: '9',
        stageName: 'Characterization Regression Testing',
        plainEnglish: 'Checks that the new Java application behaves the same as the existing COBOL application.',
        category: 'Proposed',
        categoryVariant: 'neutral',
        badge: `${liveRegressionTests.length || REGRESSION_TEST_SCENARIOS.length} Scenarios`,
        destination: null, // Internal toggle
        destinationLabel: 'Review JUnit 5 Test Scenarios Below ↓',
        whatWeDid: 'Synthesized golden-master boundary test cases from AST condition thresholds ($1,000 threshold, $850 balance).',
        whyItMatters: 'Banking regulators require proof of zero functional divergence. Running identical tests on both systems provides mathematical proof of equivalence.',
        whatWeFound: 'Generated JUnit 5 test assertions for boundary inputs (balance $1,000.00, $850.00, $2,500.00) asserting exact fee and balance calculations.'
      },
      {
        id: 'verified',
        step: '10',
        stageName: 'Verified Modernization Outcome',
        plainEnglish: 'The final sign-off confirming that the modernized system is correct, safe, and ready for production.',
        category: hasConflicts ? 'Pending Validation' : 'Proposed',
        categoryVariant: hasConflicts ? 'danger' : 'neutral',
        badge: hasConflicts ? 'Locked by INC-101' : 'Audit Ready',
        destination: null, // Internal toggle
        destinationLabel: 'Inspect Governance Sign-Off Status Below ↓',
        whatWeDid: 'Established the audit trail connecting source COBOL lines, AST conditions, incident resolutions, and JUnit 5 test results.',
        whyItMatters: 'Provides the documentation required by banking compliance, audit, and risk committees.',
        whatWeFound: hasConflicts
          ? 'Approval is currently locked by incident INC-101. Once retail credit owners confirm the waiver policy, the system is ready for governance sign-off.'
          : 'Ready for architecture governance board review.'
      }
    ];
  }, [stagedFiles, findings, isReassessed, overview, migrationPhases, liveRegressionTests]);

  const activeNode = flowNodes.find(n => n.id === selectedNodeId) || flowNodes[5];

  // Quick navigation handler
  const handleStageNavigation = (node) => {
    if (node.destination) {
      onNavigate(node.destination);
    } else {
      setSelectedNodeId(node.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Modernization Roadmap
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Engine Connected' : 'Local Reference'}
            </Badge>
            <Badge variant="info" size="xs">
              COBOL-85 &rarr; Java 21 + Spring Boot 3.x
            </Badge>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Interactive Modernization Journey & Governance Report
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl mt-0.5">
            Click any stage or finding to navigate directly to its analysis workspace. Every stage explains what LegacyIQ performed, why it matters, and what was found.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('overview')}
          >
            &larr; Back to Overview
          </Button>
        </div>
      </div>

      {/* 2. Activity Category Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong>Completed:</strong> Work performed by LegacyIQ
          </span>
          <span className="flex items-center gap-1.5 text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <strong>Identified:</strong> Findings discovered in code
          </span>
          <span className="flex items-center gap-1.5 text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong>Pending Validation:</strong> Needs business sign-off
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <strong>Proposed:</strong> Recommended future activity
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Click any stage node to inspect or navigate
        </span>
      </div>

      {/* 3. THE 10-STAGE INTERACTIVE MODERNIZATION FLOW DIAGRAM */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* ROW 1: Stages 1 to 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {flowNodes.slice(0, 5).map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
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
                    <Badge variant={node.categoryVariant} size="xs">
                      {node.category}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 leading-snug">
                    {node.stageName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {node.plainEnglish}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-600 font-semibold">{node.badge}</span>
                  <span className="text-blue-600 font-bold group-hover:underline">Inspect &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CONNECTOR ARROW TO DECISION GATE */}
        <div className="flex justify-center my-0.5 text-slate-300 font-bold text-sm">
          &darr;
        </div>

        {/* STAGE 6: DECISION GATE — EVIDENCE VERIFICATION */}
        <div className="max-w-4xl mx-auto">
          <div
            onClick={() => setSelectedNodeId('evidence')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              selectedNodeId === 'evidence'
                ? 'ring-2 ring-blue-500/20 border-blue-400'
                : 'border-slate-200'
            } ${
              isReassessed ? 'bg-rose-50/80 border-rose-300' : 'bg-amber-50/60 border-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs font-mono text-white ${
                  isReassessed ? 'bg-rose-600' : 'bg-amber-600'
                }`}>
                  6
                </span>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    STAGE 6 DECISION GATE: Evidence Verification & Governance Check
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Compares code against real production incidents to check if the code matches what the bank actually intends.
                  </span>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold shrink-0 self-start sm:self-auto ${
                isReassessed ? 'bg-rose-600 text-white shadow-2xs' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isReassessed ? 'GOVERNANCE BLOCKER: INC-101' : 'BASELINE VERIFIED'}
              </span>
            </div>

            {isReassessed && (
              <div className="mt-2 p-2.5 rounded bg-white border border-rose-200 text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] text-slate-700 leading-snug">
                  <strong>Conflict Discovered:</strong> Accounts with approved payment extensions were assessed penalty fees because procedure logic omits checking <code className="font-mono text-slate-800">WS-PAYMENT-EXT-FLAG</code>.
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate({ section: 'business-logic', view: 'evidence', from: 'modernization-report' });
                  }}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] font-mono shrink-0 cursor-pointer shadow-2xs"
                >
                  Resolve in Business Logic &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CONNECTOR ARROW TO 4R BRANCH */}
        <div className="flex justify-center my-0.5 text-slate-300 font-bold text-sm">
          &darr;
        </div>

        {/* STAGE 7: 4R MODERNIZATION DECISION BRANCHING */}
        <div 
          onClick={() => setSelectedNodeId('decision')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedNodeId === 'decision'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] font-mono flex items-center justify-center">
                7
              </span>
              <span className="font-bold text-xs text-slate-900">
                Stage 7: Modernization Decision (4R Framework Branching)
              </span>
              <Badge variant="neutral" size="xs">Proposed</Badge>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Decides whether each part should be kept, refactored, replaced, or removed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">RETAIN</span>
                <span className="text-[10px] text-slate-400 font-mono">Enum Mapping</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Map deterministic status check to Java 21 enum (<code className="font-mono text-slate-700">AccountStatus.java</code>).
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-blue-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700">REFACTOR</span>
                <Badge variant="info" size="xs">Recommended</Badge>
              </div>
              <p className="text-[11px] text-slate-600">
                Re-engineer calculation into Spring Boot service (<code className="font-mono text-slate-700">PenaltyCalculationService.java</code>).
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">REPLACE</span>
                <span className="text-[10px] text-slate-400 font-mono">Database</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Replace flat-file settlement with modern PostgreSQL ACID ledger table.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">REMOVE</span>
                <span className="text-[10px] text-slate-400 font-mono">Dead Code</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Eliminate obsolete batch control routines and redundant file pointers.
              </p>
            </div>
          </div>
        </div>

        {/* CONNECTOR ARROW TO STAGES 8-10 */}
        <div className="flex justify-center my-0.5 text-slate-300 font-bold text-sm">
          &darr;
        </div>

        {/* ROW 3: Stages 8, 9, 10 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {flowNodes.slice(7).map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
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
                    <Badge variant={node.categoryVariant} size="xs">
                      {node.category}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 leading-snug">
                    {node.stageName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {node.plainEnglish}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-600 font-semibold">{node.badge}</span>
                  <span className="text-blue-600 font-bold group-hover:underline">Inspect &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIVE STAGE DEEP-DIVE & EXPLANATION PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-2xs">
              {activeNode.step}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{activeNode.stageName}</h3>
                <Badge variant={activeNode.categoryVariant} size="xs">
                  {activeNode.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Plain English: &ldquo;{activeNode.plainEnglish}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeNode.destination && (
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleStageNavigation(activeNode)}
              >
                {activeNode.destinationLabel}
              </Button>
            )}
          </div>
        </div>

        {/* 4 Key Explanation Quadrants: What We Did, Why It Matters, What We Found, Where to See It */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* What we did */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                1. What LegacyIQ Did
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {activeNode.whatWeDid}
              </p>
            </div>

            {/* Why it matters */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                2. Why It Matters
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {activeNode.whyItMatters}
              </p>
            </div>

            {/* Where to see it */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 font-mono block">
                  3. Where to See It
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Interactive findings, code lines, and specifications are directly reachable:
                </p>
              </div>
              {activeNode.destination ? (
                <button
                  type="button"
                  onClick={() => handleStageNavigation(activeNode)}
                  className="font-mono text-blue-700 hover:text-blue-900 font-bold text-[11px] text-left underline cursor-pointer mt-1"
                >
                  {activeNode.destinationLabel}
                </button>
              ) : (
                <span className="text-[11px] font-mono text-slate-500">
                  Detailed in the report panels below
                </span>
              )}
            </div>
          </div>

          {/* What we found (Project Facts with Clickable Links) */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
              4. What We Found in This Project
            </span>
            <p className="text-slate-800 text-[11px] leading-relaxed font-medium">
              {activeNode.whatWeFound}
            </p>

            {/* Interactive Citations row for this stage */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-500 font-mono">Related Project Links:</span>
              
              <button
                type="button"
                onClick={() => onNavigate({ section: 'cobol-analysis', file: 'PENALTY.cbl', lines: [37, 44], from: 'modernization-report' })}
                className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-mono font-medium cursor-pointer transition-colors"
              >
                PENALTY.cbl (Lines 37–44) &rarr;
              </button>

              <button
                type="button"
                onClick={() => onNavigate({ section: 'cobol-analysis', file: 'ACCTREC.cpy', from: 'modernization-report' })}
                className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-mono font-medium cursor-pointer transition-colors"
              >
                ACCTREC.cpy (Schema) &rarr;
              </button>

              <button
                type="button"
                onClick={() => onNavigate({ section: 'business-logic', ruleId: 'BR-001', from: 'modernization-report' })}
                className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-mono font-medium cursor-pointer transition-colors"
              >
                Rule BR-001 (Penalty) &rarr;
              </button>

              <button
                type="button"
                onClick={() => onNavigate({ section: 'dependencies-risks', paragraph: '2100-CALCULATE-PENALTY', from: 'modernization-report' })}
                className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-mono font-medium cursor-pointer transition-colors"
              >
                2100-CALCULATE-PENALTY (Call Graph) &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 4R COMPONENT STRATEGY BREAKDOWN */}
      <Card
        title="Component Modernization Allocations (4R Strategy)"
        subtitle="Retain, Refactor, Replace, or Remove strategies assigned per COBOL routine"
        badge={<Badge variant="info" size="xs">4R Strategy</Badge>}
      >
        <div className="space-y-2 text-xs">
          {componentStrategies.map((comp) => (
            <div
              key={comp.id}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{comp.paragraph}</span>
                  <button
                    type="button"
                    onClick={() => onNavigate({ section: 'cobol-analysis', file: comp.sourceFile, from: 'modernization-report' })}
                    className="text-[10px] font-mono text-blue-700 hover:underline cursor-pointer"
                  >
                    {comp.sourceFile} ({comp.lines})
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">{comp.recommendation}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={comp.strategyBadge} size="xs">{comp.strategy}</Badge>
                <button
                  type="button"
                  onClick={() => onNavigate({ section: 'business-logic', ruleId: comp.ruleId, from: 'modernization-report' })}
                  className="text-[10px] font-mono text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer transition-colors"
                >
                  View Rule &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. PROPOSED TARGET JAVA 21 ARCHITECTURE */}
      <Card
        title="Proposed Modernization Target Architecture"
        subtitle="Hexagonal Clean Architecture for Java 21 LTS + Spring Boot 3.3.x"
        badge={<Badge variant="info" size="xs">Proposed Target</Badge>}
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
        <div className="space-y-4 text-xs">
          {/* Target Architecture Flow */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-[11px]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
              <div 
                onClick={() => onNavigate({ section: 'cobol-analysis', file: 'PENALTY.cbl', from: 'modernization-report' })}
                className="p-3 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 shadow-2xs flex-1 w-full cursor-pointer transition-colors"
              >
                <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Existing System</span>
                <span className="font-bold text-slate-900 block mt-1">COBOL-85 Source</span>
                <span className="text-[10px] text-blue-700">PENALTY.cbl, ACCTREC.cpy &rarr;</span>
              </div>

              <span className="text-slate-400 font-bold">&rarr;</span>

              <div 
                onClick={() => onNavigate({ section: 'business-logic', from: 'modernization-report' })}
                className="p-3 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 shadow-2xs flex-1 w-full cursor-pointer transition-colors"
              >
                <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Validated Rules</span>
                <span className="font-bold text-blue-700 block mt-1">AST Conditionals</span>
                <span className="text-[10px] text-slate-500">Rules BR-001 to BR-003 &rarr;</span>
              </div>

              <span className="text-slate-400 font-bold">&rarr;</span>

              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 shadow-2xs flex-1 w-full">
                <span className="text-[10px] text-blue-600 uppercase font-bold block">3. Proposed Java App</span>
                <span className="font-bold text-blue-900 block mt-1">Spring Boot 3.3.x</span>
                <span className="text-[10px] text-blue-700">PenaltyCalculationService</span>
              </div>

              <span className="text-slate-400 font-bold">&rarr;</span>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex-1 w-full">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Regression Test</span>
                <span className="font-bold text-emerald-700 block mt-1">JUnit 5 Suite</span>
                <span className="text-[10px] text-slate-500">Boundary Parity Test</span>
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
            <strong>Architecture Notice:</strong> The target Java 21 service is an architectural recommendation formulated from AST conditions and validated incident evidence. LegacyIQ does not claim automatic code conversion.
          </div>
        </div>
      </Card>
    </div>
  );
}
