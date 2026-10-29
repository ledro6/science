// OUTRO (41.873 – 50.921 с), чёрный фон.
// o1 — Земля в вытянутой водной оболочке и Луна вдвое ближе, медленная орбита, блик бежит по стеклу;
//      «÷2 расстояние» белым и «×8 прилив» красным;
// o2 — финальная карточка: «Что если Луна вдвое ближе» (по словам, белым), «прилив ∝ 1/d³» серым
//      (³ — красная), красная пилюля «Подписаться на L³» с нажатием на «если».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { ctx, makeEarth, makeMoon, makeShell, tideShell, frame, glow, screenR, pill } from './kit.mjs';

const RE = .68, RM = .185, EX = -.8, MX = .7;
function TT() {
  return {
    ras: Wd('o1', 'Расстояние'), dva: Wd('o1', 'два'), pril: Wd('o1', 'прилив'), vos: Wd('o1', 'восемь'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'если'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const earth = makeEarth(RE), moon = makeMoon(RM);
    const shell = makeShell(RE * 1.07, { base: .06, rim: .9, pow: 2.4 });
    earth.position.set(EX, 0, 0); shell.position.copy(earth.position); moon.position.set(MX, 0, 0);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2);
    stage.root.add(earth, moon, shell); stage.scene.add(glint);
    return { stage, earth, moon, shell, glint, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, moon, shell, glint, T } = st, cam = stage.camera, L = stage.lights;
    // свет: сначала контровые, потом ключ — объект «вырезается» из темноты
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.key.position.set(-5, 2.5, 6.5); L.key.castShadow = false;
    L.rimL.intensity = 2.4 * lr; L.rimR.intensity = 1.6 * lr; L.key.intensity = 3.0 * lk; L.hemi.intensity = .12 * lk;
    earth.rotation.set(0, t * .14 - .6, .41);
    moon.rotation.set(0, -.3, 0);
    const b = lerp(.14, .26, P(t, T.pril - .1, 1.2, eInOut));
    tideShell(shell, b, 0);
    shell.material.uniforms.uOp.value = P(t, s.start + .2, 1.0);
    const gp = ((t - s.start) / 2.8) % 1;
    glint.intensity = 6 * Math.sin(Math.PI * clamp(gp)) * lk;
    glint.position.set(lerp(-2.6, 1.8, eInOut(gp)), .9, 1.6);
    // o2: объект опускается под карточку и чуть отдаляется
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [-.08, 0, 0], lerp(14.5, 17.5, o2) - .06 * (t - s.start), -14 + (t - s.start) * 2.2, lerp(7, 9, o2), 540, lerp(930, 880, o2));
  },

  draw2d(t, s, st) {
    const { stage, moon, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const mp = moon.position.toArray(), [mx, my] = project(cam, ...mp);
    glow(mx, my, screenR(cam, mp, RM) * 5, .16 * P(t, s.start + .2, 1));
    // o1: два итоговых числа
    const o1 = T.card - .35;
    atext('÷2', 300, 540, T.dva, t, { size: 240, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('расстояние', 300, 620, T.ras + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    atext('×8', 780, 540, T.vos, t, { size: 240, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('прилив', 780, 620, T.pril + .1, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Что если Луна', 540, 350, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atextWords('вдвое ближе', 540, 474, T.card + .3, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .09 });
      atext('прилив ∝ 1/d³', 540, 580, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.dva, 'tick', .16, .9);
    add(T.vos - 1.5, 'riser', .18);
    add(T.vos, 'chime', .3, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
