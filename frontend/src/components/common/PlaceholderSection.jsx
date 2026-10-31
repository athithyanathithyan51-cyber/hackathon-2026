import Card from './Card';
import Badge from './Badge';
import { Clock } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/navigation';

export default function PlaceholderSection({
  sectionId,
  phaseNumber,
  title,
  subtitle,
  icon: Icon,
  features = []
}) {
  const navItem = NAV_SECTIONS.find(item => item.id === sectionId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm">
                Scheduled for Phase {phaseNumber}
              </Badge>
              {navItem?.highlight && (
                <Badge variant="info" size="sm">
                  {navItem.badge}
                </Badge>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {Icon && <Icon className="w-7 h-7 text-blue-400 shrink-0" />}
              {title}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono text-blue-200 border border-white/10">
              <Clock className="w-3.5 h-3.5" />
              Phase 1 Scaffolding Ready
            </span>
          </div>
        </div>
      </div>

      {/* Feature Architecture Matrix */}
      <Card
        title="Upcoming Module Specifications"
        subtitle={`Scope defined for Phase ${phaseNumber} execution`}
        badge={<Badge variant="neutral">Architecture Specification</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {feature.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {feature.tag}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
