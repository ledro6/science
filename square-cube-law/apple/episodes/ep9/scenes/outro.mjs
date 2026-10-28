// OUTRO (38.7 – 47.6 с), чёрный фон.
// o1 — керамическая Земля с текущим ветром, медленная орбита; красная точка в глазу циклона;
//      итог крупно: «Геометрия решает, где стихнет ветер»;
// o2 — финальная карточка: Земля отъезжает вниз, штрихи ветра встают иглами (шар-«ёж», образ хука);
//      «Теорема о причёсывании ежа», строка «Пуанкаре, Брауэр» серым, красная пилюля «Подписаться на L³» (как в пилоте).
import { defineScene, makeStage, project, atext, atextWords, dot, P, Wd, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeEarth, setStrokes, earthWorld, EYE, pill, facing, bump } from './_kit.mjs';
import { lookFrom, norm3 } from './_hair.mjs';

const RAD = Math.PI / 180;
function TT() {
  return { geo: Wd('o1', 'Геометрия'), resh: Wd('o1', 'решает'), gde: Wd('o1', 'где'), stih: Wd('o1', 'стихнет'), vet: Wd('o1', 'ветер'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const earth = makeEarth({ seed: 17, nC: 0 });
    earth.tilt.rotation.set(.32, 0, .12);
    stage.root.add(earth.tilt);
    return { stage, earth, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, T } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1, eApple), lk = P(t, s.start + .3, 1.4, eApple);
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 1.9 * lk; L.hemi.intensity = .35 * lk;
    L.key.castShadow = false; L.key.position.set(4, 7, 6);
    earth.spin.rotation.y = (30 + 6 * (t - s.start)) * RAD;
    const card = P(t, T.card - .35, 1.3, eInOut);
    const spike = P(t, T.card + .3, 1.2, eInOut);
    setStrokes(earth, t, { g: 1, w: lerp(1, 1.25, card), spike });
    const az = (-10 + 2.2 * (t - s.start)) * RAD, el = lerp(9, 6, card) * RAD, dist = lerp(11.6, 21, card) - .08 * (t - s.start);
    lookFrom(cam, [dist * Math.cos(el) * Math.sin(az), dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az)], [0, 0, 0], 540, lerp(930, 880, card));
  },

  draw2d(t, s, st) {
    const { stage, earth, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // глаз циклона: красная точка (до карточки — на ней красная пилюля)
    const Ew = earthWorld(earth, EYE, 1.01), n = norm3(Ew);
    const f = clamp(facing(cam, Ew, n) / 2);
    const dA = P(t, T.stih - .1, .5) * (1 - P(t, T.card - .4, .35, eIn)) * f;
    if (dA > .003) { const [x, y] = project(cam, ...Ew); dot(x, y, 10 * dA * (1 + .3 * bump(t, T.vet + .1, .35)), stage.accent, dA); }
    // o1: итоговая мысль
    const out1 = T.card - .35;
    atextWords('Геометрия решает,', 540, 380, T.geo, t, { size: 96, w: 600, col: ink, track: -.03, stagger: .6, out: out1 });
    atextWords('где стихнет ветер', 540, 490, T.gde - .05, t, { size: 96, w: 600, col: ink, track: -.03, stagger: .3, out: out1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atext('Теорема о', 540, 340, T.card + .05, t, { size: 100, w: 600, col: ink, track: -.035 });
      atext('причёсывании ежа', 540, 462, T.card + .2, t, { size: 100, w: 600, col: ink, track: -.035 });
      atext('Пуанкаре, Брауэр', 540, 568, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.stih, 'tick', .18, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.card + .35, 'shimmer', .2, 1);
    add(T.press, 'click', .45, .9);
  },
});
