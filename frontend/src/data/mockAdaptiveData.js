export const DEMO_INCIDENT_INC101 = {
  id: 'INC-101',
  title: 'Payment Extension Customers Charged Minimum Balance Penalty',
  description: 'Customers with an approved payment extension should be exempt from the minimum balance penalty. The application appears to charge these customers incorrectly.',
  reportedBy: 'Operations & Billing Support',
  reportedDate: '2026-10-31 09:15 (Simulated)',
  severity: 'High',
  channel: 'Customer Dispute Stream',
  classification: 'CONFLICTING',
  targetFunction: 'calculate_penalty',
  targetRuleId: 'BR-001',
  status: 'Staged'
};

export const EVIDENCE_ASSOCIATION = {
  evidenceId: 'INC-101',
  matchedFunction: 'calculate_penalty',
  matchedRuleId: 'BR-001',
  matchedRuleName: 'Minimum Balance Penalty Rule',
  sourceFile: 'penalty_engine.py',
  lineReference: 'Lines 2–4',
  relationship: 'CONFLICTING / MISSING CONDITION',
  relationshipType: 'conflicting', // 'supporting' | 'conflicting' | 'new_info' | 'requires_validation'
  reason: 'Source code unconditionally returns 50 when balance < 1000 without inspecting approved extension flags or waiver attributes.',
  confidenceImpact: 'Confidence downgraded from 94% (Observed) to 64% (Contradicted by incident evidence)',
  uncertaintyFlag: 'Exemption policy is documented in ticket INC-101 but completely absent from legacy implementation.'
};

export const V1_BASELINE_FINDING = {
  version: 'v1.0 (Initial Ingestion)',
  timestamp: '2026-10-31 08:30 (Simulated)',
  ruleId: 'BR-001',
  businessUnderstanding: 'Accounts with balances below ₹1,000 receive a ₹50 penalty.',
  evidenceSources: ['Static AST Code Extraction (penalty_engine.py: L2–L4)'],
  evidenceCount: 1,
  confidence: 'High (94%)',
  confidenceScore: 0.94,
  confidenceLabel: 'Observed in Code',
  riskLevel: 'Medium Risk',
  riskVariant: 'amber',
  riskExplanation: 'Standard deterministic deduction based on balance threshold.',
  status: 'CONFIDENT',
  statusVariant: 'success',
  recommendation: 'Review existing behavior for direct containerization or microservice extraction.',
  approvalNeeded: false
};

export const V2_REASSESSED_FINDING = {
  version: 'v2.0 (Adaptive Reassessment)',
  timestamp: 'Just now (Simulated)',
  ruleId: 'BR-001',
  businessUnderstanding: 'Potential exemption identified: Customers with approved payment extensions must be exempted from ₹50 penalty.',
  evidenceSources: [
    'Static AST Code Extraction (penalty_engine.py: L2–L4)',
    'Production Incident Ingestion (INC-101: Billing Dispute)'
  ],
  evidenceCount: 2,
  confidence: 'Requires Validation (64%)',
  confidenceScore: 0.64,
  confidenceLabel: 'Conflicting Evidence Detected',
  riskLevel: 'High Risk (Disputed Behavior)',
  riskVariant: 'danger',
  riskExplanation: 'Code-level implementation diverges from production operational expectations. Modernizing as-is will replicate incorrect penalty deductions.',
  status: 'REQUIRES VALIDATION',
  statusVariant: 'warning',
  recommendation: 'Investigate payment extension policy with domain owners before modification. Do not automate refactoring until exemption contract is specified.',
  approvalNeeded: true
};

export const COMPARISON_FIELDS = [
  {
    field: 'Business Understanding',
    v1: 'Accounts with balances below ₹1,000 receive a ₹50 penalty without exception.',
    v2: 'Potential exemption identified: Customers with approved payment extensions should be exempt from penalty.',
    changed: true,
    changeType: 'refinement'
  },
  {
    field: 'Supporting Evidence',
    v1: 'Source Code AST only (penalty_engine.py Lines 2–4)',
    v2: 'Source Code AST + Production Incident INC-101',
    changed: true,
    changeType: 'expanded'
  },
  {
    field: 'Confidence Level',
    v1: 'High (94%) • Observed in Code',
    v2: 'Requires Validation (64%) • Contradictory Evidence',
    changed: true,
    changeType: 'downgraded'
  },
  {
    field: 'Risk Classification',
    v1: 'Medium Risk (Deterministic transaction fee)',
    v2: 'High Risk (Active production dispute & policy divergence)',
    changed: true,
    changeType: 'elevated'
  },
  {
    field: 'Modernization Verdict',
    v1: 'Review & Containerize existing behavior',
    v2: 'Investigate exemption policy before refactoring; halt blind migration',
    changed: true,
    changeType: 'pivoted'
  }
];

export const INITIAL_TIMELINE_EVENTS = [
  {
    id: 'tl-1',
    timestamp: '10:30:00 (Simulated)',
    title: 'Initial Source-Code Ingestion',
    category: 'Ingestion',
    description: 'Ingested penalty_engine.py (16 LOC). Parsed AST nodes and isolated 3 executable functions.',
    badge: 'v1.0 Baseline',
    badgeVariant: 'neutral',
    linkedId: 'penalty_engine.py'
  },
  {
    id: 'tl-2',
    timestamp: '10:30:15 (Simulated)',
    title: 'Business-Rule Discovery (BR-001, BR-002, BR-003)',
    category: 'Analysis',
    description: 'Extracted rule BR-001 (₹50 penalty for balance < 1000) with 94% initial confidence.',
    badge: '3 Rules Found',
    badgeVariant: 'info',
    linkedId: 'BR-001'
  }
];

export const REASSESSMENT_TIMELINE_EVENTS = [
  {
    id: 'tl-3',
    timestamp: '10:32:00 (Simulated)',
    title: 'Incident Evidence Ingestion (INC-101)',
    category: 'Evidence',
    description: 'Ingested billing dispute INC-101 describing payment extension penalty exemption.',
    badge: 'INC-101',
    badgeVariant: 'purple',
    linkedId: 'INC-101'
  },
  {
    id: 'tl-4',
    timestamp: '10:32:10 (Simulated)',
    title: 'Evidence Associated with calculate_penalty()',
    category: 'Correlation',
    description: 'Engine linked INC-101 to Rule BR-001. Flagged missing condition for extension flag check.',
    badge: 'Conflicting Evidence',
    badgeVariant: 'warning',
    linkedId: 'calculate_penalty'
  },
  {
    id: 'tl-5',
    timestamp: '10:32:25 (Simulated)',
    title: 'Adaptive Reassessment Triggered',
    category: 'Reassessment',
    description: 'Recomputed certainty score for BR-001. Elevated modernization risk from Medium to High.',
    badge: 'Adaptive Engine',
    badgeVariant: 'info',
    linkedId: 'BR-001'
  },
  {
    id: 'tl-6',
    timestamp: '10:32:30 (Simulated)',
    title: 'Version 2.0 Snapshot Minted',
    category: 'Version Control',
    description: 'Generated immutable v2.0 analysis state preserving v1.0 baseline for audit comparison.',
    badge: 'v2.0 Active',
    badgeVariant: 'success',
    linkedId: 'v2.0-SNAPSHOT'
  }
];
