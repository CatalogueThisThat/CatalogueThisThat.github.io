import { normalizeRank, rankBarProgress, ranksCrossed, rankIconHtml } from './ranks.js';

let cinemaEl = null;
let skipRequested = false;
let running = false;
let resolveWait = null;

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

function setBar(pct) {
  const fill = $('#rankBarFill');
  const label = $('#rankBarPct');
  const p = Math.max(0, Math.min(1, pct));
  if (fill) fill.style.width = `${(p * 100).toFixed(1)}%`;
  if (label) label.textContent = `${Math.round(p * 100)}%`;
}

async function animateBar(from, to, duration = 1400) {
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
      const eased = 1 - (1 - t) ** 3;
      setBar(a + (b - a) * eased);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function paintRankHero(rank, { big = false } = {}) {
  const r = normalizeRank(rank);
  const wrap = $('#rankHero');
  if (!wrap) return;
  wrap.innerHTML =
    rankIconHtml(r, { size: big ? 140 : 96, className: 'rank-icon-hero' }) +
    `<div class="rank-hero-label" style="color:${r.color}">${r.label}</div>` +
    `<div class="rank-hero-mark">${r.mark || '·'}</div>`;
}

function paintLoot(rw) {
  const loot = $('#chestLoot');
  if (!loot) return;
  const items = [
    { key: 'xp', label: 'XP', value: rw.xp || 0, icon: 'i-star' },
    { key: 'coins', label: 'TOKENS', value: rw.coins || 0, icon: 'i-coin' },
    { key: 'gems', label: 'GEMS', value: rw.gems || 0, icon: 'i-diamond' },
  ].filter((x) => x.value > 0 || true);
  loot.innerHTML = items.map((it, i) =>
    `<div class="loot-card" style="--i:${i}">` +
      `<svg class="icon icon-lg"><use href="#${it.icon}"/></svg>` +
      `<div class="loot-val">+${Number(it.value).toLocaleString()}</div>` +
      `<div class="loot-lab">${it.label}</div>` +
    `</div>`
  ).join('');
}

async function runChestPhase(rw) {
  showPhase('chest');
  cinemaEl.classList.remove('chest-open', 'loot-in');
  paintLoot(rw);
  await waitSkipOr(700);
  if (!skipRequested) cinemaEl.classList.add('chest-shake');
  await waitSkipOr(900);
  cinemaEl.classList.remove('chest-shake');
  cinemaEl.classList.add('chest-open');
  await waitSkipOr(450);
  cinemaEl.classList.add('loot-in');
  await waitSkipOr(skipRequested ? 200 : 1600);
}

async function runRankFlash(newRank) {
  const flash = $('#rankFlash');
  const revealHero = $('#rankRevealHero');
  if (revealHero) {
    const r = normalizeRank(newRank);
    revealHero.innerHTML =
      rankIconHtml(r, { size: 160, className: 'rank-icon-hero' }) +
      `<div class="rank-hero-label" style="color:${r.color}">${r.label}</div>` +
      `<div class="rank-hero-mark">${r.mark || '·'}</div>`;
  }
  showPhase('rankup');
  if (flash) {
    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');
  }
  await waitSkipOr(skipRequested ? 350 : 700);
  cinemaEl?.classList.add('rank-revealed');
  await waitSkipOr(skipRequested ? 400 : 1600);
  if (flash) flash.classList.remove('on');
  cinemaEl?.classList.remove('rank-revealed');
  paintRankHero(newRank, { big: false });
}

async function runRankPhase(rw) {
  showPhase('rank');
  const prev = normalizeRank(rw.prevRank || rw.rank);
  const next = normalizeRank(rw.rank || rw.prevRank);
  const prevMmr = Number.isFinite(Number(rw.prevMmr)) ? Number(rw.prevMmr) : (prev.mmr || 1000);
  const nextMmr = Number.isFinite(Number(rw.mmr)) ? Number(rw.mmr) : (next.mmr || prevMmr);
  const crossed = ranksCrossed(prev, next);

  paintRankHero(prev, { big: false });
  const startProg = rankBarProgress(prevMmr, prev.id);
  setBar(startProg.pct);
  $('#rankSub') && ($('#rankSub').textContent =
    crossed.length
      ? `Climbing toward ${normalizeRank(crossed[0]).label}`
      : (startProg.next ? `Progress to ${startProg.next.label}` : 'Peak rank'));

  await waitSkipOr(400);

  if (!crossed.length) {
    const endProg = rankBarProgress(nextMmr, next.id);
    paintRankHero(next, { big: false });
    await animateBar(startProg.pct, endProg.pct, skipRequested ? 0 : 1400);
    $('#rankSub') && ($('#rankSub').textContent =
      endProg.next ? `${Math.round(endProg.pct * 100)}% to ${endProg.next.label}` : 'Max division');
    await waitSkipOr(900);
    return;
  }

  // Fill to 100% on current bar, flash each new rank, reset remainder.
  let mmrCursor = prevMmr;
  let rankCursor = prev;
  for (const gained of crossed) {
    const prog = rankBarProgress(mmrCursor, rankCursor.id);
    paintRankHero(rankCursor, { big: false });
    $('#rankSub') && ($('#rankSub').textContent = `Promoting to ${gained.label}`);
    await animateBar(prog.pct, 1, skipRequested ? 0 : 1100);
    await runRankFlash(gained);
    rankCursor = normalizeRank(gained);
    mmrCursor = Math.max(mmrCursor, gained.min);
    const after = rankBarProgress(nextMmr, rankCursor.id);
    // If more ranks coming, hold at 0 briefly; else animate to final remainder.
    setBar(0);
    paintRankHero(rankCursor, { big: false });
    if (gained.id === next.id) {
      await animateBar(0, after.pct, skipRequested ? 0 : 900);
      $('#rankSub') && ($('#rankSub').textContent =
        after.next ? `${Math.round(after.pct * 100)}% to ${after.next.label}` : 'Max division');
    }
  }
  await waitSkipOr(800);
}

/**
 * Full post-match reward cinema: chest loot → rank progress (Fortnite-style).
 * Returns when finished or skipped through to the end.
 */
export async function playRewardCinema(rewards) {
  const el = ensureCinema();
  if (!el || running) return;
  const rw = rewards || {};
  if (!(rw.xp || rw.coins || rw.gems || rw.rank)) return;

  running = true;
  skipRequested = false;
  el.classList.add('on');
  el.classList.remove('skipping', 'chest-open', 'loot-in', 'chest-shake');
  document.body.classList.add('reward-cinema-open');

  try {
    await runChestPhase(rw);
    skipRequested = false;
    el.classList.remove('skipping');
    await runRankPhase(rw);
  } finally {
    el.classList.remove('on', 'chest-open', 'loot-in', 'chest-shake', 'skipping');
    document.body.classList.remove('reward-cinema-open');
    showPhase('');
    running = false;
    skipRequested = false;
    resolveWait = null;
  }
}

export function isRewardCinemaOpen() {
  return running;
}
