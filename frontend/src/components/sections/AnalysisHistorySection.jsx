import PlaceholderSection from '../common/PlaceholderSection';
import { History } from 'lucide-react';

export default function AnalysisHistorySection({ onNavigate }) {
  return (
    <PlaceholderSection
      sectionId="analysis-history"
      phaseNumber={6}
      title="Analysis History & Decision Audit Trail"
      subtitle="Complete chronological timeline of all analysis runs, ingested evidence files, adaptive score adjustments, and human approval decisions."
      icon={History}
      onNavigate={onNavigate}
      features={[
        {
          name: "Versioned Decision Snapshots",
          tag: "Audit Trail",
          description: "Immutable version history capturing state at v1.0 (Baseline), v1.1 (Incident Ingested), and v2.0 (Approved)."
        },
        {
          name: "Evidence Provenance Timeline",
          tag: "Chronology",
          description: "Timestamped log of every file uploaded, rule tagged, conflict detected, and human override."
        },
        {
          name: "Compliance & Modernization Export",
          tag: "Reporting",
          description: "Export structured modern audit reports (JSON / Markdown / Executive PDF summary) for leadership."
        },
        {
          name: "Rollback & Scenario Comparison",
          tag: "Scenario Modeling",
          description: "Compare any two historical analysis checkpoints to understand why a decision or risk score shifted."
        }
      ]}
    />
  );
}
