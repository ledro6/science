// HOOK (0 – 13.3 с), чёрный фон. Монохромная «продуктовая» подача:
// k1 — керамический муравей в скользящем свете → растёт до слона → лапы подламываются, красный контровой свет;
// k2 — чёрная глянцевая блоха: прыжок ×100 с отъездом камеры; слон приседает — «0 см»;
// k3 — алюминиевый куб из темноты, стеклянная грань (площадь) отслаивается, «Закон квадрата и куба».
import {
  defineScene, makeStage, orbit, project, atext, line, dot, measure, P, Wd, C, E, THREE, MAT, roundedBox, glassEdges,
  shadowsOn, clamp, lerp, eApple, eSpring, eInOut, eIn, eStd, C_WHITE, C_GRAY, C_RED, W, H,
} from '../engine.mjs';
import * as ENG from '../engine.mjs';
import { makeAnt, makeElephant, makeFlea } from '../models.mjs';

const ctx = () => ENG.g;
const V = new THREE.Vector3();
const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };

// запоминаем исходные цвета материалов, чтобы «проявлять объект из темноты» (k: 0 — чёрный, 1 — как есть)
function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}
// размерная линия как на техчертежах apple.com: засечки на концах, подпись над серединой
function dim(x1, y1, x2, y2, label, a, col, { tick = 12, off = 30, size = 42, w = 500, t0 = 0, t = 0 } = {}) {
  if (a <= .003) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  line(x1, y1, x2, y2, col, a * .8, 2);
  line(x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, col, a * .8, 2);
  line(x2 - nx * tick, y2 - ny * tick, x2 + nx * tick, y2 + ny * tick, col, a * .8, 2);
  if (label) atext(label, (x1 + x2) / 2 - nx * off, (y1 + y2) / 2 - ny * off, t0, t, { size, w, col, a, track: -.01, dy: 14, dur: .6 });
}

defineScene('hook', {
  setup() {
    const stage = makeStage({ bg: 'black' });
    stage.camera.far = 1500; stage.camera.updateProjectionMatrix();
    const ant = makeAnt(MAT.ceramicWhite());
    const ele = makeElephant(MAT.graphite());
    const flea = makeFlea(MAT.ceramicBlack());
    const cubeMat = MAT.aluminium();
    const cube = shadowsOn(new THREE.Mesh(roundedBox(1.7, .075, 4), cubeMat));
    const glassGeo = new THREE.BoxGeometry(1.62, 1.62, .03);
    const glass = new THREE.Mesh(glassGeo, MAT.glass(.16));
    const gEdge = glassEdges(glassGeo, '#FFFFFF', .9);
    const gGrp = new THREE.Group(); gGrp.add(glass, gEdge);
    stage.root.add(ant, ele, flea, cube, gGrp);
    const T = {
      en: Wd('k1', 'увеличить'), sl: Wd('k1', 'слона'), die: Wd('k1', 'погибнет'),
      fl: Wd('k2', 'блоха'), jump: Wd('k2', 'прыгает') + .1, sto: Wd('k2', 'сто'), vy: Wd('k2', 'выше'),
      el: Wd('k2', 'слон'), dazhe: Wd('k2', 'даже'), up: Wd('k2', 'подпрыгнуть'),
      geo: Wd('k3', 'геометрия'), zakon: Wd('k3', 'закон'), kv: Wd('k3', 'квадрата'), i: Wd('k3', 'и'), kub: Wd('k3', 'куба'),
    };
    T.cutB = (E('k1') + C('k2')) / 2;                      // муравей → блоха (через темноту)
    T.cutC = (Wd('k2', 'когда') + T.el) / 2;               // блоха → слон
    T.cutD = (E('k2') + C('k3')) / 2;                      // слон → куб
    T.flight = 1.45;
    return { stage, ant, ele, flea, cube, cubeMat, gGrp, glass, gEdge, T,
      antM: collectMats(ant), eleM: collectMats(ele), fleaM: collectMats(flea), cubeM: collectMats(cube) };
  },

  update(t, s, st) {
    const { stage, ant, ele, flea, cube, gGrp, glass, gEdge, T } = st, { key, rimL, rimR, hemi } = stage.lights, cam = stage.camera;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : t < T.cutD ? 3 : 4;
    ant.visible = ph === 1; ele.visible = ph === 1 || ph === 3; flea.visible = ph === 2; cube.visible = gGrp.visible = ph === 4;
    rimL.color.set('#FFFFFF'); key.position.set(3, 9, 6); key.target.position.set(0, 0, 0);
    ant.rotation.set(0, 0, 0); ele.rotation.set(0, 0, 0); flea.rotation.set(0, 0, 0);

    if (ph === 1) {
      // ---- муравей: макро → рост до слона → гибель ----
      const grow = eSpring(clamp((t - T.en) / 1.7));
      const lag = eSpring(clamp((t - T.en - .12) / 2.0));
      const pull = eInOut(clamp((t - T.sl + .5) / 1.5));
      const move = eInOut(clamp((t - T.en) / 2.4));
      const k = lerp(1, 3.1, grow);
      ant.scale.setScalar(k);
      ant.position.set(lerp(.1, -1.5, move), 0, lerp(0, 1.3, move));
      ant.rotation.y = lerp(-.18, .1, move);
      const buckle = P(t, T.die, .75, eInOut);
      ant.pose({ buckle, drop: buckle * .04 });
      // слон выходит из темноты справа-сзади
      ele.position.set(2.0, 0, -2.6); ele.rotation.y = Math.PI - .3; ele.scale.setScalar(1);
      ele.pose({ flap: .12 * Math.sin(t * 1.7), trunk: .2 * Math.sin(t * 1.1) });
      const eLit = P(t, T.sl - .45, 1.1) * (1 - .55 * P(t, T.die + .1, .8));
      setLit(st.eleM, eLit); ele.visible = eLit > .01;
      setLit(st.antM, 1);
      // свет: скользящий ключ, затем «гаснет» на «погибнет», контровой становится красным
      const fadeIn = lerp(.62, 1, P(t, 0, 1.2));
      const dimDie = 1 - .82 * P(t, T.die + .12, .9);
      const out = 1 - P(t, E('k1') - .25, .45, eIn);
      const sweep = eApple(clamp(t / 2.6));
      key.position.set(lerp(-9, 4, sweep), lerp(5, 9, sweep), lerp(-2, 6, sweep));
      key.intensity = 2.8 * fadeIn * dimDie * out;
      hemi.intensity = .5 * fadeIn * dimDie * out;
      rimR.intensity = 2.4 * fadeIn * dimDie * out;
      const red = P(t, T.die + .05, .6);
      rimL.color.set('#FFFFFF').lerp(new THREE.Color(C_RED), red);
      rimL.intensity = (3.2 + red * 4.5) * fadeIn * out;
      rimL.position.set(-6, 3, -5);
      // камера: макро (fov 26, близко) → экспоненциальный отъезд
      const d = 8.2 * lerp(1, 3.1, lag) * lerp(1, 1.42, pull);
      const tg = lerp3(lerp3([.05, .36, 0], [-1.3, 1.2, 1.3], lag), [-.3, 1.55, -.2], pull);
      orbit(cam, tg, d, lerp(26, 12, lag) + (1 - lag) * t * 3, lerp(7, 8, lag));
    } else if (ph === 2) {
      // ---- блоха: прыжок на ×100 своего роста, камера отъезжает ----
      const { flight: TF, jump } = T;
      const u = clamp((t - jump) / TF);
      const HJ = 44, XJ = 20;
      flea.scale.setScalar(1.25);
      flea.position.set(XJ * u, HJ * 4 * u * (1 - u), 0);
      const air = u > 0 && u < 1;
      flea.rotation.z = air ? Math.atan2(HJ * 4 * (1 - 2 * u), XJ) * .35 : 0;
      flea.pose({ crouch: t < jump ? P(t, T.fl, .45, eInOut) : 0 });
      setLit(st.fleaM, 1);
      const lit = P(t, C('k2') - .1, .7);
      key.position.set(lerp(-6, 3, P(t, C('k2'), 1.2)), 8, 6);
      key.intensity = 3 * lit; hemi.intensity = .6 * lit; rimL.intensity = 4 * lit; rimR.intensity = 3 * lit;
      rimL.position.set(-6, 3, -5);
      const pull = eInOut(clamp((t - jump + .05) / 1.05));
      const d = 4.1 * Math.pow(400 / 4.1, pull);
      orbit(cam, lerp3([-.38, .26, 0], [XJ * .5, HJ * .55, 0], pull), d, lerp(22, 0, pull) + (1 - pull) * (t - C('k2')) * 4, lerp(5, 1.5, pull));
    } else if (ph === 3) {
      // ---- слон приседает, но не отрывается ни на сантиметр ----
      ele.position.set(0, 0, 0); ele.rotation.y = 0; ele.scale.setScalar(1);
      const sq = P(t, T.el + .05, .75, eInOut) * (1 - P(t, T.up + .1, .55, eStd));
      ele.pose({ squat: sq, flap: .1 * Math.sin(t * 1.7) - sq * .3, trunk: sq * .8 });
      setLit(st.eleM, 1);
      const lit = P(t, T.cutC, .5);
      key.position.set(4, 9, 7); key.intensity = 2.9 * lit; hemi.intensity = .55 * lit;
      rimL.position.set(-6, 3, -5); rimL.intensity = 3.6 * lit; rimR.intensity = 2.8 * lit;
      const p = clamp((t - T.cutC) / (T.cutD - T.cutC));
      orbit(cam, [.25, 1.75, 0], lerp(20, 18.5, p), lerp(38, 30, p), lerp(6, 4, p));
    } else {
      // ---- куб из темноты: медленная орбита, блик бежит по граням ----
      const appear = P(t, T.geo - .45, 1.6, eApple);
      setLit(st.cubeM, lerp(.0, 1, appear));
      cube.position.set(0, .85, 0); cube.rotation.set(0, 0, 0);
      const sw = clamp((t - T.geo + .4) / 4.2);
      key.position.set(lerp(-9, 7, eInOut(sw)), lerp(4, 9, sw), lerp(-3, 6, sw));
      key.intensity = 3.0 * appear; hemi.intensity = .45 * appear;
      rimL.position.set(-6, 3, -5); rimL.intensity = (3.2 + 2.5 * bump(t, T.kub + .25, .6)) * appear;
      rimR.intensity = 2.6 * appear;
      // стеклянная грань = площадь: проявляется и отслаивается по нормали
      const gIn = P(t, T.kv - .15, .5), gOut = P(t, T.kv, 1.1, eInOut);
      gGrp.position.set(0, .85, .85 + .03 + gOut * .45);
      glass.material.opacity = .17 * gIn; gEdge.material.opacity = .9 * gIn;
      gGrp.visible = gIn > .003;
      const p = clamp((t - T.cutD) / (s.end - T.cutD));
      orbit(cam, [0, .5, 0], lerp(20.5, 21.5, p), lerp(-22, 34, p), lerp(25, 19, p));
    }
  },

  draw2d(t, s, st) {
    const { stage, T, ant, ele, flea } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    const ph = t < T.cutB ? 1 : t < T.cutC ? 2 : t < T.cutD ? 3 : 4;
    if (ph === 1) {
      // размерная выноска по длине муравья: «5 мм» → «3 м»
      ant.updateMatrixWorld();
      const a1 = ant.localToWorld(V.set(-.92, .92, 0)).toArray(), a2 = ant.localToWorld(V.set(.58, .92, 0)).toArray();
      const [x1, y1] = project(cam, ...a1), [x2, y2] = project(cam, ...a2);
      const vis = P(t, .2, .6) * (1 - P(t, T.die + .1, .35, eIn));
      const sw = T.en + .55;
      dim(x1, y1, x2, y2, null, vis, ink);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 34;
      atext('5 мм', mx, my, .25, t, { size: 44, w: 500, col: ink, a: vis, dy: 14, dur: .6, out: sw, outDur: .3 });
      atext('3 м', mx, my, sw + .05, t, { size: 44, w: 500, col: ink, a: vis, dy: 14, dur: .6 });
      // высота слона — та же «3 м»: сопоставление масштаба
      ele.updateMatrixWorld();
      const e1 = project(cam, ...ele.localToWorld(V.set(-1.9, 0, 0)).toArray()), e2 = project(cam, ...ele.localToWorld(V.set(-1.9, 2.9, 0)).toArray());
      const ev = P(t, T.sl + .35, .6) * (1 - P(t, T.die + .1, .35, eIn));
      dim(e1[0], e1[1], e2[0], e2[1], null, ev * .8, sub);
    } else if (ph === 2) {
      const { flight: TF, jump } = T, HJ = 44, XJ = 20;
      const u = clamp((t - jump) / TF);
      const fade = 1 - P(t, T.cutC - .3, .3, eIn);
      // линия пола
      const [gx1, gy1] = project(cam, -6, 0, 0), [gx2, gy2] = project(cam, XJ + 6, 0, 0);
      line(gx1, gy1, gx2, gy2, sub, .45 * P(t, jump + .3, .6) * fade, 2);
      // траектория — тонкая линия, рисуется за блохой
      if (u > 0) {
        g.save(); g.beginPath(); g.rect(0, 0, W, 1310); g.clip(); g.globalAlpha = .85 * fade; g.strokeStyle = C_WHITE; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath();
        const N = 80;
        for (let i = 0; i <= N; i++) {
          const uu = u * i / N, [x, y] = project(cam, XJ * uu, HJ * 4 * uu * (1 - uu) + .3, 0);
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke(); g.restore();
        // кольцо-маркер вокруг крошечной блохи
        const [fx, fy] = project(cam, flea.position.x, flea.position.y + .3, 0);
        const ra = P(t, jump + .7, .4) * fade;
        if (ra > .01) { g.save(); g.globalAlpha = ra; g.strokeStyle = C_WHITE; g.lineWidth = 2; g.beginPath(); g.arc(fx, fy, 22, 0, 7); g.stroke(); g.restore(); }
      }
      // ×100 — огромная цифра + маленькая подпись
      const o = T.cutC - .3;
      atext('×100', 540, 510, T.sto, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: o });
      atext('своего роста', 540, 590, T.vy, t, { size: 46, w: 500, col: sub, track: -.005, out: o });
    } else if (ph === 3) {
      // «0 см»: линия пола под ногами — зазора нет
      ele.updateMatrixWorld();
      const f1 = project(cam, ...ele.localToWorld(V.set(-1.35, 0, .55)).toArray()), f2 = project(cam, ...ele.localToWorld(V.set(1.35, 0, .55)).toArray());
      const a = P(t, T.dazhe, .5) * (1 - P(t, T.cutD - .3, .3, eIn));
      const [ax, ay] = project(cam, ...ele.localToWorld(V.set(.72, 0, .42)).toArray());
      line(f1[0] - 60, f1[1] + 6, f2[0] + 60, f2[1] + 6, ink, a * .55, 2);
      dot(ax, ay + 4, 6 * a, ink, a);
      atext('0 см', 540, 560, T.dazhe, t, { size: 300, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.cutD - .3 });
      atext('высота прыжка слона', 540, 640, T.up - .05, t, { size: 46, w: 500, col: sub, track: -.005, out: T.cutD - .3 });
    } else {
      // заголовок по словам — каждое слово в момент произнесения
      const size = 112, wgt = 600, tr = -.03, sp = measure(' ', size, wgt, tr);
      const L1 = ['Закон', 'квадрата'], L1t = [T.zakon, T.kv], L2 = ['и', 'куба'], L2t = [T.i, T.kub];
      const row = (ws, ts, y) => {
        const wd = ws.map(q => measure(q, size, wgt, tr)), tot = wd.reduce((A, B) => A + B, 0) + sp * (ws.length - 1);
        let x = 540 - tot / 2;
        ws.forEach((q, i) => { atext(q, x, y, ts[i] - .05, t, { size, w: wgt, col: ink, align: 'left', track: tr }); x += wd[i] + sp; });
      };
      row(L1, L1t, 420); row(L2, L2t, 545);
      atext('S ∝ L²', 330, 1268, T.kv + .15, t, { size: 58, w: 500, col: ink, track: -.01 });
      atext('V ∝ L³', 750, 1268, T.kub + .05, t, { size: 58, w: 500, col: sub, track: -.01 });
    }
    // короткие «вдохи» в чёрный на монтажных стыках (под ними меняется объект)
    const dip = Math.max(bump(t, T.cutC, .2), bump(t, T.cutD, .22));
    if (dip > .003) { g.save(); g.globalAlpha = dip; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.restore(); }
  },

  sfx(add, s) {
    const tEn = Wd('k1', 'увеличить');
    add(.05, 'bloom', .35);
    add(tEn + .05, 'swell', .4, .9);
    add(Wd('k1', 'слона') - .2, 'thud', .45, .8);
    add(Wd('k1', 'погибнет') + .1, 'crack', .3, .8);
    add(Wd('k1', 'погибнет') + .25, 'thud', .5, .7);
    add(Wd('k2', 'прыгает') + .1, 'whoosh', .45, 1.2);
    add(Wd('k2', 'сто'), 'chime', .35);
    add(Wd('k2', 'даже'), 'thud', .4, .7);
    add(Wd('k3', 'геометрия') - .4, 'bloom', .45, .8);
    add(Wd('k3', 'закон') - 1.5, 'riser', .25);
    add(Wd('k3', 'квадрата'), 'shimmer', .3);
    add(Wd('k3', 'куба'), 'chime', .35, .9);
  },
});
