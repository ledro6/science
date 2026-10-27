// Сцена «Тепло» (54.4–69.1 с), белый фон.
// h1: графитовый куб в срезе — ядро светится (тепло рождается в объёме), от граней уходят тонкие лучи (уходит через поверхность).
// h2: крошечная землеройка в монохромном кольце Activity, плотное «облако» уходящих линий, огромная цифра «≈100 %».
// h3: слон обмахивается ушами, от ушей — тонкие волны; наезд на огромное ухо с выноской.
import {
  defineScene, makeStage, orbit, project, atext, atextWords, acount, line, dot, callout,
  P, Wd, WdE, C, E, rng, clamp, lerp, eApple, eIn, eInOut, eEase, eExpo,
  THREE, MAT, roundedBox, shadowsOn, W, H, C_INK, C_PAPER, g,
} from '../engine.mjs';
import { makeMouse, makeElephant } from '../models.mjs';

const SUB = '#6E6E73';
function frame(cam, target, dist, az, el, sx = 540, sy = 960) {
  orbit(cam, target, dist, az, el);
  cam.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
  cam.updateMatrixWorld();
}
const dipA = (t, at, din = .3, dout = .45) => t < at ? P(t, at - din, din, eIn) : 1 - P(t, at, dout, eEase);
function veil(col, a) { if (a <= .003) return; g.save(); g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
function label(x, y, title, sub, t0, t, o = {}) {
  const { align = 'left', out = null, size = 46, subSize = 34 } = o;
  atext(title, x, y, t0, t, { size, w: 600, col: C_INK, align, dur: .7, dy: 22, blur: 10, out, track: -.012 });
  if (sub) atext(sub, x, y + subSize * 1.4, t0 + .18, t, { size: subSize, w: 500, col: SUB, align, dur: .7, dy: 18, blur: 8, out, track: -.005 });
}
const frac = x => x - Math.floor(x);

const T = {};
function times() {
  if (T.ok) return T;
  T.title = Wd('h1', 'С');
  T.heat = Wd('h1', 'тепло', 1);
  T.born = Wd('h1', 'рождается');
  T.leaves = Wd('h1', 'уходит');
  T.surf = Wd('h1', 'поверхность');
  T.tiny = Wd('h2', 'Крошечная');
  T.shrew = Wd('h2', 'землеройка');
  T.cools = Wd('h2', 'остывает');
  T.day = Wd('h2', 'день');
  T.eats = Wd('h2', 'съедает');
  T.almost = Wd('h2', 'почти');
  T.weight = Wd('h2', 'вес');
  T.ele = Wd('h3', 'слону');
  T.hot = Wd('h3', 'жарко');
  T.fan = Wd('h3', 'обмахивается');
  T.huge = Wd('h3', 'огромными');
  T.ears = Wd('h3', 'ушами');
  T.cubeIn = T.heat - .35;
  T.H2 = C('h2') - .1;
  T.H3 = C('h3') - .1;
  T.ok = 1;
  return T;
}

const BG = new THREE.Color(C_PAPER), RAYC = new THREE.Color('#1D1D1F');

defineScene('heat', {
  setup(s) {
    times();
    const stage = makeStage({ bg: 'white', shadow: .4 });
    const { root } = stage;

    // ===== h1: куб в срезе =====
    const S = 1.8;
    const cut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1);   // оставляет z ≤ constant
    const cubeMat = MAT.graphite(); cubeMat.clippingPlanes = [cut];
    const cube = new THREE.Mesh(roundedBox(S, .08, 3), cubeMat); cube.position.y = S / 2; shadowsOn(cube);
    // крышка среза: «тепло» — свет внутри материала (радиальный градиент от тёплого белого к графиту)
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const c2 = cv.getContext('2d');
    const gr = c2.createRadialGradient(256, 256, 0, 256, 256, 330);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(.22, '#FBF8F2'); gr.addColorStop(.48, '#C9C5BE'); gr.addColorStop(.75, '#5E5C5A'); gr.addColorStop(1, '#3A3A3C');
    c2.fillStyle = gr; c2.beginPath(); c2.roundRect(0, 0, 512, 512, 512 * .08 / S); c2.fill();
    // тонкая сетка «изотерм»
    c2.strokeStyle = 'rgba(0,0,0,.08)'; c2.lineWidth = 2;
    for (let r = 50; r < 300; r += 50) { c2.beginPath(); c2.arc(256, 256, r, 0, Math.PI * 2); c2.stroke(); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const capMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(S, S), capMat); cap.position.y = S / 2;
    const h1 = new THREE.Group(); h1.add(cube, cap); root.add(h1);
    // лучи от граней (верх, ±X, задняя) — LineSegments с вершинными цветами (смешение с фоном = прозрачность)
    const NR = 170, rays = [];
    { const R = rng(21);
      for (let i = 0; i < NR; i++) {
        const f = R(), u = R() * 1.6 - .8, v = R() * .82;
        let p, n;
        if (f < .38) { p = [u, S + .005, -v]; n = [0, 1, 0]; }
        else if (f < .66) { p = [S / 2 + .005, .12 + R() * 1.56, -v]; n = [1, 0, 0]; }
        else if (f < .86) { p = [-S / 2 - .005, .12 + R() * 1.56, -v]; n = [-1, 0, 0]; }
        else { p = [u, .12 + R() * 1.56, -S / 2 - .005]; n = [0, 0, -1]; }
        rays.push({ p, n, ph: R(), len: .14 + R() * .14, sp: .5 + R() * .25 });
      } }
    const rayGeo = new THREE.BufferGeometry();
    rayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NR * 6), 3));
    rayGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NR * 6), 3));
    const rayLines = new THREE.LineSegments(rayGeo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    rayLines.frustumCulled = false; root.add(rayLines);

    // ===== h2: землеройка =====
    const mouse = makeMouse(MAT.ceramicWhite()); root.add(mouse);
    // ===== h3: слон =====
    const ele = makeElephant(MAT.ceramicWhite()); root.add(ele);
    const head = ele.children[0].children[1];
    const earL = head.children[1].children[0], earR = head.children[2].children[0];

    return { stage, S, cut, cube, cap, capMat, h1, rays, rayGeo, rayLines, mouse, ele, head, earL, earR, v: new THREE.Vector3(), c: new THREE.Color() };
  },

  update(t, s, st) {
    const T = times(), cam = st.stage.camera;
    const sub = t < T.H2 ? 1 : t < T.H3 ? 2 : 3;
    st.h1.visible = st.rayLines.visible = sub === 1;
    st.mouse.visible = sub === 2; st.ele.visible = sub === 3;

    if (sub === 1) {
      // срез открывается: плоскость отъезжает от передней грани к центру
      const op = P(t, T.cubeIn + .45, 1.3, eInOut);
      const c = lerp(.95, 0, op);
      st.cut.constant = c;
      st.cap.visible = c < .8;
      st.cap.position.z = c + .002;
      const heat = P(t, T.born - .1, 1.1, eApple);
      const breath = .03 * Math.sin((t - T.born) * 3.2);
      st.capMat.color.setScalar(clamp(lerp(.42, 1, heat) + breath * heat));
      st.capMat.opacity = P(t, T.cubeIn + .5, .4);
      st.h1.position.y = lerp(-.12, 0, P(t, T.cubeIn, 1.2, eApple));
      st.h1.rotation.y = 0;
      // лучи
      const ri = P(t, T.leaves - .15, .9, eApple);
      const pos = st.rayGeo.attributes.position.array, col = st.rayGeo.attributes.color.array;
      st.rays.forEach((r, i) => {
        const k = frac(t * r.sp + r.ph), d0 = .06 + k * 1.15, d1 = d0 + r.len;
        const a = Math.sin(Math.PI * k) * ri * (r.p[2] < c ? 1 : 0);
        for (let e = 0; e < 2; e++) {
          const d = e ? d1 : d0, o = i * 6 + e * 3;
          pos[o] = r.p[0] + r.n[0] * d; pos[o + 1] = r.p[1] + r.n[1] * d + st.h1.position.y; pos[o + 2] = r.p[2] + r.n[2] * d;
          st.c.copy(BG).lerp(RAYC, a * (e ? .45 : 1));
          col[o] = st.c.r; col[o + 1] = st.c.g; col[o + 2] = st.c.b;
        }
      });
      st.rayGeo.attributes.position.needsUpdate = true; st.rayGeo.attributes.color.needsUpdate = true;
      frame(cam, [0, .95, 0], 13.5, lerp(30, 42, P(t, T.cubeIn, 4.5, eEase)), 20, 540, 880);
    } else if (sub === 2) {
      const m = st.mouse; m.position.set(0, 0, 0); m.rotation.y = 0;
      m.pose({ wag: (t - T.H2) * 5, squash: .05 * (.5 + .5 * Math.sin((t - T.H2) * 22)) });
      frame(cam, [.12, .3, 0], 14, lerp(18, 30, P(t, T.H2, 4.6, eEase)), 14, 510, 900);
    } else {
      const e = st.ele; e.position.set(0, 0, 0); e.rotation.y = 0;
      const ramp = P(t, T.fan - .25, .8, eEase);
      const flap = Math.sin((t - T.fan) * Math.PI * 2 * 1.05) * .85 * ramp;
      e.pose({ flap, trunk: Math.sin((t - T.H3) * 1.1) * .4 });
      e.updateMatrixWorld(true);
      const ear = st.earL.getWorldPosition(st.v).toArray();
      // общий план → крупный план уха
      const k = P(t, T.huge - .1, 1.4, eInOut);
      const tg = [lerp(.4, ear[0], k), lerp(1.6, ear[1], k), lerp(0, ear[2], k)];
      const d = Math.exp(lerp(Math.log(25), Math.log(10.5), k));
      frame(cam, tg, d, lerp(lerp(66, 74, P(t, T.H3, 2.5, eEase)), 58, k), lerp(7, 4, k), lerp(520, 640, k), lerp(820, 800, k));
    }
  },

  draw2d(t, s, st) {
    const T = times(), cam = st.stage.camera;
    // до появления куба — чистый фон; «вдохи» между подсценами
    veil(C_PAPER, Math.max(1 - P(t, T.cubeIn, .9, eEase), dipA(t, T.H2), dipA(t, T.H3)));

    if (t < T.H2) {
      atextWords('С теплом', 510, 860, T.title, t, { size: 120, w: 600, col: C_INK, out: T.cubeIn - .5, outDur: .4 });
      atextWords('то же самое.', 510, 995, T.title + .55, t, { size: 120, w: 600, col: C_INK, out: T.cubeIn - .5, outDur: .4 });
      const out = T.H2 - .35;
      const [ax, ay] = project(cam, 0, .95, 0);
      callout(ax, ay, 260, 445, T.born, t, C_INK, 1 - P(t, out, .3, eIn));
      label(96, 400, 'Рождается в объёме', 'тепло ∝ L³', T.born + .2, t, { out });
      const [bx, by] = project(cam, st.S / 2, 1.45, -.45);
      callout(bx, by, 900, 1195, T.leaves + .1, t, C_INK, 1 - P(t, out, .3, eIn));
      label(940, 1240, 'Уходит через поверхность', 'теплоотдача ∝ L²', T.surf - .1, t, { out, align: 'right' });
    } else if (t < T.H3) {
      const out = T.H3 - .3, qo = 1 - P(t, out, .3, eIn);
      const [cx, cy] = project(cam, .12, .3, 0);
      // облако уходящих линий: тепло теряется быстро и со всех сторон
      const ri = P(t, T.shrew - .2, .8, eApple) * (.55 + .45 * P(t, T.cools, .6, eApple)) * qo;
      if (ri > .003) {
        const R = rng(9);
        g.save(); g.strokeStyle = C_INK; g.lineCap = 'round'; g.lineWidth = 2;
        for (let i = 0; i < 64; i++) {
          const a = R() * Math.PI * 2, ph = R(), sp = 1.6 + R() * 1.2;
          const k = frac(t * sp + ph), r0 = (118 + 62 * Math.abs(Math.cos(a))) * lerp(.85, 1, R());
          const r = r0 + k * (228 - r0 - 22), l = 16 + R() * 12;
          g.globalAlpha = Math.sin(Math.PI * k) * .5 * ri;
          g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); g.stroke();
        }
        g.restore();
      }
      // монохромное кольцо Activity
      const ra = P(t, T.eats - .55, .8, eApple) * qo;
      if (ra > .003) {
        const RR = 262 * lerp(1.05, 1, ra), lw = 28;
        g.save(); g.globalAlpha = ra; g.lineCap = 'round'; g.lineWidth = lw;
        g.strokeStyle = '#E2E2E5'; g.beginPath(); g.arc(cx, cy, RR, 0, Math.PI * 2); g.stroke();
        const pr = .97 * P(t, T.day, 1.35, eApple);
        if (pr > .002) {
          g.strokeStyle = C_INK; g.beginPath(); g.arc(cx, cy, RR, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2); g.stroke();
          // стрелка-«шеврон» в начале кольца, как в Activity
          const a0 = -Math.PI / 2 + .07;
          g.strokeStyle = '#FFFFFF'; g.lineWidth = 3.5; g.beginPath();
          const ax = cx + Math.cos(a0) * RR, ay = cy + Math.sin(a0) * RR;
          g.moveTo(ax - 4, ay - 7); g.lineTo(ax + 4, ay); g.lineTo(ax - 4, ay + 7); g.stroke();
        }
        g.restore();
      }
      // подпись-знакомство → огромная цифра
      const o1 = T.eats - .35;
      label(96, 390, 'Землеройка', '≈ 5 граммов', T.shrew + .1, t, { out: o1, size: 60, subSize: 38 });
      acount(100, 92, 470, T.eats - .05, t, { size: 210, w: 700, col: C_INK, align: 'left', prefix: '≈', suffix: '%', out, dur: 1.4 });
      atext('веса тела — еда за сутки', 96, 538, T.almost + .1, t, { size: 44, w: 500, col: SUB, align: 'left', out });
    } else {
      // волны от ушей
      const ramp = P(t, T.fan - .25, .8, eEase);
      const head = st.head.getWorldPosition(new THREE.Vector3());
      const [hx, hy] = project(cam, head.x, head.y, head.z);
      const dist = cam.position.distanceTo(head), zs = 22 / dist;
      [[st.earL, 1], [st.earR, .45]].forEach(([ear, w]) => {
        const p = ear.getWorldPosition(new THREE.Vector3());
        const [ex, ey] = project(cam, p.x, p.y, p.z);
        const phi = Math.atan2(ey - hy, ex - hx);
        g.save(); g.strokeStyle = C_INK; g.lineCap = 'round'; g.lineWidth = 2;
        for (let k = 0; k < 4; k++) {
          const s = frac((t - T.fan) * 1.05 + k / 4);
          const r = (40 + s * 190) * Math.min(zs, 2.2);
          g.globalAlpha = (1 - s) * Math.min(1, s * 6) * .55 * ramp * w;
          if (g.globalAlpha < .003) continue;
          g.beginPath(); g.arc(ex, ey, r, phi - .55, phi + .55); g.stroke();
        }
        g.restore();
      });
      // выноска на ухо в крупном плане
      const p = st.earL.getWorldPosition(new THREE.Vector3());
      const [ax, ay] = project(cam, p.x, p.y + .15, p.z);
      callout(ax, ay, 300, 445, T.ears - .25, t, C_INK);
      label(96, 400, 'Площадь ушей', '→ охлаждение', T.ears - .05, t);
    }
  },

  sfx(add, s) {
    const T = times();
    add(T.title, 'swell', .25);
    add(T.cubeIn + .1, 'thud', .45, .8);
    add(T.born, 'shimmer', .3);
    add(T.leaves, 'whoosh', .3, 1.2);
    add(T.shrew, 'pop', .2, 1.3);
    add(T.cools, 'whoosh', .25, 1.4);
    add(T.day, 'tick', .2);
    add(T.eats - .05, 'click', .3);
    add(T.weight + .1, 'bloom', .4);
    add(T.fan, 'whoosh', .3, .7);
    add(T.fan + .95, 'whoosh', .25, .7);
    add(T.huge - .1, 'swell', .3);
    add(T.ears - .25, 'click', .3);
  },
});
