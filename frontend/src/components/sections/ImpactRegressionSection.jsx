import { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  GitFork, 
  ArrowRight, 
  Layers, 
  TestTube, 
  CheckCircle2
} from 'lucide-react';
import { 
  REGRESSION_TEST_SCENARIOS 
} from '../../data/mockCobolData';
import { useProject } from '../../context/ProjectContext';
import { toRegressionScenarios } from '../../data/liveAdapters';

export default function ImpactRegressionSection({ 
  isReassessed = false, 
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('BLAST_RADIUS'); // 'BLAST_RADIUS' | '4R_SIMULATOR' | 'REGRESSION_TESTS'
  const { findings, impactMap } = useProject();
  // Live suggestions from the backend. The mock scenarios are used only when no project is loaded.
  const liveScenarios = toRegressionScenarios(impactMap, findings);
  const scenarios = liveScenarios.length > 0 ? liveScenarios : REGRESSION_TEST_SCENARIOS;
  const [selectedParagraph, setSelectedParagraph] = useState('2100-CALCULATE-PENALTY');
  const [selectedStrategy, setSelectedStrategy] = useState('REFACTOR');
  // Paragraph dependency relationships
  const PARAGRAPH_DEPENDENCIES = {
    '2100-CALCULATE-PENALTY': {
      name: '2100-CALCULATE-PENALTY',
      ruleId: 'BR-001',
      loc: 'Lines 37–44',
      incomingCallers: ['2000-PROCESS-PAYMENT (PERFORM)'],
      outgoingCalls: [],
      dataRead: ['WS-BALANCE', 'WS-PENALTY-THRESHOLD', 'WS-DEFAULT-PENALTY'],
      dataMutated: ['WS-PENALTY'],
      blastRadius: 'Medium (Baseline) / High (Disputed with INC-101)',
      blastScore: 78,
      rippleCount: 4,
      affectedDownstream: [
        '2000-PROCESS-PAYMENT (Deducts penalty from balance)',
        'WS-BALANCE (Net customer ledger balance)',
        'Monthly Statement Billing Batch (JCL STEP 04)',
        'Retail Core General Ledger Journal (GL-2041)'
      ]
    },
    '2000-PROCESS-PAYMENT': {
      name: '2000-PROCESS-PAYMENT',
      ruleId: 'BR-002',
      loc: 'Lines 31–35',
      incomingCallers: ['0000-MAIN-PROCESS (PERFORM)'],
      outgoingCalls: ['2100-CALCULATE-PENALTY (PERFORM)'],
      dataRead: ['WS-BALANCE', 'WS-PENALTY'],
      dataMutated: ['WS-BALANCE'],
      blastRadius: 'High (Direct Balance Mutation)',
      blastScore: 89,
      rippleCount: 6,
      affectedDownstream: [
        'WS-BALANCE (State mutated)',
        '1000-CHECK-ACCOUNT-STATUS (Evaluates post-settlement overdraft)',
        'Core Banking Ledger DB',
        'Customer SMS Notification Dispatcher'
      ]
    },
    '1000-CHECK-ACCOUNT-STATUS': {
      name: '1000-CHECK-ACCOUNT-STATUS',
      ruleId: 'BR-003',
      loc: 'Lines 24–29',
      incomingCallers: ['0000-MAIN-PROCESS (PERFORM)'],
      outgoingCalls: [],
      dataRead: ['WS-BALANCE'],
      dataMutated: ['WS-ACCOUNT-STATUS'],
      blastRadius: 'Low (Self-Contained Classification)',
      blastScore: 25,
      rippleCount: 2,
      affectedDownstream: [
        'WS-ACCOUNT-STATUS ("ACTIVE" / "OVERDRAWN")',
        'Downstream Withdrawal Authorization Gate'
      ]
    }
  };

  const selectedDep = PARAGRAPH_DEPENDENCIES[selectedParagraph];

  // 4R Strategy simulation matrices
  const SIMULATION_MATRIX = {
    RETAIN: {
      action: 'Retain COBOL in Place via Modern Facade / ACL',
      risk: 'Lowest Immediate Risk',
      riskVariant: 'neutral',
      complexity: 'Low',
      characterizationEffort: 'Minimal (Contract tests only)',
      targetJava: 'REST Anti-Corruption Layer delegating to Mainframe CICS RPC',
      blastDescription: 'Zero code alteration inside COBOL. Impact isolated to API adapter and network serialization layer.'
    },
    REFACTOR: {
      action: 'Refactor Paragraph into Java 21 Spring Boot Service',
      risk: isReassessed ? 'High Risk (Disputed Exemption Logic)' : 'Medium Managed Risk',
      riskVariant: isReassessed ? 'danger' : 'amber',
      complexity: 'Moderate',
      characterizationEffort: 'Comprehensive (5 JUnit characterization scenarios)',
      targetJava: 'com.bank.penalty.domain.service.PenaltyCalculationService.java',
      blastDescription: 'Replaces COBOL paragraph logic with Java 21 Spring Service. Full regression test suite must execute dual-run verification before cut-over.'
    },
    REPLACE: {
      action: 'Replace with SaaS / Vendor Billing Engine',
      risk: 'High Architecture Shift',
      riskVariant: 'danger',
      complexity: 'High',
      characterizationEffort: 'Heavy (Schema transformation & API mapping)',
      targetJava: 'Cloud-Native SaaS Billing Connector (@FeignClient)',
      blastDescription: 'Purges custom deduction code in favor of external package. Significant integration overhead and schema mapping risk.'
    },
    REMOVE: {
      action: 'Decommission & Purge Routine',
      risk: 'Critical / Prohibited',
      riskVariant: 'danger',
      complexity: 'Extreme',
      characterizationEffort: 'Prohibited while caller count > 0',
      targetJava: 'N/A (Decommissioned)',
      blastDescription: 'Cannot remove paragraph 2100 while 2000-PROCESS-PAYMENT continues to perform it. Incoming caller count must equal zero.'
    }
  };

  const currentSim = SIMULATION_MATRIX[selectedStrategy];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Innovation 3: Blast Radius & Regression
            </span>
            <Badge variant="purple" size="xs" dot>
              COBOL Dependency Intelligence
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GitFork className="w-6 h-6 text-purple-400 shrink-0" />
            Modernization Impact & Regression Intelligence
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Trace paragraph call relationships, measure data item blast radii, simulate 4R modernization strategies, and generate grounded JUnit 5 characterization regression tests before code changes begin.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('modernization-roadmap')}
          >
            Modernization Roadmap
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('BLAST_RADIUS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'BLAST_RADIUS'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          Paragraph Dependencies & Blast Radius
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('4R_SIMULATOR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === '4R_SIMULATOR'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-blue-600" />
          4R Modernization Simulator
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REGRESSION_TESTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'REGRESSION_TESTS'
              ? 'bg-white text-emerald-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TestTube className="w-3.5 h-3.5 text-emerald-600" />
          Characterization Regression Suite (5)
        </button>
      </div>

      {/* Tab 1: Dependencies & Blast Radius */}
      {activeTab === 'BLAST_RADIUS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Paragraph Selector */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">
              COBOL Paragraphs (PENALTY.cbl)
            </span>
            {Object.keys(PARAGRAPH_DEPENDENCIES).map(pKey => {
              const dep = PARAGRAPH_DEPENDENCIES[pKey];
              const isSelected = pKey === selectedParagraph;

              return (
                <div
                  key={pKey}
                  onClick={() => setSelectedParagraph(pKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50/70 border-purple-400 shadow-xs ring-1 ring-purple-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {dep.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dep.loc}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Rule {dep.ruleId} • Blast Score: {dep.blastScore}/100
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span>{dep.incomingCallers.length} Callers</span>
                    <span>{dep.rippleCount} Ripple Targets</span>
                  </div>
                </div>
              );
            })}

            {/* Copybook Link Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-semibold text-slate-900 block font-mono">
                Included Copybook: ACCTREC.cpy
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Shared record layout defining <code>WS-PAYMENT-EXT-FLAG</code>. Referenced by downstream batch streams.
              </p>
            </div>
          </div>

          {/* Blast Radius Details */}
          <div className="lg:col-span-8 space-y-4">
            <Card
              title={`Blast Radius Analysis: ${selectedDep.name}`}
              subtitle={`Grounding in ${selectedDep.loc} • Rule ${selectedDep.ruleId}`}
              badge={<Badge variant="purple">Blast Score: {selectedDep.blastScore}/100</Badge>}
            >
              <div className="space-y-4 text-xs">
                {/* Visual Flow / Call Chain */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <span className="font-semibold text-slate-900 text-xs block">
                    Execution Call Chain & Data Flow:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Upstream Callers */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">
                        Incoming Callers (PERFORM)
                      </span>
                      {selectedDep.incomingCallers.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">None (Root entry)</span>
                      ) : (
                        selectedDep.incomingCallers.map((c, i) => (
                          <div key={i} className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate">
                            {c}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Target Component */}
                    <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-300 shadow-2xs space-y-1 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-semibold text-purple-700 uppercase font-mono block">
                        Target Paragraph
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-950 truncate">
                        {selectedDep.name}
                      </span>
                      <span className="text-[10px] text-purple-800">
                        {selectedDep.loc}
                      </span>
                    </div>

                    {/* Outgoing Calls */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">
                        Outgoing Calls (PERFORM)
                      </span>
                      {selectedDep.outgoingCalls.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">Leaf Paragraph (No calls)</span>
                      ) : (
                        selectedDep.outgoingCalls.map((c, i) => (
                          <div key={i} className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate">
                            {c}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Items Read & Mutated */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-semibold text-slate-900 block">
                      WORKING-STORAGE Items Read:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDep.dataRead.map((item, idx) => (
                        <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-semibold text-slate-900 block">
                      WORKING-STORAGE Items Mutated:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDep.dataMutated.map((item, idx) => (
                        <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Downstream Blast Radius List */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-900 block">
                    Direct Downstream Blast Radius:
                  </span>
                  <div className="space-y-1.5">
                    {selectedDep.affectedDownstream.map((t, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                          <span className="text-slate-800 font-mono text-[11px]">{t}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ripple Target {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: 4R Modernization Simulator */}
      {activeTab === '4R_SIMULATOR' && (
        <div className="space-y-5">
          <Card
            title="4R Modernization Action Simulator"
            subtitle="Evaluate the architectural trade-offs, blast radius, and characterization effort of each strategy"
            badge={<Badge variant="info">Action Simulator</Badge>}
          >
            <div className="space-y-5 text-xs">
              {/* Strategy Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['RETAIN', 'REFACTOR', 'REPLACE', 'REMOVE'].map((strat) => {
                  const isSelected = selectedStrategy === strat;
                  return (
                    <button
                      key={strat}
                      type="button"
                      onClick={() => setSelectedStrategy(strat)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs mb-1">
                        {strat}
                      </div>
                      <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {strat === 'RETAIN' && 'Encapsulate & Wrap'}
                        {strat === 'REFACTOR' && 'Java 21 Spring Boot'}
                        {strat === 'REPLACE' && 'SaaS / Vendor'}
                        {strat === 'REMOVE' && 'Purge & Retire'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Simulation Output Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-sm text-slate-900">
                    {currentSim.action}
                  </div>
                  <Badge variant={currentSim.riskVariant}>
                    {currentSim.risk}
                  </Badge>
                </div>

                <p className="text-slate-700 leading-relaxed text-xs">
                  {currentSim.blastDescription}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Architectural Complexity
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {currentSim.complexity}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Characterization Testing
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {currentSim.characterizationEffort}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Target Java 21 Artifact
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700 truncate block">
                      {currentSim.targetJava.split('.').pop()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Target Scope: Paragraph 2100-CALCULATE-PENALTY & Rule BR-001
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('decision-center')}
                >
                  Configure Approval in Decision Center
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Characterization Regression Test Scenarios */}
      {activeTab === 'REGRESSION_TESTS' && (
        <div className="space-y-4">
          <Card
            title="JUnit 5 Characterization Regression Test Suite"
            subtitle="Derived from extracted COBOL boundary conditions to guarantee zero functional divergence in Java 21"
            badge={<Badge variant="success">5 Scenarios Generated</Badge>}
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs">
                    Test assertions are directly synthesized from <code>PENALTY.cbl</code> lines 24–44 and <code>INC-101</code> dispute evidence.
                  </span>
                </div>
                <Badge variant="success" size="xs">Dual-Run Ready</Badge>
              </div>

              {/* Scenarios Table */}
              <div className="space-y-3">
                {scenarios.map((scen) => (
                  <div
                    key={scen.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {scen.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {scen.title}
                        </span>
                      </div>
                      <Badge 
                        variant={scen.status.includes('Validation') ? 'warning' : 'success'} 
                        size="xs"
                      >
                        {scen.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                          Boundary Condition
                        </span>
                        <span className="text-slate-800 font-mono">
                          {scen.boundary}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                          Input Parameters
                        </span>
                        <span className="text-slate-800 font-mono">
                          {scen.inputs}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                          Expected Legacy COBOL Output
                        </span>
                        <span className="text-slate-800 font-mono">
                          {scen.expectedCobol}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Grounding: {scen.sourceGrounding}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
