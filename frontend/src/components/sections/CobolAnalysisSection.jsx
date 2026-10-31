import { useState, useMemo } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useProject } from '../../context/ProjectContext';
import { SAMPLE_GITHUB_COBOL_URLS } from '../../services/githubService';

export default function CobolAnalysisSection({ onNavigate }) {
  const {
    activeFile,
    setActiveFile,
    stagedFiles,
    isAnalyzing,
    analysisError,
    analysisSuccess,
    clearMessages,
    findings,
    dependencies,
    report,
    isBackendOnline,
    ingestGitHubFile,
    analyzeSource,
    referenceRules,
    referenceParagraphs,
    referenceDataItems,
    isReassessed
  } = useProject();

  // GitHub URL Input state
  const [githubUrl, setGithubUrl] = useState('');

  // Viewer state
  const [selectedParagraphId, setSelectedParagraphId] = useState(referenceParagraphs[0]?.id || 'para-2100');
  const [selectedRuleId, setSelectedRuleId] = useState('BR-001');
  const [highlightedLines, setHighlightedLines] = useState([37, 44]); // Default highlight
  const [searchQuery, setSearchQuery] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState('RULES'); // 'RULES' | 'DATA' | 'STRUCTURE'

  // Extract paragraphs from backend report or reference
  const paragraphList = useMemo(() => {
    if (report?.analysis?.paragraphs && report.analysis.paragraphs.length > 0) {
      return report.analysis.paragraphs.map((pKey, idx) => {
        const paraName = pKey.includes(':') ? pKey.split(':')[1] : pKey;
        const matchingRef = referenceParagraphs.find(p => p.name === paraName);
        return {
          id: `para-${idx}`,
          name: paraName,
          lineStart: matchingRef?.lineStart || 1,
          lineEnd: matchingRef?.lineEnd || 10,
          summary: matchingRef?.summary || `PROCEDURE DIVISION routine ${paraName}`,
          performedBy: matchingRef?.performedBy || []
        };
      });
    }
    return referenceParagraphs;
  }, [report, referenceParagraphs]);

  const activeParagraph = paragraphList.find(p => p.id === selectedParagraphId) || paragraphList[0];

  // Display findings: Use actual backend findings if available; otherwise reference rules
  const displayRules = useMemo(() => {
    if (findings && findings.length > 0) {
      return findings.map((f, idx) => {
        const isDisputed = f.evidence_status === 'CONFLICTED_BY_EVIDENCE' || (f.function.includes('2100') && isReassessed);
        return {
          id: f.id || `BR-00${idx + 1}`,
          title: f.description || `Rule in ${f.function}`,
          paragraph: f.function,
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

    return referenceRules.map(r => {
      const matchStart = r.lines.match(/\d+/);
      const matchEnd = r.lines.match(/\d+$/);
      return {
        ...r,
        startLine: matchStart ? parseInt(matchStart[0], 10) : 1,
        endLine: matchEnd ? parseInt(matchEnd[0], 10) : 10,
        isLiveBackend: false
      };
    });
  }, [findings, referenceRules, isReassessed]);

  // Handle GitHub Ingestion
  const handleFetchGitHub = async (urlToFetch) => {
    const targetUrl = urlToFetch || githubUrl;
    if (!targetUrl.trim()) return;
    await ingestGitHubFile(targetUrl);
    setGithubUrl('');
  };

  // Quick load demo banking file
  const handleSelectFile = async (file) => {
    setActiveFile(file);
    clearMessages();
    if (file.name === 'PENALTY.cbl') {
      setHighlightedLines([37, 44]);
      setSelectedRuleId('BR-001');
      setSelectedParagraphId(referenceParagraphs[0]?.id || 'para-2100');
    } else {
      setHighlightedLines(null);
    }
    await analyzeSource(file.name, file.content, file.repoInfo);
  };

  // Rule selection handler: Highlights actual source lines in the center viewer
  const handleSelectRule = (rule) => {
    setSelectedRuleId(rule.id);
    if (rule.startLine && rule.endLine) {
      setHighlightedLines([rule.startLine, rule.endLine]);
    } else if (rule.startLine) {
      setHighlightedLines([rule.startLine, rule.startLine + 3]);
    } else {
      setHighlightedLines(null);
    }

    // Match paragraph
    const matchedPara = paragraphList.find(p => p.name === rule.paragraph);
    if (matchedPara) {
      setSelectedParagraphId(matchedPara.id);
    }
  };

  // Paragraph selection handler: Highlights lines
  const handleSelectParagraph = (para) => {
    setSelectedParagraphId(para.id);
    setHighlightedLines([para.lineStart, para.lineEnd]);
  };

  // Split lines for line-numbered view
  const sourceLines = useMemo(() => {
    if (!activeFile?.content) return [];
    return activeFile.content.split('\n');
  }, [activeFile]);

  return (
    <div className="space-y-5">
      {/* GitHub URL Ingestion Strip - White-Primary, High-Contrast */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                COBOL Source Ingestion
              </span>
              <Badge variant={isBackendOnline ? 'success' : 'neutral'} size="xs" dot>
                {isBackendOnline ? 'Backend Engine Connected' : 'Offline Reference Mode'}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Fetch & Analyze COBOL Program from Public GitHub Repository
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Supported extensions: <code className="text-slate-800 font-bold">.cbl</code>, <code className="text-slate-800 font-bold">.cob</code>, <code className="text-slate-800 font-bold">.cpy</code>
          </span>
        </div>

        {/* Input Bar */}
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

      {/* 3-Panel Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* =========================================================================
            LEFT PANEL: Source file metadata, file explorer, paragraph navigation
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* File Metadata Card */}
          <Card
            title="File Metadata"
            badge={
              <Badge variant={activeFile?.source?.includes('GitHub') ? 'purple' : 'neutral'} size="xs">
                {activeFile?.source || 'Local Demo'}
              </Badge>
            }
          >
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Filename</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">{activeFile?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lines (LOC)</span>
                  <span className="font-mono text-slate-800">{activeFile?.loc || sourceLines.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">File Size</span>
                  <span className="font-mono text-slate-800">{activeFile?.size}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Program Identifier</span>
                <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] inline-block font-semibold">
                  {activeFile?.programId || activeFile?.name?.split('.')[0]?.toUpperCase() || 'UNSPECIFIED'}
                </span>
              </div>
              {activeFile?.repoInfo && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Repository</span>
                  <span className="font-mono text-slate-600 text-[10px] truncate block">{activeFile.repoInfo}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Staged COBOL Files List */}
          <Card
            title="Staged Files"
            badge={<Badge variant="neutral" size="xs">{stagedFiles.length}</Badge>}
          >
            <div className="space-y-1.5">
              {stagedFiles.map((file) => {
                const isSelected = file.id === activeFile?.id || file.name === activeFile?.name;
                return (
                  <button
                    key={file.id || file.name}
                    type="button"
                    onClick={() => handleSelectFile(file)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-mono font-medium truncate">{file.name}</div>
                      <div className="text-[10px] text-slate-400">{file.loc || file.content?.split('\n').length} lines • {file.extension}</div>
                    </div>
                    <Badge variant={file.extension === '.cbl' ? 'info' : 'neutral'} size="xs">
                      {file.extension}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Paragraph Navigation */}
          <Card
            title="Paragraph Explorer"
            subtitle="Click to highlight in viewer"
            badge={<Badge variant="info" size="xs">{paragraphList.length}</Badge>}
          >
            <div className="space-y-1.5">
              {paragraphList.map((p) => {
                const isSelected = selectedParagraphId === p.id || p.name === activeParagraph?.name;
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
                    <div className="text-[10px] text-slate-500 line-clamp-1">{p.summary}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* =========================================================================
            CENTER PANEL: COBOL Source Viewer with Line Numbers & Search
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-3">
          <Card
            title={`Source Code: ${activeFile?.name || 'Source'}`}
            subtitle={highlightedLines ? `Highlighting Lines ${highlightedLines[0]}–${highlightedLines[1]}` : `Total ${sourceLines.length} lines`}
            badge={
              <Badge variant="neutral" size="xs">
                Fixed 80-Col Format
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
            {/* Search within source */}
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within source (e.g., WS-BALANCE, PERFORM, PENALTY)..."
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Code Viewer */}
            <div className="rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[580px] shadow-inner select-text">
              <div className="py-2">
                {sourceLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isHighlighted = highlightedLines && lineNum >= highlightedLines[0] && lineNum <= highlightedLines[1];
                  const isSearchMatch = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());

                  return (
                    <div
                      key={idx}
                      className={`flex px-2 py-0.5 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-500/20 text-amber-200 border-l-2 border-amber-400'
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
                Active Rule Grounding
              </span>
              <span>Encoding: ASCII Fixed 80-Col</span>
            </div>
          </Card>
        </div>

        {/* =========================================================================
            RIGHT PANEL: Extracted business rules, data definitions, and warnings
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
              Rules ({displayRules.length})
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
              Data Items
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

          {/* Tab 1: Extracted Business Rules */}
          {rightPanelTab === 'RULES' && (
            <Card
              title="Extracted Rules"
              subtitle={isBackendOnline ? 'Genuinely extracted from backend engine' : 'Click to locate in source'}
              badge={<Badge variant={isBackendOnline ? 'success' : 'info'} size="xs">{isBackendOnline ? 'Live Engine' : 'Grounded AST'}</Badge>}
            >
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {displayRules.map((rule) => {
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
                          {rule.recommendation ? `Action: ${rule.recommendation}` : 'Rule Candidate'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Tab 2: WORKING-STORAGE Data Definitions */}
          {rightPanelTab === 'DATA' && (
            <Card
              title="WORKING-STORAGE"
              subtitle="Data items and picture clauses"
              badge={<Badge variant="neutral" size="xs">Data Dict</Badge>}
            >
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {referenceDataItems.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-[11px]">
                      <span>{item.name}</span>
                      <span className="text-blue-700 bg-blue-50 px-1 rounded text-[10px]">{item.pic}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Level {item.level} • {item.role}</span>
                      <span className="truncate max-w-[110px] text-slate-400">{item.usage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tab 3: Program Structure & Warnings */}
          {rightPanelTab === 'STRUCTURE' && (
            <Card
              title="Program Structure & Warnings"
              badge={<Badge variant="warning" size="xs">Audit</Badge>}
            >
              <div className="space-y-3 text-xs">
                <div className="space-y-1 text-[11px]">
                  <span className="font-semibold text-slate-700 block">Identified Divisions:</span>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5 font-mono text-[10px] text-slate-700">
                    <div>✓ IDENTIFICATION DIVISION (Line 1)</div>
                    <div>✓ ENVIRONMENT DIVISION (Line 8)</div>
                    <div>✓ DATA DIVISION (Line 9)</div>
                    <div>✓ PROCEDURE DIVISION (Line 21)</div>
                  </div>
                </div>

                {/* Actual unsupported constructs from report if present */}
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

                {/* Audit Warning Callout */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                  <span className="font-bold text-[11px] block">
                    Logic Warning: Omitted Flag Check
                  </span>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    Paragraph <code>2100-CALCULATE-PENALTY</code> calculates minimum balance penalty without verifying copybook field <code>WS-PAYMENT-EXT-FLAG</code>. Flagged for review under incident INC-101.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* =========================================================================
          BELOW THE WORKSPACE: Dependencies, Risk Findings, and Java Recommendations
         ========================================================================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Analysis & Modernization Summary: {activeParagraph.name}
          </span>
          <span className="text-xs text-slate-500">
            Grounding: Lines {activeParagraph.lineStart}–{activeParagraph.lineEnd}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Dependencies Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
              PERFORM Dependency Chain
            </span>
            <div className="font-mono text-slate-900 text-[11px]">
              {dependencies[`PENALTY.cbl:${activeParagraph.name}`]
                ? `${activeParagraph.name} → ${dependencies[`PENALTY.cbl:${activeParagraph.name}`].join(', ') || 'Leaf'}`
                : activeParagraph.performedBy && activeParagraph.performedBy.length > 0 
                ? `${activeParagraph.performedBy.join(', ')} → ${activeParagraph.name}`
                : `Routine: ${activeParagraph.name}`
              }
            </div>
            <p className="text-[11px] text-slate-500">
              {isBackendOnline ? 'Engine mapped call chain' : 'Observed PERFORM invocation'}
            </p>
          </div>

          {/* Risk Findings Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
              Risk & Evidence Posture
            </span>
            <div className="font-semibold text-slate-900">
              {isReassessed 
                ? 'High / Critical Risk (INC-101 Conflict)' 
                : 'Medium Risk: Deterministic Deduction'
              }
            </div>
            <p className="text-[11px] text-slate-500">
              {isReassessed
                ? 'Incident INC-101 reports active billing dispute on extension waivers'
                : 'Observed AST conditional meets baseline requirements'
              }
            </p>
          </div>

          {/* Java 21 Target Recommendation */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
                Target Java 21 Spring Service
              </span>
              <div className="font-mono text-blue-700 font-semibold text-[11px] truncate">
                PenaltyCalculationService.java
              </div>
            </div>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => onNavigate('business-logic')}
              className="self-start mt-1"
            >
              View in Business Logic &rarr;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
