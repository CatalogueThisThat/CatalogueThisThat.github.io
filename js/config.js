function isGitHubPages() {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
}

/** Public HTTPS API for GitHub Pages (Tailscale Funnel → lobby backend). */
const GHP_API_BASE = 'https://localhost-0.tailaaf6e6.ts.net/api';

function resolveApiBase() {
  if (typeof window === 'undefined') return '/api';
  if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
  const stored = localStorage.getItem('API_BASE_URL');
  if (stored) return stored;
  if (isGitHubPages()) return GHP_API_BASE;
  const { hostname, port } = window.location;
  if (hostname === '100.74.187.100' || hostname.endsWith('.ts.net')) return '/api';
  if (port === '3000' || port === '') return '/api';
  return 'http://localhost:3000/api';
}

function resolveWsUrl(apiBase) {
  if (!apiBase) return '';
  try {
    const u = new URL(apiBase, window.location.origin);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${u.host}/ws`;
  } catch {
    return '';
  }
}

function uuid() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function playerId() {
  const key = 'match-room-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuid();
    localStorage.setItem(key, id);
  }
  return id;
}

function playerName() {
  return (localStorage.getItem('match-room-name') || 'YEALEXK').toUpperCase();
}

export const CONFIG = {
  VERSION: '3.0.0',
  API_BASE_URL: resolveApiBase(),
  get WS_URL() {
    return resolveWsUrl(this.API_BASE_URL);
  },
  MUSIC_TRACK: 'WORLD HOLD ON',
  PLAYER_ID: typeof window === 'undefined' ? '' : playerId(),
  get PLAYER_NAME() {
    return playerName();
  },
  setName(name) {
    localStorage.setItem('match-room-name', String(name || 'ROOKIE').toUpperCase().slice(0, 16));
  },
};
