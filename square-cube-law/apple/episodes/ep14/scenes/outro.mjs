// OUTRO (44.1 – 53.0 с), чёрный фон.
// o1 — та же скорая едет, камера ведёт её; кольца волн спереди сжаты, сзади растянуты;
//      крупно «Сжатая волна выше, / растянутая ниже».
// o2 — финальная карточка: «Эффект Доплера» (по словам, белым), «f′ = f · c / (c − v)» серым,
//      красная пилюля «Подписаться на L³» с нажатием на «природы»; машина отходит под карточку.
import { defineScene, makeStage, project, atext, atextWords, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeAmbulance, makeWaveField, rings, frame, glow, pill, collectMats, setLit } from './kit.mjs';

function TT() {
  return { szh: Wd('o1', 'Сжатая'), vys: Wd('o1', 'выше'), rast: Wd('o1', 'растянутая'), niz: Wd('o1', 'ниже'), card: Wd('o2', 'Подпишись'), press: Wd('o2', 'природы') };
}
const V = 1.7, CS = 3.4, MARK_N = 30, MARK_SP = 3.2;

defineScene('outro', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const car = makeAmbulance({ dark: true });
    const field = makeWaveField(44, { lw: 1.7, fade: .5 });
    const mm = new THREE.MeshStandardMaterial({ color: '#2C2C2E', roughness: .6, transparent: true });
    const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .006, .09), mm, MARK_N * 2);
    const _m = new THREE.Matrix4();
    for (let side = 0; side < 2; side++) for (let i = 0; i < MARK_N; i++) {
      _m.makeTranslation(-20 + i * MARK_SP, .003, side ? 1.6 : -1.6); marks.setMatrixAt(side * MARK_N + i, _m);
    }
    stage.root.add(car, field, marks);
    return { stage, T: TT(), car, field, mm, mats: collectMats(stage.root) };
  },

  update(t, s, st) {
    const { stage, T, car, field } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, 1.0), lk = P(t, s.start + .3, 1.3);
    const x = V * (t - s.start) - 4;
    L.key.position.set(x + 4 * Math.sin((t - s.start) * .3), 9, 7); L.key.target.position.set(x, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.3 * lk; L.hemi.intensity = .35 * lk; L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    setLit(st.mats, lerp(.12, 1, lk));
    car.position.set(x, 0, 0); car.spin(x / .36); car.flash(t, lr);
    const R = rings(t, τ => V * (τ - s.start) - 4 - .45, { dt: .3, c: CS, maxAge: 2.7, a: lr * .9 });
    // o2: камера отходит, машина поднимается между карточкой и пилюлей; дорога и кольца притухают
    const o2 = P(t, T.card - .2, 1.3, eInOut);
    field.position.x = x; field.set(R, 1 - .45 * o2, x, 0);
    st.mm.opacity = 1 - .75 * o2;
    frame(cam, [x + .6, .5, 0], lerp(32, 42, o2), 28 + (t - s.start) * 1.2, lerp(24, 20, o2), 540, lerp(1030, 880, o2));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = '#FFFFFF', sub = stage.sub;
    const [fx, fy] = project(cam, st.car.position.x, 0, 0);
    glow(fx, fy, 520, .045 * P(t, s.start + .2, 1));
    // o1: итоговая мысль
    const o1 = T.card - .35;
    atextWords('Сжатая волна выше,', 540, 380, T.szh - .05, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .18, out: o1 });
    atextWords('растянутая ниже', 540, 500, T.rast - .05, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .3, out: o1 });
    // o2: финальная карточка
    if (t > T.card - .1) {
      atextWords('Эффект Доплера', 540, 380, T.card + .05, t, { size: 112, w: 600, col: ink, track: -.035, stagger: .12 });
      atext('f′ = f · c / (c − v)', 540, 485, T.card + .6, t, { size: 54, w: 500, col: sub, track: -.01 });
      pill(t, T.card + .65, T.press);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .3, .6);
    add(T.vys, 'chime', .2, 1.12);
    add(T.niz, 'chime', .2, .9);
    add(T.card + .1, 'thud', .22, .8);
    add(T.press, 'click', .45, .9);
  },
});
