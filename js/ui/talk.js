// 對話框：NPC 劇情、街頭招攬問答、常客特別訂單
import { h } from './core.js';
import { fullSVG } from '../chara.js';
import { sfx } from '../audio.js';

let host = null;
export function initTalk(root) { host = root; }

// lines：[{text, opts?:[...], next?:label}]；回傳 Promise<選項索引或 null>
export function talk({ name, role, look, expr = 'f_stand', lines, counter = null }) {
  return new Promise(resolve => {
    const shade = h('div', { class: 'talk-shade' });
    const por = h('div', { class: 'tpor', html: fullSVG(look, expr, 260) });
    const text = h('div', { class: 'ttext' });
    const opts = h('div', { class: 'topts' });
    const next = h('div', { class: 'tnext' });
    const cnt = counter ? h('div', { class: 'qcount', text: counter }) : null;
    const box = h('div', { class: 'tbox plate' }, h('div', { class: 'tname' }, name, role ? h('small', { text: role }) : null), cnt, text, opts, next);
    const wrap = h('div', { class: 'talk' }, por, box);
    host.append(shade, wrap);
    let i = 0;
    const answers = [];
    const close = (v) => { shade.remove(); wrap.remove(); resolve(v); };
    const show = () => {
      const L = lines[i];
      if (typeof L.counter === 'string' && cnt) cnt.textContent = L.counter;
      if (L.look) por.innerHTML = fullSVG(L.look, L.expr || expr, 260);
      else if (L.expr) por.innerHTML = fullSVG(look, L.expr, 260);
      // 打字效果
      text.textContent = '';
      const full = L.text; let k = 0;
      const timer = setInterval(() => { k += 2; text.textContent = full.slice(0, k); if (k >= full.length) clearInterval(timer); }, 18);
      opts.innerHTML = ''; next.innerHTML = '';
      if (L.opts) {
        L.opts.forEach((o, j) => opts.appendChild(h('button', { class: 'btn', onclick: () => { clearInterval(timer); sfx('click'); answers.push(j); if (L.onPick) { const r = L.onPick(j); if (r === 'stop') return close(answers); } advance(); } }, o)));
      } else {
        next.appendChild(h('button', { class: 'btn go', onclick: () => { clearInterval(timer); sfx('click'); if (k < full.length) { k = full.length; text.textContent = full; return; } advance(); } }, L.next || (i === lines.length - 1 ? '好的' : '下一句')));
        if (L.cancel) next.prepend(h('button', { class: 'btn', onclick: () => { clearInterval(timer); close(null); } }, L.cancel));
      }
    };
    const advance = () => { i++; if (i >= lines.length) close(answers); else show(); };
    show();
  });
}
