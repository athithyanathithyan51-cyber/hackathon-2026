import PlaceholderSection from '../common/PlaceholderSection';
import { GitFork } from 'lucide-react';

export default function ImpactSimulatorSection({ onNavigate }) {
  return (
    <PlaceholderSection
      sectionId="impact-simulator"
      phaseNumber={5}
      title="Modernization Impact & Blast Radius Simulator (Innovation 3)"
      subtitle="Interactive dependency graph and ripple simulator predicting which components, database tables, and rules are impacted before taking modernization actions."
      icon={GitFork}
      onNavigate={onNavigate}
      features={[
        {
          name: "Interactive Dependency Graph",
          tag: "Graph Visualization",
          description: "Visual dependency map linking callers, callees, database tables, and external API integrations."
        },
        {
          name: "4R Action Simulator",
          tag: "Impact Modeling",
          description: "Simulate the exact ripple effects of choosing Retain, Refactor, Replace, or Remove on any component."
        },
        {
          name: "Database Column & Schema Blast Radius",
          tag: "Data Integrity",
          description: "Trace which relational tables and foreign keys are touched if a calculation routine is replaced."
        },
        {
          name: "Regression Test Case Generator",
          tag: "Quality Assurance",
          description: "Auto-generate characterization test cases and boundary scenarios based on extracted evidence."
        }
      ]}
    />
  );
}
