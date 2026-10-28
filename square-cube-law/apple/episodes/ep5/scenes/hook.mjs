// HOOK (0 – 7.3 с), чёрный фон.
// k1 — светящаяся лампа-сфера и керамическая плашка на расстоянии 1; на «вдвое дальше» плашка отъезжает на 2,
//      её освещённость падает ровно вчетверо (точечный свет с физическим затуханием 1/r², угол падения тот же);
//      живой замер «100% → 25%» у плашки; «×½» серым зачёркивается → огромная красная «×¼» «света»;
// k2 — заголовок «Закон обратных квадратов», формула «I ∝ 1/r²» серым.
import {
  defineScene, makeStage, orbit, project, atext, atextWords, line, measure, P, Wd, E, THREE, MAT, roundedBox, shadowsOn,
  clamp, lerp, eApple, eInOut, eIn, rng,
} from '../../../engine.mjs';
import { ctx, makeLamp, glow, screenR, dim, bump } from './kit.mjs';

const LX = -1.3, LY = .62, D1 = 1.15;                 // лампа и единичное расстояние
const PH = 1.1, PW = .8, PT = .07;                      // плашка: высота, ширина, толщина
const ROT = .72;                                        // поворот плашки: лицом к лампе и к камере
const I0 = 5.2;                                         // мощность лампы

function TT() {
  return {
    ot: Wd('k1', 'Отойди'), vd: Wd('k1', 'вдвое'), sv: Wd('k1', 'света'), ne: Wd('k1', 'не'), vd2: Wd('k1', 'вдвое', 1),
    vch: Wd('k1', 'вчетверо'), men: Wd('k1', 'меньше'), end1: E('k1'),
    eto: Wd('k2', 'Это'), zak: Wd('k2', 'закон'), obr: Wd('k2', 'обратных'), kv: Wd('k2', 'квадратов'),
  };
}
// расстояние (в единицах D1): 1 → 2 на «вдвое дальше»
const rAt = (t, T) => 1 + P(t, T.vd - .05, 1.5, eInOut);

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    // тёмный матовый пол: на нём читается световое пятно лампы и его затухание
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#232325', roughness: .78, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    const lamp = makeLamp(.2, I0, 2);
    lamp.grp.position.set(LX, LY, 0);
    // тонкая ножка и база лампы — графит
    const gm = MAT.graphite();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, LY - .2, 16), gm); stem.position.set(LX, (LY - .2) / 2, 0);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .04, 40), gm); base.position.set(LX, .02, 0);
    // керамическая плашка (стоит на полу), освещается только лампой
    const pm = new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .62 });
    pm.toneMapped = false;   // экранная яркость плашки = физическая освещённость, без компрессии тонмаппинга
    const plaque = shadowsOn(new THREE.Mesh(roundedBox(1, .04, 3), pm));
    plaque.scale.set(PT, PH, PW);
    stage.root.add(floor, lamp.grp, stem, base, plaque);
    return { stage, lamp, plaque, pm, floor, T: TT() };
  },

  update(t, s, st) {
    const { stage, lamp, plaque, T } = st, cam = stage.camera, L = stage.lights;
    // студийный свет почти погашен: плашку освещает только лампа; контровые — тонкий контур
    const on = P(t, 0, .9, eApple);
    L.key.intensity = 0; L.key.castShadow = false; L.hemi.intensity = 0; L.rimL.intensity = 0; L.rimR.intensity = 0;
    lamp.pl.intensity = I0 * on;
    lamp.grp.scale.setScalar(lerp(.6, 1, on));
    const r = rAt(t, T);
    // освещённость лампой ∝ 1/r² (свет с затуханием decay 2) — экранная яркость плашки падает вчетверо;
    // поправка альбедо компенсирует гамму sRGB, чтобы «вчетверо» читалось глазом, а не только в линейном свете
    st.pm.color.set('#F2F2F0').multiplyScalar(Math.pow(1 / (r * r), 1.2));
    // плашка смещается вдоль луча от лампы → угол падения не меняется, освещённость ∝ 1/r²
    const dir = new THREE.Vector3(1, 0, .12).normalize();
    plaque.position.set(LX + dir.x * D1 * r, PH / 2, dir.z * D1 * r);
    plaque.rotation.set(0, ROT + Math.atan2(-dir.z, dir.x), 0);
    // камера: медленный дрейф, на k2 — лёгкий отъезд и подъём
    const k2 = P(t, T.eto - .2, 2.2, eInOut);
    orbit(cam, [lerp(-.05, 0, k2), lerp(.3, .2, k2), 0], lerp(14.2, 15.2, k2) - t * .05, -38 + t * 1.3, lerp(10, 13, k2));
  },

  draw2d(t, s, st) {
    const { stage, lamp, plaque, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const on = P(t, 0, .9, eApple);
    // ореол лампы
    const lp = lamp.grp.position.toArray();
    const [lx, ly] = project(cam, ...lp);
    glow(lx, ly, clamp(screenR(cam, lp, .2) * 7, 110, 230), .55 * on);
    // размерная линия по полу: лампа → плашка, «1» → «2»
    const r = rAt(t, T);
    const pp = plaque.position;
    const zf = .62;
    const [ax, ay] = project(cam, LX, 0, zf), [bx, by] = project(cam, pp.x, 0, pp.z + zf);
    const dA = P(t, .5, .6) * (1 - P(t, T.end1 + .05, .4, eIn));
    dim(ax, ay, bx, by, dA, sub);
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + 58;
    const sw = T.vd + .2;
    atext('r', mx, my, .7, t, { size: 44, w: 500, col: ink, a: dA, dy: 14, dur: .6, out: sw, outDur: .3 });
    atext('2r', mx, my, sw + .1, t, { size: 44, w: 500, col: ink, a: dA, dy: 14, dur: .6 });
    // живой замер освещённости у плашки (100% → 25%): строго 1/r²
    const top = new THREE.Vector3(0, .5, 0).applyMatrix4(plaque.matrixWorld);
    const [px, py] = project(cam, top.x, top.y + .05, top.z);
    const mA = P(t, .75, .6) * (1 - P(t, T.ne - .15, .35, eIn));
    if (mA > .003) {
      const pct = Math.round(100 / (r * r));
      line(px, py - 8, px, py - 70, ink, .6 * mA * P(t, .75, .4), 2);
      atext(pct + '%', px, py - 88, .85, t, { size: 52, w: 600, col: ink, a: mA, track: -.02, dy: 16, dur: .6 });
      atext('освещённость', px, py - 150, .95, t, { size: 30, w: 500, col: sub, a: mA, track: 0, dy: 14, dur: .6 });
    }
    // «не ×½» — серым, зачёркивается; затем огромная красная «×¼»
    const half = '×½', hs = 230, hy = 560;
    atext(half, 540, hy, T.ne, t, { size: hs, w: 700, col: sub, track: -.045, blur: 16, dur: .7, out: T.vch - .05, outDur: .3 });
    const hw = measure(half, hs, 700, -.045);
    const sk = P(t, T.vd2 + .15, .35, eApple) * (1 - P(t, T.vch - .05, .3, eIn));
    if (sk > .003) line(540 - hw / 2 - 10, hy - hs * .3, lerp(540 - hw / 2 - 10, 540 + hw / 2 + 10, sk), hy - hs * .3 - sk * 0, sub, sk, 6);
    atext('×¼', 540, hy, T.vch, t, { size: 320, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.end1 + .05 });
    atext('света', 540, hy + 84, T.vch + .25, t, { size: 50, w: 500, col: sub, track: -.005, out: T.end1 + .05 });
    // k2: заголовок + формула
    atextWords('Закон обратных', 540, 400, T.zak - .05, t, { size: 104, w: 600, col: ink, track: -.03, stagger: .28 });
    atext('квадратов', 540, 520, T.kv - .05, t, { size: 104, w: 600, col: ink, track: -.03 });
    atext('I ∝ 1/r²', 540, 625, T.kv + .35, t, { size: 58, w: 500, col: sub, track: -.01 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.vd - .05, 'whoosh', .3, .7);
    add(T.ne, 'tick', .2);
    add(T.vch - 1.5, 'riser', .22);
    add(T.vch, 'impact', .4, .9);
    add(T.zak - .1, 'swell', .25, .8);
    add(T.kv, 'chime', .25, .9);
  },
});
