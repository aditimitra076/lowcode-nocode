/**
 * VisualForge Studio - Project API Client
 * Persists page trees built in the drag-and-drop editor (FR-10 to FR-17).
 */

import { getAuthToken } from './authApi';

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'Could not reach the API server. Is the backend running?',
    };
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Sign in to open and save projects.'
        : response.status === 404
          ? 'Project not found.'
          : data.message || 'Request failed.';
    return { ok: false, status: response.status, message };
  }

  return { ok: true, status: response.status, data };
}

export function fetchProjects() {
  return request('/api/projects');
}

export function fetchProject(projectId) {
  return request(`/api/projects/${encodeURIComponent(projectId)}`);
}

export function createProject({ name, pages }) {
  return request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, pages }),
  });
}

export function updateProject(projectId, { name, pages }) {
  return request(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: JSON.stringify({ name, pages }),
  });
}
