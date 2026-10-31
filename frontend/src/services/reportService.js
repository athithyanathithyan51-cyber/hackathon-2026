import { api } from './api';

export const reportService = {
  /**
   * Generates modernization phases, 4R recommendations, and AI business explanations.
   * @param {string} projectId
   */
  async generatePlan(projectId) {
    return await api.post(`/api/projects/${projectId}/plan`);
  },

  /**
   * Retrieves the comprehensive modernization report (source, analysis, verification,
   * assessment, recommendations, migration_phases).
   * @param {string} projectId
   */
  async getReport(projectId) {
    return await api.get(`/api/projects/${projectId}/report`);
  }
};
