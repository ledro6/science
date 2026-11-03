// TABLE (t1), светлый фон. Расчёт Роберта Мэтьюза (1995).
// «Физик Роберт Мэтьюз» — заголовок и серым «1995»; стол 75 см в профиле, бутерброд на кромке;
// «перевернуться обратно» — пунктирная круговая стрелка вокруг бутерброда и «полный оборот»;
// «стол» — ножки вытягиваются до 3 м, камера отъезжает, размерная линия растёт («75 см» → «≈ 3 м» на «трёх»);
// затем падение с 3 м в замедлении: след из копий делает полный оборот, бутерброд ложится маслом вверх.
import { defineScene, makeStage, atext, project, line, P, Wd, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeToast, makeTable, wideShadow, ghosts, fallSim, place, frame, dim, arcArrow, TABLE, TOAST } from './kit.mjs';

function TT() {
  return {
    fiz: Wd('t1', 'Физик'), rob: Wd('t1', 'Роберт'), posch: Wd('t1', 'посчитал'), perev: Wd('t1', 'перевернуться'), obr: Wd('t1', 'обратно'),
    stol: Wd('t1', 'стол'), vys: Wd('t1', 'высотой'), treh: Wd('t1', 'трёх'), metr: Wd('t1', 'метров'),
  };
}
const T0 = TT();
const K0 = 1.7, K1 = 3.6, H1 = 30;
const S75 = fallSim({ k: K0 });
const SIM = fallSim({ H: H1, k: K1, omega: S75.omega });        // та же угловая скорость, стол 3 м
const NG = 7;
const gT = i => SIM.t1 + (SIM.tLand - SIM.t1) * Math.sqrt((i + 1) / (NG + .6));
const GROW = [T0.stol - .05, 1.0];                               // рост стола
const F0 = GROW[0] + GROW[1] + .05;                                // старт падения
const FD = (Wd('t1', 'метров') + .35) - F0;                        // падение занимает время до конца «метров»
const XD0 = 2.7, XD1 = 5.6;                                       // x размерной линии

defineScene('table', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    wideShadow(stage, 34, 4, 2048);
    const table = makeTable({ dark: false }), toast = makeToast();
    const gh = ghosts(stage.root, NG, .5);
    table.traverse(o => { o.castShadow = false; });   // тени стола обрезались бы краем карты теней (тень бутерброда остаётся)
    [table.children[2], table.children[4]].forEach(l => { l.visible = false; });   // дальние ножки лезли в кадр клином
    stage.root.add(table, toast);
    return { stage, table, toast, gh, T: TT() };
  },

  update(t, s, st) {
    const { stage, table, toast, gh } = st, cam = stage.camera;
    const gp = P(t, GROW[0], GROW[1], eInOut);
    const Hh = lerp(TABLE.H, H1, gp), k = lerp(K0, K1, gp);
    table.setH(Hh);
    const tau = Math.max(0, (t - F0) / FD * SIM.tLand);
    if (tau <= 0) place(toast, { x: .1 * k, y: Hh + TOAST.th / 2 * k, phi: 0 }, k);
    else place(toast, SIM.at(tau), K1);
    gh.forEach((g, i) => {
      const tk = gT(i); place(g, SIM.at(tk), K1);
      const a = clamp((tau - tk) / .03);
      g.visible = a > .01; for (const m in g.mats) g.mats[m].opacity = .5 * a;
    });
    const xd = lerp(XD0, XD1, gp);
    frame(cam, [lerp(2.2, xd - .2, gp), Hh / 2, 0], lerp(44, 128, gp), lerp(-30, -30, gp) + (t - s.start) * .6, lerp(9, 7, gp), 540, lerp(937, 790, gp));
    st.gp = gp; st.Hh = Hh; st.xd = xd; st.k = k;
  },

  draw2d(t, s, st) {
    const { stage, toast, T, gp, Hh, xd } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    // заголовок
    atext('Роберт Мэтьюз', 540, 330, T.rob - .1, t, { size: 84, w: 600, col: ink, track: -.03, out: T.stol - .2 });
    atext('физик, 1995', 540, 400, T.rob + .2, t, { size: 44, w: 500, col: sub, track: 0, out: T.stol - .2 });
    // пол
    const [fx1, fy1] = project(cam, -1.2, 0, 0), [fx2, fy2] = project(cam, 6 + 8 * gp, 0, 0);
    line(fx1, fy1, fx2, fy2, ink, .18, 2);
    // «перевернуться обратно»: круговая стрелка вокруг бутерброда
    const cA = P(t, T.perev - .1, .5) * (1 - P(t, T.stol - .2, .35, eIn));
    const [cx, cy] = project(cam, toast.position.x, toast.position.y, 0);
    const sw = P(t, T.perev, 1.1, eInOut);
    arcArrow(cx, cy, 110, -Math.PI / 2, -Math.PI / 2 + 6.0 * sw, ink, cA * .85 * clamp(sw * 4), 3, 16);
    atext('полный оборот', cx + 135, cy + 16, T.perev + .2, t, { size: 46, w: 600, col: ink, align: 'left', track: -.01, out: T.stol - .2 });
    // размерная линия: 75 см → 3 м
    const [dx, dy1] = project(cam, xd, Hh, 0), [, dy2] = project(cam, xd, 0, 0);
    const dA = P(t, T.posch, .6);
    dim(dx, dy1, dx, dy2, dA, ink);
    const CX = dx + 40;
    const mid = (dy1 + dy2) / 2;
    atext('75 см', CX, mid + 40, T.posch + .1, t, { size: 110, w: 600, col: ink, align: 'left', track: -.04, out: T.stol + .1 });
    atext('≈ 3 м', CX, mid + 50, T.treh - .05, t, { size: 150, w: 600, col: ink, align: 'left', track: -.04, blur: 18, scale0: 1.1, dur: .9 });
    atext('для полного', CX + 4, mid + 120, T.treh + .25, t, { size: 42, w: 500, col: sub, align: 'left', track: 0 });
    atext('оборота', CX + 4, mid + 168, T.treh + .35, t, { size: 42, w: 500, col: sub, align: 'left', track: 0 });
  },

  sfx(add) {
    const T = TT();
    add(T.rob, 'bloom', .2, .8);
    add(T.perev, 'whoosh', .18, 1.2);
    add(T.stol, 'swell', .3, .6);
    add(GROW[0] + GROW[1], 'click', .25, .8);
    add(T.treh, 'chime', .22, .95);
    add(F0 + .05, 'whoosh', .22, .8);
    add(F0 + FD, 'thud', .28, .9);
  },
});
