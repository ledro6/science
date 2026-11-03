// SLIDE (s1–s2), светлый фон. Крупный план края стола.
// s1 — на «соскальзывает» бутерброд едет к краю; на «края стола» — выноска к кромке;
//      на «начинает» центр масс (точка + отвес) уже за кромкой, бутерброд поворачивается вокруг края,
//      дуга-стрелка вращения; «Вращение начинается» и серым «ещё до отрыва»; на «оторвавшись» пульсирует точка опоры;
// s2 — exploded view: слой масла поднимается над хлебом («масло», «почти ничего не весит»),
//      на «дело» заголовок «Дело не в масле», слой возвращается на место.
import { defineScene, makeStage, atext, project, callout, line, dot, measure, P, Wd, THREE, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { makeToast, makeTable, wideShadow, place, frame, keys, arcXY, circle, TABLE, TOAST } from './kit.mjs';

function TT() {
  return {
    sosk: Wd('s1', 'соскальзывает'), kraya: Wd('s1', 'края'), nach: Wd('s1', 'начинает'), vrash: Wd('s1', 'вращаться'),
    esche: Wd('s1', 'ещё'), otorv: Wd('s1', 'оторвавшись'),
    maslo: Wd('s2', 'Масло'), pochti: Wd('s2', 'почти'), ves: Wd('s2', 'весит'), delo: Wd('s2', 'дело'), nem: Wd('s2', 'нём'),
  };
}
const A = .12, B = TOAST.th / 2;            // плечо центра масс за кромкой и полутолщина хлеба
const rotP = (f) => ({ x: A * Math.cos(f) - B * Math.sin(f), y: TABLE.H + A * Math.sin(f) + B * Math.cos(f), phi: f });
const fit = (s, size, w, max = 900) => Math.min(size, size * max / measure(s, size, w, -.03));

defineScene('slide', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    wideShadow(stage);
    const table = makeTable({ dark: false }), toast = makeToast();
    stage.root.add(table, toast);
    return { stage, table, toast, T: TT() };
  },

  pose(t, T) {
    // съезжает к краю, затем поворачивается вокруг кромки
    const x = lerp(-.8, A, P(t, T.sosk - .1, T.nach - T.sosk + .1, eInOut));
    const f = -.46 * P(t, T.nach, T.otorv + .5 - T.nach, eApple);
    return f < -1e-4 ? rotP(f) : { x, y: TABLE.H + B, phi: 0 };
  },

  update(t, s, st) {
    const { stage, toast, T } = st, cam = stage.camera;
    const p = this.pose(t, T);
    place(toast, p);
    // масло: «разлёт» вдоль нормали хлеба и возврат
    toast.butter.position.y = .5 * P(t, T.maslo - .05, .9, eInOut) * (1 - P(t, T.delo + .35, .8, eInOut));
    const [tx, d, az, el] = keys([[s.start, -.3, 8.6, 26, 9], [T.nach, .1, 7.8, 13, 7], [T.maslo, .1, 7.4, 16, 10], [s.end, .1, 7.2, 12, 12]], t, eInOut);
    frame(cam, [tx, TABLE.H, 0], d, az, el, 540, 800);
    st.p = p;
  },

  draw2d(t, s, st) {
    const { stage, toast, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub;
    const p = st.p;
    // край стола
    const eA = 1 - P(t, T.nach + .1, .35, eIn);
    const [ex, ey] = project(cam, 0, TABLE.H - .16, 1.4);
    callout(ex, ey, ex - 50, ey + 150, T.kraya - .2, t, ink, eA);
    atext('край стола', ex - 50, ey + 195, T.kraya - .1, t, { size: 40, w: 500, col: sub, track: 0, dy: 14, out: T.nach + .1 });
    // центр масс за кромкой: точка и отвес
    const cmA = P(t, T.nach - .2, .5) * (1 - P(t, T.maslo - .2, .4, eIn));
    if (cmA > .003) {
      const [cx, cy] = project(cam, p.x, p.y, 0), [, cy2] = project(cam, p.x, TABLE.H - .75, 0), [ex0] = project(cam, 0, TABLE.H, 0);
      line(cx, cy, cx, lerp(cy, cy2, P(t, T.nach - .1, .6)), ink, cmA * .7, 2, [6, 8]);
      dot(cx, cy, 9, ink, cmA); dot(cx, cy, 4, '#FFFFFF', cmA);
      atext('центр масс', cx - 24, cy2 - 30, T.nach, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, dy: 12, out: T.maslo - .2 });
      atext('за краем', cx - 24, cy2 + 14, T.nach + .15, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, dy: 12, out: T.maslo - .2 });
      void ex0;
    }
    // точка опоры и дуга вращения вокруг кромки
    const [px, py] = project(cam, 0, TABLE.H, 0);
    const rA = P(t, T.vrash - .1, .5) * (1 - P(t, T.maslo - .2, .4, eIn));
    arcXY(cam, [0, TABLE.H, .6], .92, .5, .5 - 1.1 * P(t, T.vrash - .1, .9, eInOut), { col: ink, a: rA * .85, lw: 3, hh: 16 });
    const pul = P(t, T.otorv - .05, 1.0);
    if (pul > 0 && pul < 1) circle(px, py, 10 + 40 * pul, ink, (1 - pul) * .6 * rA, 2);
    dot(px, py, 7, ink, P(t, T.esche - .1, .4) * (1 - P(t, T.maslo - .2, .4, eIn)));
    // заголовки
    const h1 = 'Вращение начинается';
    atext(h1, 540, 330, T.vrash - .05, t, { size: fit(h1, 84, 600), w: 600, col: ink, track: -.03, out: T.maslo - .2 });
    atext('ещё до отрыва', 540, 400, T.esche, t, { size: 44, w: 500, col: sub, track: 0, out: T.maslo - .2 });
    // s2: масло — выноска к поднятому слою
    toast.updateMatrixWorld();
    const bp = toast.butter.getWorldPosition(new THREE.Vector3());
    const [bx, by] = project(cam, bp.x - .42, bp.y, 0);
    const bA = 1 - P(t, T.delo + .2, .4, eIn);
    callout(bx, by, bx - 130, by,  T.maslo + .25, t, ink, bA);
    atext('масло', bx - 150, by + 16, T.maslo + .35, t, { size: 52, w: 600, col: ink, align: 'right', track: -.01, dy: 16, out: T.delo + .2 });
    atext('почти ничего', bx - 150, by + 66, T.pochti, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, dy: 12, out: T.delo + .2 });
    atext('Дело не в масле', 540, 330, T.delo - .05, t, { size: 96, w: 600, col: ink, track: -.03 });
    atext('не весит', bx - 150, by + 110, T.ves - .1, t, { size: 38, w: 500, col: sub, align: 'right', track: 0, dy: 12, out: T.delo + .2 });
  },

  sfx(add) {
    const T = TT();
    add(T.sosk, 'whoosh', .2, 1.2);
    add(T.kraya, 'tick', .12);
    add(T.nach, 'click', .2);
    add(T.vrash, 'swell', .18, .9);
    add(T.maslo, 'whoosh', .2, 1.3);
    add(T.delo, 'bloom', .22, .9);
    add(T.delo + .4, 'click', .25);
  },
});
