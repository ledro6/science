// CURVE (28.2 – 35.1 с), чёрный фон. График в стиле keynote M1: без сетки, тонкие оси, одна белая кривая
// вероятности совпадения P(n) для n = 0…70, рисуется по ходу речи; светящаяся точка на конце.
// c1 — кривая доходит до 23 («50,7%»), затем до 40: точка, пунктир до оси, выноска «89,1%», крупно «≈90%»;
// c2 — кривая доходит до 70: выноска «99,9%», огромная красная «99,9%» «70 человек».
import { defineScene, makeStage, atext, line, dot, P, Wd, E, clamp, lerp, eApple, eIn, eInOut, accent } from '../../../engine.mjs';
import { ctx, prob, glow } from './kit.mjs';

const X0 = 150, X1 = 930, Y0 = 1235, Y1 = 735, NMAX = 70;
const xOf = n => X0 + n / NMAX * (X1 - X0), yOf = p => Y0 - p * (Y0 - Y1);
const fmtP = p => (Math.round(p * 1000) / 10).toFixed(1).replace('.', ',') + '%';

function TT() {
  return {
    pri: Wd('c1', 'При'), sor: Wd('c1', 'сорока'), lyud: Wd('c1', 'людях'), ver: Wd('c1', 'вероятность'), dev: Wd('c1', 'девяносто'), proc: Wd('c1', 'процентов'),
    pri2: Wd('c2', 'При'), sem: Wd('c2', 'семидесяти'), dev2: Wd('c2', 'девяносто'), des: Wd('c2', 'десятых'),
  };
}
// сколько людей уже «прорисовано» кривой
function nOf(t, T, s) {
  const K = [[s.start + .25, 0], [T.sor + .05, 23], [T.sor + .45, 23], [T.dev - .05, 40], [T.pri2 + .05, 40], [T.dev2 - .1, 70]];
  if (t <= K[0][0]) return 0;
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const a = K[i - 1], b = K[i]; return lerp(a[1], b[1], eInOut((t - a[0]) / (b[0] - a[0]))); }
  return NMAX;
}

defineScene('curve', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    stage.camera.position.set(0, 0, 10); stage.camera.lookAt(0, 0, 0);
    return { stage, T: TT() };
  },

  update() {},

  draw2d(t, s, st) {
    const { stage, T } = st, ink = stage.ink, sub = stage.sub, g = ctx();
    const ax = P(t, s.start + .1, .9, eApple);
    // оси
    const axc = '#48484A';
    line(X0, Y0, lerp(X0, X1 + 20, ax), Y0, axc, ax, 2);
    line(X0, Y0, X0, lerp(Y0, Y1 - 20, ax), axc, ax, 2);
    for (const n of [0, 10, 20, 30, 40, 50, 60, 70]) atext(String(n), xOf(n), Y0 + 44, s.start + .3 + n * .006, t, { size: 26, w: 500, col: sub, track: 0, dy: 10, dur: .6 });
    atext('человек в комнате', X1, Y0 + 92, s.start + .5, t, { size: 28, w: 500, col: sub, align: 'right', track: 0, dy: 10, dur: .6, a: .8 });
    atext('100%', X0 - 16, Y1 + 9, s.start + .4, t, { size: 26, w: 500, col: sub, align: 'right', track: 0, dy: 10, dur: .6 });
    atext('50%', X0 - 16, yOf(.5) + 9, s.start + .45, t, { size: 26, w: 500, col: sub, align: 'right', track: 0, dy: 10, dur: .6 });
    line(X0, yOf(.5), lerp(X0, X1, ax), yOf(.5), axc, ax * .9, 2, [6, 10]);
    line(X0, Y1, lerp(X0, X1, ax), Y1, axc, ax * .5, 2, [6, 10]);
    // кривая
    const n = nOf(t, T, s);
    if (n > .05) {
      g.save(); g.strokeStyle = ink; g.lineWidth = 4; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
      for (let k = 0; k <= 200; k++) { const m = n * k / 200, x = xOf(m), y = yOf(prob(m)); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.restore();
      const hx = xOf(n), hy = yOf(prob(n));
      glow(hx, hy, 60, .45 * (1 - P(t, T.des, .6)));
      dot(hx, hy, 7, ink, 1);
    }
    // маркеры: точка, пунктир до оси, выноска
    const mark = (m, t0, val, lab, lx, ly, align, out = null) => {
      const a = P(t, t0, .5, eApple) * (out == null ? 1 : 1 - .6 * P(t, out, .5));
      if (a <= .003) return;
      const x = xOf(m), y = yOf(prob(m));
      const dl = P(t, t0, .6, eApple);
      line(x, y, x, lerp(y, Y0, dl), ink, .45 * a, 2, [4, 8]);
      dot(x, y, 9 * a, ink, a);
      g.save(); g.globalAlpha = a; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 16 + 4 * (1 - dl), 0, 7); g.globalAlpha = .5 * a; g.stroke(); g.restore();
      const o = { align, track: -.01, dy: 14, dur: .6, a: out == null ? 1 : 1 - .6 * P(t, out, .5) };
      atext(val, lx, ly, t0 + .15, t, { ...o, size: 46, w: 600, col: ink });
      atext(lab, lx, ly + 38, t0 + .25, t, { ...o, size: 28, w: 500, col: sub, track: 0 });
    };
    mark(23, T.sor + .05, '50,7%', '23 человека', xOf(23) + 34, yOf(prob(23)) + 62, 'left', T.pri2);
    mark(40, T.dev - .05, '89,1%', '40 человек', xOf(40) + 30, yOf(prob(40)) + 74, 'left', T.pri2);
    mark(70, T.dev2 - .1, '99,9%', '70 человек', X1 - 30, Y1 - 78, 'right');
    // крупные цифры
    atext('50,7%', 540, 480, T.pri, t, { size: 250, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.1, dur: .9, out: T.sor + .45, outDur: .35 });
    atext('23 человека', 540, 556, T.pri + .15, t, { size: 46, w: 500, col: sub, track: -.005, out: T.sor + .45, outDur: .35 });
    atext('≈90%', 540, 480, T.dev, t, { size: 250, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.1, dur: .9, out: T.pri2 - .1, outDur: .35 });
    atext('при 40 людях', 540, 556, T.dev + .2, t, { size: 46, w: 500, col: sub, track: -.005, out: T.pri2 - .1, outDur: .35 });
    atext('99,9%', 540, 480, T.dev2, t, { size: 250, w: 700, col: accent(), track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('при 70 людях', 540, 556, T.dev2 + .25, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.pri, 'tick', .15);
    add(T.sor + .1, 'swell', .22, .9);
    add(T.dev, 'chime', .25, .85);
    add(T.pri2 + .1, 'swell', .22, 1);
    add(T.dev2 - 1.5, 'riser', .25);
    add(T.dev2, 'impact', .4, .9);
  },
});
