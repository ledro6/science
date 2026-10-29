// MONTH (35.394 – 41.873 с), светлый фон.
// m1 — орбита сверху под углом: Земля, пунктирная орбита «сейчас» с бледной Луной; на «короче» прорисовывается
//      орбита вдвое меньше, по ней Луна бежит в 2^1,5 ≈ 2,8 раза чаще (настоящее отношение периодов);
//      «27 дней» → на «Кеплера» строка «T² ∝ a³» (³ красная) → на «десять» «≈ 10 дней».
import { defineScene, makeStage, project, atext, P, Wd, E, THREE, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, TAU, makeEarth, makeMoon, frame, ring, trail, onRing } from './kit.mjs';

const RE = .55, RM = .17, A0 = 2.2, A1 = A0 / 2;
const POUT = 9, PIN = POUT / Math.pow(2, 1.5);           // T ∝ a^1,5 → в 2,83 раза быстрее
function TT() {
  return { mes: Wd('m1', 'месяц'), kor: Wd('m1', 'короче'), kep: Wd('m1', 'Кеплера'), ob: Wd('m1', 'обежит'), men: Wd('m1', 'меньше'), des: Wd('m1', 'десять') };
}

defineScene('month', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .3 });
    stage.floor.visible = false;
    const earth = makeEarth(RE), m0 = makeMoon(RM), m1 = makeMoon(RM);
    m0.material = m0.material.clone(); m0.material.transparent = true;
    stage.root.add(earth, m0, m1);
    return { stage, earth, m0, m1, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, m0, m1, T } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(-4, 8, 7); L.key.intensity = 2.2; L.key.castShadow = false; L.hemi.intensity = 1.1; L.rimL.intensity = 1.0; L.rimR.intensity = .8;
    earth.rotation.set(0, (t - s.start) * .5, .41);
    const a0 = .9 + TAU * (t - s.start) / POUT, a1 = 2.2 + TAU * (t - T.kor) / PIN;
    m0.position.set(...onRing(A0, a0));
    m0.scale.setScalar(Math.max(1e-3, P(t, s.start + .2, .8)));
    m0.material.opacity = lerp(1, .38, P(t, T.kor, .8));
    m1.position.set(...onRing(A1, a1));
    m1.scale.setScalar(Math.max(1e-3, P(t, T.kor - .1, .6, eApple)));
    const k = clamp((t - s.start) / (s.end - s.start));
    frame(cam, [0, 0, 0], lerp(21.8, 21, eInOut(k)), lerp(-8, 8, k), 46, 540, 945);
  },

  draw2d(t, s, st) {
    const { stage, earth, m0, m1, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const occ = [{ p: [0, 0, 0], r: RE }];
    // орбиты: старая пунктиром, новая — сплошной; след за быстрой Луной
    const r0 = P(t, s.start + .1, 1.2, eInOut);
    ring(cam, A0, { col: ink, a: .5, lw: 2, dash: [7, 9], to: TAU * r0, occ });
    const r1 = P(t, T.kor - .15, .9, eInOut);
    ring(cam, A1, { col: ink, a: .55, lw: 2.5, from: 2.2, to: 2.2 + TAU * r1, occ });
    if (t > T.kor) trail(cam, A1, 2.2 + TAU * (t - T.kor) / PIN, 1.3, { col: ink, a: .8 * P(t, T.kor + .2, .5), lw: 4, occ });
    // подписи у орбит
    const [ox, oy] = project(cam, ...onRing(A0, Math.PI));
    atext('сейчас', ox + 18, oy + 12, s.start + .9, t, { size: 36, w: 500, col: sub, align: 'left', track: 0, dy: 12 });
    const [ix, iy] = project(cam, ...onRing(A1, Math.PI / 2));
    atext('вдвое ближе', ix, iy - 46, T.kor + .3, t, { size: 36, w: 500, col: ink, track: 0, dy: 12 });
    // цифры
    const oN = T.men - .1;
    atext('27 дней', 540, 400, T.mes, t, { size: 190, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oN });
    atext('месяц сейчас', 540, 472, T.mes + .3, t, { size: 48, w: 500, col: sub, track: -.005, out: oN });
    atext('≈ 10 дней', 540, 400, T.des - .05, t, { size: 190, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('месяц вдвое ближе', 540, 472, T.des + .2, t, { size: 48, w: 500, col: sub, track: -.005 });
    // закон Кеплера: «³» красная автоматически
    atext('T² ∝ a³', 540, 572, T.kep - .05, t, { size: 76, w: 600, col: ink, track: -.02, dy: 24 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .3, 'swell', .2, .8);
    add(T.kor, 'whoosh', .25, 1.1);
    add(T.kep, 'bloom', .24, .85);
    add(T.des, 'chime', .26, 1);
  },
});
