/** Lobby background music playlist — random order, never the same track twice in a row. */

export const LOBBY_TRACKS = [
  { id: 'world-hold-on', title: 'WORLD HOLD ON', src: 'assets/audio/bg-music.mp3' },
  { id: 'gypsy-woman', title: 'GYPSY WOMAN', src: 'assets/audio/gypsy-woman.mp3' },
  { id: 'supermassive', title: 'SUPERMASSIVE BLACK HOLE', src: 'assets/audio/supermassive-black-hole.mp3' },
  { id: 'you-spin', title: 'YOU SPIN ME ROUND', src: 'assets/audio/you-spin-me-round.mp3' },
];

export function formatTrackLabel(title) {
  return String(title || 'MUSIC').toUpperCase().trim();
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createLobbyMusic(audioEl) {
  let queue = shuffle(LOBBY_TRACKS);
  let cursor = 0;
  let currentId = null;
  let enabled = true;
  let volume = 0.5;

  function current() {
    return LOBBY_TRACKS.find((t) => t.id === currentId) || queue[cursor] || LOBBY_TRACKS[0];
  }

  function label() {
    return formatTrackLabel(current()?.title || 'MUSIC');
  }

  function paintLabel(muted = false) {
    const el = document.getElementById('musicLabel');
    if (el) el.textContent = muted || !enabled ? 'MUTED' : label();
  }

  function ensureQueue() {
    if (!queue.length) queue = shuffle(LOBBY_TRACKS);
    if (queue.length > 1 && queue[0].id === currentId) {
      const rest = queue.slice(1);
      queue = [...rest, queue[0]];
    }
  }

  function load(track, { autoplay = true } = {}) {
    if (!audioEl || !track) return;
    currentId = track.id;
    const wasPaused = audioEl.paused;
    audioEl.loop = false;
    audioEl.src = track.src;
    audioEl.load();
    paintLabel(!enabled);
    if (enabled && autoplay) {
      audioEl.play().catch(() => {
        document.addEventListener('click', function once() {
          if (enabled) audioEl.play().catch(() => {});
          document.removeEventListener('click', once);
        }, { once: true });
      });
    } else if (wasPaused || !enabled) {
      audioEl.pause();
    }
  }

  function pickDifferent() {
    ensureQueue();
    let next = queue.shift();
    if (next?.id === currentId && queue.length) {
      queue.push(next);
      next = queue.shift();
    }
    if (!queue.length) {
      queue = shuffle(LOBBY_TRACKS.filter((t) => t.id !== next?.id));
      if (!queue.length) queue = shuffle(LOBBY_TRACKS);
    }
    return next || LOBBY_TRACKS[0];
  }

  function playNext({ forceDifferent = true } = {}) {
    const track = forceDifferent ? pickDifferent() : (queue.shift() || pickDifferent());
    load(track, { autoplay: enabled });
    return track;
  }

  function start() {
    if (!currentId) playNext({ forceDifferent: false });
    else if (enabled) audioEl?.play().catch(() => {});
    paintLabel(!enabled);
  }

  function skip() {
    return playNext({ forceDifferent: true });
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!audioEl) return;
    if (enabled) {
      if (!currentId) playNext({ forceDifferent: false });
      else audioEl.play().catch(() => {});
      paintLabel(false);
    } else {
      audioEl.pause();
      paintLabel(true);
    }
  }

  function pauseForMatch() {
    audioEl?.pause();
  }

  function resumeAfterMatch() {
    playNext({ forceDifferent: true });
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, Number(v) || 0));
    if (audioEl) audioEl.volume = volume;
  }

  if (audioEl) {
    audioEl.volume = volume;
    audioEl.loop = false;
    audioEl.addEventListener('ended', () => {
      if (enabled) playNext({ forceDifferent: true });
    });
  }

  return {
    start,
    skip,
    setEnabled,
    isEnabled: () => enabled,
    pauseForMatch,
    resumeAfterMatch,
    setVolume,
    label,
    paintLabel,
    current,
  };
}
