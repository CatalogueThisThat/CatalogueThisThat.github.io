import { state } from './state.js';
import {
  MODES,
  COIN_SHOP_ITEMS,
  GEM_SHOP_ITEMS,
  IAP_PACKS,
  SKIN_KITS,
  BATTLE_PASS,
  rewardLabel,
} from './catalog.js';

export const ui = {
  pendingInvites: [],

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
    const target = document.getElementById(`screen-${name}`);
    if (!target) return;
    document.querySelectorAll('.subscreen').forEach((el) => {
      el.classList.remove('active');
      el.style.display = 'none';
    });
    target.style.display = 'flex';
    target.classList.add('active');
    if (name === 'chat') {
      const log = document.getElementById('chatLog');
      log.scrollTop = log.scrollHeight;
    }
  },

  renderCurrency() {
    document.getElementById('gemValue').textContent = Number(state.currency.gems || 0).toLocaleString();
    document.getElementById('coinValue').textContent = Number(state.currency.coins || 0).toLocaleString();
  },

  renderProfile() {
    document.getElementById('namePill').textContent = state.name || 'ROOKIE';
    document.getElementById('levelChip').textContent = `LV ${state.level || 1}`;
    document.getElementById('xpChip').textContent = `${state.xpInto || 0} / ${state.xpNeed || 400}`;
    const rankChip = document.getElementById('rankChip');
    if (rankChip) {
      const rank = state.rank || { id: 'unranked', label: 'UNRANKED', color: '#9AA0AC' };
      rankChip.textContent = rank.label;
      rankChip.className = `rank-chip ${rank.id}`;
      rankChip.style.color = rank.color;
      rankChip.style.borderColor = rank.color;
    }
    const titleChip = document.getElementById('titleChip');
    if (titleChip) {
      const tid = state.equipped?.title;
      const entry = state.locker?.title?.find((x) => x.id === tid);
      if (tid && tid !== 'none' && entry) {
        titleChip.style.display = '';
        titleChip.textContent = entry.name;
      } else {
        titleChip.style.display = 'none';
        titleChip.textContent = '';
      }
    }
    const av = document.getElementById('playerAvatar');
    const kit = SKIN_KITS[state.equipped?.skin] || SKIN_KITS.base;
    ui.paintAvatar(av, state.avatar, kit.fill);
    const panelNav = document.getElementById('panelNav');
    if (panelNav) panelNav.style.display = state.admin ? '' : 'none';
    const live = document.getElementById('liveChip');
    if (live) {
      const n = Array.isArray(state.online) ? state.online.length : 0;
      live.textContent = state.connected
        ? `${n} ONLINE · ${state.liveMatches} MATCH${state.liveMatches === 1 ? '' : 'ES'}`
        : 'OFFLINE MODE';
    }
    const stats = document.getElementById('careerStats');
    if (stats && state.stats) {
      const s = state.stats;
      stats.textContent = `${s.wins}W  ${s.losses}L  ·  ${s.kills} ELIMS`;
    }
  },

  renderParty() {
    const wrap = document.getElementById('partyList');
    wrap.innerHTML = '';
    const members = state.party?.members?.length ? state.party.members : [];
    document.getElementById('partyHead').textContent =
      `SQUAD // ${members.length || 1} PLAYER${members.length === 1 ? '' : 'S'}`;
    members.forEach((m, i) => {
      if (state.confirmRemoveIndex === i) {
        const confirmRow = document.createElement('div');
        confirmRow.className = 'confirm-row';
        confirmRow.innerHTML =
          `<span class="confirm-text">REMOVE ${m.name} FROM SQUAD?</span>` +
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
      const canRemove = state.isCaptain && m.id !== state.id;
      const canPromote = state.isCaptain && m.id !== state.id;
      const kit = SKIN_KITS[m.equipped?.skin] || SKIN_KITS.base;
      row.className = 'party-row' + (canRemove ? ' removable' : '');
      const ready = m.ready;
      row.innerHTML =
        `<div class="party-avatar-wrap">` +
          (m.id === state.party.leader ? '<span class="captain-tag">CAPTAIN</span>' : '') +
          `<div class="party-avatar"></div>` +
        `</div>` +
        `<span class="party-name">${m.name}<span class="rank-chip ${m.rank?.id || 'unranked'}" style="color:${m.rank?.color || '#9AA0AC'};border-color:${m.rank?.color || '#9AA0AC'}">${m.rank?.label || 'UNRANKED'}</span></span>` +
        (canPromote ? `<button type="button" class="promote-btn" data-promote="${m.id}">PROMOTE</button>` : '') +
        `<button class="status-tag ${ready ? 'status-ready' : 'status-notready'}${m.id === state.id ? ' you' : ''}"` +
          (m.id === state.id ? ' onclick="toggleReady()"' : '') +
        `>${ready ? 'READY' : 'NOT READY'}</button>` +
        `<div class="lvl-tag">LV ${m.level || 1}</div>` +
        (canRemove ? '<div class="remove-overlay"><span class="remove-hint">CLICK TO REMOVE</span></div>' : '');
      if (canPromote) {
        row.querySelector('.promote-btn').onclick = (ev) => {
          ev.stopPropagation();
          window.promotePlayer(m.id);
        };
      }
      if (canRemove) {
        row.onclick = () => {
          state.confirmRemoveIndex = i;
          ui.renderParty();
        };
      }
      wrap.appendChild(row);
      ui.paintAvatar(row.querySelector('.party-avatar'), m.avatar, kit.fill);
    });
    ui.paintPartyOpts();
  },

  paintAvatar(el, avatar, fill) {
    if (!el) return;
    const show = localStorage.getItem('match-room-show-pfp') !== '0';
    if (show && avatar) {
      el.style.backgroundImage = `url("${avatar}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundColor = '#12141A';
    } else {
      el.style.backgroundImage = 'none';
      el.style.background = fill || '#12141A';
    }
  },

  paintPartyOpts() {
    const vs = document.getElementById('toggleVs');
    const ff = document.getElementById('toggleFf');
    const warn = document.getElementById('partyWarn');
    if (vs) vs.classList.toggle('on', !!state.party?.vsEachOther);
    if (ff) ff.classList.toggle('on', !!state.party?.friendlyFire);
    if (warn) warn.classList.toggle('on', !!state.party?.vsEachOther);
  },

  updateScoreboard() {
    const label = document.getElementById('scoreboardLabel');
    const bar = document.getElementById('scanBar');
    const cancelBtn = document.getElementById('cancelBtn');
    const findBtn = document.getElementById('findBtn');
    if (state.searching) {
      label.textContent = state.queueSize > 1 ? `MATCHING · ${state.queueSize} IN QUEUE` : 'FINDING OPPONENTS';
      bar.classList.remove('paused');
      cancelBtn.style.display = '';
      findBtn.style.display = 'none';
    } else {
      label.textContent = state.ready ? 'READY — FIND MATCH OR QUICK PLAY' : 'QUEUE UP WHEN YOU WANT A FIGHT';
      bar.classList.add('paused');
      cancelBtn.style.display = 'none';
      findBtn.style.display = '';
    }
    document.getElementById('findTimer').textContent = state.seconds || 0;
    document.getElementById('modeBlurb').textContent = state.mode.value === 'RANKED'
      ? 'Last squad standing. No respawns. Ranked MMR on the line.'
      : state.mode.value === 'TRAINING'
        ? 'Stand-still targets. Practice aim. No XP or currency.'
        : state.party?.vsEachOther
          ? 'Squad split fight. Uneven teams get underdog buffs. Unranked only.'
          : 'Team deathmatch. Respawn, first to 10 elims or the clock.';
  },

  renderModeTitle() {
    document.getElementById('modeTitle').innerHTML =
      `${state.mode.label}<span class="mode-value" id="modeValue">${state.mode.value}</span>`;
  },

  renderGamemodeScreen() {
    const rankedWrap = document.getElementById('gamemodeRanked');
    const unrankedWrap = document.getElementById('gamemodeUnranked');
    const trainWrap = document.getElementById('gamemodeTraining');
    rankedWrap?.replaceChildren();
    unrankedWrap?.replaceChildren();
    if (trainWrap) trainWrap.innerHTML = '';
    if (!rankedWrap || !unrankedWrap) return;
    MODES.forEach((m) => {
      const wrap = m.category === 'ranked' ? rankedWrap : m.category === 'training' ? trainWrap : unrankedWrap;
      if (!wrap) return;
      const cell = document.createElement('div');
      cell.className = 'gamemode-cell' + (m.id === state.mode.id ? ' selected' : '');
      cell.innerHTML =
        `<span class="gamemode-cell-tag">${m.value}</span>` +
        `<div class="glyph"><svg class="icon icon-lg"><use href="#${m.icon}"/></svg></div>` +
        `<div class="gamemode-cell-copy"><div class="gamemode-cell-label">${m.label}</div><div class="gamemode-cell-blurb">${m.blurb || ''}</div></div>`;
      cell.onclick = () => window.selectMode(m.id);
      wrap.appendChild(cell);
    });
  },

  isShopItemOwned(item) {
    if (item.grants === 'random') return false;
    return Object.keys(item.grants).every((cat) => {
      const id = item.grants[cat];
      const entry = state.locker[cat]?.find((x) => x.id === id);
      return entry && entry.owned;
    });
  },

  renderShop() {
    ui.renderCoinShop();
    ui.renderGemShop();
  },

  paintShopItem(item, currencyIcon) {
    const owned = ui.isShopItemOwned(item);
    const tile = document.createElement('div');
    tile.className = 'tile shop-featured';
    tile.innerHTML =
      `<div class="glyph"><svg class="icon icon-lg"><use href="#${item.icon}"/></svg></div>` +
      `<div class="tile-name">${item.name}</div>` +
      `<div class="tile-blurb">${item.blurb || ''}</div>` +
      `<div class="tile-price"><svg class="icon"><use href="#${currencyIcon}"/></svg>${item.cost.toLocaleString()}</div>` +
      `<button class="tile-btn ${owned ? 'owned' : 'buy'}">${owned ? 'OWNED' : 'BUY'}</button>`;
    if (!owned) tile.querySelector('button').onclick = () => window.buyShopItem(item.id);
    return tile;
  },

  paintIap(pack, wrap) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML =
      `<div class="glyph"><svg class="icon icon-lg"><use href="#${pack.kind === 'gems' ? 'i-diamond' : 'i-coin'}"/></svg></div>` +
      `<div class="tile-name">${pack.name}</div>` +
      `<div class="tile-blurb">Display only · no charge yet</div>` +
      `<div class="tile-price">£${pack.gbp.toFixed(2)}</div>` +
      `<button class="tile-btn buy">COMING SOON</button>`;
    tile.querySelector('button').onclick = () => window.mockIap(pack.id);
    wrap.appendChild(tile);
  },

  renderCoinShop() {
    const iap = document.getElementById('coinIap');
    const items = document.getElementById('coinItems');
    if (!iap || !items) return;
    iap.innerHTML = '';
    items.innerHTML = '';
    IAP_PACKS.filter((p) => p.kind === 'coins').forEach((pack) => ui.paintIap(pack, iap));
    COIN_SHOP_ITEMS.forEach((item) => items.appendChild(ui.paintShopItem(item, 'i-coin')));
  },

  renderGemShop() {
    const daily = document.getElementById('gemDaily');
    const iap = document.getElementById('gemIap');
    const items = document.getElementById('gemItems');
    if (!daily || !iap || !items) return;
    daily.innerHTML = '';
    iap.innerHTML = '';
    items.innerHTML = '';

    const dailyTile = document.createElement('div');
    dailyTile.className = 'tile shop-featured';
    dailyTile.innerHTML =
      `<div class="glyph"><svg class="icon icon-lg"><use href="#i-diamond"/></svg></div>` +
      `<div class="tile-name">Daily Gems</div>` +
      `<div class="tile-blurb">One claim per day</div>` +
      `<div class="tile-price">+85 GEMS · FREE</div>` +
      `<button class="tile-btn ${state.dailyClaimed ? 'owned' : 'buy'}">${state.dailyClaimed ? 'CLAIMED' : 'CLAIM'}</button>`;
    if (!state.dailyClaimed) dailyTile.querySelector('button').onclick = () => window.claimDaily();
    daily.appendChild(dailyTile);

    IAP_PACKS.filter((p) => p.kind === 'gems').forEach((pack) => ui.paintIap(pack, iap));
    GEM_SHOP_ITEMS.forEach((item) => items.appendChild(ui.paintShopItem(item, 'i-diamond')));
  },

  renderLockerCategory(cat, containerId) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = '';
    (state.locker[cat] || []).forEach((entry) => {
      const isEquipped = state.equipped[cat] === entry.id;
      const tile = document.createElement('div');
      tile.className = 'tile' + (isEquipped ? ' is-equipped' : '');
      const kit = cat === 'skin' ? SKIN_KITS[entry.id] : null;
      const btnClass = !entry.owned ? 'locked' : (isEquipped ? 'equipped' : 'equip');
      const btnLabel = !entry.owned ? 'LOCKED' : (isEquipped ? 'EQUIPPED' : 'EQUIP');
      tile.innerHTML =
        (isEquipped ? '<div class="tile-ribbon">ON</div>' : '') +
        `<div class="glyph"${kit ? ` style="color:${kit.fill}"` : ''}><svg class="icon icon-lg"><use href="#${entry.owned ? entry.icon : 'i-lock'}"/></svg></div>` +
        `<div class="tile-name">${entry.name}</div>` +
        `<button class="tile-btn ${btnClass}">${btnLabel}</button>`;
      tile.querySelector('button').onclick = () => window.equipItem(cat, entry.id);
      wrap.appendChild(tile);
    });
  },

  renderLocker() {
    ui.renderLockerCategory('skin', 'lockerSkins');
    ui.renderLockerCategory('gunSkin', 'lockerGunSkins');
    ui.renderLockerCategory('gun', 'lockerGuns');
    ui.renderLockerCategory('bulletSkin', 'lockerBullets');
    ui.renderLockerCategory('trail', 'lockerTrails');
    ui.renderLockerCategory('emote', 'lockerEmotes');
    ui.renderLockerCategory('badge', 'lockerBadges');
    ui.renderLockerCategory('title', 'lockerTitles');
  },

  renderPass() {
    const meta = document.getElementById('passMeta');
    const list = document.getElementById('passTiers');
    const buyRow = document.getElementById('passBuyRow');
    if (!meta || !list) return;
    meta.textContent = state.passOwned
      ? `PREMIUM UNLOCKED · LV ${state.level} · ${BATTLE_PASS.tiers.length} TIERS`
      : `FREE EVERY 5 · PREMIUM EVERY LEVEL · ${BATTLE_PASS.tiers.length} TIERS`;
    if (buyRow) buyRow.style.display = state.passOwned ? 'none' : '';
    const coinsBtn = document.getElementById('passBuyCoins');
    const gemsBtn = document.getElementById('passBuyGems');
    const gbpBtn = document.getElementById('passBuyGbp');
    if (coinsBtn) coinsBtn.textContent = `UNLOCK · ${BATTLE_PASS.premiumCostCoins.toLocaleString()} TOKENS`;
    if (gemsBtn) gemsBtn.textContent = `UNLOCK · ${BATTLE_PASS.premiumCostGems.toLocaleString()} GEMS`;
    if (gbpBtn) gbpBtn.textContent = `£${BATTLE_PASS.premiumGbp.toFixed(2)} · COMING SOON`;
    list.innerHTML = '';
    BATTLE_PASS.tiers.forEach((tier) => {
      const reached = state.level >= tier.level;
      const row = document.createElement('div');
      row.className = 'pass-row' + (reached ? ' reached' : '');
      row.innerHTML =
        `<div class="pass-lv">LV ${tier.level}</div>` +
        `<div class="pass-cell ${tier.free && reached ? 'got' : ''}"><span>FREE</span><b>${rewardLabel(tier.free)}</b></div>` +
        `<div class="pass-cell ${state.passOwned && tier.premium && reached ? 'got' : 'prem'}"><span>PREMIUM</span><b>${rewardLabel(tier.premium)}</b></div>`;
      list.appendChild(row);
    });
  },

  renderFriends() {
    const wrap = document.getElementById('friendsList');
    const live = document.getElementById('lobbyLive');
    const allOnline = Array.isArray(state.online) ? state.online : [];
    const others = allOnline.filter((p) => p && p.id && String(p.id) !== String(state.id));

    const matchOnline = (name) => {
      const n = String(name || '').toUpperCase().replace(/[^A-Z0-9_]/g, '');
      if (!n) return null;
      return allOnline.find((p) => {
        const pn = String(p.name || '').toUpperCase();
        return pn === n
          || pn.endsWith(n)
          || pn.includes(`_${n}`)
          || pn.startsWith(`GUEST_${n}`);
      }) || null;
    };

    if (live) {
      live.innerHTML = '';
      others.forEach((p) => {
        const row = document.createElement('div');
        row.className = 'friend-row';
        row.innerHTML =
          `<svg class="icon friend-status-icon online"><use href="#i-dot-filled"/></svg>` +
          `<span class="friend-name">${p.name}<span class="rank-chip ${p.rank?.id || 'unranked'}" style="color:${p.rank?.color || '#9AA0AC'};border-color:${p.rank?.color || '#9AA0AC'}">${p.rank?.label || 'UNRANKED'}</span></span>` +
          `<span class="friend-note">${p.inMatch ? 'IN MATCH' : p.searching ? 'QUEUED' : 'IN LOBBY'}</span>` +
          `<button class="friend-btn invite">INVITE</button>`;
        row.querySelector('.invite').onclick = () => window.inviteFriend(p.name);
        live.appendChild(row);
      });
      if (!live.children.length) {
        live.innerHTML = '<div class="friends-empty">Nobody else is online right now.</div>';
      }
    }
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!state.friends.length) {
      wrap.innerHTML = '<div class="friends-empty">No saved friends yet. Add them by exact callsign.</div>';
      return;
    }
    state.friends.forEach((name) => {
      const hit = matchOnline(name);
      const on = !!hit;
      const row = document.createElement('div');
      row.className = 'friend-row';
      row.innerHTML =
        `<svg class="icon friend-status-icon ${on ? 'online' : 'offline'}"><use href="#${on ? 'i-dot-filled' : 'i-dot-ring'}"/></svg>` +
        `<span class="friend-name">${name}</span>` +
        `<span class="friend-note">${on ? 'ONLINE' : 'OFFLINE'}</span>` +
        `<button class="friend-btn invite"${on ? '' : ' disabled'}>INVITE</button>` +
        `<button class="friend-btn remove">&times;</button>`;
      row.querySelector('.invite').onclick = () => {
        if (!on) {
          ui.toast(`${name} is offline`);
          return;
        }
        window.inviteFriend(hit.name);
      };
      row.querySelector('.remove').onclick = () => window.removeFriend(name);
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
    const log = document.getElementById('chatLog');
    if (!log || log.dataset.seeded) return;
    log.dataset.seeded = '1';
    ui.appendChat('SYSTEM', 'Quick 1v1 drops you into a fight vs a bot. Find Match fills empty slots with bots after a few seconds.', false);
    ui.appendChat('SYSTEM', 'WASD move · mouse aim · click shoot · SHIFT dash · Q ability · E emote · ESC forfeit', false);
  },

  showInvite(msg) {
    ui.pendingInvites = ui.pendingInvites.filter((x) => x.inviteId !== msg.inviteId);
    ui.pendingInvites.push(msg);
    ui.paintInvite();
  },

  hideInvite(inviteId) {
    if (inviteId) ui.pendingInvites = ui.pendingInvites.filter((x) => x.inviteId !== inviteId);
    else ui.pendingInvites = [];
    ui.paintInvite();
  },

  paintInvite() {
    const modal = document.getElementById('inviteModal');
    const current = ui.pendingInvites[0];
    if (!modal) return;
    if (!current) {
      modal.classList.remove('on');
      return;
    }
    document.getElementById('inviteFrom').textContent = current.from || 'ROOKIE';
    modal.classList.add('on');
  },

  renderAll() {
    ui.renderProfile();
    ui.renderCurrency();
    ui.renderParty();
    ui.updateScoreboard();
    ui.renderModeTitle();
    ui.renderGamemodeScreen();
    ui.renderShop();
    ui.renderLocker();
    ui.renderPass();
    ui.renderFriends();
    ui.renderAdmin();
  },

  renderAdmin() {
    const wrap = document.getElementById('adminList');
    if (!wrap) return;
    const rows = state.adminPlayers || [];
    wrap.innerHTML = rows.length ? '' : '<div class="friends-empty">Search an account to moderate.</div>';
    rows.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'friend-row admin-row';
      row.innerHTML =
        `<span class="friend-name">${p.name}<br><small>${p.email}</small></span>` +
        `<span class="friend-note">${p.online ? 'ONLINE' : 'OFF'} · ${p.rank?.label || ''} · ${p.coins}T ${p.gems}G</span>` +
        `<div class="admin-actions">` +
          `<button data-a="kick">KICK</button>` +
          `<button data-a="ban">BAN</button>` +
          `<button data-a="tempban">TEMP</button>` +
          `<button data-a="unban">UNBAN</button>` +
          `<button data-a="mute">MUTE</button>` +
          `<button data-a="unmute">UNMUTE</button>` +
          `<button data-a="block-ranked">RANKED ${p.blockRanked ? 'ON' : 'OFF'}</button>` +
          `<button data-a="block-unranked">UNRANKED ${p.blockUnranked ? 'ON' : 'OFF'}</button>` +
          `<button data-a="only-train">TRAIN-ONLY ${p.matchesOnlyTrain ? 'ON' : 'OFF'}</button>` +
          `<button data-a="forfeit">FORFEIT</button>` +
          `<button data-a="reset-rank">RESET RANK</button>` +
        `</div>`;
      row.querySelectorAll('button').forEach((btn) => {
        btn.onclick = () => window.adminAct(p.id, btn.dataset.a);
      });
      wrap.appendChild(row);
    });
    const logs = document.getElementById('adminLogs');
    if (logs) {
      const list = state.acLogs || [];
      logs.innerHTML = list.length
        ? list.map((l) => `<div class="friend-row"><span class="friend-name">${l.reason || 'abort'}</span><span class="friend-note">${(l.players || []).map((x) => x.name).join(', ')}</span></div>`).join('')
        : '<div class="friends-empty">No abort logs yet.</div>';
    }
  },
};
