// 介面圖示（原創向量）：飲品、點心、料理、咖啡豆與各種按鈕
import { RECIPES, SIDES, MEALS, ROASTS, INGS } from './data.js';
const OL = '#5a3a2a';
const W = (size, inner, vb = '0 0 48 48') => `<svg viewBox="${vb}" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
function shade(hex, amt) {
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
let n = 0;

// ---------- 飲品杯 ----------
export function drinkIcon(id, size = 40) {
  const r = RECIPES[id];
  const k = 'd' + (n++);
  const liquids = r.steps.filter(([i]) => !['ice', 'blend', 'cinnamon'].includes(i)).map(([i, c]) => [INGS[i], c]);
  const hasCream = r.steps.some(([i]) => i === 'cream'), hasFoam = r.steps.some(([i]) => i === 'foam');
  const iced = r.steps.some(([i]) => i === 'ice'), cin = r.steps.some(([i]) => i === 'cinnamon');
  const caramel = r.steps.some(([i]) => i === 'caramel');
  const main = liquids.filter(([d]) => d.kind === 'liquid' || d.kind === 'sauce');
  const base = main.length ? main[main.length - 1][0].color : '#3b2116';
  let s = `<defs><linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1">`;
  const tot = main.reduce((a, [, c]) => a + c, 0) || 1;
  let acc = 0;
  for (const [d, c] of main.slice().reverse()) { s += `<stop offset="${acc / tot}" stop-color="${d.color}"/>`; acc += c; s += `<stop offset="${acc / tot}" stop-color="${d.color}"/>`; }
  s += `</linearGradient></defs>`;
  const cupT = r.cup;
  if (cupT === 'demi' || cupT === 'cup') {
    const big = cupT === 'cup';
    const top = big ? 18 : 22, rx = big ? 15 : 11;
    s += `<ellipse cx="24" cy="41" rx="${rx + 6}" ry="4" fill="#fffaf2" stroke="${OL}" stroke-width="1.6"/>`;
    s += `<path d="M${24 - rx},${top} L${24 - rx + 3},${37} Q24,${41} ${24 + rx - 3},${37} L${24 + rx},${top} Z" fill="#fffaf2" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<path d="M${24 + rx},${top + 4} q8,1 7,8 q-1,6 -9,5" fill="none" stroke="${OL}" stroke-width="1.8"/>`;
    s += `<ellipse cx="24" cy="${top}" rx="${rx - 1}" ry="3.6" fill="${hasFoam ? '#fbf6ec' : base}" stroke="${OL}" stroke-width="1.4"/>`;
    if (hasFoam && !hasCream) s += `<path d="M22,${top - 1} c-3,-2 -2,-4 0,-3 q1,0 1,1 q0,-1 1,-1 c2,-1 3,1 -2,3 Z" fill="${base === '#fbf6ec' ? '#c58a55' : '#a8714a'}"/>`;
  } else if (cupT === 'mug') {
    s += `<path d="M10,14 L12,40 Q24,44 36,40 L38,14 Z" fill="#fffaf2" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<path d="M38,18 q9,1 8,10 q-1,8 -10,7" fill="none" stroke="${OL}" stroke-width="2"/>`;
    s += `<ellipse cx="24" cy="14" rx="14" ry="4" fill="${base}" stroke="${OL}" stroke-width="1.4"/>`;
    s += `<rect x="16" y="24" width="16" height="6" rx="2" fill="#2f5446" opacity=".8"/>`;
  } else {
    // 玻璃杯：glass / tall / frappe / rocks
    const tall = cupT === 'tall' || cupT === 'frappe', rocks = cupT === 'rocks';
    const top = tall ? 8 : rocks ? 18 : 12, bot = 42, lw = rocks ? 15 : 12, bw = rocks ? 14 : 10;
    s += `<path d="M${24 - lw},${top} L${24 - bw},${bot} Q24,${bot + 3} ${24 + bw},${bot} L${24 + lw},${top} Z" fill="url(#${k})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
    if (iced) for (const [x, y] of [[20, top + 8], [27, top + 12], [22, top + 18]]) s += `<rect x="${x}" y="${y}" width="6" height="6" rx="1.4" fill="#fff" opacity=".6" transform="rotate(12 ${x} ${y})"/>`;
    s += `<path d="M${24 - lw + 2},${top + 2} L${24 - bw + 2},${bot - 2}" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>`;
    if (hasCream || cupT === 'frappe') s += `<path d="M${24 - lw},${top} q0,-8 6,-7 q2,-7 8,-5 q6,-4 8,3 q5,1 2,9 Z" fill="#fffdf6" stroke="${OL}" stroke-width="1.5"/>`;
    else if (hasFoam) s += `<ellipse cx="24" cy="${top + 1}" rx="${lw - 1}" ry="3.4" fill="#fbf6ec" stroke="${OL}" stroke-width="1.2"/>`;
    if (caramel) s += `<path d="M${24 - lw + 3},${top - (hasCream ? 3 : 0)} l4,-3 l4,4 l4,-4 l4,4 l4,-3" stroke="#c47a2c" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (tall) s += `<path d="M30,${top - 8} L27,${top + 10}" stroke="#d9775f" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  if (cin) s += `<circle cx="20" cy="15" r="1" fill="#9a5a33"/><circle cx="25" cy="14" r="1" fill="#9a5a33"/><circle cx="28" cy="16" r="1" fill="#9a5a33"/>`;
  return W(size, s);
}

// ---------- 點心 ----------
export function sideIcon(id, size = 40) {
  const c = SIDES[id].color;
  let s = `<ellipse cx="24" cy="40" rx="18" ry="5" fill="#fffaf2" stroke="${OL}" stroke-width="1.6"/>`;
  switch (id) {
    case 'toast': s += `<path d="M12,34 L12,20 Q12,12 20,12 L28,12 Q36,12 36,20 L36,34 Z" fill="#e9c27a" stroke="${OL}" stroke-width="1.8"/><path d="M15,32 L15,21 Q15,15 21,15 L27,15 Q33,15 33,21 L33,32 Z" fill="#f6e2b0"/><rect x="20" y="20" width="9" height="6" rx="1.5" fill="#fff3c0" stroke="#e2b84f"/>`; break;
    case 'croissant': s += `<path d="M8,32 Q10,16 24,14 Q38,16 40,32 Q34,28 30,30 Q24,24 18,30 Q14,28 8,32 Z" fill="${c}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M16,22 L18,30 M24,16 L24,26 M32,22 L30,30" stroke="${shade(c, -0.3)}" stroke-width="1.4"/>`; break;
    case 'scone': s += `<path d="M12,36 Q10,22 18,18 Q24,14 30,18 Q38,22 36,36 Z" fill="${c}" stroke="${OL}" stroke-width="1.8"/><circle cx="20" cy="26" r="1.6" fill="#7a3a2a"/><circle cx="28" cy="24" r="1.6" fill="#7a3a2a"/><circle cx="25" cy="31" r="1.6" fill="#7a3a2a"/>`; break;
    case 'madeleine': s += `<path d="M10,34 Q10,18 24,16 Q38,18 38,34 Q24,38 10,34 Z" fill="${c}" stroke="${OL}" stroke-width="1.8"/><path d="M24,18 L24,34 M17,20 L20,34 M31,20 L28,34" stroke="${shade(c, -0.25)}" stroke-width="1.4"/>`; break;
    case 'brownie': s += `<path d="M12,22 L32,18 L38,24 L38,34 L18,38 L12,32 Z" fill="${c}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M12,22 L18,28 L38,24 M18,28 L18,38" fill="none" stroke="${OL}" stroke-width="1.4"/><path d="M16,23 l4,-1 M24,21 l5,-1" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`; break;
    case 'tiramisu': s += `<rect x="12" y="18" width="24" height="18" rx="2" fill="#f2e2c4" stroke="${OL}" stroke-width="1.8"/><rect x="12" y="24" width="24" height="4" fill="#8a5a3c"/><rect x="12" y="31" width="24" height="3" fill="#8a5a3c"/><rect x="12" y="18" width="24" height="3" fill="#7a4a2e"/>`; break;
    case 'cheesecake': s += `<path d="M10,34 L38,34 L38,24 L14,18 Z" fill="${c}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M10,34 L38,34 L38,30 L12,30 Z" fill="#c9915a"/><circle cx="26" cy="21" r="3" fill="#b3233a" stroke="${OL}" stroke-width="1"/>`; break;
    case 'waffle': s += `<rect x="11" y="16" width="26" height="20" rx="3" fill="${c}" stroke="${OL}" stroke-width="1.8"/><path d="M17,16 v20 M24,16 v20 M31,16 v20 M11,23 h26 M11,30 h26" stroke="${shade(c, -0.3)}" stroke-width="1.4"/><path d="M14,14 q6,6 14,0 q4,-2 6,2" fill="#fffdf6" stroke="${OL}" stroke-width="1.2"/>`; break;
    case 'honey_toast': s += `<rect x="13" y="14" width="22" height="22" rx="3" fill="${c}" stroke="${OL}" stroke-width="1.8"/><path d="M13,20 h22 M19,14 v22 M29,14 v22" stroke="${shade(c, -0.25)}" stroke-width="1.4"/><path d="M18,12 q6,-6 12,0 q2,4 -2,4 h-8 q-4,0 -2,-4 Z" fill="#fffdf6" stroke="${OL}" stroke-width="1.2"/><path d="M24,16 q1,8 -2,14" stroke="#e8a63a" stroke-width="2.4" fill="none"/>`; break;
    case 'millefeuille': s += `<rect x="12" y="16" width="24" height="20" rx="2" fill="#f6e3b8" stroke="${OL}" stroke-width="1.8"/><path d="M12,22 h24 M12,28 h24" stroke="#d9a65c" stroke-width="2.6"/><circle cx="18" cy="14" r="3" fill="#d6334a" stroke="${OL}" stroke-width="1"/><circle cx="28" cy="14" r="3" fill="#d6334a" stroke="${OL}" stroke-width="1"/>`; break;
    case 'montblanc': s += `<path d="M14,36 L16,24 L32,24 L34,36 Z" fill="#f6e3b8" stroke="${OL}" stroke-width="1.6"/><path d="M14,26 Q14,10 24,8 Q34,10 34,26 Z" fill="${c}" stroke="${OL}" stroke-width="1.8"/><path d="M17,24 q2,-12 7,-14 M24,24 v-14 M31,24 q-2,-12 -7,-14" stroke="${shade(c, -0.25)}" stroke-width="1.4" fill="none"/><circle cx="24" cy="8" r="3" fill="#a86a3a" stroke="${OL}" stroke-width="1"/>`; break;
    default: s += `<circle cx="24" cy="28" r="10" fill="${c}" stroke="${OL}" stroke-width="1.8"/>`;
  }
  return W(size, s);
}

// ---------- 料理 ----------
export function mealIcon(id, size = 40) {
  const c = MEALS[id].color;
  let s = `<ellipse cx="24" cy="34" rx="21" ry="9" fill="#fffaf2" stroke="${OL}" stroke-width="1.6"/><ellipse cx="24" cy="33" rx="15" ry="5.5" fill="none" stroke="#e3d6c3" stroke-width="1.2"/>`;
  const m = MEALS[id].machine;
  if (m === 'griddle') {
    if (id === 'benedict') s += `<ellipse cx="18" cy="30" rx="8" ry="4" fill="#e9c27a" stroke="${OL}" stroke-width="1.4"/><ellipse cx="30" cy="30" rx="8" ry="4" fill="#e9c27a" stroke="${OL}" stroke-width="1.4"/><ellipse cx="18" cy="27" rx="7" ry="3.6" fill="#fff6e0" stroke="${OL}" stroke-width="1.2"/><ellipse cx="30" cy="27" rx="7" ry="3.6" fill="#fff6e0" stroke="${OL}" stroke-width="1.2"/><path d="M12,26 q6,4 12,0 q6,4 12,0" stroke="#f2c23a" stroke-width="2.4" fill="none"/>`;
    else for (let i = 0; i < 3; i++) s += `<ellipse cx="24" cy="${31 - i * 4}" rx="13" ry="4.5" fill="${c}" stroke="${OL}" stroke-width="1.4"/>`;
    if (id === 'pancake') s += `<rect x="20" y="17" width="8" height="5" rx="1" fill="#fff3c0" stroke="#e2b84f"/><path d="M14,22 q4,6 0,10" stroke="#a8601e" stroke-width="2" fill="none"/>`;
    if (id === 'frenchtoast') s += `<circle cx="18" cy="19" r="1.4" fill="#fff"/><circle cx="26" cy="18" r="1.4" fill="#fff"/><circle cx="30" cy="20" r="1.4" fill="#fff"/>`;
  } else if (m === 'stove') {
    s += `<path d="M10,31 Q12,18 24,18 Q36,18 38,31 Q24,36 10,31 Z" fill="${c}" stroke="${OL}" stroke-width="1.6"/>`;
    s += `<path d="M16,28 q4,-6 8,-2 q4,4 8,-2 M15,24 q6,-4 10,0 q4,4 8,-1" stroke="${shade(c, -0.25)}" stroke-width="1.6" fill="none"/>`;
    if (id === 'pesto') s += `<ellipse cx="20" cy="22" rx="3" ry="2" fill="#4a3a2a"/><ellipse cx="28" cy="25" rx="3" ry="2" fill="#4a3a2a"/>`;
    if (id === 'tomato') s += `<path d="M18,20 q3,-3 6,0 q3,3 6,0" stroke="#f4a6a0" stroke-width="2.4" fill="none"/>`;
    s += `<path d="M30,14 l4,-4 l1,5 Z" fill="#6d9558"/>`;
  } else if (m === 'press') {
    s += `<path d="M10,32 L24,16 L38,32 Z" fill="${c}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M14,30 L24,19 L34,30" fill="none" stroke="#e85a4a" stroke-width="2"/><path d="M16,28 L24,21 L32,28" fill="none" stroke="#f2d36b" stroke-width="2"/><path d="M14,26 h6 M20,24 h8 M24,22 h6" stroke="${shade(c, -0.35)}" stroke-width="1.4"/>`;
  } else {
    s += `<ellipse cx="24" cy="27" rx="16" ry="8" fill="#e9b26a" stroke="${OL}" stroke-width="1.6"/><ellipse cx="24" cy="26" rx="13" ry="6" fill="${c}"/>`;
    s += `<circle cx="19" cy="25" r="2.2" fill="#fff6e0"/><circle cx="28" cy="27" r="2.2" fill="#fff6e0"/><circle cx="25" cy="23" r="1.6" fill="#6d9558"/>`;
    s += `<path d="M24,19 L24,33 M11,26 L37,26" stroke="${OL}" stroke-opacity=".3" stroke-width="1"/>`;
  }
  return W(size, s);
}

// ---------- 咖啡豆袋 ----------
export function beanBagIcon(id, size = 40) {
  const r = ROASTS.find(q => q.id === id) || ROASTS[0];
  const s = `<path d="M12,14 Q8,34 13,42 L35,42 Q40,34 36,14 Z" fill="#d8bf93" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M12,14 L16,7 L32,7 L36,14 Z" fill="#c9ad7f" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M15,11 L33,11" stroke="#7a5a3a" stroke-width="1.6"/>
    <rect x="15" y="20" width="18" height="14" rx="3" fill="${r.color}" stroke="${OL}" stroke-width="1.4"/>
    <ellipse cx="24" cy="27" rx="4.4" ry="3" fill="#4a2a1a"/><path d="M20.5,27 q3.5,-1.6 7,0" stroke="#c9a06a" stroke-width="1"/>`;
  return W(size, s);
}

// ---------- 介面圖示 ----------
export const I = {
  gold: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#f2c24e" stroke="#a8752a" stroke-width="1.6"/><circle cx="12" cy="12" r="7.4" fill="#f7d675" stroke="#d9a63a" stroke-width="1"/><text x="12" y="16.2" text-anchor="middle" font-size="11" font-weight="900" font-family="Georgia,serif" fill="#a8752a">G</text></svg>`,
  bean: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7.6" ry="10" transform="rotate(-30 12 12)" fill="#6b3e26" stroke="#3b2116" stroke-width="1.4"/><path d="M8,18 C12,14 11,10 16,6" stroke="#c9915a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  coupon: `<svg viewBox="0 0 24 24"><path d="M2,7 Q2,5 4,5 L20,5 Q22,5 22,7 L22,9.5 A2.5,2.5 0 0 0 22,14.5 L22,17 Q22,19 20,19 L4,19 Q2,19 2,17 L2,14.5 A2.5,2.5 0 0 0 2,9.5 Z" fill="#7fbf8a" stroke="#3c6e4f" stroke-width="1.4"/><path d="M8,5 V19" stroke="#3c6e4f" stroke-width="1.2" stroke-dasharray="2 1.6"/><text x="15" y="15.5" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="Georgia,serif">C</text></svg>`,
  exp: `<svg viewBox="0 0 24 24"><path d="M12,2 l2.9,6 6.6,.9 -4.8,4.6 1.2,6.5 L12,16.9 6.1,20 7.3,13.5 2.5,8.9 9.1,8 Z" fill="#f2c24e" stroke="#a8752a" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  score: `<svg viewBox="0 0 24 24"><path d="M12,2.5 C14,7 17,10 21.5,12 C17,14 14,17 12,21.5 C10,17 7,14 2.5,12 C7,10 10,7 12,2.5 Z" fill="#f4c94a" stroke="#a8752a" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  heart: `<svg viewBox="0 0 24 24"><path d="M12,21 C4,15 2,11 2,8 C2,5 4.5,3 7,3 C9,3 11,4.5 12,6 C13,4.5 15,3 17,3 C19.5,3 22,5 22,8 C22,11 20,15 12,21 Z" fill="#ef7f8a" stroke="#b5485a" stroke-width="1.4"/></svg>`,
  clover: `<svg viewBox="0 0 24 24"><g fill="#6dbb5a" stroke="#3c7a33" stroke-width="1.2"><circle cx="9" cy="8.5" r="4.4"/><circle cx="15" cy="8.5" r="4.4"/><circle cx="9" cy="14.5" r="4.4"/><circle cx="15" cy="14.5" r="4.4"/></g><path d="M12,12 Q14,18 17,22" stroke="#3c7a33" stroke-width="1.6" fill="none"/></svg>`,
  flyer: `<svg viewBox="0 0 24 24"><path d="M5,3 L17,3 L20,6 L20,21 L5,21 Z" fill="#fffaf2" stroke="#5a3a2a" stroke-width="1.4" stroke-linejoin="round"/><rect x="8" y="7" width="9" height="5" rx="1" fill="#d9775f"/><path d="M8,15 h9 M8,18 h6" stroke="#5a3a2a" stroke-width="1.3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8.5" fill="#fffaf2" stroke="#4a6a9a" stroke-width="2"/><path d="M12,8 V13 L15.5,15" stroke="#4a6a9a" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="10" y="1.5" width="4" height="3" rx="1" fill="#4a6a9a"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" fill="#b9aa98"/><path d="M8,10 V7 a4,4 0 0 1 8,0 v3" stroke="#b9aa98" stroke-width="2.2" fill="none"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#5fae6e" stroke="#fff" stroke-width="2"/><path d="M7,12.5 l3.4,3.4 L17,9" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  smoke: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#4a4240"/><path d="M8,17 q-3,-5 2,-7 q-1,4 3,4 q2,-5 -1,-8 q8,4 4,11 Z" fill="#b5aaa2"/></svg>`,
  zzz: `<svg viewBox="0 0 24 24"><text x="4" y="19" font-size="12" font-weight="900" fill="#6f8fd0" font-family="Georgia,serif">Z</text><text x="12" y="12" font-size="9" font-weight="900" fill="#6f8fd0" font-family="Georgia,serif">z</text><text x="17" y="7" font-size="7" font-weight="900" fill="#6f8fd0" font-family="Georgia,serif">z</text></svg>`,
  tip: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#f2c24e" stroke="#a8752a" stroke-width="1.6"/><text x="12" y="17" text-anchor="middle" font-size="15" font-weight="900" fill="#a8752a" font-family="Georgia,serif">!</text></svg>`,
  broom: `<svg viewBox="0 0 24 24"><path d="M16,2 L11,13" stroke="#8a5a3c" stroke-width="2.2" stroke-linecap="round"/><path d="M8,12 L14,14 L12,22 Q8,22 4,19 Z" fill="#e2c27a" stroke="#8a6a2e" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24"><path d="M12,2 L13.5,10.5 L22,12 L13.5,13.5 L12,22 L10.5,13.5 L2,12 L10.5,10.5 Z" fill="#fff6c9" stroke="#e2b84f" stroke-width="1.2"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12,2 l2.9,6 6.6,.9 -4.8,4.6 1.2,6.5 L12,16.9 6.1,20 7.3,13.5 2.5,8.9 9.1,8 Z" fill="#f2c24e" stroke="#a8752a" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  starOff: `<svg viewBox="0 0 24 24"><path d="M12,2 l2.9,6 6.6,.9 -4.8,4.6 1.2,6.5 L12,16.9 6.1,20 7.3,13.5 2.5,8.9 9.1,8 Z" fill="#e3d6c3" stroke="#c9b79e" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M6,6 L18,18 M18,6 L6,18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12,5 V19 M5,12 H19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  minus: `<svg viewBox="0 0 24 24"><path d="M5,12 H19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="0 0 24 24"><path d="M12,8.5 a3.5,3.5 0 1 0 .01,0 Z M10.4,2 h3.2 l.5,2.6 1.8,.8 2.2,-1.5 2.3,2.3 -1.5,2.2 .8,1.8 2.6,.5 v3.2 l-2.6,.5 -.8,1.8 1.5,2.2 -2.3,2.3 -2.2,-1.5 -1.8,.8 -.5,2.6 h-3.2 l-.5,-2.6 -1.8,-.8 -2.2,1.5 -2.3,-2.3 1.5,-2.2 -.8,-1.8 L2,13.6 v-3.2 l2.6,-.5 .8,-1.8 -1.5,-2.2 2.3,-2.3 2.2,1.5 1.8,-.8 Z" fill="#f4ead8" stroke="#6b4a3a" stroke-width="1.3" fill-rule="evenodd"/></svg>`,
  full: `<svg viewBox="0 0 24 24"><path d="M4,9 V4 h5 M15,4 h5 v5 M20,15 v5 h-5 M9,20 H4 v-5" stroke="#6b4a3a" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  energy: `<svg viewBox="0 0 24 24"><path d="M13,2 L5,14 L11,14 L10,22 L19,9 L13,9 Z" fill="#f2c24e" stroke="#a8752a" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  cup: `<svg viewBox="0 0 24 24"><path d="M4,8 h13 l-1.5,11 a2,2 0 0 1 -2,1.6 H7.5 a2,2 0 0 1 -2,-1.6 Z" fill="#fffaf2" stroke="#5a3a2a" stroke-width="1.6"/><path d="M17,10 h1.5 a2.5,2.5 0 0 1 0,5 H16.5" fill="none" stroke="#5a3a2a" stroke-width="1.6"/><path d="M8,2.5 q-1,2 0,3.5 M11.5,2 q-1,2 0,3.5" stroke="#b9aa98" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`,
  cake: `<svg viewBox="0 0 24 24"><path d="M4,20 L20,20 L20,12 L6,8 Z" fill="#f3d9c9" stroke="#5a3a2a" stroke-width="1.5" stroke-linejoin="round"/><path d="M4,16 h16" stroke="#c9826a" stroke-width="2"/><circle cx="12" cy="8" r="2.2" fill="#b3233a"/></svg>`,
  meal: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15" rx="10" ry="5" fill="#fffaf2" stroke="#5a3a2a" stroke-width="1.5"/><path d="M5,14 Q7,7 12,7 Q17,7 19,14 Z" fill="#f1e3b6" stroke="#5a3a2a" stroke-width="1.4"/></svg>`,
};
// 底部選單大圖示（原創）
export const BIG = {
  decor: `<svg viewBox="0 0 64 64"><path d="M8,30 L32,10 L56,30 L56,54 L8,54 Z" fill="#e8665a" stroke="#7a2e26" stroke-width="2.4" stroke-linejoin="round"/><path d="M14,30 L32,15 L50,30 L50,50 L14,50 Z" fill="#f4ead8"/><rect x="26" y="34" width="12" height="16" rx="2" fill="#a8714a" stroke="#6b4a3a" stroke-width="1.6"/><path d="M4,32 L32,8 L60,32" stroke="#c94a3e" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="42" y="12" width="6" height="12" fill="#c94a3e"/></svg>`,
  menu: `<svg viewBox="0 0 64 64"><rect x="14" y="8" width="36" height="48" rx="4" fill="#2f4a3e" stroke="#1d2e27" stroke-width="2.4"/><rect x="18" y="12" width="28" height="40" rx="2" fill="#3a5a4c"/><text x="32" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#f3eadc" font-family="Georgia,serif" font-style="italic">Menu</text><path d="M22,32 h20 M22,38 h16 M22,44 h18" stroke="#f3eadc" stroke-width="2" stroke-dasharray="3 2"/></svg>`,
  staff: `<svg viewBox="0 0 64 64"><circle cx="32" cy="22" r="12" fill="#f6d9c3" stroke="#5a3a2a" stroke-width="2"/><path d="M19,22 Q19,8 32,8 Q45,8 45,22 Q40,15 32,16 Q24,15 19,22 Z" fill="#6b4a3a"/><path d="M12,58 Q12,38 32,38 Q52,38 52,58 Z" fill="#fbf3e6" stroke="#5a3a2a" stroke-width="2"/><path d="M24,39 L40,39 L43,58 L21,58 Z" fill="#2f5446" stroke="#5a3a2a" stroke-width="1.8"/></svg>`,
  wardrobe: `<svg viewBox="0 0 64 64"><path d="M22,10 L32,16 L42,10 L56,18 L50,30 L44,27 L44,56 L20,56 L20,27 L14,30 L8,18 Z" fill="#d97b6c" stroke="#7a2e26" stroke-width="2.2" stroke-linejoin="round"/><path d="M26,12 Q32,22 38,12" fill="none" stroke="#7a2e26" stroke-width="2"/><circle cx="32" cy="34" r="2" fill="#fff"/><circle cx="32" cy="42" r="2" fill="#fff"/></svg>`,
  friends: `<svg viewBox="0 0 64 64"><path d="M8,30 L22,18 L36,30 L36,54 L8,54 Z" fill="#7fb3c9" stroke="#2f5a6e" stroke-width="2" stroke-linejoin="round"/><path d="M28,30 L42,18 L56,30 L56,54 L28,54 Z" fill="#f2c45e" stroke="#8a6a1e" stroke-width="2" stroke-linejoin="round"/><rect x="38" y="40" width="8" height="14" fill="#8a5a3c"/><rect x="16" y="40" width="8" height="14" fill="#5a3a2a"/><path d="M26,12 c-6,-4 -5,-9 -1,-8 q1,0 1,1.5 q0,-1.5 1,-1.5 c4,-1 5,4 -1,8 Z" fill="#ef7f8a"/></svg>`,
  regulars: `<svg viewBox="0 0 64 64"><rect x="12" y="8" width="40" height="48" rx="4" fill="#e9b872" stroke="#7a5a2a" stroke-width="2.2"/><rect x="16" y="8" width="5" height="48" fill="#c99550"/><path d="M38,24 c-8,-5 -7,-12 -1,-11 q1,0 1,2 q0,-2 1,-2 c6,-1 7,6 -1,11 Z" fill="#ef7f8a" stroke="#b5485a" stroke-width="1.4"/><path d="M28,36 h18 M28,43 h14" stroke="#6b4a3a" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  quest: `<svg viewBox="0 0 64 64"><rect x="14" y="10" width="36" height="46" rx="4" fill="#fffaf2" stroke="#6b4a3a" stroke-width="2.2"/><rect x="24" y="6" width="16" height="8" rx="2" fill="#c9a24a" stroke="#6b4a3a" stroke-width="1.8"/><path d="M20,26 l4,4 6,-7 M20,40 l4,4 6,-7" stroke="#4f8a78" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M34,28 h10 M34,42 h10" stroke="#6b4a3a" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  auto: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#4f8a78" stroke="#2f5a4c" stroke-width="2.4"/><path d="M20,34 A12,12 0 0 1 40,22 L37,18 L48,20 L45,30 L42,26 A8,8 0 0 0 26,34 Z" fill="#fff"/><path d="M44,30 A12,12 0 0 1 24,42 L27,46 L16,44 L19,34 L22,38 A8,8 0 0 0 38,30 Z" fill="#fff"/></svg>`,
  truck: `<svg viewBox="0 0 64 64"><rect x="6" y="18" width="36" height="26" rx="4" fill="#f2c45e" stroke="#8a6a1e" stroke-width="2.2"/><path d="M42,26 L52,26 L58,36 L58,44 L42,44 Z" fill="#e8665a" stroke="#7a2e26" stroke-width="2.2" stroke-linejoin="round"/><path d="M6,18 L42,18 L38,12 L10,12 Z" fill="#e8665a" stroke="#7a2e26" stroke-width="2" stroke-linejoin="round"/><circle cx="16" cy="46" r="6" fill="#3b3b44" stroke="#1d1d22" stroke-width="2"/><circle cx="48" cy="46" r="6" fill="#3b3b44" stroke="#1d1d22" stroke-width="2"/><rect x="12" y="24" width="18" height="10" rx="2" fill="#fffaf2"/></svg>`,
  cat: `<svg viewBox="0 0 64 64"><path d="M14,22 L18,8 L28,18 L36,18 L46,8 L50,22 Q54,30 52,40 Q48,54 32,54 Q16,54 12,40 Q10,30 14,22 Z" fill="#e39a4f" stroke="#7a4a1e" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="24" cy="34" rx="3" ry="4" fill="#2a1d18"/><ellipse cx="40" cy="34" rx="3" ry="4" fill="#2a1d18"/><path d="M29,42 Q32,45 35,42" stroke="#2a1d18" stroke-width="2" fill="none"/><path d="M8,38 h10 M46,38 h10" stroke="#7a4a1e" stroke-width="1.6"/></svg>`,
  delivery: `<svg viewBox="0 0 64 64"><circle cx="16" cy="46" r="8" fill="#3b3b44" stroke="#1d1d22" stroke-width="2"/><circle cx="48" cy="46" r="8" fill="#3b3b44" stroke="#1d1d22" stroke-width="2"/><path d="M16,46 L28,30 L42,30 L48,46" stroke="#e8665a" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="30" y="16" width="16" height="14" rx="2" fill="#f2c45e" stroke="#8a6a1e" stroke-width="2"/></svg>`,
  shop: `<svg viewBox="0 0 64 64"><path d="M10,24 L16,10 H48 L54,24 Z" fill="#e8665a" stroke="#7a2e26" stroke-width="2.2" stroke-linejoin="round"/><path d="M10,24 q5.5,7 11,0 q5.5,7 11,0 q5.5,7 11,0 q5.5,7 11,0" fill="#fffaf2" stroke="#7a2e26" stroke-width="2"/><rect x="13" y="28" width="38" height="26" fill="#fbf3e6" stroke="#7a2e26" stroke-width="2.2"/><rect x="27" y="38" width="10" height="16" fill="#a8714a" stroke="#6b4a3a" stroke-width="1.6"/></svg>`,
  rank: `<svg viewBox="0 0 64 64"><path d="M20,8 L44,8 L42,30 Q32,38 22,30 Z" fill="#f2c45e" stroke="#8a6a1e" stroke-width="2.2"/><rect x="28" y="36" width="8" height="10" fill="#c9a24a"/><rect x="18" y="46" width="28" height="8" rx="2" fill="#8a5a3c" stroke="#5a3a2a" stroke-width="2"/></svg>`,
};
export function icon(name, cls = 'ic') { return `<span class="${cls}">${I[name] || ''}</span>`; }
export function itemIcon(kind, id, size = 40) {
  if (kind === 'drink') return drinkIcon(id, size);
  if (kind === 'side') return sideIcon(id, size);
  if (kind === 'meal') return mealIcon(id, size);
  if (kind === 'roast') return beanBagIcon(id, size);
  return '';
}

// 手作材料圖示
const IG = {
  shot: `<path d="M14,10 h20 l-3,24 q-7,4 -14,0 Z" fill="#fffaf2" stroke="${OL}" stroke-width="2.2"/><ellipse cx="24" cy="12" rx="9" ry="3" fill="#3b2116"/><path d="M24,2 q4,5 0,8 q-4,-3 0,-8 Z" fill="#6b3e26"/>`,
  water: `<path d="M24,6 C30,16 36,22 36,30 a12,12 0 0 1 -24,0 C12,22 18,16 24,6 Z" fill="#9fd6ec" stroke="#2f6a86" stroke-width="2.2"/><path d="M18,30 q0,6 6,7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  milk: `<path d="M16,14 L24,7 L32,14 L32,40 L16,40 Z" fill="#fffaf2" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><rect x="16" y="20" width="16" height="10" fill="#e9b872"/><path d="M20,4 q2,2 0,4 M27,3 q2,2 0,4" stroke="#c9b79e" stroke-width="1.6" fill="none"/>`,
  foam: `<path d="M10,30 q-2,-10 8,-10 q2,-8 10,-6 q8,-4 12,6 q8,2 4,10 Z" fill="#fffdf6" stroke="${OL}" stroke-width="2.2"/><circle cx="20" cy="26" r="2" fill="#e3d6c3"/><circle cx="30" cy="24" r="2.4" fill="#e3d6c3"/>`,
  coldmilk: `<path d="M18,12 h12 l2,6 v22 h-16 v-22 Z" fill="#fffaf2" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><rect x="19" y="6" width="10" height="6" rx="1" fill="#7fb3c9" stroke="${OL}" stroke-width="1.8"/><path d="M24,22 v12 M19,25 l10,6 M29,25 l-10,6" stroke="#4a8fb0" stroke-width="2" stroke-linecap="round"/>`,
  ice: `<rect x="10" y="16" width="16" height="16" rx="3" fill="#e6f6fa" stroke="#4a8fb0" stroke-width="2.2" transform="rotate(-10 18 24)"/><rect x="22" y="12" width="15" height="15" rx="3" fill="#e6f6fa" stroke="#4a8fb0" stroke-width="2.2" transform="rotate(12 30 20)"/><path d="M14,20 l4,0" stroke="#fff" stroke-width="2"/>`,
  choco: `<path d="M18,14 h12 v26 q-6,3 -12,0 Z" fill="#4a2a1c" stroke="${OL}" stroke-width="2.2"/><rect x="20" y="6" width="8" height="8" rx="1.5" fill="#c94a3e" stroke="${OL}" stroke-width="1.8"/><rect x="19" y="22" width="10" height="8" rx="1" fill="#f3e2c6"/>`,
  caramel: `<path d="M18,14 h12 v26 q-6,3 -12,0 Z" fill="#c47a2c" stroke="${OL}" stroke-width="2.2"/><rect x="20" y="6" width="8" height="8" rx="1.5" fill="#f2c24e" stroke="${OL}" stroke-width="1.8"/><rect x="19" y="22" width="10" height="8" rx="1" fill="#fff3d6"/>`,
  vanilla: `<path d="M19,16 h10 l2,24 h-14 Z" fill="#efe0a8" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><rect x="21" y="8" width="6" height="8" fill="#6b4a3a"/><circle cx="24" cy="29" r="4" fill="#fffaf2"/><circle cx="24" cy="29" r="1.6" fill="#e2b84f"/>`,
  cream: `<path d="M12,34 q-2,-10 6,-10 q0,-8 8,-8 q8,0 8,8 q8,0 6,10 Z" fill="#fffdf6" stroke="${OL}" stroke-width="2.2"/><path d="M24,16 q2,-6 6,-8" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  cinnamon: `<rect x="12" y="12" width="6" height="26" rx="2.5" fill="#9a5a33" stroke="${OL}" stroke-width="1.8" transform="rotate(-18 15 25)"/><rect x="21" y="10" width="6" height="28" rx="2.5" fill="#b06a3e" stroke="${OL}" stroke-width="1.8"/><rect x="30" y="12" width="6" height="26" rx="2.5" fill="#8a4f2c" stroke="${OL}" stroke-width="1.8" transform="rotate(18 33 25)"/>`,
  matcha: `<path d="M10,30 q14,12 28,0 Z" fill="#6f8f3e" stroke="${OL}" stroke-width="2.2"/><path d="M14,30 q10,-14 20,0" fill="#9fc16a"/><path d="M24,8 c6,4 6,10 0,14 c-6,-4 -6,-10 0,-14 Z" fill="#6aa84f" stroke="#2f5a22" stroke-width="1.8"/>`,
  pour: `<path d="M10,20 h22 v16 q-11,6 -22,0 Z" fill="#c9cdd1" stroke="${OL}" stroke-width="2.2"/><path d="M32,24 q8,-2 10,-10" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14,20 q7,-8 14,0" fill="#c9cdd1" stroke="${OL}" stroke-width="2"/><path d="M42,16 v8" stroke="#6b3a22" stroke-width="2.4" stroke-dasharray="2 2"/>`,
  dutch: `<path d="M16,6 h16 l-4,14 h-8 Z" fill="#e6f6fa" stroke="#4a8fb0" stroke-width="2"/><path d="M24,22 v4" stroke="#2a160e" stroke-width="2.4"/><circle cx="24" cy="30" r="2" fill="#2a160e"/><path d="M14,34 h20 v8 h-20 Z" fill="#2a160e" stroke="${OL}" stroke-width="2"/>`,
  blend: `<path d="M14,10 h20 l-3,22 h-14 Z" fill="#e6f6fa" stroke="${OL}" stroke-width="2.2"/><rect x="12" y="32" width="24" height="10" rx="2" fill="#e8665a" stroke="${OL}" stroke-width="2"/><path d="M18,20 l12,4 M18,26 l12,-4" stroke="#4a8fb0" stroke-width="2" stroke-linecap="round"/>`,
};
export function ingIcon(id, size = 40) { return W(size, IG[id] || ''); }
