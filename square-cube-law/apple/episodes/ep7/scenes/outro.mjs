// OUTRO (44.1 – 52.5 с), чёрный фон.
// o1 — «хаос чисел»: графитовые плашки с настоящими числами медленно кувыркаются в пустоте; на «порядок»
//      каждая летит в столбик своей первой цифры и встаёт плиткой лицом к камере: столбики складываются в кривую Бенфорда.
// o2 — финальная карточка: «Закон Бенфорда», «P(d) = log₁₀(1 + 1/d)» серым, красная пилюля «Подписаться на L³».
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, clamp, lerp, rng, eApple, eIn, eInOut } from '../../../engine.mjs';
import { NUMS, lead, makeCards, frame, subscribePill } from './kit.mjs';

const N = NUMS.length, SC = .3, TH = .8 * SC + .016;      // плитка: масштаб карточки и шаг по высоте в столбике
const COLX = d => (d - 5) * .56;

function TT() {
  return { dazhe: Wd('o1', 'Даже'), haos: Wd('o1', 'хаосе'), est: Wd('o1', 'есть'), por: Wd('o1', 'порядок'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    stage.camera.far = 200; stage.camera.updateProjectionMatrix();
    const T = TT();
    const deck = makeCards(N, { fog: false });
    deck.bodies.castShadow = true;
    const R = rng(23), cnt = {};
    const cards = deck.cards.map((c, i) => {
      const d = lead(c.k), slot = cnt[d] = (cnt[d] || 0) + 1;
      // точка в «облаке» хаоса
      const u = R() * 2 - 1, th = R() * Math.PI * 2, r = 1.0 + R() * 1.4;
      return {
        d, slot: slot - 1, p: [Math.sqrt(1 - u * u) * Math.cos(th) * r * 1.15, 1.45 + u * r * .95, Math.sqrt(1 - u * u) * Math.sin(th) * r * .8],
        rot: [R() * 6, R() * 6, R() * 6], spin: [(R() - .5) * 1.4, (R() - .5) * 1.4, (R() - .5) * .8], dr: [(R() - .5) * .25, (R() - .5) * .25], delay: R() * .35,
      };
    });
    stage.root.add(deck.grp);
    return { stage, T, deck, cards, V: new THREE.Vector3(), Q: new THREE.Quaternion(), Q2: new THREE.Quaternion(), E3: new THREE.Euler() };
  },

  update(t, s, st) {
    const { stage, T, deck, cards, V, Q, Q2, E3 } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.1), lk = P(t, s.start + .3, 1.4);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk;
    L.key.position.set(lerp(-6, 5, clamp((t - s.start) / 6)), 9, 7);
    // o2: столбики отъезжают вниз и чуть уменьшаются под карточку
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    const gs = lerp(1, .86, o2);
    deck.grp.scale.setScalar(gs); deck.grp.position.set(0, lerp(0, .55, o2), 0);
    cards.forEach((c, i) => {
      const tt = t - s.start;
      const order = eInOut(clamp((t - (T.por - .15 + c.delay)) / 1.15));
      // хаос: медленный дрейф и кувыркание
      const cx = c.p[0] + c.dr[0] * tt, cy = c.p[1] + c.dr[1] * tt;
      E3.set(c.rot[0] + c.spin[0] * tt, c.rot[1] + c.spin[1] * tt, c.rot[2] + c.spin[2] * tt); Q.setFromEuler(E3);
      // порядок: плитка в столбике своей первой цифры, лицом к камере
      const tx = COLX(c.d), ty = TH / 2 + c.slot * TH, tz = 0;
      Q2.identity();
      V.set(lerp(cx, tx, order), lerp(cy, ty, order) + Math.sin(Math.PI * order) * .35, lerp(c.p[2], tz, order));
      Q.slerp(Q2, order);
      const app = P(t, s.start + .05 + i * .02, .9);
      deck.set(i, V, Q, SC * lerp(1.7, 1, order), app * lerp(1.6, 2.4, order), 1, 1);
    });
    deck.commit();
    frame(cam, [0, 1.35, 0], 20, lerp(-10, 6, clamp((t - s.start) / 8)), 8, 540, lerp(900, 930, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st;
    const ink = '#FFFFFF', sub = stage.sub;
    const o1 = T.card - .35;
    atextWords('Даже в хаосе чисел', 540, 330, T.dazhe, t, { size: 84, w: 600, col: ink, track: -.03, stagger: .12, out: o1 });
    atextWords('есть порядок', 540, 435, T.est - .05, t, { size: 84, w: 600, col: ink, track: -.03, stagger: .14, out: o1 });
    if (t > T.card - .1) {
      atextWords('Закон Бенфорда', 540, 380, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('P(d) = log₁₀(1 + 1/d)', 540, 480, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      subscribePill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.por - 1.5, 'riser', .2);
    add(T.por + .6, 'click', .3, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
