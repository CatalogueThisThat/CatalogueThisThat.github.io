import { CONFIG } from './config.js';

const handlers = new Map();

let ws = null;
let retries = 0;
let opened = false;
let wantConnect = false;
let generation = 0;
let pingTimer = 0;

export function onNet(type, fn) {
  handlers.set(type, fn);
}

export function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

export function connect() {
  const token = localStorage.getItem('match-room-token');
  if (!CONFIG.WS_URL || !token) return;
  wantConnect = true;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  generation += 1;
  const gen = generation;
  let sock;
  try {
    sock = new WebSocket(CONFIG.WS_URL);
  } catch {
    return;
  }
  ws = sock;
  sock.onopen = () => {
    if (gen !== generation || sock !== ws) return;
    opened = true;
    retries = 0;
    const liveToken = localStorage.getItem('match-room-token');
    if (!liveToken) return;
    sock.send(JSON.stringify({
      type: 'hello',
      token: liveToken,
      modeId: 'unranked-1v1',
    }));
    clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (sock === ws && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ type: 'ping' }));
      }
    }, 12000);
  };
  sock.onmessage = (ev) => {
    if (gen !== generation || sock !== ws) return;
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.type === 'pong') return;
    const fn = handlers.get(msg.type);
    if (fn) fn(msg);
  };
  sock.onclose = (ev) => {
    if (gen !== generation) return;
    opened = false;
    clearInterval(pingTimer);
    if (ev.code === 4001) return;
    if (!wantConnect || !localStorage.getItem('match-room-token')) return;
    const wait = Math.min(8000, 600 * 2 ** retries);
    retries += 1;
    setTimeout(() => {
      if (gen === generation && wantConnect) connect();
    }, wait);
  };
}

export function disconnect() {
  wantConnect = false;
  retries = 0;
  generation += 1;
  clearInterval(pingTimer);
  try { ws?.close(1000, 'bye'); } catch { /* */ }
  ws = null;
  opened = false;
}

export function isOpen() {
  return !!(ws && ws.readyState === WebSocket.OPEN);
}

export { opened };
