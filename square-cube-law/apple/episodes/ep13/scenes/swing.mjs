// SWING (10.4 – 20.45 с), светлый фон — «продуктовая страница».
// s1 — алюминиевые качели с чёрным керамическим сиденьем качаются чуть-чуть; на «толкать» справа приходит керамическая
//      «рука» и толкает сиденье ровно в крайней точке, раз за разом; под качелями рисуется след качания (синусоида).
//      Крупно «в такт», подпись «с собственным ритмом»; засечки толчков на оси времени.
// s2 — выноска «маленький толчок»; на «складываются» — пунктирная огибающая; размах растёт с каждым качанием:
//      пунктирная дуга размаха у сиденья, крупно «размах растёт».
import { defineScene, makeStage, project, atext, callout, line, dot, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeSwing, swingAt, SW, frame, keys, wordsAt, polyline, arrow, smooth, TAU } from './kit.mjs';

function TT() {
  return {
    kach: Wd('s1', 'Качели'), sil: Wd('s1', 'сильнее'), tolk: Wd('s1', 'толкать'), takt: Wd('s1', 'такт'), sob: Wd('s1', 'собственным'), rit: Wd('s1', 'ритмом'),
    kazh: Wd('s2', 'Каждый'), tol2: Wd('s2', 'толчок'), mal: Wd('s2', 'маленький'), skl: Wd('s2', 'складываются'), raz: Wd('s2', 'размах'), rast: Wd('s2', 'растёт'), kach2: Wd('s2', 'качанием'),
  };
}
const Tp = 1.6;
function cfg(T) { const tp0 = T.tolk + .12; return { t0: tp0, Tp, A0: .12, dA: .085, nPush: 5, tPush0: tp0 }; }
// рука: отведена → касается спинки сиденья в крайней точке → провожает толчок → уходит
function handAt(t, T, sw) {
  const C = cfg(T), { th } = swingAt(t, C);
  const edge = Math.sin(th) * (SW.RL + .04) + Math.cos(th) * SW.SEAT[0] / 2 + .115;
  let c = 0;
  for (let n = 0; n < C.nPush; n++) { const tp = C.tPush0 + n * Tp; c = Math.max(c, smooth((t - (tp - .5)) / .45) * (1 - smooth((t - (tp + .16)) / .42))); }
  const rest = 2.35 + .35 * (1 - P(t, T.tolk - .6, .9, eApple)) * 3;
  return { x: lerp(rest, edge, c), c, th };
}
const GX0 = 120, GX1 = 940, GY = 1190, GK = 140;

defineScene('swing', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .55 });
    const T = TT();
    const swing = makeSwing();
    stage.root.add(swing);
    return { stage, T, swing, C: cfg(T) };
  },

  update(t, s, st) {
    const { stage, T, swing } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(1, 4, clamp((t - s.start) / 10)), 9, 6);
    const h = handAt(t, T);
    swing.set(h.th, h.x, 1);
    swing.scale.setScalar(lerp(.94, 1, P(t, s.start, 1.2, eApple)));
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, .1, 1.45, 22.5, 46, 11, 800], [T.tolk, .35, 1.4, 21, 40, 8, 800], [T.kazh, .35, 1.4, 21, 36, 7, 800], [s.end, .3, 1.42, 21.6, 30, 7, 800],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, swing, C } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // --- график качания: θ(t) от начала сцены ---
    const ga = P(t, s.start + .5, .7) * (1 - P(t, s.end - .4, .3, eIn));
    const tA = s.start + .4, tB = s.end - .25, X = τ => lerp(GX0, GX1, (τ - tA) / (tB - tA));
    if (ga > .003) {
      line(GX0, GY, lerp(GX0, GX1, P(t, s.start + .5, 1.2, eApple)), GY, sub, ga * .45, 2);
      const pts = [];
      for (let τ = tA; τ <= Math.min(t, tB); τ += 1 / 60) pts.push([X(τ), GY - GK * swingAt(τ, C).th]);
      polyline(pts, ink, ga, 3);
      if (t > tA && t < tB) { const th = swingAt(t, C).th; dot(X(t), GY - GK * th, 6, ink, ga); }
      // засечки толчков: в крайней точке, ровно в такт
      for (let n = 0; n < C.nPush; n++) {
        const tp = C.tPush0 + n * Tp; if (t < tp) continue;
        const k = P(t, tp, .35, eApple), x = X(tp), yk = GY - GK * swingAt(tp, C).th;
        dot(x, yk, 7 * k, ink, ga * k);
        line(x, GY + 26, x, GY + 26 + 22 * k, ink, ga * k, 3);
      }
      atext('толчки', X(C.tPush0) - 14, GY + 84, C.tPush0 + .15, t, { size: 34, w: 500, col: sub, a: ga, track: 0, align: 'left', dy: 14 });
      // огибающая: толчки складываются
      const ea = P(t, T.skl - .05, .6) * ga;
      if (ea > .003) {
        const up = [], dn = [], tEnd = Math.min(t, tB);
        for (let τ = C.tPush0 - .3; τ <= tEnd; τ += 1 / 30) { const A = swingAt(τ, C).A; up.push([X(τ), GY - GK * A]); dn.push([X(τ), GY + GK * A]); }
        const pE = P(t, T.skl - .05, 1.0, eApple);
        const cut = arr => arr.slice(0, Math.max(2, Math.round(arr.length * pE)));
        polyline(cut(up), ink, ea * .55, 2, [8, 8]); polyline(cut(dn), ink, ea * .55, 2, [8, 8]);
      }
    }
    // --- дуга размаха у сиденья (пунктир), растёт вместе с A ---
    const aa = P(t, T.raz - .1, .5) * (1 - P(t, s.end - .4, .3, eIn));
    if (aa > .003) {
      const A = swingAt(t, C).A, pts = [];
      for (let i = 0; i <= 48; i++) { const q = lerp(-A, A, i / 48), p = swing.seatPos(q); pts.push(project(cam, p[0], p[1] - .1, 0)); }
      polyline(pts, ink, aa * .6, 2, [6, 8]);
      for (const sg of [-1, 1]) { const p = swing.seatPos(sg * A); const [x, y] = project(cam, p[0], p[1] - .1, 0); dot(x, y, 5, ink, aa); }
    }
    // --- выноска «маленький толчок» у руки ---
    const h = handAt(t, T);
    const [hx, hy] = project(cam, h.x + .05, SW.PIV - Math.cos(h.th) * (SW.RL + .04) + .12, 0);
    const mo = T.skl - .2;
    if (t > T.mal - .2 && t < mo + .5) {
      callout(hx, hy - 18, hx, hy - 120, T.mal - .2, t, ink, 1 - P(t, mo, .35, eIn));
      atext('маленький толчок', 930, hy - 140, T.mal - .05, t, { size: 40, w: 500, col: ink, track: -.005, align: 'right', out: mo, dy: 16 });
    }
    // --- заголовки ---
    atext('в такт', 540, 410, T.takt - .05, t, { size: 170, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.kazh - .35 });
    atext('с собственным ритмом', 540, 480, T.sob - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.kazh - .35 });
    wordsAt(['размах', 'растёт'], [T.raz - .05, T.rast - .05], 540, 410, t, { size: 120, w: 600, col: ink, track: -.035 });
  },

  sfx(add, s) {
    const T = TT(), C = cfg(T);
    add(s.start + .2, 'swell', .22, .8);
    for (let n = 0; n < C.nPush; n++) add(C.tPush0 + n * Tp - .02, 'click', .18 + n * .03, .9 + n * .04);
    add(T.takt, 'chime', .22, 1.0);
    add(T.skl, 'shimmer', .18, 1.0);
    add(T.raz, 'bloom', .22, .9);
  },
});
