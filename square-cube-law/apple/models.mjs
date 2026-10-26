// Общие 3D-модели, собранные из примитивов (эстетика «керамической» продуктовой съёмки Apple).
// У каждой модели есть pose(...) — выставляет позу из параметров (без накопленного состояния).
import { THREE, clamp, lerp, shadowsOn } from './engine.mjs';

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
// Стержень (цилиндр со сферическими концами) между двумя точками; set(a, b) переставляет его.
export function rod(mat, r = .03, seg = 14) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, seg, 1, true), mat);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(r, seg, 10), mat), s2 = s1.clone();
  g.add(cyl, s1, s2);
  g.set = (a, b) => {
    _a.fromArray(a); _b.fromArray(b); _d.subVectors(_b, _a);
    const len = Math.max(_d.length(), 1e-4);
    cyl.position.copy(_a).addScaledVector(_d, .5);
    cyl.quaternion.setFromUnitVectors(UP, _d.normalize());
    cyl.scale.set(1, len, 1);
    s1.position.copy(_a); s2.position.copy(_b);
  };
  return g;
}
function ellipsoid(mat, rx, ry, rz, pos, seg = 40) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * .7)), mat);
  m.scale.set(rx, ry, rz); m.position.fromArray(pos); return m;
}

// ---------- муравей (длина ≈ 1.45, высота ≈ 0.8, смотрит в +X, стоит на y=0) ----------
// pose({ buckle: 0..1 — подламывание лап, walk: фаза шага, drop: доп. просадка })
export function makeAnt(mat = null) {
  mat = mat || new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .42, clearcoat: .35 });
  const g = new THREE.Group(), body = new THREE.Group();
  body.add(
    ellipsoid(mat, .38, .26, .27, [-.52, 0, 0]),          // брюшко
    ellipsoid(mat, .07, .07, .07, [-.12, -.01, 0], 20),   // стебелёк
    ellipsoid(mat, .2, .11, .11, [.1, .02, 0]),           // грудь
    ellipsoid(mat, .15, .14, .13, [.42, .1, 0]),          // голова
  );
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: .2, clearcoat: 1 });
  body.add(ellipsoid(eyeMat, .04, .045, .03, [.49, .14, .1], 16), ellipsoid(eyeMat, .04, .045, .03, [.49, .14, -.1], 16));
  const ant1 = rod(mat, .016), ant2 = rod(mat, .016), ant3 = rod(mat, .014), ant4 = rod(mat, .014);
  body.add(ant1, ant2, ant3, ant4);
  g.add(body);
  const legs = [];
  for (let i = 0; i < 3; i++) for (const side of [1, -1]) {
    const femur = rod(mat, .022), tibia = rod(mat, .018);
    g.add(femur, tibia); legs.push({ i, side, femur, tibia });
  }
  g.pose = ({ buckle = 0, walk = null, drop = 0 } = {}) => {
    const by = lerp(.42, .14, buckle) - drop;
    body.position.y = by; body.rotation.z = buckle * .06;
    ant1.set([.5, .2, .06], [.66, .42 - buckle * .12, .18]); ant2.set([.66, .42 - buckle * .12, .18], [.86, .44 - buckle * .2, .22]);
    ant3.set([.5, .2, -.06], [.64, .44 - buckle * .12, -.16]); ant4.set([.64, .44 - buckle * .12, -.16], [.84, .48 - buckle * .2, -.22]);
    const hipX = [.2, .1, 0], footX = [.62, .14, -.42], kneeX = [.4, .12, -.22];
    legs.forEach(({ i, side, femur, tibia }) => {
      const ph = walk == null ? 0 : Math.sin(walk + i * 2.1 + (side > 0 ? 0 : Math.PI));
      const lift = walk == null ? 0 : Math.max(0, ph) * .08;
      const spread = 1 + buckle * .45;
      const hip = [hipX[i], by - .02, side * .07];
      const knee = [kneeX[i] * spread + ph * .04, lerp(by + .2, by + .06, buckle), side * lerp(.32, .5, buckle)];
      const foot = [footX[i] * spread + ph * .08, lift, side * lerp(.42, .62, buckle)];
      femur.set(hip, knee); tibia.set(knee, foot);
    });
  };
  g.pose();
  return shadowsOn(g);
}

// ---------- слон (длина ≈ 3.4, высота ≈ 2.9, смотрит в +X) ----------
// pose({ flap: -1..1 — взмах ушей, squat: 0..1 — присед, trunk: -1..1 — изгиб хобота })
export function makeElephant(mat = null) {
  mat = mat || new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .45, clearcoat: .3 });
  const g = new THREE.Group(), body = new THREE.Group();
  body.add(ellipsoid(mat, 1.25, .88, .82, [0, 0, 0]));
  const head = new THREE.Group(); head.position.set(1.2, .28, 0); body.add(head);
  head.add(ellipsoid(mat, .58, .6, .56, [0, 0, 0]));
  const earGeo = new THREE.SphereGeometry(1, 32, 20);
  const earL = new THREE.Mesh(earGeo, mat), earR = new THREE.Mesh(earGeo, mat);
  earL.scale.set(.06, .62, .5); earR.scale.copy(earL.scale);
  const pivL = new THREE.Group(), pivR = new THREE.Group();
  pivL.position.set(-.12, .08, .42); pivR.position.set(-.12, .08, -.42);
  earL.position.set(-.05, -.05, .38); earR.position.set(-.05, -.05, -.38);
  pivL.add(earL); pivR.add(earR); head.add(pivL, pivR);
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: .2, clearcoat: 1 });
  head.add(ellipsoid(eyeMat, .05, .05, .05, [.36, .14, .36], 16), ellipsoid(eyeMat, .05, .05, .05, [.36, .14, -.36], 16));
  const tuskMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .25, clearcoat: 1 });
  const tusk1 = rod(tuskMat, .045), tusk2 = rod(tuskMat, .045);
  tusk1.set([.42, -.32, .2], [.72, -.5, .26]); tusk2.set([.42, -.32, -.2], [.72, -.5, -.26]);
  head.add(tusk1, tusk2);
  const trunk = []; for (let i = 0; i < 8; i++) { const r = rod(mat, lerp(.17, .07, i / 7)); head.add(r); trunk.push(r); }
  const tail = rod(mat, .035); body.add(tail); tail.set([-1.22, .2, 0], [-1.42, -.45, 0]);
  g.add(body);
  const legs = [[.72, .42], [.72, -.42], [-.7, .42], [-.7, -.42]].map(([x, z]) => { const l = rod(mat, .24, 24); g.add(l); return { l, x, z }; });
  g.pose = ({ flap = 0, squat = 0, trunk: tb = 0 } = {}) => {
    const by = 2.0 - squat * .3;
    body.position.y = by;
    pivL.rotation.y = -.15 - flap * .7; pivR.rotation.y = .15 + flap * .7;
    let p = [.5, -.1, 0], ang = -.35;
    trunk.forEach((r, i) => {
      ang -= .18 + tb * .1 * (i / 7);
      const q = [p[0] + Math.cos(ang) * .2, p[1] + Math.sin(ang) * .2, 0];
      r.set(p, q); p = q;
    });
    legs.forEach(({ l, x, z }) => l.set([x, by - .4, z], [x, .24, z]));
  };
  g.pose();
  return shadowsOn(g);
}

// ---------- мышь / землеройка (длина ≈ 1.2, высота ≈ 0.55, смотрит в +X) ----------
export function makeMouse(mat = null) {
  mat = mat || new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .45, clearcoat: .3 });
  const g = new THREE.Group(), body = new THREE.Group();
  body.add(ellipsoid(mat, .42, .26, .26, [0, 0, 0]), ellipsoid(mat, .22, .17, .17, [.36, .05, 0]));
  const snout = new THREE.Mesh(new THREE.ConeGeometry(.1, .26, 24), mat); snout.rotation.z = -Math.PI / 2; snout.position.set(.62, .02, 0); body.add(snout);
  const nose = ellipsoid(new THREE.MeshPhysicalMaterial({ color: '#222', roughness: .3 }), .035, .035, .035, [.75, .02, 0], 12); body.add(nose);
  const earGeo = new THREE.CylinderGeometry(.11, .11, .02, 28);
  for (const s of [1, -1]) { const e = new THREE.Mesh(earGeo, mat); e.rotation.x = Math.PI / 2 - s * .35; e.rotation.z = .3; e.position.set(.3, .23, s * .11); body.add(e); }
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: .2, clearcoat: 1 });
  body.add(ellipsoid(eyeMat, .03, .03, .03, [.5, .1, .1], 12), ellipsoid(eyeMat, .03, .03, .03, [.5, .1, -.1], 12));
  const tail = []; for (let i = 0; i < 6; i++) { const r = rod(mat, .022); body.add(r); tail.push(r); }
  g.add(body);
  const feet = [[.22, .12], [.22, -.12], [-.2, .14], [-.2, -.14]].map(([x, z]) => { const f = ellipsoid(mat, .08, .04, .05, [x, .04, z], 14); g.add(f); return f; });
  g.pose = ({ wag = 0, squash = 0 } = {}) => {
    body.position.y = .3 - squash * .1; body.scale.set(1 + squash * .15, 1 - squash * .25, 1 + squash * .15);
    let p = [-.4, -.05, 0];
    tail.forEach((r, i) => { const q = [p[0] - .12, p[1] + Math.sin(i * .9 + wag) * .05 + .015 * i, Math.cos(i * .7 + wag) * .04]; r.set(p, q); p = q; });
  };
  g.pose();
  return shadowsOn(g);
}

// ---------- блоха (длина ≈ 0.5) ----------
export function makeFlea(mat = null) {
  mat = mat || new THREE.MeshPhysicalMaterial({ color: '#2A2A2C', roughness: .3, clearcoat: 1 });
  const g = new THREE.Group();
  const b = ellipsoid(mat, .22, .16, .1, [0, .2, 0]); b.rotation.z = -.3; g.add(b);
  g.add(ellipsoid(mat, .07, .07, .06, [.2, .24, 0], 18));
  const legs = [];
  for (const s of [1, -1]) {
    const l1 = rod(mat, .018), l2 = rod(mat, .015), f = rod(mat, .014);
    g.add(l1, l2, f); legs.push({ s, l1, l2, f });
  }
  g.pose = ({ crouch = 0 } = {}) => {
    legs.forEach(({ s, l1, l2, f }) => {
      const k = [-.22, lerp(.38, .3, crouch), s * .1];
      l1.set([-.06, .16, s * .06], k); l2.set(k, [-.3 + crouch * .08, 0, s * .12]);
      f.set([.12, .12, s * .06], [.2, 0, s * .1]);
    });
  };
  g.pose();
  return shadowsOn(g);
}

// ---------- кость (вдоль X, центр в 0) ----------
export function makeBone(len = 2, th = .22, mat = null) {
  mat = mat || new THREE.MeshPhysicalMaterial({ color: '#F4F2EC', roughness: .5, clearcoat: .25 });
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(th / 2, th / 2, len - th * 1.4, 40), mat);
  shaft.rotation.z = Math.PI / 2; g.add(shaft);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(th * .5, 32, 22), mat);
    k.position.set(sx * (len / 2 - th * .55), 0, sz * th * .32); g.add(k);
  }
  return shadowsOn(g);
}
