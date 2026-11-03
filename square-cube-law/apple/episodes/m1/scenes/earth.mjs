// EARTH (e1–e2), светлый фон. Монохромная Земля (графитовый океан, алюминиевая суша).
// e1 — Земля проявляется; «Вращение Земли»: ось и дуга-стрелка у экватора (на восток);
//      «ураганы»: на севере и на юге вырастают белые спиральные рукава; «на севере против часовой» —
//      северный вихрь ярче, дуга-стрелка против часовой; «на юге по часовой» — южный, стрелка по часовой;
// e2 — заголовок «Сила Кориолиса»; «сотни километров» — наезд на северный ураган, размерная линия по диаметру,
//      две цифры-подписи «сотни км» и «дни».
import { defineScene, makeStage, project, atext, line, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeEarth, ll, onBody, facingCam, sphereCurve, latCircle, cycloneArms, drawArms, frame, keys, arcArrow, ringArrow, dim, glow, screenR, smooth, TAU } from './kit.mjs';

function TT() {
  return {
    u: Wd('e1', 'У'), osn: Wd('e1', 'основа'), vr: Wd('e1', 'Вращение'), zak: Wd('e1', 'закручивает'), ur: Wd('e1', 'ураганы'),
    sev: Wd('e1', 'севере'), prot: Wd('e1', 'против'), yug: Wd('e1', 'юге'), po: Wd('e1', 'по'),
    eto: Wd('e2', 'Это'), sila: Wd('e2', 'сила'), kor: Wd('e2', 'Кориолиса'), no: Wd('e2', 'Но'), ur2: Wd('e2', 'ураган'),
    shir: Wd('e2', 'шириной'), sot: Wd('e2', 'сотни'), km: Wd('e2', 'километров'), zh: Wd('e2', 'живёт'), dn: Wd('e2', 'днями'),
  };
}
const R = 1, LAT = 30, CN = ll(LAT, -100), CS = ll(-LAT, -82), RAD = .2;

defineScene('earth', {
  setup(s) {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    const earth = makeEarth(R, 48);
    stage.root.add(earth);
    return { stage, earth, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, T } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(-4, 5, 8); L.key.castShadow = false; L.key.intensity = 2.4;
    L.hemi.intensity = 1.0; L.rimL.intensity = 1.4; L.rimR.intensity = 1.1;
    earth.rotation.set(0, (t - T.sev) * .05, 0);
    earth.updateMatrixWorld();
    // наезд на северный ураган на «Но ураган»
    const z = P(t, T.no - .1, 1.6, eInOut);
    const cn = onBody(earth, R, CN, 1);
    const tgt = [lerp(0, cn[0] * .35, z), lerp(0, cn[1] * .35, z), 0];
    const d = lerp(lerp(14.8, 13.9, P(t, s.start, 4, eApple)), 12.3, z);
    frame(cam, tgt, d, lerp(-4, 4, (t - s.start) / 14), lerp(lerp(8, 16, P(t, T.vr - .6, 1.2, eInOut)) - 7 * P(t, T.ur + .2, 1.2, eInOut), 10, z), 540, lerp(870, 890, z));
  },

  draw2d(t, s, st) {
    const { stage, earth, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const c0 = onBody(earth, R, [0, 0, 0], 0), [ex, ey] = project(cam, ...c0), er = screenR(cam, c0, R);
    // ось вращения
    const ax = P(t, T.vr - .1, .7) * (1 - P(t, T.sev - .3, .5, eIn));
    const top = project(cam, 0, 1.32, 0), bot = project(cam, 0, -1.32, 0), tp = project(cam, 0, 1, 0), bp = project(cam, 0, -1, 0);
    line(tp[0], tp[1], top[0], top[1], ink, ax * .8, 2.5); line(bp[0], bp[1], bot[0], bot[1], ink, ax * .8, 2.5);
    // дуга-стрелка вращения у экватора (перед глобусом), на восток
    const ra = P(t, T.vr, .8) * (1 - P(t, T.ur + .3, .5, eIn));
    const sw = P(t, T.vr, 1.3, eInOut);
    ringArrow(cam, [0, 1.2, 0], .34, -Math.PI / 2 - 2.2, -Math.PI / 2 - 2.2 + 4.2 * sw, { col: ink, a: ra, lw: 3.5, hh: 18, fade: false });
    // экватор
    const eqA = P(t, T.zak, .8) * (1 - P(t, T.no, .5, eIn));
    sphereCurve(cam, earth, R, latCircle(0), { col: '#FFFFFF', a: eqA * .55, lw: 2, dash: [6, 8] });
    // ураганы: вырастают на «ураганы», крутятся каждый в свою сторону
    const gN = P(t, T.ur - .1, 1.0), gS = P(t, T.ur + .1, 1.0);
    const fN = lerp(1, .45, bump01(t, T.yug - .1, T.eto)), fS = lerp(1, .45, bump01(t, T.sev - .15, T.yug - .2)) * (1 - P(t, T.no, .6, eIn));
    const arN = cycloneArms(CN, RAD * lerp(.3, 1, gN), 1, 1.3 * (t - T.ur));
    const arS = cycloneArms(CS, RAD * lerp(.3, 1, gS), -1, 1.3 * (t - T.ur));
    const pN = onBody(earth, R, CN), pS = onBody(earth, R, CS);
    const [nx, ny] = project(cam, ...pN), [sx, sy] = project(cam, ...pS);
    const rr = screenR(cam, pN, RAD) * 1.0;
    glow(nx, ny, rr * 1.5, .22 * gN * fN); glow(sx, sy, rr * 1.5, .22 * gS * fS);
    drawArms(cam, earth, R, arN, { col: '#FFFFFF', a: gN * fN, lw: rr * .075 });
    drawArms(cam, earth, R, arS, { col: '#FFFFFF', a: gS * fS, lw: rr * .075 });
    // стрелки направлений и подписи (снаружи глобуса — чёрным)
    const oL = T.eto - .15;
    const aN = P(t, T.prot - .1, .6) * (1 - P(t, oL, .4, eIn)), aS = P(t, T.po - .1, .6) * (1 - P(t, oL, .4, eIn));
    const swN = P(t, T.prot - .1, 1.0, eInOut), swS = P(t, T.po - .1, 1.0, eInOut);
    // север: против часовой (на экране угол убывает)
    arcArrow(nx, ny, rr * 1.32, -.3, -.3 - 1.9 * swN, '#FFFFFF', aN * .95, 3.5, 16);
    arcArrow(sx, sy, rr * 1.32, .3, .3 + 1.9 * swS, '#FFFFFF', aS * .95, 3.5, 16);
    const yN = ey - er - 92, yS = ey + er + 72;
    atext('север', nx, yN, T.sev - .05, t, { size: 46, w: 600, col: ink, track: -.01, out: oL });
    atext('против часовой', nx, yN + 48, T.prot, t, { size: 38, w: 500, col: sub, track: 0, out: oL });
    atext('юг', sx, yS, T.yug - .05, t, { size: 46, w: 600, col: ink, track: -.01, out: oL });
    atext('по часовой', sx, yS + 48, T.po, t, { size: 38, w: 500, col: sub, track: 0, out: oL });
    // e2: заголовок
    atext('Сила Кориолиса', 540, 360, T.sila - .05, t, { size: 104, w: 600, col: ink, track: -.03, out: T.no - .1 });
    atext('вращение Земли закручивает ветер', 540, 440, T.kor + .3, t, { size: 40, w: 500, col: sub, track: 0, out: T.no - .1 });
    // e2: размер и время жизни
    const dA = P(t, T.sot - .05, .6);
    if (dA > .003) {
      const C = new THREE.Vector3(...CN), e1 = new THREE.Vector3(0, 1, 0).cross(C).normalize();
      const pa = onBody(earth, R, C.clone().addScaledVector(e1, -RAD).normalize().toArray(), 1.015);
      const pb = onBody(earth, R, C.clone().addScaledVector(e1, RAD).normalize().toArray(), 1.015);
      const [ax1, ay1] = project(cam, ...pa), [bx1, by1] = project(cam, ...pb);
      const off = -rr * 1.25;
      dim(ax1, ay1 + off, bx1, by1 + off, dA, '#FFFFFF');
      line(ax1, ay1 + off + 12, ax1, ay1, '#FFFFFF', dA * .45, 1.5, [4, 6]); line(bx1, by1 + off + 12, bx1, by1, '#FFFFFF', dA * .45, 1.5, [4, 6]);
    }
    atext('сотни км', 300, 380, T.sot, t, { size: 100, w: 600, col: ink, track: -.035, blur: 18, scale0: 1.1 });
    atext('ширина урагана', 300, 446, T.km, t, { size: 40, w: 500, col: sub, track: 0 });
    atext('дни', 800, 380, T.dn - .05, t, { size: 100, w: 600, col: ink, track: -.035, blur: 18, scale0: 1.1 });
    atext('живёт ураган', 800, 446, T.dn + .2, t, { size: 40, w: 500, col: sub, track: 0 });
  },

  sfx(add) {
    const T = TT();
    add(T.u, 'bloom', .25, .8);
    add(T.vr, 'whoosh', .25, .9);
    add(T.ur, 'swell', .25, .8);
    add(T.prot, 'tick', .14);
    add(T.po, 'tick', .14, .9);
    add(T.sila, 'chime', .22, .95);
    add(T.no, 'whoosh', .3, .8);
    add(T.sot, 'click', .3);
    add(T.dn, 'click', .3, .9);
  },
});
// 1 между a и b (с мягкими краями), 0 вне
function bump01(t, a, b) { return smooth((t - a) / .4) * (1 - smooth((t - b) / .4)); }
