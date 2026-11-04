// OUTRO (48.95 – 58.28 с), чёрный фон.
// o1 — обычный человек и великан вдвое выше, медленная орбита камеры, блик скользит по керамике;
//      три итога: «×2 рост», «×8 вес» (красным, L³), «×4 кости» — каждый на своё слово;
// o2 — финальная карточка: «Что если человек вырастет вдвое» (по словам, белым), «m ∝ L³» серым (³ красная),
//      красная пилюля «Подписаться на L³» с нажатием на «если».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, clamp, lerp, eInOut } from '../../../engine.mjs';
import { makeHuman, frame, glow, pill, HUMAN_H } from './kit.mjs';

const AX = -1.0, BX = .62;
function TT() {
  return {
    rost: Wd('o1', 'Рост'), vd: Wd('o1', 'вдвое'), ves: Wd('o1', 'вес'), vos: Wd('o1', 'восемь'), kos: Wd('o1', 'кости'), vch: Wd('o1', 'вчетверо'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'если'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const a = makeHuman(), b = makeHuman();
    a.position.set(AX, 0, 0); b.position.set(BX, 0, 0); b.scale.setScalar(2);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2);
    stage.root.add(a, b); stage.scene.add(glint);
    return { stage, a, b, glint, T: TT() };
  },

  update(t, s, st) {
    const { stage, a, b, glint, T } = st, cam = stage.camera, L = stage.lights;
    // свет: сначала контровые, потом ключ — фигуры «вырезаются» из темноты
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.key.position.set(3, 9, 6);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .5 * lk;
    stage.floor.material.opacity = .55 * lk;
    a.rotation.y = .25 - .03 * (t - s.start); b.rotation.y = -.1 - .03 * (t - s.start);
    const gp = ((t - s.start) / 2.8) % 1;
    glint.intensity = 5 * Math.sin(Math.PI * clamp(gp)) * lk;
    glint.position.set(lerp(-2.6, 2.2, eInOut(gp)), 3.2, 2.2);
    // o2: фигуры отдаляются и уходят под карточку
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [-.2, 1.75, 0], lerp(22, 30, o2) - .1 * (t - s.start), -12 + (t - s.start) * 1.6, lerp(5, 7, o2), 540, lerp(960, 877, o2));
  },

  draw2d(t, s, st) {
    const { stage, b, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const [bx, by] = project(cam, BX, HUMAN_H, 0);
    glow(bx, by, 520, .05 * P(t, s.start + .2, 1));
    // o1: три итоговых числа
    const o1 = T.card - .35, num = { size: 190, w: 700, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 };
    const lab = { size: 46, w: 500, col: sub, track: -.005, out: o1 };
    atext('×2', 240, 500, T.vd - .05, t, { ...num, col: ink });
    atext('рост', 240, 570, T.rost + .05, t, lab);
    atext('×8', 540, 500, T.vos - .05, t, { ...num, col: stage.accent });
    atext('вес', 540, 570, T.ves + .05, t, lab);
    atext('×4', 840, 500, T.vch - .05, t, { ...num, col: ink });
    atext('кости', 840, 570, T.kos + .05, t, lab);
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Что если человек', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('вырастет вдвое', 540, 474, T.card + .3, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('m ∝ L³', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vd, 'tick', .16, .9);
    add(T.vos - 1.5, 'riser', .18);
    add(T.vos, 'chime', .3, .9);
    add(T.vch, 'tick', .16, 1);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
