import { CONFIG } from './config.js';

export let apiOnline = false;

async function request(path, options = {}) {
  const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  async ping() {
    if (!CONFIG.API_BASE_URL) {
      apiOnline = false;
      return false;
    }
    try {
      await request('/health');
      apiOnline = true;
      return true;
    } catch {
      apiOnline = false;
      return false;
    }
  },
  register(body) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },
  login(body) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  guest(body) {
    return request('/auth/guest', { method: 'POST', body: JSON.stringify(body) });
  },
  logout(token) {
    return request('/auth/logout', { method: 'POST', body: JSON.stringify({ token }) });
  },
};
