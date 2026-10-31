import Card from '../common/Card';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  FileCode2, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  GitCommit,
  Sparkles,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { 
  BUSINESS_RULE_CANDIDATES, 
  DISCOVERED_FUNCTIONS 
} from '../../data/mockBankingData';

export default function OverviewSection({ 
  files = [], 
  isAnalyzed = false, 
  isReassessed = false,
  onNavigate,
  onLoadBankingDemo
}) {
  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-slate-800 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              LegacyIQ Core Engine
            </span>
            <Badge variant={isReassessed ? 'danger' : isAnalyzed ? 'success' : 'purple'} size="sm" dot={isAnalyzed}>
              {isReassessed ? 'v2.0 Reassessed (1 Disputed Rule)' : isAnalyzed ? 'v1.0 Baseline Analysis Active' : 'Awaiting Code Ingestion'}
            </Badge>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
              Simulated Demo Mode
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Adaptive Evidence-Driven Legacy Modernization
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            LegacyIQ helps developers rigorously understand legacy applications before refactoring. Ingest Python code to discover implicit business rules, tie findings to line-level evidence, and continuously update risk ratings when production incidents arrive.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onNavigate('code-evidence')}
            >
              {isReassessed ? 'View v2.0 Rule Findings' : isAnalyzed ? 'Inspect Discovered Rules' : 'Start Code Ingestion'}
            </Button>
            {!isAnalyzed && (
              <Button
                variant="secondary"
                size="sm"
                icon={Sparkles}
                onClick={() => {
                  onLoadBankingDemo();
                  onNavigate('code-evidence');
                }}
              >
                Load Banking Demo
              </Button>
            )}
            <Button
              variant="subtle"
              size="sm"
              icon={BrainCircuit}
              onClick={() => onNavigate('adaptive-intelligence')}
            >
              {isReassessed ? 'Review v2.0 Comparison' : 'Adaptive Intelligence'}
            </Button>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI / Metric Grid (Grounded in Actual Analysis State) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Evidence Artifacts"
          value={isReassessed ? '2' : isAnalyzed ? '1' : `${files.length}`}
          subtext={isReassessed ? 'AST Code + Incident INC-101' : isAnalyzed ? 'penalty_engine.py (16 LOC)' : files.length > 0 ? `${files.length} staged for analysis` : 'No files loaded'}
          icon={FileCode2}
          accentColor="blue"
          badge={isReassessed ? 'Multi-Source' : isAnalyzed ? 'Analyzed' : 'Staged'}
        />
        <StatCard
          title="Functions Discovered"
          value={isAnalyzed ? `${DISCOVERED_FUNCTIONS.length}` : '—'}
          subtext={isAnalyzed ? 'AST isolated routines' : 'Run analysis to extract'}
          icon={Layers}
          accentColor="emerald"
          badge={isReassessed ? 'v2.0' : isAnalyzed ? 'v1.0' : 'Pending'}
        />
        <StatCard
          title="Business Rules"
          value={isAnalyzed ? `${BUSINESS_RULE_CANDIDATES.length}` : '—'}
          subtext={isReassessed ? '1 rule flagged with contradiction' : isAnalyzed ? 'Minimum balance & overdraft' : 'Awaiting AST parsing'}
          icon={ShieldCheck}
          accentColor={isReassessed ? 'rose' : 'purple'}
          badge={isReassessed ? 'Dispute Active' : isAnalyzed ? 'Grounded' : 'Pending'}
        />
        <StatCard
          title="Modernization Risk"
          value={isReassessed ? 'High' : isAnalyzed ? 'Medium' : '—'}
          subtext={isReassessed ? 'Exemption policy divergence' : isAnalyzed ? 'Deterministic transaction fee' : 'Awaiting analysis'}
          icon={isReassessed ? ShieldAlert : GitCommit}
          accentColor={isReassessed ? 'rose' : 'amber'}
          badge={isReassessed ? 'Elevated' : isAnalyzed ? 'Baseline' : 'Pending'}
        />
      </div>

      {/* Recent Analysis / Project Card for the Banking Application */}
      <Card
        title="Active Modernization Project: Retail Banking Core"
        subtitle="Sample legacy banking application demonstrating the 3-stage LegacyIQ modernization workflow"
        badge={
          <Badge variant={isReassessed ? 'danger' : isAnalyzed ? 'success' : 'purple'} size="xs" dot={isAnalyzed}>
            {isReassessed ? 'Analysis Version: v2.0 (Reassessed)' : isAnalyzed ? 'Analysis Version: v1.0' : 'Ready for Ingestion'}
          </Badge>
        }
        actions={
          <Button
            variant="secondary"
            size="xs"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate(isReassessed ? 'adaptive-intelligence' : 'code-evidence')}
          >
            {isReassessed ? 'Compare v1.0 vs v2.0' : isAnalyzed ? 'View Findings' : 'Open Ingestion Studio'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Application Target
              </span>
              <div className="font-semibold text-slate-900 font-mono">
                penalty_engine.py
              </div>
              <div className="text-[11px] text-slate-500">
                Core deposit accounting & penalty fee settlement
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Active Version Snapshot
              </span>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                {isReassessed ? 'v2.0 (Adaptive Reassessment)' : isAnalyzed ? 'v1.0 (Initial Code Ingestion)' : 'v0.0 (Unanalyzed)'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isReassessed ? 'Reassessed with Production Incident INC-101' : isAnalyzed ? 'Grounded in static Python AST' : 'Click "Analyze Application" to execute'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Evidence Maturity
              </span>
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isReassessed ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {isReassessed ? 'AST + Incident Stream Active' : 'Source AST Active'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isReassessed ? 'Policy docs & SQL schema scheduled' : 'Incident & ticket stream pending Phase 3'}
              </div>
            </div>
          </div>

          {/* If analyzed, show preview of discovered business rules */}
          {isAnalyzed && (
            <div className={`p-4 rounded-xl border space-y-2 text-xs ${
              isReassessed 
                ? 'bg-amber-50/50 border-amber-200' 
                : 'bg-blue-50/50 border-blue-100'
            }`}>
              <div className="flex items-center justify-between font-semibold">
                <span className={isReassessed ? 'text-amber-950 flex items-center gap-1.5' : 'text-blue-950'}>
                  {isReassessed && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {isReassessed ? 'Reassessed Rule BR-001 (Contradiction Flagged):' : 'Key Business Rule Discovered in Initial Analysis:'}
                </span>
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                  isReassessed 
                    ? 'text-rose-700 bg-rose-100/70 font-bold' 
                    : 'text-blue-700 bg-blue-100/70'
                }`}>
                  {isReassessed ? 'BR-001 • Disputed in v2.0' : 'Rule BR-001 (Line 2)'}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {isReassessed ? (
                  <span>
                    Initial rule charged ₹50 for balance &lt; 1,000. <strong>Incident INC-101 indicates customers with approved payment extensions should be exempt.</strong> Modernization verdict changed from "Direct Refactor" to "Investigate Policy".
                  </span>
                ) : (
                  <span>
                    Accounts with balances below <strong>₹1,000</strong> are automatically assessed a <strong>₹50 penalty</strong> in <code className="text-blue-900 bg-blue-100/50 px-1 py-0.5 rounded font-mono">calculate_penalty(balance)</code>.
                  </span>
                )}
              </p>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-500">
                <span>• Observed fact: <code className="text-slate-700">if balance &lt; 1000: return 50</code></span>
                <span>• Certainty score: <strong className={isReassessed ? 'text-rose-700' : 'text-slate-700'}>{isReassessed ? '64% (Requires Validation)' : '94%'}</strong></span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Three Core Innovations Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          title="Innovation 1"
          subtitle="Adaptive Evidence Intelligence"
          badge={<Badge variant={isReassessed ? 'success' : 'purple'}>{isReassessed ? 'v2.0 Active' : 'Phase 3'}</Badge>}
          className="hover:border-blue-300 transition-all"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
              Dynamically ingests post-release incidents and tickets, links them to previously discovered code components, and flags conflicting assumptions.
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Continuous evidence updates</li>
              <li>Contradictory rule alerts</li>
              <li>Versioned analysis diffs (v1 → v2)</li>
            </ul>
            <div className="pt-2">
              <Button
                variant={isReassessed ? 'primary' : 'subtle'}
                size="xs"
                className="w-full justify-between"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('adaptive-intelligence')}
              >
                {isReassessed ? 'Inspect v1 vs v2 Comparison' : 'Inspect Adaptive Engine'}
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="Innovation 2"
          subtitle="Evidence-Gated Decisions"
          badge={<Badge variant="info">Phase 4</Badge>}
          className="hover:border-blue-300 transition-all"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
              Eliminates ungrounded LLM hallucinations by requiring verifiable evidence citations before recommending Retain, Refactor, Replace, or Remove.
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Observed vs Documented flags</li>
              <li>Explicit uncertainty tags</li>
              <li>Human approval sign-off gate</li>
            </ul>
            <div className="pt-2">
              <Button
                variant="subtle"
                size="xs"
                className="w-full justify-between"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('decision-center')}
              >
                Inspect Decision Center
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="Innovation 3"
          subtitle="Modernization Blast Radius"
          badge={<Badge variant="warning">Phase 5</Badge>}
          className="hover:border-blue-300 transition-all"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
              Interactive dependency graph and impact simulator predicting database column ripples and auto-generating characterization regression test cases.
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Multi-tier blast radius graph</li>
              <li>4R modernization action simulator</li>
              <li>Automated regression scenario specs</li>
            </ul>
            <div className="pt-2">
              <Button
                variant="subtle"
                size="xs"
                className="w-full justify-between"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('impact-simulator')}
              >
                Inspect Impact Simulator
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
