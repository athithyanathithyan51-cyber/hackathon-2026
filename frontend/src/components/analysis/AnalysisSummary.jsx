import { CheckCircle2, Cpu, RefreshCw, Sparkles } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function AnalysisSummary({
  isAnalyzing = false,
  analysisProgress = 0,
  analysisStep = '',
  isAnalyzed = false,
  onTriggerAnalysis,
  filesCount = 0
}) {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-xs font-semibold text-blue-900">
              Running Static Code & AST Analysis...
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-700">
            {analysisProgress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${analysisProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            {analysisStep}
          </span>
          <span className="text-[11px] text-slate-400">Processing AST pipeline</span>
        </div>
      </div>
    );
  }

  if (isAnalyzed) {
    return (
      <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-950">
                  Initial Code Analysis Complete
                </span>
                <Badge variant="purple" size="xs">
                  v1.0 Baseline
                </Badge>
                <Badge variant="success" size="xs">
                  Simulated
                </Badge>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Extracted 3 functions, 3 potential business rules, and 1 dependency call from Python source.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="secondary"
              size="xs"
              icon={RefreshCw}
              onClick={onTriggerAnalysis}
              title="Re-run simulation analysis"
            >
              Re-analyze
            </Button>
          </div>
        </div>

        {/* Traceability note */}
        <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <strong>Evidence Provenance:</strong> Grounded via Static Code Extraction. Every finding is referenced to exact line numbers.
          </span>
          <span className="font-mono text-emerald-800/80 bg-emerald-100/60 px-2 py-0.5 rounded">
            Version ID: 20261031-v1.0-BASE
          </span>
        </div>
      </div>
    );
  }

  // Ready to analyze state
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Ready to Analyze Source Code
          </span>
          <Badge variant="neutral" size="xs">
            {filesCount} {filesCount === 1 ? 'file staged' : 'files staged'}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 max-w-xl">
          Trigger the initial analysis pipeline to parse the AST, discover executable functions, isolate boundary conditions, and identify candidate business rules.
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={onTriggerAnalysis}
          disabled={filesCount === 0}
        >
          Analyze Application
        </Button>
      </div>
    </div>
  );
}
