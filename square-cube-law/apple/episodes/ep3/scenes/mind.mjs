// MIND (34.7 – 46.7 с), чёрный фон.
// m1: график в 3D-плоскости (лёгкая перспектива, медленная орбита): графитовые шарики «линейно» — 42 шага по прямой.
// m2: красные шарики экспоненты: первые шаги ползут по полу и улетают за верх графика; на «удваивает всё»
//     шкала Y отъезжает в 2⁴² — прямая ложится в ноль, экспонента становится «хоккейной клюшкой».
//     «Так растут…» — три минималистичных объекта: вирус (сфера с шипами), вклад (стопка монет), чип.
import {
  defineScene, makeStage, project, atext, line, dot, P, Wd, C, E, THREE, MAT, clamp, lerp, roundedBox,
  eApple, eInOut, eIn, eEase, W, H, C_WHITE, C_GRAY,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { frame, fmt, smooth } from './_lib.mjs';

const ctx = () => ENG.g;
const NS = 42, X0 = -1.75, X1 = 1.75, YH = 3.0;          // плоскость графика (z = 0)
const xs = i => lerp(X0, X1, i / NS);

let T = null;
function TT() {
  if (T) return T;
  T = {
    nash: Wd('m1', 'Наш'), lin: Wd('m1', 'линейно'), sorok: Wd('m1', 'сорок'), shaga2: WdEnd('m1'),
    exp: Wd('m2', 'экспонента'), udv: Wd('m2', 'удваивает'), vsyo: Wd('m2', 'всё'), nego: Wd('m2', 'него'),
    tak: Wd('m2', 'Так'), vir: Wd('m2', 'вирусы'), vkl: Wd('m2', 'вклады'), chip: Wd('m2', 'чипов'), mosh: Wd('m2', 'мощность'),
  };
  T.cut = T.tak - .15;
  return T;
}
function WdEnd(k) { return E(k); }
// масштаб оси Y: 42 → 2⁴² (логарифмически)
const ymax = t => 42 * Math.pow(Math.pow(2, NS) / 42, P(t, TT().udv - .05, 1.9, eInOut));

defineScene('mind', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const sg = new THREE.SphereGeometry(.042, 20, 14);
    const lin = new THREE.InstancedMesh(sg, MAT.graphite(), NS + 1);
    const red = MAT.red(); red.color.set(stage.accent);
    const ex = new THREE.InstancedMesh(sg, red, NS + 1);
    lin.frustumCulled = ex.frustumCulled = false;
    const chart = new THREE.Group(); chart.add(lin, ex);
    // --- вирус: сфера + шипы с шариками на концах ---
    const virus = new THREE.Group();
    const vMat = MAT.ceramicWhite();
    virus.add(new THREE.Mesh(new THREE.SphereGeometry(.42, 40, 28), vMat));
    const N = 34, stalk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.018, .024, .2, 8), vMat, N), knob = new THREE.InstancedMesh(new THREE.SphereGeometry(.055, 14, 10), vMat, N);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const yy = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - yy * yy), th = i * 2.39996;
      d.set(r * Math.cos(th), yy, r * Math.sin(th)); q.setFromUnitVectors(up, d);
      M.compose(d.clone().multiplyScalar(.5), q, new THREE.Vector3(1, 1, 1)); stalk.setMatrixAt(i, M);
      M.compose(d.clone().multiplyScalar(.6), q, new THREE.Vector3(1, 1, 1)); knob.setMatrixAt(i, M);
    }
    virus.add(stalk, knob);
    // --- вклад: стопки монет 1 · 2 · 4 · 8 (удвоение) ---
    const coins = new THREE.Group();
    const cMat = MAT.aluminium(), cg = new THREE.CylinderGeometry(.16, .16, .05, 40);
    const coinIM = new THREE.InstancedMesh(cg, cMat, 15); let ci = 0;
    [1, 2, 4, 8].forEach((h, j) => { for (let k = 0; k < h; k++) { M.compose(new THREE.Vector3((j - 1.5) * .4, .025 + k * .056, 0), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); coinIM.setMatrixAt(ci++, M); } });
    coins.add(coinIM);
    // --- чип: чёрный глянцевый корпус, алюминиевые выводы, крышка кристалла ---
    const chip = new THREE.Group();
    const body = new THREE.Mesh(roundedBox(1, .06, 3), MAT.ceramicBlack()); body.scale.set(.86, .12, .86); chip.add(body);
    const die = new THREE.Mesh(roundedBox(1, .08, 2), MAT.graphite()); die.scale.set(.42, .04, .42); die.position.y = .07; chip.add(die);
    const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, .03, .14), MAT.aluminium(), 32); let pi = 0;
    for (let sd = 0; sd < 4; sd++) for (let k = 0; k < 8; k++) {
      const a = sd * Math.PI / 2, o = (k - 3.5) * .09;
      const pos = new THREE.Vector3(Math.cos(a) * .48 - Math.sin(a) * o, -.02, Math.sin(a) * .48 + Math.cos(a) * o);
      M.compose(pos, new THREE.Quaternion().setFromAxisAngle(up, -a + Math.PI / 2), new THREE.Vector3(1, 1, 1)); pins.setMatrixAt(pi++, M);
    }
    chip.add(pins);
    const ex3 = [virus, coins, chip];
    ex3.forEach(o => o.traverse(m => { if (m.isMesh) m.castShadow = true; }));
    stage.root.add(chart, virus, coins, chip);
    return { stage, chart, lin, ex, ex3 };
  },

  update(t, s, st) {
    const T = TT(), { stage, chart, lin, ex, ex3 } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, s.start, 1.0);
    L.key.intensity = 2.6 * lit; L.hemi.intensity = .5 * lit; L.rimL.intensity = 3.2 * lit; L.rimR.intensity = 2.4 * lit;
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    const chartOn = t < T.cut + .5;
    chart.visible = chartOn;
    if (chartOn) {
      const out = 1 - P(t, T.cut - .2, .45, eIn);
      const Y = ymax(t);
      for (let i = 0; i <= NS; i++) {
        // линейные шаги: появляются по одному на «сорок два шага…»
        const a = P(t, T.lin + .2 + i * (T.shaga2 - T.lin - .6) / NS, .3, eApple) * out;
        p.set(xs(i), YH * i / Y, 0); sc.setScalar(Math.max(a, 1e-4)); M.compose(p, q, sc); lin.setMatrixAt(i, M);
        // экспонента: шаг за шагом, затем шкала догоняет
        const b = P(t, T.exp + .1 + Math.min(i, 9) * .14 + Math.max(0, i - 9) * .012, .3, eApple) * out;
        const y = YH * Math.pow(2, i) / Y, vis = y < YH * 1.02 ? 1 : 0;
        p.set(xs(i), Math.min(y, YH * 1.6), 0); sc.setScalar(Math.max(b * vis, 1e-4)); M.compose(p, q, sc); ex.setMatrixAt(i, M);
      }
      lin.instanceMatrix.needsUpdate = ex.instanceMatrix.needsUpdate = true;
    }
    // примеры
    ex3.forEach((o, i) => {
      const t0 = [T.vir, T.vkl, T.mosh][i] - .1;
      const a = P(t, t0, .9, eApple);
      o.visible = a > .003 && t > T.cut;
      o.scale.setScalar(.74 * lerp(.7, 1, a) * (a > .003 ? 1 : 0) + 1e-4);
      o.position.set((i - 1) * 1.12, lerp(-.35, 0, a) + (i === 1 ? -.2 : 0), 0);
      o.rotation.set(i === 2 ? .55 : .2, (t - t0) * .5 + i, 0);
    });
    if (t < T.cut) frame(cam, [0, YH / 2, 0], 18.5, lerp(16, -10, clamp((t - s.start) / (T.cut - s.start))), 4, 540, 860);
    else frame(cam, [0, 0, 0], 13.5, lerp(-6, 6, clamp((t - T.cut) / 3)), 14, 540, 900);
  },

  draw2d(t, s, st) {
    const T = TT(), { stage } = st, cam = stage.camera, g = ctx(), ink = C_WHITE, sub = C_GRAY, red = stage.accent;
    if (t < T.cut + .5) {
      const out = 1 - P(t, T.cut - .2, .45, eIn), Y = ymax(t);
      const pr = (x, y) => project(cam, x, y, 0);
      // оси
      const ax = P(t, s.start + .2, .8) * out;
      const [ox, oy] = pr(X0, 0), [xx, xy] = pr(X1 + .15, 0), [yx, yy] = pr(X0, YH + .15);
      line(ox, oy, lerp(ox, xx, ax), lerp(oy, xy, ax), ink, .45 * ax, 2);
      line(ox, oy, lerp(ox, yx, ax), lerp(oy, yy, ax), ink, .45 * ax, 2);
      atext('шаги', xx, xy + 52, s.start + .6, t, { size: 30, w: 500, col: sub, align: 'right', track: 0, a: out });
      // подпись верха шкалы
      const [tx, ty] = pr(X0, YH);
      line(tx - 10, ty, tx + 10, ty, ink, .45 * ax, 2);
      atext(fmt(Y), tx + 22, ty + 11, s.start + .6, t, { size: 30, w: 500, col: sub, align: 'left', track: 0, a: out, dur: .5, blur: 4 });
      // кривые: рисуются за шариками
      const curve = (fn, col, lw, upto) => {
        if (upto <= 0) return;
        g.save(); g.beginPath(); g.rect(0, 490, W, 830); g.clip();
        g.globalAlpha = out; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
        const N = 200;
        for (let j = 0; j <= N; j++) {
          const i = upto * j / N, [x, y] = pr(xs(i), Math.min(YH * fn(i) / Y, YH * 1.6));
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke(); g.restore();
      };
      const nl = NS * clamp((t - T.lin - .2) / (T.shaga2 - T.lin - .6));
      curve(i => i, '#6E6E73', 3, nl);
      const ne = clamp((t - T.exp - .1) / .14, 0, 9) + Math.max(0, (t - T.exp - .1 - 1.26) / .012);
      curve(i => Math.pow(2, i), red, 4, Math.min(NS, ne));
      // подписи прямо у линий
      const [lx, ly] = pr(X1, YH * NS / Y);
      atext('линейно', lx - 10, ly + (Y > 100 ? -24 : 52), T.lin + .4, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, a: out });
      const [ex, ey] = pr(X1, YH);
      atext('экспонента', ex - 40, ey + 8, T.vsyo, t, { size: 40, w: 600, col: ink, align: 'right', track: 0, a: out });
      // большие цифры сверху
      atext('42 шага', 540, 380, T.sorok, t, { size: 120, w: 700, col: ink, track: -.04, out: T.udv - .2 });
      atext('прибавляем по одному', 540, 450, T.sorok + .4, t, { size: 40, w: 500, col: sub, track: 0, out: T.udv - .2 });
      atext('×4,4 трлн', 540, 380, T.vsyo - .1, t, { size: 120, w: 700, col: ink, track: -.04, out: T.cut - .2 });
      atext('после 42 удвоений', 540, 450, T.vsyo + .3, t, { size: 40, w: 500, col: sub, track: 0, out: T.cut - .2 });
    }
    // примеры
    if (t > T.cut) {
      atext('Растут удвоением', 540, 520, T.tak + .15, t, { size: 84, w: 600, col: ink, track: -.03 });
      ['вирусы', 'вклады', 'чипы'].forEach((w, i) => {
        const [x] = project(cam, (i - 1) * 1.12, 0, 0);
        atext(w, x, 1170, [T.vir, T.vkl, T.mosh][i] + .2, t, { size: 44, w: 600, col: ink, track: -.01 });
      });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.lin, 'tick', .15);
    add(T.sorok, 'chime', .22, .8);
    add(T.exp, 'swell', .3);
    add(T.vsyo - 1.5, 'riser', .25);
    add(T.vsyo, 'impact', .3, .9);
    add(T.tak, 'whoosh', .3, .8);
    add(T.vir, 'thud', .25, .9); add(T.vkl, 'click', .25); add(T.mosh, 'click', .25, 1.1);
  },
});
