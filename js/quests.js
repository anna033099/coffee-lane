// 劇情任務（NPC 發任務）與每日任務
import { addSP } from './extra.js';
import * as D from './data.js';
import { gameDay } from './state.js';

export const NPCS = {
  yun: { name: '小芸', role: '店員兼小幫手', look: { skin: '#f6d9c3', hair: '#7a4a2e', hairStyle: 'pony', top: '#f4efe6', bottom: '#2b2b2f', apron: '#2f5446', ribbon: '#c9826a' } },
  mike: { name: '麥克', role: '青梅竹馬的甜點師', look: { skin: '#f0c9ad', hair: '#d9b26a', hairStyle: 'short', top: '#f4efe6', bottom: '#5b4a40', apron: '#d9cdb8' } },
  chen: { name: '陳太太', role: '房東太太', look: { skin: '#f0c9ad', hair: '#c9c3bb', hairStyle: 'bun', top: '#9a5a5a', bottom: '#3b3b44', bottomType: 'skirt', glasses: true } },
  nana: { name: '外婆', role: '把店交給你的人', look: { skin: '#f0c9ad', hair: '#e8e2da', hairStyle: 'bun', top: '#8fa696', bottom: '#3b3b44', bottomType: 'skirt', glasses: true } },
};

for (const k of Object.keys(NPCS)) NPCS[k].look.art = 'npc_' + k;
const st = k => g => g.s.stats[k];
const has = fn => g => fn(g) ? 1 : 0;
export const CHAIN = [
  { npc: 'nana', title: '外婆的咖啡館', say: ['這間咖啡館陪了我四十年，今天起就交給你囉。', '先從烘豆開始吧：點吧台上的烘豆機，選「淺焙快烘」。'], goal: '烘焙一批咖啡豆', target: 1, val: st('roastStart'), reward: { gold: 100 } },
  { npc: 'yun', title: '收成咖啡豆', say: ['店長早安！我是小芸～', '豆子烘好的時候，烘豆機上會出現打勾的圖示，點一下就能收成。放太久會燒焦喔！'], goal: '收成咖啡豆', target: 1, val: st('roastCollect'), reward: { beans: 60 } },
  { npc: 'mike', title: '第一次進修', say: ['嘿，好久不見！聽說你接手了外婆的店？', '每一種新咖啡都要先「進修」，親手做一次才能上架。點咖啡機，選美式咖啡試試看。'], goal: '完成一次飲品進修', target: 1, val: st('trained'), reward: { gold: 150 } },
  { npc: 'yun', title: '開始營業', say: ['學會了就可以開賣囉！', '在咖啡機選一道飲品開始沖煮，煮好之後客人就會進來買。'], goal: '沖煮一批飲品', target: 1, val: st('brewStart'), reward: { gold: 100 } },
  { npc: 'yun', title: '第一批客人', say: ['客人會先到收銀台點餐，再到取餐台拿咖啡，有位子就會坐下來喝。', '我在收銀台負責結帳，你專心做咖啡就好！'], goal: '賣出 10 杯飲品', target: 10, val: st('sold'), reward: { gold: 200 } },
  { npc: 'yun', title: '幫員工打氣', say: ['工作久了，員工的元氣會慢慢下降，累倒了店裡就會變慢…', '在員工身上「往上拖」，就能幫他打氣，恢復元氣！'], goal: '幫員工打氣一次', target: 1, val: st('drag'), reward: { coupon: 1 } },
  { npc: 'yun', title: '街頭招攬', say: ['店門口常有路人經過，頭上有「！」的人對我們的店有興趣。', '點他聊聊天，三個問題都答對，就有機會成為客人。'], goal: '街頭招攬一次', target: 1, val: st('recruitTry'), reward: { gold: 200 } },
  { npc: 'chen', title: '房東太太來訪', say: ['哎呀，新店長！店裡的椅子有點少喔。', '點右下角的房子圖示進入裝潢模式，多擺一點家具，裝潢分數越高，客人就越多。'], goal: '擺放一件家具', target: 1, val: st('placed'), reward: { gold: 300 } },
  { npc: 'yun', title: '鄰居的咖啡店', say: ['這條街上還有好幾間咖啡店，大家都是好鄰居！', '每天可以到每間店幫忙三次，會拿到咖啡豆、金幣或元氣。'], goal: '去鄰居店裡幫忙', target: 1, val: st('help'), reward: { beans: 100 } },
  { npc: 'yun', title: '幸運草', say: ['鄰居會送幸運草給我們，我們也可以回送。', '收集十個幸運草，就能打開幸運草禮盒！'], goal: '送出一個幸運草', target: 1, val: st('cloverSend'), reward: { gold: 200 } },
  { npc: 'mike', title: '奶泡機', say: ['想做拿鐵、卡布奇諾，就需要一台奶泡機。', '到「菜單」的「器具」分頁可以買。'], goal: '購買奶泡機', target: 1, val: has(g => g.s.tools.frother), reward: { gold: 500 }, lv: 3 },
  { npc: 'mike', title: '學會奶類咖啡', say: ['奶泡機到手，來學拿鐵吧！', '記得照著配方：一份濃縮、三份熱牛奶、一份奶泡。'], goal: '進修 3 種飲品', target: 3, val: st('trained'), reward: { gold: 400 } },
  { npc: 'mike', title: '咖啡評比', say: ['一道飲品賣到一定數量，就可以參加評比。', '評比拿到越好的成績，星星越多，售價就越高！'], goal: '完成一次咖啡評比', target: 1, val: st('tests'), reward: { coupon: 2 } },
  { npc: 'mike', title: '甜點時間', say: ['咖啡配甜點最棒了！我來教你做點心。', '先在吧台空位放一台吐司機。'], goal: '擁有一台點心機', target: 1, val: g => g.s.machines.filter(m => g.mdef(m).kind === 'side').length, reward: { gold: 600 }, lv: 4 },
  { npc: 'mike', title: '第一盤點心', say: ['點心烤好會出現在吐司機上，收成之後就會放進前檯的甜點櫃。', '客人買咖啡的時候，常常會順便帶一份點心。'], goal: '收成點心', target: 1, val: st('sideCollect'), reward: { gold: 300 } },
  { npc: 'yun', title: '需要幫手', say: ['客人越來越多，我一個人跑收銀又跑取餐，好累…', '可以幫我請一位出餐員嗎？'], goal: '雇用出餐員', target: 1, val: has(g => !!g.staffByJob('pickup')), reward: { gold: 800 }, lv: 5 },
  { npc: 'chen', title: '擴建店面', say: ['店裡越來越熱鬧了呢！', '裝潢分數夠了，就可以跟我談擴店的事。'], goal: '擴店一次', target: 1, val: g => g.s.expand, reward: { coupon: 3 }, lv: 5 },
  { npc: 'yun', title: '第一位常客', say: ['有些路人頭上會有愛心和名字，他們是有機會變成常客的人！', '多招攬他們幾次，就會變成店裡的常客。'], goal: '結交一位常客', target: 1, val: g => g.recruitedRegulars().length, reward: { gold: 1000 }, lv: 6 },
  { npc: 'yun', title: '常客的特別訂單', say: ['常客來的時候，頭上的星星代表有特別訂單。', '仔細聽他說的提示，猜猜他想喝什麼，再親手做給他！'], goal: '完成特別訂單', target: 1, val: st('special'), reward: { coupon: 2 } },
  { npc: 'mike', title: '開放廚房', say: ['只有咖啡和點心還不夠，我們來做早午餐吧！', '買一台早午餐鐵板，做鬆餅還能加料，加越多賣越貴。'], goal: '擁有一台廚房設備', target: 1, val: g => g.s.machines.filter(m => g.mdef(m).kind === 'kitchen').length, reward: { gold: 1500 }, lv: 7 },
  { npc: 'mike', title: '第一道料理', say: ['料理做好要記得收，會放到出餐檯讓客人點。'], goal: '收成料理', target: 1, val: st('mealCollect'), reward: { gold: 800 } },
  { npc: 'chen', title: '更有質感的店', say: ['想讓更多人上門，店要更漂亮才行。'], goal: '裝潢分數達到 100', target: 100, val: g => g.score(), reward: { coupon: 3 } },
  { npc: 'yun', title: '自動經營小幫手', say: ['店長，忙不過來的話可以聘請「自動小幫手」！', '打開右邊的「自動經營」，先從「自動店內事件」開始，等級越高能聘的小幫手越多。'], goal: '聘請一位自動小幫手', target: 1, val: has(g => Object.keys(g.s.autoOwned || {}).length > 0), reward: { gold: 1000 } },
  { npc: 'yun', title: '回收台好忙', say: ['回收台的杯子越堆越多，請一位回收員吧！'], goal: '雇用回收員', target: 1, val: has(g => !!g.staffByJob('recycle')), reward: { gold: 2000 }, lv: 10 },
  { npc: 'mike', title: '人氣咖啡館', say: ['已經賣出這麼多杯了，外婆一定很開心。'], goal: '累積賣出 1000 杯', target: 1000, val: st('sold'), reward: { coupon: 5 } },
  { npc: 'chen', title: '再擴建一次', say: ['隔壁空出來了，要不要把店再擴大？'], goal: '擴店兩次', target: 2, val: g => g.s.expand, reward: { coupon: 5 }, lv: 10 },
  { npc: 'yun', title: '清潔員', say: ['客人多了，椅子常常歪掉、桌上也有杯子…請一位清潔員吧！'], goal: '雇用清潔員', target: 1, val: has(g => !!g.staffByJob('cleaner')), reward: { gold: 5000 }, lv: 15 },
  { npc: 'yun', title: '常客們', say: ['常客越多，店裡就越熱鬧！'], goal: '結交 4 位常客', target: 4, val: g => g.recruitedRegulars().length, reward: { coupon: 5 } },
  { npc: 'mike', title: '三星咖啡', say: ['挑戰看看讓一道飲品拿到三顆星吧！'], goal: '任一飲品達到三星', target: 1, val: has(g => Object.values(g.s.recipes).some(r => r.stars >= 3)), reward: { coupon: 5 } },
  { npc: 'chen', title: '名店之路', say: ['你已經是這條街上最有名的店了！'], goal: '裝潢分數達到 400', target: 400, val: g => g.score(), reward: { coupon: 8 } },
];

const REPEAT = [
  { title: '日日營業', goal: n => `再賣出 ${n} 杯`, key: 'sold', n: lv => 300 + lv * 30, reward: lv => ({ gold: 500 + lv * 100 }) },
  { title: '烘豆職人', goal: n => `再收成 ${n} 次咖啡豆`, key: 'roastCollect', n: () => 10, reward: lv => ({ beans: 300 + lv * 50 }) },
  { title: '甜點師', goal: n => `再收成 ${n} 次點心`, key: 'sideCollect', n: () => 8, reward: lv => ({ gold: 400 + lv * 80 }) },
  { title: '好鄰居', goal: n => `再幫鄰居 ${n} 次`, key: 'help', n: () => 9, reward: () => ({ coupon: 2 }) },
];

export function currentQuest(g) {
  const q = g.s.quest;
  if (q.idx < CHAIN.length) {
    const c = CHAIN[q.idx];
    const locked = c.lv && g.s.level < c.lv;
    const v = Math.min(c.val(g), c.target);
    return { ...c, progress: v, done: !locked && v >= c.target, locked, idx: q.idx };
  }
  const k = q.idx - CHAIN.length;
  const r = REPEAT[k % REPEAT.length];
  if (!q.base || q.base.k !== k) q.base = { k, v: g.s.stats[r.key], lv: g.s.level };
  const n = r.n(q.base.lv);
  const v = Math.min(g.s.stats[r.key] - q.base.v, n);
  return { npc: 'yun', title: r.title, say: ['店長，接下來也一起加油吧！'], goal: r.goal(n), target: n, progress: v, done: v >= n, reward: r.reward(q.base.lv), idx: q.idx };
}
export function claimQuest(g) {
  const cq = currentQuest(g);
  if (!cq.done) return null;
  g.give(cq.reward);
  g.s.quest.idx++; g.s.quest.base = null;
  currentQuest(g);
  return cq;
}

// ---------- 每日任務 ----------
export function ensureDaily(g) {
  const day = gameDay();
  const d = g.s.daily;
  if (d.day === day && d.list.length) return d;
  const pool = D.DAILY_POOL.filter(p => !p.lv || g.s.level >= p.lv);
  const picked = pool.sort(() => Math.random() - 0.5).slice(0, 4);
  d.day = day; d.bonus = false;
  d.list = picked.map(p => ({ key: p.key, name: p.name, target: p.target(g.s.level), base: g.s.stats[p.key] || 0, reward: p.reward(g.s.level), claimed: false }));
  return d;
}
export function dailyProgress(g, it) { return Math.min(it.target, (g.s.stats[it.key] || 0) - it.base); }
export function claimDaily(g, i) {
  const d = ensureDaily(g), it = d.list[i];
  if (!it || it.claimed || dailyProgress(g, it) < it.target) return null;
  it.claimed = true; g.give(it.reward); addSP(g, 4);
  return it.reward;
}
export function claimDailyBonus(g) {
  const d = ensureDaily(g);
  if (d.bonus || !d.list.every(x => x.claimed)) return null;
  d.bonus = true; const r = { coupon: 2, gold: 500 + g.s.level * 100 }; g.give(r); return r;
}
export function claimAll(g) {
  const out = [];
  let r;
  while ((r = claimQuest(g))) out.push(r);
  const d = ensureDaily(g);
  d.list.forEach((_, i) => { const x = claimDaily(g, i); if (x) out.push(x); });
  const b = claimDailyBonus(g); if (b) out.push(b);
  return out;
}
