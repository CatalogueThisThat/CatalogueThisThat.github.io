export const MODE_SIZES = [
  { size: '1V1', icon: 'i-sword', a: 1, b: 1 },
  { size: '1V2', icon: 'i-shield', a: 1, b: 2 },
  { size: '2V2', icon: 'i-shield', a: 2, b: 2 },
  { size: '2V3', icon: 'i-target', a: 2, b: 3 },
  { size: '3V3', icon: 'i-trophy', a: 3, b: 3 },
];

export const MODES = [
  ...MODE_SIZES.flatMap((m) => [
    { id: `ranked-${m.size.toLowerCase()}`, label: m.size, value: 'RANKED', icon: m.icon, category: 'ranked', a: m.a, b: m.b, ranked: true, blurb: 'No respawns. Wipe the other team.' },
    { id: `unranked-${m.size.toLowerCase()}`, label: m.size, value: 'UNRANKED', icon: m.icon, category: 'unranked', a: m.a, b: m.b, ranked: false, blurb: 'Respawns on. First to 10 team elims or time.' },
  ]),
  { id: 'training-range', label: 'RANGE', value: 'TRAINING', icon: 'i-target', category: 'training', a: 1, b: 0, ranked: false, blurb: 'Stand-still targets. Practice aim. No rank, XP, or currency.' },
];

export const SKIN_KITS = {
  base: { fill: '#2F6BFF', accent: '#F5F1E6' },
  volt: { fill: '#C8FF3D', accent: '#12141A' },
  ember: { fill: '#FF6B2C', accent: '#FFE4D6' },
  ghost: { fill: '#9AA0AC', accent: '#F5F1E6' },
  titan: { fill: '#1740C8', accent: '#D6F3FF' },
  frost: { fill: '#3EC8FF', accent: '#F5F1E6' },
  ion: { fill: '#E23A2E', accent: '#FFE4D6' },
  slate: { fill: '#6B7280', accent: '#F5F1E6' },
  amber: { fill: '#D4A017', accent: '#12141A' },
  royal: { fill: '#7C3AED', accent: '#F5F1E6' },
  void: { fill: '#1F2937', accent: '#C8FF3D' },
  prism: { fill: '#EC4899', accent: '#F5F1E6' },
};

export const BULLET_SKIN_KITS = {
  stock: { color0: '#7EA2FF', color1: '#FF9A6A', radius: 5 },
  tracer: { color0: '#C8FF3D', color1: '#FF6B2C', radius: 5 },
  plasma: { color0: '#3EC8FF', color1: '#E23A2E', radius: 6 },
  nova: { color0: '#B07CFF', color1: '#FF8A3D', radius: 7 },
  steel: { color0: '#9AA0AC', color1: '#C47A3A', radius: 5 },
  crystal: { color0: '#A78BFA', color1: '#F472B6', radius: 6 },
  singularity: { color0: '#111827', color1: '#C8FF3D', radius: 7 },
};

export const TRAIL_KITS = {
  base: { color: 'rgba(245,241,230,0.35)', width: 2 },
  ember: { color: 'rgba(255,107,44,0.7)', width: 4 },
  volt: { color: 'rgba(200,255,61,0.7)', width: 4 },
  aurora: { color: 'rgba(47,107,255,0.75)', width: 5 },
  dust: { color: 'rgba(154,160,172,0.55)', width: 3 },
  comet: { color: 'rgba(124,58,237,0.8)', width: 5 },
  eclipse: { color: 'rgba(17,24,39,0.9)', width: 6 },
};

export const COIN_SHOP_ITEMS = [
  { id: 'scout-pack', name: 'Scout Pack', icon: 'i-bag', cost: 2200, currency: 'coins', blurb: 'Starter climb kit', grants: { badge: 'scout', emote: 'salute' } },
  { id: 'slate-skin', name: 'Slate Skin', icon: 'i-mask', cost: 3400, currency: 'coins', blurb: 'Shop exclusive', grants: { skin: 'slate' } },
  { id: 'amber-skin', name: 'Amber Skin', icon: 'i-mask', cost: 4200, currency: 'coins', blurb: 'Shop exclusive', grants: { skin: 'amber' } },
  { id: 'dust-trail', name: 'Dust Trail', icon: 'i-sparkle', cost: 1800, currency: 'coins', blurb: 'Soft grit trail', grants: { trail: 'dust' } },
  { id: 'matte-gun', name: 'Matte Finish', icon: 'i-sword', cost: 2600, currency: 'coins', blurb: 'Gun coat', grants: { gunSkin: 'matte' } },
  { id: 'steel-rounds', name: 'Steel Rounds', icon: 'i-target', cost: 2100, currency: 'coins', blurb: 'Bullet skin', grants: { bulletSkin: 'steel' } },
  { id: 'grinder-title', name: 'GRINDER Title', icon: 'i-medal', cost: 5000, currency: 'coins', blurb: 'Callsign flair', grants: { title: 'grinder' } },
];

export const GEM_SHOP_ITEMS = [
  { id: 'crate', name: 'Mystery Crate', icon: 'i-crate', cost: 280, currency: 'gems', blurb: 'Random locked drop', grants: 'random' },
  { id: 'royal-skin', name: 'Royal Skin', icon: 'i-mask', cost: 2200, currency: 'gems', blurb: 'Top-shelf look', grants: { skin: 'royal' } },
  { id: 'void-skin', name: 'Void Skin', icon: 'i-mask', cost: 2800, currency: 'gems', blurb: 'Aggressive kit', grants: { skin: 'void' } },
  { id: 'prism-skin', name: 'Prism Skin', icon: 'i-mask', cost: 3200, currency: 'gems', blurb: 'Fast spray kit', grants: { skin: 'prism' } },
  { id: 'comet-trail', name: 'Comet Trail', icon: 'i-sparkle', cost: 1400, currency: 'gems', blurb: 'Violet streak', grants: { trail: 'comet' } },
  { id: 'eclipse-trail', name: 'Eclipse Trail', icon: 'i-sparkle', cost: 1800, currency: 'gems', blurb: 'Heavy black trail', grants: { trail: 'eclipse' } },
  { id: 'obsidian-gun', name: 'Obsidian Coat', icon: 'i-sword', cost: 1600, currency: 'gems', blurb: 'Gun coat', grants: { gunSkin: 'obsidian' } },
  { id: 'goldleaf-gun', name: 'Goldleaf Coat', icon: 'i-sword', cost: 2100, currency: 'gems', blurb: 'Gun coat', grants: { gunSkin: 'goldleaf' } },
  { id: 'crystal-rounds', name: 'Crystal Rounds', icon: 'i-target', cost: 1500, currency: 'gems', blurb: 'Bullet skin', grants: { bulletSkin: 'crystal' } },
  { id: 'singularity-rounds', name: 'Singularity Rounds', icon: 'i-target', cost: 2400, currency: 'gems', blurb: 'Bullet skin', grants: { bulletSkin: 'singularity' } },
  { id: 'carbine-frame', name: 'Carbine Frame', icon: 'i-sword', cost: 2600, currency: 'gems', blurb: 'Exclusive frame', grants: { gun: 'carbine' } },
  { id: 'shotty-frame', name: 'Shotty Frame', icon: 'i-sword', cost: 3000, currency: 'gems', blurb: 'Exclusive frame', grants: { gun: 'shotty' } },
  { id: 'crown-emote', name: 'Crown Emote', icon: 'i-wand', cost: 900, currency: 'gems', blurb: 'Flex hard', grants: { emote: 'crown' } },
  { id: 'elite-badge', name: 'Elite Badge', icon: 'i-medal', cost: 1200, currency: 'gems', blurb: 'Status badge', grants: { badge: 'elite' } },
  { id: 'sovereign-title', name: 'SOVEREIGN Title', icon: 'i-trophy', cost: 3500, currency: 'gems', blurb: 'Rare title', grants: { title: 'sovereign' } },
  { id: 'mythic-title', name: 'MYTHIC Title', icon: 'i-star', cost: 4200, currency: 'gems', blurb: 'Rarest title', grants: { title: 'mythic' } },
];

export const SHOP_ITEMS = [...COIN_SHOP_ITEMS, ...GEM_SHOP_ITEMS];

export const IAP_PACKS = [
  { id: 'coins-500', name: '500 Tokens', kind: 'coins', amount: 500, gbp: 1 },
  { id: 'coins-2500', name: '2,500 Tokens', kind: 'coins', amount: 2500, gbp: 5 },
  { id: 'coins-5000', name: '5,000 Tokens', kind: 'coins', amount: 5000, gbp: 8 },
  { id: 'coins-8000', name: '8,000 Tokens', kind: 'coins', amount: 8000, gbp: 12 },
  { id: 'coins-20000', name: '20,000 Tokens', kind: 'coins', amount: 20000, gbp: 25 },
  { id: 'gems-285', name: '285 Gems', kind: 'gems', amount: 285, gbp: 1 },
  { id: 'gems-1425', name: '1,425 Gems', kind: 'gems', amount: 1425, gbp: 5 },
  { id: 'gems-2855', name: '2,855 Gems', kind: 'gems', amount: 2855, gbp: 8 },
  { id: 'gems-4570', name: '4,570 Gems', kind: 'gems', amount: 4570, gbp: 12 },
  { id: 'gems-11425', name: '11,425 Gems', kind: 'gems', amount: 11425, gbp: 25 },
];

export const DEFAULT_LOCKER = {
  skin: [
    { id: 'base', name: 'Default', icon: 'i-mask', owned: true },
    { id: 'volt', name: 'Volt Skin', icon: 'i-mask', owned: false },
    { id: 'ember', name: 'Ember Skin', icon: 'i-mask', owned: false },
    { id: 'ghost', name: 'Ghost Skin', icon: 'i-mask', owned: false },
    { id: 'titan', name: 'Titan Skin', icon: 'i-shield', owned: false },
    { id: 'frost', name: 'Frost Skin', icon: 'i-mask', owned: false },
    { id: 'ion', name: 'Ion Skin', icon: 'i-mask', owned: false },
    { id: 'slate', name: 'Slate Skin', icon: 'i-mask', owned: false },
    { id: 'amber', name: 'Amber Skin', icon: 'i-mask', owned: false },
    { id: 'royal', name: 'Royal Skin', icon: 'i-mask', owned: false },
    { id: 'void', name: 'Void Skin', icon: 'i-mask', owned: false },
    { id: 'prism', name: 'Prism Skin', icon: 'i-mask', owned: false },
  ],
  gunSkin: [
    { id: 'stock', name: 'Stock Finish', icon: 'i-sword', owned: true },
    { id: 'chrome', name: 'Chrome', icon: 'i-sword', owned: false },
    { id: 'neon', name: 'Neon Edge', icon: 'i-sword', owned: false },
    { id: 'ember', name: 'Ember Coat', icon: 'i-sword', owned: false },
    { id: 'matte', name: 'Matte Finish', icon: 'i-sword', owned: false },
    { id: 'obsidian', name: 'Obsidian', icon: 'i-sword', owned: false },
    { id: 'goldleaf', name: 'Goldleaf', icon: 'i-sword', owned: false },
  ],
  gun: [
    { id: 'pulse', name: 'Pulse Frame', icon: 'i-sword', owned: true },
    { id: 'smg', name: 'SMG Frame', icon: 'i-sword', owned: false },
    { id: 'cannon', name: 'Cannon Frame', icon: 'i-sword', owned: false },
    { id: 'rail', name: 'Rail Frame', icon: 'i-sword', owned: false },
    { id: 'carbine', name: 'Carbine Frame', icon: 'i-sword', owned: false },
    { id: 'shotty', name: 'Shotty Frame', icon: 'i-sword', owned: false },
  ],
  bulletSkin: [
    { id: 'stock', name: 'Standard Rounds', icon: 'i-target', owned: true },
    { id: 'tracer', name: 'Tracer Rounds', icon: 'i-target', owned: false },
    { id: 'plasma', name: 'Plasma Rounds', icon: 'i-target', owned: false },
    { id: 'nova', name: 'Nova Rounds', icon: 'i-target', owned: false },
    { id: 'steel', name: 'Steel Rounds', icon: 'i-target', owned: false },
    { id: 'crystal', name: 'Crystal Rounds', icon: 'i-target', owned: false },
    { id: 'singularity', name: 'Singularity Rounds', icon: 'i-target', owned: false },
  ],
  trail: [
    { id: 'base', name: 'None', icon: 'i-sparkle', owned: true },
    { id: 'ember', name: 'Ember Trail', icon: 'i-sparkle', owned: false },
    { id: 'volt', name: 'Volt Trail', icon: 'i-sparkle', owned: false },
    { id: 'aurora', name: 'Aurora Trail', icon: 'i-sparkle', owned: false },
    { id: 'dust', name: 'Dust Trail', icon: 'i-sparkle', owned: false },
    { id: 'comet', name: 'Comet Trail', icon: 'i-sparkle', owned: false },
    { id: 'eclipse', name: 'Eclipse Trail', icon: 'i-sparkle', owned: false },
  ],
  emote: [
    { id: 'wave', name: 'Wave', icon: 'i-wand', owned: true },
    { id: 'dance', name: 'Dance', icon: 'i-wand', owned: true },
    { id: 'flex', name: 'Flex', icon: 'i-trophy', owned: false },
    { id: 'salute', name: 'Salute', icon: 'i-wand', owned: false },
    { id: 'crown', name: 'Crown', icon: 'i-trophy', owned: false },
  ],
  badge: [
    { id: 'rookie', name: 'Rookie', icon: 'i-medal', owned: true },
    { id: 'veteran', name: 'Veteran', icon: 'i-medal', owned: false },
    { id: 'passholder', name: 'Pass Holder', icon: 'i-medal', owned: false },
    { id: 'ace', name: 'Ace', icon: 'i-star', owned: false },
    { id: 'scout', name: 'Scout', icon: 'i-medal', owned: false },
    { id: 'elite', name: 'Elite', icon: 'i-medal', owned: false },
  ],
  title: [
    { id: 'none', name: 'No Title', icon: 'i-medal', owned: true },
    { id: 'rookie', name: 'ROOKIE', icon: 'i-medal', owned: true },
    { id: 'contender', name: 'CONTENDER', icon: 'i-medal', owned: false },
    { id: 'hotshot', name: 'HOTSHOT', icon: 'i-star', owned: false },
    { id: 'unholy', name: 'UNHOLY', icon: 'i-star', owned: false },
    { id: 'legend', name: 'LEGEND', icon: 'i-trophy', owned: false },
    { id: 'grinder', name: 'GRINDER', icon: 'i-medal', owned: false },
    { id: 'sovereign', name: 'SOVEREIGN', icon: 'i-trophy', owned: false },
    { id: 'mythic', name: 'MYTHIC', icon: 'i-star', owned: false },
    { id: 'owner', name: 'OWNER', icon: 'i-trophy', owned: false },
  ],
};

export const BATTLE_PASS = {
  season: 1,
  name: 'SEASON 01 // VOLT LINE',
  premiumCost: 48000,
  premiumCostCoins: 48000,
  premiumCostGems: 12500,
  premiumGbp: 3.49,
  tiers: [
    { level: 1, free: { coins: 200 }, premium: { gems: 50 } },
    { level: 2, premium: { coins: 400 } },
    { level: 3, premium: { gems: 120 } },
    { level: 4, premium: { coins: 450 } },
    { level: 5, free: { gems: 180 }, premium: { trail: 'volt' } },
    { level: 6, premium: { coins: 500 } },
    { level: 7, premium: { gems: 200 } },
    { level: 8, premium: { coins: 550 } },
    { level: 9, premium: { gems: 250 } },
    { level: 10, free: { title: 'contender' }, premium: { gunSkin: 'chrome' } },
    { level: 11, premium: { coins: 400 } },
    { level: 12, premium: { gun: 'smg' } },
    { level: 13, premium: { gems: 220 } },
    { level: 14, premium: { skin: 'volt' } },
    { level: 15, free: { coins: 350 }, premium: { bulletSkin: 'tracer' } },
    { level: 16, premium: { gunSkin: 'neon' } },
    { level: 17, premium: { gun: 'cannon' } },
    { level: 18, premium: { emote: 'flex' } },
    { level: 19, premium: { gems: 280 } },
    { level: 20, free: { title: 'hotshot' }, premium: { skin: 'ember' } },
    { level: 21, premium: { trail: 'aurora' } },
    { level: 22, premium: { bulletSkin: 'plasma' } },
    { level: 23, premium: { coins: 600 } },
    { level: 24, premium: { gunSkin: 'ember' } },
    { level: 25, free: { badge: 'veteran' }, premium: { skin: 'ghost' } },
    { level: 26, premium: { gems: 320 } },
    { level: 27, premium: { gun: 'rail' } },
    { level: 28, premium: { bulletSkin: 'nova' } },
    { level: 29, premium: { coins: 700 } },
    { level: 30, free: { coins: 500 }, premium: { skin: 'frost' } },
    { level: 31, premium: { gems: 350 } },
    { level: 32, premium: { trail: 'ember' } },
    { level: 33, premium: { coins: 750 } },
    { level: 34, premium: { skin: 'ion' } },
    { level: 35, free: { gems: 300 }, premium: { badge: 'passholder' } },
    { level: 36, premium: { gems: 400 } },
    { level: 37, premium: { coins: 800 } },
    { level: 38, premium: { gems: 450 } },
    { level: 39, premium: { coins: 900 } },
    { level: 40, free: { title: 'legend' }, premium: { title: 'unholy', skin: 'titan', badge: 'ace' } },
  ],
};

export function rewardLabel(reward) {
  if (!reward) return '—';
  const bits = [];
  if (reward.coins) bits.push(`+${reward.coins} tokens`);
  if (reward.gems) bits.push(`+${reward.gems} gems`);
  if (reward.skin) bits.push(`${reward.skin} skin`);
  if (reward.gunSkin) bits.push(`${reward.gunSkin} gun skin`);
  if (reward.gun) bits.push(`${reward.gun} gun`);
  if (reward.bulletSkin) bits.push(`${reward.bulletSkin} rounds`);
  if (reward.trail) bits.push(`${reward.trail} trail`);
  if (reward.emote) bits.push(`${reward.emote} emote`);
  if (reward.badge) bits.push(`${reward.badge} badge`);
  if (reward.title) bits.push(`${reward.title} title`);
  return bits.join(' · ') || '—';
}

export function defaultSession() {
  return {
    id: '',
    name: 'YEALEXK',
    currency: { gems: 250, coins: 1800 },
    ready: false,
    players: [],
    party: { id: '', leader: '', members: [] },
    mode: { id: 'unranked-1v1', label: '1V1', value: 'UNRANKED' },
    searching: false,
    seconds: 0,
    queueSize: 0,
    dailyClaimed: false,
    friends: [],
    locker: structuredClone(DEFAULT_LOCKER),
    equipped: {
      skin: 'base',
      gunSkin: 'stock',
      gun: 'pulse',
      bulletSkin: 'stock',
      trail: 'base',
      emote: 'wave',
      badge: 'rookie',
      title: 'none',
    },
    isCaptain: true,
    level: 1,
    xpInto: 0,
    xpNeed: 400,
    stats: { wins: 0, losses: 0, kills: 0, deaths: 0, matches: 0 },
    online: [],
    liveMatches: 0,
    connected: false,
    guest: false,
    passOwned: false,
    passClaims: {},
    rank: { id: 'unranked', label: 'UNRANKED', color: '#9AA0AC' },
    avatar: '',
    admin: false,
  };
}
