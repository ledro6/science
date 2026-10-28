// PAIRS (14.7 – 28.2 с), белый фон. Те же 23 фигурки на окружности, вид сверху, медленная орбита.
// p1 — «ты» (фигурка у камеры) — веер из 22 линий к остальным, серым «ты против остальных: 22 пары»;
//      на «всех со всеми» линии-пары рисуются волной (человек за человеком) до полной «звезды»;
// p2 — счётчик пар растёт вместе с линиями и приземляется на красной «253» (пары растут как квадрат), «23 × 22 / 2»;
// p3 — одна пара выделена: «1/365» «шанс одной пары»; ещё несколько пар вспыхивают по очереди;
//      на «вместе» вся звезда темнеет волной, «≈50%» «вместе».
import { defineScene, makeStage, project, atext, line, P, Wd, E, THREE, clamp, lerp, eApple, eIn, eInOut, eSpring, accent, FONT } from '../../../engine.mjs';
import { ctx, N, bump, frame, makeCrowd, ringPos, FIG_H } from './kit.mjs';

const R = 2.5, HEAD = FIG_H * .82 * .88;
// все пары: сначала 22 пары «тебя» (0, j), затем волна — человек за человеком
const PAIRS = [];
for (let j = 1; j < N; j++) PAIRS.push([0, j]);
for (let i = 1; i < N; i++) for (let j = i + 1; j < N; j++) PAIRS.push([i, j]);
const FLASH = [[5, 16], [9, 20], [2, 12], [7, 18], [13, 21]];   // пары, вспыхивающие на «маленький шанс»

function TT() {
  const T = {
    my: Wd('p1', 'Мы'), teb: Wd('p1', 'тебя'), ost: Wd('p1', 'остальными'), vseh: Wd('p1', 'всех'), vsemi: Wd('p1', 'всеми'),
    dv: Wd('p2', 'двадцати'), dvesti: Wd('p2', 'двести'), tri: Wd('p2', 'три'), pary: Wd('p2', 'пары'),
    kazh: Wd('p3', 'Каждая'), para: Wd('p3', 'пара'), mal: Wd('p3', 'маленький'), sovp: Wd('p3', 'совпадения'),
    vm: Wd('p3', 'Вместе'), sk: Wd('p3', 'складываются'), pyat: Wd('p3', 'пятьдесят'), end3: E('p3'),
  };
  T.w0 = T.vseh - .05; T.wD = T.tri + .05 - T.w0 - .25;   // волна: 231 линия
  return T;
}
// момент начала прорисовки k-й пары
function lineStart(k, T) {
  if (k < 22) return T.teb - .05 + k * .05;
  return T.w0 + (k - 22) / 231 * T.wD;
}

defineScene('pairs', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .36, clearcoat: .6, clearcoatRoughness: .2 });
    const crowd = makeCrowd(N, mat, { mirror: false });
    stage.root.add(crowd.grp);
    return { stage, crowd, T: TT() };
  },

  update(t, s, st) {
    const { stage, crowd, T } = st, L = stage.lights;
    const youMode = P(t, T.teb - .2, .5) * (1 - P(t, T.vseh - .1, .5));
    const pairMode = P(t, T.para - .15, .4) * (1 - P(t, T.vm - .1, .5));
    const fl = flashPair(t, T);
    for (let i = 0; i < N; i++) {
      const [x, z] = ringPos(i, R);
      const k = eSpring(clamp((t - s.start - .05 - Math.min(i, N - i) * .03) / .8));
      let c = .24;                                         // графит
      if (i !== 0) c = lerp(c, .62, youMode);              // «остальные» светлеют, пока «ты» в фокусе
      else c = lerp(c, .1, youMode);
      const on = fl && (fl[0] === i || fl[1] === i);
      c = lerp(c, on ? .1 : .66, pairMode);
      crowd.set(i, x, 0, z, Math.max(1e-3, .82 * lerp(.7, 1, k)) * (i === 0 ? 1 + .08 * youMode : 1), c);
    }
    crowd.commit();
    L.key.position.set(3, 10, 5); L.key.intensity = 2.2; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9;
    const p = clamp((t - s.start) / (s.end - s.start));
    frame(stage.camera, [0, .3, 0], lerp(28.5, 27, eApple(p)), lerp(-14, 16, p), lerp(66, 58, p), 540, 975);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cm = stage.camera, ink = stage.ink, sub = stage.sub, g = ctx();
    const pts = []; for (let i = 0; i < N; i++) { const [x, z] = ringPos(i, R); pts.push(project(cm, x, HEAD, z)); }
    // ---- линии-пары ----
    const vm = P(t, T.vm - .05, 1.4, eInOut);          // «вместе»: звезда темнеет волной
    const pairMode = P(t, T.para - .15, .4) * (1 - P(t, T.vm - .1, .5));
    const fl = flashPair(t, T);
    g.save(); g.lineCap = 'round';
    PAIRS.forEach(([i, j], k) => {
      const t0 = lineStart(k, T), d = k < 22 ? .4 : .32, u = eApple(clamp((t - t0) / d));
      if (u <= 0) return;
      const [x1, y1] = pts[i], [x2, y2] = pts[j];
      const fresh = bump(t, t0 + .15, .35);
      const wave = clamp((vm * 1.4 - (k - 22 < 0 ? 0 : (k - 22) / 231) * .4));
      let a = lerp(.3, .5, k < 22 ? 0 : 0) + .55 * fresh;
      if (k < 22) a = lerp(.3, .75, P(t, T.teb, .3) * (1 - P(t, T.vseh, .6)));
      a = lerp(a, .07, pairMode) + .35 * wave;
      const on = fl && fl[0] === i && fl[1] === j;
      g.globalAlpha = Math.min(1, on ? 1 : a); g.strokeStyle = ink; g.lineWidth = on ? 5 : 1.6;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(lerp(x1, x2, u), lerp(y1, y2, u)); g.stroke();
    });
    g.restore();
    // подпись «ты» над первой фигуркой
    const [yx, yy] = pts[0];
    atext('ты', yx + 44, yy + 14, T.teb, t, { size: 40, w: 600, col: ink, align: 'left', track: -.01, dy: 14, dur: .6, out: T.vseh, outDur: .35 });
    // ---- текст ----
    const o1 = T.vseh - .1;
    atext('22', 540, 490, T.teb + .1, t, { size: 260, w: 700, col: sub, track: -.045, blur: 20, scale0: 1.1, dur: .9, out: o1, outDur: .35 });
    atext('ты против остальных', 540, 565, T.ost - .1, t, { size: 46, w: 500, col: sub, track: -.005, out: o1, outDur: .35 });
    // счётчик пар: идёт вместе с волной линий, приземляется на 253
    const o2 = T.kazh - .15;
    if (t > T.vseh - .2) {
      const n = Math.round(22 + 231 * clamp((t - T.w0 - .12) / T.wD));
      const land = bump(t, T.w0 + T.wD + .2, .3);
      atext(String(n), 540, 490, T.vseh, t, { size: 260 * (1 + .03 * land), w: 700, col: accent(), track: -.045, blur: 16, scale0: 1.08, dur: .7, out: o2, outDur: .35 });
      atext('пары', 540, 565, T.vseh + .2, t, { size: 46, w: 500, col: sub, track: -.005, out: o2, outDur: .35 });
      atext('все со всеми', 540, 262, T.vsemi - .05, t, { size: 42, w: 500, col: sub, track: 0, out: T.pary - .1, outDur: .3 });
      atext('23 × 22 / 2', 540, 262, T.pary, t, { size: 42, w: 500, col: sub, track: 0, out: o2, outDur: .35 });
    }
    // p3: шанс одной пары → вместе
    const o3 = T.vm - .05;
    atext('1/365', 540, 490, T.para, t, { size: 230, w: 700, col: ink, track: -.04, blur: 18, scale0: 1.08, dur: .9, out: o3, outDur: .35 });
    atext('шанс одной пары', 540, 565, T.mal - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: o3, outDur: .35 });
    atext('≈50%', 540, 490, T.pyat - .1, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.1, dur: .9 });
    atext('вместе', 540, 565, T.pyat + .2, t, { size: 46, w: 500, col: sub, track: -.005 });
  },

  sfx(add) {
    const T = TT();
    add(T.teb, 'whoosh', .2, 1.1);
    add(T.vseh, 'swell', .3, .8);
    add(T.tri + .05, 'chime', .3, .9);
    add(T.para, 'click', .2);
    for (let k = 1; k < FLASH.length; k++) add(T.mal + (k - 1) * .5, 'tick', .1, 1 + k * .05);
    add(T.vm, 'bloom', .3, .8);
    add(T.pyat - .1, 'chime', .25, .85);
  },
});
// какая пара сейчас выделена в p3: первая — на «пара», затем по очереди с «маленький»
function flashPair(t, T) {
  if (t < T.para - .15 || t > T.vm - .1) return null;
  if (t < T.mal) return FLASH[0];
  return FLASH[Math.min(FLASH.length - 1, 1 + Math.floor((t - T.mal) / .5)) % FLASH.length];
}
