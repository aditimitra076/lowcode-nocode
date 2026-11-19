import { NETWORK_ERROR, apiUrl } from './client';
import { clearSession, getAuthToken, setSession } from './session';

export { clearSession, getAuthToken, getStoredUser, isAuthenticated, setSession } from './session';

async function authRequest(path, body) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      success: false,
      message: NETWORK_ERROR,
      status: 0,
    };
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      message: data.message || 'Request failed.',
      status: response.status,
    };
  }

  if (!data.token || !data.user) {
    return { success: false, message: 'Invalid response from authentication server.' };
  }

  setSession(data.token, data.user);
  return { success: true, token: data.token, user: data.user };
}

export function loginUser({ email, password }) {
  return authRequest('/api/auth/login', {
    email: (email || '').trim().toLowerCase(),
    password,
  });
}

export function registerUser({ name, email, password }) {
  return authRequest('/api/auth/register', {
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    password,
  });
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(apiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clearSession();
      return null;
    }

    const data = await response.json();
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
  } catch {
    return getStoredUser();
  }

  return getStoredUser();
}

async function profileRequest(method, body) {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, status: 401, message: 'Sign in to edit your profile.' };
  }

  let response;
  try {
    response = await fetch(apiUrl('/api/auth/profile'), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: NETWORK_ERROR,
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status, message: data.message || 'Request failed.' };
  }
  return { ok: true, status: response.status, data };
}

export function fetchProfile() {
  return profileRequest('GET');
}

export function saveProfile(payload) {
  return profileRequest('PUT', payload);
}
