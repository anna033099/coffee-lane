// 擴充玩法（參考 Hello Seafood 2 類型的延伸系統，內容原創）
// 外送訂單、每週任務與賽季、店鋪評鑑、愛心食物銀行、幸運轉盤、2 樓甜點區
import * as D from './data.js';
import { now, gameDay } from './state.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const uid = () => Math.random().toString(36).slice(2, 9);

// 解鎖等級
export const LV = { delivery: 8, weekly: 6, rating: 4, bank: 12, lottery: 5, floor2: 25 };

export function ensureExtra(s) {
  s.delivery = s.delivery || { orders: [], done: 0, pts: 0 };
  s.weekly = s.weekly || { week: '', list: [] };
  s.season = s.season || { id: '', sp: 0, claimed: [] };
  s.rating = s.rating || { claimed: 0 };
  s.bank = s.bank || { love: 0, day: '', today: 0, dayBonus: false, bought: {} };
  s.lottery = s.lottery || { day: '', free: 1, tickets: 0 };
  s.floor2 = s.floor2 || { open: false };
  for (const k of ['delivered', 'donated', 'spins', 'weeklyDone']) if (s.stats[k] == null) s.stats[k] = 0;
}

// ================= 物品庫存（外送、捐贈共用） =================
export function itemName(kind, id) { return (kind === 'drink' ? D.RECIPES : kind === 'side' ? D.SIDES : D.MEALS)[id].name; }
export function itemPrice(g, kind, id) { return kind === 'drink' ? g.price(id) : kind === 'side' ? D.SIDES[id].price : D.MEALS[id].price; }
export function stockOf(g, kind, id, t = now()) {
  const s = g.s;
  if (kind === 'drink') return s.machines.filter(m => m.job && m.job.kind === 'brew' && m.job.item === id && g.status(m, t).st === 'sell').reduce((a, m) => a + m.job.sellLeft, 0);
  if (kind === 'side') return s.showcase[id] || 0;
  return Object.values(s.meals).filter(b => b.item === id).reduce((a, b) => a + b.n, 0);
}
function take(g, kind, id, n, t = now()) {
  const s = g.s;
  if (kind === 'drink') {
    for (const m of s.machines) {
      if (!n) break;
      if (!(m.job && m.job.kind === 'brew' && m.job.item === id && g.status(m, t).st === 'sell')) continue;
      const k = Math.min(n, m.job.sellLeft); m.job.sellLeft -= k; n -= k; s.recipes[id].sold += k;
      if (m.job.sellLeft <= 0) m.job = null;
    }
  } else if (kind === 'side') { s.showcase[id] -= n; if (s.showcase[id] <= 0) delete s.showcase[id]; }
  else {
    for (const [k, b] of Object.entries(s.meals)) { if (!n) break; if (b.item !== id) continue; const q = Math.min(n, b.n); b.n -= q; n -= q; if (!b.n) delete s.meals[k]; }
  }
  g.touch();
}
// 目前可以做的品項
export function makeable(g) {
  const s = g.s, out = [];
  for (const id of D.RECIPE_ORDER) if (g.recipeOpen(id) && s.recipes[id].trained) out.push(['drink', id]);
  const has = mac => s.machines.some(m => g.mdef(m).machine === mac);
  for (const id of D.SIDE_ORDER) if (s.level >= D.SIDES[id].lv && has(D.SIDES[id].machine)) out.push(['side', id]);
  for (const id of D.MEAL_ORDER) if (s.level >= D.MEALS[id].lv && has(D.MEALS[id].machine)) out.push(['meal', id]);
  return out;
}

// ================= 外送 =================
const CLIENTS = [
  ['巷尾書店', '#7a5a3a'], ['三樓設計工作室', '#4f8a78'], ['街角花藝', '#c9708a'], ['河堤瑜珈教室', '#6a8ab0'], ['老鐘錶行', '#8a6a4a'],
  ['轉角攝影棚', '#3a3a48'], ['音樂教室', '#a8603a'], ['社區托嬰中心', '#e0a03a'], ['港口辦公室', '#2c3a56'], ['舊公寓的林家', '#8fa696'],
  ['大學社團辦公室', '#b85a4a'], ['醫院護理站', '#5a9ab0'], ['電影院售票口', '#7a3a4a'], ['美術館服務台', '#9a8a6a'],
];
export const DELIVERY_SLOTS = 3;
export function deliveryTick(g, t = now()) {
  const s = g.s;
  if (s.level < LV.delivery) return;
  const d = s.delivery;
  while (d.orders.length < DELIVERY_SLOTS) d.orders.push({ id: uid(), empty: true, ready: t });
  for (let i = 0; i < d.orders.length; i++) {
    const o = d.orders[i];
    if (o.empty && t >= o.ready) { const n = newOrder(g, t); if (n) d.orders[i] = n; }
    else if (!o.empty && t > o.until) d.orders[i] = { id: uid(), empty: true, ready: t + 60 };
  }
}
function newOrder(g, t) {
  const can = makeable(g);
  if (!can.length) return null;
  const s = g.s, n = Math.min(can.length, s.level < 15 ? 2 : 3);
  const items = [];
  const pool = can.slice().sort(() => Math.random() - 0.5);
  for (const [kind, id] of pool) {
    if (items.length >= n) break;
    const q = Math.round(rnd(2, 3 + s.level / 6));
    items.push([kind, id, q]);
  }
  const value = items.reduce((a, [k, id, q]) => a + itemPrice(g, k, id) * q, 0);
  const [who, color] = pick(CLIENTS);
  const far = Math.random();
  return { id: uid(), who, color, items, until: t + 3 * 3600, far: far < 0.5 ? 0 : far < 0.85 ? 1 : 2, reward: { gold: Math.round(value * (1.6 + far * 0.6)), exp: Math.round(value / 6) + 5, pts: 1 + Math.round(far * 2) } };
}
export function canDeliver(g, o) { return !o.empty && o.items.every(([k, id, q]) => stockOf(g, k, id) >= q); }
export function deliver(g, i) {
  const s = g.s, d = s.delivery, o = d.orders[i];
  if (!o || !canDeliver(g, o)) return null;
  for (const [k, id, q] of o.items) take(g, k, id, q);
  g.give({ gold: o.reward.gold, exp: o.reward.exp });
  d.pts += o.reward.pts; d.done++; s.stats.delivered++;
  if (Math.random() < 0.25) s.lottery.tickets++;
  d.orders[i] = { id: uid(), empty: true, ready: now() + rnd(240, 720) };
  g.touch();
  return o.reward;
}
export function skipOrder(g, i) { const d = g.s.delivery; d.orders[i] = { id: uid(), empty: true, ready: now() + 300 }; g.touch(); }
// 外送騎士等級：完成越多單，獎勵越多
export function riderLevel(g) { return Math.min(10, 1 + Math.floor(Math.sqrt(g.s.delivery.done / 3))); }

// ================= 每週任務 + 賽季 =================
const SEASON_NAMES = ['冬日可可季', '莓果戀愛季', '櫻花季', '春茶季', '初夏芒果季', '梅雨咖啡季', '夏日冰沙季', '海風祭', '秋日栗子季', '南瓜派對季', '感恩烘焙季', '聖誕甜點季'];
export const SEASON_TIERS = 20, SP_PER_TIER = 25;
const WEEKLY_POOL = [
  { key: 'sold', name: '賣出飲品', t: lv => 400 + lv * 60, sp: 15 },
  { key: 'sideSold', name: '賣出甜點', t: lv => 120 + lv * 20, sp: 15, lv: 5 },
  { key: 'mealSold', name: '賣出料理', t: lv => 60 + lv * 10, sp: 15, lv: 8 },
  { key: 'delivered', name: '完成外送', t: lv => 8 + Math.floor(lv / 4), sp: 20, lv: 8 },
  { key: 'recruitOk', name: '成功招攬路人', t: () => 10, sp: 12 },
  { key: 'help', name: '幫鄰居的忙', t: () => 15, sp: 12, lv: 3 },
  { key: 'roastCollect', name: '收成烘豆', t: lv => 25 + lv, sp: 10 },
  { key: 'donated', name: '捐贈愛心餐點', t: lv => 40 + lv * 2, sp: 15, lv: 12 },
  { key: 'tips', name: '收到小費', t: () => 30, sp: 10 },
  { key: 'special', name: '完成常客特別訂單', t: () => 5, sp: 15, lv: 6 },
];
function weekKey(t = Date.now()) {
  const d = new Date(t - 6 * 3600 * 1000);
  const day = (d.getDay() + 6) % 7; // 週一 = 0
  d.setDate(d.getDate() - day);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function seasonKey(t = Date.now()) { const d = new Date(t - 6 * 3600 * 1000); return d.getFullYear() + '-' + (d.getMonth() + 1); }
export function seasonName(t = Date.now()) { const d = new Date(t - 6 * 3600 * 1000); return SEASON_NAMES[d.getMonth()]; }
export function seasonEnds(t = Date.now()) { const d = new Date(t - 6 * 3600 * 1000); const e = new Date(d.getFullYear(), d.getMonth() + 1, 1, 6); return Math.max(0, (e.getTime() - t) / 1000); }
export function ensureWeekly(g) {
  const s = g.s, w = s.weekly, wk = weekKey();
  if (w.week !== wk || !w.list.length) {
    const pool = WEEKLY_POOL.filter(p => !p.lv || s.level >= p.lv).sort(() => Math.random() - 0.5).slice(0, 6);
    w.week = wk;
    w.list = pool.map(p => ({ key: p.key, name: p.name, target: p.t(s.level), base: s.stats[p.key] || 0, sp: p.sp, claimed: false }));
  }
  const sk = seasonKey();
  if (s.season.id !== sk) { s.season.id = sk; s.season.sp = 0; s.season.claimed = []; }
  return w;
}
export function weeklyProgress(g, it) { return Math.min(it.target, (g.s.stats[it.key] || 0) - it.base); }
export function claimWeekly(g, i) {
  const w = ensureWeekly(g), it = w.list[i];
  if (!it || it.claimed || weeklyProgress(g, it) < it.target) return false;
  it.claimed = true; g.s.season.sp += it.sp; g.s.stats.weeklyDone++; g.touch(); return true;
}
export function addSP(g, n) { ensureWeekly(g); g.s.season.sp += n; }
export function seasonReward(tier) {
  if (tier === 10 || tier === 20) return { coupon: 10, gold: 5000 * tier, ticket: 3 };
  if (tier % 5 === 0) return { coupon: 4, ticket: 1 };
  if (tier % 2) return { gold: 800 + tier * 400 };
  return { beans: 300 + tier * 150, ticket: tier % 4 === 0 ? 1 : 0 };
}
export function claimSeason(g, tier) {
  const se = g.s.season;
  if (se.claimed.includes(tier) || se.sp < tier * SP_PER_TIER) return null;
  const r = seasonReward(tier);
  se.claimed.push(tier); g.give(r); if (r.ticket) g.s.lottery.tickets += r.ticket;
  g.touch(); return r;
}

// ================= 店鋪評鑑 =================
export const RATING = [
  { recipes: 8, score: 50, regulars: 1, staff: 2, stars3: 0, reward: { coupon: 3, gold: 2000 } },
  { recipes: 25, score: 140, regulars: 3, staff: 3, stars3: 3, reward: { coupon: 6, gold: 8000 } },
  { recipes: 50, score: 280, regulars: 5, staff: 4, stars3: 8, reward: { coupon: 10, gold: 25000 } },
  { recipes: 85, score: 450, regulars: 8, staff: 4, stars3: 16, reward: { coupon: 15, gold: 60000 } },
  { recipes: 130, score: 650, regulars: 10, staff: 4, stars3: 28, reward: { coupon: 25, gold: 150000 } },
];
export const RATING_BONUS = 0.03; // 每顆評鑑星：所有售價 +3%
export function ratingStats(g) {
  const s = g.s;
  return {
    recipes: D.RECIPE_ORDER.filter(id => s.recipes[id].trained).length + Object.keys(s.cooked || {}).length,
    score: g.score(),
    regulars: D.REGULAR_ORDER.filter(id => s.regulars[id].recruited).length,
    staff: s.staff.length,
    stars3: D.RECIPE_ORDER.filter(id => s.recipes[id].stars >= 3).length,
  };
}
export const RATING_LABEL = { recipes: '已獲得食譜', score: '裝潢分數', regulars: '常客人數', staff: '員工人數', stars3: '三星飲品' };
export function ratingReady(g) {
  const i = g.s.rating.claimed; if (i >= RATING.length) return false;
  const st = ratingStats(g), need = RATING[i];
  return Object.keys(RATING_LABEL).every(k => st[k] >= need[k]);
}
export function claimRating(g) {
  if (!ratingReady(g)) return null;
  const r = RATING[g.s.rating.claimed].reward;
  g.s.rating.claimed++; g.give(r); g.touch(); return r;
}

// ================= 愛心食物銀行 =================
export const BANK_DAILY = 30;
export const BANK_SHOP = [
  { id: 'coupon', name: '咖啡券 ×1', cost: 60, give: { coupon: 1 } },
  { id: 'beans', name: '咖啡豆 ×2000', cost: 40, give: { beans: 2000 } },
  { id: 'ticket', name: '轉盤券 ×1', cost: 50, ticket: 1 },
  { id: 'heart', name: '愛心招牌（人氣 +）', cost: 400, once: true, furniture: 'sign_heart' },
];
export function bankLevel(g) { return Math.min(10, Math.floor(Math.sqrt(g.s.stats.donated / 20))); }
export function bankDay(g) { const b = g.s.bank, d = gameDay(); if (b.day !== d) { b.day = d; b.today = 0; b.dayBonus = false; } return b; }
export function donate(g, kind, id, n) {
  const have = stockOf(g, kind, id); n = Math.min(n, have);
  if (n <= 0 || kind === 'drink') return 0;
  take(g, kind, id, n);
  const love = n * Math.max(1, Math.round(itemPrice(g, kind, id) / 12));
  const b = bankDay(g); g.s.bank.love += love; b.today += n; g.s.stats.donated += n; g.addExp(n);
  g.touch(); return love;
}
export function claimBankDay(g) { const b = bankDay(g); if (b.dayBonus || b.today < BANK_DAILY) return null; b.dayBonus = true; const r = { coupon: 1, gold: 1000 + g.s.level * 150 }; g.give(r); g.s.bank.love += 20; return r; }
export function buyBank(g, it) {
  const b = g.s.bank; if (b.love < it.cost || (it.once && b.bought[it.id])) return false;
  b.love -= it.cost; if (it.give) g.give(it.give); if (it.ticket) g.s.lottery.tickets += it.ticket;
  if (it.once) b.bought[it.id] = 1;
  if (it.furniture) g.s.storage.push({ id: uid(), type: it.furniture, rot: 0 });
  g.touch(); return true;
}

// ================= 幸運轉盤 =================
export const WHEEL = [
  { label: '金幣', w: 26, r: lv => ({ gold: 500 + lv * 120 }) },
  { label: '咖啡豆', w: 22, r: lv => ({ beans: 400 + lv * 80 }) },
  { label: '大把金幣', w: 8, r: lv => ({ gold: 3000 + lv * 500 }) },
  { label: '咖啡券', w: 10, r: () => ({ coupon: 2 }) },
  { label: '經驗值', w: 16, r: lv => ({ exp: 20 + lv * 8 }) },
  { label: '員工打氣', w: 10, r: () => ({ energy: 1 }) },
  { label: '大獎', w: 3, r: () => ({ coupon: 10 }) },
  { label: '轉盤券', w: 5, r: () => ({ ticket: 1 }) },
];
export const SPIN_COUPON = 3;
export function lotteryDay(g) { const L = g.s.lottery, d = gameDay(); if (L.day !== d) { L.day = d; L.free = 1; } return L; }
export function spin(g, pay) {
  const L = lotteryDay(g), s = g.s;
  if (pay === 'free') { if (!L.free) return null; L.free = 0; }
  else if (pay === 'ticket') { if (L.tickets <= 0) return null; L.tickets--; }
  else { if (s.coupons < SPIN_COUPON) return null; s.coupons -= SPIN_COUPON; }
  const tot = WHEEL.reduce((a, w) => a + w.w, 0);
  let x = Math.random() * tot, i = 0;
  for (; i < WHEEL.length; i++) { x -= WHEEL[i].w; if (x <= 0) break; }
  i = Math.min(i, WHEEL.length - 1);
  const r = WHEEL[i].r(s.level);
  if (r.energy) { for (const st of s.staff) st.energy = g.maxEnergy(st); }
  if (r.ticket) L.tickets += r.ticket;
  g.give(r); s.stats.spins++; g.touch();
  return { i, r };
}

// ================= 2 樓甜點區 =================
export const FLOOR2_COST = 150000;
export const FLOOR2_SLOTS = 4;
export const FLOOR2_SLOT0 = 100; // 2 樓的機器格號從 100 開始
export function openFloor2(g) {
  const s = g.s;
  if (s.floor2.open || s.level < LV.floor2 || s.gold < FLOOR2_COST) return false;
  s.gold -= FLOOR2_COST; s.floor2.open = true; g.touch(); return true;
}
export function floor2Machines(g) { return g.s.machines.filter(m => m.slot >= FLOOR2_SLOT0); }

// ================= 加成 =================
export function priceMult(g) { return 1 + RATING_BONUS * (g.s.rating ? g.s.rating.claimed : 0); }
export function rateMult(g) { return 1 + (g.s.floor2 && g.s.floor2.open ? 0.2 : 0) + 0.015 * bankLevel(g); }

// 主迴圈呼叫
export function extraTick(g, t = now()) {
  ensureExtra(g.s);
  deliveryTick(g, t);
}
// 給徽章用：可以處理的事情數量
export function extraBadges(g) {
  const s = g.s; ensureExtra(s);
  const out = {};
  out.delivery = s.level >= LV.delivery ? s.delivery.orders.filter(o => canDeliver(g, o)).length : 0;
  if (s.level >= LV.weekly) { const w = ensureWeekly(g); out.weekly = w.list.filter(it => !it.claimed && weeklyProgress(g, it) >= it.target).length + Array.from({ length: SEASON_TIERS }, (_, i) => i + 1).filter(t => s.season.sp >= t * SP_PER_TIER && !s.season.claimed.includes(t)).length; }
  out.rating = s.level >= LV.rating && ratingReady(g) ? 1 : 0;
  out.lottery = s.level >= LV.lottery ? (lotteryDay(g).free ? 1 : 0) + s.lottery.tickets : 0;
  out.bank = s.level >= LV.bank && bankDay(g).today >= BANK_DAILY && !s.bank.dayBonus ? 1 : 0;
  return out;
}
