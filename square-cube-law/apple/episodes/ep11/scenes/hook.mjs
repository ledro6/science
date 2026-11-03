// HOOK (0 – 14.17 с), чёрный фон. Керамическая фигуристка-волчок на чёрном льду с отражением.
// k1 — входит во вращение с раскинутыми руками, скорость выходит на 2 об/с; следы кистей рисуют широкий круг;
//      «2 об/с» крупно, «руки раскинуты» серым.
// k2 — на «Прижимает» руки идут к груди, ω = 2 · I₀/I растёт до 6 об/с (живой счётчик), следы сжимаются;
//      на «втрое» — огромное красное «×3», появляется шлейф.
// k3 — камера мягко отходит, заголовок «Сохранение момента импульса».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeSpinner, makeIce, spinAngle, frame, handTrail, glow, smooth, fadeBelow } from './kit.mjs';

function TT() {
  return {
    fig: Wd('k1', 'Фигуристка'), vh: Wd('k1', 'входит'), rask: Wd('k1', 'раскинув'), dvuh: Wd('k1', 'двух'),
    prij: Wd('k2', 'Прижимает'), usk: Wd('k2', 'ускоряется'), vtr: Wd('k2', 'втрое'), nik: Wd('k2', 'Никто'),
    eto: Wd('k3', 'Это'), sohr: Wd('k3', 'сохранения'), mom: Wd('k3', 'момента'), imp: Wd('k3', 'импульса'),
  };
}
// руки: 0 — раскинуты, 1 — прижаты; ω ∝ 1/I, I линейно по позе рук: 2 об/с → 6 об/с
const armsAt = (t, T) => P(t, T.prij - .05, 1.15, eInOut);
const omegaAt = (t, T) => {
  const w0 = lerp(.55, 2, P(t, T.vh - .3, 1.8, eInOut));
  return w0 / (1 - (2 / 3) * armsAt(t, T));
};

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const T = TT();
    const ice = makeIce(stage);
    const sk = makeSpinner(stage);
    stage.root.add(ice, sk);
    return { stage, T, ice, sk, om: t => omegaAt(t, T) };
  },

  update(t, s, st) {
    const { stage, T, ice, sk, om } = st, cam = stage.camera, L = stage.lights;
    // фигура «вырезается» светом из темноты: сначала контровые, потом ключ
    const lr = P(t, 0, 1.0), lk = P(t, .3, 1.4);
    L.key.position.set(lerp(2, 4, clamp(t / 14)), 9, 6);
    L.key.intensity = 2.5 * lk; L.hemi.intensity = .5 * lk; L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    ice.fade(lr);
    const a = armsAt(t, T), w = om(t);
    const ang = spinAngle(om, 0, t) - .5;
    sk.set(ang, w, a, smooth((w - 1) / 5));
    // камера: лёгкий наезд, на «втрое» — ближе и ниже; на заголовке отходит
    const push = P(t, T.prij, 2.2, eInOut), back = P(t, T.eto - .2, 1.8, eInOut);
    const d = lerp(lerp(12.2, 11.4, clamp(t / 5)), 10.9, push) + 1.4 * back;
    const el = lerp(lerp(9, 6, push), 8, back);
    frame(cam, [0, .95, 0], d, -6 + t * .9, el, 540, lerp(895, 930, back));
  },

  draw2d(t, s, st) {
    const { stage, T, om } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const a = armsAt(t, T), w = om(t), ang = spinAngle(om, 0, t) - .5;
    // следы кистей: широкий круг при раскинутых руках, тесный — при прижатых
    const tr = P(t, T.vh, .8) * (1 - .5 * P(t, T.eto, .8));
    [1, -1].forEach(side => handTrail(cam, a, side, ang, w, { dt: lerp(.16, .07, a), alpha: .75 * tr, lw: 3 }));
    // мягкий свет на льду под коньком
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy, 160, .1 * P(t, .2, 1.2));
    fadeBelow(fy + 10);
    // k1: 2 об/с
    const oNum = T.vtr - .35;
    const n = Math.round(w);
    atext(`${t < T.prij + .15 ? 2 : n} об/с`, 540, 420, T.dvuh - .05, t, { size: 200, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oNum });
    atext('руки раскинуты', 540, 495, T.dvuh + .2, t, { size: 48, w: 500, col: sub, track: -.005, out: T.prij + .1 });
    atext('руки прижаты', 540, 495, T.usk - .1, t, { size: 48, w: 500, col: sub, track: -.005, out: oNum });
    // k2: ×3 — главный акцент выпуска
    const oX = T.eto - .2;
    atext('×3', 540, 430, T.vtr - .05, t, { size: 340, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oX });
    atext('скорость вращения', 540, 505, T.vtr + .2, t, { size: 48, w: 500, col: sub, track: -.005, out: oX });
    // k3: заголовок
    atextWords('Сохранение', 540, 380, T.sohr - .05, t, { size: 100, w: 600, col: ink, track: -.03 });
    atextWords('момента импульса', 540, 492, T.mom - .05, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .3 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .32, .8);
    add(T.vh, 'whoosh', .22, .8);
    add(T.dvuh, 'chime', .22, .9);
    add(T.prij + .1, 'whoosh', .3, 1.15);
    add(T.usk, 'tick', .14, 1.1);
    add(T.vtr - 1.5, 'riser', .22);
    add(T.vtr, 'impact', .4, .9);
    add(T.sohr - .1, 'bloom', .3, .8);
    add(T.imp, 'chime', .24, 1.0);
  },
});
