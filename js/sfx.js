let ctx;
let sfxOn = localStorage.getItem('match-room-sfx') !== 'off';

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function beep({ freq = 440, dur = 0.08, type = 'square', gain = 0.05, slide = 0 }) {
  if (!sfxOn) return;
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

export const sfx = {
  get enabled() {
    return sfxOn;
  },
  setEnabled(on) {
    sfxOn = !!on;
    localStorage.setItem('match-room-sfx', sfxOn ? 'on' : 'off');
  },
  unlock() {
    ac();
  },
  ui() {
    beep({ freq: 720, dur: 0.05, gain: 0.03 });
  },
  shot() {
    beep({ freq: 220, dur: 0.05, type: 'sawtooth', gain: 0.04, slide: -120 });
  },
  hit() {
    beep({ freq: 140, dur: 0.07, type: 'square', gain: 0.05 });
  },
  kill() {
    beep({ freq: 520, dur: 0.12, type: 'square', gain: 0.06, slide: 200 });
  },
  dash() {
    beep({ freq: 180, dur: 0.1, type: 'triangle', gain: 0.04, slide: 240 });
  },
  pickup() {
    beep({ freq: 660, dur: 0.1, type: 'sine', gain: 0.04, slide: 200 });
  },
  ability() {
    beep({ freq: 300, dur: 0.16, type: 'sawtooth', gain: 0.05, slide: 400 });
  },
};
