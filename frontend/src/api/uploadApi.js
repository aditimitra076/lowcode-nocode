import { request } from './client';
import { getAuthToken } from './session';

/**
 * Upload an image or document file for the builder / publish (FR-25).
 * Uses FormData — do not set Content-Type manually.
 */
export async function uploadFile(file) {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, status: 401, message: 'Sign in to upload files.' };
  }
  if (!file) {
    return { ok: false, status: 400, message: 'Choose a file first.' };
  }

  const body = new FormData();
  body.append('file', file);

  return request('/api/uploads', { method: 'POST', body }, { fallback: 'Upload failed.' });
}

/** @deprecated alias — prefer uploadFile */
export const uploadImage = uploadFile;
