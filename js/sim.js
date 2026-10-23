// ============================================================
// 遊戲邏輯（與畫面無關）：經濟、機器、客人動線、員工、事件、常客、鄰居、離線
// 座標：格子 (x, y)；x 沿後吧台那面牆，y 往門口方向
// ============================================================
import * as D from './data.js';
import { uid, now, gameDay } from './state.js';

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const key = (x, y) => x + ',' + y;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// 把衣櫃 id 轉成人物外觀
export function resolveLook(look, apronId, art) {
  const w = D.WARDROBE;
  const top = w[look.top] || w.top_white, bot = w[look.bottom] || w.bot_black;
  const hatId = look.hat || 'hat_none';
  const styleMap = { top_white: 'shirt', top_stripe: 'tee', top_knit: 'knit', top_sage: 'shirt', top_rose: 'tee', top_black: 'tee', top_mustard: 'knit', top_vest: 'vest', top_truck: 'tee' };
  return {
    skin: look.skin, hair: look.hair, hairStyle: look.hairStyle, eye: look.eye,
    top: top.color || '#f4efe6', topStyle: styleMap[look.top] || 'shirt',
    bottom: bot.color || '#2b2b2f', bottomType: bot.skirt ? 'skirt' : 'pants',
    hat: hatId === 'hat_beret' ? 'beret' : hatId === 'hat_cap' ? 'cap' : null, capColor: '#2f5446',
    glasses: look.glasses === 'glass_round', apron: apronId ? (w[apronId] || w.apron_forest).color : null, art,
  };
}

// 隨機路人外觀
const R_SKIN = D.SKINS, R_HAIR = D.HAIR_COLORS;
const R_TOP = ['#f4efe6', '#2c3a56', '#d9c7a8', '#8fa696', '#c98a86', '#26252a', '#c49a3a', '#7fb3c9', '#e9b0a8', '#b5a4d6', '#e4d27a', '#6f8fd0'];
const R_BOT = ['#2b2b2f', '#cdbfa8', '#34435e', '#3b3b44', '#6d6a64', '#9a5a5a', '#5b4a40'];
const R_EYE = ['#5a3a2a', '#3b2a22', '#4a6a9a', '#3d6b4a', '#7a4a2e', '#6a4a8a'];
export function randomLook() {
  const st = pick(['short', 'short', 'bob', 'long', 'pony', 'bun', 'curly']);
  const skirt = st !== 'short' && Math.random() < 0.45;
  return {
    skin: pick(R_SKIN), hair: pick(R_HAIR), hairStyle: st, eye: pick(R_EYE), top: pick(R_TOP), topStyle: pick(['shirt', 'tee', 'knit']),
    bottom: pick(R_BOT), bottomType: skirt ? 'skirt' : 'pants', hat: Math.random() < 0.12 ? pick(['beret', 'cap']) : null,
    capColor: pick(['#2f5446', '#c9826a', '#25324a', '#e3a23a']), glasses: Math.random() < 0.18, ribbon: st === 'pony' && Math.random() < 0.5 ? pick(['#c9826a', '#e07a8a', '#5a8ac9']) : null,
  };
}

export class Game {
  constructor(state, hooks = {}) {
    this.s = state;
    this.h = Object.assign({ toast() {}, floater() {}, sfx() {}, levelUp() {}, event() {}, changed() {} }, hooks);
    this.customers = [];
    this.passers = [];
    this.staffRt = new Map();
    this.ownerRt = null;
    this.t = 0;
    this.spawnAcc = 0;
    this.passerT = 0;
    this.version = 1;
    this.salesAcc = 0;
    this.autoT = 0;
    this.lookPool = [];
    for (let i = 0; i < 14; i++) this.lookPool.push({ ...randomLook(), art: 'customer_' + (i + 1) });
    for (const id of D.REGULAR_ORDER) D.REGULARS[id].look.art = 'reg_' + id;
    for (const id of D.NEIGHBOR_ORDER) D.NEIGHBORS[id].look.art = 'nb_' + id;
    this.initStaff();
  }

  // ======================= 幾何 =======================
  get room() { return D.EXPANSIONS[this.s.expand]; }
  get W() { return this.room.W; }
  get D() { return this.room.D; }
  get slots() { return this.room.slots; }
  get entrance() { return { x: 0, y: this.D - 1 }; }
  get entranceOut() { return { x: 0, y: this.D }; }
  touch() { this.version++; this._occ = null; this._seats = null; this.h.changed(); }

  inside(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.D; }
  outside(x, y) {
    const W = this.W, H = this.D;
    return (y >= H && y <= H + 3 && x >= -3 && x <= W + 3) || (x >= W && x <= W + 3 && y >= 0 && y < H);
  }
  // 不能擺家具的格子（吧台、走道、櫃台、排隊動線、門口）
  reserved(x, y) {
    const sl = Math.max(this.slots, 4);
    if (y === 0 && x < this.slots) return true;
    if (y === 1 && x <= sl) return true;
    if (y === 2 && x <= 4) return true;
    if (y === 3 && x <= 3) return true;
    if (x === 0 && y >= 3) return true;
    return false;
  }
  counterTile(x, y) { return (y === 0 && x < this.slots) || (y === 2 && x <= 3); }
  occ() {
    if (this._occ) return this._occ;
    const m = new Map();
    for (const f of this.s.furniture) m.set(key(f.x, f.y), f);
    this._occ = m; return m;
  }
  custWalk(x, y) {
    if (this.outside(x, y)) return true;
    if (!this.inside(x, y)) return false;
    if (this.counterTile(x, y)) return false;
    if (y === 1 && x <= Math.max(this.slots, 4)) return false;
    if (y === 2 && x === 4) return false;
    if (y === 0) return !this.occ().has(key(x, y));
    return !this.occ().has(key(x, y));
  }
  staffWalk(x, y) {
    if (!this.inside(x, y)) return false;
    if (this.counterTile(x, y)) return false;
    return !this.occ().has(key(x, y));
  }
  // 室內外只能從門口進出
  edgeOk(ax, ay, bx, by) {
    const ai = this.inside(ax, ay), bi = this.inside(bx, by);
    if (ai === bi) return true;
    const e = this.entrance, o = this.entranceOut;
    return (ax === e.x && ay === e.y && bx === o.x && by === o.y) || (bx === e.x && by === e.y && ax === o.x && ay === o.y);
  }
  path(sx, sy, goal, walk) {
    sx = Math.floor(sx); sy = Math.floor(sy);
    if (goal(sx, sy)) return [];
    const start = key(sx, sy), prev = new Map([[start, null]]), q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || !this.edgeOk(x, y, nx, ny)) continue;
        const g = goal(nx, ny);
        if (!g && !walk(nx, ny)) continue;
        prev.set(k, key(x, y));
        if (g) {
          const out = []; let cur = k;
          while (cur && cur !== start) { const [a, b] = cur.split(',').map(Number); out.unshift({ x: a + 0.5, y: b + 0.5 }); cur = prev.get(cur); }
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }
  reach(walk, from) {
    const seen = new Set([key(from.x, from.y)]), q = [[from.x, from.y]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (seen.has(k) || !this.edgeOk(x, y, nx, ny) || !walk(nx, ny)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  }

  // 椅子：面向相鄰的桌子
  chairFacing(f) {
    const o = this.occ();
    for (const [fc, dx, dy] of [['px', 1, 0], ['pz', 0, 1], ['nx', -1, 0], ['nz', 0, -1]]) {
      const t = o.get(key(f.x + dx, f.y + dy));
      if (t && D.FURNITURE[t.type].kind === 'table') return { facing: fc, table: t };
    }
    return null;
  }
  seats() {
    if (this._seats) return this._seats;
    const reach = this.reach((x, y) => this.custWalk(x, y), this.entrance);
    const out = [];
    for (const f of this.s.furniture) {
      if (D.FURNITURE[f.type].kind !== 'chair') continue;
      const cf = this.chairFacing(f);
      const ap = DIRS.map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy })).filter(p => reach.has(key(p.x, p.y)) && this.inside(p.x, p.y));
      out.push({ f, facing: cf ? cf.facing : null, table: cf ? cf.table : null, ok: !!cf && ap.length > 0, ap, why: !cf ? '旁邊需要一張桌子' : ap.length ? '' : '客人走不到這張椅子' });
    }
    this._seats = out; return out;
  }

  // ======================= 數值 =======================
  score() {
    const s = this.s;
    let sc = D.FLOORS[s.floor].score + D.WALLS[s.wall].score;
    for (const f of s.furniture) sc += D.FURNITURE[f.type].score;
    for (const w of s.wallItems) sc += (D.FURNITURE[w.type] || { score: 0 }).score;
    for (const p of s.pendants) sc += D.FURNITURE[p.type].score;
    for (const st of this.seats()) if (!st.ok) sc -= 2;
    sc -= s.dirtyTables.length * 3 + s.messyChairs.length;
    return Math.max(0, sc);
  }
  exhaustedCount() { return this.s.staff.filter(st => st.energy <= 0).length; }
  staffMult() { return Math.max(0.25, 1 - D.TIRED_PENALTY * this.exhaustedCount()); }
  rate() { return D.customerRate(this.score()) * this.staffMult(); }
  cap() { return D.customerCap(this.score()); }
  maxEnergy(st) { return D.ENERGY_BASE + (st.prof || 0); }
  unlocked(lv) { return this.s.level >= lv; }
  title() { return D.TITLES[Math.min(this.s.level, D.TITLES.length - 1)]; }

  addGold(n, pos) { this.s.gold += n; if (n > 0) this.s.stats.earned += n; if (pos) this.h.floater(pos, '+' + Math.round(n), 'gold'); }
  addBeans(n, pos) { this.s.beans += n; if (pos) this.h.floater(pos, '+' + n, 'bean'); }
  addExp(n) {
    const s = this.s;
    s.exp += n;
    while (s.level < D.MAX_LEVEL && s.exp >= D.expNeed(s.level)) {
      s.exp -= D.expNeed(s.level);
      s.level++;
      const bonus = 100 * s.level;
      s.gold += bonus; s.coupons += 1;
      for (const st of s.staff) { st.prof = (st.prof || 0) + 5; st.energy = this.maxEnergy(st); }
      this.h.levelUp(s.level, bonus);
      this.touch();
    }
    if (s.level >= D.MAX_LEVEL) s.exp = Math.min(s.exp, D.expNeed(s.level));
  }
  give(r, pos) {
    if (!r) return;
    if (r.gold) this.addGold(r.gold, pos);
    if (r.beans) this.addBeans(r.beans, pos);
    if (r.coupon) this.s.coupons += r.coupon;
    if (r.exp) this.addExp(r.exp);
  }
  fail(msg) { this.h.toast(msg, 'warn'); this.h.sfx('no'); return false; }
  spend(gold, coupon = 0) {
    if (coupon) { if (this.s.coupons < coupon) return this.fail('咖啡券不夠'); this.s.coupons -= coupon; return true; }
    if (this.s.gold < gold) return this.fail('金幣不夠');
    this.s.gold -= gold; return true;
  }

  // ======================= 機器 =======================
  machineAt(slot) { return this.s.machines.find(m => m.slot === slot); }
  mdef(m) { return D.BAR_MACHINES[m.type]; }
  status(m, t = now()) {
    const j = m.job;
    if (!j) return { st: 'idle' };
    if (j.kind === 'brew') {
      if (t < j.start + j.prep) return { st: 'run', p: (t - j.start) / j.prep, left: j.start + j.prep - t };
      return { st: 'sell', left: j.sellLeft, total: j.cups };
    }
    const end = j.start + j.dur;
    if (t < end) return { st: 'run', p: (t - j.start) / j.dur, left: end - t };
    const burnAt = end + (j.kind === 'roast' ? D.burnAfter(j.dur) : j.kind === 'side' ? D.SIDE_BURN : D.MEAL_BURN);
    if (t >= burnAt) return { st: 'burnt' };
    return { st: 'done', burnLeft: burnAt - t };
  }
  machineCount(kind) { return this.s.machines.filter(m => this.mdef(m).kind === kind).length; }
  freeSlot() { for (let i = 1; i <= this.slots; i++) if (!this.machineAt(i)) return i; return 0; }
  buyMachine(type, slot) {
    const d = D.BAR_MACHINES[type];
    if (!this.unlocked(d.lv)) return this.fail(`Lv${d.lv} 解鎖`);
    if (this.machineCount(d.kind) >= D.machineCap(d.kind, this.s.level)) return this.fail('這類機器已達目前等級的上限');
    slot = slot || this.freeSlot();
    if (!slot || this.machineAt(slot)) return this.fail('吧台沒有空位了，擴店可以增加位置');
    if (!this.spend(d.cost)) return false;
    this.s.machines.push({ id: uid(), type, slot, job: null, auto: { on: false, item: null, toppings: [] } });
    this.touch(); this.h.sfx('buy'); return true;
  }
  sellMachine(m) {
    if (m.job) return this.fail('機器還在運作中');
    if (this.s.machines.filter(q => this.mdef(q).kind === this.mdef(m).kind).length <= 1 && ['roaster', 'espresso'].includes(this.mdef(m).kind)) return this.fail('至少要留一台');
    this.s.machines = this.s.machines.filter(q => q !== m);
    this.s.gold += Math.floor(this.mdef(m).cost / 2);
    this.touch(); return true;
  }
  moveMachine(m, slot) {
    if (slot < 1 || slot > this.slots) return false;
    const other = this.machineAt(slot);
    if (other) other.slot = m.slot;
    m.slot = slot; this.touch(); return true;
  }
  buyTool(id) {
    const t = D.TOOLS[id];
    if (this.s.tools[id]) return false;
    if (!this.unlocked(t.lv)) return this.fail(`Lv${t.lv} 解鎖`);
    if (!this.spend(t.cost)) return false;
    this.s.tools[id] = true; this.touch(); this.h.sfx('level'); return true;
  }
  recipeOpen(id) { const r = D.RECIPES[id]; return this.unlocked(r.lv) && !!this.s.tools[r.tool]; }

  startRoast(m, id, t = now(), quiet = false) {
    const r = D.ROASTS.find(q => q.id === id);
    if (m.job || !r) return false;
    if (!this.unlocked(r.lv)) return quiet ? false : this.fail(`Lv${r.lv} 解鎖`);
    if (this.s.gold < r.cost) return quiet ? false : this.fail('金幣不夠');
    this.s.gold -= r.cost;
    m.job = { kind: 'roast', item: id, start: t, dur: Math.round(r.time * (this.mdef(m).speed || 1)), beans: r.beans };
    m.auto.item = id;
    this.s.stats.roastStart++;
    if (!quiet) this.h.sfx('start');
    this.touch(); return true;
  }
  brewCups(m, id) { return Math.round(D.RECIPES[id].cups * (1 + (this.mdef(m).cupBonus || 0))); }
  startBrew(m, id, t = now(), quiet = false) {
    const r = D.RECIPES[id], rs = this.s.recipes[id];
    if (m.job || !r) return false;
    if (!this.recipeOpen(id)) return quiet ? false : this.fail('還沒解鎖這道飲品');
    if (!rs.trained) return quiet ? false : this.fail('要先完成進修');
    if (this.s.beans < r.beans) return quiet ? false : this.fail('咖啡豆不夠，先去烘豆');
    this.s.beans -= r.beans;
    m.job = { kind: 'brew', item: id, start: t, prep: Math.round(r.prep * (this.mdef(m).speedMul || 1)), cups: this.brewCups(m, id), sellLeft: this.brewCups(m, id) };
    m.auto.item = id;
    this.s.stats.brewStart++;
    if (!quiet) this.h.sfx('start');
    this.touch(); return true;
  }
  startSide(m, id, t = now(), quiet = false) {
    const r = D.SIDES[id];
    if (m.job || !r || r.machine !== this.mdef(m).machine) return false;
    if (!this.unlocked(r.lv)) return quiet ? false : this.fail(`Lv${r.lv} 解鎖`);
    if (this.s.gold < r.cost) return quiet ? false : this.fail('金幣不夠');
    this.s.gold -= r.cost;
    m.job = { kind: 'side', item: id, start: t, dur: r.time, pcs: r.pcs };
    m.auto.item = id; this.s.stats.sideStart++;
    if (!quiet) this.h.sfx('start');
    this.touch(); return true;
  }
  mealCost(id, tops) { return D.MEALS[id].cost + (tops || []).reduce((a, k) => a + D.TOPPINGS[k].cost, 0); }
  mealMult(tops) { return 1 + (tops || []).reduce((a, k) => a + D.TOPPINGS[k].bonus, 0); }
  startMeal(m, id, tops = [], t = now(), quiet = false) {
    const r = D.MEALS[id];
    if (m.job || !r || r.machine !== this.mdef(m).machine) return false;
    if (!this.unlocked(r.lv)) return quiet ? false : this.fail(`Lv${r.lv} 解鎖`);
    tops = tops.filter(k => D.TOPPINGS[k] && this.unlocked(D.TOPPINGS[k].lv)).slice(0, 3);
    const cost = this.mealCost(id, tops);
    if (this.s.gold < cost) return quiet ? false : this.fail('金幣不夠');
    this.s.gold -= cost;
    m.job = { kind: 'meal', item: id, start: t, dur: r.time, pcs: r.pcs, tops, mult: this.mealMult(tops) };
    m.auto.item = id; m.auto.toppings = tops; this.s.stats.mealStart++;
    if (!quiet) this.h.sfx('start');
    this.touch(); return true;
  }
  showcaseCount() { return Object.values(this.s.showcase).reduce((a, b) => a + b, 0); }
  mealCount() { return Object.values(this.s.meals).reduce((a, b) => a + b.n, 0); }
  collect(m, t = now(), quiet = false) {
    const st = this.status(m, t);
    const pos = { slot: m.slot };
    if (st.st === 'burnt') {
      const j = m.job;
      const name = j.kind === 'roast' ? D.ROASTS.find(r => r.id === j.item).name : j.kind === 'side' ? D.SIDES[j.item].name : D.MEALS[j.item].name;
      if (!quiet) this.h.toast(`${name}放太久，燒焦了…`, 'warn');
      this.s.stats.burnt++;
      m.job = null; this.touch(); return 'burnt';
    }
    if (st.st !== 'done') return false;
    const j = m.job;
    if (j.kind === 'roast') {
      const r = D.ROASTS.find(q => q.id === j.item);
      this.s.beans += j.beans; this.s.stats.roastCollect++;
      this.addExp(Math.max(1, Math.round(r.time / 120)));
      if (!quiet) this.h.floater(pos, '+' + j.beans, 'bean');
    } else if (j.kind === 'side') {
      const r = D.SIDES[j.item];
      const room = D.SHOWCASE_CAP - this.showcaseCount();
      if (room <= 0) return quiet ? false : this.fail('甜點櫃滿了，先賣掉一些');
      const n = Math.min(room, j.pcs);
      this.s.showcase[j.item] = (this.s.showcase[j.item] || 0) + n;
      this.s.stats.sideCollect++;
      this.addExp(r.exp * 2);
      if (!quiet) this.h.floater(pos, `+${n}`, 'cake');
    } else if (j.kind === 'meal') {
      const r = D.MEALS[j.item];
      const room = D.MEAL_CAP - this.mealCount();
      if (room <= 0) return quiet ? false : this.fail('出餐檯滿了');
      const n = Math.min(room, j.pcs);
      const k = j.item + '|' + j.tops.join('+');
      const cur = this.s.meals[k] || { item: j.item, n: 0, mult: j.mult, tops: j.tops };
      cur.n += n; this.s.meals[k] = cur;
      this.s.stats.mealCollect++;
      this.addExp(r.exp * 2);
      if (!quiet) this.h.floater(pos, `+${n}`, 'meal');
    } else return false;
    m.job = null;
    if (!quiet) this.h.sfx('collect');
    this.touch();
    return true;
  }
  // 立即完成（用咖啡券）
  rush(m) {
    const st = this.status(m);
    if (st.st !== 'run') return false;
    if (!this.spend(0, 1)) return false;
    const t = now();
    if (m.job.kind === 'brew') m.job.prep = Math.max(0, t - m.job.start);
    else m.job.dur = Math.max(0, t - m.job.start);
    this.touch(); return true;
  }

  // ======================= 販售 =======================
  sellingMachines(t = now()) { return this.s.machines.filter(m => m.job && m.job.kind === 'brew' && this.status(m, t).st === 'sell' && m.job.sellLeft > 0); }
  selling(t) { return this.sellingMachines(t).length > 0; }
  price(id) { const r = D.RECIPES[id]; return Math.round(r.price * (1 + this.s.recipes[id].stars * D.STAR_BONUS)); }
  // 一位客人買一次（回傳明細）
  purchase(t = now()) {
    const ms = this.sellingMachines(t);
    if (!ms.length) return null;
    const m = pick(ms);
    const id = m.job.item;
    m.job.sellLeft--;
    if (m.job.sellLeft <= 0) { m.job = null; this.touch(); }
    const rs = this.s.recipes[id];
    rs.sold++;
    let gold = this.price(id), exp = D.RECIPES[id].exp;
    let side = null, meal = null;
    if (this.showcaseCount() > 0 && Math.random() < D.SIDE_CHANCE) {
      const keys = Object.keys(this.s.showcase).filter(k => this.s.showcase[k] > 0);
      side = pick(keys); this.s.showcase[side]--; if (!this.s.showcase[side]) delete this.s.showcase[side];
      gold += D.SIDES[side].price; exp += D.SIDES[side].exp; this.s.stats.sideSold++;
    }
    if (this.mealCount() > 0 && Math.random() < D.MEAL_CHANCE) {
      const keys = Object.keys(this.s.meals).filter(k => this.s.meals[k].n > 0);
      const k = pick(keys); const b = this.s.meals[k];
      b.n--; if (!b.n) delete this.s.meals[k];
      meal = b.item; gold += Math.round(D.MEALS[b.item].price * b.mult); exp += D.MEALS[b.item].exp; this.s.stats.mealSold++;
    }
    this.s.stats.sold++;
    return { drink: id, side, meal, gold, exp };
  }

  // ======================= 擺設 =======================
  canPlace(x, y, ignoreId) {
    if (!this.inside(x, y) || this.reserved(x, y)) return false;
    const o = this.occ().get(key(x, y));
    if (o && o.id !== ignoreId) return false;
    // 放下後，門口要能走到收銀台前、取餐處、回收台
    const blocked = new Set(this.s.furniture.filter(f => f.id !== ignoreId).map(f => key(f.x, f.y)));
    blocked.add(key(x, y));
    const walk = (a, b) => (this.outside(a, b) || (this.inside(a, b) && !this.counterTile(a, b) && !(b === 1 && a <= Math.max(this.slots, 4)) && !(b === 2 && a === 4))) && !blocked.has(key(a, b));
    const seen = this.reach(walk, this.entrance);
    return seen.has(key(0, 3)) && seen.has(key(2, 3)) && seen.has(key(3, 3));
  }
  ownedCount(type) { return this.s.furniture.filter(f => f.type === type).length + this.s.storage.filter(f => f.type === type).length; }
  buyFurniture(type) {
    const it = D.FURNITURE[type];
    if (!this.unlocked(it.lv)) return this.fail(`Lv${it.lv} 解鎖`);
    return this.spend(it.cost || 0, it.coupon || 0);
  }
  placeFurniture(type, x, y, rot = 0, fromStorage = -1) {
    if (!this.canPlace(x, y)) return this.fail('這裡不能擺');
    if (fromStorage >= 0) this.s.storage.splice(fromStorage, 1);
    else if (!this.buyFurniture(type)) return false;
    this.s.furniture.push({ id: uid(), type, x, y, rot });
    this.s.stats.placed++;
    this.afterLayout(); this.h.sfx('place'); return true;
  }
  locked(f) {
    for (const c of this.customers) if (c.seat && (c.seat.f.id === f.id || (c.seat.table && c.seat.table.id === f.id))) return true;
    return false;
  }
  moveFurniture(id, x, y) {
    const f = this.s.furniture.find(q => q.id === id);
    if (!f) return false;
    if (this.locked(f)) return this.fail('客人正在使用');
    if (!this.canPlace(x, y, id)) return this.fail('這裡不能擺');
    f.x = x; f.y = y; this.afterLayout(); this.h.sfx('place'); return true;
  }
  rotateFurniture(id) { const f = this.s.furniture.find(q => q.id === id); if (!f) return; f.rot = ((f.rot || 0) + 1) % 4; this.touch(); }
  storeFurniture(id) {
    const i = this.s.furniture.findIndex(q => q.id === id); if (i < 0) return false;
    if (this.locked(this.s.furniture[i])) return this.fail('客人正在使用');
    this.s.storage.push({ type: this.s.furniture[i].type });
    this.s.furniture.splice(i, 1); this.afterLayout(); return true;
  }
  sellFurniture(id) {
    const i = this.s.furniture.findIndex(q => q.id === id); if (i < 0) return 0;
    if (this.locked(this.s.furniture[i])) return this.fail('客人正在使用');
    const it = D.FURNITURE[this.s.furniture[i].type];
    const back = Math.floor((it.cost || it.coupon * 500) / 2);
    this.s.furniture.splice(i, 1); this.s.gold += back; this.afterLayout(); return back;
  }
  wallSegments() {
    const out = [];
    for (let i = 0; i < this.D; i++) out.push({ side: 'L', i });
    for (let i = this.slots; i < this.W; i++) out.push({ side: 'R', i });
    return out;
  }
  canWall(side, i, ignoreId) {
    if (side === 'L' && (i < 0 || i >= this.D)) return false;
    if (side === 'R' && (i < this.slots || i >= this.W)) return false;
    return !this.s.wallItems.some(w => w.side === side && w.i === i && w.id !== ignoreId);
  }
  placeWall(type, side, i, fromStorage = -1) {
    if (!this.canWall(side, i)) return this.fail('這裡不能掛');
    if (fromStorage >= 0) this.s.storage.splice(fromStorage, 1);
    else if (!this.buyFurniture(type)) return false;
    this.s.wallItems.push({ id: uid(), type, side, i }); this.s.stats.placed++;
    this.touch(); this.h.sfx('place'); return true;
  }
  moveWall(id, side, i) { const w = this.s.wallItems.find(q => q.id === id); if (!w || !this.canWall(side, i, id)) return this.fail('這裡不能掛'); w.side = side; w.i = i; this.touch(); return true; }
  storeWall(id) { const i = this.s.wallItems.findIndex(q => q.id === id); if (i < 0) return; this.s.storage.push({ type: this.s.wallItems[i].type }); this.s.wallItems.splice(i, 1); this.touch(); }
  sellWall(id) { const i = this.s.wallItems.findIndex(q => q.id === id); if (i < 0) return 0; const it = D.FURNITURE[this.s.wallItems[i].type]; const b = Math.floor((it.cost || it.coupon * 500) / 2); this.s.wallItems.splice(i, 1); this.s.gold += b; this.touch(); return b; }
  canPendant(x, y, ignoreId) { return this.inside(x, y) && y >= 3 && !this.s.pendants.some(p => p.x === x && p.y === y && p.id !== ignoreId); }
  placePendant(type, x, y, fromStorage = -1) {
    if (!this.canPendant(x, y)) return this.fail('這裡不能掛');
    if (fromStorage >= 0) this.s.storage.splice(fromStorage, 1);
    else if (!this.buyFurniture(type)) return false;
    this.s.pendants.push({ id: uid(), type, x, y }); this.s.stats.placed++; this.touch(); this.h.sfx('place'); return true;
  }
  movePendant(id, x, y) { const p = this.s.pendants.find(q => q.id === id); if (!p || !this.canPendant(x, y, id)) return this.fail('這裡不能掛'); p.x = x; p.y = y; this.touch(); return true; }
  storePendant(id) { const i = this.s.pendants.findIndex(q => q.id === id); if (i < 0) return; this.s.storage.push({ type: this.s.pendants[i].type }); this.s.pendants.splice(i, 1); this.touch(); }
  sellPendant(id) { const i = this.s.pendants.findIndex(q => q.id === id); if (i < 0) return 0; const b = Math.floor(D.FURNITURE[this.s.pendants[i].type].cost / 2); this.s.pendants.splice(i, 1); this.s.gold += b; this.touch(); return b; }
  sellStorage(idx) { const it = this.s.storage[idx]; if (!it) return 0; const d = D.FURNITURE[it.type]; const b = Math.floor((d.cost || d.coupon * 500) / 2); this.s.storage.splice(idx, 1); this.s.gold += b; this.touch(); return b; }
  buyTheme(kind, id) {
    const table = kind === 'floor' ? D.FLOORS : D.WALLS, owned = kind === 'floor' ? this.s.ownedFloors : this.s.ownedWalls;
    const t = table[id];
    if (!owned.includes(id)) {
      if (!this.unlocked(t.lv)) return this.fail(`Lv${t.lv} 解鎖`);
      if (!this.spend(t.cost || 0, t.coupon || 0)) return false;
      owned.push(id); this.h.sfx('buy');
    }
    if (kind === 'floor') this.s.floor = id; else this.s.wall = id;
    this.touch(); return true;
  }
  afterLayout() {
    this.touch();
    const valid = new Set(this.seats().filter(q => q.ok).map(q => q.f.id));
    for (const c of this.customers) {
      if (c.seat && !valid.has(c.seat.f.id) && !['leave', 'exit', 'out'].includes(c.state)) this.custLeave(c, true);
      else if (c.path && c.path.length) this.repath(c);
    }
    for (const st of this.staffRt.values()) if (st.path.length) this.repath(st);
    this.s.messyChairs = this.s.messyChairs.filter(id => this.s.furniture.some(f => f.id === id));
    this.s.dirtyTables = this.s.dirtyTables.filter(id => this.s.furniture.some(f => f.id === id));
  }

  // ======================= 擴店 =======================
  nextExpansion() { return D.EXPANSIONS[this.s.expand + 1] || null; }
  expand() {
    const n = this.nextExpansion(); if (!n) return false;
    if (!this.unlocked(n.lv)) return this.fail(`Lv${n.lv} 才能擴店`);
    if (this.score() < n.score) return this.fail(`裝潢分數要 ${n.score} 以上`);
    if (!this.spend(n.cost)) return false;
    // 門口往外移：原本在最後一排的家具若卡到新的動線就收進倉庫
    this.s.expand++;
    for (const f of [...this.s.furniture]) if (this.reserved(f.x, f.y)) { this.s.storage.push({ type: f.type }); this.s.furniture = this.s.furniture.filter(q => q !== f); }
    for (const c of this.customers) c.dead = true;
    this.customers = [];
    this.initStaff();
    this.afterLayout(); this.h.sfx('level'); return true;
  }

  // ======================= 員工 =======================
  initStaff() {
    this.staffRt.clear();
    for (const st of this.s.staff) this.addStaffRt(st);
    this.ownerRt = { id: 'owner', x: 1.5, y: 1.5, path: [], state: 'idle', t: 0, dir: 0, back: true, wait: rnd(2, 5) };
  }
  postOf(job) { const t = D.JOBS[job].tile; return t ? { x: t[0], y: t[1] } : { x: 5, y: 4 }; }
  addStaffRt(st) {
    const p = this.postOf(st.job);
    this.staffRt.set(st.id, { id: st.id, job: st.job, x: p.x + 0.5, y: p.y + 0.5, path: [], state: 'post', t: 0, dir: 0, back: false, carry: false, task: null, busy: 0 });
  }
  staffByJob(job) { return this.s.staff.find(st => st.job === job); }
  hire(job) {
    const j = D.JOBS[job];
    if (this.staffByJob(job)) return this.fail('這個職位已經有人了');
    if (!this.unlocked(j.lv)) return this.fail(`Lv${j.lv} 開放`);
    if (!this.spend(j.cost)) return false;
    const names = ['阿凱', '小米', '思妤', '柏宇', '芸芸', '子晴', '阿寶', '詩涵', '家豪', '若涵'];
    const used = new Set(this.s.staff.map(x => x.name));
    const look = { skin: pick(D.SKINS), hair: pick(D.HAIR_COLORS.slice(0, 6)), hairStyle: pick(Object.keys(D.HAIR_STYLES)), top: 'top_white', bottom: pick(['bot_black', 'bot_khaki']), hat: 'hat_none', glasses: 'glass_none' };
    const st = { id: uid(), job, name: names.find(n => !used.has(n)) || '新店員', energy: D.ENERGY_BASE, prof: this.s.level * 2, look };
    st.energy = this.maxEnergy(st);
    this.s.staff.push(st);
    this.addStaffRt(st);
    this.touch(); this.h.sfx('level');
    return st;
  }
  dragsLeft(t = now()) { this.s.drags = this.s.drags.filter(x => t - x < D.DRAG_WINDOW); return D.DRAG_MAX - this.s.drags.length; }
  cheer(st, t = now(), quiet = false) {
    if (this.dragsLeft(t) <= 0) { if (!quiet) this.h.toast('剛剛打氣太多次了，等一下再來', 'warn'); return false; }
    const mx = this.maxEnergy(st);
    if (st.energy >= mx) { if (!quiet) this.h.toast(`${st.name}元氣滿滿！`); return false; }
    st.energy = Math.min(mx, st.energy + D.ENERGY_DRAG);
    this.s.drags.push(t); this.s.stats.drag++;
    if (!quiet) { const rt = this.staffRt.get(st.id); if (rt) this.h.floater({ x: rt.x, y: rt.y, z: 1.6 }, '+30 分', 'energy'); this.h.sfx('cheer'); }
    return true;
  }

  // ======================= 客人 =======================
  queueTile(i) { return { x: 0, y: 3 + i }; }
  queueLen() { return Math.max(1, this.D - 4); }
  inShop() { return this.customers.filter(c => !['out', 'exit'].includes(c.state)).length; }
  freeSeats() {
    const taken = new Set(this.customers.filter(c => c.seat).map(c => c.seat.f.id));
    return this.seats().filter(q => q.ok && !taken.has(q.f.id) && !this.s.messyChairs.includes(q.f.id) && !(q.table && this.s.dirtyTables.includes(q.table.id)));
  }
  spawnCustomer(regId = null) {
    const fromLeft = Math.random() < 0.5;
    const sx = fromLeft ? -2.5 : this.W + 2.5, sy = this.D + 2.5;
    const reg = regId ? D.REGULARS[regId] : null;
    const c = {
      id: uid(), kind: 'customer', look: reg ? reg.look : pick(this.lookPool), regId,
      x: sx, y: sy, path: [], state: 'walkin', t: 0, alpha: 0, dir: 0, back: false, pose: 'stand', step: 0,
      seat: null, buy: null, event: null, eventT: 0, qi: -1, drinkT: rnd(16, 30),
    };
    this.customers.push(c);
    this.routeTo(c, this.entranceOut);
    return c;
  }
  routeTo(c, tile, walk) {
    const p = this.path(c.x, c.y, (x, y) => x === tile.x && y === tile.y, walk || ((x, y) => this.custWalk(x, y)));
    c.path = p || []; c.goal = tile;
    return !!p;
  }
  repath(e) { if (e.goal) { const ok = this.routeTo(e, e.goal, e.kind === 'staff' ? (x, y) => this.staffWalk(x, y) : null); if (!ok) e.path = []; } }
  move(e, speed, dt) {
    if (!e.path.length) { e.step = 0; return true; }
    let left = speed * dt;
    while (left > 0 && e.path.length) {
      const n = e.path[0], dx = n.x - e.x, dy = n.y - e.y, dist = Math.hypot(dx, dy);
      if (dist > 0.001) this.face(e, dx, dy);
      if (dist <= left) { e.x = n.x; e.y = n.y; left -= dist; e.path.shift(); }
      else { e.x += dx / dist * left; e.y += dy / dist * left; left = 0; }
    }
    e.walkPhase = (e.walkPhase || 0) + dt * speed * 3.2;
    e.step = e.path.length ? (Math.sin(e.walkPhase * Math.PI) > 0 ? 1 : -1) : 0;
    return e.path.length === 0;
  }
  // 方向：dir 1 = 往右（+x 或 -y 在畫面上是右），back = 背對鏡頭
  face(e, dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) { e.dir = dx > 0 ? 1 : 0; e.back = dx < 0; }
    else { e.dir = dy > 0 ? 0 : 1; e.back = dy < 0; }
  }
  faceSeat(c, facing) {
    c.dir = (facing === 'px' || facing === 'nz') ? 1 : 0;
    c.back = facing === 'nx' || facing === 'nz';
  }
  custLeave(c, instant = false) {
    if (c.seat && c.state === 'sit') {
      // 離座：椅子可能歪掉、杯子去回收台
      if (Math.random() < 0.25 && !this.s.messyChairs.includes(c.seat.f.id)) { this.s.messyChairs.push(c.seat.f.id); this.touch(); }
    }
    const hadSeat = c.seat && c.state === 'sit';
    const table = c.seat && c.seat.table;
    if (c.event === 'special' && this.s.pendingSpecial && this.s.pendingSpecial.cid === c.id) this.s.pendingSpecial = null;
    c.event = null;
    if (instant) { c.state = 'exit'; c.seat = null; return; }
    if (hadSeat) {
      const ap = c.seatAp || c.seat.ap[0];
      c.x = ap.x + 0.5; c.y = ap.y + 0.5; c.pose = 'stand';
      c.seat = null;
      if (this.s.returnCups < D.RETURN_CAP) { c.state = 'toReturn'; this.routeTo(c, { x: 3, y: 3 }); }
      else { if (table && !this.s.dirtyTables.includes(table.id)) { this.s.dirtyTables.push(table.id); this.touch(); } c.state = 'leave'; this.routeTo(c, this.entranceOut); }
      return;
    }
    c.seat = null;
    c.state = 'leave'; this.routeTo(c, this.entranceOut);
  }
  updateCustomer(c, dt) {
    c.t += dt;
    const sp = 1.6;
    switch (c.state) {
      case 'walkin':
        c.alpha = Math.min(1, c.alpha + dt * 2);
        if (this.move(c, sp, dt)) {
          // 到門口：排隊
          const ql = this.customers.filter(q => q.state === 'queue' || q.state === 'toQueue').length;
          if (ql >= this.queueLen() || !this.selling()) { c.state = 'out'; this.routeTo(c, { x: pick([-3, this.W + 3]), y: this.D + 2 }); return; }
          c.state = 'toQueue'; c.qi = ql; this.routeTo(c, this.queueTile(ql));
        }
        break;
      case 'toQueue':
        if (this.move(c, sp, dt)) { c.state = 'queue'; c.back = true; c.dir = 1; c.t = 0; }
        break;
      case 'queue': {
        // 往前遞補
        const ahead = this.customers.filter(q => (q.state === 'queue' || q.state === 'toQueue' || q.state === 'order') && q !== c && q.qi < c.qi).length;
        if (ahead < c.qi) { c.qi = ahead; c.state = 'toQueue'; this.routeTo(c, this.queueTile(ahead)); break; }
        if (c.qi === 0 && !this.customers.some(q => q.state === 'order')) { c.state = 'order'; c.t = 0; c.back = true; c.dir = 1; }
        break;
      }
      case 'order': {
        const cash = this.staffByJob('cashier');
        const slow = !cash || cash.energy <= 0 ? 2.6 : 1;
        if (c.t > 2.0 * slow) {
          const b = this.purchase();
          c.qi = -1;
          if (!b) { c.mood = 'sad'; this.custLeave(c); break; }
          c.buy = b;
          this.addGold(b.gold, { x: 0.5, y: 2.5, z: 1.6 });
          this.addExp(b.exp);
          this.h.sfx('coin');
          const cr = this.staffRt.get(cash ? cash.id : '');
          if (cr) cr.busy = 0.6;
          c.state = 'toPickup'; this.routeTo(c, { x: 2, y: 3 });
        }
        break;
      }
      case 'toPickup':
        if (this.move(c, sp, dt)) { c.state = 'waitPickup'; c.t = 0; c.back = true; c.dir = 1; }
        break;
      case 'waitPickup': {
        const pu = this.staffByJob('pickup');
        const wait = pu ? (pu.energy > 0 ? 1.4 : 3.4) : 3.0;
        if (c.t > wait) {
          const pr = this.staffRt.get(pu ? pu.id : (this.staffByJob('cashier') || {}).id);
          if (pr) pr.busy = 0.8;
          c.carry = true;
          const seats = this.freeSeats();
          if (seats.length && Math.random() < 0.8) {
            const seat = pick(seats);
            c.seat = seat; c.state = 'toSeat';
            const aps = new Set(seat.ap.map(p => key(p.x, p.y)));
            const p = this.path(c.x, c.y, (x, y) => aps.has(key(x, y)), (x, y) => this.custWalk(x, y));
            if (!p) { c.seat = null; c.state = 'leave'; this.routeTo(c, this.entranceOut); break; }
            c.path = p; c.goal = null;
          } else { c.state = 'leave'; this.routeTo(c, this.entranceOut); }
        }
        break;
      }
      case 'toSeat':
        if (this.move(c, sp, dt)) {
          if (!c.seat) { c.state = 'leave'; this.routeTo(c, this.entranceOut); break; }
          c.seatAp = { x: Math.floor(c.x), y: Math.floor(c.y) };
          const f = c.seat.f;
          c.x = f.x + 0.5; c.y = f.y + 0.5; c.pose = 'sit'; c.carry = false;
          this.faceSeat(c, c.seat.facing);
          c.state = 'sit'; c.t = 0;
          // 事件
          if (c.regId && this.regularSpecialFor(c)) { /* 特別訂單 */ }
          else if (Math.random() < 0.12) { c.event = 'sleep'; c.eventT = 0; }
          else if (Math.random() < 0.12) { c.event = 'tip'; c.eventT = 0; }
        }
        break;
      case 'sit':
        c.eventT += dt;
        if (c.event === 'sleep' && c.eventT > 60) c.event = null;
        if (c.event === 'tip' && c.eventT > 25) c.event = null;
        if (c.event === 'special') {
          if (c.eventT > 180) { this.h.toast(`${D.REGULARS[c.regId].name}等太久，先走了…`, 'warn'); this.custLeave(c); }
          break;
        }
        if (c.event !== 'sleep' && c.t > c.drinkT) this.custLeave(c);
        break;
      case 'toReturn':
        if (this.move(c, sp, dt)) {
          if (this.s.returnCups < D.RETURN_CAP) this.s.returnCups++;
          c.state = 'leave'; this.routeTo(c, this.entranceOut);
        }
        break;
      case 'leave':
        if (this.move(c, sp, dt)) { c.state = 'out'; this.routeTo(c, { x: pick([-3, this.W + 3]), y: this.D + 2 + (Math.random() < 0.5 ? 1 : 0) }); }
        break;
      case 'out':
        if (this.move(c, sp, dt)) c.state = 'exit';
        break;
      case 'exit':
        c.alpha -= dt * 2; if (c.alpha <= 0) c.dead = true;
        break;
      default: break;
    }
  }
  // 點客人
  tapCustomer(id) {
    const c = this.customers.find(q => q.id === id);
    if (!c) return null;
    const pos = { x: c.x, y: c.y, z: 1.7 };
    if (c.event === 'sleep') { c.event = null; this.addGold(10 + this.s.level * 2, pos); this.addExp(1); this.s.stats.wake++; this.h.sfx('coin'); return 'wake'; }
    if (c.event === 'tip') { c.event = null; this.addGold(10 + this.s.level * 3, pos); this.s.stats.tips++; this.h.sfx('coin'); return 'tip'; }
    if (c.event === 'special') return 'special';
    return 'info';
  }
  fixChair(id) {
    const i = this.s.messyChairs.indexOf(id); if (i < 0) return false;
    this.s.messyChairs.splice(i, 1); this.addExp(1); this.s.stats.chairFix++;
    const f = this.s.furniture.find(q => q.id === id); if (f) this.h.floater({ x: f.x + 0.5, y: f.y + 0.5, z: 1.1 }, '+1', 'exp');
    this.touch(); this.h.sfx('place'); return true;
  }
  cleanTable(id) {
    const i = this.s.dirtyTables.indexOf(id); if (i < 0) return false;
    this.s.dirtyTables.splice(i, 1); this.addExp(1);
    const f = this.s.furniture.find(q => q.id === id); if (f) this.h.floater({ x: f.x + 0.5, y: f.y + 0.5, z: 1.2 }, '+1', 'exp');
    this.touch(); this.h.sfx('place'); return true;
  }

  // ======================= 員工行為 =======================
  updateStaff(rt, dt) {
    const st = this.s.staff.find(q => q.id === rt.id);
    if (!st) return;
    rt.busy = Math.max(0, rt.busy - dt);
    rt.tired = st.energy <= 0;
    const post = this.postOf(st.job);
    const staffWalk = (x, y) => this.staffWalk(x, y);
    switch (st.job) {
      case 'cashier': case 'pickup':
        rt.back = false; rt.dir = 0;
        rt.pose = rt.busy > 0 ? 'carry' : 'stand';
        break;
      case 'recycle':
        if (!rt.tired && this.s.returnCups > 0) {
          rt.work = (rt.work || 0) + dt;
          rt.pose = 'carry';
          if (rt.work > 2.6) { rt.work = 0; this.s.returnCups--; }
        } else rt.pose = 'stand';
        break;
      case 'cleaner': {
        if (rt.tired) { rt.pose = 'stand'; break; }
        if (!rt.task) {
          const chairId = this.s.messyChairs[0], tableId = this.s.dirtyTables[0];
          const target = chairId ? { type: 'chair', id: chairId } : tableId ? { type: 'table', id: tableId } : null;
          if (target) {
            const f = this.s.furniture.find(q => q.id === target.id);
            if (!f) { this.afterLayout(); break; }
            const p = this.path(rt.x, rt.y, (x, y) => Math.abs(x - f.x) + Math.abs(y - f.y) === 1 && this.staffWalk(x, y), staffWalk);
            if (p) { rt.task = target; rt.path = p; }
            else { rt.task = null; }
          } else if (rt.path.length === 0) {
            rt.idleT = (rt.idleT || 0) + dt;
            if (rt.idleT > 4) {
              rt.idleT = 0;
              const tiles = [];
              for (let x = 1; x < this.W; x++) for (let y = 3; y < this.D; y++) if (this.staffWalk(x, y) && !this.reserved(x, y)) tiles.push({ x, y });
              if (tiles.length) { const t = pick(tiles); const p = this.path(rt.x, rt.y, (x, y) => x === t.x && y === t.y, staffWalk); if (p) rt.path = p; }
            }
          }
        }
        if (this.move(rt, 1.5, dt) && rt.task) {
          rt.work = (rt.work || 0) + dt; rt.pose = 'carry';
          if (rt.work > 1.6) {
            rt.work = 0; rt.pose = 'stand';
            if (rt.task.type === 'chair') { const i = this.s.messyChairs.indexOf(rt.task.id); if (i >= 0) { this.s.messyChairs.splice(i, 1); this.touch(); } }
            else { const i = this.s.dirtyTables.indexOf(rt.task.id); if (i >= 0) { this.s.dirtyTables.splice(i, 1); this.touch(); } }
            if (Math.random() < 0.25) this.addGold(60, { x: rt.x, y: rt.y, z: 1.6 });
            rt.task = null;
          }
        } else if (!rt.task) rt.pose = 'stand';
        break;
      }
      default: break;
    }
    void post;
  }
  // 店長在吧台後面走動、操作機器
  updateOwner(dt) {
    const o = this.ownerRt;
    if (!o) return;
    // 沒有回收員時，店長偶爾自己整理回收台
    if (!this.staffByJob('recycle') && this.s.returnCups > 0) { o.recT = (o.recT || 0) + dt; if (o.recT > 9) { o.recT = 0; this.s.returnCups--; } }
    if (this.move(o, 1.4, dt)) {
      o.wait -= dt;
      o.pose = o.working ? 'carry' : 'stand';
      if (o.wait <= 0) {
        const busy = this.s.machines.filter(m => m.job && this.status(m).st === 'run');
        const target = busy.length && Math.random() < 0.75 ? pick(busy).slot : Math.floor(rnd(1, Math.max(this.slots, 4)));
        o.working = busy.length > 0;
        const p = this.path(o.x, o.y, (x, y) => x === target && y === 1, (x, y) => y === 1 && x >= 0 && x <= Math.max(this.slots, 4));
        o.path = p || [];
        o.wait = rnd(3, 7);
        if (!o.path.length) { o.back = true; }
      }
      if (!o.path.length) { o.back = true; o.dir = 1; }
    }
  }

  // ======================= 路人與招攬 =======================
  regularCandidates() {
    return D.REGULAR_ORDER.filter(id => this.unlocked(D.REGULARS[id].lv) && !this.s.regulars[id].recruited);
  }
  spawnPasser() {
    const fromLeft = Math.random() < 0.5;
    const W = this.W, H = this.D;
    // 沿著店前的步道走過去
    const lane = H + 2 + (Math.random() < 0.5 ? 0 : 1);
    const pts = fromLeft ? [{ x: -3.5, y: lane + 0.5 }, { x: W + 2.5, y: lane + 0.5 }, { x: W + 2.5, y: -0.5 }] : [{ x: W + 2.5, y: -0.5 }, { x: W + 2.5, y: lane + 0.5 }, { x: -3.5, y: lane + 0.5 }];
    const cands = this.regularCandidates().filter(id => !this.passers.some(p => p.regId === id));
    let regId = null;
    if (cands.length && Math.random() < 0.35) regId = pick(cands);
    const interested = regId || (Math.random() < 0.5 && this.passers.filter(p => p.interested).length < 2);
    const p = {
      id: uid(), kind: 'passer', regId, look: regId ? D.REGULARS[regId].look : randomLook(),
      trait: regId ? null : pick(Object.keys(D.PASSERBY_TYPES)), interested: !!interested,
      x: pts[0].x, y: pts[0].y, path: pts.slice(1).map(q => ({ ...q })), alpha: 0, dir: 0, back: false, step: 0, pose: 'stand', t: 0, paused: false,
    };
    // 中間會停下來看看店裡
    if (p.interested) {
      const stopX = rnd(1, W - 1);
      const route = [];
      const a = pts[0], b = pts[1];
      if (a.y === b.y) route.push({ x: stopX, y: a.y }, ...pts.slice(1));
      else route.push(...pts.slice(1));
      p.path = route; p.stopAt = 0; p.stopT = rnd(14, 22);
    }
    this.passers.push(p);
  }
  updatePassers(dt) {
    this.passerT -= dt;
    if (this.passerT <= 0) { this.passerT = rnd(4, 9); if (this.passers.length < 5) this.spawnPasser(); }
    for (const p of this.passers) {
      p.t += dt;
      p.alpha = Math.min(1, p.alpha + dt * 1.5);
      if (p.talking) { p.step = 0; continue; }
      if (p.stopT && p.path.length && p.stopAt === 0 && Math.abs(p.x - p.path[0].x) < 0.05 && Math.abs(p.y - p.path[0].y) < 0.05) { /* noop */ }
      if (p.waiting > 0) { p.waiting -= dt; p.step = 0; p.back = true; p.dir = 1; if (p.waiting <= 0) p.interested = p.regId ? p.interested : false; continue; }
      const before = p.path.length;
      const done = this.move(p, 1.25, dt);
      if (p.stopT && before !== p.path.length && p.path.length === before - 1 && p.stopAt === 0) { p.stopAt = 1; p.waiting = p.stopT; }
      if (done) p.dead = true;
    }
    this.passers = this.passers.filter(p => !p.dead);
  }
  regenFlyers(t = now()) {
    const s = this.s;
    if (s.flyers >= D.FLYER_MAX) { s.flyerT = t; return; }
    while (s.flyers < D.FLYER_MAX && t - s.flyerT >= D.FLYER_REGEN) { s.flyers++; s.flyerT += D.FLYER_REGEN; }
    if (s.flyers >= D.FLYER_MAX) s.flyerT = t;
  }
  quizFor(p) {
    if (p.regId) { const q = D.REGULARS[p.regId].quiz.slice().sort(() => Math.random() - 0.5).slice(0, 3); return q; }
    return D.PASSERBY_TYPES[p.trait].quiz;
  }
  beginTalk(p) {
    if (this.s.flyers <= 0) return this.fail('傳單發完了，等一下會再補');
    if (this.s.flyers >= D.FLYER_MAX) this.s.flyerT = now();
    this.s.flyers--; this.s.stats.recruitTry++;
    p.talking = true;
    return true;
  }
  // 招攬結果；ok = 三題全對
  recruitResult(p, ok) {
    p.talking = false; p.interested = false; p.waiting = 0;
    const pos = { x: p.x, y: p.y, z: 1.7 };
    if (!ok) { this.addGold(10, pos); return { ok: false }; }
    this.s.stats.recruitOk++;
    this.addGold(50, pos); this.addExp(3);
    if (p.regId) {
      const r = this.s.regulars[p.regId], d = D.REGULARS[p.regId];
      r.met++;
      if (r.met >= d.need && !r.recruited) { r.recruited = true; r.nextVisit = now() + 60; this.h.sfx('level'); return { ok: true, regular: p.regId, done: true }; }
      return { ok: true, regular: p.regId, done: false, left: d.need - r.met };
    }
    return { ok: true };
  }

  // ======================= 常客 =======================
  recruitedRegulars() { return D.REGULAR_ORDER.filter(id => this.s.regulars[id].recruited); }
  regularDue(t = now()) {
    return this.recruitedRegulars().filter(id => this.s.regulars[id].nextVisit <= t && !this.customers.some(c => c.regId === id));
  }
  pickSpecial(regId) {
    const opts = D.REGULARS[regId].orders.filter(o => this.recipeOpen(o.recipe));
    return opts.length ? pick(opts) : null;
  }
  regularSpecialFor(c) {
    const r = this.s.regulars[c.regId];
    r.visits++;
    this.friendAdd(c.regId, 1);
    r.nextVisit = now() + rnd(20, 50) * 60;
    if (this.s.pendingSpecial) return false;
    const o = this.pickSpecial(c.regId);
    if (!o) return false;
    c.event = 'special'; c.eventT = 0;
    this.s.pendingSpecial = { cid: c.id, regId: c.regId, recipe: o.recipe, hint: o.hint };
    this.h.event('special', { regId: c.regId });
    return true;
  }
  friendLevel(id) { const f = this.s.regulars[id].friend; let l = 0; D.FRIEND_LV.forEach((q, i) => { if (f >= q.need) l = i + 1; }); return l; }
  friendAdd(id, n) {
    const r = this.s.regulars[id];
    const before = this.friendLevel(id);
    r.friend += n;
    const after = this.friendLevel(id);
    if (after > before && after > r.rewarded) {
      r.rewarded = after;
      const rw = D.FRIEND_LV[after - 1].reward;
      this.give(rw);
      this.h.toast(`${D.REGULARS[id].name}和你變成「${D.FRIEND_LV[after - 1].label}」了！收到禮物`, 'good');
    }
  }
  // 特別訂單完成：choice 為玩家選的配方，grade 為手作評價
  finishSpecial(choice, grade) {
    const ps = this.s.pendingSpecial;
    if (!ps) return null;
    const c = this.customers.find(q => q.id === ps.cid);
    const correct = choice === ps.recipe;
    const mult = { perfect: 1.6, great: 1.3, good: 1, bad: 0.5 }[grade] || 1;
    let res;
    if (correct) {
      const gold = Math.round((200 + this.s.level * 20) * mult);
      this.addGold(gold, c ? { x: c.x, y: c.y, z: 1.8 } : null);
      this.addExp(Math.round(10 * mult));
      this.friendAdd(ps.regId, grade === 'perfect' ? 4 : 3);
      this.s.stats.special++;
      res = { correct: true, gold };
    } else res = { correct: false };
    this.s.pendingSpecial = null;
    if (c) { c.event = null; c.drinkT = c.t + 8; c.mood = correct ? 'happy' : 'sad'; }
    return res;
  }
  summonRegular(id) {
    if (!this.s.regulars[id].recruited) return false;
    if (this.customers.some(c => c.regId === id)) return this.fail('他已經在店裡了');
    if (!this.spend(0, 3)) return false;
    this.s.regulars[id].nextVisit = 0;
    this.spawnCustomer(id);
    return true;
  }

  // ======================= 鄰居與幸運草 =======================
  neighborState(id, t = now()) {
    const n = this.s.neighbors[id], day = gameDay(t * 1000);
    if (n.day !== day) { n.day = day; n.helps = 0; }
    return n;
  }
  helpsLeft(id) { return D.HELPS_PER_DAY - this.neighborState(id).helps; }
  help(id, spot) {
    const n = this.neighborState(id);
    if (n.helps >= D.HELPS_PER_DAY) return this.fail('今天已經幫過三次了');
    n.helps++; n.friend++; this.s.stats.help++;
    const lv = this.s.level;
    const kind = spot || pick(['beans', 'gold', 'energy']);
    let reward;
    if (kind === 'beans') reward = { beans: 30 + lv * 6 };
    else if (kind === 'gold') reward = { gold: 80 + lv * 15 };
    else { reward = { energy: 30 }; for (const st of this.s.staff) st.energy = Math.min(this.maxEnergy(st), st.energy + 30); }
    this.give(reward); this.addExp(2);
    return reward;
  }
  cloversPending(id, t = now()) { const n = this.s.neighbors[id]; return Math.min(3, Math.floor((t - n.cloverIn) / D.CLOVER_FROM_NEIGHBOR)); }
  takeClovers(t = now()) {
    let total = 0;
    for (const id of D.NEIGHBOR_ORDER) {
      const k = this.cloversPending(id, t);
      if (k > 0) { total += k; const n = this.s.neighbors[id]; n.cloverIn = k >= 3 ? t : n.cloverIn + k * D.CLOVER_FROM_NEIGHBOR; }
    }
    this.s.clovers += total;
    return total;
  }
  canSendClover(id, t = now()) { return t - this.s.neighbors[id].sentAt >= D.CLOVER_SEND_CD; }
  sendClover(id, t = now()) {
    if (!this.canSendClover(id, t)) return false;
    this.s.neighbors[id].sentAt = t; this.s.neighbors[id].friend++;
    this.s.stats.cloverSend++; this.addExp(2);
    return true;
  }
  openCloverBox() {
    if (this.s.clovers < D.CLOVER_BOX) return null;
    this.s.clovers -= D.CLOVER_BOX;
    const lv = this.s.level;
    const r = pick([{ gold: 400 + lv * 80 }, { beans: 200 + lv * 40 }, { coupon: 1 }, { gold: 300 + lv * 50, beans: 100 + lv * 20 }]);
    this.give(r);
    return r;
  }

  // ======================= 每日 =======================
  dailyCheck(t = now()) {
    const day = gameDay(t * 1000);
    if (this.s.loginDay === day) return null;
    const first = !this.s.loginDay;
    this.s.loginDay = day;
    for (const st of this.s.staff) { st.prof = (st.prof || 0) + 2; st.energy = this.maxEnergy(st); }
    const bonus = first ? 0 : 200 + this.s.level * 50;
    this.s.gold += bonus;
    return { bonus };
  }

  // ======================= 主迴圈 =======================
  tick(dt) {
    this.t += dt;
    const s = this.s, t = now();
    // 員工元氣（每分鐘 -1）
    for (const st of s.staff) st.energy = Math.max(0, st.energy - dt / 60);
    this.regenFlyers(t);
    // 來客
    if (this.selling(t)) {
      this.spawnAcc += dt * this.rate() / 60;
      if (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        if (this.inShop() < this.cap()) {
          const due = this.regularDue(t);
          this.spawnCustomer(due.length ? due[0] : null);
        }
      }
    } else this.spawnAcc = 0;
    for (const c of this.customers) this.updateCustomer(c, dt);
    this.customers = this.customers.filter(c => !c.dead);
    for (const rt of this.staffRt.values()) this.updateStaff(rt, dt);
    this.updateOwner(dt);
    this.updatePassers(dt);
    s.lastTick = t;
  }

  // ======================= 離線經營 =======================
  // 從上次存檔時間跑到現在（以 60 秒為一步），自動功能照常作用
  offline(auto, tNow = now()) {
    const s = this.s;
    let t = s.lastTick || tNow;
    const total = Math.min(D.OFFLINE_MAX, tNow - t);
    if (total < 30) { s.lastTick = tNow; return null; }
    t = tNow - total;
    const sum = { secs: total, gold: 0, sold: 0, sides: 0, meals: 0, beans: 0, burnt: 0 };
    const g0 = s.gold, b0 = s.beans, sold0 = s.stats.sold, side0 = s.stats.sideSold, meal0 = s.stats.mealSold, burnt0 = s.stats.burnt;
    let acc = 0;
    const step = 60;
    for (let k = 0; t < tNow; k++) {
      const dt = Math.min(step, tNow - t);
      t += dt;
      for (const st of s.staff) st.energy = Math.max(0, st.energy - dt / 60);
      this.regenFlyers(t);
      if (auto) auto.run(t, true);
      // 自動收成關閉時，烤焦的東西要記下來
      for (const m of s.machines) if (m.job && this.status(m, t).st === 'burnt' && m.job.kind !== 'brew') { if (!auto || !auto.wants(m)) { this.collect(m, t, true); } }
      acc += this.rate() * D.OFFLINE_RATE * dt / 60;
      while (acc >= 1) {
        acc -= 1;
        const b = this.purchase(t);
        if (!b) { acc = 0; break; }
        s.gold += b.gold; s.stats.earned += b.gold; this.addExp(b.exp);
      }
    }
    s.lastTick = tNow;
    sum.gold = s.gold - g0; sum.beans = s.beans - b0; sum.sold = s.stats.sold - sold0; sum.sides = s.stats.sideSold - side0; sum.meals = s.stats.mealSold - meal0; sum.burnt = s.stats.burnt - burnt0;
    this.touch();
    return sum;
  }
}
