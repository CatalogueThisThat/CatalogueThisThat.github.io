function resolveApiBase() {
  if (typeof window === 'undefined') return '/api';
  if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
  const stored = localStorage.getItem('API_BASE_URL');
  if (stored) return stored;

  const { hostname, port } = window.location;
  if (hostname.endsWith('github.io')) return '';
  if (port === '3000') return '/api';
  return 'http://localhost:3000/api';
}

export const CONFIG = {
  VERSION: '2.0.0',
  API_BASE_URL: resolveApiBase(),
  MUSIC_TRACK: 'WORLD HOLD ON',
  PLAYER_NAME: 'YEALEXK',
};
