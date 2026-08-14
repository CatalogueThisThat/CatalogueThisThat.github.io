import { defaultSession } from './catalog.js';

export const state = defaultSession();

export function updateState(partial) {
  Object.assign(state, partial);
}

export function applySession(session) {
  if (!session) return;
  Object.assign(state, session);
}
