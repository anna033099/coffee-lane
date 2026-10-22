// 店面場景繪製：地板、牆、吧台、家具、角色、氣泡與飄字
import {
  P, poly, box, WALL_H, OUT, furnitureSVG, wallItemSVG, counterSVG, machineSVG,
  floorPattern, wallPattern, sharedDefs, characterSVG, cupIcon,
} from './art.js';
import { FURNITURE } from './data.js';
import { beanIcon } from './art.js';

const NS = 'http://www.w3.org/2000/svg';
const STAGE_W = 1280, STAGE_H = 720;
const AREA = { x0: 24, x1: 1256, y0: 96, y1: 628 };

function el(tag, attrs = {}, html = '') {
  const e = document.createElementNS(NS, tag);
  for (const [a, v] of Object.entries(attrs)) e.setAttribute(a, v);
  if (html) e.innerHTML = html;
  return e;
}

export class Room {
  constructor(svg, game, cb) {
    this.svg = svg; this.g = game; this.cb = cb;
    this.edit = { on: false };
    this.lastV = -1; this.lastThemeKey = '';
    this.chars = new Map();   // id -> { g, vkey }
    this.bubbles = new Map(); // id -> { g, vkey }
    this.mStatus = new Map(); // slot -> { g, vkey }
    svg.setAttribute('viewBox', `0 0 ${STAGE_W} ${STAGE_H}`);
    svg.innerHTML = '';
    this.defs = el('defs', {}, sharedDefs());
    this.themeDefs = el('g');
    this.defs.appendChild(this.themeDefs);
    svg.appendChild(this.defs);
    this.world = el('g', { id: 'world' });
    svg.appendChild(this.world);
    for (const n of ['Floor', 'Walls', 'HL', 'Counter', 'Ent', 'Over', 'Ghost']) {
      this['l' + n] = el('g', { class: 'lyr-' + n.toLowerCase() });
      this.world.appendChild(this['l' + n]);
    }
    this.lGhost.setAttribute('pointer-events', 'none');
    this.zoom = 1; this.pan = { x: 0, y: 0 };
    this.ptrs = new Map(); this.dragged = false;
    svg.addEventListener('click', e => { if (this.dragged) { this.dragged = false; return; } this.onClick(e); });
    svg.addEventListener('pointerdown', e => this.onDown(e));
    svg.addEventListener('pointermove', e => { this.onDrag(e); this.onMove(e); });
    const up = e => { this.ptrs.delete(e.pointerId); if (this.ptrs.size < 2) this.pinch = null; };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('pointerleave', e => { up(e); this.hover = null; this.renderGhost(); });
    svg.addEventListener('wheel', e => { e.preventDefault(); this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  }

  // ---------- 縮放與拖曳 ----------
  stageScale() { const r = this.svg.getBoundingClientRect(); return r.width / STAGE_W || 1; }
  onDown(e) {
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    this.dragged = false;
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom };
    }
  }
  onDrag(e) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    const k = this.stageScale();
    if (this.ptrs.size === 2 && this.pinch) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.setZoom(this.pinch.z * d / Math.max(1, this.pinch.d));
      this.dragged = true;
      return;
    }
    const dx = (e.clientX - p.x) / k, dy = (e.clientY - p.y) / k;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) / k > 8) this.dragged = true;
    if (this.dragged && this.zoom > 1.01) { this.pan.x += dx; this.pan.y += dy; this.applyTransform(); }
  }
  setZoom(z) {
    const nz = Math.max(1, Math.min(2.4, z));
    if (Math.abs(nz - this.zoom) < 0.001) return;
    this.pan.x *= nz / this.zoom; this.pan.y *= nz / this.zoom;
    this.zoom = nz;
    if (nz <= 1.001) this.pan = { x: 0, y: 0 };
    this.applyTransform();
  }
  applyTransform() {
    const cx = (AREA.x0 + AREA.x1) / 2, cy = (AREA.y0 + this.y1) / 2, z = this.zoom;
    const limX = (AREA.x1 - AREA.x0) / 2 * (z - 1) + 60, limY = (this.y1 - AREA.y0) / 2 * (z - 1) + 60;
    this.pan.x = Math.max(-limX, Math.min(limX, this.pan.x));
    this.pan.y = Math.max(-limY, Math.min(limY, this.pan.y));
    this.tx = cx + (this.ox - cx) * z + this.pan.x;
    this.ty = cy + (this.oy - cy) * z + this.pan.y;
    this.ts = this.s * z;
    this.world.setAttribute('transform', `translate(${this.tx.toFixed(1)} ${this.ty.toFixed(1)}) scale(${this.ts.toFixed(4)})`);
  }

  // 依店面大小縮放並置中
  layout() {
    const { W, H } = this.g;
    const minX = -H * 64, maxX = W * 64, minY = -WALL_H - 12, maxY = (W + H) * 32 + 14;
    const y1 = this.edit.on ? 528 : AREA.y1;
    const aw = AREA.x1 - AREA.x0, ah = y1 - AREA.y0;
    const s = Math.min(1.08, aw / (maxX - minX), ah / (maxY - minY));
    this.s = s;
    this.ox = (AREA.x0 + AREA.x1) / 2 - s * (minX + maxX) / 2;
    this.oy = (AREA.y0 + y1) / 2 - s * (minY + maxY) / 2;
    this.y1 = y1;
    this.applyTransform();
  }
  toStage(x, y, z = 0) {
    const [a, b] = P(x, y, z);
    return { x: this.tx + a * this.ts, y: this.ty + b * this.ts };
  }
  clientToWorld(e) {
    const pt = this.svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = this.world.getScreenCTM();
    if (!m) return null;
    return pt.matrixTransform(m.inverse());
  }
  clientToTile(e) {
    const p = this.clientToWorld(e);
    if (!p) return null;
    return { x: Math.floor((p.x / 64 + p.y / 32) / 2), y: Math.floor((p.y / 32 - p.x / 64) / 2) };
  }

  setEdit(edit) { this.edit = edit; this.lastV = -1; }

  // ---------- 靜態部分（擺設變動時才重畫） ----------
  renderStatic() {
    const g = this.g, s = g.s;
    this.layout();
    const { W, H } = g;
    const tk = s.floor + '|' + s.wallpaper;
    if (tk !== this.lastThemeKey) {
      this.themeDefs.innerHTML = floorPattern(s.floor, 'floorPat') + wallPattern(s.wallpaper, 'wpR', 'R') + wallPattern(s.wallpaper, 'wpL', 'L');
      this.lastThemeKey = tk;
    }
    // 地板
    let f = '';
    f += poly([P(0, H, 0), P(W, H, 0), [P(W, H, 0)[0], P(W, H, 0)[1] + 14], [P(0, H, 0)[0], P(0, H, 0)[1] + 14]], '#8a6446');
    f += poly([P(W, 0, 0), P(W, H, 0), [P(W, H, 0)[0], P(W, H, 0)[1] + 14], [P(W, 0, 0)[0], P(W, 0, 0)[1] + 14]], '#6e4e36');
    f += poly([P(0, 0), P(W, 0), P(W, H), P(0, H)], 'url(#floorPat)', `stroke="${OUT}" stroke-opacity=".4" stroke-width="1.5"`);
    // 吧台走道淡色區
    f += poly([P(0, 1), P(W, 1), P(W, 2), P(0, 2)], 'rgba(255,250,240,.16)');
    const d = g.door;
    f += poly([P(d.x + 0.1, d.y + 0.15), P(d.x + 0.9, d.y + 0.15), P(d.x + 0.9, d.y + 0.85), P(d.x + 0.1, d.y + 0.85)], '#a85a4a', `stroke="${OUT}" stroke-opacity=".4"`);
    if (this.edit.on) {
      for (let x = 0; x <= W; x++) f += `<line x1="${P(x, 0)[0]}" y1="${P(x, 0)[1]}" x2="${P(x, H)[0]}" y2="${P(x, H)[1]}" stroke="#fff" stroke-opacity=".35"/>`;
      for (let y = 0; y <= H; y++) f += `<line x1="${P(0, y)[0]}" y1="${P(0, y)[1]}" x2="${P(W, y)[0]}" y2="${P(W, y)[1]}" stroke="#fff" stroke-opacity=".35"/>`;
    }
    this.lFloor.innerHTML = f;

    // 牆
    let w = '';
    w += poly([P(0, 0, 0), P(0, H, 0), P(0, H, WALL_H), P(0, 0, WALL_H)], 'url(#wpL)', `stroke="${OUT}" stroke-opacity=".45" stroke-width="1.5"`);
    w += poly([P(0, 0, 0), P(0, H, 0), P(0, H, WALL_H), P(0, 0, WALL_H)], 'rgba(60,40,30,.07)');
    w += poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, WALL_H), P(0, 0, WALL_H)], 'url(#wpR)', `stroke="${OUT}" stroke-opacity=".45" stroke-width="1.5"`);
    w += poly([P(0, H, WALL_H), P(0, 0, WALL_H), P(-0.12, -0.12, WALL_H + 6), P(-0.12, H, WALL_H + 6)], '#7b5a44');
    w += poly([P(0, 0, WALL_H), P(W, 0, WALL_H), P(W, -0.12, WALL_H + 6), P(-0.12, -0.12, WALL_H + 6)], '#8b6a52');
    this.lWalls.innerHTML = w;
    const door = el('g', { transform: `matrix(1,-0.5,0,1,${P(0, H, 0)[0]},${P(0, H, 0)[1]})` }, wallItemSVG('door'));
    this.lWalls.appendChild(door);
    for (const it of s.wall) {
      const g2 = el('g', { transform: this.wallTf(it.side, it.i), 'data-hit': 'wallitem', 'data-id': it.id, class: this.edit.on ? 'editable' : '' }, wallItemSVG(it.type));
      if (this.edit.on && this.edit.selectedId === it.id) g2.setAttribute('class', 'editable selected');
      this.lWalls.appendChild(g2);
    }

    // 吧台與機器
    this.lCounter.innerHTML = '';
    for (let x = 0; x < W; x++) {
      const kind = x === 0 ? 'register' : (x > g.slots ? (x % 2 ? 'case' : 'plain') : 'plain');
      this.lCounter.appendChild(el('g', { transform: `translate(${P(x, 0)[0]} ${P(x, 0)[1]})` }, counterSVG(kind)));
      const m = g.machineAt(x);
      if (m && x <= g.slots) {
        const mg = el('g', { transform: `translate(${P(x, 0)[0]} ${P(x, 0)[1]})`, 'data-hit': 'machine', 'data-slot': x, class: 'machine' }, machineSVG(m.type));
        mg.appendChild(el('polygon', { points: [P(0.05, 0.1, 160), P(1, 0.1, 160), P(1, 1, 60), P(0, 1, 60)].map(p => p.join(',')).join(' '), fill: 'transparent' }));
        this.lCounter.appendChild(mg);
      } else if (x >= 1 && x <= g.slots) {
        const [a, b] = P(x + 0.5, 0.5, 76);
        this.lCounter.appendChild(el('g', { 'data-hit': 'emptyslot', 'data-slot': x, class: 'emptyslot' },
          `<ellipse cx="${a}" cy="${b}" rx="22" ry="11" fill="rgba(255,255,255,.35)" stroke="#fff" stroke-dasharray="4 3"/><text x="${a}" y="${b + 5}" text-anchor="middle" font-size="16" font-weight="900" fill="#6b4a3a">+</text>`));
      }
    }

    // 家具（進入深度排序的實體層）
    for (const e of [...this.lEnt.querySelectorAll('.furn')]) e.remove();
    const seatInfo = new Map(g.seats().map(q => [q.f.id, q]));
    for (const it of s.furniture) {
      const kind = FURNITURE[it.type].kind;
      const facing = kind === 'chair' ? (seatInfo.get(it.id)?.facing || 'px') : 'px';
      let cls = 'furn';
      if (this.edit.on) cls += ' editable';
      if (this.edit.on && this.edit.selectedId === it.id) cls += ' selected';
      if (this.edit.on && this.edit.moveId === it.id) cls += ' moving';
      const fg = el('g', { transform: `translate(${P(it.x, it.y)[0]} ${P(it.x, it.y)[1]})`, class: cls, 'data-hit': 'furn', 'data-id': it.id, 'data-depth': it.x + it.y + 1 }, furnitureSVG(it.type, facing));
      fg.appendChild(el('polygon', { points: [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)].map(p => p.join(',')).join(' '), fill: 'transparent' }));
      if (this.edit.on && kind === 'chair' && !seatInfo.get(it.id)?.ok) {
        const [a, b] = P(0.5, 0.5, 90);
        fg.appendChild(el('g', {}, `<circle cx="${a}" cy="${b}" r="10" fill="#e8665a" stroke="#fff" stroke-width="2"/><text x="${a}" y="${b + 5}" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">!</text>`));
      }
      this.lEnt.appendChild(fg);
    }
    this.renderHL();
    this.lastV = g.version;
  }

  wallTf(side, i) {
    if (side === 'R') { const [a, b] = P(i, 0, 0); return `matrix(1,0.5,0,1,${a},${b})`; }
    const [a, b] = P(0, i + 1, 0); return `matrix(1,-0.5,0,1,${a},${b})`;
  }

  // 編輯模式：可擺放的格子 / 牆面亮起來
  renderHL() {
    const g = this.g, e = this.edit;
    let h = '';
    if (e.on && (e.mode === 'place' || e.mode === 'move')) {
      for (let x = 0; x < g.W; x++) for (let y = 2; y < g.H; y++) {
        if (g.canPlace(x, y, e.moveId)) h += `<polygon class="hl-tile" data-hit="tile" data-x="${x}" data-y="${y}" points="${[P(x + 0.06, y + 0.06), P(x + 0.94, y + 0.06), P(x + 0.94, y + 0.94), P(x + 0.06, y + 0.94)].map(p => p.join(',')).join(' ')}"/>`;
      }
    }
    this.lHL.innerHTML = h;
    // 牆面格
    for (const q of [...this.lWalls.querySelectorAll('.hl-wall')]) q.remove();
    if (e.on && (e.mode === 'wallPlace' || e.mode === 'wallMove')) {
      for (const side of ['L', 'R']) {
        const n = side === 'R' ? g.W : g.H - 1;
        for (let i = 0; i < n; i++) {
          if (!g.canPlaceWall(side, i, e.moveId)) continue;
          this.lWalls.appendChild(el('rect', { x: 6, y: -180, width: 52, height: 110, rx: 6, class: 'hl-wall', transform: this.wallTf(side, i), 'data-hit': 'wallseg', 'data-side': side, 'data-i': i }));
        }
      }
    }
  }

  renderGhost() {
    this.lGhost.innerHTML = '';
    const e = this.edit, hv = this.hover;
    if (!e.on || !hv || !(e.mode === 'place' || e.mode === 'move')) return;
    const type = e.type;
    if (!type || !this.g.isFloor(hv.x, hv.y)) return;
    const ok = this.g.canPlace(hv.x, hv.y, e.moveId);
    const [a, b] = P(hv.x, hv.y);
    this.lGhost.appendChild(el('g', { transform: `translate(${a} ${b})`, opacity: ok ? 0.75 : 0.35, class: ok ? '' : 'ghost-bad' }, furnitureSVG(type, 'px')));
  }

  // ---------- 每一幀 ----------
  frame() {
    const g = this.g;
    if (this.lastV !== g.version) this.renderStatic();
    this.updateMachines();
    this.updateChars();
    this.sortEnt();
  }

  updateMachines() {
    const g = this.g;
    const seen = new Set();
    for (const m of g.s.machines) {
      if (m.slot > g.slots) continue;
      seen.add(m.slot);
      const st = g.machineStatus(m);
      let rec = this.mStatus.get(m.slot);
      if (!rec) { rec = { g: el('g', { class: 'mstatus', 'data-hit': 'machine', 'data-slot': m.slot }), vkey: '' }; this.mStatus.set(m.slot, rec); this.lOver.appendChild(rec.g); }
      const [a, b] = P(m.slot + 0.5, 0.5, 150);
      let vkey = st.st + (st.st === 'run' ? Math.floor(st.p * 50) : '') + (m.job ? m.job.item : '') + a + b;
      if (vkey === rec.vkey) continue;
      rec.vkey = vkey;
      let html = '';
      if (st.st === 'run') {
        const C = 2 * Math.PI * 15;
        const icon = m.job.kind === 'roast' ? beanIcon(m.job.item, true, 20) : cupIcon(m.job.item, 20);
        html = `<g transform="translate(${a} ${b})"><circle r="19" fill="#fffaf0" stroke="${OUT}" stroke-opacity=".5"/>
          <circle r="15" fill="none" stroke="#e8dccb" stroke-width="5"/>
          <circle r="15" fill="none" stroke="${m.job.kind === 'roast' ? '#d9775f' : '#4f8a78'}" stroke-width="5" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - st.p)}" transform="rotate(-90)" stroke-linecap="round"/>
          <g transform="translate(-10 -10)">${icon}</g></g>`;
      } else if (st.st === 'done') {
        const icon = m.job.kind === 'roast' ? beanIcon(m.job.item, true, 30) : cupIcon(m.job.item, 30);
        html = `<g transform="translate(${a} ${b})"><g class="bounce"><path d="M-22,-22 h44 a6,6 0 0 1 6,6 v26 a6,6 0 0 1 -6,6 h-16 l-6,8 l-6,-8 h-16 a6,6 0 0 1 -6,-6 v-26 a6,6 0 0 1 6,-6 Z" fill="#fffaf0" stroke="#4f8a78" stroke-width="2.5"/>
          <g transform="translate(-15 -18)">${icon}</g></g></g>`;
      } else if (st.st === 'burnt') {
        html = `<g transform="translate(${a} ${b})"><g class="bounce"><circle r="20" fill="#3b3330" stroke="#fffaf0" stroke-width="2"/><path d="M-6,4 q-4,-8 2,-12 q-1,6 4,6 q2,-6 -1,-10 q10,6 4,16 Z" fill="#9a9089"/></g></g>`;
      } else {
        html = `<g transform="translate(${a} ${b + 20})" opacity=".85"><circle r="13" fill="rgba(255,250,240,.85)" stroke="${OUT}" stroke-opacity=".35"/><text y="5" text-anchor="middle" font-size="15" font-weight="900" fill="#6b4a3a">${m.type === 'roaster' ? '烘' : '煮'}</text></g>`;
      }
      rec.g.innerHTML = html;
    }
    for (const [slot, rec] of this.mStatus) if (!seen.has(slot)) { rec.g.remove(); this.mStatus.delete(slot); }
  }

  charEl(id, kind) {
    let rec = this.chars.get(id);
    if (!rec) {
      rec = { g: el('g', { class: 'char ' + kind, 'data-hit': kind, 'data-id': id }), inner: el('g'), vkey: '' };
      rec.g.appendChild(rec.inner);
      this.chars.set(id, rec);
      this.lEnt.appendChild(rec.g);
    }
    rec.alive = true;
    return rec;
  }
  bubbleEl(id) {
    let rec = this.bubbles.get(id);
    if (!rec) { rec = { g: el('g', { class: 'bubble' }), vkey: '' }; this.bubbles.set(id, rec); this.lOver.appendChild(rec.g); }
    rec.alive = true;
    return rec;
  }

  updateChars() {
    const g = this.g;
    for (const r of this.chars.values()) r.alive = false;
    for (const r of this.bubbles.values()) r.alive = false;
    // 店員
    for (const st of g.staffRt.values()) {
      const data = g.s.staff[st.i];
      if (!data) continue;
      const rec = this.charEl(st.id, 'staff');
      const moving = st.path && st.path.length > 0;
      const step = moving ? Math.round(st.step) : 0;
      const mood = st.tired ? 'tired' : '';
      const vkey = [st.back, st.carry, step, mood, g.s.uniform, data.look.hair].join('|');
      if (vkey !== rec.vkey) { rec.inner.innerHTML = characterSVG(data.look, { back: st.back, carry: st.carry, staff: true, uniform: g.s.uniform, step, mood }); rec.vkey = vkey; }
      const [a, b] = P(st.x, st.y, 0);
      rec.g.setAttribute('transform', `translate(${a.toFixed(1)} ${b.toFixed(1)}) scale(${st.dir ? -1 : 1} 1)`);
      rec.depth = st.x + st.y + 0.01;
      // 店員氣泡（累了）
      const bk = 's' + st.id;
      if (st.tired) {
        const bb = this.bubbleEl(bk);
        const [x2, y2] = P(st.x, st.y, 104);
        const v = 'z' + Math.round(x2) + Math.round(y2);
        if (bb.vkey !== v) { bb.vkey = v; bb.g.innerHTML = `<g transform="translate(${x2} ${y2})"><rect x="-20" y="-14" width="40" height="24" rx="12" fill="#fffaf0" stroke="#8a7a6a" stroke-width="1.5"/><text y="4" text-anchor="middle" font-size="13" font-weight="900" fill="#6f8fd0">Zz</text></g>`; }
      }
    }
    // 客人
    for (const c of g.customers) {
      const rec = this.charEl(c.id, 'cust');
      const moving = c.path && c.path.length > 0;
      const step = moving ? Math.round(c.step) : 0;
      const vkey = [c.back, c.sit, step, c.mood].join('|');
      if (vkey !== rec.vkey) { rec.inner.innerHTML = characterSVG(c.look, { back: c.back, sit: c.sit, step, mood: c.mood }); rec.vkey = vkey; }
      const [a, b] = P(c.x, c.y, c.z || 0);
      rec.g.setAttribute('transform', `translate(${a.toFixed(1)} ${b.toFixed(1)}) scale(${c.dir ? -1 : 1} 1)`);
      rec.g.setAttribute('opacity', c.alpha.toFixed(2));
      // 背對畫面坐著的客人要畫在椅子前面，所以深度要比椅子小
      rec.depth = c.sit ? (c.back ? c.x + c.y - 0.05 : c.x + c.y + 0.02) : c.x + c.y + 0.01;
      // 點餐氣泡
      if (c.state === 'order' || c.state === 'drink' || c.state === 'sad') {
        const bb = this.bubbleEl('c' + c.id);
        const [x2, y2] = P(c.x, c.y, (c.z || 0) + 112);
        const pat = c.state === 'order' && !c.assigned ? Math.ceil(c.patience / c.maxPatience * 10) : 10;
        const reg = !!c.regId;
        const out = c.state === 'order' && g.s.stock[c.order] <= 0 && !c.assigned;
        const v = [c.state, c.order, pat, reg, out, Math.round(x2), Math.round(y2)].join('|');
        if (bb.vkey !== v) {
          bb.vkey = v;
          let inner = '';
          if (c.state === 'order') {
            const col = pat > 5 ? '#4f8a78' : pat > 2 ? '#e2a23b' : '#e8665a';
            inner = `<path d="M-24,-26 h48 a8,8 0 0 1 8,8 v24 a8,8 0 0 1 -8,8 h-18 l-6,8 l-6,-8 h-18 a8,8 0 0 1 -8,-8 v-24 a8,8 0 0 1 8,-8 Z" fill="#fffaf0" stroke="${OUT}" stroke-opacity=".5" stroke-width="1.5"/>
              <g transform="translate(-16 -24)">${cupIcon(c.order, 32)}</g>
              <rect x="-24" y="17" width="48" height="5" rx="2.5" fill="#e8dccb"/><rect x="-24" y="17" width="${4.8 * pat}" height="5" rx="2.5" fill="${col}"/>
              ${out ? '<circle cx="24" cy="-24" r="9" fill="#e8665a" stroke="#fff" stroke-width="1.5"/><text x="24" y="-19.5" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">!</text>' : ''}
              ${reg ? '<g transform="translate(-30 -32) scale(.7)"><path d="M12,21 C4,15 2,11 2,8 C2,5 4.5,3 7,3 C9,3 11,4.5 12,6 C13,4.5 15,3 17,3 C19.5,3 22,5 22,8 C22,11 20,15 12,21 Z" fill="#ef7f8a" stroke="#fff" stroke-width="2"/></g>' : ''}`;
          } else if (c.state === 'drink') {
            inner = `<g class="float-slow"><text y="0" text-anchor="middle" font-size="22">☕</text><text x="18" y="-12" font-size="14" fill="#ef7f8a">♥</text></g>`;
          } else {
            inner = `<g class="bounce"><text y="0" text-anchor="middle" font-size="22">💧</text></g>`;
          }
          bb.g.innerHTML = `<g transform="translate(${x2.toFixed(1)} ${y2.toFixed(1)})">${inner}</g>`;
        }
      }
    }
    for (const [id, r] of this.chars) if (!r.alive) { r.g.remove(); this.chars.delete(id); }
    for (const [id, r] of this.bubbles) if (!r.alive) { r.g.remove(); this.bubbles.delete(id); }
  }

  sortEnt() {
    const items = [];
    for (const n of this.lEnt.children) {
      let d;
      if (n.classList.contains('furn')) d = parseFloat(n.getAttribute('data-depth')) - 0.001;
      else { const r = this.chars.get(n.getAttribute('data-id')); d = r ? r.depth : 0; }
      items.push([d, n]);
    }
    const sorted = items.slice().sort((a, b) => a[0] - b[0]);
    let same = true;
    for (let i = 0; i < sorted.length; i++) if (sorted[i][1] !== items[i][1]) { same = false; break; }
    if (!same) for (const [, n] of sorted) this.lEnt.appendChild(n);
  }

  // 飄字：+金幣、+熟豆…
  floater(pos, text, color = '#c9892a', coin = false) {
    const [a, b] = P(pos.x, pos.y, pos.z || 80);
    const g = el('g', { transform: `translate(${a} ${b})`, class: 'floater' },
      `<g class="rise">${coin ? '<circle cx="-30" cy="-6" r="9" fill="#f2c24e" stroke="#b8862a" stroke-width="2"/>' : ''}
      <text x="${coin ? -16 : 0}" y="0" text-anchor="${coin ? 'start' : 'middle'}" font-size="20" font-weight="900" fill="${color}" stroke="#fffaf0" stroke-width="5" paint-order="stroke">${text}</text></g>`);
    this.lOver.appendChild(g);
    setTimeout(() => g.remove(), 1500);
  }

  // ---------- 互動 ----------
  onMove(e) {
    if (!this.edit.on || !(this.edit.mode === 'place' || this.edit.mode === 'move')) return;
    const t = this.clientToTile(e);
    if (!t || (this.hover && this.hover.x === t.x && this.hover.y === t.y)) return;
    this.hover = t;
    this.renderGhost();
  }
  onClick(e) {
    const hit = e.target.closest('[data-hit]');
    const kind = hit ? hit.getAttribute('data-hit') : null;
    if (this.edit.on) {
      if (this.edit.mode === 'place' || this.edit.mode === 'move') {
        const t = this.clientToTile(e);
        if (t) this.cb.onTile(t.x, t.y);
        return;
      }
      if (kind === 'wallseg') { this.cb.onWallSeg(hit.getAttribute('data-side'), +hit.getAttribute('data-i')); return; }
      if (kind === 'furn') { this.cb.onFurniture(hit.getAttribute('data-id'), e); return; }
      if (kind === 'wallitem') { this.cb.onWallItem(hit.getAttribute('data-id'), e); return; }
      this.cb.onEmpty();
      return;
    }
    if (kind === 'machine') this.cb.onMachine(+hit.getAttribute('data-slot'));
    else if (kind === 'emptyslot') this.cb.onEmptySlot(+hit.getAttribute('data-slot'));
    else if (kind === 'staff') this.cb.onStaff(hit.getAttribute('data-id'));
    else if (kind === 'cust') this.cb.onCustomer(hit.getAttribute('data-id'));
  }
}

