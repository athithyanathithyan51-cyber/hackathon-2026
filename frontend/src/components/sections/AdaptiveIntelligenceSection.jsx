import { useState } from 'react';
import AdaptiveContextBar from '../adaptive/AdaptiveContextBar';
import IncidentUploadCard from '../adaptive/IncidentUploadCard';
import EvidenceAssociationCard from '../adaptive/EvidenceAssociationCard';
import ReassessmentPanel from '../adaptive/ReassessmentPanel';
import VersionComparisonTable from '../adaptive/VersionComparisonTable';
import EvidenceTimeline from '../adaptive/EvidenceTimeline';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';
import { 
  DEMO_INCIDENT_INC101, 
  INITIAL_TIMELINE_EVENTS, 
  REASSESSMENT_TIMELINE_EVENTS 
} from '../../data/mockAdaptiveData';

export default function AdaptiveIntelligenceSection({
  isReassessed = false,
  setIsReassessed,
  stagedIncident,
  setStagedIncident,
  onNavigate
}) {
  const [isSubmitted, setIsSubmitted] = useState(Boolean(stagedIncident));
  const [isReassessing, setIsReassessing] = useState(false);
  const [reassessProgress, setReassessProgress] = useState(0);
  const [reassessStep, setReassessStep] = useState('');

  // Dynamically constructed timeline based on user progression
  const getTimelineEvents = () => {
    let events = [...INITIAL_TIMELINE_EVENTS];
    if (isSubmitted && stagedIncident) {
      events.push(REASSESSMENT_TIMELINE_EVENTS[0]); // INC-101 ingested
      events.push(REASSESSMENT_TIMELINE_EVENTS[1]); // Associated with calculate_penalty
    }
    if (isReassessed) {
      events.push(REASSESSMENT_TIMELINE_EVENTS[2]); // Reassessment triggered
      events.push(REASSESSMENT_TIMELINE_EVENTS[3]); // v2.0 Minted
    }
    return events;
  };

  const handleLoadDemoIncident = () => {
    setStagedIncident(DEMO_INCIDENT_INC101);
    setIsSubmitted(false);
    setIsReassessed(false);
  };

  const handleManualAdd = (customIncident) => {
    setStagedIncident(customIncident);
    setIsSubmitted(false);
    setIsReassessed(false);
  };

  const handleRemoveIncident = () => {
    setStagedIncident(null);
    setIsSubmitted(false);
    setIsReassessed(false);
  };

  const handleSubmitIncident = () => {
    setIsSubmitted(true);
  };

  const handleTriggerReassessment = () => {
    setIsReassessing(true);
    setReassessProgress(15);
    setReassessStep('1/4 Analyzing semantic divergence between INC-101 and calculate_penalty()...');

    setTimeout(() => {
      setReassessProgress(45);
      setReassessStep('2/4 Adjusting rule confidence: Downgrading BR-001 from 94% to 64%...');
    }, 400);

    setTimeout(() => {
      setReassessProgress(75);
      setReassessStep('3/4 Re-scoring risk: Elevating modernization risk to High (Active Billing Dispute)...');
    }, 850);

    setTimeout(() => {
      setReassessProgress(100);
      setReassessStep('4/4 Minting immutable v2.0 analysis snapshot while preserving v1.0 baseline...');
    }, 1250);

    setTimeout(() => {
      setIsReassessing(false);
      setIsReassessed(true);
    }, 1550);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Innovation 1: Adaptive Intelligence
            </span>
            <Badge variant={isReassessed ? 'success' : isSubmitted ? 'warning' : 'purple'} size="xs" dot={isReassessed}>
              {isReassessed ? 'Version v2.0 Minted' : isSubmitted ? 'Evidence Correlated' : 'Awaiting New Evidence'}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-indigo-400 shrink-0" />
            Adaptive Evidence Intelligence
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            LegacyIQ continuously updates previous findings as real-world evidence arrives. Ingest production tickets, detect contradictory business rules, recalculate risk ratings, and preserve full version history.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {!stagedIncident && (
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={handleLoadDemoIncident}
            >
              Load Incident INC-101
            </Button>
          )}
          {isReassessed && (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onNavigate('code-evidence')}
            >
              View Updated Rules
            </Button>
          )}
        </div>
      </div>

      {/* Area A: Current Analysis Context Bar */}
      <AdaptiveContextBar
        currentVersion={isReassessed ? 'v2.0 (Reassessed)' : 'v1.0 (Baseline)'}
        evidenceCount={isSubmitted ? 2 : 1}
        rulesCount={3}
        status={isReassessed ? 'v2.0 Adaptive Reassessment Grounded' : isSubmitted ? 'Incident Linked Pending Reassessment' : 'v1.0 Static AST Grounded'}
        isReassessed={isReassessed}
      />

      {/* Area B: Incident Ingestion Card */}
      <IncidentUploadCard
        stagedIncident={stagedIncident}
        onLoadDemoIncident={handleLoadDemoIncident}
        onRemoveIncident={handleRemoveIncident}
        onSubmitIncident={handleSubmitIncident}
        isSubmitted={isSubmitted}
        onManualAdd={handleManualAdd}
      />

      {/* Area C & D: Evidence Association & Classification */}
      {isSubmitted && stagedIncident && (
        <EvidenceAssociationCard
          incident={stagedIncident}
        />
      )}

      {/* Area E: Adaptive Reassessment Trigger & State */}
      {isSubmitted && (
        <ReassessmentPanel
          isReassessing={isReassessing}
          reassessProgress={reassessProgress}
          reassessStep={reassessStep}
          isReassessed={isReassessed}
          onTriggerReassessment={handleTriggerReassessment}
          canReassess={isSubmitted && !isReassessing}
        />
      )}

      {/* Area F: Version Comparison Table (v1.0 vs v2.0) */}
      {isReassessed && (
        <VersionComparisonTable
          isReassessed={isReassessed}
        />
      )}

      {/* Area G: Evidence Timeline */}
      <EvidenceTimeline
        events={getTimelineEvents()}
      />
    </div>
  );
}
