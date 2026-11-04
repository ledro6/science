// MILLENNIUM (33.35 – 46.58 с), светлый фон. Современный плоский мост-«лезвие»: алюминиевый настил, тросы вдоль бортов,
// графитовые опоры-рогатки; по мосту идёт толпа графитовых пешеходов.
// m1 — крупно «2000», заголовок «Мост тысячелетия», подпись «Лондон»; крупно «2 дня», подпись «после открытия».
// m2 — настил слегка качается в сторону (двойная стрелка размаха); люди подстраивают шаг под качку: их боковое
//      раскачивание из вразнобой становится синхронным, размах растёт; на «гасители колебаний» под настилом
//      выезжают графитовые гасители, качка гаснет.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, MAT } from '../../../engine.mjs';
import { makeBlade, makeWalkers, bladeZ, bladeY, MB, frame, keys, wordsAt, bigNum, arrow, smooth, rng, TAU } from './kit.mjs';

function TT() {
  return {
    dvuh: Wd('m1', 'двухтысячном'), most: Wd('m1', 'Мост'), tys: Wd('m1', 'тысячелетия'), lond: Wd('m1', 'Лондоне'), zakr: Wd('m1', 'закрыли'),
    dva: Wd('m1', 'два'), dnya: Wd('m1', 'дня'), posle: Wd('m1', 'после'),
    on: Wd('m2', 'Он'), kach: Wd('m2', 'качался'), stor: Wd('m2', 'сторону'), lyudi: Wd('m2', 'люди'), podstr: Wd('m2', 'подстраивали'), shag: Wd('m2', 'шаг'),
    kachku: Wd('m2', 'качку'), rask: Wd('m2', 'раскачивали'), sil: Wd('m2', 'сильнее'), pom: Wd('m2', 'Помогли'), gas: Wd('m2', 'гасители'), kol: Wd('m2', 'колебаний'),
  };
}
const OM = TAU * .95;                 // боковая частота настила ≈ 1 Гц
const NW = 90;
const R = rng(2000), WK = [];
for (let i = 0; i < NW; i++) WK.push({ x0: R() * MB.L, dir: R() < .5 ? -1 : 1, v: .22 + R() * .22, z: (R() - .5) * (MB.W - .22), d: R() * TAU, s: .9 + R() * .2 });
const sync = (t, T) => smooth((t - T.lyudi) / (T.rask - T.lyudi + .5));
function ampAt(t, T) {
  const a = .035 * P(t, T.kach - .2, .9) + .2 * Math.pow(smooth((t - T.shag) / (T.sil + .6 - T.shag)), 1.3);
  return a * (1 - .96 * smooth((t - T.gas - .1) / 1.5));
}

defineScene('millennium', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    const T = TT();
    const blade = makeBlade();
    const walk = makeWalkers(NW, MAT.graphite());
    stage.root.add(blade, walk.grp);
    return { stage, T, blade, walk };
  },

  update(t, s, st) {
    const { stage, T, blade, walk } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(-2, 4, clamp((t - s.start) / 13)), 9, 6);
    const amp = ampAt(t, T), o = { amp, ph: OM * t };
    blade.set(o, P(t, T.gas - .15, 1.1, eApple));
    const sy = sync(t, T), appear = P(t, s.start + .1, 1.2, eApple);
    WK.forEach((w, i) => {
      const span = MB.L - .8;
      const u = (((w.x0 + w.dir * w.v * t) % span) + span) % span;
      const x = -MB.L / 2 + .4 + u;
      const edge = smooth(Math.min(u, span - u) / .5);
      const ph = OM * t + w.d * (1 - sy);
      const dz = .035 * Math.sin(ph) * (1 + 1.2 * amp / .2);
      walk.set(i, x, bladeY(x) + .002 + .008 * Math.abs(Math.sin(ph * 2)), w.z + bladeZ(x, o) + dz, .95 * w.s * edge * appear, .16 * Math.sin(ph));
    });
    walk.commit();
    const [tx, ty, d, az, el, sy2] = keys([
      [s.start, 0, 1.0, 52, 60, 24, 930], [T.zakr, 0, 1.0, 53, 64, 25, 950], [T.on, .4, 1.0, 54, 80, 30, 900],
      [T.sil + .5, .4, 1.0, 52, 83, 31, 860], [T.gas + .4, .4, .9, 50, 79, 26, 860], [s.end, .4, .9, 50.5, 77, 25, 860],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy2);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // m1
    bigNum('2000', null, t, T.dvuh - .05, T.most - .3, { y: 470, size: 280, col: ink, sub });
    wordsAt(['Мост', 'тысячелетия'], [T.most - .05, T.tys - .05], 540, 400, t, { size: 100, w: 600, col: ink, track: -.035, out: T.dva - .35 });
    atext('Лондон', 540, 470, T.lond - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.dva - .35 });
    bigNum('2 дня', 'и мост закрыли', t, T.dva - .05, T.on - .25, { y: 470, size: 260, col: ink, sub, capT: T.posle - .05 });
    // m2: размах боковой качки — двойная стрелка у середины пролёта
    const amp = ampAt(t, T);
    const aa = P(t, T.kach, .5) * (1 - P(t, s.end - .5, .3, eIn));
    if (aa > .003) {
      // экранная длина ∝ размаху (в мировых единицах её почти не видно)
      const [cx, cy] = project(cam, 0, bladeY(0) + .3, 0), hl = 46 + 620 * amp;
      arrow(cx - hl, cy, cx + hl, cy, ink, aa, 4, 18, true);
    }
    atext('качка в сторону', 540, 410, T.kach - .05, t, { size: 92, w: 600, col: ink, track: -.03, out: T.lyudi - .1 });
    wordsAt(['шаг', 'под', 'качку'], [T.shag - .05, T.kachku - .15, T.kachku - .05], 540, 410, t, { size: 110, w: 600, col: ink, track: -.035, out: T.pom - .3 });
    wordsAt(['гасители', 'колебаний'], [T.gas - .05, T.kol - .05], 540, 410, t, { size: 96, w: 600, col: ink, track: -.03 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .15, 'swell', .2, .9);
    add(T.dvuh, 'chime', .2, 1.0);
    add(T.most, 'bloom', .2, .9);
    add(T.dva, 'thud', .26, .8);
    add(T.kach, 'whoosh', .18, .8);
    add(T.shag, 'tick', .18, 1.0);
    add(T.rask, 'swell', .22, .8);
    add(T.gas - .1, 'click', .3, .9);
    add(T.gas + .4, 'click', .22, 1.0);
    add(T.kol, 'chime', .22, 1.0);
  },
});
