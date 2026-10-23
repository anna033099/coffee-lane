// 裝潢模式：購買、擺放、移動、旋轉、收起、賣出家具；地板牆面主題；吧台機器
import { h, ic, fmt, toast } from './core.js';
import * as D from '../data.js';
import { I } from '../icons.js';
import { sfx } from '../audio.js';
import { openMachineShop } from './machines.js';

const TABS = [['table', '桌子'], ['chair', '椅子'], ['decor', '擺飾'], ['pendant', '吊燈'], ['wall', '壁飾'], ['floor', '地板'], ['wallpaper', '牆面'], ['bar', '吧台'], ['storage', '倉庫']];

export class Decor {
  constructor(ui) {
    this.ui = ui; this.tab = 'table';
    this.st = { on: false };
    this.bar = h('div', { class: 'editbar plate', hidden: true });
    this.hint = h('div', { class: 'edit-hint', hidden: true });
    this.pop = h('div', { class: 'popover plate', hidden: true });
    this.score = h('div', { class: 'edit-score pill plate', hidden: true });
    ui.root.append(this.bar, this.hint, this.pop, this.score);
  }
  get g() { return this.ui.g; }
  get w() { return this.ui.world; }
  enter() {
    this.ui.closeAll();
    this.st = { on: true, mode: 'select' };
    this.w.setEdit(this.st);
    this.ui.root.classList.add('editing');
    this.ui.hud.hidden = true;
    this.bar.hidden = false; this.hint.hidden = false; this.score.hidden = false;
    this.render();
    this.say('選商品放進店裡；點店裡的家具可以移動、旋轉、收起或賣出。');
  }
  exit() {
    this.st = { on: false };
    this.w.setEdit(this.st);
    this.ui.root.classList.remove('editing');
    this.ui.hud.hidden = false;
    this.bar.hidden = true; this.hint.hidden = true; this.pop.hidden = true; this.score.hidden = true;
    this.ui.refresh();
  }
  say(t) { this.hint.textContent = t; }
  setMode(p) { Object.assign(this.st, p); this.w.setEdit(this.st); this.pop.hidden = true; this.render(); }
  updateScore() { this.score.innerHTML = ''; this.score.append(ic('score'), h('b', { text: '裝潢分數 ' + this.g.score() }), h('small', { text: `　金幣 ${fmt(this.g.s.gold)}` })); }

  render() {
    const g = this.g, s = g.s, st = this.st;
    this.updateScore();
    const bar = this.bar;
    bar.innerHTML = '';
    const tabs = h('div', { class: 'etabs' });
    for (const [k, nm] of TABS) tabs.appendChild(h('button', { class: 'm-tab' + (this.tab === k ? ' on' : ''), onclick: () => { sfx('click'); this.tab = k; this.setMode({ mode: 'select', type: null, storageIdx: null, moveId: null }); this.say({ floor: '選一種地板，買下後立刻換上。', wallpaper: '選一種牆面，買下後立刻換上。', bar: '點吧台機器可以移位或賣出；空位可以買新機器。', storage: '收起來的家具在這裡，選一件放回店裡。' }[k] || '選商品放進店裡；點店裡的家具可以移動、旋轉、收起或賣出。'); } }, k === 'storage' ? `${nm} ${s.storage.length}` : nm));
    tabs.append(h('span', { class: 'spacer' }), h('button', { class: 'btn blue', onclick: () => import('./panels.js').then(P => P.openExpand(this.ui)) }, '擴店'), h('button', { class: 'btn go', onclick: () => this.exit() }, '完成'));
    const items = h('div', { class: 'eitems' });
    const tab = this.tab;
    const add = (key, name, artP, priceEl, opts) => {
      const el = h('button', { class: 'eitem' + (opts.sel ? ' sel' : '') + (opts.lock ? ' locked' : '') }, h('div', { class: 'eimg' }), h('b', { text: name }), h('span', { class: 'ep' }, ...priceEl));
      if (opts.own) el.appendChild(h('span', { class: 'own', text: opts.own }));
      el.addEventListener('click', () => { sfx('click'); if (opts.lock) toast(`Lv${opts.lockLv} 解鎖`, 'warn'); else opts.onclick(); });
      if (artP) Promise.resolve(artP).then(src => { if (src) el.firstChild.innerHTML = src.startsWith('<') ? src : `<img src="${src}" alt="">`; });
      items.appendChild(el);
    };
    if (['table', 'chair', 'decor', 'wall', 'pendant'].includes(tab)) {
      for (const [id, f] of Object.entries(D.FURNITURE)) {
        if (f.kind !== tab || f.hidden) continue;
        const lock = s.level < f.lv;
        const sel = st.type === id && st.storageIdx == null && ['place', 'wall', 'pendant'].includes(st.mode);
        const owned = g.ownedCount(id) + s.wallItems.filter(w => w.type === id).length + s.pendants.filter(p => p.type === id).length;
        add(id, f.name, this.ui.furnArt(id), lock ? [ic('lock'), `Lv${f.lv}`] : [f.coupon ? ic('coupon') : ic('gold'), fmt(f.coupon || f.cost), h('span', { class: 'sc' }, ic('score'), f.score)], {
          sel, lock, lockLv: f.lv, own: owned ? '已有 ' + owned : null,
          onclick: () => {
            if (sel) { this.setMode({ mode: 'select', type: null }); return this.say('選商品放進店裡；點店裡的家具可以移動、旋轉、收起或賣出。'); }
            if (f.coupon ? s.coupons < f.coupon : s.gold < f.cost) return toast(f.coupon ? '咖啡券不夠' : '金幣不夠', 'warn');
            const mode = f.kind === 'wall' ? 'wall' : f.kind === 'pendant' ? 'pendant' : 'place';
            this.setMode({ mode, type: id, storageIdx: null, moveId: null, rot: 0 });
            this.say(mode === 'wall' ? `點牆上綠色的位置掛上「${f.name}」` : mode === 'pendant' ? `點地板上的綠色格子，在上方掛「${f.name}」` : `點綠色格子擺放「${f.name}」${f.kind === 'chair' ? '（椅子要靠著桌子，客人才會坐）' : ''}`);
          },
        });
      }
    } else if (tab === 'floor' || tab === 'wallpaper') {
      const table = tab === 'floor' ? D.FLOORS : D.WALLS, owned = tab === 'floor' ? s.ownedFloors : s.ownedWalls, cur = tab === 'floor' ? s.floor : s.wall;
      for (const [id, t] of Object.entries(table)) {
        const has = owned.includes(id), lock = s.level < t.lv && !has;
        add(id, t.name, this.ui.themeArt(tab, id), lock ? [ic('lock'), `Lv${t.lv}`] : has ? [cur === id ? '使用中' : '已擁有'] : [t.coupon ? ic('coupon') : ic('gold'), fmt(t.coupon || t.cost), h('span', { class: 'sc' }, ic('score'), t.score)], {
          sel: cur === id, lock, lockLv: t.lv,
          onclick: () => { if (g.buyTheme(tab === 'floor' ? 'floor' : 'wall', id)) { this.render(); } },
        });
      }
    } else if (tab === 'bar') {
      for (let slot = 1; slot <= g.slots; slot++) {
        const m = g.machineAt(slot);
        if (!m) { add('e' + slot, `第 ${slot} 格（空）`, `<div style="font-size:2rem;color:#c9b79e;font-weight:900">+</div>`, ['點這裡購買'], { onclick: () => openMachineShop(this.ui, slot) }); continue; }
        const d = g.mdef(m);
        add(m.id, `${slot}. ${d.name}`, this.ui.machineArt(m.type), [m.job ? '運作中' : '閒置'], {
          sel: st.machineId === m.id,
          onclick: () => this.machinePop(m),
        });
      }
    } else if (tab === 'storage') {
      if (!s.storage.length) items.appendChild(h('div', { class: 'muted', style: 'padding:1rem', text: '倉庫是空的，收起來的家具會放在這裡。' }));
      s.storage.forEach((it, idx) => {
        const f = D.FURNITURE[it.type];
        add('s' + idx, f.name, this.ui.furnArt(it.type), [h('span', { class: 'sc' }, ic('score'), f.score)], {
          sel: st.storageIdx === idx,
          onclick: () => {
            if (st.storageIdx === idx) return this.setMode({ mode: 'select', type: null, storageIdx: null });
            const mode = f.kind === 'wall' ? 'wall' : f.kind === 'pendant' ? 'pendant' : 'place';
            this.setMode({ mode, type: it.type, storageIdx: idx, moveId: null, rot: 0 });
            this.say(`把「${f.name}」放回店裡`);
          },
        });
      });
      if (s.storage.length) items.appendChild(h('button', { class: 'btn', style: 'align-self:center', onclick: () => { if (st.storageIdx == null) return toast('先選一件倉庫裡的東西'); const b = g.sellStorage(st.storageIdx); toast(`賣出，拿回 ${b} 金幣`); this.setMode({ mode: 'select', storageIdx: null, type: null }); } }, '賣出選取的'));
    }
    bar.append(tabs, items);
  }
  machinePop(m) {
    const g = this.g;
    const p = this.w.engine.project(m.slot + 0.5, 0.5, 2.0);
    this.popover(p, g.mdef(m).name, '', [
      ['往左移', () => { if (m.slot > 1) { g.moveMachine(m, m.slot - 1); this.render(); } }],
      ['往右移', () => { if (m.slot < g.slots) { g.moveMachine(m, m.slot + 1); this.render(); } }],
      [`賣出 +${Math.floor(g.mdef(m).cost / 2)}`, () => { if (g.sellMachine(m)) { toast('已賣出'); this.render(); } }],
    ]);
  }
  popover(p, title, warn, acts) {
    const pop = this.pop;
    pop.innerHTML = '';
    pop.append(h('b', { text: title }));
    if (warn) pop.append(h('div', { class: 'warn', text: '⚠ ' + warn }));
    pop.append(h('div', { class: 'acts' }, acts.map(([nm, fn]) => h('button', { class: 'btn sm', onclick: () => { sfx('click'); this.pop.hidden = true; fn(); } }, nm))));
    pop.hidden = false;
    const r = this.ui.root.getBoundingClientRect();
    pop.style.left = Math.max(120, Math.min(r.width - 120, p.x)) + 'px';
    pop.style.top = Math.max(140, p.y) + 'px';
  }

  // 指標移動：預覽家具位置
  move(ev) {
    const st = this.st;
    if (!st.on || !['place', 'move', 'pendant'].includes(st.mode)) return this.w.setGhost(null);
    const f = this.w.engine.floorAt(ev.clientX, ev.clientY);
    if (!f) return;
    const x = Math.floor(f.x), y = Math.floor(f.y);
    if (!this.g.inside(x, y)) return this.w.setGhost(null);
    const ok = st.mode === 'pendant' ? this.g.canPendant(x, y, st.moveId) : this.g.canPlace(x, y, st.moveId);
    this.w.setGhost(st.type, x, y, ok, st.rot || 0);
  }
  // 點擊
  tap(ev, hit) {
    const g = this.g, st = this.st;
    if (st.mode === 'wall') {
      const seg = this.w.pickWallSeg(ev.clientX, ev.clientY);
      if (!seg) return;
      let ok;
      if (st.moveId) ok = g.moveWall(st.moveId, seg.side, seg.i);
      else ok = g.placeWall(st.type, seg.side, seg.i, st.storageIdx ?? -1);
      if (ok) this.after(st.storageIdx != null || st.moveId);
      return;
    }
    if (st.mode === 'place' || st.mode === 'move' || st.mode === 'pendant') {
      const f = this.w.engine.floorAt(ev.clientX, ev.clientY);
      if (!f) return;
      const x = Math.floor(f.x), y = Math.floor(f.y);
      let ok;
      if (st.mode === 'pendant') ok = st.moveId ? g.movePendant(st.moveId, x, y) : g.placePendant(st.type, x, y, st.storageIdx ?? -1);
      else if (st.mode === 'move') { ok = g.moveFurniture(st.moveId, x, y); if (ok && st.rot != null) { const fu = g.s.furniture.find(q => q.id === st.moveId); if (fu) { fu.rot = st.rot; g.touch(); } } }
      else ok = g.placeFurniture(st.type, x, y, st.rot || 0, st.storageIdx ?? -1);
      if (ok) this.after(st.storageIdx != null || st.mode === 'move' || st.moveId);
      return;
    }
    // 選取模式：點現有物件
    if (!hit) { this.pop.hidden = true; return; }
    if (hit.type === 'furniture') return this.furnPop(hit.id);
    if (hit.type === 'wallitem') return this.wallPop(hit.id);
    if (hit.type === 'pendant') return this.pendPop(hit.id);
    if (hit.type === 'machine') { const m = g.machineAt(hit.slot); if (m) this.machinePop(m); }
  }
  after(once) {
    this.updateScore();
    sfx('place');
    const st = this.st;
    if (once) { this.setMode({ mode: 'select', type: null, storageIdx: null, moveId: null }); this.say('擺好了！'); }
    else {
      const f = D.FURNITURE[st.type];
      if (f.coupon ? this.g.s.coupons < f.coupon : this.g.s.gold < f.cost) this.setMode({ mode: 'select', type: null });
      else { this.w.setEdit(this.st); this.render(); }
    }
  }
  furnPop(id) {
    const g = this.g, f = g.s.furniture.find(q => q.id === id);
    if (!f) return;
    const it = D.FURNITURE[f.type];
    const seat = it.kind === 'chair' ? g.seats().find(q => q.f.id === id) : null;
    const p = this.w.engine.project(f.x + 0.5, f.y + 0.5, 1.2);
    const back = Math.floor((it.cost || it.coupon * 500) / 2);
    this.popover(p, `${it.name}（✦${it.score}）`, seat && !seat.ok ? seat.why : '', [
      ['移動', () => { if (g.locked(f)) return toast('客人正在使用', 'warn'); this.setMode({ mode: 'move', moveId: id, type: f.type, rot: f.rot || 0 }); this.say('點新的位置'); }],
      ['旋轉', () => { g.rotateFurniture(id); }],
      ['收起', () => { if (g.storeFurniture(id)) this.render(); }],
      [`賣出 +${back}`, () => { const b = g.sellFurniture(id); if (b) { toast(`賣出，拿回 ${b} 金幣`); this.render(); } }],
    ]);
  }
  wallPop(id) {
    const g = this.g, w = g.s.wallItems.find(q => q.id === id);
    if (!w) return;
    const it = D.FURNITURE[w.type];
    const p = w.side === 'R' ? this.w.engine.project(w.i + 0.5, 0, 2.4) : this.w.engine.project(0, w.i + 0.5, 2.4);
    this.popover(p, `${it.name}（✦${it.score}）`, '', [
      ['移動', () => { this.setMode({ mode: 'wall', moveId: id, type: w.type }); this.say('點牆上新的位置'); }],
      ['收起', () => { g.storeWall(id); this.render(); }],
      [`賣出 +${Math.floor((it.cost || it.coupon * 500) / 2)}`, () => { g.sellWall(id); this.render(); }],
    ]);
  }
  pendPop(id) {
    const g = this.g, pd = g.s.pendants.find(q => q.id === id);
    if (!pd) return;
    const it = D.FURNITURE[pd.type];
    const p = this.w.engine.project(pd.x + 0.5, pd.y + 0.5, 2.8);
    this.popover(p, `${it.name}（✦${it.score}）`, '', [
      ['移動', () => { this.setMode({ mode: 'pendant', moveId: id, type: pd.type }); this.say('點新的位置'); }],
      ['收起', () => { g.storePendant(id); this.render(); }],
      [`賣出 +${Math.floor(it.cost / 2)}`, () => { g.sellPendant(id); this.render(); }],
    ]);
  }
}
export { I };
