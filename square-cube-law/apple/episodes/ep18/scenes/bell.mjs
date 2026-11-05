// BELL (19,4 – 31,4 с), чёрный фон. Ячейки доски становятся столбиками: тринадцать стопок из маленьких
// керамических плиток (высота ∝ биномиальной вероятности ячейки) падают из темноты слой за слоем.
// n1 — на «распределены» по вершинам проводится гладкая кривая-колокол (hairline); подписи «рост людей»,
//      «ошибки измерений»; на «множество мелких случайных причин» плитки мерцают вразнобой («много мелких причин»),
//      на «складываются вместе» зазоры закрываются: плитки срастаются в цельные столбики.
// n2 — область ±1σ под кривой закрашивается, столбики снаружи гаснут; огромное красное «68 %»,
//      подпись «в пределах одного отклонения»; на «отклонения» — отметки −1σ и +1σ, на «среднего» — линия среднего.
import { defineScene, makeStage, project, atext, P, Wd, clamp, lerp, rng, eApple, eIn, eInOut, eSpring, THREE } from '../../../engine.mjs';
import { rbox, frame, keys, glow, dashPath, line, ctx, PB, NBIN, ROWS } from './kit.mjs';

const SP = .42, BW = .34, BHt = .17, MAXL = 24;
const CNT = PB.map(p => Math.round(p / PB[ROWS / 2] * MAXL));
const SIG = Math.sqrt(ROWS) / 2;                          // σ в ячейках
const GPK = MAXL * BHt / PB[ROWS / 2] / Math.sqrt(2 * Math.PI) / SIG;   // высота вершины кривой
const curveH = u => GPK * Math.exp(-u * u / (2 * SIG * SIG));
function TT() {
  return {
    tak: Wd('n1', 'Так'), rasp: Wd('n1', 'распределены'), rost: Wd('n1', 'рост'), osh: Wd('n1', 'ошибки'), mn: Wd('n1', 'множество'),
    mel: Wd('n1', 'мелких'), skl: Wd('n1', 'складываются'), vm: Wd('n1', 'вместе'),
    ok: Wd('n2', 'Около'), sh: Wd('n2', 'шестидесяти'), proc: Wd('n2', 'процентов'), pred: Wd('n2', 'пределах'), odn: Wd('n2', 'одного'),
    otk: Wd('n2', 'отклонения'), sr: Wd('n2', 'среднего'),
  };
}

defineScene('bell', {
  setup(s) {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const blocks = [];
    CNT.forEach((c, k) => { for (let L = 0; L < c; L++) blocks.push({ k, L, ph: 0 }); });
    const R = rng(1818);
    blocks.forEach(b => { b.ph = R() * 6.283; b.fr = 5 + R() * 6; b.dt = R() * .05; });
    const mat = new THREE.MeshPhysicalMaterial({ color: '#F2F2F0', roughness: .42, clearcoat: .35, clearcoatRoughness: .3 });
    const im = new THREE.InstancedMesh(rbox(BW, BHt, BW, .03, 2), mat, blocks.length);
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    const col = new THREE.Color('#ffffff');
    blocks.forEach((b, i) => im.setColorAt(i, col));
    stage.root.add(im);
    return { stage, T: TT(), blocks, im };
  },

  update(t, s, st) {
    const { stage, T, blocks, im } = st, cam = stage.camera, L = stage.lights;
    const lr = P(t, s.start, .9), lk = P(t, s.start + .25, 1.2);
    L.key.position.set(lerp(-5, 4, clamp((t - s.start) / (s.end - s.start))), 9, 7);
    L.key.intensity = 2.6 * lk; L.hemi.intensity = .55 * lk; L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color();
    const fuse = P(t, T.skl - .05, .9, eInOut);                               // зазоры закрываются
    const flick = P(t, T.mn - .1, .5) * (1 - P(t, T.skl - .1, .5));          // мерцание «мелких причин»
    const dim = P(t, T.ok - .1, .9, eInOut);                                  // n2: снаружи ±1σ гаснет
    blocks.forEach((b, i) => {
      const t0 = s.start + .25 + b.L * .042 + Math.abs(b.k - ROWS / 2) * .05 + b.dt;
      const u = clamp((t - t0) / .7), e = eSpring(u);
      const h = lerp(BHt * .82, BHt, fuse);
      const y = b.L * BHt + BHt / 2 + (1 - e) * .9;
      V.set((b.k - ROWS / 2) * SP, y, 0);
      S.set(lerp(.9, 1, e) * lerp(1, 1.02, fuse), Math.max(1e-3, e) * h / BHt, lerp(.9, 1, e));
      M.compose(V, Q, S); im.setMatrixAt(i, M);
      const inside = Math.abs(b.k - ROWS / 2) <= SIG;
      let br = lerp(.05, 1, P(t, t0, .5)) * lerp(.2, 1, lk);
      br *= 1 - flick * .55 * (.5 + .5 * Math.sin(b.ph + t * b.fr));
      br *= inside ? 1 : lerp(1, .3, dim);
      im.setColorAt(i, C.setScalar(br));
    });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    const [dist, az, el, sy] = keys([[s.start, 26, 22, 6, 930], [T.ok, 27.5, 13, 7, 940], [s.end, 28, 9, 8, 940]], t, eInOut);
    frame(cam, [0, 2.1, 0], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, acc = stage.accent;
    const Z = BW / 2 + .02;
    const pr = (u, y) => project(cam, u * SP, y, Z);
    const [fx, fy] = pr(0, 0);
    glow(fx, fy, 560, .06 * P(t, s.start + .2, 1));
    // кривая
    const pts = [];
    for (let q = 0; q <= 120; q++) { const u = (q / 120 - .5) * 14; pts.push(pr(u, curveH(u) + .03)); }
    dashPath(pts, P(t, T.rasp - .1, 1.2, eInOut), ink, .9, 3, null);
    // n2: область ±1σ
    const pf = P(t, T.sh - .1, 1.1, eInOut);
    if (pf > 0) {
      const a = SIG * pf;
      g.save(); g.globalAlpha = .2; g.fillStyle = '#FFFFFF';
      g.beginPath();
      const [x0, y0] = pr(-a, 0); g.moveTo(x0, y0);
      for (let q = 0; q <= 60; q++) { const u = -a + 2 * a * q / 60; g.lineTo(...pr(u, curveH(u) + .03)); }
      g.lineTo(...pr(a, 0)); g.closePath(); g.fill(); g.restore();
    }
    // отметки ±1σ и среднее
    const pm = P(t, T.otk - .15, .6), qm = 1 - P(t, s.end - .4, .3, eIn);
    [-1, 1].forEach(sn => {
      const [xa, ya] = pr(sn * SIG, 0), [xb, yb] = pr(sn * SIG, curveH(SIG) + .03);
      line(xa, ya, xa, lerp(ya, yb, pm), ink, .8 * qm, 2);
      atext(sn < 0 ? '−1σ' : '+1σ', xa, ya + 56, T.otk - .1 + (sn > 0 ? .12 : 0), t, { size: 44, w: 500, col: sub, track: -.01 });
    });
    {
      const ps = P(t, T.sr - .15, .6);
      const [xa, ya] = pr(0, 0), [xb, yb] = pr(0, curveH(0) + .03);
      line(xa, ya, xa, lerp(ya, yb, ps), ink, .55 * qm, 2, [3, 8]);
      atext('среднее', xb, yb - 26, T.sr - .1, t, { size: 40, w: 500, col: sub, track: -.005 });
    }
    // n1: подписи
    const hd = { size: 96, w: 600, col: ink, track: -.03 };
    atext('рост людей', 540, 470, T.rost - .05, t, { ...hd, out: T.osh - .2 });
    atext('ошибки измерений', 540, 470, T.osh - .05, t, { ...hd, out: T.mn - .2 });
    atext('много мелких причин', 540, 470, T.mel - .05, t, { ...hd, out: T.ok - .4 });
    // n2: главная цифра
    atext('68 %', 540, 470, T.sh - .05, t, { size: 280, w: 700, col: acc, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('в пределах одного отклонения', 540, 548, T.pred - .1, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .22, .8);
    for (let k = 0; k < 8; k++) add(s.start + .35 + k * .14, 'click', .07, .9 + k * .03);
    add(T.rasp, 'shimmer', .16);
    add(T.rost, 'tick', .14, 1.0);
    add(T.osh, 'tick', .14, 1.05);
    add(T.mn, 'shimmer', .12, 1.1);
    add(T.skl, 'click', .2, .85);
    add(T.sh - 1.5, 'riser', .22);
    add(T.sh, 'impact', .38, .9);
    add(T.otk, 'tick', .14, 1.0);
    add(T.sr, 'chime', .2, .95);
  },
});
