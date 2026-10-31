import { 
  FileCode2, 
  Eye
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function DecisionVerdictTable({
  records = [],
  selectedId,
  onSelectComponent
}) {
  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'MODERNIZE':
        return <Badge variant="success" size="xs">MODERNIZE</Badge>;
      case 'REVIEW':
        return <Badge variant="warning" size="xs">REVIEW REQUIRED</Badge>;
      case 'KEEP':
        return <Badge variant="neutral" size="xs">KEEP EXISTING</Badge>;
      case 'INVESTIGATE':
        return <Badge variant="danger" size="xs">INVESTIGATE</Badge>;
      default:
        return <Badge variant="neutral" size="xs">{verdict}</Badge>;
    }
  };

  const getCompletenessBadge = (completeness) => {
    if (completeness.includes('Conflicting')) {
      return <Badge variant="danger" size="xs">Conflicting Evidence</Badge>;
    }
    if (completeness.includes('Sufficient')) {
      return <Badge variant="success" size="xs">Sufficient</Badge>;
    }
    if (completeness.includes('Partial')) {
      return <Badge variant="warning" size="xs">Partial</Badge>;
    }
    return <Badge variant="danger" size="xs">Insufficient</Badge>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-800">
            Evidence-Gated Component Verdicts
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Decisions are strictly gated by traceable code AST citations, incident streams, and completeness criteria.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          {records.length} Components Evaluated
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Component / Citation</th>
              <th className="py-3 px-4">Related Rule</th>
              <th className="py-3 px-4">Modernization Verdict</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Evidence Completeness</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {records.map((rec) => {
              const isSelected = selectedId === rec.id;

              return (
                <tr
                  key={rec.id}
                  onClick={() => onSelectComponent(rec.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/60 font-medium' 
                      : rec.isDisputed 
                      ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Component & File */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono text-xs">
                      <FileCode2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                      {rec.componentName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {rec.file} • <span className="text-blue-600 font-semibold">{rec.lines}</span>
                    </div>
                  </td>

                  {/* Rule ID & Name */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-blue-700 font-mono text-[11px]">
                      {rec.relatedRuleId}
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium truncate max-w-xs mt-0.5">
                      {rec.relatedRuleName}
                    </div>
                  </td>

                  {/* Verdict Badge */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    {getVerdictBadge(rec.verdict)}
                  </td>

                  {/* Confidence Score */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            rec.confidenceScore >= 0.85 
                              ? 'bg-emerald-500' 
                              : rec.confidenceScore >= 0.60 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${rec.confidenceScore * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-900">
                        {(rec.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Risk Level */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <Badge variant={rec.riskVariant} size="xs">
                      {rec.riskLevel}
                    </Badge>
                  </td>

                  {/* Evidence Completeness */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    {getCompletenessBadge(rec.evidenceCompleteness)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <Button
                      variant={isSelected ? 'primary' : 'ghost'}
                      size="xs"
                      icon={Eye}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComponent(rec.id);
                      }}
                    >
                      {isSelected ? 'Inspecting' : 'Inspect'}
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
