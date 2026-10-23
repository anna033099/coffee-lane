// 店貓：外觀（SVG）、狀態與在店裡閒晃的行為
import { CATS } from './data.js';
import { now } from './state.js';

const OL = '#4a3128';
export const CAT_FRAMES = ['sit', 'walk1', 'walk2', 'sleep'];
export function catSVG(type, frame) {
  const c = CATS[type] || CATS.orange;
  const fur = c.fur, belly = c.belly;
  const dark = type === 'black';
  const eye = dark ? '#f2c24e' : '#3b2a22';
  const stripes = c.pattern === 'stripe' ? `<path d="M50,40 q4,6 0,10 M60,36 q3,6 0,10 M70,40 q-4,6 0,10" stroke="${type === 'orange' ? '#c46a2a' : '#6a5a48'}" stroke-width="3" fill="none" stroke-linecap="round"/>` : '';
  const calico = c.pattern === 'calico' ? `<ellipse cx="46" cy="40" rx="10" ry="8" fill="#e39a4f"/><ellipse cx="74" cy="44" rx="9" ry="7" fill="#3a3436"/>` : '';
  if (frame === 'sleep') {
    return `<ellipse cx="64" cy="112" rx="40" ry="7" fill="rgba(0,0,0,.16)"/>
      <path d="M26,104 Q24,74 60,72 Q100,72 104,100 Q104,112 64,112 Q28,112 26,104 Z" fill="${fur}" stroke="${OL}" stroke-width="3"/>
      <path d="M100,104 Q120,100 112,84" fill="none" stroke="${fur}" stroke-width="10" stroke-linecap="round"/><path d="M100,104 Q120,100 112,84" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <path d="M30,98 Q30,78 50,76 L46,64 L58,72 L66,70 L74,62 L74,76 Q86,80 84,98 Q70,106 46,104 Q32,104 30,98 Z" fill="${fur}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      ${calico}<path d="M44,90 q5,4 10,0 M62,90 q5,4 10,0" stroke="${OL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="57" cy="97" rx="3" ry="2" fill="#e88a8a"/>
      <text x="96" y="62" font-size="16" font-weight="900" fill="#6f8fd0" font-family="Georgia">z</text><text x="106" y="48" font-size="12" font-weight="900" fill="#6f8fd0" font-family="Georgia">z</text>`;
  }
  const step = frame === 'walk1' ? 4 : frame === 'walk2' ? -4 : 0;
  return `<ellipse cx="64" cy="118" rx="30" ry="6" fill="rgba(0,0,0,.16)"/>
    <path d="M86,104 Q112,96 108,66" fill="none" stroke="${fur}" stroke-width="10" stroke-linecap="round"/><path d="M86,104 Q112,96 108,66" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
    <path d="M40,116 Q34,84 64,80 Q94,84 88,116 Z" fill="${fur}" stroke="${OL}" stroke-width="3"/>
    <path d="M52,116 Q52,96 64,94 Q76,96 76,116 Z" fill="${belly}"/>
    <rect x="${46 + step}" y="104" width="12" height="14" rx="6" fill="${fur}" stroke="${OL}" stroke-width="2.6"/><rect x="${70 - step}" y="104" width="12" height="14" rx="6" fill="${fur}" stroke="${OL}" stroke-width="2.6"/>
    <path d="M26,58 Q24,26 44,22 L40,6 L58,18 L70,18 L88,6 L84,22 Q104,26 102,58 Q100,84 64,86 Q28,84 26,58 Z" fill="${fur}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44,14 L48,22 L54,18 Z M84,14 L80,22 L74,18 Z" fill="#f2a6a6"/>
    ${calico}${stripes}
    <ellipse cx="50" cy="56" rx="6" ry="8" fill="${eye}"/><ellipse cx="78" cy="56" rx="6" ry="8" fill="${eye}"/>
    <circle cx="52" cy="53" r="2.4" fill="#fff"/><circle cx="80" cy="53" r="2.4" fill="#fff"/>
    <path d="M61,66 L67,66 L64,70 Z" fill="#e88a8a"/><path d="M58,72 q6,5 6,-2 q0,7 6,2" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M28,64 l14,2 M28,72 l14,-2 M100,64 l-14,2 M100,72 l-14,-2" stroke="${OL}" stroke-width="1.6" opacity=".6"/>
    <ellipse cx="40" cy="70" rx="6" ry="3.4" fill="#f58f8f" opacity=".4"/><ellipse cx="88" cy="70" rx="6" ry="3.4" fill="#f58f8f" opacity=".4"/>`;
}
export function catSheetSVG(type) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128" viewBox="0 0 512 128">${CAT_FRAMES.map((f, i) => `<g transform="translate(${i * 128} 0)">${catSVG(type, f)}</g>`).join('')}</svg>`;
}
export function catIcon(type, size = 80, frame = 'sit') { return `<svg viewBox="0 0 128 128" width="${size}" height="${size}" aria-hidden="true">${catSVG(type, frame)}</svg>`; }

// ---------- 狀態 ----------
export function catLevel(cat) { return Math.min(5, 1 + Math.floor((cat.love || 0) / 20)); }
export function catTick(g, cat, t = now()) {
  // 每小時餓一點
  const hrs = (t - (cat.hungerT || t)) / 3600;
  if (hrs >= 1) { cat.hunger = Math.max(0, cat.hunger - Math.floor(hrs)); cat.hungerT = (cat.hungerT || t) + Math.floor(hrs) * 3600; }
}
export const CAT_SKILLS = [
  { lv: 1, name: '招財', desc: '叼來客人掉的零錢', cd: 4 * 3600, run: (g) => { const n = 200 + g.s.level * 60 * catLevel(g.s.cat); g.addGold(n); return `撿到 ${n} 金幣！`; } },
  { lv: 3, name: '暖爐', desc: '趴在烘豆機上，正在烘的豆子立刻完成', cd: 6 * 3600, run: (g) => { let k = 0; for (const m of g.s.machines) if (m.job && m.job.kind === 'roast' && g.status(m).st === 'run') { m.job.dur = Math.max(0, now() - m.job.start); k++; } g.touch(); return k ? `${k} 台烘豆機立刻完成了！` : '可是現在沒有在烘豆…（技能還是用掉了）'; } },
  { lv: 5, name: '人氣王', desc: '店貓太可愛，所有員工元氣全滿', cd: 8 * 3600, run: (g) => { for (const st of g.s.staff) st.energy = g.maxEnergy(st); return '員工們看到店貓，元氣全滿了！'; } },
];

// 在店裡閒晃（只在畫面上，不影響經營）
export class CatAI {
  constructor(g) { this.g = g; this.rt = null; }
  update(dt) {
    const g = this.g, cat = g.s.cat;
    if (!cat) { this.rt = null; return; }
    if (!this.rt) this.rt = { x: g.W - 1.5, y: g.D - 1.5, path: [], state: 'sit', t: 0, dir: 0 };
    const r = this.rt;
    r.t += dt;
    if (r.path.length) {
      const n = r.path[0], dx = n.x - r.x, dy = n.y - r.y, d = Math.hypot(dx, dy), sp = 0.9 * dt;
      if (d > 0.001) r.dir = dx - dy > 0 ? 1 : 0;
      if (d <= sp) { r.x = n.x; r.y = n.y; r.path.shift(); } else { r.x += dx / d * sp; r.y += dy / d * sp; }
      r.state = 'walk'; r.phase = (r.phase || 0) + dt * 6;
      if (!r.path.length) { r.state = cat.hunger < 3 || Math.random() < 0.4 ? 'sleep' : 'sit'; r.t = 0; }
      return;
    }
    if (r.t > (r.state === 'sleep' ? 25 : 9)) {
      r.t = 0;
      const tiles = [];
      for (let x = 0; x < g.W; x++) for (let y = 3; y < g.D; y++) if (g.staffWalk(x, y) && !g.reserved(x, y)) tiles.push({ x, y });
      if (tiles.length) { const tt = tiles[Math.floor(Math.random() * tiles.length)]; const p = g.path(r.x, r.y, (x, y) => x === tt.x && y === tt.y, (x, y) => g.staffWalk(x, y)); if (p) r.path = p; }
    }
  }
  frame() { const r = this.rt; if (!r) return 'sit'; if (r.state === 'walk') return Math.sin(r.phase) > 0 ? 'walk1' : 'walk2'; return r.state; }
}
