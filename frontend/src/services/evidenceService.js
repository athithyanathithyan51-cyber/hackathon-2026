import { api } from './api';

export const evidenceService = {
  /**
   * Adds an operational evidence item (e.g. incident ticket INC-101, business doc)
   * to a project, triggering semantic correlation and adaptive reassessment.
   * @param {string} projectId
   * @param {string} name - e.g. "INC-101"
   * @param {string} content - Incident text describing expected or contradictory behavior
   */
  async addEvidence(projectId, name, content) {
    return await api.post(`/api/projects/${projectId}/evidence`, {
      name,
      content
    });
  },

  /**
   * Retrieves version history and audit timeline for a specific finding.
   * @param {string} projectId
   * @param {string} findingId
   */
  async getFindingHistory(projectId, findingId) {
    return await api.get(`/api/projects/${projectId}/findings/${findingId}/history`);
  }
};
