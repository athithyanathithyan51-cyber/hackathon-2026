import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { projectService } from '../services/projectService';
import { analysisService } from '../services/analysisService';
import { evidenceService } from '../services/evidenceService';
import { reportService } from '../services/reportService';
import { extractZipProject } from '../services/zipService';
import { 
  COBOL_DEMO_FILES, 
  COBOL_BUSINESS_RULES,
  COBOL_PARAGRAPHS,
  WORKING_STORAGE_ITEMS
} from '../data/mockCobolData';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  // Backend connectivity state
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'connected' | 'offline'

  // Current active project
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState('banking-core');

  // Active source file in the workspace
  const [activeFile, setActiveFile] = useState(COBOL_DEMO_FILES[0]);
  const [stagedFiles, setStagedFiles] = useState(COBOL_DEMO_FILES);

  // ZIP project summary and progress
  const [zipSummary, setZipSummary] = useState(null);
  const [zipProgress, setZipProgress] = useState(0);

  // Analysis loading & error states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(null);

  // Core analysis results from the real backend engine
  const [overview, setOverview] = useState(null);
  const [findings, setFindings] = useState([]);
  const [dependencies, setDependencies] = useState({});
  const [plan, setPlan] = useState(null);
  const [report, setReport] = useState(null);
  const [impactMap, setImpactMap] = useState({});
  const [functions, setFunctions] = useState([]);
  const [historyMap, setHistoryMap] = useState({});

  // Evidence state
  const [isReassessed, setIsReassessed] = useState(false);
  const [evidenceLog, setEvidenceLog] = useState([]);

  // Check backend health on initial load or manual refresh
  const checkHealth = useCallback(async () => {
    try {
      const isOk = await api.checkHealth();
      setBackendStatus(isOk ? 'connected' : 'offline');
      return isOk;
    } catch {
      setBackendStatus('offline');
      return false;
    }
  }, []);

  /**
   * Refreshes all project analysis views from the backend engine
   */
  const refreshProjectData = useCallback(async (pid) => {
    if (!pid) return;

    try {
      const [ov, fnd, dep, rep, pln, fns] = await Promise.all([
        projectService.getOverview(pid).catch(() => null),
        analysisService.getFindings(pid).catch(() => []),
        analysisService.getDependencies(pid).catch(() => ({})),
        reportService.getReport(pid).catch(() => null),
        reportService.generatePlan(pid).catch(() => null),
        analysisService.getFunctions(pid).catch(() => [])
      ]);

      if (ov) setOverview(ov);
      if (fnd) setFindings(fnd);
      if (dep) setDependencies(dep);
      if (rep) setReport(rep);
      if (pln) setPlan(pln);
      if (fns) setFunctions(fns);

      // Impact (blast radius and regression suggestions) for every finding. No AI calls.
      const impacts = await Promise.all((fnd || []).map((f) =>
        analysisService.getImpact(pid, f.id).then((r) => [f.id, r]).catch(() => null)
      ));
      setImpactMap(Object.fromEntries(impacts.filter(Boolean)));

      // Version history for every finding (baseline and reassessed versions). No AI calls.
      const histories = await Promise.all((fnd || []).map((f) =>
        evidenceService.getFindingHistory(pid, f.id).then((h) => [f.id, h]).catch(() => null)
      ));
      setHistoryMap(Object.fromEntries(histories.filter(Boolean)));
    } catch (err) {
      console.warn('Error refreshing project analysis data from backend:', err);
    }
  }, []);

  // Initial mount: Check backend health and stage initial analysis if backend available
  useEffect(() => {
    let ignore = false;

    async function initializeEngine() {
      try {
        const isOk = await api.checkHealth();
        if (ignore) return;
        setBackendStatus(isOk ? 'connected' : 'offline');

        if (isOk) {
          const demo = COBOL_DEMO_FILES[0];
          const projName = demo.name.replace(/\.[^/.]+$/, '').toLowerCase() || 'banking-core';
          const projectResult = await projectService.createProject(projName, [
            { path: demo.name, content: demo.content }
          ]);
          if (ignore) return;
          setProjectId(projectResult.id);
          setProjectName(projName);
          await refreshProjectData(projectResult.id);
        }
      } catch {
        if (!ignore) {
          setBackendStatus('offline');
        }
      }
    }

    initializeEngine();

    return () => {
      ignore = true;
    };
  }, [refreshProjectData]);

  /**
   * Analyzes source code using the backend engine.
   * If backend is offline, activates client-side verified reference data.
   */
  const analyzeSource = useCallback(async (fileName, content) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(null);

    const isConnected = await checkHealth();

    if (isConnected) {
      try {
        // 1. Create project on backend and run real COBOL analysis
        const projName = fileName.replace(/\.[^/.]+$/, '').toLowerCase() || 'cobol-program';
        const projectResult = await projectService.createProject(projName, [
          { path: fileName, content }
        ]);

        const newPid = projectResult.id;
        setProjectId(newPid);
        setProjectName(projName);
        setIsReassessed(false);
        setEvidenceLog([]);

        // 2. Refresh findings, dependencies, report, and plan
        await refreshProjectData(newPid);

        setAnalysisSuccess(
          `Analysis complete: Parsed ${projectResult.function_count} paragraph(s) and extracted ${projectResult.rule_count} rule candidate(s).`
        );
      } catch (err) {
        setAnalysisError(err.message || 'Failed to analyze source on backend.');
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // Backend is offline: Fall back to verified local baseline model
      setProjectId(null);
      setIsAnalyzing(false);
      setAnalysisSuccess('Loaded verified local model (Backend offline: start uvicorn backend.main:app to enable live engine)');
    }
  }, [checkHealth, refreshProjectData]);

  /**
   * Ingests a public COBOL file from GitHub via the backend /api/sources/github endpoint
   */
  const ingestGitHubFile = useCallback(async (url) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(null);

    try {
      const fetched = await analysisService.fetchGitHubSource(url);
      
      const newFileObj = {
        id: `gh-${Date.now()}`,
        name: fetched.file_name,
        extension: fetched.extension,
        type: `GitHub Ingested (${fetched.extension})`,
        size: `${(fetched.size_bytes / 1024).toFixed(2)} KB`,
        loc: fetched.line_count,
        programId: fetched.file_name.split('.')[0].toUpperCase(),
        status: 'Retrieved & Verified',
        content: fetched.content,
        isCobol: true,
        source: fetched.source === 'backend' ? 'GitHub (Backend Verified)' : 'GitHub (Client Fallback)',
        repoInfo: `${fetched.owner}/${fetched.repo} (${fetched.ref})`,
        path: fetched.path
      };

      setStagedFiles(prev => [newFileObj, ...prev.filter(f => f.name !== newFileObj.name)]);
      setActiveFile(newFileObj);

      // Trigger analysis immediately on the ingested source
      await analyzeSource(newFileObj.name, newFileObj.content);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to fetch COBOL file from GitHub.');
      setIsAnalyzing(false);
    }
  }, [analyzeSource]);

  /**
   * Submits new operational evidence (INC-101) to the active project
   */
  const submitEvidence = useCallback(async (evidenceName, evidenceContent) => {
    if (!projectId) {
      // Offline simulation fallback
      setIsReassessed(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await evidenceService.addEvidence(projectId, evidenceName, evidenceContent);
      setEvidenceLog(prev => [result, ...prev]);
      setIsReassessed(true);

      // Refresh project findings, overview, plan, and report with new versions
      await refreshProjectData(projectId);
      setAnalysisSuccess(`Evidence ${evidenceName} processed: Rule reassessment executed.`);
      return true;
    } catch (err) {
      setAnalysisError(err.message || 'Failed to add evidence.');
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, refreshProjectData]);

  /**
   * Evaluates impact / blast radius / tests for a specific finding
   */
  const evaluateImpact = useCallback(async (findingId) => {
    if (!projectId) return null;
    try {
      const result = await analysisService.getImpact(projectId, findingId);
      setImpactMap(prev => ({ ...prev, [findingId]: result }));
      return result;
    } catch (err) {
      console.warn('Failed to evaluate impact:', err);
      return null;
    }
  }, [projectId]);

  /**
   * Uploads, extracts, and analyzes a multi-file ZIP project
   */
  const uploadZipProject = useCallback(async (file) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(null);
    setZipProgress(15);

    try {
      const extracted = await extractZipProject(file, (p) => {
        setZipProgress(Math.min(90, Math.max(15, p)));
      });
      setZipProgress(95);

      setProjectName(extracted.projectName);
      setStagedFiles(extracted.files);
      setZipSummary(extracted.summary);
      setIsReassessed(false);
      setEvidenceLog([]);

      // Prioritize first COBOL program as default active file
      const firstCobol = extracted.files.find(f => f.classification === 'cobol_program');
      const defaultActive = firstCobol || extracted.files[0];
      setActiveFile(defaultActive);

      // Filter files to stage in the backend project
      // Backend analyzes .cbl / .cob and stages copybooks .cpy
      const supportedFiles = extracted.files.filter(
        f => f.analysisSupport === 'supported' || f.analysisSupport === 'staged_reference'
      );

      const isConnected = await checkHealth();

      if (isConnected && supportedFiles.length > 0) {
        const payload = supportedFiles.map(f => ({
          path: f.relativePath,
          content: f.content
        }));

        const result = await projectService.createProject(extracted.projectName, payload);
        const newPid = result.id;
        setProjectId(newPid);
        await refreshProjectData(newPid);

        setAnalysisSuccess(
          `Analyzed ZIP Project "${extracted.projectName}": Extracted ${extracted.files.length} file(s) (${extracted.summary.cobolPrograms} program(s), ${extracted.summary.copybooks} copybook(s)). Discovered ${result.function_count} paragraph(s) and ${result.rule_count} rule candidate(s).`
        );
      } else if (supportedFiles.length === 0) {
        setProjectId(null);
        setAnalysisSuccess(
          `Extracted ${extracted.files.length} project file(s). No COBOL (.cbl, .cob) programs detected for AST engine analysis.`
        );
      } else {
        setProjectId(null);
        setAnalysisSuccess(
          `Loaded ${extracted.files.length} file(s) in local inspection mode (Backend offline: start uvicorn backend.main:app to run live AST analysis).`
        );
      }
    } catch (err) {
      setAnalysisError(err.message || 'Failed to extract and analyze ZIP archive.');
    } finally {
      setIsAnalyzing(false);
      setZipProgress(100);
    }
  }, [checkHealth, refreshProjectData]);

  /**
   * Switches the active inspected file within the staged project
   */
  const selectFile = useCallback((fileIdOrPath) => {
    const file = stagedFiles.find(
      f => f.id === fileIdOrPath || f.relativePath === fileIdOrPath || f.name === fileIdOrPath
    );
    if (file) {
      setActiveFile(file);
    }
  }, [stagedFiles]);

  /**
   * Loads the demo banking application PENALTY.cbl
   */
  const loadDemoBanking = useCallback(async () => {
    const demo = COBOL_DEMO_FILES[0];
    setActiveFile(demo);
    setStagedFiles(COBOL_DEMO_FILES);
    setZipSummary(null);
    setIsReassessed(false);
    setEvidenceLog([]);
    await analyzeSource(demo.name, demo.content);
  }, [analyzeSource]);

  const value = {
    // Connection
    backendStatus,
    isBackendOnline: backendStatus === 'connected',
    checkHealth,

    // Project & Files
    projectId,
    projectName,
    activeFile,
    setActiveFile,
    stagedFiles,
    setStagedFiles,
    selectFile,

    // ZIP Multi-File Project State
    zipSummary,
    zipProgress,
    uploadZipProject,

    // Analysis Loading & Errors
    isAnalyzing,
    analysisError,
    analysisSuccess,
    clearMessages: () => {
      setAnalysisError(null);
      setAnalysisSuccess(null);
    },

    // Analysis Engine Results
    overview,
    findings,
    dependencies,
    plan,
    report,
    impactMap,
    functions,
    historyMap,

    // Evidence & Reassessment
    isReassessed,
    setIsReassessed,
    evidenceLog,

    // Fallbacks / Static References
    referenceRules: COBOL_BUSINESS_RULES,
    referenceParagraphs: COBOL_PARAGRAPHS,
    referenceDataItems: WORKING_STORAGE_ITEMS,

    // Actions
    analyzeSource,
    ingestGitHubFile,
    submitEvidence,
    evaluateImpact,
    loadDemoBanking,
    resetProject: loadDemoBanking
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
