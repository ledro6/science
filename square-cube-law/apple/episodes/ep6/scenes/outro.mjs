// OUTRO (40.4 – 49.5 с), чёрный фон.
// o1 — керамическая бактерия плывёт в «густой» воде (медленные линии тока); «Размер меняет» → «саму воду»,
//      на «воду» линии тока светлеют;
// o2 — финальная карточка: «Число Рейнольдса», «Re = ρvL/μ» серым, бактерия-герой медленно вращается
//      с бегущим бликом, красная пилюля «Подписаться на L³» с нажатием на «природы».
import { defineScene, makeStage, atext, atextWords, P, Wd, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, rng } from '../../../engine.mjs';
import { frame, makeBacterium } from './_kit.mjs';
import { ctx, streams, pill } from './_draw.mjs';

function TT() {
  return { raz: Wd('o1', 'Размер'), men: Wd('o1', 'меняет'), sil: Wd('o1', 'силу'), samu: Wd('o1', 'саму'), vodu: Wd('o1', 'воду'),
    card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}

defineScene('outro', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const T = TT();
    const sw = new THREE.Group(); stage.root.add(sw);
    const bac = makeBacterium(THREE, MAT.ceramicWhite());
    sw.add(bac);
    const N = 110, R = rng(23);
    const motes = new THREE.InstancedMesh(new THREE.SphereGeometry(.016, 8, 6), new THREE.MeshBasicMaterial({ color: '#8E8E93', transparent: true, opacity: .5 }), N);
    const M = new THREE.Matrix4();
    for (let i = 0; i < N; i++) { const s = .6 + R() * 1.2; M.makeScale(s, s, s).setPosition(-6 + R() * 12, -4 + R() * 8, -5 + R() * 5); motes.setMatrixAt(i, M); }
    stage.root.add(motes);
    const glint = new THREE.PointLight('#ffffff', 0, 0, 2); stage.scene.add(glint);
    return { stage, T, sw, bac, motes, glint };
  },

  update(t, s, st) {
    const { stage, T, sw, bac, motes, glint } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start + .05, 1.1, eApple), lk = P(t, s.start + .4, 1.4, eApple);
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.2 * lk; L.hemi.intensity = .4 * lk; L.key.castShadow = false;
    const k = P(t, T.card - .45, 1.2, eInOut);
    // o1: плывёт по диагонали; карточка: горизонтально, в центре, медленно вращается вокруг вертикали
    sw.rotation.set(lerp(0, .25, k), lerp(0, -.5 + .5 * Math.sin((t - T.card) * .7), k), lerp(.62, .12, k));
    sw.position.set(0, 0, 0);
    bac.position.set(lerp(.3 * (t - s.start), 1.22, k), 0, 0);
    bac.spin(8 * t);
    const sc = lerp(1, .62, k); sw.scale.setScalar(sc);
    motes.visible = k < .99;
    const gp = ((t - (T.card + .5)) / 2.3) % 1;
    glint.intensity = t > T.card + .5 ? 10 * Math.sin(Math.PI * clamp(gp)) * k : 0;
    glint.position.set(lerp(-2, 2.5, eInOut(clamp(gp))), 1.2, 1.6);
    const tg = [lerp(.3 * (t - s.start) * Math.cos(.62) - 1, 0, k), lerp(.3 * (t - s.start) * Math.sin(.62) - .7, 0, k), 0];
    frame(cam, tg, lerp(16.5, 12, k), lerp(8 + (t - s.start) * 1.5, 0, k), lerp(8, 6, k), 540, lerp(960, 880, k));
  },

  draw2d(t, s, st) {
    const { stage, T, bac } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const sa = (.42 + .3 * P(t, T.vodu, .8)) * P(t, s.start + .1, 1) * (1 - P(t, T.card - .5, .45, eIn));
    streams(cam, bac, { a: sa, off: .3 * (t - s.start) * 220, lw: 2.4, x0: -4.6, x1: 3.4 });
    atextWords('Размер меняет', 540, 380, T.raz, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .45, out: T.card - .4 });
    atextWords('саму воду', 540, 495, T.samu, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .3, out: T.card - .4 });
    if (t > T.card - .1) {
      atext('Число', 540, 350, T.card + .05, t, { size: 116, w: 600, col: ink, track: -.035 });
      atext('Рейнольдса', 540, 474, T.card + .15, t, { size: 116, w: 600, col: ink, track: -.035 });
      atext('Re = ρvL/μ', 540, 580, T.card + .6, t, { size: 58, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vodu, 'shimmer', .25, .8);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
