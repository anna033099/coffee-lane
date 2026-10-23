// 手作咖啡小遊戲：進修（第一次學）、評比（升星）、常客特別訂單
import { h, modal, ic } from './core.js';
import { RECIPES, INGS, TOOL_INGS } from '../data.js';
import { sfx } from '../audio.js';
import { ingIcon } from '../icons.js';

const LIQ = new Set(['shot', 'water', 'milk', 'coldmilk', 'vanilla', 'matcha', 'pour', 'dutch']);

function expand(steps) { const out = []; for (const [k, n] of steps) for (let i = 0; i < n; i++) out.push(k); return out; }
function groups(seq) { const g = []; for (const k of seq) if (!g.length || g[g.length - 1] !== k) g.push(k); return g; }
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}
export function judge(recipeId, layers) {
  const exp = expand(RECIPES[recipeId].steps);
  const got = layers.map(l => l.ing);
  const cnt = {}; for (const k of exp) cnt[k] = (cnt[k] || 0) + 1;
  for (const k of got) cnt[k] = (cnt[k] || 0) - 1;
  const countErr = Object.values(cnt).reduce((a, b) => a + Math.abs(b), 0);
  const ge = groups(exp), gg = groups(got);
  const orderErr = Math.max(ge.length, gg.length) - lcs(ge, gg);
  let timing = 0;
  for (const l of layers) if (l.q === 'bad') timing += 12; else if (l.q === 'good') timing += 4;
  const score = Math.max(0, Math.min(100, 100 - countErr * 18 - orderErr * 8 - timing));
  const grade = score >= 90 ? 'perfect' : score >= 72 ? 'great' : score >= 50 ? 'good' : 'bad';
  return { score, grade, countErr, orderErr };
}
export const GRADE_LABEL = { perfect: 'Perfect!', great: 'Great!', good: 'Good', bad: 'Oops…' };
export const GRADE_ZH = { perfect: '完美', great: '很棒', good: '合格', bad: '失敗' };

// 畫杯子裡的內容
function glassSVG(recipeId, layers) {
  const r = RECIPES[recipeId];
  const total = Math.max(expand(r.steps).filter(k => LIQ.has(k) || k === 'foam' || k === 'ice').length, 3) + 1;
  const cup = r.cup;
  const tall = cup === 'tall' || cup === 'frappe';
  const mugLike = cup === 'mug' || cup === 'cup' || cup === 'demi';
  const top = tall ? 20 : cup === 'demi' ? 120 : 60, bot = 300;
  const lw = cup === 'rocks' ? 92 : cup === 'demi' ? 60 : 72, bw = cup === 'rocks' ? 86 : cup === 'demi' ? 52 : 58;
  const cx = 110;
  const path = `M${cx - lw},${top} L${cx - bw},${bot} Q${cx},${bot + 12} ${cx + bw},${bot} L${cx + lw},${top} Z`;
  const unitH = (bot - top - 14) / total;
  let s = `<defs><clipPath id="gclip"><path d="${path}"/></clipPath></defs>`;
  s += `<ellipse cx="${cx}" cy="${bot + 12}" rx="${lw + 18}" ry="10" fill="rgba(74,47,34,.18)"/>`;
  s += `<path d="${path}" fill="${mugLike ? '#fffaf2' : 'rgba(235,246,248,.55)'}" stroke="#5a3a2a" stroke-width="4"/>`;
  let y = bot;
  let g = '';
  const blended = layers.some(l => l.ing === 'blend');
  const liquids = layers.filter(l => LIQ.has(l.ing) || l.ing === 'foam');
  if (blended) {
    // 打成冰沙：顏色混在一起
    const n = Math.max(1, liquids.length + layers.filter(l => l.ing === 'ice').length);
    const hh = unitH * n;
    g += `<rect x="0" y="${y - hh}" width="220" height="${hh}" fill="#d8c3a5"/>`;
    for (let i = 0; i < 26; i++) g += `<circle cx="${cx - lw + Math.random() * lw * 2}" cy="${y - Math.random() * hh}" r="${2 + Math.random() * 3}" fill="#fff" opacity=".45"/>`;
    y -= hh;
  } else {
    for (const l of layers) {
      const d = INGS[l.ing];
      if (LIQ.has(l.ing)) { g += `<rect x="0" y="${y - unitH}" width="220" height="${unitH + 1}" fill="${d.color}"/>`; y -= unitH; }
      else if (l.ing === 'foam') { g += `<rect x="0" y="${y - unitH}" width="220" height="${unitH + 1}" fill="#fbf6ec"/>`; for (let i = 0; i < 8; i++) g += `<circle cx="${cx - 50 + i * 14}" cy="${y - unitH + 6}" r="3" fill="#fff"/>`; y -= unitH; }
    }
  }
  // 冰塊
  const ices = layers.filter(l => l.ing === 'ice').length;
  for (let i = 0; i < ices * 3; i++) { const x = cx - lw + 20 + (i * 37) % (lw * 2 - 40), yy = bot - 30 - ((i * 53) % Math.max(40, bot - y - 10)); g += `<rect x="${x}" y="${yy}" width="26" height="26" rx="5" fill="#fff" opacity=".55" stroke="#bfe0ea" stroke-width="2" transform="rotate(${(i * 23) % 40 - 20} ${x + 13} ${yy + 13})"/>`; }
  // 醬汁：杯壁流下
  for (const l of layers.filter(q => q.ing === 'choco' || q.ing === 'caramel')) {
    const c = INGS[l.ing].color;
    g += `<path d="M${cx - lw + 6},${top + 30} q20,40 10,90 q-6,40 8,80" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/><path d="M${cx + lw - 8},${top + 40} q-16,50 -6,100" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>`;
  }
  s += `<g clip-path="url(#gclip)">${g}</g>`;
  // 鮮奶油、肉桂、表面
  const creams = layers.filter(l => l.ing === 'cream').length;
  for (let i = 0; i < creams; i++) {
    const yy = Math.max(top, y) - i * 22;
    s += `<path d="M${cx - 56},${yy} q-4,-24 20,-22 q4,-24 32,-16 q22,-12 30,10 q22,4 10,28 Z" fill="#fffdf6" stroke="#5a3a2a" stroke-width="3"/>`;
  }
  if (layers.some(l => l.ing === 'cinnamon')) for (let i = 0; i < 14; i++) s += `<circle cx="${cx - 40 + Math.random() * 80}" cy="${Math.max(top, y) - creams * 22 - Math.random() * 10}" r="2.2" fill="#9a5a33"/>`;
  if (layers.some(l => l.ing === 'caramel') && (creams || layers.some(l => l.ing === 'foam'))) s += `<path d="M${cx - 44},${Math.max(top, y) - creams * 20} l14,-10 l14,12 l14,-12 l14,12 l14,-10" stroke="#c47a2c" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${cx - lw + 12},${top + 12} L${cx - bw + 10},${bot - 12}" stroke="#fff" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>`;
  if (mugLike) s += `<path d="M${cx + lw - 2},${top + 40} q50,6 44,60 q-6,46 -52,40" fill="none" stroke="#5a3a2a" stroke-width="10"/><path d="M${cx + lw - 2},${top + 40} q50,6 44,60 q-6,46 -52,40" fill="none" stroke="#fffaf2" stroke-width="5"/>`;
  return `<svg class="glass" viewBox="0 0 260 330">${s}</svg>`;
}

// mode：train / test / special；onDone(grade)
export function openBarista(recipeId, mode, onDone, opt = {}) {
  const r = RECIPES[recipeId];
  const layers = [];
  let gaugeOn = null;
  let finished = false;
  const expSeq = expand(r.steps);
  const tools = Object.keys(TOOL_INGS);
  // 按鈕：需要的材料 + 兩個干擾項
  const needed = [...new Set(expSeq)];
  const pool = [...new Set(tools.flatMap(t => opt.ownedTools && !opt.ownedTools[t] ? [] : TOOL_INGS[t]))].filter(k => !needed.includes(k) && k !== 'pour' && k !== 'dutch');
  const extra = pool.sort(() => Math.random() - 0.5).slice(0, mode === 'train' ? 0 : 2);
  const buttons = [...needed, ...extra].sort(() => mode === 'train' ? 0 : Math.random() - 0.5);
  const ribbon = { train: 'Lesson', test: 'Contest', special: 'Special' }[mode];
  const title = { train: `進修：${r.name}`, test: `咖啡評比：${r.name}`, special: `特別訂單：${r.name}` }[mode];
  const m = modal({
    ribbon, title, wide: true, closable: !opt.noClose, onClose: () => { if (gaugeOn) cancelAnimationFrame(gaugeOn.raf); if (!finished && opt.onCancel) opt.onCancel(); },
    render: (body) => {
      const card = h('div', { class: 'recipe-card' }, h('h4', { text: r.name }), h('div', { class: 'en', text: r.en }));
      const exGroups = r.steps;
      let used = 0;
      exGroups.forEach(([k, n], gi) => {
        const d = INGS[k];
        const doneCnt = Math.max(0, Math.min(n, layers.length - used));
        const cur = layers.length >= used && layers.length < used + n;
        const ok = layers.length >= used + n;
        used += n;
        const showCnt = mode !== 'special' || opt.showRecipe;
        card.appendChild(h('div', { class: 'step' + (cur && mode === 'train' ? ' cur' : '') + (ok && mode === 'train' ? ' ok' : '') }, h('span', { class: 'ig', html: ingIcon(k, 26) }), `${gi + 1}. ${d.name}`, showCnt && !(ok && mode === 'train') ? h('span', { class: 'cnt', text: (mode === 'train' ? `${doneCnt}/` : '×') + n }) : null));
      });
      if (mode !== 'train') card.appendChild(h('p', { class: 'muted small', text: '照順序加入材料；萃取濃縮時，指針在綠色區停下最好。' }));
      const stage = h('div', { class: 'glass-stage', html: glassSVG(recipeId, layers) });
      if (gaugeOn) {
        const gauge = h('div', { class: 'gauge' }, h('i', { style: `left:${gaugeOn.pos * 100}%` }));
        gaugeOn.el = gauge.firstChild;
        stage.append(gauge, h('div', { class: 'gauge-tip', text: INGS[gaugeOn.ing].name + '：在綠色區按「停！」' }));
      }
      const right = h('div', { class: 'ingbtns' });
      if (gaugeOn) {
        right.append(h('button', { class: 'btn hot lg', style: 'grid-column:span 2;height:6rem;font-size:1.6rem', onclick: stopGauge }, '停！'));
      } else {
        for (const k of buttons) {
          const d = INGS[k];
          right.appendChild(h('button', { class: 'ingbtn', onclick: () => add(k) }, h('span', { class: 'ig', html: ingIcon(k, 40) }), d.name));
        }
        right.append(
          h('button', { class: 'btn', onclick: () => { layers.length = 0; m.rerender(); } }, '倒掉重來'),
          h('button', { class: 'btn go', onclick: done, disabled: !layers.length }, '完成'));
      }
      body.appendChild(h('div', { class: 'barista' }, card, stage, right));
    },
  });
  function add(k) {
    if (finished) return;
    if (k === 'shot' || k === 'pour' || k === 'dutch') {
      const speed = mode === 'train' ? 0.55 : 0.85;
      gaugeOn = { ing: k, pos: 0, dir: 1, raf: 0, last: performance.now() };
      const step = (t) => {
        if (!gaugeOn) return;
        const dt = (t - gaugeOn.last) / 1000; gaugeOn.last = t;
        gaugeOn.pos += gaugeOn.dir * dt * speed;
        if (gaugeOn.pos > 1) { gaugeOn.pos = 1; gaugeOn.dir = -1; } if (gaugeOn.pos < 0) { gaugeOn.pos = 0; gaugeOn.dir = 1; }
        if (gaugeOn.el) gaugeOn.el.style.left = (gaugeOn.pos * 100) + '%';
        gaugeOn.raf = requestAnimationFrame(step);
      };
      m.rerender();
      gaugeOn.raf = requestAnimationFrame(step);
      return;
    }
    layers.push({ ing: k, q: 'ok' }); sfx('pour'); m.rerender();
  }
  function stopGauge() {
    if (!gaugeOn) return;
    cancelAnimationFrame(gaugeOn.raf);
    const p = gaugeOn.pos;
    const q = p >= 0.38 && p <= 0.62 ? 'ok' : (p >= 0.25 && p <= 0.75 ? 'good' : 'bad');
    layers.push({ ing: gaugeOn.ing, q });
    gaugeOn = null;
    sfx(q === 'ok' ? 'good' : q === 'good' ? 'pour' : 'no');
    m.rerender();
  }
  function done() {
    if (finished) return;
    finished = true;
    const res = judge(recipeId, layers);
    const stage = m.body.querySelector('.glass-stage');
    stage.appendChild(h('div', { class: 'grade ' + res.grade, text: GRADE_LABEL[res.grade] }));
    sfx(res.grade === 'bad' ? 'no' : 'level');
    setTimeout(() => { m.close(); onDone(res.grade, res); }, 1300);
  }
  return m;
}
export { ic };
