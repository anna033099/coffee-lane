// 自動經營：每一項都可以分開開關，離線時也照設定執行
import * as D from './data.js';
import { now } from './state.js';

export class Auto {
  constructor(game, hooks = {}) {
    this.g = game;
    this.h = Object.assign({ quests() {}, onRecruit() {} }, hooks);
    this.lastRecruit = 0;
    this.lastEvents = 0;
    this.lastNeighbors = 0;
  }
  get a() { return this.g.s.auto; }
  on(k) { return this.a.master && this.a[k]; }
  // 離線時會不會處理這台機器（用來判斷燒焦算不算損失）
  wants(m) {
    const k = this.g.mdef(m).kind;
    return (k === 'roaster' && this.on('roast')) || (k === 'side' && this.on('side')) || (k === 'kitchen' && this.on('meal'));
  }
  reserve() { return this.a.keepGold || 0; }
  // 咖啡豆存量目標：夠煮幾批最貴的飲料就先不烘
  beanTarget() {
    const g = this.g;
    const costs = D.RECIPE_ORDER.filter(id => g.recipeOpen(id) && g.s.recipes[id].trained).map(id => D.RECIPES[id].beans);
    const nEsp = g.s.machines.filter(m => g.mdef(m).kind === 'espresso').length;
    return Math.max(300, (Math.max(30, ...costs)) * (nEsp + 2) * 2);
  }

  // 自動選烘豆：用上次的豆子；沒有就選目前買得起、最划算的
  roastChoice(m) {
    const g = this.g;
    const last = D.ROASTS.find(r => r.id === m.auto.item && g.unlocked(r.lv));
    if (last) return last;
    const ok = D.ROASTS.filter(r => g.unlocked(r.lv) && r.cost <= g.s.gold - this.reserve());
    return ok.length ? ok[ok.length - 1] : null;
  }
  // 自動沖煮：smart = 挑還沒在賣、最貴、豆子夠的；fixed = 只煮指定的
  brewChoice(m) {
    const g = this.g, s = g.s;
    const ok = id => g.recipeOpen(id) && s.recipes[id].trained && D.RECIPES[id].beans <= s.beans;
    if (this.a.brewMode === 'fixed') return m.auto.item && ok(m.auto.item) ? m.auto.item : null;
    const sellingIds = new Set(s.machines.filter(q => q.job && q.job.kind === 'brew').map(q => q.job.item));
    const list = D.RECIPE_ORDER.filter(ok).sort((a, b) => g.price(b) - g.price(a));
    return list.find(id => !sellingIds.has(id)) || list[0] || null;
  }

  run(t = now(), offline = false) {
    const g = this.g, s = g.s;
    if (!this.a.master) return;
    // 機器
    for (const m of s.machines) {
      const kind = g.mdef(m).kind;
      const st = g.status(m, t);
      if (kind === 'roaster' && this.a.roast) {
        if (st.st === 'done' || st.st === 'burnt') g.collect(m, t, true);
        if (!m.job && s.beans < this.beanTarget()) { const r = this.roastChoice(m); if (r && s.gold - r.cost >= this.reserve()) g.startRoast(m, r.id, t, true); }
      } else if (kind === 'espresso' && this.a.brew) {
        if (!m.job) { const id = this.brewChoice(m); if (id) g.startBrew(m, id, t, true); }
      } else if (kind === 'side' && this.a.side) {
        if (st.st === 'done' || st.st === 'burnt') g.collect(m, t, true);
        if (!m.job) {
          const mac = g.mdef(m).machine;
          let id = m.auto.item && D.SIDES[m.auto.item] && D.SIDES[m.auto.item].machine === mac ? m.auto.item : null;
          if (!id) { const l = D.SIDE_ORDER.filter(k => D.SIDES[k].machine === mac && g.unlocked(D.SIDES[k].lv)); id = l[l.length - 1]; }
          if (id && g.showcaseCount() < D.SHOWCASE_CAP - 4 && s.gold - D.SIDES[id].cost >= this.reserve()) g.startSide(m, id, t, true);
        }
      } else if (kind === 'kitchen' && this.a.meal) {
        if (st.st === 'done' || st.st === 'burnt') g.collect(m, t, true);
        if (!m.job) {
          const mac = g.mdef(m).machine;
          let id = m.auto.item && D.MEALS[m.auto.item] && D.MEALS[m.auto.item].machine === mac ? m.auto.item : null;
          if (!id) { const l = D.MEAL_ORDER.filter(k => D.MEALS[k].machine === mac && g.unlocked(D.MEALS[k].lv)); id = l[l.length - 1]; }
          const tops = m.auto.toppings || [];
          if (id && g.mealCount() < D.MEAL_CAP - 4 && s.gold - g.mealCost(id, tops) >= this.reserve()) g.startMeal(m, id, tops, t, true);
        }
      }
    }
    // 員工打氣
    if (this.a.cheer) {
      for (const st of s.staff) {
        if (st.energy < g.maxEnergy(st) * (this.a.cheerAt || 25) / 100 && g.dragsLeft(t) > 0) g.cheer(st, t, true);
      }
    }
    // 店內事件（只在畫面上有客人時）
    if (this.a.events && !offline && t - this.lastEvents > 2.5) {
      this.lastEvents = t;
      const c = g.customers.find(q => q.event === 'sleep' || q.event === 'tip');
      if (c) g.tapCustomer(c.id);
      else if (s.messyChairs.length) g.fixChair(s.messyChairs[0]);
      else if (s.dirtyTables.length) g.cleanTable(s.dirtyTables[0]);
    }
    // 鄰居
    if (this.a.neighbors && t - this.lastNeighbors > (offline ? 600 : 20)) {
      this.lastNeighbors = t;
      for (const id of D.NEIGHBOR_ORDER) {
        while (g.helpsLeft(id) > 0) g.help(id);
        if (g.canSendClover(id, t)) g.sendClover(id, t);
      }
      g.takeClovers(t);
      while (s.clovers >= D.CLOVER_BOX) g.openCloverBox();
    }
    // 招攬（每 5 分鐘一次，會用掉傳單；成功率 60%）
    if (this.a.recruit && t - this.lastRecruit > 300 && s.flyers > 0) {
      this.lastRecruit = t;
      if (s.flyers >= D.FLYER_MAX) s.flyerT = t;
      s.flyers--; s.stats.recruitTry++;
      const cands = g.regularCandidates();
      const fake = { regId: cands.length && Math.random() < 0.4 ? cands[Math.floor(Math.random() * cands.length)] : null, x: 0, y: g.D + 2 };
      const res = g.recruitResult(fake, Math.random() < 0.6);
      this.h.onRecruit(res, fake);
    }
    // 常客特別訂單（評價固定 Good）
    if (this.a.special) {
      if (s.pendingSpecial) {
        const c = g.customers.find(q => q.id === s.pendingSpecial.cid);
        if (!c || c.eventT > 3) g.finishSpecial(s.pendingSpecial.recipe, 'good');
      } else if (offline) {
        for (const id of g.regularDue(t)) {
          const o = g.pickSpecial(id);
          const r = s.regulars[id];
          r.visits++; g.friendAdd(id, 1); r.nextVisit = t + (20 + Math.random() * 30) * 60;
          if (o) { g.s.gold += 200 + s.level * 20; g.friendAdd(id, 3); s.stats.special++; }
        }
      }
    }
    // 店貓
    if (this.a.cat && s.cat && s.cat.hunger < 4 && s.gold >= 80 + this.reserve()) { s.gold -= 80; s.cat.hunger = 10; s.cat.love = Math.min(100, (s.cat.love || 0) + 2); }
    // 任務獎勵
    if (this.a.quests) this.h.quests();
  }
}
