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
    return { ok: false, status: response.status, message: data.message || 'Request failed.' };
  }
  return { ok: true, status: response.status, data };
}

export function fetchUsers() {
  return request('/api/admin/users');
}

export function updateUserStatus(userId, status) {
  return request(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function fetchLogs() {
  return request('/api/admin/logs');
}
