// HOOK (0 – 13.9 с), чёрный фон.
// k1 — макро: полосатый графитовый Нептун в свете Солнца → отъезд камеры на всю систему; огромная красная «165», «земных лет»;
// k2 — метка 1846 на дальней орбите; на «облетел … один раз» след за Нептуном рисует ровно один круг, счётчик 1846 → 2011;
// k3 — система притухает, формула «T² ∝ a³», под частями — «квадрат» и «куб».
import { defineScene, makeStage, orbit, project, atext, atextWords, line, measure, P, Wd, C, E, clamp, lerp, eApple, eInOut, eIn, C_GRAY } from '../../../engine.mjs';
import { ctx, TAU, bump, onRing, makeNeptune, makeSun, ring, trail, glow, keys, screenR } from './kit.mjs';

const RINGS = [.42, .58, .74, .95, 1.55, 2.05, 2.55];   // внутренние орбиты (условный масштаб)
const RN = 3.0, NR = .2, SR = .22;                    // орбита Нептуна, радиус Нептуна, радиус Солнца
const TH0 = -.7;                                        // положение Нептуна в 1846 году (справа спереди)

function TT() {
  return {
    god: Wd('k1', 'Год'), sto: Wd('k1', 'сто'), zem: Wd('k1', 'земных'),
    otk: Wd('k2', 'открытия'), y1846: Wd('k2', 'тысяча'), obl: Wd('k2', 'облетел'), odin: Wd('k2', 'один'), raz: Wd('k2', 'раз'),
    form: Wd('k3', 'формула'), kv: Wd('k3', 'квадрат'), kub: Wd('k3', 'куб'),
    end1: E('k1'), end2: E('k2'),
  };
}
// фаза полного оборота: от «облетел» до чуть после «раз»
const orbitP = (t, T) => eInOut(clamp((t - T.obl) / (T.raz + .45 - T.obl)));
const nepAngle = (t, T) => TH0 + TAU * orbitP(t, T) + Math.max(0, t - (T.raz + .45)) * .012;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    stage.camera.far = 400; stage.camera.updateProjectionMatrix();
    const sun = makeSun(SR, 3.4);
    const nep = makeNeptune(NR);
    stage.root.add(sun.grp, nep);
    const T = TT();
    return { stage, sun, nep, T };
  },

  update(t, s, st) {
    const { stage, nep, T } = st, cam = stage.camera, L = stage.lights;
    const a = nepAngle(t, T);
    nep.position.set(...onRing(RN, a));
    nep.rotation.set(0, t * .35, .5);
    // свет: Солнце — главный источник; студийные — едва-едва, чтобы ночная сторона читалась контуром
    const lit = P(t, 0, 1.4, eApple);
    st.sun.pl.intensity = 3.4 * lit;
    L.hemi.intensity = .06 * lit; L.key.intensity = .25 * lit; L.key.castShadow = false;
    L.rimL.intensity = 1.1 * lit; L.rimR.intensity = .7 * lit;
    // камера: макро на Нептуне (3/4-свет) → отъезд на всю систему → медленный дрейф и наезд к формуле
    const np = onRing(RN, TH0);
    const pull = eInOut(clamp((t - 1.15) / 2.4));
    const tgt = [lerp(np[0], 0, pull), lerp(np[1] + .09, .95, pull), lerp(np[2], 0, pull)];
    const dist = 2.9 * Math.pow(34 / 2.9, pull);
    const [daz, del, dd] = keys([[3.6, 0, 0, 1], [9.2, 8, -2, 1], [13.9, -22, -10, .8]], t, eInOut);
    const az = lerp(-70 + t * 4, 15, pull) + daz, el = lerp(10, 46, pull) + del;
    orbit(cam, tgt, dist * dd, az, el);
  },

  draw2d(t, s, st) {
    const { stage, T, nep } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const occ = [{ p: [0, 0, 0], r: SR }, { p: nep.position.toArray(), r: NR }];
    // --- Солнце: мягкое свечение ---
    const [sx, sy] = project(cam, 0, 0, 0);
    const sR = screenR(cam, [0, 0, 0], SR);
    const dimF = 1 - .45 * P(t, T.form - .3, .9);          // k3: система уходит в тень под формулой
    glow(sx, sy, clamp(sR * 9, 130, 260), .55 * P(t, .2, 1.4) * dimF);
    // --- орбиты ---
    const rIn = P(t, 1.6, 1.4) * dimF;
    RINGS.forEach((r, i) => ring(cam, r, { a: .2 * P(t, 1.7 + i * .06, 1.2) * dimF, lw: 1.6, occ }));
    ring(cam, RN, { a: .38 * rIn, lw: 2, occ });
    // --- метка 1846 на орбите и один полный оборот ---
    const tk = P(t, T.otk, .5) * dimF;
    if (tk > .003) {
      const p1 = onRing(RN - .13, TH0), p2 = onRing(RN + .13, TH0);
      const [x1, y1] = project(cam, ...p1), [x2, y2] = project(cam, ...p2);
      line(x1, y1, x2, y2, ink, tk, 3);
    }
    const op = orbitP(t, T);
    if (op > 0) {
      const a = nepAngle(t, T);
      const done = P(t, T.raz + .45, .2) ;
      const fl = bump(t, T.raz + .55, .5);
      ring(cam, RN, { from: TH0, to: Math.min(a, TH0 + TAU), lw: 3 + fl * 2, a: (.95 - .35 * P(t, T.raz + 1.2, 1.2)) * dimF, occ });
      if (done < 1) trail(cam, RN, a, .5, { lw: 5, a: .5 * (1 - done), occ });
    }
    // --- тексты ---
    atextWords('Год на Нептуне', 540, 270, T.god, t, { size: 64, w: 600, col: ink, track: -.02, out: T.end1 - .05, stagger: .1 });
    atext('165', 540, 600, T.sto, t, { size: 360, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.end1 - .05 });
    atext('земных лет', 540, 680, T.zem, t, { size: 54, w: 500, col: sub, track: -.005, out: T.end1 - .05 });

    const yr = 1846 + Math.round(165 * orbitP(t, T));
    atext(String(yr), 540, 520, T.y1846, t, { size: 230, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.end2 + .1 });
    atext('год открытия', 540, 600, T.y1846 + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: T.obl - .05 });
    atext('один оборот вокруг Солнца', 540, 600, T.odin, t, { size: 46, w: 500, col: sub, track: -.005, out: T.end2 + .1 });

    // формула: «³» красная автоматически
    const fs = 190, fw = 600, ftr = -.03, F = 'T² ∝ a³';
    const tot = measure(F, fs, fw, ftr), x0 = 540 - tot / 2;
    atext(F, 540, 540, T.form, t, { size: fs, w: fw, col: ink, track: ftr, blur: 18, scale0: 1.08, dur: .9 });
    const wT = measure('T²', fs, fw, ftr), wA = measure('a³', fs, fw, ftr);
    const cT = x0 + wT / 2, cA = x0 + tot - wA / 2;
    const u1 = P(t, T.kv, .45), u2 = P(t, T.kub, .45);
    line(cT - wT / 2 * u1, 580, cT + wT / 2 * u1, 580, ink, .8 * u1, 3);
    line(cA - wA / 2 * u2, 580, cA + wA / 2 * u2, 580, ink, .8 * u2, 3);
    atext('квадрат', cT, 640, T.kv + .05, t, { size: 44, w: 500, col: sub, track: 0, dy: 18 });
    atext('куб', cA, 640, T.kub + .05, t, { size: 44, w: 500, col: sub, track: 0, dy: 18 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.sto - 1.5 > .1 ? T.sto - 1.5 : .1, 'riser', .2);
    add(T.sto, 'impact', .4, .9);
    add(T.y1846, 'chime', .25, .9);
    add(T.obl, 'whoosh', .35, .8);
    add(T.raz + .45, 'chime', .3, 1.1);
    add(T.form, 'bloom', .3, .8);
    add(T.kv, 'click', .2);
    add(T.kub, 'click', .22, .9);
  },
});
