// COMB (9.3 – 21.9 с), белый фон.
// c1 — керамический шар проявляется, из поверхности вырастают графитовые волоски (InstancedMesh, 2600 шт.);
//      «пригладить их все»: дуговой алюминиевый гребень проходит по шару слева направо, волоски за ним
//      ложатся касательно (поле с единственным нулём — стереографический перенос постоянного поля);
// c2 — «не выйдет»: шар поворачивается, сзади-сверху видна макушка, где волоски торчат (красная точка);
//      вторая попытка: гребень проходит ещё раз — макушка переползает, но не исчезает (пунктир её пути);
//      «макушка» — выноска, макро-наезд в вихор.
import { defineScene, makeStage, project, atext, line, dot, P, Wd, E, THREE, MAT, clamp, lerp, eApple, eInOut, eIn } from '../../../engine.mjs';
import { ctx, bump } from './_kit.mjs';
import {
  fibSphere, frameOf, dipole, makeHairs, fluffDirs, combDir, mixDir, slerp3, norm3, scl3, smooth, rand, frame, TAU,
} from './_hair.mjs';

const R = 1, CY = 1.2, N = 2600, HL = .2;
const POLE_A = norm3([0, .6, -.8]);             // макушка после первой попытки (сзади-сверху, её не видно)
const POLE_B = norm3([.7, .464, -.539]);        // куда она переползает во второй попытке
const HINT = [1, 0, 0];
const TUMBLE = 100 * Math.PI / 180;             // поворот шара вокруг X, чтобы показать макушку

function TT() {
  return {
    shar: Wd('c1', 'шар'), pokr: Wd('c1', 'покрытый'), vol: Wd('c1', 'волосками'),
    pop: Wd('c1', 'Попробуй'), prig: Wd('c1', 'пригладить'), bez: Wd('c1', 'без'), vih: Wd('c1', 'вихров'), end1: E('c1'),
    ne: Wd('c2', 'Не'), vyi: Wd('c2', 'выйдет'), gde: Wd('c2', 'Где-то'), obyaz: Wd('c2', 'обязательно'), ost: Wd('c2', 'останется'),
    mak: Wd('c2', 'макушка'), toch: Wd('c2', 'точка'), vol2: Wd('c2', 'волосок'), lezh: Wd('c2', 'лежит'),
  };
}
// гребень 1: азимут дуги (рад) во времени
const sweep1 = (t, T) => lerp(-1.75, 1.75, eInOut(clamp((t - T.prig + .25) / 2.3)));
// вторая попытка: прогресс переползания макушки и азимут гребня
const crawl = (t, T) => eInOut(clamp((t - T.gde + .05) / 1.6));
const sweep2 = (t, T) => lerp(-1.05, .62, crawl(t, T));

// подложка цвета фона сверху кадра (подпись поверх меха читается)
function topScrim(a) {
  const g = ctx(); g.save(); g.globalAlpha = a;
  const gr = g.createLinearGradient(0, 0, 0, 520);
  gr.addColorStop(0, 'rgba(245,245,247,1)'); gr.addColorStop(.7, 'rgba(245,245,247,.92)'); gr.addColorStop(1, 'rgba(245,245,247,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 1080, 520); g.restore();
}
function makeComb() {
  const grp = new THREE.Group();
  const mat = MAT.aluminium(); mat.transparent = true;
  const ARC = 150 * Math.PI / 180, RS = 1.36;
  const spineGeo = new THREE.TorusGeometry(RS, .035, 10, 64, ARC); spineGeo.rotateZ(-ARC / 2);
  const spine = new THREE.Mesh(spineGeo, mat);
  const nT = 34, teeth = new THREE.InstancedMesh(new THREE.CylinderGeometry(.006, .013, 1, 6), mat, nT);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < nT; i++) {
    const a = -ARC / 2 + ARC * (i + .5) / nT, d = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    Q.setFromUnitVectors(UP, d.clone().negate());
    const r0 = RS - .02, r1 = 1.1, mid = (r0 + r1) / 2;
    M.compose(d.clone().multiplyScalar(mid), Q, new THREE.Vector3(1, r0 - r1, 1)); teeth.setMatrixAt(i, M);
  }
  grp.add(spine, teeth);
  return { grp, mat };
}

defineScene('comb', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    const ballG = new THREE.Group(); ballG.position.y = CY;
    const ballMat = MAT.ceramicWhite();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 36), ballMat);
    const hairMat = new THREE.MeshStandardMaterial({ color: '#47474B', roughness: .5, metalness: .1 });
    const hairs = makeHairs(THREE, { n: N, mat: hairMat, r0: .0095, r1: .003 });
    ballG.add(ball, hairs);
    const pts = fibSphere(N, 21), fluff = fluffDirs(pts, 4, .6), Rn = rand(31);
    const H = pts.map((p, i) => ({ p, f: fluff[i], l: HL * (.8 + .4 * Rn()), az: Math.atan2(p[0], p[2]), j: (Rn() - .5) * .12, g: Rn() }));
    const comb = makeComb(); comb.grp.position.y = CY;
    stage.root.add(ballG, comb.grp);
    return { stage, ballG, ball, ballMat, hairs, H, comb, T: TT() };
  },

  update(t, s, st) {
    const { stage, ballG, hairs, H, comb, T } = st, cam = stage.camera, L = stage.lights;
    L.key.castShadow = false;
    // шар выходит «из белого»: масштаб и проявление
    const inK = P(t, s.start + .1, 1.2, eApple);
    ballG.scale.setScalar(lerp(.9, 1, inK));
    // поворот шара (показать макушку)
    const tum = P(t, T.ne - .1, 1.5, eInOut) * TUMBLE;
    ballG.rotation.set(tum, lerp(-.25, 0, inK) + .04 * (t - s.start), 0);
    // поле: полюс A, во второй попытке переползает в B
    const cr = crawl(t, T), pole = norm3(slerp3(POLE_A, POLE_B, cr)), F = frameOf(pole, HINT);
    st.pole = pole;
    const a1 = sweep1(t, T), fin = P(t, T.bez + .3, .8);
    H.forEach((h, i) => {
      const grow = P(t, T.pokr - .15 + .7 * (1 - (h.p[1] + 1) / 2) + .25 * h.g, .7, eApple);
      const { v, d } = dipole(h.p, F, 1.15, .75);
      const phi = 1.27 * smooth(.03, .45, d) + h.j;
      const kc = Math.max(clamp((a1 - h.az) / .45), fin * (Math.abs(h.az) > 1.6 ? 1 : 0));
      const dir = mixDir(h.f, combDir(h.p, v, phi), eApple(kc));
      const ln = h.l * grow * (1 + .3 * (1 - smooth(0, .35, d)) * kc);
      hairs.setHair(i, scl3(h.p, R * .992), dir, ln, 1);
    });
    hairs.instanceMatrix.needsUpdate = true;
    // гребень: 1-я попытка (шар не повёрнут) и 2-я (через зону макушки)
    const c1 = P(t, T.prig - .3, .45) * (1 - P(t, T.bez + .45, .4, eIn));
    const c2 = P(t, T.gde - .35, .4) * (1 - P(t, T.ost + .45, .4, eIn));
    const useB = t > T.vyi;
    const ca = useB ? sweep2(t, T) : a1, ck = useB ? c2 : c1;
    comb.grp.visible = ck > .003; comb.mat.opacity = ck;
    comb.grp.rotation.set(0, ca - Math.PI / 2, 0, 'YXZ');
    if (useB) comb.grp.rotation.x = .55;                 // во 2-й попытке дуга наклонена к верху шара
    // камера: общий план → макро на макушку
    const macro = P(t, T.mak - .2, 1.6, eInOut);
    const pw = new THREE.Vector3(...scl3(pole, R)); ballG.updateMatrixWorld(true); ballG.localToWorld(pw);
    const tg = [lerp(0, pw.x, macro), lerp(CY, pw.y, macro), lerp(0, pw.z, macro)];
    const az = lerp(14 - 1.2 * (t - s.start), 35, macro), el = lerp(13, 30, macro);
    frame(cam, tg, lerp(11.8, 6.6, macro), az, el, 540, lerp(900, 980, macro));
  },

  draw2d(t, s, st) {
    const { stage, T, ballG, pole } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub, red = stage.accent;
    // c1: подпись-эйбрау
    atext('Пригладить все', 540, 315, T.prig, t, { size: 96, w: 600, col: ink, track: -.03, out: T.ne - .2 });
    atext('без проборов и вихров', 540, 380, T.bez, t, { size: 46, w: 500, col: sub, track: -.005, out: T.ne - .2 });
    // c2: «Не выйдет»
    atext('Не выйдет', 540, 320, T.vyi - .05, t, { size: 112, w: 600, col: ink, track: -.03, out: T.mak - .3 });
    // макушка: красная точка там, где волоски торчат
    ballG.updateMatrixWorld(true);
    const W = p => { const v = new THREE.Vector3(...scl3(p, R * 1.03)); ballG.localToWorld(v); return v; };
    const pw = W(pole), cp = cam.position;
    const n = pw.clone().sub(ballG.position).normalize(), face = clamp((cp.clone().sub(pw).normalize().dot(n) - .15) / .3);
    const dA = P(t, T.vyi + .45, .5) * face;
    if (dA > .003) {
      // путь макушки во второй попытке — пунктир
      const cr = crawl(t, T);
      if (cr > .01) {
        g.save(); g.globalAlpha = .7 * dA * (1 - P(t, T.mak + .5, .5, eIn)); g.strokeStyle = sub; g.lineWidth = 3; g.setLineDash([2, 12]); g.lineCap = 'round';
        g.beginPath();
        for (let i = 0; i <= 30; i++) { const q = W(norm3(slerp3(POLE_A, POLE_B, cr * i / 30))), [x, y] = project(cam, q.x, q.y, q.z); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); g.restore();
        const q0 = W(POLE_A), [x0, y0] = project(cam, q0.x, q0.y, q0.z);
        dot(x0, y0, 6, sub, .7 * dA * (1 - P(t, T.mak + .5, .5, eIn)));
      }
      const [x, y] = project(cam, pw.x, pw.y, pw.z);
      dot(x, y, 12 * dA * (1 + .25 * bump(t, T.mak, .35)), red, dA);
      // выноска «макушка»: подпись наверху кадра на мягкой подложке, линия от точки
      const ca = P(t, T.mak - .1, .5);
      if (ca > .003) {
        topScrim(ca * .92);
        // низ кадра под субтитрами — тоже мягко «в бумагу»
        g.save(); g.globalAlpha = ca * .9; const gb = g.createLinearGradient(0, 1180, 0, 1400);
        gb.addColorStop(0, 'rgba(245,245,247,0)'); gb.addColorStop(1, 'rgba(245,245,247,1)');
        g.fillStyle = gb; g.fillRect(0, 1180, 1080, 740); g.restore();
        const lx = 540, ly = 330, pl = P(t, T.mak + .05, .45, eApple);
        line(x, y - 14, lerp(x, lx, pl), lerp(y - 14, ly + 90, pl), ink, .7 * ca, 2);
        atext('макушка', lx, ly, T.mak + .15, t, { size: 96, w: 600, col: ink, track: -.03 });
        atext('волосок не лежит', lx, ly + 62, T.vol2 - .1, t, { size: 44, w: 500, col: sub, track: -.005 });
      }
    }
  },

  sfx(add) {
    const T = TT();
    add(T.shar - .3, 'bloom', .3, .8);
    add(T.pokr, 'shimmer', .22, 1.1);
    add(T.prig - .2, 'whoosh', .3, .8);
    add(T.ne - .05, 'thud', .3, .7);
    add(T.vyi + .45, 'tick', .25);
    add(T.gde - .2, 'whoosh', .25, .9);
    add(T.mak - 1.5, 'riser', .18);
    add(T.mak, 'chime', .3, .9);
  },
});
