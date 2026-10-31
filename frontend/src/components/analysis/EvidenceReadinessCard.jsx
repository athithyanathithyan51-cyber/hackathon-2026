import { FileCode2, Ticket, FileText, Database, ArrowRight } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function EvidenceReadinessCard() {
  const sources = [
    {
      name: 'Source Code AST',
      status: 'Active (Analyzed)',
      badgeVariant: 'success',
      icon: FileCode2,
      detail: 'Extracted 3 functions, 3 conditions, 100% line-grounded citations',
      phase: 'Phase 2 (Current)'
    },
    {
      name: 'Production Incidents & Tickets',
      status: 'Scheduled',
      badgeVariant: 'purple',
      icon: Ticket,
      detail: 'Jira tickets & incident logs for contradictory rule reassessment',
      phase: 'Phase 3 (Adaptive Intel)'
    },
    {
      name: 'Policy & Architecture Docs',
      status: 'Scheduled',
      badgeVariant: 'neutral',
      icon: FileText,
      detail: 'Documented requirements vs observed code divergence checks',
      phase: 'Phase 4 (Decision Gate)'
    },
    {
      name: 'Database SQL Schemas',
      status: 'Scheduled',
      badgeVariant: 'neutral',
      icon: Database,
      detail: 'Table DDL and foreign key ripple blast radius analysis',
      phase: 'Phase 5 (Impact Simulator)'
    }
  ];

  return (
    <Card
      title="Evidence Readiness & Multi-Source Maturity"
      subtitle="Initial analysis is strictly grounded in source-code AST. Subsequent phases enrich the evidence store."
      badge={<Badge variant="info">Multi-Evidence Architecture</Badge>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {sources.map((src, idx) => {
          const Icon = src.icon;
          const isActive = idx === 0;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200/80 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <Badge variant={src.badgeVariant} size="xs" dot={isActive}>
                  {src.status}
                </Badge>
              </div>

              <div className="font-semibold text-slate-900 mb-1">
                {src.name}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {src.detail}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] font-mono text-slate-400">
                {src.phase}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
