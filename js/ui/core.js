// 介面共用：建立元素、面板、提示、數字格式
import { I } from '../icons.js';
import { sfx } from '../audio.js';

export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style') e.setAttribute('style', v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  return e;
}
export const fmt = n => Math.floor(n).toLocaleString('zh-TW');
export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return sec + '秒';
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return s && m < 10 ? `${m}分${s}秒` : `${m}分`;
  const hh = Math.floor(m / 60), mm = m % 60;
  return mm ? `${hh}小時${mm}分` : `${hh}小時`;
}
export const ic = (name, cls = 'ic') => h('span', { class: cls, html: I[name] || '' });
export function price(gold, coupon) {
  return coupon ? h('span', { class: 'price' }, ic('coupon'), fmt(coupon)) : h('span', { class: 'price' }, ic('gold'), fmt(gold));
}
export function rewardChips(r) {
  const out = [];
  if (r.gold) out.push(h('span', { class: 'chip' }, ic('gold'), fmt(r.gold)));
  if (r.beans) out.push(h('span', { class: 'chip' }, ic('bean'), fmt(r.beans)));
  if (r.coupon) out.push(h('span', { class: 'chip' }, ic('coupon'), fmt(r.coupon)));
  if (r.exp) out.push(h('span', { class: 'chip' }, ic('exp'), fmt(r.exp)));
  if (r.energy) out.push(h('span', { class: 'chip' }, ic('energy'), r.energy + '分'));
  return out;
}

// ---------- 面板 ----------
let layer = null, toastBox = null;
const stack = [];
export function initCore(root) {
  layer = h('div', { class: 'modal-layer' });
  toastBox = h('div', { class: 'toasts' });
  root.append(layer, toastBox);
}
export function topModal() { return stack[stack.length - 1] || null; }
export function anyModal() { return stack.length > 0; }
// ribbon：緞帶上的英文標題；title：中文副標
export function modal({ ribbon, title, cls = '', tabs = null, tab = null, render, live = false, onClose = null, closable = true, wide = false }) {
  const box = h('div', { class: 'panel modal ' + cls + (wide ? ' wide' : '') });
  const rib = h('div', { class: 'ribbon' }, h('span', { text: ribbon || '' }));
  const sub = title ? h('div', { class: 'm-title', text: title }) : null;
  const x = closable ? h('button', { class: 'm-close', 'aria-label': '關閉', html: I.close, onclick: () => close() }) : null;
  const tabBar = h('div', { class: 'm-tabs' });
  const body = h('div', { class: 'm-body' });
  box.append(...[rib, sub, x, tabBar, body].filter(Boolean));
  const shade = h('div', { class: 'shade' }, box);
  shade.addEventListener('pointerdown', ev => { if (ev.target === shade && closable) shade.dataset.down = '1'; });
  shade.addEventListener('click', ev => { if (ev.target === shade && shade.dataset.down && closable) close(); shade.dataset.down = ''; });
  const below = stack[stack.length - 1];
  if (below) below.el.style.visibility = 'hidden';
  layer.appendChild(shade);
  const m = { el: shade, box, body, tabBar, tab, live, close, rerender: null, data: {} };
  function rerender() {
    const st = body.scrollTop;
    body.innerHTML = '';
    if (tabs) {
      tabBar.innerHTML = '';
      for (const [k, label, badge] of (typeof tabs === 'function' ? tabs() : tabs)) {
        tabBar.appendChild(h('button', { class: 'm-tab' + (m.tab === k ? ' on' : ''), onclick: () => { sfx('click'); m.tab = k; body.scrollTop = 0; rerender(); } }, label, badge ? h('i', { class: 'dot' }) : null));
      }
    } else tabBar.remove();
    render(body, m);
    body.scrollTop = st;
  }
  function close(silent) {
    const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1);
    const top = stack[stack.length - 1]; if (top) top.el.style.visibility = '';
    if (silent) shade.remove(); else { shade.classList.add('closing'); setTimeout(() => shade.remove(), 160); }
    if (onClose) onClose();
  }
  m.rerender = rerender;
  stack.push(m);
  rerender();
  sfx('open');
  return m;
}
export function closeAll() { while (stack.length) stack[stack.length - 1].close(true); }
// 按住畫面時不要重畫面板（不然按鈕會在按下的瞬間被換掉）
let pointerDown = false;
window.addEventListener('pointerdown', () => { pointerDown = true; }, true);
window.addEventListener('pointerup', () => { setTimeout(() => { pointerDown = false; }, 60); }, true);
window.addEventListener('pointercancel', () => { pointerDown = false; }, true);
export function refreshLive(version) {
  if (pointerDown) return;
  const t = Date.now();
  for (const m of stack) {
    if (!m.live) continue;
    if (m.ver !== version || t - (m.last || 0) > 1000) { m.ver = version; m.last = t; m.rerender(); }
  }
}

// ---------- 提示 ----------
export function toast(msg, type = '') {
  if (!toastBox) return;
  const t = h('div', { class: 'toast ' + type, text: msg });
  toastBox.appendChild(t);
  while (toastBox.children.length > 3) toastBox.firstChild.remove();
  setTimeout(() => t.classList.add('out'), 2400);
  setTimeout(() => t.remove(), 2900);
}

// 確認視窗（不使用瀏覽器 confirm）
export function confirmBox(text, okLabel, onOk) {
  const m = modal({
    ribbon: 'OK?', cls: 'm-confirm', render: body => {
      body.append(h('p', { class: 'lead center', text }), h('div', { class: 'row center' },
        h('button', { class: 'btn', onclick: () => m.close() }, '取消'),
        h('button', { class: 'btn go', onclick: () => { m.close(); onOk(); } }, okLabel || '確定')));
    },
  });
  return m;
}
