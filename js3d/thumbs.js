// 用主渲染器把 3D 家具拍成小圖（型錄、升級畫面用），拍一次就快取
import * as THREE from 'three';
import * as MD from './models.js';
import { bakedModel } from './room3d.js';

const cache = new Map();
const queue = [];
let engine = null, busy = false;
let scene, cam, rt, canvas, ctx2d;
const SIZE = 192;

export function initThumbs(e) {
  engine = e;
  scene = new THREE.Scene();
  scene.environment = e.scene.environment;
  scene.environmentIntensity = 0.5;
  scene.add(new THREE.HemisphereLight('#fff4e0', '#8a6a50', 1.1));
  const d = new THREE.DirectionalLight('#ffe8c8', 2.2); d.position.set(3, 6, 4); scene.add(d);
  cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  rt = new THREE.WebGLRenderTarget(SIZE, SIZE, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  canvas = document.createElement('canvas'); canvas.width = SIZE; canvas.height = SIZE;
  ctx2d = canvas.getContext('2d');
}
// kind：floor 物件、wall 牆面物件、machine 吧台機器
export function thumb(key, make, kind = 'floor') {
  if (cache.has(key)) return cache.get(key);
  const p = new Promise(res => queue.push({ key, make, kind, res }));
  cache.set(key, p);
  pump();
  return p;
}
const idle = fn => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 120 }) : setTimeout(fn, 16));
function pump() {
  if (busy || !queue.length || !engine) return;
  busy = true;
  idle(() => {
    const job = queue.shift();
    try { job.res(shoot(job)); } catch (e) { console.warn('縮圖失敗', job.key, e); job.res(''); }
    busy = false;
    pump();
  });
}
function shoot({ key, make, kind }) {
  const obj = bakedModel('thumb_' + key, make);
  scene.add(obj);
  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const dir = kind === 'wall' ? new THREE.Vector3(0.35, 0.25, 1).normalize() : new THREE.Vector3(1, 0.86, 1).normalize();
  cam.position.copy(c).addScaledVector(dir, 20); cam.lookAt(c); cam.updateMatrixWorld();
  // 依投影大小決定視野
  const pts = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse));
  let ext = 0.2;
  for (const p of pts) ext = Math.max(ext, Math.abs(p.x), Math.abs(p.y));
  ext *= 1.08;
  cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext; cam.updateProjectionMatrix();
  void size;
  const r = engine.renderer;
  const prevT = r.getRenderTarget(), prevTone = r.toneMapping, prevClear = r.getClearColor(new THREE.Color()), prevA = r.getClearAlpha();
  const shadowsOn = r.shadowMap.enabled;
  r.shadowMap.enabled = false;
  r.setRenderTarget(rt);
  r.setClearColor(0x000000, 0);
  r.clear();
  r.render(scene, cam);
  const buf = new Uint8Array(SIZE * SIZE * 4);
  r.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, buf);
  r.setRenderTarget(prevT); r.setClearColor(prevClear, prevA); r.toneMapping = prevTone; r.shadowMap.enabled = shadowsOn;
  scene.remove(obj);
  // 上下翻轉
  const img = ctx2d.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) img.data.set(buf.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4), y * SIZE * 4);
  ctx2d.clearRect(0, 0, SIZE, SIZE); ctx2d.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}
export function furnThumb(type) { return thumb('f_' + type, () => MD.build(type), type.startsWith('w_') ? 'wall' : 'floor'); }
export function machineThumb(type, make) { return thumb('m_' + type, make, 'floor'); }
