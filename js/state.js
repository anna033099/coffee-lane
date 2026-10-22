// 存檔結構、讀寫、匯出匯入
import { BEAN_ORDER, ING_ORDER, RECIPE_ORDER, CARD_MAX } from './data.js';

const KEY = 'coffeelane.save.v1';
export const SAVE_VERSION = 1;

let _uid = 1;
export function uid() { return 'u' + Date.now().toString(36) + (_uid++).toString(36); }
export function nowSec() { return Date.now() / 1000; }
export function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

export function defaultState() {
  const green = {}, roasted = {}, ing = {}, stock = {};
  BEAN_ORDER.forEach(b => { green[b] = 0; roasted[b] = 0; });
  ING_ORDER.forEach(i => { ing[i] = 0; });
  RECIPE_ORDER.forEach(r => { stock[r] = 0; });
  green.brazil = 1;
  stock.americano = 5;
  return {
    v: SAVE_VERSION,
    created: Date.now(),
    name: '我的咖啡館',
    coins: 400,
    exp: 0,
    level: 1,
    green, roasted, ing, stock,
    expand: 0,
    machines: [
      { id: uid(), type: 'roaster', slot: 1, job: null },
      { id: uid(), type: 'brewer', slot: 2, job: null },
    ],
    furniture: [
      { id: uid(), type: 'table_round', x: 2, y: 3 },
      { id: uid(), type: 'chair_wood', x: 1, y: 3 },
      { id: uid(), type: 'chair_wood', x: 3, y: 3 },
      { id: uid(), type: 'table_round', x: 4, y: 2 },
      { id: uid(), type: 'chair_wood', x: 4, y: 3 },
      { id: uid(), type: 'chair_wood', x: 5, y: 2 },
      { id: uid(), type: 'plant', x: 5, y: 4 },
    ],
    wall: [
      { id: uid(), type: 'window', side: 'R', i: 4 },
      { id: uid(), type: 'painting', side: 'L', i: 1 },
    ],
    storage: [],
    floor: 'wood', wallpaper: 'cream',
    ownedFloors: ['wood'], ownedWalls: ['cream'],
    uniform: '#d9775f',
    staff: [
      { id: 'owner', name: '店長', owner: true, speed: 2.2, maxSta: 100, sta: 100, look: { skin: '#f3d2b3', hair: '#5a3a2a', style: 'bun', shirt: '#fbf3e6', pants: '#4a3b35' } },
    ],
    regulars: [],
    cards: CARD_MAX, cardsT: nowSec(),
    stats: { served: 0, earned: 0, roastStart: 0, roastCollect: 0, brewStart: 0, brewCollect: 0, buyGreen: 0, placed: 0, recruited: 0, lost: 0 },
    quest: { idx: 0, base: null },
    daily: '',
    settings: { sound: true },
  };
}

// 讀檔時補齊新版本新增的欄位，避免舊存檔壞掉
function migrate(s) {
  const d = defaultState();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  for (const grp of ['green', 'roasted', 'ing', 'stock', 'stats', 'settings']) {
    for (const k of Object.keys(d[grp])) if (s[grp][k] === undefined) s[grp][k] = (grp === 'settings' || grp === 'stats') ? d[grp][k] : 0;
  }
  s.v = SAVE_VERSION;
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('讀檔失敗', e);
    return null;
  }
}

let blocked = false;
// 清除或匯入存檔後要重新整理頁面，期間不能再被自動存檔蓋掉
export function blockSaves() { blocked = true; }

export function save(s) {
  if (blocked) return false;
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; }
  catch (e) { console.warn('存檔失敗', e); return false; }
}

export function clearSave() { blocked = true; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

// 匯出成一段文字碼（base64），讓玩家換裝置時手動搬存檔
export function exportCode(s) {
  const json = JSON.stringify(s);
  return btoa(unescape(encodeURIComponent(json)));
}
export function importCode(code) {
  const json = decodeURIComponent(escape(atob(code.trim())));
  const s = JSON.parse(json);
  if (!s || typeof s !== 'object' || s.coins === undefined) throw new Error('格式不對');
  return migrate(s);
}
