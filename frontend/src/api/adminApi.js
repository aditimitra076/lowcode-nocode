import { request } from './client';

export function fetchUsers() {
  return request('/api/admin/users');
}

export function updateUserStatus(userId, status) {
  return request(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteUser(userId) {
  return request(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

export function fetchLogs({ action, actor, from, to } = {}) {
  const params = new URLSearchParams();
  if (action) params.set('action', action);
  if (actor) params.set('actor', actor);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return request(`/api/admin/logs${query ? `?${query}` : ''}`);
}
