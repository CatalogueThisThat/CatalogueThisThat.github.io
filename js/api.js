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

  async getSession() {
    return request('/session');
  },

  async toggleReady() {
    return request('/ready', { method: 'POST' });
  },

  async removePlayer(index) {
    return request('/party/remove', { method: 'POST', body: JSON.stringify({ index }) });
  },

  async cancelFind() {
    return request('/matchmaking/cancel', { method: 'POST' });
  },

  async selectMode(id) {
    return request('/mode', { method: 'POST', body: JSON.stringify({ id }) });
  },

  async claimDaily() {
    return request('/shop/claim-daily', { method: 'POST' });
  },

  async buyItem(itemId) {
    return request('/shop/buy', { method: 'POST', body: JSON.stringify({ itemId }) });
  },

  async equip(category, id) {
    return request('/locker/equip', { method: 'POST', body: JSON.stringify({ category, id }) });
  },

  async addFriend(name) {
    return request('/friends', { method: 'POST', body: JSON.stringify({ name }) });
  },

  async removeFriend(name) {
    return request(`/friends/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },

  async inviteFriend(name) {
    return request('/friends/invite', { method: 'POST', body: JSON.stringify({ name }) });
  },

  async sendChat(text) {
    return request('/chat', { method: 'POST', body: JSON.stringify({ text }) });
  },
};
