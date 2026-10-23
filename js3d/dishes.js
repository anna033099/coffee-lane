// 料理擺盤：所有飲品、甜點、料理都用程式組出 3D 擺盤，再「拍照」成食譜卡片與小圖示
// 只在需要時拍（食譜書捲到哪拍到哪），拍過就快取。
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/addons/RoundedBoxGeometry.js';
import * as D from '../js/data.js';

// ================= 小工具 =================
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + (b - a) * rnd();
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h) || 1; }
const TAU = Math.PI * 2;

const texCache = new Map();
function ctex(key, w, h, draw, repeat) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  texCache.set(key, t); return t;
}
const matCache = new Map();
// 食物材質：r 粗糙度、cc 亮面（醬汁、糖漿）、map 貼圖、op 透明度
function fm(color, o = {}) {
  const key = color + '|' + (o.r ?? 0.62) + '|' + (o.cc || 0) + '|' + (o.map ? o.map.uuid : '') + '|' + (o.op ?? 1) + '|' + (o.metal || 0) + '|' + (o.side || 0) + '|' + (o.em || '');
  if (!matCache.has(key)) {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: o.r ?? 0.62, metalness: o.metal || 0, clearcoat: o.cc || 0, clearcoatRoughness: 0.15, map: o.map || null });
    if (o.op != null && o.op < 1) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
    if (o.side) m.side = THREE.DoubleSide;
    if (o.em) { m.emissive = new THREE.Color(o.em); m.emissiveIntensity = 0.25; }
    matCache.set(key, m);
  }
  return matCache.get(key);
}
const GLASS = () => fm('#f4fafa', { r: 0.03, op: 0.13, cc: 1 });
const CER = () => fm('#f7f4ee', { r: 0.18, cc: 0.6 });
const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };
function latheGeo(pts, seg = 40) { return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])), seg); }
function tubeGeo(points, r, seg = 24, rad = 8) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), seg, r, rad, false); }
// 讓表面凹凸（冰淇淋、炸物、泡芙）
function bumpify(geo, amp, freq, sd) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * freq + sd) * Math.cos(v.y * freq * 1.3 + sd * 2) * Math.sin(v.z * freq * 0.9 + sd * 3) + 0.5 * Math.sin((v.x + v.z) * freq * 2.1 + sd);
    v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// ================= 程式貼圖 =================
const TX = {
  speck(base, dot, n = 260, k = 'sp') {
    return ctex('speck' + base + dot + n + k, 128, 128, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h); seed = hash(base + dot);
      for (let i = 0; i < n; i++) { g.fillStyle = dot; g.globalAlpha = rr(0.15, 0.6); g.beginPath(); g.ellipse(rr(0, w), rr(0, h), rr(0.6, 2.2), rr(0.5, 1.6), rr(0, 3), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }, true);
  },
  crust(base) { // 烤色：中心淺、邊緣深
    return ctex('crust' + base, 128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w * 0.7);
      gr.addColorStop(0, shade(base, 0.18)); gr.addColorStop(0.6, base); gr.addColorStop(1, shade(base, -0.28));
      g.fillStyle = gr; g.fillRect(0, 0, w, h); seed = hash(base);
      for (let i = 0; i < 160; i++) { g.fillStyle = shade(base, rr(-0.3, 0.2)); g.globalAlpha = 0.35; g.beginPath(); g.arc(rr(0, w), rr(0, h), rr(0.5, 2), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    });
  },
  grill(base) {
    return ctex('grill' + base, 128, 128, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = shade(base, -0.55); g.lineWidth = 7; g.lineCap = 'round'; g.globalAlpha = 0.85;
      for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 30, 0); g.lineTo(i * 30 + 60, h); g.stroke(); }
      g.globalAlpha = 1;
    });
  },
  waffle(base) {
    return ctex('waffle' + base, 128, 128, (g, w, h) => {
      g.fillStyle = shade(base, -0.12); g.fillRect(0, 0, w, h);
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const gr = g.createLinearGradient(0, y * 26, 0, y * 26 + 20); gr.addColorStop(0, shade(base, -0.3)); gr.addColorStop(1, shade(base, 0.12)); g.fillStyle = gr; g.fillRect(x * 26 + 4, y * 26 + 4, 18, 18); }
    });
  },
  pizza(sauce, cheese, tops) {
    return ctex('pizza' + sauce + cheese + tops.join(), 256, 256, (g, w, h) => {
      g.fillStyle = '#d9a35a'; g.fillRect(0, 0, w, h);
      g.fillStyle = sauce; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.fill();
      seed = hash(sauce + tops.join());
      g.fillStyle = cheese;
      for (let i = 0; i < 34; i++) { g.globalAlpha = rr(0.65, 0.95); g.beginPath(); const a = rr(0, TAU), d = rr(0, 95); g.ellipse(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, rr(10, 24), rr(8, 18), rr(0, 3), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
      for (const t of tops) {
        const [col, kind, n] = t.split(':');
        for (let i = 0; i < (+n || 8); i++) {
          const a = rr(0, TAU), d = rr(12, 92), x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
          g.fillStyle = col;
          if (kind === 'leaf') { g.beginPath(); g.ellipse(x, y, 10, 5, rr(0, 3), 0, TAU); g.fill(); }
          else if (kind === 'ring') { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.stroke(); }
          else if (kind === 'dot') { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
          else { g.beginPath(); g.arc(x, y, 11, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.arc(x + 2, y + 2, 9, 0, TAU); g.fill(); }
        }
      }
      // 焦斑
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(120,60,20,.25)'; g.beginPath(); g.arc(rr(30, 226), rr(30, 226), rr(2, 6), 0, TAU); g.fill(); }
    });
  },
  citrus(fill, rind, k = '') {
    return ctex('cit' + fill + rind + k, 128, 128, (g, w, h) => {
      g.fillStyle = rind; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
      g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(64, 64, 56, 0, TAU); g.fill();
      for (let i = 0; i < 9; i++) { g.fillStyle = fill; g.beginPath(); g.moveTo(64, 64); g.arc(64, 64, 52, i / 9 * TAU + 0.06, (i + 1) / 9 * TAU - 0.06); g.closePath(); g.fill(); }
      g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(64, 64, 5, 0, TAU); g.fill();
    });
  },
  cucumber() {
    return ctex('cuc', 128, 128, (g) => {
      g.fillStyle = '#3f6b35'; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
      g.fillStyle = '#cfe3a5'; g.beginPath(); g.arc(64, 64, 57, 0, TAU); g.fill();
      g.fillStyle = '#e8f0c8'; g.beginPath(); g.arc(64, 64, 30, 0, TAU); g.fill();
      for (let i = 0; i < 6; i++) { g.fillStyle = '#f6f8e4'; g.beginPath(); g.ellipse(64 + Math.cos(i) * 16, 64 + Math.sin(i) * 16, 5, 3, i, 0, TAU); g.fill(); }
    });
  },
  rice(tint = '#fbf8f0') {
    return ctex('rice' + tint, 128, 128, (g, w, h) => {
      g.fillStyle = shade(tint, -0.06); g.fillRect(0, 0, w, h); seed = 77;
      for (let i = 0; i < 520; i++) { g.fillStyle = shade(tint, rr(-0.04, 0.06)); g.save(); g.translate(rr(0, w), rr(0, h)); g.rotate(rr(0, 3)); g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, TAU); g.fill(); g.restore(); }
    }, true);
  },
  latte(base, foam, kind) {
    return ctex('latte' + base + foam + kind, 256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, shade(base, 0.08)); gr.addColorStop(0.85, base); gr.addColorStop(1, shade(base, -0.25));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = foam; g.strokeStyle = foam;
      if (kind === 'heart') {
        g.beginPath(); g.moveTo(128, 196); g.bezierCurveTo(40, 130, 60, 60, 128, 98); g.bezierCurveTo(196, 60, 216, 130, 128, 196); g.fill();
      } else if (kind === 'tulip') {
        for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(128, 170 - i * 38, 54 - i * 10, 26 - i * 3, 0, Math.PI, TAU); g.ellipse(128, 170 - i * 38, 54 - i * 10, 12, 0, 0, Math.PI); g.fill(); }
        g.lineWidth = 5; g.beginPath(); g.moveTo(128, 70); g.lineTo(128, 200); g.stroke();
      } else if (kind === 'rosetta') {
        for (let i = 0; i < 7; i++) { const y = 200 - i * 20, rw = 70 - i * 8; g.beginPath(); g.ellipse(128, y, rw, 12, 0, Math.PI, TAU); g.lineWidth = 9; g.stroke(); }
        g.lineWidth = 5; g.beginPath(); g.moveTo(128, 60); g.lineTo(128, 216); g.stroke();
      } else if (kind === 'swirl') {
        g.lineWidth = 10; g.beginPath(); for (let a = 0; a < 18; a += 0.1) { const r = 6 + a * 5.6; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.stroke();
      } else if (kind === 'crema') {
        const cg = g.createRadialGradient(128, 128, 10, 128, 128, 128); cg.addColorStop(0, '#b47a46'); cg.addColorStop(0.7, '#8e5530'); cg.addColorStop(1, '#5a2e16');
        g.fillStyle = cg; g.fillRect(0, 0, 256, 256); seed = 3;
        for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(250,215,160,${rr(0.08, 0.22)})`; g.lineWidth = rr(2, 6); g.beginPath(); const a0 = rr(0, TAU), rad = rr(20, 100); g.arc(128, 128, rad, a0, a0 + rr(0.4, 1.4)); g.stroke(); }
      } else if (kind === 'foam') {
        g.fillStyle = foam; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.fill();
        g.fillStyle = 'rgba(160,110,70,.18)'; seed = 9; for (let i = 0; i < 50; i++) { g.beginPath(); g.arc(rr(30, 226), rr(30, 226), rr(2, 6), 0, TAU); g.fill(); }
      }
    });
  },
  dust(color, n = 900) {
    return ctex('dust' + color + n, 256, 256, (g) => {
      seed = hash(color);
      for (let i = 0; i < n; i++) { const a = rr(0, TAU), d = Math.sqrt(rnd()) * 120; g.fillStyle = color; g.globalAlpha = rr(0.4, 0.95); g.beginPath(); g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, rr(0.8, 2.2), 0, TAU); g.fill(); }
    });
  },
  spiral(a, b) {
    return ctex('spir' + a + b, 128, 128, (g) => {
      g.fillStyle = a; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
      g.strokeStyle = b; g.lineWidth = 9; g.beginPath(); for (let t = 0; t < 14; t += 0.08) { const r = 4 + t * 4.2; g.lineTo(64 + Math.cos(t) * r, 64 + Math.sin(t) * r); } g.stroke();
    });
  },
  fish(base, line = '#fff6ee') {
    return ctex('fish' + base + line, 128, 128, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = line; g.globalAlpha = 0.65; g.lineWidth = 3;
      for (let i = -4; i < 10; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.quadraticCurveTo(i * 16 + 30, 64, i * 16, 128); g.stroke(); }
      g.globalAlpha = 1;
    });
  },
  soup(base, bits) {
    return ctex('soup' + base + bits.join(), 256, 256, (g) => {
      const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, shade(base, 0.1)); gr.addColorStop(1, shade(base, -0.15));
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); seed = hash(base);
      for (const b of bits) { const [col, kind, n] = b.split(':'); for (let i = 0; i < (+n || 14); i++) { const a = rr(0, TAU), d = rr(0, 100); g.fillStyle = col; g.beginPath(); if (kind === 'line') { g.strokeStyle = col; g.lineWidth = 4; g.moveTo(128 + Math.cos(a) * d, 128 + Math.sin(a) * d); g.lineTo(128 + Math.cos(a) * d + 14, 128 + Math.sin(a) * d + 6); g.stroke(); } else { g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, kind === 'big' ? 9 : 3, 0, TAU); g.fill(); } } }
    });
  },
  stripes(a, b, n = 6) {
    return ctex('str' + a + b + n, 64, 128, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * h / n, w, h / n); } });
  },
  seaweed() { return ctex('nori', 64, 64, (g) => { g.fillStyle = '#1f2a1c'; g.fillRect(0, 0, 64, 64); seed = 5; for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(60,90,50,.5)'; g.fillRect(rr(0, 64), rr(0, 64), rr(2, 8), 1); } }, true); },
  maki(fill) {
    return ctex('maki' + fill.join(), 128, 128, (g) => {
      g.fillStyle = '#1f2a1c'; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
      g.fillStyle = '#fbf8f0'; g.beginPath(); g.arc(64, 64, 56, 0, TAU); g.fill();
      seed = 4; for (let i = 0; i < 160; i++) { g.fillStyle = '#e9e4d6'; g.beginPath(); g.ellipse(rr(12, 116), rr(12, 116), 3, 1.6, rr(0, 3), 0, TAU); g.fill(); }
      fill.forEach((c, i) => { g.fillStyle = c; const a = i / fill.length * TAU; g.beginPath(); g.ellipse(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14, 14, 9, a, 0, TAU); g.fill(); });
    });
  },
  wood(base) {
    return ctex('wood' + base, 256, 128, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h); seed = hash(base);
      for (let i = 0; i < 40; i++) { g.strokeStyle = shade(base, rr(-0.18, 0.1)); g.globalAlpha = 0.5; g.lineWidth = rr(1, 3); g.beginPath(); const y = rr(0, h); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rr(-6, 6), w * 0.6, y + rr(-6, 6), w, y + rr(-4, 4)); g.stroke(); }
      g.globalAlpha = 1;
    }, true);
  },
  slate() {
    return ctex('slate', 256, 256, (g) => {
      g.fillStyle = '#2d2f33'; g.fillRect(0, 0, 256, 256); seed = 12;
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rr(0.01, 0.06)})`; g.fillRect(rr(0, 256), rr(0, 256), rr(1, 6), rr(1, 2)); }
    }, true);
  },
  plateRim(color) {
    return ctex('rim' + color, 256, 32, (g, w, h) => { g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, w, h); g.fillStyle = color; g.fillRect(0, 2, w, 3); for (let i = 0; i < 24; i++) { g.beginPath(); g.arc(i * w / 24 + 5, 16, 3.5, 0, TAU); g.fill(); } }, true);
  },
  seeds(base) { return ctex('seed' + base, 64, 64, (g) => { g.fillStyle = base; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = '#f6e27a'; g.beginPath(); g.ellipse(x * 8 + (y % 2) * 4 + 2, y * 8 + 4, 1.2, 1.8, 0, 0, TAU); g.fill(); } }, true); },
};
function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt * (amt > 0 ? (1 - hsl.l) : hsl.l))));
  return '#' + c.getHexString();
}

// ================= 擺盤工具組 =================
class Kit {
  constructor() { this.g = new THREE.Group(); this.y = 0; this.R = 1; }
  put(m, x = 0, y = 0, z = 0, ry = 0) { m.position.set(x, this.y + y, z); if (ry) m.rotation.y = ry; this.g.add(m); return m; }

  // ---------- 盤子 ----------
  plate(kind = 'round', o = {}) {
    const g = this.g;
    if (kind === 'round' || kind === 'rim' || kind === 'oval' || kind === 'small') {
      const r = kind === 'small' ? 0.72 : 1.0;
      const p = mesh(latheGeo([[0, 0], [r * 0.6, 0], [r * 0.63, 0.025], [r * 0.7, 0.055], [r * 0.98, 0.1], [r, 0.115], [r * 0.96, 0.12], [r * 0.7, 0.075], [r * 0.6, 0.05], [0, 0.05]], 56), o.mat || (kind === 'rim' ? fm('#ffffff', { r: 0.18, cc: 0.6, map: TX.plateRim(o.rim || '#c9a24a') }) : CER()));
      if (kind === 'oval') p.scale.set(1.35, 1, 0.92);
      g.add(p); this.y = 0.05; this.R = r * 0.62;
    } else if (kind === 'deep') {
      g.add(mesh(latheGeo([[0, 0], [0.42, 0], [0.5, 0.05], [0.56, 0.16], [0.62, 0.19], [1.04, 0.24], [1.05, 0.255], [1.0, 0.26], [0.6, 0.21], [0.52, 0.18], [0.45, 0.07], [0, 0.06]], 56), o.mat || CER()));
      this.y = 0.06; this.R = 0.48;
    } else if (kind === 'bowl') {
      const r = o.r || 0.78, hh = o.h || 0.5;
      g.add(mesh(latheGeo([[0, 0], [r * 0.45, 0], [r * 0.5, 0.03], [r * 0.85, hh * 0.45], [r, hh], [r * 0.95, hh + 0.01], [r * 0.8, hh * 0.45], [r * 0.45, 0.07], [0, 0.07]], 48), o.mat || CER()));
      this.y = hh * (o.fill ?? 0.8); this.R = r * 0.86; this.bowlTop = hh;
    } else if (kind === 'slate') {
      const s = mesh(new RoundedBoxGeometry(2.1, 0.07, 1.5, 3, 0.02), fm('#ffffff', { r: 0.7, map: TX.slate() })); s.position.y = 0.035; g.add(s);
      this.y = 0.07; this.R = 0.9;
    } else if (kind === 'board') {
      const s = mesh(new RoundedBoxGeometry(2.0, 0.1, 1.35, 3, 0.05), fm('#ffffff', { r: 0.55, map: TX.wood('#b88a5a') })); s.position.y = 0.05; g.add(s);
      const hnd = mesh(new RoundedBoxGeometry(0.5, 0.1, 0.32, 3, 0.05), fm('#ffffff', { r: 0.55, map: TX.wood('#b88a5a') })); hnd.position.set(1.18, 0.05, 0); g.add(hnd);
      this.y = 0.1; this.R = 0.85;
    } else if (kind === 'skillet') {
      g.add(mesh(latheGeo([[0, 0], [0.85, 0], [0.92, 0.04], [0.95, 0.2], [0.9, 0.2], [0.85, 0.06], [0, 0.06]], 48), fm('#25262a', { r: 0.5, metal: 0.4 })));
      const h = mesh(new RoundedBoxGeometry(0.75, 0.07, 0.16, 2, 0.03), fm('#25262a', { r: 0.5, metal: 0.4 })); h.position.set(1.25, 0.17, 0); h.rotation.z = 0.12; g.add(h);
      const bd = mesh(new RoundedBoxGeometry(2.3, 0.06, 2.0, 2, 0.03), fm('#ffffff', { r: 0.6, map: TX.wood('#8a5a34') })); bd.position.y = -0.03; g.add(bd);
      this.y = 0.06; this.R = 0.8;
    } else if (kind === 'stone') {
      const bd = mesh(new RoundedBoxGeometry(1.9, 0.08, 1.9, 2, 0.03), fm('#ffffff', { r: 0.6, map: TX.wood('#6a4428') })); bd.position.y = 0.04; g.add(bd);
      const p = mesh(latheGeo([[0, 0], [0.6, 0], [0.8, 0.12], [0.86, 0.5], [0.8, 0.52], [0.72, 0.16], [0, 0.14]], 48), fm('#1f1e1d', { r: 0.75 })); p.position.y = 0.08; g.add(p);
      this.y = 0.08 + 0.4; this.R = 0.7;
    } else if (kind === 'basket') {
      const b = mesh(latheGeo([[0, 0], [0.7, 0], [0.95, 0.3], [0.98, 0.32], [0.9, 0.32], [0.66, 0.06], [0, 0.06]], 40), fm('#c49a5a', { r: 0.85, map: TX.speck('#c49a5a', '#7a5a2a', 400) })); g.add(b);
      const paper = mesh(new THREE.CircleGeometry(0.85, 6), fm('#f6f1e4', { r: 0.9, side: 1 })); paper.rotation.x = -Math.PI / 2 + 0.05; paper.rotation.z = 0.3; paper.position.y = 0.2; g.add(paper);
      this.y = 0.12; this.R = 0.7;
    } else if (kind === 'ice') {
      g.add(mesh(latheGeo([[0, 0], [0.95, 0], [1.05, 0.16], [1.0, 0.17], [0.9, 0.05], [0, 0.05]], 48), fm('#c9cdd1', { r: 0.2, metal: 0.9 })));
      seed = 31; for (let i = 0; i < 60; i++) { const a = rr(0, TAU), d = Math.sqrt(rnd()) * 0.85; const c = mesh(new THREE.IcosahedronGeometry(rr(0.05, 0.09), 0), fm('#eef8fb', { r: 0.05, op: 0.75, cc: 1 })); c.position.set(Math.cos(a) * d, 0.1, Math.sin(a) * d); c.rotation.set(rr(0, 3), rr(0, 3), 0); g.add(c); }
      this.y = 0.13; this.R = 0.8;
    } else if (kind === 'geta') {
      const s = mesh(new RoundedBoxGeometry(2.2, 0.1, 1.0, 2, 0.02), fm('#ffffff', { r: 0.6, map: TX.wood('#d9b98a') })); s.position.y = 0.17; g.add(s);
      for (const x of [-0.75, 0.75]) { const l = mesh(new THREE.BoxGeometry(0.12, 0.13, 0.95), fm('#c9a87a', { r: 0.6 })); l.position.set(x, 0.065, 0); g.add(l); }
      this.y = 0.22; this.R = 0.9;
    } else if (kind === 'ramekin') {
      g.add(mesh(latheGeo([[0, 0], [0.62, 0], [0.66, 0.08], [0.68, 0.36], [0.62, 0.37], [0.6, 0.06], [0, 0.06]], 48), o.mat || CER()));
      this.y = 0.3; this.R = 0.58;
    } else if (kind === 'cakestand') {
      g.add(mesh(latheGeo([[0, 0], [0.45, 0], [0.42, 0.03], [0.1, 0.12], [0.08, 0.4], [0.12, 0.44], [0.95, 0.46], [0.96, 0.5], [0, 0.5]], 48), fm('#f6f2ea', { r: 0.2, cc: 0.5 })));
      this.y = 0.5; this.R = 0.8;
    } else if (kind === 'parfait') {
      const gl = mesh(latheGeo([[0, 0], [0.35, 0], [0.35, 0.03], [0.06, 0.08], [0.05, 0.35], [0.12, 0.42], [0.42, 0.75], [0.48, 1.5], [0.46, 1.5], [0.4, 0.78], [0.1, 0.45], [0, 0.44]], 40), GLASS());
      g.add(gl); this.y = 0.45; this.R = 0.4; this.glass = true;
    } else if (kind === 'cone') {
      const c = mesh(latheGeo([[0, 0], [0.28, 0.9], [0.3, 0.95], [0.26, 0.95], [0, 0.05]], 24), fm('#d9a65c', { r: 0.7, map: TX.waffle('#d9a65c') }));
      c.rotation.x = 0.0; g.add(c); this.y = 0.95; this.R = 0.26;
    } else if (kind === 'paper') {
      const p = mesh(new RoundedBoxGeometry(1.9, 0.02, 1.4, 2, 0.01), fm('#f3ead6', { r: 0.95 })); p.position.y = 0.01; p.rotation.y = 0.12; g.add(p);
      this.y = 0.02; this.R = 0.8;
    }
    return this;
  }

  // ---------- 基本食材形狀 ----------
  disc(x, z, r, h, color, o = {}) {
    if (o.map) {
      const side = fm(o.sideColor || shade(o.edge || color === '#ffffff' ? '#c98a4f' : color, -0.1), { r: 0.6 });
      const m = mesh(new THREE.CylinderGeometry(r, r * 0.98, h, 40), [side, fm('#ffffff', { r: o.r ?? 0.6, cc: o.cc || 0, map: o.map }), side]);
      return this.put(m, x, (o.y || 0) + h / 2, z, o.ry);
    }
    const e = Math.min(0.04, h * 0.4);
    const m = mesh(latheGeo([[0, 0], [r - e, 0], [r, e], [r, h - e], [r - e, h], [0, h]], 40), fm(color, o));
    return this.put(m, x, o.y || 0, z);
  }
  stack(x, z, n, r, h, color, o = {}) { const map = TX.crust(color); for (let i = 0; i < n; i++) this.disc(x + rr(-0.02, 0.02), z + rr(-0.02, 0.02), r * rr(0.96, 1.02), h, '#ffffff', { map, y: i * h * 0.92, r: 0.7, sideColor: shade(color, -0.25) }); return n * h * 0.92; }
  dome(x, z, r, h, color, o = {}) {
    const m = mesh(new THREE.SphereGeometry(r, 32, 16, 0, TAU, 0, Math.PI / 2), fm(color, o)); m.scale.y = h / r;
    if (o.bump) bumpify(m.geometry, o.bump, o.freq || 9, o.sd || 1);
    return this.put(m, x, o.y || 0, z);
  }
  ball(x, z, r, color, o = {}) {
    const geo = new THREE.SphereGeometry(r, 28, 18); if (o.bump) bumpify(geo, o.bump, o.freq || 12, o.sd || rr(0, 9));
    const m = mesh(geo, fm(color, o)); m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    return this.put(m, x, (o.y || 0) + r * (o.sy || 1) * (o.sink ?? 0.85), z, o.ry);
  }
  block(x, z, w, h, d, color, o = {}) {
    const grp = new THREE.Group();
    const layers = o.layers || [[1, color]];
    let y = 0; const tot = layers.reduce((a, l) => a + l[0], 0);
    for (const [f, c, extra] of layers) {
      const lh = h * f / tot;
      const m = mesh(new RoundedBoxGeometry(w, lh, d, 2, Math.min(o.round ?? 0.03, lh / 2.1)), fm(c, extra || { r: 0.65, map: o.map }));
      m.position.y = y + lh / 2; grp.add(m); y += lh;
    }
    if (o.top) { const t = mesh(new RoundedBoxGeometry(w * 0.98, 0.03, d * 0.98, 2, 0.014), fm(o.top, o.topO || { r: 0.4, cc: 0.4 })); t.position.y = y; grp.add(t); }
    grp.rotation.y = o.ry || 0;
    if (o.tilt) grp.rotation.z = o.tilt;
    return this.put(grp, x, o.y || 0, z);
  }
  // 蛋糕切片
  wedge(x, z, R, ang, h, layers, o = {}) {
    const grp = new THREE.Group();
    const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.absarc(0, 0, R, -ang / 2, ang / 2, false); shp.lineTo(0, 0);
    let y = 0; const tot = layers.reduce((a, l) => a + l[0], 0);
    for (const [f, c] of layers) {
      const lh = h * f / tot;
      const geo = new THREE.ExtrudeGeometry(shp, { depth: lh, bevelEnabled: false, curveSegments: 20 }); geo.rotateX(-Math.PI / 2);
      const m = mesh(geo, fm(c, { r: 0.7 })); m.position.y = y; grp.add(m); y += lh;
    }
    if (o.top) { const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 20 }); geo.rotateX(-Math.PI / 2); const m = mesh(geo, fm(o.top, { r: 0.35, cc: o.gloss ? 1 : 0.3 })); m.position.y = y; grp.add(m); y += 0.04; }
    grp.position.x = -R * 0.45;
    const outer = new THREE.Group(); outer.add(grp); outer.rotation.y = o.ry ?? 0.6;
    this.put(outer, x, 0, z);
    return { y: this.y + y, outer };
  }
  // 醬汁淋面
  sauce(x, z, r, color, o = {}) {
    const shp = new THREE.Shape(); seed = hash(color + r);
    for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, rad = r * (1 + 0.12 * Math.sin(a * 3 + 1) + rr(-0.05, 0.05)); i ? shp.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : shp.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.02, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
    const m = mesh(geo, fm(color, { r: 0.25, cc: 1, map: o.map })); m.scale.set(o.sx || 1, 1, o.sz || 1);
    return this.put(m, x, (o.y || 0) + 0.005, z, o.ry);
  }
  drizzle(pts, color, r = 0.025) { const m = mesh(tubeGeo(pts.map(p => [p[0], this.y + p[1], p[2]]), r, 60, 6), fm(color, { r: 0.25, cc: 1 })); this.g.add(m); return m; }
  zigzag(x, z, w, d, n, color, y, r = 0.02) { const pts = []; for (let i = 0; i <= n; i++) pts.push([x - w / 2 + i / n * w, y, z + (i % 2 ? d / 2 : -d / 2)]); return this.drizzle(pts, color, r); }
  // 擠花鮮奶油
  cream(x, z, r, h, color = '#fffdf6', o = {}) {
    const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([r * (1 - t) * (1 - t * 0.2) + 0.005, t * h]); }
    const geo = latheGeo(pts, 48); const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const th = Math.atan2(v.z, v.x), t = v.y / h; const k = 1 + 0.16 * Math.sin(8 * th + t * 9); p.setXYZ(i, v.x * k, v.y, v.z * k); }
    geo.computeVertexNormals();
    return this.put(mesh(geo, fm(color, { r: 0.55 })), x, o.y || 0, z);
  }
  noodles(x, z, R, color, o = {}) {
    const grp = new THREE.Group(); seed = hash(color + R); const mat = fm(color, { r: 0.45, cc: o.cc ?? 0.4 });
    const n = o.n || 34;
    for (let i = 0; i < n; i++) {
      const pts = []; let a = rr(0, TAU), d = rr(0, R * 0.8);
      for (let k = 0; k < 8; k++) { a += rr(0.3, 0.9); d = Math.min(R, Math.max(0.05, d + rr(-0.15, 0.15))); const hh = (o.h || 0.3) * (1 - (d / R) ** 2) + 0.02; pts.push([Math.cos(a) * d, hh + rr(-0.02, 0.02), Math.sin(a) * d]); }
      grp.add(mesh(tubeGeo(pts, o.thick || 0.022, 30, 5), mat));
    }
    return this.put(grp, x, o.y || 0, z);
  }
  riceMound(x, z, r, h, o = {}) { return this.dome(x, z, r, h, '#ffffff', { map: TX.rice(o.tint || '#fbf8f0'), r: 0.8, y: o.y, bump: 0.03, freq: 14 }); }
  sticks(x, z, n, len, w, color, o = {}) {
    const grp = new THREE.Group(); seed = hash(color + n); const mat = fm(color, { r: 0.6, map: TX.speck(color, shade(color, -0.3), 60) });
    for (let i = 0; i < n; i++) { const m = mesh(new RoundedBoxGeometry(w, w, len * rr(0.7, 1.1), 1, w * 0.3), mat); m.position.set(rr(-0.3, 0.3) * (o.spread || 1), rr(0.02, 0.25) * (o.hgt || 1), rr(-0.25, 0.25) * (o.spread || 1)); m.rotation.set(rr(-0.5, 0.5), rr(0, TAU), rr(-0.4, 0.4)); grp.add(m); }
    return this.put(grp, x, o.y || 0, z);
  }
  // ---------- 配料 ----------
  leaf(x, z, s, color = '#4f8a3a', o = {}) {
    const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.quadraticCurveTo(s * 0.45, s * 0.5, 0, s); shp.quadraticCurveTo(-s * 0.45, s * 0.5, 0, 0);
    const geo = new THREE.ShapeGeometry(shp, 8); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i); p.setZ(i, (px * px) * 1.6 / s + Math.sin(py / s * 3) * 0.02); }
    geo.computeVertexNormals(); geo.rotateX(-Math.PI / 2 + (o.tilt || 0.25));
    const m = mesh(geo, fm(color, { r: 0.55, side: 1, cc: 0.3 }));
    return this.put(m, x, (o.y || 0) + 0.01, z, o.ry ?? rr(0, TAU));
  }
  lettuce(x, z, s, color = '#7fb04a', o = {}) {
    const geo = new THREE.CircleGeometry(s, 24, 0, Math.PI * 1.4); const p = geo.attributes.position; seed = hash(color + s + x);
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), d = Math.hypot(px, py); const a = Math.atan2(py, px); p.setZ(i, d * d * 0.9 + Math.sin(a * 9) * 0.04 * d / s); }
    geo.computeVertexNormals(); geo.rotateX(-Math.PI / 2);
    const m = mesh(geo, fm(color, { r: 0.6, side: 1, cc: 0.2 })); m.rotation.z = rr(-0.4, 0.4);
    return this.put(m, x, (o.y || 0) + 0.02, z, rr(0, TAU));
  }
  mint(x, z, y = 0, s = 0.16) { for (let i = 0; i < 4; i++) this.leaf(x + Math.cos(i * 1.7) * 0.03, z + Math.sin(i * 1.7) * 0.03, s * (i ? 0.8 : 1), '#3f8a3a', { y, ry: i * 1.6, tilt: 0.6 }); }
  berry(x, z, kind = 'straw', y = 0, s = 1) {
    if (kind === 'straw') {
      const m = mesh(latheGeo([[0, 0], [0.06 * s, 0.01], [0.09 * s, 0.07 * s], [0.085 * s, 0.12 * s], [0.05 * s, 0.15 * s], [0, 0.155 * s]], 20), fm('#ffffff', { r: 0.3, cc: 0.8, map: TX.seeds('#d9233a') }));
      m.rotation.z = Math.PI; m.position.y = 0.15 * s; const gg = new THREE.Group(); gg.add(m);
      for (let i = 0; i < 5; i++) { const l = mesh(new THREE.ConeGeometry(0.02 * s, 0.06 * s, 4), fm('#3f7a2e', { r: 0.6 })); l.position.set(Math.cos(i * 1.26) * 0.04 * s, 0.155 * s, Math.sin(i * 1.26) * 0.04 * s); l.rotation.set(Math.sin(i * 1.26) * 1.4, 0, -Math.cos(i * 1.26) * 1.4); gg.add(l); }
      gg.rotation.set(rr(-0.3, 0.3), rr(0, 3), rr(1.0, 1.4)); return this.put(gg, x, y + 0.06 * s, z);
    }
    if (kind === 'blue') return this.ball(x, z, 0.05 * s, '#2f3a6a', { r: 0.4, y, sink: 0.9 });
    if (kind === 'rasp') return this.ball(x, z, 0.06 * s, '#c9304a', { r: 0.6, bump: 0.12, freq: 60, y });
    if (kind === 'cherry') { this.ball(x, z, 0.07 * s, '#9a1428', { r: 0.2, cc: 1, y }); return this.drizzle([[x, y + 0.13 * s, z], [x + 0.03, y + 0.2 * s, z], [x + 0.08, y + 0.26 * s, z]], '#4a6a2a', 0.008); }
    if (kind === 'tomato') { this.ball(x, z, 0.08 * s, '#d9302a', { r: 0.25, cc: 1, y }); return this.put(mesh(new THREE.ConeGeometry(0.03, 0.02, 5), fm('#3f7a2e')), x, y + 0.155 * s, z); }
    if (kind === 'grape') return this.ball(x, z, 0.06 * s, '#5a3a6a', { r: 0.3, cc: 0.6, y });
    if (kind === 'kiwi') { const m = mesh(new THREE.CylinderGeometry(0.11 * s, 0.11 * s, 0.03, 24), fm('#ffffff', { r: 0.5, map: TX.citrus('#7ab03a', '#6a5a2a', 'kiwi') })); m.rotation.x = 0.3; return this.put(m, x, y + 0.06, z); }
  }
  slice(x, z, kind, o = {}) {
    const map = kind === 'lemon' ? TX.citrus('#f2d64a', '#e9c23a') : kind === 'orange' ? TX.citrus('#f39a2e', '#e98a1e') : kind === 'lime' ? TX.citrus('#a9c94a', '#5a8a2a') : TX.cucumber();
    const r = o.r || 0.14;
    const m = mesh(new THREE.CylinderGeometry(r, r, 0.025, 28), [fm(kind === 'cucumber' ? '#3f6b35' : kind === 'orange' ? '#e98a1e' : '#e9c23a', { r: 0.5 }), fm('#ffffff', { r: 0.4, cc: 0.6, map }), fm('#ffffff', { r: 0.4, map })]);
    m.rotation.set(o.rx ?? 0, 0, o.rz ?? 0);
    return this.put(m, x, (o.y || 0) + 0.015, z, o.ry);
  }
  egg(x, z, s = 1, o = {}) {
    const shp = new THREE.Shape(); seed = hash('egg' + x);
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, r = 0.24 * s * (1 + 0.15 * Math.sin(a * 3 + 2) + rr(-0.04, 0.04)); i ? shp.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shp.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 3 }); geo.rotateX(-Math.PI / 2);
    this.put(mesh(geo, fm('#fbfaf5', { r: 0.35, cc: 0.4 })), x, (o.y || 0) + 0.01, z);
    return this.dome(x + 0.03 * s, z, 0.09 * s, 0.07 * s, '#f2a51a', { r: 0.2, cc: 1, y: (o.y || 0) + 0.05 });
  }
  herbs(x, z, R, n, color = '#3f7a2e', y = 0.02) {
    const grp = new THREE.Group(); seed = hash(color + R + n + x); const mat = fm(color, { r: 0.6 });
    for (let i = 0; i < n; i++) { const a = rr(0, TAU), d = Math.sqrt(rnd()) * R; const m = mesh(new THREE.BoxGeometry(rr(0.02, 0.04), 0.008, rr(0.015, 0.03)), mat); m.position.set(Math.cos(a) * d, rr(0, 0.01), Math.sin(a) * d); m.rotation.y = rr(0, 3); grp.add(m); }
    return this.put(grp, x, y, z);
  }
  dust(x, z, R, color = '#ffffff', y = 0.01) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2), new THREE.MeshStandardMaterial({ map: TX.dust(color), transparent: true, depthWrite: false, roughness: 0.9 }));
    m.rotation.x = -Math.PI / 2; return this.put(m, x, y, z);
  }
  broccoli(x, z, s = 1, y = 0) {
    const grp = new THREE.Group(); const st = mesh(new THREE.CylinderGeometry(0.03 * s, 0.045 * s, 0.14 * s, 8), fm('#8fbf5a')); st.position.y = 0.07 * s; grp.add(st);
    seed = hash('b' + x + z); for (let i = 0; i < 6; i++) { const b = mesh(bumpify(new THREE.SphereGeometry(0.06 * s, 12, 8), 0.12, 70, i), fm('#3f7a2e', { r: 0.8 })); b.position.set(rr(-0.05, 0.05) * s, 0.16 * s + rr(0, 0.04) * s, rr(-0.05, 0.05) * s); grp.add(b); }
    grp.rotation.z = rr(-0.8, -0.4); return this.put(grp, x, y + 0.04, z, rr(0, TAU));
  }
  shrimp(x, z, s = 1, o = {}) {
    const grp = new THREE.Group(); const mat = fm('#ffffff', { r: 0.4, cc: 0.5, map: TX.stripes('#f08a5a', '#f8c8a8', 8) });
    const body = mesh(new THREE.TorusGeometry(0.12 * s, 0.05 * s, 10, 20, Math.PI * 1.2), mat); body.rotation.x = -Math.PI / 2; grp.add(body);
    const tail = mesh(new THREE.ConeGeometry(0.05 * s, 0.1 * s, 6), fm('#d9502e', { r: 0.4 })); tail.position.set(0.12 * s * Math.cos(Math.PI * 1.2), 0, -0.12 * s * Math.sin(Math.PI * 1.2)); tail.rotation.z = Math.PI / 2; grp.add(tail);
    return this.put(grp, x, (o.y || 0) + 0.05 * s, z, o.ry ?? rr(0, TAU));
  }
  croissant(x, z, s = 1, o = {}) {
    const grp = new THREE.Group(); const mat = fm('#ffffff', { r: 0.45, cc: 0.4, map: TX.crust(o.color || '#d79a4f') });
    for (let i = -3; i <= 3; i++) { const t = i / 3, r = 0.13 * s * (1 - Math.abs(t) * 0.55); const m = mesh(new THREE.SphereGeometry(r, 18, 12), mat); m.scale.set(0.8, 0.75, 1); m.position.set(Math.sin(t * 1.2) * 0.32 * s, r * 0.7, -Math.cos(t * 1.2) * 0.18 * s + 0.12 * s); m.rotation.y = t * 1.2; grp.add(m); }
    return this.put(grp, x, o.y || 0, z, o.ry || 0);
  }
  steak(x, z, w, d, color, o = {}) {
    const m = mesh(new RoundedBoxGeometry(w, o.h || 0.14, d, 3, 0.05), [fm(shade(color, -0.2), { r: 0.6 }), fm(shade(color, -0.2), { r: 0.6 }), fm('#ffffff', { r: 0.45, cc: 0.5, map: TX.grill(color) }), fm(shade(color, -0.3)), fm(shade(color, -0.2)), fm(shade(color, -0.2))]);
    return this.put(m, x, (o.h || 0.14) / 2 + (o.y || 0), z, o.ry);
  }
  fillet(x, z, w, d, color, o = {}) {
    const m = mesh(new RoundedBoxGeometry(w, o.h || 0.1, d, 3, 0.04), fm('#ffffff', { r: 0.4, cc: 0.6, map: TX.fish(color, o.line) }));
    return this.put(m, x, (o.h || 0.1) / 2 + (o.y || 0), z, o.ry);
  }
  nigiri(x, z, fish, o = {}) {
    const grp = new THREE.Group();
    const rice = mesh(new RoundedBoxGeometry(0.26, 0.11, 0.14, 3, 0.05), fm('#ffffff', { r: 0.85, map: TX.rice() })); rice.position.y = 0.055; grp.add(rice);
    const f = mesh(new RoundedBoxGeometry(0.32, 0.04, 0.17, 3, 0.018), fm('#ffffff', { r: 0.3, cc: 0.8, map: TX.fish(fish, o.line || '#ffffff') })); f.position.y = 0.125; f.rotation.z = 0.05; grp.add(f);
    if (o.nori) { const b = mesh(new THREE.BoxGeometry(0.06, 0.13, 0.15), fm('#1f2a1c')); b.position.y = 0.07; grp.add(b); }
    return this.put(grp, x, 0, z, o.ry || 0);
  }
  maki(x, z, fill, o = {}) {
    const m = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 24), [fm('#ffffff', { r: 0.6, map: TX.seaweed() }), fm('#ffffff', { r: 0.7, map: TX.maki(fill) }), fm('#ffffff', { r: 0.7, map: TX.maki(fill) })]);
    return this.put(m, x, 0.06, z, o.ry);
  }
  // ---------- 飲品杯 ----------
}

// ================= 飲品 =================
function drinkLayers(r) {
  const liq = [];
  for (const [i, c] of r.steps) {
    const ing = D.INGS[i]; if (!ing) continue;
    if (['ice', 'blend', 'cinnamon', 'mint', 'lemon'].includes(i)) continue;
    if (ing.kind === 'top' || i === 'foam' || i === 'cream') continue;
    let col = ing.color;
    if (i === 'pour') col = '#4a2414'; if (i === 'water') col = '#5a2e18';
    liq.push([col, c]);
  }
  return liq;
}
function mixColor(liq) {
  const c = new THREE.Color(0, 0, 0); let t = 0;
  for (const [col, n0] of liq) { const k = new THREE.Color(col); const l = k.r * 0.3 + k.g * 0.59 + k.b * 0.11; const n = n0 * (l < 0.25 ? 2.8 : 1); c.r += k.r * n; c.g += k.g * n; c.b += k.b * n; t += n; }
  if (!t) return '#3b2116'; c.r /= t; c.g /= t; c.b /= t; return '#' + c.getHexString();
}
function buildDrink(id) {
  const r = D.RECIPES[id]; const k = new Kit(); seed = hash(id);
  const has = i => r.steps.some(s => s[0] === i);
  const liq = drinkLayers(r);
  const iced = has('ice'), foam = has('foam'), cream = has('cream'), salt = has('seasalt'), blended = has('blend');
  const milky = has('milk') || has('oat') || has('coconut') || has('coldmilk');
  const g = k.g;
  const saucer = (rad = 0.62) => { g.add(mesh(latheGeo([[0, 0], [rad * 0.5, 0], [rad * 0.55, 0.02], [rad, 0.06], [rad * 0.97, 0.07], [rad * 0.55, 0.04], [0, 0.04]], 48), CER())); k.y = 0.04; };
  const spoon = (x, z, ry) => { const s = new THREE.Group(); const bowl = mesh(new THREE.SphereGeometry(0.045, 12, 8), fm('#d9dcdf', { r: 0.15, metal: 1 })); bowl.scale.set(1.4, 0.3, 1); s.add(bowl); const hnd = mesh(new THREE.BoxGeometry(0.32, 0.01, 0.025), fm('#d9dcdf', { r: 0.15, metal: 1 })); hnd.position.x = 0.21; s.add(hnd); k.put(s, x, 0.02, z, ry); };
  const topDisc = (rad, y, color, art) => { const m = mesh(new THREE.CircleGeometry(rad, 40), fm('#ffffff', { r: 0.35, cc: 0.4, map: TX.latte(color, '#fbf6ec', art) })); m.rotation.x = -Math.PI / 2; m.rotation.z = rr(-0.3, 0.3); m.position.y = y; g.add(m); return m; };
  const handle = (x, y, rad, mat) => { const hnd = mesh(new THREE.TorusGeometry(rad, rad * 0.28, 10, 20, Math.PI * 1.2), mat); hnd.position.set(x, y, 0); hnd.rotation.z = -Math.PI * 0.6; g.add(hnd); };
  const mixed = mixColor(liq);
  const art = foam || milky ? ['heart', 'tulip', 'rosetta', 'swirl'][hash(id) % 4] : 'crema';
  let topY = 0, topR = 0.3, glassy = false;
  const cupT = r.cup;
  if (cupT === 'demi' || cupT === 'cup' || cupT === 'teacup') {
    const R = cupT === 'demi' ? 0.3 : cupT === 'teacup' ? 0.48 : 0.42, H = cupT === 'demi' ? 0.36 : cupT === 'teacup' ? 0.3 : 0.44;
    saucer(cupT === 'demi' ? 0.52 : 0.72);
    const mat = cupT === 'teacup' ? fm('#ffffff', { r: 0.18, cc: 0.6, map: TX.plateRim('#c9a24a') }) : CER();
    const cup = mesh(latheGeo([[0, 0], [R * 0.45, 0], [R * 0.5, 0.03], [R * 0.85, H * 0.4], [R, H], [R * 0.95, H + 0.005], [R * 0.82, H * 0.45], [R * 0.45, 0.06], [0, 0.06]], 48), mat);
    cup.position.y = k.y; g.add(cup); handle(R * 1.02, k.y + H * 0.55, H * 0.25, mat);
    topY = k.y + H * 0.88; topR = R * 0.93;
    const isTea = has('blacktea') && !milky;
    const tcol = r.id === 'pourover' || id === 'pourover' || id === 'geisha_pour' ? '#3a1a0e' : isTea ? '#9a4a1a' : mixed;
    if (cream) { topDisc(topR, topY, tcol, 'crema'); k.y = topY; k.cream(0, 0, topR * 0.8, 0.22); }
    else {
      const foamN = (r.steps.find(st => st[0] === 'foam') || [0, 0])[1];
      const kind = isTea || id.includes('pour') ? 'none' : foamN >= 2 ? 'foam' : (foam || milky) ? art : 'crema';
      topDisc(topR, topY, kind === 'none' ? tcol : (foam || milky) ? '#8a5532' : tcol, kind);
      if (foamN >= 2 && !has('cinnamon')) k.y = topY, k.dust(0, 0, topR * 0.45, '#6a3a1e', 0.006), k.y = 0.04;
    }
    k.y = 0.04; spoon(0.1, cupT === 'demi' ? 0.36 : 0.5, -0.3);
    if (r.gar === 'lemon') k.slice(-0.45, 0.35, 'lemon', { y: 0.03, r: 0.12 });
    if (has('cinnamon')) { const c = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 10), fm('#8a4a2a', { r: 0.8 })); c.rotation.z = Math.PI / 2; c.rotation.y = 0.5; k.put(c, -0.25, 0.05, 0.45); }
  } else if (cupT === 'mug') {
    const coaster = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 40), fm('#ffffff', { r: 0.6, map: TX.wood('#a8784a') })); coaster.position.y = 0.02; g.add(coaster); k.y = 0.04;
    const R = 0.42, H = 0.7, mat = fm(['#2f5446', '#f4efe6', '#c9826a', '#25324a'][hash(id) % 4], { r: 0.35, cc: 0.5 });
    const mugM = mesh(latheGeo([[0, 0], [R, 0], [R * 1.02, H], [R * 0.94, H], [R * 0.92, 0.06], [0, 0.06]], 40), mat); mugM.position.y = k.y; g.add(mugM);
    handle(R * 1.05, k.y + H * 0.5, 0.15, mat);
    topY = k.y + H * 0.9; topR = R * 0.93;
    topDisc(topR, topY, milky && !cream ? '#8a5532' : mixed, cream ? 'crema' : milky ? art : 'crema');
    if (cream) { k.y = topY; k.cream(0, 0, topR * 0.85, 0.3); topY += 0.3; }
  } else {
    // 玻璃杯類
    glassy = true;
    const spec = { glass: [0.3, 0.27, 0.78], tall: [0.34, 0.3, 1.15], frappe: [0.4, 0.3, 1.05], rocks: [0.38, 0.36, 0.52], goblet: [0.42, 0.18, 0.62] }[cupT] || [0.3, 0.27, 0.8];
    let [R1, R0, H] = spec; let base = 0;
    if (cupT === 'goblet') { g.add(mesh(latheGeo([[0, 0], [0.32, 0], [0.3, 0.02], [0.05, 0.05], [0.04, 0.42], [0.1, 0.46], [0, 0.46]], 32), GLASS())); base = 0.46; }
    if (cupT === 'glass') { saucer(0.55); base = k.y; }
    const shell = mesh(latheGeo(cupT === 'goblet' ? [[0, 0], [R0, 0.02], [R1 * 0.95, H * 0.45], [R1, H], [R1 - 0.015, H], [R1 * 0.93, H * 0.45], [R0 - 0.02, 0.04], [0, 0.04]] : [[0, 0], [R0, 0], [R1, H], [R1 - 0.015, H], [R0 - 0.02, 0.05], [0, 0.05]], 48), GLASS());
    shell.position.y = base; shell.renderOrder = 3; g.add(shell);
    const inner = (y) => (R0 + (R1 - R0) * (y / H)) - 0.03;
    // 液體分層
    let fillTop = H * (blended ? 0.86 : iced ? 0.82 : 0.84);
    const tot = liq.reduce((a, l) => a + l[1], 0) || 1;
    let y = 0.05;
    const lum = c => { const k2 = new THREE.Color(c); return k2.r * 0.3 + k2.g * 0.59 + k2.b * 0.11; };
    // 冰飲分層（淺色沉底、濃縮浮在上面）；熱飲調勻成一個顏色
    const cold = iced || r.tags.includes('iced');
    const milkLiq = liq.filter(([c]) => lum(c) > 0.8);
    const layers = blended ? [[mixColor(liq.concat([['#f4efe6', 2]])), 1]]
      : cold ? liq.slice().sort((a2, b2) => lum(b2[0]) - lum(a2[0]))
      : milkLiq.length && milkLiq.length < liq.length ? [[milkLiq[0][0], 1.1], [shade(mixColor(liq), -0.08), 1]] : [[mixColor(liq), 1]];
    const tot2 = layers.reduce((a2, l) => a2 + l[1], 0) || 1;
    // 牛奶在下、濃縮在上（拿鐵類），反過來的照配方順序
    for (const [col, n] of layers) {
      const lh = (fillTop - 0.05) * n / tot2;
      const m = mesh(latheGeo([[0, 0], [inner(y), 0], [inner(y + lh), lh], [0, lh]], 40), fm(col, { r: 0.5, op: col === '#e9f5f7' ? 0.35 : 1 }));
      m.position.y = base + y; m.renderOrder = 1; g.add(m); y += lh;
    }
    topY = base + fillTop; topR = inner(fillTop);
    if (salt || (foam && !cream)) { const fh = 0.12; const m = mesh(latheGeo([[0, 0], [topR, 0], [inner(fillTop + fh), fh], [0, fh + 0.01]], 40), fm('#fbf8f0', { r: 0.7 })); m.position.y = topY; g.add(m); topY += fh; topR = inner(fillTop + fh); if (!salt) topDisc(topR * 0.98, topY + 0.012, '#8a5532', milky ? art : 'foam'); }
    if (!cold && milky && !foam && !cream && !salt && !blended) topDisc(topR * 0.98, topY + 0.004, '#8a5532', art);
    if (iced) { seed = hash(id + 'ice'); for (let i = 0; i < 5; i++) { const c = mesh(new RoundedBoxGeometry(0.16, 0.16, 0.16, 2, 0.03), fm('#eef8fb', { r: 0.05, op: 0.55, cc: 1 })); const a = rr(0, TAU), d = rr(0, topR * 0.55); c.position.set(Math.cos(a) * d, topY - 0.04 + rr(-0.03, 0.04), Math.sin(a) * d); c.rotation.set(rr(0, 1), rr(0, 1), rr(0, 1)); c.renderOrder = 2; g.add(c); } }
    if (has('soda')) { seed = 8; for (let i = 0; i < 14; i++) { const b = mesh(new THREE.SphereGeometry(0.015, 8, 6), fm('#ffffff', { r: 0.05, op: 0.6 })); b.position.set(rr(-topR, topR) * 0.6, base + rr(0.1, fillTop), rr(-topR, topR) * 0.6); g.add(b); } }
    k.y = topY;
    if (cream || cupT === 'frappe') { k.cream(0, 0, topR * 0.95, cupT === 'frappe' ? 0.42 : 0.28); topY += cupT === 'frappe' ? 0.42 : 0.28; }
  }
  // 頂部裝飾
  k.y = topY;
  if (has('caramel') && (cream || cupT === 'frappe')) k.zigzag(0, 0, topR * 1.2, topR * 0.8, 5, '#c47a2c', -0.04, 0.018);
  else if (has('caramel') && !glassy) k.zigzag(0, 0, topR * 1.1, topR * 0.8, 6, '#c47a2c', 0.01, 0.014);
  if (r.gar === 'cocoa' || (has('choco') && cream)) k.dust(0, 0, topR * 0.9, '#5a2e1a', cream ? -0.02 : 0.012);
  if (r.gar === 'matcha') k.dust(0, 0, topR * 0.9, '#7fa24a', -0.02);
  if (has('cinnamon') && glassy) k.dust(0, 0, topR * 0.7, '#8a4a2a', 0.015);
  if (r.gar === 'rose') { for (let i = 0; i < 5; i++) k.leaf(rr(-0.1, 0.1), rr(-0.1, 0.1), 0.08, '#e06a8a', { y: cream ? -0.05 : 0.01, tilt: 0.1 }); }
  if (r.gar === 'mint') k.mint(0.05, -0.05, 0.0, 0.15);
  if (r.gar === 'strawberry') k.berry(0.12, 0.05, 'straw', cream || cupT === 'frappe' ? -0.12 : -0.02, 1.2);
  if (r.gar === 'mango') { for (let i = 0; i < 3; i++) k.put(mesh(new RoundedBoxGeometry(0.1, 0.08, 0.1, 2, 0.02), fm('#f4b23a', { r: 0.3, cc: 0.8 })), rr(-0.1, 0.1), -0.06, rr(-0.1, 0.1), rr(0, 3)); }
  if ((r.gar === 'lemon' || r.gar === 'orange') && glassy) { const sl = k.slice(topR * 0.95, 0, r.gar, { y: -0.12, rx: Math.PI / 2, r: 0.16 }); sl.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 0.2); }
  if (glassy && (cupT === 'tall' || cupT === 'frappe' || cupT === 'goblet')) {
    const st = mesh(new THREE.CylinderGeometry(cupT === 'frappe' ? 0.04 : 0.025, cupT === 'frappe' ? 0.04 : 0.025, 1.0, 12), fm(['#2f5446', '#e9e2d6', '#c9826a'][hash(id) % 3], { r: 0.5 }));
    st.position.set(0.08, topY + 0.1, -0.05); st.rotation.z = -0.28; st.rotation.x = 0.12; g.add(st);
  }
  return k.g;
}

// ================= 甜點與料理 =================
// 每一道的擺盤：k 是工具組，盤子先放，食物再放在盤子上（k.y 是盤面高度）
const C = { bread: '#d9a35a', cream: '#fffaf0', choco: '#4a2618', custard: '#f2d36b', sponge: '#f2dca6', berry: '#c9203a' };
const FOOD = {
  // ---------- 點心 ----------
  toast: k => { k.plate('rim', { rim: '#7fa2b8' }); k.block(0, 0, 0.9, 0.42, 0.9, '#ffffff', { map: TX.crust('#e0b46a'), round: 0.08, ry: 0.4 }); k.y += 0.43; k.block(0, 0, 0.26, 0.08, 0.2, '#fff1b0', { round: 0.03, ry: 0.6, layers: [[1, '#fff1b0', { r: 0.3, cc: 0.6 }]] }); k.drizzle([[-0.25, 0.01, -0.1], [-0.05, 0.02, 0.05], [0.2, 0.01, 0.15]], '#e8a63a', 0.02); },
  croissant: k => { k.plate('round'); k.croissant(-0.15, -0.05, 1.7, { ry: 0.3 }); k.croissant(0.35, 0.35, 1.25, { ry: -0.6 }); },
  pain_choc: k => { k.plate('board'); for (const [x, z] of [[-0.3, -0.1], [0.35, 0.15]]) { k.block(x, z, 0.6, 0.22, 0.36, '#ffffff', { map: TX.crust('#c98a4f'), round: 0.1, ry: 0.3 }); } k.y += 0.22; k.zigzag(-0.3, -0.1, 0.4, 0.2, 5, C.choco, 0.01, 0.018); },
  bagel: k => { k.plate('round'); const t = mesh(new THREE.TorusGeometry(0.3, 0.14, 18, 32), fm('#ffffff', { r: 0.5, cc: 0.3, map: TX.crust('#c98a4f') })); t.rotation.x = -Math.PI / 2; t.scale.z = 0.7; k.put(t, 0, 0.1, 0); k.put(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32), fm('#f8f4ea', { r: 0.6 })), 0, 0.2, 0); const t2 = t.clone(); k.put(t2, 0.05, 0.3, 0.03); k.herbs(0.05, 0.03, 0.35, 40, '#2a2a2a', 0.38); },
  scone: k => { k.plate('rim', { rim: '#c9826a' }); k.dome(-0.25, 0, 0.3, 0.32, '#ffffff', { map: TX.crust('#d9b07a'), bump: 0.06, freq: 8 }); k.dome(0.3, 0.2, 0.27, 0.3, '#ffffff', { map: TX.crust('#d9b07a'), bump: 0.06, freq: 8, sd: 3 }); k.sauce(0.25, -0.35, 0.14, '#b3233a'); k.dome(-0.05, 0.4, 0.13, 0.08, '#fffdf2', { r: 0.6 }); },
  madeleine: k => { k.plate('slate'); for (let i = 0; i < 4; i++) { const m = mesh(new THREE.SphereGeometry(0.22, 20, 12, 0, TAU, 0, Math.PI / 2), fm('#ffffff', { r: 0.5, map: TX.crust('#e3b45c') })); m.scale.set(1.3, 0.45, 0.9); k.put(m, -0.5 + i * 0.34, 0, (i % 2) * 0.25 - 0.1, i * 0.4); } k.dust(0, 0, 0.7, '#ffffff', 0.12); },
  muffin: k => { k.plate('round'); for (const [x, z, s] of [[-0.25, 0, 1], [0.3, 0.2, 0.85]]) { k.put(mesh(latheGeo([[0, 0], [0.18 * s, 0], [0.24 * s, 0.26 * s], [0, 0.26 * s]], 24), fm('#ffffff', { r: 0.8, map: TX.stripes('#f4efe6', '#e3d6c3', 12) })), x, 0, z); k.dome(x, z, 0.28 * s, 0.24 * s, '#ffffff', { map: TX.crust('#d9a65c'), bump: 0.07, y: 0.26 * s }); for (let i = 0; i < 5; i++) k.berry(x + rr(-0.15, 0.15) * s, z + rr(-0.15, 0.15) * s, 'blue', 0.36 * s, 0.7); } },
  cinnamon_roll: k => { k.plate('round'); const m = mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.28, 32), [fm('#ffffff', { r: 0.6, map: TX.crust('#c98a4f') }), fm('#ffffff', { r: 0.5, map: TX.spiral('#d9a35a', '#8a4a22') }), fm('#d9a35a')]); k.put(m, 0, 0.14, 0); k.y += 0.28; k.zigzag(0, 0, 0.6, 0.5, 6, '#fffaf0', 0.01, 0.025); },
  brownie: k => { k.plate('paper'); for (const [x, z, ry] of [[-0.3, 0, 0.3], [0.32, 0.18, -0.4]]) k.block(x, z, 0.5, 0.26, 0.5, '#4a2a1c', { ry, top: '#3a1e12', round: 0.04 }); k.y += 0.27; k.herbs(-0.3, 0, 0.18, 14, '#e9d6b0', 0.02); },
  cookie: k => { k.plate('board'); for (const [x, z] of [[-0.4, -0.1], [0.05, 0.15], [0.45, -0.15]]) { k.disc(x, z, 0.3, 0.08, '#ffffff', { map: TX.speck('#d9a65c', '#4a2618', 70, 'ck'), r: 0.7 }); } k.disc(0.1, -0.3, 0.3, 0.08, '#ffffff', { map: TX.speck('#d9a65c', '#4a2618', 70, 'ck'), r: 0.7, y: 0.06 }); },
  pudding: k => { k.plate('small'); k.put(mesh(latheGeo([[0, 0], [0.42, 0], [0.32, 0.4], [0, 0.4]], 40), fm('#f2d36b', { r: 0.25, cc: 0.9 })), 0, 0, 0); k.put(mesh(latheGeo([[0, 0], [0.33, 0], [0.31, 0.06], [0, 0.07]], 40), fm('#8a3a12', { r: 0.15, cc: 1 })), 0, 0.37, 0); k.sauce(0, 0, 0.5, '#9a4a18'); k.cream(0.2, 0.25, 0.08, 0.1, '#fffdf6', { y: 0.4 }); k.berry(0.18, 0.22, 'cherry', 0.4, 0.8); },
  panna_cotta: k => { k.plate('rim', { rim: '#7fa2b8' }); k.put(mesh(latheGeo([[0, 0], [0.4, 0], [0.38, 0.12], [0.3, 0.32], [0, 0.34]], 40), fm('#fbf6ec', { r: 0.25, cc: 0.8 })), 0, 0, 0); k.sauce(0, 0, 0.3, '#b3233a', { y: 0.33 }); for (let i = 0; i < 4; i++) k.berry(Math.cos(i * 1.6) * 0.15, Math.sin(i * 1.6) * 0.15, i % 2 ? 'blue' : 'rasp', 0.34); k.mint(-0.05, 0.05, 0.4, 0.1); },
  tiramisu: k => { k.plate('round'); k.block(0, 0, 0.75, 0.5, 0.6, '#f2e2c4', { ry: 0.5, layers: [[1, '#7a4a2e'], [1.4, '#f2e2c4'], [1, '#7a4a2e'], [1.6, '#f2e2c4']] }); k.y += 0.5; k.dust(0, 0, 0.42, '#4a2618', 0.002); k.leaf(0.3, 0.3, 0.12, '#3f8a3a', { y: -0.5 }); },
  cheesecake: k => { k.plate('rim', { rim: '#c9a24a' }); const w = k.wedge(0, 0, 0.75, 0.75, 0.42, [[1, '#c9915a'], [4, '#f6e6bc']], { top: '#b3233a', gloss: 1 }); k.y = w.y - k.y + k.y; k.y = w.y; k.berry(0.05, 0, 'straw', 0, 0.9); k.y = 0.05; k.sauce(0.45, 0.45, 0.12, '#b3233a'); },
  vanilla_gelato: k => { k.plate('bowl', { r: 0.62, h: 0.32, fill: 0.9 }); for (const [x, z, c] of [[-0.15, 0, '#f8edc8'], [0.17, 0.08, '#f8edc8'], [0, -0.18, '#fbf3d8']]) k.ball(x, z, 0.22, c, { bump: 0.08, freq: 18, sink: 0.7 }); k.y += 0.3; k.leaf(0.05, 0, 0.12, '#3f8a3a'); k.herbs(0, 0, 0.3, 30, '#2a1a12', -0.02); },
  apple_pie: k => { k.plate('round'); const w = k.wedge(0, 0, 0.8, 0.7, 0.32, [[1, '#d99a4f'], [3, '#e9c27a']], { top: '#d38a3a' }); k.y = w.y; k.cream(0.1, 0.05, 0.13, 0.16); k.y = 0.05; k.dust(-0.4, 0.4, 0.25, '#8a4a2a'); },
  pistachio_gelato: k => { k.plate('cone'); k.ball(0, 0, 0.3, '#b9cf8a', { bump: 0.08, freq: 18, sink: 0.6 }); k.y += 0.38; k.ball(0, 0, 0.26, '#a9c27a', { bump: 0.08, freq: 18, sink: 0.6 }); k.y += 0.3; k.herbs(0, 0, 0.18, 20, '#6a8a3a', 0.02); },
  croffle: k => { k.plate('rim', { rim: '#7fa2b8' }); for (const [x, z, ry] of [[-0.2, 0, 0.3], [0.25, 0.15, -0.5]]) k.block(x, z, 0.55, 0.12, 0.4, '#ffffff', { map: TX.waffle('#d99a4f'), ry, round: 0.05 }); k.y += 0.13; k.ball(0, 0.05, 0.16, '#f8edc8', { bump: 0.06, freq: 18, sink: 0.6 }); k.zigzag(0, 0, 0.7, 0.4, 6, '#c47a2c', 0.02, 0.016); },
  matcha_roll: k => { k.plate('slate'); for (const [x, z] of [[-0.32, 0], [0.32, 0.1]]) { const m = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.28, 32), [fm('#7fa24a', { r: 0.6 }), fm('#ffffff', { r: 0.6, map: TX.spiral('#a9c46a', '#fffaf0') }), fm('#ffffff', { map: TX.spiral('#a9c46a', '#fffaf0') })]); m.rotation.x = Math.PI / 2; m.rotation.z = 0.5; k.put(m, x, 0.3, z); } k.dust(0, -0.3, 0.3, '#7fa24a', 0.01); },
  parfait: k => { k.plate('parfait'); let y = 0.45; for (const [h, c] of [[0.15, '#c9304a'], [0.18, '#fffaf0'], [0.12, '#e8a0b0'], [0.2, '#f6e6c8'], [0.16, '#c9304a']]) { const m = mesh(new THREE.CylinderGeometry(0.1 + (y - 0.45) * 0.42 + h * 0.3, 0.1 + (y - 0.45) * 0.42, h, 28), fm(c, { r: 0.5 })); m.position.y = y + h / 2; k.g.add(m); y += h; } k.y = y; k.cream(0, 0, 0.35, 0.3); for (let i = 0; i < 3; i++) k.berry(Math.cos(i * 2) * 0.2, Math.sin(i * 2) * 0.2, i ? 'blue' : 'straw', 0.1); k.put(mesh(new THREE.BoxGeometry(0.06, 0.4, 0.14), fm('#d9a65c', { map: TX.waffle('#d9a65c') })), -0.15, 0.25, 0.05).rotation.z = 0.3; },
  canele: k => { k.plate('round'); for (const [x, z] of [[-0.28, 0], [0.28, 0.12], [0.02, -0.3]]) { const geo = latheGeo([[0, 0], [0.2, 0], [0.22, 0.05], [0.18, 0.34], [0.12, 0.36], [0.07, 0.3], [0, 0.31]], 32); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const kk = 1 + 0.09 * Math.cos(a * 10); p.setX(i, p.getX(i) * kk); p.setZ(i, p.getZ(i) * kk); } geo.computeVertexNormals(); k.put(mesh(geo, fm('#5a2610', { r: 0.3, cc: 0.9 })), x, 0, z); } },
  choco_mousse: k => { k.plate('slate'); k.put(mesh(latheGeo([[0, 0], [0.38, 0], [0.4, 0.04], [0.38, 0.34], [0.3, 0.4], [0, 0.4]], 40), fm('#4a2618', { r: 0.3, cc: 1 })), 0, 0, 0); k.y += 0.4; k.berry(0, 0, 'rasp'); k.berry(0.1, 0.06, 'rasp'); k.put(mesh(new THREE.CircleGeometry(0.06, 6), fm('#d4ad57', { metal: 1, r: 0.3, side: 1 })), -0.1, 0.02, 0).rotation.x = -1.3; k.y = 0.07; k.dust(-0.4, 0.3, 0.3, '#4a2618'); },
  affogato: k => { k.plate('small'); k.put(mesh(latheGeo([[0, 0], [0.24, 0], [0.34, 0.4], [0.32, 0.4], [0.22, 0.04], [0, 0.04]], 40), GLASS()), 0, 0, 0); k.put(mesh(latheGeo([[0, 0], [0.23, 0], [0.3, 0.22], [0, 0.22]], 40), fm('#3b2116', { r: 0.2, cc: 1 })), 0, 0.04, 0); k.y += 0.24; k.ball(0, 0, 0.22, '#f8edc8', { bump: 0.07, freq: 18, sink: 0.5 }); k.y = 0.05; k.zigzag(0, 0, 0.2, 0.16, 4, '#5a2e1a', 0.42, 0.014); k.disc(0.5, 0.15, 0.14, 0.03, '#d9a65c'); },
  waffle: k => { k.plate('round'); k.block(0, 0, 0.95, 0.14, 0.95, '#ffffff', { map: TX.waffle('#d9a65c'), ry: 0.4, round: 0.05 }); k.y += 0.15; k.ball(0.1, 0, 0.18, '#f8edc8', { bump: 0.06, freq: 18, sink: 0.6 }); for (let i = 0; i < 4; i++) k.berry(-0.25 + i * 0.12, 0.25, i % 2 ? 'blue' : 'straw', 0, 0.8); k.zigzag(0, 0, 0.8, 0.6, 7, '#8a3a12', 0.02, 0.016); },
  honey_toast: k => { k.plate('round'); k.block(0, 0, 0.62, 0.6, 0.62, '#ffffff', { map: TX.crust('#e0a64a'), ry: 0.4, round: 0.06, top: '#e8a63a' }); k.y += 0.64; k.ball(0, 0, 0.2, '#f8edc8', { bump: 0.06, freq: 18, sink: 0.55 }); k.mint(0.05, 0.05, 0.18, 0.1); k.y = 0.05; k.sauce(0.4, 0.3, 0.2, '#e8a63a'); },
  souffle_pancake: k => { k.plate('rim', { rim: '#c9826a' }); for (let i = 0; i < 3; i++) k.disc(-0.05 + i * 0.03, -0.05 + i * 0.05, 0.36, 0.24, '#ffffff', { map: TX.crust('#f2d9a0'), y: i * 0.2, r: 0.6 }); k.y += 0.65; k.cream(0, 0.02, 0.12, 0.14); k.y -= 0.0; k.dust(0, 0, 0.4, '#ffffff', 0.0); k.y = 0.05; k.sauce(0.45, 0.3, 0.18, '#e8a63a'); k.berry(-0.5, 0.2, 'straw'); },
  fruit_tart: k => { k.plate('round'); k.put(mesh(latheGeo([[0, 0], [0.55, 0], [0.62, 0.05], [0.62, 0.18], [0.56, 0.2], [0.54, 0.12], [0, 0.12]], 48), fm('#ffffff', { r: 0.6, map: TX.crust('#d9a65c') })), 0, 0, 0); k.disc(0, 0, 0.54, 0.05, '#f2d36b', { y: 0.12, r: 0.3, cc: 0.6 }); k.y += 0.17; seed = 4; for (let i = 0; i < 6; i++) k.berry(Math.cos(i * 1.05) * 0.38, Math.sin(i * 1.05) * 0.38, 'straw', 0, 0.9); for (let i = 0; i < 4; i++) k.berry(Math.cos(i * 1.6) * 0.18, Math.sin(i * 1.6) * 0.18, 'kiwi'); for (let i = 0; i < 6; i++) k.berry(rr(-0.15, 0.15), rr(-0.15, 0.15), 'blue'); },
  crepe_choc: k => { k.plate('round'); const q = new THREE.Shape(); q.moveTo(0, 0); q.absarc(0, 0, 0.55, 0, Math.PI / 2, false); q.lineTo(0, 0); for (const [x, z, ry, y] of [[-0.3, 0.1, 0.4, 0], [-0.15, -0.1, 0.9, 0.06]]) { const geo = new THREE.ExtrudeGeometry(q, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 3, curveSegments: 18 }); geo.rotateX(-Math.PI / 2); k.put(mesh(geo, fm('#ffffff', { r: 0.55, map: TX.crust('#e9c27a') })), x, y + 0.03, z, ry); } for (let i = 0; i < 5; i++) k.disc(0.32 + (i % 2) * 0.12, -0.25 + i * 0.12, 0.09, 0.04, '#f6ecc0', { y: 0.02, r: 0.4 }); k.cream(0.35, 0.3, 0.13, 0.18); k.zigzag(-0.05, 0, 0.7, 0.4, 7, C.choco, 0.13, 0.016); k.dust(-0.1, 0, 0.4, '#ffffff', 0.14); },
  mille_crepe: k => { k.plate('rim', { rim: '#c9a24a' }); const L = []; for (let i = 0; i < 14; i++) L.push([1, i % 2 ? '#fffaf0' : '#e9c27a']); const w = k.wedge(0, 0, 0.8, 0.7, 0.55, L, { top: '#d99a4f' }); k.y = w.y; k.dust(0.05, 0, 0.25, '#ffffff', 0.0); k.y = 0.05; k.berry(-0.45, 0.4, 'straw'); },
  shortcake: k => { k.plate('rim', { rim: '#e06a8a' }); const w = k.wedge(0, 0, 0.8, 0.72, 0.6, [[2, C.sponge], [1, '#fffaf0'], [0.4, C.berry], [2, C.sponge], [0.6, '#fffaf0']], { top: '#fffdf6' }); k.y = w.y; k.cream(0.05, 0, 0.1, 0.14); k.berry(0.05, 0, 'straw', 0.08, 1.1); },
  crepe_suzette: k => { k.plate('deep'); for (let i = 0; i < 3; i++) { const m = mesh(new THREE.SphereGeometry(0.32, 24, 10, 0, TAU, 0, Math.PI / 2), fm('#ffffff', { r: 0.5, cc: 0.6, map: TX.crust('#e9b25a') })); m.scale.set(1.2, 0.18, 0.7); k.put(m, -0.2 + i * 0.2, 0.02 + i * 0.03, -0.1 + i * 0.12, i * 0.4); } k.sauce(0, 0, 0.45, '#e98a1e'); k.slice(0.3, -0.25, 'orange', { y: 0.08, r: 0.12 }); k.slice(-0.3, 0.3, 'orange', { y: 0.06, r: 0.1, rz: 0.3 }); },
  opera: k => { k.plate('slate'); k.block(0, 0, 0.8, 0.4, 0.45, '#3b2116', { ry: 0.3, layers: [[1, '#5a3a24'], [0.6, '#3b2116'], [1, '#6a4a2a'], [0.6, '#c9915a'], [1, '#5a3a24']], top: '#1f120c', topO: { r: 0.15, cc: 1 } }); k.y += 0.43; k.put(mesh(new THREE.CircleGeometry(0.05, 12), fm('#d4ad57', { metal: 1, r: 0.25 })), 0.1, 0.002, 0).rotation.x = -Math.PI / 2; k.y = 0.07; k.zigzag(0, -0.45, 0.8, 0.1, 6, '#c47a2c', 0, 0.015); },
  macaron: k => { k.plate('cakestand'); const cols = ['#e8a0b0', '#b9cf8a', '#f2d36b', '#c9a0e0', '#f8c08a', '#8ab8d9', '#5a3324']; seed = 2; cols.forEach((c, i) => { const a = i / cols.length * TAU, d = i === 6 ? 0 : 0.42; const x = Math.cos(a) * d, z = Math.sin(a) * d; for (const y of [0, 0.12]) { const m = mesh(new THREE.SphereGeometry(0.17, 20, 12), fm(c, { r: 0.55 })); m.scale.set(1, 0.32, 1); k.put(m, x, 0.05 + y, z); } k.disc(x, z, 0.14, 0.05, '#fffaf0', { y: 0.06 }); }); },
  eclair: k => { k.plate('slate'); for (const [z, c] of [[-0.25, '#4a2618'], [0.25, '#e8a0b0']]) { const m = mesh(new THREE.CapsuleGeometry(0.13, 0.7, 6, 16), fm('#ffffff', { r: 0.6, map: TX.crust('#c98a4f') })); m.rotation.z = Math.PI / 2; m.scale.y = 1; k.put(m, 0, 0.12, z, 0.15); const t = mesh(new THREE.CapsuleGeometry(0.11, 0.66, 6, 16), fm(c, { r: 0.2, cc: 1 })); t.rotation.z = Math.PI / 2; t.scale.set(1, 1, 0.9); k.put(t, 0, 0.18, z, 0.15); } },
  choux: k => { k.plate('round'); for (const [x, z, s] of [[-0.25, 0, 1], [0.25, 0.1, 0.9], [0, -0.3, 0.85]]) k.ball(x, z, 0.24 * s, '#ffffff', { map: TX.crust('#e2b46a'), bump: 0.12, freq: 10, sink: 0.6, sy: 0.85 }); k.dust(0, 0, 0.6, '#ffffff', 0.4); },
  saint_honore: k => { k.plate('rim', { rim: '#c9a24a' }); k.disc(0, 0, 0.6, 0.1, '#ffffff', { map: TX.crust('#d9a65c') }); k.y += 0.1; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; k.ball(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.12, '#c98a3a', { r: 0.2, cc: 1, sink: 0.7 }); } for (let i = 0; i < 6; i++) k.cream(Math.cos(i) * 0.2, Math.sin(i) * 0.2, 0.12, 0.2); k.cream(0, 0, 0.14, 0.26); },
  black_forest: k => { k.plate('rim', { rim: '#7a3a2a' }); const w = k.wedge(0, 0, 0.8, 0.7, 0.62, [[2, '#3b2116'], [1, '#fffaf0'], [0.3, '#7a1428'], [2, '#3b2116'], [1, '#fffaf0']], { top: '#fffdf6' }); k.y = w.y; k.herbs(0.05, 0, 0.18, 30, '#2a1408', 0.0); k.cream(0.05, 0, 0.09, 0.12); k.berry(0.05, 0, 'cherry', 0.1); },
  dorayaki: k => { k.plate('board'); for (const [x, z] of [[-0.3, 0], [0.35, 0.1]]) { k.disc(x, z, 0.36, 0.08, '#ffffff', { map: TX.crust('#b9763a'), r: 0.5 }); k.disc(x, z, 0.3, 0.08, '#5a2a22', { y: 0.08, r: 0.7 }); k.disc(x, z, 0.36, 0.08, '#ffffff', { map: TX.crust('#b9763a'), y: 0.16, r: 0.5 }); } },
  matcha_parfait: k => { k.plate('parfait'); let y = 0.45; for (const [h, c] of [[0.18, '#5a2a22'], [0.16, '#fffaf0'], [0.2, '#7fa24a'], [0.14, '#fbf3d8'], [0.18, '#a9c46a']]) { const m = mesh(new THREE.CylinderGeometry(0.1 + (y - 0.45) * 0.42 + h * 0.3, 0.1 + (y - 0.45) * 0.42, h, 28), fm(c, { r: 0.6 })); m.position.y = y + h / 2; k.g.add(m); y += h; } k.y = y; k.ball(0, 0, 0.24, '#8fae5a', { bump: 0.06, freq: 18, sink: 0.6 }); for (let i = 0; i < 3; i++) k.ball(Math.cos(i * 2.1) * 0.25, Math.sin(i * 2.1) * 0.25, 0.08, '#fbf8f0', { r: 0.5, sink: 0.6 }); k.dust(0, 0, 0.25, '#5a7a2a', 0.3); },
  warabi: k => { k.plate('slate'); seed = 6; for (let i = 0; i < 7; i++) k.block(rr(-0.4, 0.4), rr(-0.3, 0.3), 0.2, 0.15, 0.2, '#c9a46a', { round: 0.06, ry: rr(0, 3), layers: [[1, '#d9b88a', { r: 0.3, op: 0.85, cc: 0.6 }]] }); k.dust(0, 0, 0.6, '#b98a4a', 0.16); k.drizzle([[-0.5, 0.18, -0.2], [0, 0.2, 0], [0.4, 0.18, 0.2]], '#3a1a0e', 0.02); },
  taiyaki: k => { k.plate('paper'); for (const [x, z, ry] of [[-0.1, -0.15, 0.2], [0.1, 0.2, -0.1]]) { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.bezierCurveTo(-0.4, 0.28, 0.2, 0.3, 0.3, 0.08); s.lineTo(0.55, 0.22); s.lineTo(0.5, 0); s.lineTo(0.55, -0.22); s.lineTo(0.3, -0.08); s.bezierCurveTo(0.2, -0.3, -0.4, -0.28, -0.5, 0); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 }); geo.rotateX(-Math.PI / 2); k.put(mesh(geo, fm('#ffffff', { r: 0.5, map: TX.crust('#c98a3a') })), x, 0.05, z, ry); } },
  sakura_mochi: k => { k.plate('slate'); for (const [x, z] of [[-0.3, 0], [0.3, 0.1]]) { k.leaf(x, z + 0.05, 0.5, '#5a7a3a', { tilt: 0.05 }); k.ball(x, z, 0.24, '#f2b8c6', { r: 0.7, sy: 0.75, sink: 0.7, y: 0.03 }); k.leaf(x + 0.05, z - 0.05, 0.08, '#e06a8a', { y: 0.36, tilt: 0.1 }); } },
  millefeuille: k => { k.plate('rim', { rim: '#c9a24a' }); const puff = { map: TX.speck('#e9c27a', '#b9823a', 300, 'pf'), r: 0.7 }; k.block(0, 0, 0.75, 0.48, 0.42, '#ffffff', { ry: 0.35, layers: [[1, '#e9c27a', puff], [1.1, '#f6e6b0'], [1, '#e9c27a', puff], [1.1, '#f6e6b0'], [1, '#e9c27a', puff]], top: '#fffaf0', topO: { r: 0.3, cc: 0.6 } }); k.y += 0.52; for (let i = 0; i < 3; i++) k.berry(-0.22 + i * 0.22, (i - 1) * -0.08, 'straw', 0, 0.9); k.y = 0.05; k.dust(0.4, 0.4, 0.2, '#ffffff'); },
  montblanc: k => { k.plate('round'); k.disc(0, 0, 0.42, 0.1, '#ffffff', { map: TX.crust('#d9a65c') }); k.y += 0.1; k.dome(0, 0, 0.36, 0.3, '#fbf6ec', { r: 0.6 }); k.noodles(0, 0, 0.54, '#b88a5e', { n: 44, h: 0.50, n: 46, thick: 0.02, cc: 0.1 }); k.y += 0.4; k.ball(0, 0, 0.08, '#9a5a2a', { r: 0.25, cc: 1 }); k.dust(0, 0, 0.3, '#ffffff', -0.05); },
  // ---------- 料理 ----------
  pancake: k => { k.plate('round'); const h = k.stack(0, 0, 3, 0.5, 0.11, '#e0a85a'); k.y += h + 0.04; k.block(0, 0, 0.2, 0.08, 0.16, '#fff1b0', { layers: [[1, '#fff1b0', { r: 0.3, cc: 0.6 }]], ry: 0.6 }); k.y = 0.05 + h; k.drizzle([[-0.3, 0.06, 0.2], [-0.4, 0.0, 0.35], [-0.45, -h + 0.02, 0.4]], '#a8601e', 0.03); for (let i = 0; i < 3; i++) k.berry(0.55, -0.25 + i * 0.15, 'blue', -h); },
  frenchtoast: k => { k.plate('rim', { rim: '#7fa2b8' }); for (const [x, z, ry, y] of [[-0.15, 0, 0.3, 0], [0.12, 0.12, -0.3, 0.12]]) k.block(x, z, 0.6, 0.14, 0.55, '#ffffff', { map: TX.crust('#d99a4f'), ry, round: 0.05, y }); k.y += 0.27; k.dust(0, 0, 0.4, '#ffffff', 0); for (let i = 0; i < 3; i++) k.berry(-0.1 + i * 0.12, 0.05, i ? 'rasp' : 'straw', 0); k.mint(0.12, -0.12, 0, 0.1); },
  benedict: k => { k.plate('round'); for (const x of [-0.25, 0.27]) { k.disc(x, 0, 0.26, 0.1, '#ffffff', { map: TX.crust('#e9c27a') }); k.disc(x, 0, 0.24, 0.05, '#d97a6a', { y: 0.1 }); const e = mesh(new THREE.SphereGeometry(0.2, 20, 12), fm('#fbfaf5', { r: 0.4 })); e.scale.y = 0.55; k.put(e, x, 0.2, 0); k.sauce(x, 0, 0.2, '#f2c23a', { y: 0.29 }); } k.herbs(0, 0, 0.5, 20, '#3f7a2e', 0.35); k.lettuce(0, 0.45, 0.25); },
  big_breakfast: k => { k.plate('oval'); k.egg(-0.45, -0.1, 1.4); k.steak(0.15, -0.25, 0.55, 0.12, '#b8453a', { h: 0.05, ry: 0.2 }); k.steak(0.2, -0.05, 0.55, 0.12, '#b8453a', { h: 0.05, ry: 0.3 }); for (let i = 0; i < 2; i++) { const m = mesh(new THREE.CapsuleGeometry(0.07, 0.3, 6, 12), fm('#a8562e', { r: 0.4, cc: 0.5 })); m.rotation.z = Math.PI / 2; k.put(m, 0.55, 0.07, 0.15 + i * 0.16, 0.2); } seed = 2; for (let i = 0; i < 12; i++) k.ball(-0.1 + rr(-0.15, 0.15), 0.32 + rr(-0.1, 0.1), 0.045, '#c9452e', { r: 0.3, cc: 0.8 }); k.berry(-0.5, 0.3, 'tomato'); k.berry(-0.4, 0.42, 'tomato'); },
  carbonara: k => { k.plate('deep'); k.noodles(0, 0, 0.54, '#f1e3b6', { n: 44, h: 0.40 }); k.y += 0.3; seed = 3; for (let i = 0; i < 8; i++) k.block(rr(-0.25, 0.25), rr(-0.25, 0.25), 0.08, 0.04, 0.06, '#b8453a', { ry: rr(0, 3), y: rr(-0.1, 0) }); k.dome(0, 0, 0.09, 0.07, '#f2a51a', { r: 0.2, cc: 1 }); k.herbs(0, 0, 0.3, 40, '#2a2a2a', 0.03); },
  pesto: k => { k.plate('deep'); k.noodles(0, 0, 0.54, '#7fa25a', { n: 44, h: 0.11 }); k.y += 0.25; seed = 4; for (let i = 0; i < 5; i++) { const sh = mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, TAU, 0, Math.PI / 2), fm('#3a2a2a', { r: 0.3, cc: 0.6, side: 1 })); sh.scale.set(1.2, 0.4, 0.9); k.put(sh, rr(-0.35, 0.35), rr(-0.1, 0), rr(-0.35, 0.35), rr(0, 3)); } k.leaf(0, 0, 0.14, '#3f8a3a', { y: 0.05 }); k.leaf(0.05, 0.05, 0.12, '#3f8a3a', { y: 0.05 }); },
  tomato: k => { k.plate('deep'); k.noodles(0, 0, 0.54, '#d0533e', { n: 44, h: 0.11 }); k.y += 0.24; for (let i = 0; i < 4; i++) k.shrimp(Math.cos(i * 1.6) * 0.25, Math.sin(i * 1.6) * 0.25, 1); k.leaf(0, 0, 0.13, '#3f8a3a', { y: 0.06 }); },
  aglio: k => { k.plate('deep'); k.noodles(0, 0, 0.54, '#efd9a0', { n: 44, h: 0.11 }); k.y += 0.28; seed = 9; for (let i = 0; i < 10; i++) k.put(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 10), fm('#f6ecc8', { r: 0.4 })), rr(-0.3, 0.3), 0, rr(-0.3, 0.3)); for (let i = 0; i < 8; i++) k.put(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), fm('#c9201a', { r: 0.4 })), rr(-0.3, 0.3), 0.01, rr(-0.3, 0.3)); k.herbs(0, 0, 0.35, 40, '#3f7a2e', 0.02); },
  bolognese: k => { k.plate('deep'); k.noodles(0, 0, 0.54, '#efd9a0', { n: 44, h: 0.34 }); k.y += 0.2; k.dome(0, 0, 0.3, 0.14, '#8a2e1e', { bump: 0.12, freq: 20, r: 0.5, cc: 0.5 }); k.y += 0.12; k.herbs(0, 0, 0.2, 30, '#fbf3d8', 0.02); k.leaf(0, 0, 0.12, '#3f8a3a', { y: 0.02 }); },
  lobster_pasta: k => { k.plate('deep'); k.noodles(0, 0, 0.54, '#e0703e', { n: 44, h: 0.36 }); k.y += 0.22; const body = mesh(new THREE.CapsuleGeometry(0.12, 0.45, 6, 12), fm('#ffffff', { r: 0.3, cc: 0.7, map: TX.stripes('#d9402e', '#f08a5a', 6) })); body.rotation.z = Math.PI / 2; k.put(body, 0, 0.08, 0, 0.6); for (const s of [-1, 1]) { const cl = mesh(new THREE.SphereGeometry(0.09, 14, 10), fm('#d9402e', { r: 0.3, cc: 0.7 })); cl.scale.set(1.6, 0.7, 1); k.put(cl, -0.3, 0.06, s * 0.2, 0.6 + s * 0.4); } k.leaf(0.25, -0.2, 0.12, '#3f8a3a', { y: 0.05 }); },
  panini: k => { k.plate('board'); for (const [x, z, ry] of [[-0.25, 0, 0.3], [0.3, 0.1, -0.3]]) k.block(x, z, 0.62, 0.22, 0.5, '#ffffff', { ry, layers: [[1, '#ffffff', { map: TX.grill('#d9b07a'), r: 0.6 }], [0.4, '#f2d36b', { r: 0.3, cc: 0.6 }], [0.3, '#d97a6a'], [1, '#ffffff', { map: TX.grill('#d9b07a'), r: 0.6 }]], round: 0.04 }); k.lettuce(-0.1, 0.45, 0.2); },
  cubano: k => { k.plate('slate'); for (const [x, z, ry] of [[-0.3, 0, 0.5], [0.3, 0.05, -0.4]]) k.block(x, z, 0.55, 0.3, 0.45, '#ffffff', { ry, layers: [[1, '#ffffff', { map: TX.grill('#c98a4f') }], [0.4, '#e9b0a0'], [0.3, '#f2d36b'], [0.2, '#7aa04a'], [1, '#ffffff', { map: TX.grill('#c98a4f') }]] }); k.sticks(0.1, -0.45, 6, 0.25, 0.05, '#7aa04a'); },
  croque: k => { k.plate('round'); k.block(0, 0, 0.75, 0.24, 0.7, '#ffffff', { ry: 0.4, layers: [[1, '#ffffff', { map: TX.crust('#e9c27a') }], [0.4, '#e9b0a0'], [1, '#ffffff', { map: TX.crust('#e9c27a') }]] }); k.y += 0.24; k.egg(0, 0, 0.9); k.herbs(0, 0, 0.2, 14, '#3f7a2e', 0.05); },
  club: k => { k.plate('round'); for (let i = 0; i < 3; i++) { const s = new THREE.Shape(); s.moveTo(-0.3, 0); s.lineTo(0.3, 0); s.lineTo(0, 0.42); s.lineTo(-0.3, 0); const grp = new THREE.Group(); let y = 0; for (const [h, c, map] of [[0.06, '#ffffff', TX.crust('#e9c27a')], [0.04, '#7fb04a'], [0.04, '#d9302a'], [0.05, '#f2d36b'], [0.06, '#ffffff', TX.crust('#e9c27a')], [0.04, '#e9b0a0'], [0.06, '#ffffff', TX.crust('#e9c27a')]]) { const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); geo.rotateX(Math.PI / 2); const m = mesh(geo, fm(c, { r: 0.6, map })); m.position.y = y + h; grp.add(m); y += h; } grp.rotation.z = Math.PI / 2; grp.position.set(0, 0.3, 0); const o = new THREE.Group(); o.add(grp); k.put(o, -0.2 + i * 0.22, 0, 0.0 + i * 0.05, i * 0.5); } k.sticks(0.3, 0.4, 8, 0.3, 0.06, '#f2c24e'); },
  margherita: k => { k.plate('board'); k.disc(0, 0, 0.82, 0.05, '#ffffff', { map: TX.pizza('#c9402a', '#fbf3d8', ['#3f8a3a:leaf:7']) , r: 0.5 }); const cr = mesh(new THREE.TorusGeometry(0.8, 0.05, 10, 48), fm('#ffffff', { map: TX.crust('#d99a4f'), r: 0.6 })); cr.rotation.x = -Math.PI / 2; k.put(cr, 0, 0.05, 0); },
  pepperoni: k => { k.plate('board'); k.disc(0, 0, 0.82, 0.05, '#ffffff', { map: TX.pizza('#c9402a', '#f6e2a0', ['#a8281e:disc:14']), r: 0.5 }); const cr = mesh(new THREE.TorusGeometry(0.8, 0.05, 10, 48), fm('#ffffff', { map: TX.crust('#d99a4f'), r: 0.6 })); cr.rotation.x = -Math.PI / 2; k.put(cr, 0, 0.05, 0); },
  quattro: k => { k.plate('board'); k.disc(0, 0, 0.82, 0.05, '#ffffff', { map: TX.pizza('#f2e2b0', '#fbf3d8', ['#e9c46a:disc:10', '#b9a46a:dot:30']), r: 0.45 }); const cr = mesh(new THREE.TorusGeometry(0.8, 0.05, 10, 48), fm('#ffffff', { map: TX.crust('#d99a4f'), r: 0.6 })); cr.rotation.x = -Math.PI / 2; k.put(cr, 0, 0.05, 0); k.drizzle([[-0.3, 0.07, -0.2], [0, 0.08, 0], [0.3, 0.07, 0.2]], '#e8a63a', 0.015); },
  truffle_pizza: k => { k.plate('board'); k.disc(0, 0, 0.82, 0.05, '#ffffff', { map: TX.pizza('#efe2c4', '#fbf3d8', ['#8a6a4a:disc:10', '#2a1a12:dot:40', '#3f8a3a:leaf:4']), r: 0.5 }); const cr = mesh(new THREE.TorusGeometry(0.8, 0.05, 10, 48), fm('#ffffff', { map: TX.crust('#d99a4f'), r: 0.6 })); cr.rotation.x = -Math.PI / 2; k.put(cr, 0, 0.05, 0); },
  seafood_pizza: k => { k.plate('board'); k.disc(0, 0, 0.82, 0.05, '#ffffff', { map: TX.pizza('#c9402a', '#fbf3d8', ['#3f8a3a:leaf:4', '#f4e6d0:ring:6']), r: 0.5 }); const cr = mesh(new THREE.TorusGeometry(0.8, 0.05, 10, 48), fm('#ffffff', { map: TX.crust('#d99a4f'), r: 0.6 })); cr.rotation.x = -Math.PI / 2; k.put(cr, 0, 0.05, 0); k.y += 0.05; for (let i = 0; i < 5; i++) k.shrimp(Math.cos(i * 1.25) * 0.45, Math.sin(i * 1.25) * 0.45, 0.9); },
  curry_rice: k => { k.plate('oval'); k.riceMound(-0.35, 0, 0.45, 0.32); k.sauce(0.3, 0, 0.55, '#a8621e', { sx: 1.1 }); seed = 5; for (let i = 0; i < 8; i++) k.block(0.3 + rr(-0.3, 0.3), rr(-0.3, 0.3), 0.12, 0.08, 0.12, ['#e98a2e', '#f2e2b6', '#8a4a2a'][i % 3], { ry: rr(0, 3), round: 0.03, y: 0.01 }); k.herbs(-0.35, 0, 0.1, 6, '#c9201a', 0.32); },
  omurice: k => { k.plate('oval'); k.sauce(0, 0, 0.6, '#8a3a1e', { sx: 1.25 }); const m = mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, TAU, 0, Math.PI / 2), fm('#f2c84a', { r: 0.35, cc: 0.6 })); m.scale.set(1.4, 0.55, 0.85); k.put(m, 0, 0.01, 0); k.y += 0.27; k.zigzag(0, 0, 0.7, 0.2, 5, '#c9201a', 0.0, 0.025); k.herbs(0, 0, 0.3, 14, '#3f7a2e', 0.03); },
  oyakodon: k => { k.plate('bowl', { r: 0.7, h: 0.45, fill: 0.85, mat: fm('#3a2a28', { r: 0.25, cc: 0.8 }) }); k.disc(0, 0, 0.58, 0.04, '#ffffff', { map: TX.rice() }); k.y += 0.04; k.sauce(0, 0, 0.5, '#f2d36b', { map: TX.speck('#f2d36b', '#fbf8f0', 120) }); seed = 6; for (let i = 0; i < 7; i++) k.ball(rr(-0.3, 0.3), rr(-0.3, 0.3), 0.08, '#d9a65c', { sx: 1.3, sy: 0.6, r: 0.5 }); k.herbs(0, 0, 0.3, 30, '#4f8a3a', 0.06); },
  katsudon: k => { k.plate('bowl', { r: 0.7, h: 0.45, fill: 0.85, mat: fm('#3a2a28', { r: 0.25, cc: 0.8 }) }); k.disc(0, 0, 0.58, 0.04, '#ffffff', { map: TX.rice() }); k.y += 0.04; for (let i = 0; i < 5; i++) k.block(-0.32 + i * 0.16, 0, 0.14, 0.12, 0.5, '#ffffff', { map: TX.speck('#d99a4f', '#8a4a1a', 300), round: 0.03, tilt: 0.1 }); k.sauce(0, 0.1, 0.35, '#f2d36b', { y: 0.12 }); k.herbs(0, 0, 0.2, 20, '#4f8a3a', 0.15); },
  unadon: k => { k.plate('slate'); k.put(mesh(new RoundedBoxGeometry(1.3, 0.3, 0.9, 2, 0.04), fm('#2a1210', { r: 0.25, cc: 1 })), 0, 0.15, 0); k.y += 0.3; k.block(0, 0, 1.15, 0.03, 0.75, '#ffffff', { map: TX.rice() }); k.y += 0.03; for (const x of [-0.27, 0.27]) k.block(x, 0, 0.5, 0.06, 0.6, '#ffffff', { map: TX.grill('#8a4a22'), top: '#5a2a12', topO: { r: 0.15, cc: 1 } }); k.herbs(0, 0, 0.4, 20, '#3f7a2e', 0.1); },
  caesar: k => { k.plate('bowl', { r: 0.85, h: 0.38, fill: 0.5 }); seed = 7; for (let i = 0; i < 12; i++) k.lettuce(rr(-0.3, 0.3), rr(-0.3, 0.3), rr(0.22, 0.3), i % 3 ? '#8fbf5a' : '#b9d97a', { y: rr(0, 0.12) }); for (let i = 0; i < 6; i++) k.block(rr(-0.3, 0.3), rr(-0.3, 0.3), 0.1, 0.08, 0.1, '#ffffff', { map: TX.crust('#d9a65c'), y: 0.2, ry: rr(0, 3) }); k.herbs(0, 0, 0.4, 60, '#fbf3d8', 0.24); k.egg(0.2, 0.2, 0.5, { y: 0.22 }); },
  nicoise: k => { k.plate('round'); seed = 3; for (let i = 0; i < 8; i++) k.lettuce(rr(-0.3, 0.3), rr(-0.3, 0.3), 0.25, '#8fbf5a'); k.y += 0.1; for (let i = 0; i < 2; i++) { const e = mesh(new THREE.SphereGeometry(0.12, 18, 12, 0, TAU, 0, Math.PI / 2), [fm('#fbfaf5')]); e.scale.set(1, 0.6, 1.3); k.put(e, -0.25 + i * 0.5, 0.05, 0.2); k.dome(-0.25 + i * 0.5, 0.2, 0.06, 0.04, '#f2a51a', { y: 0.06 }); } k.berry(0.2, -0.2, 'tomato'); k.berry(-0.2, -0.25, 'tomato'); k.sticks(0, 0, 6, 0.3, 0.04, '#5a8a3a', { y: 0.05 }); seed = 5; for (let i = 0; i < 6; i++) k.ball(rr(-0.3, 0.3), rr(-0.3, 0.3), 0.04, '#2a2a2a', { r: 0.3, cc: 0.6, y: 0.08 }); },
  salmon_poke: k => { k.plate('bowl', { r: 0.82, h: 0.42, fill: 0.7 }); k.disc(0, 0, 0.7, 0.03, '#ffffff', { map: TX.rice() }); k.y += 0.03; seed = 8; for (let i = 0; i < 6; i++) k.block(-0.3 + rr(-0.1, 0.1), -0.2 + rr(-0.15, 0.15), 0.12, 0.1, 0.12, '#ffffff', { map: TX.fish('#f08a6a'), ry: rr(0, 3) }); for (let i = 0; i < 5; i++) k.slice(0.3 + rr(-0.1, 0.1), -0.15 + i * 0.07, 'cucumber', { r: 0.08 }); const av = mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI), fm('#a9c46a', { r: 0.4 })); av.rotation.x = -Math.PI / 2; av.scale.set(1.4, 1, 0.6); k.put(av, 0, 0.0, 0.3); for (let i = 0; i < 6; i++) k.ball(rr(-0.4, 0.4), rr(-0.4, 0.4), 0.03, '#f2a51a', { r: 0.3, cc: 1 }); k.herbs(0, 0, 0.5, 60, '#fbf3d8', 0.12); },
  quinoa: k => { k.plate('bowl', { r: 0.82, h: 0.42, fill: 0.7 }); k.disc(0, 0, 0.7, 0.03, '#ffffff', { map: TX.speck('#d9c48a', '#8a6a3a', 400) }); k.y += 0.03; for (let i = 0; i < 4; i++) k.lettuce(-0.3 + rr(-0.1, 0.1), 0.3, 0.2, '#6a9a3a'); k.broccoli(0.3, 0.2, 1); k.broccoli(0.2, 0.35, 0.8); const av = mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI), fm('#a9c46a', { r: 0.4 })); av.rotation.x = -Math.PI / 2; av.scale.set(1.4, 1, 0.6); k.put(av, 0.25, 0.0, -0.25); k.egg(-0.25, -0.25, 0.55); seed = 2; for (let i = 0; i < 8; i++) k.ball(rr(-0.4, 0.4), rr(-0.4, 0.4), 0.04, '#c9402a', { r: 0.3, cc: 0.6, y: 0.03 }); },
  fried_rice: k => { k.plate('round'); k.dome(0, 0, 0.6, 0.38, '#ffffff', { map: TX.speck('#efcf6a', '#fbf8f0', 400), bump: 0.03, freq: 22 }); seed = 4; for (let i = 0; i < 26; i++) { const a = rr(0, TAU), d = rr(0, 0.5); k.put(mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), fm(['#4f8a3a', '#e98a2e', '#f2a51a'][i % 3], { r: 0.5 })), Math.cos(a) * d, 0.38 * Math.sqrt(1 - (d / 0.6) ** 2), Math.sin(a) * d); } },
  chow_mein: k => { k.plate('oval'); k.noodles(0, 0, 0.55, '#c98a3a', { h: 0.28, n: 40, thick: 0.02 }); k.y += 0.2; seed = 3; for (let i = 0; i < 10; i++) k.block(rr(-0.4, 0.4), rr(-0.3, 0.3), 0.1, 0.03, 0.05, ['#4f8a3a', '#e98a2e', '#d9b07a'][i % 3], { ry: rr(0, 3), y: rr(-0.05, 0.05) }); for (let i = 0; i < 3; i++) k.shrimp(rr(-0.3, 0.3), rr(-0.2, 0.2), 0.9); },
  mapo: k => { k.plate('bowl', { r: 0.8, h: 0.35, fill: 0.55 }); k.sauce(0, 0, 0.62, '#b8301e'); seed = 5; for (let i = 0; i < 12; i++) k.block(rr(-0.4, 0.4), rr(-0.4, 0.4), 0.15, 0.13, 0.15, '#f8f2e2', { ry: rr(0, 3), round: 0.03, y: -0.02 }); k.herbs(0, 0, 0.5, 40, '#4f8a3a', 0.13); k.herbs(0, 0, 0.5, 40, '#5a1a0e', 0.13); },
  kungpao: k => { k.plate('oval'); k.sauce(0, 0, 0.55, '#8a2a12', { sx: 1.2 }); seed = 6; for (let i = 0; i < 12; i++) k.ball(rr(-0.45, 0.45), rr(-0.3, 0.3), 0.08, '#c9702e', { bump: 0.15, freq: 30, r: 0.4, cc: 0.6, sy: 0.7 }); for (let i = 0; i < 10; i++) k.ball(rr(-0.45, 0.45), rr(-0.3, 0.3), 0.04, '#e9c27a', { sx: 1.4, r: 0.4, y: 0.04 }); for (let i = 0; i < 8; i++) { const c = mesh(new THREE.CapsuleGeometry(0.025, 0.1, 4, 8), fm('#a8180e', { r: 0.3, cc: 0.8 })); c.rotation.z = Math.PI / 2; k.put(c, rr(-0.45, 0.45), 0.08, rr(-0.3, 0.3), rr(0, 3)); } },
  xo_rice: k => { k.plate('round'); k.dome(0, 0, 0.6, 0.36, '#ffffff', { map: TX.speck('#d9a65c', '#8a3a1a', 500), bump: 0.03, freq: 22 }); k.y += 0.3; for (let i = 0; i < 3; i++) k.shrimp(Math.cos(i * 2.1) * 0.22, Math.sin(i * 2.1) * 0.22, 1); k.herbs(0, 0, 0.3, 30, '#4f8a3a', 0.06); },
  fries: k => { k.plate('basket'); k.sticks(0, 0, 40, 0.42, 0.07, '#f2c24e', { spread: 1.6, hgt: 1.4 }); k.y = 0.12; k.put(mesh(latheGeo([[0, 0], [0.14, 0], [0.16, 0.1], [0, 0.1]], 24), CER()), 0.75, -0.1, 0.55); k.disc(0.75, 0.55, 0.13, 0.02, '#c9301a', { y: 0.0, r: 0.2, cc: 1 }); },
  fish_chips: k => { k.plate('paper'); k.sticks(0.3, 0.1, 22, 0.42, 0.07, '#f2c24e', { spread: 1.1 }); for (const [x, z] of [[-0.35, -0.1], [-0.15, 0.25]]) { const f = mesh(bumpify(new THREE.CapsuleGeometry(0.15, 0.45, 6, 14), 0.06, 30, x), fm('#d99a3a', { r: 0.6, map: TX.speck('#d99a3a', '#8a4a1a', 200) })); f.rotation.z = Math.PI / 2; f.scale.y = 0.7; k.put(f, x, 0.11, z, 0.4); } k.slice(-0.6, 0.35, 'lemon', { r: 0.12, rz: 0.4 }); },
  karaage: k => { k.plate('round'); seed = 9; for (let i = 0; i < 7; i++) k.ball(rr(-0.35, 0.35), rr(-0.35, 0.3), 0.15, '#c9822e', { bump: 0.18, freq: 26, map: TX.speck('#c9822e', '#7a3a12', 200), r: 0.6, sy: 0.8 }); k.lettuce(0.4, 0.4, 0.28, '#9fcf5a'); k.slice(-0.45, 0.45, 'lemon', { r: 0.12, rz: 0.5 }); },
  tempura: k => { k.plate('basket'); for (let i = 0; i < 3; i++) { const t = mesh(bumpify(new THREE.CapsuleGeometry(0.1, 0.55, 6, 14), 0.14, 34, i), fm('#f2d9a0', { r: 0.7 })); t.rotation.z = Math.PI / 2 - 0.25; k.put(t, -0.2 + i * 0.2, 0.18 + i * 0.03, -0.1 + i * 0.1, 0.6); const tail = mesh(new THREE.ConeGeometry(0.06, 0.12, 6), fm('#d9402e')); tail.rotation.z = -Math.PI / 2; k.put(tail, 0.15 + i * 0.2, 0.28, -0.3 + i * 0.1, 0.6); } for (let i = 0; i < 2; i++) k.disc(0.4, 0.3 - i * 0.3, 0.15, 0.06, '#f2d9a0', { y: 0.05, r: 0.8 }); },
  calamari: k => { k.plate('round'); seed = 3; for (let i = 0; i < 9; i++) { const t = mesh(bumpify(new THREE.TorusGeometry(0.12, 0.05, 10, 20), 0.12, 40, i), fm('#e9c27a', { r: 0.7, map: TX.speck('#e9c27a', '#a8722a', 150) })); t.rotation.x = -Math.PI / 2 + rr(-0.6, 0.6); k.put(t, rr(-0.35, 0.35), 0.07 + rr(0, 0.1), rr(-0.35, 0.3)); } k.slice(0.45, 0.4, 'lemon', { r: 0.12, rz: 0.4 }); k.put(mesh(latheGeo([[0, 0], [0.14, 0], [0.16, 0.1], [0, 0.1]], 24), CER()), -0.55, 0, 0.45); },
  pumpkin_soup: k => { k.plate('bowl', { r: 0.8, h: 0.42, fill: 0.78 }); k.disc(0, 0, 0.7, 0.02, '#ffffff', { map: TX.soup('#f0a43a', []), r: 0.35, cc: 0.6 }); k.y += 0.02; k.drizzle([[-0.3, 0.005, 0], [-0.1, 0.008, 0.1], [0.1, 0.005, -0.05], [0.3, 0.005, 0.05]], '#fffaf0', 0.02); seed = 4; for (let i = 0; i < 8; i++) k.ball(rr(-0.3, 0.3), rr(-0.3, 0.3), 0.025, '#4f6a2a', { r: 0.6 }); k.leaf(0.1, -0.1, 0.12, '#3f8a3a'); },
  onion_soup: k => { k.plate('bowl', { r: 0.7, h: 0.5, fill: 0.9, mat: fm('#5a3a2a', { r: 0.4, cc: 0.6 }) }); k.dome(0, 0, 0.66, 0.16, '#ffffff', { map: TX.crust('#d9a65c'), bump: 0.08, freq: 18 }); k.herbs(0, 0, 0.3, 20, '#3f7a2e', 0.15); },
  clam_chowder: k => { k.plate('bowl', { r: 0.8, h: 0.42, fill: 0.78 }); k.disc(0, 0, 0.7, 0.02, '#ffffff', { map: TX.soup('#f4ead2', ['#e98a2e:dot:20', '#f8f2e2:big:10']), r: 0.45 }); k.y += 0.02; for (let i = 0; i < 4; i++) { const sh = mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, TAU, 0, Math.PI / 2), fm('#d9c4a8', { r: 0.5, side: 1 })); sh.scale.set(1.2, 0.4, 0.9); k.put(sh, Math.cos(i * 1.5) * 0.3, 0, Math.sin(i * 1.5) * 0.3, i); } k.herbs(0, 0, 0.3, 30, '#3f7a2e', 0.01); },
  borscht: k => { k.plate('bowl', { r: 0.8, h: 0.42, fill: 0.78 }); k.disc(0, 0, 0.7, 0.02, '#ffffff', { map: TX.soup('#b8352e', ['#e98a2e:line:20', '#f6ecc8:big:8']), r: 0.35, cc: 0.6 }); k.y += 0.02; k.dome(0.1, 0, 0.14, 0.06, '#fbf8f0', { r: 0.6 }); k.herbs(0.1, 0, 0.12, 12, '#3f7a2e', 0.06); },
  bouillabaisse: k => { k.plate('bowl', { r: 0.85, h: 0.42, fill: 0.72 }); k.disc(0, 0, 0.75, 0.02, '#ffffff', { map: TX.soup('#e0703e', ['#f2d36b:dot:30']), r: 0.35, cc: 0.6 }); k.y += 0.02; for (let i = 0; i < 3; i++) k.shrimp(Math.cos(i * 2.1) * 0.35, Math.sin(i * 2.1) * 0.35, 1.1); for (let i = 0; i < 4; i++) { const sh = mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, TAU, 0, Math.PI / 2), fm('#1f1e2a', { r: 0.3, cc: 0.8, side: 1 })); sh.scale.set(1.5, 0.4, 0.8); k.put(sh, Math.cos(i * 1.6 + 0.8) * 0.2, 0, Math.sin(i * 1.6 + 0.8) * 0.2, i); } k.fillet(0, 0, 0.3, 0.2, '#fbf3e8', { line: '#e9dccb' }); },
  steak: k => { k.plate('board'); k.steak(-0.1, 0, 0.8, 0.55, '#7a3a26', { h: 0.16, ry: 0.3 }); k.y += 0.16; k.leaf(-0.1, 0, 0.2, '#3f6a2a'); k.y = 0.1; k.broccoli(0.6, 0.3); k.berry(0.55, -0.3, 'tomato'); k.berry(0.65, -0.18, 'tomato'); k.put(mesh(latheGeo([[0, 0], [0.13, 0], [0.15, 0.1], [0, 0.1]], 24), fm('#3a3a3a', { r: 0.4, metal: 0.6 })), -0.6, 0, 0.4); k.disc(-0.6, 0.4, 0.12, 0.02, '#5a2a12', { y: 0.06, cc: 1, r: 0.2 }); },
  chicken: k => { k.plate('skillet'); for (const [x, z, ry] of [[-0.2, 0, 0.4], [0.25, 0.15, -0.6]]) { const leg = mesh(bumpify(new THREE.SphereGeometry(0.28, 20, 14), 0.06, 10, x), fm('#ffffff', { r: 0.4, cc: 0.6, map: TX.crust('#c98a3a') })); leg.scale.set(1.3, 0.6, 0.9); k.put(leg, x, 0.14, z, ry); } k.leaf(0, -0.35, 0.3, '#3f6a2a', { tilt: 0.1 }); k.leaf(0.1, -0.3, 0.25, '#3f6a2a', { tilt: 0.1 }); k.slice(0.45, -0.3, 'lemon', { r: 0.12 }); for (let i = 0; i < 4; i++) k.ball(-0.5 + i * 0.1, 0.4, 0.06, '#f6ecc8', { r: 0.4 }); },
  skewers: k => { k.plate('slate'); for (let i = 0; i < 4; i++) { const z = -0.45 + i * 0.3; const st = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), fm('#d9b98a', { r: 0.7 })); st.rotation.z = Math.PI / 2; k.put(st, 0, 0.07, z, 0.15); for (let j = 0; j < 4; j++) { const cols = i % 2 ? ['#a8562e', '#4f8a3a', '#a8562e', '#e9c27a'] : ['#c9702e', '#c9702e', '#e9502e', '#c9702e']; k.ball(-0.4 + j * 0.24, z + (-0.4 + j * 0.24) * -0.15, 0.08, cols[j], { bump: 0.1, freq: 20, r: 0.4, cc: 0.7, sy: 0.85 }); } } },
  salmon_steak: k => { k.plate('rim', { rim: '#2c3a56' }); k.sauce(0, 0, 0.5, '#f6ecc8'); k.fillet(0, 0, 0.7, 0.45, '#f08a6a', { h: 0.16, ry: 0.4 }); k.y += 0.16; k.leaf(0, 0, 0.12, '#3f8a3a'); k.y = 0.05; for (let i = 0; i < 5; i++) { const a = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), fm('#5a8a3a', { r: 0.5 })); a.rotation.z = Math.PI / 2; k.put(a, 0.25, 0.04, -0.4 + i * 0.05, 0.3); } k.slice(-0.45, -0.3, 'lemon', { r: 0.12 }); },
  lamb: k => { k.plate('slate'); for (let i = 0; i < 3; i++) { k.steak(-0.2 + i * 0.22, -0.05 + i * 0.05, 0.3, 0.42, '#8a4a34', { h: 0.12, ry: 0.6, y: i * 0.04 }); const b = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), fm('#f4efe6', { r: 0.5 })); b.rotation.z = Math.PI / 2; k.put(b, -0.05 + i * 0.22, 0.12 + i * 0.04, -0.25 + i * 0.05, 0.6 + Math.PI / 2); } k.sauce(0.35, 0.35, 0.18, '#5a1a2e'); k.leaf(-0.4, 0.3, 0.3, '#3f6a2a', { tilt: 0.1 }); },
  paella: k => { k.plate('skillet'); k.disc(0, 0, 0.82, 0.04, '#ffffff', { map: TX.rice('#f2b84a') }); k.y += 0.04; for (let i = 0; i < 5; i++) k.shrimp(Math.cos(i * 1.25) * 0.5, Math.sin(i * 1.25) * 0.5, 1.2); for (let i = 0; i < 6; i++) { const sh = mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, TAU, 0, Math.PI / 2), fm('#1f1e2a', { r: 0.3, cc: 0.8, side: 1 })); sh.scale.set(1.5, 0.4, 0.8); k.put(sh, Math.cos(i * 1.05 + 0.5) * 0.25, 0, Math.sin(i * 1.05 + 0.5) * 0.25, i); } k.slice(0, 0, 'lemon', { r: 0.14 }); seed = 3; for (let i = 0; i < 20; i++) k.ball(rr(-0.6, 0.6), rr(-0.6, 0.6), 0.025, '#5a9a3a'); },
  garlic_shrimp: k => { k.plate('skillet'); k.sauce(0, 0, 0.7, '#f2c84a'); for (let i = 0; i < 8; i++) k.shrimp(Math.cos(i * 0.8) * 0.4, Math.sin(i * 0.8) * 0.4, 1.3, { y: 0.01 }); k.herbs(0, 0, 0.6, 60, '#3f7a2e', 0.04); seed = 7; for (let i = 0; i < 10; i++) k.ball(rr(-0.5, 0.5), rr(-0.5, 0.5), 0.03, '#f6ecc8', { r: 0.4 }); },
  oysters: k => { k.plate('ice'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; const x = Math.cos(a) * 0.5, z = Math.sin(a) * 0.5; const sh = mesh(bumpify(new THREE.SphereGeometry(0.22, 18, 10), 0.08, 20, i), fm('#8a8478', { r: 0.8 })); sh.scale.set(1.2, 0.3, 0.85); k.put(sh, x, 0.04, z, a); const in2 = mesh(new THREE.SphereGeometry(0.15, 16, 10), fm('#e9e2cf', { r: 0.15, cc: 1 })); in2.scale.set(1.2, 0.25, 0.85); k.put(in2, x, 0.08, z, a); } k.slice(0, 0, 'lemon', { r: 0.16, rz: 0.4, y: 0.05 }); },
  grilled_lobster: k => { k.plate('oval'); for (const s of [-1, 1]) { const half = mesh(new THREE.SphereGeometry(0.22, 20, 12, 0, Math.PI), fm('#d9402e', { r: 0.4, cc: 0.6 })); half.scale.set(3, 0.6, 1); k.put(half, 0, 0.0, s * 0.13, s < 0 ? Math.PI : 0); const meat = mesh(new THREE.CapsuleGeometry(0.11, 0.9, 6, 12), fm('#ffffff', { r: 0.5, map: TX.crust('#f2c84a') })); meat.rotation.z = Math.PI / 2; meat.scale.y = 0.6; k.put(meat, 0, 0.1, s * 0.11); } for (const s of [-1, 1]) { const cl = mesh(new THREE.SphereGeometry(0.12, 14, 10), fm('#d9402e', { r: 0.3, cc: 0.7 })); cl.scale.set(1.8, 0.6, 0.9); k.put(cl, -0.75, 0.06, s * 0.35, s * 0.6); } k.herbs(0, 0, 0.4, 30, '#3f7a2e', 0.2); k.slice(0.6, 0.4, 'lemon', { r: 0.13 }); },
  crab: k => { k.plate('deep'); k.sauce(0, 0, 0.55, '#d9502e'); const b = mesh(bumpify(new THREE.SphereGeometry(0.32, 22, 14), 0.05, 12, 2), fm('#d9502e', { r: 0.3, cc: 0.8 })); b.scale.set(1.3, 0.45, 1); k.put(b, 0, 0.12, 0); for (let i = 0; i < 8; i++) { const s = i < 4 ? -1 : 1, j = i % 4; k.drizzle([[s * 0.3, 0.1, -0.2 + j * 0.13], [s * 0.5, 0.12, -0.25 + j * 0.15], [s * 0.6, 0.04, -0.3 + j * 0.17]], '#c9402e', 0.03); } for (const s of [-1, 1]) { const cl = mesh(new THREE.SphereGeometry(0.1, 14, 10), fm('#c9402e', { r: 0.3, cc: 0.8 })); cl.scale.set(1.6, 0.7, 0.9); k.put(cl, s * 0.2, 0.08, -0.42, s * 0.5); } k.herbs(0, 0, 0.5, 40, '#4f8a3a', 0.05); },
  bibimbap: k => { k.plate('stone'); k.disc(0, 0, 0.7, 0.03, '#ffffff', { map: TX.rice() }); k.y += 0.03; const tops = [['#4f8a3a', 0], ['#e98a2e', 1], ['#7a4a2a', 2], ['#f2e2b6', 3], ['#c9402a', 4], ['#3a6a2a', 5]]; for (const [c, i] of tops) { const a = i / 6 * TAU; seed = i; for (let j = 0; j < 8; j++) k.put(mesh(new THREE.BoxGeometry(0.03, 0.03, 0.14), fm(c, { r: 0.5 })), Math.cos(a) * 0.42 + rr(-0.08, 0.08), rr(0, 0.04), Math.sin(a) * 0.42 + rr(-0.08, 0.08), a + rr(-0.3, 0.3)); } k.egg(0, 0, 0.8); },
  tteokbokki: k => { k.plate('deep'); k.sauce(0, 0, 0.55, '#d9402e'); seed = 4; for (let i = 0; i < 12; i++) { const c = mesh(new THREE.CapsuleGeometry(0.06, 0.22, 6, 12), fm('#f6e6d6', { r: 0.3, cc: 0.6 })); c.rotation.z = Math.PI / 2; k.put(c, rr(-0.35, 0.35), 0.06, rr(-0.35, 0.35), rr(0, 3)); } for (let i = 0; i < 2; i++) { const e = mesh(new THREE.SphereGeometry(0.12, 16, 10), fm('#fbfaf5', { r: 0.4 })); e.scale.set(1, 0.9, 1.3); k.put(e, -0.2 + i * 0.4, 0.1, 0.25); } k.herbs(0, 0, 0.4, 40, '#3f8a3a', 0.12); },
  kimchi_stew: k => { k.plate('stone'); k.disc(0, 0, 0.72, 0.03, '#ffffff', { map: TX.soup('#d9502e', ['#f2d36b:dot:20']), r: 0.3, cc: 0.6 }); k.y += 0.03; seed = 6; for (let i = 0; i < 6; i++) k.block(rr(-0.35, 0.35), rr(-0.35, 0.35), 0.16, 0.1, 0.16, '#f8f2e2', { ry: rr(0, 3), round: 0.02, y: -0.04 }); for (let i = 0; i < 6; i++) k.lettuce(rr(-0.35, 0.35), rr(-0.35, 0.35), 0.14, '#e0703e'); k.herbs(0, 0, 0.4, 30, '#3f8a3a', 0.05); },
  korean_chicken: k => { k.plate('round'); seed = 12; for (let i = 0; i < 8; i++) k.ball(rr(-0.4, 0.4), rr(-0.4, 0.35), 0.15, '#b8301e', { bump: 0.15, freq: 24, r: 0.25, cc: 1, sy: 0.85 }); k.herbs(0, 0, 0.5, 60, '#fbf3d8', 0.25); k.herbs(0, 0, 0.5, 30, '#4f8a3a', 0.25); },
  sushi_set: k => { k.plate('geta'); const fish = [['#f08a6a', '#ffffff'], ['#c9201a', '#e04a3a'], ['#f6f0e6', '#d9c8b0'], ['#f2c84a', '#e9b23a'], ['#f08a6a', '#ffffff'], ['#d9e6ea', '#a9c4cc']]; fish.forEach(([c, l], i) => k.nigiri(-0.75 + (i % 3) * 0.3 + Math.floor(i / 3) * 0.75, (i % 3) * 0.02 - 0.1 + Math.floor(i / 3) * 0.15, c, { line: l, ry: 0.2, nori: i === 3 })); k.put(mesh(new THREE.SphereGeometry(0.06, 10, 8), fm('#7a9a3a', { r: 0.8, bump: 0.1 })), 0.8, 0.02, 0.3); },
  maki: k => { k.plate('slate'); const fills = [['#f08a6a', '#7fb04a'], ['#c9201a', '#f2c84a'], ['#7fb04a', '#f2c84a', '#e98a2e']]; for (let i = 0; i < 8; i++) k.maki(-0.75 + (i % 4) * 0.25, -0.18 + Math.floor(i / 4) * 0.36, fills[i % 3]); k.lettuce(0.75, 0.3, 0.2, '#f2b8a8'); },
  chirashi: k => { k.plate('bowl', { r: 0.85, h: 0.36, fill: 0.62, mat: fm('#1f1e1d', { r: 0.25, cc: 1 }) }); k.disc(0, 0, 0.74, 0.03, '#ffffff', { map: TX.rice() }); k.y += 0.03; seed = 5; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; k.fillet(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.28, 0.14, ['#f08a6a', '#c9201a', '#f6f0e6', '#f2c84a'][i % 4], { h: 0.05, ry: -a, line: '#ffffff' }); } k.ball(0, 0, 0.12, '#f2802e', { bump: 0.15, freq: 60, r: 0.2, cc: 1, sy: 0.6 }); k.leaf(0.1, 0.15, 0.2, '#4f8a3a', { tilt: 0.1 }); },
  sashimi: k => { k.plate('ice'); const fish = [['#f08a6a', '#ffffff'], ['#c9201a', '#e04a3a'], ['#f6f0e6', '#d9c8b0']]; fish.forEach(([c, l], j) => { for (let i = 0; i < 4; i++) k.fillet(-0.45 + j * 0.45, -0.25 + i * 0.12, 0.3, 0.14, c, { h: 0.06, ry: 1.3, line: l, y: 0.03 + i * 0.02 }); }); k.leaf(0.5, 0.45, 0.3, '#4f8a3a', { tilt: 0.1 }); k.slice(-0.5, 0.45, 'lemon', { r: 0.12, rz: 0.4, y: 0.05 }); },
  toro: k => { k.plate('slate'); for (let i = 0; i < 3; i++) k.nigiri(-0.45 + i * 0.45, 0, '#f0a090', { line: '#fff6ee', ry: 0.2 }); k.put(mesh(bumpify(new THREE.SphereGeometry(0.06, 12, 8), 0.1, 30, 1), fm('#7a9a3a', { r: 0.8 })), 0.6, 0.0, 0.4); k.lettuce(0.75, 0.35, 0.15, '#f2b8a8'); },
};
// 沒有專屬擺盤的：用機器類型推一個合理的樣子
function fallbackFood(kind, id) {
  const it = kind === 'side' ? D.SIDES[id] : D.MEALS[id];
  return k => { k.plate('round'); k.dome(0, 0, 0.5, 0.3, it.color, { bump: 0.05 }); k.herbs(0, 0, 0.3, 20, '#3f7a2e', 0.3); };
}

export function buildDish(kind, id) {
  seed = hash(id);
  if (kind === 'drink') return buildDrink(id);
  const k = new Kit();
  (FOOD[id] || fallbackFood(kind, id))(k);
  return k.g;
}

// ================= 拍照 =================
let engine = null, scene, cam, rt, key, ground;
const W = 400, H = 320;
const photoCache = new Map(), iconCache = new Map(), pending = new Map();
const queue = [];
let busy = false;
export function initDishes(e) {
  engine = e;
  scene = new THREE.Scene();
  scene.environment = e.scene.environment; scene.environmentIntensity = 0.5;
  scene.add(new THREE.HemisphereLight('#fff6e8', '#8a7460', 0.55));
  key = new THREE.DirectionalLight('#fff1dc', 2.1); key.position.set(-2.4, 5, 1.6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -2.5; key.shadow.camera.right = 2.5; key.shadow.camera.top = 2.5; key.shadow.camera.bottom = -2.5; key.shadow.radius = 6; key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.45); fill.position.set(3, 2, 2); scene.add(fill);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.28 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  cam = new THREE.PerspectiveCamera(26, W / H, 0.1, 60);
  rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  pump();
}
const idle = fn => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 150 }) : setTimeout(fn, 20));
function pump() {
  if (busy || !queue.length || !engine) return;
  busy = true;
  idle(() => {
    const job = queue.shift();
    try { shoot(job); } catch (err) { console.warn('料理拍照失敗', job.id, err); photoCache.set(job.k, ''); iconCache.set(job.k, ''); }
    const cbs = pending.get(job.k) || []; pending.delete(job.k);
    for (const cb of cbs) cb(photoCache.get(job.k), iconCache.get(job.k));
    busy = false; pump();
  });
}
// 背景桌面：依類別換不同的桌布與小道具
function backdrop(g, kind, id) {
  seed = hash('bg' + id);
  const theme = kind === 'drink' ? ['linen', 'wood', 'marble'][hash(id) % 3] : kind === 'side' ? ['marble', 'pink', 'linen'][hash(id) % 3] : ['slate', 'linen', 'wood', 'navy'][hash(id) % 4];
  const pal = { linen: ['#efe7da', '#e2d6c2'], wood: ['#c9a27a', '#a8784a'], marble: ['#f4f2ee', '#dedad2'], pink: ['#f6e6e2', '#ecd2cc'], slate: ['#4a4d52', '#3a3c40'], navy: ['#2c3a56', '#22304a'] }[theme];
  const gr = g.createRadialGradient(W * 0.45, H * 0.4, 20, W * 0.5, H * 0.5, W * 0.75); gr.addColorStop(0, pal[0]); gr.addColorStop(1, pal[1]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (theme === 'wood') { for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(80,40,10,${rr(0.04, 0.1)})`; g.fillRect(0, i * H / 9, W, 2); } for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(90,50,20,${rr(0.03, 0.08)})`; g.beginPath(); const y = rr(0, H); g.moveTo(0, y); g.bezierCurveTo(W / 3, y + rr(-8, 8), W * 0.66, y + rr(-8, 8), W, y); g.stroke(); } }
  if (theme === 'marble' || theme === 'pink') { for (let i = 0; i < 7; i++) { g.strokeStyle = `rgba(150,140,130,${rr(0.08, 0.2)})`; g.lineWidth = rr(0.6, 2); g.beginPath(); let x = rr(0, W), y = 0; g.moveTo(x, y); while (y < H) { x += rr(-30, 30); y += rr(10, 40); g.lineTo(x, y); } g.stroke(); } }
  if (theme === 'linen' || theme === 'navy' || theme === 'slate') { for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${theme === 'linen' ? '120,100,70' : '255,255,255'},${rr(0.02, 0.06)})`; g.fillRect(rr(0, W), rr(0, H), rr(1, 3), 1); } }
  // 布巾
  if (rnd() < 0.5) { g.save(); g.translate(rr(-40, 40), H - rr(30, 60)); g.rotate(rr(-0.2, 0.2)); g.fillStyle = ['#f8f4ec', '#d9e2e8', '#efd9d2', '#e3e8d6'][hash(id) % 4]; g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 12; g.fillRect(-20, 0, W * 0.5, 120); g.shadowBlur = 0; g.strokeStyle = 'rgba(160,120,90,.35)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-20, 10 + i * 6); g.lineTo(W * 0.5 - 20, 10 + i * 6); g.stroke(); } g.restore(); }
  // 小道具：咖啡豆、花、葉子、香料
  const props = kind === 'drink' ? ['bean', 'bean', 'flower', 'leaf'] : kind === 'side' ? ['flower', 'flower', 'berry', 'leaf'] : ['leaf', 'pepper', 'flower', 'herb'];
  const spots = [[rr(10, 70), rr(10, 80)], [W - rr(20, 80), rr(10, 70)], [rr(10, 60), H - rr(20, 70)], [W - rr(20, 70), H - rr(20, 80)]];
  spots.forEach(([x, y], i) => {
    const p = props[(i + hash(id)) % props.length];
    g.save(); g.translate(x, y); g.rotate(rr(0, TAU)); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    if (p === 'bean') { for (let j = 0; j < 6; j++) { g.save(); g.translate(rr(-24, 24), rr(-18, 18)); g.rotate(rr(0, 3)); g.fillStyle = '#4a2a1a'; g.beginPath(); g.ellipse(0, 0, 7, 5, 0, 0, TAU); g.fill(); g.strokeStyle = '#2a140a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(0, 2, 5, 0); g.stroke(); g.restore(); } }
    else if (p === 'flower') { const col = ['#ffffff', '#f6d2dc', '#f8e8b0', '#d9d2f2'][hash(id + i) % 4]; for (let j = 0; j < 2; j++) { g.save(); g.translate(j * 26 - 10, j * 14); for (let k2 = 0; k2 < 5; k2++) { g.rotate(TAU / 5); g.fillStyle = col; g.beginPath(); g.ellipse(0, 8, 5.5, 9, 0, 0, TAU); g.fill(); } g.shadowBlur = 0; g.fillStyle = '#e9b23a'; g.beginPath(); g.arc(0, 0, 3.5, 0, TAU); g.fill(); g.restore(); } }
    else if (p === 'leaf') { g.fillStyle = '#7a9a7a'; g.strokeStyle = '#5a7a5a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -36); g.lineTo(0, 36); g.stroke(); for (let j = 0; j < 4; j++) for (const s of [-1, 1]) { g.save(); g.translate(0, -26 + j * 17); g.rotate(s * 0.9); g.beginPath(); g.ellipse(0, -8, 5, 9, 0, 0, TAU); g.fill(); g.restore(); } }
    else if (p === 'berry') { for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#2f3a6a' : '#c9203a'; g.beginPath(); g.arc(rr(-14, 14), rr(-12, 12), 6, 0, TAU); g.fill(); } }
    else if (p === 'pepper') { for (let j = 0; j < 12; j++) { g.fillStyle = j % 3 ? '#2a1a12' : '#a8402a'; g.beginPath(); g.arc(rr(-18, 18), rr(-14, 14), 3, 0, TAU); g.fill(); } }
    else if (p === 'herb') { g.strokeStyle = '#4f7a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.stroke(); g.fillStyle = '#5a8a3a'; for (let j = 0; j < 12; j++) { g.beginPath(); g.ellipse(-26 + j * 5, (j % 2 ? -1 : 1) * 4, 2, 6, (j % 2 ? -1 : 1) * 0.6, 0, TAU); g.fill(); } }
    g.restore();
  });
  // 柔光暈影
  const v = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,10,.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function shoot(job) {
  const { kind, id, k } = job;
  const dish = buildDish(kind, id);
  scene.add(dish);
  const box = new THREE.Box3().setFromObject(dish);
  const sph = box.getBoundingSphere(new THREE.Sphere());
  const center = sph.center.clone(); center.y = box.min.y + (box.max.y - box.min.y) * 0.42;
  const dir = new THREE.Vector3(0.0, 1.05, 1).normalize();
  const fov = cam.fov * Math.PI / 180;
  let dist = sph.radius / Math.sin(fov / 2);
  const corners = []; for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  const aim = center.clone();
  for (let it = 0; it < 4; it++) {
    cam.position.copy(aim).addScaledVector(dir, dist); cam.lookAt(aim); cam.near = dist * 0.2; cam.far = dist * 4; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const c of corners) { const p = c.clone().project(cam); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    // 置中：把投影範圍的中心移到畫面中心
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const halfH = Math.tan(fov / 2) * dist, halfW = halfH * cam.aspect;
    aim.addScaledVector(right, (x0 + x1) / 2 * halfW).addScaledVector(up, (y0 + y1) / 2 * halfH);
    const m = Math.max((x1 - x0) / 2 / 0.86, (y1 - y0) / 2 / 0.84);
    dist *= m;
  }
  cam.position.copy(aim).addScaledVector(dir, dist); cam.lookAt(aim); cam.near = dist * 0.2; cam.far = dist * 4; cam.updateProjectionMatrix();
  const r = engine.renderer;
  const prevT = r.getRenderTarget(), prevClear = r.getClearColor(new THREE.Color()), prevA = r.getClearAlpha(), prevNeeds = r.shadowMap.needsUpdate, prevAuto = r.shadowMap.autoUpdate;
  r.shadowMap.autoUpdate = true;
  r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear();
  r.render(scene, cam);
  const buf = new Uint8Array(W * H * 4);
  r.readRenderTargetPixels(rt, 0, 0, W, H, buf);
  r.setRenderTarget(prevT); r.setClearColor(prevClear, prevA); r.shadowMap.autoUpdate = prevAuto; r.shadowMap.needsUpdate = true; void prevNeeds;
  scene.remove(dish);
  dish.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  // 手機記憶體有限：程式貼圖累積太多就整批釋放（下次需要再畫）
  if (texCache.size > 36) { for (const t of texCache.values()) t.dispose(); texCache.clear(); for (const m of matCache.values()) m.dispose(); matCache.clear(); }
  // 翻轉成圖片
  const shot = document.createElement('canvas'); shot.width = W; shot.height = H;
  const sg = shot.getContext('2d'); const img = sg.createImageData(W, H);
  for (let y = 0; y < H; y++) img.data.set(buf.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
  sg.putImageData(img, 0, 0);
  // 卡片照片
  const card = document.createElement('canvas'); card.width = W; card.height = H;
  const cg = card.getContext('2d'); backdrop(cg, kind, id);
  cg.drawImage(shot, 0, 0);
  photoCache.set(k, card.toDataURL('image/jpeg', 0.86));
  // 小圖示：只留食物本身（去掉陰影太淡的部分），裁成正方形
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const a = img.data[(y * W + x) * 4 + 3]; if (a > 120) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const S = 128, ic = document.createElement('canvas'); ic.width = S; ic.height = S;
  if (x1 > x0) {
    const side = Math.max(x1 - x0, y1 - y0) + 8, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    ic.getContext('2d').drawImage(shot, cx - side / 2, cy - side / 2, side, side, 0, 0, S, S);
  }
  iconCache.set(k, ic.toDataURL('image/png'));
}
function request(kind, id, cb, urgent) {
  const k = kind + ':' + id;
  if (photoCache.has(k)) { cb && cb(photoCache.get(k), iconCache.get(k)); return; }
  if (pending.has(k)) {
    if (cb) pending.get(k).push(cb);
    if (urgent) { const i = queue.findIndex(q => q.k === k); if (i > 0) queue.unshift(queue.splice(i, 1)[0]); }
    return;
  }
  pending.set(k, cb ? [cb] : []);
  if (urgent) queue.unshift({ kind, id, k }); else queue.push({ kind, id, k });
  pump();
}
// 食譜卡片的照片（非同步）；urgent 會插隊（詳細頁用）
export function dishPhoto(kind, id, urgent = false) { return new Promise(res => request(kind, id, p => res(p), urgent)); }
// 小圖示：已經拍好就回傳圖片網址，還沒拍就回 null 並在背景排隊
export function dishIcon(kind, id) {
  const k = kind + ':' + id;
  if (iconCache.has(k)) return iconCache.get(k) || null;
  request(kind, id);
  return null;
}
export function dishReady(kind, id) { return iconCache.has(kind + ':' + id); }
