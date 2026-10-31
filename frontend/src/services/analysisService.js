import { api } from './api';
import { fetchGitHubCobolFile } from './githubService';

export const analysisService = {
  /**
   * Fetches and validates a COBOL source file from GitHub via the backend.
   * If backend is offline, falls back to direct client-side GitHub fetch.
   * @param {string} url - GitHub URL pointing to a .cbl, .cob, or .cpy file
   */
  async fetchGitHubSource(url) {
    try {
      const result = await api.post('/api/sources/github', { url });
      return {
        ...result,
        source: 'backend'
      };
    } catch (err) {
      // If backend is unavailable or network error, attempt direct client-side fetch as fallback
      if (err.isNetworkError || err.status === 0) {
        const clientResult = await fetchGitHubCobolFile(url);
        return {
          owner: clientResult.owner,
          repo: clientResult.repo,
          ref: clientResult.branch,
          path: clientResult.filePath,
          file_name: clientResult.name,
          extension: clientResult.extension,
          size_bytes: Math.round(parseFloat(clientResult.sizeKb) * 1024),
          line_count: clientResult.lineCount,
          content: clientResult.content,
          source: 'client-fallback'
        };
      }
      throw err;
    }
  },

  /**
   * Retrieves extracted rule candidates and findings for a project.
   * @param {string} projectId
   */
  async getFindings(projectId) {
    return await api.get(`/api/projects/${projectId}/findings`);
  },

  /**
   * Retrieves paragraph and function call dependencies.
   * @param {string} projectId
   */
  async getDependencies(projectId) {
    return await api.get(`/api/projects/${projectId}/dependencies`);
  },

  /**
   * Evaluates impact, blast radius, risk reasons, and regression test suggestions for a finding.
   * @param {string} projectId
   * @param {string} findingId
   */
  async getImpact(projectId, findingId) {
    return await api.post(`/api/projects/${projectId}/impact`, {
      finding_id: findingId
    });
  }
};
