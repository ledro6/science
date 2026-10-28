// WIND (21.9 – 33.0 с), чёрный фон.
// w1 — та же керамическая Земля, по ней течёт ветер; «устроен так же»: штрихи замирают ровными стрелками —
//      поле направлений; «в каждой точке» — три выноски-стрелки на поверхности; заголовок «ветер = поле направлений»;
// w2 — «хотя бы в одной точке»: камера опускается почти отвесно над глазом циклона, ветер снова течёт,
//      спираль штрихов вокруг тихой точки; «равен нулю» — красная точка и огромная красная «0»;
//      «центр циклона» — выноска «центр циклона: 0».
import { defineScene, makeStage, project, atext, line, dot, measure, P, Wd, E, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeEarth, setStrokes, earthWorld, EYE, ring, scrim, bump } from './_kit.mjs';
import { lookFrom, norm3, add3, scl3, ll } from './_hair.mjs';
import { windAt as wAt } from './_kit.mjs';

const RAD = Math.PI / 180;
function TT() {
  return {
    vet: Wd('w1', 'Ветер'), ustr: Wd('w1', 'устроен'), kazh: Wd('w1', 'каждой'), toch: Wd('w1', 'точке'), napr: Wd('w1', 'направление'), end1: E('w1'),
    zna: Wd('w2', 'Значит'), odn: Wd('w2', 'одной'), gor: Wd('w2', 'горизонтальный'), rav: Wd('w2', 'равен'), nul: Wd('w2', 'нулю'),
    obych: Wd('w2', 'Обычно'), centr: Wd('w2', 'центр'), cikl: Wd('w2', 'циклона'),
  };
}
const spinAt = t => (42 + 5 * (t - 27.6)) * RAD;
// три точки для выносок «в каждой точке есть направление» (координаты Земли)
const SAMPLES = [ll(12, -28), ll(-18, -62), ll(48, -8)];

defineScene('wind', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const earth = makeEarth({ seed: 13 });
    earth.tilt.rotation.set(.32, 0, .12);
    stage.root.add(earth.tilt);
    return { stage, earth, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, T } = st, cam = stage.camera, L = stage.lights;
    const z = P(t, T.odn - .55, 1.7, eInOut);
    const lr = P(t, s.start, 1.0, eApple);
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.0 * lr * (1 - .85 * z); L.hemi.intensity = .35 * lr;
    L.key.castShadow = false; L.key.position.set(4, 7, 6);
    earth.spin.rotation.y = spinAt(t);
    // поле направлений: стрелки замирают на «устроен так же», снова текут к «одной точке»
    const arrow = P(t, T.ustr, .9, eInOut) * (1 - P(t, T.zna, .9, eInOut));
    setStrokes(earth, t, { g: lerp(1, .5, z), c: z, w: lerp(1, .32, z), arrow, capLen: 1.7, capW: 1.5 });
    // камера: общий план → почти отвесно над глазом
    const Ew = earthWorld(earth, EYE, 1);
    const nN = norm3(add3([0, 1, 0], Ew, -Ew[1]));
    const tau = 14 * RAD;
    const posZ = add3(Ew, norm3(add3(scl3(Ew, Math.cos(tau)), nN, -Math.sin(tau))), 3.0);
    const az = (6 - 1.6 * (t - s.start)) * RAD, el = 9 * RAD, dist = 10.6 - .1 * (t - s.start);
    const posA = [dist * Math.cos(el) * Math.sin(az), dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az)];
    const pos = posA.map((v, i) => lerp(v, posZ[i], z)), tg = [0, 0, 0].map((v, i) => lerp(v, Ew[i], z));
    lookFrom(cam, pos, tg, 540, lerp(920, 1000, z));
    st.Ew = Ew;
  },

  draw2d(t, s, st) {
    const { stage, earth, T, Ew } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // ---- w1: три выноски-стрелки «в каждой точке» ----
    const o1 = T.zna - .1;
    SAMPLES.forEach((p, i) => {
      const t0 = T.kazh - .1 + i * .18, a = P(t, t0, .5) * (1 - P(t, o1, .35, eIn));
      if (a <= .003) return;
      const v = norm3(wAt(p)), q = norm3(add3(p, v, .3 * P(t, t0 + .1, .6, eApple)));
      const A = earthWorld(earth, p, 1.01), B = earthWorld(earth, q, 1.01);
      const [ax, ay] = project(cam, ...A), [bx, by] = project(cam, ...B);
      dot(ax, ay, 7 * a, ink, a);
      line(ax, ay, bx, by, ink, a, 4);
      const ang = Math.atan2(by - ay, bx - ax), hl = 24 * P(t, t0 + .3, .3);
      if (hl > 1) {
        line(bx, by, bx - hl * Math.cos(ang - .5), by - hl * Math.sin(ang - .5), ink, a, 4);
        line(bx, by, bx - hl * Math.cos(ang + .5), by - hl * Math.sin(ang + .5), ink, a, 4);
      }
    });
    // заголовок «ветер = поле направлений»
    atext('Ветер =', 540, 300, T.napr - .25, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
    atext('поле направлений', 540, 410, T.napr - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
    // ---- w2: «хотя бы в одной точке» → 0 ----
    const [ex, ey] = project(cam, ...Ew);
    const dA = P(t, T.odn + .2, .5);
    if (dA > .003) {
      ring(ex, ey, lerp(120, 34, P(t, T.odn + .2, 1.1)), ink, .6 * dA * (1 - P(t, T.nul + .2, .6)), 2);
      dot(ex, ey, 12 * dA * (1 + .3 * bump(t, T.nul, .35)), red, dA);
    }
    const o2 = T.obych - .1;
    scrim(220, 680, .8 * P(t, T.nul - .4, .5));
    atext('0', 540, 560, T.nul, t, { size: 320, w: 700, col: red, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('горизонтальный ветер', 540, 640, T.nul + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: o2 });
    // «центр циклона: 0» — выноска от точки
    const ca = P(t, T.centr - .1, .5);
    if (ca > .003) {
      const ly = 420, pl = P(t, T.centr, .45, eApple);
      line(ex, ey - 18, ex, lerp(ey - 18, ly + 40, pl), ink, .7 * ca, 2);
      const s1 = 'центр циклона: ', size = 76, w1 = measure(s1, size, 600, -.02), w2 = measure('0', size, 700, -.02);
      const x0 = 540 - (w1 + w2) / 2;
      atext(s1, x0, ly, T.centr + .05, t, { size, w: 600, col: ink, track: -.02, align: 'left' });
      atext('0', x0 + w1, ly, T.cikl + .1, t, { size, w: 700, col: red, track: -.02, align: 'left' });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.vet, 'swell', .25, .7);
    add(T.ustr, 'click', .2, 1);
    for (let i = 0; i < 3; i++) add(T.kazh - .1 + i * .18, 'tick', .14, 1 + i * .1);
    add(T.odn - .5, 'whoosh', .3, .7);
    add(T.nul - 1.5, 'riser', .2);
    add(T.nul, 'impact', .35, .9);
    add(T.centr, 'chime', .22, .9);
  },
});
