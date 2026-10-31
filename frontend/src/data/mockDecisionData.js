export const MODERNIZATION_STRATEGIES = [
  {
    id: 'RETAIN',
    name: 'Retain (Wrap & Encapsulate)',
    tag: 'Lowest Risk',
    badgeVariant: 'neutral',
    description: 'Keep the existing legacy component running in its current environment, exposing it through an API gateway, anti-corruption layer, or microservice facade.',
    whenToUse: 'Component is stable, highly complex, low defect rate, and source logic is well-understood but risky to re-write.',
    benefits: [
      'Zero migration downtime risk',
      'Preserves decades of undocumented business nuance',
      'Lowest immediate capital expenditure'
    ],
    risks: [
      'Accumulates technical debt over time',
      'Dependent on legacy runtimes or rare skill sets',
      'Scaling and cloud integration remain throttled'
    ],
    requiredEvidence: 'Stable runtime telemetry, verified integration endpoints, and documented SLA metrics.',
    requiresApproval: true
  },
  {
    id: 'REFACTOR',
    name: 'Refactor (Code Modernization)',
    tag: 'Standard Path',
    badgeVariant: 'info',
    description: 'Restructure and modernize internal component logic (e.g. migrate COBOL paragraphs to Java 21 + Spring Boot 3.x, adopt immutable records, hexagonal architecture) without altering external contracts.',
    whenToUse: 'Component business logic is confirmed, but code exhibits high cyclomatic complexity, outdated libraries, or poor test coverage.',
    benefits: [
      'Removes code-level technical debt',
      'Improves testability, maintainability, and observability',
      'Enables continuous deployment pipelines'
    ],
    risks: [
      'Regression risk if characterization test coverage is incomplete',
      'Potential edge-case divergence in numeric rounding or boundary checks'
    ],
    requiredEvidence: 'Full AST condition extraction, 100% line citations, and verified characterization test suite.',
    requiresApproval: true
  },
  {
    id: 'REPLACE',
    name: 'Replace (SaaS / Cloud-Native Rewrite)',
    tag: 'High Velocity',
    badgeVariant: 'purple',
    description: 'Substitute the legacy routine with a modern third-party SaaS platform, vendor package, or greenfield microservice.',
    whenToUse: 'Commodity capabilities (e.g. generic payment settlement, standard tax calculator) where custom maintenance is uneconomical.',
    benefits: [
      'Offloads ongoing maintenance and compliance overhead',
      'Instant access to modern cloud features and ecosystem plugins',
      'Fast-tracks technological leap'
    ],
    risks: [
      'Vendor lock-in and ongoing subscription costs',
      'Data mapping and schema transformation mismatches',
      'Loss of custom proprietary business exceptions'
    ],
    requiredEvidence: 'Complete input/output data schema mappings, exception taxonomy, and vendor compliance audit.',
    requiresApproval: true
  },
  {
    id: 'REMOVE',
    name: 'Remove (Safe Decommissioning)',
    tag: 'Debt Elimination',
    badgeVariant: 'danger',
    description: 'Safely decommission and purge unused, dead, or superseded legacy code branches and database artifacts.',
    whenToUse: 'Component has zero incoming callers, zero active telemetry invocations, and superseded by modern workflows.',
    benefits: [
      'Reduces maintenance surface area and cognitive load',
      'Eliminates latent security vulnerabilities in dead code',
      'Lowers operational footprint'
    ],
    risks: [
      'Accidental removal of dormant seasonal logic (e.g. annual fiscal year-end batch routines)',
      'Broken reflective or dynamic runtime invocations'
    ],
    requiredEvidence: 'Call graph verification showing 0 callers across all modules, plus 12-month zero-invocation audit trail.',
    requiresApproval: true
  }
];

export const getDecisionRecords = (isReassessed = false) => [
  {
    id: 'DEC-001',
    componentName: '2100-CALCULATE-PENALTY',
    file: 'PENALTY.cbl',
    lines: 'Lines 37–44',
    relatedRuleId: 'BR-001',
    relatedRuleName: 'Minimum Balance Penalty Assessment',
    category: 'Deposit Fee Calculation',
    targetJavaClass: 'com.bank.penalty.domain.service.PenaltyCalculationService',
    // Adaptive verdict depends on Phase 3 reassessment state
    verdict: isReassessed ? 'REVIEW' : 'MODERNIZE',
    verdictVariant: isReassessed ? 'warning' : 'success',
    riskLevel: isReassessed ? 'High' : 'Medium',
    riskVariant: isReassessed ? 'danger' : 'amber',
    confidenceScore: isReassessed ? 0.64 : 0.94,
    evidenceCompleteness: isReassessed ? 'Conflicting Evidence' : 'Sufficient (COBOL AST)',
    evidenceCompletenessVariant: isReassessed ? 'warning' : 'success',
    supportingCount: 1,
    conflictingCount: isReassessed ? 1 : 0,
    missingCount: isReassessed ? 1 : 0,
    supportingEvidence: [
      {
        id: 'EV-SRC-01',
        title: 'Static COBOL AST Conditional Extraction',
        source: 'PENALTY.cbl: L37–L44',
        type: 'OBSERVED CODE',
        detail: 'Paragraph unconditionally executes MOVE 50.00 TO WS-PENALTY when WS-BALANCE < 1000.00.'
      }
    ],
    conflictingEvidence: isReassessed ? [
      {
        id: 'INC-101',
        title: 'Production Incident Ingestion',
        source: 'Operations Dispute Log (INC-101)',
        type: 'DOCUMENTED TICKET',
        detail: 'Customers with approved payment extensions (WS-PAYMENT-EXT-FLAG = "Y") must be exempt. Legacy COBOL code omits checking this copybook field.'
      }
    ] : [],
    missingEvidence: isReassessed ? [
      {
        id: 'MISS-01',
        title: 'Payment Extension Business Policy Contract',
        description: 'Signed banking policy specification defining exact conditions, duration, and approval criteria for fee waiver extensions.'
      }
    ] : [],
    verdictReason: isReassessed
      ? 'Legacy COBOL paragraph 2100 enforces a ₹50 penalty below ₹1,000, but incident INC-101 reports approved payment extensions should be exempt. Migrating directly to Java 21 as-is will replicate improper customer penalty deductions.'
      : 'COBOL paragraph exhibits deterministic arithmetic logic with clear boundary conditions and zero external runtime dependencies. Suitable for Java 21 Spring Boot service refactoring under baseline specifications.',
    recommendedAction: isReassessed
      ? 'Validate the payment-extension exemption policy with retail banking domain owners. Do not approve automated refactoring or Java 21 migration until the policy conflict is resolved.'
      : 'Proceed with modernizing paragraph 2100 into Java 21 PenaltyCalculationService with automated JUnit 5 characterization assertions.',
    recommendedStrategy: isReassessed ? 'RETAIN' : 'REFACTOR',
    approvalStatus: isReassessed ? 'PENDING_REVIEW' : 'APPROVED_FOR_MIGRATION',
    approvalHistory: isReassessed ? [
      {
        id: 'appr-01',
        reviewer: 'Nishanth (Lead Architect)',
        decision: 'REVIEW_REQUESTED',
        timestamp: '11:15 (Simulated)',
        comment: 'Flagged after Phase 3 adaptive reassessment. Exemption policy must be verified before Java 21 refactoring starts.'
      }
    ] : [
      {
        id: 'appr-00',
        reviewer: 'System Baseline Validator',
        decision: 'AUTO_ASSESSED',
        timestamp: '10:30 (Simulated)',
        comment: 'Deterministic COBOL AST meets baseline requirements for Java 21 Spring Boot refactoring.'
      }
    ],
    isDisputed: isReassessed
  },
  {
    id: 'DEC-002',
    componentName: '2000-PROCESS-PAYMENT',
    file: 'PENALTY.cbl',
    lines: 'Lines 31–35',
    relatedRuleId: 'BR-002',
    relatedRuleName: 'Payment Settlement Penalty Recovery',
    category: 'Transaction Settlement',
    targetJavaClass: 'com.bank.payment.application.PaymentSettlementUseCase',
    verdict: 'REVIEW',
    verdictVariant: 'warning',
    riskLevel: 'High',
    riskVariant: 'danger',
    confidenceScore: 0.82,
    evidenceCompleteness: 'Partial Evidence',
    evidenceCompletenessVariant: 'warning',
    supportingCount: 1,
    conflictingCount: 0,
    missingCount: 2,
    supportingEvidence: [
      {
        id: 'EV-SRC-02',
        title: 'Static COBOL AST PERFORM Invocation',
        source: 'PENALTY.cbl: L31–L35',
        type: 'OBSERVED CODE',
        detail: 'Direct PERFORM of 2100-CALCULATE-PENALTY followed by COMPUTE WS-BALANCE = WS-BALANCE - WS-PENALTY.'
      }
    ],
    conflictingEvidence: [],
    missingEvidence: [
      {
        id: 'MISS-02',
        title: 'Transaction Idempotency Specification',
        description: 'No evidence found regarding retry behavior if network fails after fee deduction but before balance return.'
      },
      {
        id: 'MISS-03',
        title: 'Ledger Audit Database Schema',
        description: 'Relational table schema for logging deducted penalty transactions in Spring Data JPA.'
      }
    ],
    verdictReason: 'Paragraph mutates net account balance by deducting calculated penalty. Downstream atomic ledger logging and Spring @Transactional isolation levels require verification.',
    recommendedAction: 'Obtain database ledger schema and transaction retry requirements before refactoring into a Spring Boot transactional use case.',
    recommendedStrategy: 'REFACTOR',
    approvalStatus: 'PENDING_REVIEW',
    approvalHistory: [
      {
        id: 'appr-02',
        reviewer: 'Athithyan (Backend Lead)',
        decision: 'REVIEW_REQUESTED',
        timestamp: '10:45 (Simulated)',
        comment: 'Idempotency and database transaction isolation level must be reviewed.'
      }
    ],
    isDisputed: false
  },
  {
    id: 'DEC-003',
    componentName: '1000-CHECK-ACCOUNT-STATUS',
    file: 'PENALTY.cbl',
    lines: 'Lines 24–29',
    relatedRuleId: 'BR-003',
    relatedRuleName: 'Overdraft Status Classification',
    category: 'Account Lifecycle',
    targetJavaClass: 'com.bank.account.domain.model.AccountStatus',
    verdict: 'KEEP',
    verdictVariant: 'info',
    riskLevel: 'Low',
    riskVariant: 'neutral',
    confidenceScore: 0.98,
    evidenceCompleteness: 'Sufficient Evidence',
    evidenceCompletenessVariant: 'success',
    supportingCount: 1,
    conflictingCount: 0,
    missingCount: 0,
    supportingEvidence: [
      {
        id: 'EV-SRC-03',
        title: 'Self-Contained Condition Check',
        source: 'PENALTY.cbl: L24–L29',
        type: 'OBSERVED CODE',
        detail: 'Moves constant string "OVERDRAWN" to WS-ACCOUNT-STATUS if WS-BALANCE < 0; else "ACTIVE".'
      }
    ],
    conflictingEvidence: [],
    missingEvidence: [],
    verdictReason: 'Pure deterministic classification logic with zero side-effects and negligible technical debt. Existing logic is robust and self-contained.',
    recommendedAction: 'Model as a type-safe Java 21 enum AccountStatus { ACTIVE, OVERDRAWN }. Zero operational migration risk.',
    recommendedStrategy: 'RETAIN',
    approvalStatus: 'APPROVED_FOR_RETENTION',
    approvalHistory: [
      {
        id: 'appr-03',
        reviewer: 'Nagukan (Data/AI Engineer)',
        decision: 'APPROVED',
        timestamp: '10:50 (Simulated)',
        comment: 'Pure deterministic logic. Direct mapping to Java 21 enum approved.'
      }
    ],
    isDisputed: false
  },
  {
    id: 'DEC-004',
    componentName: 'AUTH-SESSION-FILTER',
    file: 'CICS / JCL Execution Script (External)',
    lines: 'JOB0124: STEP03',
    relatedRuleId: 'BR-EXT-04',
    relatedRuleName: 'Mainframe Security Token Verification',
    category: 'Security & Session',
    targetJavaClass: 'Spring Security 6 OAuth2 / JWT Filter',
    verdict: 'INVESTIGATE',
    verdictVariant: 'danger',
    riskLevel: 'High',
    riskVariant: 'danger',
    confidenceScore: 0.22,
    evidenceCompleteness: 'Insufficient Evidence',
    evidenceCompletenessVariant: 'danger',
    supportingCount: 0,
    conflictingCount: 0,
    missingCount: 2,
    supportingEvidence: [],
    conflictingEvidence: [],
    missingEvidence: [
      {
        id: 'MISS-04',
        title: 'Missing COBOL Security Exit Routine',
        description: 'Referenced as a transaction filter in CICS batch script, but source implementation is absent from repository.'
      },
      {
        id: 'MISS-05',
        title: 'Token & RACF Validation Protocol',
        description: 'RACF credentials signing algorithm and mainframe session timeout specifications.'
      }
    ],
    verdictReason: 'Security filter is referenced in batch execution configuration but implementation code is missing from the ingested workspace. Cannot verify security guarantees or encryption posture.',
    recommendedAction: 'Upload the missing security exit source file or search repository archives. Modernization verdict cannot be reached without implementation evidence.',
    recommendedStrategy: 'REPLACE',
    approvalStatus: 'BLOCKED_MISSING_EVIDENCE',
    approvalHistory: [
      {
        id: 'appr-04',
        reviewer: 'Security & Compliance Reviewer',
        decision: 'BLOCKED',
        timestamp: '11:00 (Simulated)',
        comment: 'Cannot approve modernization without source code. Source code upload required.'
      }
    ],
    isDisputed: false
  }
];

export const getDecisionMetrics = (records) => {
  return {
    totalAssessed: records.length,
    readyToModernize: records.filter(r => r.verdict === 'MODERNIZE').length,
    requiresReview: records.filter(r => r.verdict === 'REVIEW').length,
    keepExisting: records.filter(r => r.verdict === 'KEEP').length,
    insufficientEvidence: records.filter(r => r.verdict === 'INVESTIGATE').length
  };
};
