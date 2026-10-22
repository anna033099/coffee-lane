// 所有美術都由程式產生的 SVG：等角(isometric)家具、牆面、地板、角色、圖示
import { RECIPES, BEANS } from './data.js';

export const HW = 64, HH = 32, WALL_H = 200;
export const OUT = '#5a4033';

// 等角投影：格子座標 (x, y) + 高度 z → 畫面座標
export function P(x, y, z = 0) { return [(x - y) * HW, (x + y) * HH - z]; }
const f = n => Math.round(n * 10) / 10;
const ptsStr = a => a.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
export function poly(a, fill, extra = '') { return `<polygon points="${ptsStr(a)}" fill="${fill}" ${extra}/>`; }

export function shade(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

const OL = `stroke="${OUT}" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round"`;

// 等角立方體：只畫看得到的三個面（上、左前、右前）
export function box(x0, y0, z0, w, d, h, color, opt = {}) {
  const x1 = x0 + w, y1 = y0 + d, z1 = z0 + h;
  const top = opt.top || shade(color, 0.16), left = opt.left || color, right = opt.right || shade(color, -0.2);
  const st = opt.noStroke ? '' : OL;
  return poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], left, st)
    + poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], right, st)
    + poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top, st);
}
// 多個方塊依前後順序排序後再畫（遠的先畫）
function boxes(list) {
  return list.slice().sort((a, b) => (a[0] + a[3] / 2 + a[1] + a[4] / 2) - (b[0] + b[3] / 2 + b[1] + b[4] / 2) || a[2] - b[2])
    .map(b => box(...b)).join('');
}
// 等角圓柱
function cylinder(cx, cy, z0, r, h, color, opt = {}) {
  const [x, yb] = P(cx, cy, z0), yt = yb - h;
  const rx = r * 90.5, ry = r * 45.25;
  const side = opt.side || shade(color, -0.12), top = opt.top || shade(color, 0.12);
  return `<path d="M${f(x - rx)},${f(yb)} A${f(rx)},${f(ry)} 0 0 0 ${f(x + rx)},${f(yb)} L${f(x + rx)},${f(yt)} A${f(rx)},${f(ry)} 0 0 1 ${f(x - rx)},${f(yt)} Z" fill="${side}" ${OL}/>`
    + `<ellipse cx="${f(x)}" cy="${f(yt)}" rx="${f(rx)}" ry="${f(ry)}" fill="${top}" ${OL}/>`;
}
function isoEllipse(cx, cy, z, r, fill, extra = '') {
  const [x, y] = P(cx, cy, z);
  return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 90.5)}" ry="${f(r * 45.25)}" fill="${fill}" ${extra}/>`;
}
// 把平面 2D 圖畫「貼」在 x 軸方向的垂直面上（例如右牆、或面向左前方的板子）
function planeX(ox, oy, inner) { return `<g transform="matrix(1,0.5,0,1,${f(ox)},${f(oy)})">${inner}</g>`; }
function planeY(ox, oy, inner) { return `<g transform="matrix(1,-0.5,0,1,${f(ox)},${f(oy)})">${inner}</g>`; }

// ---------------- 家具 ----------------
const WOOD = '#a8714a', WOOD_D = '#7b4e33';

function chair(facing, o) {
  const L = [];
  const legC = o.leg || WOOD_D;
  if (o.sofa) {
    L.push([0.16, 0.16, 0, 0.68, 0.68, 26, o.seat]);
    const back = { px: [0.16, 0.16, 26, 0.16, 0.68, 30], nx: [0.68, 0.16, 26, 0.16, 0.68, 30], py: [0.16, 0.16, 26, 0.68, 0.16, 30], ny: [0.16, 0.68, 26, 0.68, 0.16, 30] }[facing];
    L.push([...back, shade(o.seat, -0.05)]);
    const arms = (facing === 'px' || facing === 'nx')
      ? [[0.16, 0.16, 26, 0.68, 0.12, 12], [0.16, 0.72, 26, 0.68, 0.12, 12]]
      : [[0.16, 0.16, 26, 0.12, 0.68, 12], [0.72, 0.16, 26, 0.12, 0.68, 12]];
    arms.forEach(a => L.push([...a, shade(o.seat, 0.05)]));
    return boxes(L);
  }
  [[0.26, 0.26], [0.68, 0.26], [0.26, 0.68], [0.68, 0.68]].forEach(([x, y]) => L.push([x, y, 0, 0.06, 0.06, 26, legC]));
  L.push([0.24, 0.24, 26, 0.52, 0.52, o.thick || 6, o.seat]);
  const bh = o.backH || 40, z = 26 + (o.thick || 6);
  const back = { px: [0.24, 0.24, z, 0.06, 0.52, bh], nx: [0.70, 0.24, z, 0.06, 0.52, bh], py: [0.24, 0.24, z, 0.52, 0.06, bh], ny: [0.24, 0.70, z, 0.52, 0.06, bh] }[facing];
  L.push([...back, o.back || o.seat]);
  return boxes(L);
}

function roundTable(top, post, r = 0.4, h = 48) {
  const [cx, cy] = P(0.5, 0.5, 0);
  return isoEllipse(0.5, 0.5, 0, 0.16, shade(post, -0.15), OL)
    + `<rect x="${cx - 3.5}" y="${cy - h}" width="7" height="${h}" fill="${post}" ${OL}/>`
    + cylinder(0.5, 0.5, h, r, 5, top);
}

function plant(pot = '#c9734f', leaf = '#5f9e6e') {
  const [cx, cy] = P(0.5, 0.5, 0);
  const leaves = [[-14, -52, 13], [12, -54, 13], [0, -66, 15], [-8, -78, 11], [10, -76, 11], [0, -42, 11]];
  return cylinder(0.5, 0.5, 0, 0.17, 26, pot)
    + leaves.map(([dx, dy, r], i) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="${i % 2 ? leaf : shade(leaf, 0.15)}" ${OL}/>`).join('');
}

function lamp() {
  const [cx, cy] = P(0.5, 0.5, 0);
  return `<circle cx="${cx}" cy="${cy - 112}" r="34" fill="url(#glow)"/>`
    + isoEllipse(0.5, 0.5, 0, 0.13, '#3d3230', OL)
    + `<rect x="${cx - 2}" y="${cy - 104}" width="4" height="104" fill="#3d3230"/>`
    + `<path d="M${cx - 10},${cy - 132} L${cx + 10},${cy - 132} L${cx + 19},${cy - 102} L${cx - 19},${cy - 102} Z" fill="#f6dfae" ${OL}/>`
    + `<ellipse cx="${cx}" cy="${cy - 102}" rx="19" ry="5" fill="#fff3c8" ${OL}/>`;
}

function sack() {
  const [cx, cy] = P(0.5, 0.5, 0);
  let beans = '';
  [[-8, -40], [0, -43], [8, -40], [-3, -37], [5, -36], [-11, -36], [10, -35]].forEach(([dx, dy]) => {
    beans += `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="3.4" ry="2.3" fill="#4a2a1a" transform="rotate(-25 ${cx + dx} ${cy + dy})"/>`;
  });
  return cylinder(0.5, 0.5, 0, 0.22, 34, '#c4a173', { side: '#b48f60', top: '#5b3826' }) + beans
    + `<path d="M${cx - 19},${cy - 18} Q${cx},${cy - 10} ${cx + 19},${cy - 18}" fill="none" stroke="#7a5a3a" stroke-width="2"/>`
    + `<text x="${cx}" y="${cy - 12}" font-size="8" text-anchor="middle" fill="#6b4a2a" font-weight="700">BEANS</text>`;
}

function bookshelf() {
  let s = box(0.1, 0.1, 0, 0.8, 0.8, 118, '#6e4a33');
  const cols = ['#c75c4f', '#4f7fa8', '#e2b54d', '#5f9e6e', '#9c6bb0', '#e08a5c', '#3f5f8f'];
  // 左前面的書
  for (let row = 0; row < 3; row++) {
    const z0 = 8 + row * 38, z1 = z0 + 28;
    let x = 0.14, i = row;
    while (x < 0.84) {
      const w = 0.07 + ((i * 37) % 5) * 0.012, hz = z1 - ((i * 13) % 3) * 4;
      s += poly([P(x, 0.9, z0), P(x + w, 0.9, z0), P(x + w, 0.9, hz), P(x, 0.9, hz)], cols[i % cols.length], 'stroke="#3d2a20" stroke-opacity=".4" stroke-width=".8"');
      x += w + 0.01; i++;
    }
    s += poly([P(0.1, 0.9, z0 - 3), P(0.9, 0.9, z0 - 3), P(0.9, 0.9, z0), P(0.1, 0.9, z0)], '#5a3a28');
  }
  // 右前面
  for (let row = 0; row < 3; row++) {
    const z0 = 8 + row * 38, z1 = z0 + 26;
    let y = 0.14, i = row + 3;
    while (y < 0.84) {
      const w = 0.08 + ((i * 29) % 4) * 0.012;
      s += poly([P(0.9, y, z0), P(0.9, y + w, z0), P(0.9, y + w, z1), P(0.9, y, z1)], shade(cols[i % cols.length], -0.2), 'stroke="#3d2a20" stroke-opacity=".4" stroke-width=".8"');
      y += w + 0.012; i++;
    }
  }
  return s;
}

function easel() {
  const [ox, oy] = P(0.16, 0.55, 100);
  const legs = `<line x1="${P(0.22, 0.55, 0)[0]}" y1="${P(0.22, 0.55, 0)[1]}" x2="${P(0.3, 0.55, 104)[0]}" y2="${P(0.3, 0.55, 104)[1]}" stroke="${WOOD_D}" stroke-width="4" stroke-linecap="round"/>`
    + `<line x1="${P(0.8, 0.55, 0)[0]}" y1="${P(0.8, 0.55, 0)[1]}" x2="${P(0.72, 0.55, 104)[0]}" y2="${P(0.72, 0.55, 104)[1]}" stroke="${WOOD_D}" stroke-width="4" stroke-linecap="round"/>`
    + `<line x1="${P(0.5, 0.3, 0)[0]}" y1="${P(0.5, 0.3, 0)[1]}" x2="${P(0.5, 0.5, 100)[0]}" y2="${P(0.5, 0.5, 100)[1]}" stroke="${WOOD_D}" stroke-width="3" stroke-linecap="round"/>`;
  const board = `<rect x="0" y="0" width="44" height="78" rx="2" fill="${WOOD}" stroke="${OUT}" stroke-opacity=".6"/>
    <rect x="4" y="4" width="36" height="70" fill="#2f4a3e"/>
    <text x="22" y="18" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">MENU</text>
    <line x1="9" y1="28" x2="35" y2="28" stroke="#f3eadc" stroke-width="1.4" stroke-dasharray="3 2"/>
    <line x1="9" y1="38" x2="31" y2="38" stroke="#f3eadc" stroke-width="1.4" stroke-dasharray="3 2"/>
    <line x1="9" y1="48" x2="34" y2="48" stroke="#f3eadc" stroke-width="1.4" stroke-dasharray="3 2"/>
    <circle cx="30" cy="62" r="5" fill="none" stroke="#f2b7a4" stroke-width="1.4"/>`;
  return legs + planeX(ox, oy, board);
}

function monstera() {
  const [cx, cy] = P(0.5, 0.5, 0);
  const leaf = (dx, dy, rot, s) => `<g transform="translate(${cx + dx} ${cy + dy}) rotate(${rot}) scale(${s})">
    <path d="M0,0 C-18,-6 -20,-30 0,-38 C20,-30 18,-6 0,0 Z" fill="#3f8a5a" ${OL}/>
    <path d="M0,-2 L0,-34 M0,-14 L-10,-20 M0,-22 L9,-28 M0,-10 L10,-14" stroke="#7cc08e" stroke-width="1.4" fill="none"/>
    <path d="M-9,-22 L-15,-21 M8,-12 L15,-13" stroke="#f6efe1" stroke-width="2"/></g>`;
  return leaf(-16, -48, -55, 1.15) + leaf(16, -50, 50, 1.15) + leaf(-6, -62, -18, 1.25) + leaf(10, -64, 20, 1.1)
    + cylinder(0.5, 0.5, 0, 0.2, 30, '#efe6d6') + leaf(0, -40, 0, 0.9);
}

function gramophone() {
  const [cx, cy] = P(0.5, 0.5, 0);
  return box(0.2, 0.2, 0, 0.6, 0.6, 40, '#8b5a36')
    + isoEllipse(0.5, 0.5, 41, 0.22, '#2a2220', OL)
    + `<path d="M${cx},${cy - 44} L${cx - 4},${cy - 70} Q${cx - 10},${cy - 92} ${cx - 34},${cy - 104}" fill="none" stroke="#a87b2c" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M${cx - 26},${cy - 96} Q${cx - 34},${cy - 122} ${cx - 62},${cy - 120} Q${cx - 50},${cy - 96} ${cx - 44},${cy - 84} Q${cx - 36},${cy - 92} ${cx - 26},${cy - 96} Z" fill="#e2b84f" ${OL}/>`
    + `<ellipse cx="${cx - 53}" cy="${cy - 103}" rx="10" ry="19" transform="rotate(-38 ${cx - 53} ${cy - 103})" fill="#8b6a1e" ${OL}/>`;
}

export function furnitureSVG(type, facing = 'px') {
  switch (type) {
    case 'table_round': return roundTable(WOOD, WOOD_D);
    case 'table_marble': return roundTable('#efebe5', '#c9a13b', 0.4, 48)
      + (() => { const [x, y] = P(0.5, 0.5, 53); return `<path d="M${x - 22},${y - 3} q8,4 14,-2 t16,3" fill="none" stroke="#b8b1a8" stroke-width="1.2"/>`; })();
    case 'table_iron': {
      const [cx, cy] = P(0.5, 0.5, 0);
      return `<path d="M${cx - 18},${cy + 6} Q${cx - 6},${cy - 20} ${cx},${cy - 46} M${cx + 18},${cy + 6} Q${cx + 6},${cy - 20} ${cx},${cy - 46} M${cx},${cy + 12} L${cx},${cy - 46}" stroke="#2e2a2a" stroke-width="3" fill="none" stroke-linecap="round"/>`
        + cylinder(0.5, 0.5, 46, 0.36, 5, '#6b4430');
    }
    case 'table_square': return boxes([
      [0.16, 0.16, 0, 0.06, 0.06, 44, WOOD_D], [0.78, 0.16, 0, 0.06, 0.06, 44, WOOD_D],
      [0.16, 0.78, 0, 0.06, 0.06, 44, WOOD_D], [0.78, 0.78, 0, 0.06, 0.06, 44, WOOD_D],
    ]) + box(0.12, 0.12, 44, 0.76, 0.76, 6, '#c08a5c');
    case 'chair_wood': return chair(facing, { seat: '#b8804f', back: '#a8714a' });
    case 'chair_fabric': return chair(facing, { seat: '#d97b6c', back: '#d97b6c', thick: 8, leg: '#5a3a28' });
    case 'chair_arm': return chair(facing, { sofa: true, seat: '#5f8f88' });
    case 'chair_rattan': return chair(facing, { seat: '#d9b47a', back: '#c99d5c', backH: 50, leg: '#a57a40' });
    case 'plant': return plant();
    case 'lamp': return lamp();
    case 'sack': return sack();
    case 'bookshelf': return bookshelf();
    case 'easel': return easel();
    case 'monstera': return monstera();
    case 'gramophone': return gramophone();
    default: return box(0.2, 0.2, 0, 0.6, 0.6, 30, '#999');
  }
}

// 牆上的物件：畫在「牆面座標」裡（x 0~64 沿牆，y 向上為負）
export function wallItemSVG(type) {
  switch (type) {
    case 'painting': return `<rect x="12" y="-152" width="40" height="50" rx="2" fill="#8a5a3c" stroke="${OUT}" stroke-opacity=".6"/>
      <rect x="16" y="-148" width="32" height="42" fill="#f6ecd8"/>
      <circle cx="38" cy="-136" r="6" fill="#f0a35e"/>
      <path d="M16,-112 L26,-128 L34,-118 L40,-124 L48,-112 L48,-106 L16,-106 Z" fill="#7fae8a"/>`;
    case 'clock': return `<circle cx="32" cy="-138" r="18" fill="#fffaf0" stroke="#6b4a3a" stroke-width="3"/>
      <line x1="32" y1="-138" x2="32" y2="-150" stroke="#3b2a22" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="32" y1="-138" x2="41" y2="-134" stroke="#3b2a22" stroke-width="2" stroke-linecap="round"/>
      <circle cx="32" cy="-138" r="2" fill="#c75c4f"/>`;
    case 'window': return `<rect x="8" y="-172" width="48" height="84" rx="3" fill="#fbf7ef" stroke="${OUT}" stroke-opacity=".6"/>
      <rect x="12" y="-168" width="40" height="76" fill="url(#sky)"/>
      <circle cx="40" cy="-150" r="5" fill="#fff6c9" opacity=".9"/>
      <path d="M12,-108 Q22,-118 32,-110 T52,-112 L52,-92 L12,-92 Z" fill="#9cc7a4" opacity=".85"/>
      <line x1="32" y1="-168" x2="32" y2="-92" stroke="#fbf7ef" stroke-width="3"/>
      <line x1="12" y1="-130" x2="52" y2="-130" stroke="#fbf7ef" stroke-width="3"/>
      <rect x="5" y="-90" width="54" height="5" fill="#e9dcc8" stroke="${OUT}" stroke-opacity=".4"/>`;
    case 'shelfplant': return `<rect x="6" y="-114" width="52" height="6" fill="#a8714a" stroke="${OUT}" stroke-opacity=".5"/>
      <path d="M12,-108 L12,-100 L20,-108 Z M44,-108 L52,-100 L52,-108 Z" fill="#7b4e33"/>
      <rect x="10" y="-128" width="12" height="14" rx="2" fill="#e8b49a"/><circle cx="16" cy="-133" r="7" fill="#5f9e6e"/>
      <rect x="27" y="-126" width="10" height="12" rx="2" fill="#f1ece4"/><path d="M32,-126 q-8,-10 -2,-18 q4,8 2,18 q6,-8 8,-14 q0,10 -8,14" fill="#7fae5b"/>
      <rect x="42" y="-128" width="12" height="14" rx="2" fill="#9cc3d8"/><circle cx="45" cy="-133" r="5" fill="#4f8a5e"/><circle cx="51" cy="-135" r="5" fill="#6aa877"/>`;
    case 'neon': return `<rect x="4" y="-162" width="56" height="42" rx="7" fill="#2a2230" stroke="${OUT}"/>
      <text x="32" y="-145" font-size="12" font-weight="900" text-anchor="middle" fill="#ff8fb4" filter="url(#neonGlow)" font-family="sans-serif">COFFEE</text>
      <path d="M22,-136 h20 v6 a10,6 0 0 1 -20,0 Z M42,-134 a4,4 0 0 1 0,8" fill="none" stroke="#7ef0e0" stroke-width="2" filter="url(#neonGlow)"/>`;
    case 'door': return `<rect x="8" y="-152" width="48" height="152" rx="3" fill="#6b4a3a" stroke="${OUT}" stroke-opacity=".6"/>
      <rect x="14" y="-144" width="36" height="88" rx="2" fill="url(#sky)" opacity=".9"/>
      <rect x="20" y="-118" width="24" height="12" rx="2" fill="#fffaf0" stroke="#6b4a3a"/>
      <text x="32" y="-109" font-size="7" font-weight="900" text-anchor="middle" fill="#c75c4f">OPEN</text>
      <circle cx="47" cy="-46" r="3" fill="#e2b84f"/>`;
    default: return '';
  }
}

// ---------------- 吧台與機器 ----------------
export function counterSVG(kind) {
  let s = box(0, 0.08, 0, 1, 0.92, 62, '#8b5e3c', { top: '#9a6b47' })
    + poly([P(0.04, 1, 8), P(0.96, 1, 8), P(0.96, 1, 54), P(0.04, 1, 54)], 'none', `stroke="#6e4a2f" stroke-width="1.5"`)
    + box(-0.02, 0.05, 62, 1.04, 0.98, 8, '#ece3d6', { left: '#d9cdbd', right: '#c9bcab' });
  if (kind === 'register') {
    s += box(0.3, 0.3, 70, 0.4, 0.4, 16, '#3b3f46') + box(0.38, 0.32, 86, 0.24, 0.1, 18, '#2a2d33', { left: '#9fd3c7' });
  } else if (kind === 'case') {
    s += box(0.12, 0.2, 70, 0.76, 0.66, 30, '#dff0f2', { top: 'rgba(235,248,250,.55)', left: 'rgba(215,236,240,.55)', right: 'rgba(195,222,228,.55)' });
    s += cylinder(0.35, 0.55, 72, 0.08, 8, '#f2c4c4') + cylinder(0.6, 0.45, 72, 0.08, 8, '#f4e1b5') + cylinder(0.62, 0.72, 72, 0.07, 8, '#8a5a3c');
  }
  return s;
}

export function machineSVG(type) {
  if (type === 'roaster') {
    const [ox, oy] = P(0.18, 0.82, 112);
    return box(0.18, 0.26, 70, 0.64, 0.56, 42, '#b5533c')
      + planeX(ox, oy, `<circle cx="20" cy="22" r="13" fill="#3a2a26" stroke="#e2b84f" stroke-width="2.5"/><circle cx="20" cy="22" r="5" fill="#6b4a3a"/><rect x="38" y="10" width="20" height="5" rx="2" fill="#e2b84f"/>`)
      + (() => { const [x, y] = P(0.5, 0.54, 112); return `<path d="M${x - 9},${y} L${x - 16},${y - 22} L${x + 16},${y - 22} L${x + 9},${y} Z" fill="#c9cdd1" ${OL}/>`; })()
      + box(0.66, 0.3, 112, 0.08, 0.08, 34, '#4a4a4f');
  }
  const [ox, oy] = P(0.15, 0.82, 106);
  return box(0.15, 0.28, 70, 0.7, 0.54, 40, '#cfd6da', { top: '#e7ecee' })
    + planeX(ox, oy, `<rect x="6" y="8" width="52" height="8" rx="2" fill="#8d979c"/><rect x="12" y="18" width="10" height="7" rx="1" fill="#2f3336"/><rect x="40" y="18" width="10" height="7" rx="1" fill="#2f3336"/><circle cx="31" cy="8" r="3" fill="#d9775f"/>`)
    + box(0.2, 0.86, 70, 0.6, 0.1, 3, '#7d868b')
    + cylinder(0.32, 0.45, 110, 0.06, 7, '#fffaf0') + cylinder(0.5, 0.45, 110, 0.06, 7, '#fffaf0') + cylinder(0.68, 0.45, 110, 0.06, 7, '#fffaf0');
}

// ---------------- 地板與牆面圖樣 ----------------
export function floorPattern(theme, id) {
  const tf = `patternTransform="matrix(64,32,-64,32,0,0)"`;
  switch (theme) {
    case 'checker': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="2" height="2" ${tf}>
      <rect width="2" height="2" fill="#f1ece4"/><rect width="1" height="1" fill="#3e3836"/><rect x="1" y="1" width="1" height="1" fill="#3e3836"/></pattern>`;
    case 'herring': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="1" height="1" ${tf}>
      <rect width="1" height="1" fill="#b88358"/>
      <rect x="0" y="0" width=".5" height=".165" fill="#c99668"/><rect x="0" y=".333" width=".5" height=".165" fill="#c99668"/>
      <rect x=".5" y=".5" width=".5" height=".165" fill="#c99668"/><rect x=".5" y=".833" width=".5" height=".165" fill="#c99668"/>
      <rect x=".5" y="0" width=".165" height=".5" fill="#a87650"/><rect x=".833" y="0" width=".165" height=".5" fill="#a87650"/>
      <rect x="0" y=".5" width=".165" height=".5" fill="#a87650"/><rect x=".333" y=".5" width=".165" height=".5" fill="#a87650"/></pattern>`;
    case 'terrazzo': {
      const chips = [[.12, .2, '#c97b63'], [.42, .12, '#7fa38f'], [.75, .3, '#d9b46a'], [.3, .55, '#8e8a85'], [.62, .66, '#c97b63'], [.88, .82, '#7fa38f'], [.18, .86, '#d9b46a'], [.55, .9, '#8e8a85'], [.85, .52, '#e3a9a0']];
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="1" height="1" ${tf}><rect width="1" height="1" fill="#e8e2d8"/>
        ${chips.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r=".035" fill="${c}"/>`).join('')}</pattern>`;
    }
    default: return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="2" height=".5" ${tf}>
      <rect width="2" height=".5" fill="#cfa274"/>
      <rect y=".235" width="2" height=".015" fill="#a77a52"/><rect y=".485" width="2" height=".015" fill="#a77a52"/>
      <rect x=".9" width=".02" height=".25" fill="#a77a52"/><rect x="1.6" y=".25" width=".02" height=".25" fill="#a77a52"/>
      <rect x="0" y=".25" width="2" height=".235" fill="#c99b6c"/></pattern>`;
  }
}

export function wallPattern(theme, id, side) {
  const tf = side === 'R' ? `patternTransform="matrix(1,0.5,0,1,0,${-WALL_H})"` : `patternTransform="matrix(-1,0.5,0,1,0,${-WALL_H})"`;
  switch (theme) {
    case 'stripe': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="28" height="${WALL_H}" ${tf}>
      <rect width="28" height="${WALL_H}" fill="#eef2e4"/><rect x="0" width="10" height="${WALL_H}" fill="#a9cdb0"/>
      <rect y="${WALL_H - 40}" width="28" height="40" fill="#f6f1e6"/><rect y="${WALL_H - 42}" width="28" height="3" fill="#8aa98f"/></pattern>`;
    case 'brick': {
      let b = '';
      for (let r = 0; r < WALL_H / 14; r++) {
        const off = r % 2 ? 0 : -16;
        for (let c = -1; c < 3; c++) b += `<rect x="${off + c * 32 + 1}" y="${r * 14 + 1}" width="30" height="12" rx="1.5" fill="${['#b8644b', '#ad5a43', '#c06f55'][(r + c + 3) % 3]}"/>`;
      }
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="64" height="${WALL_H}" ${tf}><rect width="64" height="${WALL_H}" fill="#e7cdb8"/>${b}</pattern>`;
    }
    case 'navy': return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="40" height="${WALL_H}" ${tf}>
      <rect width="40" height="${WALL_H}" fill="#304768"/><rect y="${WALL_H - 86}" width="40" height="86" fill="#3c5782"/>
      <rect x="5" y="${WALL_H - 76}" width="30" height="62" fill="none" stroke="#2b3f60" stroke-width="2"/>
      <rect y="${WALL_H - 90}" width="40" height="5" fill="#c9a13b"/></pattern>`;
    default: return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="${WALL_H}" ${tf}>
      <rect width="24" height="${WALL_H}" fill="#f3e7d3"/><circle cx="6" cy="8" r="1.3" fill="#e5d3b7"/><circle cx="18" cy="20" r="1.3" fill="#e5d3b7"/>
      <rect y="${WALL_H - 50}" width="24" height="50" fill="#e8d6bc"/><rect y="${WALL_H - 52}" width="24" height="3" fill="#c9ad88"/></pattern>`;
  }
}

export function sharedDefs() {
  return `<radialGradient id="glow"><stop offset="0" stop-color="#fff3c0" stop-opacity=".75"/><stop offset="1" stop-color="#fff3c0" stop-opacity="0"/></radialGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d8f0"/><stop offset="1" stop-color="#e4f3f7"/></linearGradient>
  <filter id="neonGlow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3b2a22" flood-opacity=".25"/></filter>`;
}

// ---------------- 角色 ----------------
const HAIR_STYLES = ['short', 'bob', 'long', 'bun', 'curly', 'spiky'];
export const SKINS = ['#f6d7bd', '#f1c7a5', '#dca983', '#b9825c'];
export const HAIRS = ['#3b2a22', '#5a3a2a', '#8a5a3c', '#c9894f', '#2c2c34', '#a85a4a', '#d9b26a'];
export const SHIRTS = ['#e48a7a', '#7fb3c9', '#f2c45e', '#8cc7a3', '#b59ad6', '#f4a6c0', '#6f8fd0', '#e9e3d7', '#d7865a'];
export const PANTS = ['#4a4f63', '#5b4a40', '#3e5a74', '#6d6a64', '#2f3036'];

export function randomLook(rand = Math.random) {
  const pick = a => a[Math.floor(rand() * a.length)];
  return { skin: pick(SKINS), hair: pick(HAIRS), style: pick(HAIR_STYLES), shirt: pick(SHIRTS), pants: pick(PANTS) };
}

function hairFront(style, c) {
  switch (style) {
    case 'bob': return `<path d="M-20,-62 Q-23,-91 0,-89 Q23,-91 20,-62 L20,-52 Q16,-50 14,-55 L14,-71 Q0,-78 -14,-71 L-14,-55 Q-16,-50 -20,-52 Z" fill="${c}" ${OL}/>`;
    case 'long': return `<path d="M-20,-62 Q-23,-91 0,-89 Q23,-91 20,-62 L19,-60 Q12,-74 0,-75 Q-12,-74 -19,-60 Z" fill="${c}" ${OL}/>`;
    case 'bun': return `<circle cx="0" cy="-91" r="9" fill="${c}" ${OL}/><path d="M-19,-64 Q-20,-89 0,-88 Q20,-89 19,-64 Q13,-76 0,-75 Q-12,-77 -19,-64 Z" fill="${c}" ${OL}/>`;
    case 'curly': return [[-15, -76], [-7, -84], [3, -86], [12, -81], [17, -71], [-18, -67]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}" ${OL}/>`).join('');
    case 'spiky': return `<path d="M-19,-64 L-22,-80 L-13,-78 L-12,-92 L-3,-84 L2,-95 L8,-84 L16,-90 L15,-78 L23,-78 L19,-64 Q10,-74 0,-73 Q-10,-74 -19,-64 Z" fill="${c}" ${OL}/>`;
    default: return `<path d="M-19,-64 Q-20,-89 0,-88 Q20,-89 19,-64 Q13,-76 0,-75 Q-12,-77 -19,-64 Z" fill="${c}" ${OL}/>`;
  }
}

// 角色：腳底在 (0,0)；預設臉朝左下，dir=1 時水平翻轉朝右
export function characterSVG(look, o = {}) {
  const { back = false, carry = false, sit = false, staff = false, uniform = '#d9775f', step = 0, mood = '' } = o;
  let s = `<ellipse cx="0" cy="0" rx="15" ry="5.5" fill="#000" opacity=".16"/>`;
  // 長髮在頭後
  if (look.style === 'long') s += `<path d="M-20,-70 Q-24,-46 -16,-40 L16,-40 Q24,-46 20,-70 Z" fill="${look.hair}" ${OL}/>`;
  // 腿
  if (sit) {
    s += `<rect x="-15" y="-27" width="18" height="9" rx="3" fill="${look.pants}" ${OL}/><ellipse cx="-15" cy="-20" rx="4.5" ry="3" fill="#3b2a22"/>`;
  } else {
    const a = step * 3;
    s += `<rect x="-9" y="${-23 + Math.max(0, a)}" width="7" height="${21 - Math.abs(a) * 0.3}" rx="2" fill="${look.pants}" ${OL}/>`
      + `<rect x="2" y="${-23 + Math.max(0, -a)}" width="7" height="${21 - Math.abs(a) * 0.3}" rx="2" fill="${look.pants}" ${OL}/>`
      + `<ellipse cx="-5.5" cy="${-1 + Math.max(0, a) * 0.3}" rx="5" ry="3" fill="#3b2a22"/><ellipse cx="5.5" cy="${-1 + Math.max(0, -a) * 0.3}" rx="5" ry="3" fill="#3b2a22"/>`;
  }
  // 身體
  s += `<path d="M-14,-47 Q-14,-51 -9,-51 L9,-51 Q14,-51 14,-47 L16,-21 L-16,-21 Z" fill="${look.shirt}" ${OL}/>`;
  if (staff && !back) s += `<path d="M-10,-44 L10,-44 L13,-21 L-13,-21 Z" fill="${uniform}" ${OL}/><path d="M-6,-44 L-9,-51 M6,-44 L9,-51" stroke="${uniform}" stroke-width="2"/><rect x="-4" y="-36" width="8" height="5" rx="1" fill="${shade(uniform, 0.3)}"/>`;
  if (staff && back) s += `<path d="M-12,-30 L12,-30" stroke="${uniform}" stroke-width="3"/><path d="M0,-30 l-5,8 M0,-30 l5,8" stroke="${uniform}" stroke-width="2.4" stroke-linecap="round"/>`;
  // 手臂
  s += `<path d="M-13,-46 L-18,-29" stroke="${look.shirt}" stroke-width="7" stroke-linecap="round"/><circle cx="-18.5" cy="-27.5" r="3.6" fill="${look.skin}" ${OL}/>`;
  if (carry) {
    s += `<path d="M13,-46 L18,-37 L10,-36" stroke="${look.shirt}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
      + `<ellipse cx="-4" cy="-38" rx="12" ry="3.5" fill="#c9cdd1" ${OL}/><path d="M-9,-46 L-8,-39 L0,-39 L1,-46 Z" fill="#fffaf0" ${OL}/><ellipse cx="-4" cy="-46" rx="5" ry="1.6" fill="#6b3e26"/>`;
  } else {
    s += `<path d="M13,-46 L18,-29" stroke="${look.shirt}" stroke-width="7" stroke-linecap="round"/><circle cx="18.5" cy="-27.5" r="3.6" fill="${look.skin}" ${OL}/>`;
  }
  // 頭
  s += `<rect x="-4" y="-53" width="8" height="5" fill="${look.skin}"/><circle cx="0" cy="-68" r="18.5" fill="${look.skin}" ${OL}/>`;
  if (back) {
    s += `<path d="M-19.5,-66 Q-21,-90 0,-89 Q21,-90 19.5,-66 Q19,-56 12,-52 L-12,-52 Q-19,-56 -19.5,-66 Z" fill="${look.hair}" ${OL}/>`;
    if (look.style === 'bun') s += `<circle cx="0" cy="-91" r="9" fill="${look.hair}" ${OL}/>`;
    if (look.style === 'curly') s += hairFront('curly', look.hair);
  } else {
    // 臉（稍微偏左表示朝左下）
    const ey = -66;
    if (mood === 'sad') {
      s += `<path d="M-11,${ey - 1} l5,2 M2,${ey + 1} l5,-2" stroke="#2c1d17" stroke-width="2" stroke-linecap="round"/><path d="M-6,${ey + 11} q3,-4 6,0" stroke="#2c1d17" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    } else if (mood === 'happy') {
      s += `<path d="M-11,${ey + 1} q3,-4 6,0 M1,${ey + 1} q3,-4 6,0" stroke="#2c1d17" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-7,${ey + 8} q4,5 8,0" stroke="#2c1d17" stroke-width="1.6" fill="#e07070" stroke-linecap="round"/>`;
    } else if (mood === 'tired') {
      s += `<path d="M-11,${ey} h6 M1,${ey} h6" stroke="#2c1d17" stroke-width="2" stroke-linecap="round"/><ellipse cx="-2" cy="${ey + 10}" rx="2.4" ry="1.6" fill="#2c1d17"/>`;
    } else {
      s += `<ellipse cx="-8" cy="${ey}" rx="2.4" ry="3.2" fill="#2c1d17"/><ellipse cx="4" cy="${ey}" rx="2.4" ry="3.2" fill="#2c1d17"/>`
        + `<circle cx="-7.3" cy="${ey - 1.2}" r=".9" fill="#fff"/><circle cx="4.7" cy="${ey - 1.2}" r=".9" fill="#fff"/>`
        + `<path d="M-5,${ey + 8} q3,3 6,0" stroke="#2c1d17" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    }
    s += `<ellipse cx="-13" cy="${ey + 6}" rx="3.4" ry="2" fill="#f19a95" opacity=".55"/><ellipse cx="9" cy="${ey + 6}" rx="3.4" ry="2" fill="#f19a95" opacity=".55"/>`;
    s += hairFront(look.style, look.hair);
  }
  return s;
}

// ---------------- 圖示 ----------------
export function cupIcon(cupDef, size = 40) {
  const c = typeof cupDef === 'string' ? RECIPES[cupDef].cup : cupDef;
  const liq = c.layers;
  let body = '', extra = '';
  if (c.type === 'small' || c.type === 'fancy') {
    const rim = c.type === 'fancy' ? '#e2b84f' : '#fffaf0';
    body = `<ellipse cx="20" cy="33" rx="15" ry="4" fill="#fffaf0" ${OL}/>
      <path d="M10,18 L12,29 Q20,34 28,29 L30,18 Z" fill="#fffaf0" ${OL}/>
      <path d="M30,20 q6,1 4,6 q-1,3 -5,2" fill="none" stroke="#fffaf0" stroke-width="3"/><path d="M30,20 q6,1 4,6 q-1,3 -5,2" fill="none" stroke="${OUT}" stroke-opacity=".5" stroke-width="1"/>
      <ellipse cx="20" cy="18" rx="10" ry="3" fill="${liq[0]}" stroke="${rim}" stroke-width="1.6"/>`;
    if (c.type === 'fancy') extra += `<path d="M12,23 Q20,26 28,23" stroke="#e2b84f" stroke-width="1.2" fill="none"/>`;
  } else if (c.type === 'mug') {
    body = `<path d="M9,12 L11,33 Q20,36 29,33 L31,12 Z" fill="#fffaf0" ${OL}/>
      <path d="M31,16 q8,1 7,8 q-1,6 -8,5" fill="none" stroke="#fffaf0" stroke-width="4"/><path d="M31,16 q8,1 7,8 q-1,6 -8,5" fill="none" stroke="${OUT}" stroke-opacity=".5" stroke-width="1"/>
      <ellipse cx="20" cy="12" rx="11" ry="3.2" fill="${liq[0]}" ${OL}/>`;
  } else {
    const tall = c.type === 'tall';
    const top = tall ? 4 : 9;
    let layers = '';
    const n = liq.length, h = 33 - top - 2;
    liq.forEach((col, i) => {
      const y0 = 33 - (h / n) * (i + 1), y1 = 33 - (h / n) * i;
      layers += `<rect x="11" y="${y0}" width="18" height="${y1 - y0}" fill="${col}"/>`;
    });
    body = `<path d="M10,${top} L12,34 Q20,36 28,34 L30,${top} Z" fill="#eaf6f8" opacity=".9" ${OL}/>
      <clipPath id="cl${size}${c.type}${liq.join('').replace(/#/g, '')}"><path d="M10,${top} L12,34 Q20,36 28,34 L30,${top} Z"/></clipPath>
      <g clip-path="url(#cl${size}${c.type}${liq.join('').replace(/#/g, '')})">${layers}</g>
      <path d="M10,${top} L12,34 Q20,36 28,34 L30,${top} Z" fill="none" ${OL}/>`;
    if (tall) extra += `<rect x="14" y="10" width="6" height="6" rx="1" fill="#fff" opacity=".7"/><rect x="20" y="15" width="6" height="6" rx="1" fill="#fff" opacity=".6"/><path d="M24,0 L22,24" stroke="#e48a7a" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  const ty = c.type === 'mug' ? 12 : c.type === 'glass' ? 9 : c.type === 'tall' ? 4 : 18;
  switch (c.top) {
    case 'crema': extra += `<ellipse cx="20" cy="${ty}" rx="7" ry="2" fill="#c98b4f" opacity=".8"/>`; break;
    case 'foam': extra += `<ellipse cx="20" cy="${ty + 1}" rx="10" ry="3" fill="#fffaf0"/>`; break;
    case 'heart': extra += `<path d="M20,${ty + 2} c-5,-3 -4,-6 -1,-5 q1,0 1,1 q0,-1 1,-1 c3,-1 4,2 -1,5 Z" fill="#fffaf0"/>`; break;
    case 'drizzle': extra += `<ellipse cx="20" cy="${ty + 1}" rx="10" ry="3" fill="#fffaf0"/><path d="M12,${ty + 1} l3,-2 l3,3 l3,-3 l3,3 l3,-3 l3,2" stroke="#c47a2c" stroke-width="1.6" fill="none"/>`; break;
    case 'cocoa': extra += `<ellipse cx="20" cy="${ty}" rx="9" ry="2.6" fill="#e9d4b8"/><circle cx="17" cy="${ty}" r=".9" fill="#5b3a29"/><circle cx="21" cy="${ty - 1}" r=".9" fill="#5b3a29"/><circle cx="23" cy="${ty + 1}" r=".9" fill="#5b3a29"/>`; break;
    case 'cream': extra += `<path d="M10,${ty} q0,-7 5,-6 q2,-6 7,-4 q5,-3 6,3 q4,1 2,7 Z" fill="#fffaf0" ${OL}/>`; break;
    case 'stick': extra += `<rect x="22" y="${ty - 10}" width="3" height="14" rx="1" fill="#9a5a33" transform="rotate(20 23 ${ty})"/>`; break;
    case 'gold': extra += `<path d="M31,6 l1,3 l3,1 l-3,1 l-1,3 l-1,-3 l-3,-1 l3,-1 Z" fill="#e2b84f"/>`; break;
    default: break;
  }
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${body}${extra}</svg>`;
}

export function beanIcon(beanId, roasted = false, size = 40) {
  const b = BEANS[beanId];
  if (roasted) {
    const bean = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="8" ry="5.6" fill="#5a3322" ${OL}/><path d="M${x - 6},${y} q6,-2.5 12,0" stroke="#2c170f" stroke-width="1.3" fill="none"/></g>`;
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${bean(14, 24, -25)}${bean(25, 18, 20)}${bean(24, 29, -10)}<circle cx="33" cy="9" r="5" fill="${b.color}" ${OL}/></svg>`;
  }
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">
    <path d="M10,12 Q8,30 12,35 L28,35 Q32,30 30,12 Z" fill="#d8bf93" ${OL}/>
    <path d="M10,12 L14,6 L26,6 L30,12 Z" fill="#c9ad7f" ${OL}/><path d="M13,9 L27,9" stroke="#7a5a3a" stroke-width="1.6"/>
    <rect x="13" y="18" width="14" height="10" rx="2" fill="${b.color}" ${OL}/>
    <ellipse cx="20" cy="23" rx="3.5" ry="2.4" fill="#7fae5b"/></svg>`;
}

export function ingIcon(id, size = 40) {
  const w = `width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"`;
  switch (id) {
    case 'milk': return `<svg ${w}><path d="M12,12 L20,6 L28,12 L28,35 L12,35 Z" fill="#fffaf0" ${OL}/><path d="M12,12 L28,12" stroke="${OUT}" stroke-opacity=".5"/><rect x="12" y="18" width="16" height="9" fill="#7fb3c9"/><circle cx="20" cy="22.5" r="2.5" fill="#fff"/></svg>`;
    case 'caramel': return `<svg ${w}><rect x="16" y="5" width="8" height="6" rx="1" fill="#c75c4f" ${OL}/><path d="M13,13 Q13,10 17,10 L23,10 Q27,10 27,13 L27,35 L13,35 Z" fill="#c47a2c" ${OL}/><rect x="15" y="18" width="10" height="8" rx="1" fill="#fbe6c4"/></svg>`;
    case 'cocoa': return `<svg ${w}><rect x="11" y="8" width="18" height="6" rx="2" fill="#a8714a" ${OL}/><rect x="12" y="13" width="16" height="22" rx="3" fill="#5b3a29" ${OL}/><rect x="14" y="19" width="12" height="9" rx="1" fill="#f4e1b5"/></svg>`;
    case 'vanilla': return `<svg ${w}><rect x="17" y="4" width="6" height="8" rx="1" fill="#6b4a3a" ${OL}/><path d="M14,14 Q14,11 18,11 L22,11 Q26,11 26,14 L26,35 L14,35 Z" fill="#efe0a8" ${OL}/><circle cx="20" cy="23" r="4" fill="#fffaf0"/><circle cx="20" cy="23" r="1.5" fill="#e2b84f"/></svg>`;
    case 'cream': return `<svg ${w}><rect x="17" y="3" width="6" height="7" rx="2" fill="#e48a7a" ${OL}/><rect x="13" y="10" width="14" height="25" rx="4" fill="#fffaf0" ${OL}/><path d="M13,20 L27,20" stroke="#e48a7a" stroke-width="3"/></svg>`;
    case 'cinnamon': return `<svg ${w}><rect x="10" y="10" width="5" height="24" rx="2" fill="#9a5a33" transform="rotate(-15 12 22)" ${OL}/><rect x="17" y="8" width="5" height="26" rx="2" fill="#b06a3e" ${OL}/><rect x="24" y="10" width="5" height="24" rx="2" fill="#8a4f2c" transform="rotate(15 26 22)" ${OL}/></svg>`;
    default: return '';
  }
}

export const ICONS = {
  coin: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f2c24e" stroke="#b8862a" stroke-width="2"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#e0a83a" stroke-width="1.4"/><path d="M12,7.5 v9" stroke="#b8862a" stroke-width="2" stroke-linecap="round"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12,21 C4,15 2,11 2,8 C2,5 4.5,3 7,3 C9,3 11,4.5 12,6 C13,4.5 15,3 17,3 C19.5,3 22,5 22,8 C22,11 20,15 12,21 Z" fill="#ef7f8a" stroke="#c45966" stroke-width="1.5"/></svg>`,
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12,2.5 l2.9,6 6.6,.8 -4.9,4.5 1.3,6.5 L12,17 6.1,20.3 7.4,13.8 2.5,9.3 9.1,8.5 Z" fill="#f2c24e" stroke="#b8862a" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  card: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="#fffaf0" stroke="#6b4a3a" stroke-width="1.6"/><rect x="5" y="8" width="5" height="5" rx="1" fill="#d9775f"/><path d="M12,9 h7 M12,12 h5 M5,16 h14" stroke="#6b4a3a" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12,8.5 a3.5,3.5 0 1 0 0.01,0 Z M10.4,2 h3.2 l.5,2.6 1.8,.8 2.2,-1.5 2.3,2.3 -1.5,2.2 .8,1.8 2.6,.5 v3.2 l-2.6,.5 -.8,1.8 1.5,2.2 -2.3,2.3 -2.2,-1.5 -1.8,.8 -.5,2.6 h-3.2 l-.5,-2.6 -1.8,-.8 -2.2,1.5 -2.3,-2.3 1.5,-2.2 -.8,-1.8 L2,13.6 v-3.2 l2.6,-.5 .8,-1.8 -1.5,-2.2 2.3,-2.3 2.2,1.5 1.8,-.8 Z" fill="#fffaf0" stroke="#6b4a3a" stroke-width="1.4" fill-rule="evenodd"/></svg>`,
  full: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4,9 V4 h5 M15,4 h5 v5 M20,15 v5 h-5 M9,20 H4 v-5" stroke="#6b4a3a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6,6 L18,18 M18,6 L6,18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="#b9aa98"/><path d="M8,10 V7 a4,4 0 0 1 8,0 v3" stroke="#b9aa98" stroke-width="2.2" fill="none"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#fffaf0" stroke="#6b4a3a" stroke-width="1.8"/><path d="M12,7 v5 l3,2" stroke="#6b4a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  cup: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5,8 h12 l-1.4,11 a2,2 0 0 1 -2,1.6 H8.4 a2,2 0 0 1 -2,-1.6 Z" fill="#fffaf0" stroke="#6b4a3a" stroke-width="1.6"/><path d="M17,10 h1.5 a2.5,2.5 0 0 1 0,5 H16.5" fill="none" stroke="#6b4a3a" stroke-width="1.6"/><path d="M9,3 q-1,2 0,3 M12,2.5 q-1,2 0,3.5" stroke="#b9aa98" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`,
};

// 按鈕列使用的大圖示
export const BTN_ICONS = {
  shop: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8,18 L12,8 H36 L40,18 Z" fill="#e48a7a" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/><path d="M8,18 q4,5 8,0 q4,5 8,0 q4,5 8,0 q4,5 8,0" fill="#fffaf0" stroke="${OUT}" stroke-width="1.6"/><rect x="10" y="21" width="28" height="19" fill="#fbf3e6" stroke="${OUT}" stroke-width="1.6"/><rect x="20" y="28" width="8" height="12" fill="#a8714a" stroke="${OUT}" stroke-width="1.4"/></svg>`,
  menu: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="3" fill="#2f4a3e" stroke="${OUT}" stroke-width="1.6"/><path d="M16,16 h16 M16,23 h12 M16,30 h14" stroke="#f3eadc" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="4 2"/></svg>`,
  decor: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14,40 L14,26 Q14,20 20,20 L28,20 Q34,20 34,26 L34,40" fill="#5f8f88" stroke="${OUT}" stroke-width="1.6"/><rect x="10" y="28" width="28" height="9" rx="3" fill="#7fb0a8" stroke="${OUT}" stroke-width="1.6"/><path d="M30,6 l3,6 6,1 -4.5,4 1,6 -5.5,-3 -5.5,3 1,-6 -4.5,-4 6,-1 Z" fill="#f2c24e" stroke="${OUT}" stroke-width="1.3"/></svg>`,
  staff: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16" r="9" fill="#f6d7bd" stroke="${OUT}" stroke-width="1.6"/><path d="M15,14 Q16,5 24,6 Q32,5 33,14 Q28,10 24,11 Q19,10 15,14 Z" fill="#5a3a2a"/><path d="M10,42 Q10,28 24,28 Q38,28 38,42 Z" fill="#fbf3e6" stroke="${OUT}" stroke-width="1.6"/><path d="M18,29 L30,29 L32,42 L16,42 Z" fill="#d9775f" stroke="${OUT}" stroke-width="1.4"/></svg>`,
  street: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="22" height="32" rx="2" fill="#7fb3c9" stroke="${OUT}" stroke-width="1.6"/><path d="M6,14 h22" stroke="${OUT}" stroke-width="1.4"/><rect x="10" y="18" width="6" height="6" fill="#fffaf0"/><rect x="18" y="18" width="6" height="6" fill="#fffaf0"/><rect x="14" y="30" width="7" height="10" fill="#6b4a3a"/><path d="M30,26 Q30,16 38,16 Q44,16 44,22 Q44,28 38,28 L34,28 L30,32 Z" fill="#fffaf0" stroke="${OUT}" stroke-width="1.6"/><path d="M34,22 h6" stroke="#d9775f" stroke-width="2" stroke-linecap="round"/></svg>`,
  regulars: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="6" width="30" height="36" rx="3" fill="#e9b872" stroke="${OUT}" stroke-width="1.6"/><rect x="13" y="6" width="4" height="36" fill="#c99550"/><path d="M28,19 c-6,-4 -5,-9 -1,-8 q1,0 1,1.5 q0,-1.5 1,-1.5 c4,-1 5,4 -1,8 Z" fill="#ef7f8a" stroke="#c45966" stroke-width="1.2"/><path d="M21,28 h13 M21,33 h10" stroke="#6b4a3a" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  expand: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24,6 L42,16 L24,26 L6,16 Z" fill="#cfa274" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/><path d="M6,16 L6,30 L24,40 L24,26 Z" fill="#a77a52" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/><path d="M42,16 L42,30 L24,40 L24,26 Z" fill="#8b6040" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/><path d="M34,4 h8 v8 M42,4 L34,12" stroke="#4f8a78" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`,
  quest: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="3" fill="#fffaf0" stroke="${OUT}" stroke-width="1.6"/><path d="M15,16 l3,3 5,-6 M15,27 l3,3 5,-6" stroke="#4f8a78" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M27,17 h7 M27,28 h7" stroke="#6b4a3a" stroke-width="2" stroke-linecap="round"/></svg>`,
};
