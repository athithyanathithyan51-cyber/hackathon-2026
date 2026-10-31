import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert,
  Cpu
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function ReassessmentPanel({
  isReassessing = false,
  reassessProgress = 0,
  reassessStep = '',
  isReassessed = false,
  onTriggerReassessment,
  canReassess = false
}) {
  if (isReassessing) {
    return (
      <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <span className="text-xs font-semibold text-indigo-950">
              Running Adaptive Evidence Reassessment Engine...
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-700">
            {reassessProgress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${reassessProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            {reassessStep}
          </span>
          <span className="text-[11px] text-slate-400">Reconciling evidence graph</span>
        </div>
      </div>
    );
  }

  if (isReassessed) {
    return (
      <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-indigo-500/10 border border-amber-300/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Adaptive Reassessment Complete — Version v2.0 Minted
                </span>
                <Badge variant="danger" size="xs">
                  Risk Elevated
                </Badge>
                <Badge variant="purple" size="xs">
                  v2.0 Active
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Existing finding for <strong>calculate_penalty()</strong> updated in-place. Contradictory evidence triggered confidence downgrade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="secondary"
              size="xs"
              icon={RefreshCw}
              onClick={onTriggerReassessment}
              title="Re-run reassessment"
            >
              Re-run
            </Button>
          </div>
        </div>

        {/* Updated Recommendation Callout */}
        <div className="p-3.5 rounded-lg bg-white border border-amber-200 text-xs space-y-1.5">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Updated Modernization Recommendation (v2.0):
          </div>
          <p className="text-slate-700 leading-relaxed font-normal">
            <strong>Halt automated refactoring of calculate_penalty().</strong> Reassessment indicates the legacy code omits approved payment extension exemptions reported in production dispute INC-101. Modernizing as-is will perpetuate incorrect billing.
          </p>
        </div>
      </div>
    );
  }

  // Pending Reassessment Trigger Card
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Reassessment Ready: 1 New Contradictory Evidence Item
          </span>
          <Badge variant="warning" size="xs" dot>
            Requires Re-evaluation
          </Badge>
        </div>
        <p className="text-xs text-slate-500 max-w-xl">
          Execute the adaptive engine to evaluate the impact of incident INC-101 against Rule BR-001, update confidence metrics, re-score risk, and generate version v2.0.
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={onTriggerReassessment}
          disabled={!canReassess}
        >
          Reassess Application
        </Button>
      </div>
    </div>
  );
}
