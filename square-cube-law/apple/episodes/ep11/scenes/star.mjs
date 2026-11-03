// STAR (35.48 – 46.86 с), светлый фон, без пола (космос как студия).
// s1 — «Так же раскручиваются звёзды»: крупная графитовая звезда с полосами-меридианами медленно вращается.
//      «Ядро»: оболочка звезды становится стеклом, внутри видно чёрное ядро. «сжатое»: ядро сжимается в маленький шар,
//      оболочка схлопывается и тает, на месте прежнего размера остаётся серый пунктир; вращение разгоняется (ω ∝ 1/R²,
//      показано замедленно — сноска). «двадцати километров»: размерная линия «≈ 20 км». «сотни раз в секунду».
// s2 — пульсар: из ядра по наклонной магнитной оси выходят два луча и метут пространство; счётчик «716 оборотов в секунду».
import { defineScene, makeStage, project, atext, acount, P, Wd, THREE, MAT, clamp, lerp, eApple, eIn, eInOut } from '../../../engine.mjs';
import { ctx, spinAngle, frame, dim, circle, TAU } from './kit.mjs';

const RS = 1.25, RC0 = .5, RC1 = .14;
function TT() {
  return {
    tak: Wd('s1', 'Так'), rask: Wd('s1', 'раскручиваются'), zv: Wd('s1', 'звёзды'), yad: Wd('s1', 'Ядро'), szh: Wd('s1', 'сжатое'),
    dv: Wd('s1', 'двадцати'), km: Wd('s1', 'километров'), vr: Wd('s1', 'вращается'), sot: Wd('s1', 'сотни'), sek: Wd('s1', 'секунду'),
    sam: Wd('s2', 'Самый'), puls: Wd('s2', 'пульсар'), sem: Wd('s2', 'семьсот'), ob: Wd('s2', 'оборотов'),
  };
}
const glassAt = (t, T) => P(t, T.yad - .1, .8);                      // оболочка → стекло
const shrinkAt = (t, T) => P(t, T.szh - .05, 1.5, eInOut);           // сжатие ядра
const coreR = (t, T) => lerp(RC0, RC1, shrinkAt(t, T));
// ω (об/с, на экране): звезда разгоняется на «раскручиваются», ядро — по сохранению L (ω ∝ 1/R²), с потолком
const omegaAt = (t, T) => {
  const w0 = lerp(.08, .16, P(t, T.rask, 1.2, eInOut));
  return Math.min(w0 * (RC0 / coreR(t, T)) ** 2, 1.9);
};

function stripeTex(seed = 3, base = 42, amp = 34) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = `rgb(${base},${base},${base + 2})`; g.fillRect(0, 0, 512, 256);
  let s = seed >>> 0; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  // меридианные полосы разной ширины + пятна: поворот читается при любом ракурсе
  for (let i = 0; i < 14; i++) {
    const x = i * 512 / 14 + R() * 10, w = 8 + R() * 22, v = base + amp * (.4 + .6 * R());
    g.fillStyle = `rgba(${v | 0},${v | 0},${(v + 2) | 0},.9)`; g.fillRect(x, 0, w, 256);
  }
  for (let i = 0; i < 26; i++) {
    const v = base + amp * 1.3 * R();
    g.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},.8)`;
    g.beginPath(); g.ellipse(R() * 512, 40 + R() * 176, 6 + R() * 22, 4 + R() * 12, 0, 0, TAU); g.fill();
  }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping;
  return tx;
}
function beamTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  // alphaMap читает яркость: у ядра (низ текстуры) — светло, к концу луча — в чёрный
  gr.addColorStop(0, '#000'); gr.addColorStop(.5, '#2a2a2a'); gr.addColorStop(.85, '#9a9a9a'); gr.addColorStop(1, '#fff');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

defineScene('star', {
  setup() {
    const stage = makeStage({ bg: 'white' });
    stage.floor.visible = false;
    const T = TT();
    const spin = new THREE.Group();
    // звезда: графит с полосами; на «Ядро» становится прозрачной оболочкой
    const starMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: stripeTex(5, 60, 40), roughness: .5, clearcoat: .4, transparent: true });
    const star = new THREE.Mesh(new THREE.SphereGeometry(RS, 48, 32), starMat);
    const shellMat = MAT.glass(.16); shellMat.color.set('#D2D2D7');
    const shell = new THREE.Mesh(new THREE.SphereGeometry(RS, 48, 32), shellMat);
    const coreMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: stripeTex(9, 20, 46), roughness: .28, clearcoat: 1, clearcoatRoughness: .12 });
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), coreMat);
    // лучи пульсара: два конуса вдоль магнитной оси, наклонённой к оси вращения
    const tilt = new THREE.Group(); tilt.rotation.z = .62;
    const bTex = beamTex(), beams = [];
    for (const sd of [1, -1]) {
      const geo = new THREE.CylinderGeometry(.24, .025, 1.35, 40, 1, true); geo.translate(0, .675 + .1, 0);
      const m = new THREE.MeshBasicMaterial({ color: '#1D1D1F', alphaMap: bTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const b = new THREE.Mesh(geo, m); if (sd < 0) b.rotation.z = Math.PI;
      tilt.add(b); beams.push(b);
    }
    spin.add(star, core, tilt);
    stage.root.add(spin, shell);
    return { stage, T, spin, star, starMat, shell, shellMat, core, beams, om: t => omegaAt(t, T) };
  },

  update(t, s, st) {
    const { stage, T, spin, star, starMat, shell, shellMat, core, beams, om } = st, cam = stage.camera, L = stage.lights;
    L.key.position.set(-4, 6, 7); L.key.intensity = 2.4; L.rimL.intensity = 1.6; L.rimR.intensity = 1.4;
    spin.rotation.set(.12, spinAngle(om, s.start, t), 0);
    const gl = glassAt(t, T), sh = shrinkAt(t, T);
    // звезда: проявление → растворение в стекло
    const sin = P(t, s.start + .1, 1.0);
    starMat.opacity = sin * (1 - gl); star.visible = starMat.opacity > .004;
    star.scale.setScalar(lerp(.96, 1, sin));
    // стеклянная оболочка схлопывается вслед за ядром и тает
    const rs = lerp(RS, coreR(t, T) * 1.6, sh);
    shell.scale.setScalar(rs / RS);
    shellMat.opacity = .16 * gl * (1 - P(t, T.szh + .6, .9));
    shell.visible = shellMat.opacity > .004;
    core.scale.setScalar(coreR(t, T));
    core.visible = gl > .01;
    // лучи
    const bA = P(t, T.sam - .1, .9) * .3;
    beams.forEach(b => { b.material.opacity = bA; b.visible = bA > .004; b.scale.set(1, lerp(.4, 1, P(t, T.sam - .1, 1.2)), 1); });
    // камера: общий план → наезд на маленькое ядро
    const z = P(t, T.szh + .2, 2.0, eInOut);
    frame(cam, [0, 0, 0], lerp(13.5, 6.8, z) - .15 * (t - s.start) * (1 - z), -8 + (t - s.start) * 1.2, lerp(6, 10, z), 540, lerp(930, 960, z));
  },

  draw2d(t, s, st) {
    const { stage, T } = st, cam = stage.camera;
    const ink = stage.ink, sub = stage.sub;
    const [cx, cy] = project(cam, 0, 0, 0);
    const pxPerU = (project(cam, 0, 1, 0)[1] - cy) * -1;     // приближённо: экранный размер единицы у центра
    // пунктир прежнего размера
    const ga = P(t, T.szh + .2, .6) * (1 - P(t, T.km, .6, eIn));
    circle(cx, cy, RS * pxPerU, sub, .55 * ga, 2, [7, 10]);
    // ≈ 20 км: размерная линия под ядром
    const rc = coreR(t, T) * pxPerU, dA = P(t, T.dv - .1, .5) * (1 - P(t, T.sam - .3, .4, eIn));
    const y = cy + rc + 56;
    dim(cx - rc, y, cx + rc, y, dA, ink, 12, 2.5);
    atext('≈ 20 км', cx, y + 74, T.dv, t, { size: 60, w: 600, col: ink, track: -.01, out: T.sam - .3 });
    // сотни оборотов в секунду
    const oS = T.sam - .25;
    atext('сотни', 540, 440, T.sot - .05, t, { size: 190, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: oS });
    atext('оборотов в секунду', 540, 520, T.sot + .2, t, { size: 48, w: 500, col: sub, track: -.005, out: oS });
    // s2: пульсар
    atext('Самый быстрый пульсар', 540, 300, T.sam - .05, t, { size: 54, w: 500, col: sub, track: -.005 });
    acount(716, 540, 505, T.sem - .05, t, { size: 240, w: 700, col: ink, dur: 1.3 });
    atext('оборотов в секунду', 540, 580, T.ob - .1, t, { size: 48, w: 500, col: sub, track: -.005 });
    atext('вращение на экране замедлено', 540, 1290, T.vr, t, { size: 28, w: 500, col: sub, a: .75, track: 0, dy: 10 });
  },

  sfx(add, s) {
    const T = TT();
    add(s.start + .3, 'swell', .22, .7);
    add(T.yad, 'shimmer', .16, .9);
    add(T.szh, 'whoosh', .3, .7);
    add(T.szh + 1.45, 'thud', .26, .7);
    add(T.dv, 'tick', .14, 1.1);
    add(T.sot, 'chime', .22, .9);
    add(T.sam, 'bloom', .26, 1.0);
    add(T.sem, 'chime', .26, 1.05);
  },
});
