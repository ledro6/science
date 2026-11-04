// WHY (w1), чёрный фон. Три объяснения — три стакана в ряд, камера по очереди подъезжает к каждому.
// «Объяснений предлагали много» — общий план: три стакана, заголовок «Объяснений много»;
// 1 «испаряется … теряет массу» — над левым стаканом пар, уровень воды опускается, пунктир отмечает прежний уровень;
// 2 «меньше растворённого газа» — в среднем стакане пузырьки газа, на «газа» их становится меньше;
// 3 «холодная может переохладиться» — правый стакан с термометром, сверху график: температура уходит ниже нуля,
//   вода ещё жидкая, затем скачок к нулю — и стакан мгновенно схватывается льдом.
import { defineScene, makeStage, atext, project, line, dot, P, Wd, WdE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeGlass, makeSteam, makeBubbles, makeThermo, frame, keys, glow, wideShadow, poly, ring3, fit, GLASS } from './kit.mjs';

function TT() {
  return {
    obj: Wd('w1', 'Объяснений'), mn: Wd('w1', 'много'), gor: Wd('w1', 'горячая'), isp: Wd('w1', 'испаряется'), ter: Wd('w1', 'теряет'), mas: Wd('w1', 'массу'),
    vn: Wd('w1', 'в', 1), men: Wd('w1', 'меньше'), rast: Wd('w1', 'растворённого'), gaz: Wd('w1', 'газа'),
    a: Wd('w1', 'а'), hol: Wd('w1', 'холодная'), mozh: Wd('w1', 'может'), per: Wd('w1', 'переохладиться'),
  };
}
const XS = [-1.75, 0, 1.75];
const T0 = TT();
const L0 = .8, L1 = .64;
// график переохлаждения: доля пути, где кривая «срывается» к нулю
const G0 = T0.hol + .1, GD = WdE('w1', 'переохладиться') - .1 - G0;
const JUMP = .7;
const curve = u => u < JUMP ? lerp(9, -6.5, 1 - Math.pow(1 - u / JUMP, 1.6)) : u < JUMP + .04 ? lerp(-6.5, 0, (u - JUMP) / .04) : 0;

defineScene('why', {
  setup() {
    const stage = makeStage({ bg: 'black', shadow: .5 });
    wideShadow(stage, 6, 1.4);
    const gl = XS.map(x => { const g = makeGlass(); g.position.x = x; stage.root.add(g); return g; });
    const steam = makeSteam({ n: 26, op: .5, height: .95, spread: .14, seed: 4 });
    steam.position.set(XS[0], GLASS.h - .12, 0);
    const bub = makeBubbles({ n: 56, seed: 9 }); bub.position.x = XS[1];
    const th = makeThermo({ L: 1.2 }); th.position.set(XS[2] + .1, GLASS.bt + .22, -.05); th.rotation.z = -.12;
    stage.root.add(steam, bub, th);
    return { stage, gl, steam, bub, th, T: TT() };
  },

  update(t, s, st) {
    const { stage, gl, steam, bub, th, T } = st, cam = stage.camera, L = stage.lights;
    // 1: испарение — уровень опускается
    const lv = lerp(L0, L1, P(t, T.isp, T.mas + .6 - T.isp, eInOut));
    gl[0].setLevel(lv);
    steam.position.y = lv + .02;
    steam.set(t, P(t, T.gor - .1, .8) * (1 - .6 * P(t, T.hol, 1)));
    // 2: газ — пузырьков меньше на «газа»
    bub.set(t, lerp(.95, .18, P(t, T.gaz - .1, 1.0, eInOut)), L0);
    // 3: переохлаждение — лёд в момент скачка на графике
    const u = P(t, G0, GD, x => x);
    gl[2].setIce(P(t, G0 + GD * (JUMP + .02), .35, eApple));
    th.setCol(clamp(.25 + curve(u) / 40));
    // камера: общий план → 1 → 2 → 3
    const C = (i, d = 9.4) => [XS[i], d];
    const [tx, d, sy] = keys([
      [s.start, 0, 18.5, 1000], [T.mn + .2, 0, 17.6, 1000],
      [T.gor + .5, ...C(0), 1030], [T.vn - .3, ...C(0), 1040],
      [T.vn + .6, ...C(1), 1030], [T.a - .3, ...C(1), 1040],
      [T.a + .6, ...C(2), 1090], [s.end, XS[2], 9.0, 1100],
    ], t, eInOut);
    frame(cam, [tx, .5, 0], d, -12 + (t - s.start) * 1.8, 11, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, gl, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // общий план
    atext('Объяснений много', 540, 330, T.obj - .05, t, { size: 96, w: 600, col: ink, track: -.03, out: T.gor + .1 });
    atext('три главных', 540, 400, T.mn, t, { size: 44, w: 500, col: sub, track: 0, out: T.gor + .1 });
    // подсветка под стаканами
    gl.forEach(g => { const [x, y] = project(cam, g.position.x, .05, 0); glow(x, y, 200, .035); });
    // 1. испарение
    const o1 = T.vn - .2;
    atext('Испарение', 540, 330, T.gor + .3, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
    atext('горячая теряет часть воды', 540, 400, T.ter - .1, t, { size: 46, w: 500, col: sub, track: 0, out: o1 });
    const dA = P(t, T.isp + .2, .5) * (1 - P(t, o1, .35, eIn));
    if (dA > .003) {
      ring3(cam, [XS[0], 0, 0], 0.333, L0, ink, dA * .7, 2, [6, 8]);
      const [rx, ry] = project(cam, XS[0] + .36, L0, 0);
      line(rx + 6, ry, rx + 60, ry, ink, dA * .6, 2);
      atext('было', rx + 72, ry + 13, T.isp + .3, t, { size: 38, w: 500, col: sub, align: 'left', track: 0, dy: 12, out: o1 });
      const [qx, qy] = project(cam, XS[0] + .36, gl[0].level, 0);
      line(qx + 6, qy, qx + 60, qy, ink, dA * P(t, T.mas, .5), 2);
      atext('стало', qx + 72, qy + 13, T.mas, t, { size: 38, w: 500, col: ink, align: 'left', track: 0, dy: 12, out: o1 });
    }
    // 2. растворённый газ
    const o2 = T.a - .2, h2 = 'Растворённый газ';
    atext(h2, 540, 330, T.vn, t, { size: fit(h2, 104), w: 600, col: ink, track: -.03, out: o2 });
    atext('в горячей воде его меньше', 540, 400, T.men, t, { size: 46, w: 500, col: sub, track: 0, out: o2 });
    // 3. переохлаждение: график
    const h3 = 'Переохлаждение';
    atext(h3, 540, 330, T.a + .05, t, { size: fit(h3, 104), w: 600, col: ink, track: -.03 });
    atext('холодная остаётся жидкой ниже нуля', 540, 400, T.mozh - .1, t, { size: 42, w: 500, col: sub, track: 0 });
    const gA = P(t, T.hol - .1, .5);
    if (gA > .003) {
      const X0 = 150, X1 = 930, Y = v => 590 - v * 15;   // 0 °C на y = 590
      line(X0, Y(11), X0, Y(-8), sub, gA * .7, 2);
      line(X0, Y(0), X1, Y(0), ink, gA * .5, 2, [8, 9]);
      atext('0 °C', X0 - 14, Y(0) + 12, T.hol, t, { size: 34, w: 500, col: sub, align: 'right', track: 0, dy: 10 });
      const u = P(t, G0, GD, x => x), pts = [];
      for (let i = 0; i <= 120; i++) { const q = i / 120; pts.push([lerp(X0, X1, q), Y(curve(q))]); }
      const end = poly(pts, ink, gA, 4, u);
      if (end && u < 1) dot(end[0], end[1], 7, ink, gA);
      // минимум: ниже нуля, но жидкая
      const [mx, my] = [lerp(X0, X1, JUMP), Y(-6.5)];
      const mA = P(t, G0 + GD * JUMP - .1, .4);
      dot(mx, my, 6, ink, mA);
      atext('ниже нуля, ещё вода', mx - 30, my + 40, G0 + GD * JUMP - .05, t, { size: 36, w: 500, col: sub, align: 'right', track: 0, dy: 10 });
      atext('лёд', lerp(X0, X1, .86), Y(0) - 20, G0 + GD * (JUMP + .05), t, { size: 40, w: 600, col: ink, track: 0, dy: 10 });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.obj, 'bloom', .22, .8);
    add(T.gor + .3, 'whoosh', .2, 1.0);
    add(T.mas, 'tick', .14);
    add(T.vn, 'whoosh', .2, 1.1);
    add(T.gaz, 'pop', .12, 1.2);
    add(T.a, 'whoosh', .2, .9);
    add(G0 + GD * JUMP, 'crack', .18, 1.2);
  },
});
