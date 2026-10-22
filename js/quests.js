// 任務：前段是新手引導，之後是循環的日常任務
export const CHAIN = [
  { title: '烘焙咖啡豆', desc: '點吧台上的紅色烘豆機，烘焙一批巴西豆。', target: 1, val: g => g.s.stats.roastStart, coins: 40 },
  { title: '收成烘好的豆子', desc: '烘豆機上出現豆子圖示時，點它收成。', target: 1, val: g => g.s.stats.roastCollect, coins: 40 },
  { title: '沖煮咖啡', desc: '點銀色咖啡機，用巴西豆煮一批美式咖啡。', target: 1, val: g => g.s.stats.brewStart, coins: 50 },
  { title: '把咖啡上架', desc: '咖啡煮好後點咖啡機，把成品放上展示櫃。', target: 1, val: g => g.s.stats.brewCollect, coins: 50 },
  { title: '招待客人', desc: '客人會自己進門點餐，店員會送上展示櫃裡的飲品。服務 5 位客人。', target: 5, val: g => g.s.stats.served, coins: 100 },
  { title: '去進貨', desc: '打開下方「進貨」，買一包生豆。', target: 1, val: g => g.s.stats.buyGreen, coins: 60 },
  { title: '多擺一個座位', desc: '打開「裝潢」，買一張椅子擺在桌子旁邊。', target: 1, val: g => g.s.stats.placed, coins: 80 },
  { title: '結交常客', desc: '到「街頭招攬」跟路人聊聊，邀請一位常客。', target: 1, val: g => g.s.regulars.length, coins: 150 },
  { title: '小店成長中', desc: '店鋪等級升到 Lv3。', target: 3, val: g => g.s.level, coins: 200 },
  { title: '擴建店面', desc: '打開「擴店」，把店面變大。', target: 1, val: g => g.s.expand, coins: 300 },
  { title: '請個幫手', desc: '打開「員工」，雇用第一位店員。', target: 2, val: g => g.s.staff.length, coins: 300 },
  { title: '人氣小店', desc: '累積服務 100 位客人。', target: 100, val: g => g.s.stats.served, coins: 500 },
];

const REPEAT = [
  { key: 'served', title: '忙碌的一天', desc: n => `服務 ${n} 位客人。`, target: lv => 15 + lv * 3, coins: lv => 60 * lv },
  { key: 'brewCollect', title: '咖啡職人', desc: n => `收成 ${n} 批咖啡。`, target: lv => 4 + Math.floor(lv / 2), coins: lv => 50 * lv },
  { key: 'earned', title: '生意興隆', desc: n => `營收達到 ${n} 元。`, target: lv => 500 * lv, coins: lv => 40 * lv },
];

export function currentQuest(g) {
  const q = g.s.quest;
  if (q.idx < CHAIN.length) {
    const c = CHAIN[q.idx];
    const v = Math.min(c.val(g), c.target);
    return { title: c.title, desc: c.desc, target: c.target, progress: v, coins: c.coins, done: v >= c.target, tutorial: true };
  }
  const k = q.idx - CHAIN.length;
  const r = REPEAT[k % REPEAT.length];
  if (!q.base || q.base.k !== k) q.base = { k, v: g.s.stats[r.key], lv: g.s.level };
  const lv = q.base.lv;
  const target = r.target(lv);
  const v = Math.min(g.s.stats[r.key] - q.base.v, target);
  return { title: r.title, desc: r.desc(target), target, progress: v, coins: r.coins(lv), done: v >= target, tutorial: false };
}

export function claimQuest(g) {
  const cq = currentQuest(g);
  if (!cq.done) return null;
  g.s.coins += cq.coins;
  g.s.quest.idx++;
  g.s.quest.base = null;
  currentQuest(g); // 建立下一個任務的起始值
  return cq;
}
