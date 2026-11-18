import { getAuthToken } from './authApi';

/**
 * Upload an image file for use in the builder (UC-04).
 * Uses FormData — do not set Content-Type manually.
 */
export async function uploadImage(file) {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, status: 401, message: 'Sign in to upload images.' };
  }
  if (!file) {
    return { ok: false, status: 400, message: 'Choose an image file first.' };
  }

  const body = new FormData();
  body.append('file', file);

  let response;
  try {
    response = await fetch('/api/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'Could not reach the API server. Is the backend running?',
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: data.message || 'Upload failed.',
    };
  }

  return { ok: true, status: response.status, data };
}
