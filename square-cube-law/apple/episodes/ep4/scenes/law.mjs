// LAW (13.9 – 22.7 с), белый фон — «страница продукта».
// l1 — «1619» крупно; керамическое Солнце в фокусе эллипса, алюминиевая планета идёт по орбите с настоящей
//      кеплеровой скоростью (быстрее у Солнца); подпись «Иоганн Кеплер».
// l2 — на «закон» формула «T² ∝ a³» (³ — красная), подпись «Иоганн Кеплер, 1619»; под ней схема:
//      2D-квадрат (площадь T²) ∝ 3D-алюминиевый куб (a³) — отсылка к L³.
import { defineScene, makeStage, orbit, project, atext, line, P, Wd, E, THREE, MAT, roundedBox, glassEdges, shadowsOn, clamp, lerp, eApple, eInOut, eIn, eSpring } from '../../../engine.mjs';
import { ctx, TAU, makeBall } from './kit.mjs';

const EA = 1.45, EE = .56, EB = EA * Math.sqrt(1 - EE * EE), PER = 3.1;   // эллипс: большая полуось, эксцентриситет, период (с)
function kepler(t) {
  const M = TAU * (t / PER) + 2.2;
  let Ea = M; for (let i = 0; i < 8; i++) Ea -= (Ea - EE * Math.sin(Ea) - M) / (1 - EE * Math.cos(Ea));
  return [EA * (Math.cos(Ea) - EE), 0, -EB * Math.sin(Ea)];
}
const CUBE = .62, CX = .66, CY = .29;

function TT() {
  return {
    y1619: Wd('l1', 'тысяча'), ioh: Wd('l1', 'Иоганн'), zak: Wd('l1', 'закон'),
    kv: Wd('l2', 'Квадрат'), per: Wd('l2', 'периода'), prop: Wd('l2', 'пропорционален'), kub: Wd('l2', 'кубу'), ras: Wd('l2', 'расстояния'),
    end2: E('l2'),
  };
}

defineScene('law', {
  setup() {
    const stage = makeStage({ bg: 'white', shadow: .35 });
    const sunMat = MAT.ceramicWhite(); sunMat.emissive = new THREE.Color('#FFFFFF'); sunMat.emissiveIntensity = .12;
    const sun = makeBall(.2, sunMat);
    const planet = makeBall(.085, MAT.aluminium());
    const orr = new THREE.Group(); orr.add(sun, planet);
    const cubeMat = MAT.aluminium(); cubeMat.transparent = true;
    const geo = roundedBox(CUBE, .04, 3);
    const cube = shadowsOn(new THREE.Mesh(geo, cubeMat));
    const edges = glassEdges(new THREE.BoxGeometry(CUBE, CUBE, CUBE), '#1D1D1F', .8);
    const cubeG = new THREE.Group(); cubeG.add(cube, edges);
    stage.root.add(orr, cubeG);
    return { stage, sun, planet, orr, cube, cubeMat, edges, cubeG, T: TT() };
  },

  update(t, s, st) {
    const { stage, planet, orr, cubeMat, edges, cubeG, T } = st, cam = stage.camera;
    // орбита: уходит на «закон»
    const oOut = P(t, T.zak - .05, .6, eIn);
    const oIn = P(t, s.start + .1, 1.2, eApple);
    orr.visible = oOut < .999;
    orr.scale.setScalar(lerp(.9, 1, oIn) * (1 - .25 * oOut));
    orr.position.set(EA * EE * orr.scale.x, 0, 0);
    planet.position.set(...kepler(t - s.start)); planet.position.multiplyScalar(1);
    planet.visible = sunVisible(oOut);
    st.sun.material.opacity = 1;
    // куб: рёбра чертежом, затем «наливается» металлом
    const eA = P(t, T.kub - .05, .45), sA = P(t, T.kub + .15, .7);
    cubeG.visible = eA > .003;
    edges.material.opacity = .8 * eA * (1 - .75 * sA);
    cubeMat.opacity = sA; cubeMat.transparent = sA < .999; cubeMat.depthWrite = sA > .5;
    const k = lerp(.86, 1, eSpring(clamp((t - T.kub + .05) / .9)));
    cubeG.scale.setScalar(k);
    cubeG.position.set(CX, CY + CUBE / 2 * k, 0);
    cubeG.rotation.set(0, .55 + (t - T.kub) * .22, 0);
    stage.floor.position.y = CY; stage.floor.visible = t > T.zak;
    // камера: обзор орбиты сверху-сбоку → фронтальный «продуктовый» ракурс для схемы
    const m = P(t, T.zak - .05, 1.2, eInOut);
    orbit(cam, [0, lerp(0, .38, m), 0], lerp(13.5, 12, m), lerp(-8 + (t - s.start) * 2, 0, m), lerp(34, 16, m));
    const L = stage.lights; L.key.position.set(3, 9, 6); L.key.intensity = 2.2; L.hemi.intensity = 1.15; L.rimL.intensity = 1.2; L.rimR.intensity = .9;
  },

  draw2d(t, s, st) {
    const { stage, T, orr } = st, cam = stage.camera, g = ctx();
    const ink = stage.ink, sub = stage.sub;
    // эллипс орбиты (2D по проекции)
    const oa = P(t, s.start + .2, 1, eApple) * (1 - P(t, T.zak - .05, .45, eIn));
    if (oa > .003) {
      const sc = orr.scale.x, ox = orr.position.x;
      g.save(); g.globalAlpha = oa * .55; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 160; i++) {
        const Ea = TAU * i / 160, [x, y] = project(cam, ox + sc * EA * (Math.cos(Ea) - EE), 0, -sc * EB * Math.sin(Ea));
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke(); g.restore();
    }
    atext('1619', 540, 520, T.y1619, t, { size: 260, w: 700, col: ink, track: -.045, blur: 20, scale0: 1.12, dur: .9, out: T.zak - .15 });
    atext('Иоганн Кеплер', 540, 600, T.ioh, t, { size: 48, w: 500, col: sub, track: -.005, out: T.zak - .15 });
    // формула + подпись
    atext('T² ∝ a³', 540, 470, T.zak, t, { size: 200, w: 600, col: ink, track: -.03, blur: 18, scale0: 1.08, dur: .9 });
    atext('Иоганн Кеплер, 1619', 540, 555, T.zak + .3, t, { size: 44, w: 500, col: sub, track: -.005 });
    // схема: квадрат (площадь T²) — периметр прорисовывается, затем заливка и сетка
    const cx = 300, cy = 935, hs = 132;
    const pp = P(t, T.kv - .05, .7, eInOut), fill = P(t, T.kv + .4, .6);
    if (pp > 0) {
      const pts = [[cx - hs, cy + hs], [cx - hs, cy - hs], [cx + hs, cy - hs], [cx + hs, cy + hs], [cx - hs, cy + hs]];
      g.save(); g.globalAlpha = fill * .07; g.fillStyle = ink; g.fillRect(cx - hs, cy - hs, hs * 2, hs * 2); g.restore();
      for (let i = 1; i < 4; i++) {
        const x = cx - hs + hs * 2 * i / 4, y = cy - hs + hs * 2 * i / 4;
        line(x, cy - hs, x, cy + hs, ink, .16 * fill, 1.5); line(cx - hs, y, cx + hs, y, ink, .16 * fill, 1.5);
      }
      g.save(); g.strokeStyle = ink; g.lineWidth = 3; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
      let left = pp * 4; g.moveTo(...pts[0]);
      for (let i = 1; i < 5 && left > 0; i++) {
        const f = Math.min(1, left); left -= 1;
        g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
      }
      g.stroke(); g.restore();
    }
    atext('T²', cx, 1150, T.kv + .1, t, { size: 84, w: 600, col: ink, track: -.02 });
    atext('период', cx, 1205, T.per, t, { size: 38, w: 500, col: sub, track: 0, dy: 18 });
    atext('∝', 532, 965, T.prop, t, { size: 110, w: 500, col: sub, track: 0 });
    // куб (3D) — подписи под ним
    const [kx] = project(cam, CX, CY, 0);
    atext('a³', kx, 1150, T.kub + .1, t, { size: 84, w: 600, col: ink, track: -.02 });
    atext('расстояние', kx, 1205, T.ras, t, { size: 38, w: 500, col: sub, track: 0, dy: 18 });
  },

  sfx(add) {
    const T = TT();
    add(T.y1619, 'chime', .22, .85);
    add(T.zak, 'bloom', .3, .8);
    add(T.kv, 'click', .2);
    add(T.prop, 'tick', .15);
    add(T.kub, 'thud', .3, .8);
    add(T.kub + .3, 'click', .18, .9);
  },
});
function sunVisible(oOut) { return oOut < .999; }
