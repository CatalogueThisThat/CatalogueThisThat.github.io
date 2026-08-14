import { CONFIG } from './config.js';
import { api, apiOnline } from './api.js';
import { state, applySession } from './state.js';
import { MODES, SHOP_ITEMS, CHAT_REPLIES } from './catalog.js';
import { ui } from './ui.js';

state.confirmRemoveIndex = -1;

function allReady() {
  return state.ready.length > 0 && state.ready.every(Boolean);
}

function canAfford(cost, currency) {
  return state.currency[currency] >= cost;
}

function spend(cost, currency) {
  state.currency[currency] -= cost;
  ui.renderCurrency();
}

async function syncFromApi(fn) {
  if (!apiOnline) return null;
  try {
    const session = await fn();
    applySession(session);
    ui.renderAll();
    return session;
  } catch (err) {
    ui.toast(err.message);
    return null;
  }
}

function showScreen(name) {
  ui.showScreen(name);
}

async function toggleReady() {
  if (apiOnline) {
    await syncFromApi(() => api.toggleReady());
  } else {
    state.ready[0] = !state.ready[0];
    state.searching = allReady();
    ui.renderParty();
    ui.updateScoreboard();
  }
  ui.toast(state.ready[0] ? 'You are ready' : 'You are not ready');
}

async function removePlayer(i) {
  const name = state.players[i];
  if (apiOnline) {
    await syncFromApi(() => api.removePlayer(i));
  } else {
    state.players.splice(i, 1);
    state.ready.splice(i, 1);
    state.searching = allReady();
    ui.renderParty();
    ui.updateScoreboard();
  }
  state.confirmRemoveIndex = -1;
  ui.renderParty();
  ui.toast(`${name} removed from squad`);
}

async function cancelFind() {
  if (apiOnline) {
    await syncFromApi(() => api.cancelFind());
  } else {
    state.searching = false;
    ui.updateScoreboard();
  }
}

async function selectMode(id) {
  if (apiOnline) {
    await syncFromApi(() => api.selectMode(id));
  } else {
    const m = MODES.find((x) => x.id === id);
    if (!m) return;
    state.mode = { id: m.id, label: m.label, value: m.value };
    state.seconds = 0;
    ui.renderModeTitle();
    ui.renderGamemodeScreen();
  }
  ui.toast(`Queued for ${state.mode.label} ${state.mode.value}`);
  ui.showScreen('lobby');
}

async function claimDaily() {
  if (apiOnline) {
    await syncFromApi(() => api.claimDaily());
  } else {
    if (state.dailyClaimed) return;
    state.dailyClaimed = true;
    state.currency.gems += 150;
    ui.renderCurrency();
    ui.renderShop();
  }
  ui.toast('+150 gems claimed');
}

function grantLocal(item) {
  if (item.grants === 'random') {
    const locked = [];
    Object.keys(state.locker).forEach((cat) => {
      state.locker[cat].forEach((entry) => {
        if (!entry.owned) locked.push({ cat, entry });
      });
    });
    if (locked.length) {
      const pick = locked[Math.floor(Math.random() * locked.length)];
      pick.entry.owned = true;
      ui.toast(`Crate opened: ${pick.entry.name}!`);
    } else {
      state.currency.gems += 100;
      ui.renderCurrency();
      ui.toast('Crate opened: 100 gems (everything else owned)');
    }
  } else {
    Object.keys(item.grants).forEach((cat) => {
      const id = item.grants[cat];
      const entry = state.locker[cat].find((x) => x.id === id);
      if (entry) entry.owned = true;
    });
    ui.toast(`${item.name} purchased`);
  }
}

async function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find((x) => x.id === itemId);
  if (!item) return;
  if (apiOnline) {
    try {
      const session = await api.buyItem(itemId);
      applySession(session);
      ui.renderAll();
      ui.toast(session.lastToast || `${item.name} purchased`);
    } catch (err) {
      ui.toast(err.message);
    }
    return;
  }
  if (!canAfford(item.cost, item.currency)) {
    ui.toast(`Not enough ${item.currency}`);
    return;
  }
  spend(item.cost, item.currency);
  grantLocal(item);
  ui.renderShop();
  ui.renderLocker();
}

async function equipItem(cat, id) {
  const entry = state.locker[cat].find((x) => x.id === id);
  if (!entry) return;
  if (!entry.owned) {
    ui.toast(`${entry.name} is locked — check the Shop`);
    ui.showScreen('shop');
    return;
  }
  if (state.equipped[cat] === id) return;
  if (apiOnline) {
    await syncFromApi(() => api.equip(cat, id));
  } else {
    state.equipped[cat] = id;
    ui.renderLocker();
  }
  ui.toast(`Equipped ${entry.name}`);
}

async function addFriend() {
  const input = document.getElementById('friendInput');
  const name = input.value.trim().toUpperCase();
  if (!name) return;
  if (state.friends.some((f) => f.name === name)) {
    ui.toast(`${name} is already on your list`);
    return;
  }
  if (apiOnline) {
    await syncFromApi(() => api.addFriend(name));
  } else {
    state.friends.push({ name, online: Math.random() > 0.4 });
    ui.renderFriends();
  }
  input.value = '';
  ui.toast(`${name} added`);
}

async function removeFriend(name) {
  if (apiOnline) {
    await syncFromApi(() => api.removeFriend(name));
  } else {
    state.friends = state.friends.filter((f) => f.name !== name);
    ui.renderFriends();
  }
  ui.toast(`Removed ${name}`);
}

async function inviteFriend(name) {
  const friend = state.friends.find((f) => f.name === name);
  if (apiOnline) {
    try {
      const result = await api.inviteFriend(name);
      ui.toast(result.message);
    } catch (err) {
      ui.toast(err.message);
    }
    return;
  }
  ui.toast(friend?.online ? `Invite sent to ${name}` : `${name} is offline`);
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  if (apiOnline) {
    try {
      const result = await api.sendChat(text);
      ui.appendChat(CONFIG.PLAYER_NAME, text, true);
      if (result.reply) {
        setTimeout(() => ui.appendChat(result.reply.sender, result.reply.text, false), result.reply.delay || 1000);
      }
    } catch (err) {
      ui.toast(err.message);
    }
    return;
  }
  ui.appendChat(CONFIG.PLAYER_NAME, text, true);
  const others = state.players.slice(1);
  const replier = others[Math.floor(Math.random() * others.length)];
  const reply = CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)];
  setTimeout(() => ui.appendChat(replier, reply, false), 900 + Math.random() * 900);
}

function toggleRow(el, cb) {
  el.classList.toggle('on');
  if (cb) cb(el.classList.contains('on'));
}

function toggleMusicFromRow(isOn) {
  if (isOn && !musicOn) toggleMusic();
  else if (!isOn && musicOn) toggleMusic();
}

function setVolume(v) {
  bgMusic.volume = v / 100;
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
bgMusic.volume = 0.5;

function startMusic() {
  if (!musicOn) return;
  bgMusic.play().catch(() => {
    document.addEventListener('click', function once() {
      if (musicOn) bgMusic.play().catch(() => {});
      document.removeEventListener('click', once);
    }, { once: true });
  });
}

function toggleMusic() {
  musicOn = !musicOn;
  document.getElementById('musicIcon').querySelector('use').setAttribute('href', musicOn ? '#i-music' : '#i-mute');
  document.getElementById('musicLabel').textContent = musicOn ? CONFIG.MUSIC_TRACK : 'MUTED';
  const row = document.getElementById('toggleMusicRow');
  if (row) row.classList.toggle('on', musicOn);
  if (musicOn) bgMusic.play().catch(() => {});
  else bgMusic.pause();
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

  function burst() {
    spotlights.forEach((el, i) => {
      clearTimeout(el._timer);
      setTimeout(() => {
        const dur = rand(500, 900);
        el.style.transitionDuration = `${dur}ms`;
        el.style.transform = `translate(${rand(-20, 20)}vw,${rand(-20, 20)}vh) rotate(${rand(-70, 70)}deg) scale(${rand(1.1, 1.5).toFixed(2)})`;
      }, i * 40);
    });
    setTimeout(driftSpotlights, 900);
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest?.('button')) burst();
  });
}

Object.assign(window, {
  showScreen,
  toggleReady,
  removePlayer,
  cancelFind,
  selectMode,
  claimDaily,
  buyShopItem,
  equipItem,
  addFriend,
  removeFriend,
  inviteFriend,
  sendMessage,
  toggleRow,
  toggleMusicFromRow,
  setVolume,
  resetSettings,
  toggleMusic,
});

setInterval(() => {
  if (!state.searching) return;
  state.seconds++;
  const timer = document.getElementById('findTimer');
  if (timer) timer.textContent = state.seconds;
}, 1000);

document.addEventListener('DOMContentLoaded', async () => {
  startMusic();
  startBackdrop();

  const online = await api.ping();
  if (online) {
    try {
      applySession(await api.getSession());
    } catch (err) {
      console.warn('Could not load session from API, using local data.', err);
    }
  }

  ui.renderAll();
  ui.seedChat();
  document.getElementById('findTimer').textContent = state.seconds;
});
