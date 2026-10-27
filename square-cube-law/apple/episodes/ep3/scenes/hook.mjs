// HOOK (0 – 8.9 с), чёрный фон.
// k1: белый лист парит в пустоте, свет скользит по нему, выноска «0,1 мм» → на «стопка» лист ложится
//     и растёт вверх столбом листов, камера резко отъезжает по вертикали → на «Луны» из темноты
//     выходит керамическая Луна, огромная красная «42» сгиба.
// k2: медленный дрейф камеры, выноска Луны → «Экспонента» (белым) и строка «0,1 мм × 2⁴²» серым.
import {
  defineScene, makeStage, project, atext, callout, P, Wd, C, E, THREE, clamp, lerp,
  eApple, eInOut, eIn, eEase, W, H, C_WHITE, C_GRAY,
} from '../../../engine.mjs';
import { frame, paperTexture, stackMaterials, moonGeometry, moonMaterial } from './_lib.mjs';

const SW = 2.1, SD = 2.97, T0 = .014, HTOP = 66;           // лист (условные единицы), высота столба «до Луны»
const MOON = [12, 61, -4], MR = 7;
const hOf = n => T0 * Math.pow(HTOP / T0, n / 42);

function TT() {
  return {
    list: Wd('k1', 'лист'), sorok: Wd('k1', 'сорок'), stop: Wd('k1', 'стопка'), dost: Wd('k1', 'достанет'),
    luny: Wd('k1', 'Луны'), zv: Wd('k2', 'Звучит'), osh: Wd('k2', 'ошибка'), no: Wd('k2', 'Но'), exp: Wd('k2', 'экспонента'),
  };
}

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    stage.camera.far = 3000; stage.camera.updateProjectionMatrix();
    const tex = paperTexture(THREE);
    const mats = stackMaterials(THREE, tex);
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, .5, 0);
    const sheet = new THREE.Mesh(geo, mats.list);
    const sheetG = new THREE.Group(); sheetG.add(sheet);
    const moonMat = moonMaterial(THREE);
    const moon = new THREE.Mesh(moonGeometry(THREE, 64, 11), moonMat);
    moon.scale.setScalar(MR); moon.position.fromArray(MOON);
    stage.root.add(sheetG, moon);
    return { stage, T: TT(), tex, mats, sheet, sheetG, moon, moonMat, moonBase: moonMat.color.clone() };
  },

  update(t, s, st) {
    const { stage, T, tex, sheet, sheetG, moon, moonMat, moonBase } = st, cam = stage.camera;
    const { key, rimL, rimR, hemi } = stage.lights;
    // ---- лист → стопка ----
    const land = P(t, T.stop - .2, .7, eInOut);
    const n = 42 * P(t, T.stop, 1.25, eInOut);
    const h = hOf(n);
    sheet.scale.set(SW, h, SD);
    tex.repeat.set(1, Math.min(Math.pow(2, n), 16384));
    sheetG.position.set(0, lerp(1.35 + .06 * Math.sin(t * 1.3), 0, land), 0);
    sheetG.rotation.set(lerp(.38, 0, land), lerp(-.5 + t * .12, -.2, land), lerp(-.1, 0, land));

    // ---- свет: полоса ключевого света проезжает по листу ----
    const lit = P(t, 0, 1.0, eApple);
    const sw = eApple(clamp(t / 2.8));
    key.position.set(lerp(-9, 4, sw), lerp(5, 10, sw), lerp(-2, 7, sw));
    key.target.position.set(0, h * .5, 0); key.target.updateMatrixWorld();
    key.intensity = 2.7 * lit; hemi.intensity = .45 * lit;
    rimL.position.set(-6, 3, -5); rimL.intensity = 3.4 * lit; rimR.intensity = 2.4 * lit;
    // Луна выходит из темноты на «Луны»
    const ml = P(t, T.luny - .25, 1.1, eApple);
    moon.visible = ml > .003;
    moonMat.color.copy(moonBase).multiplyScalar(ml);
    moon.rotation.set(.3, -.6 + t * .05, 0);

    // ---- камера: макро над листом → вертикальный отъезд по экспоненте → медленный дрейф ----
    const p = P(t, T.stop - .05, 1.55, eInOut);
    const d0 = lerp(19, 17, clamp(t / 3)), d1 = 360;
    const d = d0 * Math.pow(d1 / d0, p);
    const ty = lerp(1.1, 36, (d - d0) / (d1 - d0));
    const drift = clamp((t - (T.stop + 1.5)) / (s.end - T.stop - 1.5));
    const az = lerp(lerp(30, 22, clamp(t / 3)), lerp(10, -4, drift), p);
    const el = lerp(26, 3, p);
    frame(cam, [lerp(0, 5, p), ty, 0], d * (1 + .03 * drift), az, el, lerp(540, 470, p), lerp(1010, 630, p));
  },

  draw2d(t, s, st) {
    const { stage, T, sheetG, moon } = st, cam = stage.camera, ink = C_WHITE, sub = C_GRAY;
    // выноска «0,1 мм» к кромке листа
    if (t < T.stop + .3) {
      sheetG.updateMatrixWorld();
      const a = sheetG.localToWorld(new THREE.Vector3(SW / 2, 0, SD / 2));
      const [ax, ay] = project(cam, a.x, a.y, a.z);
      const o = T.stop - .25, q = 1 - P(t, o, .3, eIn);
      callout(ax, ay, 760, 690, T.list - .05, t, ink, q);
      atext('0,1 мм', 760, 660, T.list + .25, t, { size: 64, w: 600, col: ink, align: 'center', out: o });
      atext('толщина листа', 760, 750, T.list + .45, t, { size: 38, w: 500, col: sub, align: 'center', track: 0, out: o });
    }
    // огромная красная «42» сгиба
    atext('42', 760, 1080, T.luny - .05, t, { size: 330, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.no - .1 });
    atext('сгиба', 770, 1160, T.luny + .3, t, { size: 52, w: 500, col: sub, track: -.005, out: T.no - .1 });
    // выноска Луны
    {
      const [mx, my] = project(cam, MOON[0] + MR * .35, MOON[1] - MR * .8, MOON[2] + MR * .5);
      const q = 1 - P(t, T.no - .1, .3, eIn);
      callout(mx, my, mx + 30, my + 150, T.zv, t, ink, q * .9);
      atext('Луна', mx + 30, my + 200, T.zv + .3, t, { size: 44, w: 600, col: ink, out: T.no - .1 });
      atext('384 400 км', mx + 30, my + 248, T.zv + .45, t, { size: 34, w: 500, col: sub, track: 0, out: T.no - .1 });
    }
    // «Экспонента»
    atext('Экспонента', 540, 1225, T.exp - .05, t, { size: 124, w: 600, col: ink, track: -.03 });
    atext('0,1 мм × 2⁴²', 540, 1300, T.exp + .35, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.list + .05, 'shimmer', .25);
    add(T.luny - 1.5, 'riser', .28);
    add(T.stop, 'whoosh', .45, .7);
    add(T.luny, 'impact', .4, .8);
    add(T.zv + .1, 'click', .2);
    add(T.exp, 'chime', .32, .9);
  },
});
