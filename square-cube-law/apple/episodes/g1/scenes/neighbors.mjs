// NEIGHBORS (25.36 – 34.53 с), чёрный фон.
// n1 — глобус разворачивается к Северной Америке; на «главные партнёры» к далёким странам уходят тонкие дуги,
//      на «США» светлеет силуэт США, на «Мексика» и «Канада» — силуэты соседей и толстые светящиеся дуги потоков;
// n2 — шкала закона: верхняя пара на расстоянии D, нижняя разъезжается до 2D, поток вдвое тоньше;
//      «×2 расстояние» и «×½ торговля» белым (красный акцент выпуска — только «×20» в следующей сцене).
import { defineScene, makeStage, atext, line, P, Wd, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, llDir, makeGlobe, makeCountry, makeShell, collectMats, setLit, camLights, camAz, frame, keys, globeArcPts, projPts, drawArc, spot, glow, dim, PLACES as PL } from './kit.mjs';

function TT() {
  return {
    poet: Wd('n1', 'Поэтому'), glav: Wd('n1', 'главные'), part: Wd('n1', 'партнёры'), usa: Wd('n1', 'США'), sos: Wd('n1', 'соседи'),
    mex: Wd('n1', 'Мексика'), kan: Wd('n1', 'Канада'),
    vd: Wd('n2', 'Вдвое'), dal: Wd('n2', 'дальше'), torg: Wd('n2', 'торговля'), pad: Wd('n2', 'падает'), vd2: Wd('n2', 'вдвое', 1),
    cut: Wd('n2', 'дальше') - .45,
  };
}
const RG = 1;
const FARS = [['usa', 'ger'], ['usa', 'jpn'], ['usa', 'fra'], ['usa', 'kor']];

defineScene('neighbors', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const gl = new THREE.Group();
    const globe = makeGlobe(RG), atm = makeShell(RG * 1.015, { base: 0, rim: .55, pow: 4 });
    const cUSA = makeCountry('USA', RG), cMEX = makeCountry('MEX', RG), cCAN = makeCountry('CAN', RG);
    gl.add(globe, cUSA, cMEX, cCAN, atm);
    stage.root.add(gl);
    const arcMex = globeArcPts(RG, PL.usa, PL.mex), arcCan = globeArcPts(RG, PL.usa, PL.can);
    const fars = FARS.map(([a, b]) => globeArcPts(RG, PL[a], PL[b], { n: 96 }));
    return { stage, gl, globe, atm, cUSA, cMEX, cCAN, arcMex, arcCan, fars, mats: collectMats(globe), T: TT() };
  },

  update(t, s, st) {
    const { stage, atm, cUSA, cMEX, cCAN, T } = st, cam = stage.camera, L = stage.lights;
    const lit = P(t, s.start + .05, 1.1) * (1 - P(t, T.cut, .7, eInOut));
    setLit(st.mats, lit); atm.material.uniforms.uOp.value = lit;
    const ov = (c, t0, k) => { const p = P(t, t0, .8) * k * lit; c.material.opacity = .9 * p; c.material.emissiveIntensity = .22 * p; c.visible = p > .003; };
    ov(cUSA, T.usa - .05, 1); ov(cMEX, T.mex - .05, 1); ov(cCAN, T.kan - .05, 1);
    // разворот к Северной Америке, наезд к «соседи»
    const [lon, lat, d] = keys([[s.start, -62, 30, 12], [T.usa, -96, 40, 11], [T.kan + .6, -100, 42, 10.4], [T.cut + 1.2, -102, 44, 12]], t, eInOut);
    const az = camAz(lon) + (t - s.start) * .4;
    frame(cam, [0, 0, 0], d, az, lat, 540, lerp(950, 1180, P(t, T.cut, 1.2, eInOut)));
    camLights(L, az, 1);
  },

  draw2d(t, s, st) {
    const { stage, arcMex, arcCan, fars, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const fade = 1 - P(t, T.cut - .1, .5, eIn);
    // --- n1: тонкие дальние дуги, затем толстые к соседям ---
    fars.forEach((pts, i) => drawArc(projPts(cam, pts, RG), t, { p: P(t, T.part - .1 + i * .1, 1.3, eInOut), lw: 1.4, a: .6 * fade * (1 - .5 * P(t, T.mex, .8)), glowK: .3 }));
    drawArc(projPts(cam, arcMex, RG), t, { p: P(t, T.mex - .1, .9, eInOut), lw: 7, a: fade, pulses: 3, speed: .45, back: true });
    drawArc(projPts(cam, arcCan, RG), t, { p: P(t, T.kan - .1, .9, eInOut), lw: 7.5, a: fade, pulses: 3, speed: .45, phase: .3, back: true });
    const lab = (k, name, t0, dx, dy) => {
      const [q] = projPts(cam, [llDir(...PL[k]).multiplyScalar(RG * 1.003).toArray()], RG);
      if (!q.vis) return;
      spot(q.x, q.y, 6, ink, fade * P(t, t0 - .1, .5));
      atext(name, q.x + dx, q.y + dy, t0, t, { size: 48, w: 600, col: ink, track: -.01, out: T.cut - .2 });
    };
    lab('usa', 'США', T.usa, 70, 50);
    lab('mex', 'Мексика', T.mex, -120, 40);
    lab('can', 'Канада', T.kan, -40, -40);
    atext('главные торговые партнёры США', 540, 330, T.glav, t, { size: 44, w: 500, col: sub, track: -.005, out: T.cut - .2 });
    atext('соседи', 540, 440, T.sos, t, { size: 112, w: 600, col: ink, track: -.03, out: T.cut - .2 });

    // --- n2: шкала «вдвое дальше → вдвое меньше» ---
    if (t > T.cut) {
      const g = ctx(), a = P(t, T.cut + .4, .6);
      const x0 = 210, xD = 520, yA = 600, yB = 820;
      const xB = lerp(xD, 830, P(t, T.dal - .05, 1.1, eInOut));
      const wB = lerp(22, 11, P(t, T.pad - .05, 1.0, eInOut));
      const band = (y, x1, x2, w, al) => {
        g.save(); g.globalAlpha = al; g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(x1, y - w / 2, x2 - x1, w, w / 2); g.fill(); g.restore();
      };
      band(yA, x0, xD, 22, a * .9); band(yB, x0, xB, wB, a * .9);
      for (const [x, y] of [[x0, yA], [xD, yA], [x0, yB], [xB, yB]]) { glow(x, y, 70, .25 * a); spot(x, y, 22, ink, a); }
      dim(x0, yA - 70, xD, yA - 70, a * .8, sub);
      atext('D', (x0 + xD) / 2, yA - 90, T.cut + .45, t, { size: 46, w: 500, col: sub, track: 0 });
      dim(x0, yB + 70, xB, yB + 70, a * P(t, T.dal, .5) * .8, sub);
      atext('2D', (x0 + xB) / 2, yB + 140, T.dal, t, { size: 46, w: 500, col: sub, track: 0 });
      atext('×2', 300, 1130, T.dal + .1, t, { size: 200, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
      atext('расстояние', 300, 1205, T.dal + .3, t, { size: 46, w: 500, col: sub, track: -.005 });
      atext('×½', 780, 1130, T.vd2, t, { size: 200, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
      atext('торговля', 780, 1205, T.torg + .1, t, { size: 46, w: 500, col: sub, track: -.005 });
      line(540, 1020, 540, 1220, sub, a * .35, 2);
    }
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .22, .7);
    add(T.part, 'shimmer', .12, .9);
    add(T.usa, 'tick', .16);
    add(T.mex, 'whoosh', .22, 1.1);
    add(T.kan, 'whoosh', .22, 1.2);
    add(T.cut, 'thud', .2, .8);
    add(T.dal, 'whoosh', .22, .9);
    add(T.dal + .2, 'click', .2, 1);
    add(T.vd2, 'chime', .24, .95);
  },
});
