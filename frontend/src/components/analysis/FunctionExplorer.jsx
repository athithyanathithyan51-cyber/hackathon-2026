import { 
  Code2, 
  CornerDownRight, 
  GitCommit, 
  Brackets
} from 'lucide-react';
import Badge from '../common/Badge';

export default function FunctionExplorer({
  functions = [],
  selectedFunctionId,
  onSelectFunction
}) {
  const activeFn = functions.find(fn => fn.id === selectedFunctionId) || functions[0];

  if (!functions || functions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Explorer Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Function & AST Explorer
            </h3>
            <Badge variant="info" size="xs">
              {functions.length} Discovered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an extracted function to inspect its isolated logic, condition boundaries, and call dependencies.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Source: penalty_engine.py
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Left Function Navigation List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100 p-3 space-y-1.5 bg-slate-50/50">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Extracted Python Routines
          </div>
          {functions.map((fn) => {
            const isSelected = activeFn?.id === fn.id;
            return (
              <button
                key={fn.id}
                type="button"
                onClick={() => onSelectFunction(fn.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-400 shadow-xs ring-1 ring-blue-400/20'
                    : 'bg-white/80 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-slate-900 font-mono flex items-center gap-1.5">
                    <Code2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    {fn.name}()
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                    L{fn.lineStart}–L{fn.lineEnd}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {fn.summary}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Params: ({fn.parameters.join(', ')})</span>
                  <span>•</span>
                  <span>Complexity: {fn.cyclomaticComplexity}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Function Inspector Details */}
        <div className="lg:col-span-8 p-5 space-y-4">
          {activeFn ? (
            <>
              {/* Function Title & Provenance Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 font-mono">
                    def {activeFn.name}({activeFn.parameters.join(', ')}):
                  </span>
                  <Badge variant="purple" size="xs">
                    Lines {activeFn.lineStart}–{activeFn.lineEnd}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="xs">
                    File: {activeFn.file}
                  </Badge>
                </div>
              </div>

              {/* Code Snippet Viewer with Line Numbers */}
              <div className="rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
                  <span>Python Source (Isolated Function)</span>
                  <span>Lines {activeFn.lineStart}–{activeFn.lineEnd}</span>
                </div>
                <pre className="space-y-0.5 leading-relaxed">
                  {activeFn.codeSnippet.split('\n').map((line, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-8 shrink-0 select-none text-slate-400 text-right pr-4">
                        {activeFn.lineStart + idx}
                      </span>
                      <span className="text-slate-200">
                        {line}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>

              {/* Functional Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Conditions */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Brackets className="w-3.5 h-3.5 text-blue-500" />
                    Identified Conditions
                  </div>
                  {activeFn.conditions.length > 0 ? (
                    <div className="space-y-1">
                      {activeFn.conditions.map((cond, idx) => (
                        <div key={idx} className="font-mono text-blue-700 bg-blue-50/80 px-2 py-1 rounded border border-blue-100 font-medium">
                          {cond}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px]">No conditional branching (Direct execution)</div>
                  )}
                </div>

                {/* Return Behavior */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-500" />
                    Return Logic
                  </div>
                  <div className="text-slate-700 font-medium">
                    {activeFn.returnBehavior}
                  </div>
                </div>
              </div>

              {/* Call Graph Connections */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
                  Discovered Dependency Relationships
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Invoked By (Callers):</span>
                    {activeFn.callers.length > 0 ? (
                      activeFn.callers.map((c, i) => (
                        <span key={i} className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          {c}()
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">None (Root entry point)</span>
                    )}
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Sub-calls (Callees):</span>
                    {activeFn.callees.length > 0 ? (
                      activeFn.callees.map((c, i) => (
                        <span key={i} className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          {c}()
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">None (Leaf function)</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a function from the left to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
