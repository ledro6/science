// SHIP (34.9 – 45.4 с), светлый фон.
// s1 — заголовок «Закон Архимеда», формула «F = ρ · g · V» собирается по словам (F на «сила», = на «равная»,
//      ρ · g на «весу», V на «вытесненной»); ниже — большое судно на воде в разрезе: подводная часть корпуса
//      (вытесненный объём) светлеет на «вытесненной воды», ватерлиния — пунктир.
// s2 — «50 000 т» (вес судна) и «50 000 т» (вытесненная морская вода) — счётчики; стрелки сил равны.
import { defineScene, makeStage, project, atext, acount, line, P, Wd, THREE, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { ctx, makeShip, makeWater, frame, keys, wordsAt, SHIP } from './kit.mjs';

const DEPTH = 3.2;
function TT() {
  return {
    zak: Wd('s1', 'Закон'), arh: Wd('s1', 'Архимеда'), telo: Wd('s1', 'тело'), sila: Wd('s1', 'сила'), ravn: Wd('s1', 'равная'),
    vesu: Wd('s1', 'весу'), vyt: Wd('s1', 'вытесненной'), vody: Wd('s1', 'воды'),
    poet: Wd('s2', 'Поэтому'), kor: Wd('s2', 'корабль'), ves: Wd('s2', 'весом'), p1: Wd('s2', 'пятьдесят'), plyv: Wd('s2', 'плывёт'),
    vytn: Wd('s2', 'вытесняя'), p2: Wd('s2', 'пятьдесят', 1), mor: Wd('s2', 'морской'),
  };
}

defineScene('ship', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .5 });
    stage.floor.visible = false;
    const T = TT();
    const ship = makeShip({ hullCol: '#48484B' });
    const water = makeWater(60, 16, { col: '#B9C4D0', opacity: .34, edge: '#1D1D1F', edgeOp: 0, surf: { col: '#8E9AA8', base: .16, fres: .3, spec: .5 } });
    water.position.set(0, -DEPTH, 2.5);
    stage.root.add(ship, water);
    return { stage, T, ship, water, cUnder: new THREE.Color('#48484B'), cLit: new THREE.Color('#C9CED6') };
  },

  update(t, s, st) {
    const { stage, T, ship, water } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(lerp(-3, 5, clamp((t - s.start) / 10)), 9, 7);
    const bob = .03 * Math.sin((t - s.start) * 1.3);
    ship.position.set(0, bob, 0);
    ship.rotation.set(.012 * Math.sin((t - s.start) * 1.1), 0, .006 * Math.sin((t - s.start) * .9));
    water.set(DEPTH, t, 1);
    water.hole(-SHIP.L / 2 + .05, SHIP.L / 2 - .1, -SHIP.B / 2 + .05, SHIP.B / 2 - .05);
    // вытесненный объём (подводная часть) светлеет на «вытесненной» и в s2 на «вытесняя»
    const hl = Math.max(P(t, T.vyt, .7) * (1 - P(t, T.poet, .6, eIn)), P(t, T.vytn, .7));
    ship.parts.um.color.copy(st.cUnder).lerp(st.cLit, hl);
    const [tx, ty, d, az, el, sy] = keys([
      [s.start, -.6, .3, 60, -24, 13, 1010], [T.poet, .2, .3, 58, -18, 12, 1040], [s.end, .4, .3, 57, -13, 12, 1040],
    ], t, eInOut);
    frame(cam, [tx, ty, 0], d, az, el, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, T, ship } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const o1 = T.poet - .3;
    // s1: заголовок и формула
    wordsAt(['Закон', 'Архимеда'], [T.zak - .05, T.arh - .05], 540, 400, t, { size: 104, w: 600, col: ink, track: -.03, out: o1 });
    const parts = ['F', '=', 'ρ', '·', 'g', '·', 'V'], ts = [T.sila, T.ravn, T.vesu, T.vesu + .1, T.vesu + .15, T.vesu + .25, T.vyt];
    wordsAt(parts, ts.map(x => x - .05), 540, 560, t, { size: 100, w: 500, col: ink, track: -.01, out: o1 });
    atext('вес вытесненной воды', 540, 640, T.vody - .1, t, { size: 42, w: 500, col: sub, track: -.005, out: o1 });
    // ватерлиния — пунктир вдоль борта
    const aW = Math.max(P(t, T.vyt, .5) * (1 - P(t, T.poet, .5, eIn)), P(t, T.vytn, .5));
    if (aW > .003) {
      const [x1, y1] = project(cam, -SHIP.L / 2 - .4, 0, SHIP.B / 2 + .06), [x2, y2] = project(cam, SHIP.L / 2 + .6, 0, SHIP.B / 2 + .06);
      line(x1, y1, x2, y2, ink, .7 * aW, 2, [12, 10]);
    }
    // s2: две одинаковые цифры
    acount(50000, 540, 390, T.p1 - .05, t, { size: 180, w: 700, col: ink, suffix: ' т', dur: 1.0 });
    atext('вес судна', 540, 450, T.p1 + .25, t, { size: 44, w: 500, col: sub, track: -.005 });
    acount(50000, 540, 610, T.p2 - .05, t, { size: 180, w: 700, col: ink, suffix: ' т', dur: 1.0 });
    atext('вытесненная морская вода', 540, 670, T.mor - .1, t, { size: 44, w: 500, col: sub, track: -.005 });
    // вода уходит в фон к низу кадра (без жёсткой кромки под субтитрами)
    const g = ctx(), gr = g.createLinearGradient(0, 1180, 0, 1420);
    gr.addColorStop(0, 'rgba(245,245,247,0)'); gr.addColorStop(1, 'rgba(245,245,247,1)');
    g.fillStyle = gr; g.fillRect(0, 1180, 1080, 740);
  },

  sfx(add) {
    const T = TT();
    add(T.zak - .1, 'bloom', .26, .9);
    add(T.sila, 'tick', .2, 1.0);
    add(T.ravn, 'tick', .2, 1.1);
    add(T.vyt, 'chime', .24, .95);
    add(T.p1, 'chime', .22, .9);
    add(T.plyv, 'whoosh', .2, .8);
    add(T.p2, 'chime', .24, 1.0);
  },
});

