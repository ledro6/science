// SCALLOP (25.1 – 35.1 с), чёрный фон.
// Керамический гребешок (две рифлёные створки на шарнире) хлопает: быстро закрыть — рывок вперёд,
// медленно открыть — ровно столько же назад. При малых Re путь зависит только от формы, не от скорости,
// поэтому снизу «самописец» рисует трек: x во времени, лента ползёт вниз — зигзаг всё время между теми же
// двумя отметками, пунктир «старт» не сдвигается. c1 — «Вперёд-назад» → «0»; c2 — «быстро / медленно»,
// затем «Теорема о гребешке».
import { defineScene, makeStage, project, atext, atextWords, line, dot, P, Wd, C, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn, rng } from '../../../engine.mjs';
import { frame, TAU } from './_kit.mjs';
import { ctx } from './_draw.mjs';

const AMAX = .62, AMIN = .04, PER = 1.8, CL = .26, D = .62, X0 = -.3;

function TT() {
  return {
    gr: Wd('c1', 'грести'), vn: Wd('c1', 'вперёд-назад'), bes: Wd('c1', 'бесполезно'),
    kazh: Wd('c2', 'Каждый'), otk: Wd('c2', 'откатывает'), obr: Wd('c2', 'обратно'), eto: Wd('c2', 'Это'), teo: Wd('c2', 'теоремой'),
  };
}
// угол створки и положение: x — функция только формы (угла), поэтому каждый цикл возвращает в X0
function stateAt(t, T) {
  const t0 = T.gr - .1;
  if (t < t0) return { a: AMAX, x: X0, closing: false };
  const u = (t - t0) / PER, f = u - Math.floor(u);
  let a, closing;
  if (f < CL) { a = lerp(AMAX, AMIN, eInOut(f / CL)); closing = true; }
  else { a = lerp(AMIN, AMAX, eInOut((f - CL) / (1 - CL))); closing = false; }
  return { a, x: X0 + D * (AMAX - a) / (AMAX - AMIN), closing };
}

// створка: сферический купол с радиальными рёбрами, край — на y = 0, шарнир — в x = 0 (купол вытянут в +X)
function valveGeometry() {
  const th = 1.0, geo = new THREE.SphereGeometry(1, 96, 24, 0, TAU, 0, th);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const phi = Math.atan2(v.z, v.x), rr = Math.hypot(v.x, v.z);
    const k = 1 + .07 * Math.pow(Math.abs(Math.cos(phi * 9)), .6) * (rr / Math.sin(th));
    v.set(v.x * k, v.y, v.z * k); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.translate(0, -Math.cos(th), 0);
  geo.scale(1, .55, .95);
  geo.translate(Math.sin(th), 0, 0);
  geo.computeVertexNormals();
  return geo;
}

defineScene('scallop', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.floor.visible = false;
    const T = TT();
    const mat = MAT.ceramicWhite(); mat.side = THREE.DoubleSide; mat.color.set('#E4E4E1'); mat.roughness = .5;
    const inner = new THREE.MeshPhysicalMaterial({ color: '#D9D9D6', roughness: .55, side: THREE.DoubleSide });
    const geo = valveGeometry();
    const shell = new THREE.Group(); stage.root.add(shell);
    const top = new THREE.Group(), bot = new THREE.Group();
    const vt = new THREE.Mesh(geo, mat), vb = new THREE.Mesh(geo, mat);
    vb.rotation.x = Math.PI;     // нижняя створка — перевёрнутая (нормали остаются верными)
    top.add(vt); bot.add(vb);
    // «ушки» у шарнира
    const earGeo = new THREE.BoxGeometry(.22, .035, .7);
    const ear = new THREE.Mesh(earGeo, mat); ear.position.set(.02, .0, 0); bot.add(ear);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .5, 20), inner); hinge.rotation.x = Math.PI / 2;
    shell.add(top, bot, hinge);
    shell.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // взвесь в воде
    const N = 120, R = rng(16);
    const motes = new THREE.InstancedMesh(new THREE.SphereGeometry(.014, 8, 6), new THREE.MeshBasicMaterial({ color: '#8E8E93', transparent: true, opacity: .5 }), N);
    const M = new THREE.Matrix4();
    for (let i = 0; i < N; i++) { const s = .6 + R() * 1.2; M.makeScale(s, s, s).setPosition(-5 + R() * 10, -3 + R() * 6, -5 + R() * 6); motes.setMatrixAt(i, M); }
    stage.root.add(motes);
    return { stage, T, shell, top, bot };
  },

  update(t, s, st) {
    const { stage, T, shell, top, bot } = st, cam = stage.camera, L = stage.lights;
    const { a, x } = stateAt(t, T);
    shell.position.set(x, 0, 0);
    shell.rotation.set(0, 0, 0);
    top.rotation.z = a * .78; bot.rotation.z = -a * .22;
    const lit = P(t, s.start, 1.2, eApple);
    L.rimL.intensity = 2.6 * lit; L.rimR.intensity = 1.8 * lit; L.key.intensity = 1.7 * lit; L.hemi.intensity = .25 * lit;
    L.key.castShadow = false;
    L.key.position.set(lerp(-5, 5, clamp((t - s.start) / 8)), 8, 6);
    // камера: 3/4 сверху-сбоку, медленная орбита
    const p = clamp((t - s.start) / (s.end - s.start));
    frame(cam, [X0 + .5 * D + .7, .15, 0], 12, lerp(-24, -8, p), lerp(20, 14, p), 540, 760);
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    // --- самописец: x(t) во времени, лента ползёт вниз ---
    const ta = P(t, T.gr - .2, .8) * (1 - P(t, s.end - .45, .3, eIn));
    const Y0 = 990, VY = 115, HIST = 2.7;
    const sx = xx => { const q = project(cam, xx + .9, 0, 0), q0 = project(cam, X0 + .9, 0, 0); return 470 + (q[0] - q0[0]) * 1.6; };
    if (ta > .003) {
      const xs = sx(X0), xf = sx(X0 + D);
      // отметки: старт (пунктир) и максимум вперёд
      line(xs, Y0 - 20, xs, Y0 + HIST * VY, ink, ta * .55, 2, [8, 9]);
      line(xf, Y0 - 20, xf, Y0 + HIST * VY, sub, ta * .3, 1.5, [3, 9]);
      atext('старт', xs, Y0 - 34, T.gr, t, { size: 32, w: 500, col: sub, track: 0, dy: 10, a: ta });
      // трек
      g.save(); g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
      const tStart = T.gr - .1, N = 120;
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const tt = t - HIST * i / N; if (tt < tStart) break;
        const q = [sx(stateAt(tt, T).x), Y0 + (t - tt) * VY];
        if (prev) { g.globalAlpha = ta * .9 * (1 - i / N); g.strokeStyle = ink; g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); }
        prev = q;
      }
      g.restore();
      dot(sx(stateAt(t, T).x), Y0, 8, ink, ta);
    }
    // --- тексты ---
    atext('Вперёд-назад', 540, 330, T.vn, t, { size: 100, w: 600, col: ink, track: -.03, out: T.bes - .3 });
    atext('0', 540, 410, T.bes, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.kazh + .2 });
    atext('итоговый путь', 540, 480, T.bes + .3, t, { size: 46, w: 500, col: sub, track: -.005, out: T.kazh + .2 });
    // c2: подписи фаз над раковиной
    const st2 = stateAt(t, T), la = P(t, T.kazh + .5, .5) * (1 - P(t, T.eto - .2, .3, eIn));
    if (la > .003) {
      const fastA = st2.closing ? 1 : .3;
      atext('быстро →', 600, 400, T.kazh + .5, t, { size: 60, w: 600, col: ink, align: 'left', track: -.02, dy: 16, a: la * fastA });
      atext('← медленно', 480, 400, T.kazh + .5, t, { size: 60, w: 600, col: ink, align: 'right', track: -.02, dy: 16, a: la * (1.3 - fastA) });
    }
    atextWords('Теорема о гребешке', 540, 400, T.teo, t, { size: 96, w: 600, col: ink, track: -.03, stagger: .25 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .1, 'bloom', .3, .8);
    // мягкий щелчок на каждом захлопывании
    for (let tt = T.gr - .1 + CL * PER * .9; tt < s.end - .3; tt += PER) add(tt, 'click', .18, .8);
    add(T.bes, 'thud', .35, .7);
    add(T.teo, 'chime', .3, .9);
  },
});
