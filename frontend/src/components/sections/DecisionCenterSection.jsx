import PlaceholderSection from '../common/PlaceholderSection';
import { ShieldCheck } from 'lucide-react';

export default function DecisionCenterSection({ onNavigate }) {
  return (
    <PlaceholderSection
      sectionId="decision-center"
      phaseNumber={4}
      title="Evidence-Gated Decision Center (Innovation 2)"
      subtitle="Govern modernization recommendations with verifiable citations. Distinguish observed code behavior from documented policies, and enforce human approval sign-offs."
      icon={ShieldCheck}
      onNavigate={onNavigate}
      features={[
        {
          name: "Evidence Provenance Classification",
          tag: "Provenance",
          description: "Distinguish between OBSERVED (found in code), DOCUMENTED (found in tickets), and HUMAN_APPROVED."
        },
        {
          name: "Explicit Uncertainty & Missing Evidence Flags",
          tag: "Hallucination Defense",
          description: "Clearly mark unverified assumptions and distinguish missing evidence from confirmed absence."
        },
        {
          name: "Modernization Verdicts (4R)",
          tag: "Verdict Engine",
          description: "Clear recommendations (Retain, Refactor, Replace, Remove) strictly grounded in cited evidence."
        },
        {
          name: "Human-in-the-Loop Approval Sign-off",
          tag: "Governance Gate",
          description: "Interactive approval flow allowing architects to confirm or reject consequential recommendations."
        }
      ]}
    />
  );
}
