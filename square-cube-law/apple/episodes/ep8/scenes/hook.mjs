// HOOK (0 – 14.7 с), чёрный фон, чёрное зеркало.
// k1 — керамическая фигурка-капсула из темноты (макро) → отъезд: 23 фигурки встают кругом волной, «23 человека»;
//      над каждой — плашка-дата; на «больше половины» две плашки «14 мар» вспыхивают, их соединяет дуга,
//      остальные притухают; огромная красная «50,7%» «шанс совпадения»;
// k2 — камера отъезжает: за кругом встаёт призрачное кольцо из 183 фигурок, серым «интуиция: 183 человека»;
//      на «нет» 183 зачёркивается, призраки уходят под зеркало, камера возвращается к 23;
// k3 — низкий ракурс, плашки пары возвращаются, «Парадокс дней рождения».
import {
  defineScene, makeStage, project, atext, atextWords, line, measure, P, Wd, E, THREE, MAT, clamp, lerp,
  eApple, eIn, eInOut, eEase, eSpring, accent,
} from '../../../engine.mjs';
import { ctx, N, PAIR, bump, lerp3, frame, mirrorFloor, makeCrowd, ringPos, DATES, plaque, FIG_H } from './kit.mjs';

const R = 2.5;            // радиус круга
const NG = 183, RG = 5.6; // призрачное кольцо «интуиции»
const V = new THREE.Vector3();

function TT() {
  return {
    kom: Wd('k1', 'комнате'), dv: Wd('k1', 'двадцать'), chel: Wd('k1', 'человека'), sh: Wd('k1', 'Шанс'), sovp: Wd('k1', 'совпадёт'),
    bol: Wd('k1', 'больше'), pol: Wd('k1', 'половины'), end1: E('k1'),
    kaz: Wd('k2', 'Кажется'), sto: Wd('k2', 'сто'), chel2: Wd('k2', 'человека'), no: Wd('k2', 'Но'), net: Wd('k2', 'нет'),
    eto: Wd('k3', 'Это'), par: Wd('k3', 'парадокс'), dn: Wd('k3', 'дней'), roz: Wd('k3', 'рождения'),
  };
}
const ord = i => Math.min(i, N - i);                         // порядок волны: от фигурки у камеры в обе стороны
const riseAt = (i, T) => i === 0 ? .25 : T.dv - .2 + ord(i) * .085;
const isPair = i => i === PAIR[0] || i === PAIR[1];

// камера: макро → круг → отъезд к 183 → обратно → низкий ракурс
function cam(t, T) {
  const macro = { tg: [0, .5, R], d: 6.2, az: 18 - t * 3, el: 7, sy: 930 };
  const wide = { tg: [0, .5, 0], d: 26, az: lerp(-10, 4, clamp((t - T.dv) / 7)), el: 40, sy: 1010 };
  const far = { tg: [0, .3, 0], d: 58, az: lerp(0, 10, clamp((t - T.sto) / 4)), el: 38, sy: 1000 };
  const low = { tg: [0, .7, 0], d: 27, az: lerp(18, 30, clamp((t - T.eto) / 2.6)), el: 19, sy: 930 };
  const mix = (A, B, k) => ({ tg: lerp3(A.tg, B.tg, k), d: Math.exp(lerp(Math.log(A.d), Math.log(B.d), k)), az: lerp(A.az, B.az, k), el: lerp(A.el, B.el, k), sy: lerp(A.sy, B.sy, k) });
  const k1 = P(t, T.dv - .4, 2.0, eInOut), k2 = P(t, T.sto - .35, 1.7, eInOut), k3 = P(t, T.net - .05, 1.4, eInOut), k4 = P(t, T.eto - .2, 2.2, eInOut);
  let c = mix(macro, wide, k1);
  if (k2 > 0) c = mix(c, far, k2 * (1 - k3));
  if (k4 > 0) c = mix(c, low, k4);
  return c;
}

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    mirrorFloor(stage);
    const crowd = makeCrowd(N, MAT.ceramicWhite());
    const gm = new THREE.MeshLambertMaterial({ color: '#F2F2F0', transparent: true, opacity: .55, depthWrite: false });
    const ghosts = makeCrowd(NG, gm, { mirror: false, lo: true });
    ghosts.up.forEach(m => { m.castShadow = false; m.receiveShadow = false; });
    stage.root.add(crowd.grp, ghosts.grp);
    return { stage, crowd, ghosts, gm, T: TT() };
  },

  update(t, s, st) {
    const { stage, crowd, ghosts, gm, T } = st, L = stage.lights;
    const dimOthers = .68 * P(t, T.bol + .05, .7) * (1 - .4 * P(t, T.roz, .8));
    for (let i = 0; i < N; i++) {
      const [x, z] = ringPos(i, R);
      const k = eSpring(clamp((t - riseAt(i, T)) / .8));
      const lit = P(t, riseAt(i, T) - .1, .9, eEase);
      const c = isPair(i) ? 1 : 1 - dimOthers;
      crowd.set(i, x, 0, z, Math.max(1e-3, .82 * k), lit * c, Math.atan2(-x, -z) + Math.PI);
    }
    crowd.commit();
    // призрачные 183: встают волной на «сто восемьдесят три», уходят под зеркало на «нет»
    const gOn = P(t, T.sto - .2, .4) > 0 && t < T.net + 1.6;
    ghosts.grp.visible = gOn;
    if (gOn) {
      for (let i = 0; i < NG; i++) {
        const [x, z] = ringPos(i, RG, NG);
        const o = Math.min(i, NG - i) / (NG / 2);
        const kin = eSpring(clamp((t - T.sto - .35 - o * .9) / .7));
        const kout = P(t, T.net + o * .5, .5, eIn);
        ghosts.set(i, x, -kout * .45, z, Math.max(1e-3, .65 * kin * (1 - kout)), .85);
      }
      ghosts.commit();
      gm.opacity = .6 * (1 - P(t, T.net, 1, eIn));
    }
    // свет: скользящий ключ, контровые вырезают силуэты
    const lit = P(t, 0, 1.0, eEase), sw = eApple(clamp(t / 3.4));
    L.key.position.set(lerp(-8, 4, sw), lerp(5, 9, sw), lerp(-1, 6, sw));
    L.key.intensity = 2.6 * lit; L.hemi.intensity = .45 * lit;
    L.rimL.position.set(-6, 3, -5); L.rimL.intensity = (3.2 + 1.5 * bump(t, T.par + .3, .8)) * lit; L.rimR.intensity = 2.5 * lit;
    const c = cam(t, T);
    frame(stage.camera, c.tg, c.d, c.az, c.el, 540, c.sy);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cm = stage.camera, ink = stage.ink, sub = stage.sub, g = ctx();
    // ---- плашки-даты над головами ----
    const plA = i => {
      const base = P(t, T.sh - .05 + ord(i) * .045, .6, eApple);
      if (isPair(i)) return base * (1 - P(t, T.sto - .4, .35, eIn)) + P(t, T.roz - .1, .6, eApple) * (t > T.sto ? 1 : 0);
      return base * (1 - .62 * P(t, T.bol + .05, .6)) * (1 - P(t, T.kaz + .2, .5, eIn));
    };
    const items = [];
    for (let i = 0; i < N; i++) {
      const a = plA(i); if (a <= .003) continue;
      const [x, z] = ringPos(i, R);
      const [px, py] = project(cm, x, FIG_H * .82 + .3, z);
      const d = cm.position.distanceTo(V.set(x, FIG_H, z));
      items.push({ i, a, px, py, d, s: clamp(26 / d, .8, 1.15) });
    }
    items.sort((A, B) => B.d - A.d);
    const hi = Math.max(P(t, T.bol - .05, .35) * (1 - .15 * P(t, T.bol + .4, .6)), P(t, T.roz - .1, .5) * .7);
    for (const it of items) plaque(it.px, it.py - (1 - P(t, T.sh - .05 + ord(it.i) * .045, .6, eApple)) * 16, it.s, DATES[it.i], it.a, isPair(it.i) ? hi : 0);
    // дуга между совпавшими плашками
    const pa = items.find(q => q.i === PAIR[0]), pb = items.find(q => q.i === PAIR[1]);
    const arc = P(t, T.bol + .1, .7, eInOut);
    const arcA = Math.min(pa ? pa.a : 0, pb ? pb.a : 0) * (t < T.sto ? 1 : P(t, T.roz + .2, .5));
    if (pa && pb && arc > 0 && arcA > .01) {
      const y0 = Math.min(pa.py, pb.py) - 26, mx = (pa.px + pb.px) / 2, my = y0 - 110;
      g.save(); g.globalAlpha = .8 * arcA; g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath();
      for (let k = 0; k <= 40; k++) {
        const u = arc * k / 40, a1 = [pa.px, pa.py - 26], a2 = [pb.px, pb.py - 26];
        const x = (1 - u) ** 2 * a1[0] + 2 * u * (1 - u) * mx + u * u * a2[0], y = (1 - u) ** 2 * a1[1] + 2 * u * (1 - u) * my + u * u * a2[1];
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke(); g.restore();
    }
    // ---- k1: «23» → красная «50,7%» ----
    atext('23', 540, 480, T.dv, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.sh - .2 });
    atext('человека в комнате', 540, 556, T.chel, t, { size: 46, w: 500, col: sub, track: -.005, out: T.sh - .2 });
    const o1 = T.sto - .35;
    atext('50,7%', 540, 470, T.pol - .2, t, { size: 280, w: 700, col: accent(), track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o1, outDur: .4 });
    atext('шанс совпадения', 540, 548, T.pol + .1, t, { size: 46, w: 500, col: sub, track: -.005, out: o1, outDur: .4 });
    // ---- k2: «интуиция: 183 человека» серым, зачёркивается на «нет» ----
    const o2 = T.eto - .25;
    atext('интуиция', 540, 290, T.sto - .05, t, { size: 42, w: 500, col: sub, track: 0, out: o2 });
    atext('183', 540, 500, T.sto, t, { size: 280, w: 700, col: sub, track: -.045, blur: 20, scale0: 1.1, dur: .9, out: o2 });
    atext('человека', 540, 572, T.chel2, t, { size: 46, w: 500, col: sub, track: -.005, out: o2 });
    const sk = P(t, T.net, .4, eApple) * (1 - P(t, o2, .35, eIn));
    if (sk > .003) {
      const hw = measure('183', 280, 700, -.045) / 2 + 24;
      line(540 - hw, 410, lerp(540 - hw, 540 + hw, sk), 410 - sk * 0, ink, sk, 7);
    }
    // ---- k3: заголовок ----
    atext('Парадокс', 540, 420, T.par - .05, t, { size: 120, w: 600, col: ink, track: -.03 });
    atextWords('дней рождения', 540, 546, T.dn - .05, t, { size: 120, w: 600, col: ink, track: -.03, stagger: T.roz - T.dn });
  },

  sfx(add) {
    const T = TT();
    add(.1, 'bloom', .3, .8);
    add(.3, 'thud', .3, 1.1);
    add(T.dv - .15, 'swell', .3, .8);
    for (let k = 0; k < 6; k++) add(T.sh + k * .12, 'tick', .08, 1 + k * .05);
    add(T.pol - 1.5 - .2, 'riser', .25);
    add(T.bol - .05, 'shimmer', .25, 1);
    add(T.pol - .2, 'impact', .45, .85);
    add(T.sto - .2, 'swell', .3, .7);
    add(T.net, 'thud', .35, .8);
    add(T.par - .1, 'bloom', .35, .8);
    add(T.roz, 'chime', .25, .9);
  },
});
