// SINK (s1–s3), чёрный фон. Та же керамическая раковина, вид почти сверху, вода крутится против часовой.
// s1 — слева счётчик «Земля»: циферблат, стрелка которого не сдвигается, «< 1» и «оборота в сутки» (сноска: Москва ≈ 0,82);
// s2 — справа счётчик «Воронка»: стрелка делает 1 оборот в секунду, «1» и «оборот в секунду»;
//      на «сто тысяч» счётчики уходят, огромное красное «100 000» и «раз быстрее» (главный акцент выпуска);
// s3 — камера опускается в три четверти; «форма раковины» — выноска к кромке и белый контур профиля чаши;
//      «как налили воду» — сверху падает струя, бьёт в воду сбоку, и вихрь разворачивается по часовой.
import { defineScene, makeStage, project, atext, line, P, Wd, E, THREE, clamp, lerp, eApple, eInOut, eIn, callout } from '../../../engine.mjs';
import { makeBowl, makeWater, simTracers, drawTracers, sinkPoint, SINK, innerY, waterR, frame, keys, dial, ringArrow, arrow, smooth, TAU } from './kit.mjs';

function TT() {
  return {
    a: Wd('s1', 'А'), zem: Wd('s1', 'Земля'), men: Wd('s1', 'меньше'), sut: Wd('s1', 'сутки'),
    vor: Wd('s2', 'Воронка'), obo: Wd('s2', 'оборот'), sek: Wd('s2', 'секунду'), eto: Wd('s2', 'Это'), sto: Wd('s2', 'сто'),
    tys: Wd('s2', 'тысяч'), raz: Wd('s2', 'раз'), bys: Wd('s2', 'быстрее'),
    nap: Wd('s3', 'Направление'), forma: Wd('s3', 'форма'), rak: Wd('s3', 'раковины'), kak: Wd('s3', 'как'), nal: Wd('s3', 'налили'), vodu: Wd('s3', 'воду'),
  };
}
const T0 = TT();
const W0 = .42;
// против часовой; струя на «налили» разворачивает вихрь по часовой
const omega = t => W0 * (1 - 2 * smooth((t - T0.nal - .1) / (T0.vodu + .7 - T0.nal - .1)));
const depthAt = t => .1 + .22 * smooth(Math.abs(omega(t)) / W0);
const JX = .52, JZ = .3;                          // точка удара струи (справа-спереди)
const JTOP = 3.2;

defineScene('sink', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    const bowl = makeBowl(), water = makeWater();
    water.position.y = SINK.YW;
    const jmat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .1, clearcoat: 1, transparent: true, opacity: .7, emissive: '#FFFFFF', emissiveIntensity: .45 });
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(.02, .024, 1, 20, 1, true), jmat);
    jet.renderOrder = 5;
    stage.root.add(bowl, water, jet);
    return { stage, bowl, water, jet, T: TT() };
  },

  update(t, s, st) {
    const { stage, water, jet, T } = st, cam = stage.camera, L = stage.lights;
    L.key.intensity = 2.6; L.hemi.intensity = .5; L.rimL.intensity = 3.0; L.rimR.intensity = 2.2;
    water.scale.y = depthAt(t);
    // камера: почти сверху → три четверти на s3
    const lo = P(t, T.nap - .2, 1.6, eInOut);
    const d = lerp(lerp(16.2, 15.4, P(t, s.start, 6, eApple)), 11.2, lo);
    frame(cam, [0, .45, 0], d, lerp(-8, 6, (t - s.start) / (s.end - s.start)), lerp(64, 36, lo), 540, lerp(1050, 1010, lo));
    // струя: падает сверху на «налили»
    const jp = P(t, T.nal - .35, .45, eIn), jo = P(t, s.end - .6, .4);
    const ybot = lerp(JTOP, SINK.YW, jp), ytop = lerp(JTOP, SINK.YW, jo);
    jet.visible = jp > .01 && ytop - ybot > .02;
    jet.scale.set(1, Math.max(.001, ytop - ybot), 1);
    jet.position.set(JX, (ytop + ybot) / 2, JZ);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const P0 = simTracers(t, s.start - 3, omega, { N: 120, seed: 23 });
    drawTracers(cam, P0, sinkPoint([0, 0, 0], depthAt(t)), { col: ink, a: .9, lw: 2.6 });
    // s1 / s2: два счётчика
    const oC = T.eto - .1;
    const aL = P(t, T.zem - .1, .7) * (1 - P(t, oC, .4, eIn)), aR = P(t, T.vor - .1, .7) * (1 - P(t, oC, .4, eIn));
    const XL = 290, XR = 790, YD = 405;
    atext('Земля', XL, 268, T.zem - .1, t, { size: 46, w: 600, col: ink, track: -.01, out: oC });
    dial(XL, YD, 92, (t - s.start) * .82 * TAU / 86400, ink, sub, aL);
    atext('< 1', XL, 620, T.men, t, { size: 120, w: 700, col: ink, track: -.04, blur: 18, scale0: 1.1, out: oC });
    atext('оборота в сутки', XL, 672, T.men + .3, t, { size: 38, w: 500, col: sub, track: 0, out: oC });
    atext('в Москве ≈ 0,82', XL, 714, T.sut, t, { size: 30, w: 500, col: sub, track: 0, a: .75, out: oC });
    atext('Воронка', XR, 268, T.vor - .1, t, { size: 46, w: 600, col: ink, track: -.01, out: oC });
    dial(XR, YD, 92, (t - T.vor) * TAU * smooth((t - T.vor + .2) / .6), ink, sub, aR);
    atext('1', XR, 620, T.obo, t, { size: 120, w: 700, col: ink, track: -.04, blur: 18, scale0: 1.1, out: oC });
    atext('оборот в секунду', XR, 672, T.sek, t, { size: 38, w: 500, col: sub, track: 0, out: oC });
    // главный акцент: 100 000
    const oN = T.nap - .2;
    atext('100 000', 540, 580, T.sto - .05, t, { size: 250, w: 700, col: stage.accent, track: -.045, blur: 22, scale0: 1.14, dur: .9, out: oN });
    atext('раз быстрее', 540, 666, T.raz, t, { size: 52, w: 500, col: sub, track: -.005, out: oN });
    // s3: форма раковины — контур профиля чаши (срез) и выноска
    const fA = P(t, T.forma - .1, .8) * (1 - P(t, T.kak - .2, .5, eIn));
    if (fA > .003) {
      const g = stage.ink;
      const ptsL = [], N = 40;
      for (let i = 0; i <= N; i++) { const x = SINK.RI * Math.sin(lerp(-1, 1, i / N) * Math.PI / 2); ptsL.push(project(cam, x, innerY(Math.abs(x)), 0)); }
      for (let i = 1; i <= N; i++) line(...ptsL[i - 1], ...ptsL[i], g, fA * .9 * P(t, T.forma + Math.abs(i / N - .5) * .8, .3), 3);
      const [rx, ry] = ptsL[3];
      callout(rx, ry, rx + 40, ry - 230, T.forma, t, ink, fA);
      atext('форма раковины', rx + 40, ry - 250, T.forma + .15, t, { size: 46, w: 600, col: ink, align: 'left', track: -.01, out: T.kak - .2 });
    }
    // s3: как налили воду — струя бьёт сбоку, по воде расходится касательная стрелка
    const jA = P(t, T.nal, .5) * (1 - P(t, s.end - .6, .3, eIn));
    const [jx, jy] = project(cam, JX, SINK.YW + .02, JZ), [tx, ty] = project(cam, JX, JTOP - .5, JZ);
    callout(tx, ty, tx + 60, ty - 90, T.kak, t, ink, P(t, T.kak, .3) * (1 - P(t, s.end - .5, .3, eIn)));
    atext('как налили воду', tx + 70, ty - 108, T.kak + .1, t, { size: 46, w: 600, col: ink, align: 'right', track: -.01, out: s.end - .5 });
    const th0 = Math.atan2(-JZ, JX), rr = Math.hypot(JX, JZ);
    ringArrow(cam, [0, SINK.YW + .02, 0], rr, th0, th0 - 1.4 * P(t, T.nal + .1, .9, eInOut), { col: ink, a: jA * .9, lw: 3.5, hh: 18 });
  },

  sfx(add, s) {
    const T = TT();
    add(T.zem, 'whoosh', .22, .9);
    add(T.men, 'tick', .16);
    add(T.vor, 'whoosh', .22, 1.1);
    add(T.obo, 'tick', .16, 1.1);
    add(T.sto - 1.5, 'riser', .26);
    add(T.sto, 'impact', .42, .9);
    add(T.raz, 'chime', .2, .9);
    add(T.nap, 'swell', .2, .7);
    add(T.forma, 'click', .25);
    add(T.nal - .3, 'splash', .18, .9);
  },
});
