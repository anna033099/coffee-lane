// 各種面板：菜單與器具、員工、換裝、常客、鄰居、自動經營、任務、設定、擴店、升級、離線報告
import { h, modal, ic, fmt, fmtTime, toast, rewardChips, confirmBox } from './core.js';
import * as D from '../data.js';
import { I, drinkIcon, sideIcon, mealIcon } from '../icons.js';
import { fullSVG, portraitSVG } from '../chara.js';
import { resolveLook } from '../sim.js';
import { trainRecipe, testRecipe, testReady } from './machines.js';
import { currentQuest, claimQuest, ensureDaily, dailyProgress, claimDaily, claimDailyBonus, NPCS } from '../quests.js';
import { exportCode, importCode, save, clearSave, blockSaves, now } from '../state.js';
import { setSound, setMusic, sfx } from '../audio.js';

// ---------------- 菜單（飲品、點心、料理、器具） ----------------
export function openRecipes(ui, tab = 'drink') {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Menu', title: '菜單與器具', live: true, wide: true, tab,
    tabs: () => [['drink', '飲品', D.RECIPE_ORDER.some(id => testReady(g, id) || (g.recipeOpen(id) && !s.recipes[id].trained))], ['side', '點心'], ['meal', '料理'], ['tools', '器具', Object.entries(D.TOOLS).some(([k, t]) => !s.tools[k] && s.level >= t.lv && s.gold >= t.cost)]],
    render: (body, m) => {
      if (m.tab === 'drink') {
        body.appendChild(h('p', { class: 'lead', text: '已學會的飲品可以在咖啡機上沖煮。賣出數量達標後可以參加評比升星（每顆星售價 +8%）。' }));
        const list = h('div', { class: 'list' });
        for (const id of D.RECIPE_ORDER) {
          const r = D.RECIPES[id], rs = s.recipes[id];
          const lock = s.level < r.lv, tool = !s.tools[r.tool];
          const nextNeed = rs.stars < 3 ? D.STAR_SALES[rs.stars] : null;
          let act;
          if (lock) act = h('span', { class: 'muted', text: `Lv${r.lv}` });
          else if (tool) act = h('span', { class: 'muted', text: `需要${D.TOOLS[r.tool].name}` });
          else if (!rs.trained) act = h('button', { class: 'btn hot sm', onclick: () => trainRecipe(ui, id) }, '進修');
          else if (testReady(g, id)) act = h('button', { class: 'btn blue sm', onclick: () => testRecipe(ui, id) }, '評比');
          else act = h('div', { class: 'stars', style: 'display:flex' }, [0, 1, 2].map(i => ic(i < rs.stars ? 'star' : 'starOff')));
          list.appendChild(h('div', { class: 'lrow' + (lock ? ' locked' : '') },
            h('div', { class: 'lic', html: drinkIcon(id, 48) }),
            h('div', { class: 'lmain' }, h('b', { text: r.name }), h('span', { class: 'muted', text: lock ? `Lv${r.lv} 解鎖` : `${r.steps.map(([k, n]) => D.INGS[k].name + (n > 1 ? '×' + n : '')).join(' → ')}　｜　${r.cups} 杯／${r.beans} 顆豆` + (rs.trained && nextNeed ? `　｜　已賣 ${rs.sold}/${nextNeed}` : '') })),
            h('span', { class: 'price' }, ic('gold'), g.price(id)), act));
        }
        body.appendChild(list);
      } else if (m.tab === 'side') {
        const list = h('div', { class: 'list' });
        for (const id of D.SIDE_ORDER) {
          const r = D.SIDES[id], lock = s.level < r.lv;
          list.appendChild(h('div', { class: 'lrow' }, h('div', { class: 'lic', html: sideIcon(id, 48) }), h('div', { class: 'lmain' }, h('b', { text: r.name }), h('span', { class: 'muted', text: `${D.SIDE_MACHINES[r.machine].name}　｜　${fmtTime(r.time)} 做 ${r.pcs} 份　｜　庫存 ${s.showcase[id] || 0}` })), h('span', { class: 'price' }, ic('gold'), r.price), lock ? h('span', { class: 'muted', text: `Lv${r.lv}` }) : null));
        }
        body.appendChild(list);
      } else if (m.tab === 'meal') {
        const list = h('div', { class: 'list' });
        for (const id of D.MEAL_ORDER) {
          const r = D.MEALS[id], lock = s.level < r.lv;
          const stock = Object.values(s.meals).filter(b => b.item === id).reduce((a, b) => a + b.n, 0);
          list.appendChild(h('div', { class: 'lrow' }, h('div', { class: 'lic', html: mealIcon(id, 48) }), h('div', { class: 'lmain' }, h('b', { text: r.name }), h('span', { class: 'muted', text: `${D.KITCHEN_MACHINES[r.machine].name}　｜　${fmtTime(r.time)} 做 ${r.pcs} 份　｜　庫存 ${stock}` })), h('span', { class: 'price' }, ic('gold'), r.price), lock ? h('span', { class: 'muted', text: `Lv${r.lv}` }) : null));
        }
        body.appendChild(list);
      } else {
        body.appendChild(h('p', { class: 'lead', text: '器具會解鎖新的飲品類別，買一次就永久擁有。' }));
        const grid = h('div', { class: 'cards' });
        for (const [k, t] of Object.entries(D.TOOLS)) {
          const own = s.tools[k], lock = s.level < t.lv;
          const sample = D.RECIPE_ORDER.find(id => D.RECIPES[id].tool === k);
          grid.appendChild(h('div', { class: 'tcard' + (lock ? ' locked' : '') + (own ? ' sel' : '') }, h('b', { text: t.name }), h('div', { class: 'art', html: drinkIcon(sample, 80) }), h('div', { class: 'meta' }, h('span', { text: t.desc })),
            own ? h('span', { class: 'lock', text: '已擁有' }) : lock ? h('span', { class: 'lock', html: I.lock + `Lv${t.lv} 解鎖` }) : h('button', { class: 'btn go', disabled: s.gold < t.cost, onclick: () => { if (g.buyTool(k)) { toast(`買了${t.name}！新的飲品可以進修了`, 'good'); ui.refresh(); } } }, '購買 ', ic('gold'), fmt(t.cost))));
        }
        body.appendChild(grid);
      }
    },
  });
}

// ---------------- 員工 ----------------
export function openStaff(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Staff', title: '員工', live: true, wide: true,
    render: body => {
      const left = g.dragsLeft();
      body.appendChild(h('p', { class: 'lead', text: `員工的元氣會隨時間減少，累倒會讓來客變少（每人 -15%）。在店裡員工身上「往上拖」或按「打氣」可恢復 ${D.ENERGY_DRAG} 分鐘（每 5 分鐘最多 ${D.DRAG_MAX} 次，目前剩 ${left} 次）。換衣服可以提升熟練度（元氣上限）。` }));
      const grid = h('div', { class: 'cards' });
      for (const job of D.JOB_ORDER) {
        const j = D.JOBS[job], st = g.staffByJob(job);
        if (st) {
          const mx = g.maxEnergy(st);
          grid.appendChild(h('div', { class: 'pcard' }, h('span', { class: 'role', text: j.name }), h('div', { class: 'por', html: fullSVG(resolveLook(st.look, s.apron), st.energy > 0 ? 'f_happy' : 'f_sleep', 110) }), h('b', { text: st.name }),
            h('div', { class: 'bar', style: 'height:.8rem' }, h('i', { style: `width:${st.energy / mx * 100}%` })), h('span', { class: 'small muted', text: `元氣 ${Math.ceil(st.energy)}/${mx} 分　熟練度 ${st.prof || 0}` }),
            h('div', { class: 'row center' }, h('button', { class: 'btn go sm', disabled: left <= 0 || st.energy >= mx, onclick: () => { g.cheer(st); ui.refresh(); } }, ic('energy'), '打氣'), h('button', { class: 'btn sm', onclick: () => openWardrobe(ui, st.id) }, '換裝'))));
        } else {
          const lock = s.level < j.lv;
          grid.appendChild(h('div', { class: 'pcard' + (lock ? ' locked' : '') }, h('span', { class: 'role', text: j.name }), h('div', { class: 'por', style: 'align-items:center;font-size:3rem;font-weight:900;color:#c9b79e', text: '?' }), h('b', { text: '徵人中' }), h('span', { class: 'small muted', text: j.desc }),
            lock ? h('span', { class: 'lock', html: I.lock + `Lv${j.lv} 開放` }) : h('button', { class: 'btn go', disabled: s.gold < j.cost, onclick: () => { const n = g.hire(job); if (n) { toast(`${n.name}加入團隊，擔任${j.name}！`, 'good'); ui.refresh(); } } }, '雇用 ', ic('gold'), fmt(j.cost))));
        }
      }
      body.appendChild(grid);
    },
  });
}

// ---------------- 換裝 ----------------
export function openWardrobe(ui, who = 'owner') {
  const g = ui.g, s = g.s;
  let target = who;
  const slots = [['hair', '髮型'], ['top', '上衣'], ['bottom', '下身'], ['hat', '帽子'], ['glasses', '眼鏡'], ['apron', '圍裙'], ['skin', '膚色']];
  modal({
    ribbon: 'Style', title: '換裝', wide: true, tab: 'hair', tabs: slots,
    render: (body, m) => {
      const ppl = [['owner', s.owner.name + '（店長）'], ...s.staff.map(st => [st.id, st.name])];
      const lookOf = id => id === 'owner' ? s.owner.look : s.staff.find(q => q.id === id).look;
      const look = lookOf(target);
      const who = h('div', { class: 'who' }, ppl.map(([id, nm]) => h('button', { class: 'btn sm' + (id === target ? ' go' : ''), onclick: () => { target = id; m.rerender(); } }, nm)));
      const left = h('div', { class: 'mannequin' }, h('div', { class: 'mq', html: fullSVG(resolveLook(look, s.apron), 'f_happy', 280) }));
      const right = h('div', {}, who);
      const tab = m.tab;
      if (tab === 'hair') {
        right.append(h('h3', { text: '髮型' }), h('div', { class: 'row' }, Object.entries(D.HAIR_STYLES).map(([k, nm]) => h('button', { class: 'btn sm' + (look.hairStyle === k ? ' go' : ''), onclick: () => { look.hairStyle = k; g.touch(); m.rerender(); } }, nm))));
        right.append(h('h3', { text: '髮色' }), h('div', { class: 'swatches' }, D.HAIR_COLORS.map(c => h('button', { class: 'swatch' + (look.hair === c ? ' on' : ''), style: `background:${c}`, 'aria-label': '髮色', onclick: () => { look.hair = c; g.touch(); m.rerender(); } }))));
      } else if (tab === 'skin') {
        right.append(h('h3', { text: '膚色' }), h('div', { class: 'swatches' }, D.SKINS.map(c => h('button', { class: 'swatch' + (look.skin === c ? ' on' : ''), style: `background:${c}`, 'aria-label': '膚色', onclick: () => { look.skin = c; g.touch(); m.rerender(); } }))));
      } else {
        const items = Object.entries(D.WARDROBE).filter(([id, w]) => w.slot === tab && (!w.hidden || s.wardrobe.includes(id)));
        right.append(h('p', { class: 'lead', text: tab === 'apron' ? '圍裙是全體店員共用的制服。' : '買過的衣服大家都可以穿；每買一件，所有員工熟練度 +3（元氣上限 +3 分鐘）。' }));
        const grid = h('div', { class: 'cards sm' });
        for (const [id, w] of items) {
          const owned = s.wardrobe.includes(id), lock = s.level < (w.lv || 1);
          const cur = tab === 'apron' ? s.apron === id : look[tab] === id;
          const prev = { ...look }; if (tab !== 'apron') prev[tab] = id;
          grid.appendChild(h('div', { class: 'tcard' + (cur ? ' sel' : '') + (lock ? ' locked' : '') }, h('b', { text: w.name }), h('div', { class: 'art', html: fullSVG(resolveLook(prev, tab === 'apron' ? id : s.apron), 'f_stand', 96) }),
            owned ? h('button', { class: 'btn sm' + (cur ? ' go' : ''), onclick: () => { if (tab === 'apron') s.apron = id; else look[tab] = id; g.touch(); m.rerender(); } }, cur ? '穿著中' : '穿上')
              : lock ? h('span', { class: 'lock', html: I.lock + `Lv${w.lv}` })
                : h('button', { class: 'btn go sm', onclick: () => { if (g.spend(w.cost || 0, w.coupon || 0)) { s.wardrobe.push(id); for (const st of s.staff) st.prof = (st.prof || 0) + D.PROF_PER_ITEM; if (tab === 'apron') s.apron = id; else look[tab] = id; g.touch(); sfx('buy'); m.rerender(); ui.refresh(); } } }, w.coupon ? ic('coupon') : ic('gold'), fmt(w.coupon || w.cost))));
        }
        right.appendChild(grid);
      }
      body.appendChild(h('div', { class: 'wardrobe' }, left, right));
    },
  });
}

// ---------------- 常客簿 ----------------
export function openRegulars(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Regulars', title: '常客簿', live: true, wide: true,
    render: body => {
      body.appendChild(h('p', { class: 'lead', text: '頭上有愛心和名字的路人是「未來的常客」，在店外招攬成功幾次就會成為常客。常客會不定時來店，頭上有星星時代表有特別訂單。' }));
      const grid = h('div', { class: 'cards' });
      for (const id of D.REGULAR_ORDER) {
        const d = D.REGULARS[id], r = s.regulars[id];
        const lock = s.level < d.lv;
        const lv = g.friendLevel(id), next = D.FRIEND_LV[lv];
        grid.appendChild(h('div', { class: 'pcard' + (lock ? ' locked' : '') }, h('span', { class: 'role', text: d.title }), h('div', { class: 'por', html: r.recruited || r.met ? fullSVG(d.look, 'f_happy', 110) : `<div style="font-size:3rem;font-weight:900;color:#c9b79e;margin:auto">?</div>` }),
          h('b', { text: r.recruited || r.met ? d.name : '？？？' }),
          lock ? h('span', { class: 'lock', html: I.lock + `Lv${d.lv} 會出現` })
            : !r.recruited ? h('span', { class: 'small muted', text: `招攬進度 ${r.met}/${d.need}` })
              : h('div', {}, h('div', { class: 'hearts', style: 'justify-content:center' }, D.FRIEND_LV.map((_, i) => h('span', { class: 'ic' + (i < lv ? '' : ' off'), html: I.heart }))), h('span', { class: 'small muted', text: `${lv ? D.FRIEND_LV[lv - 1].label : '剛認識'}　好感 ${r.friend}${next ? '/' + next.need : ''}` }),
                h('div', { class: 'small', style: 'margin-top:.2rem' }, '最愛：', D.RECIPES[d.fav].name),
                h('button', { class: 'btn sm', style: 'margin-top:.3rem', onclick: () => { if (g.summonRegular(id)) { toast(`${d.name}正在過來的路上！`, 'good'); ui.closeTop(); } } }, '邀請來店 ', ic('coupon'), '3'))));
      }
      body.appendChild(grid);
    },
  });
}

// ---------------- 鄰居與幸運草 ----------------
export function openNeighbors(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Friends', title: '鄰居咖啡店', live: true, wide: true,
    render: body => {
      const pend = D.NEIGHBOR_ORDER.reduce((a, id) => a + g.cloversPending(id), 0);
      body.appendChild(h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:.6rem' },
        h('div', { class: 'row' }, ic('clover'), h('b', { text: `幸運草 ${s.clovers}/${D.CLOVER_BOX}` }), h('div', { class: 'bar green', style: 'width:10rem' }, h('i', { style: `width:${Math.min(1, s.clovers / D.CLOVER_BOX) * 100}%` }))),
        h('div', { class: 'row' },
          h('button', { class: 'btn' + (pend ? ' go' : ''), disabled: !pend, onclick: () => { const n = g.takeClovers(); toast(`收下 ${n} 個幸運草`); ui.refresh(); } }, `收下幸運草 ${pend ? '(' + pend + ')' : ''}`),
          h('button', { class: 'btn hot', disabled: s.clovers < D.CLOVER_BOX, onclick: () => { const r = g.openCloverBox(); if (r) { toast('打開幸運草禮盒！', 'good'); ui.showReward('幸運草禮盒', r); } ui.refresh(); } }, '打開禮盒'))));
      const list = h('div', { class: 'list' });
      for (const id of D.NEIGHBOR_ORDER) {
        const n = D.NEIGHBORS[id], left = g.helpsLeft(id), canSend = g.canSendClover(id);
        const cd = Math.max(0, D.CLOVER_SEND_CD - (now() - s.neighbors[id].sentAt));
        list.appendChild(h('div', { class: 'lrow' }, h('div', { class: 'lic', style: 'width:3.6rem;height:3.6rem;border-radius:50%;overflow:hidden;background:#fffaf0;border:.14rem solid var(--ink2)', html: portraitSVG(n.look, 'normal', 58) }),
          h('div', { class: 'lmain' }, h('b', { text: `${n.cafe}　` }, h('span', { class: 'muted', style: 'display:inline', text: `店長 ${n.owner}` })), h('span', { class: 'muted', text: n.desc + `　今天還能幫忙 ${left} 次` })),
          h('button', { class: 'btn' + (canSend ? '' : ' dis'), disabled: !canSend, onclick: () => { if (g.sendClover(id)) { toast(`送給${n.owner}一個幸運草`); ui.refresh(); } } }, ic('clover'), canSend ? '送幸運草' : fmtTime(cd)),
          h('button', { class: 'btn go', onclick: () => { ui.closeAll(); ui.visit(id); } }, '去拜訪')));
      }
      body.appendChild(list);
    },
  });
}

// ---------------- 自動經營 ----------------
export function openAuto(ui) {
  const g = ui.g, a = g.s.auto;
  const ROWS = [
    ['roast', '自動烘豆', '烘好自動收成，咖啡豆不夠時自動再烘（使用上次選的豆子）'],
    ['brew', '自動沖煮', '咖啡機賣完就自動再煮'],
    ['side', '自動做點心', '點心烤好自動收進甜點櫃，再烤一批'],
    ['meal', '自動料理', '料理完成自動收，用同樣的加料再做'],
    ['cheer', '自動幫員工打氣', '元氣低於設定值就自動打氣（受每 5 分鐘 5 次限制）'],
    ['events', '自動處理店內事件', '叫醒睡著的客人、收小費、扶正椅子、清理桌面'],
    ['neighbors', '自動鄰居互動', '每天自動幫忙、送幸運草、收幸運草、開禮盒'],
    ['quests', '自動領取任務獎勵', '任務完成就自動領獎'],
    ['recruit', '自動招攬路人', '每 5 分鐘用一張傳單招攬，成功率 60%（比自己答題低）'],
    ['special', '自動完成常客訂單', '自動做常客的特別訂單，評價固定為「合格」'],
    ['cat', '自動餵店貓', '肚子餓時自動餵食（每次 80 金幣）'],
  ];
  modal({
    ribbon: 'Auto', title: '自動經營（離線時也會照設定繼續營業）', live: false, wide: true,
    render: (body, m) => {
      const master = h('div', { class: 'lrow', style: 'background:linear-gradient(#e3f4d2,#c9e8b0)' }, h('div', { class: 'lic', html: '' }), h('div', { class: 'lmain' }, h('b', { text: '總開關' }), h('span', { class: 'muted', text: '關掉後所有自動功能暫停。離線最多計算 12 小時，效率為在線的 60%。' })),
        h('button', { class: 'toggle' + (a.master ? ' on' : ''), onclick: () => { a.master = !a.master; m.rerender(); ui.refresh(); } }, h('i')));
      master.querySelector('.lic').innerHTML = I.gear;
      body.appendChild(master);
      body.appendChild(h('div', { class: 'row', style: 'margin:.6rem 0' },
        h('button', { class: 'btn go sm', onclick: () => { ROWS.forEach(([k]) => { a[k] = true; }); a.master = true; m.rerender(); ui.refresh(); } }, '全部開啟'),
        h('button', { class: 'btn sm', onclick: () => { ROWS.forEach(([k]) => { a[k] = false; }); m.rerender(); ui.refresh(); } }, '全部關閉')));
      const list = h('div', { class: 'list' });
      for (const [k, name, desc] of ROWS) {
        const extra = [];
        if (k === 'brew') extra.push(h('div', { class: 'seg' }, h('button', { class: a.brewMode === 'smart' ? 'on' : '', onclick: () => { a.brewMode = 'smart'; m.rerender(); } }, '挑最賺的'), h('button', { class: a.brewMode === 'fixed' ? 'on' : '', onclick: () => { a.brewMode = 'fixed'; m.rerender(); } }, '固定上次的')));
        if (k === 'cheer') extra.push(h('span', { class: 'small', text: `低於 ${a.cheerAt}%` }), h('input', { type: 'range', min: 10, max: 90, step: 5, value: a.cheerAt, oninput: ev => { a.cheerAt = +ev.target.value; ev.target.previousSibling.textContent = `低於 ${a.cheerAt}%`; } }));
        list.appendChild(h('div', { class: 'lrow' }, h('div', { class: 'lmain' }, h('b', { text: name }), h('span', { class: 'muted', text: desc })), ...extra,
          h('button', { class: 'toggle' + (a[k] ? ' on' : ''), onclick: () => { a[k] = !a[k]; if (a[k]) a.master = true; m.rerender(); ui.refresh(); } }, h('i'))));
      }
      body.appendChild(list);
      body.appendChild(h('div', { class: 'row', style: 'margin-top:.7rem' }, h('b', { text: '保留金幣：' }), h('span', { class: 'muted small', text: '自動功能花錢時，至少保留這麼多金幣' }),
        h('input', { class: 'inp', type: 'number', min: 0, step: 100, value: a.keepGold, style: 'width:8rem', onchange: ev => { a.keepGold = Math.max(0, +ev.target.value || 0); } })));
    },
  });
}

// ---------------- 任務 ----------------
export function openQuests(ui) {
  const g = ui.g;
  modal({
    ribbon: 'Quest', title: '任務', live: true, tab: 'story', tabs: () => [['story', '劇情任務', currentQuest(g).done], ['daily', '每日任務', ensureDaily(g).list.some(it => !it.claimed && dailyProgress(g, it) >= it.target)]],
    render: (body, m) => {
      if (m.tab === 'story') {
        const q = currentQuest(g), npc = NPCS[q.npc];
        body.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:1rem;flex-wrap:nowrap' }, h('div', { style: 'width:9rem;flex:none', html: fullSVG(npc.look, q.done ? 'f_happy' : 'f_stand', 200) }),
          h('div', { style: 'flex:1' }, h('h3', { text: q.title }), ...q.say.map(t => h('p', { class: 'lead', text: '「' + t + '」' })),
            h('div', { class: 'lrow' + (q.done ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: q.goal }), h('div', { class: 'bar green', style: 'margin-top:.3rem' }, h('i', { style: `width:${q.progress / q.target * 100}%` }))), h('b', { text: `${fmt(q.progress)}/${fmt(q.target)}` })),
            q.locked ? h('p', { class: 'muted', text: `等級 ${q.lv} 才能進行` }) : null,
            h('div', { class: 'row', style: 'margin-top:.6rem' }, h('b', { text: '獎勵：' }), ...rewardChips(q.reward)),
            h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn go lg', disabled: !q.done, onclick: () => { const r = claimQuest(g); if (r) { sfx('collect'); toast('任務完成！', 'good'); ui.refresh(); ui.storyIntro(); } } }, '領取獎勵')))));
      } else {
        const d = ensureDaily(g);
        body.appendChild(h('p', { class: 'lead', text: '每天早上 6 點更新。全部完成可以再領一份額外獎勵。' }));
        const list = h('div', { class: 'list' });
        d.list.forEach((it, i) => {
          const p = dailyProgress(g, it), ok = p >= it.target;
          list.appendChild(h('div', { class: 'lrow' + (it.claimed ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: `${it.name} ${it.target} 次` }), h('div', { class: 'bar green', style: 'margin-top:.3rem;max-width:20rem' }, h('i', { style: `width:${p / it.target * 100}%` }))), ...rewardChips(it.reward),
            it.claimed ? h('span', { class: 'muted', text: '已領取' }) : h('button', { class: 'btn go sm', disabled: !ok, onclick: () => { if (claimDaily(g, i)) { sfx('collect'); ui.refresh(); } } }, `${p}/${it.target}`)));
        });
        list.appendChild(h('div', { class: 'lrow' + (d.bonus ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: '完成全部每日任務' })), ...rewardChips({ coupon: 2, gold: 500 + g.s.level * 100 }),
          d.bonus ? h('span', { class: 'muted', text: '已領取' }) : h('button', { class: 'btn hot sm', disabled: !d.list.every(x => x.claimed), onclick: () => { if (claimDailyBonus(g)) { sfx('level'); ui.refresh(); } } }, '領取')));
        body.appendChild(list);
      }
    },
  });
}

// ---------------- 擴店 ----------------
export function openExpand(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Expand', title: '擴建店面', live: true,
    render: body => {
      const cur = D.EXPANSIONS[s.expand], nx = g.nextExpansion();
      body.appendChild(h('p', { class: 'lead', text: `目前店面 ${cur.W}×${cur.D} 格，後吧台 ${cur.slots} 格。` }));
      if (!nx) { body.appendChild(h('p', { class: 'lead center', text: '已經是最大的店面了！' })); return; }
      const mini = (W, Dd) => { const k = 14, pt = (x, y) => [(x - y) * k, (x + y) * k / 2]; return `<svg viewBox="${-nx.D * k - 4} -4 ${(nx.W + nx.D) * k + 8} ${(nx.W + nx.D) * k / 2 + 8}" style="width:14rem;height:8rem"><polygon points="${[pt(0, 0), pt(W, 0), pt(W, Dd), pt(0, Dd)].map(p => p.join(',')).join(' ')}" fill="#c99b6c" stroke="#5a3a2a" stroke-width="2"/></svg>`; };
      body.appendChild(h('div', { class: 'row center', style: 'gap:2rem' }, h('div', { class: 'center', html: mini(cur.W, cur.D) + `<div><b>現在 ${cur.W}×${cur.D}</b></div>` }), h('b', { style: 'font-size:2rem;color:var(--coral)', text: '→' }), h('div', { class: 'center', html: mini(nx.W, nx.D) + `<div><b>擴建後 ${nx.W}×${nx.D}</b><br><span class="muted small">吧台 ${nx.slots} 格</span></div>` })));
      const sc = g.score();
      const list = h('div', { class: 'list', style: 'margin:.8rem 0' },
        h('div', { class: 'lrow' + (s.level >= nx.lv ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: `店鋪等級 Lv${nx.lv}` })), h('b', { text: `Lv${s.level}` })),
        h('div', { class: 'lrow' + (sc >= nx.score ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: `裝潢分數 ${nx.score}` })), h('b', { text: String(sc) })),
        h('div', { class: 'lrow' + (s.gold >= nx.cost ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: '工程費' })), h('span', { class: 'price' }, ic('gold'), fmt(nx.cost))));
      body.appendChild(list);
      body.appendChild(h('div', { class: 'row center' }, h('button', { class: 'btn go lg', disabled: s.level < nx.lv || sc < nx.score || s.gold < nx.cost, onclick: () => { if (g.expand()) { toast('店面變大了！', 'good'); ui.closeAll(); ui.refresh(); } } }, '開始擴建')));
    },
  });
}

// ---------------- 設定 ----------------
export function openSettings(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Setting', title: '設定',
    render: (body, m) => {
      const name = h('input', { class: 'inp', value: s.name, maxlength: 12, style: 'flex:1' });
      body.append(h('h3', { text: '店名' }), h('div', { class: 'row' }, name, h('button', { class: 'btn', onclick: () => { s.name = name.value.trim() || '巷口咖啡館'; toast('店名已更新'); ui.refresh(); } }, '儲存')));
      const own = h('input', { class: 'inp', value: s.owner.name, maxlength: 8, style: 'flex:1' });
      body.append(h('h3', { text: '店長名字' }), h('div', { class: 'row' }, own, h('button', { class: 'btn', onclick: () => { s.owner.name = own.value.trim() || '店長'; toast('已更新'); } }, '儲存')));
      body.append(h('h3', { text: '聲音與畫質' }), h('div', { class: 'row' },
        h('button', { class: 'btn' + (s.settings.sound ? ' go' : ''), onclick: () => { s.settings.sound = !s.settings.sound; setSound(s.settings.sound); m.rerender(); } }, s.settings.sound ? '音效：開' : '音效：關'),
        h('button', { class: 'btn' + (s.settings.music ? ' go' : ''), onclick: () => { s.settings.music = !s.settings.music; setMusic(s.settings.music); m.rerender(); } }, s.settings.music ? '音樂：開' : '音樂：關'),
        h('div', { class: 'seg' }, [['auto', '自動畫質'], ['low', '省電'], ['high', '高畫質']].map(([k, nm]) => h('button', { class: s.settings.quality === k ? 'on' : '', onclick: () => { s.settings.quality = k; ui.world.engine.quality = k; m.rerender(); } }, nm)))));
      body.append(h('h3', { text: '存檔' }), h('p', { class: 'lead', text: '遊戲會自動存在這台裝置的瀏覽器裡。換裝置時，先在這裡複製存檔碼，到新裝置貼上讀取。清除瀏覽器資料會讓存檔消失。' }));
      const out = h('textarea', { class: 'inp', readonly: true, rows: 3 });
      body.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { out.value = exportCode(s); out.select(); try { navigator.clipboard.writeText(out.value); toast('存檔碼已複製'); } catch (e) { toast('請手動複製下面的文字'); } } }, '匯出存檔碼')), out);
      const inp = h('textarea', { class: 'inp', rows: 3, placeholder: '把存檔碼貼在這裡' });
      body.append(inp, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { try { const ns = importCode(inp.value); save(ns); blockSaves(); location.reload(); } catch (e) { toast('存檔碼無法讀取：' + e.message, 'warn'); } } }, '讀取存檔碼')));
      body.append(h('h3', { text: '重新開始' }), h('button', { class: 'btn hot', onclick: () => confirmBox('確定要清除所有進度，從頭開始嗎？這個動作無法復原。', '清除進度', () => { clearSave(); location.reload(); }) }, '清除進度'));
      body.append(h('p', { class: 'muted small', style: 'margin-top:1rem', text: `${D.GAME_TITLE}：原創咖啡館經營遊戲。玩法致敬經典咖啡店經營遊戲，角色、美術、文案皆為原創。` }));
    },
  });
}

// ---------------- 升級 ----------------
export function showLevelUp(ui, from, lv, bonus) {
  const g = ui.g;
  const un = [];
  const inR = x => x >= from && x <= lv;
  D.ROASTS.forEach(r => inR(r.lv) && r.lv > 1 && un.push(['roast', r.id, r.name]));
  D.RECIPE_ORDER.forEach(r => inR(D.RECIPES[r].lv) && un.push(['drink', r, D.RECIPES[r].name]));
  D.SIDE_ORDER.forEach(r => inR(D.SIDES[r].lv) && un.push(['side', r, D.SIDES[r].name]));
  D.MEAL_ORDER.forEach(r => inR(D.MEALS[r].lv) && un.push(['meal', r, D.MEALS[r].name]));
  Object.entries(D.FURNITURE).forEach(([k, f]) => inR(f.lv) && f.lv > 1 && un.push(['furn', k, f.name]));
  const extra = [];
  Object.entries(D.TOOLS).forEach(([, t]) => inR(t.lv) && t.lv > 1 && extra.push(`可以買${t.name}`));
  Object.entries(D.JOBS).forEach(([, j]) => inR(j.lv) && j.lv > 1 && extra.push(`可以雇用${j.name}員`));
  D.EXPANSIONS.forEach(e => inR(e.lv) && e.cost && extra.push('可以擴店'));
  sfx('level');
  modal({
    ribbon: 'Level Up', title: D.TITLES[lv],
    render: body => {
      body.append(h('div', { class: 'lvbig', text: 'Lv ' + lv }), h('div', { class: 'row center' }, ...rewardChips({ gold: bonus, coupon: lv - from + 1 }), h('span', { class: 'chip' }, ic('energy'), '員工元氣全滿')));
      if (un.length) {
        body.append(h('h3', { class: 'center', text: '新解鎖' }));
        const box = h('div', { class: 'unlocks' });
        for (const [k, id, nm] of un.slice(0, 12)) {
          const u = h('div', { class: 'unl' }, h('div', { class: 'uimg' }), h('span', { text: nm }));
          const img = u.firstChild;
          if (k === 'drink') img.innerHTML = drinkIcon(id, 54);
          else if (k === 'side') img.innerHTML = sideIcon(id, 54);
          else if (k === 'meal') img.innerHTML = mealIcon(id, 54);
          else if (k === 'roast') img.innerHTML = I.bean;
          else ui.furnArt(id).then(src => { if (src) img.innerHTML = `<img src="${src}" alt="">`; });
          box.appendChild(u);
        }
        body.appendChild(box);
      }
      if (extra.length) body.append(h('p', { class: 'lead center', style: 'margin-top:.6rem', text: extra.join('・') }));
      body.append(h('div', { class: 'row center', style: 'margin-top:.6rem' }, h('button', { class: 'btn go lg', onclick: () => ui.closeTop() }, '太好了！')));
    },
  });
  void g;
}

// ---------------- 離線報告 ----------------
export function showOffline(ui, sum) {
  modal({
    ribbon: 'Welcome', title: `你離開了 ${fmtTime(sum.secs)}，店裡照常營業`,
    render: body => {
      body.append(h('div', { class: 'sumgrid' },
        h('div', {}, h('div', { class: 'big' }, ic('gold'), (sum.gold >= 0 ? '+' : '') + fmt(sum.gold)), h('small', { text: '金幣（已扣除自動花費）' })),
        h('div', {}, h('div', { class: 'big' }, ic('cup'), fmt(sum.sold)), h('small', { text: '賣出飲品' })),
        h('div', {}, h('div', { class: 'big' }, ic('bean'), (sum.beans >= 0 ? '+' : '') + fmt(sum.beans)), h('small', { text: '咖啡豆變化' })),
        h('div', {}, h('div', { class: 'big' }, ic('cake'), fmt(sum.sides)), h('small', { text: '賣出點心' })),
        h('div', {}, h('div', { class: 'big' }, ic('meal'), fmt(sum.meals)), h('small', { text: '賣出料理' })),
        h('div', {}, h('div', { class: 'big' }, ic('smoke'), fmt(sum.burnt)), h('small', { text: '燒焦（沒開自動收成）' }))));
      body.append(h('p', { class: 'lead center', style: 'margin-top:.7rem', text: '想讓店裡在你不在時賺更多？打開「自動經營」，或出門前把咖啡機都煮滿。' }));
      body.append(h('div', { class: 'row center' }, h('button', { class: 'btn go lg', onclick: () => ui.closeTop() }, '開始營業')));
    },
  });
}
export { openSettings as settings, now };
