import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function DecisionExplanation({
  record
}) {
  if (!record) return null;

  return (
    <Card
      title="Decision Rationale & Governance Justification"
      subtitle="Transparent explanation of the modernization verdict derived strictly from traceable evidence"
      badge={
        <Badge 
          variant={record.verdictVariant || 'neutral'} 
          size="xs"
        >
          Verdict: {record.verdict}
        </Badge>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Core Rationale Callout */}
        <div className={`p-4 rounded-xl border space-y-2 ${
          record.verdict === 'REVIEW'
            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
            : record.verdict === 'MODERNIZE'
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : record.verdict === 'KEEP'
            ? 'bg-blue-50/60 border-blue-200 text-blue-950'
            : 'bg-rose-50/60 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {record.verdict === 'REVIEW' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {record.verdict === 'MODERNIZE' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {record.verdict === 'KEEP' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            {record.verdict === 'INVESTIGATE' && <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>Why {record.componentName} received {record.verdict}:</span>
          </div>

          <p className="text-slate-700 leading-relaxed text-xs">
            {record.verdictReason}
          </p>
        </div>

        {/* Structured Evidence Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Key Findings */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="font-semibold text-slate-900 block">
              Observed Facts vs. Assumptions:
            </span>
            <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px] leading-snug">
              <li>
                <strong>Static Code Fact:</strong> Implements conditional check in {record.file} ({record.lines}).
              </li>
              {record.isDisputed ? (
                <li className="text-rose-700">
                  <strong>Conflict Fact:</strong> Production dispute INC-101 reports extension waivers are absent from logic.
                </li>
              ) : (
                <li>
                  <strong>Dependency Posture:</strong> Stable internal call hierarchy with zero contradictory tickets.
                </li>
              )}
              <li>
                <strong>Confidence Rating:</strong> Calculated at {(record.confidenceScore * 100).toFixed(0)}% based on available evidence completeness.
              </li>
            </ul>
          </div>

          {/* Recommended Next Action */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              Recommended Architectural Next Action:
            </span>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {record.recommendedAction}
            </p>
            <div className="pt-1 text-[10px] text-slate-400 font-mono">
              Target Strategy: {record.recommendedStrategy}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
