import { useState, useMemo } from 'react';
import DecisionOverviewCards from '../decision/DecisionOverviewCards';
import DecisionVerdictTable from '../decision/DecisionVerdictTable';
import EvidenceInspectionPanel from '../decision/EvidenceInspectionPanel';
import EvidenceSufficiencyCard from '../decision/EvidenceSufficiencyCard';
import HumanApprovalPanel from '../decision/HumanApprovalPanel';
import DecisionExplanation from '../decision/DecisionExplanation';
import ModernizationStrategyPanel from '../decision/ModernizationStrategyPanel';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle
} from 'lucide-react';
import { 
  getDecisionRecords, 
  getDecisionMetrics 
} from '../../data/mockDecisionData';

export default function DecisionCenterSection({
  isReassessed = false,
  onNavigate
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState('DEC-001');
  const [approvalOverrides, setApprovalOverrides] = useState({});

  // Compute records dynamically based on Phase 3 adaptive reassessment state and user approval actions
  const decisionRecords = useMemo(() => {
    const baseRecords = getDecisionRecords(isReassessed);
    return baseRecords.map(rec => {
      if (approvalOverrides[rec.id]) {
        return { ...rec, ...approvalOverrides[rec.id] };
      }
      return rec;
    });
  }, [isReassessed, approvalOverrides]);

  const metrics = getDecisionMetrics(decisionRecords);

  const filteredRecords = activeFilter === 'ALL'
    ? decisionRecords
    : decisionRecords.filter(r => r.verdict === activeFilter);

  const selectedRecord = decisionRecords.find(r => r.id === selectedId) || decisionRecords[0];

  const handleRecordApproval = (componentId, actionData) => {
    const currentRec = decisionRecords.find(r => r.id === componentId);
    const existingHistory = currentRec?.approvalHistory || [];

    const newStatus = actionData.decision === 'APPROVED' 
      ? 'APPROVED_BY_HUMAN' 
      : actionData.decision === 'REJECTED'
      ? 'REJECTED_BY_HUMAN'
      : 'EVIDENCE_REQUESTED';

    setApprovalOverrides(prev => ({
      ...prev,
      [componentId]: {
        approvalStatus: newStatus,
        approvalHistory: [actionData, ...existingHistory]
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Innovation 2: Evidence-Gated Decisions
            </span>
            <Badge variant={isReassessed ? 'warning' : 'success'} size="xs" dot>
              {isReassessed ? 'Adaptive Governance Active' : 'Baseline Governance Active'}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            Evidence-Gated Modernization Decision Center
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Eliminates reckless automated modernization by requiring verifiable evidence citations for every verdict. Distinguish observed code facts from hypotheses, flag missing evidence gaps, and enforce human architect sign-off gates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('impact-regression')}
          >
            Preview Blast Radius
          </Button>
        </div>
      </div>

      {/* Disputed Rule Notice if Phase 3 Reassessment is active */}
      {isReassessed && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-950">
                Adaptive Reassessment Synchronization Active (v2.0)
              </span>
              <p className="text-amber-900 text-[11px] mt-0.5">
                Paragraph <strong>2100-CALCULATE-PENALTY</strong> (BR-001) has been downgraded to <strong>REVIEW REQUIRED</strong> due to production dispute INC-101. Automated refactoring to Java 21 is locked.
              </p>
            </div>
          </div>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setSelectedId('DEC-001')}
          >
            Inspect 2100-CALCULATE-PENALTY
          </Button>
        </div>
      )}

      {/* Section A: Decision Overview Cards */}
      <DecisionOverviewCards
        metrics={metrics}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* Section B: Evidence-Gated Verdicts Table */}
      <DecisionVerdictTable
        records={filteredRecords}
        selectedId={selectedId}
        onSelectComponent={setSelectedId}
      />

      {/* Section C & D: Evidence Explanation & Sufficiency Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
          <DecisionExplanation
            record={selectedRecord}
          />
        </div>

        <div className="lg:col-span-5 space-y-5">
          <EvidenceSufficiencyCard
            record={selectedRecord}
          />
        </div>
      </div>

      {/* Section E: Evidence Inspection Panel */}
      <EvidenceInspectionPanel
        record={selectedRecord}
      />

      {/* Section F: Human Approval Workflow */}
      <HumanApprovalPanel
        record={selectedRecord}
        onRecordApproval={handleRecordApproval}
      />

      {/* Section G: 4R Modernization Strategy Options */}
      <ModernizationStrategyPanel
        selectedRecord={selectedRecord}
      />
    </div>
  );
}
