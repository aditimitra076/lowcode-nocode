import { getAuthToken } from './session';

export const NETWORK_ERROR = 'Could not reach the API server. Is the backend running?';

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
    response = await fetch(path, { ...options, headers });
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
