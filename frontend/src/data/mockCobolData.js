export const COBOL_SOURCE_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. PENALTY-CALCULATOR.
      *================================================================*
      * RETAIL BANKING CORE: MINIMUM BALANCE & OVERDRAFT SERVICE       *
      * LEGACY COBOL-85 BATCH & OLTP INTEGRATION                       *
      * TARGET MODERNIZATION: JAVA 21 + SPRING BOOT 3.x                *
      *================================================================*
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-ACCOUNT-RECORD.
           05  WS-ACCOUNT-ID          PIC X(10).
           05  WS-CUSTOMER-NAME       PIC X(30).
           05  WS-BALANCE             PIC S9(7)V99.
           05  WS-PENALTY             PIC 9(5)V99 VALUE 0.00.
           05  WS-ACCOUNT-STATUS      PIC X(10)   VALUE "ACTIVE".
           05  WS-PAYMENT-EXT-FLAG    PIC X(01)   VALUE "N".
           05  WS-PENALTY-THRESHOLD   PIC 9(5)V99 VALUE 1000.00.
           05  WS-DEFAULT-PENALTY     PIC 9(3)V99 VALUE 50.00.

       PROCEDURE DIVISION.
       0000-MAIN-PROCESS.
           PERFORM 1000-CHECK-ACCOUNT-STATUS.
           PERFORM 2000-PROCESS-PAYMENT.
           STOP RUN.

       1000-CHECK-ACCOUNT-STATUS.
      * RULE BR-003: OVERDRAFT CLASSIFICATION
           IF WS-BALANCE < 0
               MOVE "OVERDRAWN" TO WS-ACCOUNT-STATUS
           ELSE
               MOVE "ACTIVE"    TO WS-ACCOUNT-STATUS
           END-IF.

       2000-PROCESS-PAYMENT.
      * RULE BR-002: PAYMENT SETTLEMENT FEE RECOVERY
           PERFORM 2100-CALCULATE-PENALTY
           COMPUTE WS-BALANCE = WS-BALANCE - WS-PENALTY.

       2100-CALCULATE-PENALTY.
      * RULE BR-001: MINIMUM BALANCE PENALTY ASSESSMENT
      * OBSERVATION: ASSESSES 50 PENALTY UNCONDITIONALLY IF BALANCE < 1000
           IF WS-BALANCE < WS-PENALTY-THRESHOLD
               MOVE WS-DEFAULT-PENALTY TO WS-PENALTY
           ELSE
               MOVE 0.00               TO WS-PENALTY
           END-IF.`;

export const COBOL_DEMO_FILES = [
  {
    id: 'cbl-file-01',
    name: 'PENALTY.cbl',
    extension: '.cbl',
    type: 'COBOL Source Program',
    size: '1.4 KB',
    loc: 44,
    programId: 'PENALTY-CALCULATOR',
    status: 'Ready (Simulated Preview)',
    content: COBOL_SOURCE_CODE,
    isCobol: true
  },
  {
    id: 'cbl-file-02',
    name: 'ACCTREC.cpy',
    extension: '.cpy',
    type: 'COBOL Copybook (Record Layout)',
    size: '420 B',
    loc: 12,
    programId: 'ACCTREC-LAYOUT',
    status: 'Linked Copybook',
    content: `      * ACCOUNT RECORD COPYBOOK
       01  ACCOUNT-COPYBOOK-REC.
           05  ACCT-NUMBER         PIC X(10).
           05  ACCT-CUST-ID        PIC X(08).
           05  ACCT-CURR-BAL       PIC S9(9)V99.
           05  ACCT-EXT-STATUS     PIC X(01).`,
    isCobol: true
  },
  {
    id: 'cbl-file-03',
    name: 'TRANS_PROC.cbl',
    extension: '.cbl',
    type: 'COBOL Source Program',
    size: '1.2 KB',
    loc: 38,
    programId: 'TRANS-PROC',
    status: 'Ready (Transaction Processor)',
    content: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TRANS-PROC.
      *================================================================*
      * RETAIL BANKING CORE: TRANSACTION LIMIT & SURCHARGE PROCESSOR   *
      * TARGET MODERNIZATION: JAVA 21 + SPRING BOOT 3.x                *
      *================================================================*
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-TRANSACTION-RECORD.
           05  WS-TXN-ID              PIC X(12).
           05  WS-TXN-TYPE            PIC X(03).
           05  WS-TXN-AMOUNT          PIC 9(7)V99.
           05  WS-TXN-STATUS          PIC X(10)   VALUE "PENDING".
           05  WS-MAX-DAILY-LIMIT     PIC 9(6)V99 VALUE 50000.00.
           05  WS-FEE-AMOUNT          PIC 9(4)V99 VALUE 0.00.

       PROCEDURE DIVISION.
       0000-PROCESS-TXN.
           PERFORM 1000-VALIDATE-LIMIT.
           PERFORM 2000-CALCULATE-FEE.
           STOP RUN.

       1000-VALIDATE-LIMIT.
      * RULE TX-001: TRANSACTION LIMIT COMPLIANCE
           IF WS-TXN-AMOUNT > WS-MAX-DAILY-LIMIT
               MOVE "REJECTED" TO WS-TXN-STATUS
           ELSE
               MOVE "APPROVED" TO WS-TXN-STATUS
           END-IF.

       2000-CALCULATE-FEE.
      * RULE TX-002: WIRE TRANSFER SURCHARGE
           IF WS-TXN-TYPE = "WRE"
               COMPUTE WS-FEE-AMOUNT = WS-TXN-AMOUNT * 0.015
           ELSE
               MOVE 0.00 TO WS-FEE-AMOUNT
           END-IF.`,
    isCobol: true
  }
];

export const COBOL_PARAGRAPHS = [
  {
    id: 'para-2100',
    name: '2100-CALCULATE-PENALTY',
    program: 'PENALTY.cbl',
    lineStart: 37,
    lineEnd: 44,
    conditions: ['WS-BALANCE < WS-PENALTY-THRESHOLD (1000.00)'],
    outcomes: 'MOVE 50.00 TO WS-PENALTY if true; else MOVE 0.00 TO WS-PENALTY',
    performedBy: ['2000-PROCESS-PAYMENT'],
    performs: [],
    dataItemsRead: ['WS-BALANCE', 'WS-PENALTY-THRESHOLD', 'WS-DEFAULT-PENALTY'],
    dataItemsModified: ['WS-PENALTY'],
    targetJavaClass: 'com.bank.modernization.penalty.service.PenaltyCalculationService',
    summary: 'Evaluates ₹50 penalty assessment when balance is strictly under ₹1,000 threshold.'
  },
  {
    id: 'para-2000',
    name: '2000-PROCESS-PAYMENT',
    program: 'PENALTY.cbl',
    lineStart: 31,
    lineEnd: 35,
    conditions: ['Direct PERFORM of 2100-CALCULATE-PENALTY'],
    outcomes: 'COMPUTE WS-BALANCE = WS-BALANCE - WS-PENALTY',
    performedBy: ['0000-MAIN-PROCESS'],
    performs: ['2100-CALCULATE-PENALTY'],
    dataItemsRead: ['WS-PENALTY', 'WS-BALANCE'],
    dataItemsModified: ['WS-BALANCE'],
    targetJavaClass: 'com.bank.modernization.payment.service.PaymentSettlementService',
    summary: 'Deducts assessed penalty fee directly from account balance during settlement.'
  },
  {
    id: 'para-1000',
    name: '1000-CHECK-ACCOUNT-STATUS',
    program: 'PENALTY.cbl',
    lineStart: 24,
    lineEnd: 29,
    conditions: ['WS-BALANCE < 0'],
    outcomes: 'MOVE "OVERDRAWN" TO WS-ACCOUNT-STATUS if true; else MOVE "ACTIVE"',
    performedBy: ['0000-MAIN-PROCESS'],
    performs: [],
    dataItemsRead: ['WS-BALANCE'],
    dataItemsModified: ['WS-ACCOUNT-STATUS'],
    targetJavaClass: 'com.bank.modernization.account.model.AccountStatusEvaluator',
    summary: 'Determines whether account health transitions to OVERDRAWN status.'
  }
];

export const COBOL_BUSINESS_RULES = [
  {
    id: 'BR-001',
    title: 'Minimum Balance Penalty Rule',
    program: 'PENALTY.cbl',
    paragraph: '2100-CALCULATE-PENALTY',
    lines: 'Lines 37–44',
    observedCondition: 'IF WS-BALANCE < WS-PENALTY-THRESHOLD (1000.00)',
    expectedBehavior: 'MOVE 50.00 TO WS-PENALTY (Charges ₹50 deduction fee)',
    interpretation: 'Deposit accounts with balances falling below ₹1,000 are charged a ₹50 minimum balance maintenance fee.',
    provenance: 'OBSERVED COBOL AST / AI-INTERPRETED',
    evidenceReferences: ['PENALTY.cbl: L37-L44'],
    confidence: '94% (Observed in Code)',
    confidenceScore: 0.94,
    risk: 'Medium (Baseline) / High (Disputed)',
    riskVariant: 'amber',
    verificationStatus: 'SUPPORTED (Baseline) / CONFLICTING (with INC-101)',
    targetJavaEntity: 'PenaltyCalculationRule.java (@Component)'
  },
  {
    id: 'BR-002',
    title: 'Payment Settlement Penalty Recovery',
    program: 'PENALTY.cbl',
    paragraph: '2000-PROCESS-PAYMENT',
    lines: 'Lines 31–35',
    observedCondition: 'PERFORM 2100-CALCULATE-PENALTY; COMPUTE WS-BALANCE = WS-BALANCE - WS-PENALTY',
    expectedBehavior: 'Deducts penalty immediately from transaction balance before settlement completion',
    interpretation: 'Outbound payment transactions enforce recovery of accrued minimum balance penalties prior to settlement.',
    provenance: 'OBSERVED COBOL AST',
    evidenceReferences: ['PENALTY.cbl: L31-L35'],
    confidence: '91% (Observed in Code)',
    confidenceScore: 0.91,
    risk: 'High (Direct Balance Mutation)',
    riskVariant: 'danger',
    verificationStatus: 'SUPPORTED',
    targetJavaEntity: 'PaymentSettlementProcessor.java (@Service)'
  },
  {
    id: 'BR-003',
    title: 'Overdraft Status Classification',
    program: 'PENALTY.cbl',
    paragraph: '1000-CHECK-ACCOUNT-STATUS',
    lines: 'Lines 24–29',
    observedCondition: 'IF WS-BALANCE < 0',
    expectedBehavior: 'MOVE "OVERDRAWN" TO WS-ACCOUNT-STATUS; else "ACTIVE"',
    interpretation: 'Accounts with negative balance transition to OVERDRAWN status, restricting subsequent transactional withdrawals.',
    provenance: 'OBSERVED COBOL AST',
    evidenceReferences: ['PENALTY.cbl: L24-L29'],
    confidence: '98% (Self-Contained)',
    confidenceScore: 0.98,
    risk: 'Low (Status Flag)',
    riskVariant: 'neutral',
    verificationStatus: 'SUPPORTED',
    targetJavaEntity: 'AccountStatus.java (Enum: ACTIVE, OVERDRAWN)'
  }
];

export const WORKING_STORAGE_ITEMS = [
  { name: 'WS-ACCOUNT-ID', level: '05', pic: 'X(10)', role: 'Identifier', usage: 'Primary Key' },
  { name: 'WS-CUSTOMER-NAME', level: '05', pic: 'X(30)', role: 'Descriptive', usage: 'Customer Name' },
  { name: 'WS-BALANCE', level: '05', pic: 'S9(7)V99', role: 'State / Computational', usage: 'Account Balance' },
  { name: 'WS-PENALTY', level: '05', pic: '9(5)V99', role: 'Computational Result', usage: 'Assessed Penalty Amount' },
  { name: 'WS-ACCOUNT-STATUS', level: '05', pic: 'X(10)', role: 'State Flag', usage: 'ACTIVE / OVERDRAWN' },
  { name: 'WS-PAYMENT-EXT-FLAG', level: '05', pic: 'X(01)', role: 'Waiver / Exemption Flag', usage: 'Y/N (Omitted from 2100 logic)' },
  { name: 'WS-PENALTY-THRESHOLD', level: '05', pic: '9(5)V99', role: 'Parameter Constant', usage: '1000.00' },
  { name: 'WS-DEFAULT-PENALTY', level: '05', pic: '9(3)V99', role: 'Parameter Constant', usage: '50.00' }
];

export const REGRESSION_TEST_SCENARIOS = [
  {
    id: 'REG-001',
    title: 'Standard Minimum Balance Penalty Assessment',
    boundary: 'Balance < ₹1,000',
    inputs: 'WS-BALANCE = 850.00, WS-PAYMENT-EXT-FLAG = "N"',
    expectedCobol: 'WS-PENALTY = 50.00, WS-BALANCE = 800.00, WS-ACCOUNT-STATUS = "ACTIVE"',
    targetJavaAssertion: 'assertEquals(new BigDecimal("50.00"), penaltyService.calculate(account));',
    sourceGrounding: 'Grounded in PENALTY.cbl Lines 37–44 (Rule BR-001)',
    status: 'Ready for Test Suite'
  },
  {
    id: 'REG-002',
    title: 'Boundary Threshold Exact Value Verification',
    boundary: 'Balance = ₹1,000.00 exactly',
    inputs: 'WS-BALANCE = 1000.00, WS-PAYMENT-EXT-FLAG = "N"',
    expectedCobol: 'WS-PENALTY = 0.00, WS-BALANCE = 1000.00, WS-ACCOUNT-STATUS = "ACTIVE"',
    targetJavaAssertion: 'assertEquals(BigDecimal.ZERO, penaltyService.calculate(account));',
    sourceGrounding: 'Grounded in strict "<" inequality in PENALTY.cbl Line 39',
    status: 'Ready for Test Suite'
  },
  {
    id: 'REG-003',
    title: 'Compliant Account Balance Above Threshold',
    boundary: 'Balance > ₹1,000.00',
    inputs: 'WS-BALANCE = 2500.00, WS-PAYMENT-EXT-FLAG = "N"',
    expectedCobol: 'WS-PENALTY = 0.00, WS-BALANCE = 2500.00, WS-ACCOUNT-STATUS = "ACTIVE"',
    targetJavaAssertion: 'assertEquals(BigDecimal.ZERO, penaltyService.calculate(account));',
    sourceGrounding: 'Grounded in PENALTY.cbl Lines 41–43',
    status: 'Ready for Test Suite'
  },
  {
    id: 'REG-004',
    title: 'Approved Payment Extension Exemption (Disputed Case)',
    boundary: 'Balance < ₹1,000 with Payment Extension Active',
    inputs: 'WS-BALANCE = 600.00, WS-PAYMENT-EXT-FLAG = "Y"',
    expectedCobol: 'DISPUTE: Legacy COBOL assesses 50.00; INC-101 demands 0.00 exemption',
    targetJavaAssertion: 'assertThrowsOrExempt(...) // Awaiting domain owner policy approval',
    sourceGrounding: 'Contradiction flagged between PENALTY.cbl and INC-101',
    status: 'Requires Policy Validation'
  },
  {
    id: 'REG-005',
    title: 'Negative Balance / Overdraft Transition',
    boundary: 'Balance < 0.00',
    inputs: 'WS-BALANCE = -150.00',
    expectedCobol: 'WS-ACCOUNT-STATUS = "OVERDRAWN"',
    targetJavaAssertion: 'assertEquals(AccountStatus.OVERDRAWN, statusEvaluator.evaluate(account));',
    sourceGrounding: 'Grounded in PENALTY.cbl Lines 24–29 (Rule BR-003)',
    status: 'Ready for Test Suite'
  }
];

export const MODERNIZATION_ROADMAP_STAGES = [
  {
    step: 1,
    id: 'DISCOVER',
    name: '1. Discover',
    description: 'Inventory legacy COBOL programs, copybooks (.cpy), JCL run-streams, and batch schedules.',
    targetArtifacts: 'Program inventory catalog, copybook dependency matrix',
    progress: 'Complete',
    progressVariant: 'success',
    isGated: false
  },
  {
    step: 2,
    id: 'UNDERSTAND',
    name: '2. Understand',
    description: 'Extract business rules, conditions, data items, and PERFORM relationships with line citations.',
    targetArtifacts: 'Extracted rule catalog (BR-001, BR-002, BR-003) with line numbers',
    progress: 'Complete',
    progressVariant: 'success',
    isGated: false
  },
  {
    step: 3,
    id: 'VERIFY',
    name: '3. Verify',
    description: 'Reconcile extracted rules against incident logs (INC-101), policy documents, and domain owners.',
    targetArtifacts: 'Adaptive evidence graph, contradiction reports, version diff (v1.0 -> v2.0)',
    progress: 'In Progress (INC-101 Gating)',
    progressVariant: 'warning',
    isGated: true
  },
  {
    step: 4,
    id: 'CHARACTERIZE',
    name: '4. Characterize',
    description: 'Generate JUnit 5 characterization regression test suite based on verified COBOL boundary inputs.',
    targetArtifacts: 'Automated test suite (5 regression scenarios for balance boundaries)',
    progress: 'Specified',
    progressVariant: 'info',
    isGated: false
  },
  {
    step: 5,
    id: 'PLAN',
    name: '5. Plan',
    description: 'Determine modernization boundaries, 4R strategy (Retain/Refactor/Replace/Remove), and blast radius.',
    targetArtifacts: 'Component modernization verdicts, dependency-ordered migration sequence',
    progress: 'Review Required',
    progressVariant: 'warning',
    isGated: true
  },
  {
    step: 6,
    id: 'MIGRATE',
    name: '6. Migrate',
    description: 'Design target Java 21 + Spring Boot 3.x architecture (Services, Domain Records, REST APIs).',
    targetArtifacts: 'AccountPenaltyService.java, Spring Boot application skeleton, OpenAPI contract',
    progress: 'Architecture Defined',
    progressVariant: 'neutral',
    isGated: true
  },
  {
    step: 7,
    id: 'VALIDATE',
    name: '7. Validate',
    description: 'Run dual-run characterization testing comparing COBOL batch outputs with Java Spring Boot outputs.',
    targetArtifacts: 'Dual-run verification report, zero-divergence test evidence',
    progress: 'Scheduled Post-Approval',
    progressVariant: 'neutral',
    isGated: true
  },
  {
    step: 8,
    id: 'CUT_OVER',
    name: '8. Cut Over',
    description: 'Decommission legacy COBOL paragraphs only after verified dual-run sign-off and architect approval.',
    targetArtifacts: 'Decommissioning certificate, production cutover sign-off',
    progress: 'Pending Verification',
    progressVariant: 'neutral',
    isGated: true
  }
];

export const JAVA_TARGET_ARCHITECTURE_SPEC = {
  javaVersion: 'Java 21 LTS',
  framework: 'Spring Boot 3.3.x',
  architectureType: 'Hexagonal / Clean Domain Architecture',
  targetComponents: [
    {
      cobolSource: 'PENALTY.cbl (2100-CALCULATE-PENALTY)',
      targetJava: 'com.bank.penalty.domain.service.PenaltyCalculationService',
      annotation: '@Service',
      responsibility: 'Pure domain calculation with explicit PaymentExtensionPolicy integration.'
    },
    {
      cobolSource: 'PENALTY.cbl (2000-PROCESS-PAYMENT)',
      targetJava: 'com.bank.payment.application.PaymentSettlementUseCase',
      annotation: '@Component / @Transactional',
      responsibility: 'Transactional payment orchestrator ensuring atomic ledger logging and idempotency.'
    },
    {
      cobolSource: 'PENALTY.cbl (1000-CHECK-ACCOUNT-STATUS)',
      targetJava: 'com.bank.account.domain.model.AccountStatus',
      annotation: 'public enum AccountStatus { ACTIVE, OVERDRAWN, RESTRICTED }',
      responsibility: 'Type-safe domain enum replacing raw string literal moves.'
    },
    {
      cobolSource: 'ACCTREC.cpy (ACCOUNT-COPYBOOK-REC)',
      targetJava: 'com.bank.account.domain.model.AccountRecord',
      annotation: 'public record AccountRecord(String id, BigDecimal balance, boolean extensionApproved)',
      responsibility: 'Immutable Java 21 Record replacing COBOL 01-level working storage structure.'
    }
  ]
};
