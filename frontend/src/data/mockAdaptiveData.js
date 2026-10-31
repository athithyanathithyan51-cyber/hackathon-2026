export const DEMO_INCIDENT_INC101 = {
  id: 'INC-101',
  title: 'Payment Extension Customers Charged Minimum Balance Penalty',
  description: 'Customers with an approved payment extension (WS-PAYMENT-EXT-FLAG = "Y") should be exempt from the minimum balance penalty. Paragraph 2100-CALCULATE-PENALTY appears to charge these customers unconditionally.',
  reportedBy: 'Operations & Billing Support',
  reportedDate: '2026-10-31 09:15 (Simulated)',
  severity: 'High',
  channel: 'Customer Dispute Stream',
  classification: 'CONFLICTING',
  targetFunction: '2100-CALCULATE-PENALTY',
  targetRuleId: 'BR-001',
  status: 'Staged'
};

export const EVIDENCE_ASSOCIATION = {
  evidenceId: 'INC-101',
  matchedFunction: '2100-CALCULATE-PENALTY',
  matchedRuleId: 'BR-001',
  matchedRuleName: 'Minimum Balance Penalty Rule',
  sourceFile: 'PENALTY.cbl',
  lineReference: 'Lines 37–44',
  relationship: 'CONFLICTING / MISSING CONDITION',
  relationshipType: 'conflicting', // 'supporting' | 'conflicting' | 'new_info' | 'requires_validation'
  reason: 'COBOL paragraph 2100-CALCULATE-PENALTY unconditionally executes MOVE 50.00 TO WS-PENALTY when WS-BALANCE < 1000.00, omitting inspection of WS-PAYMENT-EXT-FLAG defined in copybook ACCTREC.cpy.',
  confidenceImpact: 'Confidence downgraded from 94% (Observed in Code) to 64% (Contradicted by incident evidence)',
  uncertaintyFlag: 'Exemption policy is documented in ticket INC-101 but completely omitted in legacy COBOL PROCEDURE DIVISION.'
};

export const V1_BASELINE_FINDING = {
  version: 'v1.0 (Initial Ingestion)',
  timestamp: '2026-10-31 08:30 (Simulated)',
  ruleId: 'BR-001',
  businessUnderstanding: 'Deposit accounts with balances below ₹1,000 receive an unconditional ₹50 penalty.',
  evidenceSources: ['Static COBOL AST Extraction (PENALTY.cbl: L37–L44)'],
  evidenceCount: 1,
  confidence: 'High (94%)',
  confidenceScore: 0.94,
  confidenceLabel: 'Observed in Code',
  riskLevel: 'Medium Risk',
  riskVariant: 'amber',
  riskExplanation: 'Standard deterministic deduction based on WS-BALANCE < WS-PENALTY-THRESHOLD.',
  status: 'CONFIDENT',
  statusVariant: 'success',
  recommendation: 'Target for refactoring to Java 21 Spring Boot service under baseline assumptions.',
  approvalNeeded: false
};

export const V2_REASSESSED_FINDING = {
  version: 'v2.0 (Adaptive Reassessment)',
  timestamp: 'Just now (Simulated)',
  ruleId: 'BR-001',
  businessUnderstanding: 'Potential exemption identified: Customers with approved payment extensions (WS-PAYMENT-EXT-FLAG = "Y") must be exempted from ₹50 penalty.',
  evidenceSources: [
    'Static COBOL AST Extraction (PENALTY.cbl: L37–L44)',
    'Production Incident Ingestion (INC-101: Billing Dispute)'
  ],
  evidenceCount: 2,
  confidence: 'Requires Validation (64%)',
  confidenceScore: 0.64,
  confidenceLabel: 'Conflicting Evidence Detected',
  riskLevel: 'High Risk (Disputed Behavior)',
  riskVariant: 'danger',
  riskExplanation: 'COBOL implementation diverges from operational expectations. Modernizing as-is into Java 21 will replicate incorrect customer fee assessments.',
  status: 'REQUIRES VALIDATION',
  statusVariant: 'warning',
  recommendation: 'Investigate payment extension policy with domain owners before approving Java 21 migration. Halt blind automated code conversion.',
  approvalNeeded: true
};

export const COMPARISON_FIELDS = [
  {
    field: 'Business Understanding',
    v1: 'Accounts with balances below ₹1,000 receive a ₹50 penalty unconditionally (PENALTY.cbl L37–L44).',
    v2: 'Potential exemption identified: Customers with approved payment extensions (WS-PAYMENT-EXT-FLAG) must be exempt.',
    changed: true,
    changeType: 'refinement'
  },
  {
    field: 'Supporting Evidence',
    v1: 'COBOL AST Extraction only (PENALTY.cbl Lines 37–44)',
    v2: 'COBOL AST + Production Incident INC-101 + ACCTREC.cpy definition',
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
    v1: 'Medium Risk (Deterministic transaction deduction)',
    v2: 'High Risk (Active production dispute & policy divergence)',
    changed: true,
    changeType: 'elevated'
  },
  {
    field: 'Modernization Verdict',
    v1: 'Refactor to Java 21 PenaltyCalculationService under baseline specs',
    v2: 'Halt migration approval; investigate exemption contract with domain owners',
    changed: true,
    changeType: 'pivoted'
  }
];

export const INITIAL_TIMELINE_EVENTS = [
  {
    id: 'tl-1',
    timestamp: '10:30:00 (Simulated)',
    title: 'COBOL Program & Copybook Ingestion',
    category: 'Ingestion',
    description: 'Ingested PENALTY.cbl (44 LOC) and linked ACCTREC.cpy. Parsed AST paragraphs and WORKING-STORAGE fields.',
    badge: 'v1.0 Baseline',
    badgeVariant: 'neutral',
    linkedId: 'PENALTY.cbl'
  },
  {
    id: 'tl-2',
    timestamp: '10:30:15 (Simulated)',
    title: 'COBOL Business-Rule Discovery (BR-001, BR-002, BR-003)',
    category: 'Analysis',
    description: 'Extracted rule BR-001 from paragraph 2100-CALCULATE-PENALTY with 94% initial confidence.',
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
    description: 'Ingested billing dispute INC-101 reporting wrongful penalties on payment extension accounts.',
    badge: 'INC-101',
    badgeVariant: 'purple',
    linkedId: 'INC-101'
  },
  {
    id: 'tl-4',
    timestamp: '10:32:10 (Simulated)',
    title: 'Evidence Associated with 2100-CALCULATE-PENALTY',
    category: 'Correlation',
    description: 'Engine linked INC-101 to Rule BR-001. Flagged omission of WS-PAYMENT-EXT-FLAG check.',
    badge: 'Conflicting Evidence',
    badgeVariant: 'warning',
    linkedId: '2100-CALCULATE-PENALTY'
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
