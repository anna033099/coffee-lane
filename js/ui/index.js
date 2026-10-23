// 介面總控：HUD、點擊分派、招攬對話、特別訂單、劇情、拜訪鄰居
import { h, ic, fmt, fmtTime, toast, modal, initCore, closeAll, topModal, anyModal, refreshLive, rewardChips } from './core.js';
import { initTalk, talk } from './talk.js';
import * as D from '../data.js';
import { I, BIG, drinkIcon } from '../icons.js';
import { portraitSVG, fullSVG } from '../chara.js';
import { resolveLook } from '../sim.js';
import { openMachine, openMachineShop } from './machines.js';
import * as P from './panels.js';
import { Decor } from './decor.js';
import { openBarista, GRADE_ZH } from './barista.js';
import { currentQuest, claimAll, ensureDaily, dailyProgress, NPCS } from '../quests.js';
import { sfx, unlockAudio } from '../audio.js';
import { furnThumb, thumb } from '../../js3d/thumbs.js';
import * as MD from '../../js3d/models.js';
import * as T from '../../js3d/tex.js';
import { now } from '../state.js';
import { openTruck } from './truck.js';
import { openCat } from './cat.js';

const MACHINE_MAKE = {
  roaster_classic: () => MD.roaster(0), roaster_forest: () => MD.roaster(1), roaster_navy: () => MD.roaster(2),
  espresso_steel: () => MD.espressoMachine(0), espresso_cream: () => MD.espressoMachine(1), espresso_green: () => MD.espressoMachine(2),
  toaster: () => MD.toaster(), oven: () => MD.oven(0), fridge: () => MD.dessertFridge(), waffle: () => MD.waffleIron(), bench: () => MD.pastryBench(),
  griddle: () => MD.griddle(), stove: () => MD.pastaStove(), press: () => MD.paniniPress(), pizza: () => MD.pizzaOven(),
};

export class UI {
  constructor(game, world, auto, root) {
    this.g = game; this.world = world; this.auto = auto; this.root = root;
    this.sig = {};
    initCore(root); initTalk(root);
    this.buildHUD();
    this.decor = new Decor(this);
    this.busyTalk = false;
  }
  // ---------- 美術快取 ----------
  furnArt(type) { return furnThumb(type); }
  machineArt(type) { return thumb('m_' + type, MACHINE_MAKE[type], 'floor'); }
  themeArt(kind, id) {
    const c = document.createElement('canvas'); c.width = 96; c.height = 96;
    const g2 = c.getContext('2d');
    try {
      const tex = kind === 'floor' ? { herring_walnut: T.herringbone('walnut'), herring_oak: T.herringbone('oak'), planks_honey: T.planks('honey'), checker: T.checker(), terrazzo: T.terrazzo(), marble: T.marble('white') }[id]
        : { sage: T.plaster('#ece3d3'), forest: T.plaster('#efe7da'), navy: T.stripes('#ebe3d4', '#dfd3bf'), brick: T.brick(), blush: T.plaster('#f1e1da'), walnut: T.plaster('#e9dfcd') }[id];
      g2.drawImage(tex.image, 0, 0, 96, 96);
      if (kind === 'wallpaper') { const wc = { sage: '#5f7d6b', forest: '#294236', navy: '#26344d', brick: '#3a2a20', blush: '#b9786f', walnut: '#3b2618' }[id]; g2.fillStyle = wc; g2.fillRect(0, 60, 96, 36); g2.fillStyle = '#d4ad57'; g2.fillRect(0, 58, 96, 4); }
    } catch (e) { /* ignore */ }
    return c.toDataURL();
  }

  // ---------- HUD ----------
  buildHUD() {
    const hud = this.hud = h('div', { class: 'hud' });
    this.prof = h('div', { class: 'prof plate' });
    this.money = h('div', { class: 'money' });
    this.stat = h('div', { class: 'statbar' });
    this.qcol = h('div', { class: 'qcol' });
    this.rcol = h('div', { class: 'rcol' });
    this.bcol = h('div', { class: 'bcol' });
    const house = h('button', { class: 'house plate', onclick: () => { sfx('click'); this.decor.enter(); } }, h('span', { class: 'bi', html: BIG.decor }), h('span', { text: '裝潢' }));
    const zoom = h('div', { class: 'zoombox' },
      h('button', { class: 'rbtn plate', 'aria-label': '放大', html: I.plus, onclick: () => this.world.engine.setZoom(this.world.engine.zoom * 1.25) }),
      h('button', { class: 'rbtn plate', 'aria-label': '縮小', html: I.minus, onclick: () => this.world.engine.setZoom(this.world.engine.zoom / 1.25) }));
    hud.append(this.prof, this.stat, this.money, this.qcol, this.rcol, this.bcol, house, zoom);
    this.root.appendChild(hud);
    // 底部按鈕
    const bb = (k, label, fn) => { const b = h('button', { class: 'bbtn plate', onclick: () => { sfx('click'); fn(); } }, h('span', { class: 'bi', html: BIG[k] }), h('span', { text: label })); this.bcol.appendChild(b); return b; };
    this.bMenu = bb('menu', '菜單', () => P.openRecipes(this));
    this.bStaff = bb('staff', '員工', () => P.openStaff(this));
    this.bStyle = bb('wardrobe', '換裝', () => P.openWardrobe(this));
    this.bShop = bb('shop', '設備', () => openMachineShop(this, 0));
    this.bQuest = bb('quest', '任務', () => P.openQuests(this));
    // 右側按鈕
    const sb = (k, label, fn) => { const b = h('button', { class: 'sbtn plate', onclick: () => { sfx('click'); fn(); } }, h('span', { class: 'bi', html: BIG[k] }), h('span', { text: label })); this.rcol.appendChild(b); return b; };
    this.sAuto = sb('auto', '自動經營', () => P.openAuto(this));
    this.sFriends = sb('friends', '鄰居', () => P.openNeighbors(this));
    this.sReg = sb('regulars', '常客簿', () => P.openRegulars(this));
    this.sTruck = sb('truck', '咖啡車', () => { if (this.g.s.level < D.TRUCK_LV) return toast(`Lv${D.TRUCK_LV} 開放咖啡車`, 'warn'); openTruck(this); });
    this.sExp = sb('shop', '擴店', () => P.openExpand(this));
    this.sCat = sb('cat', '店貓', () => { if (this.g.s.level < D.CAT_LV) return toast(`Lv${D.CAT_LV} 可以養店貓`, 'warn'); openCat(this); });
    this.refresh(true);
  }
  badge(el, n) {
    let b = el.querySelector('.badge');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = h('span', { class: 'badge' }); el.appendChild(b); }
    b.textContent = n === true ? '!' : n;
  }
  refresh(force = false) {
    const g = this.g, s = g.s;
    const set = (k, v, fn) => { if (force || this.sig[k] !== v) { this.sig[k] = v; fn(); } };
    const need = D.expNeed(s.level);
    set('prof', [s.name, s.level, Math.floor(s.exp / need * 50), JSON.stringify(s.owner.look), s.apron].join('|'), () => {
      this.prof.innerHTML = '';
      const ava = h('button', { class: 'ava', html: portraitSVG(resolveLook(s.owner.look, s.apron), 'normal', 60), onclick: () => P.openWardrobe(this) });
      this.prof.append(ava, h('div', { class: 'pinfo' }, h('div', { class: 'cname', text: s.name }), h('div', { class: 'ttl', text: g.title() }),
        h('div', { class: 'lvrow' }, h('span', { class: 'lvbadge', text: 'Lv ' + s.level }), h('div', { class: 'bar exp' }, h('i', { style: `width:${Math.min(100, s.exp / need * 100)}%` })))));
    });
    set('money', [Math.floor(s.gold), s.beans, s.coupons].join('|'), () => {
      this.money.innerHTML = '';
      this.money.append(
        h('div', { class: 'pill plate' }, ic('gold'), fmt(s.gold)),
        h('div', { class: 'pill plate' }, ic('bean'), fmt(s.beans)),
        h('div', { class: 'pill plate' }, ic('coupon'), fmt(s.coupons)),
        h('button', { class: 'rbtn plate', 'aria-label': '設定', html: I.gear, onclick: () => P.openSettings(this) }),
        h('button', { class: 'rbtn plate', 'aria-label': '全螢幕', html: I.full, onclick: () => this.toggleFull() }));
    });
    const score = g.score(), rate = g.rate();
    const flyLeft = s.flyers < D.FLYER_MAX ? Math.max(0, D.FLYER_REGEN - (now() - s.flyerT)) : 0;
    set('stat', [score, rate.toFixed(1), s.flyers, Math.ceil(flyLeft / 10), g.showcaseCount(), g.mealCount()].join('|'), () => {
      this.stat.innerHTML = '';
      this.stat.append(...[
        h('div', { class: 'pill plate', title: '裝潢分數：越高客人越多' }, ic('score'), String(score)),
        h('div', { class: 'pill plate', title: '每分鐘來客' }, ic('heart'), rate.toFixed(1), h('small', { text: '人/分' })),
        h('div', { class: 'pill plate', title: '傳單：點店外頭上有「！」的路人招攬' }, ic('flyer'), `${s.flyers}/${D.FLYER_MAX}`, flyLeft ? h('small', { text: fmtTime(flyLeft) }) : null),
        h('div', { class: 'pill plate', title: '甜點櫃' }, ic('cake'), String(g.showcaseCount())),
        g.unlocked(7) ? h('div', { class: 'pill plate', title: '出餐檯' }, ic('meal'), String(g.mealCount())) : null].filter(Boolean));
    });
    // 任務卡
    const q = currentQuest(g);
    const d = ensureDaily(g);
    const dailyReady = d.list.filter(it => !it.claimed && dailyProgress(g, it) >= it.target).length;
    set('quest', [q.idx, q.progress, q.done, q.locked, dailyReady].join('|'), () => {
      this.qcol.innerHTML = '';
      const npc = NPCS[q.npc];
      const card = h('div', { class: 'qcard plate' + (q.done ? ' done' : '') + (q.locked ? ' locked' : ''), onclick: () => P.openQuests(this) },
        h('div', { class: 'qava', html: portraitSVG(npc.look, q.done ? 'happy' : 'normal', 48) }),
        h('b', { text: q.title }), h('div', { class: 'qg', text: q.locked ? `Lv${q.lv} 開放` : q.goal }),
        h('div', { class: 'qp' }, h('div', { class: 'bar green' }, h('i', { style: `width:${q.progress / q.target * 100}%` })), `${fmt(q.progress)}/${fmt(q.target)}`));
      this.qcol.appendChild(card);
      this.badge(this.bQuest, (q.done ? 1 : 0) + dailyReady);
    });
    // 徽章
    const pendClover = D.NEIGHBOR_ORDER.reduce((a, id) => a + g.cloversPending(id), 0);
    const helps = D.NEIGHBOR_ORDER.reduce((a, id) => a + g.helpsLeft(id), 0);
    set('badges', [pendClover, helps, s.clovers >= D.CLOVER_BOX, s.auto.master && Object.keys(s.auto).some(k => s.auto[k] === true && k !== 'master'), D.RECIPE_ORDER.filter(id => g.recipeOpen(id) && !s.recipes[id].trained).length, g.exhaustedCount(), s.level].join('|'), () => {
      this.badge(this.sFriends, pendClover || (s.clovers >= D.CLOVER_BOX ? true : helps ? helps : 0));
      this.sAuto.classList.toggle('on', s.auto.master && ['roast', 'brew', 'side', 'meal', 'cheer', 'events', 'neighbors', 'quests', 'recruit', 'special', 'cat'].some(k => s.auto[k]));
      this.badge(this.bMenu, D.RECIPE_ORDER.filter(id => g.recipeOpen(id) && !s.recipes[id].trained).length);
      this.badge(this.bStaff, g.exhaustedCount());
      this.sTruck.classList.toggle('locked', s.level < D.TRUCK_LV);
      this.sCat.classList.toggle('locked', s.level < D.CAT_LV);
      const nx = g.nextExpansion();
      this.badge(this.sExp, nx && s.level >= nx.lv && g.score() >= nx.score && s.gold >= nx.cost ? true : 0);
    });
    refreshLive(g.version + '|' + Math.floor(s.gold) + '|' + s.beans);
  }
  closeTop() { const m = topModal(); if (m) m.close(); }
  closeAll() { closeAll(); }
  rerenderTop() { const m = topModal(); if (m) m.rerender(); }
  toggleFull() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* 不支援 */ } }).catch(() => toast('這個瀏覽器不支援全螢幕'));
    } else document.exitFullscreen();
  }
  showReward(title, r) {
    modal({ ribbon: 'Gift', title, render: body => { body.append(h('div', { class: 'row center', style: 'font-size:1.3rem;margin:1rem 0' }, ...rewardChips(r)), h('div', { class: 'row center' }, h('button', { class: 'btn go lg', onclick: () => this.closeTop() }, '收下'))); } });
  }

  // ---------- 點擊分派 ----------
  onPick(hit, ev) {
    unlockAudio();
    const g = this.g;
    if (this.world.mode === 'visit') { if (hit.type === 'help') this.doHelp(hit.id); return; }
    if (anyModal() || this.busyTalk) return;
    switch (hit.type) {
      case 'machine': openMachine(this, hit.slot); break;
      case 'emptyslot': openMachineShop(this, hit.slot); break;
      case 'actor': {
        if (hit.staff) { const st = g.s.staff.find(q => q.id === hit.staff); if (st) { if (st.energy < g.maxEnergy(st)) g.cheer(st); else toast(`${st.name}：元氣滿滿！（往上拖也可以打氣）`); } break; }
        const r = g.tapCustomer(hit.id);
        if (r === 'special') this.specialOrder();
        else if (r === 'info') { const c = g.customers.find(q => q.id === hit.id); if (c && c.regId) toast(`${D.REGULARS[c.regId].name}：「${D.REGULARS[c.regId].catch}」`); }
        break;
      }
      case 'owner': P.openWardrobe(this, 'owner'); break;
      case 'passer': this.recruit(hit.id); break;
      case 'furniture': {
        if (g.s.messyChairs.includes(hit.id)) g.fixChair(hit.id);
        else if (g.s.dirtyTables.includes(hit.id)) g.cleanTable(hit.id);
        break;
      }
      default: break;
    }
    this.refresh();
    void ev;
  }

  // ---------- 街頭招攬 ----------
  async recruit(pid) {
    const g = this.g, p = g.passers.find(q => q.id === pid);
    if (!p || !p.interested) return;
    if (!g.beginTalk(p)) return;
    this.busyTalk = true;
    const quiz = g.quizFor(p);
    const name = p.regId ? D.REGULARS[p.regId].name : D.PASSERBY_TYPES[p.trait].tag;
    const role = p.regId ? D.REGULARS[p.regId].title : '路人';
    let correct = 0, failed = false;
    const lines = [];
    if (p.regId) lines.push({ text: D.REGULARS[p.regId].catch, next: '跟他聊聊' });
    else lines.push({ text: '嗯？這間咖啡店…看起來不錯耶。', next: '跟他聊聊' });
    quiz.forEach((q, i) => lines.push({ text: q.q, opts: q.a, counter: `第 ${i + 1}/3 題`, onPick: j => { if (j === q.ok) { correct++; sfx('good'); return; } failed = true; sfx('no'); return 'stop'; } }));
    await talk({ name, role, look: p.look, lines });
    const ok = !failed && correct === quiz.length;
    const res = g.recruitResult(p, ok);
    let msg;
    if (!ok) msg = '「嗯…我再想想。」（答錯了，還是拿到一點點小費）';
    else if (res.regular && res.done) msg = `「好！我以後會常常來！」${D.REGULARS[p.regId].name}成為你的常客了！`;
    else if (res.regular) msg = `「下次再聊吧～」（還要再招攬 ${res.left} 次，${D.REGULARS[p.regId].name}就會成為常客）`;
    else msg = '「好啊，我現在就去買一杯！」';
    await talk({ name, role, look: p.look, expr: ok ? 'f_happy' : 'f_stand', lines: [{ text: msg }] });
    if (ok && !p.regId && g.selling()) { const c = g.spawnCustomer(); c.look = p.look; p.dead = true; }
    this.busyTalk = false;
    this.refresh();
  }

  // ---------- 常客特別訂單 ----------
  async specialOrder() {
    const g = this.g, ps = g.s.pendingSpecial;
    if (!ps) return;
    const d = D.REGULARS[ps.regId];
    this.busyTalk = true;
    await talk({ name: d.name, role: d.title, look: d.look, lines: [{ text: ps.hint, next: '我知道了！' }] });
    this.busyTalk = false;
    // 選飲品
    const opts = D.RECIPE_ORDER.filter(id => g.recipeOpen(id));
    const m = modal({
      ribbon: 'Special', title: `${d.name}：「${ps.hint}」`, wide: true,
      render: body => {
        body.appendChild(h('p', { class: 'lead', text: '猜猜他想要哪一杯？選好之後要親手做。' }));
        const grid = h('div', { class: 'cards sm' });
        for (const id of opts) grid.appendChild(h('button', { class: 'tcard', onclick: () => { m.close(true); this.makeSpecial(id); } }, h('b', { text: D.RECIPES[id].name }), h('div', { class: 'art', html: drinkIcon(id, 70) })));
        body.appendChild(grid);
      },
    });
  }
  makeSpecial(choice) {
    const g = this.g, ps = g.s.pendingSpecial;
    if (!ps) return;
    const d = D.REGULARS[ps.regId];
    openBarista(choice, 'special', async grade => {
      const res = g.finishSpecial(choice, grade);
      if (!res) return;
      const text = res.correct ? (grade === 'bad' ? '「是這杯沒錯…可是味道怪怪的。」' : `「就是這個！謝謝你～」（${GRADE_ZH[grade]}，獲得 ${res.gold} 金幣）`) : `「咦？我想要的是${D.RECIPES[ps.recipe].name}啦…」`;
      this.busyTalk = true;
      await talk({ name: d.name, role: d.title, look: d.look, expr: res.correct && grade !== 'bad' ? 'f_happy' : 'f_stand', lines: [{ text }] });
      this.busyTalk = false;
      this.refresh();
    }, { showRecipe: true, ownedTools: g.s.tools });
  }

  // ---------- 劇情 ----------
  async storyIntro() {
    const g = this.g, q = currentQuest(g);
    if (g.s.quest.seen === q.idx || q.idx >= 30 || q.locked || this.busyTalk || anyModal()) return;
    g.s.quest.seen = q.idx;
    const npc = NPCS[q.npc];
    this.busyTalk = true;
    await talk({ name: npc.name, role: npc.role, look: npc.look, lines: q.say.map(t => ({ text: t })) });
    this.busyTalk = false;
  }

  // ---------- 拜訪鄰居 ----------
  visit(nid) {
    const g = this.g, n = D.NEIGHBORS[nid];
    this.visiting = nid;
    this.world.enterVisit(nid, g.helpsLeft(nid));
    this.hud.hidden = true;
    this.visitBar = h('div', { class: 'plate', style: 'position:absolute;left:50%;bottom:.8rem;transform:translateX(-50%);padding:.7rem 1.2rem;display:flex;gap:1rem;align-items:center;pointer-events:auto' },
      h('div', { style: 'width:3.4rem;height:3.4rem;border-radius:50%;overflow:hidden;border:.14rem solid var(--ink2);background:#fffaf0', html: portraitSVG(n.look, 'happy', 54) }),
      h('div', {}, h('b', { text: `${n.cafe}（${n.owner}的店）` }), h('div', { class: 'muted small', text: `點發亮的地方幫忙！今天還能幫 ${g.helpsLeft(nid)} 次` })),
      h('button', { class: 'btn go', onclick: () => this.leaveVisit() }, '回自己的店'));
    this.root.appendChild(this.visitBar);
  }
  doHelp(spotId) {
    const g = this.g, v = this.world.visit;
    if (!v) return;
    const sp = v.spots.find(q => q.id === spotId);
    if (!sp || sp.done) return;
    const r = g.help(this.visiting, sp.kind);
    if (!r) return;
    sp.done = true;
    sfx('collect');
    const pos = { x: sp.x, y: sp.y, z: sp.z };
    if (r.beans) this.world.floater(pos, '+' + r.beans, 'bean');
    if (r.gold) this.world.floater(pos, '+' + r.gold, 'gold');
    if (r.energy) this.world.floater(pos, '員工元氣 +30', 'energy');
    this.visitBar.querySelector('.muted').textContent = `點發亮的地方幫忙！今天還能幫 ${g.helpsLeft(this.visiting)} 次`;
    this.refresh();
  }
  leaveVisit() {
    this.world.exitVisit();
    this.visitBar.remove(); this.visitBar = null; this.visiting = null;
    this.hud.hidden = false;
    this.refresh(true);
  }

  // 自動領獎
  autoClaim() { const r = claimAll(this.g); if (r.length) { toast(`自動領取了 ${r.length} 份任務獎勵`, 'good'); this.refresh(); } }
}
export { fullSVG };
