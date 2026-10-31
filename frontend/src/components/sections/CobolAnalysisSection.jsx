import { useState, useMemo, useRef, useEffect } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useProject } from '../../context/ProjectContext';
import { SAMPLE_GITHUB_COBOL_URLS } from '../../services/githubService';
import { analyzeFileContent } from '../../services/cobolAnalysisHelper';

export default function CobolAnalysisSection({ onNavigate }) {
  const {
    activeFile,
    stagedFiles,
    selectFile,
    zipSummary,
    zipProgress,
    uploadZipProject,
    isAnalyzing,
    analysisError,
    analysisSuccess,
    clearMessages,
    findings,
    dependencies,
    report,
    isBackendOnline,
    ingestGitHubFile,
    isReassessed,
    navigationTarget,
    clearNavigationTarget
  } = useProject();

  // Ingestion Mode Tab: 'GITHUB' | 'ZIP'
  const [ingestionTab, setIngestionTab] = useState('GITHUB');

  // GitHub URL Input state
  const [githubUrl, setGithubUrl] = useState('');

  // Drag and drop state for ZIP
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const fileInputRef = useRef(null);
  const codeViewerRef = useRef(null);

  // File explorer filter state
  const [fileFilterText, setFileFilterText] = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState('ALL'); // 'ALL' | 'COBOL' | 'COPYBOOKS' | 'OTHER'

  // Viewer state
  const [userParagraphName, setUserParagraphName] = useState(null);
  const [userRuleId, setUserRuleId] = useState(null);
  const [userHighlightedLines, setUserHighlightedLines] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTab, setUserTab] = useState(null);

  // Synchronize state with navigationTarget timestamp during render
  const [prevNavTimestamp, setPrevNavTimestamp] = useState(navigationTarget?.timestamp);
  if (navigationTarget?.timestamp !== prevNavTimestamp) {
    setPrevNavTimestamp(navigationTarget?.timestamp);
    setUserParagraphName(null);
    setUserRuleId(null);
    setUserHighlightedLines(null);
    setUserTab(null);
  }

  const rightPanelTab = userTab || (navigationTarget?.ruleId ? 'RULES' : navigationTarget?.tab) || 'RULES';
  const setRightPanelTab = setUserTab;

  const selectedRuleId = userRuleId !== null ? userRuleId : (navigationTarget?.ruleId || null);
  const setSelectedRuleId = setUserRuleId;

  const selectedParagraphName = userParagraphName !== null ? userParagraphName : (navigationTarget?.paragraph || null);
  const setSelectedParagraphName = setUserParagraphName;

  const highlightedLines = userHighlightedLines !== null 
    ? userHighlightedLines 
    : (navigationTarget?.lines || null);
  const setHighlightedLines = setUserHighlightedLines;

  // DYNAMIC FILE-SPECIFIC ANALYSIS: Extract AST, data items, and structure for activeFile
  const fileAnalysis = useMemo(() => {
    return analyzeFileContent(activeFile);
  }, [activeFile]);

  // Filtered files in Project File Explorer
  const filteredFiles = useMemo(() => {
    return stagedFiles.filter(file => {
      const matchesSearch = !fileFilterText || 
        file.name.toLowerCase().includes(fileFilterText.toLowerCase()) ||
        (file.relativePath && file.relativePath.toLowerCase().includes(fileFilterText.toLowerCase()));

      if (!matchesSearch) return false;

      const ext = (file.extension || '').toLowerCase().replace(/^\./, '');
      if (fileCategoryFilter === 'COBOL') {
        return file.classification === 'cobol_program' || ext === 'cbl' || ext === 'cob';
      }
      if (fileCategoryFilter === 'COPYBOOKS') {
        return file.classification === 'copybook' || ext === 'cpy';
      }
      if (fileCategoryFilter === 'OTHER') {
        return file.classification !== 'cobol_program' && file.classification !== 'copybook' &&
          ext !== 'cbl' && ext !== 'cob' && ext !== 'cpy';
      }

      return true;
    });
  }, [stagedFiles, fileFilterText, fileCategoryFilter]);

  // Category counts
  const fileCategoryCounts = useMemo(() => {
    const cobol = stagedFiles.filter(f => {
      const ext = (f.extension || '').toLowerCase().replace(/^\./, '');
      return f.classification === 'cobol_program' || ext === 'cbl' || ext === 'cob';
    }).length;
    const copybooks = stagedFiles.filter(f => {
      const ext = (f.extension || '').toLowerCase().replace(/^\./, '');
      return f.classification === 'copybook' || ext === 'cpy';
    }).length;
    const other = stagedFiles.length - cobol - copybooks;
    return { all: stagedFiles.length, cobol, copybooks, other };
  }, [stagedFiles]);

  // Extract paragraphs for the active file
  const activeParagraphs = useMemo(() => {
    if (fileAnalysis.fileType !== 'cobol_program') {
      return [];
    }
    return fileAnalysis.paragraphs;
  }, [fileAnalysis]);

  // DYNAMIC RULES FOR ACTIVE FILE ONLY
  const activeFileRules = useMemo(() => {
    if (!activeFile) return [];
    const ext = (activeFile.extension || '').toLowerCase().replace(/^\./, '');
    
    // Copybooks and non-COBOL files do not have business rules
    if (ext !== 'cbl' && ext !== 'cob') {
      return [];
    }

    const currentPath = activeFile.relativePath || activeFile.name;
    
    // Retrieve backend findings that strictly match this file's path
    const matchingBackend = findings.filter(f => {
      if (f.file === currentPath || f.file === activeFile.name) return true;
      if (activeFile.name === 'PENALTY.cbl' && (!f.file || f.file === 'PENALTY.cbl')) return true;
      if (f.file && currentPath.endsWith(f.file)) return true;
      return false;
    });

    if (matchingBackend.length > 0) {
      return matchingBackend.map((f, idx) => {
        const isDisputed = f.evidence_status === 'CONFLICTED_BY_EVIDENCE' || (f.function.includes('2100') && isReassessed);
        return {
          id: f.id || `BR-${idx + 1}`,
          title: f.description || `Rule in ${f.function}`,
          paragraph: f.function,
          file: f.file || currentPath,
          lines: `Line ${f.start_line}`,
          startLine: f.start_line,
          endLine: f.start_line + 4,
          observedCondition: f.description,
          status: isDisputed ? 'CONFLICTED_BY_EVIDENCE' : f.evidence_status || 'OBSERVED_IN_CODE',
          riskScore: f.risk_score,
          riskCategory: f.risk_category || 'MEDIUM',
          recommendation: f.recommendation || 'refactor',
          isLiveBackend: true
        };
      });
    }

    // Fallback: Use rules extracted from this file's own PROCEDURE DIVISION
    return fileAnalysis.rules;
  }, [activeFile, findings, isReassessed, fileAnalysis]);

  // Scroll to code line in viewer
  const scrollToLine = (lineNumber) => {
    if (!lineNumber) return;
    setTimeout(() => {
      const lineEl = document.getElementById(`source-line-${lineNumber}`);
      if (lineEl && codeViewerRef.current) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // Handle GitHub Ingestion
  const handleFetchGitHub = async (urlToFetch) => {
    const targetUrl = urlToFetch || githubUrl;
    if (!targetUrl.trim()) return;
    await ingestGitHubFile(targetUrl);
    setGithubUrl('');
  };

  // Handle ZIP File Upload
  const handleZipFileSelected = async (file) => {
    if (!file) return;
    await uploadZipProject(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingZip(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingZip(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingZip(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleZipFileSelected(file);
    }
  };

  // Handle selecting a file from explorer
  const handleSelectFile = (file) => {
    selectFile(file.id || file.name);
    clearMessages();
    setHighlightedLines(null);
    setSelectedRuleId(null);
    setSelectedParagraphName(null);
  };

  // Rule selection handler: highlights lines and scrolls to them
  const handleSelectRule = (rule) => {
    setSelectedRuleId(rule.id);
    if (rule.startLine && rule.endLine) {
      setHighlightedLines([rule.startLine, rule.endLine]);
      scrollToLine(rule.startLine);
    } else if (rule.startLine) {
      setHighlightedLines([rule.startLine, rule.startLine + 3]);
      scrollToLine(rule.startLine);
    } else {
      setHighlightedLines(null);
    }
    setSelectedParagraphName(rule.paragraph);
  };

  // Paragraph selection handler: highlights lines and scrolls
  const handleSelectParagraph = (para) => {
    setSelectedParagraphName(para.name);
    setHighlightedLines([para.lineStart, para.lineEnd]);
    scrollToLine(para.lineStart);
  };

  // Split lines for line-numbered view
  const sourceLines = useMemo(() => {
    if (!activeFile?.content) return [];
    return activeFile.content.split('\n');
  }, [activeFile]);

  // DOM scroll effect when navigation specifies line numbers
  useEffect(() => {
    if (navigationTarget?.lines && navigationTarget.lines[0]) {
      scrollToLine(navigationTarget.lines[0]);
    }
  }, [navigationTarget]);

  return (
    <div className="space-y-5">
      {/* Return to Modernization Report banner when navigated from report */}
      {navigationTarget?.from === 'modernization-report' && (
        <div className="flex items-center justify-between p-3 px-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
              Modernization Flow
            </span>
            <span>Deep dive active: Inspecting source code & AST evidence linked from Modernization Report</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearNavigationTarget();
              onNavigate('modernization-report');
            }}
            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
          >
            &larr; Back to Modernization Report
          </button>
        </div>
      )}

      {/* 1. Ingestion Card with Tabbed Modes */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                Project & Source Ingestion
              </span>
              <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
                {isBackendOnline ? 'Backend Engine Connected' : 'Offline Reference Mode'}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Ingest COBOL Programs via GitHub URL or Complete Project ZIP Archive
            </h3>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIngestionTab('GITHUB')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                ingestionTab === 'GITHUB'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GitHub URL
            </button>
            <button
              type="button"
              onClick={() => setIngestionTab('ZIP')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                ingestionTab === 'ZIP'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload ZIP Project
            </button>
          </div>
        </div>

        {/* TAB 1: GITHUB URL INGESTION */}
        {ingestionTab === 'GITHUB' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchGitHub()}
                placeholder="https://github.com/owner/repository/blob/main/PENALTY.cbl"
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                disabled={isAnalyzing}
              />

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleFetchGitHub()}
                disabled={isAnalyzing}
                className="shrink-0"
              >
                {isAnalyzing ? 'Analyzing with Engine...' : 'Fetch & Analyze Source'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSelectFile(stagedFiles[0])}
                disabled={isAnalyzing}
                className="shrink-0"
              >
                Load Sample PENALTY.cbl
              </Button>
            </div>

            {/* Quick Sample Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">Quick Samples:</span>
              {SAMPLE_GITHUB_COBOL_URLS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setGithubUrl(sample.demoValue);
                    if (sample.name.includes('PENALTY')) {
                      handleSelectFile(stagedFiles[0]);
                    } else if (stagedFiles[1]) {
                      handleSelectFile(stagedFiles[1]);
                    }
                  }}
                  className="font-mono text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                >
                  {sample.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ZIP PROJECT UPLOAD INGESTION */}
        {ingestionTab === 'ZIP' && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleZipFileSelected(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDraggingZip
                  ? 'border-blue-500 bg-blue-50/80'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                📁
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Drag and drop your project ZIP archive here, or <span className="text-blue-600 underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports archives containing COBOL programs (.cbl, .cob), copybooks (.cpy), JCL, SQL, and documentation.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                <span>Max: 25 MB compressed</span>
                <span>•</span>
                <span>Max: 50 MB uncompressed</span>
                <span>•</span>
                <span>Max: 500 entries</span>
                <span>•</span>
                <span>Path-traversal safe</span>
              </div>
            </div>

            {isAnalyzing && (
              <div className="space-y-1.5 p-3 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
                  <span>Extracting and staging project files...</span>
                  <span className="font-mono">{zipProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${zipProgress}%` }}
                  />
                </div>
              </div>
            )}

            {zipSummary && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    Extracted Project Archive Summary
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {zipSummary.totalFiles} files • {zipSummary.totalSizeFormatted}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold font-mono">
                    COBOL Programs: {zipSummary.cobolPrograms} (Supported)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                    Copybooks: {zipSummary.copybooks} (Staged)
                  </span>
                  {zipSummary.jclFiles > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                      JCL: {zipSummary.jclFiles}
                    </span>
                  )}
                  {zipSummary.sqlFiles > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                      SQL: {zipSummary.sqlFiles}
                    </span>
                  )}
                  {zipSummary.docFiles > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                      Docs: {zipSummary.docFiles}
                    </span>
                  )}
                  {zipSummary.unsupportedFiles > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                      Unsupported: {zipSummary.unsupportedFiles}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {analysisError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <span>{analysisError}</span>
            <button 
              type="button" 
              onClick={clearMessages} 
              className="text-rose-600 hover:text-rose-900 font-bold px-1 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {analysisSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
            <span>{analysisSuccess}</span>
            <button 
              type="button" 
              onClick={clearMessages} 
              className="text-emerald-600 hover:text-emerald-900 font-bold px-1 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. 3-Panel Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* =========================================================================
            LEFT PANEL: Project File Explorer & Paragraph Explorer
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          <Card
            title="Project File Explorer"
            subtitle={`${stagedFiles.length} files staged`}
            badge={
              <Badge variant="neutral" size="xs">
                {stagedFiles.length > 2 ? 'Multi-File' : 'Workspace'}
              </Badge>
            }
          >
            <div className="space-y-2.5">
              <input
                type="text"
                value={fileFilterText}
                onChange={(e) => setFileFilterText(e.target.value)}
                placeholder="Filter files..."
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFileCategoryFilter('ALL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    fileCategoryFilter === 'ALL'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({fileCategoryCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setFileCategoryFilter('COBOL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    fileCategoryFilter === 'COBOL'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  COBOL ({fileCategoryCounts.cobol})
                </button>
                <button
                  type="button"
                  onClick={() => setFileCategoryFilter('COPYBOOKS')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    fileCategoryFilter === 'COPYBOOKS'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Copybooks ({fileCategoryCounts.copybooks})
                </button>
                {fileCategoryCounts.other > 0 && (
                  <button
                    type="button"
                    onClick={() => setFileCategoryFilter('OTHER')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      fileCategoryFilter === 'OTHER'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Other ({fileCategoryCounts.other})
                  </button>
                )}
              </div>

              {/* File List */}
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                {filteredFiles.map((file) => {
                  const isSelected = file.id === activeFile?.id || file.name === activeFile?.name;
                  const ext = (file.extension || '').toLowerCase().replace(/^\./, '');
                  const isCobol = ext === 'cbl' || ext === 'cob';

                  return (
                    <button
                      key={file.id || file.relativePath || file.name}
                      type="button"
                      onClick={() => handleSelectFile(file)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-mono truncate font-medium text-[11px]">
                          {file.name}
                        </span>
                        <Badge 
                          variant={isCobol ? 'info' : ext === 'cpy' ? 'neutral' : 'warning'} 
                          size="xs"
                        >
                          {ext ? `.${ext}` : 'FILE'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[140px] text-slate-500">
                          {file.folder ? `${file.folder}/` : file.relativePath || file.name}
                        </span>
                        <span>{file.loc || file.content?.split('\n').length} L</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Paragraph Explorer (Only shown for COBOL programs with paragraphs) */}
          {activeParagraphs.length > 0 && (
            <Card
              title={`Paragraphs: ${activeFile?.name}`}
              subtitle="Click to locate in source"
              badge={<Badge variant="info" size="xs">{activeParagraphs.length}</Badge>}
            >
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {activeParagraphs.map((p) => {
                  const isSelected = selectedParagraphName === p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectParagraph(p)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 shadow-2xs font-semibold'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-slate-900 mb-0.5">
                        <span className={`truncate ${isSelected ? 'text-blue-700 font-bold' : ''}`}>{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">L{p.lineStart}–L{p.lineEnd}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        {p.performs.length > 0 ? `PERFORMs: ${p.performs.join(', ')}` : p.summary}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* =========================================================================
            CENTER PANEL: Source Code Viewer with Line Numbers, Search & Scroll
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-3">
          <Card
            title={`Source Code: ${activeFile?.name || 'Source'}`}
            subtitle={
              highlightedLines 
                ? `Highlighting Lines ${highlightedLines[0]}–${highlightedLines[1]}` 
                : `${sourceLines.length} lines • ${activeFile?.relativePath || activeFile?.name}`
            }
            badge={
              <Badge 
                variant={
                  activeFile?.extension === 'cbl' || activeFile?.extension === 'cob'
                    ? 'info'
                    : activeFile?.extension === 'cpy'
                    ? 'neutral'
                    : 'warning'
                } 
                size="xs"
              >
                {activeFile?.category || (activeFile?.isCobol ? 'COBOL Program' : 'Project File')}
              </Badge>
            }
            actions={
              highlightedLines && (
                <button
                  type="button"
                  onClick={() => setHighlightedLines(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )
            }
          >
            {/* File Support Status Notice */}
            <div className="mb-2 p-2 rounded bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
              <span className="text-slate-600">
                {activeFile?.extension === 'cbl' || activeFile?.extension === 'cob' ? (
                  <span><strong>COBOL Program:</strong> PROCEDURE DIVISION analyzed by AST engine (PROGRAM-ID: <code className="font-bold text-slate-800">{fileAnalysis.programId || 'UNSPECIFIED'}</code>).</span>
                ) : activeFile?.extension === 'cpy' ? (
                  <span><strong>Staged Copybook:</strong> Staged for field definitions. Copybooks contain no PROCEDURE DIVISION statements; business rules are not extracted.</span>
                ) : (
                  <span><strong>Inspect-only file:</strong> Staged in project explorer for reference; not ingested into COBOL AST pipeline.</span>
                )}
              </span>
              <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                {activeFile?.sizeFormatted || activeFile?.size || 'ASCII'}
              </span>
            </div>

            {/* Search within source */}
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within source file (e.g., WS-BALANCE, PERFORM, PENALTY)..."
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Code Viewer Container */}
            <div 
              ref={codeViewerRef}
              className="rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[580px] shadow-inner select-text"
            >
              <div className="py-2">
                {sourceLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isHighlighted = highlightedLines && lineNum >= highlightedLines[0] && lineNum <= highlightedLines[1];
                  const isSearchMatch = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());

                  return (
                    <div
                      key={idx}
                      id={`source-line-${lineNum}`}
                      className={`flex px-2 py-0.5 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-500/25 text-amber-200 border-l-2 border-amber-400'
                          : isSearchMatch
                          ? 'bg-blue-500/20 text-blue-200'
                          : 'hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Line Number */}
                      <span className={`w-10 shrink-0 text-right pr-4 select-none ${
                        isHighlighted ? 'text-amber-400 font-bold' : 'text-slate-400'
                      }`}>
                        {lineNum}
                      </span>

                      {/* Code Content */}
                      <span className={`whitespace-pre ${
                        line.trim().startsWith('*')
                          ? 'text-slate-400 italic'
                          : line.includes('DIVISION') || line.includes('SECTION')
                          ? 'text-blue-300 font-bold'
                          : line.includes('PERFORM') || line.includes('COMPUTE')
                          ? 'text-teal-300 font-semibold'
                          : line.includes('IF ') || line.includes('ELSE') || line.includes('END-IF')
                          ? 'text-amber-300 font-semibold'
                          : 'text-slate-200'
                      }`}>
                        {line}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Viewer Legend */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/30 border border-amber-400 inline-block" />
                Active Line Grounding
              </span>
              <span>Encoding: UTF-8 / ASCII</span>
            </div>
          </Card>
        </div>

        {/* =========================================================================
            RIGHT PANEL: DYNAMIC FILE-SPECIFIC TABS (RULES, DATA ITEMS, STRUCTURE)
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Right Panel Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setRightPanelTab('RULES')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                rightPanelTab === 'RULES'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rules ({activeFileRules.length})
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab('DATA')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                rightPanelTab === 'DATA'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data ({fileAnalysis.dataItems.length})
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab('STRUCTURE')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                rightPanelTab === 'STRUCTURE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Structure
            </button>
          </div>

          {/* TAB 1: RULES FOR ACTIVE FILE ONLY */}
          {rightPanelTab === 'RULES' && (
            <Card
              title={`Rules: ${activeFile?.name || 'File'}`}
              subtitle={
                activeFileRules.length > 0 
                  ? `${activeFileRules.length} rules belonging strictly to this file` 
                  : 'No business rules extracted'
              }
              badge={
                <Badge variant={activeFileRules.length > 0 ? 'info' : 'neutral'} size="xs">
                  {activeFileRules.length > 0 ? 'Extracted' : 'Unavailable'}
                </Badge>
              }
            >
              {activeFileRules.length > 0 ? (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {activeFileRules.map((rule) => {
                    const isSelected = selectedRuleId === rule.id;
                    const isDisputed = rule.status === 'CONFLICTED_BY_EVIDENCE';

                    return (
                      <div
                        key={rule.id}
                        onClick={() => handleSelectRule(rule)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-slate-900 truncate max-w-[150px]">
                            {rule.id.startsWith('BR-') ? rule.id.split('-').slice(0, 2).join('-') : rule.id}
                          </span>
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 font-semibold">
                            {rule.lines}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-[11px] mb-1">
                          {rule.title}
                        </div>
                        {rule.observedCondition && (
                          <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-100 mb-1.5 leading-snug">
                            {rule.observedCondition}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                          <Badge variant={isDisputed ? 'danger' : 'success'} size="xs">
                            {isDisputed ? 'CONFLICTED (INC-101)' : 'OBSERVED_IN_CODE'}
                          </Badge>
                          <span className="text-slate-400 font-mono">
                            {rule.paragraph}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Meaningful Empty State when Rules are unavailable */
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-2 text-xs">
                  <div className="text-slate-400 text-lg">📋</div>
                  <div className="font-semibold text-slate-800">
                    No Business Rules for {activeFile?.name}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {activeFile?.extension === 'cpy'
                      ? 'Copybooks define data record schemas and field layouts. They contain no PROCEDURE DIVISION statements or executable control logic, so business rules are not extracted from copybook files.'
                      : `This is an auxiliary project file (${activeFile?.classification || activeFile?.extension?.toUpperCase() || 'document'}). Business rule extraction is only performed on COBOL source programs with a PROCEDURE DIVISION.`
                    }
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: DATA ITEMS FOR ACTIVE FILE ONLY */}
          {rightPanelTab === 'DATA' && (
            <Card
              title={`Data Items: ${activeFile?.name || 'File'}`}
              subtitle={
                fileAnalysis.dataItems.length > 0 
                  ? `${fileAnalysis.dataItems.length} declarations parsed from active source` 
                  : 'No data declarations in this file'
              }
              badge={
                <Badge variant={fileAnalysis.isCopybook ? 'neutral' : 'info'} size="xs">
                  {fileAnalysis.isCopybook ? 'Copybook Schema' : 'DATA DIVISION'}
                </Badge>
              }
            >
              {fileAnalysis.dataItems.length > 0 ? (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {fileAnalysis.dataItems.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setHighlightedLines([item.line, item.line]);
                        scrollToLine(item.line);
                      }}
                      className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-[11px]">
                        <span className="truncate pr-1">
                          {item.level < 10 ? `0${item.level}` : item.level} {item.name}
                        </span>
                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 text-[10px] shrink-0">
                          {item.pic}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>
                          {item.parentGroup ? `in ${item.parentGroup}` : item.role} • L{item.line}
                        </span>
                        <span>
                          {item.value ? `VAL: ${item.value}` : item.usage || 'DISPLAY'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state for Data Items */
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-2 text-xs">
                  <div className="text-slate-400 text-lg">🗂️</div>
                  <div className="font-semibold text-slate-800">
                    No Data Items in {activeFile?.name}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Data item declarations (levels 01–77, PICTURE clauses, and USAGE modes) are specific to COBOL DATA DIVISION and copybook layouts. Not applicable for this file type.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: STRUCTURE FOR ACTIVE FILE ONLY */}
          {rightPanelTab === 'STRUCTURE' && (
            <Card
              title={`Structure: ${activeFile?.name || 'File'}`}
              badge={<Badge variant="warning" size="xs">Audit</Badge>}
            >
              <div className="space-y-3 text-xs">
                {/* For COBOL Programs */}
                {fileAnalysis.fileType === 'cobol_program' && (
                  <>
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">Program Identity</span>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {fileAnalysis.programId || 'UNSPECIFIED'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {activeFile?.relativePath || activeFile?.name} • {sourceLines.length} LOC
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <span className="font-semibold text-slate-700 block">Identified Divisions:</span>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5 font-mono text-[10px] text-slate-700">
                        {fileAnalysis.divisions.map((div, i) => (
                          <div key={i}>✓ {div.name} (Line {div.line})</div>
                        ))}
                      </div>
                    </div>

                    {fileAnalysis.copies.length > 0 && (
                      <div className="space-y-1 text-[11px]">
                        <span className="font-semibold text-slate-700 block">Copybook Directives:</span>
                        <div className="p-2 rounded bg-blue-50 border border-blue-200 space-y-0.5 font-mono text-[10px] text-blue-900">
                          {fileAnalysis.copies.map((c, i) => (
                            <div key={i}>COPY {c.copybook} (Line {c.line})</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report?.verification?.unsupported && report.verification.unsupported.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-900 block text-[11px]">Unsupported Constructs Found:</span>
                        {report.verification.unsupported.map((u, i) => (
                          <div key={i} className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-mono">
                            {u.construct} at Line {u.line} ({u.file})
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* For Copybooks */}
                {fileAnalysis.fileType === 'copybook' && (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">Copybook Structure</span>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {fileAnalysis.programId}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {fileAnalysis.dataItems.length} fields • ~{fileAnalysis.totalRecordBytes || 0} bytes
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Copybooks are compiled into programs using the <code className="font-mono font-bold text-slate-800">COPY</code> statement. Fields defined here become part of the parent program's WORKING-STORAGE or LINKAGE records.
                    </p>
                  </div>
                )}

                {/* For Unsupported Files */}
                {fileAnalysis.fileType !== 'cobol_program' && fileAnalysis.fileType !== 'copybook' && (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">File Classification</span>
                      <div className="font-semibold text-slate-900 text-xs">
                        {activeFile?.category || 'Project Auxiliary Asset'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {activeFile?.relativePath || activeFile?.name} ({activeFile?.sizeFormatted || activeFile?.size})
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      This file is staged in the project workspace for inspection and context. Structural COBOL division analysis is not applicable to non-COBOL files.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 3. Below Workspace Summary */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Analysis & Modernization Summary: {activeFile?.name}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {activeFile?.relativePath || activeFile?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
              Call & Dependency Chain
            </span>
            <div className="font-mono text-slate-900 text-[11px]">
              {dependencies[`${activeFile?.relativePath || activeFile?.name}:${selectedParagraphName}`]
                ? `${selectedParagraphName} → ${dependencies[`${activeFile?.relativePath || activeFile?.name}:${selectedParagraphName}`].join(', ') || 'Leaf'}`
                : activeParagraphs.length > 0
                ? `${activeParagraphs.length} routines mapped (${activeParagraphs.map(p => p.name).slice(0, 2).join(', ')}...)`
                : 'No executable subroutines'
              }
            </div>
            <p className="text-[11px] text-slate-500">
              {isBackendOnline ? 'Engine mapped call chain' : 'Observed PERFORM hierarchy'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
              Risk & Evidence Posture
            </span>
            <div className="font-semibold text-slate-900">
              {activeFile?.name === 'PENALTY.cbl' && isReassessed 
                ? 'Critical Risk (INC-101 Waiver Conflict)' 
                : activeFileRules.length > 0
                ? 'Medium Risk: Baseline AST Logic'
                : 'Low Risk: Reference Schema'
              }
            </div>
            <p className="text-[11px] text-slate-500">
              {activeFile?.name === 'PENALTY.cbl' && isReassessed
                ? 'Incident INC-101 reports active billing dispute on extension waivers'
                : 'Observed conditional statements meet baseline specifications'
              }
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
                Target Modernization Output
              </span>
              <div className="font-mono text-blue-700 font-semibold text-[11px] truncate">
                {activeFile?.name === 'PENALTY.cbl' 
                  ? 'PenaltyCalculationService.java' 
                  : activeFile?.name === 'TRANS_PROC.cbl'
                  ? 'TransactionProcessingService.java'
                  : 'AccountRecord.java (Java 21 Record)'}
              </div>
            </div>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => onNavigate('modernization-report')}
              className="self-start mt-1"
            >
              View Modernization Diagram &rarr;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
