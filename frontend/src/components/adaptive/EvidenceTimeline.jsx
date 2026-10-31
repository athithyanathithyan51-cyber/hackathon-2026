import { 
  FileCode2, 
  Layers, 
  Ticket, 
  GitMerge, 
  RefreshCw, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function EvidenceTimeline({
  events = []
}) {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Ingestion':
        return FileCode2;
      case 'Analysis':
        return Layers;
      case 'Evidence':
        return Ticket;
      case 'Correlation':
        return GitMerge;
      case 'Reassessment':
        return RefreshCw;
      case 'Version Control':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  return (
    <Card
      title="Evidence & Reassessment Timeline"
      subtitle="Chronological audit trail of ingested evidence, automated correlations, and versioned updates"
      badge={<Badge variant="neutral">Audit Trail</Badge>}
    >
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((evt) => {
          const Icon = getCategoryIcon(evt.category);

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-110 transition-transform">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              </div>

              {/* Event Content Box */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      {evt.title}
                    </span>
                    <Badge variant={evt.badgeVariant || 'neutral'} size="xs">
                      {evt.badge}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {evt.timestamp}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {evt.description}
                </p>

                <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                  <span>Category: {evt.category}</span>
                  <span>•</span>
                  <span>Artifact: {evt.linkedId}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 italic text-right">
        * Demonstration timestamps are simulated for illustrative auditability.
      </div>
    </Card>
  );
}
