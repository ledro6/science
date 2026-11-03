// HOOK (h1–h2), чёрный фон. Белая керамическая раковина-чаша как продукт, медленная орбита.
// h1 — раковина проявляется из темноты, вода закручивается против часовой (белые трассеры, дуга-стрелка над чашей);
//      на «южном полушарии» над раковиной — маленький глобус с экватором, южная сторона повёрнута к зрителю;
//      на «в другую сторону» вихрь тормозит и разворачивается по часовой, стрелка переворачивается;
// h2 — «Новая рубрика» серым и заголовок «Миф или нет?» по словам.
import { defineScene, makeStage, atext, project, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeBowl, makeWater, simTracers, drawTracers, sinkPoint, funnelY, waterR, SINK, makeEarth, sphereCurve, latCircle, ringArrow, frame, keys, wordsAt, glow, smooth } from './kit.mjs';

function TT() {
  return {
    yuzh: Wd('h1', 'южном'), pol: Wd('h1', 'полушарии'), voda: Wd('h1', 'вода'), zak: Wd('h1', 'закручивается'),
    drug: Wd('h1', 'другую'), stor: Wd('h1', 'сторону'),
    eto: Wd('h2', 'Это'), nov: Wd('h2', 'новая'), mif: Wd('h2', 'миф'), ili: Wd('h2', 'или'), net: Wd('h2', 'нет'),
  };
}
const W0 = .55;                                   // обороты в секунду на r = 0.3 (условно, для глаза)
const T0 = TT();
// против часовой → разворот на «в другую сторону» → по часовой
const omega = t => W0 * smooth(t / 1.6) * (1 - 2 * smooth((t - T0.zak - .35) / (T0.stor + .3 - T0.zak - .35)));
const depthAt = t => .1 + .22 * smooth(Math.abs(omega(t)) / W0);
const GR = .27, GD = 10;                          // глобус: радиус и расстояние от камеры

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const bowl = makeBowl(), water = makeWater();
    water.position.y = SINK.YW;
    stage.root.add(bowl, water);
    // глобус «приклеен» к камере: стоит над раковиной, пока камера облетает её
    const globe = makeEarth(GR, 48); globe.castShadow = false;
    stage.scene.add(stage.camera); stage.camera.add(globe);
    return { stage, bowl, water, globe, T: TT() };
  },

  update(t, s, st) {
    const { stage, water, globe, T } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, 0, 1.5, eApple);
    L.key.intensity = 2.6 * lit; L.hemi.intensity = .55 * lit; L.rimL.intensity = 3.2 * P(t, 0, 1.0); L.rimR.intensity = 2.4 * P(t, .1, 1.0);
    water.scale.y = depthAt(t);
    water.mat.uniforms.uOp.value = P(t, .2, 1.0);
    const [d, el, sy] = keys([[0, 11.6, 34, 950], [T.yuzh, 11.2, 36, 975], [T.eto, 10.8, 40, 995], [s.end, 10.2, 42, 1005]], t, eInOut);
    frame(cam, [0, .4, 0], d, -18 + t * 2.0, el, 540, sy);
    // глобус: над раковиной, южное полушарие развёрнуто к зрителю
    const gp = P(t, T.yuzh - .1, .9), go = P(t, T.eto - .1, .5, eIn);
    const dy = (sy - 430) / 1920 * 2 * GD * Math.tan(13 * Math.PI / 180);
    globe.position.set(0, dy + (1 - gp) * -.12, -GD);
    globe.rotation.set(lerp(-.15, -.62, P(t, T.yuzh, 1.4, eInOut)), t * .35 - 1.2, 0, 'XYZ');
    globe.scale.setScalar(lerp(.92, 1, gp));
    globe.visible = gp * (1 - go) > .01 && !globalThis.NOTR;
    globe.material.transparent = true; globe.material.opacity = gp * (1 - go);
  },

  draw2d(t, s, st) {
    const { stage, globe, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // вода
    const P0 = simTracers(t, 0, omega, { N: 120, seed: 11 });
    drawTracers(cam, P0, sinkPoint([0, 0, 0], depthAt(t)), { col: ink, a: .9 * P(t, .3, 1.2), lw: 2.6 });
    // дуга-стрелка над задней кромкой: показывает направление вращения
    const w = omega(t), ccw = P(t, .9, .7) * smooth((w / W0 - .15) / .3), cw = smooth((-w / W0 - .15) / .3);
    const aOut = 1 - P(t, T.eto - .1, .4, eIn), c = [0, .84, 0], R = 1.28, m = Math.PI / 2;
    ringArrow(cam, c, R, m - .75, m + .75, { col: ink, a: ccw * aOut * .85, lw: 3, hh: 18 });
    ringArrow(cam, c, R, m + .75, m - .75, { col: ink, a: cw * aOut * .85, lw: 3, hh: 18 });
    // подпись под стрелкой
    const [lx, ly] = project(cam, 0, .84, -R);
    atext('против часовой', lx, ly - 34, 1.0, t, { size: 38, w: 500, col: sub, track: 0, dy: 14, out: T.zak + .25, a: .9 });
    atext('по часовой', lx, ly - 34, T.stor, t, { size: 38, w: 500, col: sub, track: 0, dy: 14, out: T.eto - .1, a: .9 });
    // глобус: экватор и подпись
    if (globe.visible) {
      const ga = globe.material.opacity;
      globe.updateMatrixWorld();
      sphereCurve(cam, globe, GR, latCircle(0), { col: ink, a: ga * .9, lw: 2.5 });
      sphereCurve(cam, globe, GR, latCircle(-35), { col: ink, a: ga * .35, lw: 1.5, dash: [4, 7] });
      const gpos = new THREE.Vector3().setFromMatrixPosition(globe.matrixWorld).toArray(), [gx, gy] = project(cam, ...gpos);
      glow(gx, gy, 240, .06 * ga);
    }
    // h2: новая рубрика
    atext('Новая рубрика', 540, 330, T.nov, t, { size: 48, w: 500, col: sub, track: -.005 });
    wordsAt(['Миф', 'или', 'нет?'], [T.mif - .05, T.ili - .05, T.net - .05], 540, 490, t, { size: 150, w: 600, col: ink, track: -.035, blur: 16, dur: .6 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(.4, 'swell', .2, .7);
    add(T.yuzh, 'whoosh', .25, 1.1);
    add(T.drug, 'whoosh', .3, .8);
    add(T.stor + .2, 'tick', .14);
    add(T.nov, 'swell', .22, .8);
    add(T.mif - .05, 'bloom', .3, .85);
    add(T.net, 'chime', .22, 1.05);
  },
});
