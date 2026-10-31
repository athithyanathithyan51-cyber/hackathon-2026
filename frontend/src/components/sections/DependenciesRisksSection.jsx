import { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useProject } from '../../context/ProjectContext';

export default function DependenciesRisksSection({ onNavigate }) {
  const {
    dependencies,
    findings,
    report,
    isReassessed,
    isBackendOnline,
    evaluateImpact,
    impactMap,
    referenceParagraphs
  } = useProject();

  const [selectedParagraph, setSelectedParagraph] = useState('2100-CALCULATE-PENALTY');

  // Trigger impact assessment when paragraph changes if finding exists
  useEffect(() => {
    const matchingFinding = findings.find(f => f.function === selectedParagraph);
    if (matchingFinding && !impactMap[matchingFinding.id]) {
      evaluateImpact(matchingFinding.id);
    }
  }, [selectedParagraph, findings, impactMap, evaluateImpact]);

  // Build dependency items from backend or reference
  const dependencyItems = useMemo(() => {
    // Collect all unique paragraphs
    const paraEntries = [];

    // From backend dependencies
    Object.keys(dependencies).forEach(k => {
      const parts = k.split(':');
      const file = parts.length > 1 ? parts[0] : '';
      const paraName = parts.length > 1 ? parts[1] : parts[0];
      if (!paraEntries.some(p => p.name === paraName && p.file === file)) {
        paraEntries.push({ name: paraName, file });
      }
    });

    // From backend findings
    findings.forEach(f => {
      if (!paraEntries.some(p => p.name === f.function)) {
        paraEntries.push({ name: f.function, file: f.file || '' });
      }
    });

    // Default reference list if empty
    if (paraEntries.length === 0) {
      paraEntries.push(
        { name: '2100-CALCULATE-PENALTY', file: 'PENALTY.cbl' },
        { name: '2000-PROCESS-PAYMENT', file: 'PENALTY.cbl' },
        { name: '1000-CHECK-ACCOUNT-STATUS', file: 'PENALTY.cbl' }
      );
    }

    return paraEntries.map((entry, idx) => {
      const paraName = entry.name;
      const file = entry.file;

      // Look up in backend dependencies
      const matchingKey = Object.keys(dependencies).find(
        k => k === `${file}:${paraName}` || k.endsWith(`:${paraName}`) || k === paraName
      );
      const callees = matchingKey ? dependencies[matchingKey] : (paraName === '2000-PROCESS-PAYMENT' ? ['2100-CALCULATE-PENALTY'] : []);
      
      // Look up callers (who calls this paragraph?)
      const callers = Object.keys(dependencies)
        .filter(k => dependencies[k]?.includes(paraName))
        .map(k => k.includes(':') ? k.split(':')[1] : k);

      // Look up finding for risk score
      const finding = findings.find(f => f.function === paraName && (!file || f.file === file));
      const impact = finding ? impactMap[finding.id] : null;

      const riskCategory = impact?.risk_category || finding?.risk_category || (paraName === '2100-CALCULATE-PENALTY' && isReassessed ? 'CRITICAL' : paraName === '1000-CHECK-ACCOUNT-STATUS' ? 'LOW' : 'HIGH');
      const riskScore = impact?.risk_score || finding?.risk_score || (riskCategory === 'CRITICAL' ? 90 : riskCategory === 'HIGH' ? 65 : 25);

      const refPara = referenceParagraphs.find(p => p.name === paraName);

      return {
        name: paraName,
        file: file || 'PENALTY.cbl',
        loc: refPara ? `Lines ${refPara.lineStart}–${refPara.lineEnd}` : finding ? `Line ${finding.start_line}` : 'PROCEDURE DIVISION',
        ruleId: finding ? finding.id.slice(0, 8) : refPara ? `BR-00${idx + 1}` : 'BR-EXT',
        callers: callers.length > 0 ? callers.map(c => `${c} (PERFORM)`) : (paraName === '2100-CALCULATE-PENALTY' ? ['2000-PROCESS-PAYMENT (PERFORM)'] : ['0000-MAIN-PROCESS (PERFORM)']),
        callees: callees.length > 0 ? callees.map(c => `${c} (PERFORM)`) : [],
        dataRead: refPara?.dataItemsRead || ['WS-BALANCE'],
        dataMutated: refPara?.dataItemsModified || ['WS-BALANCE'],
        riskRating: `${riskCategory} (${riskScore}/100)`,
        riskCategory,
        riskScore,
        riskReasons: impact?.risk_reasons || (riskCategory === 'CRITICAL' ? ['Production incident INC-101 reports conflicting logic', 'Missing payment extension exemption check'] : ['State variable mutation during transaction processing']),
        downstreamImpact: impact?.affected || [
          paraName === '2100-CALCULATE-PENALTY' 
            ? '2000-PROCESS-PAYMENT (Mutates balance during settlement)' 
            : 'Core Banking Ledger Database'
        ]
      };
    });
  }, [dependencies, findings, impactMap, isReassessed, referenceParagraphs]);

  const currentDep = dependencyItems.find(d => d.name === selectedParagraph) || dependencyItems[0];

  return (
    <div className="space-y-5">
      {/* Header Banner - White-Primary */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
              Architecture Analysis
            </span>
            <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
              {isBackendOnline ? 'Live Backend Call Graph' : 'Reference Model'}
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Dependencies & Modernization Blast Radius
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Trace PERFORM and CALL relationships, inspect WORKING-STORAGE state mutations, identify downstream ripple effects, and review potential modernization blindspots before refactoring.
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
            {dependencyItems.map((dep) => {
              const isSelected = selectedParagraph === dep.name;

              return (
                <div
                  key={dep.name}
                  onClick={() => setSelectedParagraph(dep.name)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-900 truncate">
                      {dep.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {dep.loc}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-2 truncate">
                    {dep.callers.length} Caller(s) &rarr; {dep.callees.length} Callee(s)
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-mono">Rule: {dep.ruleId}</span>
                    <Badge variant={dep.riskCategory === 'CRITICAL' ? 'danger' : dep.riskCategory === 'HIGH' ? 'warning' : 'success'} size="xs">
                      {dep.riskCategory} ({dep.riskScore})
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
              <Badge variant={currentDep.riskCategory === 'CRITICAL' ? 'danger' : currentDep.riskCategory === 'HIGH' ? 'warning' : 'success'} size="xs">
                {currentDep.riskRating}
              </Badge>
            }
          >
            <div className="space-y-4 text-xs text-slate-700">
              {/* Call Chain Diagram */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-900 text-xs block">
                  Invocation Call Flow (PERFORM / CALL):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Upstream Caller</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                      {currentDep.callers.join(', ') || 'Root Entry'}
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

              {/* Risk Reasons from Engine */}
              {currentDep.riskReasons && currentDep.riskReasons.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-semibold text-slate-900 block text-[11px]">
                    Risk Assessment Factors (Engine Evaluated):
                  </span>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                    {currentDep.riskReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

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

              {/* Actual Unsupported Constructs from Backend Report if any */}
              {report?.verification?.unsupported && report.verification.unsupported.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                  <span className="font-bold text-[11px] block">
                    Unsupported Constructs Flagged by Engine:
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-slate-700 list-disc list-inside">
                    {report.verification.unsupported.map((u, idx) => (
                      <li key={idx}>
                        <code>{u.construct}</code> at line {u.line} in {u.file}
                      </li>
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
