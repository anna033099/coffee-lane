// Q 版動漫人物：用向量手繪（SVG），再轉成貼圖給 3D 場景使用
// 一張圖 160×240，腳底在 (80, 232)
export const FW = 160, FH = 240;
export const FRAMES = ['f_stand', 'f_walk1', 'f_walk2', 'f_happy', 'b_stand', 'b_walk1', 'b_walk2', 'f_carry', 'f_sit', 'b_sit', 'f_sleep', 'b_carry'];
export const COLS = 4, ROWS = 3;

const OL = '#4a3128';          // 線條色（深咖啡，不用純黑比較柔和）
const SW = 2.4;               // 線寬

function shade(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
let uidN = 0;

// 預設外觀
export function normLook(l = {}) {
  return {
    art: undefined,
    skin: l.skin || '#f6d9c3', hair: l.hair || '#4a2f22', hairStyle: l.hairStyle || 'short', eye: l.eye || shade(l.hair || '#4a2f22', -0.1),
    top: l.top || '#f4efe6', topStyle: l.topStyle || 'shirt', bottom: l.bottom || '#2b2b2f', bottomType: l.bottomType || 'pants',
    shoe: l.shoe || '#4a3128', hat: l.hat || null, capColor: l.capColor || '#2f5446', glasses: !!l.glasses, apron: l.apron || null,
    ribbon: l.ribbon || null,
  };
}

// ---------- 頭髮 ----------
function hairBack(L, id) {
  const c = `url(#hg${id})`;
  const s = L.hairStyle;
  let p = `<ellipse cx="80" cy="72" rx="56" ry="50" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'bob') p = `<path d="M22,76 C20,28 140,28 138,76 C142,104 140,122 132,134 C120,138 108,132 104,124 L56,124 C52,132 40,138 28,134 C20,122 18,104 22,76 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'pony') p += `<path d="M120,52 C152,48 158,92 146,128 C140,146 128,150 124,140 C134,118 136,86 116,70 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'curly') p = [[34, 60, 22], [50, 34, 24], [80, 26, 26], [110, 34, 24], [126, 60, 22], [130, 90, 18], [30, 90, 18], [122, 116, 16], [38, 116, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`).join('') + `<ellipse cx="80" cy="74" rx="54" ry="52" fill="${c}"/>`;
  if (s === 'bun') p = `<circle cx="80" cy="18" r="20" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>` + p;
  return p;
}
// 瀏海（正面）
function hairFront(L, id) {
  const c = `url(#hg${id})`;
  const s = L.hairStyle;
  const dk = shade(L.hair, -0.35);
  let bang;
  if (s === 'short' || s === 'curly') {
    bang = `M28,92 C20,38 52,18 84,20 C118,22 142,42 132,92 C128,82 124,76 118,72 C118,78 116,82 112,85 C108,76 102,70 94,68 C94,74 92,78 88,82 C84,74 78,68 70,66 C70,72 66,78 60,80 C58,74 52,70 46,70 C44,78 38,84 32,90 Z`;
  } else if (s === 'bob') {
    bang = `M24,94 C18,36 54,18 80,18 C106,18 142,36 136,94 C134,86 132,80 126,76 L124,80 C120,76 114,74 106,74 L104,80 C98,76 90,74 82,74 L80,80 C76,76 68,74 60,74 L58,80 C52,76 46,76 40,78 L38,84 C32,86 28,90 24,94 Z`;
  } else {
    bang = `M26,96 C18,40 54,18 82,18 C114,18 144,40 134,96 C130,84 126,76 118,70 C118,76 114,80 110,83 C106,72 98,64 88,60 C88,68 84,74 78,77 C74,68 66,62 54,62 C56,70 52,76 46,80 C44,76 40,72 36,72 C34,82 30,90 26,96 Z`;
  }
  let side = '';
  if (s !== 'curly') {
    const ly = s === 'long' ? 160 : s === 'bob' ? 130 : 112;
    side = `<path d="M30,66 C22,96 26,${ly - 12} 38,${ly} C38,${ly - 22} 40,96 46,78 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`
      + `<path d="M130,66 C138,96 134,${ly - 12} 122,${ly} C122,${ly - 22} 120,96 114,78 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  }
  let curls = '';
  if (s === 'curly') curls = [[40, 46, 14], [62, 32, 15], [86, 28, 15], [108, 34, 14], [124, 52, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`).join('');
  const shine = `<path d="M44,46 C60,34 100,32 118,46" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M52,52 l6,-4 M64,46 l6,-3 M98,44 l6,2 M110,48 l5,3" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>`;
  const strands = `<path d="M72,28 C68,42 66,52 62,60 M98,30 C100,42 100,50 98,58 M86,26 C86,40 84,50 82,62" fill="none" stroke="${dk}" stroke-opacity=".4" stroke-width="1.6" stroke-linecap="round"/>`;
  return side + `<path d="${bang}" fill="${c}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>` + curls + strands + shine;
}
// 背面頭髮
function hairBackView(L, id) {
  const c = `url(#hg${id})`;
  const s = L.hairStyle;
  const dk = shade(L.hair, -0.3);
  let p = '';
  if (s === 'bun') p += `<circle cx="80" cy="18" r="20" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'long') p += `<path d="M24,74 C22,30 138,30 136,74 C140,120 138,160 128,182 L32,182 C22,160 20,120 24,74 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'bob') p += `<path d="M22,76 C20,28 140,28 138,76 C142,104 140,122 132,134 L28,134 C20,122 18,104 22,76 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'curly') p += [[34, 60, 22], [50, 34, 24], [80, 26, 26], [110, 34, 24], [126, 60, 22], [130, 90, 18], [30, 90, 18], [56, 112, 20], [104, 112, 20], [80, 116, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`).join('');
  p += `<path d="M24,78 C20,28 140,28 136,78 C138,100 128,114 112,118 Q80,126 48,118 C32,114 22,100 24,78 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (s === 'pony') p += `<path d="M66,92 C60,120 66,150 80,170 C94,150 100,120 94,92 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/><circle cx="80" cy="92" r="7" fill="${L.ribbon || '#c9826a'}" stroke="${OL}" stroke-width="1.6"/>`;
  p += `<path d="M80,34 C76,60 72,90 70,118 M60,40 C52,64 48,90 46,112 M100,40 C108,64 112,90 114,112" fill="none" stroke="${dk}" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"/>`;
  p += `<path d="M46,48 C60,36 100,34 116,48" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>`;
  return p;
}

// ---------- 臉 ----------
function face(L, id, expr) {
  let s = `<path d="M32,72 C32,44 128,44 128,72 L128,88 C126,112 104,128 80,130 C56,128 34,112 32,88 Z" fill="url(#sk${id})" stroke="${OL}" stroke-width="${SW}"/>`;
  // 耳朵
  s += `<path d="M32,90 C24,88 22,102 32,106" fill="${L.skin}" stroke="${OL}" stroke-width="${SW}"/><path d="M128,90 C136,88 138,102 128,106" fill="${L.skin}" stroke="${OL}" stroke-width="${SW}"/>`;
  // 腮紅
  s += `<ellipse cx="48" cy="112" rx="10" ry="5.5" fill="#f58f8f" opacity=".42"/><ellipse cx="112" cy="112" rx="10" ry="5.5" fill="#f58f8f" opacity=".42"/>`;
  s += `<path d="M43,113 l3,-3 M48,113 l3,-3 M53,113 l3,-3 M107,113 l3,-3 M112,113 l3,-3 M117,113 l3,-3" stroke="#e07070" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/>`;
  const eye = (cx, flip) => {
    const cy = 96;
    const o = flip ? 1 : -1; // 外眼角方向
    if (expr === 'happy') return `<path d="M${cx - 12},${cy + 2} Q${cx},${cy - 12} ${cx + 12},${cy + 2}" fill="none" stroke="${OL}" stroke-width="3.8" stroke-linecap="round"/>`;
    if (expr === 'sleep') return `<path d="M${cx - 12},${cy} Q${cx},${cy + 8} ${cx + 12},${cy}" fill="none" stroke="${OL}" stroke-width="3.2" stroke-linecap="round"/><path d="M${cx + o * 12},${cy} l${o * 4},${-2}" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`;
    const sad = expr === 'sad';
    let e = `<path d="M${cx - 12},${cy - 4} Q${cx - 12},${cy - 16} ${cx},${cy - 16} Q${cx + 12},${cy - 16} ${cx + 12},${cy - 4} L${cx + 12},${cy + 5} Q${cx + 12},${cy + 15} ${cx},${cy + 15} Q${cx - 12},${cy + 15} ${cx - 12},${cy + 5} Z" fill="#fff"/>`;
    e += `<ellipse cx="${cx - o * 0.8}" cy="${cy + 1.5}" rx="10.2" ry="13" fill="url(#ir${id})"/>`;
    e += `<ellipse cx="${cx - o * 0.8}" cy="${cy + 3}" rx="5" ry="6.8" fill="${shade(L.eye, -0.65)}"/>`;
    e += `<path d="M${cx - 8},${cy + 8} Q${cx},${cy + 14} ${cx + 8},${cy + 8}" fill="none" stroke="${shade(L.eye, 0.6)}" stroke-width="2.6" stroke-opacity=".85" stroke-linecap="round"/>`;
    e += `<ellipse cx="${cx + o * 3.5}" cy="${cy - 5}" rx="4.4" ry="5.2" fill="#fff"/><circle cx="${cx - o * 4}" cy="${cy + 7}" r="2" fill="#fff"/>`;
    // 上眼皮（粗）＋外眼角睫毛
    const top = sad ? cy - 13 : cy - 15;
    e += `<path d="M${cx - 13},${cy - 2} Q${cx - 12.5},${top} ${cx},${top} Q${cx + 12.5},${top} ${cx + 13},${cy - 2}" fill="none" stroke="${OL}" stroke-width="4.4" stroke-linecap="round"/>`;
    e += `<path d="M${cx + o * 13},${cy - 4} Q${cx + o * 17},${cy - 4} ${cx + o * 18.5},${cy + 1}" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>`;
    e += `<path d="M${cx + o * 6},${cy + 15.5} Q${cx + o * 10},${cy + 15} ${cx + o * 12},${cy + 11}" fill="none" stroke="${OL}" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>`;
    // 眉毛
    if (sad) e += `<path d="M${cx + o * 9},${cy - 26} L${cx - o * 7},${cy - 22}" fill="none" stroke="${shade(L.hair, -0.25)}" stroke-width="2.2" stroke-linecap="round"/>`;
    return e;
  };
  s += eye(58, false) + eye(102, true);
  // 眉毛
  // 鼻子、嘴巴
  s += `<path d="M79,110 l1.5,1.5" stroke="${shade(L.skin, -0.35)}" stroke-width="1.6" stroke-linecap="round"/>`;
  if (expr === 'happy') s += `<path d="M74,116 Q80,126 86,116 Z" fill="#c9545a" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/><path d="M76.5,120 Q80,123 83.5,120" fill="#f29a9a"/>`;
  else if (expr === 'sleep') s += `<ellipse cx="80" cy="119" rx="3" ry="2.4" fill="#c9545a" stroke="${OL}" stroke-width="1.2"/>`;
  else if (expr === 'sad') s += `<path d="M75,121 Q80,116 85,121" fill="none" stroke="${OL}" stroke-width="1.8" stroke-linecap="round"/>`;
  else s += `<path d="M76,118 Q80,121.5 84,118" fill="none" stroke="${OL}" stroke-width="1.9" stroke-linecap="round"/>`;
  if (L.glasses) s += `<g fill="none" stroke="#3b2a22" stroke-width="2.2"><circle cx="58" cy="96" r="16"/><circle cx="102" cy="96" r="16"/><path d="M74,94 Q80,90 86,94"/></g><path d="M47,88 l6,-4 M91,88 l6,-4" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`;
  return s;
}

// ---------- 帽子 ----------
function hat(L, back) {
  if (L.hat === 'beret') return `<path d="M30,44 C30,14 120,6 136,34 C144,48 130,54 112,50 C88,46 58,52 30,52 Z" fill="#3b2a22" stroke="${OL}" stroke-width="${SW}"/><path d="M80,12 l2,-8" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
  if (L.hat === 'cap') {
    const c = L.capColor;
    return `<path d="M30,52 C30,14 130,14 130,52 C110,46 50,46 30,52 Z" fill="${c}" stroke="${OL}" stroke-width="${SW}"/><path d="M80,18 C78,30 78,40 80,48" fill="none" stroke="${shade(c, -0.25)}" stroke-width="1.6"/><circle cx="80" cy="18" r="3.6" fill="${shade(c, -0.2)}" stroke="${OL}" stroke-width="1.4"/><path d="M52,30 C60,24 74,22 84,22" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>`
      + (back ? '' : `<path d="M36,50 C56,44 104,44 124,50 C140,52 140,62 124,62 C100,58 60,58 36,62 C22,62 22,52 36,50 Z" fill="${shade(c, -0.12)}" stroke="${OL}" stroke-width="${SW}"/>`);
  }
  if (L.hat === 'bandana') return `<path d="M28,52 C30,24 130,24 132,52 C110,46 50,46 28,52 Z" fill="${L.capColor}" stroke="${OL}" stroke-width="${SW}"/>`;
  return '';
}

// ---------- 身體 ----------
function legsSVG(L, pose) {
  const pants = L.bottomType !== 'skirt';
  const legC = pants ? L.bottom : L.skin;
  const sock = pants ? L.bottom : '#f4efe6';
  let s = '';
  if (pose.sit) {
    // 坐姿：大腿往前縮短，小腿垂下
    s += `<rect x="60" y="176" width="17" height="24" rx="7" fill="${legC}" stroke="${OL}" stroke-width="${SW}"/>`;
    s += `<rect x="83" y="176" width="17" height="24" rx="7" fill="${legC}" stroke="${OL}" stroke-width="${SW}"/>`;
    s += `<rect x="62" y="194" width="13" height="16" rx="5" fill="${sock}" stroke="${OL}" stroke-width="${SW}"/><rect x="85" y="194" width="13" height="16" rx="5" fill="${sock}" stroke="${OL}" stroke-width="${SW}"/>`;
    s += `<ellipse cx="68" cy="212" rx="10" ry="6" fill="${L.shoe}" stroke="${OL}" stroke-width="${SW}"/><ellipse cx="92" cy="212" rx="10" ry="6" fill="${L.shoe}" stroke="${OL}" stroke-width="${SW}"/>`;
    return s;
  }
  const a = pose.step || 0; // -1, 0, 1
  const ll = 46 + a * 4, rl = 46 - a * 4;
  const lx = 62 - a * 2, rx = 84 + a * 2;
  s += `<rect x="${lx}" y="172" width="14" height="${ll}" rx="6" fill="${legC}" stroke="${OL}" stroke-width="${SW}"/>`;
  s += `<rect x="${rx}" y="172" width="14" height="${rl}" rx="6" fill="${legC}" stroke="${OL}" stroke-width="${SW}"/>`;
  if (!pants) s += `<rect x="${lx}" y="${172 + ll - 16}" width="14" height="16" rx="5" fill="${sock}" stroke="${OL}" stroke-width="${SW}"/><rect x="${rx}" y="${172 + rl - 16}" width="14" height="16" rx="5" fill="${sock}" stroke="${OL}" stroke-width="${SW}"/>`;
  s += `<ellipse cx="${lx + 6}" cy="${172 + ll}" rx="10.5" ry="6" fill="${L.shoe}" stroke="${OL}" stroke-width="${SW}"/>`;
  s += `<ellipse cx="${rx + 8}" cy="${172 + rl}" rx="10.5" ry="6" fill="${L.shoe}" stroke="${OL}" stroke-width="${SW}"/>`;
  return s;
}
function torsoSVG(L, back) {
  const t = L.top;
  let s = `<path d="M54,134 C54,128 64,124 80,124 C96,124 106,128 106,134 L110,176 C96,182 64,182 50,176 Z" fill="${t}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  s += `<path d="M56,170 C70,175 90,175 104,170" fill="none" stroke="${shade(t, -0.25)}" stroke-width="1.6" stroke-opacity=".7"/>`;
  if (!back) {
    if (L.topStyle === 'shirt') s += `<path d="M70,125 L80,138 L90,125 L86,122 L80,130 L74,122 Z" fill="#fff" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="80" cy="146" r="1.6" fill="${shade(t, -0.4)}"/><circle cx="80" cy="156" r="1.6" fill="${shade(t, -0.4)}"/>`;
    else if (L.topStyle === 'knit') s += `<path d="M68,124 Q80,134 92,124" fill="none" stroke="${shade(t, -0.3)}" stroke-width="3"/><path d="M62,140 v30 M70,138 v34 M90,138 v34 M98,140 v30" stroke="${shade(t, -0.15)}" stroke-width="1.4"/>`;
    else if (L.topStyle === 'vest') s += `<path d="M66,126 L80,150 L94,126" fill="#fff" stroke="${OL}" stroke-width="1.6"/><path d="M74,128 L80,136 L86,128" fill="${'#5e2129'}"/>`;
    else s += `<path d="M70,124 Q80,132 90,124" fill="none" stroke="${shade(t, -0.3)}" stroke-width="2"/>`;
  }
  if (L.bottomType === 'skirt') {
    s += `<path d="M54,168 L106,168 L116,200 C96,206 64,206 44,200 Z" fill="${L.bottom}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s += `<path d="M66,172 L62,200 M80,172 L80,203 M94,172 L98,200" stroke="${shade(L.bottom, -0.25)}" stroke-width="1.4"/>`;
  }
  if (L.apron && !back) {
    const a = L.apron;
    s += `<path d="M64,140 L96,140 L100,196 C88,200 72,200 60,196 Z" fill="${a}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s += `<path d="M64,140 L60,126 M96,140 L100,126" stroke="${a}" stroke-width="4"/><path d="M64,140 L60,126 M96,140 L100,126" stroke="${OL}" stroke-width="1" stroke-opacity=".6"/>`;
    s += `<rect x="72" y="166" width="16" height="12" rx="2" fill="${shade(a, 0.12)}" stroke="${OL}" stroke-width="1.4"/>`;
    s += `<path d="M76,150 h8" stroke="#e2c27a" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  if (L.apron && back) s += `<path d="M58,160 L102,160" stroke="${L.apron}" stroke-width="4"/><path d="M80,160 l-8,14 M80,160 l8,14" stroke="${L.apron}" stroke-width="3.4" stroke-linecap="round"/>`;
  return s;
}
function armsSVG(L, pose) {
  const t = L.top;
  const sw = pose.swing || 0;
  let s = '';
  const arm = (side, ang) => {
    const sx = side < 0 ? 56 : 104;
    return `<g transform="rotate(${ang} ${sx} 132)"><path d="M${sx - 6},130 C${sx - 9},146 ${sx - 8 + side * 2},158 ${sx - 4 + side * 3},164 L${sx + 5 + side * 3},162 C${sx + 6},150 ${sx + 7},140 ${sx + 6},130 Z" fill="${t}" stroke="${OL}" stroke-width="${SW}" stroke-linejoin="round"/>`
      + `<circle cx="${sx + side * 3}" cy="${167}" r="6.5" fill="${L.skin}" stroke="${OL}" stroke-width="${SW}"/></g>`;
  };
  if (pose.carry) {
    // 右手平舉托盤
    s += arm(-1, 6 + sw);
    s += `<path d="M100,130 C108,138 112,146 108,152 L96,154" fill="none" stroke="${t}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M100,130 C108,138 112,146 108,152 L96,154" fill="none" stroke="${OL}" stroke-width="1.4" stroke-opacity=".6" stroke-linecap="round"/>`;
    s += `<ellipse cx="96" cy="150" rx="26" ry="6" fill="#c9cdd1" stroke="${OL}" stroke-width="${SW}"/>`;
    s += `<path d="M86,132 L88,148 L100,148 L102,132 Z" fill="#fffaf0" stroke="${OL}" stroke-width="1.8"/><ellipse cx="94" cy="132" rx="8" ry="2.6" fill="#6b3e26" stroke="${OL}" stroke-width="1.4"/>`;
    s += `<circle cx="96" cy="154" r="6" fill="${L.skin}" stroke="${OL}" stroke-width="${SW}"/>`;
    return s;
  }
  if (pose.sit) return arm(-1, 22) + arm(1, -22);
  return arm(-1, 8 + sw) + arm(1, -8 - sw);
}

function defs(L, id) {
  return `<defs>
    <linearGradient id="hg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(L.hair, 0.18)}"/><stop offset=".55" stop-color="${L.hair}"/><stop offset="1" stop-color="${shade(L.hair, -0.25)}"/></linearGradient>
    <linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(L.skin, -0.08)}"/><stop offset=".3" stop-color="${L.skin}"/><stop offset="1" stop-color="${shade(L.skin, 0.06)}"/></linearGradient>
    <linearGradient id="ir${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(L.eye, -0.55)}"/><stop offset=".55" stop-color="${L.eye}"/><stop offset="1" stop-color="${shade(L.eye, 0.45)}"/></linearGradient>
  </defs>`;
}

// 產生一個動作的 SVG（不含外框 svg 標籤）
export function frameSVG(look, frame) {
  const L = normLook(look);
  const id = 'c' + (uidN++);
  const back = frame.startsWith('b_');
  const pose = {
    sit: frame.endsWith('sit') || frame === 'f_sleep',
    step: frame.endsWith('walk1') ? 1 : frame.endsWith('walk2') ? -1 : 0,
    carry: frame.includes('carry'),
  };
  pose.swing = pose.step * 10;
  const expr = frame === 'f_happy' ? 'happy' : frame === 'f_sleep' ? 'sleep' : 'normal';
  const bob = pose.step ? -2 : 0;
  const sitDy = pose.sit ? 0 : 0;
  let s = defs(L, id);
  s += `<g transform="translate(0 ${bob + sitDy})">`;
  if (!back && (L.hairStyle === 'long' || L.hairStyle === 'bob' || L.hairStyle === 'pony' || L.hairStyle === 'bun' || L.hairStyle === 'curly')) {
    // 正面時，長髮在身體後面
    if (L.hairStyle === 'long') s += `<path d="M28,90 C24,130 30,166 40,184 L120,184 C130,166 136,130 132,90 Z" fill="url(#hg${id})" stroke="${OL}" stroke-width="${SW}"/>`;
    if (L.hairStyle === 'pony') s += `<path d="M118,60 C150,56 156,98 146,132 C140,150 128,152 124,142 C134,120 136,90 116,74 Z" fill="url(#hg${id})" stroke="${OL}" stroke-width="${SW}"/>`;
  }
  s += legsSVG(L, pose);
  if (back) s += armsSVG(L, { ...pose, carry: false }) + torsoSVG(L, true);
  else s += torsoSVG(L, false) + armsSVG(L, pose);
  // 脖子
  s += `<rect x="72" y="120" width="16" height="12" rx="4" fill="${back ? L.skin : `url(#sk${id})`}" stroke="${OL}" stroke-width="${SW}"/>`;
  const tilt = frame === 'f_sleep' ? 'rotate(-10 80 120)' : '';
  s += `<g transform="${tilt}">`;
  if (back) {
    s += hairBackView(L, id) + hat(L, true);
    if (pose.carry) s += `<ellipse cx="104" cy="122" rx="22" ry="5" fill="#c9cdd1" stroke="${OL}" stroke-width="${SW}"/>`;
  } else {
    s += hairBack(L, id) + face(L, id, expr) + hairFront(L, id) + hat(L, false);
    if (L.ribbon && L.hairStyle !== 'pony') s += `<path d="M112,36 l14,-8 l-2,16 Z M112,36 l-10,-12 l-4,14 Z" fill="${L.ribbon}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="112" cy="36" r="4" fill="${L.ribbon}" stroke="${OL}" stroke-width="1.4"/>`;
  }
  s += `</g></g>`;
  return s;
}

export function sheetSVG(look) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${FW * COLS}" height="${FH * ROWS}" viewBox="0 0 ${FW * COLS} ${FH * ROWS}">`;
  FRAMES.forEach((fr, i) => {
    const x = (i % COLS) * FW, y = Math.floor(i / COLS) * FH;
    s += `<g transform="translate(${x} ${y})">${frameSVG(look, fr)}</g>`;
  });
  return s + '</svg>';
}

// 外部美術（AI 生成或素材包）：assets/chars/manifest.json 對應到 4×3 格的 PNG
let ART = {};
export function setArtOverrides(map) { ART = map || {}; }
export function artFor(look) { return look && look.art && ART[look.art] ? 'assets/chars/' + ART[look.art] : null; }
function artHTML(url, frame, w, h, crop = false) {
  const i = Math.max(0, FRAMES.indexOf(frame));
  const cx = i % COLS, cy = Math.floor(i / COLS);
  const fw = crop ? w * 160 / 124 : w, fh = crop ? fw * 240 / 160 : h;
  return `<div class="artpng" style="width:${w}px;height:${h}px;background-image:url('${url}');background-size:${fw * COLS}px ${fh * ROWS}px;background-position:${-cx * fw - (crop ? fw * 18 / 160 : 0)}px ${-cy * fh}px"></div>`;
}

// 單張頭像（給對話框與名單用）
export function portraitSVG(look, expr = 'normal', size = 120) {
  const fr = expr === 'happy' ? 'f_happy' : 'f_stand';
  const ov = artFor(look); if (ov) return artHTML(ov, fr, size, size * 140 / 124, true);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 0 124 140" width="${size}" height="${size * 140 / 124}" aria-hidden="true">${frameSVG(look, fr)}</svg>`;
}
export function fullSVG(look, frame = 'f_stand', h = 200) {
  const ov = artFor(look); if (ov) return artHTML(ov, frame, h * FW / FH, h);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}" width="${h * FW / FH}" height="${h}" aria-hidden="true">${frameSVG(look, frame)}</svg>`;
}

// 轉成圖片（非同步）
const sheetCache = new Map();
export function lookKey(look) { return JSON.stringify(normLook(look)); }
export function sheetCanvas(look, scale = 0.8) {
  const key = lookKey(look) + scale;
  if (sheetCache.has(key)) return sheetCache.get(key);
  const p = new Promise((resolve, reject) => {
    const svg = sheetSVG(look);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(FW * COLS * scale); c.height = Math.round(FH * ROWS * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
  sheetCache.set(key, p);
  return p;
}
