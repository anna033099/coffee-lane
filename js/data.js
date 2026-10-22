// 遊戲靜態資料：豆子、食材、配方、家具、擴店、員工、常客設定
export const GAME_TITLE = '咖啡巷物語';

export const BEANS = {
  brazil:     { name: '巴西',     lv: 1,  cost: 30,   roast: 30,   yield: 10, exp: 2,  color: '#c98b4f' },
  colombia:   { name: '哥倫比亞', lv: 2,  cost: 60,   roast: 60,   yield: 10, exp: 3,  color: '#d9a441' },
  guatemala:  { name: '瓜地馬拉', lv: 4,  cost: 110,  roast: 120,  yield: 12, exp: 5,  color: '#7fae5b' },
  ethiopia:   { name: '衣索比亞', lv: 6,  cost: 180,  roast: 240,  yield: 12, exp: 8,  color: '#d2707a' },
  kenya:      { name: '肯亞',     lv: 8,  cost: 300,  roast: 480,  yield: 14, exp: 12, color: '#6f8fd0' },
  mandheling: { name: '曼特寧',   lv: 10, cost: 480,  roast: 900,  yield: 14, exp: 18, color: '#8a6bb8' },
  geisha:     { name: '藝伎',     lv: 14, cost: 1200, roast: 1800, yield: 16, exp: 30, color: '#e0b84a' },
};
export const BEAN_ORDER = Object.keys(BEANS);

export const INGS = {
  milk:     { name: '牛奶',     lv: 2, cost: 3, color: '#f4f1ea' },
  caramel:  { name: '焦糖醬',   lv: 4, cost: 5, color: '#c47a2c' },
  cocoa:    { name: '可可粉',   lv: 5, cost: 5, color: '#5b3a29' },
  vanilla:  { name: '香草糖漿', lv: 6, cost: 6, color: '#efe0a8' },
  cream:    { name: '鮮奶油',   lv: 8, cost: 6, color: '#fffaf0' },
  cinnamon: { name: '肉桂',     lv: 9, cost: 5, color: '#9a5a33' },
};
export const ING_ORDER = Object.keys(INGS);

// cup: 杯型 small/mug/glass/tall/fancy；layers 由下而上的液體顏色；top 頂部裝飾
export const RECIPES = {
  espresso:   { name: '濃縮咖啡',     lv: 1,  bean: 'brazil',     beanN: 1, ing: [],                    time: 10,  cups: 4, price: 12,  exp: 1,  tags: ['strong', 'cheap'], cup: { type: 'small', layers: ['#3b2116'], top: 'crema' } },
  americano:  { name: '美式咖啡',     lv: 1,  bean: 'brazil',     beanN: 1, ing: [],                    time: 15,  cups: 5, price: 15,  exp: 1,  tags: ['strong', 'cheap'], cup: { type: 'mug', layers: ['#2a170f'], top: 'none' } },
  latte:      { name: '拿鐵',         lv: 2,  bean: 'colombia',   beanN: 1, ing: ['milk'],              time: 25,  cups: 5, price: 24,  exp: 2,  tags: ['milk'],            cup: { type: 'glass', layers: ['#f3e6d3', '#9a6440', '#e9d4b8'], top: 'foam' } },
  cappuccino: { name: '卡布奇諾',     lv: 3,  bean: 'colombia',   beanN: 1, ing: ['milk'],              time: 30,  cups: 5, price: 26,  exp: 2,  tags: ['milk'],            cup: { type: 'mug', layers: ['#a8714a'], top: 'heart' } },
  caramel:    { name: '焦糖瑪奇朵',   lv: 4,  bean: 'guatemala',  beanN: 1, ing: ['milk', 'caramel'],   time: 45,  cups: 5, price: 38,  exp: 3,  tags: ['sweet', 'milk'],   cup: { type: 'glass', layers: ['#f4ead9', '#b07848', '#f0dfc4'], top: 'drizzle' } },
  mocha:      { name: '摩卡',         lv: 5,  bean: 'guatemala',  beanN: 1, ing: ['milk', 'cocoa'],     time: 60,  cups: 6, price: 40,  exp: 3,  tags: ['sweet'],           cup: { type: 'mug', layers: ['#5b3424'], top: 'cocoa' } },
  vanilla:    { name: '香草拿鐵',     lv: 6,  bean: 'ethiopia',   beanN: 1, ing: ['milk', 'vanilla'],   time: 90,  cups: 6, price: 50,  exp: 4,  tags: ['sweet', 'milk'],   cup: { type: 'glass', layers: ['#f7efd2', '#b98a5a', '#f3e6c4'], top: 'foam' } },
  pourover:   { name: '手沖衣索比亞', lv: 7,  bean: 'ethiopia',   beanN: 2, ing: [],                    time: 120, cups: 6, price: 62,  exp: 5,  tags: ['strong'],          cup: { type: 'fancy', layers: ['#7a3b22'], top: 'none' } },
  vienna:     { name: '維也納咖啡',   lv: 8,  bean: 'kenya',      beanN: 1, ing: ['cream'],             time: 150, cups: 6, price: 72,  exp: 6,  tags: ['sweet'],           cup: { type: 'glass', layers: ['#3a2216'], top: 'cream' } },
  cinnamon:   { name: '肉桂卡布',     lv: 9,  bean: 'kenya',      beanN: 1, ing: ['milk', 'cinnamon'],  time: 180, cups: 6, price: 78,  exp: 6,  tags: ['milk'],            cup: { type: 'mug', layers: ['#a26a45'], top: 'stick' } },
  coldbrew:   { name: '曼特寧冷萃',   lv: 11, bean: 'mandheling', beanN: 2, ing: [],                    time: 360, cups: 8, price: 98,  exp: 8,  tags: ['strong'],          cup: { type: 'tall', layers: ['#2c1a12'], top: 'ice' } },
  geisha:     { name: '藝伎手沖',     lv: 14, bean: 'geisha',     beanN: 2, ing: [],                    time: 600, cups: 8, price: 180, exp: 14, tags: ['strong'],          cup: { type: 'fancy', layers: ['#b0602e'], top: 'gold' } },
};
export const RECIPE_ORDER = Object.keys(RECIPES);

// 家具：kind = table / chair / decor / wall
export const FURNITURE = {
  table_round:  { kind: 'table', name: '小圓木桌',   lv: 1,  cost: 80,   charm: 2 },
  table_square: { kind: 'table', name: '方形餐桌',   lv: 3,  cost: 150,  charm: 3 },
  table_marble: { kind: 'table', name: '大理石圓桌', lv: 6,  cost: 400,  charm: 6 },
  table_iron:   { kind: 'table', name: '鑄鐵小酒館桌', lv: 9, cost: 800,  charm: 10 },
  chair_wood:   { kind: 'chair', name: '木椅',       lv: 1,  cost: 60,   charm: 1 },
  chair_fabric: { kind: 'chair', name: '布面椅',     lv: 3,  cost: 120,  charm: 2 },
  chair_arm:    { kind: 'chair', name: '單人沙發',   lv: 5,  cost: 300,  charm: 5 },
  chair_rattan: { kind: 'chair', name: '藤編椅',     lv: 8,  cost: 600,  charm: 8 },
  plant:        { kind: 'decor', name: '盆栽',       lv: 1,  cost: 50,   charm: 3 },
  lamp:         { kind: 'decor', name: '立燈',       lv: 2,  cost: 120,  charm: 5 },
  sack:         { kind: 'decor', name: '咖啡豆麻袋', lv: 3,  cost: 90,   charm: 4 },
  bookshelf:    { kind: 'decor', name: '書架',       lv: 4,  cost: 260,  charm: 9 },
  easel:        { kind: 'decor', name: '黑板菜單架', lv: 5,  cost: 200,  charm: 7 },
  monstera:     { kind: 'decor', name: '龜背芋',     lv: 7,  cost: 450,  charm: 13 },
  gramophone:   { kind: 'decor', name: '復古留聲機', lv: 10, cost: 900,  charm: 22 },
  painting:     { kind: 'wall',  name: '掛畫',       lv: 1,  cost: 70,   charm: 3 },
  clock:        { kind: 'wall',  name: '時鐘',       lv: 2,  cost: 90,   charm: 3 },
  window:       { kind: 'wall',  name: '窗戶',       lv: 3,  cost: 200,  charm: 6 },
  shelfplant:   { kind: 'wall',  name: '層架盆栽',   lv: 5,  cost: 250,  charm: 8 },
  neon:         { kind: 'wall',  name: '霓虹燈招牌', lv: 8,  cost: 700,  charm: 15 },
};

export const FLOORS = {
  wood:     { name: '木地板',   lv: 1, cost: 0,    charm: 0 },
  checker:  { name: '黑白格磚', lv: 3, cost: 500,  charm: 10 },
  herring:  { name: '拼花木地板', lv: 6, cost: 1200, charm: 20 },
  terrazzo: { name: '水磨石',   lv: 9, cost: 2000, charm: 30 },
};
export const WALLS = {
  cream:  { name: '奶油白',   lv: 1, cost: 0,    charm: 0 },
  stripe: { name: '綠條紋',   lv: 2, cost: 400,  charm: 8 },
  brick:  { name: '紅磚牆',   lv: 5, cost: 1000, charm: 18 },
  navy:   { name: '深藍木牆板', lv: 8, cost: 1800, charm: 26 },
};

// 擴店：W = 沿右牆的格數，H = 沿左牆的格數，slots = 吧台機器位置數
export const EXPANSIONS = [
  { W: 6,  H: 5, slots: 3, lv: 1,  cost: 0 },
  { W: 7,  H: 6, slots: 4, lv: 3,  cost: 1500 },
  { W: 8,  H: 7, slots: 5, lv: 6,  cost: 5000 },
  { W: 9,  H: 8, slots: 6, lv: 10, cost: 15000 },
  { W: 10, H: 9, slots: 7, lv: 14, cost: 40000 },
];

export const MACHINES = {
  roaster: { name: '烘豆機', base: 300 },
  brewer:  { name: '咖啡機', base: 250 },
};

export const STAFF_HIRES = [
  { lv: 2,  cost: 500 },
  { lv: 5,  cost: 1500 },
  { lv: 9,  cost: 4000 },
  { lv: 13, cost: 10000 },
];

export const UNIFORMS = ['#d9775f', '#4f8a78', '#3f5f8f', '#b5577a', '#c9a13b', '#6b4a3a'];

export const NAMES = ['小林', '阿哲', '小雨', '佳佳', '阿翔', '宜庭', '小胖', '芸芸', '阿凱', '思妤',
  '柏宇', '婷婷', '子晴', '阿德', '美美', '小安', '俊傑', '若涵', '阿寶', '小米', '家豪', '詩涵', '阿嬤', '老王'];

// 常客個性：街頭招攬時的台詞與正確的推銷話術
export const TRAITS = {
  tired: {
    tag: '需要提神', lines: ['昨晚加班到好晚，現在眼睛都快睜不開了…', '下午還有三堂課，好想睡喔…', '連續熬夜三天，腦袋一片空白。'],
    pitch: '來一杯濃縮，保證馬上清醒！', fav: 'strong',
  },
  sweet: {
    tag: '螞蟻人', lines: ['最近好想吃甜的東西喔～', '心情不好的時候就想喝甜甜的。', '有沒有不會太苦、甜甜的咖啡？'],
    pitch: '我們的焦糖瑪奇朵甜而不膩，試試看！', fav: 'sweet',
  },
  milk: {
    tag: '奶香控', lines: ['我不太敢喝黑咖啡，太苦了…', '喜歡奶香重一點的飲料。', '早上習慣喝一杯熱熱的牛奶。'],
    pitch: '奶香濃郁的拿鐵很適合你喔！', fav: 'milk',
  },
  budget: {
    tag: '小資族', lines: ['月底了，錢包有點扁…', '有沒有便宜又好喝的咖啡？', '這個月要存錢，不能亂花。'],
    pitch: '美式咖啡平價又順口，一杯就好！', fav: 'cheap',
  },
  aesthetic: {
    tag: '文青', lines: ['想找個漂亮的地方拍照打卡。', '有沒有氣氛好、適合看書的店？', '我喜歡布置得有質感的咖啡館。'],
    pitch: '我們店裡布置得很舒服，進來坐坐吧！', fav: 'any', charmNeed: 25,
  },
};
export const TRAIT_ORDER = Object.keys(TRAITS);

export const FRIEND_LEVELS = [
  { need: 3,  reward: 200 },
  { need: 10, reward: 500 },
  { need: 25, reward: 1000 },
  { need: 50, reward: 2000 },
];

export const CARD_MAX = 5;
export const CARD_REGEN = 180; // 秒

export function expNeed(lv) { return Math.floor(30 * Math.pow(lv, 1.5)); }
export const MAX_LEVEL = 30;
export function maxRegulars(lv) { return 3 + lv; }
