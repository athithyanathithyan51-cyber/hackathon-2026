import { useState } from 'react';
import { 
  CheckCircle2
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { MODERNIZATION_STRATEGIES } from '../../data/mockDecisionData';

export default function ModernizationStrategyPanel({
  selectedRecord
}) {
  const [activeStrategyId, setActiveStrategyId] = useState(
    selectedRecord?.recommendedStrategy || 'REFACTOR'
  );

  const activeStrategy = MODERNIZATION_STRATEGIES.find(s => s.id === activeStrategyId) || MODERNIZATION_STRATEGIES[0];

  return (
    <Card
      title="4R Modernization Strategy Assessment"
      subtitle="Comprehensive architectural evaluation of Retain, Refactor, Replace, and Remove pathways"
      badge={<Badge variant="info">Strategy Evaluation</Badge>}
    >
      <div className="space-y-4 text-xs">
        {/* Strategy Selection Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MODERNIZATION_STRATEGIES.map((strat) => {
            const isSelected = activeStrategy.id === strat.id;
            const isRecommendedForRecord = selectedRecord?.recommendedStrategy === strat.id;

            return (
              <button
                key={strat.id}
                type="button"
                onClick={() => setActiveStrategyId(strat.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`font-bold font-mono text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {strat.id}
                  </span>
                  {isRecommendedForRecord && (
                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-white/20 text-blue-100' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Target
                    </span>
                  )}
                </div>
                <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {strat.tag}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Strategy Description Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeStrategy.name}
                </h4>
                <Badge variant={activeStrategy.badgeVariant} size="xs">
                  {activeStrategy.tag}
                </Badge>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {activeStrategy.description}
              </p>
            </div>
            {selectedRecord?.recommendedStrategy === activeStrategy.id && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Recommended for {selectedRecord.componentName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* When to use & Benefits */}
            <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 space-y-2">
              <div>
                <span className="font-semibold text-slate-900 block text-[11px]">
                  When to apply this strategy:
                </span>
                <p className="text-slate-600 text-[11px] leading-snug mt-0.5">
                  {activeStrategy.whenToUse}
                </p>
              </div>

              <div>
                <span className="font-semibold text-emerald-800 block text-[11px]">
                  Key Strategic Benefits:
                </span>
                <ul className="space-y-0.5 text-slate-600 text-[11px] list-disc list-inside mt-0.5">
                  {activeStrategy.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risks & Gating Evidence */}
            <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 space-y-2">
              <div>
                <span className="font-semibold text-rose-800 block text-[11px]">
                  Potential Modernization Risks:
                </span>
                <ul className="space-y-0.5 text-slate-600 text-[11px] list-disc list-inside mt-0.5">
                  {activeStrategy.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block text-[11px]">
                  Required Evidence for Gating:
                </span>
                <p className="text-slate-600 text-[11px] leading-snug mt-0.5 font-mono">
                  {activeStrategy.requiredEvidence}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
