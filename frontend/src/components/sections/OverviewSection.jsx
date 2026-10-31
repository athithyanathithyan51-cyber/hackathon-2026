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
    dependencies,
    isReassessed, 
    isBackendOnline,
    projectId
  } = useProject();

  // Metrics
  const filesCount = overview?.files_analyzed ?? stagedFiles.length;
  const cobolProgramsCount = stagedFiles.filter(f => {
    const ext = (f.extension || '').toLowerCase().replace(/^\./, '');
    return f.classification === 'cobol_program' || ext === 'cbl' || ext === 'cob';
  }).length || 1;

  const rulesCount = overview?.rule_candidates ?? (findings.length > 0 ? findings.length : 3);
  const dependenciesCount = Object.keys(dependencies).length || 3;
  const risksCount = overview?.risks ?? (isReassessed ? 1 : 0);
  const conflictsCount = overview?.evidence_conflicts ?? (isReassessed ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* 1. PROJECT SUMMARY HEADER */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">
              {projectName || 'banking-core'}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              COBOL-85 &rarr; Java 21 + Spring Boot 3.x
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Engine Connected' : 'Local Reference'}
            </Badge>
            {projectId && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                ID: {projectId.slice(0, 8)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
            <span>Scope: {filesCount} source file(s) staged</span>
            <span>&bull;</span>
            <span>Active: {activeFile?.name || 'PENALTY.cbl'}</span>
            <span>&bull;</span>
            <span className={conflictsCount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-semibold'}>
              Status: {conflictsCount > 0 ? 'Review Required (INC-101 Gate)' : 'Analysis Complete'}
            </span>
          </div>
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

      {/* 2. KEY METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Programs Analyzed"
          value={cobolProgramsCount}
          subtext={`${filesCount} total staged files`}
          badge="COBOL-85"
          badgeVariant="neutral"
        />

        <StatCard
          label="Business Rules Identified"
          value={rulesCount}
          subtext="Extracted conditional logic"
          badge="AST Grounded"
          badgeVariant="info"
        />

        <StatCard
          label="Dependencies Mapped"
          value={dependenciesCount}
          subtext="PERFORM & CALL routines"
          badge="Call Graph"
          badgeVariant="neutral"
        />

        <StatCard
          label="Findings Requiring Review"
          value={conflictsCount > 0 ? `${conflictsCount} Disputed` : '0 Blockers'}
          subtext={conflictsCount > 0 ? 'INC-101 waiver dispute' : 'Baseline verified'}
          badge={conflictsCount > 0 ? 'Action Needed' : 'Clean'}
          badgeVariant={conflictsCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* 3. ANALYSIS STATUS & GOVERNANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Completed Stages */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs">Completed Stages</span>
            <Badge variant="success" size="xs">Verified</Badge>
          </div>
          <div className="space-y-1.5 text-slate-600 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">&check;</span>
              <span>Source Discovery & Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">&check;</span>
              <span>Program AST Parsing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">&check;</span>
              <span>Business Rule Extraction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">&check;</span>
              <span>Routine Dependency Graphing</span>
            </div>
          </div>
        </div>

        {/* Pending Validation */}
        <div className={`p-4 rounded-xl border shadow-2xs space-y-2.5 ${
          conflictsCount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs">Pending Validation</span>
            <Badge variant={conflictsCount > 0 ? 'warning' : 'neutral'} size="xs">
              {conflictsCount > 0 ? '1 Item' : '0 Items'}
            </Badge>
          </div>
          {conflictsCount > 0 ? (
            <div className="space-y-1.5 text-amber-950 text-[11px]">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <span>&bull;</span>
                <span>INC-101 Extension Waiver Policy</span>
              </div>
              <p className="text-slate-600 leading-snug">
                Customer dispute stream reports accounts with approved extensions were assessed penalty fees. Requires retail credit owner sign-off.
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-[11px]">
              No active operational disputes. All business rule candidates match observed code specifications.
            </p>
          )}
        </div>

        {/* High-Risk Findings */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs">High-Risk Findings</span>
            <Badge variant={risksCount > 0 ? 'warning' : 'neutral'} size="xs">
              {risksCount > 0 ? `${risksCount} Flagged` : '0 Flagged'}
            </Badge>
          </div>
          <div className="space-y-1.5 text-slate-600 text-[11px]">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold font-mono">!</span>
              <div>
                <span className="font-semibold text-slate-800 font-mono">2100-CALCULATE-PENALTY:</span> Direct balance mutation (<code className="font-mono text-slate-700">WS-BALANCE - 50.00</code>) during payment settlement.
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold font-mono">&bull;</span>
              <div>
                <span className="font-semibold text-slate-800 font-mono">ACCTREC.cpy:</span> Defines flag <code className="font-mono text-slate-700">WS-PAYMENT-EXT-FLAG</code> omitted in procedure logic.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK NAVIGATION CARDS */}
      <Card
        title="Application Sections"
        subtitle="Direct access to analysis workspaces, business rules, dependencies, and reports"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('cobol-analysis')}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                COBOL Analysis
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Inspect source files, paragraphs, and data declarations.
              </p>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold font-mono mt-3 inline-block">
              Open Workspace &rarr;
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('business-logic')}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                Business Logic
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review extracted rules, conditions, and evidence matching.
              </p>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold font-mono mt-3 inline-block">
              View Rules &rarr;
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dependencies-risks')}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                Dependencies & Risks
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Analyze routine blast radii and affected callers.
              </p>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold font-mono mt-3 inline-block">
              Inspect Dependencies &rarr;
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('modernization-report')}
            className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 hover:border-blue-400 transition-all text-left group cursor-pointer flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="font-bold text-blue-900 text-xs">
                Modernization Report
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                10-stage modernization roadmap and Java 21 plan.
              </p>
            </div>
            <span className="text-[11px] text-blue-700 font-bold font-mono mt-3 inline-block">
              View Report &rarr;
            </span>
          </button>
        </div>
      </Card>
    </div>
  );
}
