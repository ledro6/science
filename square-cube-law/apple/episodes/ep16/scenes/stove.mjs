// STOVE (16.8 – 27.8 с), чёрный фон.
// s1 — керамическая плита из темноты, спираль-конфорка на алюминиевой чаше; ручка поворачивается, внизу шкала
//      температуры 0…1200 °C с живым счётчиком; около 500 °C спираль начинает тускло светиться (тёплый серый),
//      выноска «тёмно-красный», крупно «≈ 520 °C»; свет студии притухает.
// s2 — «Нагрей сильнее»: ручка дальше, шкала уходит за 520, свечение растёт и белеет; «ярче» / «белее».
import { defineScene, makeStage, project, atext, line, dot, callout, measure, P, Wd, E, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { makeStove, frame, keys, glow, smooth, collectMats, setLit, screenR, COIL, ctx } from './kit.mjs';

function TT() {
  return {
    eto: Wd('s1', 'Это'), kuh: Wd('s1', 'кухне'), konf: Wd('s1', 'Конфорка'), nach: Wd('s1', 'начинает'), svet: Wd('s1', 'светиться'),
    tk: Wd('s1', 'тёмно-красным'), pri: Wd('s1', 'примерно'), p5: Wd('s1', 'пятистах'), gr: Wd('s1', 'градусах'),
    nag: Wd('s2', 'Нагрей'), sil: Wd('s2', 'сильнее'), sv2: Wd('s2', 'свечение'), yar: Wd('s2', 'ярче'), bel: Wd('s2', 'белее'),
  };
}
// температура спирали, °C: 20 → 520 к «тёмно-красным», потом держится; на «Нагрей» уходит выше
const temp = (t, T) => 20 + 500 * P(t, T.eto + .3, T.tk + .1 - T.eto - .3, eInOut) + 620 * P(t, T.nag + .1, T.bel - T.nag - .1, eInOut);
// свечение: заметно с ~480 °C (тускло), дальше растёт круто; белизна — выше ~650 °C
const glowOf = Tc => .2 * smooth((Tc - 470) / 50) + .8 * Math.pow(smooth((Tc - 520) / 620), 1.4);
const whiteOf = Tc => smooth((Tc - 640) / 460);
const SX0 = 150, SX1 = 930, SY = 1215, TMAX = 1200;
const sx = Tc => lerp(SX0, SX1, Tc / TMAX);

defineScene('stove', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .55 });
    const stove = makeStove();
    stage.root.add(stove);
    return { stage, stove, T: TT(), mats: collectMats(stove) };
  },

  update(t, s, st) {
    const { stage, stove, T } = st, cam = stage.camera, L = stage.lights;
    const Tc = temp(t, T), gl = glowOf(Tc), wh = whiteOf(Tc);
    const knobA = 1.4 * P(t, T.eto + .1, 1.0, eInOut) + 1.2 * P(t, T.nag - .05, .9, eInOut);
    stove.set({ glow: gl, white: wh, knobA });
    // из темноты: контровые и рёбра, затем ключ; при раскалении студия притухает
    const lr = P(t, s.start, .9), lk = P(t, s.start + .25, 1.3);
    const dimS = 1 - .55 * smooth((gl - .1) / .5);
    L.key.position.set(lerp(-6, 5, clamp((t - s.start) / 10)), 9, 6);
    L.key.intensity = 2.6 * lk * dimS; L.hemi.intensity = .45 * lk * dimS;
    L.rimL.intensity = 3.2 * lr; L.rimR.intensity = 2.4 * lr;
    setLit(st.mats, lerp(.1, 1, lk));
    // камера: общий план плиты → наезд на конфорку → медленный облёт
    const [tx, tz, dist, az, el, sy] = keys([
      [s.start, .4, .2, 27, -26, 30, 930], [T.kuh + .3, .4, .2, 25.5, -22, 33, 930], [T.konf + .9, .15, 0, 19, -14, 40, 900],
      [T.p5, .15, 0, 18.6, -8, 42, 900], [T.nag + .6, .05, 0, 16.4, 0, 45, 920], [s.end, .05, 0, 15.8, 6, 47, 920],
    ], t, eInOut);
    frame(cam, [tx, .1, tz], dist, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const Tc = temp(t, T), gl = glowOf(Tc), wh = whiteOf(Tc);
    // свечение над спиралью (аддитивно; при низкой температуре — тёплый серый)
    const [cx, cy] = project(cam, 0, COIL.Y, 0);
    const rs = screenR(cam, [0, COIL.Y, 0], COIL.R);
    glow(cx, cy, rs * lerp(1.2, 1.9, gl), .42 * gl, 1 - wh);
    glow(cx, cy, rs * .8, .22 * smooth((gl - .3) / .6), 0);
    // ---- шкала температуры ----
    const aS = P(t, T.eto + .2, .7) * (1 - P(t, s.end - .5, .35, eIn));
    if (aS > .003) {
      line(SX0, SY, SX1, SY, sub, aS * .5, 2);
      for (let c = 0; c <= TMAX; c += 100) line(sx(c), SY - (c % 500 ? 7 : 12), sx(c), SY + (c % 500 ? 7 : 12), sub, aS * .55, 2);
      // заполнение до текущей температуры
      line(SX0, SY, sx(Tc), SY, ink, aS, 4);
      dot(sx(Tc), SY, 9, ink, aS);
      atext('0 °C', SX0, SY + 58, T.eto + .3, t, { size: 32, w: 500, col: sub, track: 0, a: aS, dy: 10 });
      atext('1000', sx(1000), SY + 58, T.eto + .4, t, { size: 32, w: 500, col: sub, track: 0, a: aS, dy: 10 });
      // засечка 520 °C — остаётся ориентиром
      const a5 = P(t, T.p5, .5) * aS;
      line(sx(520), SY - 26, sx(520), SY + 26, ink, a5, 3);
      atext('520', sx(520), SY + 58, T.p5 + .05, t, { size: 32, w: 600, col: ink, track: 0, a: aS, dy: 10 });
      // живой счётчик над точкой (только до 520 °C)
      const aC = P(t, T.eto + .3, .5) * (1 - P(t, T.nag + .05, .3, eIn)) * aS;
      if (aC > .003) {
        const v = Math.round(Tc / 10) * 10;
        g.save(); g.globalAlpha = aC; g.font = `600 40px ${'"Inter Display", Inter, sans-serif'}`; g.textAlign = 'center'; g.fillStyle = ink;
        g.letterSpacing = '-0.4px'; g.fillText(v + ' °C', clamp(sx(Tc), 210, 870), SY - 34); g.restore();
      }
    }
    // ---- выноска «тёмно-красный» от спирали ----
    const oT = T.nag - .2, aT = 1 - P(t, oT, .35, eIn);
    const [ax, ay] = project(cam, -COIL.R * .72, COIL.Y + .05, COIL.R * .55);
    if (t > T.tk - .1 && aT > .003) {
      callout(ax, ay, 230, 700, T.tk - .1, t, ink, aT);
      atext('тёмно-красный', 230, 675, T.tk, t, { size: 46, w: 500, col: ink, a: aT, track: -.005, dy: 16 });
    }
    // ---- крупно «≈ 520 °C» ----
    atext('≈ 520 °C', 540, 450, T.p5 - .05, t, { size: 180, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oT });
    atext('начало свечения', 540, 528, T.gr - .1, t, { size: 44, w: 500, col: sub, track: -.005, out: oT });
    // ---- s2: «ярче» / «белее» ----
    atext('Ярче', 540, 400, T.yar - .05, t, { size: 150, w: 700, col: ink, track: -.04, blur: 18, out: s.end - .4 });
    atext('и белее', 540, 540, T.bel - .05, t, { size: 150, w: 700, col: ink, track: -.04, blur: 18, out: s.end - .4 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .2, 'swell', .28, .7);
    add(T.eto + .1, 'click', .3, .8);
    add(T.svet, 'bloom', .25, .7);
    add(T.p5 - .05, 'chime', .24, .9);
    add(T.nag - .05, 'click', .32, .9);
    add(T.sil, 'swell', .3, .8);
    add(T.yar, 'shimmer', .22);
    add(T.bel, 'chime', .22, 1.05);
  },
});
