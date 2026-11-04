// HOOK (0 – 8.0 с), чёрный фон. Машина скорой (керамика, мигалка-балка) едет мимо фигурки-наблюдателя;
// от мигалки расходятся кольца-hairline звуковых волн: спереди сжаты, сзади растянуты.
// k1 — наверху крупно «выше» (пока едет к тебе) → «ниже» (когда проехала); под словом — осциллограмма того,
//      что слышит наблюдатель: частая, на проезде резко становится редкой.
// k2 — машина уходит, кольца остаются; заголовок «Эффект Доплера» по словам.
import { defineScene, makeStage, project, atext, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeAmbulance, makeFigure, makeWaveField, rings, frame, keys, glow, sine, wordsAt, collectMats, setLit, ROOF } from './kit.mjs';

function TT() {
  return {
    sir: Wd('k1', 'Сирена'), vys: Wd('k1', 'выше'), mash: Wd('k1', 'машина'), teb: Wd('k1', 'тебе'), rez: Wd('k1', 'резко'),
    niz: Wd('k1', 'ниже'), proe: Wd('k1', 'проехала'), eto: Wd('k2', 'Это'), eff: Wd('k2', 'эффект'), dop: Wd('k2', 'Доплера'),
  };
}
const V = 1.7, CS = 3.4, OZ = -2.6;                 // скорость машины, скорость «звука» (условно), наблюдатель за дорогой
const passT = T => (T.teb + T.rez) / 2;
const carX = (t, T) => V * (t - passT(T));
const MARK_N = 22, MARK_SP = 3.2;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .6 });
    const T = TT();
    const car = makeAmbulance({ dark: true });
    const man = makeFigure(); man.position.set(0, 0, OZ); man.rotation.y = .3;
    const field = makeWaveField(44, { lw: 1.7, fade: .5 });
    const mm = new THREE.MeshStandardMaterial({ color: '#2C2C2E', roughness: .6 });
    const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .006, .09), mm, MARK_N * 2);
    const _m = new THREE.Matrix4();
    for (let side = 0; side < 2; side++) for (let i = 0; i < MARK_N; i++) {
      _m.makeTranslation(-34 + i * MARK_SP, .003, side ? 1.6 : -1.6); marks.setMatrixAt(side * MARK_N + i, _m);
    }
    marks.receiveShadow = true;
    stage.root.add(car, man, field, marks);
    return { stage, T, car, man, field, mats: collectMats(stage.root) };
  },

  update(t, s, st) {
    const { stage, T, car, field } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, 0, 1.0), lk = P(t, .2, 1.4);
    const x = carX(t, T);
    L.key.position.set(x * .5 + lerp(-3, 5, clamp(t / 8)), 9, 7); L.key.target.position.set(x * .5, 0, 0); L.key.target.updateMatrixWorld();
    L.key.intensity = 2.2 * lk; L.hemi.intensity = .35 * lk;
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.6 * lr;
    setLit(st.mats, lerp(.12, 1, lk));
    car.position.set(x, 0, 0); car.spin(x / .36);
    car.flash(t, lr);
    // кольца: испущены мигалкой (x машины в момент τ)
    const R = rings(t, τ => carX(τ, T) - .45, { dt: .3, c: CS, maxAge: 2.7, a: lr * .9 });
    field.set(R, 1, lerp(0, x, .5), 0);
    // камера: держит наблюдателя, мягко ведёт машину; на заголовке чуть отходит и поднимается
    const [tx, d, az, el, sy] = keys([[0, -1.6, 46, 22, 27, 1000], [passT(T), .2, 44, 18, 25, 1000], [T.eto, 1.6, 46, 14, 28, 1040], [s.end, 2.0, 48, 12, 30, 1050]], t, eInOut);
    frame(cam, [tx, .7, -.6], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [fx, fy] = project(cam, 0, 0, -.5);
    glow(fx, fy, 520, .045 * P(t, .2, 1.2));
    // k1: «выше» → «ниже»
    const oK = T.eto - .35;
    atext('выше', 540, 520, T.vys - .05, t, { size: 180, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.1, dur: .8, out: T.rez - .1 });
    atext('ниже', 540, 520, T.niz - .05, t, { size: 180, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.1, dur: .8, out: oK });
    // что слышит наблюдатель: длина волны ∝ (c − v_r)/c, v_r — скорость сближения
    const aS = P(t, T.sir - .1, .8) * (1 - P(t, oK, .35, eIn));
    if (aS > .003) {
      const x = carX(t, T), dx = 0 - x, dz = OZ, dd = Math.hypot(dx, dz);
      const vr = V * dx / dd;
      const lam = 46 * (CS - vr) / CS;
      sine(160, 920, 650, 26, lam, t * 26, ink, aS * .9, 3);
      atext('то, что слышишь', 540, 740, T.sir + .2, t, { size: 38, w: 500, col: sub, track: -.005, out: oK, dy: 14 });
    }
    // подпись у наблюдателя
    const [mx, my] = project(cam, 0, 1.75, OZ);
    const aM = P(t, T.teb - .3, .5) * (1 - P(t, T.rez + .3, .4, eIn));
    if (aM > .003) atext('ты', mx, my - 26, T.teb - .3, t, { size: 40, w: 500, col: sub, a: aM, dy: 12 });
    // k2: заголовок
    wordsAt(['Эффект', 'Доплера'], [T.eff - .05, T.dop - .05], 540, 520, t, { size: 124, w: 600, col: ink, track: -.03, blur: 16, dur: .8 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .32, .8);
    add(T.vys, 'chime', .2, 1.12);
    add(passT(T) - .5, 'whoosh', .32, .9);
    add(T.niz, 'chime', .2, .9);
    add(T.eff - .1, 'bloom', .28, .85);
    add(T.dop, 'chime', .22, 1.0);
  },
});
