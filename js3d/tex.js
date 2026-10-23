// 程式產生的材質貼圖（木地板、大理石、灰泥、布料…），不需要任何外部圖片
import * as THREE from 'three';

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function toTex(c, repeat = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }

// 木紋：在矩形範圍內畫細長紋理
function woodPlank(g, x, y, w, h, base, r, vertical = false) {
  const [hh, ss, ll] = base;
  const dl = (r() - 0.5) * 10, dh = (r() - 0.5) * 6;
  g.fillStyle = hsl(hh + dh, ss, ll + dl);
  g.fillRect(x, y, w, h);
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  const n = Math.floor((vertical ? w : h) / 2.2);
  for (let i = 0; i < n; i++) {
    const a = 0.04 + r() * 0.08;
    g.strokeStyle = `rgba(40,20,10,${a})`;
    g.lineWidth = 0.6 + r() * 1.2;
    g.beginPath();
    if (vertical) {
      const px = x + r() * w; let py = y;
      g.moveTo(px, py);
      while (py < y + h) { py += 8 + r() * 12; g.lineTo(px + Math.sin(py * 0.05 + i) * 1.6, py); }
    } else {
      const py = y + r() * h; let px = x;
      g.moveTo(px, py);
      while (px < x + w) { px += 8 + r() * 12; g.lineTo(px, py + Math.sin(px * 0.05 + i) * 1.6); }
    }
    g.stroke();
  }
  // 木節
  if (r() < 0.25) {
    const kx = x + r() * w, ky = y + r() * h;
    const grd = g.createRadialGradient(kx, ky, 0, kx, ky, 6);
    grd.addColorStop(0, 'rgba(50,25,12,.45)'); grd.addColorStop(1, 'rgba(50,25,12,0)');
    g.fillStyle = grd; g.beginPath(); g.ellipse(kx, ky, vertical ? 4 : 9, vertical ? 9 : 4, 0, 0, 7); g.fill();
  }
  // 邊緣陰影
  g.strokeStyle = 'rgba(20,10,5,.55)'; g.lineWidth = 1.4;
  g.strokeRect(x + 0.7, y + 0.7, w - 1.4, h - 1.4);
  g.restore();
}

const cache = new Map();
function memo(key, fn) { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); }

// 人字拼木地板（一張貼圖 = 1×1 格，8×8 片寬的週期，可無縫重複）
export function herringbone(tone = 'walnut') {
  return memo('hb' + tone, () => {
    const S = 512, w = S / 8, L = w * 4;
    const [c, g] = canvas(S, S);
    const base = { walnut: [24, 38, 30], oak: [30, 42, 48], honey: [32, 50, 40] }[tone];
    g.fillStyle = '#2a1a10'; g.fillRect(0, 0, S, S);
    const mod = (a, m) => ((a % m) + m) % m;
    for (let st = -6; st <= 6; st++) {
      for (let k = -14; k <= 14; k++) {
        const bx = (k - 4 * st) * w, by = (k + 4 * st) * w;
        if (bx > S + L || by > S + L || bx < -2 * L || by < -2 * L) continue;
        const key = mod(bx, S) * 7 + mod(by, S) * 13;
        woodPlank(g, bx, by, L, w, base, rng(key + 1), false);
        woodPlank(g, bx + L, by - 3 * w, w, L, base, rng(key + 2), true);
      }
    }
    return toTex(c);
  });
}

// 直鋪木地板
export function planks(tone = 'oak') {
  return memo('pl' + tone, () => {
    const S = 512;
    const [c, g] = canvas(S, S);
    const base = { walnut: [24, 38, 30], oak: [30, 40, 52], honey: [32, 50, 44], ash: [36, 22, 66] }[tone];
    const r = rng(11);
    const rows = 4, h = S / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * S;
      while (x < S) { const w = S * (0.5 + r() * 0.6); woodPlank(g, x, i * h, w, h, base, r); x += w; }
    }
    return toTex(c);
  });
}

// 棋盤磚
export function checker(a = '#efe9df', b = '#2b2a2c') {
  return memo('ck' + a + b, () => {
    const S = 256;
    const [c, g] = canvas(S, S);
    const r = rng(3);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? b : a;
      g.fillRect(i * S / 2, j * S / 2, S / 2, S / 2);
      for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${(i + j) % 2 ? '255,255,255' : '0,0,0'},${r() * 0.04})`; g.fillRect(i * S / 2 + r() * S / 2, j * S / 2 + r() * S / 2, 3 + r() * 8, 2 + r() * 6); }
    }
    g.strokeStyle = 'rgba(120,110,100,.6)'; g.lineWidth = 2;
    g.strokeRect(1, 1, S / 2 - 2, S / 2 - 2); g.strokeRect(S / 2 + 1, S / 2 + 1, S / 2 - 2, S / 2 - 2);
    g.strokeRect(S / 2 + 1, 1, S / 2 - 2, S / 2 - 2); g.strokeRect(1, S / 2 + 1, S / 2 - 2, S / 2 - 2);
    return toTex(c);
  });
}

// 水磨石
export function terrazzo() {
  return memo('tz', () => {
    const S = 512;
    const [c, g] = canvas(S, S);
    const r = rng(19);
    g.fillStyle = '#ece6dc'; g.fillRect(0, 0, S, S);
    const cols = ['#c9826a', '#8fa696', '#d8b878', '#9a958e', '#e6b3a6', '#5f6f66'];
    for (let i = 0; i < 900; i++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.globalAlpha = 0.6 + r() * 0.4;
      const x = r() * S, y = r() * S, s = 1.5 + r() * (r() < 0.1 ? 9 : 4);
      g.beginPath();
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + r(); g.lineTo(x + Math.cos(a) * s * (0.6 + r() * 0.6), y + Math.sin(a) * s * (0.6 + r() * 0.6)); }
      g.fill();
    }
    g.globalAlpha = 1;
    return toTex(c);
  });
}

// 大理石
export function marble(tint = 'white') {
  return memo('mb' + tint, () => {
    const S = 512;
    const [c, g] = canvas(S, S);
    const r = rng(tint === 'white' ? 5 : 9);
    const bg = { white: '#f2efe9', green: '#2f4a40', black: '#262426', pink: '#ead6cf' }[tint];
    const vein = { white: '120,115,110', green: '200,220,205', black: '220,210,200', pink: '170,120,110' }[tint];
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${vein},${r() * 0.03})`; g.beginPath(); g.arc(r() * S, r() * S, 10 + r() * 60, 0, 7); g.fill(); }
    for (let v = 0; v < 14; v++) {
      let x = r() * S, y = r() * S, a = r() * 6.28;
      g.strokeStyle = `rgba(${vein},${0.12 + r() * 0.35})`;
      g.lineWidth = 0.5 + r() * (v < 3 ? 2.2 : 1);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 40; k++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); }
      g.stroke();
    }
    return toTex(c);
  });
}

// 灰泥牆
export function plaster(color = '#efe6d8') {
  return memo('ps' + color, () => {
    const S = 256;
    const [c, g] = canvas(S, S);
    const r = rng(13);
    g.fillStyle = color; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${r() * 0.06})` : `rgba(90,60,40,${r() * 0.05})`;
      g.beginPath(); g.arc(r() * S, r() * S, 1 + r() * 9, 0, 7); g.fill();
    }
    return toTex(c);
  });
}

// 紅磚
export function brick() {
  return memo('br', () => {
    const S = 512;
    const [c, g] = canvas(S, S);
    const r = rng(23);
    g.fillStyle = '#d9cbb8'; g.fillRect(0, 0, S, S);
    const bh = S / 16, bw = S / 4;
    for (let row = 0; row < 16; row++) {
      const off = row % 2 ? -bw / 2 : 0;
      for (let k = 0; k < 6; k++) {
        const x = off + k * bw, y = row * bh;
        const l = 34 + r() * 12;
        g.fillStyle = hsl(12 + r() * 8, 40 + r() * 10, l);
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        for (let n = 0; n < 12; n++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(x + 2 + r() * (bw - 6), y + 2 + r() * (bh - 6), 2 + r() * 5, 1 + r() * 3); }
      }
    }
    return toTex(c);
  });
}

// 布料（絨布、亞麻）
export function fabric(color = '#2f5446', kind = 'velvet') {
  return memo('fb' + color + kind, () => {
    const S = 128;
    const [c, g] = canvas(S, S);
    const r = rng(29);
    g.fillStyle = color; g.fillRect(0, 0, S, S);
    if (kind === 'linen') {
      for (let i = 0; i < S; i += 2) { g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.04})`; g.fillRect(0, i, S, 1); g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`; g.fillRect(i, 0, 1, S); }
    } else {
      for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3); }
    }
    return toTex(c);
  });
}

// 編織地毯
export function rug(kind = 'persian') {
  return memo('rg' + kind, () => {
    const W = 512, H = 352;
    const [c, g] = canvas(W, H);
    const r = rng(31);
    if (kind === 'persian') {
      g.fillStyle = '#8a3b2e'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#e7d3b0'; g.fillRect(14, 14, W - 28, H - 28);
      g.fillStyle = '#26364a'; g.fillRect(24, 24, W - 48, H - 48);
      g.fillStyle = '#9b4434'; g.fillRect(44, 44, W - 88, H - 88);
      g.strokeStyle = '#e7d3b0'; g.lineWidth = 3;
      for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(W / 2, H / 2, 20 + i * 5, 0, 7); g.globalAlpha = 0.18; g.stroke(); }
      g.globalAlpha = 1;
      g.fillStyle = '#e7d3b0';
      g.beginPath(); g.moveTo(W / 2, H / 2 - 70); g.lineTo(W / 2 + 90, H / 2); g.lineTo(W / 2, H / 2 + 70); g.lineTo(W / 2 - 90, H / 2); g.fill();
      g.fillStyle = '#26364a';
      g.beginPath(); g.moveTo(W / 2, H / 2 - 44); g.lineTo(W / 2 + 56, H / 2); g.lineTo(W / 2, H / 2 + 44); g.lineTo(W / 2 - 56, H / 2); g.fill();
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * W, r() * H, 2, 2); }
    } else {
      g.fillStyle = '#e9e1d2'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#c7b89f'; g.lineWidth = 6;
      g.strokeRect(20, 20, W - 40, H - 40);
      for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(90,70,50,${r() * 0.05})`; g.fillRect(r() * W, r() * H, 2, 2); }
    }
    return toTex(c, [1, 1]);
  });
}

// 帶直條紋的牆紙
export function stripes(a = '#e8e0cf', b = '#d8ccb5') {
  return memo('st' + a + b, () => {
    const S = 128;
    const [c, g] = canvas(S, S);
    g.fillStyle = a; g.fillRect(0, 0, S, S);
    g.fillStyle = b; g.fillRect(0, 0, S / 4, S); g.fillRect(S / 2, 0, S / 12, S);
    return toTex(c);
  });
}

// 天空（窗外）
export function sky() {
  return memo('sky', () => {
    const [c, g] = canvas(64, 256);
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#9fc8e6'); grd.addColorStop(0.6, '#e8eef0'); grd.addColorStop(0.62, '#a9c49a'); grd.addColorStop(1, '#7ea06f');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 256);
    const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  });
}

// 柔和圓形陰影（貼在角色腳下）
export function blob() {
  return memo('blob', () => {
    const [c, g] = canvas(128, 128);
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,.45)'); grd.addColorStop(0.6, 'rgba(0,0,0,.18)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); return t;
  });
}

// 黑板菜單
export function chalkboard(title = 'MENU') {
  return memo('cb' + title, () => {
    const [c, g] = canvas(256, 320);
    g.fillStyle = '#25302b'; g.fillRect(0, 0, 256, 320);
    for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(Math.random() * 256, Math.random() * 320, 3, 2); }
    g.fillStyle = '#f3eadc'; g.font = 'italic 700 34px Georgia, serif'; g.textAlign = 'center';
    g.fillText(title, 128, 52);
    g.font = '18px Georgia, serif'; g.textAlign = 'left';
    const items = ['Espresso', 'Americano', 'Café Latte', 'Cappuccino', 'Mocha', 'Pour Over', 'Cold Brew'];
    items.forEach((t, i) => { g.fillText(t, 30, 96 + i * 30); g.textAlign = 'right'; g.fillText('·' + (60 + i * 15), 226, 96 + i * 30); g.textAlign = 'left'; });
    g.strokeStyle = '#d9a441'; g.lineWidth = 2; g.beginPath(); g.moveTo(60, 64); g.lineTo(196, 64); g.stroke();
    return toTex(c, [1, 1]);
  });
}

// 牆上掛畫
export function painting(kind = 0) {
  return memo('pt' + kind, () => {
    const [c, g] = canvas(256, 320);
    const r = rng(41 + kind);
    const pal = [['#e9dcc4', '#c47a55', '#5d7d6b', '#2f3b46'], ['#f0e6d6', '#d9a441', '#8a3b2e', '#26364a'], ['#dde4dc', '#7d9a86', '#c9a24a', '#3b2a22']][kind % 3];
    g.fillStyle = pal[0]; g.fillRect(0, 0, 256, 320);
    if (kind % 3 === 0) {
      g.fillStyle = pal[1]; g.beginPath(); g.arc(170, 110, 46, 0, 7); g.fill();
      g.fillStyle = pal[2]; g.beginPath(); g.moveTo(0, 240); g.quadraticCurveTo(90, 150, 160, 220); g.quadraticCurveTo(210, 180, 256, 210); g.lineTo(256, 320); g.lineTo(0, 320); g.fill();
      g.fillStyle = pal[3]; g.beginPath(); g.moveTo(0, 280); g.quadraticCurveTo(120, 230, 256, 270); g.lineTo(256, 320); g.lineTo(0, 320); g.fill();
    } else if (kind % 3 === 1) {
      for (let i = 0; i < 7; i++) { g.fillStyle = pal[1 + (i % 3)]; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(40 + r() * 180, 40 + r() * 240, 20 + r() * 50, 20 + r() * 50, r() * 3, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    } else {
      g.strokeStyle = pal[3]; g.lineWidth = 3;
      g.beginPath(); g.moveTo(128, 300); g.bezierCurveTo(120, 220, 140, 150, 128, 60); g.stroke();
      for (let i = 0; i < 9; i++) { g.fillStyle = pal[1 + (i % 2)]; g.beginPath(); g.ellipse(128 + (i % 2 ? 34 : -34), 90 + i * 22, 30, 12, i % 2 ? -0.5 : 0.5, 0, 7); g.fill(); }
    }
    return toTex(c, [1, 1]);
  });
}

// 招牌文字
export function textTex(text, opt = {}) {
  const { w = 512, h = 128, font = '700 64px "Noto Serif TC", Georgia, serif', color = '#c9a24a', bg = null } = opt;
  return memo('tx' + text + font + color + bg, () => {
    const [c, g] = canvas(w, h);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  });
}

// 木紋（家具用，直紋）
export function woodGrain(color = '#4a2e1e') {
  return memo('wg' + color, () => {
    const S = 256;
    const [c, g] = canvas(S, S);
    const r = rng(53);
    g.fillStyle = color; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = r() < 0.5 ? `rgba(0,0,0,${0.04 + r() * 0.08})` : `rgba(255,220,180,${0.02 + r() * 0.05})`;
      g.lineWidth = 0.5 + r() * 2;
      let x = r() * S;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= S; y += 16) { x += (r() - 0.5) * 3; g.lineTo(x, y); }
      g.stroke();
    }
    return toTex(c);
  });
}

// 編藤
export function cane() {
  return memo('cane', () => {
    const S = 128;
    const [c, g] = canvas(S, S);
    g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#d8b67e'; g.lineWidth = 3;
    for (let i = -S; i < 2 * S; i += 12) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke();
      g.beginPath(); g.moveTo(i, S); g.lineTo(i + S, 0); g.stroke();
    }
    g.strokeStyle = '#c9a46a'; g.lineWidth = 2;
    for (let i = 0; i < S; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke(); }
    return toTex(c);
  });
}

// 石板步道（店外廣場）
export function cobble() {
  return memo('cobble', () => {
    const S = 512;
    const [c, g] = canvas(S, S);
    const r = rng(61);
    g.fillStyle = '#b9ab98'; g.fillRect(0, 0, S, S);
    const rows = 8, h = S / rows;
    for (let i = 0; i < rows; i++) {
      let x = (i % 2) * -h * 0.5;
      while (x < S) {
        const w = h * (0.9 + r() * 0.5);
        const l = 78 + r() * 10;
        g.fillStyle = `hsl(${32 + r() * 10},${14 + r() * 8}%,${l}%)`;
        g.beginPath();
        const rr = 10;
        const x0 = x + 3, y0 = i * h + 3, x1 = x + w - 3, y1 = (i + 1) * h - 3;
        g.moveTo(x0 + rr, y0); g.lineTo(x1 - rr, y0); g.quadraticCurveTo(x1, y0, x1, y0 + rr); g.lineTo(x1, y1 - rr); g.quadraticCurveTo(x1, y1, x1 - rr, y1); g.lineTo(x0 + rr, y1); g.quadraticCurveTo(x0, y1, x0, y1 - rr); g.lineTo(x0, y0 + rr); g.quadraticCurveTo(x0, y0, x0 + rr, y0);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0 + 4, y0 + 3, w - 16, 3);
        g.fillStyle = 'rgba(80,60,40,.12)'; g.fillRect(x0 + 4, y1 - 5, w - 14, 3);
        if (x + w > S) { // 讓左右可以無縫接
          g.save(); g.translate(-S, 0); g.fillStyle = `hsl(${32 + r() * 10},${14 + r() * 8}%,${l}%)`; g.fillRect(x0, y0, w - 6, h - 6); g.restore();
        }
        x += w;
      }
    }
    return toTex(c);
  });
}
// 草地
export function grass() {
  return memo('grass', () => {
    const S = 256;
    const [c, g] = canvas(S, S);
    const r = rng(67);
    g.fillStyle = '#7fa35c'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      g.strokeStyle = `hsl(${85 + r() * 25},${35 + r() * 20}%,${30 + r() * 25}%)`;
      g.lineWidth = 1 + r();
      const x = r() * S, y = r() * S;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); g.stroke();
    }
    return toTex(c);
  });
}
