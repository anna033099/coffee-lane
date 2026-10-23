// 機器面板：烘豆、沖煮、點心、料理、購買吧台機器
import { h, modal, ic, fmt, fmtTime, toast, price } from './core.js';
import * as D from '../data.js';
import { I, drinkIcon, sideIcon, mealIcon, beanBagIcon, itemIcon } from '../icons.js';
import { openBarista, GRADE_ZH } from './barista.js';
import { now } from '../state.js';
import { sfx } from '../audio.js';

export function openMachine(ui, slot) {
  const g = ui.g, m = g.machineAt(slot);
  if (!m) return openMachineShop(ui, slot);
  const st = g.status(m);
  if (st.st === 'done' || st.st === 'burnt') { g.collect(m); ui.refresh(); return; }
  const kind = g.mdef(m).kind;
  if (st.st === 'run' || st.st === 'sell') return openRunning(ui, m);
  if (kind === 'roaster') return openRoaster(ui, m);
  if (kind === 'espresso') return openBrewer(ui, m);
  if (kind === 'side') return openSide(ui, m);
  if (kind === 'kitchen') return openKitchen(ui, m);
}

function card({ art, title, sel, locked, tl, tag, meta, foot, stars, cls = '' }) {
  return h('div', { class: 'tcard ' + cls + (locked ? ' locked' : '') + (sel ? ' sel' : '') },
    h('b', { text: title }),
    stars !== undefined ? h('div', { class: 'stars' }, [0, 1, 2].map(i => ic(i < stars ? 'star' : 'starOff'))) : null,
    h('div', { class: 'art', html: art }, tl ? h('span', { class: 'tl', text: tl }) : null, tag ? h('span', { class: 'tag', text: tag }) : null),
    meta ? h('div', { class: 'meta' }, ...meta) : null,
    foot);
}
const lockLine = (txt) => h('span', { class: 'lock', html: I.lock + txt });

function openRunning(ui, m) {
  const g = ui.g;
  const mm = modal({
    ribbon: { roast: 'Roasting', brew: 'Selling', side: 'Baking', meal: 'Cooking' }[m.job.kind], title: g.mdef(m).name, live: true, cls: 'm-small',
    render: body => {
      const st = g.status(m);
      if (!m.job || (st.st !== 'run' && st.st !== 'sell')) { mm.close(true); return; }
      const j = m.job;
      const art = j.kind === 'roast' ? beanBagIcon(j.item, 90) : j.kind === 'brew' ? itemIcon('drink', j.item, 90) : j.kind === 'side' ? itemIcon('side', j.item, 90) : itemIcon('meal', j.item, 90);
      const name = j.kind === 'roast' ? D.ROASTS.find(r => r.id === j.item).name : j.kind === 'brew' ? D.RECIPES[j.item].name : j.kind === 'side' ? D.SIDES[j.item].name : D.MEALS[j.item].name;
      const row = h('div', { class: 'row', style: 'gap:1.2rem;align-items:center' }, h('div', { style: 'width:6rem;height:6rem', html: art }));
      const info = h('div', { style: 'flex:1' }, h('h3', { text: name }));
      if (st.st === 'run') {
        info.append(h('div', { class: 'bar green', style: 'height:1.1rem' }, h('i', { style: `width:${st.p * 100}%` })), h('p', { class: 'lead', text: (j.kind === 'brew' ? '準備中，' : '') + '還要 ' + fmtTime(st.left) }));
        info.append(h('div', { class: 'row' }, h('button', { class: 'btn blue', onclick: () => { if (g.rush(m)) { toast('立刻完成！'); mm.close(); ui.refresh(); } } }, '立即完成 ', ic('coupon'), '1')));
        if (j.kind === 'roast') info.append(h('p', { class: 'muted small', text: `烘好之後 ${fmtTime(D.burnAfter(j.dur))} 內要收成，否則會燒焦。` }));
        if (j.kind === 'side') info.append(h('p', { class: 'muted small', text: `烤好之後 ${fmtTime(D.SIDE_BURN)} 內要收成。` }));
        if (j.kind === 'meal') info.append(h('p', { class: 'muted small', text: `完成後 ${fmtTime(D.MEAL_BURN)} 內要收成。` + (j.tops.length ? ' 加料：' + j.tops.map(t => D.TOPPINGS[t].name).join('、') : '') }));
      } else {
        info.append(h('div', { class: 'bar', style: 'height:1.1rem' }, h('i', { style: `width:${st.left / st.total * 100}%` })), h('p', { class: 'lead', text: `販售中：還剩 ${st.left} / ${st.total} 杯，客人會一杯一杯買走。` }));
        info.append(h('button', { class: 'btn', onclick: () => { m.job = null; g.touch(); mm.close(); toast('已經把剩下的倒掉了'); } }, '倒掉剩下的，換別的飲品'));
      }
      row.appendChild(info);
      body.appendChild(row);
    },
  });
}

function autoRow(ui, key, label) {
  const g = ui.g;
  const on = g.s.auto.master && g.s.auto[key];
  return h('div', { class: 'row', style: 'justify-content:flex-end;margin-top:.6rem' }, h('span', { class: 'muted small', text: label }),
    h('button', { class: 'toggle' + (on ? ' on' : ''), onclick: () => { g.s.auto[key] = !on; if (!on) g.s.auto.master = true; ui.refresh(); ui.rerenderTop(); } }, h('i')));
}

function openRoaster(ui, m) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Bean', title: '選擇要烘焙的咖啡豆', live: true,
    render: body => {
      body.appendChild(h('p', { class: 'lead', text: `花金幣買生豆來烘焙，烘好收成就會變成咖啡豆（目前 ${fmt(s.beans)} 顆）。烘焙越久，產量越划算。` }));
      const grid = h('div', { class: 'cards' });
      for (const r of D.ROASTS) {
        const lock = s.level < r.lv;
        grid.appendChild(card({
          art: beanBagIcon(r.id, 80), title: r.name, locked: lock, tag: r.origin, sel: m.auto.item === r.id,
          meta: [h('span', {}, ic('clock'), fmtTime(r.time * (g.mdef(m).speed || 1))), h('span', {}, ic('bean'), fmt(r.beans))],
          foot: lock ? lockLine(`Lv${r.lv} 解鎖`) : h('button', { class: 'btn go', disabled: s.gold < r.cost, onclick: () => { if (g.startRoast(m, r.id)) { ui.closeTop(); ui.refresh(); } } }, '烘焙 ', ic('gold'), fmt(r.cost)),
        }));
      }
      body.appendChild(grid);
      body.appendChild(autoRow(ui, 'roast', '自動續烘（收成後自動再烘同一種）'));
    },
  });
}

export function trainRecipe(ui, id, after) {
  const g = ui.g;
  openBarista(id, 'train', grade => {
    if (grade === 'bad') { toast('再試一次吧！照著左邊的步驟做', 'warn'); return; }
    g.s.recipes[id].trained = true; g.s.stats.trained++; g.addExp(5); g.touch();
    toast(`學會了「${D.RECIPES[id].name}」！現在可以販售了`, 'good');
    ui.refresh();
    if (after) after();
  }, { ownedTools: g.s.tools });
}
export function testRecipe(ui, id) {
  const g = ui.g, rs = g.s.recipes[id];
  const need = ['good', 'great', 'perfect'][rs.stars];
  openBarista(id, 'test', grade => {
    g.s.stats.tests++;
    const rank = { bad: 0, good: 1, great: 2, perfect: 3 };
    if (rank[grade] >= rank[need]) {
      rs.stars++; g.addExp(10 * rs.stars); g.s.coupons += rs.stars === 3 ? 2 : 0;
      toast(`評比通過！${D.RECIPES[id].name} 升到 ${rs.stars} 星，售價提高了`, 'good');
    } else toast(`這次是「${GRADE_ZH[grade]}」，需要「${GRADE_ZH[need]}」以上才能升星`, 'warn');
    g.touch(); ui.refresh();
  }, { ownedTools: g.s.tools });
}
export function testReady(g, id) { const rs = g.s.recipes[id]; return rs.trained && rs.stars < 3 && rs.sold >= D.STAR_SALES[rs.stars]; }

function openBrewer(ui, m) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Coffee', title: '選擇要沖煮的飲品', live: true, wide: true,
    render: body => {
      body.appendChild(h('p', { class: 'lead', text: `沖煮會用掉咖啡豆（目前 ${fmt(s.beans)} 顆）。新飲品要先「進修」學一次；賣到一定數量可以參加「評比」升星，售價會提高。` }));
      const grid = h('div', { class: 'cards' });
      for (const id of D.RECIPE_ORDER) {
        const r = D.RECIPES[id], rs = s.recipes[id];
        if (r.lv > s.level + 5) continue;
        const lvLock = s.level < r.lv, toolLock = !s.tools[r.tool];
        let foot;
        if (lvLock) foot = lockLine(`Lv${r.lv} 解鎖`);
        else if (toolLock) foot = h('button', { class: 'btn', onclick: () => ui.openRecipes('tools') }, `需要${D.TOOLS[r.tool].name}`);
        else if (!rs.trained) foot = h('button', { class: 'btn hot', onclick: () => trainRecipe(ui, id) }, '進修');
        else foot = h('div', { class: 'row center' },
          testReady(g, id) ? h('button', { class: 'btn blue sm', onclick: () => testRecipe(ui, id) }, '評比') : null,
          h('button', { class: 'btn go', disabled: s.beans < r.beans, onclick: () => { if (g.startBrew(m, id)) { ui.closeTop(); ui.refresh(); } } }, '沖煮 ', ic('bean'), r.beans));
        grid.appendChild(card({
          art: itemIcon('drink', id, 80), title: r.name, locked: lvLock, stars: rs.trained ? rs.stars : undefined, tag: '×' + g.brewCups(m, id), tl: testReady(g, id) ? '可評比' : null,
          meta: [h('span', {}, ic('gold'), g.price(id)), h('span', {}, ic('clock'), fmtTime(Math.round(r.prep * (g.mdef(m).speedMul || 1))))],
          foot,
        }));
      }
      body.appendChild(grid);
      body.appendChild(autoRow(ui, 'brew', '自動沖煮（賣完就自動再煮）'));
    },
  });
}

function openSide(ui, m) {
  const g = ui.g, s = g.s, mac = g.mdef(m).machine;
  modal({
    ribbon: 'Dessert', title: g.mdef(m).name, live: true,
    render: body => {
      body.appendChild(h('p', { class: 'lead', text: `點心烤好收成後會放進前檯的甜點櫃（${g.showcaseCount()}/${D.SHOWCASE_CAP}），客人買咖啡時常會順便帶一份。` }));
      const grid = h('div', { class: 'cards' });
      for (const id of D.SIDE_ORDER.filter(k => D.SIDES[k].machine === mac)) {
        const r = D.SIDES[id], lock = s.level < r.lv;
        grid.appendChild(card({
          art: itemIcon('side', id, 80), title: r.name, locked: lock, tag: '×' + r.pcs, sel: m.auto.item === id,
          meta: [h('span', {}, ic('gold'), r.price + '/份'), h('span', {}, ic('clock'), fmtTime(r.time))],
          foot: lock ? lockLine(`Lv${r.lv} 解鎖`) : h('button', { class: 'btn go', disabled: s.gold < r.cost, onclick: () => { if (g.startSide(m, id)) { ui.closeTop(); ui.refresh(); } } }, '製作 ', ic('gold'), fmt(r.cost)),
        }));
      }
      body.appendChild(grid);
      body.appendChild(autoRow(ui, 'side', '自動做點心（烤好自動收、再烤一批）'));
    },
  });
}

function openKitchen(ui, m) {
  const g = ui.g, s = g.s, mac = g.mdef(m).machine;
  const pickTops = new Set((m.auto.toppings || []).filter(k => s.level >= D.TOPPINGS[k].lv));
  modal({
    ribbon: 'Kitchen', title: g.mdef(m).name, live: false, wide: true,
    render: (body, mm) => {
      body.appendChild(h('p', { class: 'lead', text: `料理收成後放在出餐檯（${g.mealCount()}/${D.MEAL_CAP}）。可以客製加料（最多 3 種），加越多賣越貴。` }));
      const tops = h('div', { class: 'row', style: 'margin-bottom:.7rem' }, h('b', { text: '加料：' }));
      for (const [k, t] of Object.entries(D.TOPPINGS)) {
        const lock = s.level < t.lv, on = pickTops.has(k);
        tops.appendChild(h('button', { class: 'btn sm' + (on ? ' go' : '') + (lock ? ' dis' : ''), onclick: () => { if (lock) return toast(`Lv${t.lv} 解鎖`, 'warn'); if (on) pickTops.delete(k); else if (pickTops.size < 3) pickTops.add(k); else return toast('最多加 3 種', 'warn'); mm.rerender(); } }, `${t.name} +${Math.round(t.bonus * 100)}%`, lock ? null : h('span', { class: 'muted', text: ` ${t.cost}G` })));
      }
      body.appendChild(tops);
      const tl = [...pickTops];
      const grid = h('div', { class: 'cards' });
      for (const id of D.MEAL_ORDER.filter(k => D.MEALS[k].machine === mac)) {
        const r = D.MEALS[id], lock = s.level < r.lv;
        const cost = g.mealCost(id, tl), mult = g.mealMult(tl);
        grid.appendChild(card({
          art: itemIcon('meal', id, 80), title: r.name, locked: lock, tag: '×' + r.pcs, sel: m.auto.item === id,
          meta: [h('span', {}, ic('gold'), Math.round(r.price * mult) + '/份'), h('span', {}, ic('clock'), fmtTime(r.time))],
          foot: lock ? lockLine(`Lv${r.lv} 解鎖`) : h('button', { class: 'btn go', disabled: s.gold < cost, onclick: () => { if (g.startMeal(m, id, tl)) { ui.closeTop(); ui.refresh(); } } }, '料理 ', ic('gold'), fmt(cost)),
        }));
      }
      body.appendChild(grid);
      body.appendChild(autoRow(ui, 'meal', '自動料理（完成自動收、用同樣加料再做）'));
    },
  });
}

export function openMachineShop(ui, slot, tab) {
  const g = ui.g, s = g.s;
  const up = slot >= 100;
  const KIND_ZH = { roaster: '烘豆', espresso: '咖啡', side: '點心', kitchen: '料理' };
  modal({
    ribbon: 'Machine', title: up ? `2 樓甜點吧第 ${slot - 99} 格` : slot ? `吧台第 ${slot} 格` : '購買吧台設備', live: true, wide: true,
    tab: up ? 'side' : tab || 'roaster', tabs: up ? null : () => Object.entries(KIND_ZH).map(([k, v]) => [k, v]),
    render: (body, m) => {
      body.appendChild(h('p', { class: 'lead', text: up ? '2 樓只能擺甜點機器，不佔一樓吧台的數量上限。' : `吧台共有 ${g.slots} 個位置（第 0 格固定放磨豆機）。每類機器的數量上限會隨等級提高，擴店可以增加吧台長度。` }));
      const grid = h('div', { class: 'cards' });
      for (const [id, d] of Object.entries(D.BAR_MACHINES).filter(([, d]) => d.kind === m.tab).sort((a, b) => a[1].lv - b[1].lv)) {
        const lock = s.level < d.lv;
        const count = g.machineCount(d.kind), cap = D.machineCap(d.kind, s.level);
        const full = !up && count >= cap;
        const makes = d.kind === 'side' ? D.SIDE_ORDER.filter(k => D.SIDES[k].machine === d.machine).length : d.kind === 'kitchen' ? D.MEAL_ORDER.filter(k => D.MEALS[k].machine === d.machine).length : 0;
        const c = card({
          art: '', title: d.name, locked: lock, tag: up ? '' : `${count}/${cap}`,
          meta: [h('span', { text: KIND_ZH[d.kind] + (makes ? `・${makes} 道菜` : '') })],
          foot: lock ? lockLine(`Lv${d.lv} 解鎖`) : h('button', { class: 'btn go', disabled: full || s.gold < d.cost, onclick: () => { if (g.buyMachine(id, slot && !g.machineAt(slot) ? slot : (up ? g.freeSlot(true) : 0))) { toast(`${d.name}放上吧台了`, 'good'); ui.closeTop(); ui.refresh(); } } }, d.cost ? '購買 ' : '免費', d.cost ? ic('gold') : null, d.cost ? fmt(d.cost) : null),
        });
        ui.machineArt(id).then(src => { const a = c.querySelector('.art'); if (src && a) a.innerHTML = `<img src="${src}" alt="" style="width:80%;height:90%;object-fit:contain">`; });
        grid.appendChild(c);
      }
      body.appendChild(grid);
    },
  });
}
export { sfx, now, price };
