import { useState } from 'react';
import UploadZone from '../ingestion/UploadZone';
import FileList from '../ingestion/FileList';
import AnalysisSummary from '../analysis/AnalysisSummary';
import FunctionExplorer from '../analysis/FunctionExplorer';
import BusinessRuleTable from '../analysis/BusinessRuleTable';
import EvidenceReadinessCard from '../analysis/EvidenceReadinessCard';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { 
  FileCode2, 
  Sparkles
} from 'lucide-react';
import { 
  DISCOVERED_FUNCTIONS, 
  BUSINESS_RULE_CANDIDATES
} from '../../data/mockBankingData';

export default function CodeEvidenceSection({
  files = [],
  setFiles,
  isAnalyzed = false,
  setIsAnalyzed,
  selectedFunctionId,
  setSelectedFunctionId,
  onLoadBankingDemo
}) {
  const [activeFileId, setActiveFileId] = useState(files[0]?.id || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'explorer' | 'code'

  const activeFile = files.find(f => f.id === activeFileId) || files[0] || null;

  const handleFilesSelected = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    if (!activeFileId && newFiles.length > 0) {
      setActiveFileId(newFiles[0].id);
    }
  };

  const handleRemoveFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId) {
        setActiveFileId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const handleClearAll = () => {
    setFiles([]);
    setActiveFileId(null);
    setIsAnalyzed(false);
  };

  const handleTriggerAnalysis = () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setAnalysisStep('1/4 Parsing Python source code and AST nodes...');

    setTimeout(() => {
      setAnalysisProgress(45);
      setAnalysisStep('2/4 Extracting function boundaries and conditional statements...');
    }, 400);

    setTimeout(() => {
      setAnalysisProgress(75);
      setAnalysisStep('3/4 Inferring business-rule candidates from penalty logic...');
    }, 800);

    setTimeout(() => {
      setAnalysisProgress(100);
      setAnalysisStep('4/4 Grounding line citations (L1–L16 in penalty_engine.py)...');
    }, 1100);

    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      if (!selectedFunctionId) {
        setSelectedFunctionId(DISCOVERED_FUNCTIONS[0].id);
      }
    }, 1400);
  };

  const handleSelectRuleFunction = (fnId) => {
    setSelectedFunctionId(fnId);
    setActiveTab('explorer');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Ingestion Pipeline
            </span>
            <Badge variant={isAnalyzed ? 'success' : 'neutral'} size="xs" dot={isAnalyzed}>
              {isAnalyzed ? 'Initial Analysis Grounded' : 'Awaiting Ingestion'}
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Source Code Ingestion & Evidence Discovery
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Upload Python source files or click <strong>Load Banking Demo</strong> to automatically parse AST nodes, identify conditional branch constraints, and establish line-level citations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="subtle"
            size="sm"
            icon={Sparkles}
            onClick={onLoadBankingDemo}
          >
            Load Banking Demo
          </Button>
          {files.length > 0 && !isAnalyzed && (
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={handleTriggerAnalysis}
              disabled={isAnalyzing}
            >
              Analyze Application
            </Button>
          )}
        </div>
      </div>

      {/* Stage 1: Upload & File Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-4">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            onLoadDemo={onLoadBankingDemo}
            disabled={isAnalyzing}
          />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <FileList
            files={files}
            activeFileId={activeFileId}
            onSelectFile={(id) => {
              setActiveFileId(id);
              setActiveTab('code');
            }}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleClearAll}
            isAnalyzed={isAnalyzed}
          />

          {files.length === 0 && (
            <div className="h-44 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 text-slate-400 text-xs">
              <FileCode2 className="w-8 h-8 text-slate-300 mb-2" />
              <span>No files selected yet.</span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Drop files on the left or click <strong>Load Banking Demo</strong> to start.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stage 2: Analysis Action & Summary Banner */}
      {files.length > 0 && (
        <AnalysisSummary
          isAnalyzing={isAnalyzing}
          analysisProgress={analysisProgress}
          analysisStep={analysisStep}
          isAnalyzed={isAnalyzed}
          onTriggerAnalysis={handleTriggerAnalysis}
          filesCount={files.length}
        />
      )}

      {/* Stage 3: Code Viewer (When raw file inspecting is selected or demo loaded) */}
      {activeFile && activeFile.content && (
        <Card
          title={`Source Code Viewer: ${activeFile.name}`}
          subtitle={`Showing full original file contents (${activeFile.loc} lines) without modification`}
          badge={
            <Badge variant="purple" size="xs">
              Read-Only Verified
            </Badge>
          }
          actions={
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                {activeFile.size} • Python 2.7/3.x
              </span>
            </div>
          }
        >
          <div className="rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
            <pre className="space-y-0.5 leading-relaxed">
              {activeFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="flex">
                  <span className="w-8 shrink-0 select-none text-slate-400 text-right pr-4">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200">
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </Card>
      )}

      {/* Stage 4: Discovered Findings (Only after Analysis has been triggered) */}
      {isAnalyzed && (
        <div className="space-y-6">
          {/* Sub-tabs for Findings */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Business Rule Candidates (3)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Function & AST Explorer (3)
              </button>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Traceability: Line-Grounded Citations Active
            </span>
          </div>

          {/* Business Rules View */}
          {activeTab === 'rules' && (
            <BusinessRuleTable
              rules={BUSINESS_RULE_CANDIDATES}
              onSelectRuleFunction={handleSelectRuleFunction}
            />
          )}

          {/* Function Explorer View */}
          {activeTab === 'explorer' && (
            <FunctionExplorer
              functions={DISCOVERED_FUNCTIONS}
              selectedFunctionId={selectedFunctionId || DISCOVERED_FUNCTIONS[0].id}
              onSelectFunction={setSelectedFunctionId}
            />
          )}

          {/* Evidence Readiness Architecture Card */}
          <EvidenceReadinessCard />
        </div>
      )}
    </div>
  );
}
