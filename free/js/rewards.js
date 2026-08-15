import { normalizeRank, rankBarProgress, ranksCrossed, rankIconHtml } from './ranks.js';
import { sfx } from './sfx.js';

let cinemaEl = null;
let skipRequested = false;
let running = false;
let resolveWait = null;
let fxRaf = 0;
let fxParticles = [];
let lastBarTick = 0;

function $(sel, root = cinemaEl) {
  return root?.querySelector(sel);
}

function sleep(ms) {
  return new Promise((resolve) => {
    if (skipRequested) return resolve();
    const t = setTimeout(resolve, ms);
    const prev = resolveWait;
    resolveWait = () => {
      clearTimeout(t);
      resolve();
      if (prev) prev();
    };
  });
}

function waitSkipOr(ms) {
  return sleep(ms);
}

export function requestRewardSkip() {
  skipRequested = true;
  if (resolveWait) {
    const fn = resolveWait;
    resolveWait = null;
    fn();
  }
  cinemaEl?.classList.add('skipping');
}

function ensureCinema() {
  cinemaEl = document.getElementById('rewardCinema');
  return cinemaEl;
}

function showPhase(name) {
  if (!cinemaEl) return;
  cinemaEl.querySelectorAll('[data-phase]').forEach((el) => {
    el.classList.toggle('on', el.getAttribute('data-phase') === name);
  });
  cinemaEl.dataset.phase = name;
}

function punch(intensity = 1) {
  if (!cinemaEl || skipRequested) return;
  cinemaEl.style.setProperty('--punch', String(intensity));
  cinemaEl.classList.remove('punch');
  void cinemaEl.offsetWidth;
  cinemaEl.classList.add('punch');
}

function burst(x, y, color, n = 18, speed = 280) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random() * 0.9);
    fxParticles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.45 + Math.random() * 0.55,
      max: 1,
      size: 2 + Math.random() * 4,
      color,
      drag: 0.92 + Math.random() * 0.04,
    });
  }
}

function confetti(n = 40) {
  const c = document.getElementById('cinemaFx');
  if (!c) return;
  const w = c.width / (window.devicePixelRatio || 1);
  const h = c.height / (window.devicePixelRatio || 1);
  const colors = ['#2F6BFF', '#FF6B2C', '#E2B63A', '#C8FF3D', '#F5F1E6', '#7C3AED'];
  for (let i = 0; i < n; i++) {
    fxParticles.push({
      x: w * 0.5 + (Math.random() - 0.5) * w * 0.25,
      y: h * 0.42,
      vx: (Math.random() - 0.5) * 520,
      vy: -180 - Math.random() * 420,
      life: 1.1 + Math.random() * 0.8,
      max: 1.6,
      size: 3 + Math.random() * 5,
      color: colors[i % colors.length],
      drag: 0.985,
      gravity: 520,
      spin: (Math.random() - 0.5) * 10,
    });
  }
}

function startFx() {
  const canvas = document.getElementById('cinemaFx');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  function resize() {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  let last = performance.now();
  function frame(now) {
    fxRaf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    fxParticles = fxParticles.filter((p) => p.life > 0);
    for (const p of fxParticles) {
      p.life -= dt;
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag || 0.96;
      p.vy *= p.drag || 0.96;
      const alpha = Math.max(0, p.life / (p.max || 1));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  cancelAnimationFrame(fxRaf);
  fxRaf = requestAnimationFrame(frame);
  window.addEventListener('resize', resize, { passive: true });
}

function stopFx() {
  cancelAnimationFrame(fxRaf);
  fxRaf = 0;
  fxParticles = [];
  const canvas = document.getElementById('cinemaFx');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function setBar(pct) {
  const fill = $('#rankBarFill');
  const label = $('#rankBarPct');
  const wrap = $('.rank-bar-wrap');
  const p = Math.max(0, Math.min(1, pct));
  if (fill) fill.style.width = `${(p * 100).toFixed(1)}%`;
  if (label) label.textContent = `${Math.round(p * 100)}%`;
  if (wrap) {
    wrap.classList.toggle('hot', p > 0.82);
    wrap.classList.toggle('full', p >= 0.995);
  }
  const now = performance.now();
  if (p > 0.05 && p < 0.995 && now - lastBarTick > 70) {
    lastBarTick = now;
    sfx.barTick();
  }
}

async function animateBar(from, to, duration = 1600) {
  const start = performance.now();
  const a = Math.max(0, Math.min(1, from));
  const b = Math.max(0, Math.min(1, to));
  if (skipRequested) {
    setBar(b);
    return;
  }
  await new Promise((resolve) => {
    function frame(now) {
      if (skipRequested) {
        setBar(b);
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      // ease-out with slight overshoot feel near end
      const eased = 1 - (1 - t) ** 3;
      setBar(a + (b - a) * eased);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  if (b >= 0.995) punch(1.2);
}

function paintRankHero(rank, { big = false, target = '#rankHero' } = {}) {
  const r = normalizeRank(rank);
  const wrap = $(target) || document.querySelector(target);
  if (!wrap) return;
  wrap.innerHTML =
    rankIconHtml(r, { size: big ? 168 : 108, className: 'rank-icon-hero' }) +
    `<div class="rank-hero-label" style="color:${r.color}">${r.label}</div>` +
    `<div class="rank-hero-mark">${r.mark || '·'}</div>`;
  wrap.style.setProperty('--rank-accent', r.color || '#9AA0AC');
}

async function countUp(el, to, dur = 700) {
  if (!el) return;
  const target = Number(to) || 0;
  if (skipRequested) {
    el.textContent = `+${target.toLocaleString()}`;
    return;
  }
  const start = performance.now();
  await new Promise((resolve) => {
    function frame(now) {
      if (skipRequested) {
        el.textContent = `+${target.toLocaleString()}`;
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 2;
      el.textContent = `+${Math.round(target * eased).toLocaleString()}`;
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function paintLoot(rw) {
  const loot = $('#chestLoot');
  if (!loot) return;
  const items = [
    { key: 'xp', label: 'XP', value: rw.xp || 0, icon: 'i-star', color: '#7EA2FF' },
    { key: 'coins', label: 'TOKENS', value: rw.coins || 0, icon: 'i-coin', color: '#E2B63A' },
    { key: 'gems', label: 'GEMS', value: rw.gems || 0, icon: 'i-diamond', color: '#B07CFF' },
  ];
  loot.innerHTML = items.map((it, i) =>
    `<div class="loot-card" style="--i:${i};--loot-c:${it.color}" data-value="${it.value}">` +
      `<div class="loot-ring"></div>` +
      `<svg class="icon icon-lg"><use href="#${it.icon}"/></svg>` +
      `<div class="loot-val">+0</div>` +
      `<div class="loot-lab">${it.label}</div>` +
    `</div>`
  ).join('');
}

async function runChestPhase(rw) {
  showPhase('chest');
  cinemaEl.classList.remove('chest-open', 'loot-in', 'chest-shake', 'chest-anticipation');
  paintLoot(rw);
  await waitSkipOr(350);
  cinemaEl.classList.add('chest-anticipation');
  sfx.chestThud();
  await waitSkipOr(480);
  if (!skipRequested) {
    cinemaEl.classList.add('chest-shake');
    sfx.chestThud();
  }
  await waitSkipOr(720);
  cinemaEl.classList.remove('chest-shake', 'chest-anticipation');
  cinemaEl.classList.add('chest-open');
  sfx.chestOpen();
  punch(1.4);
  const stage = $('.chest-stage');
  if (stage) {
    const r = stage.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * 0.45, '#E2B63A', 28, 360);
    burst(r.left + r.width / 2, r.top + r.height * 0.45, '#FF8A3D', 16, 260);
  }
  confetti(36);
  await waitSkipOr(380);
  cinemaEl.classList.add('loot-in');
  const cards = [...(document.querySelectorAll('#chestLoot .loot-card') || [])];
  for (let i = 0; i < cards.length; i++) {
    if (skipRequested) break;
    await waitSkipOr(110);
    sfx.lootPop();
    punch(0.45);
    const val = cards[i].querySelector('.loot-val');
    const n = Number(cards[i].dataset.value) || 0;
    countUp(val, n, 520);
    const rect = cards[i].getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + 24, getComputedStyle(cards[i]).getPropertyValue('--loot-c').trim() || '#F5F1E6', 10, 180);
  }
  await waitSkipOr(skipRequested ? 180 : 1100);
}

async function runRankFlash(newRank) {
  const flash = $('#rankFlash');
  const burstEl = $('#rankBurst');
  paintRankHero(newRank, { big: true, target: '#rankRevealHero' });
  showPhase('rankup');
  cinemaEl?.classList.remove('rank-revealed');
  if (burstEl) {
    burstEl.style.setProperty('--burst-c', normalizeRank(newRank).color || '#fff');
    burstEl.classList.remove('on');
    void burstEl.offsetWidth;
    burstEl.classList.add('on');
  }
  if (flash) {
    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');
  }
  sfx.rankUp();
  punch(1.8);
  confetti(55);
  const hero = document.getElementById('rankRevealHero');
  if (hero) {
    const r = hero.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, normalizeRank(newRank).color || '#fff', 40, 420);
  }
  await waitSkipOr(skipRequested ? 280 : 520);
  cinemaEl?.classList.add('rank-revealed');
  await waitSkipOr(skipRequested ? 350 : 1700);
  if (flash) flash.classList.remove('on');
  if (burstEl) burstEl.classList.remove('on');
  cinemaEl?.classList.remove('rank-revealed');
  paintRankHero(newRank, { big: false });
}

async function runRankPhase(rw) {
  showPhase('rank');
  cinemaEl.classList.add('rank-enter');
  const prev = normalizeRank(rw.prevRank || rw.rank);
  const next = normalizeRank(rw.rank || rw.prevRank);
  const prevMmr = Number.isFinite(Number(rw.prevMmr)) ? Number(rw.prevMmr) : (prev.mmr || 1000);
  const nextMmr = Number.isFinite(Number(rw.mmr)) ? Number(rw.mmr) : (next.mmr || prevMmr);
  const crossed = ranksCrossed(prev, next);

  paintRankHero(prev, { big: false });
  const startProg = rankBarProgress(prevMmr, prev.id);
  setBar(startProg.pct);
  const sub = $('#rankSub');
  if (sub) {
    sub.textContent = crossed.length
      ? `Climbing toward ${normalizeRank(crossed[0]).label}`
      : (startProg.next ? `Progress to ${startProg.next.label}` : 'Peak rank');
  }

  await waitSkipOr(420);
  cinemaEl.classList.remove('rank-enter');

  if (!crossed.length) {
    const endProg = rankBarProgress(nextMmr, next.id);
    paintRankHero(next, { big: false });
    await animateBar(startProg.pct, endProg.pct, skipRequested ? 0 : 1600);
    if (sub) {
      sub.textContent = endProg.next
        ? `${Math.round(endProg.pct * 100)}% to ${endProg.next.label}`
        : 'Max division';
    }
    await waitSkipOr(850);
    return;
  }

  let mmrCursor = prevMmr;
  let rankCursor = prev;
  for (const gained of crossed) {
    const prog = rankBarProgress(mmrCursor, rankCursor.id);
    paintRankHero(rankCursor, { big: false });
    if (sub) sub.textContent = `Promoting to ${gained.label}`;
    await animateBar(prog.pct, 1, skipRequested ? 0 : 1250);
    await runRankFlash(gained);
    showPhase('rank');
    rankCursor = normalizeRank(gained);
    mmrCursor = Math.max(mmrCursor, gained.min);
    const after = rankBarProgress(nextMmr, rankCursor.id);
    setBar(0);
    paintRankHero(rankCursor, { big: false });
    if (gained.id === next.id) {
      await animateBar(0, after.pct, skipRequested ? 0 : 1000);
      if (sub) {
        sub.textContent = after.next
          ? `${Math.round(after.pct * 100)}% to ${after.next.label}`
          : 'Max division';
      }
    }
  }
  await waitSkipOr(700);
}

export async function playRewardCinema(rewards) {
  const el = ensureCinema();
  if (!el || running) return;
  const rw = rewards || {};
  if (!(rw.xp || rw.coins || rw.gems || rw.rank)) return;

  running = true;
  skipRequested = false;
  lastBarTick = 0;
  el.classList.add('on');
  el.classList.remove('skipping', 'chest-open', 'loot-in', 'chest-shake', 'chest-anticipation', 'rank-revealed', 'rank-enter', 'punch');
  document.body.classList.add('reward-cinema-open');
  startFx();
  sfx.unlock();

  try {
    await runChestPhase(rw);
    skipRequested = false;
    el.classList.remove('skipping');
    await runRankPhase(rw);
  } finally {
    el.classList.remove('on', 'chest-open', 'loot-in', 'chest-shake', 'chest-anticipation', 'rank-revealed', 'rank-enter', 'punch', 'skipping');
    document.body.classList.remove('reward-cinema-open');
    showPhase('');
    stopFx();
    running = false;
    skipRequested = false;
    resolveWait = null;
  }
}

export function isRewardCinemaOpen() {
  return running;
}
