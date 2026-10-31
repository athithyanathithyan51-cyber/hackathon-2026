import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Bookmark, 
  HelpCircle 
} from 'lucide-react';

export default function DecisionOverviewCards({
  metrics,
  activeFilter = 'ALL',
  onSelectFilter
}) {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Assessed',
      count: metrics.totalAssessed,
      icon: Layers,
      color: 'blue',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      activeRing: 'ring-blue-500 border-blue-400'
    },
    {
      id: 'MODERNIZE',
      title: 'Ready to Modernize',
      count: metrics.readyToModernize,
      icon: CheckCircle2,
      color: 'emerald',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      activeRing: 'ring-emerald-500 border-emerald-400'
    },
    {
      id: 'REVIEW',
      title: 'Requires Human Review',
      count: metrics.requiresReview,
      icon: AlertTriangle,
      color: 'amber',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      activeRing: 'ring-amber-500 border-amber-400'
    },
    {
      id: 'KEEP',
      title: 'Keep Existing',
      count: metrics.keepExisting,
      icon: Bookmark,
      color: 'purple',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50 border-purple-200',
      activeRing: 'ring-purple-500 border-purple-400'
    },
    {
      id: 'INVESTIGATE',
      title: 'Insufficient Evidence',
      count: metrics.insufficientEvidence,
      icon: HelpCircle,
      color: 'rose',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50 border-rose-200',
      activeRing: 'ring-rose-500 border-rose-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeFilter === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectFilter(c.id)}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-xs ${
              isActive 
                ? `ring-2 ${c.activeRing} shadow-xs` 
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-md border ${c.bgColor} ${c.textColor} shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {c.count}
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              {isActive ? 'Filtered view active' : 'Click to filter'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
