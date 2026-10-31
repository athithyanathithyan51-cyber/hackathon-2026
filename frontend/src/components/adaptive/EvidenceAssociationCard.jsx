import { 
  GitMerge, 
  FileCode2, 
  AlertTriangle, 
  ShieldAlert
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { EVIDENCE_ASSOCIATION } from '../../data/mockAdaptiveData';

export default function EvidenceAssociationCard({
  incident,
  association = EVIDENCE_ASSOCIATION
}) {
  if (!incident) return null;

  return (
    <Card
      title="Dynamic Evidence-to-Rule Association"
      subtitle="Engine correlates ingested incident text with existing AST functions, conditional structures, and citations"
      badge={<Badge variant="warning" dot>Correlation Discovered</Badge>}
    >
      <div className="space-y-4">
        {/* Visual Association Node Diagram */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Incident Source Node */}
          <div className="w-full md:w-5/12 p-3.5 rounded-lg bg-white border border-blue-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider font-mono">
                {incident.id} (New Evidence)
              </span>
              <Badge variant="danger" size="xs">
                Incident Report
              </Badge>
            </div>
            <div className="text-xs font-semibold text-slate-900">
              Payment Extension Exemption
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              "{incident.description}"
            </p>
          </div>

          {/* Association Arrow with Conflict Tag */}
          <div className="flex flex-col items-center justify-center shrink-0 text-center px-2">
            <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mb-1">
              Contradicts Rule
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <GitMerge className="w-4 h-4 text-rose-600 rotate-90 md:rotate-0" />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">
              Semantic Link
            </span>
          </div>

          {/* Target Code Rule Node */}
          <div className="w-full md:w-5/12 p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Rule {association.matchedRuleId} (Discovered Code)
              </span>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 font-semibold">
                {association.lineReference}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-900 font-mono flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
              {association.matchedFunction}
            </div>
            <p className="text-[11px] text-slate-500">
              Condition: <code className="text-slate-700">WS-BALANCE &lt; 1000.00 → MOVE 50.00 TO WS-PENALTY</code>
            </p>
          </div>
        </div>

        {/* Association Rationale & Citations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/90 space-y-1.5">
            <div className="font-semibold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Reason for Association
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {association.reason}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              Confidence & Uncertainty Impact
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {association.confidenceImpact}
            </p>
          </div>
        </div>

        {/* Evidence Classifications Taxonomy Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] font-medium">Evidence Taxonomy:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200">
              SUPPORTING (0)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 border border-rose-200">
              CONFLICTING (1)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200">
              NEW INFORMATION (0)
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200">
              REQUIRES VALIDATION
            </span>
          </div>

          <div className="text-[11px] text-slate-500 italic">
            * Governance Rule: An incident report suggests a potential conflict, not a confirmed business policy.
          </div>
        </div>
      </div>
    </Card>
  );
}
