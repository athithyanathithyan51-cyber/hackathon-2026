import { FileCode2, Sparkles, ShieldCheck, ArrowRight, Eye } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function BusinessRuleTable({
  rules = [],
  onSelectRuleFunction
}) {
  if (!rules || rules.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Extracted Business Rule Candidates
            </h3>
            <Badge variant="purple" size="xs">
              {rules.length} Identified
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Implicit business logic discovered from conditional AST structures. Differentiates verified code observations from inferred business intent.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Observed in Code
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            AI Interpreted
          </span>
        </div>
      </div>

      {/* Desktop / Responsive Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Rule ID & Name</th>
              <th className="py-3 px-4">Function / Line Citation</th>
              <th className="py-3 px-4">Observed Code Fact</th>
              <th className="py-3 px-4">Business Interpretation</th>
              <th className="py-3 px-4">Provenance</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rules.map((rule) => {
              const fnId = `fn-${rule.functionName.replace(/_/g, '-')}`;

              return (
                <tr 
                  key={rule.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* ID & Name */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-900 font-mono text-[11px] text-blue-700">
                      {rule.id}
                    </div>
                    <div className="font-medium text-slate-900 text-xs mt-0.5">
                      {rule.ruleName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {rule.category}
                    </div>
                  </td>

                  {/* Function & Line Citation */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1 font-mono font-semibold text-slate-900 text-xs">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {rule.functionName}()
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {rule.file}
                    </div>
                    <div className="text-[10px] text-blue-600 font-mono font-semibold bg-blue-50/80 inline-block px-1.5 py-0.2 rounded mt-1 border border-blue-100">
                      {rule.lineReference}
                    </div>
                  </td>

                  {/* Observed Code Fact */}
                  <td className="py-3.5 px-4 align-top max-w-xs">
                    <div className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200/80 inline-block">
                      {rule.extractedCondition}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Result: <code className="text-slate-700">{rule.observedResult}</code>
                    </div>
                  </td>

                  {/* AI Interpretation */}
                  <td className="py-3.5 px-4 align-top max-w-xs">
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {rule.interpretation}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>Confidence: {(rule.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  </td>

                  {/* Provenance Tag */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <Badge variant={rule.provenance.includes('AI') ? 'purple' : 'info'} size="xs">
                      {rule.provenance}
                    </Badge>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Eye}
                      onClick={() => onSelectRuleFunction && onSelectRuleFunction(fnId)}
                      title="Inspect in Function Explorer"
                    >
                      <span className="hidden sm:inline">Inspect</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
