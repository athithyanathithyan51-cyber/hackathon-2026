export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  accentColor = 'blue',
  className = ''
}) {
  const accentBgs = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const iconStyle = accentBgs[accentColor] || accentBgs.blue;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${iconStyle}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span className="text-xs font-medium text-slate-600">{badge}</span>
        )}
      </div>
      {subtext && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          {subtext}
        </div>
      )}
    </div>
  );
}
