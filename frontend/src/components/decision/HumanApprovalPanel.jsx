import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock 
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

const REVIEWERS = [
  'Nishanth (Lead Architect)',
  'Athithyan (Backend Lead)',
  'Nagukan (Data/AI Engineer)',
  'Security & Compliance Officer'
];

export default function HumanApprovalPanel({
  record,
  onRecordApproval
}) {
  const [selectedReviewer, setSelectedReviewer] = useState(REVIEWERS[0]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!record) return null;

  const handleAction = (decisionType) => {
    setIsSubmitting(true);
    setSuccessMsg(null);

    const actionData = {
      id: `appr-${Date.now()}`,
      reviewer: selectedReviewer,
      decision: decisionType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Session)',
      comment: comment.trim() || `Recorded ${decisionType} decision with standard evidence review.`
    };

    setTimeout(() => {
      onRecordApproval(record.id, actionData);
      setIsSubmitting(false);
      setComment('');
      setSuccessMsg(`Decision "${decisionType}" recorded successfully by ${selectedReviewer}.`);
    }, 400);
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'APPROVED':
      case 'APPROVED_FOR_MIGRATION':
      case 'APPROVED_FOR_RETENTION':
        return <Badge variant="success" size="xs">APPROVED</Badge>;
      case 'REJECTED':
      case 'BLOCKED':
        return <Badge variant="danger" size="xs">REJECTED / BLOCKED</Badge>;
      case 'REVIEW_REQUESTED':
      case 'REQUEST_EVIDENCE':
        return <Badge variant="warning" size="xs">EVIDENCE REQUESTED</Badge>;
      default:
        return <Badge variant="neutral" size="xs">{decision}</Badge>;
    }
  };

  return (
    <Card
      title="Human-in-the-Loop Governance & Sign-off Gate"
      subtitle="Consequential modernization verdicts require explicit human architect review and immutable sign-off"
      badge={
        <Badge variant={record.approvalStatus.includes('APPROVED') ? 'success' : 'warning'} size="xs" dot>
          Status: {record.approvalStatus}
        </Badge>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Interactive Sign-off Form */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 block">
                Record Review Decision for {record.componentName}
              </span>
              <p className="text-[11px] text-slate-500">
                Choose a reviewer persona, enter validation notes, and record the governance verdict.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[11px] text-slate-500 font-medium">Reviewer:</label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-blue-500"
              >
                {REVIEWERS.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            rows="2"
            placeholder="Add architect review notes (e.g., 'Validated payment extension waiver policy with business owners...')"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-500 bg-white placeholder:text-slate-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[10px] text-slate-400">
              * Governance sign-offs are logged into the session audit history.
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="xs"
                icon={XCircle}
                onClick={() => handleAction('REJECTED')}
                disabled={isSubmitting}
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                size="xs"
                icon={HelpCircle}
                onClick={() => handleAction('REQUEST_EVIDENCE')}
                disabled={isSubmitting}
              >
                Request More Evidence
              </Button>
              <Button
                variant="primary"
                size="xs"
                icon={CheckCircle2}
                onClick={() => handleAction('APPROVED')}
                disabled={isSubmitting}
              >
                Approve Verdict
              </Button>
            </div>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Audit History Log */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Approval History Log ({record.approvalHistory.length})
          </span>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden">
            {record.approvalHistory.map((item, idx) => (
              <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{item.reviewer}</span>
                    {getDecisionBadge(item.decision)}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    "{item.comment}"
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono shrink-0">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
