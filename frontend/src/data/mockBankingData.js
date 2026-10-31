export const BANKING_SOURCE_CODE = `def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0


def process_payment(balance):
    penalty = calculate_penalty(balance)
    return balance - penalty


def check_account_status(balance):
    if balance < 0:
        return "OVERDRAWN"
    return "ACTIVE"`;

export const DEMO_BANKING_FILES = [
  {
    id: 'file-001',
    name: 'penalty_engine.py',
    extension: '.py',
    size: '286 B',
    rawSize: 286,
    loc: 16,
    status: 'Ready',
    content: BANKING_SOURCE_CODE,
    isDemo: true
  }
];

export const DISCOVERED_FUNCTIONS = [
  {
    id: 'fn-calculate-penalty',
    name: 'calculate_penalty',
    file: 'penalty_engine.py',
    lineStart: 1,
    lineEnd: 5,
    parameters: ['balance'],
    conditions: ['balance < 1000'],
    returnBehavior: 'Returns 50 if balance < 1000, otherwise returns 0',
    callers: ['process_payment'],
    callees: [],
    cyclomaticComplexity: 2,
    codeSnippet: `def calculate_penalty(balance):
    if balance < 1000:
        return 50
    return 0`,
    summary: 'Calculates a ₹50 penalty charge when account balance is strictly below ₹1,000 threshold.'
  },
  {
    id: 'fn-process-payment',
    name: 'process_payment',
    file: 'penalty_engine.py',
    lineStart: 8,
    lineEnd: 10,
    parameters: ['balance'],
    conditions: ['Direct invocation of calculate_penalty(balance)'],
    returnBehavior: 'Returns net remaining balance after deducting assessed penalty',
    callers: [],
    callees: ['calculate_penalty'],
    cyclomaticComplexity: 1,
    codeSnippet: `def process_payment(balance):
    penalty = calculate_penalty(balance)
    return balance - penalty`,
    summary: 'Orchestrates settlement by evaluating penalty and deducting it from transaction balance.'
  },
  {
    id: 'fn-check-account-status',
    name: 'check_account_status',
    file: 'penalty_engine.py',
    lineStart: 13,
    lineEnd: 16,
    parameters: ['balance'],
    conditions: ['balance < 0'],
    returnBehavior: 'Returns "OVERDRAWN" if balance is negative; otherwise "ACTIVE"',
    callers: [],
    callees: [],
    cyclomaticComplexity: 2,
    codeSnippet: `def check_account_status(balance):
    if balance < 0:
        return "OVERDRAWN"
    return "ACTIVE"`,
    summary: 'Determines whether an account status transitions to OVERDRAWN based on zero threshold.'
  }
];

export const BUSINESS_RULE_CANDIDATES = [
  {
    id: 'BR-001',
    ruleName: 'Minimum Balance Penalty Rule',
    functionName: 'calculate_penalty',
    file: 'penalty_engine.py',
    lineReference: 'Lines 2–4',
    lineStart: 2,
    lineEnd: 4,
    extractedCondition: 'balance < 1000',
    observedResult: 'return 50 (deduction)',
    interpretation: 'Potential minimum-balance maintenance penalty charged to accounts falling below ₹1,000.',
    provenance: 'OBSERVED CODE / AI-INTERPRETED',
    provenanceType: 'observed',
    confidenceScore: 0.94,
    category: 'Fee Calculation'
  },
  {
    id: 'BR-002',
    ruleName: 'Payment Settlement Penalty Recovery',
    functionName: 'process_payment',
    file: 'penalty_engine.py',
    lineReference: 'Lines 8–10',
    lineStart: 8,
    lineEnd: 10,
    extractedCondition: 'penalty = calculate_penalty(balance)',
    observedResult: 'balance - penalty',
    interpretation: 'Immediate recovery rule: Outstanding penalty is deducted from balance during transaction settlement.',
    provenance: 'OBSERVED CODE / AI-INTERPRETED',
    provenanceType: 'observed',
    confidenceScore: 0.91,
    category: 'Transaction Settlement'
  },
  {
    id: 'BR-003',
    ruleName: 'Overdraft Status Classification',
    functionName: 'check_account_status',
    file: 'penalty_engine.py',
    lineReference: 'Lines 13–16',
    lineStart: 13,
    lineEnd: 16,
    extractedCondition: 'balance < 0',
    observedResult: '"OVERDRAWN" vs "ACTIVE"',
    interpretation: 'Account health rule: Negative balances trigger restrictive OVERDRAWN classification.',
    provenance: 'OBSERVED CODE',
    provenanceType: 'observed',
    confidenceScore: 0.98,
    category: 'Account Lifecycle'
  }
];

export const MOCK_ANALYSIS_METRICS = {
  version: 'v1.0 (Initial Code Ingestion)',
  status: 'Initial Analysis Complete',
  timestamp: 'Just now',
  totalFiles: 1,
  totalLoc: 16,
  functionsCount: 3,
  rulesCount: 3,
  dependenciesCount: 1,
  evidenceType: 'Static AST Code Extraction',
  isSimulated: true
};
