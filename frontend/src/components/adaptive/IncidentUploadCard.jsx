import { useState } from 'react';
import { 
  Ticket, 
  Sparkles, 
  Plus, 
  Trash2, 
  Send
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function IncidentUploadCard({
  stagedIncident,
  onLoadDemoIncident,
  onRemoveIncident,
  onSubmitIncident,
  isSubmitted,
  onManualAdd
}) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualDesc.trim()) return;

    const customIncident = {
      id: manualId.trim() || `INC-${Math.floor(100 + Math.random() * 900)}`,
      title: manualDesc.slice(0, 48) + '...',
      description: manualDesc.trim(),
      reportedBy: 'QA & Compliance Audit',
      reportedDate: 'Just now (Simulated)',
      severity: 'High',
      channel: 'Manual Investigation Log',
      classification: 'CONFLICTING',
      targetFunction: 'calculate_penalty',
      targetRuleId: 'BR-001',
      status: 'Staged'
    };

    onManualAdd(customIncident);
    setManualId('');
    setManualDesc('');
    setShowManualForm(false);
  };

  return (
    <Card
      title="Production Incident & Change-Ticket Ingestion"
      subtitle="Ingest newly reported production incidents to challenge or enrich existing static code findings"
      badge={
        <Badge variant={isSubmitted ? 'success' : 'purple'} size="xs" dot={isSubmitted}>
          {isSubmitted ? 'Evidence Submitted' : 'Innovation 1: Adaptive Ingestion'}
        </Badge>
      }
      actions={
        <div className="flex items-center gap-2">
          {!stagedIncident && (
            <Button
              variant="subtle"
              size="xs"
              icon={Sparkles}
              onClick={onLoadDemoIncident}
            >
              Load Demo Incident (INC-101)
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            icon={Plus}
            onClick={() => setShowManualForm(!showManualForm)}
          >
            {showManualForm ? 'Cancel' : 'Add Custom'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Manual Input Form */}
        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Manual Incident / Evidence Entry
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Incident ID (e.g. INC-204)"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-500 bg-white"
              />
              <input
                type="text"
                placeholder="Incident Description / Defect details..."
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                size="xs"
                type="submit"
                disabled={!manualDesc.trim()}
              >
                Stage Incident
              </Button>
            </div>
          </form>
        )}

        {/* Staged Incident Card View */}
        {stagedIncident ? (
          <div className="p-4 sm:p-5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {stagedIncident.id}
                    </span>
                    <Badge variant="danger" size="xs">
                      {stagedIncident.severity} Severity
                    </Badge>
                    <Badge variant={isSubmitted ? 'success' : 'neutral'} size="xs">
                      {isSubmitted ? 'Indexed' : 'Staged (Local)'}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-0.5">
                    {stagedIncident.title}
                  </h4>
                </div>
              </div>

              {!isSubmitted && (
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    onClick={onRemoveIncident}
                    title="Remove staged incident"
                  >
                    Remove
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    icon={Send}
                    onClick={onSubmitIncident}
                  >
                    Submit to Engine
                  </Button>
                </div>
              )}
            </div>

            {/* Description Quote */}
            <div className="p-3 rounded-lg bg-white border border-blue-100/80 text-xs text-slate-700 font-normal leading-relaxed">
              <span className="font-semibold text-slate-900">Reported Problem: </span>
              "{stagedIncident.description}"
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <span>Reported by: <strong className="text-slate-700">{stagedIncident.reportedBy}</strong></span>
              <span>Channel: <strong className="text-slate-700">{stagedIncident.channel}</strong></span>
              <span className="font-mono text-slate-400">{stagedIncident.reportedDate}</span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
            <Ticket className="w-7 h-7 text-slate-300 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">
              No new evidence items staged
            </div>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Simulate an incoming production issue by clicking <strong>Load Demo Incident (INC-101)</strong> or typing a custom defect log.
            </p>
            <div className="pt-2">
              <Button
                variant="subtle"
                size="xs"
                icon={Sparkles}
                onClick={onLoadDemoIncident}
              >
                Load Demonstration Incident (INC-101)
              </Button>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 italic">
          * Demonstration notice: Ingested incidents are handled locally within this browser session and do not interact with live ticketing backends.
        </div>
      </div>
    </Card>
  );
}
