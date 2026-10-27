// HOOK (0 – 11.25 с), чёрный фон. Керамическая мышь и графитовый слон на чёрном зеркале.
// k1 — мышь из темноты (макро) → отъезд, слон; над каждым тонкий «таймлайн жизни»: 2 года / 60 лет;
// k2 — сердца бьются (точка-пульс на груди), два счётчика ударов; на «миллиард» сходятся в одну красную цифру;
// k3 — низкий ракурс, «Закон Клайбера».
import {
  defineScene, makeStage, project, atext, line, dot, measure, P, Wd, WdE, C, E, clamp, lerp,
  eApple, eIn, eInOut, eEase, eExpo, eSpring, THREE, MAT, accent, C_WHITE, C_GRAY,
} from '../../../engine.mjs';
import * as ENG from '../../../engine.mjs';
import { makeMouse, makeElephant } from '../../../models.mjs';
import { frame, lerp3, collectMats, setLit, mirrorFloor, twin, beat, fmt, bump } from '../lib.mjs';

const V = new THREE.Vector3();
// раскладка на зеркале
const MOUSE = { p: [-1.0, 0, 1.0], ry: .3, s: .78 };
const ELE = { p: [.9, 0, -1.0], ry: Math.PI - .2, s: .82 };
const HEART_M = [.2, .3, .12], HEART_E = [.75, 1.75, .5];   // сердце в локальных координатах моделей
const HZ_M = 10, HZ_E = .5;                                  // 600 и 30 уд/мин

function TT() {
  return {
    mouse: Wd('k1', 'Мышь'), two: Wd('k1', 'двух'), ele: Wd('k1', 'слон'), sixty: Wd('k1', 'шестидесяти'),
    heart: Wd('k2', 'сердце'), life: Wd('k2', 'жизнь'), bil: Wd('k2', 'миллиард'), raz: Wd('k2', 'раз'),
    why: Wd('k3', 'Почему'), eto: Wd('k3', 'Это'), zakon: Wd('k3', 'закон'), kl: Wd('k3', 'Клайбера'),
  };
}

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    mirrorFloor(stage);
    const mouse = twin(makeMouse, MAT.ceramicWhite());
    const ele = twin(makeElephant, MAT.graphite());
    stage.root.add(mouse.ga, mouse.gb, ele.ga, ele.gb);
    mouse.place(...MOUSE.p, MOUSE.ry, MOUSE.s);
    ele.place(...ELE.p, ELE.ry, ELE.s);
    return { stage, mouse, ele, T: TT(), mM: collectMats(mouse.ga), eM: collectMats(ele.ga) };
  },

  update(t, s, st) {
    const { stage, mouse, ele, T } = st, cam = stage.camera, { key, rimL, rimR, hemi } = stage.lights;
    // проявление из темноты: мышь, затем слон
    setLit(st.mM, P(t, T.mouse - .25, 1.1, eEase));
    setLit(st.eM, P(t, T.ele - .05, 1.2, eEase));
    // сердцебиение — едва заметное «дыхание» тел с реальной частотой
    const hb = t > T.heart - .3 ? P(t, T.heart - .3, .5) : 0;
    mouse.pose({ wag: t * 2.2, squash: .05 * hb * beat(t * HZ_M) });
    ele.pose({ flap: .1 * Math.sin(t * 1.3), trunk: .25 * Math.sin(t * .8) });
    const eb = 1 + .012 * hb * beat(t * HZ_E);
    ele.ga.scale.set(ELE.s * eb, ELE.s, ELE.s * eb); ele.gb.scale.set(ELE.s * eb, -ELE.s, ELE.s * eb);

    // свет: скользящий ключ, контровые «вырезают» силуэты
    const lit = P(t, 0, 1.0, eEase);
    const sweep = eApple(clamp(t / 3.2));
    key.position.set(lerp(-8, 4, sweep), lerp(5, 9, sweep), lerp(-1, 6, sweep));
    key.intensity = 2.7 * lit; hemi.intensity = .5 * lit;
    rimL.position.set(-6, 3, -5); rimL.intensity = (3.2 + 1.6 * bump(t, T.zakon + .3, .8)) * lit; rimR.intensity = 2.5 * lit;

    // камера: макро на мышь → отъезд на пару → медленная орбита → низкий ракурс на «Почему»
    const pull = P(t, T.ele - .95, 1.6, eInOut);
    const low = P(t, T.why - .1, 2.2, eInOut);
    const macro = { tg: [MOUSE.p[0] + .1, .3, MOUSE.p[2]], d: 6.2, az: 38 - t * 2.5, el: 9 };
    const wide = { tg: [.3, 1.05, 0], d: 17.5, az: lerp(30, 20, P(t, T.ele, 6, eEase)), el: 7 };
    const lowS = { tg: [.3, 1.2, 0], d: 16.8, az: lerp(14, 4, P(t, T.why, 3.3, eEase)), el: 2.5 };
    const A = low > 0 ? wide : macro, B = low > 0 ? lowS : wide, k = low > 0 ? low : pull;
    const tg = lerp3(A.tg, B.tg, k);
    const d = Math.exp(lerp(Math.log(A.d), Math.log(B.d), k));
    const sy = lerp(low > 0 ? 930 : 900, low > 0 ? 960 : 930, k);
    frame(cam, tg, d, lerp(A.az, B.az, k), lerp(A.el, B.el, k), 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, mouse, ele, T } = st, cam = stage.camera, ink = stage.ink, sub = stage.sub, g = ENG.g;
    const W2 = (o, l) => { o.ga.updateMatrixWorld(); return project(cam, ...o.ga.localToWorld(V.set(...l)).toArray()); };
    const tm = T.bil;                           // момент слияния счётчиков
    const lifeOut = T.why + .2;                 // таймлайны уходят

    // ---- таймлайны жизни: 2 года и 60 лет (одна шкала: 10 px на год) ----
    const PX = 10;
    const tl = (head, years, t0, label, labT, side) => {
      const [hx, hy] = W2(head.o, head.l);
      const y = hy - head.up, len = years * PX;
      const x0 = clamp(hx - len / 2, 100, 940 - len);
      const pd = P(t, t0, .9, eApple), q = 1 - P(t, lifeOut, .35, eIn);
      const dim = lerp(1, .22, P(t, tm - .1, .6));
      const a = q * dim;
      if (pd <= 0 || a <= .003) return null;
      line(x0, y, x0 + len * pd, y, ink, .85 * a, 2);
      line(x0, y - 9, x0, y + 9, ink, .85 * a * P(t, t0, .3), 2);
      line(x0 + len, y - 9, x0 + len, y + 9, ink, .85 * a * P(t, t0 + .75, .3), 2);
      // годовые засечки на длинной шкале (каждые 10 лет)
      if (years > 10) for (let yr = 10; yr < years; yr += 10) {
        const tx = x0 + yr * PX;
        if (tx < x0 + len * pd) line(tx, y - 5, tx, y + 5, ink, .45 * a, 2);
      }
      atext(label, x0 + len / 2, y - 26, labT, t, { size: 40, w: 600, col: ink, a, track: -.01, dy: 14, dur: .6, out: T.heart - .15, outDur: .3 });
      return { x: x0 + len / 2, y: y - 26, a };
    };
    const lm = tl({ o: mouse, l: [0, .78, 0], up: 0 }, 2, T.two, '2 года', T.two + .1);
    const le = tl({ o: ele, l: [0, 3.25, 0], up: 0 }, 60, T.sixty - .1, '60 лет', T.sixty + .05);

    // ---- пульс на груди: точка с кольцами, частота 600 и 30 уд/мин ----
    const pulse = (o, l, hz, a0) => {
      const a = a0 * P(t, T.heart - .2, .5) * (1 - P(t, lifeOut, .35, eIn));
      if (a <= .003) return;
      const [x, y] = W2(o, l), b = beat(t * hz);
      dot(x, y, 4 + 3 * b, ink, a * (.55 + .45 * b));
      const ph = (t * hz) % 1, rr = 6 + ph * (hz > 2 ? 14 : 34);
      g.save(); g.globalAlpha = a * .5 * (1 - ph); g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); g.restore();
    };
    pulse(mouse, HEART_M, HZ_M, 1); pulse(ele, HEART_E, HZ_E, 1);

    // ---- счётчики ударов: мышь копит быстро, слон медленно — к «миллиарду» у обоих одно и то же ----
    const counter = (anchor, f, t0) => {
      if (!anchor || t < t0) return;
      const x = clamp((t - t0) / (tm - t0));
      const v = 1e9 * f(x);
      const mv = P(t, tm - .05, .55, eInOut);
      const cx = lerp(anchor.x, 540, mv), cy = lerp(anchor.y, 400, mv);
      const size = lerp(46, 120, mv);
      const a = (1 - P(t, tm + .05, .35, eIn)) * anchor.a / lerp(1, .22, P(t, tm - .1, .6));
      atext(fmt(v), cx, cy, t0, t, { size, w: 600, col: ink, a, track: -.02, dy: 14, dur: .5, blur: 8 });
    };
    counter(lm, x => 1 - Math.pow(1 - x, 2.2), T.heart + .2);
    counter(le, x => Math.pow(x, 1.7), T.heart + .3);
    // подпись под счётчиками
    atext('ударов сердца', 540, 290, T.heart + .45, t, { size: 40, w: 500, col: sub, track: 0, dy: 14, out: tm - .1, outDur: .3 });

    // ---- одна огромная красная цифра ----
    const big = '≈1 000 000 000';
    const bs = Math.min(150, 880 / (measure(big, 100, 700, -.045) / 100));
    atext(big, 540, 430, tm + .02, t, { size: bs, w: 700, col: accent(), track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.eto - .05, outDur: .4 });
    atext('ударов сердца за жизнь', 540, 505, tm + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: T.eto - .05, outDur: .4 });

    // ---- заголовок ----
    atext('Закон', 540, 470, T.zakon - .05, t, { size: 124, w: 600, col: ink, track: -.03 });
    atext('Клайбера', 540, 600, T.kl - .05, t, { size: 124, w: 600, col: ink, track: -.03 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .3, .8);
    add(T.mouse - .15, 'thud', .3, 1.2);
    add(T.two + .05, 'click', .22);
    add(T.ele - .3, 'thud', .5, .7);
    add(T.sixty, 'swell', .25, .9);
    add(T.heart, 'tick', .2);
    add(T.bil - 1.5, 'riser', .3);
    add(T.bil, 'impact', .55, .8);
    add(T.bil + .05, 'chime', .3);
    add(T.why, 'whoosh', .25, .7);
    add(T.zakon - .05, 'bloom', .35, .8);
    add(T.kl, 'chime', .25, .9);
  },
});
