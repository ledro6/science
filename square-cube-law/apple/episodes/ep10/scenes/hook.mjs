// HOOK (0 – 6.95 с), чёрный фон. Вид сверху под углом на пляж: плита песка (алюминий) и плита воды
// (стекло с рёбрами-волнами, которые катятся к берегу). Спасатель-капсула у верхнего края, тонущий-сфера внизу справа.
// k1 — пунктир прямой серым; спасатель бежит по ломаной (быстро по песку, медленно в воде), за ним белый след.
// k2 — «свет»: по той же ломаной пролетает яркий луч (быстро в «воздухе», медленнее в воде), след остаётся светиться.
// k3 — заголовок «Принцип Ферма».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { ctx, BEACH, fermatX, onPath, pathTime, makeBeach, makeLifeguard, makeSwimmer, frame, polyline, polyAt, glowLine, glow, TH } from './kit.mjs';

const { A, B, v1, v2 } = BEACH;
const XO = fermatX(A, B, v1, v2), TOPT = pathTime(A, B, XO, v1, v2);

function TT() {
  return {
    sp: Wd('k1', 'Спасатель'), run: Wd('k1', 'бежит'), ton: Wd('k1', 'тонущему'), ne: Wd('k1', 'не'), pr: Wd('k1', 'прямой'),
    svet: Wd('k2', 'свет'), post: Wd('k2', 'поступает'), tak: Wd('k2', 'так'),
    pri: Wd('k3', 'принцип'), fer: Wd('k3', 'Ферма'),
  };
}
const RUN = 1.75, STOP = .62 / .2;                // забег, с; спасатель останавливается в 3 м от тонущего

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', floorY: -TH, shadow: .5 });
    const T = TT();
    const beach = makeBeach({ dark: true });
    const guard = makeLifeguard(MAT.ceramicWhite());
    const swimmer = makeSwimmer(MAT.ceramicWhite(), true);
    swimmer.position.set(B[0], 0, B[1]);
    stage.root.add(beach, guard, swimmer);
    return { stage, T, beach, guard, swimmer };
  },

  update(t, s, st) {
    const { stage, T, beach, guard, swimmer } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, 0, 1.3);
    // свет: ключ медленно скользит слева направо — по стеклу воды бежит блик
    const sw = clamp(t / 6.9);
    L.key.position.set(lerp(-7, 6, eInOut(sw)), 9, lerp(-3, 5, sw));
    L.key.intensity = 2.6 * lit; L.hemi.intensity = .5 * lit; L.rimL.intensity = 3 * lit; L.rimR.intensity = 2.2 * lit;
    beach.update(t, lit);
    swimmer.update(t, P(t, .15, .8));
    // спасатель: появляется на «Спасатель», бежит по ломаной в реальном соотношении скоростей
    const tau = Math.min(clamp((t - T.run) / RUN) * TOPT, TOPT - STOP);
    const [x, z, seg, , ang] = onPath(A, B, XO, v1, v2, tau);
    const swim = clamp((tau - Math.hypot(XO - A[0], A[1]) / v1) / .9);
    guard.position.set(x, 0, z);
    guard.rotation.y = -ang;
    guard.pose(swim, tau * 3.2);
    const gin = P(t, T.sp - .1, .7);
    guard.scale.setScalar(lerp(.85, 1, gin) * 1.5);
    guard.visible = gin > .01;
    // камера: сверху под углом, медленный дрейф по азимуту и лёгкий наезд
    const k = clamp(t / 6.95);
    frame(cam, [0, 0, -.05], lerp(25, 23.5, eInOut(k)), lerp(-9, 7, k), lerp(54, 58, k), 520, 830);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const pr = (x, z) => project(cam, x, .01, z);
    const pA = pr(A[0], A[1]), pB = pr(B[0], B[1]), pC = pr(XO, 0);
    // подписи сред
    const [sx, sy] = pr(-2.15, -.32), [wx, wy] = pr(-2.15, .55);
    atext('песок', sx + 4, sy, .55, t, { size: 34, w: 500, col: ink, a: .85, align: 'left', track: 0, dy: 14, out: T.svet - .3 });
    atext('вода', wx + 4, wy, .75, t, { size: 34, w: 500, col: ink, a: .85, align: 'left', track: 0, dy: 14, out: T.svet - .3 });
    // пунктир прямой
    const ps = P(t, T.ton - .05, .6, eInOut);
    const dimS = 1 - .5 * P(t, T.svet, .5);
    polyline([pA, pB], ps, sub, .9 * dimS, 3, [10, 12]);
    // белый след спасателя (до текущей точки)
    const tau = Math.min(clamp((t - T.run) / RUN) * TOPT, TOPT - STOP);
    const d1 = Math.hypot(XO - A[0], A[1]), d2 = Math.hypot(B[0] - XO, B[1]);
    const [, , , frac] = onPath(A, B, XO, v1, v2, tau);
    const path = [pA, pC, pB];
    polyline(path, frac, ink, .95 * (1 - P(t, T.svet + .2, .6)), 3.5);
    // точка входа в воду
    const ci = P(t, T.run + RUN * (d1 / v1) / TOPT, .4);
    // луч света: та же ломаная, на «песке» быстро, в воде медленнее (свет: v2/v1 = 0,75 — для наглядности как у спасателя)
    const t0 = T.svet + .05, LT = .95;
    const lt = clamp((t - t0) / LT);
    const r1 = (d1 / v1) / TOPT;   // доля времени на первом отрезке
    const fr = lt <= r1 ? (lt / r1) * d1 / (d1 + d2) : (d1 + (lt - r1) / (1 - r1) * d2) / (d1 + d2);
    if (t > t0) {
      const tail = .22;
      glowLine(path, fr, 1, 3, Math.max(0, fr - tail));          // комета
      glowLine(path, fr, .55 * P(t, t0 + .1, .5), 2.2);         // остающийся светящийся след
      const [hx, hy] = polyAt(path, fr);
      glow(hx, hy, 70, .9 * (1 - P(t, t0 + LT, .5)) + .25);
    }
    // точки A, C, B
    if (t > T.run + .5) {
      g.save(); g.globalAlpha = ci * (1 - .4 * P(t, T.svet, .5)); g.strokeStyle = ink; g.lineWidth = 2;
      g.beginPath(); g.arc(pC[0], pC[1], 9, 0, 7); g.stroke(); g.restore();
    }
    // заголовок
    atextWords('Принцип Ферма', 540, 400, T.pri - .05, t, { size: 112, w: 600, col: ink, track: -.03, stagger: .42 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    add(T.sp, 'thud', .3, .8);
    add(T.run + .1, 'whoosh', .25, .9);
    add(T.ton, 'tick', .14);
    add(T.run + RUN * (Math.hypot(XO - A[0], A[1]) / v1) / TOPT, 'splash', .18, .9);
    add(T.svet - .2, 'swell', .25, 1.1);
    add(T.svet + .05, 'shimmer', .35, 1.1);
    add(T.pri - .1, 'bloom', .32, .8);
    add(T.fer, 'chime', .25, .9);
  },
});
