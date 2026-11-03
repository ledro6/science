// HOOK (0 – 10.43 с), чёрный фон. Седан-силуэт как продукт: белая керамика, чёрный стеклянный купол,
// длиннофокусная камера, медленная орбита; разметка на полу бежит навстречу, колёса крутятся.
// h1 — «90 км/ч» → на «быстрее» счётчик к 180, разметка бежит вдвое быстрее; на «восемь» огромное красное «×8», «мощность»;
// h2 — камера уходит в профиль, на «воздухе» по кузову бегут hairline-линии обтекания, «Воздух»;
// h3 — «Новая рубрика» серым и заголовок рубрики «За рулём» по словам.
import { defineScene, makeStage, project, atext, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeCar, frame, keys, flowLine, streamPts, projPts, wordsAt, glow } from './kit.mjs';

function TT() {
  return {
    ex: Wd('h1', 'ехать'), vd: Wd('h1', 'вдвое'), br: Wd('h1', 'быстрее'), vos: Wd('h1', 'восемь'),
    poch: Wd('h2', 'Почему'), vse: Wd('h2', 'Всё'), voz: Wd('h2', 'воздухе'),
    eto: Wd('h3', 'Это'), nov: Wd('h3', 'новая'), za: Wd('h3', 'за'), rul: Wd('h3', 'рулём'),
  };
}
const V1 = 5.5;                                         // «90 км/ч» в условных единицах сцены, ед/с
// пройденный путь (интеграл скорости): скорость плавно удваивается на «быстрее»
function dist(t, T) {
  const a = T.br - .25, d = 1.0;
  if (t < a) return V1 * t;
  const u = clamp((t - a) / d);
  const extra = t - a < d ? d * (u * u * u - u * u * u * u / 2) : d / 2 + (t - a - d);
  return V1 * t + V1 * extra;
}
const MARK_N = 16, MARK_SP = 3.2, MARK_SPAN = MARK_N * MARK_SP;
const LINES = [[.55, .07], [.8, .17], [1.1, .3], [1.45, .46], [1.85, .66], [2.3, .9]];

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const T = TT();
    const car = makeCar({ dark: true });
    // разметка: две пунктирные линии по бокам «полосы»
    const mm = new THREE.MeshStandardMaterial({ color: '#2C2C2E', roughness: .6 });
    const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .006, .09), mm, MARK_N * 2);
    marks.receiveShadow = true;
    stage.root.add(car, marks);
    return { stage, T, car, marks, _m: new THREE.Matrix4() };
  },

  update(t, s, st) {
    const { stage, T, car, marks, _m } = st, cam = stage.camera, L = stage.lights;
    // свет: сначала контровые вырезают силуэт, потом ключ проявляет керамику
    const lr = P(t, 0, 1.0), lk = P(t, .2, 1.4);
    L.key.position.set(4, 9, 7); L.key.intensity = 1.9 * lk; L.hemi.intensity = .3 * lk;
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    const D = dist(t, T);
    car.spin(D / .36);
    // разметка едет навстречу (машина стоит в кадре, мир бежит)
    for (let side = 0; side < 2; side++) for (let i = 0; i < MARK_N; i++) {
      let x = (i * MARK_SP - D) % MARK_SPAN; if (x < 0) x += MARK_SPAN;
      x -= MARK_SPAN / 2;
      _m.makeTranslation(x, .003, side ? 1.75 : -1.75);
      marks.setMatrixAt(side * MARK_N + i, _m);
    }
    marks.instanceMatrix.needsUpdate = true;
    marks.material.opacity = 1;
    // камера: 3/4 спереди → профиль к «воздухе» → чуть крупнее на заголовке рубрики
    const [az, el, d, ty] = keys([[0, 54, 9, 31, .7], [T.vos, 46, 8, 29, .7], [T.poch + .2, 44, 8, 29, .7], [T.voz, 17, 5, 27.5, .9], [T.za, 14, 5, 27, .9], [10.5, 12, 4, 26, .9]], t, eInOut);
    frame(cam, [0, ty, 0], d, az + Math.sin(t * .3) * 1.5, el, 540, 1010);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // фары: мягкое свечение
    // --- h1: 90 → 180 км/ч ---
    const oS = T.vos - .1;
    const v = lerp(90, 180, P(t, T.br - .25, 1.0, eInOut));
    atext(String(Math.round(v / 5) * 5), 540, 560, T.ex - .1, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oS });
    atext('км/ч', 540, 640, T.ex + .15, t, { size: 50, w: 500, col: sub, track: -.005, out: oS });
    // --- h1: ×8 мощность — главный акцент выпуска ---
    const o8 = T.poch + .35;
    atext('×8', 540, 600, T.vos, t, { size: 360, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: o8 });
    atext('мощность', 540, 685, T.vos + .2, t, { size: 50, w: 500, col: sub, track: -.005, out: o8 });
    // --- h2: линии обтекания над кузовом ---
    const aL = P(t, T.vse - .1, .9);
    if (aL > .003) {
      LINES.forEach(([h, gap], i) => {
        for (const z of [-.45, .35]) {
          const pts = projPts(cam, streamPts(h, gap, -7, 7, 90), z);
          const ai = aL * P(t, T.vse - .1 + i * .08 + (z > 0 ? .05 : 0), .7) * (z > 0 ? .9 : .45) * (1 - i * .08);
          flowLine(pts, t + i * .37 + (z > 0 ? 0 : .6), 560 - i * 30, ink, ai, z > 0 ? 2 : 1.5, [150 + i * 20, 90 + i * 15], .14);
        }
      });
    }
    atext('Воздух', 540, 470, T.voz - .05, t, { size: 140, w: 600, col: ink, track: -.03, blur: 16, out: T.eto - .05 });
    // --- h3: новая рубрика ---
    atext('Новая рубрика', 540, 330, T.nov, t, { size: 48, w: 500, col: sub, track: -.005 });
    wordsAt(['За', 'рулём'], [T.za - .05, T.rul - .05], 540, 480, t, { size: 160, w: 600, col: ink, track: -.035, blur: 16, dur: .8 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.ex - .1, 'tick', .14);
    add(T.br - .25, 'rise', .2, .8);
    add(T.vos - 1.5, 'riser', .25);
    add(T.vos, 'impact', .42, .9);
    add(T.vse, 'whoosh', .3, .7);
    add(T.voz, 'shimmer', .2, .8);
    add(T.nov, 'swell', .22, .8);
    add(T.za - .05, 'bloom', .3, .85);
    add(T.rul, 'chime', .22, 1.05);
  },
});
