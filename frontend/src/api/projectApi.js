/**
 * VisualForge Studio - Project API Client
 * Persists page trees built in the drag-and-drop editor (FR-10 to FR-17).
 */

import { request as apiRequest } from './client';

const MESSAGES = {
  401: 'Sign in to open and save projects.',
  404: 'Project not found.',
};

const request = (path, options) => apiRequest(path, options, MESSAGES);

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

export function deleteProject(projectId) {
  return request(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
}

export function fetchCollaborators(projectId) {
  return request(`/api/projects/${encodeURIComponent(projectId)}/collaborators`);
}

export function addCollaborator(projectId, { email, role }) {
  return request(`/api/projects/${encodeURIComponent(projectId)}/collaborators`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export function updateCollaborator(projectId, userId, { role }) {
  return request(
    `/api/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  );
}

export function removeCollaborator(projectId, userId) {
  return request(
    `/api/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
}
