// 存檔結構、讀寫、匯出匯入（v2）
import { RECIPE_ORDER, REGULAR_ORDER, NEIGHBOR_ORDER, ENERGY_BASE, FLYER_MAX } from './data.js';

const KEY = 'coffeelane.save.v2';
export const SAVE_VERSION = 2;

let _uid = 1;
export function uid() { return 'u' + Date.now().toString(36) + (_uid++).toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
export function now() { return Date.now() / 1000; }
// 遊戲日：每天早上 6 點換日
export function gameDay(t = Date.now()) {
  const d = new Date(t - 6 * 3600 * 1000);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

export const OWNER_LOOK = { skin: '#f6d9c3', hair: '#4a2f22', hairStyle: 'bun', top: 'top_white', bottom: 'bot_black', hat: 'hat_none', glasses: 'glass_none' };

export function defaultState() {
  const recipes = {};
  RECIPE_ORDER.forEach(r => { recipes[r] = { trained: false, sold: 0, stars: 0 }; });
  const regulars = {};
  REGULAR_ORDER.forEach(r => { regulars[r] = { met: 0, recruited: false, friend: 0, visits: 0, rewarded: 0, nextVisit: 0 }; });
  const neighbors = {};
  NEIGHBOR_ORDER.forEach(n => { neighbors[n] = { day: '', helps: 0, cloverIn: now(), sentAt: 0, friend: 0 }; });
  const t = now();
  return {
    v: SAVE_VERSION, created: Date.now(), name: '巷口咖啡館',
    gold: 1200, beans: 120, coupons: 5, exp: 0, level: 1,
    expand: 0, floor: 'herring_walnut', wall: 'sage', ownedFloors: ['herring_walnut'], ownedWalls: ['sage'],
    furniture: [
      { id: uid(), type: 'tbl_marble', x: 5, y: 4, rot: 0 },
      { id: uid(), type: 'ch_bentwood', x: 4, y: 4, rot: 0 },
      { id: uid(), type: 'ch_bentwood', x: 6, y: 4, rot: 0 },
      { id: uid(), type: 'tbl_marble', x: 3, y: 5, rot: 0 },
      { id: uid(), type: 'ch_bentwood', x: 3, y: 6, rot: 0 },
      { id: uid(), type: 'ch_bentwood', x: 2, y: 5, rot: 0 },
      { id: uid(), type: 'monstera', x: 6, y: 1, rot: 0 },
    ],
    wallItems: [
      { id: uid(), type: 'w_art0', side: 'L', i: 4 },
      { id: uid(), type: 'w_sconce', side: 'L', i: 2 },
      { id: uid(), type: 'w_clock', side: 'R', i: 5 },
    ],
    pendants: [],
    storage: [],
    machines: [
      { id: uid(), type: 'roaster_classic', slot: 1, job: null, auto: { on: false, item: 'brazil', toppings: [] } },
      { id: uid(), type: 'espresso_steel', slot: 2, job: null, auto: { on: false, item: 'americano', toppings: [] } },
    ],
    tools: { espresso: true },
    recipes,
    showcase: {}, meals: {},
    returnCups: 0, dirtyTables: [], messyChairs: [],
    owner: { name: '店長', look: { ...OWNER_LOOK } },
    staff: [
      { id: uid(), job: 'cashier', name: '小芸', energy: ENERGY_BASE, prof: 0, look: { skin: '#f6d9c3', hair: '#7a4a2e', hairStyle: 'pony', top: 'top_white', bottom: 'bot_black', hat: 'hat_none', glasses: 'glass_none' } },
    ],
    apron: 'apron_forest',
    wardrobe: ['top_white', 'bot_black', 'hat_none', 'glass_none', 'apron_forest'],
    regulars,
    neighbors,
    clovers: 0, cloverBox: 0,
    flyers: FLYER_MAX, flyerT: t,
    drags: [],
    quest: { idx: 0, base: null, seen: -1 },
    daily: { day: '', list: [], bonus: false },
    loginDay: '',
    stats: { sold: 0, sideSold: 0, mealSold: 0, earned: 0, roastStart: 0, roastCollect: 0, brewStart: 0, sideStart: 0, sideCollect: 0, mealStart: 0, mealCollect: 0, recruitTry: 0, recruitOk: 0, help: 0, cloverSend: 0, wake: 0, chairFix: 0, special: 0, drag: 0, trained: 0, tests: 0, tips: 0, placed: 0, burnt: 0, truck: 0 },
    auto: { master: true, roast: false, brew: false, brewMode: 'smart', side: false, meal: false, cheer: false, cheerAt: 25, events: false, neighbors: false, quests: false, recruit: false, special: false, cat: false, keepGold: 300 },
    cat: null,
    truck: { day: '', orders: [], tokens: 0 },
    pendingSpecial: null,
    lastTick: t,
    settings: { sound: true, music: true, quality: 'auto' },
  };
}

// 讀舊檔時補齊新欄位
function fill(target, def) {
  for (const k of Object.keys(def)) {
    if (target[k] === undefined || target[k] === null && def[k] !== null) target[k] = def[k];
    else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) fill(target[k], def[k]);
  }
}
function migrate(s) {
  const d = defaultState();
  // 動態物件（recipes、regulars、neighbors）要補每一項
  fill(s, d);
  s.v = SAVE_VERSION;
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch (e) { console.warn('讀檔失敗', e); return null; }
}
let blocked = false;
export function blockSaves() { blocked = true; }
export function save(s) {
  if (blocked) return false;
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { console.warn('存檔失敗', e); return false; }
}
export function clearSave() { blocked = true; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
export function exportCode(s) { return btoa(unescape(encodeURIComponent(JSON.stringify(s)))); }
export function importCode(code) {
  const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!s || typeof s !== 'object' || s.gold === undefined) throw new Error('格式不對');
  return migrate(s);
}
