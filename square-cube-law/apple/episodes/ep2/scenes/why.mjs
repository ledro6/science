// WHY (36.81 – 45.80 с), белый фон. Ветвящаяся сеть сосудов — фрактальное дерево из чёрной глянцевой керамики.
// w1: из пола поднимается один сосуд (ствол), по нему бежит пульс; «Почему ¾», «Учёные спорят до сих пор».
// w2: на «ветвящаяся» дерево ветвится уровень за уровнем (7 уровней, 127 сосудов, радиусы по закону Мюррея),
//     камера отъезжает по орбите; на «доставляет кровь» по сети бегут светлые волны; на «клетке» — 64 клетки на концах.
import {
  defineScene, makeStage, project, atext, line, dot, P, Wd, WdE, C, E, rng, clamp, lerp,
  eApple, eIn, eInOut, eEase, eSpring, THREE, MAT,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { frame, lerp3, formula } from '../lib.mjs';

const LEVELS = 7;
function TT() {
  return {
    why: Wd('w1', 'Почему'), tri: Wd('w1', 'три'), sci: Wd('w1', 'учёные'),
    ver: Wd('w2', 'Одна'), branch: Wd('w2', 'ветвящаяся'), net: Wd('w2', 'сеть'), ves: Wd('w2', 'сосудов'),
    deliver: Wd('w2', 'доставляет'), blood: Wd('w2', 'кровь'), each: Wd('w2', 'каждой'), cell: Wd('w2', 'клетке'),
  };
}
// дерево: детерминированное, плоскость ветвления поворачивается на ~90° на каждом уровне
function buildTree() {
  const R = rng(7), segs = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const grow = (p, dir, len, r, lvl, roll, parent) => {
    const end = p.clone().addScaledVector(dir, len);
    const id = segs.length;
    segs.push({ p, end, dir: dir.clone(), len, r, lvl, parent });
    if (lvl >= LEVELS - 1) return;
    // ось ветвления ⟂ dir, повёрнутая на roll
    const a0 = Math.abs(dir.y) < .9 ? UP.clone() : new THREE.Vector3(1, 0, 0);
    const ax = new THREE.Vector3().crossVectors(dir, a0).normalize().applyAxisAngle(dir, roll);
    for (const sgn of [-1, 1]) {
      const th = (lvl === 0 ? .52 : .46) + (R() - .5) * .16;
      let nd = dir.clone().applyAxisAngle(ax, sgn * th);
      nd.y += .12; nd.normalize();                 // лёгкая тяга вверх — крона, а не шар
      grow(end, nd, len * (.8 + (R() - .5) * .08), r * .79, lvl + 1, roll + Math.PI / 2 + (R() - .5) * .5, id);
    }
  };
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 1.55, .12, 0, .3, -1);
  return segs;
}

defineScene('why', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const T = TT();
    const segs = buildTree();
    const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .26, clearcoat: 1, clearcoatRoughness: .1 });
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true); cyl.translate(0, .5, 0);
    const tubes = new THREE.InstancedMesh(cyl, mat, segs.length);
    const joints = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 18, 12), mat, segs.length);
    tubes.castShadow = joints.castShadow = true; tubes.frustumCulled = joints.frustumCulled = false;
    const leaves = segs.filter(s => s.lvl === LEVELS - 1);
    const cells = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), MAT.aluminium(), leaves.length);
    cells.castShadow = true; cells.frustumCulled = false;
    const tree = new THREE.Group(); tree.scale.setScalar(.72); tree.add(tubes, joints, cells); stage.root.add(tree);
    const R = rng(3); leaves.forEach(l => l.d = R());
    // время роста каждого уровня
    T.lv = l => l === 0 ? [T.why - .3, 1.6] : [T.branch - .25 + (l - 1) * .4, .55];
    return { stage, T, segs, leaves, tubes, joints, cells, c: new THREE.Color(), m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), sv: new THREE.Vector3(), UP: new THREE.Vector3(0, 1, 0) };
  },

  update(t, s, st) {
    const { stage, T, segs, leaves, tubes, joints, cells, m4, q, v, sv, UP, c } = st, cam = stage.camera;
    const BASE = new THREE.Color('#151517'), HI = new THREE.Color('#B9B9BE');
    segs.forEach((g, i) => {
      const [t0, d] = T.lv(g.lvl);
      const k = eInOut(clamp((t - t0) / d));
      const len = Math.max(g.len * k, 1e-4), r = g.r * (k > 0 ? 1 : 0) + 1e-5;
      q.setFromUnitVectors(UP, g.dir);
      m4.compose(g.p, q, sv.set(r, len, r)); tubes.setMatrixAt(i, m4);
      v.copy(g.p).addScaledVector(g.dir, len);
      const jr = k > 0 ? r : 1e-5;
      m4.compose(v, q.identity(), sv.setScalar(jr)); joints.setMatrixAt(i, m4);
      // пульс: на стволе — с самого начала (раз в секунду), по всей сети — с «доставляет»
      const wave = (ph, lvl) => { const x = ph - lvl; return Math.exp(-x * x * 2.2); };
      let hi = 0;
      if (g.lvl === 0) hi = Math.max(0, Math.sin((t - T.why) * Math.PI * 1.1)) ** 6 * P(t, T.why + .6, .5) * (1 - P(t, T.branch - .3, .3));
      const fl = (t - T.deliver + .1) * 4.2;
      if (fl > -2) for (let w = 0; w < 3; w++) hi = Math.max(hi, wave(fl - w * 3.2, g.lvl) * (fl - w * 3.2 > -1.5 ? 1 : 0));
      c.copy(BASE).lerp(HI, clamp(hi) * .9);
      tubes.setColorAt(i, c); joints.setColorAt(i, c);
    });
    tubes.instanceMatrix.needsUpdate = joints.instanceMatrix.needsUpdate = true;
    tubes.instanceColor.needsUpdate = joints.instanceColor.needsUpdate = true;
    // клетки на концах
    leaves.forEach((l, i) => {
      const k = eSpring(clamp((t - (T.each - .05 + l.d * .45)) / .5));
      v.copy(l.end).addScaledVector(l.dir, .07 * k);
      m4.compose(v, q.identity(), sv.setScalar(Math.max(.075 * k, 1e-5))); cells.setMatrixAt(i, m4);
    });
    cells.instanceMatrix.needsUpdate = true;
    // камера: близко к стволу → отъезд по орбите вместе с ростом кроны
    const pull = P(t, T.branch - .7, 2.4, eInOut);
    const tg = lerp3([0, .8, 0], [0, 2.2, 0], pull);
    const d = Math.exp(lerp(Math.log(8), Math.log(22), pull));
    frame(cam, tg, d, 18 + (t - s.start) * 5.5, lerp(10, 14, pull), 540, lerp(840, 850, pull));
  },

  draw2d(t, s, st) {
    const { stage, T, leaves } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // w1
    const o1 = T.ver - .25;
    atext('Почему', 450, 450, T.why, t, { size: 130, w: 600, col: ink, align: 'center', track: -.03, out: o1 });
    atext('¾', 772, 452, T.tri - .05, t, { size: 140, w: 600, col: ink, align: 'center', track: 0, blur: 16, scale0: 1.12, out: o1 });
    atext('Учёные спорят до сих пор', 540, 540, T.sci, t, { size: 46, w: 500, col: sub, track: -.005, out: o1 });
    // w2
    atext('Одна из версий', 540, 300, T.ver, t, { size: 44, w: 500, col: sub, track: -.005 });
    { const sz = 120, w1 = ENG.measure('Сеть ', sz, 600, -.03), w2 = ENG.measure('сосудов', sz, 600, -.03), x0 = 540 - (w1 + w2) / 2;
      atext('Сеть', x0, 420, T.net - .05, t, { size: sz, w: 600, col: ink, align: 'left', track: -.03 });
      atext('сосудов', x0 + w1, 420, T.ves - .05, t, { size: sz, w: 600, col: ink, align: 'left', track: -.03 }); }
    // выноска к одной из клеток
    const leaf = leaves.reduce((b, l) => { const [x] = project(cam, l.end.x * .72, l.end.y * .72, l.end.z * .72); return x > b.x && x < 900 ? { x, l } : b; }, { x: -1, l: leaves[0] }).l;
    const [lx, ly] = project(cam, leaf.end.x * .72, leaf.end.y * .72, leaf.end.z * .72);
    const a = P(t, T.cell, .3);
    if (a > .003) {
      ENG.callout(lx, ly, lx, ly + 110, T.cell, t, ink, 1);
      atext('клетка', lx, ly + 152, T.cell + .15, t, { size: 38, w: 600, col: ink, align: 'center', track: -.01, dy: 16 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.why - .3, 'thud', .3, .8);
    add(T.tri, 'tick', .2);
    add(T.branch - .25, 'rise', .3, .9);
    for (let l = 1; l < LEVELS; l++) add(T.branch - .25 + (l - 1) * .4, 'click', .1 + l * .015, 1 + l * .07);
    add(T.deliver, 'swell', .3);
    add(T.cell, 'shimmer', .3);
  },
});
