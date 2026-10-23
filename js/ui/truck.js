// 咖啡車：三消小遊戲。每天 5 張訂單，完成拿金幣、經驗和咖啡車代幣
import { h, modal, ic, fmt, toast, rewardChips } from './core.js';
import * as D from '../data.js';
import { gameDay } from '../state.js';
import { sfx } from '../audio.js';

const N = 7;
const PIECES = {
  bean: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="11" ry="15" transform="rotate(-30 20 20)" fill="#7a4a2e" stroke="#3b2116" stroke-width="2.4"/><path d="M14,30 C20,24 18,16 26,10" stroke="#d9a86a" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`,
  milk: `<svg viewBox="0 0 40 40"><path d="M14,10 L26,10 L28,16 L28,34 L12,34 L12,16 Z" fill="#fffaf2" stroke="#5a3a2a" stroke-width="2.4" stroke-linejoin="round"/><rect x="14" y="5" width="12" height="5" rx="1" fill="#7fb3c9" stroke="#5a3a2a" stroke-width="2"/><rect x="12" y="20" width="16" height="7" fill="#7fb3c9"/></svg>`,
  cup: `<svg viewBox="0 0 40 40"><path d="M9,14 L31,14 L28,33 Q20,36 12,33 Z" fill="#e8665a" stroke="#7a2e26" stroke-width="2.4" stroke-linejoin="round"/><path d="M31,17 q6,1 5,7 q-1,5 -7,4" fill="none" stroke="#7a2e26" stroke-width="2.4"/><path d="M15,8 q-2,3 0,5 M21,7 q-2,3 0,5" stroke="#b9aa98" stroke-width="2" fill="none"/></svg>`,
  croissant: `<svg viewBox="0 0 40 40"><path d="M5,28 Q8,10 20,9 Q32,10 35,28 Q29,24 26,26 Q20,19 14,26 Q11,24 5,28 Z" fill="#e2a24a" stroke="#7a4a1e" stroke-width="2.4" stroke-linejoin="round"/><path d="M13,17 L15,25 M20,11 L20,21 M27,17 L25,25" stroke="#a8601e" stroke-width="2"/></svg>`,
  leaf: `<svg viewBox="0 0 40 40"><path d="M8,32 C6,14 22,6 34,6 C34,20 26,34 8,32 Z" fill="#6aa84f" stroke="#2f5a22" stroke-width="2.4" stroke-linejoin="round"/><path d="M10,30 C18,22 24,16 30,10" stroke="#cde8b8" stroke-width="2.2" fill="none"/></svg>`,
  heart: `<svg viewBox="0 0 40 40"><path d="M20,34 C7,25 4,18 4,13 C4,8 8,5 12,5 C15.5,5 18.5,7.5 20,10 C21.5,7.5 24.5,5 28,5 C32,5 36,8 36,13 C36,18 33,25 20,34 Z" fill="#ef7f8a" stroke="#a83a52" stroke-width="2.4"/><path d="M10,12 q2,-4 6,-3" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
};
const KINDS = D.TRUCK_PIECES;
const rnd = () => KINDS[Math.floor(Math.random() * KINDS.length)];

function ensureOrders(g) {
  const t = g.s.truck, day = gameDay();
  if (t.day === day && t.orders.length) return t;
  t.day = day;
  t.orders = [];
  for (let i = 0; i < D.TRUCK_ORDERS_PER_DAY; i++) {
    const kinds = KINDS.slice().sort(() => Math.random() - 0.5).slice(0, 2 + (i >= 3 ? 1 : 0));
    const need = {}; kinds.forEach(k => { need[k] = 10 + i * 3 + Math.floor(Math.random() * 6); });
    t.orders.push({ need, moves: 22 + i * 2, done: false, reward: { gold: 600 + g.s.level * 80 + i * 300, exp: 20 + i * 10 }, tokens: 6 + i * 3 });
  }
  return t;
}

export function openTruck(ui) {
  const g = ui.g;
  const t = ensureOrders(g);
  modal({
    ribbon: 'Truck', title: '咖啡車', live: false, wide: true, tab: 'orders', tabs: [['orders', '今日訂單'], ['shop', '代幣商店']],
    render: (body, m) => {
      if (m.tab === 'orders') {
        body.appendChild(h('p', { class: 'lead', text: `開著咖啡車到街上擺攤！交換相鄰的格子，連成三個以上就能消除。在步數內收集到訂單需要的材料就完成。代幣：${t.tokens}` }));
        const list = h('div', { class: 'list' });
        t.orders.forEach((o, i) => {
          list.appendChild(h('div', { class: 'lrow' + (o.done ? ' done' : '') }, h('b', { text: `#${i + 1}` }),
            h('div', { class: 'lmain row' }, Object.entries(o.need).map(([k, n]) => h('span', { class: 'chip' }, h('span', { class: 'ic', html: PIECES[k] }), '×' + n)), h('span', { class: 'muted', text: `${o.moves} 步` })),
            ...rewardChips(o.reward), h('span', { class: 'chip', text: `代幣 ${o.tokens}` }),
            o.done ? h('span', { class: 'muted', text: '已完成' }) : h('button', { class: 'btn go', onclick: () => { m.close(true); play(ui, o); } }, '出發')));
        });
        body.appendChild(list);
      } else {
        body.appendChild(h('p', { class: 'lead', text: `用咖啡車代幣換限定商品。目前代幣：${t.tokens}` }));
        const grid = h('div', { class: 'cards' });
        for (const [id, it] of Object.entries(D.TRUCK_SHOP)) {
          const owned = (g.s.truckOwned || []).includes(id);
          grid.appendChild(h('div', { class: 'tcard' }, h('b', { text: it.name }), h('div', { class: 'art', html: PIECES.cup }), h('div', { class: 'meta', text: it.kind === 'outfit' ? '服裝' : `裝潢分數 ${it.score}` }),
            owned ? h('span', { class: 'lock', text: '已兌換' }) : h('button', { class: 'btn go', disabled: t.tokens < it.price, onclick: () => {
              t.tokens -= it.price; g.s.truckOwned = (g.s.truckOwned || []).concat(id);
              if (it.kind === 'outfit') { g.s.wardrobe.push('top_truck'); }
              else g.s.storage.push({ type: id });
              toast(`兌換了${it.name}！${it.kind === 'outfit' ? '到換裝穿上' : '已放進倉庫'}`, 'good'); m.rerender();
            } }, `代幣 ${it.price}`)));
        }
        body.appendChild(grid);
      }
    },
  });
}

function play(ui, order) {
  const g = ui.g;
  let grid = [], sel = null, moves = order.moves, got = {}, busy = false, over = false;
  Object.keys(order.need).forEach(k => { got[k] = 0; });
  const at = (r, c) => grid[r * N + c];
  // 建立沒有現成三連的盤面
  for (let i = 0; i < N * N; i++) { let k; do { k = rnd(); } while ((i % N >= 2 && grid[i - 1] === k && grid[i - 2] === k) || (i >= 2 * N && grid[i - N] === k && grid[i - 2 * N] === k)); grid.push(k); }
  const findMatches = () => {
    const hit = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) { const k = at(r, c); if (k && k === at(r, c + 1) && k === at(r, c + 2)) { let e = c; while (e < N && at(r, e) === k) { hit.add(r * N + e); e++; } } }
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) { const k = at(r, c); if (k && k === at(r + 1, c) && k === at(r + 2, c)) { let e = r; while (e < N && at(e, c) === k) { hit.add(e * N + c); e++; } } }
    return hit;
  };
  const m = modal({
    ribbon: 'Truck', title: '咖啡車擺攤中', wide: true, closable: true,
    render: body => {
      const g2 = h('div', { class: 'tgrid', style: `grid-template-columns:repeat(${N},3.1rem)` });
      grid.forEach((k, i) => {
        const cell = h('div', { class: 'tcell' + (sel === i ? ' sel' : ''), html: k ? PIECES[k] : '' });
        cell.addEventListener('pointerdown', ev => { ev.preventDefault(); down(i, ev); });
        g2.appendChild(cell);
      });
      const side = h('div', {}, h('h3', { text: '訂單' }), h('div', { class: 'list' }, Object.entries(order.need).map(([k, n]) => h('div', { class: 'lrow' + (got[k] >= n ? ' done' : '') }, h('span', { class: 'lic', html: PIECES[k] }), h('div', { class: 'lmain' }, h('div', { class: 'bar green' }, h('i', { style: `width:${Math.min(1, got[k] / n) * 100}%` }))), h('b', { text: `${Math.min(got[k], n)}/${n}` })))),
        h('h3', { text: `剩餘步數：${moves}` }), h('p', { class: 'muted small', text: '點一格再點相鄰的格子（或直接滑動）交換。' }));
      body.appendChild(h('div', { class: 'truck' }, g2, side));
    },
  });
  let dragStart = null;
  function down(i, ev) {
    if (busy || over) return;
    dragStart = { i, x: ev.clientX, y: ev.clientY };
    const up = e => {
      window.removeEventListener('pointerup', up);
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (Math.hypot(dx, dy) > 20) {
        const r = Math.floor(i / N), c = i % N;
        const j = Math.abs(dx) > Math.abs(dy) ? (dx > 0 && c < N - 1 ? i + 1 : dx < 0 && c > 0 ? i - 1 : -1) : (dy > 0 && r < N - 1 ? i + N : dy < 0 && r > 0 ? i - N : -1);
        if (j >= 0) { sel = null; trySwap(i, j); return; }
      }
      tap(i);
    };
    window.addEventListener('pointerup', up);
  }
  function tap(i) {
    if (sel === null) { sel = i; sfx('click'); m.rerender(); return; }
    const a = sel; sel = null;
    const ra = Math.floor(a / N), ca = a % N, rb = Math.floor(i / N), cb = i % N;
    if (Math.abs(ra - rb) + Math.abs(ca - cb) !== 1) { sel = i; m.rerender(); return; }
    trySwap(a, i);
  }
  async function trySwap(a, b) {
    busy = true;
    [grid[a], grid[b]] = [grid[b], grid[a]];
    m.rerender();
    let hit = findMatches();
    if (!hit.size) { await wait(180); [grid[a], grid[b]] = [grid[b], grid[a]]; sfx('no'); busy = false; m.rerender(); return; }
    moves--;
    let combo = 0;
    while (hit.size) {
      combo++;
      for (const i of hit) { const k = grid[i]; if (k in got) got[k]++; }
      const cells = m.body.querySelectorAll('.tcell');
      for (const i of hit) cells[i] && cells[i].classList.add('pop');
      sfx(combo > 1 ? 'good' : 'coin');
      await wait(230);
      for (const i of hit) grid[i] = null;
      // 往下掉
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) if (grid[r * N + c]) { grid[w * N + c] = grid[r * N + c]; if (w !== r) grid[r * N + c] = null; w--; }
        for (let r = w; r >= 0; r--) grid[r * N + c] = rnd();
      }
      m.rerender();
      await wait(160);
      hit = findMatches();
    }
    busy = false;
    m.rerender();
    const win = Object.entries(order.need).every(([k, n]) => got[k] >= n);
    if (win) finish(true); else if (moves <= 0) finish(false);
  }
  function finish(win) {
    over = true;
    m.close(true);
    if (win) {
      order.done = true; g.give(order.reward); g.s.truck.tokens += order.tokens; g.s.stats.truck++;
      sfx('level'); toast(`訂單完成！獲得代幣 ${order.tokens}`, 'good');
      ui.showReward('咖啡車訂單完成', order.reward);
    } else { toast('步數用完了，下次再挑戰！', 'warn'); }
    ui.refresh();
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  void fmt; void ic;
}
