import { getAuthToken } from './session';

export const NETWORK_ERROR = 'Could not reach the API server. Is the backend running?';

// Empty in development (the Vite proxy forwards /api). Set VITE_API_URL to the backend's public
// address when the built frontend is served from a different host than the API.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/** Full URL for an API path such as /api/projects. */
export function apiUrl(path) {
  return /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`;
}

/** Full URL for an uploaded file (stored as /uploads/<name>) so images load from the API host. */
export function assetUrl(url) {
  return typeof url === 'string' && url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

/**
 * Calls the REST API with the login token and returns { ok, status, data } or { ok: false, status, message }.
 * Request bodies that are FormData are sent as they are; everything else is sent as JSON.
 *
 * messages (optional) replaces the server's message:
 *   { 401: 'text', 404: 'text' }  text for a status code
 *   { fallback: 'text' }          text when the server sent no message (default 'Request failed.')
 */
export async function request(path, options = {}, messages = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(apiUrl(path), { ...options, headers });
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = messages[response.status] || data.message || messages.fallback || 'Request failed.';
    return { ok: false, status: response.status, message };
  }
  return { ok: true, status: response.status, data };
}
