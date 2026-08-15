/** Touch joystick + action buttons for arena play. */

const state = {
  enabled: false,
  nx: 0,
  ny: 0,
  shoot: false,
  pointerId: null,
  originX: 0,
  originY: 0,
};

const DEAD = 0.28;
const MAX_TRAVEL = 54;

function el(id) {
  return document.getElementById(id);
}

function prefersMobile() {
  if (typeof window === 'undefined') return false;
  if (navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 1024px)').matches) return true;
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
  if (window.matchMedia('(max-width: 820px)').matches) return true;
  return false;
}

function setVisible(on) {
  const root = el('mobileControls');
  const arena = el('arena');
  if (!root || !arena) return;
  state.enabled = !!on;
  root.classList.toggle('on', !!on);
  arena.classList.toggle('mobile-on', !!on);
  if (!on) reset();
}

function reset() {
  state.nx = 0;
  state.ny = 0;
  state.shoot = false;
  state.pointerId = null;
  const knob = el('mobileStickKnob');
  if (knob) {
    knob.style.transform = 'translate(-50%, -50%)';
  }
  el('mobileShoot')?.classList.remove('lit');
  el('mobileDash')?.classList.remove('lit');
  el('mobileAbility')?.classList.remove('lit');
}

function setKnob(nx, ny) {
  const knob = el('mobileStickKnob');
  if (!knob) return;
  knob.style.transform = `translate(calc(-50% + ${nx * MAX_TRAVEL}px), calc(-50% + ${ny * MAX_TRAVEL}px))`;
}

function onStickDown(e) {
  if (!state.enabled) return;
  e.preventDefault();
  e.stopPropagation();
  const base = el('mobileStickBase') || el('mobileStick');
  if (!base) return;
  const rect = base.getBoundingClientRect();
  state.pointerId = e.pointerId;
  state.originX = rect.left + rect.width / 2;
  state.originY = rect.top + rect.height / 2;
  try { base.setPointerCapture(e.pointerId); } catch { /* */ }
  moveStick(e.clientX, e.clientY);
}

function moveStick(clientX, clientY) {
  let dx = clientX - state.originX;
  let dy = clientY - state.originY;
  const len = Math.hypot(dx, dy) || 1;
  const capped = Math.min(len, MAX_TRAVEL);
  dx = (dx / len) * capped;
  dy = (dy / len) * capped;
  state.nx = dx / MAX_TRAVEL;
  state.ny = dy / MAX_TRAVEL;
  setKnob(state.nx, state.ny);
}

function onStickMove(e) {
  if (state.pointerId !== e.pointerId) return;
  e.preventDefault();
  moveStick(e.clientX, e.clientY);
}

function onStickUp(e) {
  if (state.pointerId != null && e.pointerId !== state.pointerId) return;
  e.preventDefault();
  state.pointerId = null;
  state.nx = 0;
  state.ny = 0;
  setKnob(0, 0);
}

function bindButton(id, { hold, tap }) {
  const btn = el(id);
  if (!btn) return () => {};
  const down = (e) => {
    if (!state.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    try { btn.setPointerCapture(e.pointerId); } catch { /* */ }
    btn.classList.add('lit');
    hold?.(true);
    tap?.();
  };
  const up = (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.remove('lit');
    hold?.(false);
  };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('lostpointercapture', up);
  return () => {
    btn.removeEventListener('pointerdown', down);
    btn.removeEventListener('pointerup', up);
    btn.removeEventListener('pointercancel', up);
    btn.removeEventListener('lostpointercapture', up);
  };
}

let unbindFns = [];

export function bindMobileControls({ onDash, onAbility } = {}) {
  unbindMobileControls();
  const stick = el('mobileStick');
  if (stick) {
    const down = (e) => onStickDown(e);
    const move = (e) => onStickMove(e);
    const up = (e) => onStickUp(e);
    stick.addEventListener('pointerdown', down);
    stick.addEventListener('pointermove', move);
    stick.addEventListener('pointerup', up);
    stick.addEventListener('pointercancel', up);
    unbindFns.push(() => {
      stick.removeEventListener('pointerdown', down);
      stick.removeEventListener('pointermove', move);
      stick.removeEventListener('pointerup', up);
      stick.removeEventListener('pointercancel', up);
    });
  }
  unbindFns.push(bindButton('mobileShoot', {
    hold: (on) => { state.shoot = on; },
  }));
  unbindFns.push(bindButton('mobileDash', {
    tap: () => onDash?.(),
  }));
  unbindFns.push(bindButton('mobileAbility', {
    tap: () => onAbility?.(),
  }));

  // First touch in arena on a hybrid device → reveal controls
  const arena = el('arena');
  if (arena) {
    const reveal = () => {
      if (!state.enabled) setVisible(true);
    };
    arena.addEventListener('touchstart', reveal, { passive: true });
    unbindFns.push(() => arena.removeEventListener('touchstart', reveal));
  }
}

export function unbindMobileControls() {
  for (const fn of unbindFns) {
    try { fn(); } catch { /* */ }
  }
  unbindFns = [];
  reset();
}

export function showMobileControls(force) {
  const on = force == null ? prefersMobile() : !!force;
  setVisible(on);
}

export function hideMobileControls() {
  setVisible(false);
}

export function mobileInput() {
  if (!state.enabled) {
    return { up: false, down: false, left: false, right: false, shoot: false, nx: 0, ny: 0, active: false };
  }
  return {
    active: true,
    up: state.ny < -DEAD,
    down: state.ny > DEAD,
    left: state.nx < -DEAD,
    right: state.nx > DEAD,
    shoot: state.shoot,
    nx: state.nx,
    ny: state.ny,
  };
}

export function mobileAimAt(self, players, youId) {
  if (!self) return null;
  const foes = (players || []).filter((p) => p && p.id !== youId && p.alive && p.team !== self.team);
  if (foes.length) {
    let best = foes[0];
    let bestD = Infinity;
    for (const f of foes) {
      const d = (f.x - self.x) ** 2 + (f.y - self.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return { x: best.x, y: best.y };
  }
  if (Math.abs(state.nx) > 0.08 || Math.abs(state.ny) > 0.08) {
    const len = Math.hypot(state.nx, state.ny) || 1;
    return { x: self.x + (state.nx / len) * 520, y: self.y + (state.ny / len) * 520 };
  }
  const aim = Number(self.aim) || 0;
  return { x: self.x + Math.cos(aim) * 520, y: self.y + Math.sin(aim) * 520 };
}
