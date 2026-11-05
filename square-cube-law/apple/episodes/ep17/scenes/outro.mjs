// OUTRO (43,6 – 52,8 с), чёрный фон.
// o1 — та же студия: третья дверь открыта (пусто), под второй полоска нового выбора; на «выгодно» вторая дверь
//      распахивается, ключ скользит по машине; крупно «Менять выгодно», ниже «2 из 3 против 1» («2 из 3» красным).
// o2 — финальная карточка: «Парадокс Монти Холла» (по словам, белым), серым «P(смена) = 2/3»,
//      красная пилюля «Подписаться на L³» с нажатием на «природы»; студия отходит под карточку.
import { defineScene, makeStage, project, atext, atextWords, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { makeStudio, frame, glow, pill, atextParts, selBar } from './kit.mjs';

function TT() {
  return {
    men: Wd('o1', 'Менять'), vyg: Wd('o1', 'выгодно'), dva: Wd('o1', 'два'), prot: Wd('o1', 'против'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const studio = makeStudio({ prize: 1 });
    stage.root.add(studio.grp);
    return { stage, T: TT(), studio };
  },

  update(t, s, st) {
    const { stage, T, studio } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.0), lk = P(t, s.start + .3, 1.3);
    const la = (t - s.start) * .22 - .6;
    L.key.position.set(7 * Math.sin(la), 9, 7 * Math.cos(la));
    L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    studio.lit(lerp(.1, 1, lk));
    studio.doors.forEach((d, i) => {
      const open = i === 2 ? .92 : i === 1 ? eSpring(clamp((t - T.vyg + .1) / 1.3)) * .92 : 0;
      d.set({ open, bright: lerp(.1, 1, lk) * (i === 0 ? .8 : 1) });
    });
    const o2 = P(t, T.card - .2, 1.3, eInOut);
    const dt = t - s.start;
    frame(cam, [0, 1.2, -.6], lerp(27, 40, o2) - .12 * dt, -5 - dt * 1.2, lerp(4, 12, o2), 540, lerp(1030, 860, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub, acc = stage.accent;
    const [fx, fy] = project(cam, 0, 0, -.6);
    glow(fx, fy - 60, 560, .06 * P(t, s.start + .2, 1));
    const o1 = T.card - .35;
    selBar(cam, 1, P(t, s.start + .2, .6) * (1 - P(t, o1, .35, eIn)), ink);
    // o1: итоговая мысль
    atextWords('Менять выгодно', 540, 400, T.men - .05, t, { size: 112, w: 600, col: ink, track: -.03, stagger: .45, out: o1 });
    atextParts([['2 из 3', acc], [' против 1', ink, T.prot - T.dva]], 540, 530, T.dva - .05, t, { size: 96, w: 600, track: -.03, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Парадокс Монти Холла', 540, 380, T.card + .05, t, { size: 84, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('P(смена) = 2/3', 540, 485, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vyg - .05, 'whoosh', .22, .8);
    add(T.vyg + .9, 'bloom', .24, .9);
    add(T.dva, 'chime', .24, .95);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
