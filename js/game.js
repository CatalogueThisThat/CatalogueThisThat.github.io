import { TRAIL_KITS, BULLET_SKIN_KITS } from './catalog.js';
import { send } from './net.js';
import { sfx } from './sfx.js';
import {
  bindMobileControls,
  unbindMobileControls,
  showMobileControls,
  hideMobileControls,
  mobileInput,
  mobileAimAt,
} from './mobile.js';
import { playRewardCinema, requestRewardSkip, isRewardCinemaOpen } from './rewards.js';
import { rankIconHtml, normalizeRank } from './ranks.js';

const canvas = () => document.getElementById('arenaCanvas');
const wrap = () => document.getElementById('arena');

let snap = null;
let matchId = '';
let youId = '';
let raf = 0;
let running = false;
let bound = false;
const keys = new Set();
const mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };
const particles = [];
const floaters = [];
const trails = new Map();
let cam = { x: 1800, y: 1200 };
let lastSend = 0;
let dashQueued = false;
let emoteQueued = false;
let abilityQueued = false;
let killFeed = [];
let hitFlash = 0;

export function isPlaying() {
  return running;
}

export function startArena(firstSnap, id) {
  unbind();
  youId = id;
  matchId = firstSnap?.id || '';
  killFeed = [];
  particles.length = 0;
  floaters.length = 0;
  trails.clear();
  keys.clear();
  mouse.down = false;
  dashQueued = false;
  emoteQueued = false;
  abilityQueued = false;
  hitFlash = 0;
  snap = null;
  applySnap(firstSnap);
  const self = me();
  if (self) {
    cam.x = self.x;
    cam.y = self.y;
  }
  running = true;
  wrap().classList.add('on');
  document.body.classList.add('in-arena');
  const banner = document.getElementById('arenaBanner');
  if (banner) {
    banner.style.display = '';
    banner.textContent = '3';
  }
  showBuffToast(firstSnap, id);
  resize();
  bind();
  showMobileControls();
  if (!raf) loop();
}

function showBuffToast(snapIn, id) {
  const el = document.getElementById('buffToast');
  if (!el) return;
  const meRow = (snapIn?.players || []).find((p) => p.id === id);
  if (meRow?.underdog && snapIn?.underdogBuff?.label) {
    el.style.display = '';
    el.textContent = `UNDERDOG BUFF · ${snapIn.underdogBuff.label}`;
    setTimeout(() => {
      if (el.textContent.includes('UNDERDOG')) el.style.display = 'none';
    }, 6000);
  } else {
    el.style.display = 'none';
  }
}

export function applySnap(next) {
  if (!next) return;
  if (matchId && next.id && next.id !== matchId) return;
  if (next.id) matchId = next.id;
  if (next.events) {
    for (const ev of next.events) ingest(ev);
  }
  snap = next;
}

export function stopArena() {
  running = false;
  matchId = '';
  youId = '';
  snap = null;
  wrap()?.classList.remove('on');
  document.body.classList.remove('in-arena');
  hideMobileControls();
  unbind();
  killFeed = [];
  particles.length = 0;
  floaters.length = 0;
  trails.clear();
  const banner = document.getElementById('arenaBanner');
  if (banner) banner.style.display = 'none';
  const buff = document.getElementById('buffToast');
  if (buff) buff.style.display = 'none';
}

let pendingRewards = null;
let cinemaStarted = false;

export function showResults(results, you) {
  const el = document.getElementById('results');
  el.classList.add('on');
  cinemaStarted = false;
  pendingRewards = null;
  const myId = you?.id || youId;
  const mine = results.players.find((p) => p.id === myId) || {};
  const won = mine.team === results.winner;
  const rw = mine.rewards || {};
  const btn = document.getElementById('resultsContinue');
  const rewardsEl = document.getElementById('resultsRewards');

  if (results.aborted) {
    document.getElementById('resultsBanner').textContent = 'ABORTED';
    document.getElementById('resultsBanner').className = 'results-banner loss';
    document.getElementById('resultsSub').textContent = results.abortReason || 'Anti-cheat aborted the match';
    rewardsEl.textContent = 'No rank or rewards.';
    if (btn) btn.textContent = 'BACK TO LOBBY';
  } else {
    document.getElementById('resultsBanner').textContent = results.training ? 'RANGE COMPLETE' : (won ? 'VICTORY' : 'DEFEAT');
    document.getElementById('resultsBanner').className = 'results-banner ' + (won ? 'win' : 'loss');
    document.getElementById('resultsSub').textContent =
      `${results.mode.label} ${results.mode.value}  ·  ${results.teamScore[0]} – ${results.teamScore[1]}`;
    if (results.training) {
      rewardsEl.textContent = 'Training — no XP or currency.';
      if (btn) btn.textContent = 'BACK TO LOBBY';
    } else {
      pendingRewards = rw;
      const rank = normalizeRank(rw.rank);
      rewardsEl.innerHTML =
        `<div class="results-reward-hint">Rewards ready — chest opening next</div>` +
        `<div class="results-rank-preview">${rankIconHtml(rank, { size: 40 })}` +
          `<span style="color:${rank.color}">${rank.label}</span>` +
          (rw.mmrDelta != null ? `<span class="mmr-delta">${rw.mmrDelta >= 0 ? '+' : ''}${rw.mmrDelta} MMR</span>` : '') +
        `</div>` +
        (rw.unlocked ? `<div class="results-unlock">${rw.unlocked}</div>` : '');
      if (btn) btn.textContent = 'CLAIM REWARDS';
    }
  }
  const body = document.getElementById('resultsRows');
  body.innerHTML = results.players
    .sort((a, b) => b.kills - a.kills)
    .map((p) => {
      const tag = p.team === 0 ? 'COBALT' : 'EMBER';
      const meRow = p.id === myId ? ' me' : '';
      return `<div class="result-row team-${p.team}${meRow}"><span>${p.name}${p.isBot ? ' · BOT' : ''}</span><span>${tag}</span><span>${p.kills} / ${p.deaths}</span><span>${p.dmg} DMG</span></div>`;
    })
    .join('');
}

/** Called by CONTINUE / CLAIM — runs chest→rank cinema then returns to lobby. */
export async function continueResults() {
  if (isRewardCinemaOpen()) return;
  const btn = document.getElementById('resultsContinue');
  if (pendingRewards && !cinemaStarted) {
    cinemaStarted = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'OPENING…';
    }
    try {
      await playRewardCinema(pendingRewards);
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  hideResults();
  pendingRewards = null;
  cinemaStarted = false;
}

export function skipRewardCinema() {
  requestRewardSkip();
}

export function hideResults() {
  document.getElementById('results')?.classList.remove('on');
}

function ingest(ev) {
  if (ev.kind === 'kill') {
    killFeed.unshift(ev);
    killFeed = killFeed.slice(0, 6);
    burst(ev.x, ev.y, ev.killerTeam === 0 ? '#2F6BFF' : '#FF6B2C', 18);
    sfx.kill();
  }
  if (ev.kind === 'hit') {
    burst(ev.x, ev.y, '#F5F1E6', 8);
    floaters.push({ x: ev.x, y: ev.y - 20, text: String(ev.dmg || 0), life: 0.6 });
    if (ev.id === youId) hitFlash = 1;
    sfx.hit();
  }
  if (ev.kind === 'spark') burst(ev.x, ev.y, '#9AA0AC', 4);
  if (ev.kind === 'shot' && ev.team === me()?.team) sfx.shot();
  if (ev.kind === 'dash') sfx.dash();
  if (ev.kind === 'pickup') sfx.pickup();
  if (ev.kind === 'ability') {
    sfx.ability();
    floaters.push({ x: ev.x, y: ev.y - 40, text: ev.name || 'ABILITY', life: 0.8 });
  }
}

function burst(x, y, color, n) {
  if (x == null) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 180;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45, color });
  }
}

function resize() {
  const c = canvas();
  if (!c) return;
  c.width = window.innerWidth * devicePixelRatio;
  c.height = window.innerHeight * devicePixelRatio;
  c.style.width = '100%';
  c.style.height = '100%';
}

function me() {
  return snap?.players?.find((p) => p.id === youId);
}

function camTarget() {
  const self = me();
  if (self?.alive) return self;
  const killer = killFeed[0]?.killerId;
  const k = snap?.players?.find((p) => p.id === killer && p.alive);
  if (k) return k;
  return snap?.players?.find((p) => p.team === self?.team && p.alive) || snap?.players?.find((p) => p.alive) || self;
}

function loop() {
  raf = requestAnimationFrame(loop);
  const c = canvas();
  if (!c || !running || !snap) return;
  const ctx = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  const w = c.width / dpr;
  const h = c.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const focus = camTarget();
  if (focus) {
    cam.x += (focus.x - cam.x) * 0.14;
    cam.y += (focus.y - cam.y) * 0.14;
  }
  const ox = w / 2 - cam.x;
  const oy = h / 2 - cam.y;

  ctx.fillStyle = '#12141A';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(ox, oy);
  drawFloor(ctx);
  drawWalls(ctx);
  drawDummies(ctx);
  drawPickups(ctx);
  drawTrails(ctx);
  drawBullets(ctx);
  drawPlayers(ctx);
  stepParticles(ctx);
  stepFloaters(ctx);
  ctx.restore();

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,107,44,${hitFlash * 0.22})`;
    ctx.fillRect(0, 0, w, h);
    hitFlash *= 0.86;
  }

  drawMinimap(ctx, w, h);
  paintHud();
  sendInput();
}

function drawFloor(ctx) {
  const { w: ww, h: hh } = snap.world;
  ctx.fillStyle = '#161922';
  ctx.fillRect(0, 0, ww, hh);
  ctx.strokeStyle = 'rgba(245,241,230,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < ww; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, hh);
    ctx.stroke();
  }
  for (let y = 0; y < hh; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ww, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(47,107,255,0.06)';
  ctx.fillRect(0, 0, ww, hh * 0.22);
  ctx.fillRect(ww * 0.78, 0, ww * 0.22, hh);
  ctx.fillStyle = 'rgba(255,107,44,0.06)';
  ctx.fillRect(0, hh * 0.78, ww, hh * 0.22);
  ctx.fillRect(0, 0, ww * 0.22, hh);
  for (const b of snap.bases || []) {
    ctx.fillStyle = b.team === 0 ? 'rgba(47,107,255,0.2)' : 'rgba(255,107,44,0.2)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
}

function drawWalls(ctx) {
  ctx.fillStyle = '#0A0B0E';
  ctx.strokeStyle = '#2F6BFF';
  ctx.lineWidth = 2;
  for (const wall of snap.walls || []) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
  }
}

function drawDummies(ctx) {
  for (const d of snap.dummies || []) {
    ctx.save();
    ctx.globalAlpha = d.alive ? 1 : 0.25;
    ctx.fillStyle = '#9AA0AC';
    ctx.strokeStyle = '#0A0B0E';
    ctx.lineWidth = 3;
    ctx.fillRect(d.x - 18, d.y - 28, 36, 56);
    ctx.strokeRect(d.x - 18, d.y - 28, 36, 56);
    ctx.fillStyle = '#0A0B0E';
    ctx.fillRect(d.x - 16, d.y + 32, 32, 5);
    ctx.fillStyle = '#C8FF3D';
    ctx.fillRect(d.x - 16, d.y + 32, 32 * (Math.max(0, d.hp) / (d.maxHp || 80)), 5);
    ctx.fillStyle = '#F5F1E6';
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET', d.x, d.y - 36);
    ctx.restore();
  }
}

function drawPickups(ctx) {
  for (const u of snap.pickups || []) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(performance.now() / 400);
    ctx.fillStyle = u.kind === 'hp' ? '#FF6B2C' : u.kind === 'core' ? '#C8FF3D' : '#2F6BFF';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.restore();
  }
}

function drawTrails(ctx) {
  for (const p of snap.players) {
    if (!p.alive) continue;
    if (!trails.has(p.id)) trails.set(p.id, []);
    const list = trails.get(p.id);
    list.push({ x: p.x, y: p.y });
    if (list.length > 18) list.shift();
    const kit = TRAIL_KITS[p.cosmetics?.trail] || TRAIL_KITS.base;
    ctx.strokeStyle = p.trailColor || kit.color;
    ctx.lineWidth = kit.width;
    ctx.beginPath();
    list.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  }
}

function drawBullets(ctx) {
  for (const b of snap.bullets || []) {
    const kit = BULLET_SKIN_KITS[b.bulletSkin] || BULLET_SKIN_KITS.stock;
    ctx.fillStyle = b.team === 0 ? kit.color0 : kit.color1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, kit.radius || 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayers(ctx) {
  for (const p of snap.players) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!p.alive) ctx.globalAlpha = 0.22;
    else if (p.cloak > 0) ctx.globalAlpha = p.id === youId ? 0.45 : 0.12;
    ctx.fillStyle = '#0A0B0E';
    ctx.fillRect(-16, 28, 32, 4);
    ctx.fillStyle = p.fill || (p.team === 0 ? '#2F6BFF' : '#FF6B2C');
    ctx.fillRect(-16, 28, 32 * (Math.max(0, p.hp) / Math.max(1, p.maxHp || 100)), 4);
    if (p.shield > 0) {
      ctx.strokeStyle = '#F5F1E6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate(p.aim);
    ctx.fillStyle = p.fill || (p.team === 0 ? '#2F6BFF' : '#FF6B2C');
    ctx.strokeStyle = '#0A0B0E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-16, 16);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-16, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.accent || '#F5F1E6';
    ctx.fillRect(10, -3, 18, 6);
    ctx.restore();

    ctx.globalAlpha = p.cloak > 0 && p.id !== youId ? 0.2 : 1;
    ctx.fillStyle = '#F5F1E6';
    ctx.font = '700 12px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.name + (p.id === youId ? '  ▼' : ''), p.x, p.y - 34);
    if (p.emoteT > 0) {
      ctx.font = '20px sans-serif';
      ctx.fillText(p.cosmetics?.emote === 'flex' ? '✊' : p.cosmetics?.emote === 'dance' ? '✦' : '👋', p.x, p.y - 52);
    }
    ctx.globalAlpha = 1;
  }
}

function stepParticles(ctx) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.016;
    p.x += p.vx * 0.016;
    p.y += p.vy * 0.016;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1;
  }
}

function stepFloaters(ctx) {
  ctx.font = '700 14px "Space Mono", monospace';
  ctx.textAlign = 'center';
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= 0.016;
    f.y -= 28 * 0.016;
    if (f.life <= 0) {
      floaters.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.max(0, f.life * 1.6);
    ctx.fillStyle = '#F5F1E6';
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
}

function drawMinimap(ctx, w) {
  const mw = 210;
  const mh = 140;
  const x = w - mw - 18;
  const y = 18;
  const sx = mw / snap.world.w;
  const sy = mh / snap.world.h;
  ctx.fillStyle = 'rgba(10,11,14,0.85)';
  ctx.strokeStyle = '#0A0B0E';
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, mw, mh);
  ctx.strokeRect(x, y, mw, mh);
  ctx.fillStyle = '#1B1E27';
  for (const wall of snap.walls || []) ctx.fillRect(x + wall.x * sx, y + wall.y * sy, wall.w * sx, wall.h * sy);
  for (const b of snap.bases || []) {
    ctx.fillStyle = b.team === 0 ? 'rgba(47,107,255,0.45)' : 'rgba(255,107,44,0.45)';
    ctx.fillRect(x + b.x * sx, y + b.y * sy, b.w * sx, b.h * sy);
  }
  const cell = 200;
  for (const p of snap.players) {
    const qx = Math.floor(p.x / cell) * cell + cell / 2;
    const qy = Math.floor(p.y / cell) * cell + cell / 2;
    ctx.fillStyle = p.alive ? (p.fill || (p.team === 0 ? '#2F6BFF' : '#FF6B2C')) : '#555';
    ctx.beginPath();
    ctx.arc(x + qx * sx, y + qy * sy, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintHud() {
  const self = me();
  const hp = document.getElementById('hudHpFill');
  const hpTxt = document.getElementById('hudHpText');
  const score = document.getElementById('hudScore');
  const timer = document.getElementById('hudTimer');
  const feed = document.getElementById('killFeed');
  const cd = document.getElementById('hudCd');
  const weapon = document.getElementById('hudWeapon');
  const banner = document.getElementById('arenaBanner');
  const ability = document.getElementById('hudAbility');
  if (!self || !hp) return;
  const maxHp = Math.max(1, self.maxHp || 100);
  hp.style.width = `${Math.max(0, (self.hp / maxHp) * 100)}%`;
  hpTxt.textContent = `${Math.ceil(self.hp)} / ${Math.ceil(maxHp)} HP${self.shield > 0 ? `  +${Math.ceil(self.shield)} SH` : ''}${self.underdog ? '  · BUFF' : ''}`;
  score.innerHTML = `<span class="t0">${snap.teamScore[0]}</span><span>COBALT</span><span class="vs">VS</span><span>EMBER</span><span class="t1">${snap.teamScore[1]}</span>`;
  const t = Math.max(0, Math.ceil(snap.timeLeft));
  timer.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  weapon.textContent = self.weapon || 'PULSE';
  cd.textContent = snap.training ? 'TRAINING · NO REWARDS' : snap.ranked ? 'RANKED · NO RESPAWN' : 'UNRANKED · RESPAWNS';
  if (ability) ability.textContent = self.abilityCd > 0 ? `Q  ${self.abilityCd.toFixed(1)}s` : 'Q  READY';
  feed.innerHTML = killFeed
    .map((k) => `<div class="feed-line"><b>${k.killer}</b> downed <b>${k.victim}</b>${k.streak >= 3 ? ` · ${k.streak} STREAK` : ''}</div>`)
    .join('');
  if (snap.countdown > 0) {
    banner.style.display = '';
    banner.textContent = snap.countdown > 1 ? String(Math.ceil(snap.countdown)) : 'FIGHT';
  } else if (!self.alive) {
    banner.style.display = '';
    const focus = camTarget();
    banner.textContent = snap.ranked
      ? (focus && focus.id !== self.id ? `SPECTATING ${focus.name}` : 'ELIMINATED')
      : 'RESPAWNING';
  } else {
    banner.style.display = 'none';
  }
}

function sendInput() {
  const now = performance.now();
  if (now - lastSend < 33) return;
  lastSend = now;
  const c = canvas();
  if (!c) return;
  const dpr = devicePixelRatio || 1;
  const w = c.width / dpr;
  const h = c.height / dpr;
  mouse.worldX = mouse.x - w / 2 + cam.x;
  mouse.worldY = mouse.y - h / 2 + cam.y;
  const pad = mobileInput();
  const self = me();
  let ax = mouse.worldX;
  let ay = mouse.worldY;
  if (pad.active) {
    const aim = mobileAimAt(self, snap?.players, youId);
    if (aim) {
      ax = aim.x;
      ay = aim.y;
    }
  }
  send({
    type: 'input',
    up: keys.has('w') || keys.has('arrowup') || pad.up,
    down: keys.has('s') || keys.has('arrowdown') || pad.down,
    left: keys.has('a') || keys.has('arrowleft') || pad.left,
    right: keys.has('d') || keys.has('arrowright') || pad.right,
    ax,
    ay,
    shoot: mouse.down || keys.has(' ') || pad.shoot,
    dash: dashQueued,
    emote: emoteQueued,
    ability: abilityQueued,
  });
  dashQueued = false;
  emoteQueued = false;
  abilityQueued = false;
}

function onKey(e) {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
    e.preventDefault();
  }
  keys.add(k);
  if (k === 'shift') dashQueued = true;
  if (k === 'e') emoteQueued = true;
  if (k === 'q') abilityQueued = true;
  if (k === 'escape') {
    send({ type: 'forfeit' });
    stopArena();
    hideResults();
  }
}

function onKeyUp(e) {
  keys.delete(e.key.toLowerCase());
}

function onMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function onDown(e) {
  if (e.target?.closest?.('#mobileControls')) return;
  if (e.button === 0) mouse.down = true;
}

function onUp() {
  mouse.down = false;
}

function bind() {
  if (bound) return;
  bound = true;
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('resize', resize);
  window.addEventListener('blur', onUp);
  bindMobileControls({
    onDash: () => { dashQueued = true; },
    onAbility: () => { abilityQueued = true; },
  });
}

function unbind() {
  if (!bound) return;
  bound = false;
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mousedown', onDown);
  window.removeEventListener('mouseup', onUp);
  window.removeEventListener('resize', resize);
  unbindMobileControls();
}
