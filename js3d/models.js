// 3D 模型：全部以程式組合基本形體 + 程式材質完成（原創設計）
// 單位：1 = 一格地板。家具原點在格子中心的地面，預設正面朝 +Z。
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/addons/RoundedBoxGeometry.js';
import * as T from './tex.js';

// ---------------- 材質 ----------------
const std = (o) => new THREE.MeshStandardMaterial(o);
const mcache = new Map();
function mat(key, make) { if (!mcache.has(key)) mcache.set(key, make()); return mcache.get(key); }

export const M = {
  get walnut() { return mat('walnut', () => std({ color: '#ffffff', map: T.woodGrain('#4a2e1e'), roughness: 0.42 })); },
  get walnutDark() { return mat('walnutD', () => std({ color: '#ffffff', map: T.woodGrain('#2e1c12'), roughness: 0.4 })); },
  get oak() { return mat('oak', () => std({ color: '#ffffff', map: T.woodGrain('#a77b4f'), roughness: 0.5 })); },
  get ash() { return mat('ash', () => std({ color: '#ffffff', map: T.woodGrain('#cfb08a'), roughness: 0.55 })); },
  get brass() { return mat('brass', () => std({ color: '#d4ad57', metalness: 1, roughness: 0.28 })); },
  get brassDark() { return mat('brassD', () => std({ color: '#a8823c', metalness: 1, roughness: 0.38 })); },
  get copper() { return mat('copper', () => std({ color: '#c47a4f', metalness: 1, roughness: 0.3 })); },
  get chrome() { return mat('chrome', () => std({ color: '#e6e8ea', metalness: 1, roughness: 0.12 })); },
  get steel() { return mat('steel', () => std({ color: '#b9bec2', metalness: 0.9, roughness: 0.35 })); },
  get iron() { return mat('iron', () => std({ color: '#1f1f22', metalness: 0.6, roughness: 0.45 })); },
  get blackGloss() { return mat('blackG', () => std({ color: '#151517', metalness: 0.2, roughness: 0.18 })); },
  get marble() { return mat('marble', () => std({ color: '#ffffff', map: T.marble('white'), roughness: 0.12, metalness: 0 })); },
  get marbleGreen() { return mat('marbleG', () => std({ color: '#ffffff', map: T.marble('green'), roughness: 0.12 })); },
  get marbleBlack() { return mat('marbleB', () => std({ color: '#ffffff', map: T.marble('black'), roughness: 0.12 })); },
  get marblePink() { return mat('marbleP', () => std({ color: '#ffffff', map: T.marble('pink'), roughness: 0.14 })); },
  get velvetGreen() { return mat('velG', () => std({ color: '#ffffff', map: T.fabric('#2f5446'), roughness: 0.92 })); },
  get velvetRose() { return mat('velR', () => std({ color: '#ffffff', map: T.fabric('#b5686a'), roughness: 0.92 })); },
  get velvetMustard() { return mat('velM', () => std({ color: '#ffffff', map: T.fabric('#c49a3a'), roughness: 0.92 })); },
  get velvetNavy() { return mat('velN', () => std({ color: '#ffffff', map: T.fabric('#2c3a56'), roughness: 0.92 })); },
  get linen() { return mat('linen', () => std({ color: '#ffffff', map: T.fabric('#e3d8c6', 'linen'), roughness: 0.95 })); },
  get leather() { return mat('leather', () => std({ color: '#8a4a26', roughness: 0.48 })); },
  get cane() { return mat('cane', () => std({ color: '#ffffff', map: T.cane(), roughness: 0.75, transparent: false })); },
  get ceramic() { return mat('ceramic', () => std({ color: '#f6f2ea', roughness: 0.25 })); },
  get ceramicSage() { return mat('ceramicS', () => std({ color: '#9fb5a3', roughness: 0.35 })); },
  get ceramicBlack() { return mat('ceramicB', () => std({ color: '#2a2827', roughness: 0.4 })); },
  get terracotta() { return mat('terra', () => std({ color: '#b8694a', roughness: 0.8 })); },
  get leaf() { return mat('leaf', () => std({ color: '#3f6b45', roughness: 0.6, side: THREE.DoubleSide })); },
  get leafLight() { return mat('leafL', () => std({ color: '#6d9558', roughness: 0.6, side: THREE.DoubleSide })); },
  get olive() { return mat('olive', () => std({ color: '#5d7350', roughness: 0.7, side: THREE.DoubleSide })); },
  get bark() { return mat('bark', () => std({ color: '#5b4636', roughness: 0.9 })); },
  get soil() { return mat('soil', () => std({ color: '#3a2a20', roughness: 1 })); },
  get glass() { return mat('glass', () => new THREE.MeshPhysicalMaterial({ color: '#e8f2f2', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, envMapIntensity: 1.5, depthWrite: false })); },
  get bulb() { return mat('bulb', () => std({ color: '#fff3d6', emissive: '#ffd99a', emissiveIntensity: 2.2, roughness: 0.3 })); },
  get globe() { return mat('globe', () => new THREE.MeshPhysicalMaterial({ color: '#fff8ea', emissive: '#ffcf8a', emissiveIntensity: 1.6, roughness: 0.4, transmission: 0, transparent: true, opacity: 0.92 })); },
  get coffee() { return mat('coffee', () => std({ color: '#3b2116', roughness: 0.2 })); },
  get crema() { return mat('crema', () => std({ color: '#c58a55', roughness: 0.4 })); },
  get milkFoam() { return mat('foam', () => std({ color: '#fbf6ee', roughness: 0.6 })); },
  get paper() { return mat('paper', () => std({ color: '#efe6d6', roughness: 0.9 })); },
  get burlap() { return mat('burlap', () => std({ color: '#ffffff', map: T.fabric('#b49a72', 'linen'), roughness: 1 })); },
  get bean() { return mat('bean', () => std({ color: '#3d2416', roughness: 0.35 })); },
  get rubber() { return mat('rubber', () => std({ color: '#2b2b2b', roughness: 0.8 })); },
  get white() { return mat('white', () => std({ color: '#f4f1ec', roughness: 0.5 })); },
  get cream() { return mat('cream', () => std({ color: '#efe4d2', roughness: 0.7 })); },
  get sage() { return mat('sage', () => std({ color: '#6f8b78', roughness: 0.65 })); },
  get forest() { return mat('forest', () => std({ color: '#294236', roughness: 0.55 })); },
  get navy() { return mat('navy', () => std({ color: '#25324a', roughness: 0.55 })); },
  get burgundy() { return mat('burg', () => std({ color: '#5e2129', roughness: 0.55 })); },
  get cake1() { return mat('cake1', () => std({ color: '#f3d9c9', roughness: 0.7 })); },
  get cake2() { return mat('cake2', () => std({ color: '#5a3324', roughness: 0.6 })); },
  get cake3() { return mat('cake3', () => std({ color: '#f2e2b6', roughness: 0.7 })); },
  get berry() { return mat('berry', () => std({ color: '#b3233a', roughness: 0.3 })); },
};
export function colorMat(c, rough = 0.6, metal = 0) { return mat('c' + c + rough + metal, () => std({ color: c, roughness: rough, metalness: metal })); }

// ---------------- 幾何小工具 ----------------
function shadowed(o) { o.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; }
export function rbox(w, h, d, r, m, x = 0, y = 0, z = 0) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const g = rr > 0.002 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d);
  const me = new THREE.Mesh(g, m); me.position.set(x, y, z); return me;
}
export function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 28) {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); return me;
}
export function sph(r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 24) {
  const me = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.66 | 0)), m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); return me;
}
export function lathe(pts, m, seg = 32) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), m);
}
function torus(R, r, arc, m, seg = 32) { return new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, seg, arc), m); }
function tube(points, r, m, seg = 40) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 8, false), m);
}
function group(...kids) { const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; }

// ---------------- 小物 ----------------
export function cup(kind = 'cup', s = 1) {
  const g = new THREE.Group();
  if (kind === 'glass') {
    const gl = lathe([[0, 0], [0.05, 0], [0.055, 0.14], [0.052, 0.14]], M.glass); g.add(gl);
    const liq = cyl(0.046, 0.044, 0.1, colorMat('#b98a63', 0.3), 0, 0.055, 0); g.add(liq);
    g.add(cyl(0.046, 0.046, 0.025, M.coffee, 0, 0.03, 0));
  } else {
    g.add(cyl(0.075, 0.075, 0.008, M.ceramic, 0, 0.004, 0));
    const c = lathe([[0, 0.008], [0.035, 0.008], [0.048, 0.06], [0.05, 0.075], [0.045, 0.075], [0.04, 0.02], [0, 0.02]], M.ceramic); g.add(c);
    g.add(cyl(0.044, 0.044, 0.002, M.crema, 0, 0.068, 0));
    const h = torus(0.018, 0.005, Math.PI * 1.2, M.ceramic, 12); h.position.set(0.055, 0.045, 0); h.rotation.z = -Math.PI * 0.6; g.add(h);
  }
  g.scale.setScalar(s);
  return g;
}

function potPlant(potMat, h = 0.35, r = 0.16) {
  const pot = lathe([[0, 0], [r * 0.75, 0], [r, h * 0.85], [r * 1.05, h], [r * 0.95, h], [0, h * 0.95]], potMat);
  return pot;
}

// ---------------- 家具 ----------------
function tableMarbleRound() {
  const g = new THREE.Group();
  g.add(cyl(0.2, 0.22, 0.03, M.brass, 0, 0.015, 0));
  g.add(cyl(0.03, 0.03, 0.82, M.brass, 0, 0.42, 0, 16));
  g.add(cyl(0.08, 0.05, 0.05, M.brass, 0, 0.83, 0));
  g.add(cyl(0.36, 0.36, 0.045, M.marble, 0, 0.88, 0, 40));
  return g;
}
function tableWalnutSquare() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
    const leg = cyl(0.03, 0.02, 0.84, M.walnut, x, 0.42, z, 12); leg.rotation.z = x * 0.05; leg.rotation.x = -z * 0.05; g.add(leg);
  }
  g.add(rbox(0.62, 0.06, 0.62, 0.02, M.walnut, 0, 0.78, 0));
  g.add(rbox(0.72, 0.04, 0.72, 0.015, M.walnut, 0, 0.87, 0));
  const vase = lathe([[0, 0], [0.03, 0], [0.04, 0.06], [0.015, 0.12], [0.018, 0.14], [0, 0.14]], M.ceramicSage); vase.position.set(-0.12, 0.89, -0.1); g.add(vase);
  g.add(sph(0.025, colorMat('#e7c3c0', 0.6), -0.12, 1.06, -0.1)); g.add(tube([[-0.12, 1.02, -0.1], [-0.11, 1.07, -0.1]], 0.004, M.leaf));
  return g;
}
function tableBistro() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    g.add(tube([[Math.cos(a) * 0.24, 0.01, Math.sin(a) * 0.24], [Math.cos(a) * 0.14, 0.2, Math.sin(a) * 0.14], [Math.cos(a) * 0.04, 0.45, Math.sin(a) * 0.04], [0, 0.6, 0]], 0.013, M.iron));
  }
  g.add(cyl(0.025, 0.025, 0.3, M.iron, 0, 0.72, 0, 12));
  g.add(cyl(0.32, 0.32, 0.04, M.marbleBlack, 0, 0.88, 0, 40));
  g.add(cyl(0.325, 0.325, 0.012, M.brass, 0, 0.86, 0, 40));
  return g;
}
function tableTerrazzo() {
  const g = new THREE.Group();
  const tz = mat('tzmat', () => std({ color: '#fff', map: T.terrazzo(), roughness: 0.3 }));
  g.add(cyl(0.12, 0.17, 0.84, colorMat('#d9cfc2', 0.5), 0, 0.42, 0));
  g.add(cyl(0.38, 0.38, 0.05, tz, 0, 0.88, 0, 40));
  return g;
}
function chairBentwood() {
  const g = new THREE.Group();
  const w = M.walnutDark;
  for (const [x, z] of [[-0.17, 0.17], [0.17, 0.17], [-0.15, -0.15], [0.15, -0.15]]) {
    const leg = cyl(0.018, 0.014, 0.5, w, x * 1.08, 0.25, z * 1.08, 10); leg.rotation.z = -x * 0.15; leg.rotation.x = z * 0.15; g.add(leg);
  }
  const ring = torus(0.17, 0.012, Math.PI * 2, w, 28); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; g.add(ring);
  g.add(cyl(0.21, 0.21, 0.05, M.cane, 0, 0.5, 0, 32));
  g.add(cyl(0.215, 0.215, 0.02, w, 0, 0.48, 0, 32));
  // 背部：兩根後柱 + 彎曲靠背
  const back1 = tube([[-0.15, 0.5, -0.16], [-0.17, 0.75, -0.2], [-0.15, 0.98, -0.2]], 0.016, w);
  const back2 = tube([[0.15, 0.5, -0.16], [0.17, 0.75, -0.2], [0.15, 0.98, -0.2]], 0.016, w);
  g.add(back1, back2);
  const hoop = torus(0.17, 0.017, Math.PI, w, 24); hoop.position.set(0, 0.86, -0.2); g.add(hoop);
  const hoop2 = torus(0.12, 0.012, Math.PI, w, 20); hoop2.position.set(0, 0.86, -0.2); g.add(hoop2);
  return g;
}
function chairVelvet(m = M.velvetGreen) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]]) g.add(cyl(0.02, 0.012, 0.16, M.brass, x, 0.08, z, 10));
  g.add(rbox(0.56, 0.18, 0.54, 0.08, m, 0, 0.24, 0.02));
  g.add(rbox(0.5, 0.1, 0.46, 0.05, m, 0, 0.36, 0.05));
  // 半圓形靠背
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.27, 0.42, 32, 1, true, Math.PI * 0.5, Math.PI), m);
  shell.position.set(0, 0.5, 0.02); shell.scale.set(1, 1, 0.92); shell.material = m;
  const shellIn = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.38, 32, 1, true, Math.PI * 0.5, Math.PI), m);
  shellIn.position.set(0, 0.5, 0.02); shellIn.material.side = THREE.DoubleSide;
  const top = torus(0.265, 0.035, Math.PI, m, 24); top.rotation.x = -Math.PI / 2; top.rotation.z = Math.PI; top.position.set(0, 0.71, 0.02);
  g.add(shell, shellIn, top);
  return g;
}
function chairCane() {
  const g = new THREE.Group();
  const w = M.oak;
  for (const [x, z] of [[-0.18, 0.18], [0.18, 0.18], [-0.18, -0.18], [0.18, -0.18]]) g.add(cyl(0.02, 0.016, 0.48, w, x, 0.24, z, 10));
  g.add(rbox(0.44, 0.05, 0.44, 0.02, w, 0, 0.49, 0));
  g.add(rbox(0.38, 0.03, 0.38, 0.01, M.linen, 0, 0.53, 0));
  g.add(cyl(0.02, 0.02, 0.5, w, -0.19, 0.75, -0.19, 10), cyl(0.02, 0.02, 0.5, w, 0.19, 0.75, -0.19, 10));
  g.add(rbox(0.36, 0.34, 0.02, 0.005, M.cane, 0, 0.78, -0.19));
  g.add(rbox(0.44, 0.05, 0.05, 0.02, w, 0, 0.98, -0.19));
  return g;
}
function chairLeather() {
  const g = new THREE.Group();
  g.add(rbox(0.6, 0.12, 0.58, 0.03, M.walnutDark, 0, 0.08, 0));
  g.add(rbox(0.6, 0.2, 0.58, 0.08, M.leather, 0, 0.24, 0));
  g.add(rbox(0.13, 0.36, 0.56, 0.06, M.leather, -0.26, 0.4, 0));
  g.add(rbox(0.13, 0.36, 0.56, 0.06, M.leather, 0.26, 0.4, 0));
  g.add(rbox(0.6, 0.5, 0.14, 0.07, M.leather, 0, 0.55, -0.23));
  g.add(rbox(0.4, 0.1, 0.42, 0.05, M.leather, 0, 0.38, 0.04));
  return g;
}
function chairStool() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const leg = cyl(0.016, 0.016, 0.72, M.iron, Math.cos(a) * 0.14, 0.36, Math.sin(a) * 0.14, 8);
    leg.rotation.z = Math.cos(a) * 0.1; leg.rotation.x = -Math.sin(a) * 0.1; g.add(leg);
  }
  const ring = torus(0.15, 0.01, Math.PI * 2, M.brass, 24); ring.rotation.x = Math.PI / 2; ring.position.y = 0.26; g.add(ring);
  g.add(cyl(0.17, 0.17, 0.06, M.leather, 0, 0.74, 0, 28));
  return g;
}

function oliveTree() {
  const g = new THREE.Group();
  g.add(potPlant(M.ceramicBlack, 0.36, 0.17));
  g.add(cyl(0.15, 0.15, 0.02, M.soil, 0, 0.33, 0));
  g.add(tube([[0, 0.3, 0], [0.03, 0.7, 0.02], [-0.02, 1.1, 0], [0.02, 1.35, -0.02]], 0.028, M.bark));
  g.add(tube([[0.01, 0.95, 0], [0.15, 1.15, 0.05], [0.22, 1.3, 0.05]], 0.016, M.bark));
  g.add(tube([[0, 1.05, 0], [-0.16, 1.25, -0.04], [-0.2, 1.4, -0.06]], 0.014, M.bark));
  const leafG = new THREE.SphereGeometry(0.035, 6, 4);
  const inst = new THREE.InstancedMesh(leafG, M.olive, 320);
  const inst2 = new THREE.InstancedMesh(leafG, mat('olive2', () => std({ color: '#8a9c7c', roughness: 0.7 })), 140);
  const dummy = new THREE.Object3D();
  const clusters = [[0.02, 1.45, -0.02, 0.22], [0.22, 1.35, 0.05, 0.17], [-0.2, 1.42, -0.06, 0.17], [0.05, 1.2, 0.1, 0.15]];
  let n = 0, n2 = 0, seed = 3;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (const [cx, cy, cz, cr] of clusters) {
    for (let i = 0; i < 115; i++) {
      const u = rnd() * Math.PI * 2, v = Math.acos(2 * rnd() - 1), rr = cr * Math.cbrt(rnd());
      dummy.position.set(cx + Math.sin(v) * Math.cos(u) * rr, cy + Math.cos(v) * rr * 0.75, cz + Math.sin(v) * Math.sin(u) * rr);
      dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      dummy.scale.set(0.6, 0.35, 1.8);
      dummy.updateMatrix();
      if (rnd() < 0.3 && n2 < 140) inst2.setMatrixAt(n2++, dummy.matrix); else if (n < 320) inst.setMatrixAt(n++, dummy.matrix);
    }
  }
  inst.count = n; inst2.count = n2;
  g.add(inst, inst2);
  return g;
}

function monsteraLeaf(size, m) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.55, 0.15, -0.55, 0.85, 0, 1);
  s.bezierCurveTo(0.55, 0.85, 0.55, 0.15, 0, 0);
  for (const [x, y, rx, ry] of [[-0.24, 0.45, 0.06, 0.11], [0.25, 0.5, 0.06, 0.11], [-0.2, 0.72, 0.05, 0.08], [0.2, 0.74, 0.05, 0.08]]) {
    const h = new THREE.Path(); h.absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0); s.holes.push(h);
  }
  const geo = new THREE.ShapeGeometry(s, 10);
  geo.scale(size, size, size);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -Math.abs(x) * 0.35 + y * y * 0.12); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, m);
}
function monstera() {
  const g = new THREE.Group();
  g.add(potPlant(M.ceramic, 0.34, 0.18));
  g.add(cyl(0.16, 0.16, 0.02, M.soil, 0, 0.31, 0));
  const leaves = [[0, 0.9, 0.25, 0, 0.3], [2.1, 0.8, 0.3, 0.25, 0.2], [4.2, 0.95, 0.28, -0.2, 0.25], [1.1, 1.15, 0.24, 0.1, -0.1], [3.2, 1.1, 0.26, -0.1, 0.1], [5.3, 0.7, 0.22, 0, 0]];
  leaves.forEach(([ang, y, sz], i) => {
    const stemEnd = [Math.cos(ang) * 0.22, y, Math.sin(ang) * 0.22];
    g.add(tube([[0, 0.3, 0], [stemEnd[0] * 0.4, y * 0.75, stemEnd[2] * 0.4], stemEnd], 0.01, M.leafLight, 12));
    const lf = monsteraLeaf(sz * 1.25, i % 2 ? M.leaf : M.leafLight);
    lf.position.set(...stemEnd);
    lf.rotation.order = 'YXZ';
    lf.rotation.y = -ang + Math.PI / 2; lf.rotation.x = -0.9;
    g.add(lf);
  });
  return g;
}
function fiddleFig() {
  const g = new THREE.Group();
  g.add(potPlant(M.terracotta, 0.38, 0.17));
  g.add(cyl(0.15, 0.15, 0.02, M.soil, 0, 0.35, 0));
  g.add(tube([[0, 0.35, 0], [0.02, 1.0, 0], [0, 1.55, 0.01]], 0.022, M.bark));
  for (let i = 0; i < 22; i++) {
    const y = 0.75 + (i / 22) * 0.85, a = i * 2.4;
    const lf = sph(0.11, i % 3 ? M.leaf : M.leafLight, Math.cos(a) * 0.13, y, Math.sin(a) * 0.13, 1, 1.25, 0.3, 10);
    lf.rotation.set(0.4, -a, 0.3); g.add(lf);
  }
  return g;
}
function floorLamp() {
  const g = new THREE.Group();
  g.add(cyl(0.16, 0.18, 0.03, M.brassDark, 0, 0.015, 0));
  g.add(tube([[0, 0.02, 0], [0, 1.0, 0], [0.05, 1.6, 0.05], [0.3, 1.82, 0.3], [0.42, 1.78, 0.42]], 0.014, M.brass));
  const shade = lathe([[0, 0.14], [0.03, 0.14], [0.14, 0], [0.135, 0]], M.brass); shade.position.set(0.42, 1.62, 0.42); g.add(shade);
  g.add(sph(0.05, M.bulb, 0.42, 1.65, 0.42));
  g.userData.light = { pos: [0.42, 1.55, 0.42], intensity: 0.7, dist: 3.2 };
  return g;
}
function bookshelf() {
  const g = new THREE.Group();
  const w = M.walnut;
  g.add(rbox(0.86, 2.1, 0.04, 0.005, w, 0, 1.05, -0.28));
  g.add(rbox(0.04, 2.1, 0.4, 0.005, w, -0.41, 1.05, -0.1));
  g.add(rbox(0.04, 2.1, 0.4, 0.005, w, 0.41, 1.05, -0.1));
  const cols = ['#7b2f2c', '#2c4a5e', '#c9a24a', '#3d5f48', '#e5dccb', '#5a3c2a', '#8c6e9a', '#d08a5b'];
  let seed = 5; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let s = 0; s < 5; s++) {
    const y = 0.05 + s * 0.48;
    g.add(rbox(0.82, 0.035, 0.4, 0.005, w, 0, y, -0.1));
    if (s === 4) break;
    let x = -0.37;
    while (x < 0.33) {
      if (rnd() < 0.12 && s !== 1) { // 擺飾
        const v = lathe([[0, 0], [0.04, 0], [0.05, 0.08], [0.02, 0.16], [0.025, 0.18], [0, 0.18]], rnd() < 0.5 ? M.ceramicSage : M.ceramic); v.position.set(x + 0.05, y + 0.02, -0.1); g.add(v); x += 0.13; continue;
      }
      const bw = 0.025 + rnd() * 0.03, bh = 0.26 + rnd() * 0.14;
      const b = rbox(bw, bh, 0.24 + rnd() * 0.06, 0.003, colorMat(cols[Math.floor(rnd() * cols.length)], 0.7), x + bw / 2, y + 0.02 + bh / 2, -0.12);
      if (rnd() < 0.1) b.rotation.z = 0.25;
      g.add(b); x += bw + 0.004;
    }
  }
  return g;
}
function cakeStand() {
  const g = new THREE.Group();
  g.add(rbox(0.7, 0.8, 0.5, 0.03, M.walnut, 0, 0.4, 0));
  g.add(rbox(0.72, 0.03, 0.52, 0.01, M.marble, 0, 0.815, 0));
  const dome = lathe([[0, 0.38], [0.08, 0.37], [0.2, 0.3], [0.25, 0.15], [0.26, 0]], M.glass); dome.position.set(-0.08, 0.83, 0); g.add(dome);
  g.add(cyl(0.2, 0.2, 0.015, M.ceramic, -0.08, 0.84, 0));
  g.add(cyl(0.13, 0.13, 0.1, M.cake1, -0.08, 0.9, 0)); g.add(cyl(0.13, 0.13, 0.02, M.ceramic, -0.08, 0.96, 0));
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(sph(0.018, M.berry, -0.08 + Math.cos(a) * 0.08, 0.98, Math.sin(a) * 0.08)); }
  g.add(cyl(0.06, 0.07, 0.05, M.cake2, 0.22, 0.86, 0.1)); g.add(sph(0.03, M.cake3, 0.22, 0.9, 0.1, 1, 0.6, 1));
  g.add(cyl(0.06, 0.07, 0.05, M.cake3, 0.22, 0.86, -0.1)); g.add(sph(0.016, M.berry, 0.22, 0.9, -0.1));
  return g;
}
function beanSacks() {
  const g = new THREE.Group();
  const sack = (x, z, ry, h) => {
    const s = lathe([[0, 0], [0.15, 0], [0.19, 0.08], [0.19, h * 0.75], [0.15, h], [0.1, h + 0.04], [0, h + 0.03]], M.burlap, 20);
    s.position.set(x, 0, z); s.rotation.y = ry; return s;
  };
  g.add(sack(-0.14, -0.1, 0, 0.42), sack(0.16, -0.05, 1, 0.38), sack(0.02, 0.18, 2, 0.34));
  for (let i = 0; i < 26; i++) g.add(sph(0.018, M.bean, -0.14 + (Math.random() - 0.5) * 0.16, 0.46 + Math.random() * 0.02, -0.1 + (Math.random() - 0.5) * 0.16, 1, 0.6, 1.4, 6));
  return g;
}
function gramophone() {
  const g = new THREE.Group();
  g.add(rbox(0.42, 0.62, 0.42, 0.02, M.walnut, 0, 0.31, 0));
  g.add(rbox(0.44, 0.03, 0.44, 0.01, M.walnutDark, 0, 0.63, 0));
  g.add(cyl(0.17, 0.17, 0.02, M.blackGloss, 0, 0.66, 0));
  g.add(tube([[0.12, 0.66, -0.12], [0.12, 0.85, -0.12], [0.05, 1.0, -0.1]], 0.015, M.brass));
  const horn = lathe([[0.02, 0], [0.04, 0.15], [0.1, 0.3], [0.22, 0.4], [0.23, 0.41]], M.brass, 24);
  horn.position.set(0.05, 0.98, -0.1); horn.rotation.z = 0.9; horn.rotation.y = 0.5; g.add(horn);
  return g;
}
function piano() {
  const g = new THREE.Group();
  g.add(rbox(0.9, 1.25, 0.42, 0.02, M.blackGloss, 0, 0.62, -0.18));
  g.add(rbox(0.9, 0.06, 0.22, 0.01, M.blackGloss, 0, 0.72, 0.1));
  g.add(rbox(0.82, 0.03, 0.14, 0.005, M.white, 0, 0.765, 0.12));
  for (let i = 0; i < 14; i++) if (i % 7 !== 2 && i % 7 !== 6) g.add(rbox(0.018, 0.02, 0.08, 0.002, M.blackGloss, -0.38 + i * 0.058 + 0.03, 0.785, 0.1));
  g.add(cyl(0.025, 0.025, 0.72, M.blackGloss, -0.4, 0.36, 0.18), cyl(0.025, 0.025, 0.72, M.blackGloss, 0.4, 0.36, 0.18));
  g.add(cyl(0.03, 0.03, 0.2, M.brass, 0.3, 1.33, -0.2), sph(0.06, M.bulb, 0.3, 1.45, -0.2));
  return g;
}
function sideboardPlant() {
  const g = new THREE.Group();
  g.add(rbox(0.8, 0.7, 0.42, 0.02, M.walnut, 0, 0.35, -0.1));
  for (let i = 0; i < 2; i++) g.add(rbox(0.36, 0.56, 0.01, 0.003, M.cane, -0.19 + i * 0.38, 0.38, 0.115));
  for (let i = 0; i < 4; i++) g.add(cyl(0.015, 0.01, 0.1, M.brass, -0.35 + (i % 2) * 0.7, 0.0 + 0.05, -0.1 + (i < 2 ? -0.17 : 0.17), 8));
  const v = lathe([[0, 0], [0.06, 0], [0.09, 0.12], [0.04, 0.24], [0.05, 0.27], [0, 0.27]], M.ceramic); v.position.set(-0.2, 0.71, -0.1); g.add(v);
  for (let i = 0; i < 5; i++) { const st = tube([[-0.2, 0.95, -0.1], [-0.2 + (i - 2) * 0.06, 1.15, -0.1 + (i % 2 - 0.5) * 0.08], [-0.2 + (i - 2) * 0.12, 1.3, -0.1]], 0.005, M.bark, 10); g.add(st); g.add(sph(0.035, colorMat('#e9c7b5', 0.7), -0.2 + (i - 2) * 0.12, 1.31, -0.1)); }
  g.add(cup('cup', 1.2).translateX(0.18).translateY(0.71));
  return g;
}

// ---------------- 牆上物件（貼在牆面，原點在牆面底部中央，朝 +Z） ----------------
function framedArt(kind) {
  const g = new THREE.Group();
  g.add(rbox(0.62, 0.78, 0.04, 0.005, M.brassDark, 0, 1.75, 0.02));
  const pm = std({ map: T.painting(kind), roughness: 0.8 });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.66), pm); pl.position.set(0, 1.75, 0.045); g.add(pl);
  return g;
}
function roundMirror() {
  const g = new THREE.Group();
  const ring = torus(0.32, 0.03, Math.PI * 2, M.brass, 40); ring.position.set(0, 1.8, 0.03); g.add(ring);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.31, 40), std({ color: '#cfd8d6', metalness: 1, roughness: 0.04 })); glass.position.set(0, 1.8, 0.02); g.add(glass);
  return g;
}
function wallSconce() {
  const g = new THREE.Group();
  g.add(cyl(0.06, 0.06, 0.02, M.brass, 0, 2.05, 0.01).rotateX(Math.PI / 2));
  g.add(tube([[0, 2.05, 0.01], [0, 2.05, 0.14], [0, 2.15, 0.2]], 0.012, M.brass));
  const shade = lathe([[0, 0], [0.07, 0], [0.09, 0.14], [0.06, 0.14]], M.globe); shade.position.set(0, 2.12, 0.2); g.add(shade);
  g.userData.light = { pos: [0, 2.2, 0.25], intensity: 0.45, dist: 2.5 };
  return g;
}
function wallShelf() {
  const g = new THREE.Group();
  g.add(rbox(0.86, 0.04, 0.2, 0.005, M.walnut, 0, 1.75, 0.1));
  g.add(rbox(0.04, 0.12, 0.12, 0.005, M.brass, -0.35, 1.68, 0.06), rbox(0.04, 0.12, 0.12, 0.005, M.brass, 0.35, 1.68, 0.06));
  for (let i = 0; i < 3; i++) { const c = cup('cup', 1.3); c.position.set(-0.3 + i * 0.12, 1.77, 0.1); g.add(c); }
  const jar = lathe([[0, 0], [0.05, 0], [0.05, 0.16], [0.03, 0.18], [0, 0.18]], M.glass); jar.position.set(0.12, 1.77, 0.1); g.add(jar);
  g.add(cyl(0.045, 0.045, 0.1, M.bean, 0.12, 1.83, 0.1));
  const pot = potPlant(M.ceramicSage, 0.12, 0.06); pot.position.set(0.3, 1.77, 0.1); g.add(pot);
  for (let i = 0; i < 8; i++) g.add(tube([[0.3, 1.88, 0.1], [0.3 + (i - 4) * 0.025, 1.8, 0.16], [0.3 + (i - 4) * 0.035, 1.55 - (i % 3) * 0.08, 0.18]], 0.006, M.leafLight, 10));
  return g;
}
function neonSign() {
  const g = new THREE.Group();
  g.add(rbox(1.0, 0.42, 0.02, 0.01, colorMat('#1d1b1c', 0.4), 0, 1.95, 0.01));
  const t = T.textTex('coffee & co.', { w: 512, h: 160, font: 'italic 700 92px Georgia, serif', color: '#ffb8c6' });
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.3), m); pl.position.set(0, 1.95, 0.025); g.add(pl);
  g.userData.light = { pos: [0, 1.95, 0.3], intensity: 0.35, dist: 2, color: '#ff9fb2' };
  return g;
}
function archWindow() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.38, 0); shape.lineTo(0.38, 0); shape.lineTo(0.38, 1.3); shape.absarc(0, 1.3, 0.38, 0, Math.PI, false); shape.lineTo(-0.38, 0);
  const sky = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), new THREE.MeshBasicMaterial({ map: T.sky(), toneMapped: true }));
  // ShapeGeometry UV：依座標換算
  const uv = sky.geometry.attributes.uv, pos = sky.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 0.38) / 0.76, pos.getY(i) / 1.68);
  sky.position.set(0, 0.9, 0.005); g.add(sky);
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-0.44, -0.04); frameShape.lineTo(0.44, -0.04); frameShape.lineTo(0.44, 1.3); frameShape.absarc(0, 1.3, 0.44, 0, Math.PI, false); frameShape.lineTo(-0.44, -0.04);
  frameShape.holes.push(shape.clone ? new THREE.Path(shape.getPoints(24)) : null);
  const fg = new THREE.ExtrudeGeometry(frameShape, { depth: 0.06, bevelEnabled: false, curveSegments: 24 });
  const fr = new THREE.Mesh(fg, M.iron); fr.position.set(0, 0.9, 0); g.add(fr);
  // 窗格
  g.add(rbox(0.025, 1.68, 0.03, 0.002, M.iron, 0, 0.9 + 0.84, 0.03));
  g.add(rbox(0.76, 0.025, 0.03, 0.002, M.iron, 0, 0.9 + 0.65, 0.03));
  g.add(rbox(0.76, 0.025, 0.03, 0.002, M.iron, 0, 0.9 + 1.3, 0.03));
  g.add(rbox(0.96, 0.05, 0.16, 0.01, M.marble, 0, 0.88, 0.07));
  const pot = potPlant(M.terracotta, 0.14, 0.07); pot.position.set(0.25, 0.905, 0.08); g.add(pot);
  for (let i = 0; i < 6; i++) g.add(sph(0.04, M.leafLight, 0.25 + (i % 3 - 1) * 0.04, 1.07 + (i > 2 ? 0.04 : 0), 0.08 + (i % 2) * 0.03, 1, 1, 1, 8));
  g.userData.isWindow = true;
  return g;
}
function wallClock() {
  const g = new THREE.Group();
  const ring = torus(0.2, 0.025, Math.PI * 2, M.brass, 36); ring.position.set(0, 1.95, 0.03); g.add(ring);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 36), std({ color: '#f6f0e4', roughness: 0.6 })); face.position.set(0, 1.95, 0.025); g.add(face);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; g.add(rbox(0.012, i % 3 ? 0.025 : 0.045, 0.005, 0.001, M.iron, Math.sin(a) * 0.16, 1.95 + Math.cos(a) * 0.16, 0.03).rotateZ(-a)); }
  const h1 = rbox(0.012, 0.1, 0.006, 0.001, M.iron, 0, 0, 0.035); h1.geometry.translate(0, 0.05, 0); h1.position.set(0, 1.95, 0.035); h1.rotation.z = -1; g.add(h1);
  const h2 = rbox(0.008, 0.15, 0.006, 0.001, M.iron, 0, 0, 0.038); h2.geometry.translate(0, 0.07, 0); h2.position.set(0, 1.95, 0.038); h2.rotation.z = 2; g.add(h2);
  return g;
}
function chalkMenu() {
  const g = new THREE.Group();
  g.add(rbox(0.66, 0.82, 0.04, 0.01, M.walnut, 0, 1.85, 0.02));
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.72), std({ map: T.chalkboard('Menu'), roughness: 0.9 })); pl.position.set(0, 1.85, 0.045); g.add(pl);
  return g;
}

// ---------------- 吧台與機器 ----------------
// 後吧台一格：大理石檯面 + 直條紋胡桃木櫃
export function backBar(withShelf = true) {
  const g = new THREE.Group();
  g.add(rbox(1, 0.98, 0.62, 0.01, M.walnut, 0, 0.49, -0.19));
  for (let i = 0; i < 2; i++) g.add(rbox(0.44, 0.72, 0.01, 0.003, M.walnutDark, -0.235 + i * 0.47, 0.5, 0.12));
  for (let i = 0; i < 2; i++) g.add(cyl(0.008, 0.008, 0.16, M.brass, -0.05 + i * 0.1, 0.62, 0.135, 8).rotateZ(0));
  g.add(rbox(1.0, 0.05, 0.68, 0.008, M.marble, 0, 1.0, -0.17));
  g.add(rbox(1.0, 0.06, 0.62, 0.005, M.walnutDark, 0, 0.03, -0.19));
  if (withShelf) {
    g.add(rbox(0.96, 0.035, 0.22, 0.005, M.walnut, 0, 1.95, -0.39));
    g.add(rbox(0.96, 0.035, 0.22, 0.005, M.walnut, 0, 2.45, -0.39));
  }
  return g;
}
export function shelfDecor(kind) {
  const g = new THREE.Group();
  if (kind === 0) {
    for (let i = 0; i < 4; i++) { const c = cup('cup', 1.4); c.position.set(-0.33 + i * 0.13, 1.97, -0.38); g.add(c); }
    const j = lathe([[0, 0], [0.06, 0], [0.06, 0.22], [0.035, 0.24], [0, 0.24]], M.glass); j.position.set(0.32, 1.97, -0.39); g.add(j);
    g.add(cyl(0.055, 0.055, 0.16, M.bean, 0.32, 2.06, -0.39));
  } else if (kind === 1) {
    for (let i = 0; i < 3; i++) { const j = lathe([[0, 0], [0.065, 0], [0.065, 0.2], [0.04, 0.22], [0, 0.22]], M.glass); j.position.set(-0.3 + i * 0.16, 1.97, -0.39); g.add(j); g.add(cyl(0.06, 0.06, 0.14 - i * 0.03, M.bean, -0.3 + i * 0.16, 1.97 + 0.07 - i * 0.015, -0.39)); }
    const p = potPlant(M.ceramic, 0.12, 0.06); p.position.set(0.3, 1.97, -0.39); g.add(p);
    for (let i = 0; i < 9; i++) g.add(tube([[0.3, 2.08, -0.39], [0.3 + (i - 4) * 0.03, 2.02, -0.33], [0.3 + (i - 4) * 0.04, 1.75 - (i % 3) * 0.1, -0.3]], 0.006, M.leafLight, 10));
  } else {
    for (let i = 0; i < 5; i++) { const b = rbox(0.05, 0.25, 0.18, 0.004, colorMat(['#7b2f2c', '#2c4a5e', '#c9a24a', '#3d5f48', '#e5dccb'][i], 0.7), -0.35 + i * 0.055, 2.1, -0.39); g.add(b); }
    const v = lathe([[0, 0], [0.05, 0], [0.07, 0.1], [0.03, 0.2], [0.035, 0.22], [0, 0.22]], M.ceramicSage); v.position.set(0.15, 1.97, -0.39); g.add(v);
  }
  // 上層
  for (let i = 0; i < 6; i++) { const c = cup('glass', 1.2); c.position.set(-0.36 + i * 0.14, 2.47, -0.39); g.add(c); }
  return g;
}

// 義式咖啡機（tier 0..2）
export function espressoMachine(tier = 0) {
  const g = new THREE.Group();
  const body = tier === 2 ? M.forest : tier === 1 ? colorMat('#e8e1d5', 0.3) : M.chrome;
  g.add(rbox(0.72, 0.42, 0.44, 0.04, body, 0, 1.25, -0.2));
  g.add(rbox(0.74, 0.04, 0.46, 0.01, M.chrome, 0, 1.47, -0.2));
  g.add(rbox(0.7, 0.03, 0.22, 0.005, M.steel, 0, 1.04, 0.05));
  const n = tier === 0 ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -0.16 + i * 0.32;
    g.add(cyl(0.05, 0.05, 0.08, M.chrome, x, 1.12, 0.04));
    g.add(cyl(0.04, 0.03, 0.04, M.brass, x, 1.07, 0.04));
    const handle = cyl(0.015, 0.015, 0.18, M.blackGloss, x, 1.08, 0.15, 10); handle.rotation.x = Math.PI / 2 - 0.2; g.add(handle);
    const gauge = cyl(0.035, 0.035, 0.02, M.brass, x, 1.33, 0.025); gauge.rotation.x = Math.PI / 2; g.add(gauge);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.028, 20), M.white); face.position.set(x, 1.33, 0.037); g.add(face);
  }
  const wand = tube([[0.33, 1.3, 0], [0.36, 1.2, 0.06], [0.36, 1.08, 0.08]], 0.008, M.chrome, 12); g.add(wand);
  for (let i = 0; i < 4; i++) { const c = cup('cup', 1.1); c.position.set(-0.24 + i * 0.16, 1.49, -0.22); g.add(c); }
  if (tier >= 1) g.add(rbox(0.66, 0.05, 0.02, 0.005, M.brass, 0, 1.4, 0.021));
  return g;
}
// 磨豆機（小擺設）
export function grinder() {
  const g = new THREE.Group();
  g.add(rbox(0.16, 0.28, 0.2, 0.03, M.iron, 0, 1.17, -0.2));
  const hop = lathe([[0, 0], [0.04, 0], [0.09, 0.14], [0.09, 0.16], [0, 0.16]], M.glass); hop.position.set(0, 1.31, -0.2); g.add(hop);
  g.add(cyl(0.05, 0.04, 0.06, M.bean, 0, 1.36, -0.2));
  return g;
}
// 烘豆機（滾筒式）
export function roaster(tier = 0) {
  const g = new THREE.Group();
  const body = tier === 2 ? M.navy : tier === 1 ? M.forest : M.burgundy;
  g.add(rbox(0.6, 0.18, 0.44, 0.03, M.iron, 0, 1.12, -0.18));
  const drum = cyl(0.19, 0.19, 0.42, body, 0, 1.38, -0.18, 32); drum.rotation.x = Math.PI / 2; g.add(drum);
  const front = cyl(0.2, 0.2, 0.04, M.brass, 0, 1.38, 0.04, 32); front.rotation.x = Math.PI / 2; g.add(front);
  const win = cyl(0.07, 0.07, 0.02, M.glass, 0, 1.38, 0.065, 20); win.rotation.x = Math.PI / 2; g.add(win);
  g.add(cyl(0.055, 0.055, 0.01, M.bean, 0, 1.38, 0.058).rotateX(Math.PI / 2));
  const hop = lathe([[0.03, 0], [0.04, 0.05], [0.13, 0.18], [0.13, 0.2]], M.chrome); hop.position.set(0, 1.55, -0.2); g.add(hop);
  g.add(cyl(0.04, 0.04, 0.5, M.iron, 0.22, 1.7, -0.32, 12));
  const tray = cyl(0.17, 0.17, 0.05, M.chrome, 0.12, 1.06, 0.12, 28); g.add(tray);
  for (let i = 0; i < 14; i++) g.add(sph(0.016, M.bean, 0.12 + (Math.random() - 0.5) * 0.22, 1.09, 0.12 + (Math.random() - 0.5) * 0.22, 1, 0.6, 1.4, 6));
  return g;
}
// 烤箱（點心機）
export function oven(tier = 0) {
  const g = new THREE.Group();
  const body = tier ? colorMat('#e7dccb', 0.4) : M.steel;
  g.add(rbox(0.64, 0.38, 0.46, 0.03, body, 0, 1.22, -0.18));
  g.add(rbox(0.46, 0.24, 0.02, 0.01, colorMat('#2a2220', 0.2), -0.06, 1.21, 0.055));
  g.add(rbox(0.3, 0.12, 0.01, 0.005, std({ color: '#ffb35a', emissive: '#ff9c3c', emissiveIntensity: 0.9 }), -0.06, 1.2, 0.062));
  g.add(rbox(0.42, 0.02, 0.03, 0.005, M.brass, -0.06, 1.36, 0.07));
  for (let i = 0; i < 3; i++) g.add(cyl(0.025, 0.025, 0.02, M.brass, 0.25, 1.32 - i * 0.08, 0.06).rotateX(Math.PI / 2));
  return g;
}
// 吐司機 / 鬆餅機
export function toaster() {
  const g = new THREE.Group();
  g.add(rbox(0.36, 0.22, 0.22, 0.06, colorMat('#d9c7a8', 0.35), 0, 1.14, -0.18));
  g.add(rbox(0.22, 0.01, 0.03, 0.004, M.iron, 0, 1.255, -0.22), rbox(0.22, 0.01, 0.03, 0.004, M.iron, 0, 1.255, -0.14));
  g.add(rbox(0.03, 0.05, 0.02, 0.005, M.chrome, 0.2, 1.2, -0.18));
  g.add(rbox(0.26, 0.02, 0.18, 0.01, M.walnut, -0.02, 1.04, 0.12));
  g.add(rbox(0.12, 0.03, 0.1, 0.01, colorMat('#d9a65c', 0.7), -0.02, 1.065, 0.12));
  return g;
}
// 展示櫃（甜點）
export function showcase() {
  const g = new THREE.Group();
  g.add(rbox(0.9, 0.06, 0.5, 0.01, M.brass, 0, 1.06, -0.12));
  g.add(rbox(0.9, 0.36, 0.5, 0.01, M.glass, 0, 1.27, -0.12));
  g.add(rbox(0.86, 0.015, 0.46, 0.005, M.glass, 0, 1.28, -0.12));
  for (const [x, z] of [[-0.44, 0.12], [0.44, 0.12], [-0.44, -0.36], [0.44, -0.36]]) g.add(rbox(0.02, 0.38, 0.02, 0.003, M.brass, x, 1.27, z));
  g.add(rbox(0.9, 0.012, 0.012, 0.002, M.brass, 0, 1.455, 0.12), rbox(0.9, 0.012, 0.012, 0.002, M.brass, 0, 1.455, -0.36));
  const cakes = [[M.cake1, M.berry], [M.cake2, M.cake3], [M.cake3, M.berry]];
  for (let i = 0; i < 3; i++) {
    const [a, b] = cakes[i];
    g.add(cyl(0.075, 0.075, 0.06, a, -0.28 + i * 0.28, 1.12, -0.05, 20));
    g.add(sph(0.022, b, -0.28 + i * 0.28, 1.16, -0.05));
    g.add(cyl(0.05, 0.05, 0.04, b === M.berry ? M.cake2 : M.cake1, -0.28 + i * 0.28, 1.31, -0.18, 16));
  }
  return g;
}
// 收銀台
export function register() {
  const g = new THREE.Group();
  g.add(rbox(0.34, 0.12, 0.3, 0.02, M.iron, 0, 1.09, -0.08));
  const scr = rbox(0.26, 0.18, 0.02, 0.01, M.blackGloss, 0, 1.25, -0.1); scr.rotation.x = -0.35; g.add(scr);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), std({ color: '#cfe9df', emissive: '#7fbfa6', emissiveIntensity: 0.5 }));
  disp.position.set(0, 1.25, -0.088); disp.rotation.x = -0.35; g.add(disp);
  g.add(rbox(0.12, 0.02, 0.16, 0.005, colorMat('#e9e3d8', 0.6), 0.3, 1.04, 0.05));
  const tip = lathe([[0, 0], [0.05, 0], [0.05, 0.12], [0, 0.12]], M.glass); tip.position.set(-0.3, 1.025, 0.05); g.add(tip);
  g.add(cyl(0.045, 0.045, 0.03, M.brass, -0.3, 1.04, 0.05));
  return g;
}
// 取餐台燈箱
export function pickupSign() {
  const g = new THREE.Group();
  g.add(cyl(0.012, 0.012, 0.3, M.brass, 0, 1.18, -0.05, 8));
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ map: T.textTex('PICK UP', { w: 256, h: 90, font: '700 46px Georgia, serif', color: '#2b1d16', bg: '#e9dcc4' }) }));
  pl.position.set(0, 1.37, -0.05); g.add(pl);
  for (let i = 0; i < 3; i++) { const c = cup('glass', 1.1); c.position.set(-0.2 + i * 0.2, 1.03, 0.08); g.add(c); }
  return g;
}

// 前吧台（客人點餐處）
export function frontCounter() {
  const g = new THREE.Group();
  g.add(rbox(1, 1.0, 0.56, 0.01, M.walnut, 0, 0.5, 0));
  // 直條溝槽面板
  for (let i = 0; i < 12; i++) { const f = cyl(0.03, 0.03, 0.82, M.walnut, -0.44 + i * 0.08, 0.5, 0.27, 10); f.scale.z = 0.6; g.add(f); }
  g.add(rbox(1.02, 0.05, 0.62, 0.01, M.marble, 0, 1.02, 0));
  g.add(rbox(1.0, 0.06, 0.56, 0.005, M.walnutDark, 0, 0.03, 0));
  g.add(cyl(0.015, 0.015, 1, M.brass, 0, 0.16, 0.36, 10).rotateZ(Math.PI / 2));
  return g;
}

// 垃圾回收台
export function trashStation() {
  const g = new THREE.Group();
  g.add(rbox(0.7, 0.9, 0.44, 0.02, M.walnut, 0, 0.45, -0.1));
  g.add(rbox(0.72, 0.03, 0.46, 0.008, M.marble, 0, 0.915, -0.1));
  for (let i = 0; i < 2; i++) { g.add(rbox(0.28, 0.08, 0.01, 0.004, M.iron, -0.17 + i * 0.34, 0.8, 0.125)); g.add(rbox(0.28, 0.6, 0.01, 0.004, M.walnutDark, -0.17 + i * 0.34, 0.42, 0.125)); }
  for (let i = 0; i < 3; i++) { const c = cup('cup', 1.2); c.position.set(-0.2 + i * 0.12, 0.93, -0.18); g.add(c); }
  return g;
}

// 吊燈（天花板垂下）
export function pendant(h = 2.55, top = 3.6, style = 0) {
  const g = new THREE.Group();
  const cord = cyl(0.004, 0.004, top - h, mat('cord', () => std({ color: '#222', transparent: true, opacity: 0.35 })), 0, (top + h) / 2, 0, 6); cord.userData.noShadow = true; g.add(cord);
  if (style === 0) {
    const gl = sph(0.15, M.globe, 0, h - 0.1, 0); g.add(gl);
    g.add(cyl(0.04, 0.05, 0.05, M.brass, 0, h + 0.03, 0, 16));
  } else {
    const sh = lathe([[0, 0.2], [0.04, 0.2], [0.07, 0.12], [0.2, 0.0], [0.19, 0]], M.brass, 32); sh.position.y = h - 0.2; g.add(sh);
    sh.material = M.brass;
    g.add(sph(0.06, M.bulb, 0, h - 0.16, 0));
  }
  g.userData.light = { pos: [0, h - 0.18, 0], intensity: 1.3, dist: 4.2 };
  return g;
}

// ---------------- 角色（大頭 Q 版） ----------------
export function character(look, opt = {}) {
  const { apron = null } = opt;
  const g = new THREE.Group();
  const skin = colorMat(look.skin, 0.65);
  const hair = colorMat(look.hair, 0.55);
  const top = colorMat(look.top, 0.75);
  const bottom = colorMat(look.bottom, 0.75);
  const shoe = colorMat(look.shoe || '#3a2a22', 0.5);
  const body = new THREE.Group(); g.add(body);
  // 腿
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.07, 0.36, 0); legR.position.set(0.07, 0.36, 0);
  for (const leg of [legL, legR]) {
    leg.add(cyl(0.045, 0.04, 0.3, bottom, 0, -0.15, 0, 12));
    leg.add(sph(0.05, shoe, 0, -0.32, 0.03, 1, 0.6, 1.5, 12));
    body.add(leg);
  }
  // 身體
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 16), top);
  torso.position.set(0, 0.52, 0); torso.scale.set(1, 1, 0.82); body.add(torso);
  if (look.bottomType === 'skirt') { const sk = cyl(0.14, 0.2, 0.18, bottom, 0, 0.38, 0, 20); body.add(sk); }
  if (apron) {
    const ap = rbox(0.24, 0.32, 0.02, 0.02, colorMat(apron, 0.8), 0, 0.46, 0.115); body.add(ap);
    body.add(rbox(0.13, 0.08, 0.02, 0.01, colorMat(apron, 0.8), 0, 0.64, 0.105));
    body.add(rbox(0.06, 0.04, 0.005, 0.004, M.brass, 0, 0.62, 0.118));
  }
  // 手臂
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.16, 0.64, 0); armR.position.set(0.16, 0.64, 0);
  for (const [arm, s] of [[armL, -1], [armR, 1]]) {
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.16, 4, 10), top); a.position.set(s * 0.02, -0.1, 0); a.rotation.z = s * 0.12; arm.add(a);
    arm.add(sph(0.042, skin, s * 0.035, -0.22, 0, 1, 1, 1, 12));
    body.add(arm);
  }
  // 頭
  const head = new THREE.Group(); head.position.set(0, 0.92, 0); body.add(head);
  head.add(sph(0.24, skin, 0, 0, 0, 1, 0.94, 0.95, 32));
  head.add(cyl(0.05, 0.06, 0.08, skin, 0, -0.22, 0, 12));
  // 臉
  const eyeM = colorMat('#2a1d18', 0.3);
  const eyes = new THREE.Group(); head.add(eyes);
  for (const s of [-1, 1]) {
    const e = sph(0.04, eyeM, s * 0.09, -0.03, 0.205, 0.8, 1.15, 0.5, 16); eyes.add(e);
    const hl = sph(0.012, M.white, s * 0.09 + 0.012, -0.008, 0.226, 1, 1, 0.4, 8); eyes.add(hl);
    head.add(sph(0.035, colorMat('#f2a39c', 0.8), s * 0.14, -0.08, 0.19, 1, 0.6, 0.3, 12));
  }
  const mouth = torus(0.025, 0.006, Math.PI, colorMat('#8a3b2e', 0.6), 10); mouth.position.set(0, -0.09, 0.225); mouth.rotation.z = Math.PI; head.add(mouth);
  // 頭髮
  const hairG = new THREE.Group(); head.add(hairG);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  cap.rotation.x = -0.35; cap.position.set(0, 0.02, -0.01); hairG.add(cap);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 12, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.18, Math.PI * 0.22), hair);
  fringe.rotation.y = Math.PI; fringe.position.set(0, 0.0, 0.01); fringe.scale.set(1.02, 1.02, 1.04); hairG.add(fringe);
  const back = sph(0.25, hair, 0, -0.02, -0.05, 1.03, 0.95, 0.95, 24); back.scale.set(1.03, 0.95, 0.9); hairG.add(back);
  switch (look.hairStyle) {
    case 'bun': hairG.add(sph(0.1, hair, 0, 0.25, -0.08)); break;
    case 'long': hairG.add(rbox(0.46, 0.42, 0.18, 0.08, hair, 0, -0.2, -0.1)); break;
    case 'bob': hairG.add(rbox(0.52, 0.22, 0.4, 0.1, hair, 0, -0.1, -0.03)); break;
    case 'pony': hairG.add(sph(0.08, hair, 0, 0.05, -0.27)); hairG.add(sph(0.07, hair, 0, -0.14, -0.3, 0.8, 1.6, 0.8)); break;
    case 'curly': for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; hairG.add(sph(0.08, hair, Math.cos(a) * 0.2, 0.08 + Math.sin(i) * 0.04, Math.sin(a) * 0.17 - 0.03)); } break;
    case 'short': default: break;
  }
  if (look.hat === 'beret') { const b = sph(0.2, colorMat('#2b1d16', 0.8), 0.03, 0.2, -0.02, 1.2, 0.35, 1.2); b.rotation.z = -0.2; hairG.add(b); }
  if (look.hat === 'cap') { hairG.add(sph(0.255, colorMat(look.capColor || '#2f5446', 0.7), 0, 0.04, -0.01, 1.02, 0.7, 1.02)); hairG.add(rbox(0.22, 0.02, 0.16, 0.01, colorMat(look.capColor || '#2f5446', 0.7), 0, 0.03, 0.24)); }
  if (look.glasses) {
    const gm = M.iron;
    for (const s of [-1, 1]) { const r = torus(0.045, 0.006, Math.PI * 2, gm, 18); r.position.set(s * 0.085, -0.02, 0.23); hairG.add(r); }
    hairG.add(rbox(0.05, 0.008, 0.008, 0.002, gm, 0, -0.01, 0.235));
  }
  g.userData.parts = { body, legL, legR, armL, armR, head, eyes, mouth };
  shadowed(g);
  return g;
}

// ---------------- 對照表 ----------------
export const BUILDERS = {
  tbl_marble: tableMarbleRound, tbl_walnut: tableWalnutSquare, tbl_bistro: tableBistro, tbl_terrazzo: tableTerrazzo,
  ch_bentwood: chairBentwood, ch_velvet: () => chairVelvet(M.velvetGreen), ch_rose: () => chairVelvet(M.velvetRose), ch_mustard: () => chairVelvet(M.velvetMustard),
  ch_cane: chairCane, ch_leather: chairLeather, ch_stool: chairStool,
  olive: oliveTree, monstera, fiddle: fiddleFig, floorlamp: floorLamp, bookshelf, cakestand: cakeStand, sacks: beanSacks, gramophone, piano, sideboard: sideboardPlant,
  w_art0: () => framedArt(0), w_art1: () => framedArt(1), w_art2: () => framedArt(2), w_mirror: roundMirror, w_sconce: wallSconce, w_shelf: wallShelf, w_neon: neonSign, w_window: archWindow, w_clock: wallClock, w_menu: chalkMenu,
};
export function build(type, extra) {
  const f = BUILDERS[type];
  const o = f ? f(extra) : rbox(0.5, 0.5, 0.5, 0.05, colorMat('#999'), 0, 0.25, 0);
  return shadowed(o);
}
export { shadowed, group };

// ================= 更多機器 =================
export function dessertFridge() {
  const g = new THREE.Group();
  g.add(rbox(0.8, 0.5, 0.48, 0.03, M.white, 0, 1.28, -0.16));
  g.add(rbox(0.72, 0.38, 0.02, 0.01, M.glass, 0, 1.28, 0.085));
  g.add(rbox(0.7, 0.012, 0.4, 0.004, M.glass, 0, 1.28, -0.16));
  const cakes = [M.cake1, M.cake2, M.cake3];
  for (let i = 0; i < 3; i++) { g.add(cyl(0.07, 0.07, 0.07, cakes[i], -0.22 + i * 0.22, 1.33, -0.12, 18)); g.add(sph(0.02, M.berry, -0.22 + i * 0.22, 1.38, -0.12)); }
  for (let i = 0; i < 3; i++) g.add(rbox(0.12, 0.05, 0.1, 0.01, cakes[(i + 1) % 3], -0.22 + i * 0.22, 1.13, -0.12));
  g.add(rbox(0.8, 0.04, 0.48, 0.01, M.brass, 0, 1.54, -0.16));
  return g;
}
export function waffleIron() {
  const g = new THREE.Group();
  g.add(rbox(0.5, 0.1, 0.36, 0.03, M.iron, 0, 1.08, -0.15));
  const lid = rbox(0.4, 0.06, 0.3, 0.05, M.chrome, 0, 1.17, -0.18); lid.rotation.x = -0.5; g.add(lid);
  g.add(rbox(0.36, 0.02, 0.26, 0.01, colorMat('#d9a65c', 0.7), 0, 1.14, -0.1));
  g.add(cyl(0.1, 0.1, 0.012, M.ceramic, 0.3, 1.04, 0.15)); g.add(rbox(0.14, 0.02, 0.1, 0.01, colorMat('#d9a65c', 0.7), 0.3, 1.06, 0.15));
  return g;
}
export function pastryBench() {
  const g = new THREE.Group();
  g.add(rbox(0.86, 0.05, 0.5, 0.01, M.marble, 0, 1.04, -0.12));
  g.add(cyl(0.16, 0.18, 0.12, M.ceramic, -0.22, 1.12, -0.18));
  g.add(cyl(0.12, 0.12, 0.05, M.cake1, 0.18, 1.09, -0.08, 20)); g.add(cyl(0.12, 0.12, 0.04, M.cake1, 0.18, 1.135, -0.08, 20));
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(sph(0.02, M.berry, 0.18 + Math.cos(a) * 0.08, 1.17, -0.08 + Math.sin(a) * 0.08)); }
  const bag = lathe([[0, 0], [0.04, 0.02], [0.05, 0.18], [0.01, 0.22]], M.white); bag.position.set(-0.34, 1.07, 0.1); bag.rotation.z = 1.2; g.add(bag);
  return g;
}
export function griddle() {
  const g = new THREE.Group();
  g.add(rbox(0.76, 0.16, 0.46, 0.02, M.steel, 0, 1.1, -0.16));
  g.add(rbox(0.7, 0.02, 0.4, 0.005, M.iron, 0, 1.19, -0.16));
  g.add(cyl(0.09, 0.09, 0.02, colorMat('#e0a85a', 0.6), -0.16, 1.21, -0.14, 20)); g.add(cyl(0.09, 0.09, 0.02, colorMat('#e0a85a', 0.6), 0.1, 1.21, -0.2, 20));
  g.add(sph(0.05, colorMat('#fff6e0', 0.5), 0.12, 1.21, -0.04, 1, 0.3, 1)); g.add(sph(0.025, colorMat('#f2c23a', 0.4), 0.12, 1.225, -0.04));
  for (let i = 0; i < 3; i++) g.add(cyl(0.025, 0.025, 0.02, M.brass, -0.25 + i * 0.25, 1.1, 0.075).rotateX(Math.PI / 2));
  return g;
}
export function pastaStove() {
  const g = new THREE.Group();
  g.add(rbox(0.76, 0.12, 0.46, 0.02, M.iron, 0, 1.08, -0.16));
  for (const [x, z] of [[-0.18, -0.06], [0.18, -0.24]]) { const r = torus(0.08, 0.012, Math.PI * 2, M.iron, 16); r.rotation.x = Math.PI / 2; r.position.set(x, 1.15, z); g.add(r); }
  const pot = cyl(0.12, 0.11, 0.18, M.steel, -0.18, 1.24, -0.06); g.add(pot);
  g.add(cyl(0.11, 0.11, 0.01, colorMat('#f1e3b6', 0.5), -0.18, 1.32, -0.06));
  const pan = cyl(0.12, 0.1, 0.04, M.iron, 0.18, 1.17, -0.24); g.add(pan);
  g.add(cyl(0.1, 0.1, 0.01, colorMat('#d0533e', 0.5), 0.18, 1.19, -0.24));
  const h = cyl(0.012, 0.012, 0.2, M.iron, 0.36, 1.17, -0.24, 8); h.rotation.z = Math.PI / 2; g.add(h);
  return g;
}
export function paniniPress() {
  const g = new THREE.Group();
  g.add(rbox(0.46, 0.12, 0.36, 0.02, M.chrome, 0, 1.08, -0.15));
  g.add(rbox(0.44, 0.08, 0.34, 0.02, M.chrome, 0, 1.2, -0.17));
  g.add(cyl(0.012, 0.012, 0.4, M.blackGloss, 0, 1.26, 0.04, 8).rotateZ(Math.PI / 2));
  g.add(rbox(0.3, 0.05, 0.12, 0.02, colorMat('#d9b07a', 0.7), 0.1, 1.04, 0.2));
  return g;
}
export function pizzaOven() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#b8694a', 0.9));
  dome.position.set(0, 1.06, -0.2); dome.scale.set(1, 0.9, 0.85); g.add(dome);
  g.add(rbox(0.3, 0.2, 0.06, 0.06, colorMat('#2a1a14', 0.9), 0, 1.15, 0.08));
  g.add(rbox(0.22, 0.1, 0.02, 0.03, std({ color: '#ffb35a', emissive: '#ff8a2a', emissiveIntensity: 1.2 }), 0, 1.13, 0.11));
  g.add(cyl(0.05, 0.05, 0.4, colorMat('#8a4a34', 0.9), 0.18, 1.5, -0.32));
  return g;
}

// ================= 前檯 =================
export function returnStation() {
  const g = new THREE.Group();
  g.add(rbox(0.5, 0.06, 0.36, 0.01, M.walnutDark, 0, 1.06, -0.05));
  for (let i = 0; i < 3; i++) g.add(rbox(0.12, 0.08, 0.3, 0.01, M.iron, -0.16 + i * 0.16, 1.05, -0.05));
  return g;
}
// 回收台上的杯子（依數量顯示）
export function cupPile(n) {
  const g = new THREE.Group();
  for (let i = 0; i < Math.min(n, 12); i++) { const c = cup('cup', 1.1); c.position.set(-0.16 + (i % 4) * 0.1, 1.09 + Math.floor(i / 8) * 0.08, -0.12 + Math.floor((i % 8) / 4) * 0.12); g.add(c); }
  return g;
}

// ================= 店外 =================
export function tree(seed = 1, h = 3) {
  const g = new THREE.Group();
  g.add(cyl(0.08, 0.12, h * 0.55, M.bark, 0, h * 0.27, 0, 10));
  let s = seed * 97;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const greens = [colorMat('#5e8a4a', 0.85), colorMat('#6f9a52', 0.85), colorMat('#4f7a40', 0.85)];
  for (let i = 0; i < 6; i++) {
    const a = r() * 6.28, d = r() * 0.45;
    g.add(sph(0.55 + r() * 0.3, greens[i % 3], Math.cos(a) * d, h * 0.62 + r() * h * 0.3, Math.sin(a) * d, 1, 0.85, 1, 12));
  }
  return g;
}
export function hedge(len = 1) {
  const g = new THREE.Group();
  g.add(rbox(len, 0.2, 0.46, 0.02, colorMat('#d9cbb6', 0.8), 0, 0.1, 0));
  g.add(rbox(len - 0.06, 0.42, 0.38, 0.16, colorMat('#5f8a4a', 0.9), 0, 0.38, 0));
  for (let i = 0; i < len * 3; i++) g.add(sph(0.05, colorMat(['#e07a8a', '#f2d36b', '#f4efe6', '#c98ad6'][i % 4], 0.6), -len / 2 + 0.15 + i * 0.33, 0.6, (i % 2 ? 0.12 : -0.08), 1, 1, 1, 8));
  return g;
}
export function lampPost() {
  const g = new THREE.Group();
  g.add(cyl(0.1, 0.14, 0.2, M.iron, 0, 0.1, 0, 12));
  g.add(cyl(0.035, 0.045, 2.4, M.iron, 0, 1.3, 0, 10));
  g.add(cyl(0.12, 0.08, 0.06, M.iron, 0, 2.5, 0, 8));
  const glass = lathe([[0.06, 0], [0.13, 0.12], [0.13, 0.3], [0.07, 0.36]], M.globe, 8); glass.position.y = 2.52; g.add(glass);
  g.add(cyl(0.02, 0.1, 0.12, M.iron, 0, 2.94, 0, 8));
  return g;
}
export function bench() {
  const g = new THREE.Group();
  for (const x of [-0.5, 0.5]) { g.add(rbox(0.06, 0.42, 0.4, 0.01, M.iron, x, 0.21, 0)); g.add(rbox(0.06, 0.4, 0.06, 0.01, M.iron, x, 0.62, -0.18)); }
  for (let i = 0; i < 3; i++) g.add(rbox(1.2, 0.04, 0.1, 0.01, M.oak, 0, 0.44, -0.12 + i * 0.12));
  for (let i = 0; i < 2; i++) g.add(rbox(1.2, 0.08, 0.03, 0.01, M.oak, 0, 0.62 + i * 0.12, -0.2));
  return g;
}
export function aFrameSign() {
  const g = new THREE.Group();
  const b1 = rbox(0.5, 0.75, 0.03, 0.01, M.walnut, 0, 0.38, 0.1); b1.rotation.x = -0.18; g.add(b1);
  const b2 = rbox(0.5, 0.75, 0.03, 0.01, M.walnut, 0, 0.38, -0.1); b2.rotation.x = 0.18; g.add(b2);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), std({ map: T.chalkboard('Today'), roughness: 0.9 }));
  pl.position.set(0, 0.38, 0.12); pl.rotation.x = -0.18; g.add(pl);
  return g;
}
export function flowerPot() {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.18, 0], [0.22, 0.32], [0.24, 0.34], [0, 0.34]], M.terracotta, 16));
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; g.add(sph(0.08, colorMat('#5f8a4a', 0.8), Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12, 1, 1, 1, 8)); g.add(sph(0.045, colorMat(['#e07a8a', '#f2d36b', '#f4efe6'][i % 3], 0.6), Math.cos(a) * 0.14, 0.5, Math.sin(a) * 0.14, 1, 1, 1, 8)); }
  return g;
}
export function umbrellaTable() {
  const g = new THREE.Group();
  g.add(cyl(0.2, 0.25, 0.04, M.iron, 0, 0.02, 0)); g.add(cyl(0.025, 0.025, 2.2, M.iron, 0, 1.1, 0, 8));
  g.add(cyl(0.35, 0.35, 0.04, M.white, 0, 0.75, 0));
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.4, 8, 1, true), colorMat('#2f5446', 0.8)); top.material.side = THREE.DoubleSide; top.position.y = 2.15; g.add(top);
  const stripe = new THREE.Mesh(new THREE.ConeGeometry(1.105, 0.4, 8, 1, true, 0, Math.PI / 4), colorMat('#f4efe6', 0.8)); stripe.position.y = 2.15; g.add(stripe);
  const stripe2 = stripe.clone(); stripe2.rotation.y = Math.PI / 2; g.add(stripe2);
  const stripe3 = stripe.clone(); stripe3.rotation.y = Math.PI; g.add(stripe3);
  const stripe4 = stripe.clone(); stripe4.rotation.y = -Math.PI / 2; g.add(stripe4);
  return g;
}
export function fountain() {
  const g = new THREE.Group();
  g.add(cyl(0.4, 0.44, 0.3, M.marble, 0, 0.15, 0, 32));
  g.add(cyl(0.36, 0.36, 0.02, colorMat('#7ab3c9', 0.1, 0.1), 0, 0.29, 0, 32));
  g.add(cyl(0.05, 0.08, 0.6, M.brass, 0, 0.55, 0, 12));
  g.add(cup('cup', 4).translateY(0.82));
  return g;
}
export function royalChair() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]]) g.add(cyl(0.018, 0.014, 0.3, M.brass, x, 0.15, z, 10));
  g.add(rbox(0.52, 0.14, 0.5, 0.06, M.velvetNavy, 0, 0.36, 0));
  g.add(rbox(0.5, 0.56, 0.12, 0.06, M.velvetNavy, 0, 0.7, -0.2));
  g.add(torus(0.25, 0.015, Math.PI, M.brass, 24).translateY(0.98).translateZ(-0.2));
  g.add(rbox(0.04, 0.6, 0.04, 0.01, M.brass, -0.26, 0.7, -0.22), rbox(0.04, 0.6, 0.04, 0.01, M.brass, 0.26, 0.7, -0.22));
  return g;
}
Object.assign(BUILDERS, {
  tbl_green: () => { const g = tableMarbleRound(); g.children.forEach(c => { if (c.material === M.marble) c.material = M.marbleGreen; }); return g; },
  tbl_pink: () => { const g = tableMarbleRound(); g.children.forEach(c => { if (c.material === M.marble) c.material = M.marblePink; }); return g; },
  ch_navy: () => chairVelvet(M.velvetNavy), ch_royal: royalChair, fountain,
  pendant_globe: () => pendant(2.6, 3.6, 0), pendant_brass: () => pendant(2.6, 3.6, 1),
  w_truck_art: () => framedArt(1), sign_truck: () => aFrameSign(), sign_heart: () => aFrameSign(),
});

// ================= 擴充機器 =================
function counterBase(m = M.steel, h = 0.12) { return rbox(0.8, h, 0.48, 0.02, m, 0, 1.0 + h / 2, -0.15); }
export function gelatoCase() {
  const g = new THREE.Group();
  g.add(rbox(0.82, 0.16, 0.48, 0.03, M.white, 0, 1.08, -0.15));
  const lid = rbox(0.78, 0.02, 0.44, 0.01, M.glass, 0, 1.24, -0.15); lid.rotation.x = -0.18; g.add(lid);
  const cols = ['#f8edc8', '#b9cf8a', '#e8a0b0', '#5a3324', '#f4b23a', '#fbf8ef'];
  for (let i = 0; i < 6; i++) {
    const x = -0.27 + (i % 3) * 0.27, z = -0.25 + Math.floor(i / 3) * 0.2;
    g.add(rbox(0.22, 0.04, 0.16, 0.01, M.steel, x, 1.17, z));
    g.add(sph(0.08, colorMat(cols[i], 0.7), x, 1.18, z, 1.2, 0.45, 0.9, 14));
  }
  g.add(rbox(0.82, 0.03, 0.48, 0.01, M.brass, 0, 1.0, -0.15));
  return g;
}
export function crepeGriddle() {
  const g = new THREE.Group();
  g.add(counterBase(M.chrome, 0.1));
  for (const x of [-0.18, 0.18]) { g.add(cyl(0.17, 0.17, 0.03, M.iron, x, 1.12, -0.15, 32)); g.add(cyl(0.15, 0.15, 0.005, colorMat('#e9c27a', 0.6), x, 1.14, -0.15, 32)); }
  const tool = rbox(0.02, 0.01, 0.22, 0.004, M.walnut, 0.3, 1.16, 0.12); tool.rotation.y = 0.4; g.add(tool);
  return g;
}
export function patisserieOven() {
  const g = new THREE.Group();
  g.add(rbox(0.74, 0.5, 0.44, 0.03, colorMat('#2f5446', 0.4), 0, 1.25, -0.16));
  for (let i = 0; i < 2; i++) {
    g.add(rbox(0.62, 0.18, 0.02, 0.02, M.blackGloss, 0, 1.13 + i * 0.24, 0.065));
    g.add(rbox(0.5, 0.1, 0.01, 0.01, std({ color: '#ffb35a', emissive: '#ff9a3a', emissiveIntensity: 0.8 }), 0, 1.13 + i * 0.24, 0.072));
    g.add(cyl(0.008, 0.008, 0.5, M.brass, 0, 1.23 + i * 0.24, 0.085, 8).rotateZ(Math.PI / 2));
  }
  g.add(rbox(0.76, 0.03, 0.46, 0.01, M.brass, 0, 1.51, -0.16));
  return g;
}
export function wagashiCounter() {
  const g = new THREE.Group();
  g.add(rbox(0.82, 0.06, 0.48, 0.01, M.ash, 0, 1.03, -0.15));
  for (let i = 0; i < 2; i++) { const st = cyl(0.13, 0.13, 0.08, M.cane, -0.2, 1.1 + i * 0.08, -0.18, 24); g.add(st); }
  g.add(cyl(0.135, 0.135, 0.02, M.ash, -0.2, 1.27, -0.18, 24));
  const tray = rbox(0.34, 0.025, 0.22, 0.01, M.ceramicBlack, 0.18, 1.07, -0.1); g.add(tray);
  const cols = ['#f2b8c6', '#ffffff', '#8fae5a'];
  for (let i = 0; i < 3; i++) g.add(sph(0.045, colorMat(cols[i], 0.7), 0.08 + i * 0.1, 1.11, -0.1, 1, 0.75, 1, 14));
  return g;
}
export function riceStation() {
  const g = new THREE.Group();
  g.add(counterBase(M.walnut, 0.06));
  const cooker = lathe([[0, 0], [0.15, 0], [0.16, 0.16], [0.13, 0.2], [0, 0.21]], M.white); cooker.position.set(-0.2, 1.06, -0.18); g.add(cooker);
  g.add(cyl(0.03, 0.03, 0.02, M.iron, -0.2, 1.28, -0.18, 12));
  for (let i = 0; i < 3; i++) {
    const b = lathe([[0, 0], [0.04, 0], [0.075, 0.06], [0.072, 0.065], [0, 0.03]], M.ceramicBlack); b.position.set(0.06 + i * 0.13, 1.06, -0.05 - (i % 2) * 0.12); g.add(b);
    g.add(sph(0.06, colorMat('#fbf8f0', 0.8), 0.06 + i * 0.13, 1.115, -0.05 - (i % 2) * 0.12, 1, 0.45, 1, 14));
  }
  return g;
}
export function saladBar() {
  const g = new THREE.Group();
  g.add(counterBase(M.chrome, 0.08));
  const cols = ['#6d9558', '#d9402e', '#f2d36b', '#8fbf5a', '#f4efe6', '#7a4a3a'];
  for (let i = 0; i < 6; i++) {
    const x = -0.27 + (i % 3) * 0.27, z = -0.25 + Math.floor(i / 3) * 0.2;
    g.add(rbox(0.22, 0.05, 0.16, 0.01, M.steel, x, 1.11, z));
    for (let k = 0; k < 4; k++) g.add(sph(0.03, colorMat(cols[i], 0.6), x - 0.05 + (k % 2) * 0.1, 1.14, z - 0.03 + (k >> 1) * 0.06, 1, 0.6, 1, 10));
  }
  const hood = rbox(0.82, 0.02, 0.4, 0.01, M.glass, 0, 1.36, -0.15); g.add(hood);
  for (const x of [-0.39, 0.39]) g.add(cyl(0.008, 0.008, 0.22, M.chrome, x, 1.25, -0.15, 8));
  return g;
}
export function wokStation() {
  const g = new THREE.Group();
  g.add(counterBase(M.steel, 0.14));
  const ring = torus(0.12, 0.02, Math.PI * 2, M.iron, 18); ring.rotation.x = Math.PI / 2; ring.position.set(-0.1, 1.15, -0.15); g.add(ring);
  g.add(cyl(0.1, 0.1, 0.01, std({ color: '#ff9a3a', emissive: '#ff6a1a', emissiveIntensity: 1.2 }), -0.1, 1.145, -0.15, 18));
  const wok = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 10, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), M.iron);
  wok.position.set(-0.1, 1.33, -0.15); g.add(wok);
  g.add(sph(0.12, colorMat('#efcf6a', 0.7), -0.1, 1.19, -0.15, 1, 0.3, 1, 16));
  const h = cyl(0.015, 0.015, 0.26, M.walnut, 0.16, 1.22, -0.15, 8); h.rotation.z = Math.PI / 2; g.add(h);
  g.add(cyl(0.05, 0.05, 0.12, M.ceramic, 0.3, 1.2, -0.28, 14));
  return g;
}
export function fryerStation() {
  const g = new THREE.Group();
  g.add(rbox(0.7, 0.24, 0.44, 0.02, M.steel, 0, 1.12, -0.16));
  for (const x of [-0.16, 0.16]) {
    g.add(rbox(0.26, 0.02, 0.3, 0.01, colorMat('#c9902e', 0.25), x, 1.24, -0.16));
    const basket = rbox(0.2, 0.1, 0.18, 0.01, M.chrome, x, 1.3, -0.12); g.add(basket);
    g.add(cyl(0.01, 0.01, 0.2, M.blackGloss, x, 1.36, 0.02, 8).rotateX(Math.PI / 2.6));
  }
  for (let i = 0; i < 8; i++) g.add(rbox(0.018, 0.018, 0.1, 0.005, colorMat('#f2c24e', 0.6), -0.2 + i * 0.012, 1.36, -0.12).rotateY(i));
  return g;
}
export function soupStation() {
  const g = new THREE.Group();
  g.add(counterBase(M.iron, 0.1));
  const pot = lathe([[0, 0], [0.16, 0], [0.17, 0.24], [0.18, 0.25], [0.16, 0.25], [0, 0.02]], M.copper); pot.position.set(-0.12, 1.1, -0.17); g.add(pot);
  g.add(cyl(0.155, 0.155, 0.01, colorMat('#f0a43a', 0.4), -0.12, 1.32, -0.17, 24));
  const ladle = tube([[-0.12, 1.32, -0.17], [-0.05, 1.45, -0.12], [0.0, 1.5, -0.1]], 0.01, M.steel, 12); g.add(ladle);
  for (let i = 0; i < 2; i++) { const b = lathe([[0, 0], [0.05, 0], [0.08, 0.06], [0, 0.03]], M.ceramic); b.position.set(0.2, 1.1 + i * 0.04, -0.05); g.add(b); }
  return g;
}
export function charcoalGrill() {
  const g = new THREE.Group();
  g.add(rbox(0.78, 0.18, 0.46, 0.02, M.blackGloss, 0, 1.09, -0.16));
  g.add(rbox(0.7, 0.02, 0.38, 0.005, std({ color: '#ff7a2a', emissive: '#ff4a1a', emissiveIntensity: 0.9, roughness: 1 }), 0, 1.17, -0.16));
  for (let i = 0; i < 9; i++) g.add(cyl(0.006, 0.006, 0.38, M.steel, -0.32 + i * 0.08, 1.2, -0.16, 6).rotateX(Math.PI / 2));
  g.add(rbox(0.2, 0.04, 0.12, 0.02, colorMat('#7a3a26', 0.6), -0.14, 1.23, -0.18));
  for (let i = 0; i < 3; i++) { const sk = cyl(0.004, 0.004, 0.3, M.ash, 0.18, 1.225, -0.28 + i * 0.1, 6); sk.rotation.z = Math.PI / 2; g.add(sk); for (let k = 0; k < 4; k++) g.add(sph(0.022, colorMat('#a8562e', 0.6), 0.08 + k * 0.06, 1.225, -0.28 + i * 0.1, 1, 1, 1, 8)); }
  return g;
}
export function seafoodStation() {
  const g = new THREE.Group();
  g.add(counterBase(M.chrome, 0.08));
  g.add(rbox(0.74, 0.04, 0.42, 0.02, colorMat('#e6f3f6', 0.2), 0, 1.11, -0.15));
  for (let i = 0; i < 18; i++) g.add(sph(0.025, colorMat('#f4fbfc', 0.1), -0.32 + (i % 6) * 0.13, 1.135, -0.3 + Math.floor(i / 6) * 0.13, 1, 0.7, 1, 8));
  // 生蠔
  for (let i = 0; i < 3; i++) { g.add(sph(0.05, colorMat('#8a8478', 0.8), -0.24 + i * 0.12, 1.15, -0.06, 1.2, 0.35, 0.9, 12)); g.add(sph(0.03, colorMat('#e9e2cf', 0.3), -0.24 + i * 0.12, 1.165, -0.06, 1.2, 0.3, 0.9, 10)); }
  // 龍蝦
  g.add(sph(0.06, colorMat('#d9402e', 0.4), 0.2, 1.16, -0.2, 2.2, 0.7, 1, 14));
  for (const s2 of [-1, 1]) g.add(sph(0.03, colorMat('#d9402e', 0.4), 0.06, 1.16, -0.2 + s2 * 0.07, 1.4, 0.8, 1, 10));
  return g;
}
export function koreanStation() {
  const g = new THREE.Group();
  g.add(counterBase(M.walnutDark, 0.08));
  for (const [x, z] of [[-0.2, -0.18], [0.12, -0.24]]) {
    const pot = lathe([[0, 0], [0.11, 0], [0.13, 0.09], [0.12, 0.1], [0, 0.03]], M.ceramicBlack); pot.position.set(x, 1.08, z); g.add(pot);
    g.add(cyl(0.11, 0.11, 0.01, colorMat('#d9402e', 0.5), x, 1.17, z, 20));
    g.add(sph(0.025, colorMat('#f2c23a', 0.4), x, 1.18, z));
  }
  for (let i = 0; i < 3; i++) { const b = cyl(0.045, 0.04, 0.03, M.steel, 0.24, 1.1, -0.04 - i * 0.1, 14); g.add(b); g.add(cyl(0.04, 0.04, 0.005, colorMat(['#d9402e', '#6d9558', '#f2d36b'][i], 0.6), 0.24, 1.116, -0.04 - i * 0.1, 14)); }
  return g;
}
export function sushiCounter() {
  const g = new THREE.Group();
  g.add(rbox(0.84, 0.07, 0.48, 0.01, M.ash, 0, 1.035, -0.15));
  const board = rbox(0.5, 0.05, 0.2, 0.01, M.oak, -0.08, 1.095, -0.08); g.add(board);
  for (let i = 0; i < 5; i++) {
    g.add(rbox(0.07, 0.035, 0.045, 0.015, colorMat('#fbf8f0', 0.9), -0.28 + i * 0.1, 1.135, -0.08));
    g.add(rbox(0.08, 0.012, 0.05, 0.006, colorMat(i % 2 ? '#f08a6a' : '#d9402e', 0.3), -0.28 + i * 0.1, 1.158, -0.08));
  }
  const glass = rbox(0.8, 0.18, 0.02, 0.01, M.glass, 0, 1.17, -0.33); g.add(glass);
  return g;
}

export const MACHINE_BUILDERS = {
  roaster_classic: () => roaster(0), roaster_forest: () => roaster(1), roaster_navy: () => roaster(2),
  espresso_steel: () => espressoMachine(0), espresso_cream: () => espressoMachine(1), espresso_green: () => espressoMachine(2),
  toaster: () => toaster(), oven: () => oven(0), fridge: () => dessertFridge(), waffle: () => waffleIron(), bench: () => pastryBench(),
  griddle: () => griddle(), stove: () => pastaStove(), press: () => paniniPress(), pizza: () => pizzaOven(),
  gelato: gelatoCase, crepe: crepeGriddle, patisserie: patisserieOven, wagashi: wagashiCounter,
  rice: riceStation, salad: saladBar, wok: wokStation, fryer: fryerStation, soup: soupStation,
  grill: charcoalGrill, seafood: seafoodStation, korean: koreanStation, sushi: sushiCounter,
};

// 2 樓的樓梯口（往下）
export function staircase() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const st = rbox(0.9, 0.04, 0.2, 0.01, M.walnut, 0, -i * 0.16 + 0.02, -0.4 + i * 0.2);
    g.add(st);
  }
  g.add(rbox(0.92, 0.02, 1.0, 0.005, colorMat('#2a1a12', 0.9), 0, -0.85, 0));
  for (const x of [-0.46, 0.46]) {
    g.add(rbox(0.04, 0.9, 0.04, 0.01, M.brass, x, 0.45, -0.46));
    g.add(tube([[x, 0.9, -0.46], [x, 0.9, 0.0], [x, 0.4, 0.5]], 0.02, M.brass, 16));
    for (let k = 0; k < 4; k++) g.add(cyl(0.008, 0.008, 0.85, M.iron, x, 0.45 - k * 0.12, -0.3 + k * 0.2, 6));
  }
  return g;
}
