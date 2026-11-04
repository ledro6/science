// FORMULA (11.64 – 25.36 с), светлый фон. «Гравитационная модель» как продуктовый объект.
// f1 — две сферы-экономики разного размера (графит и алюминий) висят над полом, между ними стеклянная трубка
//      потока, по ней в обе стороны бегут «грузы»; формула «T ∝ M₁ · M₂ / D» собирается по словам;
//      на «растёт с размером» сферы растут — трубка толстеет, на «падает с расстоянием» расходятся — тоньше;
// f2 — «как у Ньютона»: на «две массы» подсвечиваются M₁ и M₂, на «расстояние» — D; подпись «Ян Тинберген, 1962».
import { defineScene, makeStage, project, atext, measure, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, frame, keys, dim, bump, collectMats, setLit } from './kit.mjs';

function TT() {
  return {
    torg: Wd('f1', 'Торговля'), mezh: Wd('f1', 'между'), rast: Wd('f1', 'растёт'), raz: Wd('f1', 'размером'), eko: Wd('f1', 'экономик'),
    pad: Wd('f1', 'падает'), ras: Wd('f1', 'расстоянием'),
    kak: Wd('f2', 'Как'), nyu: Wd('f2', 'Ньютона'), dve: Wd('f2', 'две'), mas: Wd('f2', 'массы'), ras2: Wd('f2', 'расстояние'),
    eta: Wd('f2', 'Эту'), yan: Wd('f2', 'Ян'), tin: Wd('f2', 'Тинберген'), tys: Wd('f2', 'тысяча'),
  };
}
const R1 = .42, R2 = .3, NB = 9;                     // радиусы сфер, «грузов» на полосу
// состояние модели во времени: масштаб сфер k и расстояние между центрами d
function model(t, T) {
  const grow = eSpring(clamp((t - T.rast - .05) / 1.1));
  const apart = P(t, T.pad, 1.4, eInOut);
  const mid = P(t, T.kak - .1, 1.4, eInOut);
  const k = lerp(lerp(1, 1.32, grow), 1.16, mid);
  const d = lerp(lerp(2.0, 2.9, apart), 2.4, mid);
  return { k, d };
}
const flowR = (k, d) => .07 * (k * k) / (d / 2.0);     // T ∝ M₁·M₂ / D: радиус трубки потока

defineScene('formula', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3, floorY: -1.35 });
    const grp = new THREE.Group();
    const m1 = new THREE.Mesh(new THREE.SphereGeometry(R1, 48, 34), MAT.graphite());
    const m2 = new THREE.Mesh(new THREE.SphereGeometry(R2, 48, 34), MAT.aluminium());
    m1.castShadow = m2.castShadow = true;
    const tubeMat = MAT.glass(.32); tubeMat.color.set('#B8B8BC');
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true), tubeMat);
    tube.rotation.z = Math.PI / 2; tube.renderOrder = 3;
    const bead = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), MAT.ceramicBlack(), NB * 2);
    bead.frustumCulled = false; bead.castShadow = true;
    grp.add(m1, m2, tube, bead);
    stage.root.add(grp);
    return { stage, grp, m1, m2, tube, bead, mats: collectMats(grp), T: TT() };
  },

  update(t, s, st) {
    const { stage, m1, m2, tube, bead, T } = st, cam = stage.camera, L = stage.lights;
    setLit(st.mats, .25 + .75 * P(t, s.start + .05, 1.0));
    const { k, d } = model(t, T);
    const x1 = -d / 2, x2 = d / 2;
    m1.scale.setScalar(k); m2.scale.setScalar(k);
    m1.position.set(x1, 0, 0); m2.position.set(x2, 0, 0);
    m1.rotation.y = t * .15; m2.rotation.y = -t * .15;
    // трубка «прорастает» от M₁ к M₂ на «между»
    const grow = P(t, T.mezh - .1, .9, eInOut);
    const a = x1 + R1 * k * .9, b = x2 - R2 * k * .9, rf = flowR(k, d) * lerp(.4, 1, grow);
    const len = Math.max(.001, (b - a) * grow);
    tube.scale.set(rf, len, rf); tube.position.set(a + len / 2, 0, 0);
    tube.visible = grow > .01;
    // «грузы»: две полосы навстречу друг другу
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    for (let lane = 0; lane < 2; lane++) for (let i = 0; i < NB; i++) {
      let u = ((t * .32 + i / NB + lane * .5 / NB) % 1);
      if (lane) u = 1 - u;
      const x = a + (b - a) * u, vis = x < a + len;
      const fade = Math.sin(Math.PI * u);
      const r = rf * .55 * (vis ? fade : 0) * grow;
      p.set(x, (lane ? -1 : 1) * rf * .38, 0); sc.setScalar(Math.max(r, 1e-4));
      M.compose(p, q, sc); bead.setMatrixAt(lane * NB + i, M);
    }
    bead.instanceMatrix.needsUpdate = true;
    L.key.position.set(2.5, 9, 6); L.key.intensity = 2.2;
    const [az, el, dist] = keys([[s.start, 34, 13, 16.5], [T.ras + 1, 40, 12, 16.5], [T.eta, 36, 11, 15.8], [s.end, 28, 10, 15.4]], t, eInOut);
    frame(cam, [0, 0, 0], dist, az, el, 540, 940);
  },

  draw2d(t, s, st) {
    const { stage, m1, m2, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const { k, d } = model(t, T);
    // --- формула по словам ---
    const parts = [['T', T.torg], ['∝', T.torg + .25], ['M₁', T.raz], ['·', T.raz + .3], ['M₂', T.eko], ['/', T.ras], ['D', T.ras + .15]];
    const size = 124, w = 600, tr = -.02, sp = measure(' ', size, w, tr) * .9;
    const ws = parts.map(([q]) => measure(q, size, w, tr)), tot = ws.reduce((A, B) => A + B, 0) + sp * (parts.length - 1);
    let cx = 540 - tot / 2;
    const hiM = bump(t, T.dve + .25, .5) + bump(t, T.mas + .2, .5), hiD = bump(t, T.ras2 + .3, .6);
    parts.forEach(([q, t0], i) => {
      const hi = i === 2 || i === 4 ? hiM : i === 6 ? hiD : 0;
      atext(q, cx, 440 - 14 * hi, t0, t, { size, w, col: ink, align: 'left', track: tr, blur: 14, dur: .8 });
      if (hi > .01) { g.save(); g.globalAlpha = hi; g.fillStyle = ink; g.fillRect(cx + 6, 470, ws[i] - 12, 5); g.restore(); }
      cx += ws[i] + sp;
    });
    atext('торговля', 540, 300, T.torg + .3, t, { size: 44, w: 500, col: sub, track: -.005, out: T.kak - .3 });
    atext('как у Ньютона', 540, 300, T.nyu, t, { size: 44, w: 500, col: sub, track: -.005, out: T.yan - .35 });
    atext('Ян Тинберген, 1962', 540, 300, T.yan, t, { size: 48, w: 500, col: sub, track: -.005 });
    // --- подписи у сфер и размерная линия D ---
    const p1 = m1.position.toArray(), p2 = m2.position.toArray();
    const [x1, y1] = project(cam, p1[0], R1 * k + .1, 0), [x2, y2] = project(cam, p2[0], R2 * k + .1, 0);
    const lab = (s0, x, y, t0, hi) => atext(s0, x, y - 22, t0, t, { size: 54 + 6 * hi, w: 600, col: hi > .3 ? ink : sub, track: -.01 });
    lab('M₁', x1, y1, T.raz, hiM); lab('M₂', x2, y2, T.eko, hiM);
    const aD = P(t, T.ras - .05, .6);
    const yD = -Math.max(R1, R2) * k - .22, [dx1, dy1] = project(cam, p1[0], yD, 0), [dx2, dy2] = project(cam, p2[0], yD, 0);
    dim(dx1, dy1, dx2, dy2, aD, hiD > .3 ? ink : sub);
    atext('D', (dx1 + dx2) / 2, (dy1 + dy2) / 2 + 66, T.ras, t, { size: 54 + 6 * hiD, w: 600, col: hiD > .3 ? ink : sub, track: -.01 });
    void d;
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .15, 'thud', .22, .8);
    add(T.torg, 'click', .2, 1);
    add(T.mezh, 'whoosh', .2, 1.1);
    add(T.rast, 'swell', .22, .9);
    add(T.raz, 'click', .2, 1.05);
    add(T.eko, 'click', .18, 1.1);
    add(T.pad, 'whoosh', .22, .8);
    add(T.ras, 'click', .2, .95);
    add(T.dve, 'tick', .14);
    add(T.mas, 'tick', .14, 1.05);
    add(T.ras2, 'tick', .14, .95);
    add(T.yan, 'chime', .22, 1);
  },
});
