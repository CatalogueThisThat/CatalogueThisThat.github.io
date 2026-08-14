import { state } from './state.js';
import { MODES, SHOP_ITEMS } from './catalog.js';

export const ui = {
  toast(msg) {
    const stack = document.getElementById('toastStack');
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = msg;
    stack.appendChild(item);
    setTimeout(() => {
      item.classList.add('out');
      setTimeout(() => item.remove(), 300);
    }, 2200);
  },

  showScreen(name) {
    document.querySelectorAll('.subscreen').forEach((el) => {
      el.classList.remove('active');
      el.style.display = 'none';
    });
    const target = document.getElementById(`screen-${name}`);
    target.style.display = 'flex';
    target.classList.add('active');
    if (name === 'chat') {
      const log = document.getElementById('chatLog');
      log.scrollTop = log.scrollHeight;
    }
  },

  renderCurrency() {
    document.getElementById('gemValue').textContent = state.currency.gems.toLocaleString();
    document.getElementById('coinValue').textContent = state.currency.coins.toLocaleString();
  },

  renderParty() {
    const wrap = document.getElementById('partyList');
    wrap.innerHTML = '';
    state.players.forEach((name, i) => {
      if (i === state.confirmRemoveIndex) {
        const confirmRow = document.createElement('div');
        confirmRow.className = 'confirm-row';
        confirmRow.innerHTML =
          `<span class="confirm-text">REMOVE ${name} FROM SQUAD?</span>` +
          `<button class="confirm-btn yes">YES, REMOVE</button>` +
          `<button class="confirm-btn no">CANCEL</button>`;
        confirmRow.querySelector('.yes').onclick = () => window.removePlayer(i);
        confirmRow.querySelector('.no').onclick = () => {
          state.confirmRemoveIndex = -1;
          ui.renderParty();
        };
        wrap.appendChild(confirmRow);
        return;
      }

      const row = document.createElement('div');
      const canRemove = state.isCaptain && i !== 0;
      row.className = 'party-row' + (canRemove ? ' removable' : '');
      const ready = state.ready[i];
      row.innerHTML =
        `<div class="party-avatar-wrap">` +
          (i === 0 ? '<span class="captain-tag">CAPTAIN</span>' : '') +
          `<div class="party-avatar"></div>` +
        `</div>` +
        `<span class="party-name">${name}</span>` +
        `<button class="status-tag ${ready ? 'status-ready' : 'status-notready'}${i === 0 ? ' you' : ''}"` +
          (i === 0 ? ' onclick="toggleReady()"' : '') +
        `>${ready ? 'READY' : 'NOT READY'}</button>` +
        `<div class="lvl-tag">LV 5</div>` +
        (canRemove ? '<div class="remove-overlay"><span class="remove-hint">CLICK TO REMOVE</span></div>' : '');
      if (canRemove) {
        row.onclick = () => {
          state.confirmRemoveIndex = i;
          ui.renderParty();
        };
      }
      wrap.appendChild(row);
    });
  },

  updateScoreboard() {
    const label = document.getElementById('scoreboardLabel');
    const bar = document.getElementById('scanBar');
    const cancelBtn = document.getElementById('cancelBtn');
    if (state.searching) {
      label.textContent = 'FINDING GAME';
      bar.classList.remove('paused');
      cancelBtn.style.display = '';
    } else if (state.ready.length > 0 && state.ready.every(Boolean)) {
      label.textContent = 'SEARCH CANCELLED';
      bar.classList.add('paused');
      cancelBtn.style.display = 'none';
    } else {
      label.textContent = 'WAITING ON SQUAD';
      bar.classList.add('paused');
      cancelBtn.style.display = 'none';
    }
  },

  renderModeTitle() {
    document.getElementById('modeTitle').innerHTML =
      `${state.mode.label}<span class="mode-value" id="modeValue">${state.mode.value}</span>`;
  },

  renderGamemodeScreen() {
    const rankedWrap = document.getElementById('gamemodeRanked');
    const unrankedWrap = document.getElementById('gamemodeUnranked');
    rankedWrap.innerHTML = '';
    unrankedWrap.innerHTML = '';
    MODES.forEach((m) => {
      const wrap = m.category === 'ranked' ? rankedWrap : unrankedWrap;
      const cell = document.createElement('div');
      cell.className = 'gamemode-cell' + (m.id === state.mode.id ? ' selected' : '');
      cell.innerHTML =
        `<span class="gamemode-cell-tag">${m.value}</span>` +
        `<div class="glyph"><svg class="icon icon-lg"><use href="#${m.icon}"/></svg></div>` +
        `<div class="gamemode-cell-label">${m.label}</div>`;
      cell.onclick = () => window.selectMode(m.id);
      wrap.appendChild(cell);
    });
  },

  isShopItemOwned(item) {
    if (item.grants === 'random') return false;
    return Object.keys(item.grants).every((cat) => {
      const id = item.grants[cat];
      const entry = state.locker[cat].find((x) => x.id === id);
      return entry && entry.owned;
    });
  },

  renderShop() {
    const daily = document.getElementById('shopDaily');
    daily.innerHTML = '';
    const dailyTile = document.createElement('div');
    dailyTile.className = 'tile';
    dailyTile.innerHTML =
      `<div class="glyph"><svg class="icon icon-lg"><use href="#i-diamond"/></svg></div>` +
      `<div class="tile-name">Daily Bonus</div>` +
      `<div class="tile-price">+150 GEMS &middot; FREE</div>` +
      `<button class="tile-btn ${state.dailyClaimed ? 'owned' : 'buy'}">${state.dailyClaimed ? 'CLAIMED' : 'CLAIM'}</button>`;
    if (!state.dailyClaimed) {
      dailyTile.querySelector('button').onclick = () => window.claimDaily();
    }
    daily.appendChild(dailyTile);

    const wrap = document.getElementById('shopItems');
    wrap.innerHTML = '';
    SHOP_ITEMS.forEach((item) => {
      const owned = ui.isShopItemOwned(item);
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.innerHTML =
        `<div class="glyph"><svg class="icon icon-lg"><use href="#${item.icon}"/></svg></div>` +
        `<div class="tile-name">${item.name}</div>` +
        `<div class="tile-price"><svg class="icon"><use href="#${item.currency === 'gems' ? 'i-diamond' : 'i-coin'}"/></svg>${item.cost.toLocaleString()}</div>` +
        `<button class="tile-btn ${owned ? 'owned' : 'buy'}">${owned ? 'OWNED' : 'BUY'}</button>`;
      if (!owned) {
        tile.querySelector('button').onclick = () => window.buyShopItem(item.id);
      }
      wrap.appendChild(tile);
    });
  },

  renderLockerCategory(cat, containerId) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = '';
    state.locker[cat].forEach((entry) => {
      const isEquipped = state.equipped[cat] === entry.id;
      const tile = document.createElement('div');
      tile.className = 'tile' + (isEquipped ? ' is-equipped' : '');
      const btnClass = !entry.owned ? 'locked' : (isEquipped ? 'equipped' : 'equip');
      const btnLabel = !entry.owned ? 'LOCKED' : (isEquipped ? 'EQUIPPED' : 'EQUIP');
      tile.innerHTML =
        (isEquipped ? '<div class="tile-ribbon">ON</div>' : '') +
        `<div class="glyph"><svg class="icon icon-lg"><use href="#${entry.owned ? entry.icon : 'i-lock'}"/></svg></div>` +
        `<div class="tile-name">${entry.name}</div>` +
        `<button class="tile-btn ${btnClass}">${btnLabel}</button>`;
      tile.querySelector('button').onclick = () => window.equipItem(cat, entry.id);
      wrap.appendChild(tile);
    });
  },

  renderLocker() {
    ui.renderLockerCategory('skin', 'lockerSkins');
    ui.renderLockerCategory('trail', 'lockerTrails');
    ui.renderLockerCategory('emote', 'lockerEmotes');
    ui.renderLockerCategory('badge', 'lockerBadges');
  },

  renderFriends() {
    const wrap = document.getElementById('friendsList');
    wrap.innerHTML = '';
    if (!state.friends.length) {
      wrap.innerHTML = '<div class="friends-empty">No friends added yet.</div>';
      return;
    }
    state.friends.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'friend-row';
      row.innerHTML =
        `<svg class="icon friend-status-icon ${f.online ? 'online' : 'offline'}"><use href="#${f.online ? 'i-dot-filled' : 'i-dot-ring'}"/></svg>` +
        `<span class="friend-name">${f.name}</span>` +
        `<span class="friend-note">${f.online ? 'ONLINE' : 'OFFLINE'}</span>` +
        `<button class="friend-btn invite">INVITE</button>` +
        `<button class="friend-btn remove">&times;</button>`;
      row.querySelector('.invite').onclick = () => window.inviteFriend(f.name);
      row.querySelector('.remove').onclick = () => window.removeFriend(f.name);
      wrap.appendChild(row);
    });
  },

  appendChat(sender, text, mine) {
    const log = document.getElementById('chatLog');
    const line = document.createElement('div');
    line.className = 'chat-line' + (mine ? ' me' : '');
    line.innerHTML = `<b>${sender}:</b> ${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  seedChat() {
    ui.appendChat('YENAZARK', 'ready when you are', false);
    ui.appendChat('YEHARRYA', 'one sec, changing loadout', false);
    ui.appendChat('NIGGYCARROT', 'lets go 2v2 ranked', false);
  },

  renderAll() {
    ui.renderCurrency();
    ui.renderParty();
    ui.updateScoreboard();
    ui.renderModeTitle();
    ui.renderGamemodeScreen();
    ui.renderShop();
    ui.renderLocker();
    ui.renderFriends();
  },
};
