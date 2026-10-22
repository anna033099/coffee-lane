// 簡單的合成音效（不需要任何音檔）
let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; }

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.08, delay = 0, slide = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

const SFX = {
  coin: () => { tone(988, 0.08, 'square', 0.04); tone(1319, 0.14, 'square', 0.04, 0.07); },
  collect: () => { tone(660, 0.1, 'triangle', 0.08); tone(880, 0.1, 'triangle', 0.08, 0.08); tone(1175, 0.16, 'triangle', 0.08, 0.16); },
  start: () => tone(520, 0.12, 'triangle', 0.07, 0, 1.4),
  buy: () => { tone(700, 0.07, 'sine', 0.08); tone(940, 0.1, 'sine', 0.08, 0.06); },
  place: () => tone(300, 0.1, 'sine', 0.12, 0, 0.6),
  pop: () => tone(880, 0.06, 'sine', 0.05, 0, 1.3),
  serve: () => tone(740, 0.08, 'triangle', 0.06),
  cheer: () => { tone(784, 0.08, 'square', 0.035); tone(1047, 0.12, 'square', 0.035, 0.08); },
  no: () => tone(220, 0.16, 'sawtooth', 0.04),
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.08, i * 0.09)),
  click: () => tone(1200, 0.03, 'sine', 0.03),
};

export function sfx(name) {
  if (!enabled) return;
  try { SFX[name] && SFX[name](); } catch (e) { /* 音效失敗不影響遊戲 */ }
}
