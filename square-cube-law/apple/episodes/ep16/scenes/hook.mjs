// HOOK (0 – 8.6 с), чёрный фон. Звезда-сфера (грануляция, потемнение к краю) в мягкой короне.
// k1 — на «вдвое» из звезды выходит её копия «T × 2»; на «засветит» копия раскаляется: белеет, корона растёт,
//      поток фотонов-точек от неё густеет ровно в 16 раз (8 потоков → 128); огромное красное «×16».
// k2 — «Почему так много?», затем заголовок «Закон Стефана-Больцмана» по словам и «P ∝ T⁴» (красная «⁴»).
import { defineScene, makeStage, project, atext, measure, P, Wd, E, clamp, lerp, eApple, eIn, eInOut, rng } from '../../../engine.mjs';
import { makeStar, frame, keys, screenR, corona, glow, photons, wordsAt, segText, ctx } from './kit.mjs';

function TT() {
  return {
    nag: Wd('k1', 'Нагрей'), zv: Wd('k1', 'звезду'), vd: Wd('k1', 'вдвое'), zas: Wd('k1', 'засветит'), sh: Wd('k1', 'шестнадцать'),
    raz: Wd('k1', 'раз'), yar: Wd('k1', 'ярче'), end1: E('k1'),
    poch: Wd('k2', 'Почему'), tak: Wd('k2', 'так'), mn: Wd('k2', 'много'), eto: Wd('k2', 'Это'), zak: Wd('k2', 'закон'), sb: Wd('k2', 'Стефана-Больцмана'),
  };
}
const R = .78, X = 1.3;
const N0 = 8;                                   // потоков фотонов у исходной звезды; у горячей — 16 × N0
const STARS = (() => { const r = rng(916), a = []; for (let i = 0; i < 70; i++) a.push([r() * 1080, 240 + r() * 1060, .4 + r() * 1.2, r()]); return a; })();

// раскладка: копия выходит из звезды на «вдвое»; раскаляется на «засветит»
const split = (t, T) => P(t, T.vd - .05, 1.3, eInOut);
const heat = (t, T) => P(t, T.zas - .05, 1.5, eApple);

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const A = makeStar({ seed: 1.3 }), B = makeStar({ seed: 7.9 });
    A.scale.setScalar(R); B.scale.setScalar(R);
    stage.root.add(A, B);
    return { stage, A, B, T: TT() };
  },

  update(t, s, st) {
    const { stage, A, B, T } = st, cam = stage.camera;
    const sp = split(t, T), h = heat(t, T);
    const on = P(t, 0, 1.1, eApple);
    A.position.set(-X * sp, 0, 0); B.position.set(X * sp, 0, -.02);
    A.rotation.y = t * .05; B.rotation.y = 1.1 + t * .05;
    B.visible = sp > .002;
    A.scale.setScalar(R * lerp(.86, 1, on));
    A.set({ heat: .12, b: .8 * on, t });
    B.set({ heat: lerp(.12, 1, h), b: lerp(.8, 1.06, h), t: t + 3 });
    // камера: медленный дрейф; на k2 отходит и опускает звёзды под заголовок
    const [dist, az, sy] = keys([
      [0, 13.5, -4, 960], [T.vd + .2, 18.6, -2, 960], [T.poch, 19.2, 0, 980], [T.zak - .2, 19.2, 1, 1000], [s.end, 19.6, 2.5, 1010],
    ], t, eInOut);
    frame(cam, [0, 0, 0], dist, az, 3, 540, sy);
  },

  draw2d(t, s, st) {
    const { stage, A, B, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const on = P(t, 0, 1.1, eApple), sp = split(t, T), h = heat(t, T);
    // редкие звёзды фона
    g.save(); g.fillStyle = '#FFFFFF';
    for (const [x, y, r, ph] of STARS) { g.globalAlpha = on * (.12 + .14 * ph) * (.8 + .2 * Math.sin(t * 1.3 + ph * 9)); g.beginPath(); g.arc(x - t * 3 * ph, y, r, 0, 6.29); g.fill(); }
    g.restore();
    const pa = A.position.toArray(), pb = B.position.toArray();
    const [ax, ay] = project(cam, ...pa), [bx, by] = project(cam, ...pb);
    const ra = screenR(cam, pa, A.scale.x), rb = screenR(cam, pb, B.scale.x);
    // корона и поток фотонов: у горячей копии потоков в 16 раз больше
    corona(ax, ay, ra, .25, .9 * on, .8);
    if (sp > .002) corona(bx, by, rb, lerp(.25, 1, h), lerp(.9, 1, h) * P(t, T.vd, .5), lerp(.8, 0, h));
    glow(bx, by, rb * lerp(1.4, 3.2, h), .18 * h);
    const minY = t < T.poch ? 650 : 700;
    const fade = 1 - .5 * P(t, T.poch - .2, .6);
    const ly = Math.max(ay, by) + Math.max(ra, rb) + 92, clipY = ly - 62;
    photons(ax, ay, ra, N0 * P(t, .3, .8), t, { L: 250, a: .8 * fade, minY, clipY });
    if (sp > .002) photons(bx, by, rb, lerp(N0, 16 * N0, P(t, T.zas + .1, 1.6, eInOut)) * P(t, T.vd + .2, .6), t + .37, { L: 250, a: .9 * fade, off: 101, minY, clipY });
    // подписи под звёздами
    atext('T', ax, ly, T.vd + .15, t, { size: 52, w: 600, col: ink, track: -.01, dy: 16 });
    segText([['T × 2', ink, T.vd + .3]], bx, ly, t, { size: 52, w: 600, track: -.01, dy: 16 });
    atext('температура', ax, ly + 50, T.vd + .3, t, { size: 32, w: 500, col: sub, track: 0, dy: 12 });
    atext('температура', bx, ly + 50, T.vd + .4, t, { size: 32, w: 500, col: sub, track: 0, dy: 12 });
    // огромное красное «×16» + подпись
    const o1 = T.poch - .3;
    atext('×16', 540, 540, T.sh - .05, t, { size: 300, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1 });
    atext('света', 540, 620, T.yar - .05, t, { size: 48, w: 500, col: sub, track: -.005, out: o1 });
    // k2: «Почему так много?»
    const o2 = T.eto - .25;
    wordsAt(['Почему'], [T.poch - .05], 540, 470, t, { size: 140, w: 700, col: ink, track: -.04, blur: 18, out: o2 });
    wordsAt(['так', 'много?'], [T.tak - .05, T.mn - .05], 540, 610, t, { size: 140, w: 700, col: ink, track: -.04, blur: 18, out: o2 });
    // заголовок: кегль второй строки подобран под 900 px
    const s2 = Math.min(104, 104 * 900 / measure('Стефана-Больцмана', 104, 600, -.03));
    atext('Закон', 540, 400, T.zak - .05, t, { size: 104, w: 600, col: ink, track: -.03 });
    atext('Стефана-Больцмана', 540, 400 + s2 * 1.12, T.sb - .05, t, { size: s2, w: 600, col: ink, track: -.03 });
    const fy = 400 + s2 * 1.12 + 108, f0 = T.sb + .45;
    segText([['P ∝ T', sub, f0], ['⁴', stage.accent, f0 + .12]], 540, fy, t, { size: 60, w: 500, track: -.01 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.vd - .05, 'whoosh', .28, .9);
    add(T.zas - .05, 'swell', .3, .9);
    add(T.sh - 1.5, 'riser', .22);
    add(T.sh - .05, 'impact', .4, .9);
    add(T.poch, 'tick', .2, .9);
    add(T.zak - .1, 'bloom', .3, .8);
    add(T.sb + .1, 'chime', .25, .95);
  },
});
