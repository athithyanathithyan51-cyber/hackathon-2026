import Card from '../common/Card';
import Badge from '../common/Badge';
import { COMPARISON_FIELDS } from '../../data/mockAdaptiveData';

export default function VersionComparisonTable({
  isReassessed = false,
  rows = COMPARISON_FIELDS
}) {
  if (!isReassessed) return null;

  return (
    <Card
      title="Analysis Version Comparison: v1.0 Baseline vs. v2.0 Reassessed"
      subtitle="Preserves previous baseline findings while tracking adaptive adjustments in evidence, risk, and recommendations"
      badge={<Badge variant="purple">Immutable Version Diff</Badge>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-1/4">Evaluation Field</th>
              <th className="py-3 px-4 w-3/8 bg-slate-100/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Version 1.0 (Initial Code AST)</span>
                </div>
              </th>
              <th className="py-3 px-4 w-3/8 bg-blue-50/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-indigo-950 font-bold">Version 2.0 (Adaptive Incident)</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, idx) => {
              return (
                <tr 
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* Field Header */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                    <div className="text-xs">{row.field}</div>
                    {row.changed && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-1 inline-block">
                        Updated in v2.0
                      </span>
                    )}
                  </td>

                  {/* Version 1.0 Value */}
                  <td className="py-3.5 px-4 align-top bg-slate-50/30 text-slate-600 border-r border-slate-100 leading-relaxed">
                    <div className="line-through opacity-75 text-[11px] text-slate-500 mb-1">
                      Baseline Finding
                    </div>
                    <div>{row.v1}</div>
                  </td>

                  {/* Version 2.0 Value */}
                  <td className="py-3.5 px-4 align-top bg-indigo-50/20 font-medium text-slate-900 leading-relaxed">
                    <div className="text-[11px] text-indigo-700 font-semibold mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Reassessed Finding
                    </div>
                    <div className="text-slate-800">{row.v2}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
