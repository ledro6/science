// SPHERE (7.3 – 21.7 с), белый фон — «страница продукта».
// p1 — точка-лампа; свет разлетается во все стороны (InstancedMesh-фотоны), ложится на стеклянную сферу r = 1
//      с рёбрами-меридианами; на «сферы» — пучок (тонкая пирамида) и один графитовый квадратик 1×1 на поверхности;
// p2 — вторая сфера растёт до r = 2, пучок вытягивается; та же энергия ложится на 2×2 = 4 квадратика,
//      каждый вчетверо бледнее (прозрачность ∝ 1/r²); «×4 площадь»;
// p3 — третья сфера r = 3, 3×3 = 9 бледных квадратиков; ряд «×2 → 1/4», «×3 → 1/9», «×10 → 1/100» (дробь — красным).
import {
  defineScene, makeStage, orbit, project, atext, line, dot, measure, P, Wd, E, THREE, MAT, clamp, lerp,
  eApple, eInOut, eIn, eSpring, rng,
} from '../../../engine.mjs';
import { ctx, keys, bump } from './kit.mjs';

const INK = '#1D1D1F';
const A = .36;                                 // полуширина пучка в касательной плоскости (гномоническая), рад ≈ 0.2
const AX = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2 - .42, .95);   // ось пучка: вправо-вверх-к камере
const E1 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), AX).normalize();
const E2 = new THREE.Vector3().crossVectors(AX, E1).normalize();
const NPH = 420;

function TT() {
  return {
    svet: Wd('p1', 'Свет'), razl: Wd('p1', 'разлетается'), lozh: Wd('p1', 'ложится'), pov: Wd('p1', 'поверхность'), sf: Wd('p1', 'сферы'),
    ot: Wd('p2', 'Отойди'), vd: Wd('p2', 'вдвое'), ta: Wd('p2', 'та'), en: Wd('p2', 'энергия'), razm: Wd('p2', 'размазана'),
    pl: Wd('p2', 'площадью'), x4: Wd('p2', 'четыре'), bol: Wd('p2', 'больше'),
    vt: Wd('p3', 'Втрое'), dev: Wd('p3', 'девять'), sl: Wd('p3', 'слабее'), vds: Wd('p3', 'Вдесятеро'), sto: Wd('p3', 'сто'), end3: E('p3'),
  };
}
// точка поверхности сферы радиуса R по гномоническим координатам (u, v) пучка
const surf = (R, u, v, out = new THREE.Vector3()) => out.copy(AX).addScaledVector(E1, u).addScaledVector(E2, v).normalize().multiplyScalar(R);

// каркас единичной сферы: меридианы и параллели
function wireGeom() {
  const pts = [], N = 72;
  for (let m = 0; m < 12; m++) {
    const ph = m / 12 * Math.PI * 2;
    for (let i = 0; i < N / 2; i++) {
      const a = i / (N / 2) * Math.PI, b = (i + 1) / (N / 2) * Math.PI;
      pts.push(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph), Math.sin(b) * Math.cos(ph), Math.cos(b), Math.sin(b) * Math.sin(ph));
    }
  }
  for (const lat of [-60, -30, 0, 30, 60]) {
    const y = Math.sin(lat * Math.PI / 180), r = Math.cos(lat * Math.PI / 180);
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2;
      pts.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b));
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
}
// изогнутый квадратик на сфере R: [u0,u1]×[v0,v1]
function cellGeom(R, u0, u1, v0, v1, seg = 6) {
  const g = new THREE.PlaneGeometry(1, 1, seg, seg), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + .5, y = p.getY(i) + .5;
    surf(R * 1.004, lerp(u0, u1, x), lerp(v0, v1, y), v); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
// контур квадратика (линии по сфере)
function cellEdge(R, u0, u1, v0, v1, seg = 10) {
  const pts = [], v = new THREE.Vector3(), w = new THREE.Vector3();
  const side = (fa, fb) => { for (let i = 0; i < seg; i++) { fa(i / seg, v); fa((i + 1) / seg, w); pts.push(v.x, v.y, v.z, w.x, w.y, w.z); } };
  const R2 = R * 1.006;
  side((s, o) => surf(R2, lerp(u0, u1, s), v0, o)); side((s, o) => surf(R2, u1, lerp(v0, v1, s), o));
  side((s, o) => surf(R2, lerp(u1, u0, s), v1, o)); side((s, o) => surf(R2, u0, lerp(v1, v0, s), o));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
}

defineScene('sphere', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    stage.camera.far = 400; stage.camera.updateProjectionMatrix();
    const T = TT();
    // лампа — графитовая «точка» с глянцем
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.07, 32, 24), MAT.ceramicBlack());
    // фотоны: равномерные направления (спираль Фибоначчи)
    const R = rng(5), ph = [];
    for (let i = 0; i < NPH; i++) {
      const y = 1 - 2 * (i + .5) / NPH, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      ph.push({ d: new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)), o: R(), s: .7 + R() * .6 });
    }
    const phMat = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: .8 });
    const photons = new THREE.InstancedMesh(new THREE.SphereGeometry(.013, 8, 6), phMat, NPH);
    photons.frustumCulled = false;
    // три стеклянные сферы r = 1, 2, 3
    const wire = wireGeom();
    const shells = [1, 2, 3].map(Rk => {
      const gm = new THREE.MeshPhysicalMaterial({ color: '#E6EAF0', roughness: .08, transparent: true, opacity: .22, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), gm);
      const wm = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .2, depthWrite: false });
      const w = new THREE.LineSegments(wire, wm);
      const grp = new THREE.Group(); grp.add(mesh, w);
      // квадратики пучка: k×k на сфере радиуса k (в мировых единицах, поэтому вне grp)
      const cells = new THREE.Group();
      const cm = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false });
      const em = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .9 });
      const n = Rk, list = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const u0 = -A + 2 * A * i / n, u1 = -A + 2 * A * (i + 1) / n, v0 = -A + 2 * A * j / n, v1 = -A + 2 * A * (j + 1) / n;
        const c = new THREE.Mesh(cellGeom(Rk, u0, u1, v0, v1), cm);
        const e = new THREE.LineSegments(cellEdge(Rk, u0, u1, v0, v1), em);
        cells.add(c, e); list.push({ c, e, d: Math.abs(i - (n - 1) / 2) + Math.abs(j - (n - 1) / 2) });
      }
      return { Rk, grp, gm, wm, cells, cm, em, list };
    });
    // пучок: тонкая пирамида от лампы через углы квадратика + 4 ребра
    const corners = [[-A, -A], [A, -A], [A, A], [-A, A]].map(([u, v]) => surf(1, u, v));
    const pyrPos = [];
    for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4]; pyrPos.push(0, 0, 0, a.x, a.y, a.z, b.x, b.y, b.z); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pyrPos, 3));
    const pyrMat = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: .06, side: THREE.DoubleSide, depthWrite: false });
    const pyr = new THREE.Mesh(pg, pyrMat);
    const ep = []; corners.forEach(c => ep.push(0, 0, 0, c.x, c.y, c.z));
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
    const beamE = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .6 }));
    const beam = new THREE.Group(); beam.add(pyr, beamE);
    stage.root.add(lamp, photons, beam, ...shells.map(s => s.grp), ...shells.map(s => s.cells));
    return { stage, T, lamp, photons, ph, shells, beam, pyrMat, beamE };
  },

  update(t, s, st) {
    const { stage, T, lamp, photons, ph, shells, beam, pyrMat, beamE } = st, cam = stage.camera;
    // радиусы сфер: 2-я растёт из 1-й на «вдвое», 3-я — из 2-й на «втрое»
    const g2 = P(t, T.vd - .1, 1.4, eInOut), g3 = P(t, T.vt - .05, 1.4, eInOut);
    const R = [1, lerp(1, 2, g2), lerp(2, 3, g3)];
    const show = [P(t, T.lozh - .1, 1.0, eApple), P(t, T.vd - .15, .4), P(t, T.vt - .1, .4)];
    shells.forEach((sh, i) => {
      sh.grp.visible = show[i] > .003;
      sh.grp.scale.setScalar(R[i] * lerp(.97, 1, show[i]));
      sh.grp.rotation.y = .3 + (t - s.start) * .03;
      sh.gm.opacity = .22 * show[i]; sh.wm.opacity = (i === 0 ? .26 : .2) * show[i];
    });
    // квадратики: та же энергия делится на k² ячеек → каждая в k² раз бледнее
    const cIn = [P(t, T.sf - .05, .6), P(t, T.razm - .1, .9), P(t, T.dev - .5, .9)];
    shells.forEach((sh, i) => {
      const k = i + 1, base = .82 / (k * k);
      const grownK = i === 0 ? 1 : (i === 1 ? P(t, T.vd + 1.2, .2) : P(t, T.vt + 1.3, .2));
      sh.cells.visible = cIn[i] > .003 && grownK > .5;
      sh.list.forEach(({ c, e, d }) => {
        const a = P(t, (i === 0 ? T.sf - .05 : i === 1 ? T.razm - .1 : T.dev - .5) + d * .12, .6);
        c.visible = e.visible = a > .003;
      });
      sh.cm.opacity = base * cIn[i]; sh.em.opacity = .85 * cIn[i];
    });
    // пучок: появляется на «сферы», вытягивается до самой дальней сферы
    const bA = P(t, T.sf + .1, .7);
    beam.visible = bA > .003;
    beam.scale.setScalar(Math.max(R[0], show[1] > .5 ? R[1] : 1, show[2] > .5 ? R[2] : 1));
    pyrMat.opacity = .09 * bA * (1 + 1.2 * bump(t, T.ta + .3, .7)); beamE.material.opacity = .55 * bA;
    // фотоны: летят от лампы во все стороны и «ложатся» на сферу r = 1
    const pA = P(t, T.razl - .3, .6) * (1 - P(t, T.sf + .3, .9, eIn));
    photons.visible = pA > .003;
    if (photons.visible) {
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
      const surfK = P(t, T.lozh - .2, 1.2);
      ph.forEach((p, i) => {
        const u = ((t - T.razl + .3) * .55 * p.s + p.o) % 1;
        const rr = u * lerp(1.6, 1.0, surfK);
        const k = pA * clamp(u * 6) * (1 - surfK * clamp((u - .85) / .15));
        pos.copy(p.d).multiplyScalar(rr); sc.setScalar(Math.max(1e-4, k));
        M.compose(pos, q, sc); photons.setMatrixAt(i, M);
      });
      photons.instanceMatrix.needsUpdate = true;
    }
    lamp.scale.setScalar(P(t, s.start + .1, .8, eSpring) * (1 + .15 * bump(t, T.svet + .1, .4)));
    // камера: дистанция пропорциональна внешней сфере, медленная орбита
    const [d] = keys([[s.start, 9], [T.lozh, 11.5], [T.sf + .4, 13], [T.vd - .1, 13], [T.vd + 1.6, 26], [T.vt - .05, 26], [T.vt + 1.6, 39], [T.vds, 39], [T.vds + 1.5, 41]], t, eInOut);
    orbit(cam, [0, -.004 * d, 0], d, 14 + (t - s.start) * 1.1, 13);
  },

  draw2d(t, s, st) {
    const { stage, T, shells } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // выноски квадратиков: «1×1» на малой сфере, «2×2 = 4» на большой
    const lab = (Rk, txt, t0, tOut, side = 1) => {
      const c = surf(Rk * 1.01, A * side, A);
      const [ax, ay] = project(cam, c.x, c.y, c.z);
      const bx = ax + 90 * side, by = ay - 80;
      const a = 1 - P(t, tOut, .35, eIn);
      if (t < t0 || a <= .003) return;
      const pd = P(t, t0, .25, eApple), pl = P(t, t0 + .1, .4, eApple);
      dot(ax, ay, 5 * pd, ink, a * pd);
      line(ax, ay, lerp(ax, bx, pl), lerp(ay, by, pl), ink, .7 * a, 2);
      atext(txt, bx + 10 * side, by - 10, t0 + .3, t, { size: 44, w: 600, col: ink, a, align: side > 0 ? 'left' : 'right', track: -.01, dy: 14, dur: .6 });
    };
    lab(1, '1×1', T.sf + .2, T.vt - .3, -1);
    lab(2, '2×2', T.razm + .4, T.vt - .3, 1);
    lab(3, '3×3', T.dev - .2, T.vds - .3, 1);

    // p1: подпись
    atext('Свет расходится сферой', 540, 330, T.razl, t, { size: 64, w: 600, col: ink, track: -.02, out: T.ot - .2 });
    // p2: «×4 площадь»
    atext('×4', 540, 470, T.x4, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.vt - .3 });
    atext('площадь', 540, 540, T.x4 + .25, t, { size: 46, w: 500, col: sub, track: -.005, out: T.vt - .3 });
    atext('та же энергия', 540, 330, T.ta - .05, t, { size: 52, w: 600, col: ink, track: -.015, out: T.x4 - .3 });

    // p3: ряд «расстояние → свет»
    const rows = [['×2', '1/4', T.vt - .05], ['×3', '1/9', T.dev], ['×10', '1/100', T.sto]];
    const y0 = 330, dy = 118, size = 96;
    const out = T.end3 + .4;
    atext('расстояние', 380, 250, T.vt, t, { size: 32, w: 500, col: sub, align: 'right', track: 0, out });
    atext('свет', 620, 250, T.vt + .1, t, { size: 32, w: 500, col: sub, align: 'left', track: 0, out });
    rows.forEach(([dist, fr, t0], i) => {
      const y = y0 + i * dy;
      const next = rows[i + 1] ? rows[i + 1][2] : 1e9;
      const ta = i === 2 ? Wd('p3', 'Вдесятеро') : t0;
      atext(dist, 380, y, ta, t, { size, w: 700, col: ink, align: 'right', track: -.04, out });
      atext('→', 500, y - 8, ta + .1, t, { size: 64, w: 500, col: sub, align: 'center', track: 0, out });
      // дробь: красная, пока это последняя строка, затем — монохром
      const isRed = t < next - .05;
      atext(fr, 620, y, t0, t, { size, w: 700, col: isRed ? red : ink, align: 'left', track: -.04, blur: 18, scale0: 1.1, dur: .85, out });
    });
  },

  sfx(add) {
    const T = TT();
    add(T.svet, 'bloom', .3, 1.1);
    add(T.razl, 'shimmer', .25, .9);
    add(T.lozh + .1, 'swell', .22, .8);
    add(T.sf, 'click', .3);
    add(T.vd - .1, 'whoosh', .3, .8);
    add(T.razm, 'shimmer', .22, 1.1);
    add(T.x4, 'chime', .28);
    add(T.vt - .05, 'whoosh', .28, .7);
    add(T.dev, 'chime', .26, .95);
    add(T.sto - 1.5, 'riser', .22);
    add(T.sto, 'impact', .35, .9);
  },
});
