/**
 * VisualForge Studio - Marketplace API Client
 * Conforms to SRS Functional Requirements:
 * - FR-39 / FR-40: publish a project listing
 * - FR-41 / FR-42: browse, search and filter approved listings
 * - FR-43: view project and developer information (including contact details)
 * - FR-46: only approved listings are publicly visible
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
        ? 'Sign in to use this template.'
        : response.status === 403
          ? 'You do not have permission to do that.'
          : response.status === 404
            ? 'Template not found.'
            : data.message || 'Request failed.';
    return { ok: false, status: response.status, message };
  }

  return { ok: true, status: response.status, data };
}

export function fetchListings({ search, tag } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (tag && tag !== 'All') params.set('tag', tag);
  const query = params.toString();

  return request(`/api/marketplace/listings${query ? `?${query}` : ''}`);
}

export function fetchListing(listingId) {
  return request(`/api/marketplace/listings/${encodeURIComponent(listingId)}`);
}

// Creates a personal copy of an approved blueprint in the signed-in viewer's workspace.
export function cloneListing(listingId) {
  return request(`/api/marketplace/listings/${encodeURIComponent(listingId)}/clone`, {
    method: 'POST',
  });
}

export function createListing(payload) {
  return request('/api/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchAdminListings(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/api/marketplace/admin/listings${query}`);
}

export function reviewListing(listingId, payload) {
  return request(`/api/marketplace/admin/listings/${encodeURIComponent(listingId)}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
