import Card from '../common/Card';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useProject } from '../../context/ProjectContext';

export default function OverviewSection({ onNavigate }) {
  const { 
    projectName,
    activeFile, 
    stagedFiles,
    overview, 
    findings, 
    isReassessed, 
    isBackendOnline,
    backendStatus,
    projectId
  } = useProject();

  const rulesCount = overview?.rule_candidates ?? (findings.length > 0 ? findings.length : 2);
  const filesCount = overview?.files_analyzed ?? stagedFiles.length;
  const risksCount = overview?.risks ?? (isReassessed ? 1 : 0);
  const conflictsCount = overview?.evidence_conflicts ?? (isReassessed ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Main Header / Banner - White Primary, Soft-Neutral */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                COBOL-85 → Java 21 LTS + Spring Boot 3.x
              </span>
              <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
                {isBackendOnline ? 'Backend Engine Connected (FastAPI)' : 'Offline Local Reference Model'}
              </Badge>
              {projectId && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  ID: {projectId.slice(0, 8)}...
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              LegacyIQ — COBOL Modernization Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Understand before modernizing. Verify before approving. LegacyIQ connects real COBOL banking programs from GitHub repositories to our automated analysis engine, extracting traceable business rules, mapping paragraph blast radii, and synthesizing evidence-gated modernization plans.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('cobol-analysis')}
            >
              Open COBOL Workspace &rarr;
            </Button>
          </div>
        </div>

        {/* Core Ingestion Flow Indicators */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
          <span className="text-slate-400 font-sans font-medium">Core Pipeline:</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">1. GitHub Ingest</span>
          <span className="text-slate-300">&rarr;</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">2. Source AST</span>
          <span className="text-slate-300">&rarr;</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">3. Business Logic</span>
          <span className="text-slate-300">&rarr;</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">4. Blast Radius</span>
          <span className="text-slate-300">&rarr;</span>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold">5. Java 21 Plan</span>
        </div>
      </div>

      {/* Backend Offline Guidance Banner */}
      {!isBackendOnline && backendStatus !== 'checking' && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-800">Local Reference Mode Active:</span> Backend server not detected at <code>http://localhost:8000</code>. Run <code>uvicorn backend.main:app --reload</code> from repository root to connect live engine.
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-700 self-start sm:self-auto font-semibold">
            STANDALONE CLIENT
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active COBOL Program"
          value={activeFile?.name || 'PENALTY.cbl'}
          subtext={`${activeFile?.loc || 44} LOC • ${filesCount} file(s) staged`}
          badge={projectName || 'COBOL-85'}
          badgeVariant="neutral"
        />

        <StatCard
          label="Business Rules Extracted"
          value={rulesCount}
          subtext={isBackendOnline ? 'Genuinely extracted via AST' : 'AST-grounded candidates'}
          badge={isBackendOnline ? 'Live Engine' : 'Reference'}
          badgeVariant="info"
        />

        <StatCard
          label="Evidence Verification"
          value={conflictsCount > 0 ? `${conflictsCount} Disputed` : 'All Verified'}
          subtext={conflictsCount > 0 ? 'INC-101 payment extension conflict' : 'Observed code baseline'}
          badge={conflictsCount > 0 ? 'Conflict Flagged' : 'Verified'}
          badgeVariant={conflictsCount > 0 ? 'warning' : 'success'}
        />

        <StatCard
          label="High/Critical Risks"
          value={risksCount}
          subtext="Assessed by engine heuristics"
          badge="Java 21 Target"
          badgeVariant={risksCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Primary Scope & Use Case Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          <Card
            title="Core Retail Banking Modernization Scope"
            subtitle="Demonstration target: Fee calculation, penalty recovery, and account status transitions"
            badge={<Badge variant="info">Target Application</Badge>}
          >
            <div className="space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                The banking core application is representative of mission-critical batch and online transaction processing (OLTP) workloads running across commercial banking platforms. LegacyIQ analyzes the PROCEDURE DIVISION to identify calculation routines and separates business policies from runtime infrastructure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">
                    Source Program
                  </span>
                  <div className="font-mono font-bold text-slate-900">{activeFile?.name || 'PENALTY.cbl'}</div>
                  <p className="text-[11px] text-slate-500">
                    Evaluates minimum balance maintenance fees (<code className="text-slate-800">BR-001</code>).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">
                    Linked Copybook
                  </span>
                  <div className="font-mono font-bold text-slate-900">ACCTREC.cpy</div>
                  <p className="text-[11px] text-slate-500">
                    Defines <code className="text-slate-800">WS-ACCOUNT-RECORD</code> and customer extension status flag.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">
                    Java 21 Target
                  </span>
                  <div className="font-mono font-bold text-blue-700">PenaltyCalculationService</div>
                  <p className="text-[11px] text-slate-500">
                    Spring Boot 3.3.x domain service utilizing immutable Records and BigDecimal.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">
                  Primary Modernization Steps:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">1.</span>
                    <span><strong>GitHub COBOL Ingestion:</strong> Ingest .cbl, .cob, or .cpy directly from GitHub URL via <code>/api/sources/github</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">2.</span>
                    <span><strong>Source AST & Rules:</strong> Isolate paragraphs and extract conditions into plain English via <code>legacyiq_engine</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">3.</span>
                    <span><strong>Evidence Corroboration:</strong> Reconcile findings against tickets (INC-101) to detect blindspots via <code>/api/projects/{'{id}'}/evidence</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">4.</span>
                    <span><strong>Gated Assessment:</strong> Generate Java 21 specification and characterization regression tests via <code>/api/projects/{'{id}'}/report</code>.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Technical Truthfulness & Implementation Status */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="Backend Integration Status"
            subtitle="Actual endpoints connected to the FastAPI engine"
            badge={<Badge variant="neutral">Truthfulness Audit</Badge>}
          >
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">GitHub File Ingestion</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    POST /api/sources/github
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Validates public GitHub URL, fetches text content with timeout, and checks extensions.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">COBOL AST & Rules</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    POST /api/projects
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Parses PROCEDURE DIVISION paragraphs, IF/WHEN conditions, and extracts rule candidates.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Evidence Reassessment</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    POST .../evidence
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Correlates incident text with rules, updates risk scores, and tracks versions in history store.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Modernization Assessment</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    GET .../report
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Builds comprehensive report with risk factors, 4R recommendations, and phased sequence.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
