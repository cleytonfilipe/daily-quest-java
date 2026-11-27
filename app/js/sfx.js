// Efeitos sonoros 8-bit gerados com Web Audio (nenhum arquivo de áudio necessário).
let ctx = null;
let enabled = true;

export const setSound = (v) => { enabled = v; };

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'square', vol = 0.06) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.05, 'square', 0.03),
  complete: () => { tone(523, 0, 0.08); tone(784, 0.08, 0.14); },
  coin: () => { tone(988, 0, 0.06); tone(1319, 0.06, 0.16); },
  undo: () => { tone(440, 0, 0.08); tone(330, 0.08, 0.1); },
  damage: () => { tone(220, 0, 0.1, 'sawtooth', 0.07); tone(147, 0.1, 0.18, 'sawtooth', 0.07); },
  levelup: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.12)),
  achievement: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.12, 'triangle', 0.08)),
  boss: () => [196, 247, 294, 392, 494, 587, 784].forEach((f, i) => tone(f, i * 0.08, 0.14)),
  hit: () => tone(180, 0, 0.06, 'square', 0.05),
  faint: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.15, 0.2, 'triangle', 0.08)),
  timer: () => [880, 0, 880, 0, 1175].forEach((f, i) => f && tone(f, i * 0.12, 0.1)),
};

export function play(name) {
  if (!enabled) return;
  try { SOUNDS[name]?.(); } catch { /* áudio indisponível */ }
}
