// HOOK (0 – 11.1 с), чёрный фон.
// k1 — макро: керамическая бактерия плывёт по диагонали, жгутик-спираль крутится; вокруг — медленные линии тока
//      («вязкая» вода), взвесь частиц стоит в воде; «Вода как мёд» по словам;
// k2 — на «перестанет» жгутик замирает, на «грести» тело встаёт мгновенно, штрихи линий тока застывают;
//      камера наезжает на нос: линейка, атом-сфера, красная скобка «< 1 Å» тормозного пути;
// k3 — отъезд, бактерия притухает, огромное «Re» и подпись «число Рейнольдса».
import { defineScene, makeStage, atext, atextWords, line, dot, P, Wd, C, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, rng } from '../../../engine.mjs';
import { frame, makeBacterium, bump } from './_kit.mjs';
import { ctx, lp, streams } from './_draw.mjs';

const V0 = .55;          // скорость плавания (ед./с)
const OMEGA = 10;        // угловая скорость жгутика
const HEAD = .88;        // наклон курса (рад)

function TT() {
  return {
    voda: Wd('k1', 'вода'), kak: Wd('k1', 'как'), med: Wd('k1', 'мёд'),
    per: Wd('k2', 'перестанет'), gr: Wd('k2', 'грести'), ost: Wd('k2', 'остановится'), ras: Wd('k2', 'расстоянии'),
    men: Wd('k2', 'меньше'), atom: Wd('k2', 'атома'),
    vse: Wd('k3', 'Всё'), num: Wd('k3', 'число'), rey: Wd('k3', 'Рейнольдса'),
  };
}
// пройденный путь: плывёт до «грести», затем стоит (тормозной путь < атома — визуально ноль)
const xPos = (t, T) => V0 * Math.min(t, T.gr + .05);
const phase = (t, T) => OMEGA * (t < T.per ? t : T.per + .09 * (1 - Math.exp(-(t - T.per) / .09)));

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const T = TT();
    const sw = new THREE.Group(); sw.rotation.z = HEAD; stage.root.add(sw);
    const bac = makeBacterium(THREE, MAT.ceramicWhite());
    sw.add(bac);
    // атом: маленькая керамическая сфера + тонкое стеклянное кольцо
    const atom = new THREE.Group();
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(.05, 32, 24), MAT.aluminium());
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.085, .0025, 6, 96), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .6 }));
    ring.rotation.set(1.2, .3, 0);
    atom.add(nucleus, ring); sw.add(atom);
    // взвесь: неподвижные частицы воды (InstancedMesh)
    const N = 140, R = rng(6);
    const motes = new THREE.InstancedMesh(new THREE.SphereGeometry(.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#8E8E93', transparent: true, opacity: .55 }), N);
    const M = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const s = .5 + R() * 1.2;
      M.makeScale(s, s, s).setPosition(-3 + R() * 12, -2.2 + R() * 4.4, -3.5 + R() * 5);
      motes.setMatrixAt(i, M);
    }
    sw.add(motes);
    return { stage, T, sw, bac, atom, ring, motes };
  },

  update(t, s, st) {
    const { stage, T, sw, bac, atom, ring } = st, cam = stage.camera, L = stage.lights;
    const x = xPos(t, T);
    bac.position.set(x, 0, 0);
    bac.spin(phase(t, T));
    // атом стоит у носа: нос = x + .79; зазор (тормозной путь) — крошечный
    const xs = xPos(T.gr + 1, T);
    atom.position.set(xs + .79 + .32, .02, 0);
    const aIn = P(t, T.ras - .1, .8, eApple) * (1 - P(t, E('k2') + .15, .5, eIn));
    atom.visible = aIn > .01; atom.scale.setScalar(Math.max(1e-3, lerp(.6, 1, aIn)));
    ring.rotation.z = t * .9;
    // свет: «вырезан» контровыми, ключ скользит
    const lit = P(t, 0, 1.3, eApple), dimK = 1 - .6 * P(t, T.vse, 1.2, eInOut);
    L.rimL.intensity = 3.4 * lit; L.rimR.intensity = 2.6 * lit;
    L.key.intensity = 2.4 * lit * dimK; L.hemi.intensity = .4 * lit * dimK; L.key.castShadow = false;
    L.key.position.set(lerp(-6, 4, eApple(clamp(t / 4))), 7, 6);
    // камера: средний план → после остановки наезд на нос → отъезд на k3
    sw.updateMatrixWorld();
    const cW = new THREE.Vector3(x - 1.3, 0, 0).applyMatrix4(sw.matrixWorld);
    const nW = new THREE.Vector3(xs + 1.02, -.2, 0).applyMatrix4(sw.matrixWorld);
    const zin = P(t, T.ost - .1, 1.4, eInOut), zout = P(t, C('k3') - .1, 1.6, eInOut);
    const z = zin * (1 - zout);
    const tg = [lerp(cW.x, nW.x, z), lerp(cW.y, nW.y, z), lerp(cW.z, nW.z, z)];
    const dist = lerp(lerp(17, 15.5, P(t, 0, 4)), 6.2, z) * lerp(1, 1.45, zout);
    const az = lerp(10 + t * 1.2, 20, z), el = lerp(8, 4, z);
    frame(cam, tg, dist, az, el, 540, lerp(900, 1060, zout));
  },

  draw2d(t, s, st) {
    const { stage, T, sw, bac, atom } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // линии тока: штрихи «текут» пропорционально пройденному пути и застывают вместе с телом
    const x = xPos(t, T);
    const sa = .6 * P(t, .1, 1.2) * (1 - .55 * P(t, T.ost, 1)) * (1 - .4 * P(t, T.vse, 1));
    streams(cam, bac, { a: sa, off: x * 200, col: '#FFFFFF', lw: 2.4, x0: -4.6, x1: 3.4 });
    // k1: «Вода как мёд»
    atextWords('Вода как мёд', 540, 360, T.voda, t, { size: 110, w: 600, col: ink, track: -.03, stagger: .1, out: E('k1') + .05 });
    // k2: стоп — жгутик замер
    atext('стоп', 540, 360, T.gr + .02, t, { size: 110, w: 600, col: ink, track: -.03, out: T.men - .4 });
    // линейка в масштабе атома (1 Å = диаметр атома .1 ед.), под носом
    const xs = xPos(T.gr + 1, T), nose = xs + .79;
    const ra = P(t, T.ras, .6) * (1 - P(t, E('k2') + .1, .4, eIn));
    if (ra > .003) {
      sw.updateMatrixWorld();
      const y0 = -.42;
      const [ax, ay] = lp(cam, sw, nose - .14, y0), [bx, by] = lp(cam, sw, nose + .42, y0);
      line(ax, ay, bx, by, ink, ra * .7, 2);
      for (let i = 0; i <= 28; i++) {
        const u = nose - .14 + i * .02, big = i % 5 === 0;
        const [px, py] = lp(cam, sw, u, y0), [qx, qy] = lp(cam, sw, u, y0 - (big ? .045 : .022));
        line(px, py, qx, qy, ink, ra * (big ? .8 : .45), 2);
      }
      // «1 Å» под линейкой — один диаметр атома
      const [l1x, l1y] = lp(cam, sw, nose + .32 - .05, y0 - .1), [l2x] = lp(cam, sw, nose + .32 + .05, y0 - .1);
      { const [b1x, b1y] = lp(cam, sw, nose + .27, y0 - .07), [b2x, b2y] = lp(cam, sw, nose + .37, y0 - .07); line(b1x, b1y, b2x, b2y, ink, ra * .9, 4);
        for (const dx of [.27, .37]) { const [u1, v1] = lp(cam, sw, nose + dx, .02), [u2, v2] = lp(cam, sw, nose + dx, y0 - .07); line(u1, v1, u2, v2, ink, ra * .35, 1.5, [5, 6]); } }
      atext('1 Å', (l1x + l2x) / 2, l1y + 30, T.ras + .2, t, { size: 38, w: 500, col: sub, track: 0, dy: 12, a: ra });
      // атом: выноска
      const [mx, my] = lp(cam, sw, atom.position.x, atom.position.y + .09, atom.position.z);
      const ca = P(t, T.atom - .05, .5) * (1 - P(t, E('k2') + .1, .4, eIn));
      if (ca > .003) {
        line(mx + 20, my + 40, mx + 130, my + 130, ink, ca * .7, 2); dot(mx + 20, my + 40, 5, ink, ca);
        atext('атом', mx + 140, my + 150, T.atom, t, { size: 40, w: 500, col: ink, align: 'left', track: 0, dy: 12, a: ca });
      }
      // красная скобка тормозного пути: от носа до точки остановки (меньше атома)
      const qa = P(t, T.men - .05, .5) * (1 - P(t, E('k2') + .1, .4, eIn));
      if (qa > .003) {
        const [p1x, p1y] = lp(cam, sw, nose, y0 + .06), [p2x, p2y] = lp(cam, sw, nose + .035, y0 + .06);
        const [p1b, p1yb] = lp(cam, sw, nose, y0 - .03), [p2b, p2yb] = lp(cam, sw, nose + .035, y0 - .03);
        const [q1x, q1y] = lp(cam, sw, nose, 0), [q2x, q2y] = lp(cam, sw, nose, y0 + .06);
        line(q1x, q1y, q2x, q2y, red, qa * .5, 2, [6, 6]);
        line(p1x, p1y, p1b, p1yb, red, qa, 3); line(p2x, p2y, p2b, p2yb, red, qa, 3);
        line((p1x + p1b) / 2, (p1y + p1yb) / 2, (p2x + p2b) / 2, (p2y + p2yb) / 2, red, qa, 4);
      }
    }
    atext('< 1 Å', 540, 470, T.men, t, { size: 220, w: 700, col: red, track: -.04, blur: 20, scale0: 1.12, dur: .9, out: E('k2') + .1 });
    atext('тормозной путь', 540, 545, T.men + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: E('k2') + .1 });
    // k3: «Re»
    atext('Re', 540, 560, T.num, t, { size: 380, w: 700, col: ink, track: -.04, blur: 22, scale0: 1.14, dur: 1 });
    atext('число Рейнольдса', 540, 655, T.rey, t, { size: 60, w: 600, col: sub, track: -.015 });
  },

  sfx(add) {
    const T = TT();
    add(.05, 'bloom', .35, .8);
    add(T.med, 'swell', .25, .7);
    add(T.per, 'click', .3, .8);
    add(T.gr + .05, 'thud', .45, .7);
    add(T.ras, 'shimmer', .2, 1.1);
    add(T.men - 1.5, 'riser', .22);
    add(T.men, 'impact', .4, .9);
    add(T.num, 'chime', .35, .9);
  },
});
