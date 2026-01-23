// dist/js/apiClient.js
const API_BASE = 'http://localhost:3000';

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}