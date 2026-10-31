import { 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function EvidenceSufficiencyCard({
  record
}) {
  if (!record) return null;

  const getSufficiencyConfig = (completeness) => {
    if (completeness.includes('Conflicting')) {
      return {
        label: 'Conflicting Evidence',
        status: 'Blocked by Contradiction',
        variant: 'danger',
        icon: AlertTriangle,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50 border-rose-200',
        explanation: 'Contradictory evidence (incident INC-101) directly disputes the observed code logic. Modernization is safely blocked until the policy contract is resolved.'
      };
    }
    if (completeness.includes('Sufficient')) {
      return {
        label: 'Sufficient Evidence',
        status: 'Evidence-Gated & Verified',
        variant: 'success',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 border-emerald-200',
        explanation: 'Code AST, boundary conditions, and dependencies are fully mapped with zero conflicting evidence items.'
      };
    }
    if (completeness.includes('Partial')) {
      return {
        label: 'Partial Evidence',
        status: 'Conditional Gate Active',
        variant: 'warning',
        icon: ShieldAlert,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        explanation: 'Core code AST is available, but secondary requirements (e.g. database schema, idempotency, downstream callers) are unverified.'
      };
    }
    return {
      label: 'Insufficient Evidence',
      status: 'Blocked by Missing Evidence',
      variant: 'danger',
      icon: HelpCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-200',
      explanation: 'Critical source code or implementation specifications are absent from the ingested workspace. Decisions cannot be reached.'
    };
  };

  const config = getSufficiencyConfig(record.evidenceCompleteness);
  const Icon = config.icon;

  return (
    <Card
      title="Evidence Sufficiency & Readiness Meter"
      subtitle="Evaluates whether the collected evidence satisfies the threshold for safe modernization"
      badge={<Badge variant={config.variant} size="xs" dot>{config.label}</Badge>}
    >
      <div className="space-y-3 text-xs">
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${config.bgColor}`}>
          <div className={`p-2 rounded-lg bg-white border shrink-0 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">
                Sufficiency Evaluation: {config.status}
              </span>
              <Badge variant={config.variant} size="xs">
                Score: {(record.confidenceScore * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {config.explanation}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500">
          <strong>Key Governance Principle:</strong> LegacyIQ distinguishes <em>missing evidence</em> from <em>confirmed absence</em>. A missing condition does not prove a requirement never existed; it triggers an investigation gate.
        </div>
      </div>
    </Card>
  );
}
