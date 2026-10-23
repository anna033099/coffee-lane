// 2D 人物貼圖：像紙板一樣直立在 3D 場景裡，永遠面向鏡頭
import * as THREE from 'three';
import { FRAMES, COLS, ROWS, FW, FH, sheetCanvas, lookKey, setArtOverrides, artFor } from '../js/chara.js';
import * as T from './tex.js';
import { ELEV_COS } from './room3d.js';

const HEIGHT = 1.62;               // 一格動作圖的世界高度
const WIDTH = HEIGHT * FW / FH;
const FOOT = 8 / FH;               // 腳底離圖片底部的比例
const texCache = new Map();        // lookKey -> Promise<Texture>
const planeGeo = new THREE.PlaneGeometry(WIDTH, HEIGHT / ELEV_COS);
planeGeo.translate(0, HEIGHT / ELEV_COS / 2 - FOOT * HEIGHT / ELEV_COS, 0);
const blobGeo = new THREE.CircleGeometry(0.28, 20); blobGeo.rotateX(-Math.PI / 2);
let blobMat = null;

// 外部美術（AI 生成或素材包）可以放在 assets/chars/<名稱>.png 覆蓋（4×3 格、每格 160×240）
let overrides = null;
export async function loadOverrides() {
  try {
    const r = await fetch('assets/chars/manifest.json', { cache: 'no-cache' });
    if (r.ok) overrides = await r.json();
  } catch (e) { overrides = null; }
  setArtOverrides(overrides);
}
function overrideFor(look) { return artFor(look); }

function getTexture(look) {
  const k = lookKey(look) + (look.art || '');
  if (texCache.has(k)) return texCache.get(k);
  const ov = overrideFor(look);
  const p = (ov ? new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ov; }) : sheetCanvas(look, 0.8)).then(src => {
    const t = new THREE.Texture(src);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.needsUpdate = true;
    return t;
  });
  texCache.set(k, p);
  return p;
}

export class CharSprite {
  constructor(look, parent) {
    this.group = new THREE.Group();
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, depthWrite: true, color: '#ffffff' });
    this.mesh = new THREE.Mesh(planeGeo, this.mat);
    this.mesh.rotation.y = Math.PI / 4;
    this.mesh.renderOrder = 2;
    this.group.add(this.mesh);
    if (!blobMat) blobMat = new THREE.MeshBasicMaterial({ map: T.blob(), transparent: true, depthWrite: false });
    this.blob = new THREE.Mesh(blobGeo, blobMat); this.blob.position.y = 0.02; this.blob.renderOrder = 1;
    this.group.add(this.blob);
    this.frame = -1; this.flip = false;
    this.mesh.visible = false;
    this.setLook(look);
    parent.add(this.group);
  }
  setLook(look) {
    const k = lookKey(look) + (look.art || '');
    if (k === this.lookK) return;
    this.lookK = k;
    getTexture(look).then(base => {
      if (this.lookK !== k) return;
      const t = base.clone(); t.source = base.source;
      t.repeat.set(1 / COLS, 1 / ROWS);
      this.tex = t; this.mat.map = t; this.mat.needsUpdate = true;
      this.mesh.visible = true;
      const f = this.frame; this.frame = -1; this.setFrame(f < 0 ? 'f_stand' : FRAMES[f], this.flip);
    });
  }
  setFrame(name, flip = false) {
    const i = FRAMES.indexOf(name);
    if (i === this.frame && flip === this.flip) return;
    this.frame = i; this.flip = flip;
    if (this.tex) { this.tex.offset.set((i % COLS) / COLS, 1 - (Math.floor(i / COLS) + 1) / ROWS); }
    this.mesh.scale.x = flip ? -1 : 1;
  }
  set(x, y, z = 0) { this.group.position.set(x, z, y); }
  setOpacity(a) { this.mat.opacity = a; this.mat.transparent = true; this.blob.material.opacity = 1; this.group.visible = a > 0.02; }
  setShadow(on) { this.blob.visible = on; }
  dispose() { this.group.removeFromParent(); this.mat.dispose(); if (this.tex) this.tex.dispose(); }
}
export { HEIGHT as CHAR_H };

// 店貓貼圖（4 格：坐、走1、走2、睡）
import { catSheetSVG, CAT_FRAMES } from '../js/cat.js';
const catTex = new Map();
const catGeo = new THREE.PlaneGeometry(0.62, 0.62 / ELEV_COS); catGeo.translate(0, 0.31 / ELEV_COS - 0.04, 0);
export class CatSprite {
  constructor(type, parent) {
    this.group = new THREE.Group();
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(catGeo, this.mat); this.mesh.rotation.y = Math.PI / 4; this.mesh.visible = false;
    this.group.add(this.mesh); parent.add(this.group);
    this.type = null; this.setType(type);
  }
  setType(type) {
    if (this.type === type) return; this.type = type;
    if (!catTex.has(type)) catTex.set(type, new Promise(res => { const img = new Image(); const url = URL.createObjectURL(new Blob([catSheetSVG(type)], { type: 'image/svg+xml' })); img.onload = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; c.getContext('2d').drawImage(img, 0, 0); URL.revokeObjectURL(url); const t = new THREE.Texture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; res(t); }; img.src = url; }));
    catTex.get(type).then(base => { const t = base.clone(); t.source = base.source; t.repeat.set(1 / 4, 1); this.tex = t; this.mat.map = t; this.mat.needsUpdate = true; this.mesh.visible = true; this.setFrame(this.fr || 'sit', this.flip); });
  }
  setFrame(f, flip) { this.fr = f; this.flip = flip; if (this.tex) this.tex.offset.set(CAT_FRAMES.indexOf(f) / 4, 0); this.mesh.scale.x = flip ? -1 : 1; }
  set(x, y) { this.group.position.set(x, 0, y); }
  dispose() { this.group.removeFromParent(); this.mat.dispose(); }
}
