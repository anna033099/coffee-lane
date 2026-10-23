// 把遊戲狀態畫進 3D 場景：店面、機器、家具、人物、頭上的圖示氣泡、點擊判定、裝潢模式
import * as THREE from 'three';
import { Engine, bakedModel, FACING_ROT, disposeTree } from '../js3d/room3d.js';
import * as MD from '../js3d/models.js';
import { CharSprite, CatSprite } from '../js3d/sprites.js';
import * as D from './data.js';
import { resolveLook } from './sim.js';
import { I, itemIcon } from './icons.js';
import { now } from './state.js';

const MACHINE_MODEL = MD.MACHINE_BUILDERS;
const ROT = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

export class World {
  constructor(canvas, overlayEl, game, cb) {
    this.e = new Engine(canvas);
    this.g = game; this.cb = cb;
    this.ov = overlayEl;
    this.sprites = new Map();
    this.bubbles = new Map();
    this.furnObjs = new Map();
    this.sig = {};
    this.edit = { on: false };
    this.mode = 'home';
    this.pickables = [];
    this.hl = null; this.ghost = null;
    this.setupInput();
  }
  get engine() { return this.e; }

  // ================== 建置 ==================
  sync() {
    const g = this.g, s = g.s, e = this.e;
    if (this.mode !== 'home') return;
    const shellSig = [g.W, g.D, s.floor, s.wall].join('|');
    let changed = false;
    if (this.sig.shell !== shellSig) { this.sig.shell = shellSig; e.buildShell(g.W, g.D, s.floor, s.wall); this.sig.bar = null; this.sig.furn = null; this.sig.walls = null; changed = true; }
    const barSig = g.slots + '|' + s.machines.map(m => m.type + '@' + m.slot).join(',');
    if (this.sig.bar !== barSig) { this.sig.bar = barSig; this.buildBar(); changed = true; }
    const furnSig = s.furniture.map(f => f.id + f.type + f.x + ',' + f.y + ',' + (f.rot || 0)).join('|') + '#' + s.messyChairs.join(',') + '#' + s.dirtyTables.join(',');
    if (this.sig.furn !== furnSig) { this.sig.furn = furnSig; this.buildFurniture(); changed = true; }
    const wallSig = s.wallItems.map(w => w.type + w.side + w.i).join('|') + '#' + s.pendants.map(p => p.type + p.x + ',' + p.y).join('|');
    if (this.sig.walls !== wallSig) { this.sig.walls = wallSig; this.buildWalls(); changed = true; }
    const cupSig = Math.min(12, s.returnCups) + '|' + Object.keys(s.showcase).length;
    if (this.sig.cups !== cupSig) { this.sig.cups = cupSig; this.buildCups(); }
    if (changed) { this.collectLights(); e.shadowsDirty(); this.refreshPickables(); if (this.edit.on) this.showEditGrid(); }
  }
  clearGroup(name) { if (this[name]) { this[name].removeFromParent(); this[name] = null; } }
  buildBar() {
    const g = this.g, e = this.e;
    this.clearGroup('barGroup');
    const grp = this.barGroup = new THREE.Group();
    for (let x = 0; x < g.slots; x++) {
      const b = bakedModel('bar', () => MD.backBar(true)); b.position.set(x + 0.5, 0, 0.5); grp.add(b);
      const d = bakedModel('shelf' + (x % 3), () => MD.shelfDecor(x % 3)); d.position.set(x + 0.5, 0, 0.5); grp.add(d);
    }
    // 前檯：收銀、甜點櫃、取餐、回收
    for (let x = 0; x < 4; x++) { const f = bakedModel('front', () => MD.frontCounter()); f.position.set(x + 0.5, 0, 2.5); grp.add(f); }
    const reg = bakedModel('register', () => MD.register()); reg.position.set(0.5, 0, 2.5); grp.add(reg);
    const sc = bakedModel('showcase', () => MD.showcase()); sc.position.set(1.5, 0, 2.5); grp.add(sc);
    const pk = bakedModel('pickup', () => MD.pickupSign()); pk.position.set(2.5, 0, 2.5); grp.add(pk);
    const rt = bakedModel('return', () => MD.returnStation()); rt.position.set(3.5, 0, 2.5); grp.add(rt);
    // 機器
    this.machineObjs = new Map();
    for (const m of this.g.s.machines) {
      if (m.slot > g.slots) continue;
      const o = bakedModel('m_' + m.type, MACHINE_MODEL[m.type] || (() => MD.grinder()));
      o.position.set(m.slot + 0.5, 0, 0.5);
      o.traverse(n => { n.userData.pick = { type: 'machine', slot: m.slot }; });
      this.anchorOf(o, m.slot);
      grp.add(o); this.machineObjs.set(m.slot, o);
    }
    // 空的吧台格：小盆栽或磨豆機，讓吧台不會空蕩蕩
    for (let x = 0; x < g.slots; x++) {
      if (x === 0 || this.machineObjs.has(x)) continue;
      const o = bakedModel('grinder', () => MD.grinder()); o.position.set(x + 0.5, 0, 0.5);
      o.traverse(n => { n.userData.pick = { type: 'emptyslot', slot: x }; }); grp.add(o);
    }
    // 吧台 0 號格：磨豆機與杯架（固定擺設）
    const g0 = bakedModel('grinder', () => MD.grinder()); g0.position.set(0.5, 0, 0.5); grp.add(g0);
    e.items.add(grp);
  }
  buildFurniture() {
    const g = this.g, s = g.s, e = this.e;
    this.clearGroup('furnGroup');
    const grp = this.furnGroup = new THREE.Group();
    const seatMap = new Map(g.seats().map(q => [q.f.id, q]));
    for (const f of s.furniture) {
      const o = bakedModel('f_' + f.type, () => MD.build(f.type));
      o.position.set(f.x + 0.5, 0, f.y + 0.5);
      const kind = D.FURNITURE[f.type].kind;
      if (kind === 'chair') {
        const st = seatMap.get(f.id);
        o.rotation.y = st && st.facing ? FACING_ROT[st.facing] : ROT[f.rot || 0];
        if (s.messyChairs.includes(f.id)) { o.rotation.y += 0.55; o.position.x += 0.08; o.position.z += 0.06; }
      } else o.rotation.y = ROT[f.rot || 0];
      if (kind === 'table' && s.dirtyTables.includes(f.id)) {
        const c1 = MD.cup('cup', 1.4); c1.position.set(0.12, 0.9, -0.05); c1.rotation.z = 0.2; o.add(c1);
        const c2 = MD.cup('glass', 1.3); c2.position.set(-0.12, 0.9, 0.1); o.add(c2);
      }
      o.traverse(n => { n.userData.pick = { type: 'furniture', id: f.id }; });
      grp.add(o); this.furnObjs.set(f.id, o);
    }
    e.items.add(grp);
  }
  buildWalls() {
    const s = this.g.s, e = this.e;
    this.clearGroup('wallGroup');
    const grp = this.wallGroup = new THREE.Group();
    for (const w of s.wallItems) {
      const o = bakedModel('w_' + w.type, () => MD.build(w.type));
      if (w.side === 'R') o.position.set(w.i + 0.5, 0, 0.0);
      else { o.position.set(0.0, 0, w.i + 0.5); o.rotation.y = Math.PI / 2; }
      o.traverse(n => { n.userData.pick = { type: 'wallitem', id: w.id }; });
      grp.add(o);
    }
    for (const p of s.pendants) {
      const o = bakedModel('p_' + p.type, () => MD.build(p.type));
      o.position.set(p.x + 0.5, 0, p.y + 0.5);
      o.traverse(n => { n.userData.pick = { type: 'pendant', id: p.id }; n.userData.noPickPlay = true; });
      grp.add(o);
    }
    e.items.add(grp);
  }
  buildCups() {
    this.clearGroup('cupGroup');
    const n = this.g.s.returnCups;
    if (!n) return;
    const grp = this.cupGroup = MD.cupPile(n);
    grp.position.set(3.5, 0, 2.5);
    this.e.items.add(grp);
  }
  collectLights() {
    const e = this.e;
    e.clearLights('in');
    const list = [];
    e.items.updateMatrixWorld(true);
    e.items.traverse(o => { if (o.userData && o.userData.lights) for (const L of o.userData.lights) list.push(new THREE.Vector3(...L.pos).applyMatrix4(o.matrixWorld).toArray().concat([L.intensity, L.dist, L.color])); });
    // 吧台上方固定兩盞暖光
    const W = this.g.W;
    list.push([1.5, 2.6, 1.5, 0.9, 4, '#ffcf8a'], [Math.min(W - 1, 4.5), 2.6, 1.5, 0.7, 4, '#ffcf8a']);
    // 手機上限制燈的數量
    const max = e.mobile ? 4 : 8;
    for (const L of list.slice(0, max)) e.addPointLight(new THREE.Vector3(L[0], L[1], L[2]), L[3], L[4], L[5] || '#ffc98a', 'in');
  }
  refreshPickables() {
    this.pickables = [];
    this.e.items.traverse(o => { if (o.isMesh && o.userData.pick) this.pickables.push(o); });
  }

  // ================== 人物 ==================
  spriteFor(id, look) {
    let sp = this.sprites.get(id);
    if (!sp) { sp = new CharSprite(look, this.e.actors); sp.mesh.userData.pick = { type: 'actor', id }; this.sprites.set(id, sp); }
    else sp.setLook(look);
    sp.alive = true;
    return sp;
  }
  frameOf(ent, opt = {}) {
    if (ent.pose === 'sit' || opt.sit) {
      if (ent.event === 'sleep') return 'f_sleep';
      return ent.back ? 'b_sit' : 'f_sit';
    }
    if (opt.tired) return 'f_sleep';
    const carry = ent.carry || ent.pose === 'carry';
    if (ent.back) {
      if (carry) return 'b_carry';
      return ent.step > 0 ? 'b_walk1' : ent.step < 0 ? 'b_walk2' : 'b_stand';
    }
    if (carry) return 'f_carry';
    if (ent.mood === 'happy' && !ent.step) return 'f_happy';
    return ent.step > 0 ? 'f_walk1' : ent.step < 0 ? 'f_walk2' : 'f_stand';
  }
  updateActors() {
    const g = this.g, s = g.s;
    for (const sp of this.sprites.values()) sp.alive = false;
    if (this.mode === 'home') {
      for (const c of g.customers) {
        const sp = this.spriteFor(c.id, c.look);
        const z = c.pose === 'sit' ? 0.3 : 0;
        sp.set(c.x, c.y, z);
        sp.setFrame(this.frameOf(c), c.dir === 1);
        sp.setOpacity(c.alpha);
        sp.setShadow(c.pose !== 'sit');
      }
      for (const rt of g.staffRt.values()) {
        const st = s.staff.find(q => q.id === rt.id); if (!st) continue;
        const sp = this.spriteFor('st_' + rt.id, resolveLook(st.look, s.apron, 'staff_' + st.job));
        sp.set(rt.x, rt.y, 0);
        sp.setFrame(this.frameOf(rt, { tired: rt.tired && rt.state !== 'walk' && !rt.path.length }), rt.dir === 1);
        sp.setOpacity(1);
      }
      const o = g.ownerRt;
      if (o) { const sp = this.spriteFor('owner', resolveLook(s.owner.look, s.apron, 'owner')); sp.set(o.x, o.y, 0); sp.setFrame(this.frameOf(o), o.dir === 1); sp.setOpacity(1); }
      for (const p of g.passers) { const sp = this.spriteFor(p.id, p.look); sp.set(p.x, p.y, 0); sp.setFrame(this.frameOf(p), p.dir === 1); sp.setOpacity(p.alpha); }
      const cr = this.catAI && this.catAI.rt;
      if (s.cat && cr) {
        if (!this.catSprite) { this.catSprite = new CatSprite(s.cat.type, this.e.actors); this.catSprite.mesh.userData.pick = { type: 'cat' }; }
        this.catSprite.setType(s.cat.type);
        this.catSprite.set(cr.x, cr.y); this.catSprite.setFrame(this.catAI.frame(), cr.dir === 1);
      } else if (this.catSprite) { this.catSprite.dispose(); this.catSprite = null; }
    } else if (this.mode === 'up' && this.up) {
      for (const a of this.up.actors) { const sp = this.spriteFor(a.id, a.look); sp.set(a.x, a.y, a.sit ? 0.3 : 0); sp.setFrame(a.frame, a.flip); sp.setOpacity(1); sp.setShadow(!a.sit); }
    } else if (this.visit) {
      for (const a of this.visit.actors) { const sp = this.spriteFor(a.id, a.look); sp.set(a.x, a.y, a.sit ? 0.3 : 0); sp.setFrame(a.frame, a.flip); sp.setOpacity(1); sp.setShadow(!a.sit); }
    }
    for (const [id, sp] of this.sprites) if (!sp.alive) { sp.dispose(); this.sprites.delete(id); }
  }

  // ================== 頭上圖示（DOM） ==================
  bubble(id, html, cls, x, y, z, pick, scr) {
    let b = this.bubbles.get(id);
    if (!b) {
      b = { el: document.createElement('div'), html: null, cls: null };
      b.el.className = 'bub';
      b.el.addEventListener('pointerdown', ev => { ev.stopPropagation(); });
      b.el.addEventListener('click', ev => { ev.stopPropagation(); if (b.pick) this.cb.onPick(b.pick, ev); });
      this.ov.appendChild(b.el); this.bubbles.set(id, b);
    }
    if (b.html !== html) { b.el.innerHTML = html; b.html = html; }
    if (b.cls !== cls) { b.el.className = 'bub ' + cls; b.cls = cls; }
    b.pick = pick;
    const p = scr || this.e.project(x, y, z);
    const tx = Math.round(p.x), ty = Math.round(p.y);
    if (b.x !== tx || b.y !== ty) { b.el.style.transform = `translate(${tx}px, ${ty}px)`; b.x = tx; b.y = ty; }
    b.alive = true;
  }
  ring(p, color) {
    const C = 2 * Math.PI * 17;
    return `<svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" transform="rotate(-90 20 20)"/></svg>`;
  }
  // 頭上圖示要對準機器本體：用模型的實際外框算中心與頂端
  anchorOf(o, slot) {
    if (!this.anchors) this.anchors = new Map();
    o.updateMatrixWorld(true);
    // 整台機器的外框會被蒸汽管、杯子等小零件撐歪，水平中心改用「體積最大的那一塊」（機身）
    const all = new THREE.Box3().setFromObject(o);
    let best = null, bv = -1;
    o.traverse(n => { if (!n.isMesh) return; const b = new THREE.Box3().setFromObject(n); const sz = b.getSize(new THREE.Vector3()); const v = sz.x * sz.y * sz.z; if (v > bv) { bv = v; best = b; } });
    const c = (best || all).getCenter(new THREE.Vector3());
    this.anchors.set(slot, { x: c.x, z: c.z, top: Math.min(all.max.y, 1.62) });
  }
  machineBubble(m, X, t) {
    const g = this.g;
    const st = g.status(m, t);
    const k = g.mdef(m).kind, j = m.job;
    const kind = j ? (j.kind === 'roast' ? 'roast' : j.kind === 'brew' ? 'drink' : j.kind) : null;
    const pick = { type: 'machine', slot: m.slot };
    const an = this.anchors && this.anchors.get(m.slot);
    let Y = 0.45, Z = 1.95, a = null;
    if (an) { const p = this.e.project(an.x, an.z, an.top); a = { x: p.x, y: p.y - 6 }; }
    const bub = (id, html, cls, x, y, z, pk) => a ? this.bubble(id, html, cls, 0, 0, 0, pk, a) : this.bubble(id, html, cls, x, y, z, pk);
    if (st.st === 'idle') {
      const ic = k === 'roaster' ? I.bean : k === 'espresso' ? I.cup : k === 'side' ? I.cake : I.meal;
      bub('m' + m.slot, `<div class="b-idle">${ic}</div>`, 'idle', X, Y, Z - 0.25, pick);
    } else if (st.st === 'run') {
      bub('m' + m.slot, `<div class="b-run">${this.ring(st.p, kind === 'roast' ? '#d9775f' : '#4f8a78')}<div class="b-ic">${itemIcon(kind, j.item, 30)}</div></div>`, 'run', X, Y, Z, pick);
    } else if (st.st === 'sell') {
      bub('m' + m.slot, `<div class="b-sell"><div class="b-ic">${itemIcon('drink', j.item, 30)}</div><b>${j.sellLeft}</b></div>`, 'sell', X, Y, Z, pick);
    } else if (st.st === 'done') {
      bub('m' + m.slot, `<div class="b-done"><div class="b-ic">${itemIcon(kind, j.item, 36)}</div><i>${I.check}</i></div>`, 'done', X, Y, Z, pick);
    } else if (st.st === 'burnt') {
      bub('m' + m.slot, `<div class="b-burnt">${I.smoke}</div>`, 'burnt', X, Y, Z, pick);
    }
  }
  updateBubbles() {
    for (const b of this.bubbles.values()) b.alive = false;
    const g = this.g, s = g.s, t = now();
    if (this.mode === 'home' && !this.edit.on) {
      for (const m of s.machines) { if (m.slot > g.slots) continue; this.machineBubble(m, m.slot + 0.5, t); }
      for (const c of g.customers) {
        const pick = { type: 'actor', id: c.id };
        const z = c.pose === 'sit' ? 1.5 : 1.78;
        if (c.event === 'sleep') this.bubble('c' + c.id, `<div class="b-ev zzz">${I.zzz}</div>`, 'ev', c.x, c.y, z, pick);
        else if (c.event === 'tip') this.bubble('c' + c.id, `<div class="b-ev tip">${I.tip}</div>`, 'ev', c.x, c.y, z, pick);
        else if (c.event === 'special') this.bubble('c' + c.id, `<div class="b-special">${I.star}<span>${itemIcon('drink', s.pendingSpecial ? s.pendingSpecial.recipe : 'latte', 26)}</span></div>`, 'special', c.x, c.y, z + 0.1, pick);
        else if (c.state === 'order' || c.state === 'queue' && c.qi === 0) this.bubble('c' + c.id, `<div class="b-say">${c.state === 'order' ? '<span class="dots"><i></i><i></i><i></i></span>' : ''}</div>`, c.state === 'order' ? 'say' : 'hide', c.x, c.y, z, pick);
        if (c.regId && c.state !== 'exit') this.bubble('n' + c.id, `<div class="nametag">${D.REGULARS[c.regId].name}</div>`, 'tag', c.x, c.y, c.pose === 'sit' ? 0.25 : -0.05, pick);
      }
      for (const rt of g.staffRt.values()) {
        const st = s.staff.find(q => q.id === rt.id); if (!st) continue;
        const pct = st.energy / g.maxEnergy(st);
        const pick = { type: 'staff', id: st.id };
        if (st.energy <= 0) this.bubble('s' + st.id, `<div class="b-tired">${I.zzz}<div class="ebar"><i style="width:0%"></i></div></div>`, 'tired', rt.x, rt.y, 1.85, pick);
        else if (pct < 0.3) this.bubble('s' + st.id, `<div class="b-energy"><div class="ebar"><i style="width:${Math.round(pct * 100)}%"></i></div></div>`, 'energy', rt.x, rt.y, 1.85, pick);
      }
      if (!g.selling(t)) this.bubble('nosell', `<div class="b-hint">${I.cup}<span>櫃檯沒有飲品，客人不會上門</span></div>`, 'hint', 1.5, 2.5, 1.7, { type: 'hint' });
      for (const id of s.messyChairs) { const f = s.furniture.find(q => q.id === id); if (f) this.bubble('mc' + id, `<div class="b-ev small">${I.broom}</div>`, 'ev', f.x + 0.5, f.y + 0.5, 1.15, { type: 'furniture', id }); }
      for (const id of s.dirtyTables) { const f = s.furniture.find(q => q.id === id); if (f) this.bubble('dt' + id, `<div class="b-ev small">${I.sparkle}</div>`, 'ev', f.x + 0.5, f.y + 0.5, 1.25, { type: 'furniture', id }); }
      for (const p of g.passers) {
        if (!p.interested) continue;
        const pick = { type: 'passer', id: p.id };
        if (p.regId) this.bubble('p' + p.id, `<div class="b-recruit reg">${I.heart}<span>${D.REGULARS[p.regId].name}</span></div>`, 'recruit', p.x, p.y, 1.85, pick);
        else this.bubble('p' + p.id, `<div class="b-recruit">!</div>`, 'recruit', p.x, p.y, 1.85, pick);
      }
    } else if (this.mode === 'up' && this.up) {
      for (let i = 0; i < 4; i++) {
        const slot = 100 + i, m = s.machines.find(q => q.slot === slot);
        if (m) this.machineBubble(m, i + 1.5, t);
        else this.bubble('e' + slot, `<div class="b-plus">+</div>`, 'idle', i + 1.5, 0.45, 1.7, { type: 'emptyslot', slot });
      }
    } else if (this.mode === 'visit' && this.visit) {
      for (const h of this.visit.spots) {
        if (h.done) continue;
        this.bubble('v' + h.id, `<div class="b-help">${h.icon}</div>`, 'help', h.x, h.y, h.z, { type: 'help', id: h.id });
      }
    }
    for (const [id, b] of this.bubbles) if (!b.alive) { b.el.remove(); this.bubbles.delete(id); }
  }
  // 飄字（+金幣等）
  floater(pos, text, kind) {
    let x, y, z;
    if (pos.slot !== undefined) { const a = this.anchors && this.anchors.get(pos.slot); if (a) { x = a.x; y = a.z; z = a.top + 0.5; } else { x = pos.slot >= 100 ? pos.slot - 100 + 1.5 : pos.slot + 0.5; y = 0.45; z = 2.2; } } else { x = pos.x; y = pos.y; z = pos.z || 1.6; }
    const p = this.e.project(x, y, z);
    const el = document.createElement('div');
    el.className = 'floater ' + kind;
    const ic = { gold: I.gold, bean: I.bean, exp: I.exp, energy: I.energy, cake: I.cake, meal: I.meal }[kind] || '';
    el.innerHTML = `<span class="fi">${ic}</span><b>${text}</b>`;
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    this.ov.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  // ================== 輸入 ==================
  setupInput() {
    const c = this.e.canvas;
    const ptrs = new Map();
    let downHit = null, moved = false, pinch = null, start = null;
    c.addEventListener('pointerdown', ev => {
      c.setPointerCapture(ev.pointerId);
      ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      moved = false; start = { x: ev.clientX, y: ev.clientY, t: performance.now() };
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.e.zoom }; downHit = null; }
      else downHit = this.pick(ev.clientX, ev.clientY);
      if (this.edit.on) this.cb.onEditMove && this.cb.onEditMove(ev);
    });
    c.addEventListener('pointermove', ev => {
      const p = ptrs.get(ev.pointerId);
      if (this.edit.on) this.cb.onEditMove && this.cb.onEditMove(ev);
      if (!p) return;
      const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
      p.x = ev.clientX; p.y = ev.clientY;
      if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()];
        this.e.setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.d)); moved = true; return;
      }
      const dist = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
      // 往上拖員工 = 打氣
      if (downHit && downHit.type === 'actor' && (downHit.id.startsWith('st_')) && start.y - ev.clientY > 34) {
        this.cb.onCheer(downHit.id.slice(3)); downHit = null; moved = true; return;
      }
      if (dist > 8) moved = true;
      if (moved && this.e.zoom > 1.01 && !(this.edit.on && this.edit.dragging)) this.e.panBy(dx, dy);
    });
    const up = ev => {
      if (!ptrs.has(ev.pointerId)) return;
      ptrs.delete(ev.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (!moved && ptrs.size === 0) {
        if (this.edit.on) this.cb.onEditTap(ev, this.pick(ev.clientX, ev.clientY));
        else { const hit = downHit || this.pick(ev.clientX, ev.clientY); if (hit) this.cb.onPick(hit, ev); }
      }
      downHit = null;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', ev => { ev.preventDefault(); this.e.setZoom(this.e.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)); }, { passive: false });
  }
  pick(cx, cy) {
    const rc = this.e.ray(cx, cy);
    const actors = [];
    for (const sp of this.sprites.values()) if (sp.mesh.visible) actors.push(sp.mesh);
    if (this.catSprite && this.mode === 'home') actors.push(this.catSprite.mesh);
    const hits = rc.intersectObjects(actors.concat(this.pickables), false);
    for (const h of hits) {
      const p = h.object.userData.pick;
      if (!p) continue;
      if (p.type === 'cat') return p;
      if (p.type === 'actor') {
        // 檢查透明區域
        const sp = [...this.sprites.values()].find(q => q.mesh === h.object);
        if (sp && !this.alphaHit(sp, h.uv)) continue;
        const id = p.id;
        if (id.startsWith('st_')) return { type: 'actor', id, staff: id.slice(3) };
        if (id === 'owner') return { type: 'owner' };
        if (this.g.passers.some(q => q.id === id)) return { type: 'passer', id };
        return { type: 'actor', id };
      }
      if (p.noPickPlay && !this.edit.on) continue;
      return p;
    }
    return null;
  }
  alphaHit(sp, uv) { return !!uv; }

  // ================== 裝潢模式 ==================
  setEdit(edit) {
    this.edit = edit;
    this.e.margins = edit.on ? { l: 0.02, r: 0.02, t: 0.1, b: 0.3 } : null;
    this.e.fitCamera();
    if (edit.on) this.showEditGrid(); else this.hideEditGrid();
  }
  showEditGrid() {
    this.hideEditGrid();
    const g = this.g, e = this.edit;
    const tiles = [];
    if (e.mode === 'place' || e.mode === 'move') for (let x = 0; x < g.W; x++) for (let y = 0; y < g.D; y++) if (g.canPlace(x, y, e.moveId)) tiles.push([x, y]);
    if (e.mode === 'pendant') for (let x = 0; x < g.W; x++) for (let y = 0; y < g.D; y++) if (g.canPendant(x, y, e.moveId)) tiles.push([x, y]);
    const grp = this.hl = new THREE.Group();
    if (tiles.length) {
      const geo = new THREE.PlaneGeometry(0.9, 0.9); geo.rotateX(-Math.PI / 2);
      const m = new THREE.MeshBasicMaterial({ color: '#7ee0a8', transparent: true, opacity: 0.38, depthWrite: false });
      const inst = new THREE.InstancedMesh(geo, m, tiles.length);
      const d = new THREE.Object3D();
      tiles.forEach(([x, y], i) => { d.position.set(x + 0.5, 0.03, y + 0.5); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
      grp.add(inst);
    }
    // 不能用的椅子標紅
    for (const st of g.seats()) if (!st.ok) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8665a', transparent: true, opacity: 0.8, depthWrite: false }));
      ring.position.set(st.f.x + 0.5, 0.04, st.f.y + 0.5); grp.add(ring);
    }
    if (e.mode === 'wall') {
      for (const seg of g.wallSegments()) {
        if (!g.canWall(seg.side, seg.i, e.moveId)) continue;
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.3), new THREE.MeshBasicMaterial({ color: '#7ee0a8', transparent: true, opacity: 0.35, depthWrite: false }));
        if (seg.side === 'R') pl.position.set(seg.i + 0.5, 2.0, 0.02);
        else { pl.position.set(0.02, 2.0, seg.i + 0.5); pl.rotation.y = Math.PI / 2; }
        pl.userData.pick = { type: 'wallseg', side: seg.side, i: seg.i };
        grp.add(pl);
      }
    }
    this.e.fx.add(grp);
    this.wallSegPick = []; grp.traverse(o => { if (o.userData.pick) this.wallSegPick.push(o); });
  }
  hideEditGrid() { if (this.hl) { disposeTree(this.hl); this.hl.removeFromParent(); this.hl = null; } this.setGhost(null); }
  pickWallSeg(cx, cy) {
    if (!this.wallSegPick || !this.wallSegPick.length) return null;
    const h = this.e.ray(cx, cy).intersectObjects(this.wallSegPick, false)[0];
    return h ? h.object.userData.pick : null;
  }
  setGhost(type, x, y, ok = true, rot = 0) {
    if (!type) { if (this.ghost) { this.ghost.removeFromParent(); this.ghost = null; this.ghostType = null; } return; }
    if (this.ghostType !== type) {
      if (this.ghost) this.ghost.removeFromParent();
      const kind = D.FURNITURE[type].kind;
      this.ghost = bakedModel(kind === 'wall' ? 'w_' + type : kind === 'pendant' ? 'p_' + type : 'f_' + type, () => MD.build(type));
      this.ghost.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.6; o.castShadow = false; } });
      this.ghostType = type;
      this.e.fx.add(this.ghost);
    }
    this.ghost.position.set(x + 0.5, 0, y + 0.5);
    this.ghost.rotation.y = ROT[rot || 0];
    this.ghost.traverse(o => { if (o.isMesh) o.material.color.set(ok ? '#ffffff' : '#ff8a80'); });
  }

  // ================== 拜訪鄰居 ==================
  enterVisit(nid, helpsLeft) {
    const n = D.NEIGHBORS[nid];
    this.mode = 'visit';
    const e = this.e;
    this.savedSig = { ...this.sig };
    this.sig = {};
    for (const nm of ['barGroup', 'furnGroup', 'wallGroup', 'cupGroup']) this.clearGroup(nm);
    e.buildShell(8, 8, n.floor, n.wall);
    const grp = this.barGroup = new THREE.Group();
    for (let x = 0; x < 5; x++) { const b = bakedModel('bar', () => MD.backBar(true)); b.position.set(x + 0.5, 0, 0.5); grp.add(b); const d = bakedModel('shelf' + (x % 3), () => MD.shelfDecor(x % 3)); d.position.set(x + 0.5, 0, 0.5); grp.add(d); }
    const ms = ['roaster_classic', 'espresso_cream', 'oven', 'espresso_steel'];
    ms.forEach((t, i) => { const o = bakedModel('m_' + t, MACHINE_MODEL[t]); o.position.set(i + 1.5, 0, 0.5); grp.add(o); });
    for (let x = 0; x < 4; x++) { const f = bakedModel('front', () => MD.frontCounter()); f.position.set(x + 0.5, 0, 2.5); grp.add(f); }
    const reg = bakedModel('register', () => MD.register()); reg.position.set(0.5, 0, 2.5); grp.add(reg);
    const sc = bakedModel('showcase', () => MD.showcase()); sc.position.set(1.5, 0, 2.5); grp.add(sc);
    e.items.add(grp);
    const fg = this.furnGroup = new THREE.Group();
    const facing = { px: FACING_ROT.px, nx: FACING_ROT.nx, pz: FACING_ROT.pz, nz: FACING_ROT.nz };
    const actors = [];
    let k = 0;
    for (const [type, x, y, fc] of n.layout) {
      const o = bakedModel('f_' + type, () => MD.build(type)); o.position.set(x + 0.5, 0, y + 0.5); if (fc) o.rotation.y = facing[fc]; fg.add(o);
      if (D.FURNITURE[type].kind === 'chair' && k < 3 && Math.random() < 0.7) {
        actors.push({ id: 'vc' + k++, look: this.g.lookPool[(k * 3) % this.g.lookPool.length], x: x + 0.5, y: y + 0.5, sit: true, frame: fc === 'nx' || fc === 'nz' ? 'b_sit' : 'f_sit', flip: fc === 'px' || fc === 'nz' });
      }
    }
    e.items.add(fg);
    const wg = this.wallGroup = new THREE.Group();
    for (const [type, side, i] of n.wallItems) { const o = bakedModel('w_' + type, () => MD.build(type)); if (side === 'R') o.position.set(i + 0.5, 0, 0); else { o.position.set(0, 0, i + 0.5); o.rotation.y = Math.PI / 2; } wg.add(o); }
    e.items.add(wg);
    actors.push({ id: 'vown', look: resolveLook({ ...n.look, top: 'top_white', bottom: 'bot_black' }, 'apron_espresso'), x: 1.5, y: 1.5, frame: 'f_happy', flip: false });
    Object.assign(actors[actors.length - 1].look, { top: n.look.top, bottom: n.look.bottom, hairStyle: n.look.hairStyle, hair: n.look.hair, skin: n.look.skin, hat: n.look.hat, capColor: n.look.capColor, glasses: n.look.glasses, bottomType: n.look.bottomType });
    actors.push({ id: 'vstaff', look: resolveLook({ skin: '#f6d9c3', hair: '#4a2f22', hairStyle: 'short', top: 'top_white', bottom: 'bot_black' }, 'apron_espresso'), x: 3.5, y: 1.5, frame: 'f_sleep', flip: false });
    // 三個可以幫忙的地方
    const spots = [
      { id: 'h1', kind: 'beans', x: 1.5, y: 0.45, z: 2.0, icon: I.smoke },
      { id: 'h2', kind: 'energy', x: 3.5, y: 1.5, z: 1.9, icon: I.zzz },
      { id: 'h3', kind: 'gold', x: 4.5, y: 4.5, z: 1.4, icon: I.sparkle },
    ];
    const done = 3 - helpsLeft;
    spots.forEach((sp, i) => { sp.done = i < done; });
    this.visit = { nid, actors, spots };
    this.collectLights(); e.shadowsDirty(); this.refreshPickables();
    e.zoom = 1; e.pan.set(0, 0); e.fitCamera();
  }
  exitVisit() {
    this.mode = 'home'; this.visit = null;
    for (const nm of ['barGroup', 'furnGroup', 'wallGroup', 'cupGroup']) this.clearGroup(nm);
    this.sig = {};
    this.sync();
  }

  // ================== 2 樓甜點區 ==================
  enterUpstairs() {
    const e = this.e, g = this.g;
    this.mode = 'up';
    for (const nm of ['barGroup', 'furnGroup', 'wallGroup', 'cupGroup']) this.clearGroup(nm);
    for (const sp of this.sprites.values()) sp.dispose(); this.sprites.clear();
    if (this.catSprite) { this.catSprite.dispose(); this.catSprite = null; }
    this.sig = {};
    e.buildShell(7, 7, 'marble', 'blush');
    e.outdoor.visible = false;
    const fg = this.furnGroup = new THREE.Group();
    const layout = [['tbl_pink', 2, 4], ['ch_rose', 2, 3, 'pz'], ['ch_rose', 1, 4, 'px'], ['tbl_marble', 5, 4], ['ch_leather', 5, 3, 'pz'], ['ch_leather', 4, 4, 'px'],
      ['tbl_green', 3, 6], ['ch_velvet', 2, 6, 'px'], ['ch_velvet', 4, 6, 'nx'], ['cakestand', 0, 2], ['fiddle', 6, 6], ['floorlamp', 0, 3], ['gramophone', 6, 2], ['monstera', 6, 5]];
    const actors = []; let k = 0;
    for (const [type, x, y, fc] of layout) {
      const o = bakedModel('f_' + type, () => MD.build(type)); o.position.set(x + 0.5, 0, y + 0.5); if (fc) o.rotation.y = FACING_ROT[fc]; fg.add(o);
      if (D.FURNITURE[type].kind === 'chair') actors.push({ id: 'uc' + k, look: g.lookPool[(k * 5 + 2) % g.lookPool.length], x: x + 0.5, y: y + 0.5, sit: true, frame: fc === 'nx' || fc === 'nz' ? 'b_sit' : 'f_sit', flip: fc === 'px' || fc === 'nz' }), k++;
    }
    const st = MD.staircase(); st.position.set(0.5, 0, 6.5); fg.add(st);
    for (const [x, y] of [[2, 4], [5, 3]]) { const p = bakedModel('p_pendant_globe', () => MD.build('pendant_globe')); p.position.set(x + 0.5, 0, y + 0.5); fg.add(p); }
    e.items.add(fg);
    const wg = this.wallGroup = new THREE.Group();
    for (const [type, i] of [['w_window', 2], ['w_sconce', 3.5], ['w_mirror', 5]]) { const o = bakedModel('w_' + type, () => MD.build(type)); o.position.set(0, 0, i + 0.5); o.rotation.y = Math.PI / 2; wg.add(o); }
    e.items.add(wg);
    actors.push({ id: 'uchef', look: { skin: '#f0c9ad', hair: '#d9b26a', hairStyle: 'short', top: '#f4efe6', bottom: '#5b4a40', apron: '#d9cdb8', art: 'npc_mike' }, x: 5.6, y: 1.35, frame: 'f_happy', flip: true });
    this.up = { actors };
    this.syncUp(true);
    this.collectLights(); e.shadowsDirty(); this.refreshPickables();
    e.zoom = 1; e.pan.set(0, 0); e.fitCamera();
  }
  syncUp(force) {
    const g = this.g, s = g.s;
    const sig = s.machines.filter(m => m.slot >= 100).map(m => m.type + '@' + m.slot).join(',');
    if (!force && this.sig.up === sig) return;
    this.sig.up = sig;
    this.clearGroup('barGroup');
    const grp = this.barGroup = new THREE.Group();
    for (let x = 0; x < 6; x++) { const b = bakedModel('bar', () => MD.backBar(true)); b.position.set(x + 0.5, 0, 0.5); grp.add(b); }
    for (let i = 0; i < 4; i++) {
      const slot = 100 + i, m = s.machines.find(q => q.slot === slot);
      const o = m ? bakedModel('m_' + m.type, MACHINE_MODEL[m.type] || (() => MD.grinder())) : bakedModel('shelf' + (i % 3), () => MD.shelfDecor(i % 3));
      o.position.set(i + 1.5, 0, 0.5);
      if (m) this.anchorOf(o, slot);
      o.traverse(n => { n.userData.pick = m ? { type: 'machine', slot } : { type: 'emptyslot', slot }; });
      grp.add(o);
    }
    this.e.items.add(grp);
    this.collectLights(); this.e.shadowsDirty(); this.refreshPickables();
  }
  exitUpstairs() {
    this.mode = 'home'; this.up = null; this.e.outdoor.visible = true;
    for (const nm of ['barGroup', 'furnGroup', 'wallGroup', 'cupGroup']) this.clearGroup(nm);
    for (const sp of this.sprites.values()) sp.dispose(); this.sprites.clear();
    this.sig = {};
    this.sync();
    this.e.zoom = 1; this.e.pan.set(0, 0); this.e.fitCamera();
  }

  frame() {
    if (this.mode === 'home') this.sync();
    else if (this.mode === 'up') this.syncUp();
    this.updateActors();
    this.updateBubbles();
  }
}
