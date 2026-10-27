// SPEED (32.6 – 46.8 с), белый фон.
// s1 — две орбиты сверху: Земля и Нептун с НАСТОЯЩИМ отношением угловых скоростей (1 : 164,8) — Земля делает
//      оборот за 1,6 с, Нептун за всю сцену сдвигается на ~20°; «Путь длиннее / скорость меньше».
// s2 — «30» и «5» км/с — пара цифр, орбита говорящей планеты подсвечивается.
// s3 — на «Ньютон» серым «F ∝ 1/r²»; вокруг Солнца поле притяжения, которое гаснет с квадратом расстояния.
import { defineScene, makeStage, orbit, project, atext, atextWords, line, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, TAU, onRing, makeNeptune, makeBall, ring, trail, screenR } from './kit.mjs';

const RE = 1.0, RNp = 2.85, PE = 1.6, RATIO = 164.8;   // радиусы (условно), период Земли в секундах ролика, T_N / T_E
const angE = (t, s) => 2.3 + TAU * (t - s.start) / PE;
const angN = (t, s) => .05 + TAU * (t - s.start) / (PE * RATIO);

function TT() {
  return {
    dl: Wd('s1', 'длинный'), med: Wd('s1', 'медленнее'), zem: Wd('s2', 'Земля'), v30: Wd('s2', 'тридцать'), km: Wd('s2', 'километров'),
    nep: Wd('s2', 'Нептун'), v5: Wd('s2', 'пять'), nyu: Wd('s3', 'Ньютон'), pri: Wd('s3', 'притяжение'), sla: Wd('s3', 'слабеет'), kv: Wd('s3', 'квадратом'),
    e1: E('s1'), e2: E('s2'),
  };
}

defineScene('speed', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    stage.camera.far = 300; stage.camera.updateProjectionMatrix();
    const sunMat = MAT.ceramicWhite(); sunMat.emissive = new THREE.Color('#FFFFFF'); sunMat.emissiveIntensity = .18;
    const sun = makeBall(.26, sunMat);
    const earth = makeBall(.1, MAT.aluminium());
    const nep = makeNeptune(.19);
    stage.root.add(sun, earth, nep);
    return { stage, sun, earth, nep, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, nep } = st, cam = stage.camera;
    earth.position.set(...onRing(RE, angE(t, s)));
    nep.position.set(...onRing(RNp, angN(t, s)));
    nep.rotation.set(0, t * .4, .5);
    const k = P(t, s.start + .1, 1.2, eApple);
    earth.scale.setScalar(Math.max(k, 1e-3)); nep.scale.setScalar(Math.max(k, 1e-3));
    const u = clamp((t - s.start) / (s.end - s.start));
    orbit(cam, [0, .25, 0], lerp(31, 29, eInOut(u)), lerp(-12, 14, u), lerp(56, 48, eInOut(u)));
  },

  draw2d(t, s, st) {
    const { stage, T, earth, nep } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const occ = [{ p: [0, 0, 0], r: .26 }, { p: nep.position.toArray(), r: .19 }, { p: earth.position.toArray(), r: .1 }];
    // поле притяжения (s3): тёмный ореол вокруг Солнца, яркость ∝ 1/r² (эллипс — проекция плоскости орбит)
    const fa = P(t, T.pri, 1.0) * (1 + .25 * Math.max(0, Math.sin(clamp((t - T.kv) / .9) * Math.PI)));
    if (fa > .003) {
      const [sx, sy] = project(cam, 0, 0, 0), [rx] = project(cam, RNp, 0, 0), [, ry] = project(cam, 0, 0, -RNp);
      const R = Math.hypot(rx - sx, 0) || 1, ky = Math.abs(ry - sy) / R || .7;
      g.save(); g.translate(sx, sy); g.scale(1, ky);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
      for (let i = 0; i <= 16; i++) { const x = i / 16; gr.addColorStop(x, `rgba(29,29,31,${(.42 / (1 + (x / .2) ** 2) * (1 - x)).toFixed(4)})`); }
      g.globalAlpha = Math.min(1, fa); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 1.05, 0, TAU); g.fill(); g.restore();
    }
    // орбиты: прорисовываются, затем подсвечивается та, о которой говорят
    const dr = P(t, s.start + .1, 1.3, eInOut);
    const hiN = Math.max(P(t, T.dl, .5) * (1 - P(t, T.e1, .4)), P(t, T.nep, .5));
    const hiE = P(t, T.zem, .5) * (1 - P(t, T.nep, .5));
    const a0 = angE(t, s);
    ring(cam, RE, { col: ink, a: .28 + .5 * hiE, lw: 2 + hiE, from: a0, to: a0 + TAU * dr, occ });
    const n0 = angN(t, s);
    ring(cam, RNp, { col: ink, a: .28 + .5 * hiN, lw: 2 + 1.5 * hiN, from: n0, to: n0 + TAU * dr, occ });
    // хвосты: у Земли длинный (быстро), у Нептуна — весь пройденный за сцену путь
    const ta = P(t, s.start + .6, .8);
    trail(cam, RE, a0, 1.6, { col: ink, a: .85 * ta, lw: 4, occ });
    ring(cam, RNp, { col: ink, a: .9 * ta, lw: 4, from: angN(s.start, s), to: n0, occ });
    // подписи планет (статичные, у орбит)
    const lab = (txt, r, ang, t0, out) => { const [x, y] = project(cam, ...onRing(r, ang)); atext(txt, x, y + 52, t0, t, { size: 36, w: 500, col: sub, track: 0, dy: 14, out }); };
    lab('Земля', RE, -1.45, s.start + .6, T.nyu - .1);
    { const [x, y] = project(cam, ...nep.position.toArray()); atext('Нептун', x, y - 42, s.start + .8, t, { size: 36, w: 500, col: sub, track: 0, dy: 14, out: T.nyu - .1 }); }
    // s1
    atext('Путь длиннее', 540, 380, T.dl, t, { size: 96, w: 600, col: ink, track: -.03, out: T.e1 - .05 });
    atext('скорость меньше', 540, 490, T.med, t, { size: 96, w: 600, col: ink, track: -.03, out: T.e1 - .05 });
    // s2: пара цифр
    const o2 = T.nyu - .3;
    atext('30', 300, 500, T.v30, t, { size: 240, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('км/с · Земля', 300, 570, T.km, t, { size: 40, w: 500, col: sub, track: 0, out: o2 });
    atext('5', 780, 500, T.v5, t, { size: 240, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o2 });
    atext('км/с · Нептун', 780, 570, T.v5 + .2, t, { size: 40, w: 500, col: sub, track: 0, out: o2 });
    line(540, 340, 540, 560, sub, .35 * P(t, T.v5, .5) * (1 - P(t, o2, .35, eIn)), 2);
    // s3: Ньютон — серым
    atext('F ∝ 1/r²', 540, 480, T.nyu, t, { size: 150, w: 600, col: sub, track: -.03, blur: 16, dur: .9 });
    atext('Исаак Ньютон', 540, 560, T.nyu + .35, t, { size: 42, w: 500, col: sub, track: 0 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .3, 'swell', .25, .8);
    add(T.dl, 'tick', .15);
    add(T.v30, 'chime', .22, 1);
    add(T.v5, 'chime', .22, .8);
    add(T.nyu, 'bloom', .28, .8);
    add(T.pri, 'swell', .2, .7);
  },
});
