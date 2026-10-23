// ============================================================
// 咖啡巷物語 v2 — 遊戲資料（數值、配方、型錄、角色）
// 想調整平衡只要改這個檔案
// ============================================================
export const GAME_TITLE = '咖啡巷物語';
export const MAX_LEVEL = 50;

// 升級所需經驗
export function expNeed(lv) { return Math.floor(20 + 18 * Math.pow(lv, 1.72)); }

// 店鋪稱號（每一級）
export const TITLES = [
  '', '巷口的小咖啡攤', '剛開張的小咖啡店', '鄰居會來坐坐的店', '有點名氣的咖啡店', '巷子裡的人氣小店',
  '上班族的早晨補給站', '學生愛去的讀書角落', '有招牌拿鐵的咖啡館', '週末要排隊的小店', '地方小報介紹過的店',
  '老客人越來越多的店', '咖啡香飄滿整條巷', '網路上開始被討論', '甜點也很好吃的店', '城裡數一數二的咖啡館',
  '咖啡迷專程來朝聖', '雜誌採訪過的咖啡館', '有自家烘焙的名店', '拉花比賽常勝店', '旅遊書推薦的咖啡館',
  '每天都高朋滿座', '咖啡師心中的夢幻店', '老闆的手藝有口皆碑', '從早到晚都熱鬧', '全城最有氣質的店',
  '名人也會偷偷來', '咖啡學院合作店', '自家豆子大受歡迎', '城市散步必經之地', '咖啡界的閃亮新星',
  '連外國觀光客都來了', '甜點與咖啡雙冠王', '大家心目中的第一名', '代表這座城市的味道', '電視節目專訪的名店',
  '世界咖啡大賽參賽店', '頂級豆莊指定合作', '咖啡愛好者的聖地', '傳說中的那間店', '國際評鑑三顆咖啡豆',
  '世界各地都有粉絲', '咖啡大師的殿堂', '百年老店的氣度', '無人不知的經典', '名列世界百大咖啡館',
  '咖啡的藝術殿堂', '業界仰望的標竿', '世界級的咖啡名店', '讓人一生必訪的店', '傳奇咖啡館',
];

// ---------------- 烘豆：花金幣買生豆 → 烘焙 → 收成咖啡豆 ----------------
// time 秒；beans 為產出的咖啡豆數量
export const ROASTS = [
  { id: 'quick', name: '淺焙快烘', origin: '綜合', lv: 1, time: 60, cost: 40, beans: 30, color: '#c9a06a' },
  { id: 'brazil', name: '巴西 喜拉多', origin: '南美洲', lv: 1, time: 300, cost: 160, beans: 130, color: '#b98a54' },
  { id: 'colombia', name: '哥倫比亞 薇拉', origin: '南美洲', lv: 3, time: 1200, cost: 520, beans: 460, color: '#a8794a' },
  { id: 'guatemala', name: '瓜地馬拉 安提瓜', origin: '中美洲', lv: 6, time: 3600, cost: 1400, beans: 1300, color: '#8d6a44' },
  { id: 'ethiopia', name: '衣索比亞 耶加雪菲', origin: '非洲', lv: 10, time: 3 * 3600, cost: 3600, beans: 3500, color: '#9a5a4a' },
  { id: 'kenya', name: '肯亞 AA', origin: '非洲', lv: 15, time: 6 * 3600, cost: 7000, beans: 7200, color: '#7a4a3a' },
  { id: 'mandheling', name: '蘇門答臘 曼特寧', origin: '亞洲', lv: 20, time: 10 * 3600, cost: 11000, beans: 12000, color: '#5a3a2a' },
  { id: 'geisha', name: '巴拿馬 藝伎', origin: '中美洲', lv: 28, time: 16 * 3600, cost: 18000, beans: 21000, color: '#c9a24a' },
];
export function burnAfter(time) { return Math.max(600, time * 2); }

// ---------------- 沖煮器具（解鎖飲品類別） ----------------
export const TOOLS = {
  espresso: { name: '義式咖啡機', lv: 1, cost: 0, desc: '最基本的濃縮咖啡' },
  frother: { name: '奶泡機', lv: 3, cost: 800, desc: '可以做拿鐵、卡布奇諾等奶類咖啡' },
  syrup: { name: '糖漿吧台', lv: 6, cost: 2500, desc: '香草、焦糖等風味糖漿' },
  ice: { name: '製冰機', lv: 9, cost: 5000, desc: '可以做冰咖啡' },
  pourover: { name: '手沖器具組', lv: 12, cost: 9000, desc: '精品單品手沖' },
  blender: { name: '冰沙果汁機', lv: 16, cost: 15000, desc: '星冰樂系列' },
  coldbrew: { name: '冰滴咖啡塔', lv: 20, cost: 24000, desc: '慢慢滴出的冰滴咖啡' },
  tea: { name: '日式茶具組', lv: 24, cost: 32000, desc: '抹茶、焙茶系列飲品' },
  teapot: { name: '英式紅茶壺組', lv: 5, cost: 1500, desc: '紅茶、奶茶與伯爵茶' },
  fruit: { name: '鮮果吧台', lv: 11, cost: 6000, desc: '檸檬、草莓、芒果、柳橙等鮮果飲' },
  soda: { name: '氣泡水機', lv: 15, cost: 12000, desc: '清爽的氣泡咖啡與氣泡飲' },
  flavor: { name: '風味糖漿櫃', lv: 19, cost: 20000, desc: '榛果、玫瑰、黑糖、海鹽等風味' },
  plant: { name: '植物奶冰箱', lv: 23, cost: 28000, desc: '燕麥奶、椰奶系列' },
};

// ---------------- 手作材料（小遊戲按鈕） ----------------
export const INGS = {
  shot: { name: '濃縮', color: '#3b2116', kind: 'liquid', icon: 'shot' },
  water: { name: '熱水', color: '#7a4a2e', kind: 'liquid', icon: 'water' },
  milk: { name: '熱牛奶', color: '#efe3cf', kind: 'liquid', icon: 'milk' },
  foam: { name: '奶泡', color: '#fbf6ec', kind: 'foam', icon: 'foam' },
  coldmilk: { name: '冰牛奶', color: '#f4efe6', kind: 'liquid', icon: 'coldmilk' },
  ice: { name: '冰塊', color: '#d9eef2', kind: 'ice', icon: 'ice' },
  choco: { name: '巧克力醬', color: '#4a2a1c', kind: 'sauce', icon: 'choco' },
  caramel: { name: '焦糖醬', color: '#c47a2c', kind: 'sauce', icon: 'caramel' },
  vanilla: { name: '香草糖漿', color: '#e9d79a', kind: 'liquid', icon: 'vanilla' },
  cream: { name: '鮮奶油', color: '#fffdf6', kind: 'top', icon: 'cream' },
  cinnamon: { name: '肉桂粉', color: '#9a5a33', kind: 'dust', icon: 'cinnamon' },
  matcha: { name: '抹茶', color: '#6f8f3e', kind: 'liquid', icon: 'matcha' },
  pour: { name: '手沖注水', color: '#6b3a22', kind: 'liquid', icon: 'pour' },
  dutch: { name: '冰滴液', color: '#2a160e', kind: 'liquid', icon: 'dutch' },
  blend: { name: '攪打', color: '#d8c3a5', kind: 'action', icon: 'blend' },
  honey: { name: '蜂蜜', color: '#e8a63a', kind: 'sauce', icon: 'honey' },
  blacktea: { name: '紅茶', color: '#9a4a22', kind: 'liquid', icon: 'blacktea' },
  hojicha: { name: '焙茶', color: '#8a5a3a', kind: 'liquid', icon: 'hojicha' },
  lemon: { name: '檸檬', color: '#f2d64a', kind: 'fruit', icon: 'lemon' },
  strawberry: { name: '草莓', color: '#e0526a', kind: 'liquid', icon: 'strawberry' },
  mango: { name: '芒果', color: '#f4b23a', kind: 'liquid', icon: 'mango' },
  orange: { name: '柳橙汁', color: '#f39a2e', kind: 'liquid', icon: 'orange' },
  mint: { name: '薄荷', color: '#5aa86a', kind: 'fruit', icon: 'mint' },
  soda: { name: '氣泡水', color: '#e9f5f7', kind: 'liquid', icon: 'soda' },
  hazelnut: { name: '榛果糖漿', color: '#b07a4a', kind: 'liquid', icon: 'hazelnut' },
  rose: { name: '玫瑰糖漿', color: '#e79ab0', kind: 'liquid', icon: 'rose' },
  brownsugar: { name: '黑糖', color: '#5a2e1a', kind: 'sauce', icon: 'brownsugar' },
  seasalt: { name: '海鹽奶蓋', color: '#f6f4ee', kind: 'top', icon: 'seasalt' },
  oat: { name: '燕麥奶', color: '#efe2c6', kind: 'liquid', icon: 'oat' },
  coconut: { name: '椰奶', color: '#fbf8ef', kind: 'liquid', icon: 'coconut' },
};
export const TOOL_INGS = {
  espresso: ['shot', 'water'], frother: ['milk', 'foam', 'choco', 'cream', 'cinnamon'], syrup: ['vanilla', 'caramel', 'honey'],
  ice: ['ice', 'coldmilk'], pourover: ['pour'], blender: ['blend'], coldbrew: ['dutch'], tea: ['matcha', 'hojicha'],
  teapot: ['blacktea'], fruit: ['lemon', 'strawberry', 'mango', 'orange', 'mint'], soda: ['soda'],
  flavor: ['hazelnut', 'rose', 'brownsugar', 'seasalt'], plant: ['oat', 'coconut'],
};

// ---------------- 咖啡配方 ----------------
function dr(id, name, en, lv, tool, steps, cup, tags, gar) {
  const big = cup === 'tall' || cup === 'frappe' || cup === 'goblet';
  return { [id]: { name, en, lv, tool, steps, cup, tags, gar, cups: big ? 40 : 30, beans: Math.round(20 + lv * 6), prep: Math.round(Math.min(9000, 30 * Math.pow(1.13, lv))), price: Math.round(10 + lv * 2.8 + steps.length), exp: 1 + Math.floor(lv / 5) } };
}
// steps：手作順序；cups：一次做幾杯；beans：一批耗豆；prep：準備秒數；price：每杯售價；exp：每杯經驗
export const RECIPES = {
  espresso: { name: '濃縮咖啡', en: 'Espresso', lv: 1, tool: 'espresso', steps: [['shot', 1]], cups: 24, beans: 24, prep: 10, price: 10, exp: 1, cup: 'demi', tags: ['strong', 'hot', 'black'] },
  americano: { name: '美式咖啡', en: 'Americano', lv: 1, tool: 'espresso', steps: [['shot', 1], ['water', 2]], cups: 30, beans: 30, prep: 20, price: 12, exp: 1, cup: 'mug', tags: ['strong', 'hot', 'black', 'cheap'] },
  macchiato: { name: '瑪奇朵', en: 'Macchiato', lv: 2, tool: 'espresso', steps: [['shot', 1], ['foam', 1]], cups: 24, beans: 30, prep: 30, price: 16, exp: 1, cup: 'demi', tags: ['strong', 'hot', 'milk'] },
  latte: { name: '拿鐵', en: 'Café Latte', lv: 3, tool: 'frother', steps: [['shot', 1], ['milk', 3], ['foam', 1]], cups: 30, beans: 45, prep: 45, price: 20, exp: 2, cup: 'glass', tags: ['milk', 'hot', 'mild'] },
  cappuccino: { name: '卡布奇諾', en: 'Cappuccino', lv: 4, tool: 'frother', steps: [['shot', 1], ['milk', 2], ['foam', 2]], cups: 30, beans: 45, prep: 60, price: 22, exp: 2, cup: 'cup', tags: ['milk', 'hot', 'classic'] },
  mocha: { name: '摩卡', en: 'Café Mocha', lv: 5, tool: 'frother', steps: [['choco', 1], ['shot', 1], ['milk', 2], ['cream', 1]], cups: 30, beans: 60, prep: 90, price: 28, exp: 2, cup: 'mug', tags: ['sweet', 'hot', 'milk'] },
  caramel_mac: { name: '焦糖瑪奇朵', en: 'Caramel Macchiato', lv: 6, tool: 'syrup', steps: [['vanilla', 1], ['milk', 2], ['foam', 1], ['shot', 1], ['caramel', 1]], cups: 30, beans: 60, prep: 120, price: 32, exp: 3, cup: 'glass', tags: ['sweet', 'hot', 'milk'] },
  vanilla_latte: { name: '香草拿鐵', en: 'Vanilla Latte', lv: 7, tool: 'syrup', steps: [['vanilla', 1], ['shot', 1], ['milk', 3]], cups: 30, beans: 60, prep: 120, price: 30, exp: 3, cup: 'glass', tags: ['sweet', 'hot', 'milk', 'mild'] },
  flat_white: { name: '澳式白咖啡', en: 'Flat White', lv: 8, tool: 'frother', steps: [['shot', 2], ['milk', 2]], cups: 30, beans: 75, prep: 150, price: 34, exp: 3, cup: 'cup', tags: ['strong', 'hot', 'milk'] },
  iced_americano: { name: '冰美式', en: 'Iced Americano', lv: 9, tool: 'ice', steps: [['ice', 2], ['shot', 1], ['water', 2]], cups: 40, beans: 60, prep: 120, price: 26, exp: 3, cup: 'tall', tags: ['strong', 'iced', 'black', 'cheap'] },
  iced_latte: { name: '冰拿鐵', en: 'Iced Latte', lv: 10, tool: 'ice', steps: [['ice', 2], ['shot', 1], ['coldmilk', 3]], cups: 40, beans: 80, prep: 180, price: 34, exp: 3, cup: 'tall', tags: ['milk', 'iced', 'mild'] },
  vienna: { name: '維也納咖啡', en: 'Vienna Coffee', lv: 11, tool: 'frother', steps: [['shot', 2], ['water', 1], ['cream', 2]], cups: 30, beans: 90, prep: 240, price: 40, exp: 4, cup: 'glass', tags: ['sweet', 'hot', 'classic'] },
  pourover: { name: '手沖單品', en: 'Pour Over', lv: 12, tool: 'pourover', steps: [['pour', 3]], cups: 20, beans: 100, prep: 300, price: 55, exp: 5, cup: 'cup', tags: ['strong', 'hot', 'black', 'classic'] },
  cinnamon_cap: { name: '肉桂卡布', en: 'Cinnamon Cappuccino', lv: 13, tool: 'frother', steps: [['shot', 1], ['milk', 2], ['foam', 2], ['cinnamon', 1]], cups: 30, beans: 90, prep: 300, price: 42, exp: 4, cup: 'cup', tags: ['milk', 'hot', 'classic'] },
  iced_mocha: { name: '冰摩卡', en: 'Iced Mocha', lv: 14, tool: 'ice', steps: [['ice', 2], ['choco', 1], ['shot', 1], ['coldmilk', 2], ['cream', 1]], cups: 40, beans: 120, prep: 360, price: 46, exp: 4, cup: 'tall', tags: ['sweet', 'iced', 'milk'] },
  caramel_frappe: { name: '焦糖星冰樂', en: 'Caramel Frappé', lv: 16, tool: 'blender', steps: [['ice', 3], ['shot', 1], ['coldmilk', 2], ['caramel', 1], ['blend', 1], ['cream', 1]], cups: 40, beans: 140, prep: 480, price: 55, exp: 5, cup: 'frappe', tags: ['sweet', 'iced', 'milk'] },
  mocha_frappe: { name: '摩卡星冰樂', en: 'Mocha Frappé', lv: 17, tool: 'blender', steps: [['ice', 3], ['choco', 1], ['shot', 1], ['coldmilk', 2], ['blend', 1], ['cream', 1]], cups: 40, beans: 140, prep: 480, price: 55, exp: 5, cup: 'frappe', tags: ['sweet', 'iced', 'milk'] },
  dirty: { name: '髒髒咖啡', en: 'Dirty Coffee', lv: 18, tool: 'ice', steps: [['coldmilk', 3], ['shot', 2]], cups: 30, beans: 110, prep: 420, price: 50, exp: 5, cup: 'rocks', tags: ['strong', 'milk', 'iced'] },
  dutch: { name: '冰滴咖啡', en: 'Dutch Coffee', lv: 20, tool: 'coldbrew', steps: [['ice', 2], ['dutch', 3]], cups: 30, beans: 160, prep: 900, price: 70, exp: 6, cup: 'rocks', tags: ['strong', 'iced', 'black', 'classic'] },
  dutch_latte: { name: '冰滴拿鐵', en: 'Dutch Latte', lv: 21, tool: 'coldbrew', steps: [['ice', 1], ['dutch', 2], ['coldmilk', 2]], cups: 30, beans: 160, prep: 900, price: 72, exp: 6, cup: 'tall', tags: ['milk', 'iced', 'mild'] },
  matcha_latte: { name: '抹茶拿鐵', en: 'Matcha Latte', lv: 24, tool: 'tea', steps: [['matcha', 1], ['water', 1], ['milk', 3]], cups: 30, beans: 120, prep: 600, price: 60, exp: 6, cup: 'glass', tags: ['milk', 'hot', 'mild', 'sweet'] },
  matcha_espresso: { name: '抹茶咖啡', en: 'Matcha Espresso', lv: 26, tool: 'tea', steps: [['ice', 1], ['matcha', 1], ['coldmilk', 2], ['shot', 1]], cups: 30, beans: 180, prep: 900, price: 78, exp: 7, cup: 'tall', tags: ['milk', 'iced', 'strong'] },
  house_special: { name: '店長招牌', en: 'House Special', lv: 30, tool: 'syrup', steps: [['vanilla', 1], ['shot', 2], ['milk', 2], ['foam', 1], ['cinnamon', 1]], cups: 30, beans: 220, prep: 1200, price: 95, exp: 8, cup: 'cup', tags: ['sweet', 'hot', 'milk', 'classic'] },
  // ---- 擴充飲品（數值依等級自動計算） ----
  ...dr('cortado', '可塔朵', 'Cortado', 3, 'frother', [['shot', 1], ['milk', 1]], 'rocks', ['strong', 'hot', 'milk']),
  ...dr('con_panna', '康寶藍', 'Espresso con Panna', 4, 'frother', [['shot', 2], ['cream', 1]], 'demi', ['strong', 'hot', 'sweet']),
  ...dr('black_tea', '錫蘭紅茶', 'Ceylon Black Tea', 5, 'teapot', [['blacktea', 1], ['water', 2]], 'teacup', ['hot', 'mild', 'cheap'], 'lemon'),
  ...dr('royal_milktea', '皇家奶茶', 'Royal Milk Tea', 6, 'teapot', [['blacktea', 2], ['milk', 2]], 'teacup', ['hot', 'milk', 'sweet']),
  ...dr('hot_choco', '熱可可', 'Hot Chocolate', 6, 'frother', [['choco', 2], ['milk', 3], ['cream', 1]], 'mug', ['sweet', 'hot', 'milk'], 'cocoa'),
  ...dr('honey_latte', '蜂蜜拿鐵', 'Honey Latte', 7, 'syrup', [['honey', 1], ['shot', 1], ['milk', 3]], 'glass', ['sweet', 'hot', 'milk', 'mild']),
  ...dr('earl_latte', '伯爵茶拿鐵', 'Earl Grey Latte', 8, 'teapot', [['blacktea', 1], ['vanilla', 1], ['milk', 2], ['foam', 1]], 'glass', ['hot', 'milk', 'mild']),
  ...dr('iced_lemon_tea', '冰檸檬紅茶', 'Iced Lemon Tea', 11, 'fruit', [['ice', 2], ['blacktea', 1], ['water', 1], ['lemon', 1]], 'tall', ['iced', 'cheap', 'mild'], 'lemon'),
  ...dr('lemon_americano', '檸檬冰美式', 'Lemon Americano', 12, 'fruit', [['ice', 2], ['shot', 1], ['water', 2], ['lemon', 1]], 'tall', ['iced', 'black', 'strong'], 'lemon'),
  ...dr('orange_americano', '柳橙冰美式', 'Orange Americano', 13, 'fruit', [['ice', 2], ['orange', 2], ['shot', 1]], 'tall', ['iced', 'strong', 'sweet'], 'orange'),
  ...dr('strawberry_latte', '草莓牛奶拿鐵', 'Strawberry Latte', 13, 'fruit', [['strawberry', 1], ['ice', 1], ['coldmilk', 2], ['shot', 1]], 'tall', ['sweet', 'iced', 'milk'], 'strawberry'),
  ...dr('espresso_tonic', '濃縮氣泡飲', 'Espresso Tonic', 15, 'soda', [['ice', 2], ['soda', 2], ['shot', 1]], 'goblet', ['iced', 'black', 'strong'], 'orange'),
  ...dr('lemon_soda', '檸檬氣泡飲', 'Lemon Soda', 15, 'soda', [['ice', 2], ['lemon', 1], ['soda', 2]], 'goblet', ['iced', 'cheap', 'mild'], 'lemon'),
  ...dr('mango_smoothie', '芒果冰沙', 'Mango Smoothie', 16, 'blender', [['ice', 2], ['mango', 2], ['coldmilk', 1], ['blend', 1]], 'frappe', ['sweet', 'iced'], 'mango'),
  ...dr('strawberry_frappe', '草莓星冰樂', 'Strawberry Frappé', 17, 'blender', [['ice', 2], ['strawberry', 2], ['coldmilk', 2], ['blend', 1], ['cream', 1]], 'frappe', ['sweet', 'iced', 'milk'], 'strawberry'),
  ...dr('mojito_coffee', '薄荷莫西多咖啡', 'Mint Mojito Coffee', 18, 'soda', [['mint', 1], ['lemon', 1], ['ice', 2], ['soda', 1], ['shot', 1]], 'goblet', ['iced', 'strong'], 'mint'),
  ...dr('hazelnut_latte', '榛果拿鐵', 'Hazelnut Latte', 19, 'flavor', [['hazelnut', 1], ['shot', 1], ['milk', 3]], 'glass', ['sweet', 'hot', 'milk']),
  ...dr('rose_latte', '玫瑰拿鐵', 'Rose Latte', 20, 'flavor', [['rose', 1], ['shot', 1], ['milk', 2], ['foam', 1]], 'glass', ['sweet', 'hot', 'milk', 'mild'], 'rose'),
  ...dr('brownsugar_latte', '黑糖冰拿鐵', 'Brown Sugar Latte', 21, 'flavor', [['brownsugar', 1], ['ice', 1], ['coldmilk', 2], ['shot', 1]], 'tall', ['sweet', 'iced', 'milk']),
  ...dr('seasalt_latte', '海鹽焦糖拿鐵', 'Sea Salt Caramel Latte', 22, 'flavor', [['caramel', 1], ['shot', 1], ['milk', 2], ['seasalt', 1]], 'glass', ['sweet', 'hot', 'milk']),
  ...dr('oat_latte', '燕麥拿鐵', 'Oat Latte', 23, 'plant', [['shot', 1], ['oat', 3]], 'glass', ['milk', 'hot', 'mild']),
  ...dr('coconut_latte', '椰香冰拿鐵', 'Iced Coconut Latte', 24, 'plant', [['ice', 2], ['coconut', 2], ['shot', 1]], 'tall', ['sweet', 'iced', 'milk']),
  ...dr('hojicha_latte', '焙茶拿鐵', 'Hojicha Latte', 25, 'tea', [['hojicha', 1], ['water', 1], ['milk', 3]], 'glass', ['mild', 'hot', 'milk']),
  ...dr('matcha_frappe', '抹茶星冰樂', 'Matcha Frappé', 27, 'tea', [['ice', 2], ['matcha', 1], ['coldmilk', 2], ['blend', 1], ['cream', 1]], 'frappe', ['sweet', 'iced', 'milk'], 'matcha'),
  ...dr('coconut_dutch', '椰香冰滴', 'Coconut Cold Drip', 30, 'coldbrew', [['ice', 2], ['dutch', 2], ['coconut', 1]], 'tall', ['iced', 'strong', 'milk']),
  ...dr('rose_dutch', '玫瑰冰滴氣泡', 'Rose Cold Drip Soda', 32, 'coldbrew', [['ice', 2], ['dutch', 1], ['soda', 1], ['rose', 1]], 'goblet', ['iced', 'strong', 'sweet'], 'rose'),
  ...dr('hazelnut_mocha', '榛果摩卡', 'Hazelnut Mocha', 33, 'flavor', [['hazelnut', 1], ['choco', 1], ['shot', 1], ['milk', 2], ['cream', 1]], 'mug', ['sweet', 'hot', 'milk'], 'cocoa'),
  ...dr('irish_cream', '愛爾蘭風奶油咖啡', 'Irish-style Cream Coffee', 34, 'frother', [['brownsugar', 1], ['shot', 2], ['water', 1], ['cream', 2]], 'glass', ['sweet', 'hot', 'strong', 'classic']),
  ...dr('geisha_pour', '藝伎手沖', 'Geisha Pour Over', 36, 'pourover', [['pour', 3]], 'teacup', ['strong', 'hot', 'black', 'classic']),
  ...dr('honey_oat', '蜂蜜燕麥冰拿鐵', 'Honey Oat Iced Latte', 37, 'plant', [['honey', 1], ['ice', 2], ['oat', 2], ['shot', 1]], 'tall', ['sweet', 'iced', 'milk', 'mild']),
  ...dr('mango_coconut', '芒果椰奶冰沙', 'Mango Coconut Smoothie', 38, 'blender', [['ice', 2], ['mango', 1], ['coconut', 2], ['blend', 1]], 'frappe', ['sweet', 'iced'], 'mango'),
  ...dr('royal_mocha', '皇家黑糖摩卡', 'Royal Brown Sugar Mocha', 40, 'flavor', [['brownsugar', 1], ['choco', 1], ['shot', 2], ['milk', 2], ['cream', 1]], 'mug', ['sweet', 'hot', 'milk', 'strong'], 'cocoa'),
  ...dr('rose_matcha', '玫瑰抹茶拿鐵', 'Rose Matcha Latte', 42, 'tea', [['rose', 1], ['matcha', 1], ['milk', 2], ['foam', 1]], 'glass', ['sweet', 'hot', 'milk', 'mild'], 'rose'),
  ...dr('salted_dutch', '海鹽奶蓋冰滴', 'Sea Salt Cream Cold Drip', 45, 'coldbrew', [['ice', 1], ['dutch', 2], ['seasalt', 1]], 'rocks', ['iced', 'strong', 'classic']),
  ...dr('grand_special', '咖啡巷大師特調', 'Coffee Lane Grand Signature', 48, 'syrup', [['vanilla', 1], ['shot', 2], ['honey', 1], ['milk', 2], ['foam', 1], ['cinnamon', 1]], 'cup', ['sweet', 'hot', 'milk', 'classic']),
};
export const RECIPE_ORDER = Object.keys(RECIPES);
// 評比門檻：賣出幾杯後可考下一顆星
export const STAR_SALES = [60, 240, 800];
export const STAR_BONUS = 0.08; // 每顆星售價 +8%

// ---------------- 點心 ----------------
export const SIDE_MACHINES = {
  toaster: { name: '吐司機', lv: 4, cost: 1200 },
  oven: { name: '石窯烤箱', lv: 8, cost: 4000 },
  fridge: { name: '甜點冷藏櫃', lv: 13, cost: 9000 },
  waffle: { name: '鬆餅機', lv: 18, cost: 16000 },
  bench: { name: '甜點師工作台', lv: 23, cost: 28000 },
  gelato: { name: '義式冰淇淋櫃', lv: 16, cost: 12000 },
  crepe: { name: '可麗餅煎台', lv: 26, cost: 34000 },
  patisserie: { name: '法式甜點烤箱', lv: 32, cost: 52000 },
  wagashi: { name: '和菓子工坊', lv: 36, cost: 70000 },
};
function sd(id, name, machine, lv, color, en) {
  const price = Math.round(10 + lv * 2.6), pcs = 16;
  return { [id]: { name, en, machine, lv, color, time: Math.round(Math.min(14400, 40 * Math.pow(1.2, lv))), pcs, cost: Math.round(price * pcs * 0.3), price, exp: 1 + Math.floor(lv / 7) } };
}
export const SIDES = {
  toast: { name: '奶油厚片', machine: 'toaster', lv: 4, time: 60, pcs: 12, cost: 50, price: 14, exp: 1, color: '#e2b46a' },
  croissant: { name: '可頌', machine: 'toaster', lv: 6, time: 240, pcs: 12, cost: 90, price: 22, exp: 1, color: '#d79a4f' },
  scone: { name: '英式司康', machine: 'oven', lv: 8, time: 420, pcs: 16, cost: 130, price: 24, exp: 2, color: '#d9b07a' },
  madeleine: { name: '瑪德蓮', machine: 'oven', lv: 10, time: 900, pcs: 20, cost: 180, price: 26, exp: 2, color: '#e3b45c' },
  brownie: { name: '布朗尼', machine: 'oven', lv: 12, time: 1500, pcs: 20, cost: 240, price: 32, exp: 2, color: '#4a2a1c' },
  tiramisu: { name: '提拉米蘇', machine: 'fridge', lv: 13, time: 2400, pcs: 16, cost: 300, price: 48, exp: 3, color: '#b98a63' },
  cheesecake: { name: '重乳酪蛋糕', machine: 'fridge', lv: 16, time: 3600, pcs: 16, cost: 340, price: 52, exp: 3, color: '#f2e2b6' },
  waffle: { name: '比利時鬆餅', machine: 'waffle', lv: 18, time: 1800, pcs: 20, cost: 360, price: 40, exp: 3, color: '#d9a65c' },
  honey_toast: { name: '蜂蜜厚片塔', machine: 'waffle', lv: 20, time: 3600, pcs: 16, cost: 420, price: 58, exp: 4, color: '#e0a64a' },
  millefeuille: { name: '草莓千層', machine: 'bench', lv: 23, time: 5400, pcs: 16, cost: 520, price: 70, exp: 5, color: '#f3d9c9' },
  montblanc: { name: '蒙布朗', machine: 'bench', lv: 27, time: 7200, pcs: 16, cost: 600, price: 80, exp: 5, color: '#b88a5e' },
  // ---- 擴充甜點 ----
  ...sd('pain_choc', '巧克力可頌', 'toaster', 7, '#c98a4f', 'Pain au Chocolat'),
  ...sd('bagel', '奶油乳酪貝果', 'toaster', 9, '#d9a66a', 'Cream Cheese Bagel'),
  ...sd('muffin', '藍莓瑪芬', 'oven', 9, '#d9a65c', 'Blueberry Muffin'),
  ...sd('cinnamon_roll', '肉桂捲', 'oven', 11, '#c98a4f', 'Cinnamon Roll'),
  ...sd('cookie', '巧克力豆餅乾', 'oven', 14, '#d9a65c', 'Chocolate Chip Cookie'),
  ...sd('pudding', '焦糖布丁', 'fridge', 14, '#f2d36b', 'Caramel Pudding'),
  ...sd('panna_cotta', '莓果奶酪', 'fridge', 15, '#f8f2e6', 'Berry Panna Cotta'),
  ...sd('vanilla_gelato', '香草冰淇淋', 'gelato', 16, '#f8edc8', 'Vanilla Gelato'),
  ...sd('apple_pie', '蘋果派', 'oven', 17, '#d99a4f', 'Apple Pie'),
  ...sd('pistachio_gelato', '開心果冰淇淋', 'gelato', 18, '#b9cf8a', 'Pistachio Gelato'),
  ...sd('croffle', '可頌鬆餅', 'waffle', 19, '#d99a4f', 'Croffle'),
  ...sd('matcha_roll', '抹茶生乳捲', 'fridge', 19, '#8fae5a', 'Matcha Roll Cake'),
  ...sd('parfait', '莓果芭菲', 'gelato', 20, '#e8a0b0', 'Berry Parfait'),
  ...sd('canele', '可麗露', 'oven', 21, '#7a3a1e', 'Canelé'),
  ...sd('choco_mousse', '巧克力慕斯', 'fridge', 22, '#5a3324', 'Chocolate Mousse'),
  ...sd('affogato', '阿法奇朵', 'gelato', 22, '#f8edc8', 'Affogato'),
  ...sd('souffle_pancake', '舒芙蕾鬆餅', 'waffle', 24, '#f2d9a0', 'Soufflé Pancake'),
  ...sd('fruit_tart', '綜合水果塔', 'bench', 25, '#e9c46a', 'Fruit Tart'),
  ...sd('crepe_choc', '巧克力香蕉可麗餅', 'crepe', 26, '#e2b46a', 'Chocolate Banana Crêpe'),
  ...sd('mille_crepe', '千層可麗餅蛋糕', 'crepe', 28, '#f2e2b6', 'Mille Crêpe Cake'),
  ...sd('shortcake', '草莓鮮奶油蛋糕', 'bench', 29, '#fbf3ea', 'Strawberry Shortcake'),
  ...sd('crepe_suzette', '橙香可麗餅', 'crepe', 30, '#f0a43a', 'Crêpe Suzette'),
  ...sd('opera', '歐培拉蛋糕', 'bench', 31, '#3b2116', 'Opéra Cake'),
  ...sd('macaron', '法式馬卡龍', 'patisserie', 32, '#e8a0b0', 'Macarons'),
  ...sd('eclair', '閃電泡芙', 'patisserie', 33, '#c98a4f', 'Éclair'),
  ...sd('choux', '卡士達泡芙', 'patisserie', 34, '#e2b46a', 'Cream Puff'),
  ...sd('dorayaki', '紅豆銅鑼燒', 'wagashi', 36, '#b9763a', 'Dorayaki'),
  ...sd('saint_honore', '聖多諾黑', 'patisserie', 37, '#e2b46a', 'Saint-Honoré'),
  ...sd('matcha_parfait', '抹茶芭菲', 'wagashi', 38, '#7fa24a', 'Matcha Parfait'),
  ...sd('black_forest', '黑森林蛋糕', 'patisserie', 39, '#3b2116', 'Black Forest Cake'),
  ...sd('warabi', '黑糖蕨餅', 'wagashi', 40, '#c9a46a', 'Warabi Mochi'),
  ...sd('taiyaki', '鯛魚燒', 'wagashi', 41, '#c98a3a', 'Taiyaki'),
  ...sd('sakura_mochi', '櫻花麻糬', 'wagashi', 43, '#f2b8c6', 'Sakura Mochi'),
};
export const SIDE_ORDER = Object.keys(SIDES);
export const SIDE_BURN = 1800; // 點心烤好後 30 分鐘內要收，不然會烤焦
export const SHOWCASE_CAP = 60;

// ---------------- 吧台機器（擺在後吧台格子） ----------------
export const BAR_MACHINES = {
  roaster_classic: { kind: 'roaster', name: '經典滾筒烘豆機', lv: 1, cost: 600, speed: 1.0, tier: 0 },
  roaster_forest: { kind: 'roaster', name: '森林綠烘豆機', lv: 12, cost: 9000, speed: 0.85, tier: 1 },
  roaster_navy: { kind: 'roaster', name: '午夜藍烘豆機', lv: 25, cost: 30000, speed: 0.7, tier: 2 },
  espresso_steel: { kind: 'espresso', name: '單孔義式咖啡機', lv: 1, cost: 500, cupBonus: 0, speedMul: 1, tier: 0 },
  espresso_cream: { kind: 'espresso', name: '雙孔奶油白咖啡機', lv: 8, cost: 6000, cupBonus: 0.2, speedMul: 0.85, tier: 1 },
  espresso_green: { kind: 'espresso', name: '雙孔祖母綠咖啡機', lv: 20, cost: 24000, cupBonus: 0.4, speedMul: 0.7, tier: 2 },
  toaster: { kind: 'side', machine: 'toaster', name: '吐司機', lv: 4, cost: 1200 },
  oven: { kind: 'side', machine: 'oven', name: '石窯烤箱', lv: 8, cost: 4000 },
  fridge: { kind: 'side', machine: 'fridge', name: '甜點冷藏櫃', lv: 13, cost: 9000 },
  waffle: { kind: 'side', machine: 'waffle', name: '鬆餅機', lv: 18, cost: 16000 },
  bench: { kind: 'side', machine: 'bench', name: '甜點師工作台', lv: 23, cost: 28000 },
  griddle: { kind: 'kitchen', machine: 'griddle', name: '早午餐鐵板', lv: 7, cost: 3500 },
  stove: { kind: 'kitchen', machine: 'stove', name: '義大利麵爐', lv: 11, cost: 8000 },
  press: { kind: 'kitchen', machine: 'press', name: '帕尼尼壓烤機', lv: 15, cost: 14000 },
  pizza: { kind: 'kitchen', machine: 'pizza', name: '窯烤披薩爐', lv: 21, cost: 26000 },
};
// 新增的點心機、廚房機器自動加進吧台機器清單
for (const [k, v] of Object.entries(SIDE_MACHINES)) if (!BAR_MACHINES[k]) BAR_MACHINES[k] = { kind: 'side', machine: k, name: v.name, lv: v.lv, cost: v.cost };
// 吧台機器數量上限（依等級）
export function machineCap(kind, lv) {
  if (kind === 'roaster') return lv < 5 ? 1 : lv < 12 ? 2 : lv < 22 ? 3 : 4;
  if (kind === 'espresso') return lv < 3 ? 1 : lv < 9 ? 2 : lv < 16 ? 3 : lv < 26 ? 4 : 5;
  if (kind === 'kitchen') return lv < 15 ? 1 : lv < 25 ? 2 : lv < 35 ? 3 : 4;
  return lv < 10 ? 1 : lv < 20 ? 2 : lv < 32 ? 3 : 4;
}

// ---------------- 擴店 ----------------
// W：後吧台那面牆的長度；D：門那面牆的長度；slots：後吧台格數
export const EXPANSIONS = [
  { W: 7, D: 7, slots: 4, lv: 1, cost: 0, score: 0 },
  { W: 8, D: 8, slots: 5, lv: 5, cost: 3000, score: 60 },
  { W: 9, D: 9, slots: 6, lv: 10, cost: 12000, score: 150 },
  { W: 10, D: 10, slots: 7, lv: 15, cost: 30000, score: 280 },
  { W: 11, D: 11, slots: 8, lv: 20, cost: 60000, score: 450 },
  { W: 12, D: 12, slots: 9, lv: 25, cost: 110000, score: 650 },
];

// ---------------- 員工 ----------------
export const JOBS = {
  cashier: { name: '收銀', lv: 1, cost: 0, desc: '在收銀台幫客人點餐結帳', tile: [0, 1] },
  pickup: { name: '出餐', lv: 5, cost: 3000, desc: '在取餐台把飲料交給客人；沒有出餐員時收銀員要兩邊跑', tile: [2, 1] },
  recycle: { name: '回收', lv: 10, cost: 9000, desc: '整理回收台的杯子；沒有人整理時杯子會堆在桌上', tile: [3, 1] },
  cleaner: { name: '清潔', lv: 15, cost: 18000, desc: '在店裡巡邏，扶正椅子、清理桌面，偶爾撿到零錢', tile: null },
};
export const JOB_ORDER = ['cashier', 'pickup', 'recycle', 'cleaner'];
export const ENERGY_BASE = 60;      // 元氣上限基本值（分鐘）
export const ENERGY_DRAG = 30;      // 往上拖一次恢復的分鐘數
export const DRAG_MAX = 5;          // 每 5 分鐘最多拖 5 次
export const DRAG_WINDOW = 300;
export const TIRED_PENALTY = 0.15;  // 每個累倒的員工讓來客減少 15%

// ---------------- 來客 ----------------
export function customerRate(score) { return Math.min(16, 1.6 + score / 28); } // 每分鐘來客數
export function customerCap(score) { return Math.min(26, 4 + Math.floor(score / 12)); } // 店內同時人數上限
export const SIDE_CHANCE = 0.38;
export const RETURN_CAP = 12; // 回收台堆滿的杯數
export const OFFLINE_RATE = 0.6; // 離線時的販售效率
export const OFFLINE_MAX = 12 * 3600;

// ---------------- 裝潢型錄 ----------------
// kind: table / chair / decor / wall / pendant ；score 裝潢分數；coupon 表示用咖啡券購買
export const FURNITURE = {
  tbl_marble: { kind: 'table', name: '白大理石圓桌', lv: 1, cost: 300, score: 4 },
  tbl_walnut: { kind: 'table', name: '胡桃木方桌', lv: 2, cost: 450, score: 5 },
  tbl_bistro: { kind: 'table', name: '黑大理石小酒館桌', lv: 4, cost: 800, score: 7 },
  tbl_terrazzo: { kind: 'table', name: '水磨石圓桌', lv: 7, cost: 1500, score: 10 },
  tbl_green: { kind: 'table', name: '綠大理石圓桌', lv: 12, cost: 3200, score: 15 },
  tbl_pink: { kind: 'table', name: '粉紅大理石圓桌', lv: 18, cost: 0, coupon: 8, score: 22 },
  ch_bentwood: { kind: 'chair', name: '曲木藤座椅', lv: 1, cost: 200, score: 3 },
  ch_cane: { kind: 'chair', name: '橡木藤背椅', lv: 3, cost: 380, score: 4 },
  ch_stool: { kind: 'chair', name: '皮革高腳椅', lv: 4, cost: 450, score: 4 },
  ch_velvet: { kind: 'chair', name: '森林綠絨布椅', lv: 5, cost: 900, score: 7 },
  ch_rose: { kind: 'chair', name: '玫瑰粉絨布椅', lv: 6, cost: 900, score: 7 },
  ch_mustard: { kind: 'chair', name: '芥末黃絨布椅', lv: 8, cost: 1100, score: 8 },
  ch_navy: { kind: 'chair', name: '午夜藍絨布椅', lv: 11, cost: 1600, score: 10 },
  ch_leather: { kind: 'chair', name: '干邑皮革沙發', lv: 10, cost: 2400, score: 12 },
  ch_royal: { kind: 'chair', name: '黃銅框天鵝絨椅', lv: 20, cost: 0, coupon: 6, score: 20 },
  monstera: { kind: 'decor', name: '龜背芋', lv: 1, cost: 250, score: 5 },
  olive: { kind: 'decor', name: '橄欖樹', lv: 2, cost: 400, score: 6 },
  sacks: { kind: 'decor', name: '咖啡生豆麻袋', lv: 2, cost: 300, score: 4 },
  floorlamp: { kind: 'decor', name: '黃銅弧形立燈', lv: 3, cost: 700, score: 8 },
  fiddle: { kind: 'decor', name: '琴葉榕', lv: 5, cost: 900, score: 9 },
  cakestand: { kind: 'decor', name: '甜點展示台', lv: 6, cost: 1200, score: 10 },
  bookshelf: { kind: 'decor', name: '胡桃木書櫃', lv: 7, cost: 1800, score: 14 },
  sideboard: { kind: 'decor', name: '藤編邊櫃', lv: 9, cost: 2200, score: 15 },
  gramophone: { kind: 'decor', name: '復古留聲機', lv: 12, cost: 3500, score: 20 },
  piano: { kind: 'decor', name: '直立式鋼琴', lv: 16, cost: 9000, score: 35 },
  fountain: { kind: 'decor', name: '黃銅咖啡噴泉', lv: 22, cost: 0, coupon: 10, score: 40 },
  pendant_globe: { kind: 'pendant', name: '乳白球形吊燈', lv: 3, cost: 500, score: 5 },
  pendant_brass: { kind: 'pendant', name: '黃銅燈罩吊燈', lv: 6, cost: 800, score: 7 },
  w_art0: { kind: 'wall', name: '夕陽山景畫', lv: 1, cost: 200, score: 3 },
  w_clock: { kind: 'wall', name: '黃銅掛鐘', lv: 2, cost: 350, score: 4 },
  w_sconce: { kind: 'wall', name: '黃銅壁燈', lv: 3, cost: 450, score: 5 },
  w_art1: { kind: 'wall', name: '抽象色塊畫', lv: 4, cost: 500, score: 5 },
  w_shelf: { kind: 'wall', name: '咖啡器具層架', lv: 5, cost: 700, score: 7 },
  w_menu: { kind: 'wall', name: '黑板菜單', lv: 6, cost: 600, score: 6 },
  w_mirror: { kind: 'wall', name: '黃銅圓鏡', lv: 8, cost: 1200, score: 10 },
  w_art2: { kind: 'wall', name: '植物線稿畫', lv: 9, cost: 900, score: 8 },
  w_window: { kind: 'wall', name: '拱形鐵窗', lv: 10, cost: 2500, score: 16 },
  w_neon: { kind: 'wall', name: '粉紅霓虹招牌', lv: 14, cost: 3000, score: 18 },
  // 咖啡車代幣限定（不在商店販售）
  w_truck_art: { kind: 'wall', name: '咖啡車海報', lv: 1, cost: 600, score: 12, hidden: true },
  sign_truck: { kind: 'decor', name: '咖啡車立牌', lv: 1, cost: 1200, score: 25, hidden: true },
  sign_heart: { kind: 'decor', name: '愛心食物銀行立牌', lv: 1, cost: 2000, score: 40, hidden: true },
};
export const FLOORS = {
  herring_walnut: { name: '胡桃木人字拼', lv: 1, cost: 0, score: 0 },
  planks_honey: { name: '蜂蜜橡木地板', lv: 4, cost: 2000, score: 15 },
  checker: { name: '黑白棋盤磚', lv: 7, cost: 4000, score: 25 },
  herring_oak: { name: '淺橡木人字拼', lv: 11, cost: 7000, score: 35 },
  terrazzo: { name: '義式水磨石', lv: 15, cost: 12000, score: 50 },
  marble: { name: '白大理石地', lv: 21, cost: 0, coupon: 15, score: 75 },
};
export const WALLS = {
  sage: { name: '鼠尾草綠護牆', lv: 1, cost: 0, score: 0 },
  blush: { name: '乾燥玫瑰護牆', lv: 5, cost: 2500, score: 15 },
  navy: { name: '深藍條紋壁紙', lv: 8, cost: 5000, score: 25 },
  brick: { name: '工業風紅磚', lv: 12, cost: 8000, score: 35 },
  forest: { name: '墨綠英式護牆', lv: 16, cost: 13000, score: 50 },
  walnut: { name: '胡桃木牆板', lv: 22, cost: 0, coupon: 15, score: 75 },
};

// ---------------- 換裝 ----------------
export const SKINS = ['#f6d9c3', '#f0c9ad', '#dcac88', '#b9825c'];
export const HAIR_COLORS = ['#2a1d18', '#4a2f22', '#7a4a2e', '#b07a4a', '#d9b26a', '#8a3b2e', '#3a3a48', '#c9c3bb'];
export const HAIR_STYLES = { short: '短髮', bob: '鮑伯頭', long: '長髮', bun: '包包頭', pony: '馬尾', curly: '捲髮' };
export const WARDROBE = {
  // 上衣
  top_white: { slot: 'top', name: '白色亞麻襯衫', color: '#f4efe6', cost: 0 },
  top_stripe: { slot: 'top', name: '海軍條紋衫', color: '#2c3a56', cost: 600, lv: 2 },
  top_knit: { slot: 'top', name: '燕麥色針織衫', color: '#d9c7a8', cost: 900, lv: 4 },
  top_sage: { slot: 'top', name: '鼠尾草綠襯衫', color: '#8fa696', cost: 1200, lv: 6 },
  top_rose: { slot: 'top', name: '乾燥玫瑰上衣', color: '#c98a86', cost: 1500, lv: 8 },
  top_black: { slot: 'top', name: '黑色高領衫', color: '#26252a', cost: 2000, lv: 10 },
  top_mustard: { slot: 'top', name: '芥末黃開襟衫', color: '#c49a3a', cost: 2600, lv: 14 },
  top_vest: { slot: 'top', name: '咖啡師背心', color: '#3b2a22', cost: 0, coupon: 5, lv: 12 },
  top_truck: { slot: 'top', name: '咖啡車外套', color: '#e8665a', cost: 0, hidden: true },
  // 下身
  bot_black: { slot: 'bottom', name: '黑色長褲', color: '#2b2b2f', cost: 0 },
  bot_khaki: { slot: 'bottom', name: '卡其褲', color: '#cdbfa8', cost: 500, lv: 2 },
  bot_denim: { slot: 'bottom', name: '深色丹寧', color: '#34435e', cost: 800, lv: 4 },
  bot_skirt: { slot: 'bottom', name: '百褶長裙', color: '#3b3b44', cost: 1200, lv: 6, skirt: true },
  bot_skirt_rose: { slot: 'bottom', name: '玫瑰色長裙', color: '#9a5a5a', cost: 1800, lv: 10, skirt: true },
  // 帽子
  hat_none: { slot: 'hat', name: '不戴帽子', cost: 0 },
  hat_beret: { slot: 'hat', name: '畫家貝雷帽', cost: 1500, lv: 7 },
  hat_cap: { slot: 'hat', name: '店名棒球帽', cost: 1000, lv: 5 },
  // 眼鏡
  glass_none: { slot: 'glasses', name: '不戴眼鏡', cost: 0 },
  glass_round: { slot: 'glasses', name: '圓框眼鏡', cost: 800, lv: 3 },
  // 圍裙（店員制服共用）
  apron_forest: { slot: 'apron', name: '森林綠圍裙', color: '#2f5446', cost: 0 },
  apron_espresso: { slot: 'apron', name: '濃縮棕圍裙', color: '#4a2e1e', cost: 800, lv: 3 },
  apron_navy: { slot: 'apron', name: '海軍藍圍裙', color: '#25324a', cost: 1200, lv: 6 },
  apron_linen: { slot: 'apron', name: '亞麻米圍裙', color: '#d9cdb8', cost: 1500, lv: 9 },
  apron_burgundy: { slot: 'apron', name: '酒紅圍裙', color: '#5e2129', cost: 2200, lv: 13 },
};
export const PROF_PER_ITEM = 3; // 每買一件衣服，員工熟練度 +3

// ---------------- 常客（原創角色） ----------------
// need：街頭招攬需要成功幾次；fav：最愛飲品；orders：特別訂單（暗示文字 → 正確配方）
export const REGULARS = {
  zhe: {
    name: '阿哲', title: '熬夜工程師', lv: 6, need: 2, fav: 'americano',
    look: { skin: '#f0c9ad', hair: '#2a1d18', hairStyle: 'short', top: '#3a3a48', bottom: '#34435e', glasses: true },
    catch: '這個 bug 不修好我今天不睡了…',
    quiz: [
      { q: '我已經連續加班三天了，現在需要的是…', a: ['一杯能撐到半夜的黑咖啡', '一杯甜甜的熱可可', '一杯溫和的拿鐵'], ok: 0 },
      { q: '妳覺得工程師最怕什麼？', a: ['下雨天', '上線前一刻發現 bug', '吃太飽'], ok: 1 },
      { q: '我喜歡的咖啡店，一定要有…', a: ['插座和安靜的角落', '很大聲的音樂', '很多人聊天'], ok: 0 },
      { q: '如果我在你店裡睡著了…', a: ['大聲叫醒我', '讓我睡一下，再幫我續一杯', '把我請出去'], ok: 1 },
    ],
    orders: [
      { recipe: 'americano', hint: '老樣子，黑的、不加糖，越大杯越好。' },
      { recipe: 'espresso', hint: '時間緊迫，給我最濃最小杯的那種，一口就喝完。' },
      { recipe: 'iced_americano', hint: '機房好熱…給我冰的黑咖啡。' },
    ],
  },
  lulu: {
    name: '小鹿', title: '插畫家', lv: 7, need: 2, fav: 'caramel_mac',
    look: { skin: '#f6d9c3', hair: '#b07a4a', hairStyle: 'bob', top: '#c98a86', bottom: '#3b3b44', bottomType: 'skirt', hat: 'beret' },
    catch: '今天的光線好漂亮，好想畫下來。',
    quiz: [
      { q: '我在找可以畫圖的地方，最重要的是…', a: ['光線好、布置有質感', '價格最便宜', '離捷運站最近'], ok: 0 },
      { q: '畫圖卡關的時候，我最需要…', a: ['苦到發抖的黑咖啡', '甜甜的焦糖飲料', '一杯白開水'], ok: 1 },
      { q: '妳覺得我最喜歡哪種顏色？', a: ['螢光綠', '溫柔的奶茶色', '純黑'], ok: 1 },
      { q: '如果我畫了妳的店…', a: ['可以放在店裡展示嗎？', '要收版權費喔', '不准畫'], ok: 0 },
    ],
    orders: [
      { recipe: 'caramel_mac', hint: '我要那杯上面有焦糖格紋、甜甜香香的。' },
      { recipe: 'vanilla_latte', hint: '今天想要很溫柔的味道，有香草香的那種。' },
      { recipe: 'mocha', hint: '畫累了，想喝有巧克力、上面堆滿鮮奶油的。' },
    ],
  },
  yong: {
    name: '阿勇', title: '健身教練', lv: 8, need: 2, fav: 'flat_white',
    look: { skin: '#dcac88', hair: '#2a1d18', hairStyle: 'short', top: '#26252a', bottom: '#2b2b2f', hat: 'cap', capColor: '#c9826a' },
    catch: '練完腿，補充一下！',
    quiz: [
      { q: '練完重訓，我最在意的是…', a: ['糖分不要太多', '一定要加三倍糖', '要有很多鮮奶油'], ok: 0 },
      { q: '妳看我今天哪裡練最多？', a: ['腿', '手指', '眼皮'], ok: 0 },
      { q: '我喜歡的咖啡，牛奶要…', a: ['完全不要', '剛好就好，咖啡味要夠', '牛奶比咖啡多十倍'], ok: 1 },
      { q: '早上七點，妳會在哪裡？', a: ['還在睡覺', '店裡準備開門', '在夜店'], ok: 1 },
    ],
    orders: [
      { recipe: 'flat_white', hint: '我要奶跟咖啡都很扎實，濃縮要雙份的那杯。' },
      { recipe: 'latte', hint: '今天輕鬆一點，牛奶多一點的熱咖啡就好。' },
      { recipe: 'iced_latte', hint: '剛跑完五公里，給我冰的牛奶咖啡！' },
    ],
  },
  lin: {
    name: '林老師', title: '退休教授', lv: 9, need: 3, fav: 'cappuccino',
    look: { skin: '#f0c9ad', hair: '#c9c3bb', hairStyle: 'short', top: '#d9c7a8', bottom: '#5b4a40', glasses: true },
    catch: '年輕人，咖啡要慢慢喝。',
    quiz: [
      { q: '我年輕時在義大利念書，那裡的早晨總是…', a: ['來一杯卡布奇諾配可頌', '喝珍珠奶茶', '吃滷肉飯'], ok: 0 },
      { q: '妳覺得一間好咖啡店最重要的是…', a: ['網美拍照牆', '不變的好味道', '最便宜'], ok: 1 },
      { q: '我喜歡坐在店裡…', a: ['安靜看報紙', '大聲講電話', '一直滑手機'], ok: 0 },
      { q: '奶泡要多厚？', a: ['完全不要奶泡', '綿密的一層，剛剛好', '多到溢出來'], ok: 1 },
    ],
    orders: [
      { recipe: 'cappuccino', hint: '奶泡要厚一點，和義大利那家店一樣。' },
      { recipe: 'cinnamon_cap', hint: '今天在奶泡上，灑一點溫暖的香料吧。' },
      { recipe: 'pourover', hint: '我想慢慢品嚐單一產區的豆子，用手沖的。' },
    ],
  },
  qian: {
    name: '芊芊', title: '大學新鮮人', lv: 10, need: 2, fav: 'iced_latte',
    look: { skin: '#f6d9c3', hair: '#4a2f22', hairStyle: 'pony', top: '#8fa696', bottom: '#cdbfa8' },
    catch: '期中考加油加油加油！',
    quiz: [
      { q: '學生最在意的是…', a: ['價格實惠又好喝', '越貴越好', '要有包廂'], ok: 0 },
      { q: '我讀書的時候，喜歡喝…', a: ['熱騰騰的濃縮', '冰冰涼涼的牛奶咖啡', '熱水'], ok: 1 },
      { q: '下課後我通常會…', a: ['和同學一起來喝咖啡', '直接回家睡覺', '去上班'], ok: 0 },
      { q: '妳覺得考試前一晚應該…', a: ['早點睡覺', '通宵玩遊戲', '先來一杯咖啡再衝一下'], ok: 2 },
    ],
    orders: [
      { recipe: 'iced_latte', hint: '我要那杯冰冰的、牛奶很多的咖啡！' },
      { recipe: 'iced_americano', hint: '今天要熬夜唸書，冰的黑咖啡一杯。' },
      { recipe: 'latte', hint: '冷氣好冷…想喝熱的牛奶咖啡。' },
    ],
  },
  momo: {
    name: 'Momo', title: '甜點部落客', lv: 12, need: 3, fav: 'mocha',
    look: { skin: '#f6d9c3', hair: '#d9b26a', hairStyle: 'long', top: '#f4a6c0', bottom: '#f4efe6', bottomType: 'skirt' },
    catch: '先讓手機吃！',
    quiz: [
      { q: '我介紹店家時，最看重的是…', a: ['甜點和飲料好不好拍', '停車位多不多', '老闆帥不帥'], ok: 0 },
      { q: '我最愛的組合是…', a: ['黑咖啡配白飯', '巧克力咖啡配鮮奶油', '冰水配冰塊'], ok: 1 },
      { q: '妳的店最上鏡的角落是…', a: ['廁所', '有植物和自然光的窗邊', '後門'], ok: 1 },
      { q: '我的粉絲最喜歡看…', a: ['療癒的甜點特寫', '財經新聞', '天氣預報'], ok: 0 },
    ],
    orders: [
      { recipe: 'mocha', hint: '要巧克力醬、上面擠一圈鮮奶油的熱的，超好拍！' },
      { recipe: 'iced_mocha', hint: '今天想拍冰的巧克力咖啡，鮮奶油要堆高高。' },
      { recipe: 'caramel_frappe', hint: '那個冰沙、焦糖淋好淋滿的，我要拍成封面！' },
    ],
  },
  elise: {
    name: 'Elise', title: '鋼琴老師', lv: 14, need: 3, fav: 'vienna',
    look: { skin: '#f6d9c3', hair: '#2a1d18', hairStyle: 'bun', top: '#26252a', bottom: '#26252a', bottomType: 'skirt' },
    catch: '今天的節奏，是三拍子的華爾滋。',
    quiz: [
      { q: '我教完琴之後，喜歡…', a: ['安靜地喝一杯優雅的咖啡', '去唱 KTV', '喝能量飲料'], ok: 0 },
      { q: '妳覺得店裡適合放什麼音樂？', a: ['重金屬', '輕柔的古典鋼琴', '廣告歌'], ok: 1 },
      { q: '維也納除了音樂之外還有名的是…', a: ['鮮奶油咖啡', '臭豆腐', '泡麵'], ok: 0 },
      { q: '如果店裡有一台鋼琴…', a: ['我可以彈一首嗎？', '太佔位置了', '拿來當桌子'], ok: 0 },
    ],
    orders: [
      { recipe: 'vienna', hint: '請給我那杯，黑咖啡上蓋著厚厚鮮奶油的，像維也納的冬天。' },
      { recipe: 'cappuccino', hint: '今天想要經典的、奶泡多一點的熱咖啡。' },
      { recipe: 'macchiato', hint: '只要一小杯濃縮，上面點一點奶泡就好。' },
    ],
  },
  fei: {
    name: '小飛', title: '外送員', lv: 16, need: 2, fav: 'iced_americano',
    look: { skin: '#dcac88', hair: '#7a4a2e', hairStyle: 'short', top: '#4f8a78', bottom: '#2b2b2f', hat: 'cap', capColor: '#e3a23a' },
    catch: '還有三單要送，快快快！',
    quiz: [
      { q: '我最需要的是…', a: ['很快就能拿到的飲料', '慢慢品嚐的套餐', '一張沙發'], ok: 0 },
      { q: '騎車曬了一整天，我想喝…', a: ['熱湯', '冰的咖啡', '熱牛奶'], ok: 1 },
      { q: '下雨天外送最辛苦的是…', a: ['手機會濕掉', '肚子會餓', '雨衣太好看'], ok: 0 },
      { q: '你們店可以…', a: ['幫我先做好讓我外帶嗎？', '陪我聊三小時', '幫我送單'], ok: 0 },
    ],
    orders: [
      { recipe: 'iced_americano', hint: '冰的黑咖啡，我馬上要走！' },
      { recipe: 'dirty', hint: '那杯冰牛奶上面直接淋濃縮、不要攪的，快！' },
      { recipe: 'iced_latte', hint: '冰的牛奶咖啡一杯，外帶！' },
    ],
  },
  kiri: {
    name: '霧島', title: '推理小說家', lv: 18, need: 4, fav: 'pourover',
    look: { skin: '#f0c9ad', hair: '#3a3a48', hairStyle: 'long', top: '#26252a', bottom: '#2b2b2f', glasses: true },
    catch: '……兇手，就在這杯咖啡裡。',
    quiz: [
      { q: '真相往往藏在…', a: ['最不起眼的細節裡', '冰箱裡', '電視上'], ok: 0 },
      { q: '我寫作的時候，咖啡要…', a: ['越甜越好', '不加任何東西，喝得出產地', '加很多冰塊'], ok: 1 },
      { q: '妳覺得我是怎樣的人？', a: ['很吵', '有點神秘', '很愛運動'], ok: 1 },
      { q: '如果我在店裡寫下一本小說…', a: ['可以讓這間店當舞台嗎？', '請不要寫', '要付場地費'], ok: 0 },
    ],
    orders: [
      { recipe: 'pourover', hint: '一杯手沖。讓我從香氣裡推理它的產地。' },
      { recipe: 'dutch', hint: '冷的、靜靜一滴一滴萃取的那種，像慢慢解開的謎。' },
      { recipe: 'espresso', hint: '線索不夠…先給我一口最濃縮的。' },
    ],
  },
  wei: {
    name: '薇薇', title: '花店老闆娘', lv: 20, need: 3, fav: 'vanilla_latte',
    look: { skin: '#f6d9c3', hair: '#8a3b2e', hairStyle: 'curly', top: '#f4efe6', bottom: '#8fa696', bottomType: 'skirt' },
    catch: '今天進了好多芍藥喔～',
    quiz: [
      { q: '我開花店，最喜歡的季節是…', a: ['花最多的春天', '颱風天', '沒有花的時候'], ok: 0 },
      { q: '我覺得咖啡店放什麼最漂亮？', a: ['一束當季鮮花', '一堆紙箱', '塑膠花'], ok: 0 },
      { q: '我喜歡的味道是…', a: ['淡淡的香草和花香', '辣椒', '大蒜'], ok: 0 },
      { q: '如果我每週送花來店裡…', a: ['那我請你喝咖啡！', '不用了', '要收錢'], ok: 0 },
    ],
    orders: [
      { recipe: 'vanilla_latte', hint: '我要那杯有香草香氣、溫溫的牛奶咖啡。' },
      { recipe: 'matcha_latte', hint: '今天想喝綠色的、像春天草地一樣的那杯。' },
      { recipe: 'caramel_mac', hint: '甜甜的、上面淋著焦糖的熱飲，謝謝～' },
    ],
  },
};
export const REGULAR_ORDER = Object.keys(REGULARS);
export const FRIEND_LV = [
  { need: 5, reward: { gold: 1000 }, label: '點頭之交' },
  { need: 15, reward: { beans: 800 }, label: '熟面孔' },
  { need: 32, reward: { coupon: 3 }, label: '好朋友' },
  { need: 55, reward: { coupon: 5, gold: 5000 }, label: '摯友' },
];

// 一般路人的性格與問題
export const PASSERBY_TYPES = {
  tired: {
    tag: '疲倦的上班族', quiz: [
      { q: '昨天加班到半夜，現在腦袋一片空白…', a: ['來杯濃一點的咖啡提提神', '去睡覺吧', '喝杯熱可可'], ok: 0 },
      { q: '我一天要喝幾杯咖啡才夠？', a: ['一杯都不用', '至少兩杯起跳', '要喝茶'], ok: 1 },
      { q: '上班前最想要的是…', a: ['不用排隊、很快拿到', '慢慢吃早午餐', '去健身'], ok: 0 },
    ],
  },
  sweet: {
    tag: '愛甜食的路人', quiz: [
      { q: '我超愛甜的東西！你們有…', a: ['焦糖、巧克力口味的咖啡', '只有黑咖啡', '苦瓜汁'], ok: 0 },
      { q: '甜點跟咖啡要怎麼搭？', a: ['分開吃', '一口蛋糕一口咖啡最幸福', '不吃甜點'], ok: 1 },
      { q: '心情不好的時候…', a: ['來一杯甜甜的就會變好', '喝苦的懲罰自己', '什麼都不喝'], ok: 0 },
    ],
  },
  student: {
    tag: '找地方讀書的學生', quiz: [
      { q: '我要找讀書的地方，最重要的是…', a: ['安靜、可以坐久一點', '很吵很熱鬧', '要站著'], ok: 0 },
      { q: '學生預算有限…', a: ['有平價又好喝的選擇', '只賣最貴的', '不收學生'], ok: 0 },
      { q: '讀書讀到一半想…', a: ['來杯冰咖啡醒腦', '直接回家', '打電動'], ok: 0 },
    ],
  },
  stylish: {
    tag: '追求質感的路人', quiz: [
      { q: '我選咖啡店，第一眼看的是…', a: ['裝潢和氣氛', '招牌字體大不大', '停車場'], ok: 0 },
      { q: '妳覺得精品咖啡最重要的是…', a: ['豆子的產地與烘焙', '杯子要很大', '要很便宜'], ok: 0 },
      { q: '店裡如果有鋼琴或書櫃…', a: ['感覺很有品味', '很佔位置', '沒差'], ok: 0 },
    ],
  },
  health: {
    tag: '注重健康的路人', quiz: [
      { q: '我最近在控制糖分…', a: ['可以做無糖的喔', '一定要加糖', '請喝汽水'], ok: 0 },
      { q: '咖啡加什麼比較健康？', a: ['適量的鮮奶', '五份糖漿', '一整罐鮮奶油'], ok: 0 },
      { q: '早上運動完，我想喝…', a: ['溫和的牛奶咖啡', '啤酒', '珍珠奶茶全糖'], ok: 0 },
    ],
  },
};

// ---------------- 鄰居咖啡店（NPC 好友） ----------------
export const NEIGHBORS = {
  mori: {
    owner: '小森', cafe: '森之間', desc: '開在公園旁、滿是植物的木屋咖啡。', floor: 'herring_oak', wall: 'sage',
    look: { skin: '#f0c9ad', hair: '#4a2f22', hairStyle: 'bun', top: '#8fa696', bottom: '#cdbfa8' },
    layout: [['olive', 4, 3], ['monstera', 0, 3], ['fiddle', 6, 1], ['tbl_walnut', 3, 4], ['ch_cane', 2, 4, 'px'], ['ch_cane', 4, 4, 'nx'], ['tbl_marble', 5, 5], ['ch_bentwood', 5, 6, 'nz'], ['ch_bentwood', 6, 5, 'nx'], ['sacks', 1, 5], ['floorlamp', 6, 3]],
    wallItems: [['w_window', 'L', 3], ['w_shelf', 'L', 1], ['w_art2', 'R', 5]],
  },
  harbor: {
    owner: '海老闆', cafe: '港灣藍', desc: '看得到港口的海洋風咖啡館。', floor: 'checker', wall: 'navy',
    look: { skin: '#dcac88', hair: '#3a3a48', hairStyle: 'short', top: '#2c3a56', bottom: '#cdbfa8', hat: 'cap', capColor: '#25324a' },
    layout: [['tbl_bistro', 3, 4], ['ch_stool', 2, 4, 'px'], ['ch_stool', 4, 4, 'nx'], ['tbl_bistro', 5, 3], ['ch_navy', 5, 4, 'nz'], ['ch_navy', 6, 3, 'nx'], ['bookshelf', 6, 1], ['monstera', 0, 5], ['gramophone', 1, 3]],
    wallItems: [['w_mirror', 'L', 2], ['w_clock', 'R', 5], ['w_sconce', 'L', 4]],
  },
  rose: {
    owner: '玫姊', cafe: '玫瑰甜點沙龍', desc: '以甜點聞名、粉嫩優雅的沙龍。', floor: 'terrazzo', wall: 'blush',
    look: { skin: '#f6d9c3', hair: '#8a3b2e', hairStyle: 'long', top: '#f4efe6', bottom: '#9a5a5a', bottomType: 'skirt' },
    layout: [['tbl_marble', 3, 4], ['ch_rose', 3, 5, 'nz'], ['ch_rose', 4, 4, 'nx'], ['tbl_terrazzo', 5, 2], ['ch_rose', 5, 3, 'nz'], ['ch_mustard', 6, 2, 'nx'], ['cakestand', 1, 4], ['sideboard', 6, 4], ['fiddle', 0, 3]],
    wallItems: [['w_art1', 'L', 3], ['w_neon', 'R', 5], ['w_mirror', 'L', 5]],
  },
  rail: {
    owner: '阿鐵', cafe: '鐵道烘焙所', desc: '老倉庫改建、自家烘豆的工業風名店。', floor: 'planks_honey', wall: 'brick',
    look: { skin: '#dcac88', hair: '#2a1d18', hairStyle: 'curly', top: '#26252a', bottom: '#34435e', hat: 'beret' },
    layout: [['tbl_walnut', 3, 4], ['ch_leather', 3, 5, 'nz'], ['ch_leather', 4, 4, 'nx'], ['sacks', 6, 1], ['sacks', 5, 1], ['tbl_bistro', 5, 4], ['ch_stool', 6, 4, 'nx'], ['piano', 1, 4], ['olive', 0, 3]],
    wallItems: [['w_menu', 'L', 2], ['w_sconce', 'R', 5], ['w_art0', 'L', 4]],
  },
};
export const NEIGHBOR_ORDER = Object.keys(NEIGHBORS);
export const HELPS_PER_DAY = 3;
export const CLOVER_FROM_NEIGHBOR = 2 * 3600; // 每個鄰居每 2 小時送你一個幸運草
export const CLOVER_SEND_CD = 30 * 60;
export const CLOVER_BOX = 10;

// ---------------- 招攬用傳單 ----------------
export const FLYER_MAX = 5;
export const FLYER_REGEN = 600;

// ---------------- 店貓 ----------------
export const CATS = {
  orange: { name: '橘貓', fur: '#e39a4f', belly: '#fbe9d4', pattern: 'stripe' },
  black: { name: '黑貓', fur: '#2a2628', belly: '#3a3436', pattern: 'none' },
  tabby: { name: '虎斑貓', fur: '#9a8a76', belly: '#efe6d8', pattern: 'stripe' },
  calico: { name: '三花貓', fur: '#f4efe6', belly: '#f4efe6', pattern: 'calico' },
};
export const CAT_LV = 12;
export const CAT_COST = 3000;

// ---------------- 咖啡車（三消小遊戲） ----------------
export const TRUCK_LV = 18;
export const TRUCK_ORDERS_PER_DAY = 5;
export const TRUCK_PIECES = ['bean', 'milk', 'cup', 'croissant', 'leaf', 'heart'];
export const TRUCK_SHOP = {
  w_truck_art: { kind: 'wall', name: '咖啡車海報', price: 30, score: 12 },
  sign_truck: { kind: 'decor', name: '咖啡車立牌', price: 60, score: 25 },
  top_truck: { kind: 'outfit', name: '咖啡車外套', price: 45 },
};

// 每日任務池
export const DAILY_POOL = [
  { key: 'sold', name: '賣出咖啡', target: lv => 80 + lv * 12, reward: lv => ({ gold: 300 + lv * 60 }) },
  { key: 'roastCollect', name: '收成咖啡豆', target: () => 3, reward: lv => ({ beans: 100 + lv * 30 }) },
  { key: 'sideCollect', name: '收成點心', target: () => 2, reward: lv => ({ gold: 200 + lv * 40 }), lv: 4 },
  { key: 'recruitTry', name: '街頭招攬', target: () => 2, reward: lv => ({ gold: 150 + lv * 30 }) },
  { key: 'help', name: '去鄰居店裡幫忙', target: () => 3, reward: lv => ({ beans: 120 + lv * 20 }) },
  { key: 'cloverSend', name: '送出幸運草', target: () => 3, reward: () => ({ coupon: 1 }) },
  { key: 'wake', name: '叫醒睡著的客人', target: () => 3, reward: lv => ({ gold: 100 + lv * 30 }) },
  { key: 'chairFix', name: '扶正歪掉的椅子', target: () => 5, reward: lv => ({ gold: 100 + lv * 20 }) },
  { key: 'special', name: '完成常客特別訂單', target: () => 1, reward: () => ({ coupon: 1 }), lv: 6 },
  { key: 'drag', name: '幫員工打氣', target: () => 3, reward: lv => ({ beans: 80 + lv * 20 }) },
];
export const DAILY_RESET_HOUR = 6;

// ---------------- 廚房料理（Hello Seafood 式：正餐 + 客製加料） ----------------
export const KITCHEN_MACHINES = {
  griddle: { name: '早午餐鐵板', lv: 7, cost: 3500 },
  stove: { name: '義大利麵爐', lv: 11, cost: 8000 },
  press: { name: '帕尼尼壓烤機', lv: 15, cost: 14000 },
  pizza: { name: '窯烤披薩爐', lv: 21, cost: 26000 },
  rice: { name: '日式定食台', lv: 9, cost: 5000 },
  salad: { name: '沙拉吧', lv: 12, cost: 8000 },
  wok: { name: '中華炒鍋', lv: 14, cost: 11000 },
  fryer: { name: '炸物鍋', lv: 17, cost: 15000 },
  soup: { name: '燉湯爐', lv: 19, cost: 18000 },
  grill: { name: '炭烤爐', lv: 25, cost: 32000 },
  seafood: { name: '海鮮料理台', lv: 30, cost: 48000 },
  korean: { name: '韓式料理台', lv: 34, cost: 60000 },
  sushi: { name: '壽司吧台', lv: 40, cost: 85000 },
};
function ml(id, name, machine, lv, color, en) {
  const price = Math.round(30 + lv * 3.6), pcs = lv < 20 ? 12 : 10;
  return { [id]: { name, en, machine, lv, color, time: Math.round(Math.min(14400, 90 * Math.pow(1.16, lv))), pcs, cost: Math.round(price * pcs * 0.3), price, exp: 2 + Math.floor(lv / 6) } };
}
export const MEALS = {
  pancake: { name: '經典美式鬆餅', machine: 'griddle', lv: 7, time: 180, pcs: 10, cost: 120, price: 38, exp: 3, color: '#e0a85a' },
  frenchtoast: { name: '法式吐司', machine: 'griddle', lv: 8, time: 360, pcs: 10, cost: 160, price: 44, exp: 3, color: '#d99a4f' },
  benedict: { name: '班尼迪克蛋', machine: 'griddle', lv: 10, time: 720, pcs: 10, cost: 220, price: 58, exp: 4, color: '#f2d36b' },
  carbonara: { name: '培根蛋奶麵', machine: 'stove', lv: 11, time: 900, pcs: 12, cost: 260, price: 68, exp: 4, color: '#f1e3b6' },
  pesto: { name: '青醬蛤蜊麵', machine: 'stove', lv: 12, time: 1200, pcs: 12, cost: 300, price: 74, exp: 5, color: '#7fa25a' },
  tomato: { name: '番茄海鮮麵', machine: 'stove', lv: 14, time: 1800, pcs: 12, cost: 360, price: 82, exp: 5, color: '#d0533e' },
  panini: { name: '火腿起司帕尼尼', machine: 'press', lv: 15, time: 900, pcs: 12, cost: 280, price: 60, exp: 4, color: '#d9b07a' },
  cubano: { name: '古巴三明治', machine: 'press', lv: 17, time: 1800, pcs: 12, cost: 360, price: 76, exp: 5, color: '#c98a4f' },
  croque: { name: '庫克太太三明治', machine: 'press', lv: 19, time: 2700, pcs: 12, cost: 420, price: 88, exp: 6, color: '#e9c46a' },
  margherita: { name: '瑪格麗特披薩', machine: 'pizza', lv: 21, time: 2400, pcs: 10, cost: 480, price: 96, exp: 6, color: '#d6553f' },
  truffle_pizza: { name: '松露蘑菇披薩', machine: 'pizza', lv: 24, time: 3600, pcs: 10, cost: 600, price: 118, exp: 7, color: '#8a6a4a' },
  seafood_pizza: { name: '海鮮總匯披薩', machine: 'pizza', lv: 28, time: 5400, pcs: 10, cost: 720, price: 135, exp: 8, color: '#e07a5f' },
  // ---- 擴充料理（各國料理） ----
  ...ml('curry_rice', '日式咖哩飯', 'rice', 9, '#b8792a', 'Japanese Curry Rice'),
  ...ml('omurice', '蛋包飯', 'rice', 11, '#f2c84a', 'Omurice'),
  ...ml('caesar', '凱薩沙拉', 'salad', 12, '#8fbf5a', 'Caesar Salad'),
  ...ml('oyakodon', '親子丼', 'rice', 13, '#e9b84a', 'Oyakodon'),
  ...ml('aglio', '蒜香辣椒麵', 'stove', 13, '#efd9a0', 'Aglio e Olio'),
  ...ml('big_breakfast', '英式全日早餐', 'griddle', 13, '#d9a65c', 'Full Breakfast'),
  ...ml('fried_rice', '黃金蛋炒飯', 'wok', 14, '#efcf6a', 'Golden Egg Fried Rice'),
  ...ml('katsudon', '豬排丼', 'rice', 15, '#d99a4f', 'Katsudon'),
  ...ml('bolognese', '波隆那肉醬麵', 'stove', 16, '#b8452e', 'Spaghetti Bolognese'),
  ...ml('nicoise', '尼斯沙拉', 'salad', 16, '#7faa5a', 'Niçoise Salad'),
  ...ml('chow_mein', '什錦炒麵', 'wok', 16, '#c98a3a', 'Chow Mein'),
  ...ml('fries', '綜合薯條拼盤', 'fryer', 17, '#f2c24e', 'Fries Platter'),
  ...ml('club', '總匯三明治', 'press', 18, '#e9c27a', 'Club Sandwich'),
  ...ml('fish_chips', '炸魚薯條', 'fryer', 19, '#e0a84a', 'Fish & Chips'),
  ...ml('pumpkin_soup', '南瓜濃湯', 'soup', 19, '#f0a43a', 'Pumpkin Soup'),
  ...ml('mapo', '麻婆豆腐飯', 'wok', 20, '#c9452e', 'Mapo Tofu Rice'),
  ...ml('salmon_poke', '鮭魚波奇碗', 'salad', 20, '#f08a6a', 'Salmon Poke Bowl'),
  ...ml('karaage', '日式唐揚雞', 'fryer', 21, '#c9822e', 'Karaage'),
  ...ml('onion_soup', '法式洋蔥湯', 'soup', 21, '#c98a4f', 'French Onion Soup'),
  ...ml('pepperoni', '臘腸披薩', 'pizza', 22, '#c9452e', 'Pepperoni Pizza'),
  ...ml('kungpao', '宮保雞丁', 'wok', 22, '#b8452e', 'Kung Pao Chicken'),
  ...ml('quinoa', '藜麥能量碗', 'salad', 23, '#b9a46a', 'Quinoa Power Bowl'),
  ...ml('clam_chowder', '蛤蜊巧達湯', 'soup', 23, '#f4ead2', 'Clam Chowder'),
  ...ml('calamari', '酥炸花枝圈', 'fryer', 24, '#e9c27a', 'Fried Calamari'),
  ...ml('steak', '炭烤肋眼牛排', 'grill', 25, '#7a3a26', 'Grilled Ribeye'),
  ...ml('borscht', '羅宋湯', 'soup', 25, '#b8352e', 'Borscht'),
  ...ml('quattro', '四種起司披薩', 'pizza', 26, '#f2d36b', 'Quattro Formaggi'),
  ...ml('chicken', '迷迭香烤雞腿', 'grill', 26, '#c98a3a', 'Rosemary Roast Chicken'),
  ...ml('unadon', '鰻魚飯', 'rice', 27, '#8a4a22', 'Unadon'),
  ...ml('skewers', '炭烤串燒拼盤', 'grill', 27, '#a8562e', 'Yakitori Platter'),
  ...ml('salmon_steak', '香煎鮭魚排', 'grill', 28, '#f08a6a', 'Pan-seared Salmon'),
  ...ml('tempura', '天婦羅拼盤', 'fryer', 29, '#f2d9a0', 'Tempura Platter'),
  ...ml('lamb', '香煎羊排', 'grill', 30, '#8a4a34', 'Lamb Chops'),
  ...ml('paella', '西班牙海鮮燉飯', 'seafood', 30, '#e9a63a', 'Seafood Paella'),
  ...ml('xo_rice', 'XO醬海鮮炒飯', 'wok', 31, '#d9a65c', 'XO Seafood Fried Rice'),
  ...ml('garlic_shrimp', '蒜味奶油蝦', 'seafood', 31, '#f08a5a', 'Garlic Butter Shrimp'),
  ...ml('oysters', '生蠔拼盤', 'seafood', 32, '#d9d4c4', 'Oyster Platter'),
  ...ml('lobster_pasta', '龍蝦義大利麵', 'stove', 33, '#e0603e', 'Lobster Linguine'),
  ...ml('grilled_lobster', '焗烤龍蝦', 'seafood', 34, '#e0603e', 'Lobster Thermidor'),
  ...ml('bibimbap', '石鍋拌飯', 'korean', 34, '#e0603e', 'Dolsot Bibimbap'),
  ...ml('tteokbokki', '辣炒年糕', 'korean', 35, '#d9402e', 'Tteokbokki'),
  ...ml('bouillabaisse', '馬賽魚湯', 'soup', 35, '#e0703e', 'Bouillabaisse'),
  ...ml('kimchi_stew', '泡菜豆腐鍋', 'korean', 36, '#d9502e', 'Kimchi Stew'),
  ...ml('crab', '辣醬螃蟹', 'seafood', 37, '#d9502e', 'Chili Crab'),
  ...ml('korean_chicken', '韓式甜辣炸雞', 'korean', 38, '#c9452e', 'Korean Fried Chicken'),
  ...ml('sushi_set', '握壽司拼盤', 'sushi', 40, '#f08a6a', 'Nigiri Set'),
  ...ml('maki', '花壽司捲', 'sushi', 41, '#2f3a2a', 'Maki Rolls'),
  ...ml('chirashi', '海鮮散壽司', 'sushi', 42, '#f08a6a', 'Chirashi Bowl'),
  ...ml('sashimi', '綜合生魚片', 'sushi', 44, '#f08a6a', 'Sashimi Platter'),
  ...ml('toro', '鮪魚大腹握壽司', 'sushi', 47, '#f0a090', 'Otoro Nigiri'),
};
export const MEAL_ORDER = Object.keys(MEALS);
for (const [k, v] of Object.entries(KITCHEN_MACHINES)) if (!BAR_MACHINES[k]) BAR_MACHINES[k] = { kind: 'kitchen', machine: k, name: v.name, lv: v.lv, cost: v.cost };
// 客製加料：每道料理最多加 3 種，每種讓整批售價提高
export const TOPPINGS = {
  cheese: { name: '濃郁起司', lv: 7, cost: 60, bonus: 0.12 },
  egg: { name: '太陽蛋', lv: 8, cost: 50, bonus: 0.10 },
  bacon: { name: '煙燻培根', lv: 9, cost: 80, bonus: 0.15 },
  berry: { name: '新鮮莓果', lv: 10, cost: 90, bonus: 0.15 },
  avocado: { name: '酪梨', lv: 13, cost: 120, bonus: 0.2 },
  salmon: { name: '煙燻鮭魚', lv: 16, cost: 180, bonus: 0.25 },
  honey: { name: '野花蜂蜜', lv: 12, cost: 70, bonus: 0.12 },
  truffle: { name: '黑松露', lv: 22, cost: 300, bonus: 0.4 },
};
export const MEAL_BURN = 1800;
export const MEAL_CAP = 60;
export const MEAL_CHANCE = 0.32;

// 2 樓甜點區、外送、餐車、評級（擴充）
export const SECOND_FLOOR_LV = 30;

// 自動經營：每一項要達到等級、花錢「聘請小幫手」後才能使用
export const AUTO_UNLOCK = {
  events: { lv: 3, gold: 500, name: '店內事件' },
  roast: { lv: 5, gold: 1500, name: '烘豆' },
  quests: { lv: 6, gold: 1000, name: '領任務獎勵' },
  cheer: { lv: 8, gold: 3000, name: '員工打氣' },
  brew: { lv: 10, gold: 6000, name: '沖煮' },
  side: { lv: 12, gold: 9000, name: '點心' },
  neighbors: { lv: 14, gold: 6000, name: '鄰居互動' },
  cat: { lv: 15, gold: 5000, name: '餵店貓' },
  meal: { lv: 17, gold: 16000, name: '料理' },
  delivery: { lv: 20, gold: 20000, name: '外送' },
  recruit: { lv: 22, coupon: 20, name: '招攬路人' },
  special: { lv: 26, coupon: 30, name: '常客訂單' },
  offline: { lv: 9, gold: 4000, name: '離線營業' },
};
export const AUTO_PANEL_LV = 3;
