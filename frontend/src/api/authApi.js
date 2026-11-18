const TOKEN_KEY = 'vf_auth_token';
const USER_KEY = 'vf_auth_user';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

async function authRequest(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      success: false,
      message: 'Could not reach the API server. Is the backend running?',
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
    const response = await fetch('/api/auth/me', {
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
