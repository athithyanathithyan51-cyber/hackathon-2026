/**
 * Centralized API client for LegacyIQ
 * Communicates with the FastAPI backend at VITE_API_BASE_URL (defaults to http://localhost:8000).
 */

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, detail = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Core HTTP request handler
 */
export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutMs = options.timeout || 60000; // AI explanations can take a while on large projects
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Try parsing JSON
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      let errorMessage = `API Error (${response.status}): ${response.statusText}`;
      let errorDetail = null;

      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI / Pydantic validation error array
          errorMessage = data.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ');
          errorDetail = data.detail;
        }
      }

      throw new ApiError(errorMessage, response.status, errorDetail, false);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. The backend server took too long to respond.', 408, null, true);
    }

    // Network error / server not reachable
    throw new ApiError(
      'Cannot connect to backend server. Please verify FastAPI is running at ' + API_BASE_URL,
      0,
      err.message,
      true
    );
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body = null, options = {}) => request(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  }),
  checkHealth: async () => {
    try {
      const res = await request('/api/health', { timeout: 3000 });
      return res && res.status === 'ok';
    } catch {
      return false;
    }
  }
};
