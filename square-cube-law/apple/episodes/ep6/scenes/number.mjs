// NUMBER (11.1 – 25.1 с), белый фон.
// n1 — формула «Re = ρvL/μ» крупно; внизу алюминиевые весы: слева куб «инерция», справа графитовая капля «вязкость»;
// n2 — пловец (капсульная фигура) отталкивается и скользит с длинным следом; «≈1 000 000», весы кренятся к инерции;
// n3 — бактерия на той же дорожке: гребёт, на «Инерции нет» встаёт мгновенно, след нулевой; красное «0,00001»,
//      куб инерции тает, весы падают в сторону вязкости.
import { defineScene, makeStage, project, atext, line, dot, P, Wd, C, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, eStd, roundedBox } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';
import { frame, makeBacterium, bump } from './_kit.mjs';
import { ctx, lp } from './_draw.mjs';

const LANE = 2.2;                 // высота дорожки (мир)
const BEAM_Y = 1.36, HALF = 1.4, HANG = .72;

function TT() {
  return {
    ono: Wd('n1', 'Оно'), in: Wd('n1', 'инерцию'), vz: Wd('n1', 'вязкостью'),
    pl: Wd('n2', 'пловца'), mil: Wd('n2', 'миллиона'), ott: Wd('n2', 'оттолкнулся'), sk: Wd('n2', 'скользишь'),
    bac: Wd('n3', 'бактерии'), odna: Wd('n3', 'одна'), in0: Wd('n3', 'Инерции'), net: Wd('n3', 'нет'), vz2: Wd('n3', 'вязкость'),
  };
}
// пловец: стоит до толчка, затем экспоненциальное скольжение (инерция)
const swimX = (t, T) => -1.45 + (t < T.ott ? 0 : 2.7 * (1 - Math.exp(-(t - T.ott) / 1.05)));
// бактерия: гребёт с постоянной скоростью, на «Инерции» встаёт мгновенно
const bacX = (t, T) => -.55 + .26 * clamp(Math.min(t, T.in0) - T.bac, 0, 9);

function makeSwimmer(mat) {
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .5, 8, 24), mat); torso.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.1, 24, 16), mat); head.position.set(.46, .02, 0);
  g.add(torso, head);
  const arms = [rod(mat, .04), rod(mat, .04)], legs = [rod(mat, .05), rod(mat, .05)];
  g.add(...arms, ...legs);
  g.pose = k => {   // k: 0 — вытянут в струнку, 1 — сгруппирован перед толчком
    arms.forEach((a, i) => { const s = i ? 1 : -1; a.set([.28, .06, s * .09], [lerp(.92, .55, k), lerp(.03, .2, k), s * .05]); });
    legs.forEach((l, i) => { const s = i ? 1 : -1; l.set([-.32, 0, s * .07], [lerp(-.95, -.62, k), lerp(-.01, -.22, k), s * lerp(.14, .1, k)]); });
  };
  g.pose(0);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

defineScene('number', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .4 });
    const T = TT();
    const alu = MAT.aluminium(), gra = MAT.graphite(), cer = MAT.ceramicWhite();
    // --- весы ---
    const bal = new THREE.Group(); stage.root.add(bal);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .56, .08, 64), alu); base.position.y = .04;
    const post = rod(alu, .045, 20); post.set([0, .08, 0], [0, BEAM_Y, 0]);
    const piv = new THREE.Mesh(new THREE.SphereGeometry(.075, 28, 20), gra); piv.position.y = BEAM_Y;
    const beam = new THREE.Group(); beam.position.y = BEAM_Y;
    const bar = rod(alu, .035, 20); bar.set([-HALF, 0, 0], [HALF, 0, 0]); beam.add(bar);
    const needle = rod(gra, .018, 12); needle.set([0, 0, .06], [0, .42, .06]); beam.add(needle);
    bal.add(base, post, piv, beam);
    const pans = [-1, 1].map(sx => {
      const g = new THREE.Group();
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(.44, .38, .05, 56), cer); pan.position.y = -HANG;
      const s1 = rod(gra, .008, 8), s2 = rod(gra, .008, 8), s3 = rod(gra, .008, 8);
      s1.set([0, 0, 0], [-.38, -HANG, 0]); s2.set([0, 0, 0], [.38, -HANG, 0]); s3.set([0, 0, 0], [0, -HANG, -.36]);
      g.add(pan, s1, s2, s3); bal.add(g);
      return { g, sx };
    });
    // грузы: куб инерции (алюминий) и капля вязкости (графит)
    const cube = new THREE.Mesh(roundedBox(1, .08, 3), alu);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), MAT.ceramicBlack());
    bal.add(cube, drop);
    // --- дорожка: пловец и бактерия ---
    const swim = makeSwimmer(alu); stage.root.add(swim);
    const bac = makeBacterium(THREE, MAT.ceramicBlack()); bac.scale.setScalar(.5); stage.root.add(bac);
    bal.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { stage, T, bal, beam, pans, cube, drop, swim, bac };
  },

  update(t, s, st) {
    const { stage, T, beam, pans, cube, drop, swim, bac } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(3, 9, 6);
    // крен весов: равновесие → инерция (пловец) → вязкость (бактерия)
    const tilt = .03 * Math.sin((t - s.start) * 2.2) * (1 - P(t, T.pl, .6)) + .2 * P(t, T.mil - .3, 1.2, eInOut) * (1 - P(t, T.bac, .6, eIn))
      - .29 * P(t, T.odna, 1.4, eInOut);
    beam.rotation.z = tilt;
    const ends = [-1, 1].map(sx => [sx * HALF * Math.cos(tilt), BEAM_Y + sx * HALF * Math.sin(tilt)]);
    pans.forEach((p, i) => p.g.position.set(ends[i][0], ends[i][1], 0));
    // размеры грузов
    const ci = P(t, T.in - .1, .8, eApple);
    const inK = lerp(1, 1.45, P(t, T.mil - .3, 1, eInOut)) * (1 - P(t, T.bac, .6, eInOut) * .35) * (1 - P(t, T.in0, 1.1, eInOut));
    const vzK = P(t, T.vz - .1, .8, eApple) * lerp(1, .7, P(t, T.mil - .3, 1, eInOut)) * lerp(1, 1.5, P(t, T.odna, 1.2, eInOut));
    const cs = .34 * ci * inK;
    cube.visible = cs > .004; cube.scale.setScalar(Math.max(cs, 1e-3));
    cube.position.set(ends[0][0], ends[0][1] - HANG + .025 + cs / 2, 0); cube.rotation.y = .5;
    const dr = .2 * vzK;
    drop.visible = dr > .004; drop.scale.set(Math.max(dr, 1e-3), Math.max(dr * .78, 1e-3), Math.max(dr, 1e-3));
    drop.position.set(ends[1][0], ends[1][1] - HANG + .025 + dr * .78, 0);
    // пловец
    const sIn = P(t, T.pl - .1, .9, eApple) * (1 - P(t, T.bac - .25, .45, eIn));
    swim.visible = sIn > .01;
    swim.position.set(swimX(t, T), LANE + (1 - sIn) * .2, 0);
    swim.pose(P(t, T.ott - .55, .45, eInOut) * (1 - P(t, T.ott, .25, eStd)));
    swim.scale.setScalar(Math.max(1e-3, lerp(1.0, 1.15, sIn)));
    swim.rotation.x = 1.15;
    // бактерия: гребёт до «Инерции», затем стоп — жгутик и тело замирают сразу
    const bIn = P(t, T.bac - .05, .8, eApple);
    bac.visible = bIn > .01;
    bac.position.set(bacX(t, T), LANE + (1 - bIn) * .2, 0);
    bac.spin(10 * (Math.min(t, T.in0) - T.bac));
    bac.rotation.set(.3, 0, 0);
    // камера: фронтально, медленный дрейф
    frame(cam, [0, 1.5, 0], 15.5, lerp(-6, 6, clamp((t - s.start) / (s.end - s.start))), 7, 540, 860);
  },

  draw2d(t, s, st) {
    const { stage, T, pans, swim, bac } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // n1: формула
    atext('Re = ρvL/μ', 540, 420, T.ono, t, { size: 150, w: 600, col: ink, track: -.03, blur: 16, scale0: 1.08, dur: .9, out: T.pl - .35 });
    // подписи под чашами
    pans.forEach((p, i) => {
      const [x, y] = project(cam, p.g.position.x, p.g.position.y - HANG - .05, 0);
      const t0 = i ? T.vz : T.in;
      const fade = i === 0 ? 1 - .6 * P(t, T.net, .8) : 1;
      const emph = i === 1 ? bump(t, T.vz2 + .25, .5) : 0;
      atext(i ? 'вязкость' : 'инерция', x, y + 62, t0, t, { size: 40 + emph * 4, w: 500 + emph * 100, col: i === 1 && t > T.vz2 ? ink : sub, track: 0, dy: 14, a: fade });
    });
    // n2: пловец
    atext('≈1 000 000', 540, 420, T.mil, t, { size: 160, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.odna - .35 });
    atext('у пловца', 540, 495, T.mil + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: T.odna - .35 });
    // след пловца: длинная тонкая линия, гаснущая к началу, + штрихи кильватера
    const sa = (1 - P(t, T.bac - .25, .45, eIn));
    if (t > T.ott && sa > .003) {
      const x0 = -1.45 - .95, x1 = swimX(t, T) - .95;
      const N = 40;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N;
        const [ax, ay] = project(cam, lerp(x0, x1, u0), LANE, 0), [bx, by] = project(cam, lerp(x0, x1, u1), LANE, 0);
        line(ax, ay, bx, by, ink, sa * .75 * Math.pow(u1, 1.4), 3);
      }
      for (const dy of [-.12, .12]) {
        const [ax, ay] = project(cam, lerp(x0, x1, .45), LANE + dy, 0), [bx, by] = project(cam, x1, LANE + dy * .4, 0);
        line(ax, ay, bx, by, sub, sa * .35, 2);
      }
      atext('скольжение', ...project(cam, (x0 + x1) / 2, LANE - .32, 0), T.sk, t, { size: 36, w: 500, col: sub, track: 0, dy: 12, a: sa });
    }
    // n3: бактерия
    atext('0,00001', 540, 420, T.odna, t, { size: 180, w: 700, col: red, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
    atext('у бактерии', 540, 495, T.odna + .3, t, { size: 46, w: 500, col: sub, track: -.005 });
    // след нулевой: засечка у носа + «след 0»
    const za = P(t, T.net, .5) * (1 - P(t, s.end - .5, .3, eIn));
    if (za > .003) {
      bac.updateMatrixWorld();
      const [nx, ny] = lp(cam, bac, .82, 0);
      line(nx + 4, ny - 46, nx + 4, ny + 46, ink, za * .8, 2);
      atext('след 0', nx + 26, ny + 14, T.net, t, { size: 40, w: 600, col: ink, align: 'left', track: 0, dy: 12, a: za });
    }
  },

  sfx(add) {
    const T = TT();
    add(T.ono, 'bloom', .3, .9);
    add(T.in, 'click', .25, .9);
    add(T.vz, 'click', .25, 1.05);
    add(T.mil, 'chime', .3, 1);
    add(T.ott, 'whoosh', .4, 1.1);
    add(T.odna - 1.5, 'riser', .22);
    add(T.odna, 'impact', .35, .9);
    add(T.in0 + .02, 'thud', .35, .7);
  },
});
