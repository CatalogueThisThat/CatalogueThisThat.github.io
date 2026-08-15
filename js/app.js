import { CONFIG } from './config.js';
import { api } from './api.js';
import { state, applyLobby } from './state.js';
import { ui } from './ui.js';
import { connect, disconnect, onNet, send, isOpen } from './net.js';
import { startArena, applySnap, stopArena, showResults, hideResults, isPlaying, continueResults, skipRewardCinema } from './game.js';
import { sfx } from './sfx.js';
import { createLobbyMusic } from './music.js';

state.confirmRemoveIndex = -1;

function showScreen(name) {
  sfx.ui();
  ui.showScreen(name);
  if (name === 'friends') ui.renderFriends();
  if (name === 'shop' || name === 'shop-coins' || name === 'shop-gems') ui.renderShop();
  if (name === 'pass') ui.renderPass();
  if (name === 'panel' && state.admin) adminSearch();
}

function toggleReady() {
  send({ type: 'ready' });
  if (!isOpen()) {
    state.ready = !state.ready;
    ui.renderParty();
    ui.updateScoreboard();
  }
}

function removePlayer(i) {
  const m = state.party.members[i];
  if (!m) return;
  send({ type: 'party-kick', playerId: m.id });
  state.confirmRemoveIndex = -1;
}

function findMatch() {
  sfx.unlock();
  send({ type: 'queue' });
  if (!isOpen()) ui.toast('Connect to the arena server to play PVP');
}

function quickPlay() {
  sfx.unlock();
  send({ type: 'quickplay' });
  if (!isOpen()) ui.toast('Connect to the arena server to play PVP');
}

function cancelFind() {
  send({ type: 'cancel-queue' });
}

function selectMode(id) {
  send({ type: 'set-mode', id });
  ui.showScreen('lobby');
}

function claimDaily() {
  send({ type: 'shop-daily' });
}

function buyShopItem(itemId) {
  send({ type: 'shop-buy', itemId });
}

function equipItem(cat, id) {
  send({ type: 'locker-equip', category: cat, id });
}

function requireLink() {
  if (isOpen()) return true;
  ui.toast('Not connected to the arena server');
  return false;
}

function addFriend(nameOrPlayer, playerId = '') {
  let name = '';
  let id = playerId || '';
  if (nameOrPlayer && typeof nameOrPlayer === 'object') {
    name = String(nameOrPlayer.name || '').trim().toUpperCase();
    id = nameOrPlayer.id || id;
  } else if (typeof nameOrPlayer === 'string') {
    name = nameOrPlayer.trim().toUpperCase();
  } else {
    const input = document.getElementById('friendInput');
    name = (input?.value || '').trim().toUpperCase();
    if (input) input.value = '';
  }
  if (!id && !name) return;
  if (!requireLink()) return;
  const payload = { type: 'friend-add' };
  if (id) payload.playerId = id;
  if (name) payload.name = name;
  send(payload);
}

function removeFriend(friend) {
  if (!requireLink()) return;
  if (friend && typeof friend === 'object') {
    send({ type: 'friend-remove', playerId: friend.id || '', name: friend.name || '' });
    return;
  }
  send({ type: 'friend-remove', name: String(friend || '') });
}

function inviteFriend(name, playerId = '') {
  if (!requireLink()) return;
  const payload = { type: 'party-invite', name };
  if (playerId) payload.playerId = playerId;
  send(payload);
}

function invitePlayer(player) {
  if (!player?.id) {
    ui.toast('Player not found');
    return;
  }
  if (!requireLink()) return;
  send({ type: 'party-invite', playerId: player.id, name: player.name });
}

function respondInvite(accept) {
  const current = ui.pendingInvites[0];
  if (!current) return;
  if (!requireLink()) return;
  send({ type: 'party-invite-respond', inviteId: current.inviteId, accept: !!accept });
  ui.hideInvite(current.inviteId);
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  send({ type: 'chat', text });
  if (!isOpen()) ui.appendChat(CONFIG.PLAYER_NAME, text, true);
}

function renamePlayer() {
  if (state.guest) {
    ui.toast('Guest callsigns are locked');
    return;
  }
  const next = prompt('Callsign (letters/numbers, 16 max)', state.name || CONFIG.PLAYER_NAME);
  if (!next) return;
  CONFIG.setName(next);
  send({ type: 'set-name', name: next });
}

function buyPass(pay = 'coins') {
  send({ type: 'buy-pass', pay });
}

function mockIap(packId) {
  send({ type: 'shop-iap', packId });
}

function promotePlayer(playerId) {
  send({ type: 'party-promote', playerId });
}

function setGateError(text) {
  const el = document.getElementById('gateError');
  if (el) el.textContent = text || '';
}

function showGate(on) {
  document.body.classList.toggle('signed-in', !on);
  const gate = document.getElementById('gate');
  if (gate) gate.classList.toggle('on', on);
  if (on) lobbyMusic.pauseForMatch();
  else startMusic();
}

function saveSession(data) {
  localStorage.setItem('match-room-token', data.token);
  localStorage.setItem('match-room-id', data.playerId);
  localStorage.setItem('match-room-name', data.name);
  CONFIG.setName(data.name);
}

async function enterWith(fn) {
  setGateError('');
  try {
    const data = await fn();
    saveSession(data);
    disconnect();
    showGate(false);
    connect();
  } catch (err) {
    setGateError(err.message || 'Sign in failed');
  }
}

function registerAccount(ev) {
  ev?.preventDefault?.();
  const username = document.getElementById('regUser').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPass').value;
  enterWith(() => api.register({ username, email, password }));
}

function loginAccount(ev) {
  ev?.preventDefault?.();
  const login = document.getElementById('loginId').value;
  const password = document.getElementById('loginPass').value;
  enterWith(() => api.login({ login, password }));
}

function guestEnter(ev) {
  ev?.preventDefault?.();
  const name = document.getElementById('guestName').value;
  enterWith(() => api.guest({ name }));
}

async function logoutAccount() {
  const token = localStorage.getItem('match-room-token');
  try { await api.logout(token); } catch { /* */ }
  localStorage.removeItem('match-room-token');
  disconnect();
  showGate(true);
}

async function closeResults() {
  await continueResults();
  stopArena();
  ui.showScreen('lobby');
  lobbyMusic.resumeAfterMatch();
}

function forfeitMatch() {
  send({ type: 'forfeit' });
  stopArena();
  hideResults();
  lobbyMusic.resumeAfterMatch();
}

function togglePartyOpt(key) {
  if (!state.isCaptain) {
    ui.toast('Only the captain can change that');
    return;
  }
  const cur = !!state.party?.[key];
  send({ type: 'party-options', [key]: !cur });
}

function togglePfpFromRow(isOn) {
  localStorage.setItem('match-room-show-pfp', isOn ? '1' : '0');
  ui.renderAll();
}

function pickAvatar(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const img = new Image();
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 96;
      const ctx = c.getContext('2d');
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, 96, 96);
      send({ type: 'set-avatar', avatar: c.toDataURL('image/jpeg', 0.72) });
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  ev.target.value = '';
}

function clearAvatar() {
  send({ type: 'set-avatar', avatar: '' });
}

function adminSearch() {
  const query = document.getElementById('adminQuery')?.value || '';
  send({ type: 'admin-search', query });
}

function adminAct(playerId, action) {
  const payload = { type: 'admin-act', playerId, action };
  if (action === 'tempban' || action === 'mute') {
    const hours = Number(prompt('Hours', action === 'mute' ? '6' : '24'));
    if (!hours) return;
    payload.hours = hours;
  }
  if (action === 'forfeit') {
    payload.coins = Number(prompt('Tokens to remove', '0')) || 0;
    payload.gems = Number(prompt('Gems to remove', '0')) || 0;
  }
  send(payload);
}

function adminSelf(action) {
  if (!state.id) {
    ui.toast('Not signed in');
    return;
  }
  adminAct(state.id, action);
}

function toggleRow(el, cb) {
  el.classList.toggle('on');
  if (cb) cb(el.classList.contains('on'));
}

function toggleMusicFromRow(isOn) {
  if (isOn && !musicOn) toggleMusic();
  else if (!isOn && musicOn) toggleMusic();
}

function toggleSfxFromRow(isOn) {
  sfx.setEnabled(isOn);
}

function setVolume(v) {
  lobbyMusic.setVolume(v / 100);
  document.getElementById('volumeValue').textContent = `${v}%`;
}

function resetSettings() {
  document.querySelectorAll('#screen-settings .toggle').forEach((t, i) => {
    const shouldBeOn = i !== 2;
    t.classList.toggle('on', shouldBeOn);
  });
  document.getElementById('volumeSlider').value = 50;
  setVolume(50);
  ui.toast('Settings reset');
}

let musicOn = true;
const bgMusic = document.getElementById('bgMusic');
const lobbyMusic = createLobbyMusic(bgMusic);

function startMusic() {
  lobbyMusic.start();
}

function toggleMusic() {
  musicOn = !musicOn;
  lobbyMusic.setEnabled(musicOn);
  document.getElementById('musicIcon').querySelector('use').setAttribute('href', musicOn ? '#i-music' : '#i-mute');
  const row = document.getElementById('toggleMusicRow');
  if (row) row.classList.toggle('on', musicOn);
}

function skipMusic() {
  if (!musicOn) {
    ui.toast('Unmute to skip');
    return;
  }
  const track = lobbyMusic.skip();
  ui.toast(`Now playing · ${track?.title || 'NEXT'}`);
}

function startBackdrop() {
  const spotlights = [...document.querySelectorAll('.spotlight')];
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !spotlights.length) return;
  const rand = (min, max) => Math.random() * (max - min) + min;
  function driftSpotlights() {
    spotlights.forEach((el, i) => {
      setTimeout(function driftOne() {
        const dur = rand(1800, 3200);
        el.style.transitionDuration = `${dur}ms`;
        el.style.transform = `translate(${rand(-14, 14)}vw,${rand(-14, 14)}vh) rotate(${rand(-55, 55)}deg) scale(${rand(0.85, 1.35).toFixed(2)})`;
        el._timer = setTimeout(driftOne, dur);
      }, i * 220);
    });
  }
  driftSpotlights();
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('button')) return;
    spotlights.forEach((el, i) => {
      clearTimeout(el._timer);
      setTimeout(() => {
        const dur = rand(500, 900);
        el.style.transitionDuration = `${dur}ms`;
        el.style.transform = `translate(${rand(-20, 20)}vw,${rand(-20, 20)}vh) rotate(${rand(-70, 70)}deg) scale(${rand(1.1, 1.5).toFixed(2)})`;
      }, i * 40);
    });
    setTimeout(driftSpotlights, 900);
  });
}

let uplinked = false;

onNet('hello-ok', (msg) => {
  applyLobby(msg);
  showGate(false);
  try { ui.renderAll(); } catch (err) { console.error(err); }
  if (!uplinked) {
    uplinked = true;
    ui.toast('Arena uplink live');
  }
});

onNet('auth-required', (msg) => {
  uplinked = false;
  localStorage.removeItem('match-room-token');
  disconnect();
  showGate(true);
  setGateError(msg?.message || 'Sign in to enter the lobby');
});

onNet('lobby', (msg) => {
  if (Array.isArray(msg.online)) state.online = msg.online;
  if (msg.liveMatches != null) state.liveMatches = msg.liveMatches;
  if (isPlaying()) {
    ui.renderProfile();
    return;
  }
  applyLobby(msg);
  try { ui.renderAll(); } catch (err) { console.error(err); ui.renderProfile(); ui.renderFriends(); }
});

onNet('presence', (msg) => {
  if (Array.isArray(msg.online)) state.online = msg.online;
  if (msg.liveMatches != null) state.liveMatches = msg.liveMatches;
  ui.renderProfile();
  ui.renderFriends();
});

onNet('admin-list', (msg) => {
  state.adminPlayers = msg.players || [];
  state.acLogs = msg.logs || [];
  ui.renderAdmin();
});

onNet('toast', (msg) => {
  if (msg?.message) ui.toast(msg.message);
});

onNet('party-invite', (msg) => {
  try { sfx.ui(); } catch { /* */ }
  ui.showInvite(msg);
  ui.toast(`${msg.from || 'PLAYER'} invited you to a squad`);
});

onNet('party-invite-gone', (msg) => ui.hideInvite(msg.inviteId));

onNet('chat', (msg) => {
  ui.appendChat(msg.sender, msg.text, msg.from === state.id);
});

onNet('match-start', (msg) => {
  hideResults();
  stopArena();
  lobbyMusic.pauseForMatch();
  sfx.unlock();
  startArena(msg.snapshot, msg.you);
  ui.toast('Match found — fight');
});

onNet('snapshot', (msg) => {
  applySnap(msg.snapshot);
});

onNet('match-end', (msg) => {
  if (msg.you) applyLobby({ you: msg.you, party: state.party, mode: state.mode, online: state.online, liveMatches: state.liveMatches });
  showResults(msg.results, msg.you);
  ui.renderAll();
});

Object.assign(window, {
  showScreen,
  toggleReady,
  removePlayer,
  findMatch,
  quickPlay,
  cancelFind,
  selectMode,
  claimDaily,
  buyShopItem,
  equipItem,
  addFriend,
  removeFriend,
  inviteFriend,
  invitePlayer,
  togglePartyOpt,
  togglePfpFromRow,
  pickAvatar,
  clearAvatar,
  adminSearch,
  adminAct,
  adminSelf,
  respondInvite,
  sendMessage,
  renamePlayer,
  buyPass,
  mockIap,
  promotePlayer,
  registerAccount,
  loginAccount,
  guestEnter,
  logoutAccount,
  closeResults,
  skipRewardCinema,
  forfeitMatch,
  toggleRow,
  toggleMusicFromRow,
  toggleSfxFromRow,
  setVolume,
  resetSettings,
  toggleMusic,
  skipMusic,
});

setInterval(() => {
  if (!state.searching) return;
  const timer = document.getElementById('findTimer');
  if (timer) timer.textContent = state.seconds;
}, 500);

document.addEventListener('DOMContentLoaded', async () => {
  startBackdrop();
  const sfxToggle = document.getElementById('toggleSfxRow');
  if (sfxToggle) sfxToggle.classList.toggle('on', sfx.enabled);
  const pfp = document.getElementById('togglePfp');
  if (pfp) pfp.classList.toggle('on', localStorage.getItem('match-room-show-pfp') !== '0');
  await api.ping();
  ui.seedChat();
  const friendInput = document.getElementById('friendInput');
  if (friendInput) {
    friendInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        addFriend();
      }
    });
  }
  if (localStorage.getItem('match-room-token')) {
    showGate(false);
    connect();
  } else {
    showGate(true);
  }
  // Backup presence poll in case a WS lobby frame is dropped
  setInterval(async () => {
    if (!state.connected && !localStorage.getItem('match-room-token')) return;
    try {
      const live = await fetch(`${CONFIG.API_BASE_URL}/live`).then((r) => r.json());
      if (!Array.isArray(live?.online)) return;
      state.online = live.online;
      state.liveMatches = live.matches || 0;
      ui.renderProfile();
      const friendsScreen = document.getElementById('screen-friends');
      if (friendsScreen?.classList.contains('active') || friendsScreen?.style.display === 'flex') {
        ui.renderFriends();
      }
    } catch { /* */ }
  }, 4000);
});
