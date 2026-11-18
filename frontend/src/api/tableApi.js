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

function tablePath(projectId, tableId = '') {
  const base = `/api/projects/${encodeURIComponent(projectId)}/tables`;
  return tableId ? `${base}/${encodeURIComponent(tableId)}` : base;
}

export function fetchTables(projectId) {
  return request(tablePath(projectId));
}

export function createTable(projectId, payload) {
  return request(tablePath(projectId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTable(projectId, tableId, payload) {
  return request(tablePath(projectId, tableId), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTable(projectId, tableId) {
  return request(tablePath(projectId, tableId), { method: 'DELETE' });
}

export function fetchRecords(projectId, tableId) {
  return request(`${tablePath(projectId, tableId)}/records`);
}

export function createRecord(projectId, tableId, data) {
  return request(`${tablePath(projectId, tableId)}/records`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export function updateRecord(projectId, tableId, recordId, data) {
  return request(`${tablePath(projectId, tableId)}/records/${encodeURIComponent(recordId)}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
}

export function deleteRecord(projectId, tableId, recordId) {
  return request(`${tablePath(projectId, tableId)}/records/${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
  });
}

export function submitPublicForm(projectId, componentId, data) {
  return request(
    `/api/public/projects/${encodeURIComponent(projectId)}/forms/${encodeURIComponent(componentId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ data }),
    },
  );
}
