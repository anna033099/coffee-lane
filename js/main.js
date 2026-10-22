// 進入點：建立遊戲、畫面、介面，跑主迴圈與自動存檔
import { load, save, defaultState } from './state.js';
import { Game } from './sim.js';
import { Room } from './room.js';
import { UI } from './ui.js';
import { sfx, setSound } from './audio.js';

const stage = document.getElementById('stage');
const svg = document.getElementById('room');

// 1280×720 的舞台等比例縮放塞進視窗
function fit() {
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const k = Math.min(vw / 1280, vh / 720);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
window.addEventListener('resize', fit);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
fit();

const loaded = load();
const isNew = !loaded;
const state = loaded || defaultState();
setSound(state.settings.sound);

let ui, room, pendingLv = null;
const hooks = {
  toast: (m, t) => ui && ui.toast(m, t),
  floater: (p, text, color, coin) => room && room.floater(p, text, color, coin),
  sfx: n => sfx(n),
  levelUp: (lv, bonus) => {
    // 一次升好幾級時合併成一個視窗
    if (!pendingLv) { pendingLv = { from: lv, to: lv, bonus: 0 }; setTimeout(() => { const p = pendingLv; pendingLv = null; ui && ui.showLevelUp(p.from, p.to, p.bonus); }, 300); }
    pendingLv.to = lv; pendingLv.bonus += bonus;
  },
};
const game = new Game(state, hooks);
room = new Room(svg, game, {
  onMachine: slot => ui.openMachine(slot),
  onEmptySlot: () => ui.openBuy('machine'),
  onStaff: id => game.cheer(id),
  onCustomer: id => ui.onCustomer(id),
  onTile: (x, y) => ui.onTile(x, y),
  onWallSeg: (side, i) => ui.onWallSeg(side, i),
  onFurniture: (id, e) => ui.onFurniture(id, e),
  onWallItem: id => ui.onWallItem(id),
  onEmpty: () => ui.onEditEmpty(),
});
ui = new UI(game, room, stage);
ui.build();
room.renderStatic();

if (isNew) ui.showWelcome();
else {
  const b = game.dailyBonus();
  if (b) setTimeout(() => ui.toast(`每日登入獎勵 +${b} 金幣`, 'good'), 600);
}
if (isNew) game.dailyBonus();

// 主迴圈
let last = performance.now(), acc = 0;
function loop(t) {
  const dt = Math.min(0.25, (t - last) / 1000);
  last = t;
  game.tick(dt);
  room.frame();
  acc += dt;
  if (acc > 0.25) { acc = 0; ui.refresh(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// 自動存檔
const doSave = () => save(game.s);
setInterval(doSave, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) doSave(); });
window.addEventListener('pagehide', doSave);

// 方便除錯
window.__game = game;
window.__ui = ui;
