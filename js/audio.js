// 合成音效與輕柔的咖啡館背景音樂（不需要任何音檔）
let ctx = null, master = null, musicGain = null;
let sfxOn = true, musicOn = true, musicTimer = null;

export function setSound(on) { sfxOn = on; }
export function setMusic(on) { musicOn = on; if (on) startMusic(); else stopMusic(); }

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// 第一次點擊畫面後才能播放聲音（瀏覽器規定）
export function unlockAudio() { ac(); if (musicOn) startMusic(); }

function tone(freq, dur, type = 'sine', vol = 0.08, delay = 0, slide = 0, dest = null) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  coin: () => { tone(1318, 0.07, 'triangle', 0.05); tone(1760, 0.16, 'triangle', 0.05, 0.06); },
  collect: () => { tone(784, 0.1, 'triangle', 0.08); tone(988, 0.1, 'triangle', 0.08, 0.07); tone(1318, 0.2, 'triangle', 0.08, 0.14); },
  start: () => tone(523, 0.14, 'triangle', 0.07, 0, 1.5),
  buy: () => { tone(880, 0.07, 'sine', 0.08); tone(1175, 0.12, 'sine', 0.08, 0.06); },
  place: () => tone(330, 0.12, 'sine', 0.12, 0, 0.6),
  pop: () => tone(988, 0.06, 'sine', 0.06, 0, 1.3),
  open: () => tone(660, 0.05, 'sine', 0.04, 0, 1.5),
  click: () => tone(1400, 0.03, 'sine', 0.03),
  cheer: () => { tone(784, 0.08, 'square', 0.03); tone(1047, 0.14, 'square', 0.03, 0.08); },
  no: () => tone(220, 0.16, 'sawtooth', 0.035),
  level: () => [523, 659, 784, 1047, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.08)),
  good: () => [659, 831, 988].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.07)),
  pour: () => tone(300, 0.25, 'sine', 0.04, 0, 0.7),
};
export function sfx(name) { if (!sfxOn) return; try { SFX[name] && SFX[name](); } catch (e) { /* 忽略 */ } }

// ---------- 背景音樂：慢速爵士和弦 ----------
const CHORDS = [
  [146.83, 174.61, 220.0, 261.63], // Dm7
  [196.0, 246.94, 293.66, 349.23], // G7
  [130.81, 164.81, 196.0, 246.94], // Cmaj7
  [110.0, 130.81, 164.81, 196.0],  // Am7
];
let step = 0;
function playBar() {
  const a = ac(); if (!a || !musicOn) return;
  if (!musicGain) {
    musicGain = a.createGain(); musicGain.gain.value = 0.18;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    musicGain.connect(lp); lp.connect(master);
  }
  const ch = CHORDS[step % CHORDS.length];
  const beat = 0.75;
  ch.forEach((f, i) => tone(f * 2, beat * 3.6, 'sine', 0.045, i * 0.03, 0, musicGain));
  tone(ch[0] / 2, beat * 1.8, 'triangle', 0.08, 0, 0, musicGain);
  tone(ch[2] / 2, beat * 1.8, 'triangle', 0.06, beat * 2, 0, musicGain);
  const mel = [ch[3] * 2, ch[2] * 2, ch[1] * 4, ch[3] * 2];
  if (step % 2 === 0) mel.forEach((f, i) => { if (Math.random() < 0.7) tone(f, beat * 0.9, 'sine', 0.035, beat * (i + 0.5), 0, musicGain); });
  step++;
}
function startMusic() {
  if (musicTimer || !ctx) return;
  playBar();
  musicTimer = setInterval(playBar, 3000);
}
function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
