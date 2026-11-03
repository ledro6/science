// INERTIA (14.17 – 29.29 с), светлый фон. Модель «руки с гантелями»: алюминиевая ось на подставке,
// графитовая штанга и два чёрных керамических груза, всё вращается.
// i1 — формула собирается по словам: «L» → «=» → «m» (грузы проявляются, подпись m) → «r²» (орбита грузов
//      и размерная линия r) → «ω» (стрелка вращения).
// i2 — «лёд почти не тормозит»: стрелка вращения дорисовывается полным кругом; под формулой «L = const».
// i3 — грузы съезжают к оси, орбита и r сжимаются, «r²» в формуле уменьшается, «ω» растёт; на «обязана» — красное «×3».
// Вращение честное: ω = L / (I₀ + 2·m·r²), r: 1 → 0,45 ⇒ ω растёт ровно втрое.
import { defineScene, makeStage, project, atext, measure, P, Wd, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { rod } from '../../../models.mjs';
import { ctx, spinAngle, frame, ring3, dim, spinArrow, bump } from './kit.mjs';

const HUB = 1.25, R0 = 1, R1 = .45, I0 = .3925, W0 = .42;     // I0 подобран так, что (I0+2·1²)/(I0+2·0,45²) = 3
const LC = W0 * (I0 + 2 * R0 * R0);

function TT() {
  return {
    mom: Wd('i1', 'Момент'), skl: Wd('i1', 'складывается'), mas: Wd('i1', 'массы'), kv: Wd('i1', 'квадрата'),
    ras: Wd('i1', 'расстояния'), osi: Wd('i1', 'оси'), sk: Wd('i1', 'скорости'), vr: Wd('i1', 'вращения'),
    led: Wd('i2', 'лёд'), torm: Wd('i2', 'тормозит'), proiz: Wd('i2', 'произведение'), men: Wd('i2', 'меняется'),
    ruki: Wd('i3', 'Руки'), bl: Wd('i3', 'ближе'), mensh: Wd('i3', 'меньше'), mn: Wd('i3', 'множитель'),
    sk2: Wd('i3', 'скорость'), ob: Wd('i3', 'обязана'), vyr: Wd('i3', 'вырасти'),
  };
}
const rAt = (t, T) => lerp(R0, R1, P(t, T.bl - .1, 1.4, eInOut));
const omegaAt = (t, T, s) => P(t, s.start + .2, 1.6, eInOut) * LC / (I0 + 2 * rAt(t, T) ** 2);

defineScene('inertia', {
  setup(s) {
    const stage = makeStage({ bg: 'white', shadow: .38 });
    const T = TT();
    const alu = MAT.aluminium(), gra = MAT.graphite(), blk = MAT.ceramicBlack();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .54, .08, 64), alu); base.position.y = .04;
    const axis = rod(alu, .03, 20); axis.set([0, .08, 0], [0, 1.9, 0]);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.05, 24, 16), alu); cap.position.y = 1.92;
    const spin = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .16, 32), gra); hub.position.y = HUB;
    const bar = rod(gra, .02, 14); bar.set([-1.16, HUB, 0], [1.16, HUB, 0]);
    const wGeo = new THREE.SphereGeometry(.15, 40, 28);
    const weights = [1, -1].map(sd => { const m = new THREE.Mesh(wGeo, blk); spin.add(m); return { m, sd }; });
    spin.add(hub, bar);
    stage.root.add(base, axis, cap, spin);
    stage.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { stage, T, spin, weights, om: t => omegaAt(t, T, s) };
  },

  update(t, s, st) {
    const { stage, T, spin, weights, om } = st, cam = stage.camera;
    const r = rAt(t, T);
    spin.rotation.y = spinAngle(om, s.start, t) + .35;
    const wi = P(t, T.mas - .1, .7);
    weights.forEach(({ m, sd }) => { m.position.set(sd * r, HUB, 0); m.scale.setScalar(Math.max(.001, lerp(.6, 1, wi))); m.visible = wi > .01; });
    const tt = clamp((t - s.start) / (s.end - s.start));
    frame(cam, [0, 1.0, 0], lerp(10.8, 10.1, eInOut(tt)), lerp(-12, 10, tt), lerp(19, 14, tt), 540, 965);
  },

  draw2d(t, s, st) {
    const { stage, T, spin, weights, om } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const r = rAt(t, T), ang = spin.rotation.y;
    // орбита грузов и размерная линия r (в плоскости кадра — вдоль «правого» направления камеры)
    const ra = P(t, T.kv - .05, .6) * (1 - .55 * P(t, T.led, .6) + .55 * P(t, T.ruki - .2, .5));
    ring3(cam, r, HUB, { col: ink, a: .32 * ra, lw: 2, dash: [6, 9] });
    const e = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).setY(0).normalize();
    const [hx, hy] = project(cam, 0, HUB, 0), [ex, ey] = project(cam, e.x * r, HUB, e.z * r);
    const dy = 120, pd = P(t, T.ras - .05, .6, eInOut);
    const da = pd * (1 - .55 * P(t, T.led, .6) + .55 * P(t, T.ruki - .2, .5));
    dim(hx, hy + dy, lerp(hx, ex, pd), ey + dy, da, ink, 12, 2.5);
    atext('r', (hx + ex) / 2, hy + dy - 24, T.ras + .1, t, { size: 66, w: 600, col: ink, a: da, track: 0, dy: 14 });
    // подпись m у груза (следует за ним)
    const w0 = weights[0].m.position.clone().applyMatrix4(spin.matrixWorld);
    const [mx, my] = project(cam, w0.x, w0.y, w0.z);
    atext('m', mx, my - 62, T.mas + .05, t, { size: 64, w: 600, col: ink, track: 0, dy: 14, out: T.kv + .6 });
    // стрелка вращения над штангой и ω
    const pa = P(t, T.sk - .05, .7, eInOut), full = P(t, T.torm - .1, 1.3, eInOut);
    spinArrow(cam, .42, 1.72, -.6, -lerp(2.4, 5.6, full), pa, ink, .85, 3);
    const [ox, oy] = project(cam, -.62, 1.72, 0);
    atext('ω', ox - 22, oy - 10, T.sk + .1, t, { size: 66, w: 600, col: ink, track: 0, dy: 14, out: T.ruki - .3 });
    // формула: L = m · r² · ω — токены с собственным масштабом, строка перестраивается по ширине
    const kR = lerp(1, .62, P(t, T.mensh - .05, .8, eInOut)), kW = lerp(1, 1.45, P(t, T.sk2 - .05, .8, eInOut));
    const hiM = bump(t, T.mas + .3, .5), hiR = bump(t, T.kv + .3, .5), hiW = bump(t, T.sk + .3, .5);
    const toks = [
      ['L', T.mom - .05, 1], [' = ', T.skl, 1], ['m', T.mas - .05, 1 + .08 * hiM], [' · ', T.kv - .1, 1],
      ['r²', T.kv - .05, kR * (1 + .08 * hiR)], [' · ', T.sk - .1, 1], ['ω', T.sk - .05, kW * (1 + .08 * hiW)],
    ];
    const SZ = 128, Y = 390;
    const ws = toks.map(([q, , k]) => measure(q, SZ, 600, -.02) * k);
    let x = 540 - ws.reduce((A, B) => A + B, 0) / 2;
    toks.forEach(([q, t0, k], i) => {
      g.save(); g.translate(x, Y); g.scale(k, k);
      atext(q, 0, 0, t0, t, { size: SZ, w: 600, col: ink, align: 'left', track: -.02 });
      g.restore(); x += ws[i];
    });
    // скобка «произведение» и L = const
    const br = P(t, T.proiz - .05, .6, eInOut) * (1 - P(t, T.ruki - .3, .4, eIn));
    if (br > .003) {
      const x0 = 540 - ws.reduce((A, B) => A + B, 0) / 2 + ws[0] + ws[1], x1 = x0 + ws.slice(2).reduce((A, B) => A + B, 0);
      g.save(); g.globalAlpha = br * .6; g.strokeStyle = ink; g.lineWidth = 2.5; g.lineCap = 'round';
      const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2 * br;
      g.beginPath(); g.moveTo(cx - hw, Y + 36); g.lineTo(cx - hw, Y + 48); g.lineTo(cx + hw, Y + 48); g.lineTo(cx + hw, Y + 36); g.stroke(); g.restore();
    }
    atext('L = const', 540, 528, T.men - .15, t, { size: 62, w: 500, col: sub, track: -.01, out: T.ob - .3 });
    // главный акцент: ω ×3
    atext('×3', 540, 560, T.ob - .05, t, { size: 170, w: 700, col: stage.accent, track: -.045, blur: 20, scale0: 1.12, dur: .9 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .25, 'thud', .22, .8);
    add(T.mom, 'tick', .12, 1);
    add(T.mas, 'pop', .16, .8);
    add(T.kv, 'tick', .12, 1.1);
    add(T.sk, 'whoosh', .18, 1.1);
    add(T.men, 'click', .2, .9);
    add(T.bl, 'whoosh', .26, .9);
    add(T.bl + 1.35, 'click', .26, .85);
    add(T.ob - 1.5, 'riser', .18);
    add(T.ob, 'impact', .32, 1);
  },
});
