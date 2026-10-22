// 介面：上方資訊列、任務、展示櫃、各種面板、裝潢模式、街頭招攬
import {
  BEANS, BEAN_ORDER, INGS, ING_ORDER, RECIPES, RECIPE_ORDER, FURNITURE, FLOORS, WALLS,
  EXPANSIONS, MACHINES, STAFF_HIRES, UNIFORMS, TRAITS, FRIEND_LEVELS, CARD_MAX, CARD_REGEN,
  expNeed, maxRegulars, GAME_TITLE,
} from './data.js';
import {
  ICONS, BTN_ICONS, cupIcon, beanIcon, ingIcon, characterSVG, furnitureSVG, wallItemSVG,
  floorPattern, wallPattern, sharedDefs, P,
} from './art.js';
import { currentQuest, claimQuest } from './quests.js';
import { exportCode, importCode, save, clearSave, blockSaves, nowSec } from './state.js';
import { sfx, setSound } from './audio.js';

function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.setAttribute('style', v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  return e;
}
const fmt = n => Math.floor(n).toLocaleString('zh-TW');
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return sec + ' 秒';
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return s ? `${m} 分 ${s} 秒` : `${m} 分`;
  return `${Math.floor(m / 60)} 時 ${m % 60} 分`;
}
const icon = (name, cls = 'ic') => h('span', { class: cls, html: ICONS[name] });
function avatarSVG(look, opt = {}, vb = '-30 -100 60 104') {
  return `<svg viewBox="${vb}" aria-hidden="true">${characterSVG(look, opt)}</svg>`;
}
function furnPreview(type) {
  const it = FURNITURE[type];
  if (it.kind === 'wall') return `<svg viewBox="0 -185 64 110" aria-hidden="true"><defs>${sharedDefs()}</defs><rect x="-10" y="-200" width="90" height="200" fill="#f3e7d3"/>${wallItemSVG(type)}</svg>`;
  return `<svg viewBox="-72 -140 144 210" aria-hidden="true"><defs>${sharedDefs()}</defs><polygon points="${[P(0, 0), P(1, 0), P(1, 1), P(0, 1)].map(p => p.join(',')).join(' ')}" fill="#e9dcc8"/>${furnitureSVG(type, 'py')}</svg>`;
}
let prevId = 0;
function themePreview(kind, id) {
  const pid = 'pv' + (prevId++);
  if (kind === 'floor') return `<svg viewBox="-130 -4 260 136" aria-hidden="true"><defs>${floorPattern(id, pid)}</defs><polygon points="${[P(0, 0), P(2, 0), P(2, 2), P(0, 2)].map(p => p.join(',')).join(' ')}" fill="url(#${pid})" stroke="#6b4a3a" stroke-opacity=".5"/></svg>`;
  return `<svg viewBox="-4 -204 136 210" aria-hidden="true"><defs>${wallPattern(id, pid, 'R')}</defs><polygon points="0,0 128,64 128,-136 0,-200" fill="url(#${pid})" stroke="#6b4a3a" stroke-opacity=".5"/></svg>`;
}

export class UI {
  constructor(game, room, root) {
    this.g = game; this.room = room; this.root = root;
    this.modal = null; this.sig = {};
    this.edit = { on: false };
    this.editTab = 'table';
    this.passersby = [];
    this.street = null;
  }

  // ---------- 建立固定介面 ----------
  build() {
    const r = this.root;
    this.hud = h('div', { class: 'hud' });
    this.tl = h('div', { class: 'hud-tl panel' });
    this.tr = h('div', { class: 'hud-tr' });
    this.questEl = h('div', { class: 'quest panel' });
    this.stockEl = h('button', { class: 'stock panel', onclick: () => this.openMenu() });
    this.hud.append(this.tl, this.tr, this.questEl, this.stockEl);

    this.coinPill = h('div', { class: 'pill' }, icon('coin'), h('b', { text: '0' }));
    this.charmPill = h('div', { class: 'pill', title: '人氣：越高客人越多、小費越多' }, icon('heart'), h('b', { text: '0' }));
    this.cardPill = h('button', { class: 'pill pill-btn', title: '名片：街頭招攬時使用', onclick: () => this.openStreet() }, icon('card'), h('b', { text: '0' }), h('small', { text: '' }));
    const gear = h('button', { class: 'round-btn', 'aria-label': '設定', onclick: () => this.openSettings() }, icon('gear'));
    const full = h('button', { class: 'round-btn', 'aria-label': '全螢幕', onclick: () => this.toggleFull() }, icon('full'));
    this.tr.append(this.coinPill, this.charmPill, this.cardPill, gear, full);

    this.bar = h('nav', { class: 'bar' });
    const btns = [
      ['shop', '進貨', () => this.openBuy()],
      ['menu', '菜單', () => this.openMenu()],
      ['decor', '裝潢', () => this.enterEdit()],
      ['staff', '員工', () => this.openStaff()],
      ['street', '街頭招攬', () => this.openStreet()],
      ['regulars', '常客簿', () => this.openRegulars()],
      ['expand', '擴店', () => this.openExpand()],
    ];
    this.barBtns = {};
    for (const [ic, label, fn] of btns) {
      const b = h('button', { class: 'bar-btn', onclick: () => { sfx('click'); fn(); } }, h('span', { class: 'bar-ic', html: BTN_ICONS[ic] }), h('span', { text: label }), h('i', { class: 'dot' }));
      this.barBtns[ic] = b;
      this.bar.appendChild(b);
    }
    this.zoomBox = h('div', { class: 'zoombox' },
      h('button', { class: 'round-btn zb', 'aria-label': '放大', onclick: () => this.room.setZoom(this.room.zoom * 1.3) }, '+'),
      h('button', { class: 'round-btn zb', 'aria-label': '縮小', onclick: () => this.room.setZoom(this.room.zoom / 1.3) }, '−'));
    this.editBar = h('div', { class: 'editbar', hidden: true });
    this.editHint = h('div', { class: 'edit-hint', hidden: true });
    this.popover = h('div', { class: 'popover panel', hidden: true });
    this.modalLayer = h('div', { class: 'modal-layer' });
    this.toasts = h('div', { class: 'toasts' });
    r.append(this.hud, this.zoomBox, this.bar, this.editBar, this.editHint, this.popover, this.modalLayer, this.toasts);
    this.refresh(true);
  }

  // ---------- 每 0.25 秒更新 ----------
  refresh(force = false) {
    const g = this.g, s = g.s;
    const set = (key, val, fn) => { if (force || this.sig[key] !== val) { this.sig[key] = val; fn(); } };
    set('coins', s.coins, () => { this.coinPill.querySelector('b').textContent = fmt(s.coins); });
    const charm = g.charm();
    set('charm', charm, () => { this.charmPill.querySelector('b').textContent = charm; });
    const cardLeft = s.cards < CARD_MAX ? Math.max(0, CARD_REGEN - (nowSec() - s.cardsT)) : 0;
    set('cards', s.cards + '|' + Math.ceil(cardLeft), () => {
      this.cardPill.querySelector('b').textContent = `${s.cards}/${CARD_MAX}`;
      this.cardPill.querySelector('small').textContent = s.cards < CARD_MAX ? fmtTime(cardLeft) : '';
    });
    const need = expNeed(s.level);
    set('tl', [s.level, Math.floor(s.exp), s.name, s.uniform].join('|'), () => {
      const owner = s.staff[0];
      this.tl.innerHTML = '';
      this.tl.append(
        h('div', { class: 'avatar', html: avatarSVG(owner.look, { staff: true, uniform: s.uniform }, '-24 -98 48 52') }),
        h('div', { class: 'tl-info' },
          h('div', { class: 'cafe-name', text: s.name }),
          h('div', { class: 'lvrow' }, h('span', { class: 'lv', text: 'Lv ' + s.level }),
            h('div', { class: 'expbar' }, h('i', { style: `width:${Math.min(100, s.exp / need * 100)}%` })),
            h('span', { class: 'exptext', text: `${Math.floor(s.exp)}/${need}` }))));
    });
    const q = currentQuest(g);
    set('quest', [q.title, q.progress, q.target, q.done].join('|'), () => {
      this.questEl.innerHTML = '';
      this.questEl.classList.toggle('done', q.done);
      this.questEl.append(
        h('div', { class: 'q-head' }, h('span', { class: 'q-ic', html: BTN_ICONS.quest }), h('b', { text: q.title }), h('span', { class: 'q-reward' }, icon('coin'), String(q.coins))),
        h('div', { class: 'q-desc', text: q.desc }),
        h('div', { class: 'q-prog' }, h('div', { class: 'bar-mini' }, h('i', { style: `width:${q.progress / q.target * 100}%` })), h('span', { text: `${fmt(q.progress)}/${fmt(q.target)}` })),
        ...(q.done ? [h('button', { class: 'btn btn-go q-claim', onclick: () => this.claim() }, '領取獎勵')] : []));
    });
    const stockSig = RECIPE_ORDER.map(r => s.stock[r]).join(',');
    set('stock', stockSig, () => {
      this.stockEl.innerHTML = '';
      this.stockEl.append(h('div', { class: 'stock-title' }, icon('cup'), '展示櫃'));
      const list = RECIPE_ORDER.filter(r => s.stock[r] > 0);
      if (!list.length) this.stockEl.append(h('div', { class: 'stock-empty', text: '空空的…去咖啡機煮一些吧' }));
      for (const r of list) this.stockEl.append(h('div', { class: 'stock-row' }, h('span', { class: 'cup', html: cupIcon(r, 30) }), h('span', { class: 'nm', text: RECIPES[r].name }), h('b', { text: '×' + s.stock[r] })));
    });
    // 按鈕紅點提示
    const ready = s.machines.some(m => ['done', 'burnt'].includes(g.machineStatus(m).st));
    set('dots', [s.cards >= 1 && s.regulars.length < maxRegulars(s.level), !!(g.nextExpansion() && s.level >= g.nextExpansion().lv && s.coins >= g.nextExpansion().cost), !!(g.nextHire() && s.level >= g.nextHire().lv && s.coins >= g.nextHire().cost), ready].join(), () => {
      this.barBtns.street.classList.toggle('has-dot', s.cards >= CARD_MAX && s.regulars.length < maxRegulars(s.level));
      const ne = g.nextExpansion();
      this.barBtns.expand.classList.toggle('has-dot', !!(ne && s.level >= ne.lv && s.coins >= ne.cost));
      const nh = g.nextHire();
      this.barBtns.staff.classList.toggle('has-dot', !!(nh && s.level >= nh.lv && s.coins >= nh.cost));
    });
    if (this.modal && this.modal.live) this.modal.render();
  }

  claim() {
    const q = claimQuest(this.g);
    if (!q) return;
    sfx('collect');
    this.toast(`任務完成！獲得 ${q.coins} 金幣`, 'good');
    this.refresh(true);
  }

  toast(msg, type = '') {
    const t = h('div', { class: 'toast ' + type, text: msg });
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 2300);
    setTimeout(() => t.remove(), 2800);
  }

  // ---------- 面板框架 ----------
  openModal(title, render, opt = {}) {
    this.closeModal(true);
    this.closePopover();
    const box = h('div', { class: 'modal panel ' + (opt.cls || '') });
    const head = h('div', { class: 'modal-head' }, h('h2', { text: title }), h('button', { class: 'x', 'aria-label': '關閉', onclick: () => this.closeModal() }, icon('close')));
    const tabs = h('div', { class: 'tabs' });
    const body = h('div', { class: 'modal-body' });
    box.append(head, tabs, body);
    const shade = h('div', { class: 'shade', onclick: ev => { if (ev.target === shade) this.closeModal(); } }, box);
    this.modalLayer.appendChild(shade);
    const m = { el: shade, body, tabs, live: !!opt.live, tab: opt.tab, title: head.querySelector('h2') };
    m.render = () => {
      const st = body.scrollTop;
      body.innerHTML = '';
      if (opt.tabs) {
        tabs.innerHTML = '';
        for (const [k, label] of opt.tabs) tabs.appendChild(h('button', { class: 'tab' + (m.tab === k ? ' on' : ''), onclick: () => { m.tab = k; body.scrollTop = 0; m.render(); } }, label));
      } else tabs.remove();
      render(body, m);
      body.scrollTop = st;
    };
    this.modal = m;
    m.render();
    return m;
  }
  closeModal(silent) {
    if (!this.modal) return;
    const el = this.modal.el;
    this.modal = null;
    if (silent) el.remove(); else { el.classList.add('closing'); setTimeout(() => el.remove(), 160); }
    if (this.street) this.street = null;
  }
  rerender() { if (this.modal) this.modal.render(); this.refresh(true); }

  // ---------- 機器 ----------
  openMachine(slot) {
    const g = this.g, m = g.machineAt(slot);
    if (!m) return;
    const st = g.machineStatus(m);
    if (st.st === 'done' || st.st === 'burnt') { g.collect(m); this.refresh(true); return; }
    if (m.type === 'roaster') this.openModal('烘豆機', body => this.renderRoaster(body, m), { live: true, cls: 'm-machine' });
    else this.openModal('咖啡機', body => this.renderBrewer(body, m), { live: true, cls: 'm-machine' });
  }
  jobBox(body, m, st) {
    const j = m.job;
    const name = j.kind === 'roast' ? BEANS[j.item].name + '豆' : RECIPES[j.item].name;
    const ic = j.kind === 'roast' ? beanIcon(j.item, true, 64) : cupIcon(j.item, 64);
    const wrap = h('div', { class: 'job' }, h('div', { class: 'job-ic', html: ic }),
      h('div', { class: 'job-info' }, h('b', { text: (j.kind === 'roast' ? '烘焙中：' : '沖煮中：') + name }),
        h('div', { class: 'bar-big' }, h('i', { style: `width:${(st.p || 0) * 100}%` })),
        h('span', { class: 'muted', text: '剩下 ' + fmtTime(st.left) })));
    body.appendChild(wrap);
    if (j.kind === 'roast') body.appendChild(h('p', { class: 'tip', text: '烘好後記得來收成，放太久（烘焙時間的 3 倍，至少 10 分鐘）豆子會烤焦。' }));
  }
  renderRoaster(body, m) {
    const g = this.g, s = g.s, st = g.machineStatus(m);
    if (st.st === 'run') { this.jobBox(body, m, st); return; }
    if (st.st !== 'idle') { this.closeModal(true); return; }
    body.appendChild(h('p', { class: 'lead', text: '選一種生豆開始烘焙。烘好的熟豆會拿去咖啡機做飲品。' }));
    const grid = h('div', { class: 'grid' });
    for (const id of BEAN_ORDER) {
      const b = BEANS[id], lock = s.level < b.lv;
      const card = h('div', { class: 'card' + (lock ? ' locked' : '') },
        h('div', { class: 'card-ic', html: beanIcon(id, false, 56) }),
        h('b', { text: b.name + '豆' }),
        h('div', { class: 'meta' }, icon('clock', 'ic sm'), fmtTime(b.roast), ' · 產出 ', b.yield, ' 份'),
        lock ? h('div', { class: 'lockline' }, icon('lock', 'ic sm'), `Lv${b.lv} 解鎖`) :
          h('div', { class: 'meta' }, '生豆 ', h('b', { text: '×' + s.green[id] }), ' · 熟豆 ', h('b', { text: String(s.roasted[id]) })),
        lock ? null : (s.green[id] > 0
          ? h('button', { class: 'btn btn-go', onclick: () => { if (g.startRoast(m, id)) { this.closeModal(); this.refresh(true); } } }, '開始烘焙')
          : h('button', { class: 'btn', onclick: () => { if (g.buyGreen(id, 1)) { this.toast(`買了 1 包${b.name}生豆`); this.rerender(); } } }, h('span', { text: '買 1 包 ' }), icon('coin', 'ic sm'), String(b.cost))));
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }
  renderBrewer(body, m) {
    const g = this.g, s = g.s, st = g.machineStatus(m);
    if (st.st === 'run') { this.jobBox(body, m, st); return; }
    if (st.st !== 'idle') { this.closeModal(true); return; }
    body.appendChild(h('p', { class: 'lead', text: '選一道飲品開始沖煮，煮好的成品會放上展示櫃讓店員出餐。' }));
    const grid = h('div', { class: 'grid' });
    for (const id of RECIPE_ORDER) {
      const r = RECIPES[id], lock = s.level < r.lv;
      if (lock && r.lv > s.level + 4) continue;
      const needs = h('div', { class: 'needs' });
      const okBean = s.roasted[r.bean] >= r.beanN;
      needs.appendChild(h('span', { class: 'need' + (okBean ? '' : ' lack'), title: BEANS[r.bean].name + '熟豆' }, h('span', { class: 'mini', html: beanIcon(r.bean, true, 22) }), `${s.roasted[r.bean]}/${r.beanN}`));
      for (const i of r.ing) needs.appendChild(h('span', { class: 'need' + (s.ing[i] >= 1 ? '' : ' lack'), title: INGS[i].name }, h('span', { class: 'mini', html: ingIcon(i, 22) }), `${s.ing[i]}/1`));
      const can = g.canBrew(id);
      let action;
      if (lock) action = h('div', { class: 'lockline' }, icon('lock', 'ic sm'), `Lv${r.lv} 解鎖`);
      else if (can) action = h('button', { class: 'btn btn-go', onclick: () => { if (g.startBrew(m, id)) { this.closeModal(); this.refresh(true); } } }, '開始沖煮');
      else if (!okBean) action = h('button', { class: 'btn', onclick: () => { this.closeModal(true); const rm = g.s.machines.find(q => q.type === 'roaster' && !q.job); if (rm) this.openMachine(rm.slot); else this.toast('烘豆機都在忙，等一下再來', 'warn'); } }, `先烘${BEANS[r.bean].name}豆`);
      else action = h('button', { class: 'btn', onclick: () => this.openBuy('ing') }, '去買食材');
      grid.appendChild(h('div', { class: 'card' + (lock ? ' locked' : '') },
        h('div', { class: 'card-ic', html: cupIcon(id, 56) }),
        h('b', { text: r.name }),
        h('div', { class: 'meta' }, icon('coin', 'ic sm'), `${r.price}/杯 · ${r.cups} 杯 · `, fmtTime(r.time)),
        needs, action));
    }
    body.appendChild(grid);
  }

  // ---------- 進貨 ----------
  openBuy(tab = 'green') {
    const g = this.g, s = g.s;
    this.openModal('進貨', (body, m) => {
      const grid = h('div', { class: 'grid' });
      if (m.tab === 'green') {
        for (const id of BEAN_ORDER) {
          const b = BEANS[id], lock = s.level < b.lv;
          grid.appendChild(h('div', { class: 'card' + (lock ? ' locked' : '') },
            h('div', { class: 'card-ic', html: beanIcon(id, false, 56) }), h('b', { text: b.name + '生豆' }),
            h('div', { class: 'meta', text: `一包可烘 ${b.yield} 份 · 現有 ${s.green[id]} 包` }),
            lock ? h('div', { class: 'lockline' }, icon('lock', 'ic sm'), `Lv${b.lv} 解鎖`) :
              h('div', { class: 'btnrow' },
                h('button', { class: 'btn btn-go', onclick: () => { if (g.buyGreen(id, 1)) this.rerender(); } }, '×1 ', icon('coin', 'ic sm'), String(b.cost)),
                h('button', { class: 'btn', onclick: () => { if (g.buyGreen(id, 5)) this.rerender(); } }, '×5 ', icon('coin', 'ic sm'), String(b.cost * 5)))));
        }
      } else if (m.tab === 'ing') {
        for (const id of ING_ORDER) {
          const it = INGS[id], lock = s.level < it.lv;
          grid.appendChild(h('div', { class: 'card' + (lock ? ' locked' : '') },
            h('div', { class: 'card-ic', html: ingIcon(id, 56) }), h('b', { text: it.name }),
            h('div', { class: 'meta', text: `一組 10 份 · 現有 ${s.ing[id]} 份` }),
            lock ? h('div', { class: 'lockline' }, icon('lock', 'ic sm'), `Lv${it.lv} 解鎖`) :
              h('div', { class: 'btnrow' },
                h('button', { class: 'btn btn-go', onclick: () => { if (g.buyIng(id, 1)) this.rerender(); } }, '10 份 ', icon('coin', 'ic sm'), String(it.cost * 10)),
                h('button', { class: 'btn', onclick: () => { if (g.buyIng(id, 5)) this.rerender(); } }, '50 份 ', icon('coin', 'ic sm'), String(it.cost * 50)))));
        }
      } else {
        const free = g.freeSlot();
        body.appendChild(h('p', { class: 'lead', text: free ? `吧台還有空位，買下的機器會自動放上去。` : '吧台已經擺滿了，擴店可以增加吧台位置。' }));
        for (const type of ['roaster', 'brewer']) {
          const n = s.machines.filter(q => q.type === type).length;
          const price = g.machinePrice(type);
          grid.appendChild(h('div', { class: 'card' },
            h('div', { class: 'card-ic', html: type === 'roaster' ? beanIcon('brazil', true, 56) : cupIcon('espresso', 56) }),
            h('b', { text: MACHINES[type].name }), h('div', { class: 'meta', text: `目前 ${n} 台` }),
            h('button', { class: 'btn btn-go', disabled: !free, onclick: () => { if (g.buyMachine(type)) { this.toast(`新的${MACHINES[type].name}放上吧台了`, 'good'); this.rerender(); } } }, '購買 ', icon('coin', 'ic sm'), fmt(price))));
        }
      }
      body.appendChild(grid);
    }, { tabs: [['green', '生豆'], ['ing', '食材'], ['machine', '設備']], tab });
  }

  // ---------- 菜單 ----------
  openMenu() {
    const g = this.g, s = g.s;
    this.openModal('菜單', body => {
      body.appendChild(h('p', { class: 'lead', text: '客人會從展示櫃有貨的飲品裡挑著點；缺貨的話會等一下，等不到就離開。' }));
      const list = h('div', { class: 'menu-list' });
      for (const id of RECIPE_ORDER) {
        const r = RECIPES[id], lock = s.level < r.lv;
        list.appendChild(h('div', { class: 'menu-row' + (lock ? ' locked' : '') },
          h('span', { class: 'cup', html: cupIcon(id, 44) }),
          h('div', { class: 'mr-main' }, h('b', { text: r.name }),
            h('span', { class: 'muted', text: lock ? `Lv${r.lv} 解鎖` : `${BEANS[r.bean].name}熟豆×${r.beanN}${r.ing.map(i => ' + ' + INGS[i].name).join('')} → ${r.cups} 杯 · ${fmtTime(r.time)}` })),
          h('span', { class: 'mr-price' }, icon('coin', 'ic sm'), String(r.price)),
          h('span', { class: 'mr-stock', text: lock ? '' : '庫存 ' + s.stock[id] })));
      }
      body.appendChild(list);
    }, { live: true });
  }

  // ---------- 員工 ----------
  openStaff() {
    const g = this.g, s = g.s;
    this.openModal('員工', body => {
      body.appendChild(h('p', { class: 'lead', text: '店員送餐會消耗體力；體力用完要休息。點店裡的店員可以幫他加油（+35 體力）。' }));
      const grid = h('div', { class: 'grid' });
      s.staff.forEach(st => {
        const rt = g.staffRt.get(st.id);
        grid.appendChild(h('div', { class: 'card staff-card' },
          h('div', { class: 'card-ic portrait', html: avatarSVG(st.look, { staff: true, uniform: s.uniform }) }),
          h('b', { text: st.name + (st.owner ? '（你）' : '') }),
          h('div', { class: 'meta' }, '體力'), h('div', { class: 'bar-mini sta' }, h('i', { style: `width:${st.sta / st.maxSta * 100}%` })),
          h('div', { class: 'meta', text: `移動速度 ${st.speed.toFixed(1)}` }),
          h('button', { class: 'btn', disabled: rt && rt.cheerCD > 0, onclick: () => { g.cheer(st.id); this.rerender(); } }, rt && rt.cheerCD > 0 ? `休息中 ${Math.ceil(rt.cheerCD)}s` : '加油！')));
      });
      const nh = g.nextHire();
      if (nh) {
        const lock = s.level < nh.lv;
        grid.appendChild(h('div', { class: 'card hire' + (lock ? ' locked' : '') },
          h('div', { class: 'card-ic portrait big-plus', text: '+' }), h('b', { text: '雇用新店員' }),
          h('div', { class: 'meta', text: '多一個人手，出餐更快' }),
          lock ? h('div', { class: 'lockline' }, icon('lock', 'ic sm'), `Lv${nh.lv} 解鎖`)
            : h('button', { class: 'btn btn-go', onclick: () => { const st = g.hire(); if (st) { this.toast(`${st.name}加入了團隊！`, 'good'); this.rerender(); } } }, '雇用 ', icon('coin', 'ic sm'), fmt(nh.cost))));
      }
      body.appendChild(grid);
      body.appendChild(h('h3', { text: '制服顏色' }));
      const row = h('div', { class: 'swatches' });
      UNIFORMS.forEach(c => row.appendChild(h('button', { class: 'swatch' + (s.uniform === c ? ' on' : ''), style: `background:${c}`, 'aria-label': '制服顏色', onclick: () => { s.uniform = c; sfx('click'); this.rerender(); } })));
      body.appendChild(row);
    }, { live: true });
  }

  // ---------- 常客簿 ----------
  openRegulars() {
    const g = this.g, s = g.s;
    this.openModal('常客簿', body => {
      body.appendChild(h('p', { class: 'lead', text: `常客 ${s.regulars.length}/${maxRegulars(s.level)} 位。常客會多給 30% 小費，點到最愛的飲品好感加倍。好感升級時會送你禮物。` }));
      if (!s.regulars.length) {
        body.appendChild(h('div', { class: 'empty' }, h('p', { text: '還沒有常客。去街上找路人聊聊吧！' }), h('button', { class: 'btn btn-go', onclick: () => this.openStreet() }, '去街頭招攬')));
        return;
      }
      const grid = h('div', { class: 'grid' });
      for (const r of s.regulars) {
        const lvl = g.friendLevel(r);
        const next = FRIEND_LEVELS[lvl];
        const hearts = h('div', { class: 'hearts' });
        FRIEND_LEVELS.forEach((_, i) => hearts.appendChild(h('span', { class: i < lvl ? 'on' : '', html: ICONS.heart })));
        grid.appendChild(h('div', { class: 'card reg-card' },
          h('div', { class: 'card-ic portrait', html: avatarSVG(r.look) }),
          h('b', { text: r.name }), h('span', { class: 'tag', text: TRAITS[r.trait].tag }),
          h('div', { class: 'meta fav' }, '最愛 ', h('span', { class: 'mini', html: cupIcon(r.fav, 22) }), RECIPES[r.fav].name, s.level < RECIPES[r.fav].lv ? h('span', { class: 'muted', text: `（Lv${RECIPES[r.fav].lv}）` }) : null),
          hearts,
          h('div', { class: 'meta', text: next ? `好感 ${r.friend}/${next.need}` : `好感 ${r.friend}（滿級）` }),
          h('div', { class: 'meta muted', text: `來店 ${r.visits} 次` })));
      }
      body.appendChild(grid);
    }, { live: true });
  }

  // ---------- 街頭招攬 ----------
  openStreet() {
    const g = this.g, s = g.s;
    while (this.passersby.length < 3) this.passersby.push(g.makePasserby());
    this.street = { talk: null, result: null };
    this.openModal('街頭招攬', (body) => {
      const st = this.street;
      if (!st) return;
      const cardLeft = s.cards < CARD_MAX ? CARD_REGEN - (nowSec() - s.cardsT) : 0;
      body.appendChild(h('div', { class: 'street-top' },
        h('span', { class: 'lead', text: '點路人聊天，用一張名片推銷適合他的東西，成功就會變成常客。' }),
        h('span', { class: 'pill small' }, icon('card'), h('b', { text: `${s.cards}/${CARD_MAX}` }), s.cards < CARD_MAX ? h('small', { text: fmtTime(cardLeft) + ' 後 +1' }) : null)));
      const scene = h('div', { class: 'street-scene' });
      scene.innerHTML = this.streetBG();
      const row = h('div', { class: 'street-people' });
      this.passersby.forEach((p) => {
        const sel = st.talk && st.talk.id === p.id;
        row.appendChild(h('button', { class: 'passer' + (sel ? ' sel' : ''), onclick: () => { if (st.result) return; st.talk = p; st.opts = g.pitchOptions(p.trait); sfx('pop'); this.modal.render(); } },
          h('span', { class: 'excl', text: sel ? '…' : '!' }),
          h('span', { class: 'passer-fig', html: avatarSVG(p.look, { mood: sel && st.result ? (st.result.ok ? 'happy' : 'sad') : '' }, '-30 -104 60 108') })));
      });
      scene.appendChild(row);
      body.appendChild(scene);
      const dlg = h('div', { class: 'dialog' });
      if (st.result) {
        const r = st.result;
        let msg;
        if (r.ok) msg = `「好啊，我會常來！」${r.regular.name}成為你的常客了，最愛的是${RECIPES[r.regular.fav].name}。`;
        else if (r.reason === 'charm') msg = '「嗯…看起來還好耶。」（人氣不夠高，文青不太買單，多裝潢一下吧）';
        else if (r.reason === 'wrong') msg = '「喔…我再看看。」他搖搖頭走掉了。（再仔細聽聽他說的話）';
        else msg = '';
        dlg.append(h('p', { text: msg }), h('button', { class: 'btn btn-go', onclick: () => {
          this.passersby = this.passersby.filter(x => x.id !== st.talk.id);
          while (this.passersby.length < 3) this.passersby.push(g.makePasserby());
          this.street = { talk: null, result: null };
          this.refresh(true); this.modal.render();
        } }, '繼續'));
      } else if (st.talk) {
        dlg.append(h('p', { class: 'say', text: '「' + st.talk.line + '」' }));
        const opts = h('div', { class: 'opts' });
        st.opts.forEach(tr => opts.appendChild(h('button', { class: 'btn opt', onclick: () => {
          const res = g.tryRecruit(st.talk, tr);
          if (res.reason === 'cards' || res.reason === 'full') return;
          st.result = res;
          if (res.ok) this.toast(`${res.regular.name}成為常客！`, 'good'); else sfx('no');
          this.refresh(true); this.modal.render();
        } }, TRAITS[tr].pitch)));
        dlg.append(opts);
        if (s.cards <= 0) dlg.append(h('p', { class: 'muted', text: '名片用完了，等一下會自動補充。' }));
      } else {
        dlg.append(h('p', { class: 'muted', text: '路上有幾個人看起來有點興趣，點一位跟他聊聊。' }),
          h('button', { class: 'btn', onclick: () => { this.passersby = [g.makePasserby(), g.makePasserby(), g.makePasserby()]; this.modal.render(); } }, '換一批路人'));
      }
      body.appendChild(dlg);
    }, { cls: 'm-street' });
  }
  streetBG() {
    return `<svg class="street-bg" viewBox="0 0 900 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>${sharedDefs()}</defs>
      <rect width="900" height="260" fill="url(#sky)"/>
      <rect x="0" y="40" width="200" height="170" fill="#e9b872"/><rect x="0" y="40" width="200" height="16" fill="#c99550"/>
      <rect x="22" y="76" width="44" height="50" fill="#fffaf0"/><rect x="88" y="76" width="44" height="50" fill="#fffaf0"/><rect x="150" y="120" width="34" height="90" fill="#7b4e33"/>
      <rect x="210" y="20" width="250" height="190" fill="#f3e7d3"/><path d="M200,96 h270 l-14,26 h-242 Z" fill="#d9775f"/>
      <path d="M214,122 q14,12 28,0 q14,12 28,0 q14,12 28,0 q14,12 28,0 q14,12 28,0 q14,12 28,0 q14,12 28,0 q14,12 28,0 q14,12 28,0" fill="#fffaf0"/>
      <rect x="240" y="40" width="190" height="42" rx="8" fill="#6b4a3a"/><text x="335" y="69" font-size="22" font-weight="900" text-anchor="middle" fill="#fffaf0">${this.escape(this.g.s.name)}</text>
      <rect x="236" y="138" width="90" height="72" fill="url(#sky)" stroke="#6b4a3a" stroke-width="4"/><rect x="350" y="132" width="60" height="78" fill="#6b4a3a"/>
      <rect x="470" y="60" width="200" height="150" fill="#9cc3d8"/><rect x="470" y="60" width="200" height="14" fill="#6f8fd0"/>
      <rect x="494" y="92" width="64" height="44" fill="#fffaf0"/><rect x="584" y="92" width="64" height="44" fill="#fffaf0"/>
      <rect x="680" y="30" width="220" height="180" fill="#c7d9b8"/><rect x="700" y="60" width="56" height="60" fill="#fffaf0"/><rect x="790" y="60" width="56" height="60" fill="#fffaf0"/>
      <rect x="0" y="210" width="900" height="50" fill="#cdbfae"/><rect x="0" y="206" width="900" height="6" fill="#b5a693"/>
      <circle cx="455" cy="150" r="30" fill="#7fae5b"/><rect x="451" y="170" width="8" height="40" fill="#7b4e33"/></svg>`;
  }
  escape(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // ---------- 擴店 ----------
  openExpand() {
    const g = this.g, s = g.s;
    this.openModal('擴店', body => {
      const cur = EXPANSIONS[s.expand], nx = g.nextExpansion();
      body.appendChild(h('p', { class: 'lead', text: `目前店面 ${cur.W}×${cur.H} 格，吧台可放 ${cur.slots} 台機器。` }));
      if (!nx) { body.appendChild(h('div', { class: 'empty', text: '已經是最大的店面了！' })); return; }
      const lock = s.level < nx.lv;
      const mini = (W, H) => {
        const sc = 14;
        const pt = (x, y) => [(x - y) * sc, (x + y) * sc / 2];
        const MW = nx.W, MH = nx.H; // 兩張圖用同一個比例尺，才看得出變大
        return `<svg viewBox="${-MH * sc - 4} -4 ${(MW + MH) * sc + 8} ${(MW + MH) * sc / 2 + 8}"><polygon points="${[pt(0, 0), pt(W, 0), pt(W, H), pt(0, H)].map(p => p.join(',')).join(' ')}" fill="#cfa274" stroke="#6b4a3a"/></svg>`;
      };
      body.appendChild(h('div', { class: 'expand-cmp' },
        h('div', { class: 'ex-box' }, h('div', { class: 'ex-svg', html: mini(cur.W, cur.H) }), h('b', { text: `現在 ${cur.W}×${cur.H}` })),
        h('div', { class: 'ex-arrow', text: '→' }),
        h('div', { class: 'ex-box' }, h('div', { class: 'ex-svg', html: mini(nx.W, nx.H) }), h('b', { text: `擴建後 ${nx.W}×${nx.H}` }), h('span', { class: 'muted', text: `吧台 ${nx.slots} 個位置` }))));
      body.appendChild(lock ? h('div', { class: 'center' }, h('span', { class: 'lockline' }, icon('lock', 'ic sm'), `Lv${nx.lv} 才能擴店`))
        : h('div', { class: 'center' }, h('button', { class: 'btn btn-go big', onclick: () => { if (g.doExpand()) { this.toast('店面變大了！', 'good'); this.closeModal(); this.refresh(true); } } }, '擴建 ', icon('coin', 'ic sm'), fmt(nx.cost))));
    });
  }

  // ---------- 設定 ----------
  openSettings() {
    const g = this.g, s = g.s;
    this.openModal('設定', body => {
      const name = h('input', { class: 'inp', value: s.name, maxlength: 12 });
      body.append(h('h3', { text: '店名' }), h('div', { class: 'row' }, name, h('button', { class: 'btn', onclick: () => { s.name = name.value.trim() || '我的咖啡館'; this.toast('店名已更新'); this.refresh(true); } }, '儲存')));
      body.append(h('h3', { text: '音效' }), h('div', { class: 'row' }, h('button', { class: 'btn' + (s.settings.sound ? ' btn-go' : ''), onclick: () => { s.settings.sound = !s.settings.sound; setSound(s.settings.sound); this.modal.render(); } }, s.settings.sound ? '音效：開' : '音效：關')));
      body.append(h('h3', { text: '存檔' }), h('p', { class: 'muted', text: '遊戲會自動存在這台裝置的瀏覽器裡。要換手機或電腦玩時，先在這裡複製存檔碼，到新裝置貼上讀取。清除瀏覽器資料會讓存檔消失。' }));
      const out = h('textarea', { class: 'inp code', readonly: true, rows: 3 });
      body.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { out.value = exportCode(s); out.select(); try { navigator.clipboard.writeText(out.value); this.toast('存檔碼已複製'); } catch (e) { this.toast('請手動複製下方文字'); } } }, '匯出存檔碼')), out);
      const inp = h('textarea', { class: 'inp code', rows: 3, placeholder: '貼上存檔碼' });
      body.append(inp, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => {
        try { const ns = importCode(inp.value); save(ns); blockSaves(); location.reload(); } catch (e) { this.toast('存檔碼無法讀取：' + e.message, 'warn'); }
      } }, '讀取存檔碼')));
      body.append(h('h3', { text: '重新開始' }), h('div', { class: 'row' }, h('button', { class: 'btn btn-danger', onclick: ev => {
        const b = ev.currentTarget;
        if (b.dataset.armed) { clearSave(); location.reload(); return; }
        b.dataset.armed = '1'; b.textContent = '再按一次確定清除所有進度';
      } }, '清除進度')));
      body.append(h('p', { class: 'muted small', text: `${GAME_TITLE}：原創咖啡館經營遊戲，美術與程式皆為原創。` }));
    });
  }

  toggleFull() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).then(() => {
        try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* 不支援就算了 */ }
      }).catch(() => this.toast('這個瀏覽器不支援全螢幕'));
    } else document.exitFullscreen();
  }

  // ---------- 升級 / 歡迎 ----------
  showLevelUp(from, lv, bonus) {
    const un = [];
    const inR = x => x >= from && x <= lv;
    BEAN_ORDER.forEach(b => inR(BEANS[b].lv) && un.push(['bean', b]));
    RECIPE_ORDER.forEach(r => inR(RECIPES[r].lv) && un.push(['recipe', r]));
    Object.keys(INGS).forEach(i => inR(INGS[i].lv) && un.push(['ing', i]));
    Object.keys(FURNITURE).forEach(f => inR(FURNITURE[f].lv) && un.push(['furn', f]));
    Object.keys(FLOORS).forEach(f => inR(FLOORS[f].lv) && FLOORS[f].cost && un.push(['floor', f]));
    Object.keys(WALLS).forEach(f => inR(WALLS[f].lv) && WALLS[f].cost && un.push(['wall', f]));
    const extra = [];
    if (EXPANSIONS.some(e => inR(e.lv) && e.cost)) extra.push('可以擴店了');
    if (STAFF_HIRES.some(e => inR(e.lv))) extra.push('可以雇用新店員');
    extra.push(`常客名額 ${maxRegulars(lv)} 位`);
    sfx('level');
    this.openModal('升級！', body => {
      body.appendChild(h('div', { class: 'lvup' }, h('div', { class: 'lvbig', text: 'Lv ' + lv }), h('div', { class: 'meta' }, '獎勵 ', icon('coin', 'ic sm'), fmt(bonus))));
      if (un.length) {
        body.appendChild(h('h3', { text: '新解鎖' }));
        const grid = h('div', { class: 'unlocks' });
        for (const [k, id] of un) {
          let ic, nm;
          if (k === 'bean') { ic = beanIcon(id, false, 44); nm = BEANS[id].name + '生豆'; }
          else if (k === 'recipe') { ic = cupIcon(id, 44); nm = RECIPES[id].name; }
          else if (k === 'ing') { ic = ingIcon(id, 44); nm = INGS[id].name; }
          else if (k === 'furn') { ic = furnPreview(id); nm = FURNITURE[id].name; }
          else if (k === 'floor') { ic = themePreview('floor', id); nm = FLOORS[id].name; }
          else { ic = themePreview('wall', id); nm = WALLS[id].name; }
          grid.appendChild(h('div', { class: 'unl' }, h('div', { class: 'unl-ic', html: ic }), h('span', { text: nm })));
        }
        body.appendChild(grid);
      }
      body.appendChild(h('p', { class: 'center muted', text: extra.join('・') }));
      body.appendChild(h('div', { class: 'center' }, h('button', { class: 'btn btn-go big', onclick: () => this.closeModal() }, '太好了')));
    }, { cls: 'm-lvup' });
  }
  showWelcome() {
    const s = this.g.s;
    this.openModal('歡迎來到咖啡巷', body => {
      body.appendChild(h('div', { class: 'welcome' },
        h('div', { class: 'portrait big', html: avatarSVG(s.staff[0].look, { staff: true, uniform: s.uniform, mood: 'happy' }) }),
        h('div', {},
          h('p', { text: '巷口這間小咖啡館，從今天起交給你經營了！' }),
          h('p', { text: '流程很簡單：烘豆 → 沖煮咖啡 → 放上展示櫃 → 店員送給客人 → 收錢升級。' }),
          h('p', { text: '左上角的任務會一步一步帶你上手。先點吧台上的紅色「烘豆機」開始吧。' }))));
      body.appendChild(h('div', { class: 'center' }, h('button', { class: 'btn btn-go big', onclick: () => this.closeModal() }, '開店囉')));
    }, { cls: 'm-welcome' });
  }

  // ---------- 裝潢模式 ----------
  enterEdit() {
    this.closeModal(true);
    this.edit = { on: true, mode: 'select' };
    this.room.setEdit(this.edit);
    this.root.classList.add('editing');
    this.bar.hidden = true; this.editBar.hidden = false; this.editHint.hidden = false;
    this.renderEditBar();
    this.setHint('點商品擺進店裡；點店裡的家具可以移動、收起或賣出。');
  }
  exitEdit() {
    this.edit = { on: false };
    this.room.setEdit(this.edit);
    this.root.classList.remove('editing');
    this.bar.hidden = false; this.editBar.hidden = true; this.editHint.hidden = true;
    this.closePopover();
    this.refresh(true);
  }
  setHint(t) { this.editHint.textContent = t; }
  setEditMode(patch) {
    Object.assign(this.edit, patch);
    this.room.setEdit(this.edit);
    this.closePopover();
    this.renderEditBar();
  }
  renderEditBar() {
    const g = this.g, s = g.s, e = this.edit;
    const bar = this.editBar;
    bar.innerHTML = '';
    const tabs = [['table', '桌子'], ['chair', '椅子'], ['decor', '擺飾'], ['wall', '壁飾'], ['floor', '地板'], ['wallpaper', '牆面'], ['storage', `倉庫 ${s.storage.length}`]];
    const tabRow = h('div', { class: 'edit-tabs' });
    for (const [k, label] of tabs) tabRow.appendChild(h('button', { class: 'tab' + (this.editTab === k ? ' on' : ''), onclick: () => { this.editTab = k; this.setEditMode({ mode: 'select', type: null, storageIdx: null, moveId: null, selectedId: null }); } }, label));
    tabRow.appendChild(h('button', { class: 'btn btn-go done-btn', onclick: () => this.exitEdit() }, '完成'));
    const items = h('div', { class: 'edit-items' });
    const tab = this.editTab;
    const itemCard = (key, nm, preview, priceLine, opts = {}) => h('button', {
      class: 'eitem' + (opts.sel ? ' sel' : '') + (opts.lock ? ' locked' : '') + (opts.owned ? ' owned' : ''),
      onclick: opts.lock ? () => this.toast(`Lv${opts.lockLv} 解鎖`, 'warn') : opts.onclick,
    }, h('div', { class: 'eitem-pv', html: preview }), h('b', { text: nm }), h('span', { class: 'eprice' }, ...priceLine));
    if (['table', 'chair', 'decor', 'wall'].includes(tab)) {
      for (const [id, it] of Object.entries(FURNITURE)) {
        if (it.kind !== tab) continue;
        const lock = s.level < it.lv;
        const sel = (e.mode === 'place' || e.mode === 'wallPlace') && e.type === id && e.storageIdx == null;
        items.appendChild(itemCard(id, it.name, furnPreview(id), lock ? [icon('lock', 'ic sm'), `Lv${it.lv}`] : [icon('coin', 'ic sm'), fmt(it.cost), h('em', { text: ` ♥${it.charm}` })], {
          sel, lock, lockLv: it.lv,
          onclick: () => {
            if (sel) { this.setEditMode({ mode: 'select', type: null }); this.setHint('點商品擺進店裡；點店裡的家具可以移動、收起或賣出。'); return; }
            if (s.coins < it.cost) { this.toast('金幣不夠', 'warn'); return; }
            if (it.kind === 'wall') { this.setEditMode({ mode: 'wallPlace', type: id, storageIdx: null, moveId: null, selectedId: null }); this.setHint(`點牆上發亮的位置掛上「${it.name}」。`); }
            else { this.setEditMode({ mode: 'place', type: id, storageIdx: null, moveId: null, selectedId: null }); this.setHint(`點地板上發亮的格子擺放「${it.name}」。椅子要擺在桌子旁邊客人才會坐。`); }
          },
        }));
      }
    } else if (tab === 'floor' || tab === 'wallpaper') {
      const table = tab === 'floor' ? FLOORS : WALLS;
      const owned = tab === 'floor' ? s.ownedFloors : s.ownedWalls;
      const cur = tab === 'floor' ? s.floor : s.wallpaper;
      for (const [id, t] of Object.entries(table)) {
        const lock = s.level < t.lv && !owned.includes(id);
        const has = owned.includes(id);
        items.appendChild(itemCard(id, t.name, themePreview(tab === 'floor' ? 'floor' : 'wall', id),
          lock ? [icon('lock', 'ic sm'), `Lv${t.lv}`] : has ? [cur === id ? '使用中' : '已擁有'] : [icon('coin', 'ic sm'), fmt(t.cost), h('em', { text: ` ♥${t.charm}` })], {
            sel: cur === id, lock, lockLv: t.lv, owned: has,
            onclick: () => { if (g.buyTheme(tab === 'floor' ? 'floor' : 'wall', id)) { this.renderEditBar(); this.refresh(true); } },
          }));
      }
    } else if (tab === 'storage') {
      if (!s.storage.length) items.appendChild(h('div', { class: 'empty-small', text: '倉庫是空的。收起的家具會放在這裡。' }));
      s.storage.forEach((it, idx) => {
        const f = FURNITURE[it.type];
        const sel = e.storageIdx === idx;
        items.appendChild(itemCard('st' + idx, f.name, furnPreview(it.type), [`♥${f.charm}`], {
          sel,
          onclick: () => {
            if (sel) { this.setEditMode({ mode: 'select', type: null, storageIdx: null }); return; }
            if (f.kind === 'wall') { this.setEditMode({ mode: 'wallPlace', type: it.type, storageIdx: idx, moveId: null, selectedId: null }); this.setHint(`點牆上發亮的位置掛上「${f.name}」。`); }
            else { this.setEditMode({ mode: 'place', type: it.type, storageIdx: idx, moveId: null, selectedId: null }); this.setHint(`點地板上發亮的格子擺放「${f.name}」。`); }
          },
        }));
      });
      if (s.storage.length) items.appendChild(h('div', { class: 'empty-small' }, h('button', { class: 'btn', onclick: () => {
        if (e.storageIdx == null) { this.toast('先選一件倉庫裡的家具'); return; }
        const back = g.sellStorage(e.storageIdx);
        this.toast(`賣出，拿回 ${back} 金幣`); this.setEditMode({ mode: 'select', type: null, storageIdx: null }); this.refresh(true);
      } }, '賣出選取的')));
    }
    bar.append(tabRow, items);
  }
  // 地板格被點
  onTile(x, y) {
    const g = this.g, e = this.edit;
    if (e.mode === 'place') {
      let ok;
      if (e.storageIdx != null) ok = g.placeFromStorage(e.storageIdx, x, y);
      else ok = g.placeNew(e.type, x, y);
      if (ok) {
        if (e.storageIdx != null) this.setEditMode({ mode: 'select', type: null, storageIdx: null });
        else if (g.s.coins < FURNITURE[e.type].cost) this.setEditMode({ mode: 'select', type: null });
        else this.room.setEdit(this.edit); // 繼續擺同一件
        this.refresh(true);
      }
    } else if (e.mode === 'move') {
      if (x === e.fromX && y === e.fromY) { this.setEditMode({ mode: 'select', moveId: null, type: null }); return; }
      if (g.moveFurniture(e.moveId, x, y)) { this.setEditMode({ mode: 'select', moveId: null, type: null }); this.setHint('移好了。'); }
    }
  }
  onWallSeg(side, i) {
    const g = this.g, e = this.edit;
    let ok;
    if (e.mode === 'wallMove') ok = g.moveWall(e.moveId, side, i);
    else if (e.storageIdx != null) ok = g.placeWallFromStorage(e.storageIdx, side, i);
    else ok = g.placeWallNew(e.type, side, i);
    if (ok) { this.setEditMode({ mode: 'select', type: null, storageIdx: null, moveId: null }); this.refresh(true); }
  }
  onFurniture(id, ev) {
    const g = this.g;
    const f = g.s.furniture.find(q => q.id === id);
    if (!f) return;
    this.setEditMode({ mode: 'select', selectedId: id, type: null, storageIdx: null, moveId: null });
    const it = FURNITURE[f.type];
    const seat = it.kind === 'chair' ? g.seats().find(q => q.f.id === id) : null;
    const pos = this.room.toStage(f.x + 0.5, f.y + 0.5, 90);
    this.showPopover(pos, it.name + `（♥${it.charm}）`, seat && !seat.ok ? seat.reason : '', [
      ['移動', () => { if (g.locked(f)) { this.toast('客人正在使用', 'warn'); return; } this.setEditMode({ mode: 'move', moveId: id, type: f.type, fromX: f.x, fromY: f.y, selectedId: null }); this.setHint('點新的位置；點原位置取消。'); }],
      ['收起', () => { if (g.storeFurniture(id)) { this.setEditMode({ mode: 'select', selectedId: null }); this.refresh(true); } }],
      [`賣出 +${Math.floor(it.cost / 2)}`, () => { const b = g.sellFurniture(id); if (b) { this.toast(`賣出，拿回 ${b} 金幣`); this.setEditMode({ mode: 'select', selectedId: null }); this.refresh(true); } }],
    ]);
    void ev;
  }
  onWallItem(id) {
    const g = this.g;
    const w = g.s.wall.find(q => q.id === id);
    if (!w) return;
    this.setEditMode({ mode: 'select', selectedId: id });
    const it = FURNITURE[w.type];
    const pos = w.side === 'R' ? this.room.toStage(w.i + 0.5, 0, 150) : this.room.toStage(0, w.i + 0.5, 150);
    this.showPopover(pos, it.name + `（♥${it.charm}）`, '', [
      ['移動', () => { this.setEditMode({ mode: 'wallMove', moveId: id, type: w.type, selectedId: null }); this.setHint('點牆上新的位置。'); }],
      ['收起', () => { g.storeWall(id); this.setEditMode({ mode: 'select', selectedId: null }); this.refresh(true); }],
      [`賣出 +${Math.floor(it.cost / 2)}`, () => { const b = g.sellWall(id); this.toast(`賣出，拿回 ${b} 金幣`); this.setEditMode({ mode: 'select', selectedId: null }); this.refresh(true); }],
    ]);
  }
  onEditEmpty() {
    if (this.edit.mode === 'wallPlace' || this.edit.mode === 'wallMove') return;
    if (this.edit.selectedId) this.setEditMode({ mode: 'select', selectedId: null });
  }
  showPopover(pos, title, warn, actions) {
    const p = this.popover;
    p.innerHTML = '';
    p.append(h('b', { text: title }));
    if (warn) p.append(h('div', { class: 'warnline', text: '⚠ ' + warn }));
    const row = h('div', { class: 'pop-acts' });
    for (const [label, fn] of actions) row.appendChild(h('button', { class: 'btn small', onclick: () => { sfx('click'); fn(); } }, label));
    p.append(row);
    p.hidden = false;
    const x = Math.max(110, Math.min(1170, pos.x)), y = Math.max(110, pos.y);
    p.style.left = x + 'px'; p.style.top = y + 'px';
  }
  closePopover() { this.popover.hidden = true; }

  // 點客人：看他點了什麼
  onCustomer(id) {
    const c = this.g.customers.find(q => q.id === id);
    if (!c) return;
    const reg = c.regId && this.g.s.regulars.find(r => r.id === c.regId);
    const who = reg ? `${reg.name}（常客）` : '客人';
    if (c.state === 'order') this.toast(`${who}想要${RECIPES[c.order].name}` + (this.g.s.stock[c.order] > 0 ? '' : '，展示櫃沒貨了！'));
    else if (c.state === 'drink') this.toast(`${who}正在享用${RECIPES[c.order].name}`);
    else this.toast(who);
  }
}
