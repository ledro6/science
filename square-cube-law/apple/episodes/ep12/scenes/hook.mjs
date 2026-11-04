// HOOK (0 – 9.6 с), чёрный фон. Стеклянный аквариум с водой (тонкие рёбра, живая поверхность).
// k1 — стальной кубик висит над водой и на «тонет» падает: круги по воде, пузырьки, за полсекунды на дне;
//      рядом корпус-лодка из той же стали держится на воде; камера смещается к лодке; выноски «тонет» / «плывёт».
// k2 — «Почему?» крупно; камера отходит, заголовок «Закон Архимеда» по словам.
import { defineScene, makeStage, project, atext, callout, P, Wd, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeCube, makeHull, makeTank, makeWater, makeBubbles, sinkY, collectMats, setLit, frame, keys, glow, wordsAt, HULL, DRAFT } from './kit.mjs';

const TW = 4.4, TD = 4.0, TH = 2.6, WL = 2.0;
const CX = -1.25, CZ = .55, HX = 1.0;
function TT() {
  return {
    kub: Wd('k1', 'кубик'), ton: Wd('k1', 'тонет'), mgn: Wd('k1', 'мгновенно'), a: Wd('k1', 'А'), kor: Wd('k1', 'корабль'),
    des: Wd('k1', 'десятки'), plyv: Wd('k1', 'плывёт'), poch: Wd('k2', 'Почему'), eto: Wd('k2', 'Это'),
    zak: Wd('k2', 'закон'), arh: Wd('k2', 'Архимеда'),
  };
}
const Y0 = WL + .75;
const drop = (t, T) => sinkY(t, T.ton - .08, Y0, WL, .02);

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const T = TT();
    const tank = makeTank(TW, TD, TH);
    const water = makeWater(TW - .02, TD - .02, { opacity: .13, edgeOp: .5, surf: { base: .04, fres: .3, spec: 1.1 } });
    const cube = makeCube(), hull = makeHull();
    hull.rotation.y = Math.PI / 2;
    const bubbles = makeBubbles(46);
    stage.root.add(tank, water, cube, hull, bubbles);
    return { stage, T, tank, water, cube, hull, bubbles, mats: collectMats(stage.root) };
  },

  update(t, s, st) {
    const { stage, T, tank, water, cube, hull, bubbles } = st, cam = stage.camera, L = stage.lights;
    // из темноты: сначала контровые и рёбра стекла, потом ключ; ключ медленно проходит по объектам
    const lr = P(t, 0, .9), lk = P(t, .25, 1.3);
    L.key.position.set(lerp(-5, 4, clamp(t / 9)), 9, 6);
    L.key.intensity = 2.7 * lk; L.hemi.intensity = .5 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    setLit(st.mats, lerp(.15, 1, lk));
    tank.setA(lr);
    const d = drop(t, T);
    water.splash(d.tEntry, CX, CZ);
    water.set(WL, t, lr);
    water.hole(HX - HULL.B / 2 + .01, HX + HULL.B / 2 - .01, -HULL.L / 2 + .01, HULL.L / 2 - .01);
    cube.position.set(CX, d.y + .5, CZ);
    // лёгкий наклон в полёте, выравнивается на дне
    const tilt = d.phase === 0 ? 0 : d.phase < 3 ? .12 * Math.sin(clamp((t - T.ton) / 1.2) * Math.PI) : 0;
    cube.rotation.set(tilt * .6, .35, tilt);
    // лодка покачивается на воде
    hull.position.set(HX, WL - DRAFT + .015 * Math.sin(t * 1.7), 0);
    hull.rotation.set(.012 * Math.sin(t * 1.15 + .5), Math.PI / 2, .018 * Math.sin(t * 1.3));
    hull.set({ fold: 1 });
    bubbles.set(t, d.tEntry, Math.min(d.tBottom + .35, d.tEntry + 1.4),
      τ => { const q = drop(τ, T); return [CX, q.y + .5, CZ]; }, WL, lr);
    // камера: общий план → ближе к лодке на «корабль» → отход под заголовок
    const [tx, ty, dist, az, el, sy] = keys([
      [0, -.1, 1.2, 33, 18, 25, 960], [T.mgn + .6, -.2, 1.0, 31, 22, 26, 980],
      [T.kor - .2, -.2, 1.0, 31, 24, 26, 980], [T.plyv + .2, .45, 1.1, 28, 32, 28, 980],
      [T.poch + .3, .45, 1.1, 28, 34, 28, 980], [T.zak + .4, .1, 1.1, 34, 28, 26, 1030], [s.end, .1, 1.1, 34.5, 32, 26, 1030],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, cube, hull } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    // мягкий свет под аквариумом
    const [fx, fy] = project(cam, 0, 0, 0);
    glow(fx, fy + 20, 420, .05 * P(t, .2, 1.2));
    // выноски: «тонет» над кубиком, «плывёт» над лодкой
    const oC = T.poch - .15;
    const aC = 1 - P(t, oC, .35, eIn);
    const [cx, cy] = project(cam, cube.position.x, cube.position.y + .5, cube.position.z);
    if (t > T.ton + .45 && aC > .003) {
      callout(cx, cy, cx, 620, T.ton + .45, t, ink, aC);
      atext('тонет', cx, 590, T.ton + .55, t, { size: 48, w: 500, col: ink, a: aC, track: -.005, dy: 16 });
    }
    const [hx, hy] = project(cam, hull.position.x, hull.position.y + HULL.H + .02, hull.position.z + .3);
    if (t > T.plyv - .1 && aC > .003) {
      callout(hx, hy, hx, 620, T.plyv - .1, t, ink, aC);
      atext('плывёт', hx, 590, T.plyv, t, { size: 48, w: 500, col: ink, a: aC, track: -.005, dy: 16 });
    }
    // k2: «Почему?» → заголовок «Закон Архимеда»
    atext('Почему?', 540, 520, T.poch - .05, t, { size: 200, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.zak - .35 });
    wordsAt(['Закон', 'Архимеда'], [T.zak - .05, T.arh - .05], 540, 470, t, { size: 112, w: 600, col: ink, track: -.03 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .32, .8);
    add(T.ton - .05, 'whoosh', .25, 1.2);
    const d = sinkY(99, T.ton - .08, Y0, WL, .02);
    add(d.tEntry, 'splash', .35, .9);
    add(d.tBottom, 'thud', .45, .7);
    add(T.kor, 'swell', .25, .8);
    add(T.plyv, 'chime', .22, 1.0);
    add(T.poch, 'tick', .2, .9);
    add(T.zak - .1, 'bloom', .3, .8);
    add(T.arh, 'chime', .24, .95);
  },
});
