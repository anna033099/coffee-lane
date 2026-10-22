// 遊戲邏輯：機器、經濟、客人、店員、常客、擺設規則
import {
  BEANS, INGS, RECIPES, RECIPE_ORDER, FURNITURE, FLOORS, WALLS, EXPANSIONS, MACHINES,
  STAFF_HIRES, NAMES, TRAITS, TRAIT_ORDER, FRIEND_LEVELS, CARD_MAX, CARD_REGEN,
  expNeed, MAX_LEVEL, maxRegulars,
} from './data.js';
import { uid, nowSec, todayStr } from './state.js';
import { randomLook } from './art.js';

const SERVE_COST = 8;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const k = (x, y) => x + ',' + y;

export class Game {
  constructor(state, hooks) {
    this.s = state;
    this.h = hooks;
    this.customers = [];
    this.staffRt = new Map();
    this.spawnT = 2;
    this.t = 0;
    this.version = 0; // 擺設變動時遞增，讓畫面知道要重畫
    this.s.staff.forEach((st, i) => this.addStaffRt(st, i));
  }

  // ---------- 店面幾何 ----------
  get room() { return EXPANSIONS[this.s.expand]; }
  get W() { return this.room.W; }
  get H() { return this.room.H; }
  get slots() { return this.room.slots; }
  get door() { return { x: 0, y: this.H - 1 }; }
  get pickup() { return { x: 0, y: 1 }; }
  isFloor(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  occMap() {
    if (this._occV === this.version && this._occ) return this._occ;
    const m = new Map();
    this.s.furniture.forEach(f => m.set(k(f.x, f.y), f));
    this._occ = m; this._occV = this.version;
    return m;
  }
  walkable(x, y) { return this.isFloor(x, y) && y >= 1 && !this.occMap().has(k(x, y)); }
  homeTile(i) { return { x: Math.min(1 + i, this.W - 1), y: 1 }; }
  touch() { this.version++; this._seats = null; }

  // BFS 尋路；goal(x,y) 回傳 true 代表抵達
  path(sx, sy, goal, extraWalk) {
    const start = k(sx, sy);
    if (goal(sx, sy)) return [];
    const prev = new Map([[start, null]]);
    const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, key = k(nx, ny);
        if (prev.has(key)) continue;
        const isGoal = goal(nx, ny);
        if (!this.walkable(nx, ny) && !(isGoal && extraWalk && extraWalk(nx, ny))) continue;
        prev.set(key, k(x, y));
        if (isGoal) {
          const out = [];
          let cur = key;
          while (cur && cur !== start) { const [a, b] = cur.split(',').map(Number); out.unshift({ x: a, y: b }); cur = prev.get(cur); }
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }
  reachableSet() {
    const d = this.door, seen = new Set([k(d.x, d.y)]), q = [[d.x, d.y]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, key = k(nx, ny);
        if (seen.has(key) || !this.walkable(nx, ny)) continue;
        seen.add(key); q.push([nx, ny]);
      }
    }
    return seen;
  }

  // 椅子朝向：面對相鄰的桌子
  chairFacing(f) {
    const occ = this.occMap();
    const order = [['px', 1, 0], ['py', 0, 1], ['nx', -1, 0], ['ny', 0, -1]];
    for (const [fc, dx, dy] of order) {
      const t = occ.get(k(f.x + dx, f.y + dy));
      if (t && FURNITURE[t.type].kind === 'table') return fc;
    }
    return null;
  }
  seats() {
    if (this._seats && this._seatsV === this.version) return this._seats;
    const reach = this.reachableSet();
    const out = [];
    for (const f of this.s.furniture) {
      if (FURNITURE[f.type].kind !== 'chair') continue;
      const facing = this.chairFacing(f);
      const approaches = DIRS.map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy })).filter(p => reach.has(k(p.x, p.y)));
      out.push({ f, facing, ok: !!facing && approaches.length > 0, approaches, reason: !facing ? '旁邊需要一張桌子' : (approaches.length ? '' : '走不到這張椅子') });
    }
    this._seats = out; this._seatsV = this.version;
    return out;
  }

  // ---------- 數值 ----------
  charm() {
    let c = 5 + FLOORS[this.s.floor].charm + WALLS[this.s.wallpaper].charm;
    this.s.furniture.forEach(f => { c += FURNITURE[f.type].charm; });
    this.s.wall.forEach(w => { c += FURNITURE[w.type].charm; });
    return c;
  }
  tipRate() { return Math.min(this.charm() / 300, 0.6); }
  unlocked(lv) { return this.s.level >= lv; }
  addCoins(n) { this.s.coins += n; if (n > 0) this.s.stats.earned += n; }
  addExp(n) {
    const s = this.s;
    s.exp += n;
    while (s.level < MAX_LEVEL && s.exp >= expNeed(s.level)) {
      s.exp -= expNeed(s.level);
      s.level++;
      const bonus = 100 * s.level;
      s.coins += bonus;
      this.h.levelUp(s.level, bonus);
    }
    if (s.level >= MAX_LEVEL) s.exp = Math.min(s.exp, expNeed(s.level));
  }

  // ---------- 進貨 ----------
  buyGreen(bean, n = 1) {
    const b = BEANS[bean], cost = b.cost * n;
    if (!this.unlocked(b.lv)) return this.fail(`Lv${b.lv} 才能進貨${b.name}豆`);
    if (this.s.coins < cost) return this.fail('金幣不夠');
    this.s.coins -= cost; this.s.green[bean] += n; this.s.stats.buyGreen += n;
    this.h.sfx('buy'); return true;
  }
  buyIng(id, packs = 1) {
    const it = INGS[id], cost = it.cost * 10 * packs;
    if (!this.unlocked(it.lv)) return this.fail(`Lv${it.lv} 才能購買${it.name}`);
    if (this.s.coins < cost) return this.fail('金幣不夠');
    this.s.coins -= cost; this.s.ing[id] += 10 * packs;
    this.h.sfx('buy'); return true;
  }
  fail(msg) { this.h.toast(msg, 'warn'); this.h.sfx('no'); return false; }

  // ---------- 機器 ----------
  machineAt(slot) { return this.s.machines.find(m => m.slot === slot); }
  machineStatus(m, now = nowSec()) {
    const j = m.job;
    if (!j) return { st: 'idle' };
    const end = j.start + j.dur;
    if (now < end) return { st: 'run', p: (now - j.start) / j.dur, left: end - now };
    if (j.kind === 'roast') {
      const burnAt = end + Math.max(j.dur * 3, 600);
      if (now >= burnAt) return { st: 'burnt' };
      return { st: 'done', burnLeft: burnAt - now };
    }
    return { st: 'done' };
  }
  startRoast(m, bean) {
    if (m.job) return false;
    if (this.s.green[bean] <= 0) return this.fail(`沒有${BEANS[bean].name}生豆，先去進貨`);
    this.s.green[bean]--;
    m.job = { kind: 'roast', item: bean, start: nowSec(), dur: BEANS[bean].roast };
    this.s.stats.roastStart++;
    this.h.sfx('start'); return true;
  }
  canBrew(rid) {
    const r = RECIPES[rid];
    if (!this.unlocked(r.lv)) return false;
    if (this.s.roasted[r.bean] < r.beanN) return false;
    return r.ing.every(i => this.s.ing[i] >= 1);
  }
  startBrew(m, rid) {
    if (m.job) return false;
    const r = RECIPES[rid];
    if (!this.canBrew(rid)) return this.fail('材料不足');
    this.s.roasted[r.bean] -= r.beanN;
    r.ing.forEach(i => { this.s.ing[i]--; });
    m.job = { kind: 'brew', item: rid, start: nowSec(), dur: r.time };
    this.s.stats.brewStart++;
    this.h.sfx('start'); return true;
  }
  collect(m) {
    const st = this.machineStatus(m);
    const p = { x: m.slot + 0.5, y: 0.5, z: 130 };
    if (st.st === 'burnt') {
      this.h.toast(`${BEANS[m.job.item].name}豆放太久烤焦了…`, 'warn');
      m.job = null; this.h.sfx('no'); return true;
    }
    if (st.st !== 'done') return false;
    const j = m.job;
    if (j.kind === 'roast') {
      const b = BEANS[j.item];
      this.s.roasted[j.item] += b.yield;
      this.s.stats.roastCollect++;
      this.addExp(b.exp);
      this.h.floater(p, `+${b.yield} 份熟豆`, '#6b4a3a');
    } else {
      const r = RECIPES[j.item];
      this.s.stock[j.item] += r.cups;
      this.s.stats.brewCollect++;
      this.addExp(Math.ceil(r.exp * 2));
      this.h.floater(p, `+${r.cups} 杯 ${r.name}`, '#4f8a78');
    }
    m.job = null;
    this.h.sfx('collect');
    return true;
  }
  machinePrice(type) {
    const n = this.s.machines.filter(m => m.type === type).length;
    return Math.round(MACHINES[type].base * Math.pow(1.8, Math.max(0, n - 1)));
  }
  freeSlot() {
    for (let i = 1; i <= this.slots; i++) if (!this.machineAt(i)) return i;
    return 0;
  }
  buyMachine(type) {
    const slot = this.freeSlot();
    if (!slot) return this.fail('吧台沒有空位了，擴店可以增加位置');
    const price = this.machinePrice(type);
    if (this.s.coins < price) return this.fail('金幣不夠');
    this.s.coins -= price;
    this.s.machines.push({ id: uid(), type, slot, job: null });
    this.touch(); this.h.sfx('buy');
    return true;
  }

  // ---------- 擺設 ----------
  canPlace(x, y, ignoreId) {
    if (!this.isFloor(x, y) || y < 2) return false;
    const d = this.door;
    if (x === d.x && y === d.y) return false;
    const o = this.occMap().get(k(x, y));
    if (o && o.id !== ignoreId) return false;
    // 模擬放下後，門口仍要走得到出餐口
    const blocked = new Set(this.s.furniture.filter(f => f.id !== ignoreId).map(f => k(f.x, f.y)));
    blocked.add(k(x, y));
    const free = (a, b) => this.isFloor(a, b) && b >= 1 && !blocked.has(k(a, b));
    const seen = new Set([k(d.x, d.y)]), q = [[d.x, d.y]];
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy, key = k(nx, ny);
        if (seen.has(key) || !free(nx, ny)) continue;
        seen.add(key); q.push([nx, ny]);
      }
    }
    return seen.has(k(this.pickup.x, this.pickup.y));
  }
  // 有客人坐著或正走向的座位、及其相鄰桌子不能移動
  locked(f) {
    for (const c of this.customers) {
      if (!c.seat) continue;
      const sf = c.seat.f;
      if (sf.id === f.id) return true;
      if (FURNITURE[f.type].kind === 'table' && Math.abs(sf.x - f.x) + Math.abs(sf.y - f.y) === 1) return true;
    }
    return false;
  }
  placeNew(type, x, y) {
    const it = FURNITURE[type];
    if (!this.unlocked(it.lv)) return this.fail(`Lv${it.lv} 解鎖`);
    if (this.s.coins < it.cost) return this.fail('金幣不夠');
    if (!this.canPlace(x, y)) return this.fail('這裡不能擺');
    this.s.coins -= it.cost;
    this.s.furniture.push({ id: uid(), type, x, y });
    this.s.stats.placed++;
    this.afterFurniture(); this.h.sfx('place');
    return true;
  }
  placeFromStorage(idx, x, y) {
    const it = this.s.storage[idx];
    if (!it || !this.canPlace(x, y)) return this.fail('這裡不能擺');
    this.s.storage.splice(idx, 1);
    this.s.furniture.push({ id: uid(), type: it.type, x, y });
    this.afterFurniture(); this.h.sfx('place');
    return true;
  }
  moveFurniture(id, x, y) {
    const f = this.s.furniture.find(q => q.id === id);
    if (!f || !this.canPlace(x, y, id)) return this.fail('這裡不能擺');
    f.x = x; f.y = y;
    this.afterFurniture(); this.h.sfx('place');
    return true;
  }
  storeFurniture(id) {
    const i = this.s.furniture.findIndex(q => q.id === id);
    if (i < 0) return false;
    const f = this.s.furniture[i];
    if (this.locked(f)) return this.fail('客人正在使用');
    this.s.furniture.splice(i, 1);
    this.s.storage.push({ type: f.type });
    this.afterFurniture(); return true;
  }
  sellFurniture(id) {
    const i = this.s.furniture.findIndex(q => q.id === id);
    if (i < 0) return false;
    const f = this.s.furniture[i];
    if (this.locked(f)) return this.fail('客人正在使用');
    this.s.furniture.splice(i, 1);
    const back = Math.floor(FURNITURE[f.type].cost / 2);
    this.s.coins += back;
    this.afterFurniture(); this.h.sfx('coin');
    return back;
  }
  sellStorage(idx) {
    const it = this.s.storage[idx]; if (!it) return 0;
    this.s.storage.splice(idx, 1);
    const back = Math.floor(FURNITURE[it.type].cost / 2);
    this.s.coins += back; this.h.sfx('coin'); this.touch();
    return back;
  }
  canPlaceWall(side, i, ignoreId) {
    if (side === 'R' && (i < 0 || i >= this.W)) return false;
    if (side === 'L' && (i < 0 || i >= this.H - 1)) return false;
    return !this.s.wall.some(w => w.side === side && w.i === i && w.id !== ignoreId);
  }
  placeWallNew(type, side, i) {
    const it = FURNITURE[type];
    if (this.s.coins < it.cost) return this.fail('金幣不夠');
    if (!this.canPlaceWall(side, i)) return this.fail('這裡不能掛');
    this.s.coins -= it.cost;
    this.s.wall.push({ id: uid(), type, side, i });
    this.s.stats.placed++;
    this.touch(); this.h.sfx('place'); return true;
  }
  placeWallFromStorage(idx, side, i) {
    const it = this.s.storage[idx];
    if (!it || !this.canPlaceWall(side, i)) return this.fail('這裡不能掛');
    this.s.storage.splice(idx, 1);
    this.s.wall.push({ id: uid(), type: it.type, side, i });
    this.touch(); this.h.sfx('place'); return true;
  }
  moveWall(id, side, i) {
    const w = this.s.wall.find(q => q.id === id);
    if (!w || !this.canPlaceWall(side, i, id)) return this.fail('這裡不能掛');
    w.side = side; w.i = i; this.touch(); this.h.sfx('place'); return true;
  }
  storeWall(id) {
    const i = this.s.wall.findIndex(q => q.id === id);
    if (i < 0) return false;
    this.s.storage.push({ type: this.s.wall[i].type });
    this.s.wall.splice(i, 1); this.touch(); return true;
  }
  sellWall(id) {
    const i = this.s.wall.findIndex(q => q.id === id);
    if (i < 0) return 0;
    const back = Math.floor(FURNITURE[this.s.wall[i].type].cost / 2);
    this.s.wall.splice(i, 1); this.s.coins += back; this.touch(); this.h.sfx('coin');
    return back;
  }
  buyTheme(kind, id) {
    const table = kind === 'floor' ? FLOORS : WALLS;
    const owned = kind === 'floor' ? this.s.ownedFloors : this.s.ownedWalls;
    const t = table[id];
    if (!owned.includes(id)) {
      if (!this.unlocked(t.lv)) return this.fail(`Lv${t.lv} 解鎖`);
      if (this.s.coins < t.cost) return this.fail('金幣不夠');
      this.s.coins -= t.cost; owned.push(id); this.h.sfx('buy');
    }
    if (kind === 'floor') this.s.floor = id; else this.s.wallpaper = id;
    this.touch(); return true;
  }
  afterFurniture() {
    this.touch();
    // 座位不見了的客人離開；走路中的角色重新規劃路線
    const valid = new Set(this.seats().filter(s => s.ok).map(s => s.f.id));
    for (const c of this.customers) {
      if (c.seat && !valid.has(c.seat.f.id) && c.state !== 'leave' && c.state !== 'exit') this.customerLeave(c, true);
      else if (c.path && c.path.length) this.repath(c);
    }
    for (const st of this.staffRt.values()) if (st.path && st.path.length) this.repath(st);
  }

  // ---------- 擴店 ----------
  nextExpansion() { return EXPANSIONS[this.s.expand + 1] || null; }
  doExpand() {
    const n = this.nextExpansion();
    if (!n) return false;
    if (!this.unlocked(n.lv)) return this.fail(`Lv${n.lv} 才能擴店`);
    if (this.s.coins < n.cost) return this.fail('金幣不夠');
    this.s.coins -= n.cost; this.s.expand++;
    this.afterFurniture();
    for (const c of this.customers) if (c.state === 'leave') this.repath(c);
    this.h.sfx('level');
    return true;
  }

  // ---------- 員工 ----------
  nextHire() { return STAFF_HIRES[this.s.staff.length - 1] || null; }
  hire() {
    const n = this.nextHire();
    if (!n) return this.fail('員工已經滿了');
    if (!this.unlocked(n.lv)) return this.fail(`Lv${n.lv} 才能雇用`);
    if (this.s.coins < n.cost) return this.fail('金幣不夠');
    this.s.coins -= n.cost;
    const used = new Set(this.s.staff.map(x => x.name).concat(this.s.regulars.map(r => r.name)));
    const pool = NAMES.filter(x => !used.has(x));
    const st = { id: uid(), name: pool[Math.floor(Math.random() * pool.length)] || '新店員', speed: +(1.9 + Math.random() * 0.6).toFixed(2), maxSta: 100, sta: 100, look: randomLook() };
    this.s.staff.push(st);
    this.addStaffRt(st, this.s.staff.length - 1);
    this.h.sfx('level');
    return st;
  }
  addStaffRt(st, i) {
    const home = this.homeTile(i);
    this.staffRt.set(st.id, { id: st.id, i, x: home.x + 0.5, y: home.y + 0.5, path: [], state: 'idle', task: null, carry: false, dir: 0, back: false, cheerCD: 0, wait: 0, step: 0 });
  }
  cheer(id) {
    const st = this.s.staff.find(x => x.id === id), rt = this.staffRt.get(id);
    if (!st || !rt) return;
    if (rt.cheerCD > 0) { this.h.floater({ x: rt.x, y: rt.y, z: 110 }, `休息一下 ${Math.ceil(rt.cheerCD)} 秒`, '#8a7a6a'); return; }
    st.sta = Math.min(st.maxSta, st.sta + 35);
    rt.cheerCD = 25;
    this.h.floater({ x: rt.x, y: rt.y, z: 110 }, '加油！+35 體力', '#d9775f');
    this.h.sfx('cheer');
  }

  // ---------- 常客 ----------
  makePasserby() {
    const trait = TRAIT_ORDER[Math.floor(Math.random() * TRAIT_ORDER.length)];
    const t = TRAITS[trait];
    return { id: uid(), look: randomLook(), trait, line: t.lines[Math.floor(Math.random() * t.lines.length)] };
  }
  pitchOptions(trait) {
    const others = TRAIT_ORDER.filter(x => x !== trait).sort(() => Math.random() - 0.5).slice(0, 2);
    return [trait, ...others].sort(() => Math.random() - 0.5);
  }
  favFor(trait) {
    const tag = TRAITS[trait].fav;
    let cands = RECIPE_ORDER.filter(r => tag === 'any' || RECIPES[r].tags.includes(tag));
    const open = cands.filter(r => RECIPES[r].lv <= this.s.level);
    if (open.length) cands = open; else cands = [cands.sort((a, b) => RECIPES[a].lv - RECIPES[b].lv)[0]];
    return cands[Math.floor(Math.random() * cands.length)];
  }
  tryRecruit(p, choice) {
    if (this.s.cards <= 0) { this.fail('名片用完了，等一下會再補充'); return { ok: false, reason: 'cards' }; }
    if (this.s.regulars.length >= maxRegulars(this.s.level)) { this.fail('常客簿已滿，升級可以增加名額'); return { ok: false, reason: 'full' }; }
    if (this.s.cards >= CARD_MAX) this.s.cardsT = nowSec();
    this.s.cards--;
    const t = TRAITS[p.trait];
    if (choice !== p.trait) return { ok: false, reason: 'wrong' };
    if (t.charmNeed && this.charm() < t.charmNeed) return { ok: false, reason: 'charm' };
    const used = new Set(this.s.staff.map(x => x.name).concat(this.s.regulars.map(r => r.name)));
    const pool = NAMES.filter(x => !used.has(x));
    const r = { id: uid(), name: pool[Math.floor(Math.random() * pool.length)] || '路人', look: p.look, trait: p.trait, fav: this.favFor(p.trait), friend: 0, visits: 0, rewarded: 0, last: 0 };
    this.s.regulars.push(r);
    this.s.stats.recruited++;
    this.addExp(5);
    this.h.sfx('level');
    return { ok: true, regular: r };
  }
  friendLevel(r) { let l = 0; FRIEND_LEVELS.forEach((f, i) => { if (r.friend >= f.need) l = i + 1; }); return l; }

  // ---------- 客人 ----------
  freeSeats() {
    const taken = new Set(this.customers.filter(c => c.seat).map(c => c.seat.f.id));
    return this.seats().filter(s => s.ok && !taken.has(s.f.id));
  }
  spawnCustomer() {
    const free = this.freeSeats();
    if (!free.length) return;
    const seat = free[Math.floor(Math.random() * free.length)];
    const now = nowSec();
    let reg = null;
    const present = new Set(this.customers.map(c => c.regId).filter(Boolean));
    const elig = this.s.regulars.filter(r => !present.has(r.id) && now - (r.last || 0) > 90);
    if (elig.length && Math.random() < 0.35) reg = elig[Math.floor(Math.random() * elig.length)];
    const d = this.door;
    const c = {
      id: uid(), look: reg ? reg.look : randomLook(), regId: reg ? reg.id : null,
      x: d.x + 0.5, y: d.y + 0.5, z: 0, path: [], state: 'enter', seat, alpha: 0, t: 0,
      order: null, patience: 0, maxPatience: 32, assigned: null, dir: 0, back: false, sit: false, mood: '', step: 0,
    };
    if (reg) reg.last = now;
    this.customers.push(c);
  }
  chooseOrder(c) {
    const avail = RECIPE_ORDER.filter(r => this.unlocked(RECIPES[r].lv));
    const reg = c.regId && this.s.regulars.find(r => r.id === c.regId);
    if (reg && this.unlocked(RECIPES[reg.fav].lv) && (this.s.stock[reg.fav] > 0 || Math.random() < 0.5)) return reg.fav;
    const inStock = avail.filter(r => this.s.stock[r] > 0);
    if (inStock.length && Math.random() < 0.85) return inStock[Math.floor(Math.random() * inStock.length)];
    return avail[Math.floor(Math.random() * avail.length)];
  }
  customerLeave(c, instant = false) {
    c.sit = false;
    if (c.assigned) {
      const st = this.staffRt.get(c.assigned);
      if (st && st.task && st.task.cust === c) this.cancelTask(st);
      c.assigned = null;
    }
    c.seat = null;
    if (instant) { c.state = 'exit'; return; }
    const ap = c.approach || this.door;
    c.x = ap.x + 0.5; c.y = ap.y + 0.5; c.z = 0;
    c.state = 'leave';
    this.repath(c);
  }
  repath(e) {
    const tx = Math.floor(e.x), ty = Math.floor(e.y);
    let goal;
    if (e.state === 'leave') { const d = this.door; goal = (x, y) => x === d.x && y === d.y; }
    else if (e.state === 'walk' && e.seat) { const ap = new Set(this.seats().find(s => s.f.id === e.seat.f.id)?.approaches.map(p => k(p.x, p.y)) || []); goal = (x, y) => ap.has(k(x, y)); }
    else if (e.state === 'toPickup') { const p = this.pickup; goal = (x, y) => x === p.x && y === p.y; }
    else if (e.state === 'toServe' && e.task) { const f = e.task.cust.seat?.f; if (!f) return; goal = (x, y) => Math.abs(x - f.x) + Math.abs(y - f.y) === 1 && this.walkable(x, y); }
    else if (e.state === 'return') { const h = this.homeTile(e.i); goal = (x, y) => x === h.x && y === h.y; }
    else return;
    const p = this.path(tx, ty, goal);
    if (p === null) { e.path = []; e.stuck = (e.stuck || 0) + 1; }
    else { e.path = p.map(q => ({ x: q.x + 0.5, y: q.y + 0.5 })); e.stuck = 0; }
  }
  // 沿路徑移動；回傳 true 表示到達終點
  move(e, speed, dt) {
    if (!e.path.length) return true;
    let left = speed * dt;
    while (left > 0 && e.path.length) {
      const n = e.path[0];
      const dx = n.x - e.x, dy = n.y - e.y, dist = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) this.faceToward(e, dx, dy);
      if (dist <= left) { e.x = n.x; e.y = n.y; left -= dist; e.path.shift(); }
      else { e.x += dx / dist * left; e.y += dy / dist * left; left = 0; }
    }
    e.step = Math.sin(this.t * 14 + (e.x + e.y) * 0.3);
    return e.path.length === 0;
  }
  faceToward(e, dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) { e.dir = dx > 0 ? 1 : 0; e.back = dx < 0; }
    else { e.dir = dy > 0 ? 0 : 1; e.back = dy < 0; }
  }
  faceFacing(e, facing) {
    e.dir = (facing === 'px' || facing === 'ny') ? 1 : 0;
    e.back = facing === 'nx' || facing === 'ny';
  }

  updateCustomer(c, dt) {
    c.t += dt;
    switch (c.state) {
      case 'enter':
        c.alpha = Math.min(1, c.alpha + dt * 2.5);
        if (c.alpha >= 1) {
          c.state = 'walk';
          const ap = new Set(c.seat.approaches.map(p => k(p.x, p.y)));
          const p = this.path(Math.floor(c.x), Math.floor(c.y), (x, y) => ap.has(k(x, y)));
          if (p === null) { this.customerLeave(c, true); return; }
          c.path = p.map(q => ({ x: q.x + 0.5, y: q.y + 0.5 }));
        }
        break;
      case 'walk':
        if (this.move(c, 1.7, dt)) {
          if (c.stuck) { this.repath(c); if (c.stuck > 3) this.customerLeave(c, true); return; }
          c.approach = { x: Math.floor(c.x), y: Math.floor(c.y) };
          const f = c.seat.f;
          c.x = f.x + 0.5; c.y = f.y + 0.5; c.z = 16; c.sit = true;
          this.faceFacing(c, this.chairFacing(f) || 'px');
          c.state = 'order'; c.order = this.chooseOrder(c); c.patience = c.maxPatience;
          this.h.sfx('pop');
        }
        break;
      case 'order':
        if (!c.assigned) {
          c.patience -= dt;
          if (c.patience <= 0) {
            c.mood = 'sad'; c.state = 'sad'; c.t = 0; this.s.stats.lost++;
          }
        }
        break;
      case 'sad':
        if (c.t > 1.2) this.customerLeave(c);
        break;
      case 'drink':
        if (c.t > 5.5) this.pay(c);
        break;
      case 'leave':
        if (this.move(c, 1.8, dt)) {
          const d = this.door;
          if (Math.floor(c.x) !== d.x || Math.floor(c.y) !== d.y) { this.repath(c); if (!c.path.length) c.state = 'exit'; return; }
          c.state = 'exit';
        }
        break;
      case 'exit':
        c.alpha -= dt * 2.5;
        if (c.alpha <= 0) c.dead = true;
        break;
      default: break;
    }
  }
  pay(c) {
    const r = RECIPES[c.order];
    let amount = r.price * (1 + this.tipRate());
    const reg = c.regId && this.s.regulars.find(x => x.id === c.regId);
    if (reg) {
      amount *= 1.3;
      const before = this.friendLevel(reg);
      reg.friend += c.order === reg.fav ? 2 : 1;
      reg.visits++;
      const after = this.friendLevel(reg);
      if (after > before && after > reg.rewarded) {
        const gift = FRIEND_LEVELS[after - 1].reward;
        reg.rewarded = after;
        this.addCoins(gift);
        this.h.toast(`${reg.name}跟你更熟了！送你 ${gift} 金幣`, 'good');
      }
    }
    amount = Math.round(amount);
    this.addCoins(amount);
    this.s.stats.served++;
    this.addExp(r.exp);
    this.h.floater({ x: c.x, y: c.y, z: 110 }, `+${amount}`, '#c9892a', true);
    this.h.sfx('coin');
    c.mood = 'happy';
    this.customerLeave(c);
  }

  // ---------- 店員 ----------
  cancelTask(st) {
    if (st.task && st.task.reserved) this.s.stock[st.task.drink]++;
    st.task = null; st.carry = false; st.state = 'return'; this.repath(st);
  }
  dispatch() {
    const waiting = this.customers.filter(c => c.state === 'order' && !c.assigned).sort((a, b) => a.patience - b.patience);
    for (const c of waiting) {
      if (this.s.stock[c.order] <= 0) continue;
      let best = null, bd = 1e9;
      for (const st of this.staffRt.values()) {
        const data = this.s.staff[st.i];
        if (!data || st.task || data.sta < SERVE_COST || st.tired) continue;
        if (st.state !== 'idle' && st.state !== 'return') continue;
        const d = Math.abs(st.x - 0.5) + Math.abs(st.y - 1.5);
        if (d < bd) { bd = d; best = st; }
      }
      if (!best) return;
      this.s.stock[c.order]--;
      c.assigned = best.id;
      best.task = { cust: c, drink: c.order, reserved: true };
      best.state = 'toPickup';
      this.repath(best);
    }
  }
  updateStaff(st, dt) {
    const data = this.s.staff[st.i];
    if (!data) return;
    st.cheerCD = Math.max(0, st.cheerCD - dt);
    const speed = data.speed;
    switch (st.state) {
      case 'idle':
        data.sta = Math.min(data.maxSta, data.sta + dt * 0.7);
        if (st.tired && data.sta >= 30) st.tired = false;
        if (data.sta < SERVE_COST) st.tired = true;
        st.step = 0;
        break;
      case 'toPickup':
        if (this.move(st, speed, dt)) {
          if (st.stuck) { this.repath(st); if (st.stuck > 3) this.cancelTask(st); return; }
          st.wait += dt;
          st.back = true; st.dir = 1;
          if (st.wait > 0.35) {
            st.wait = 0; st.carry = true; st.state = 'toServe';
            this.repath(st);
          }
        }
        break;
      case 'toServe': {
        const c = st.task && st.task.cust;
        if (!c || c.state !== 'order') { this.cancelTask(st); return; }
        if (this.move(st, speed, dt)) {
          const f = c.seat.f;
          const tx = Math.floor(st.x), ty = Math.floor(st.y);
          if (Math.abs(tx - f.x) + Math.abs(ty - f.y) !== 1) { this.repath(st); if (st.stuck > 3) this.cancelTask(st); return; }
          this.faceToward(st, f.x - tx, f.y - ty);
          // 送達
          st.task.reserved = false;
          st.task = null; st.carry = false;
          data.sta = Math.max(0, data.sta - SERVE_COST);
          if (data.sta < SERVE_COST) st.tired = true;
          c.state = 'drink'; c.t = 0; c.mood = 'happy';
          this.h.sfx('serve');
          st.state = 'return'; this.repath(st);
        }
        break;
      }
      case 'return':
        if (this.move(st, speed * 0.9, dt)) {
          const h = this.homeTile(st.i);
          if (Math.floor(st.x) !== h.x || Math.floor(st.y) !== h.y) { this.repath(st); if (!st.path.length) st.state = 'idle'; return; }
          st.state = 'idle'; st.dir = 0; st.back = false;
        }
        break;
      default: break;
    }
  }

  // ---------- 主迴圈 ----------
  tick(dt) {
    this.t += dt;
    const s = this.s, now = nowSec();
    // 名片自動補充
    if (s.cards < CARD_MAX) {
      while (s.cards < CARD_MAX && now - s.cardsT >= CARD_REGEN) { s.cards++; s.cardsT += CARD_REGEN; }
      if (s.cards >= CARD_MAX) s.cardsT = now;
    } else s.cardsT = now;
    // 客人生成
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const interval = Math.max(3.5, Math.min(13, 13 - this.charm() * 0.05));
      this.spawnT = interval * (0.75 + Math.random() * 0.5);
      this.spawnCustomer();
    }
    for (const c of this.customers) this.updateCustomer(c, dt);
    this.customers = this.customers.filter(c => !c.dead);
    this.dispatch();
    for (const st of this.staffRt.values()) this.updateStaff(st, dt);
  }

  dailyBonus() {
    const t = todayStr();
    if (this.s.daily === t) return 0;
    this.s.daily = t;
    const b = 100 + 50 * this.s.level;
    this.s.coins += b;
    return b;
  }
}
