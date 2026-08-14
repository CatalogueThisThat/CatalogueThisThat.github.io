export const MODE_SIZES = [
  { size: '1V1', icon: 'i-sword' },
  { size: '1V2', icon: 'i-shield' },
  { size: '2V2', icon: 'i-shield' },
  { size: '2V3', icon: 'i-target' },
  { size: '3V3', icon: 'i-trophy' },
];

export const MODES = MODE_SIZES.flatMap((m) => [
  { id: `ranked-${m.size.toLowerCase()}`, label: m.size, value: 'RANKED', icon: m.icon, category: 'ranked' },
  { id: `unranked-${m.size.toLowerCase()}`, label: m.size, value: 'UNRANKED', icon: m.icon, category: 'unranked' },
]);

export const SHOP_ITEMS = [
  { id: 'starter', name: 'Starter Bundle', icon: 'i-bag', cost: 800, currency: 'coins', grants: { badge: 'veteran' } },
  { id: 'crate', name: 'Mystery Crate', icon: 'i-crate', cost: 300, currency: 'gems', grants: 'random' },
  { id: 'voltskin', name: 'Volt Skin', icon: 'i-mask', cost: 1200, currency: 'coins', grants: { skin: 'volt' } },
  { id: 'embertrail', name: 'Ember Trail', icon: 'i-sparkle', cost: 600, currency: 'gems', grants: { trail: 'ember' } },
  { id: 'battlepass', name: 'Battle Pass', icon: 'i-star', cost: 2000, currency: 'coins', grants: { badge: 'passholder' } },
];

export const DEFAULT_LOCKER = {
  skin: [
    { id: 'base', name: 'Default', icon: 'i-mask', owned: true },
    { id: 'volt', name: 'Volt Skin', icon: 'i-mask', owned: false },
  ],
  trail: [
    { id: 'base', name: 'None', icon: 'i-sparkle', owned: true },
    { id: 'ember', name: 'Ember Trail', icon: 'i-sparkle', owned: false },
  ],
  emote: [
    { id: 'wave', name: 'Wave', icon: 'i-wand', owned: true },
    { id: 'dance', name: 'Dance', icon: 'i-wand', owned: true },
  ],
  badge: [
    { id: 'rookie', name: 'Rookie', icon: 'i-medal', owned: true },
    { id: 'veteran', name: 'Veteran', icon: 'i-medal', owned: false },
    { id: 'passholder', name: 'Pass Holder', icon: 'i-medal', owned: false },
  ],
};

export const CHAT_REPLIES = [
  'on my way',
  'lets gooo',
  'ready when yall are',
  'one sec, respawning',
  'gg in advance',
];

export function defaultSession() {
  return {
    currency: { gems: 123524, coins: 123524 },
    ready: [true, true, false, true],
    players: ['YEALEXK', 'YENAZARK', 'YEHARRYA', 'NIGGYCARROT'],
    mode: { id: 'ranked-2v2', label: '2V2', value: 'RANKED' },
    searching: true,
    seconds: 32,
    dailyClaimed: false,
    friends: [
      { name: 'YENAZARK', online: true },
      { name: 'YEHARRYA', online: true },
      { name: 'NIGGYCARROT', online: false },
    ],
    locker: structuredClone(DEFAULT_LOCKER),
    equipped: { skin: 'base', trail: 'base', emote: 'wave', badge: 'rookie' },
    isCaptain: true,
  };
}
