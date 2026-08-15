import { defaultSession } from './catalog.js';

export const state = defaultSession();

export function applyLobby(msg) {
  if (!msg) return;
  const you = msg.you || {};
  Object.assign(state, {
    id: you.id || state.id,
    name: you.name || state.name,
    currency: you.currency || state.currency,
    locker: you.locker || state.locker,
    equipped: you.equipped || state.equipped,
    xp: you.xp ?? state.xp,
    level: you.level ?? state.level,
    xpInto: you.xpInto ?? state.xpInto,
    xpNeed: you.xpNeed ?? state.xpNeed,
    stats: you.stats || state.stats,
    friends: you.friends || state.friends,
    dailyClaimed: you.dailyClaimed ?? state.dailyClaimed,
    isCaptain: you.isCaptain ?? state.isCaptain,
    party: msg.party || state.party,
    mode: msg.mode || state.mode,
    searching: !!msg.searching,
    seconds: msg.seconds ?? state.seconds,
    queueSize: msg.queueSize ?? 0,
    online: Array.isArray(msg.online) ? msg.online : state.online,
    liveMatches: msg.liveMatches ?? 0,
    connected: true,
    guest: !!you.guest,
    passOwned: !!you.passOwned,
    passClaims: you.passClaims || {},
    rank: you.rank || { id: 'unranked', label: 'UNRANKED', color: '#9AA0AC' },
    avatar: you.avatar || '',
    admin: !!you.admin,
    ready: !!msg.party?.members?.find((m) => m.id === you.id)?.ready,
    players: (msg.party?.members || []).map((m) => m.name),
  });
}
