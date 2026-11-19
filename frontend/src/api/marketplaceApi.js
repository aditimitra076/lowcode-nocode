/**
 * VisualForge Studio - Marketplace API Client
 * Conforms to SRS Functional Requirements:
 * - FR-39 / FR-40: publish a project listing
 * - FR-41 / FR-42: browse, search and filter approved listings
 * - FR-43: view project and developer information (including contact details)
 * - FR-46: only approved listings are publicly visible
 */

import { request as apiRequest } from './client';

const MESSAGES = {
  401: 'Sign in to use this template.',
  403: 'You do not have permission to do that.',
  404: 'Template not found.',
};

const request = (path, options) => apiRequest(path, options, MESSAGES);

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
