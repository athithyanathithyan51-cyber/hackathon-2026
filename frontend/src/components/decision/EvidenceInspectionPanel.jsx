import { 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Ticket
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function EvidenceInspectionPanel({
  record
}) {
  if (!record) return null;

  return (
    <Card
      title={`Evidence Traceability & Provenance: ${record.componentName}`}
      subtitle={`Detailed evidence trail connecting ${record.relatedRuleId} to code citations, incident logs, and missing data gaps`}
      badge={<Badge variant="purple">Audit Trail</Badge>}
    >
      <div className="space-y-4">
        {/* Source Citation & Boundary Card */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 font-mono">
                {record.file}
              </span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-mono text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded font-semibold">
                {record.lines}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Related Rule:</span>
            <span className="font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {record.relatedRuleId}
            </span>
          </div>
        </div>

        {/* 3 Columns: Supporting, Conflicting, Missing Evidence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
          {/* 1. Supporting Evidence */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
            <div className="flex items-center justify-between text-emerald-950 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Supporting Evidence ({record.supportingEvidence.length})
              </span>
              <Badge variant="success" size="xs">
                Observed
              </Badge>
            </div>
            {record.supportingEvidence.length > 0 ? (
              <div className="space-y-2">
                {record.supportingEvidence.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-white border border-emerald-200/80 space-y-1">
                    <div className="font-semibold text-slate-900 font-mono text-[11px] flex items-center justify-between">
                      <span>{ev.title}</span>
                      <span className="text-emerald-700">{ev.id}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{ev.source}</div>
                    <p className="text-[11px] text-slate-700 leading-snug">{ev.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-400 italic text-[11px]">
                No supporting evidence found.
              </div>
            )}
          </div>

          {/* 2. Conflicting Evidence */}
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
            <div className="flex items-center justify-between text-rose-950 font-semibold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Conflicting Evidence ({record.conflictingEvidence.length})
              </span>
              <Badge variant={record.conflictingEvidence.length > 0 ? 'danger' : 'neutral'} size="xs">
                {record.conflictingEvidence.length > 0 ? 'Contradiction' : 'None'}
              </Badge>
            </div>
            {record.conflictingEvidence.length > 0 ? (
              <div className="space-y-2">
                {record.conflictingEvidence.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-white border border-rose-200 space-y-1">
                    <div className="font-semibold text-slate-900 font-mono text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1 text-rose-700">
                        <Ticket className="w-3 h-3" />
                        {ev.id}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-50 px-1 rounded">
                        Incident
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{ev.source}</div>
                    <p className="text-[11px] text-slate-700 leading-snug font-normal">
                      "{ev.detail}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-400 italic text-[11px]">
                No conflicting evidence detected.
              </div>
            )}
          </div>

          {/* 3. Missing Evidence */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
            <div className="flex items-center justify-between text-amber-950 font-semibold">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                Missing Information ({record.missingEvidence.length})
              </span>
              <Badge variant={record.missingEvidence.length > 0 ? 'warning' : 'success'} size="xs">
                {record.missingEvidence.length > 0 ? 'Gaps Present' : 'Complete'}
              </Badge>
            </div>
            {record.missingEvidence.length > 0 ? (
              <div className="space-y-2">
                {record.missingEvidence.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-white border border-amber-200 space-y-1">
                    <div className="font-semibold text-slate-900 text-[11px] flex items-center justify-between">
                      <span>{ev.title}</span>
                      <span className="font-mono text-amber-700 text-[10px]">{ev.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{ev.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-400 italic text-[11px]">
                No critical evidence gaps flagged.
              </div>
            )}
          </div>
        </div>

        {/* Governance Principle Banner */}
        <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-2">
          <span>
            <strong>Governance Standard:</strong> Missing evidence is explicitly separated from confirmed absence. Unverified assumptions are never treated as facts.
          </span>
          <span className="font-mono text-slate-500 shrink-0">
            Rule Provenance: {record.isDisputed ? 'CONFLICT_DISPUTED' : 'CODE_GROUNDED'}
          </span>
        </div>
      </div>
    </Card>
  );
}
