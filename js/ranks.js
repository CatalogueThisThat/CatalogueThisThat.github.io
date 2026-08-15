/** Rank ladder + expanding glyph icons (I / II / III). */

export const RANK_COLORS = {
  bronze: '#C47A3A',
  silver: '#C5CDD8',
  gold: '#E2B63A',
  platinum: '#5AD0C8',
  champion: '#FF6B2C',
  unholy: '#8B1E3F',
};

export const RANK_GLYPHS = {
  bronze: { core: 'O', side: '-', name: 'Bronze' },
  silver: { core: '&', side: '*', name: 'Silver' },
  gold: { core: '$', side: '=', name: 'Gold' },
  platinum: { core: '@', side: '+', name: 'Platinum' },
  champion: { core: '!', side: '~', name: 'Champion' },
  unholy: { core: 'X', side: '=', name: 'Unholy' },
};

const DIVS = ['I', 'II', 'III'];

function markFor(family, divIndex) {
  const g = RANK_GLYPHS[family];
  if (!g) return '·';
  if (divIndex <= 0) return g.core;
  if (divIndex === 1) return `${g.side}${g.core}`;
  return `${g.side}${g.core}${g.side}`;
}

function buildRankLadder() {
  const ladder = [{ id: 'unranked', label: 'UNRANKED', min: -1, color: '#9AA0AC', family: null, division: null, mark: '·' }];
  const tiers = [
    { id: 'bronze', mins: [0, 1050, 1100] },
    { id: 'silver', mins: [1150, 1200, 1250] },
    { id: 'gold', mins: [1300, 1350, 1400] },
    { id: 'platinum', mins: [1450, 1525, 1600] },
    { id: 'champion', mins: [1700, 1825, 1950] },
    { id: 'unholy', mins: [2100, 2250, 2400] },
  ];
  for (const t of tiers) {
    DIVS.forEach((div, i) => {
      ladder.push({
        id: `${t.id}-${div.toLowerCase()}`,
        label: `${t.id.toUpperCase()} ${div}`,
        min: t.mins[i],
        color: RANK_COLORS[t.id],
        family: t.id,
        division: div,
        mark: markFor(t.id, i),
      });
    });
  }
  return ladder;
}

export const RANKS = buildRankLadder();

export function normalizeRank(rank) {
  if (!rank) return { ...RANKS[0], mmr: 1000 };
  const found = RANKS.find((r) => r.id === rank.id) || RANKS[0];
  return {
    ...found,
    ...rank,
    mark: rank.mark || found.mark,
    family: rank.family ?? found.family,
    division: rank.division ?? found.division,
    color: rank.color || found.color,
    label: rank.label || found.label,
  };
}

export function rankBarProgress(mmr, rankId) {
  const idx = RANKS.findIndex((r) => r.id === rankId);
  if (idx < 0) return { pct: 0, current: RANKS[0], next: RANKS[1] || null };
  const current = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  if (current.id === 'unranked') {
    const ceil = next ? next.min : 1000;
    const pct = Math.max(0, Math.min(1, (Number(mmr) || 0) / Math.max(1, ceil)));
    return { pct, current, next };
  }
  if (!next) return { pct: 1, current, next: null };
  const floor = current.min;
  const ceil = next.min;
  const pct = Math.max(0, Math.min(1, ((Number(mmr) || 0) - floor) / Math.max(1, ceil - floor)));
  return { pct, current, next };
}

/** Ranks crossed from prev → next (exclusive of start, inclusive of end if changed). */
export function ranksCrossed(prevRank, nextRank) {
  const a = RANKS.findIndex((r) => r.id === (prevRank?.id || 'unranked'));
  const b = RANKS.findIndex((r) => r.id === (nextRank?.id || 'unranked'));
  if (a < 0 || b < 0 || b <= a) return [];
  return RANKS.slice(a + 1, b + 1);
}

/**
 * Expanding rank icon: core glyph grows side adornments for II / III.
 * Rendered as SVG so it scales crisp in lobby chips and cinema.
 */
export function rankIconHtml(rank, { size = 36, className = '' } = {}) {
  const r = normalizeRank(rank);
  const color = r.color || '#9AA0AC';
  const family = r.family;
  const div = r.division === 'III' ? 2 : r.division === 'II' ? 1 : r.division === 'I' ? 0 : -1;
  const g = RANK_GLYPHS[family];
  const mark = r.mark || (g ? markFor(family, Math.max(0, div)) : '·');
  const s = Number(size) || 36;
  const fontSize = Math.round(s * (mark.length > 2 ? 0.34 : mark.length > 1 ? 0.42 : 0.5));
  const gid = `rg-${(r.id || 'u').replace(/[^a-z0-9-]/gi, '')}-${s}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    `<span class="rank-icon ${className}" style="--rank-c:${color};width:${s}px;height:${s}px" title="${r.label || 'UNRANKED'}">` +
      `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true">` +
        `<defs>` +
          `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">` +
            `<stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>` +
            `<stop offset="100%" stop-color="${color}" stop-opacity="0.95"/>` +
          `</linearGradient>` +
        `</defs>` +
        `<polygon points="32,4 56,18 56,46 32,60 8,46 8,18" fill="url(#${gid})" stroke="${color}" stroke-width="3"/>` +
        `<text x="32" y="38" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" ` +
          `font-weight="800" font-size="${fontSize}" fill="#F5F1E6" letter-spacing="1">${escapeXml(mark)}</text>` +
      `</svg>` +
    `</span>`
  );
}

export function rankChipHtml(rank, { size = 22 } = {}) {
  const r = normalizeRank(rank);
  return (
    `<span class="rank-chip ${r.id || 'unranked'}" style="color:${r.color};border-color:${r.color}">` +
      rankIconHtml(r, { size, className: 'rank-icon-inline' }) +
      `<span class="rank-chip-label">${r.label || 'UNRANKED'}</span>` +
    `</span>`
  );
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
