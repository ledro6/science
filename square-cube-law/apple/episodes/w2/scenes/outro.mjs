// OUTRO (40.78 – 50.17 с), чёрный фон.
// o1 — Земля «сейчас» и Земля вдвое больше, медленная орбита камеры, блик бежит по стеклу атмосферы;
//      три итога: «×2 радиус», «×8 масса» (красным, L³), «×2 вес» — каждый на своё слово;
// o2 — финальная карточка: «Что если Земля вдвое больше» (по словам, белым), «M ∝ R³» серым (³ красная),
//      красная пилюля «Подписаться на L³» с нажатием на «если».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeEarth, makeShell, frame, glow, screenR, pill } from './kit.mjs';

const R1 = .42, AX = -.92, BX = .5;
function TT() {
  return {
    rad: Wd('o1', 'Радиус'), vd: Wd('o1', 'вдвое'), mas: Wd('o1', 'масса'), vos: Wd('o1', 'восемь'), ves: Wd('o1', 'вес'), vd2: Wd('o1', 'вдвое', 1),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'если'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const a = makeEarth(R1), b = makeEarth(R1 * 2);
    const atA = makeShell(R1 * 1.02, { base: 0, rim: .55, pow: 3.6 }), atB = makeShell(R1 * 2.04, { base: .02, rim: .7, pow: 3 });
    a.position.set(AX, 0, 0); b.position.set(BX, 0, 0); atA.position.copy(a.position); atB.position.copy(b.position);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2);
    stage.root.add(a, b, atA, atB); stage.scene.add(glint);
    return { stage, a, b, atA, atB, glint, T: TT() };
  },

  update(t, s, st) {
    const { stage, a, b, atA, atB, glint, T } = st, cam = stage.camera, L = stage.lights;
    // свет: сначала контровые, потом ключ — Земли «вырезаются» из темноты
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.key.position.set(-5, 2.5, 6.5); L.key.castShadow = false;
    L.rimL.intensity = 2.4 * lr; L.rimR.intensity = 1.6 * lr; L.key.intensity = 3.0 * lk; L.hemi.intensity = .12 * lk;
    a.rotation.set(0, t * .14 - .6, .41); b.rotation.set(0, t * .14 - .9, .41);
    atA.material.uniforms.uOp.value = lr; atB.material.uniforms.uOp.value = lr;
    const gp = ((t - s.start) / 2.8) % 1;
    glint.intensity = 6 * Math.sin(Math.PI * clamp(gp)) * lk;
    glint.position.set(lerp(-2.6, 1.8, eInOut(gp)), .9, 1.6);
    // o2: Земли опускаются под карточку и чуть отдаляются
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [.06, 0, 0], lerp(13.6, 16.5, o2) - .06 * (t - s.start), -12 + (t - s.start) * 2, lerp(6, 8, o2), 540, lerp(940, 900, o2));
  },

  draw2d(t, s, st) {
    const { stage, b, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const bp = b.position.toArray(), [bx, by] = project(cam, ...bp);
    glow(bx, by, screenR(cam, bp, R1 * 2) * 2.4, .06 * P(t, s.start + .2, 1));
    // o1: три итоговых числа
    const o1 = T.card - .35, num = { size: 190, w: 700, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 };
    const lab = { size: 46, w: 500, col: sub, track: -.005, out: o1 };
    atext('×2', 240, 540, T.vd - .05, t, { ...num, col: ink });
    atext('радиус', 240, 610, T.rad + .05, t, lab);
    atext('×8', 540, 540, T.vos - .05, t, { ...num, col: stage.accent });
    atext('масса', 540, 610, T.mas + .05, t, lab);
    atext('×2', 840, 540, T.vd2 - .05, t, { ...num, col: ink });
    atext('вес', 840, 610, T.ves + .05, t, lab);
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Что если Земля', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('вдвое больше', 540, 474, T.card + .3, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('M ∝ R³', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vd, 'tick', .16, .9);
    add(T.vos - 1.5, 'riser', .18);
    add(T.vos, 'chime', .3, .9);
    add(T.vd2, 'tick', .16, 1);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
