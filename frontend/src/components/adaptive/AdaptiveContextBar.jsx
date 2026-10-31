import { Layers, Database, ShieldAlert, Cpu } from 'lucide-react';
import Badge from '../common/Badge';

export default function AdaptiveContextBar({
  currentVersion = 'v1.0 (Baseline)',
  evidenceCount = 1,
  rulesCount = 3,
  status = 'v1.0 Baseline Grounded',
  isReassessed = false
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
        {/* Project Target */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            Project Target
          </span>
          <div className="font-bold text-slate-900 truncate">
            Retail Banking Core
          </div>
          <div className="text-[11px] font-mono text-slate-500 truncate">
            penalty_engine.py
          </div>
        </div>

        {/* Active Analysis Version */}
        <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            Analysis Snapshot
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span>{currentVersion}</span>
            <Badge variant={isReassessed ? 'success' : 'purple'} size="xs" dot={isReassessed}>
              {isReassessed ? 'Adaptive Live' : 'Static Code'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500">
            {isReassessed ? 'v1.0 preserved for diff' : 'Initial code ingestion'}
          </div>
        </div>

        {/* Evidence Sources */}
        <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Ingested Evidence
          </span>
          <div className="font-bold text-slate-900">
            {evidenceCount} Evidence {evidenceCount === 1 ? 'Artifact' : 'Artifacts'}
          </div>
          <div className="text-[11px] text-slate-500">
            {isReassessed ? 'AST Code + Incident INC-101' : 'Source code AST only'}
          </div>
        </div>

        {/* Business Rules */}
        <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            Monitored Rules
          </span>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>{rulesCount} Rules</span>
            {isReassessed && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                1 Disputed
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}
