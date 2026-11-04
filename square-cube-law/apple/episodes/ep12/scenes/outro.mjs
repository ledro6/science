// OUTRO (45.4 – 53.2 с), чёрный фон.
// o1 — тот же аквариум: кубик на дне, корпус из той же стали на воде; свет медленно обходит их;
//      крупно «Тонет не металл, / а плотность».
// o2 — финальная карточка: «Закон Архимеда» (по словам, белым), «F = ρ · g · V» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «природы»; аквариум отходит под карточку.
import { defineScene, makeStage, project, atext, atextWords, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeCube, makeHull, makeTank, makeWater, collectMats, setLit, frame, glow, pill, HULL, DRAFT } from './kit.mjs';

const TW = 4.4, TD = 4.0, TH = 2.6, WL = 2.0, CX = -1.25, CZ = .55, HX = 1.0;
function TT() {
  return { ton: Wd('o1', 'Тонет'), met: Wd('o1', 'металл'), a: Wd('o1', 'а'), pl: Wd('o1', 'плотность'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const tank = makeTank(TW, TD, TH);
    const water = makeWater(TW - .02, TD - .02, { opacity: .13, edgeOp: .5, surf: { base: .04, fres: .3, spec: 1.1 } });
    const cube = makeCube(), hull = makeHull();
    hull.rotation.y = Math.PI / 2;
    stage.root.add(tank, water, cube, hull);
    return { stage, T: TT(), tank, water, cube, hull, mats: collectMats(stage.root) };
  },

  update(t, s, st) {
    const { stage, T, tank, water, cube, hull } = st, cam = stage.camera, L = stage.lights;
    // сначала контровые и рёбра, потом ключ; ключ обходит объекты
    const lr = P(t, s.start, 1.0), lk = P(t, s.start + .3, 1.3);
    const la = (t - s.start) * .3 - .6;
    L.key.position.set(7 * Math.sin(la), 9, 7 * Math.cos(la));
    L.key.intensity = 2.7 * lk; L.hemi.intensity = .5 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    setLit(st.mats, lerp(.15, 1, lk));
    tank.setA(lr);
    water.set(WL, t, lr);
    water.hole(HX - HULL.B / 2 + .01, HX + HULL.B / 2 - .01, -HULL.L / 2 + .01, HULL.L / 2 - .01);
    cube.position.set(CX, .52, CZ); cube.rotation.set(0, .35, 0);
    hull.position.set(HX, WL - DRAFT + .015 * Math.sin(t * 1.7), 0);
    hull.rotation.set(.012 * Math.sin(t * 1.15 + .5), Math.PI / 2, .018 * Math.sin(t * 1.3));
    hull.set({ fold: 1 });
    // o2: аквариум отходит под карточку
    const o2 = P(t, T.card - .2, 1.2, eInOut);
    frame(cam, [.1, 1.1, 0], lerp(29, 44, o2) - .1 * (t - s.start), 18 + (t - s.start) * 1.6, lerp(26, 30, o2), 540, lerp(960, 830, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 20, 420, .05 * P(t, s.start + .2, 1));
    // o1: итоговая мысль
    const o1 = T.card - .35;
    atextWords('Тонет не металл,', 540, 360, T.ton - .05, t, { size: 112, w: 600, col: ink, track: -.03, stagger: .2, out: o1 });
    atextWords('а плотность', 540, 480, T.a - .05, t, { size: 112, w: 600, col: ink, track: -.03, stagger: .08, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Закон Архимеда', 540, 380, T.card + .05, t, { size: 104, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('F = ρ · g · V', 540, 485, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.met, 'whoosh', .22, 1.0);
    add(T.pl, 'chime', .24, .95);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
