import { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function DependenciesRisksSection({
  onNavigate,
  isReassessed = false
}) {
  const [selectedParagraph, setSelectedParagraph] = useState('2100-CALCULATE-PENALTY');

  // Paragraph dependency relationships grounded in PENALTY.cbl
  const DEPENDENCY_DATA = {
    '2100-CALCULATE-PENALTY': {
      name: '2100-CALCULATE-PENALTY',
      ruleId: 'BR-001',
      loc: 'Lines 37–44',
      type: 'Arithmetic Calculation Leaf Routine',
      callers: ['2000-PROCESS-PAYMENT (PERFORM)'],
      callees: [],
      dataRead: ['WS-BALANCE', 'WS-PENALTY-THRESHOLD', 'WS-DEFAULT-PENALTY'],
      dataMutated: ['WS-PENALTY'],
      riskRating: isReassessed ? 'High (Disputed Logic)' : 'Medium (Deterministic)',
      riskVariant: isReassessed ? 'danger' : 'warning',
      downstreamImpact: [
        '2000-PROCESS-PAYMENT (Subtracts penalty from balance during payment)',
        'Monthly Customer Statement Batch (JCL STEP 04)',
        'Retail Core Fee Journal (GL Ledger 2041)'
      ],
      unsupportedConstructs: [
        'Omission of WS-PAYMENT-EXT-FLAG check defined in copybook ACCTREC.cpy',
        'Implicit currency rounding (PIC 9(5)V99 fixed-point arithmetic)'
      ]
    },
    '2000-PROCESS-PAYMENT': {
      name: '2000-PROCESS-PAYMENT',
      ruleId: 'BR-002',
      loc: 'Lines 31–35',
      type: 'Transaction Settlement Routine',
      callers: ['0000-MAIN-PROCESS (PERFORM)'],
      callees: ['2100-CALCULATE-PENALTY (PERFORM)'],
      dataRead: ['WS-BALANCE', 'WS-PENALTY'],
      dataMutated: ['WS-BALANCE'],
      riskRating: 'High (Direct State Mutation)',
      riskVariant: 'danger',
      downstreamImpact: [
        'WS-BALANCE (Net customer ledger balance mutated)',
        '1000-CHECK-ACCOUNT-STATUS (Evaluates negative balance)',
        'Core Banking Database Ledger'
      ],
      unsupportedConstructs: [
        'Missing transaction isolation / rollback guard if network drops post-deduction'
      ]
    },
    '1000-CHECK-ACCOUNT-STATUS': {
      name: '1000-CHECK-ACCOUNT-STATUS',
      ruleId: 'BR-003',
      loc: 'Lines 24–29',
      type: 'State Classification Routine',
      callers: ['0000-MAIN-PROCESS (PERFORM)'],
      callees: [],
      dataRead: ['WS-BALANCE'],
      dataMutated: ['WS-ACCOUNT-STATUS'],
      riskRating: 'Low (Self-Contained)',
      riskVariant: 'success',
      downstreamImpact: [
        'WS-ACCOUNT-STATUS ("ACTIVE" / "OVERDRAWN")',
        'Downstream Withdrawal Authorization Gate'
      ],
      unsupportedConstructs: []
    }
  };

  const currentDep = DEPENDENCY_DATA[selectedParagraph];

  return (
    <div className="space-y-5">
      {/* Header Banner - White-Primary */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Architecture Analysis
            </span>
            <Badge variant="neutral" size="xs">
              PENALTY.cbl Call Graph
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Dependencies & Modernization Blast Radius
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Trace PERFORM call relationships, inspect WORKING-STORAGE state mutations, identify downstream ripple effects, and review potential modernization blindspots before refactoring.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('modernization-report')}
          >
            Generate Modernization Report &rarr;
          </Button>
        </div>
      </div>

      {/* Main Dependency Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Paragraph Call Graph Selector */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            COBOL Paragraph Call Graph
          </span>

          <div className="space-y-2">
            {Object.keys(DEPENDENCY_DATA).map((pKey) => {
              const dep = DEPENDENCY_DATA[pKey];
              const isSelected = selectedParagraph === pKey;

              return (
                <div
                  key={pKey}
                  onClick={() => setSelectedParagraph(pKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {dep.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {dep.loc}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-2">
                    Rule {dep.ruleId} • {dep.type}
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500">{dep.callers.length} Callers</span>
                    <Badge variant={dep.riskVariant} size="xs">
                      {dep.riskRating.split(' ')[0]} Risk
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copybook Link Card */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-semibold text-slate-800 font-mono text-[11px] block">
              Copybook Reference: ACCTREC.cpy
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Included by <code>PENALTY.cbl</code> to bind customer account record layouts. Provides external record schema across batch modules.
            </p>
          </div>
        </div>

        {/* Right: Detailed Blast Radius & Ripple Analysis */}
        <div className="lg:col-span-8 space-y-4">
          <Card
            title={`Blast Radius: ${currentDep.name}`}
            subtitle={`Grounded in ${currentDep.loc} • Associated Rule ${currentDep.ruleId}`}
            badge={
              <Badge variant={currentDep.riskVariant} size="xs">
                {currentDep.riskRating}
              </Badge>
            }
          >
            <div className="space-y-4 text-xs text-slate-700">
              {/* Call Chain Diagram */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-900 text-xs block">
                  Invocation Call Flow:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Upstream Caller</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                      {currentDep.callers.join(', ') || 'Root Invocations'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-center font-semibold">
                    <span className="text-[10px] text-blue-700 uppercase font-mono block">Target Paragraph</span>
                    <span className="font-mono text-blue-900 text-[11px] truncate block mt-0.5">
                      {currentDep.name}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Callee Paragraphs</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                      {currentDep.callees.join(', ') || 'Leaf Routine'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Items Read vs. Mutated */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block text-[11px]">
                    WORKING-STORAGE Items Read:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentDep.dataRead.map((item, idx) => (
                      <span key={idx} className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block text-[11px]">
                    WORKING-STORAGE Items Modified:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentDep.dataMutated.map((item, idx) => (
                      <span key={idx} className="font-mono text-[10px] px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Downstream Ripple Targets */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-900 block text-[11px]">
                  Potential Downstream Impact Areas:
                </span>
                <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                  {currentDep.downstreamImpact.map((impact, idx) => (
                    <li key={idx} className="font-mono">{impact}</li>
                  ))}
                </ul>
              </div>

              {/* Unsupported Constructs / Modernization Warnings */}
              {currentDep.unsupportedConstructs.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                  <span className="font-bold text-[11px] block">
                    Modernization Warnings & Blindspots:
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-slate-700 list-disc list-inside">
                    {currentDep.unsupportedConstructs.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Navigation Action */}
              <div className="pt-2 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => onNavigate('business-logic')}
                >
                  &larr; View Rule Citations
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => onNavigate('modernization-report')}
                >
                  Generate Modernization Assessment &rarr;
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
