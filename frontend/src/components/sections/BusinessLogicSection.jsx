import { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { COBOL_BUSINESS_RULES } from '../../data/mockCobolData';

export default function BusinessLogicSection({
  onNavigate,
  isReassessed = false,
  setIsReassessed
}) {
  const [selectedRuleId, setSelectedRuleId] = useState('BR-001');

  const rules = COBOL_BUSINESS_RULES.map(rule => {
    if (rule.id === 'BR-001' && isReassessed) {
      return {
        ...rule,
        verificationStatus: 'CONFLICTING',
        confidenceScore: 0.64,
        confidence: '64% (Contradicted by INC-101)',
        risk: 'High (Disputed Exemption Logic)',
        riskVariant: 'danger',
        evidenceReferences: ['PENALTY.cbl: Lines 37–44', 'ACCTREC.cpy (WS-PAYMENT-EXT-FLAG)', 'INC-101 (Dispute Stream)']
      };
    }
    return {
      ...rule,
      riskVariant: rule.risk.includes('High') ? 'danger' : rule.risk.includes('Medium') ? 'warning' : 'neutral'
    };
  });

  const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

  const handleToggleReassessment = () => {
    if (setIsReassessed) {
      setIsReassessed(!isReassessed);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner - White Primary, Soft-Neutral */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Extracted Business Logic
            </span>
            <Badge variant={isReassessed ? 'warning' : 'success'} size="xs" dot>
              {isReassessed ? 'Adaptive State (v2.0)' : 'Baseline Grounded (v1.0)'}
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Business Rules & Evidence Provenance
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Traceable business logic extracted directly from COBOL PROCEDURE DIVISION paragraphs. Every condition is line-grounded in source code and corroborated against operational incident records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleReassessment}
          >
            {isReassessed ? 'Reset to Baseline (v1.0)' : 'Simulate INC-101 Evidence'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('dependencies-risks')}
          >
            Dependencies & Risks &rarr;
          </Button>
        </div>
      </div>

      {/* Compact Evidence Conflict Banner (INC-101) */}
      <div className={`p-4 rounded-xl border text-xs transition-colors ${
        isReassessed 
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase font-mono tracking-wider">
                {isReassessed ? 'Evidence Conflict Detected: Incident INC-101' : 'Operational Evidence Status'}
              </span>
              <Badge variant={isReassessed ? 'danger' : 'neutral'} size="xs">
                {isReassessed ? 'Disputed Rule BR-001' : 'No Active Disputes'}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              {isReassessed
                ? 'Incident INC-101 reports customers with approved payment extensions are improperly penalized. COBOL paragraph 2100-CALCULATE-PENALTY executes an unconditional deduction, omitting copybook flag WS-PAYMENT-EXT-FLAG.'
                : 'Rule BR-001 is currently supported by static AST extraction. Click "Simulate INC-101 Evidence" to demonstrate adaptive evidence reconciliation.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isReassessed && (
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setSelectedRuleId('BR-001')}
              >
                Inspect Conflict
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Business Rules Table */}
      <Card
        title="Business Rules Inventory"
        subtitle="Scope: PENALTY.cbl (PROGRAM-ID: PENALTY-CALCULATOR)"
        badge={<Badge variant="neutral" size="xs">{rules.length} Extracted</Badge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Business Rule</th>
                <th className="py-2.5 px-3">COBOL Paragraph</th>
                <th className="py-2.5 px-3">Lines</th>
                <th className="py-2.5 px-3">Observed Condition</th>
                <th className="py-2.5 px-3">Observed Action</th>
                <th className="py-2.5 px-3">Evidence Status</th>
                <th className="py-2.5 px-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                const isDisputed = rule.id === 'BR-001' && isReassessed;

                return (
                  <tr
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/70 font-medium text-slate-900' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {rule.id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {rule.title}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">
                      {rule.paragraph}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {rule.lines}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-[200px] truncate">
                      {rule.observedCondition}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-[180px] truncate">
                      {rule.expectedBehavior}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={isDisputed ? 'danger' : 'success'} size="xs">
                        {isDisputed ? 'CONFLICTING' : 'SUPPORTED'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={rule.riskVariant || 'neutral'} size="xs">
                        {rule.risk.split(' ')[0]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Rule Inspection & Grounding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Rule Detail & Traceability */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title={`${selectedRule.id}: ${selectedRule.title}`}
            subtitle={`Grounded in ${selectedRule.program} (${selectedRule.paragraph}, ${selectedRule.lines})`}
            badge={
              <Badge variant={selectedRule.id === 'BR-001' && isReassessed ? 'danger' : 'success'} size="xs">
                {selectedRule.id === 'BR-001' && isReassessed ? 'Conflicting Evidence' : 'Verified Logic'}
              </Badge>
            }
          >
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-900 block">Plain English Interpretation:</span>
                <p className="text-slate-600 leading-relaxed">
                  {selectedRule.interpretation}
                </p>
              </div>

              {/* Exact Source Code Snippet */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Source Grounding ({selectedRule.lines})</span>
                  <span>{selectedRule.paragraph}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800">
                  <div className="text-slate-400">{`* Grounded Rule ${selectedRule.id}`}</div>
                  <div className="text-amber-300">{selectedRule.observedCondition}</div>
                  <div className="text-emerald-300 pl-4">{selectedRule.expectedBehavior}</div>
                  <div className="text-slate-400">END-IF.</div>
                </div>
              </div>

              {/* Provenance and Citations */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Evidence Provenance:</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>1. Static COBOL AST Extraction</span>
                    <span className="text-slate-500">{selectedRule.lines}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>2. Shared Copybook Definition</span>
                    <span className="text-slate-500">ACCTREC.cpy (WS-PAYMENT-EXT-FLAG)</span>
                  </div>
                  {selectedRule.id === 'BR-001' && isReassessed && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between font-semibold">
                      <span>3. Production Dispute Ingestion</span>
                      <span>INC-101 (Payment Extension Waiver)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Target Java 21 Spring Boot Entity */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Target Java 21 Clean Architecture"
            subtitle="Synthesized Spring Boot 3.3.x Domain Component"
            badge={<Badge variant="info" size="xs">Java 21 LTS</Badge>}
          >
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Component</span>
                <span className="font-mono font-bold text-blue-700 text-xs">
                  {selectedRule.targetJavaEntity}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto">
                <pre>
{selectedRule.id === 'BR-001' ? `// Target Service: PenaltyCalculationService.java
@Service
public class PenaltyCalculationService {
    private static final BigDecimal THRESHOLD = new BigDecimal("1000.00");
    private static final BigDecimal PENALTY   = new BigDecimal("50.00");

    public BigDecimal calculate(AccountRecord account) {
        // [EVIDENCE GATE]: Flagged by INC-101
        if (account.paymentExtensionApproved()) {
            return BigDecimal.ZERO;
        }
        if (account.balance().compareTo(THRESHOLD) < 0) {
            return PENALTY;
        }
        return BigDecimal.ZERO;
    }
}` : selectedRule.id === 'BR-002' ? `// Target Service: PaymentSettlementService.java
@Service
@Transactional
public class PaymentSettlementService {
    public PaymentResult settle(AccountRecord account, BigDecimal amount) {
        BigDecimal penalty = penaltyService.calculate(account);
        BigDecimal newBalance = account.balance()
                                      .subtract(penalty)
                                      .subtract(amount);
        return new PaymentResult(newBalance, penalty);
    }
}` : `// Target Model: AccountStatus.java
public enum AccountStatus {
    ACTIVE,
    OVERDRAWN;

    public static AccountStatus evaluate(BigDecimal balance) {
        return balance.signum() < 0 ? OVERDRAWN : ACTIVE;
    }
}`}
                </pre>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => onNavigate('cobol-analysis')}
                >
                  Locate in Source Viewer
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => onNavigate('dependencies-risks')}
                >
                  Analyze Dependencies &rarr;
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
