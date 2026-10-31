import { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  Map, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ArrowRight, 
  Code2, 
  Server, 
  FileCode2, 
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';
import { 
  MODERNIZATION_ROADMAP_STAGES, 
  JAVA_TARGET_ARCHITECTURE_SPEC 
} from '../../data/mockCobolData';

export default function ModernizationRoadmapSection({
  isReassessed = false,
  onNavigate
}) {
  const [activeStageStep, setActiveStageStep] = useState(3); // Stage 3: Verify (In Progress)
  const [copied, setCopied] = useState(false);

  const stages = MODERNIZATION_ROADMAP_STAGES.map(stage => {
    if (stage.id === 'VERIFY' && isReassessed) {
      return {
        ...stage,
        progress: 'Gated by INC-101 (Domain Sign-off Required)',
        progressVariant: 'warning'
      };
    }
    return stage;
  });

  const selectedStage = stages.find(s => s.step === activeStageStep) || stages[2];

  const javaSampleCode = `// Target Architecture: Java 21 LTS + Spring Boot 3.3.x
package com.bank.penalty.domain.service;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import com.bank.account.domain.model.AccountRecord;

/**
 * Modernized from PENALTY.cbl paragraph 2100-CALCULATE-PENALTY.
 * Evidence Gate: Requires resolved payment extension contract.
 */
@Service
public class PenaltyCalculationService {

    private static final BigDecimal PENALTY_THRESHOLD = new BigDecimal("1000.00");
    private static final BigDecimal DEFAULT_PENALTY   = new BigDecimal("50.00");

    public BigDecimal calculatePenalty(AccountRecord account) {
        // [GOVERNANCE GATE]: Resolved via incident ticket INC-101
        if (account.paymentExtensionApproved()) {
            return BigDecimal.ZERO;
        }

        // Strict inequality matching COBOL: IF WS-BALANCE < WS-PENALTY-THRESHOLD
        if (account.balance().compareTo(PENALTY_THRESHOLD) < 0) {
            return DEFAULT_PENALTY;
        }

        return BigDecimal.ZERO;
    }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(javaSampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Migration Blueprint
            </span>
            <Badge variant="success" size="xs" dot>
              COBOL → Java 21 + Spring Boot 3.x
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Map className="w-6 h-6 text-emerald-400 shrink-0" />
            Modernization Roadmap & Architectural Blueprint
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Strict evidence-gated 8-stage migration pathway from legacy COBOL to Java 21 Clean Architecture. Decommissioning legacy paragraphs is permitted only after characterization tests and dual-run verifications succeed.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('analysis-history')}
          >
            Audit History
          </Button>
        </div>
      </div>

      {/* 8-Stage Interactive Roadmap Stepper */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            8-Stage Evidence-Gated Lifecycle
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Current Stage: 3. Verify (Gated on INC-101)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {stages.map((stage) => {
            const isSelected = stage.step === activeStageStep;
            const isComplete = stage.progress === 'Complete';
            const isInProgress = stage.step === 3 || stage.step === 4;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageStep(stage.step)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-300'
                    : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    0{stage.step}
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : stage.isGated ? (
                    <Lock className="w-3 h-3 text-amber-600" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400" />
                  )}
                </div>

                <div className="font-bold text-xs text-slate-900 truncate mb-1">
                  {stage.name.split('. ')[1]}
                </div>

                <div className={`text-[9px] font-semibold truncate ${
                  isComplete 
                    ? 'text-emerald-700' 
                    : isInProgress 
                    ? 'text-amber-700' 
                    : 'text-slate-400'
                }`}>
                  {stage.progress}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail & Gating Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-4">
          <Card
            title={selectedStage.name}
            subtitle={selectedStage.isGated ? 'Evidence Gate Enforced' : 'Unrestricted Stage'}
            badge={
              <Badge variant={selectedStage.progressVariant || 'neutral'}>
                {selectedStage.progress}
              </Badge>
            }
          >
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-900 block">
                  Stage Objective & Scope:
                </span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {selectedStage.description}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-900 block">
                  Mandated Deliverables & Artifacts:
                </span>
                <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                  {selectedStage.targetArtifacts}
                </p>
              </div>

              {selectedStage.isGated && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Evidence Gating Requirement:
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    Advancing past this stage requires zero unverified conflicts. For Rule BR-001, production ticket INC-101 and domain owner sign-off must be uploaded before Java cut-over.
                  </p>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onNavigate('decision-center')}
              >
                Inspect Stage Decisions in Decision Center
              </Button>
            </div>
          </Card>
        </div>

        {/* Target Architecture Specification & Code Sample */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="Target Clean Architecture: Java 21 + Spring Boot 3.x"
            subtitle="Hexagonal Domain Model replacing legacy COBOL procedural structures"
            badge={<Badge variant="success">Java 21 LTS</Badge>}
          >
            <div className="space-y-4 text-xs">
              {/* Stack Spec Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-blue-600" />
                    Language Runtime
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {JAVA_TARGET_ARCHITECTURE_SPEC.javaVersion}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <Server className="w-3 h-3 text-emerald-600" />
                    Framework
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {JAVA_TARGET_ARCHITECTURE_SPEC.framework}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <FileCode2 className="w-3 h-3 text-purple-600" />
                    Pattern
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Hexagonal Clean Core
                  </span>
                </div>
              </div>

              {/* Component Mapping Table */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-900 block text-xs">
                  COBOL to Java 21 Component Mapping:
                </span>
                <div className="space-y-1.5">
                  {JAVA_TARGET_ARCHITECTURE_SPEC.targetComponents.map((comp, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {comp.cobolSource}
                        </span>
                        <div className="text-xs font-mono font-bold text-blue-700">
                          {comp.targetJava.split('.').pop()}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start sm:self-auto">
                        {comp.annotation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Code Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 block text-xs">
                    Synthesized Spring Boot Service (PenaltyCalculationService.java):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Java'}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto max-h-56">
                  <pre>{javaSampleCode}</pre>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
