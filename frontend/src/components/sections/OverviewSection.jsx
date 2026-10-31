import Card from '../common/Card';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { COBOL_BUSINESS_RULES } from '../../data/mockCobolData';

export default function OverviewSection({ 
  onNavigate,
  isReassessed = false
}) {
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
              <Badge variant={isReassessed ? 'warning' : 'success'} size="xs" dot>
                {isReassessed ? 'Adaptive State Active (v2.0)' : 'Baseline Grounded (v1.0)'}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              LegacyIQ — COBOL Modernization Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Understand before modernizing. Verify before approving. LegacyIQ ingests COBOL banking applications from GitHub repositories, maps paragraph dependencies, extracts traceable business rules, and synthesizes evidence-gated modernization assessments to Java 21 clean architecture.
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active COBOL Program"
          value="PENALTY.cbl"
          subtext="44 LOC • Fixed 80-col layout"
          badge="COBOL-85"
          badgeVariant="neutral"
        />

        <StatCard
          label="Business Rules Extracted"
          value={COBOL_BUSINESS_RULES.length}
          subtext="100% line-grounded in AST"
          badge="Extracted"
          badgeVariant="info"
        />

        <StatCard
          label="Evidence Verification"
          value={isReassessed ? '1 Disputed' : 'All Verified'}
          subtext={isReassessed ? 'INC-101 payment extension dispute' : 'Observed code baseline'}
          badge={isReassessed ? 'Conflict Detected' : 'Verified'}
          badgeVariant={isReassessed ? 'warning' : 'success'}
        />

        <StatCard
          label="Target Architecture"
          value="Java 21 LTS"
          subtext="Spring Boot 3.3.x Hexagonal"
          badge="Clean Core"
          badgeVariant="success"
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
                  <div className="font-mono font-bold text-slate-900">PENALTY.cbl</div>
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
                    <span><strong>GitHub COBOL Ingestion:</strong> Ingest .cbl, .cob, or .cpy directly from GitHub URL.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">2.</span>
                    <span><strong>Source AST & Rules:</strong> Isolate paragraphs and extract conditions into plain English.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">3.</span>
                    <span><strong>Evidence Corroboration:</strong> Reconcile findings against tickets (INC-101) to detect blindspots.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 font-mono">4.</span>
                    <span><strong>Gated Assessment:</strong> Generate Java 21 specification and characterization regression tests.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Technical Truthfulness & Implementation Status */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="System Capabilities Status"
            subtitle="Clear distinction between live, simulated, and planned modules"
            badge={<Badge variant="neutral">Truthfulness Audit</Badge>}
          >
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">GitHub File Ingestion</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    LIVE CLIENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct client-side retrieval of public GitHub COBOL raw files with extension validation.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">COBOL AST & Rules</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                    SIMULATED DEMO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Grounded in actual COBOL lines 1–44 for the banking demonstration. Full backend parser planned.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Python AST Engine</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    LIVE BACKEND
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  FastAPI + SQLite backend verified via automated test suite (available as secondary tab).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Java 21 Assessment</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">
                    VERIFIED SPEC
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Hexagonal architecture, 4R strategies, and 5 JUnit 5 regression test scenarios.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
