import { request } from './client';

/** Authenticated mutate/docs paths. */
function authTablePath(projectId, tableId = '') {
  const base = `/api/projects/${encodeURIComponent(projectId)}/tables`;
  return tableId ? `${base}/${encodeURIComponent(tableId)}` : base;
}

/** Public read paths for marketplace Visit + preview (no project membership required). */
function publicTablePath(projectId, tableId = '') {
  const base = `/api/public/projects/${encodeURIComponent(projectId)}/tables`;
  return tableId ? `${base}/${encodeURIComponent(tableId)}` : base;
}

export function fetchTables(projectId) {
  return request(publicTablePath(projectId));
}

export function createTable(projectId, payload) {
  return request(authTablePath(projectId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTable(projectId, tableId, payload) {
  return request(authTablePath(projectId, tableId), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTable(projectId, tableId) {
  return request(authTablePath(projectId, tableId), { method: 'DELETE' });
}

export function fetchRecords(projectId, tableId) {
  return request(`${publicTablePath(projectId, tableId)}/records`);
}

export function fetchTableDocs(projectId, tableId) {
  return request(`${authTablePath(projectId, tableId)}/docs`);
}

export function createRecord(projectId, tableId, data) {
  return request(`${authTablePath(projectId, tableId)}/records`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export function updateRecord(projectId, tableId, recordId, data) {
  return request(`${authTablePath(projectId, tableId)}/records/${encodeURIComponent(recordId)}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
}

export function deleteRecord(projectId, tableId, recordId) {
  return request(`${authTablePath(projectId, tableId)}/records/${encodeURIComponent(recordId)}`, {
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
