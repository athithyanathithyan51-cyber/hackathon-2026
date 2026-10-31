import { api } from './api';

export const projectService = {
  /**
   * Creates a project and triggers the AST & COBOL rule analysis on the backend.
   * @param {string} name - Name of the project (e.g. 'banking-core')
   * @param {Array<{ path: string, content: string }>} files - List of source files
   */
  async createProject(name, files) {
    return await api.post('/api/projects', {
      name,
      files
    });
  },

  /**
   * Retrieves basic project metadata.
   * @param {string} projectId
   */
  async getProject(projectId) {
    return await api.get(`/api/projects/${projectId}`);
  },

  /**
   * Retrieves high-level overview metrics (files_analyzed, rule_candidates, risks, evidence_conflicts).
   * @param {string} projectId
   */
  async getOverview(projectId) {
    return await api.get(`/api/projects/${projectId}/overview`);
  }
};
