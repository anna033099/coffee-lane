// 擴充玩法的介面：外送、賽季、評鑑、食物銀行、幸運轉盤、2 樓甜點區
import { h, modal, ic, fmt, fmtTime, toast, rewardChips } from './core.js';
import * as D from '../data.js';
import * as X from '../extra.js';
import { I, BIG, itemIcon } from '../icons.js';
import { sfx } from '../audio.js';
import { now } from '../state.js';

const chips = r => { const out = rewardChips(r); if (r.ticket) out.push(h('span', { class: 'chip' }, h('span', { class: 'ic', html: BIG.lottery }), '×' + r.ticket)); if (r.pts) out.push(h('span', { class: 'chip' }, h('span', { class: 'ic', html: BIG.delivery }), '+' + r.pts)); return out; };

// ---------------- 外送 ----------------
export function openDelivery(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Delivery', title: '外送訂單', live: true, wide: true,
    render: body => {
      X.deliveryTick(g);
      const d = s.delivery, lv = X.riderLevel(g);
      body.appendChild(h('div', { class: 'dl-head' },
        h('div', { class: 'dl-rider', html: BIG.delivery }),
        h('div', {}, h('b', { text: `外送小隊 Lv ${lv}` }), h('div', { class: 'muted small', text: `已完成 ${fmt(d.done)} 張訂單・外送點數 ${fmt(d.pts)}・偶爾會拿到轉盤券` })),
        h('div', { class: 'muted small', style: 'margin-left:auto;max-width:22rem', text: '把店裡正在賣的飲品、甜點櫃的甜點、出餐檯的料理湊齊就能出貨。外送的報酬比店內販售高。' })));
      const grid = h('div', { class: 'dl-grid' });
      d.orders.forEach((o, i) => {
        if (o.empty) { grid.appendChild(h('div', { class: 'dl-card empty' }, h('div', { class: 'dl-wait', html: BIG.delivery }), h('b', { text: '等待新訂單' }), h('span', { class: 'muted', text: o.ready > now() ? `約 ${fmtTime(o.ready - now())} 後` : '馬上就來' }))); return; }
        const ok = X.canDeliver(g, o);
        const rows = o.items.map(([k, id, q]) => { const have = X.stockOf(g, k, id); return h('div', { class: 'dl-item' + (have >= q ? ' ok' : '') }, h('span', { class: 'dl-ic', html: itemIcon(k, id, 44) }), h('div', {}, h('b', { text: X.itemName(k, id) }), h('small', { text: `需要 ${q}　庫存 ${have}` })), h('span', { class: 'dl-chk', html: have >= q ? I.check : '' })); });
        grid.appendChild(h('div', { class: 'dl-card' + (ok ? ' ready' : '') },
          h('div', { class: 'dl-top', style: `--c:${o.color}` }, h('b', { text: o.who }), h('span', { text: ['近距離', '中距離', '遠距離'][o.far] }), h('small', { text: `剩 ${fmtTime(o.until - now())}` })),
          h('div', { class: 'dl-items' }, ...rows),
          h('div', { class: 'dl-rew' }, ...chips(o.reward)),
          h('div', { class: 'row center' }, h('button', { class: 'btn sm', onclick: () => { X.skipOrder(g, i); } }, '換一張'), h('button', { class: 'btn go', disabled: !ok, onclick: () => { const r = X.deliver(g, i); if (r) { sfx('collect'); toast(`外送出發！獲得 ${fmt(r.gold)} 金幣`, 'good'); ui.refresh(); } } }, '出貨'))));
      });
      body.appendChild(grid);
    },
  });
}

// ---------------- 賽季與每週任務 ----------------
export function openSeason(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Season', title: X.seasonName() + `（剩 ${fmtTime(X.seasonEnds())}）`, live: true, wide: true, tab: 'weekly',
    tabs: () => [['weekly', '每週任務'], ['pass', '賽季獎勵']],
    render: (body, m) => {
      const w = X.ensureWeekly(g), se = s.season;
      const tier = Math.floor(se.sp / X.SP_PER_TIER);
      body.appendChild(h('div', { class: 'ss-bar' }, h('span', { class: 'ss-lv', text: `第 ${Math.min(tier, X.SEASON_TIERS)} 階` }), h('div', { class: 'bar gold', style: 'flex:1;height:.9rem' }, h('i', { style: `width:${tier >= X.SEASON_TIERS ? 100 : (se.sp % X.SP_PER_TIER) / X.SP_PER_TIER * 100}%` })), h('b', { text: `${se.sp} 點` }), h('span', { class: 'muted small', text: '每日任務每項 +4 點' })));
      if (m.tab === 'weekly') {
        const list = h('div', { class: 'list' });
        w.list.forEach((it, i) => {
          const p = X.weeklyProgress(g, it), done = p >= it.target;
          list.appendChild(h('div', { class: 'lrow' + (it.claimed ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: `${it.name} ${fmt(it.target)}` }), h('div', { class: 'bar green', style: 'margin-top:.3rem;max-width:22rem' }, h('i', { style: `width:${p / it.target * 100}%` }))),
            h('span', { class: 'chip' }, h('span', { class: 'ic', html: BIG.season }), '+' + it.sp),
            it.claimed ? h('span', { class: 'muted', text: '已領取' }) : h('button', { class: 'btn go sm', disabled: !done, onclick: () => { if (X.claimWeekly(g, i)) { sfx('collect'); ui.refresh(); } } }, `${fmt(p)}/${fmt(it.target)}`)));
        });
        body.appendChild(h('p', { class: 'muted small', text: '每週一早上 6 點更新。' }));
        body.appendChild(list);
      } else {
        const track = h('div', { class: 'ss-track' });
        for (let t = 1; t <= X.SEASON_TIERS; t++) {
          const r = X.seasonReward(t), got = se.claimed.includes(t), can = se.sp >= t * X.SP_PER_TIER;
          track.appendChild(h('div', { class: 'ss-tier' + (got ? ' got' : can ? ' can' : '') + (t % 10 === 0 ? ' big' : '') },
            h('span', { class: 'ss-n', text: t }), h('div', { class: 'ss-rew' }, ...chips(r)),
            got ? h('span', { class: 'muted small', text: '已領' }) : h('button', { class: 'btn sm ' + (can ? 'go' : ''), disabled: !can, onclick: () => { const x = X.claimSeason(g, t); if (x) { sfx('level'); ui.refresh(); } } }, can ? '領取' : `${t * X.SP_PER_TIER}`)));
        }
        body.appendChild(track);
        body.appendChild(h('p', { class: 'muted small', text: '賽季每個月更換主題，點數在新賽季開始時歸零。' }));
      }
    },
  });
}

// ---------------- 店鋪評鑑 ----------------
export function openRating(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Rating', title: '咖啡館評鑑', live: true,
    render: body => {
      const n = s.rating.claimed;
      body.appendChild(h('div', { class: 'rt-stars', html: [0, 1, 2, 3, 4].map(i => i < n ? I.star : I.starOff).join('') }));
      body.appendChild(h('p', { class: 'lead center', text: `每多一顆評鑑星，所有商品售價永久 +${Math.round(X.RATING_BONUS * 100)}%（目前 +${Math.round(n * X.RATING_BONUS * 100)}%）` }));
      if (n >= X.RATING.length) { body.appendChild(h('p', { class: 'lead center', text: '已經是五星咖啡館了！' })); return; }
      const need = X.RATING[n], st = X.ratingStats(g);
      const list = h('div', { class: 'list' });
      for (const [k, label] of Object.entries(X.RATING_LABEL)) {
        const ok = st[k] >= need[k];
        list.appendChild(h('div', { class: 'lrow' + (ok ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: label }), h('div', { class: 'bar green', style: 'margin-top:.3rem' }, h('i', { style: `width:${Math.min(100, st[k] / Math.max(1, need[k]) * 100)}%` }))), h('b', { text: `${fmt(st[k])} / ${fmt(need[k])}` })));
      }
      body.appendChild(h('h3', { text: `挑戰第 ${n + 1} 顆星` }));
      body.appendChild(list);
      body.appendChild(h('div', { class: 'row center', style: 'margin-top:.8rem' }, h('b', { text: '獎勵：' }), ...chips(need.reward),
        h('button', { class: 'btn hot lg', disabled: !X.ratingReady(g), onclick: () => { const r = X.claimRating(g); if (r) { sfx('level'); toast(`評鑑升到 ${s.rating.claimed} 星！`, 'good'); ui.refresh(); } } }, '接受評鑑')));
    },
  });
}

// ---------------- 愛心食物銀行 ----------------
export function openBank(ui) {
  const g = ui.g, s = g.s;
  modal({
    ribbon: 'Food Bank', title: '愛心食物銀行', live: true, wide: true, tab: 'donate',
    tabs: () => [['donate', '捐贈'], ['shop', '愛心兌換']],
    render: (body, m) => {
      const b = X.bankDay(g), lv = X.bankLevel(g);
      body.appendChild(h('div', { class: 'ss-bar' }, h('span', { class: 'ss-lv', text: `愛心 Lv ${lv}` }), h('span', { class: 'muted small', text: `來客 +${(lv * 1.5).toFixed(1)}%` }), h('b', { style: 'margin-left:auto', text: `愛心點數 ${fmt(s.bank.love)}` })));
      if (m.tab === 'donate') {
        body.appendChild(h('div', { class: 'lrow' + (b.dayBonus ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: `今日捐贈 ${b.today} / ${X.BANK_DAILY} 份` }), h('div', { class: 'bar green', style: 'margin-top:.3rem;max-width:22rem' }, h('i', { style: `width:${Math.min(100, b.today / X.BANK_DAILY * 100)}%` }))),
          ...rewardChips({ coupon: 1, gold: 1000 + s.level * 150 }), b.dayBonus ? h('span', { class: 'muted', text: '已領取' }) : h('button', { class: 'btn hot sm', disabled: b.today < X.BANK_DAILY, onclick: () => { if (X.claimBankDay(g)) { sfx('level'); ui.refresh(); } } }, '領取')));
        body.appendChild(h('p', { class: 'muted small', text: '把甜點櫃和出餐檯多出來的餐點捐給社區，換愛心點數。愛心等級越高，客人越喜歡你的店。' }));
        const grid = h('div', { class: 'cards sm' });
        const stock = [...Object.entries(s.showcase).filter(([, n]) => n > 0).map(([id, n]) => ['side', id, n]), ...D.MEAL_ORDER.map(id => ['meal', id, X.stockOf(g, 'meal', id)]).filter(x => x[2] > 0)];
        if (!stock.length) grid.appendChild(h('p', { class: 'muted center', style: 'grid-column:1/-1', text: '目前沒有庫存的甜點或料理。' }));
        for (const [k, id, n] of stock) {
          grid.appendChild(h('div', { class: 'tcard' }, h('b', { text: X.itemName(k, id) }), h('div', { class: 'art', html: itemIcon(k, id, 64) }), h('div', { class: 'meta' }, h('span', { text: `庫存 ${n}` })),
            h('div', { class: 'row center' }, h('button', { class: 'btn sm', onclick: () => { const l = X.donate(g, k, id, 5); if (l) { sfx('collect'); toast(`捐出 5 份，愛心 +${l}`, 'good'); ui.refresh(); } } }, '捐 5'), h('button', { class: 'btn go sm', onclick: () => { const l = X.donate(g, k, id, n); if (l) { sfx('collect'); toast(`捐出 ${n} 份，愛心 +${l}`, 'good'); ui.refresh(); } } }, '全部'))));
        }
        body.appendChild(grid);
      } else {
        const list = h('div', { class: 'list' });
        for (const it of X.BANK_SHOP) {
          const sold = it.once && s.bank.bought[it.id];
          list.appendChild(h('div', { class: 'lrow' + (sold ? ' done' : '') }, h('div', { class: 'lmain' }, h('b', { text: it.name }), it.furniture ? h('span', { class: 'muted', text: '兌換後放在裝潢的收納倉庫' }) : null),
            sold ? h('span', { class: 'muted', text: '已兌換' }) : h('button', { class: 'btn go sm', disabled: s.bank.love < it.cost, onclick: () => { if (X.buyBank(g, it)) { sfx('buy'); toast(`兌換了${it.name}`, 'good'); ui.refresh(); } } }, `愛心 ${it.cost}`)));
        }
        body.appendChild(list);
      }
    },
  });
}

// ---------------- 幸運轉盤 ----------------
export function openLottery(ui) {
  const g = ui.g, s = g.s;
  let spinning = false, angle = 0, last = null;
  const N = X.WHEEL.length, COLORS = ['#f6d2cc', '#fbe9b8', '#d9ecd0', '#d4e6f0', '#f6d2cc', '#fbe9b8', '#d9ecd0', '#e8dcf2'];
  const wheelSVG = () => {
    let out = `<svg viewBox="-110 -110 220 220" class="lt-svg">`;
    X.WHEEL.forEach((w, i) => {
      const a0 = (i / N - 0.25) * Math.PI * 2 - Math.PI / N, a1 = a0 + Math.PI * 2 / N, R = 100;
      out += `<path d="M0,0 L${R * Math.cos(a0)},${R * Math.sin(a0)} A${R},${R} 0 0 1 ${R * Math.cos(a1)},${R * Math.sin(a1)} Z" fill="${COLORS[i]}" stroke="#a77b4f" stroke-width="1.5"/>`;
      const am = (a0 + a1) / 2; const deg = am * 180 / Math.PI + 90;
      out += `<text transform="translate(${62 * Math.cos(am)},${62 * Math.sin(am)}) rotate(${deg})" text-anchor="middle" font-size="11.5" font-weight="900" fill="#5a3a2a">${w.label}</text>`;
    });
    out += `<circle r="100" fill="none" stroke="#6b4a3a" stroke-width="5"/>`;
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; out += `<circle cx="${104 * Math.cos(a)}" cy="${104 * Math.sin(a)}" r="3" fill="#f2c45e" stroke="#8a6a1e"/>`; }
    return out + `</svg>`;
  };
  const m = modal({
    ribbon: 'Lucky Wheel', title: '幸運轉盤', live: false,
    render: body => {
      const L = X.lotteryDay(g);
      const wheel = h('div', { class: 'lt-wheel', html: wheelSVG() });
      wheel.style.transform = `rotate(${angle}deg)`;
      const res = h('div', { class: 'lt-res' });
      if (last) res.append(...[h('b', { text: `抽中「${X.WHEEL[last.i].label}」！` }), ...chips(last.r), last.r.energy ? h('span', { class: 'chip', text: '全體員工元氣全滿' }) : null].filter(Boolean));
      const go = pay => {
        if (spinning) return;
        const r = X.spin(g, pay);
        if (!r) { toast(pay === 'coupon' ? '咖啡券不夠' : '沒有可以用的次數', 'warn'); return; }
        spinning = true; sfx('click');
        // 指針在正上方；第 i 格中心在角度 i/N*360
        const target = 360 * 5 + (360 - r.i / N * 360);
        angle = Math.ceil(angle / 360) * 360 + target - 360 * Math.ceil(0);
        wheel.style.transition = 'transform 3.2s cubic-bezier(.15,.85,.25,1)';
        wheel.style.transform = `rotate(${angle}deg)`;
        setTimeout(() => {
          spinning = false; sfx('level'); last = r;
          angle %= 360;
          ui.refresh(); m.rerender();
        }, 3300);
      };
      body.append(h('div', { class: 'lt-wrap' }, h('div', { class: 'lt-pin' }), wheel), res,
        h('div', { class: 'row center', style: 'margin-top:.6rem' },
          h('button', { class: 'btn go', disabled: !L.free, onclick: () => go('free') }, L.free ? '今日免費一次' : '明天再來免費'),
          h('button', { class: 'btn blue', disabled: s.lottery.tickets <= 0, onclick: () => go('ticket') }, `用轉盤券（${s.lottery.tickets}）`),
          h('button', { class: 'btn hot', disabled: s.coupons < X.SPIN_COUPON, onclick: () => go('coupon') }, ic('coupon'), `${X.SPIN_COUPON} 轉一次`)),
        h('p', { class: 'muted small center', text: '轉盤券可以從外送、賽季獎勵、愛心兌換取得。' }));
    },
  });
}

// ---------------- 2 樓甜點區 ----------------
export function openFloor2(ui) {
  const g = ui.g, s = g.s;
  if (s.floor2.open) { ui.goUpstairs(); return; }
  modal({
    ribbon: '2F Lounge', title: '2 樓甜點區', live: true,
    render: body => {
      body.append(h('div', { class: 'f2-hero', html: BIG.upstairs }),
        h('p', { class: 'lead center', text: '把 2 樓整理成甜點區！可以多擺 4 台甜點機器（不佔一樓吧台的上限），樓上的沙發座位讓來客 +20%。' }),
        h('div', { class: 'row center' }, s.level < X.LV.floor2 ? h('span', { class: 'lockpill', html: I.lock + `<span>Lv ${X.LV.floor2} 開放</span>` }) :
          h('button', { class: 'btn hot lg', disabled: s.gold < X.FLOOR2_COST, onclick: () => { if (X.openFloor2(g)) { sfx('level'); toast('2 樓甜點區開幕了！', 'good'); ui.closeTop(); ui.refresh(); ui.goUpstairs(); } } }, '整修 2 樓 ', ic('gold'), fmt(X.FLOOR2_COST))));
    },
  });
}
