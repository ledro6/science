// TEST (t1), светлый фон. Проверка 2016 года.
// «две тысячи шестнадцатом» — крупно «2016», на «аккуратные» серым «аккуратные опыты»;
// внизу два стакана с термометрами (горячий и холодный);
// «и эффекта не нашли» — заголовок «2016: эффект не подтвердился», рисуются кривые остывания до 0 °C:
//   горячая доходит до нуля позже холодной;
// «зависел … куда поставить термометр» — термометры переставляют (в горячем выше, в холодном ниже),
//   кривые плавно меняются местами: «эффект» появляется только из-за места термометра.
import { defineScene, makeStage, atext, project, line, dot, P, Wd, WdE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeGlass, makeThermo, makeSteam, frame, wideShadow, poly, fit, GLASS } from './kit.mjs';

function TT() {
  return {
    dve: Wd('t1', 'две'), shes: Wd('t1', 'шестнадцатом'), fiz: Wd('t1', 'физики'), akk: Wd('t1', 'аккуратные'), op: Wd('t1', 'опыты'),
    i: Wd('t1', 'и'), eff: Wd('t1', 'эффекта'), nash: Wd('t1', 'нашли'), rez: Wd('t1', 'результат'), zav: Wd('t1', 'зависел'),
    kuda: Wd('t1', 'куда'), post: Wd('t1', 'поставить'), term: Wd('t1', 'термометр'), termE: WdE('t1', 'термометр'),
  };
}
const GX = .68;
const T0 = TT();
const MOVE = [T0.zav, T0.termE - T0.zav];          // перестановка термометров
const B_LO = GLASS.bt + .1, B_HI = .66;
// остывание по Ньютону в морозилке (−18 °C), до 0 °C, затем плато (вода замерзает)
const temp = (T0v, tau, x) => Math.max(0, -18 + (T0v + 18) * Math.exp(-x / tau));
const cross = (T0v, tau) => tau * Math.log((T0v + 18) / 18);
const taus = m => [lerp(1.0, .32, m), lerp(1.0, 1.25, m)];   // [горячая, холодная]

defineScene('test', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    wideShadow(stage, 6, 1.4);
    const hot = makeGlass({ paper: true }), cold = makeGlass({ paper: true });
    hot.position.x = -GX; cold.position.x = GX;
    const th1 = makeThermo({ L: 1.1, paper: true }), th2 = makeThermo({ L: 1.1, paper: true });
    const steam = makeSteam({ n: 14, color: '#C7C7CC', op: .22, height: .6, spread: .1, seed: 12 });
    steam.position.set(-GX, .78, 0);
    stage.root.add(hot, cold, th1, th2, steam);
    return { stage, hot, cold, th1, th2, steam, T: TT() };
  },

  update(t, s, st) {
    const { stage, th1, th2, steam, T } = st, cam = stage.camera;
    const m = P(t, MOVE[0], MOVE[1], eInOut);
    th1.position.set(-GX + .1, lerp(B_LO, B_HI, m), -.06); th1.rotation.z = -.1;
    th2.position.set(GX - .1, lerp(B_HI, B_LO, m), -.06); th2.rotation.z = .1;
    const u = P(t, T.i, 1.6, x => x);
    th1.setCol(.25 + .6 * (1 - u)); th2.setCol(.25 + .2 * (1 - u));
    steam.set(t, .9 * (1 - P(t, T.i, 1.4)));
    frame(cam, [0, .7, 0], 13.2 - .08 * (t - s.start), -10 + (t - s.start) * 1.6, 12, 540, lerp(1040, 1060, P(t, T.i, 1.0, eInOut)));
  },

  draw2d(t, s, st) {
    const { stage, hot, cold, th1, th2, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // 2016
    const o1 = T.i - .15;
    atext('2016', 540, 640, T.dve - .05, t, { size: 280, w: 700, col: ink, track: -.045, blur: 22, scale0: 1.12, dur: .9, out: o1 });
    atext('аккуратные опыты', 540, 740, T.akk - .05, t, { size: 52, w: 500, col: sub, track: -.005, out: o1 });
    // заголовок
    const h = '2016: эффект не подтвердился';
    atext(h, 540, 330, T.i, t, { size: fit(h, 84), w: 600, col: ink, track: -.03 });
    // график
    const gA = P(t, T.i, .5);
    if (gA > .003) {
      const X0 = 150, X1 = 930, XM = 2.1, Y = v => 690 - v * 3.4;
      line(X0, Y(72), X0, Y(-4), sub, gA * .6, 2);
      line(X0, Y(0), X1, Y(0), sub, gA * .6, 2, [8, 9]);
      atext('0 °C', X0 - 14, Y(0) + 12, T.i + .1, t, { size: 32, w: 500, col: sub, align: 'right', track: 0, dy: 10 });
      const m = P(t, MOVE[0], MOVE[1], eInOut), [th, tc] = taus(m), u = P(t, T.i + .1, 1.4, x => x);
      const curve = (T0v, tau) => { const pts = []; for (let i = 0; i <= 90; i++) { const x = i / 90 * XM; pts.push([lerp(X0, X1, i / 90), Y(temp(T0v, tau, x))]); } return pts; };
      poly(curve(20, tc), sub, gA, 4, u);
      poly(curve(70, th), ink, gA, 4, u);
      // точки «дошла до нуля»
      const fA = P(t, T.i + 1.0, .5);
      const xh = lerp(X0, X1, cross(70, th) / XM), xc = lerp(X0, X1, cross(20, tc) / XM);
      dot(xh, Y(0), 8, ink, fA); dot(xc, Y(0), 8, sub, fA);
      // подписи кривых у начала
      atext('горячая', X0 + 18, Y(70) + 8, T.i + .3, t, { size: 34, w: 600, col: ink, align: 'left', track: 0, dy: 10 });
      atext('холодная', X0 + 18, Y(20) - 14, T.i + .4, t, { size: 34, w: 500, col: sub, align: 'left', track: 0, dy: 10 });
      // кто первый
      const first = xh < xc;
      atext('первая', Math.min(xh, xc), Y(0) + 44, T.i + 1.1, t, { size: 32, w: 600, col: ink, track: 0, dy: 10, out: MOVE[0] + MOVE[1] * .35 });
      atext('первая', Math.min(xh, xc), Y(0) + 44, MOVE[0] + MOVE[1] * .75, t, { size: 32, w: 600, col: ink, track: 0, dy: 10 });
      void first;
    }
    // термометры: выше / ниже
    const mA = P(t, MOVE[0] + .2, .5);
    const [ax, ay] = project(cam, th1.position.x, th1.position.y, 0), [bx, by] = project(cam, th2.position.x, th2.position.y, 0);
    const lx1 = project(cam, -GX - .38, 0, 0)[0], lx2 = project(cam, GX + .38, 0, 0)[0];
    if (mA > .003) {
      line(ax - 10, ay, lx1 - 14, ay, ink, mA * .6, 2); dot(ax, ay, 5, ink, mA);
      line(bx + 10, by, lx2 + 14, by, ink, mA * .6, 2); dot(bx, by, 5, ink, mA);
    }
    atext('выше', lx1 - 26, ay + 13, MOVE[0] + .3, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, dy: 10 });
    atext('ниже', lx2 + 26, by + 13, MOVE[0] + .3, t, { size: 38, w: 500, col: sub, align: 'left', track: 0, dy: 10 });
    void hot; void cold;
  },

  sfx(add) {
    const T = TT();
    add(T.dve, 'bloom', .24, .85);
    add(T.akk, 'tick', .12);
    add(T.i, 'whoosh', .18, 1.1);
    add(T.i + 1.0, 'click', .18);
    add(MOVE[0], 'swell', .2, .8);
    add(MOVE[0] + MOVE[1], 'click', .2, .9);
  },
});
