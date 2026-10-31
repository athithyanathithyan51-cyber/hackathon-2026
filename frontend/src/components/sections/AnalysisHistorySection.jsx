import { 
  History, 
  ArrowRight, 
  Clock
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  INITIAL_TIMELINE_EVENTS, 
  REASSESSMENT_TIMELINE_EVENTS 
} from '../../data/mockAdaptiveData';
import { useProject } from '../../context/ProjectContext';
import { toTimelineEvents } from '../../data/liveAdapters';

export default function AnalysisHistorySection({
  isReassessed = false,
  onNavigate
}) {
  const { findings, historyMap, evidenceLog } = useProject();
  const timelineEvents = findings && findings.length > 0
    ? toTimelineEvents(findings, historyMap, evidenceLog)
    : [...INITIAL_TIMELINE_EVENTS, ...(isReassessed ? REASSESSMENT_TIMELINE_EVENTS : [])];

  const versions = [
    {
      id: 'v1.0',
      tag: 'v1.0 Baseline',
      title: 'Initial Static Code Ingestion',
      timestamp: '2026-10-31 08:30 (Simulated)',
      evidenceTypes: ['Static AST Code Extraction'],
      findingsCount: 3,
      confidence: '94%',
      risk: 'Medium',
      riskVariant: 'amber',
      status: 'Archived Baseline',
      statusVariant: 'neutral',
      summary: 'Deterministic COBOL AST analysis of PENALTY.cbl & ACCTREC.cpy. Extracted minimum-balance fee of ₹50 from paragraph 2100.'
    },
    ...(isReassessed ? [{
      id: 'v2.0',
      tag: 'v2.0 Active',
      title: 'Adaptive Incident Reassessment',
      timestamp: 'Just now (Simulated)',
      evidenceTypes: ['Static AST Code Extraction', 'Production Incident INC-101'],
      findingsCount: 3,
      disputedCount: 1,
      confidence: '64% (Disputed)',
      risk: 'High (Elevated)',
      riskVariant: 'danger',
      status: 'Current Active',
      statusVariant: 'success',
      summary: 'Correlated billing dispute INC-101 with Rule BR-001. Flagged omission of payment extension exemptions.'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Audit Trail & Governance
            </span>
            <Badge variant={isReassessed ? 'success' : 'purple'} size="xs" dot={isReassessed}>
              {isReassessed ? '2 Versions Minted' : '1 Baseline Version'}
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Analysis Version History & Provenance Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            LegacyIQ preserves every analysis run as an immutable snapshot. Track how findings, confidence scores, and risk classifications evolve over time as new evidence arrives.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('adaptive-intelligence')}
          >
            Adaptive Engine
          </Button>
        </div>
      </div>

      {/* Version Snapshots Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {versions.map((v) => (
          <Card
            key={v.id}
            title={v.title}
            subtitle={`Snapshot Timestamp: ${v.timestamp}`}
            badge={
              <Badge variant={v.statusVariant} size="xs" dot={v.id === (isReassessed ? 'v2.0' : 'v1.0')}>
                {v.status}
              </Badge>
            }
            actions={
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {v.tag}
              </span>
            }
          >
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {v.summary}
              </p>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Confidence
                  </span>
                  <span className="font-semibold text-slate-900">{v.confidence}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Risk Assessment
                  </span>
                  <Badge variant={v.riskVariant} size="xs">
                    {v.risk}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Evidence Sources:
                </span>
                <div className="space-y-1">
                  {v.evidenceTypes.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {e}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!isReassessed && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 space-y-2 text-xs">
            <Clock className="w-8 h-8 text-slate-300" />
            <div className="font-semibold text-slate-700">
              Awaiting Version 2.0 Reassessment
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Upload incident evidence in <strong>Adaptive Intelligence</strong> to trigger reassessment and mint the v2.0 snapshot.
            </p>
            <div className="pt-2">
              <Button
                variant="subtle"
                size="xs"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('adaptive-intelligence')}
              >
                Go to Adaptive Intelligence
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Full Audit Log */}
      <Card
        title="Chronological Provenance Log"
        subtitle="Detailed log of all file uploads, rule discoveries, incident links, and score adjustments"
        badge={<Badge variant="neutral">Audit Log</Badge>}
      >
        <div className="space-y-3">
          {timelineEvents.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center font-mono text-[10px] font-bold text-slate-600">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    {item.title}
                    <Badge variant={item.badgeVariant} size="xs">
                      {item.badge}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {item.timestamp}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
