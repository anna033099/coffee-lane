// 店貓面板：領養、餵食、摸摸、技能
import { h, modal, ic, fmt, fmtTime, toast } from './core.js';
import * as D from '../data.js';
import { catIcon, catLevel, CAT_SKILLS } from '../cat.js';
import { now } from '../state.js';
import { sfx } from '../audio.js';

export function openCat(ui) {
  const g = ui.g, s = g.s;
  let pick = 'orange';
  modal({
    ribbon: 'Cat', title: s.cat ? `店貓 ${s.cat.name}` : '領養一隻店貓', live: !!s.cat,
    render: (body, m) => {
      if (!s.cat) {
        body.appendChild(h('p', { class: 'lead', text: '店貓會在店裡散步、睡午覺，牠的技能可以幫上忙。好好餵牠、摸摸牠，牠會越來越親近你。' }));
        const grid = h('div', { class: 'cards sm' });
        for (const [k, c] of Object.entries(D.CATS)) grid.appendChild(h('button', { class: 'tcard' + (pick === k ? ' sel' : ''), onclick: () => { pick = k; m.rerender(); } }, h('b', { text: c.name }), h('div', { class: 'art', html: catIcon(k, 90) })));
        body.appendChild(grid);
        const nm = h('input', { class: 'inp', value: '咖啡', maxlength: 8 });
        body.appendChild(h('div', { class: 'row center', style: 'margin-top:.8rem' }, h('b', { text: '名字：' }), nm, h('button', { class: 'btn go', disabled: s.gold < D.CAT_COST, onclick: () => {
          if (!g.spend(D.CAT_COST)) return;
          s.cat = { type: pick, name: nm.value.trim() || '咖啡', hunger: 10, hungerT: now(), love: 0, petAt: 0, skills: {} };
          sfx('level'); toast(`${s.cat.name}來到店裡了！`, 'good'); ui.closeTop(); ui.refresh();
        } }, '領養 ', ic('gold'), fmt(D.CAT_COST))));
        return;
      }
      const cat = s.cat, lv = catLevel(cat);
      const petCd = Math.max(0, 600 - (now() - (cat.petAt || 0)));
      body.appendChild(h('div', { class: 'row', style: 'gap:1.2rem;align-items:flex-start;flex-wrap:nowrap' },
        h('div', { style: 'width:10rem;flex:none', html: catIcon(cat.type, 160, cat.hunger < 3 ? 'sleep' : 'sit') }),
        h('div', { style: 'flex:1' },
          h('h3', { text: `${cat.name}　Lv${lv}` }),
          h('div', { class: 'row' }, h('span', { text: '飽足' }), h('div', { class: 'bar', style: 'width:12rem' }, h('i', { style: `width:${cat.hunger * 10}%` }))),
          h('div', { class: 'row', style: 'margin-top:.3rem' }, h('span', { text: '親密' }), h('div', { class: 'bar pink', style: 'width:12rem' }, h('i', { style: `width:${(cat.love % 20) / 20 * 100}%` })), h('small', { text: lv >= 5 ? '最高等級' : `下一級還差 ${20 - cat.love % 20}` })),
          h('div', { class: 'row', style: 'margin-top:.6rem' },
            h('button', { class: 'btn go', disabled: s.gold < 80 || cat.hunger >= 10, onclick: () => { if (g.spend(80)) { cat.hunger = 10; cat.love = Math.min(100, cat.love + 2); sfx('coin'); toast(`${cat.name}吃得好開心`); m.rerender(); ui.refresh(); } } }, '餵食 ', ic('gold'), '80'),
            h('button', { class: 'btn', disabled: petCd > 0, onclick: () => { cat.petAt = now(); cat.love = Math.min(100, cat.love + 3); sfx('cheer'); toast(`${cat.name}：喵～`); m.rerender(); } }, petCd ? `摸摸（${fmtTime(petCd)}）` : '摸摸')))));
      body.appendChild(h('h3', { text: '技能' }));
      const list = h('div', { class: 'list' });
      CAT_SKILLS.forEach((sk, i) => {
        const last = (cat.skills || {})[i] || 0, cd = Math.max(0, sk.cd - (now() - last));
        const lock = lv < sk.lv;
        list.appendChild(h('div', { class: 'lrow' }, h('div', { class: 'lmain' }, h('b', { text: sk.name }), h('span', { class: 'muted', text: sk.desc + `（冷卻 ${fmtTime(sk.cd)}）` })),
          lock ? h('span', { class: 'muted', text: `店貓 Lv${sk.lv}` }) : h('button', { class: 'btn hot', disabled: cd > 0 || cat.hunger < 2, onclick: () => { cat.skills = cat.skills || {}; cat.skills[i] = now(); const msg = sk.run(g); sfx('level'); toast(msg, 'good'); m.rerender(); ui.refresh(); } }, cd ? fmtTime(cd) : cat.hunger < 2 ? '太餓了' : '使用')));
      });
      body.appendChild(list);
    },
  });
}
