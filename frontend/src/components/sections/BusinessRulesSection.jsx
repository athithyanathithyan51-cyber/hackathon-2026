import { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  ListTree, 
  FileCode2, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { COBOL_BUSINESS_RULES } from '../../data/mockCobolData';
import { useProject } from '../../context/ProjectContext';
import { toRuleCards } from '../../data/liveAdapters';

export default function BusinessRulesSection({
  isReassessed = false,
  onNavigate
}) {
  const [selectedRuleId, setSelectedRuleId] = useState('BR-001');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SUPPORTED' | 'DISPUTED'
  const { findings } = useProject();
  // Live findings from the backend. The mock rules are used only when no project is loaded.
  const liveRules = findings && findings.length > 0 ? toRuleCards(findings) : null;

  const rules = (liveRules || COBOL_BUSINESS_RULES).map(rule => {
    if (!liveRules && rule.id === 'BR-001' && isReassessed) {
      return {
        ...rule,
        verificationStatus: 'CONFLICTING',
        statusVariant: 'danger',
        confidenceScore: 0.64,
        confidence: '64% (Contradicted by INC-101)',
        risk: 'High (Disputed Exemption Logic)',
        evidenceReferences: ['PENALTY.cbl: L37–L44', 'ACCTREC.cpy (WS-PAYMENT-EXT-FLAG)', 'INC-101 (Dispute Stream)']
      };
    }
    return {
      ...rule,
      statusVariant: rule.verificationStatus.includes('SUPPORTED') ? 'success' : 'warning'
    };
  });

  const filteredRules = rules.filter(r => {
    if (filter === 'SUPPORTED') return r.verificationStatus === 'SUPPORTED';
    if (filter === 'DISPUTED') return r.verificationStatus === 'CONFLICTING' || r.verificationStatus.includes('CONFLICTING');
    return true;
  });

  const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

  const getTargetJavaSnippet = (ruleId) => {
    switch (ruleId) {
      case 'BR-001':
        return `// Target Java 21 Service - Clean Architecture Domain
package com.bank.penalty.domain.service;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class PenaltyCalculationService {
    private static final BigDecimal THRESHOLD = new BigDecimal("1000.00");
    private static final BigDecimal DEFAULT_PENALTY = new BigDecimal("50.00");

    public BigDecimal calculate(AccountRecord account) {
        // [AUDIT]: Gated condition derived from INC-101 policy resolution
        if (account.paymentExtensionApproved()) {
            return BigDecimal.ZERO; // Exempt from minimum balance penalty
        }
        if (account.balance().compareTo(THRESHOLD) < 0) {
            return DEFAULT_PENALTY;
        }
        return BigDecimal.ZERO;
    }
}`;
      case 'BR-002':
        return `// Target Java 21 Transactional Use Case - Spring Boot 3.3.x
package com.bank.payment.application;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentSettlementUseCase {
    private final PenaltyCalculationService penaltyService;
    private final AccountLedgerRepository ledgerRepo;

    @Transactional
    public PaymentResult processPayment(String accountId, BigDecimal amount) {
        AccountRecord account = ledgerRepo.findByIdForUpdate(accountId);
        BigDecimal penalty = penaltyService.calculate(account);
        BigDecimal newBalance = account.balance().subtract(penalty).subtract(amount);
        ledgerRepo.updateBalanceAndLogFee(accountId, newBalance, penalty);
        return new PaymentResult(newBalance, penalty);
    }
}`;
      case 'BR-003':
        return `// Target Java 21 Domain Enum - Type-Safe Model
package com.bank.account.domain.model;

public enum AccountStatus {
    ACTIVE,
    OVERDRAWN;

    public static AccountStatus evaluate(BigDecimal balance) {
        return balance.signum() < 0 ? OVERDRAWN : ACTIVE;
    }
}`;
      default:
        return '// Java representation pending specification';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Discovered Business Logic
            </span>
            <Badge variant={isReassessed ? 'warning' : 'success'} size="xs" dot>
              {isReassessed ? 'v2.0 Reassessed Rules' : 'v1.0 Baseline Rules'}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ListTree className="w-6 h-6 text-emerald-400 shrink-0" />
            Business Rules & Evidence Provenance
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Traceable business logic extracted from COBOL PROCEDURE DIVISION paragraphs. Every rule is strictly grounded in line citations, linked to copybooks, and correlated with production incident evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('adaptive-intelligence')}
          >
            Adaptive Intelligence
          </Button>
        </div>
      </div>

      {/* Disputed Rule Notice if Reassessed */}
      {isReassessed && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-950">
                Rule Conflict Detected: BR-001 (Minimum Balance Penalty)
              </span>
              <p className="text-rose-900 text-[11px] mt-0.5">
                Production ticket INC-101 disputes unconditional deduction. Paragraph <code>2100-CALCULATE-PENALTY</code> omits payment extension flag check.
              </p>
            </div>
          </div>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setSelectedRuleId('BR-001')}
          >
            Inspect Disputed Rule
          </Button>
        </div>
      )}

      {/* Filter Tabs & Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Rules ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('SUPPORTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'SUPPORTED'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supported ({rules.filter(r => r.verificationStatus === 'SUPPORTED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('DISPUTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'DISPUTED'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disputed / In Review ({isReassessed ? 1 : 0})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Scope: PENALTY.cbl (PROGRAM-ID: PENALTY-CALCULATOR)
        </span>
      </div>

      {/* Rules Master & Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Rules Table / Master List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredRules.map((rule) => {
            const isSelected = rule.id === selectedRuleId;
            const isDisputed = rule.verificationStatus === 'CONFLICTING' || rule.id === 'BR-001' && isReassessed;

            return (
              <div
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {rule.id}
                    </span>
                    <Badge 
                      variant={isDisputed ? 'danger' : 'success'} 
                      size="xs"
                    >
                      {isDisputed ? 'CONFLICTING' : 'SUPPORTED'}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {rule.lines}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 mb-1">
                  {rule.title}
                </div>

                <div className="text-[11px] font-mono text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 truncate mb-2">
                  {rule.paragraph}
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {rule.interpretation}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Confidence: {(rule.confidenceScore * 100).toFixed(0)}%</span>
                  <span className="font-mono">Target: {rule.targetJavaEntity.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Rule Detail Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title={`${selectedRule.id} — ${selectedRule.title}`}
            subtitle={`Grounded in ${selectedRule.program} (${selectedRule.paragraph}, ${selectedRule.lines})`}
            badge={
              <Badge 
                variant={selectedRule.id === 'BR-001' && isReassessed ? 'danger' : 'success'}
              >
                {selectedRule.id === 'BR-001' && isReassessed ? 'Disputed by INC-101' : 'Verified Logic'}
              </Badge>
            }
          >
            <div className="space-y-4 text-xs">
              {/* Plain English Specification */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-900 text-xs block">
                  Plain-Language Business Specification:
                </span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {selectedRule.interpretation}
                </p>
              </div>

              {/* COBOL Code Snippet & Grounding */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                    COBOL Source Grounding ({selectedRule.lines})
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    PARAGRAPH: {selectedRule.paragraph}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800 space-y-1">
                  <div className="text-slate-500">{`* ${selectedRule.title}`}</div>
                  <div className="text-emerald-400">{selectedRule.observedCondition}</div>
                  <div className="text-amber-300 pl-4">{selectedRule.expectedBehavior}</div>
                  <div className="text-slate-500">END-IF.</div>
                </div>
              </div>

              {/* Evidence Chain Provenance */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-900 text-xs block flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                  Evidence Traceability & Citations:
                </span>
                <div className="space-y-1.5">
                  {selectedRule.evidenceReferences.map((ref, idx) => (
                    <div 
                      key={idx}
                      className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {ref.includes('INC') ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className={ref.includes('INC') ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                          {ref}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ref.includes('INC') ? 'External Dispute Ticket' : ref.includes('cpy') ? 'Copybook Definition' : 'COBOL AST'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Java 21 Spring Boot Representation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    Target Java 21 Clean Architecture Representation
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Java 21 + Spring Boot 3.3.x
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto max-h-56">
                  <pre className="text-slate-200">
                    {getTargetJavaSnippet(selectedRule.id)}
                  </pre>
                </div>
              </div>

              {/* Navigation Action */}
              <div className="pt-2 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('cobol-analysis')}
                >
                  View in COBOL Source Viewer
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => onNavigate('decision-center')}
                >
                  Evaluate in Decision Center
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
