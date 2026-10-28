// HOOK (0 – 9.3 с), чёрный фон.
// k1 — чёрная керамическая Земля, по ней текут тонкие штрихи ветра (InstancedMesh), медленная орбита;
//      на «нет ни малейшего ветра» камера наезжает в глаз циклона: штрихи закручиваются в спираль вокруг тихой точки,
//      там красная точка и огромная красная «0 м/с»;
// k2 — отъезд; «не прогноз погоды»: материки гаснут, проступает тонкая сетка меридианов, ветер замирает ровными стрелками;
// k3 — штрихи встают иглами по нормали (шар-«ёж»), заголовок «Теорема о причёсывании ежа».
import { defineScene, makeStage, project, atext, atextWords, line, dot, P, Wd, E, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, makeEarth, setStrokes, earthWorld, EYE, ring, scrim, bump } from './_kit.mjs';
import { lookFrom, norm3, add3, scl3, dot3 } from './_hair.mjs';

function TT() {
  return {
    net: Wd('k1', 'нет'), ni: Wd('k1', 'ни'), vet: Wd('k1', 'ветра'), end1: E('k1'),
    ne: Wd('k2', 'не'), prog: Wd('k2', 'прогноз'), mat: Wd('k2', 'математическая'), teo: Wd('k2', 'теорема'),
    t1: Wd('k3', 'Теорема'), o: Wd('k3', 'о'), pr: Wd('k3', 'причёсывании'), ezh: Wd('k3', 'ежа'),
  };
}
const RAD = Math.PI / 180;
const spinAt = t => (14 + 9 * t) * RAD;

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const earth = makeEarth();
    earth.tilt.rotation.set(.32, 0, .12);
    stage.root.add(earth.tilt);
    return { stage, earth, T: TT() };
  },

  update(t, s, st) {
    const { stage, earth, T } = st, cam = stage.camera, L = stage.lights;
    // свет: Земля «вырезается» из темноты контровыми, затем ключ
    st.zPrev = P(t, T.net - .1, 1.25, eInOut) * (1 - P(t, T.end1 + .1, 1.3, eInOut));
    const lr = P(t, 0, 1.0, eApple), lk = P(t, .15, 1.4, eApple);
    L.rimL.intensity = 3.4 * lr; L.rimR.intensity = 2.4 * lr; L.key.intensity = 2.0 * lk * (1 - .6 * st.zPrev); L.hemi.intensity = .35 * lk;
    L.key.castShadow = false;
    L.key.position.set(lerp(-6, 4, eApple(clamp(t / 4))), 7, 6);
    earth.spin.rotation.y = spinAt(t);
    // k2: «не прогноз погоды» — материки гаснут, проступает сетка
    const math = P(t, T.mat - .1, 1.1, eInOut);
    earth.plainMat.opacity = math; earth.plain.visible = math > .003;
    earth.grid.material.opacity = .22 * math * (1 - .5 * P(t, T.pr, .8));
    // штрихи
    const zIn = P(t, T.net - .1, 1.25, eInOut), zOut = P(t, T.end1 + .1, 1.3, eInOut), z = zIn * (1 - zOut);
    const arrow = P(t, T.mat, .9, eInOut) * (1 - P(t, T.t1 + .1, .6));
    const spike = P(t, T.pr - .15, 1.1, eInOut);
    setStrokes(earth, t, { g: lerp(1, .55, z) * lerp(1, .85, arrow), c: z, w: lerp(1, .3, z), arrow, spike });
    // камера: общий план ↔ наезд в глаз
    const Ew = earthWorld(earth, EYE, 1);
    const C0 = [0, 0, 0];
    const nN = norm3(add3([0, 1, 0], Ew, -Ew[1]));                     // «север» в точке глаза
    const tau = 56 * RAD;
    const posZ = add3(Ew, norm3(add3(scl3(Ew, Math.cos(tau)), nN, -Math.sin(tau))), 2.35);
    const tgZ = add3(Ew, nN, .0);
    const k2 = P(t, T.ne - .2, 3.2, eApple);                            // на k2/k3 — отъезд и подъём кадра под заголовок
    const az = (-4 + 1.4 * t) * RAD, el = (7 + 3 * k2) * RAD, dist = lerp(10.4, 12.2, k2) - .1 * t;
    const posA = [dist * Math.cos(el) * Math.sin(az), dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az)];
    const pos = posA.map((v, i) => lerp(v, posZ[i], z)), tg = C0.map((v, i) => lerp(v, tgZ[i], z));
    lookFrom(cam, pos, tg, 540, lerp(lerp(920, 1000, k2), 1000, z));
    st.Ew = Ew; st.z = z;
  },

  draw2d(t, s, st) {
    const { stage, T, Ew } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // ---- глаз циклона: красная точка + кольцо ----
    const [ex, ey] = project(cam, ...Ew);
    const dA = P(t, T.ni - .05, .5) * (1 - P(t, T.end1 + .05, .35, eIn));
    if (dA > .003) {
      ring(ex, ey, lerp(70, 26, P(t, T.ni, .9)), ink, .55 * dA * (1 - P(t, T.vet + .4, .6)));
      dot(ex, ey, 11 * dA, red, dA);
      // тонкая вертикаль от точки к цифре
      line(ex, ey - 24, ex, lerp(ey - 24, 625, P(t, T.vet - .05, .5)), ink, .5 * dA * P(t, T.vet - .05, .3), 2);
    }
    // огромная красная «0 м/с»
    const out1 = T.end1 + .1;
    scrim(240, 680, .75 * P(t, T.vet - .3, .5) * (1 - P(t, out1, .35, eIn)));
    atext('0 м/с', 540, 500, T.vet, t, { size: 260, w: 700, col: red, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: out1 });
    atext('ветер в центре циклона', 540, 580, T.vet + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: out1 });
    // k2: «не прогноз погоды» → «математика»
    const o2 = T.mat - .15;
    atext('Не прогноз погоды', 540, 430, T.ne, t, { size: 72, w: 600, col: sub, track: -.02, out: o2 });
    const sk = P(t, T.mat - .45, .35, eApple) * (1 - P(t, o2, .35, eIn));
    if (sk > .003) line(540 - 300, 405, lerp(540 - 300, 540 + 300, sk), 405, sub, sk, 4);
    atext('Математика', 540, 440, T.mat, t, { size: 112, w: 600, col: ink, track: -.03, out: T.t1 - .3 });
    // k3: заголовок
    atextWords('Теорема о', 540, 360, T.t1 - .05, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .55 });
    atextWords('причёсывании ежа', 540, 475, T.pr - .05, t, { size: 100, w: 600, col: ink, track: -.03, stagger: .7 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.net - .1, 'whoosh', .35, .7);
    add(T.vet - 1.5, 'riser', .22);
    add(T.vet, 'impact', .4, .9);
    add(T.end1 + .1, 'whoosh', .25, .6);
    add(T.mat, 'shimmer', .22, .8);
    add(T.pr, 'swell', .25, .8);
    add(T.ezh, 'chime', .25, .9);
  },
});
