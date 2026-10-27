// OUTRO (45.80 – 55.99 с), чёрный фон. Возвращаемся к паре из хука: мышь и слон на чёрном зеркале.
// o1: «Чем больше / тем медленнее» → строки уходят в серый, «и тем дольше»; над слоном снова тянется таймлайн 60 лет.
// o2: финальная карточка: «Закон Клайбера», «P ∝ M¾» серым, красная пилюля «Подписаться на L³» (как в пилоте).
import {
  defineScene, makeStage, project, atext, atextWords, line, measure, P, Wd, WdE, clamp, lerp,
  eApple, eIn, eInOut, eEase, THREE, MAT, C_GRAY,
} from '../../../engine.mjs';
import { makeMouse, makeElephant } from '../../../models.mjs';
import { frame, lerp3, collectMats, setLit, mirrorFloor, twin, beat, formula, pill } from '../lib.mjs';

const V = new THREE.Vector3();
const MOUSE = { p: [-1.0, 0, 1.0], ry: .3, s: .78 };
const ELE = { p: [.9, 0, -1.0], ry: Math.PI - .2, s: .82 };
function TT() {
  return {
    chem: Wd('o1', 'Чем'), bol: Wd('o1', 'больше'), tem: Wd('o1', 'тем'), med: Wd('o1', 'медленнее'), live: Wd('o1', 'живёшь'),
    i: Wd('o1', 'И'), dol: Wd('o1', 'дольше'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы'),
  };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    mirrorFloor(stage);
    const mouse = twin(makeMouse, MAT.ceramicWhite()), ele = twin(makeElephant, MAT.graphite());
    stage.root.add(mouse.ga, mouse.gb, ele.ga, ele.gb);
    mouse.place(...MOUSE.p, MOUSE.ry, MOUSE.s); ele.place(...ELE.p, ELE.ry, ELE.s);
    return { stage, mouse, ele, T: TT(), mM: collectMats(mouse.ga), eM: collectMats(ele.ga) };
  },

  update(t, s, st) {
    const { stage, mouse, ele, T } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start + .05, 1.1, eApple), lk = P(t, s.start + .3, 1.4, eApple);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.6 * lk; L.hemi.intensity = .5 * lk;
    const sw = eInOut(clamp((t - T.med) / 2.5));
    L.key.position.set(lerp(-6, 5, sw), 9, lerp(2, 6, sw));
    setLit(st.mM, P(t, s.start, 1.0, eEase)); setLit(st.eM, P(t, s.start + .25, 1.2, eEase));
    // мышь «живёт быстро» — частый пульс и хвост; слон — медленно
    mouse.pose({ wag: t * 6, squash: .05 * beat(t * 10) });
    ele.pose({ flap: .12 * Math.sin(t * .9), trunk: .3 * Math.sin(t * .55) });
    // камера: медленная орбита → на карточке пара уходит ниже и дальше
    const kc = P(t, T.card - .3, 1.6, eInOut);
    const tg = lerp3([.15, 1.1, 0], [.2, 1.2, 0], kc);
    frame(cam, tg, lerp(21, 26, kc), lerp(30, 16, clamp((t - s.start) / 9)), lerp(6, 8, kc), 540, lerp(1010, 830, kc));
  },

  draw2d(t, s, st) {
    const { stage, mouse, ele, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const out1 = T.card - .45;
    const gray = P(t, T.i - .1, .6);
    const col = k => `rgba(${Math.round(lerp(255, 134, k))},${Math.round(lerp(255, 134, k))},${Math.round(lerp(255, 139, k))},1)`;
    atextWords('Чем больше', 540, 340, T.chem - .05, t, { size: 108, w: 600, col: col(gray), track: -.03, out: out1, stagger: T.bol - T.chem });
    atextWords('тем медленнее', 540, 462, T.tem - .05, t, { size: 108, w: 600, col: col(gray), track: -.03, out: out1, stagger: T.med - T.tem });
    atextWords('и тем дольше', 540, 584, T.i - .05, t, { size: 108, w: 600, col: ink, track: -.03, out: out1, stagger: .16 });

    // таймлайны жизни — повтор из хука (10 px на год)
    const tl = (o, l, years, t0, label) => {
      o.ga.updateMatrixWorld();
      const [hx, hy] = project(cam, ...o.ga.localToWorld(V.set(...l)).toArray());
      const len = years * 10, x0 = clamp(hx - len / 2, 100, 940 - len), pd = P(t, t0, .9, eApple), a = 1 - P(t, out1, .35, eIn);
      if (pd <= 0 || a <= .003) return;
      line(x0, hy, x0 + len * pd, hy, ink, .8 * a, 2);
      line(x0, hy - 9, x0, hy + 9, ink, .8 * a, 2);
      line(x0 + len, hy - 9, x0 + len, hy + 9, ink, .8 * a * P(t, t0 + .75, .3), 2);
      atext(label, x0 + len / 2, hy - 26, t0 + .1, t, { size: 38, w: 600, col: ink, a, track: -.01, dy: 14, dur: .6 });
    };
    tl(mouse, [0, .78, 0], 2, T.i, '2 года');
    tl(ele, [0, 3.25, 0], 60, T.dol - .1, '60 лет');

    // финальная карточка
    atextWords('Закон Клайбера', 540, 380, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .12 });
    formula(540, 500, T.card + .55, T.card + .7, t, { size: 66, col: sub, w: 500 });
    pill(t, T.card + .65, T.press);
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .05, 'swell', .3, .6);
    add(T.med, 'whoosh', .2, .7);
    add(T.dol, 'bloom', .25, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
