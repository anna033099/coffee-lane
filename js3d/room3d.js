// 3D 引擎：渲染器、燈光、相機、店面外殼與店外環境、效能控制
import * as THREE from 'three';
import { RoomEnvironment } from '../lib/addons/RoomEnvironment.js';
import { mergeGeometries } from '../lib/addons/BufferGeometryUtils.js';
import * as T from './tex.js';
import * as MD from './models.js';
const { M, rbox, colorMat } = MD;

export const WALL_H = 3.6;
export const FLOOR_THEMES = {
  herring_walnut: () => T.herringbone('walnut'), herring_oak: () => T.herringbone('oak'), planks_honey: () => T.planks('honey'),
  checker: () => T.checker(), terrazzo: () => T.terrazzo(), marble: () => T.marble('white'),
};
export const WALL_THEMES = {
  sage: { upper: () => T.plaster('#ece3d3'), wains: '#5f7d6b', rail: 'brass' },
  forest: { upper: () => T.plaster('#efe7da'), wains: '#294236', rail: 'brass' },
  navy: { upper: () => T.stripes('#ebe3d4', '#dfd3bf'), wains: '#26344d', rail: 'brass' },
  brick: { upper: () => T.brick(), wains: '#3a2a20', rail: 'iron' },
  blush: { upper: () => T.plaster('#f1e1da'), wains: '#b9786f', rail: 'brass' },
  walnut: { upper: () => T.plaster('#e9dfcd'), wains: '#3b2618', rail: 'brass', woodPanel: true },
};
export const FACING_ROT = { pz: 0, px: Math.PI / 2, nz: Math.PI, nx: -Math.PI / 2 };
// 相機方向（等角）
export const VIEW_DIR = new THREE.Vector3(1, 0.86, 1).normalize();
const ELEV_COS = Math.cos(Math.asin(VIEW_DIR.y));

// 把一個物件裡的網格依材質合併，減少繪製次數（手機效能關鍵）
export function bake(obj) {
  obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  const groups = new Map();
  const keep = [];
  obj.traverse(n => {
    if (!n.isMesh) return;
    if (n.isInstancedMesh || n.material.transparent || n.userData.noBake) { keep.push(n); return; }
    const g = n.geometry.index ? n.geometry.toNonIndexed() : n.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld));
    const arr = groups.get(n.material) || []; arr.push(g); groups.set(n.material, arr);
  });
  const out = new THREE.Group();
  for (const [m, gs] of groups) {
    const merged = mergeGeometries(gs, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, m); mesh.castShadow = true; mesh.receiveShadow = true; out.add(mesh);
  }
  for (const n of keep) {
    const c = n.clone(); n.updateMatrixWorld(true);
    c.matrix.multiplyMatrices(inv, n.matrixWorld); c.matrix.decompose(c.position, c.quaternion, c.scale);
    out.add(c);
  }
  out.userData = { ...obj.userData };
  // 光源資訊保留（吊燈、立燈）
  const lights = [];
  obj.traverse(n => { if (n.userData && n.userData.light) { const p = new THREE.Vector3(...n.userData.light.pos).applyMatrix4(n.matrixWorld).applyMatrix4(inv); lights.push({ ...n.userData.light, pos: [p.x, p.y, p.z] }); } });
  if (lights.length) out.userData.lights = lights;
  return out;
}
const bakeCache = new Map();
// 同一種家具只建一次，之後複製（共用幾何）
export function bakedModel(key, make) {
  if (!bakeCache.has(key)) bakeCache.set(key, bake(make()));
  const src = bakeCache.get(key);
  const c = src.clone(true);
  c.userData = { ...src.userData };
  return c;
}

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 820;
    this.mobile = mobile;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
    this.maxDpr = Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2);
    this.dpr = Math.min(this.maxDpr, mobile ? 1.5 : 2);
    r.setPixelRatio(this.dpr);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#cbbfa9');
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.42;
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
    this.zoom = 1; this.pan = new THREE.Vector2(0, 0);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.outdoor = new THREE.Group(); this.root.add(this.outdoor);
    this.shell = new THREE.Group(); this.root.add(this.shell);
    this.items = new THREE.Group(); this.root.add(this.items);
    this.actors = new THREE.Group(); this.root.add(this.actors);
    this.fx = new THREE.Group(); this.root.add(this.fx);
    this.lights = [];
    this.setupLights();
    this.frameTimes = [];
    this.lastQualityCheck = 0;
  }
  setupLights() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight('#fff1dc', '#5a4632', 0.5); s.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#ffe0b0', 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048);
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
    s.add(sun); s.add(sun.target);
    this.fill = new THREE.DirectionalLight('#d6e4ff', 0.3); s.add(this.fill);
  }
  shadowsDirty() { this.renderer.shadowMap.needsUpdate = true; }

  // ---------- 店面外殼 ----------
  buildShell(W, D, floorTheme, wallTheme) {
    this.W = W; this.D = D;
    const g = this.shell;
    disposeTree(g); g.clear();
    const ft = FLOOR_THEMES[floorTheme]().clone(); ft.needsUpdate = true; ft.repeat.set(W, D);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ft, roughness: floorTheme === 'marble' ? 0.18 : 0.45 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0.012, D / 2); floor.receiveShadow = true; floor.userData.floor = true;
    g.add(floor); this.floor = floor;
    // 地板的厚度邊
    const wt = WALL_THEMES[wallTheme];
    const H = WALL_H, wh = 1.15;
    const upTex = wt.upper();
    const wm = wt.woodPanel ? M.walnut : colorMat(wt.wains, 0.55);
    const mkWall = (len) => {
      const wg = new THREE.Group();
      const t = upTex.clone(); t.needsUpdate = true; t.repeat.set(len / 1.2, (H - wh) / 1.2);
      const up = new THREE.Mesh(new THREE.BoxGeometry(len, H - wh, 0.12), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
      up.position.set(len / 2, wh + (H - wh) / 2, -0.06); up.userData.noBake = true; wg.add(up);
      wg.add(rbox(len, wh, 0.14, 0.005, wm, len / 2, wh / 2, -0.05));
      const n = Math.max(1, Math.round(len / 0.8)), pw = len / n;
      for (let i = 0; i < n; i++) wg.add(rbox(pw - 0.16, wh - 0.38, 0.03, 0.01, wm, i * pw + pw / 2, wh / 2 - 0.02, 0.035));
      wg.add(rbox(len, 0.05, 0.06, 0.01, wt.rail === 'brass' ? M.brass : M.iron, len / 2, wh + 0.01, 0.03));
      wg.add(rbox(len, 0.12, 0.05, 0.01, wm, len / 2, 0.06, 0.04));
      wg.add(rbox(len, 0.14, 0.1, 0.02, M.cream, len / 2, H - 0.07, 0));
      return wg;
    };
    const wx = mkWall(W); g.add(bakeKeep(wx));
    const wz = bakeKeep(mkWall(D)); wz.rotation.y = Math.PI / 2; wz.position.set(0, 0, D); g.add(wz);
    const trims = new THREE.Group();
    trims.add(rbox(0.16, H, 0.16, 0.01, M.cream, -0.06, H / 2, -0.06));
    trims.add(rbox(W + 0.12, 0.06, 0.18, 0.01, M.walnutDark, W / 2 - 0.06, H + 0.03, -0.07));
    trims.add(rbox(0.18, 0.06, D + 0.12, 0.01, M.walnutDark, -0.07, H + 0.03, D / 2 - 0.06));
    // 店的前緣：低矮的木框
    trims.add(rbox(W, 0.08, 0.08, 0.01, M.walnutDark, W / 2, 0.04, D + 0.02));
    trims.add(rbox(0.08, 0.08, D, 0.01, M.walnutDark, W + 0.02, 0.04, D / 2));
    g.add(bake(trims));
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    floor.castShadow = false;
    this.buildOutdoor(W, D);
    // 燈光覆蓋範圍
    const cx = W / 2, cz = D / 2, ext = Math.max(W, D) + 4;
    this.sun.position.set(cx + ext * 0.7, ext * 1.5, cz + ext * 1.1);
    this.sun.target.position.set(cx, 0, cz);
    const sc = this.sun.shadow.camera;
    sc.left = -ext * 0.85; sc.right = ext * 0.85; sc.top = ext * 0.85; sc.bottom = -ext * 0.85; sc.near = 0.5; sc.far = ext * 5;
    sc.updateProjectionMatrix();
    this.fill.position.set(cx - ext, ext, cz + ext * 1.5);
    this.fitCamera();
    this.shadowsDirty();
  }
  // 店外：石板廣場、花圃、樹、路燈（樹木用合併幾何，只有幾個繪製呼叫）
  buildOutdoor(W, D) {
    const g = this.outdoor;
    disposeTree(g); g.clear();
    const S = 80;
    const ct = T.cobble().clone(); ct.needsUpdate = true; ct.repeat.set(S / 1.6, S / 1.6);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, -0.02, D / 2); ground.receiveShadow = true; g.add(ground);
    // 店後方的草地與樹（在牆外，樹梢會從牆上露出來）
    const gt = T.grass().clone(); gt.needsUpdate = true; gt.repeat.set(12, 4);
    const lawn1 = new THREE.Mesh(new THREE.PlaneGeometry(W + 12, 5), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }));
    lawn1.rotation.x = -Math.PI / 2; lawn1.position.set(W / 2 - 2, -0.01, -2.7); lawn1.receiveShadow = true; g.add(lawn1);
    const gt2 = gt.clone(); gt2.needsUpdate = true; gt2.repeat.set(4, 12);
    const lawn2 = new THREE.Mesh(new THREE.PlaneGeometry(5, D + 5), new THREE.MeshStandardMaterial({ map: gt2, roughness: 1 }));
    lawn2.rotation.x = -Math.PI / 2; lawn2.position.set(-2.7, -0.01, D / 2 - 2.5); lawn2.receiveShadow = true; g.add(lawn2);
    const deco = new THREE.Group();
    let k = 1;
    for (let x = -3; x < W + 3; x += 1.7) { const t = MD.tree(k++, 3.4 + (k % 3) * 0.5); t.position.set(x, 0, -1.6 - (k % 2) * 1.2); deco.add(t); }
    for (let z = -1; z < D - 0.5; z += 1.7) { const t = MD.tree(k++, 3.4 + (k % 3) * 0.5); t.position.set(-1.6 - (k % 2) * 1.2, 0, z); deco.add(t); }
    for (let x = W + 1.5; x < W + 4; x += 1.6) { const t = MD.tree(k++, 3.2); t.position.set(x, 0, -2.2); deco.add(t); }
    // 店前花圃（入口處留空）
    for (let x = 1; x < W; x++) { const h = MD.hedge(1); h.position.set(x + 0.5, 0, D + 0.32); deco.add(h); }
    for (let z = 0; z < D; z++) { const h = MD.hedge(1); h.rotation.y = Math.PI / 2; h.position.set(W + 0.32, 0, z + 0.5); deco.add(h); }
    // 路燈、長椅、盆花、立牌、陽傘桌
    const add = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; deco.add(o); };
    add(MD.lampPost(), -0.9, D + 1.6); add(MD.lampPost(), W + 1.8, D * 0.35); add(MD.lampPost(), W * 0.45, D + 3.4);
    add(MD.aFrameSign(), 1.0, D + 1.3, 0.6);
    add(MD.flowerPot(), -0.5, D - 0.5); add(MD.flowerPot(), W + 1.6, D + 4.5);
    add(MD.bench(), W + 3.3, D / 2, -Math.PI / 2);
    add(MD.umbrellaTable(), W + 3.2, D + 3.3);
    add(MD.bench(), W / 2, D + 4.6, Math.PI);
    const baked = bake(deco);
    g.add(baked);
    // 路燈的燈光（不投射陰影，很便宜）
    this.clearLights('out');
    for (const p of [[-0.9, D + 1.6], [W + 1.8, D * 0.35]]) this.addPointLight(new THREE.Vector3(p[0], 2.8, p[1]), 0.6, 5, '#ffd9a0', 'out');
  }

  // ---------- 相機 ----------
  fitCamera(viewW, viewH) {
    if (viewW) { this.vw = viewW; this.vh = viewH; }
    const W = this.W || 7, D = this.D || 7;
    const center = new THREE.Vector3(W / 2, 0.9, D / 2);
    const pts = [[0, 0, 0], [W + 0.6, 0, 0], [0, 0, D + 0.6], [W + 0.6, 0, D + 0.6], [0, WALL_H, 0], [W, WALL_H, 0], [0, WALL_H, D]].map(p => new THREE.Vector3(...p));
    const cam = this.camera;
    cam.position.copy(center).addScaledVector(VIEW_DIR, 80);
    cam.up.set(0, 1, 0); cam.lookAt(center); cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const p of pts) { const q = p.clone().applyMatrix4(inv); minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); }
    const aspect = (this.vw || 16) / (this.vh || 9);
    const m = this.margins || { l: 0.0, r: 0.0, t: 0.07, b: 0.06 };
    const needW = (maxX - minX) / (1 - m.l - m.r), needH = (maxY - minY) / (1 - m.t - m.b);
    let halfH = Math.max(needH, needW / aspect) / 2 / this.zoom;
    const halfW = halfH * aspect;
    const offX = ((m.l - m.r) / 2) * halfW * 2, offY = ((m.b - m.t) / 2) * halfH * 2;
    // 限制平移範圍
    const lim = Math.max(0, this.zoom - 1) * 0.55 + 0.05;
    this.pan.x = Math.max(-lim, Math.min(lim, this.pan.x)); this.pan.y = Math.max(-lim, Math.min(lim, this.pan.y));
    const cx = (minX + maxX) / 2 - offX + this.pan.x * halfW * 2, cy = (minY + maxY) / 2 - offY + this.pan.y * halfH * 2;
    cam.left = cx - halfW; cam.right = cx + halfW; cam.top = cy + halfH; cam.bottom = cy - halfH;
    cam.updateProjectionMatrix();
    this.halfW = halfW; this.halfH = halfH;
  }
  setZoom(z) { this.zoom = Math.max(1, Math.min(2.6, z)); if (this.zoom <= 1.001) this.pan.set(0, 0); this.fitCamera(); }
  panBy(dxPx, dyPx) {
    const rect = this.canvas.getBoundingClientRect();
    this.pan.x -= dxPx / rect.width; this.pan.y += dyPx / rect.height;
    this.fitCamera();
  }
  resize(w, h) { this.renderer.setSize(w, h, false); this.fitCamera(w, h); }

  // ---------- 光源 ----------
  clearLights(tag = 'in') { for (const l of this.lights.filter(q => q.userData.tag === tag)) this.scene.remove(l); this.lights = this.lights.filter(q => q.userData.tag !== tag); }
  addPointLight(pos, intensity, dist, color = '#ffc98a', tag = 'in') {
    const l = new THREE.PointLight(color, intensity, dist, 1.6);
    l.position.copy(pos); l.userData.tag = tag; this.scene.add(l); this.lights.push(l); return l;
  }

  // ---------- 座標換算 ----------
  project(x, y, z) {
    const v = new THREE.Vector3(x, z, y).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (v.x + 1) / 2 * r.width, y: (1 - v.y) / 2 * r.height };
  }
  ray(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const rc = new THREE.Raycaster(); rc.setFromCamera(v, this.camera); return rc;
  }
  floorAt(clientX, clientY) {
    const rc = this.ray(clientX, clientY);
    const p = new THREE.Vector3();
    if (!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null;
    return { x: p.x, y: p.z };
  }

  // ---------- 繪製與效能 ----------
  render() {
    const t0 = performance.now();
    this.renderer.render(this.scene, this.camera);
    const dt = performance.now() - t0;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
  }
  // 依實際幀率自動調整解析度
  adapt(fps) {
    const now = performance.now();
    if (now - this.lastQualityCheck < 3000) return;
    this.lastQualityCheck = now;
    if (this.quality === 'high') { this.setDpr(this.maxDpr); return; }
    if (this.quality === 'low') { this.setDpr(1); return; }
    if (fps < 40 && this.dpr > 1) this.setDpr(Math.max(1, this.dpr - 0.25));
    else if (fps > 57 && this.dpr < Math.min(this.maxDpr, this.mobile ? 1.75 : 2)) this.setDpr(this.dpr + 0.25);
  }
  setDpr(d) {
    if (Math.abs(d - this.dpr) < 0.01) return;
    this.dpr = d; this.renderer.setPixelRatio(d);
    this.renderer.setSize(this.vw, this.vh, false);
  }
}
function bakeKeep(o) { return bake(o); }
export function disposeTree(o) {
  o.traverse(n => {
    if (n.isMesh && n.geometry && !n.userData.sharedGeo) n.geometry.dispose();
  });
}
export { ELEV_COS };
