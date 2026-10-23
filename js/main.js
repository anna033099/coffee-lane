// 進入點：載入存檔、離線結算、建立場景與介面、主迴圈、自動存檔
import { load, save, defaultState, now } from './state.js';
import { Game } from './sim.js';
import { Auto } from './auto.js';
import { World } from './scene.js';
import { UI } from './ui/index.js';
import { toast } from './ui/core.js';
import * as P from './ui/panels.js';
import { openCat } from './ui/cat.js';
import { setSound, setMusic, sfx, unlockAudio } from './audio.js';
import { initThumbs } from '../js3d/thumbs.js';
import { loadOverrides } from '../js3d/sprites.js';
import { CatAI, catTick } from './cat.js';
import { claimAll } from './quests.js';
import * as D from './data.js';

const bootBar = document.querySelector('#boot .bar i');
const setBoot = p => { if (bootBar) bootBar.style.width = (p * 100) + '%'; };

// 介面以 1280×720 設計：依視窗縮放 rem
function fitRem() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const k = Math.min(vw / 1280, vh / 720);
  document.documentElement.style.fontSize = Math.max(8, 16 * k) + 'px';
}
window.addEventListener('resize', fitRem); fitRem();

async function boot() {
  setBoot(0.1);
  await loadOverrides();
  const loaded = load();
  const isNew = !loaded;
  const state = loaded || defaultState();
  setSound(state.settings.sound); setMusic(false);
  setBoot(0.3);

  let ui = null, world = null, pendingLv = null;
  const hooks = {
    toast: (m, t) => toast(m, t),
    floater: (pos, text, kind) => world && world.floater(pos, text, kind),
    sfx: n => sfx(n),
    levelUp: (lv, bonus) => {
      if (!pendingLv) { pendingLv = { from: lv, to: lv, bonus: 0 }; setTimeout(() => { const p = pendingLv; pendingLv = null; if (ui) P.showLevelUp(ui, p.from, p.to, p.bonus); }, 400); }
      pendingLv.to = lv; pendingLv.bonus += bonus;
    },
    event: (type, data) => { if (type === 'special') toast(`${D.REGULARS[data.regId].name}來了，有特別訂單！`, 'good'); },
  };
  const game = new Game(state, hooks);
  const auto = new Auto(game, { quests: () => { const r = claimAll(game); if (r.length && ui) ui.refresh(); }, onRecruit: () => {} });
  const catAI = new CatAI(game);

  // 離線結算（先暫停升級視窗，最後再一起顯示）
  game.dailyCheck();
  const offline = isNew ? null : game.offline(auto);
  setBoot(0.5);

  const canvas = document.getElementById('gl');
  world = new World(canvas, document.getElementById('overlay'), game, {
    onPick: (hit, ev) => { if (hit.type === 'cat') return openCat(ui); ui.onPick(hit, ev); },
    onCheer: id => { const st = game.s.staff.find(q => q.id === id); if (st) game.cheer(st); ui.refresh(); },
    onEditTap: (ev, hit) => ui.decor.tap(ev, hit),
    onEditMove: ev => ui.decor.move(ev),
  });
  world.catAI = catAI;
  world.engine.quality = state.settings.quality;
  initThumbs(world.engine);
  const resize = () => { world.engine.resize(window.innerWidth, window.innerHeight); };
  window.addEventListener('resize', resize); resize();
  world.sync();
  setBoot(0.8);

  ui = new UI(game, world, auto, document.getElementById('ui'));
  window.__game = game; window.__ui = ui; window.__world = world; window.__auto = auto;

  // 預熱：先畫一幀
  world.frame(); world.engine.render();
  setBoot(1);
  setTimeout(() => document.getElementById('boot').classList.add('out'), 200);
  setTimeout(() => document.getElementById('boot').remove(), 900);

  if (isNew) setTimeout(() => ui.storyIntro(), 700);
  else if (offline && offline.secs > 60) setTimeout(() => P.showOffline(ui, offline), 500);
  else setTimeout(() => ui.storyIntro(), 700);

  // 第一次觸碰畫面後開啟聲音
  const firstTouch = () => { unlockAudio(); setMusic(state.settings.music); window.removeEventListener('pointerdown', firstTouch); };
  window.addEventListener('pointerdown', firstTouch);

  // ---------- 主迴圈 ----------
  let last = performance.now(), acc = 0, autoAcc = 0, frames = 0, fpsT = 0, hiddenAt = 0;
  function loop(t) {
    const dt = Math.min(0.25, (t - last) / 1000);
    last = t;
    game.tick(dt);
    catAI.update(dt);
    if (game.s.cat) catTick(game, game.s.cat);
    autoAcc += dt;
    if (autoAcc > 1.5) { autoAcc = 0; auto.run(now(), false); }
    acc += dt;
    if (acc > 0.25) { acc = 0; ui.refresh(); }
    if (!window.__noRender) { world.frame(); world.engine.render(); }
    frames++; fpsT += dt;
    if (fpsT > 2) { world.engine.adapt(frames / fpsT); frames = 0; fpsT = 0; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // 切到背景：存檔；回來：補算離線
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = now(); game.s.lastTick = hiddenAt; save(game.s); }
    else if (hiddenAt) {
      const sum = game.offline(auto);
      last = performance.now();
      if (sum && sum.secs > 120) P.showOffline(ui, sum);
      ui.refresh(true);
    }
  });
  setInterval(() => { game.s.lastTick = now(); save(game.s); }, 5000);
  window.addEventListener('pagehide', () => { game.s.lastTick = now(); save(game.s); });
}
boot().catch(e => {
  console.error(e);
  const b = document.getElementById('boot');
  if (b) b.querySelector('small').textContent = '載入失敗：' + e.message;
});
