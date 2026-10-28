// BEACH (6.95 – 14.2 с), белый фон. Тот же пляж сверху, светлый: керамический песок и вода-стекло.
// b1 — спасатель бежит по песку («быстро») и плывёт («медленно»): скорость видна по движению, за ним след.
// b2 — забег: четыре графитовые фигурки стартуют одновременно по четырём траекториям веером, у каждой
//      на кромке счётчик времени. Первой приходит ломаная Ферма: её след чернеет, остальные бледнеют,
//      сверху — красное «минимум времени» (главный акцент выпуска) с выноской к её точке входа в воду.
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { ctx, BEACH, fermatX, onPath, pathTime, makeBeach, makeLifeguard, makeSwimmer, frame, polyline, chip, TH } from './kit.mjs';

const { A, B, v1, v2 } = BEACH;
const XO = fermatX(A, B, v1, v2);
// веер: «слишком мало берега», прямая, Ферма, «слишком много берега»
const XS = [-.55, A[0] + (B[0] - A[0]) * (-A[1]) / (B[1] - A[1]), XO, 1.85];
const TS = XS.map(x => pathTime(A, B, x, v1, v2));
const OPT = 2, TMAX = Math.max(...TS);
const STOP = .55;                                    // фигурки останавливаются за 5,5 м до тонущего (не налезают)
const fmt = v => v.toFixed(1).replace('.', ',') + ' с';

function TT() {
  const T = {
    pes: Wd('b1', 'песку'), beg: Wd('b1', 'бежит'), bys: Wd('b1', 'быстро'), ply: Wd('b1', 'плывёт'), med: Wd('b1', 'медленно'),
    vyg: Wd('b2', 'Выгоднее'), bol: Wd('b2', 'больше'), ber: Wd('b2', 'берегу'), pro: Wd('b2', 'проплыть'), men: Wd('b2', 'меньше'), vod: Wd('b2', 'воде'),
  };
  T.demo0 = T.pes + .05; T.demoD = 2.75;             // показательный заплыв
  T.out1 = T.vyg - .3;                               // уход заплыва
  T.race = T.vyg + .03; T.raceD = 2.4;              // забег: самый медленный приходит через raceD
  T.win = T.race + T.raceD * TS[OPT] / TMAX;        // приходит ломаная Ферма
  return T;
}
const tauDemo = (t, T) => clamp((t - T.demo0) / T.demoD) * TS[OPT];
const tauRace = (t, T) => Math.max(0, t - T.race) * TMAX / T.raceD;

defineScene('beach', {
  setup() {
    const stage = makeStage({ bg: 'white', floorY: -TH, shadow: .5 });
    const T = TT();
    const beach = makeBeach({ dark: false });
    const gMat = MAT.graphite();
    gMat.transparent = true;
    const guard = makeLifeguard(gMat);
    const swimmer = makeSwimmer(MAT.graphite(), false);
    swimmer.position.set(B[0], 0, B[1]);
    const runners = XS.map(() => { const m = MAT.graphite(); m.transparent = true; const r = makeLifeguard(m); r.mat = m; return r; });
    stage.root.add(beach, guard, swimmer, ...runners);
    return { stage, T, beach, guard, gMat, swimmer, runners };
  },

  update(t, s, st) {
    const { stage, T, beach, guard, gMat, swimmer, runners } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(-5, 5, clamp((t - s.start) / 7)), 10, 6);
    beach.update(t, 1);
    swimmer.update(t, 1);
    // показательный заплыв по ломаной Ферма
    const d1 = Math.hypot(XO - A[0], A[1]);
    const tau = Math.min(tauDemo(t, T), TS[OPT] - STOP / v2);
    const [x, z, , , ang] = onPath(A, B, XO, v1, v2, tau);
    guard.position.set(x, 0, z); guard.rotation.y = -ang;
    guard.pose(clamp((tau - d1 / v1) / .9), tau * 3.2);
    const ga = P(t, s.start + .2, .6) * (1 - P(t, T.out1, .4, eIn));
    gMat.opacity = ga; gMat.depthWrite = ga > .98; guard.visible = ga > .01; guard.scale.setScalar(1.45);
    // забег
    runners.forEach((r, i) => {
      const tr = Math.min(tauRace(t, T), TS[i] - STOP / v2);
      const [rx, rz, , , ra] = onPath(A, B, XS[i], v1, v2, tr);
      r.position.set(rx, 0, rz); r.rotation.y = -ra;
      r.pose(clamp((tr - Math.hypot(XS[i] - A[0], A[1]) / v1) / .9), tr * 3.2 + i);
      const arr = T.race + T.raceD * (TS[i] - STOP / v2) / TMAX;          // момент прихода
      const a = P(t, T.race - .25, .4) * (i === OPT ? 1 : lerp(1, .45, P(t, T.win + .05, .6)) * (1 - P(t, arr + .15, .5, eIn)));
      r.mat.opacity = a; r.mat.depthWrite = a > .98; r.visible = a > .01; r.scale.setScalar(1.3);
    });
    const k = clamp((t - s.start) / 7.3);
    frame(cam, [0, 0, -.05], lerp(23.5, 22.5, eInOut(k)), lerp(7, -5, k), lerp(60, 64, k), 520, 820);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    const pr = (x, z) => project(cam, x, .01, z);
    const pA = pr(A[0], A[1]), pB = pr(B[0], B[1]);
    // ---- b1: след показательного заплыва и подписи ----
    const q1 = 1 - P(t, T.out1, .35, eIn);
    {
      const tau = Math.min(tauDemo(t, T), TS[OPT] - STOP / v2);
      const [, , , fr] = onPath(A, B, XO, v1, v2, tau);
      const pC = pr(XO, 0);
      polyline([pA, pC, pB], fr, ink, .9 * q1, 3.5);
      // «быстро» — у середины отрезка по песку, «медленно» — у отрезка в воде
      const m1 = pr((A[0] + XO) / 2, A[1] / 2), m2 = pr((XO + B[0]) / 2 + .1, B[1] * .45);
      atext('быстро', m1[0] + 40, m1[1] - 34, T.bys - .05, t, { size: 60, w: 600, col: ink, align: 'left', track: -.02, out: T.out1, dy: 24 });
      atext('медленно', m2[0] - 46, m2[1] + 20, T.med - .05, t, { size: 60, w: 600, col: ink, align: 'right', track: -.02, out: T.out1, dy: 24 });
    }
    // ---- b2: забег веером ----
    if (t > T.race - .3) {
      const win = P(t, T.win + .05, .6);
      XS.forEach((x, i) => {
        const tr = Math.min(tauRace(t, T), TS[i] - STOP / v2);
        const [, , , fr] = onPath(A, B, x, v1, v2, tr);
        const pC = pr(x, 0), pts = [pA, pC, pB];
        const isO = i === OPT;
        const col = isO ? ink : sub;
        const a = P(t, T.race - .2, .4) * (isO ? 1 : lerp(.85, .35, win));
        // пунктир всей траектории заранее, сплошной — пройденная часть
        polyline(pts, 1, col, a * .35 * (1 - win * (isO ? 1 : .5)), 2, [6, 10]);
        polyline(pts, fr, col, a, isO ? lerp(3, 5, win) : 3);
      });
      // счётчики на кромке: время каждого пути (секунды забега, идут вместе с фигурками)
      XS.forEach((x, i) => {
        const pC = pr(x, 0), isO = i === OPT;
        const v = Math.min(tauRace(t, T), TS[i]);
        const a = P(t, T.race + i * .06, .5) * (isO ? 1 : lerp(1, .55, win));
        const up = i % 2 === 0, cx = pC[0] + (up ? 50 : -50), cy = up ? pC[1] - 40 : pC[1] + 62;
        chip(cx, cy - 13, 118, 50, stage.bgc, a * .92);
        atext(fmt(v), cx, cy, T.race + i * .06, t, { size: 36, w: isO ? 700 : 500, col: isO ? ink : sub, a: a, track: -.01, dy: 14, dur: .5 });
        // точка входа в воду
        g.save(); g.globalAlpha = a; g.fillStyle = isO ? ink : sub; g.beginPath(); g.arc(pC[0], pC[1], isO ? lerp(4, 7, win) : 4, 0, 7); g.fill(); g.restore();
      });
      // главный акцент: красное «минимум времени» с выноской к ломаной Ферма
      const pC = pr(XO, 0), ta = T.win + .05;
      const pd = P(t, ta, .3), pl = P(t, ta + .1, .45);
      const top = 440;
      if (pd > 0) {
        const fx = pC[0] + 50, fy = pC[1] - 70;
        g.save(); g.globalAlpha = pd; g.fillStyle = acc; g.beginPath(); g.arc(fx, fy, 5, 0, 7); g.fill(); g.restore();
        line(fx, fy, fx, lerp(fy, top + 22, pl), acc, .85, 2);
      }
      atext('минимум времени', 540, top - 20, ta + .2, t, { size: 84, w: 600, col: acc, track: -.03, blur: 16, scale0: 1.08, dur: .85 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.demo0 + .05, 'whoosh', .22, 1.1);
    add(T.demo0 + T.demoD * .386, 'splash', .18, .9);
    add(T.race, 'click', .25, 1);
    add(T.win - 1.5, 'riser', .22);
    add(T.win + .05, 'impact', .35, .9);
    add(T.win + .25, 'chime', .25, 1);
  },
});
