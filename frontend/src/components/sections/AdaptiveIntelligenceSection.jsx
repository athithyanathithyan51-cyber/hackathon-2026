import PlaceholderSection from '../common/PlaceholderSection';
import { BrainCircuit } from 'lucide-react';

export default function AdaptiveIntelligenceSection({ onNavigate }) {
  return (
    <PlaceholderSection
      sectionId="adaptive-intelligence"
      phaseNumber={3}
      title="Adaptive Evidence Intelligence (Innovation 1)"
      subtitle="Ingest newly reported production incidents, tickets, and policy documents after initial analysis. Automatically reconcile conflicting evidence and update risk ratings."
      icon={BrainCircuit}
      onNavigate={onNavigate}
      features={[
        {
          name: "Post-Release Incident Ingestion",
          tag: "Incident Stream",
          description: "Ingest production tickets (e.g., Jira INC-8492) describing unhandled corner cases and customer disputes."
        },
        {
          name: "Conflict & Contradiction Detection",
          tag: "Evidence Engine",
          description: "Detect when newly uploaded evidence directly contradicts static code findings or documented rules."
        },
        {
          name: "Automated Finding Reassessment",
          tag: "Adaptive Scoring",
          description: "Transition findings from 'Confident' to 'Requires Validation' when conflicting evidence surfaces."
        },
        {
          name: "Versioned Analysis Comparison (v1 vs v2)",
          tag: "Snapshot Diff",
          description: "Side-by-side diff showing initial baseline findings versus revised findings after incident ingestion."
        }
      ]}
    />
  );
}
