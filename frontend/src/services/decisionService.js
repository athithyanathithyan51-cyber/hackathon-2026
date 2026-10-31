/**
 * LegacyIQ Decision Center Service Layer
 * 
 * Centralizes decision data retrieval, evidence queries, and human approval actions.
 * Integrates with live backend endpoints where verified; falls back seamlessly to
 * simulated governance data with explicit provenance labeling.
 */

import { getDecisionRecords, getDecisionMetrics, MODERNIZATION_STRATEGIES } from '../data/mockDecisionData';

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Checks backend API health status
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
    if (!response.ok) return { online: false, error: `HTTP ${response.status}` };
    const data = await response.json();
    return { online: true, status: data.status };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Retrieves assessed components and their evidence-gated verdicts.
 * 
 * @param {boolean} isReassessed - Reflects Phase 3 adaptive reassessment state
 * @returns {Promise<{ records: Array, metrics: Object, isLive: boolean }>}
 */
export async function fetchComponentDecisions(isReassessed = false) {
  // Currently, the backend main.py only supports /api/projects, /api/health, /rules, /dependencies.
  // Modernization decision verdicts and human-approval gating are not yet implemented in backend.
  // We provide the verified mock dataset and label it SIMULATED.
  const records = getDecisionRecords(isReassessed);
  const metrics = getDecisionMetrics(records);

  return {
    records,
    metrics,
    isLive: false,
    source: 'SIMULATED (Frontend Evidence Engine)'
  };
}

/**
 * Retrieves the catalog of modernization strategies (RETAIN, REFACTOR, REPLACE, REMOVE)
 */
export function getModernizationStrategyCatalog() {
  return MODERNIZATION_STRATEGIES;
}

/**
 * Records a human approval action on a component decision
 * 
 * @param {string} componentId - Target component ID (e.g. DEC-001)
 * @param {Object} approvalData - { reviewer, decision, comment, timestamp }
 */
export async function recordHumanApproval(componentId, approvalData) {
  // In Phase 4, approvals are recorded in the local frontend state and session audit trail.
  return {
    success: true,
    componentId,
    recordedAt: approvalData.timestamp || new Date().toLocaleTimeString(),
    reviewer: approvalData.reviewer,
    decision: approvalData.decision,
    isSimulated: true
  };
}
