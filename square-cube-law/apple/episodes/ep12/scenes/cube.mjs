// CUBE (9.6 – 22.7 с), светлый фон — «продуктовая страница».
// c1 — стальной кубик рядом с таким же кубом воды: «в 8 раз» (сталь тяжелее воды); вода уходит, у кубика
//      размерные линии «1 м», крупно «7,85 т» (вес кубика).
// c2 — кубик поднимается, под ним из стекла собирается аквариум; кубик опускается на дно, уровень воды
//      растёт ровно на его объём: пунктир прежнего уровня, «+1 м³», крупно «1 т» (вытесненная вода);
//      стрелки сил: вес вниз (длинная, «7,85 т»), выталкивающая вверх (короткая, «1 т»).
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, eApple, eIn, eInOut, eSpring } from '../../../engine.mjs';
import { steelMat, makeCube, makeTank, makeWater, frame, keys, dim, force, dash3, dec, wordsAt } from './kit.mjs';

const TW = 2.4, TD = 1.6, TH = 2.0, H0 = 1.25, A = TW * TD;
function TT() {
  return {
    st: Wd('c1', 'Сталь'), vos: Wd('c1', 'восемь'), tyazh: Wd('c1', 'тяжелее'), vody: Wd('c1', 'воды'),
    kub: Wd('c1', 'Кубик'), metr: Wd('c1', 'метр'), ves: Wd('c1', 'весит'), vos2: Wd('c1', 'восемь', 1), tonn: Wd('c1', 'тонн'),
    a: Wd('c2', 'А'), vyt: Wd('c2', 'вытесняет'), odin: Wd('c2', 'один'), kbm: Wd('c2', 'кубометр'), odnu: Wd('c2', 'одну'), tonnu: Wd('c2', 'тонну'),
    vyt2: Wd('c2', 'Выталкивающей'), sily: Wd('c2', 'силы'), ne: Wd('c2', 'не'),
  };
}
// низ кубика: стоит на полу → поднимается над аквариумом → опускается на дно
const cubeB = (t, T) => 2.3 * P(t, T.a - .1, .8, eInOut) - 2.28 * P(t, T.vyt + .55, 1.15, eInOut);
// погружённая доля и уровень воды (уровень растёт вместе с погружением: h = H0 + s/A)
const sub = b => clamp((H0 - b) / (1 - 1 / A));
const levelAt = b => H0 + sub(b) / A;

defineScene('cube', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .55 });
    const T = TT();
    const cube = makeCube(steelMat(true));
    // куб воды того же объёма: стекло + вода (тонкие тёмные рёбра — читаются на светлом)
    const wbox = makeTank(1, 1, 1, { edge: '#1D1D1F', edgeOp: .55, op: .1 });
    const wcube = makeWater(.98, .98, { col: '#B9C4D0', opacity: .4, edge: '#1D1D1F', edgeOp: .0, surf: { col: '#8E9AA8', base: .3, fres: .3, spec: .6 } });
    const tank = makeTank(TW, TD, TH, { edge: '#1D1D1F', edgeOp: .6, op: .08 });
    const water = makeWater(TW - .02, TD - .02, { col: '#B9C4D0', opacity: .3, edge: '#1D1D1F', edgeOp: .3, surf: { col: '#8E9AA8', base: .12, fres: .25, spec: .6 } });
    stage.root.add(cube, wbox, wcube, tank, water);
    return { stage, T, cube, wbox, wcube, tank, water };
  },

  update(t, s, st) {
    const { stage, T, cube, wbox, wcube, tank, water } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(1, 4, clamp((t - s.start) / 13)), 9, 6);
    // c1: кубик и куб воды рядом; на «Кубик» вода уходит, сталь — в центр
    const wIn = P(t, T.st + .25, .7) * (1 - P(t, T.kub - .2, .5, eIn));
    const toC = P(t, T.kub - .2, 1.0, eInOut);
    const b = cubeB(t, T);
    cube.position.set(lerp(-.68, 0, toC), b + .5, 0);
    cube.rotation.set(0, lerp(.18, 0, toC), 0);
    cube.scale.setScalar(eSpring(clamp((t - T.st + .15) / .8)));
    wbox.position.set(.68, 0, 0); wcube.position.set(.68, 0, 0);
    wbox.setA(wIn); wcube.set(.985 * eSpring(clamp((t - T.st - .2) / .9)), t, wIn);
    // c2: аквариум проявляется под поднятым кубиком
    const tIn = P(t, T.a + .25, .7);
    tank.setA(tIn);
    water.set(levelAt(b), t, tIn);
    // камера: близко к двум кубам → на кубик → отход на аквариум
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, 0, .5, 13.6, 24, 16, 930], [T.kub - .2, 0, .5, 13.4, 26, 16, 930], [T.kub + .9, 0, .5, 11.2, 30, 15, 900],
      [T.tonn + .3, 0, .5, 11.0, 34, 15, 900], [T.vyt + .3, 0, 1.0, 15.2, 30, 15, 880], [s.end, 0, 1.0, 14.6, 38, 15, 880],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, cube } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const bigNum = (txt, cap, t0, tOut, o = {}) => {
      const { y = 430, size = 240 } = o;
      atext(txt, 540, y, t0, t, { size, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: tOut });
      atext(cap, 540, y + Math.round(size * .27), t0 + .25, t, { size: 46, w: 500, col: sub, track: -.005, out: tOut });
    };
    // c1: подписи под кубами
    const oL = T.kub - .3;
    const lab = (txt, x3, t0) => { const [x, y] = project(cam, x3, 0, .62); atext(txt, x, y + 70, t0, t, { size: 40, w: 500, col: sub, track: 0, out: oL }); };
    lab('сталь', -.68, T.st + .2); lab('вода', .68, T.vody - .1);
    bigNum('в 8 раз', 'сталь тяжелее воды', T.vos - .05, T.kub - .3, { size: 200 });
    // размерные линии «1 м» по нижнему ребру и по высоте
    const aD = P(t, T.metr - .1, .5) * (1 - P(t, T.a - .2, .35, eIn));
    if (aD > .003) {
      const c = cube.position, z = .5 + .28;
      const [x1, y1] = project(cam, c.x - .5, c.y - .5, z), [x2, y2] = project(cam, c.x + .5, c.y - .5, z);
      dim(x1, y1, x2, y2, aD, ink);
      atext('1 м', (x1 + x2) / 2, (y1 + y2) / 2 + 58, T.metr, t, { size: 42, w: 500, col: ink, a: aD, track: -.01, dy: 14, dur: .6 });
      const [x3, y3] = project(cam, c.x + .5 + .28, c.y - .5, .5), [x4, y4] = project(cam, c.x + .5 + .28, c.y + .5, .5);
      dim(x3, y3, x4, y4, aD * P(t, T.metr + .1, .5), ink);
      atext('1 м', x3 + 26, (y3 + y4) / 2 + 14, T.metr + .15, t, { size: 42, w: 500, col: ink, a: aD, track: -.01, dy: 14, dur: .6, align: 'left' });
    }
    bigNum('7,85 т', 'вес кубика', T.vos2 - .05, T.a - .15);
    // c2: прежний уровень (пунктир) и прирост «+1 м³»
    const b = cubeB(t, T), lv = levelAt(b);
    const aL = P(t, T.vyt + .9, .5) * (1 - P(t, T.vyt2 - .3, .4, eIn));
    if (aL > .003) {
      dash3(cam, [-TW / 2, H0, TD / 2], [TW / 2, H0, TD / 2], ink, .7 * aL, 2);
      const [xa, ya] = project(cam, TW / 2 + .2, H0, TD / 2), [xb, yb] = project(cam, TW / 2 + .2, lv, TD / 2);
      dim(xa, ya, xb, yb, aL * P(t, T.odin - .1, .4), ink, 9);
      atext('+1 м³', xa + 22, (ya + yb) / 2 + 14, T.kbm - .05, t, { size: 40, w: 600, col: ink, a: aL, track: -.01, align: 'left', plain: true });
    }
    bigNum('1 т', 'вытесненная вода', T.odnu - .05, T.vyt2 - .3);
    // стрелки сил: вес (длинная) и выталкивающая (короткая)
    const aF = P(t, T.vyt2 - .15, .5);
    if (aF > .003) {
      const c = cube.position;
      const [x0, y0] = project(cam, c.x, c.y, c.z + .5);
      const W = 220, B = Math.max(40, W / 7.85);
      force(x0 - 18, y0, W, 1, ink, aF, P(t, T.vyt2 - .1, .9, eApple));
      force(x0 + 18, y0, B, -1, ink, aF, P(t, T.sily - .1, .6, eApple));
      atext('вес 7,85 т', x0 - 40, y0 + W - 14, T.vyt2 + .3, t, { size: 40, w: 500, col: ink, align: 'right', track: 0 });
      atext('1 т', x0 + 40, y0 - B + 12, T.sily, t, { size: 40, w: 600, col: ink, align: 'left', track: 0 });
    }
    wordsAt(['Силы', 'не', 'хватает'], [T.sily - .05, T.ne - .05, T.ne + .05], 540, 430, t, { size: 112, w: 600, col: ink, track: -.03 });
  },

  sfx(add) {
    const T = TT();
    add(T.st - .05, 'thud', .3, .9);
    add(T.st + .3, 'whoosh', .2, 1.1);
    add(T.vos, 'chime', .22, .9);
    add(T.metr, 'tick', .2);
    add(T.vos2, 'chime', .24, .85);
    add(T.a, 'whoosh', .25, .9);
    add(T.vyt + .9, 'splash', .25, 1.1);
    add(T.vyt + 1.65, 'thud', .3, .7);
    add(T.kbm, 'tick', .2, 1.1);
    add(T.odnu, 'chime', .24, 1.0);
    add(T.vyt2, 'swell', .22, .8);
    add(T.ne, 'thud', .25, .6);
  },
});
