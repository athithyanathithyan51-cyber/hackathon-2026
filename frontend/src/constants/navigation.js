import { 
  LayoutDashboard, 
  FileCode2, 
  BrainCircuit, 
  ShieldCheck, 
  GitFork, 
  History 
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'System health, analyzed services, and modernization portfolio status',
    icon: LayoutDashboard,
    badge: 'v1.0'
  },
  {
    id: 'code-evidence',
    label: 'Code & Evidence',
    description: 'Legacy source ingestion, AST symbol extraction, and line-level citations',
    icon: FileCode2,
    badge: 'Core'
  },
  {
    id: 'adaptive-intelligence',
    label: 'Adaptive Intelligence',
    description: 'Dynamic incident linking, contradictory evidence detection, and reassessment',
    icon: BrainCircuit,
    badge: 'Innovation 1',
    highlight: true
  },
  {
    id: 'decision-center',
    label: 'Decision Center',
    description: 'Evidence-gated verdicts (4R) and human-in-the-loop governance',
    icon: ShieldCheck,
    badge: 'Innovation 2',
    highlight: true
  },
  {
    id: 'impact-simulator',
    label: 'Impact Simulator',
    description: 'Blast radius calculation, database impact, and regression scenario generator',
    icon: GitFork,
    badge: 'Innovation 3',
    highlight: true
  },
  {
    id: 'analysis-history',
    label: 'Analysis History',
    description: 'Versioned decision snapshots, baseline audit logs, and provenance trail',
    icon: History
  }
];
