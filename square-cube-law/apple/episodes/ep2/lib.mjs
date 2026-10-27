// Общие помощники сцен выпуска ep2 (закон Клайбера). Только чистые функции и фабрики — без состояния.
import { THREE, W, H, orbit, clamp, lerp, P, eApple, eStd, FONT } from '../../engine.mjs';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import * as ENG from '../../engine.mjs';

// Камера на орбите; точка взгляда выводится в экранную точку (sx, sy) через view offset.
export function frame(cam, target, dist, az, el, sx = 540, sy = 960, fov = 26) {
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  orbit(cam, target, dist, az, el);
  cam.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
  cam.updateMatrixWorld();
}
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
export const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };

// «Проявление из темноты»: k = 0 — материал чёрный, 1 — как есть.
export function collectMats(obj) {
  const ms = new Set(); obj.traverse(o => { if (o.isMesh) ms.add(o.material); });
  return [...ms].map(m => { m.userData.base = m.color.clone(); m.userData.cc = m.clearcoat || 0; return m; });
}
export function setLit(mats, k) {
  for (const m of mats) { m.color.copy(m.userData.base).multiplyScalar(k); m.clearcoat = m.userData.cc * k; m.specularIntensity = k; }
}

// Чёрное зеркало: отражения — зеркальные копии под полупрозрачной чёрной плоскостью.
export function mirrorFloor(stage, opacity = .84) {
  stage.floor.visible = false;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity }));
  m.rotation.x = -Math.PI / 2; m.position.y = .002; m.renderOrder = 2;
  stage.root.add(m);
  return m;
}
// Модель + её зеркальная копия; place/pose выставляют обе.
export function twin(mk, mat) {
  const a = mk(mat), b = mk(mat), ga = new THREE.Group(), gb = new THREE.Group();
  ga.add(a); gb.add(b);
  return {
    a, b, ga, gb,
    pose(o) { a.pose(o); b.pose(o); },
    place(x, y, z, ry, s) {
      ga.position.set(x, y, z); ga.rotation.set(0, ry, 0); ga.scale.setScalar(s);
      gb.position.set(x, -y, z); gb.rotation.set(0, ry, 0); gb.scale.set(s, -s, s);
    },
    set visible(v) { ga.visible = gb.visible = v; },
  };
}

// Стилизованное «керамическое» сердце: сфера, деформированная по классической кривой сердца (пухлая линза).
export function heartGeometry(seg = 48) {
  // полярная таблица r(φ) кривой x = 16 sin³u, y = 13 cos u − 5 cos 2u − 2 cos 3u − cos 4u относительно центра (0, −3)
  const N = 360, R = new Float32Array(N), cy = -3;
  for (let i = 0; i <= 4000; i++) {
    const u = i / 4000 * Math.PI * 2;
    const x = 16 * Math.sin(u) ** 3, y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u) - cy;
    const k = Math.round(((Math.atan2(y, x) + Math.PI) / (Math.PI * 2)) * N) % N;
    R[k] = Math.max(R[k], Math.hypot(x, y));
  }
  for (let k = 0; k < N; k++) if (!R[k]) R[k] = (R[(k + N - 1) % N] + R[(k + 1) % N]) / 2;
  const rAt = phi => { const f = ((phi + Math.PI) / (Math.PI * 2)) * N, i = Math.floor(f), q = f - i; return lerp(R[((i % N) + N) % N], R[(i + 1) % N], q); };
  let geo = new THREE.SphereGeometry(1, seg, Math.round(seg * .75));
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const rho = Math.hypot(v.x, v.y), phi = Math.atan2(v.y, v.x), r = rAt(phi) / 15;
    const depth = .42 + .2 * Math.sqrt(rho);
    p.setXYZ(i, Math.cos(phi) * r * rho, Math.sin(phi) * r * rho + .05, v.z * depth);
  }
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  geo.computeVertexNormals();
  return geo;
}
// Пульс сердца: «лаб-даб» (0..1), фаза в долях периода.
export function beat(ph) {
  ph = ph - Math.floor(ph);
  return Math.exp(-Math.pow((ph - .06) / .045, 2)) + .55 * Math.exp(-Math.pow((ph - .24) / .06, 2));
}
// Форма ЭКГ на один период (по фазе 0..1): P-волна, QRS, T-волна.
export function ecg(ph) {
  ph = ph - Math.floor(ph);
  const gs = (c, w) => Math.exp(-Math.pow((ph - c) / w, 2));
  return .12 * gs(.16, .03) - .1 * gs(.27, .008) + 1 * gs(.3, .01) - .25 * gs(.325, .01) + .22 * gs(.52, .05);
}

// Числа по-русски: «1 000 000 000» (обычные пробелы между разрядами).
export const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[\s  ]/g, ' ');

// Формула «P ∝ M¾»: показатель степени — поднятая уменьшенная «¾». Возвращает ширину.
export function formula(x, y, t0, t1, t, o = {}) {
  const { size = 120, col = '#FFFFFF', expCol = col, align = 'center', out = null, w = 600 } = o;
  const base = 'P ∝ M', ex = '¾';
  const wb = ENG.measure(base, size, w, -.02), we = ENG.measure(ex, size * .6, w, 0);
  const total = wb + size * .04 + we;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ENG.atext(base, x0, y, t0, t, { size, w, col, align: 'left', track: -.02, out });
  ENG.atext(ex, x0 + wb + size * .04, y - size * .4, t1, t, { size: size * .6, w, col: expCol, align: 'left', track: 0, out, dy: 24 });
  return total;
}

// Красная пилюля «Подписаться на L³» — поведение как в пилоте (apple/scenes/outro.mjs).
export function pill(t, t0, tPress, cx = 540, cy0 = 1205) {
  const g = ENG.g;
  const p = P(t, t0, .8, eApple);
  if (p <= .003) return;
  const dn = P(t, tPress, .14, eStd), up = P(t, tPress + .14, .6, eApple);
  const k = (1 - .055 * dn + .055 * up) * lerp(1.04, 1, p);
  const W2 = 300, H2 = 56, cy = cy0 + (1 - p) * 34;
  const bl = (1 - P(t, t0, .55, eApple)) * 12;
  g.save(); g.globalAlpha = p; if (bl > .3) g.filter = `blur(${(bl * ENG.S).toFixed(1)}px)`;
  g.translate(cx, cy); g.scale(k, k);
  const dk = lerp(1, .82, dn * (1 - up));
  g.fillStyle = `rgb(${Math.round(255 * dk)},${Math.round(69 * dk)},${Math.round(58 * dk)})`;
  g.beginPath(); g.roundRect(-W2, -H2, W2 * 2, H2 * 2, H2); g.fill();
  g.font = `600 44px ${FONT}`; g.letterSpacing = '-0.4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#FFFFFF'; g.fillText('Подписаться на L³', 0, 2);
  g.restore();
  const rp = P(t, tPress + .05, .9, eApple);
  if (rp > 0 && rp < 1) {
    const gr = 4 + 30 * rp;
    g.save(); g.globalAlpha = .5 * (1 - rp); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(cx - W2 - gr, cy0 - H2 - gr, (W2 + gr) * 2, (H2 + gr) * 2, H2 + gr); g.stroke(); g.restore();
  }
}
// Затемнение всего слоя (монтажный «вдох»).
export function veil(col, a) { const g = ENG.g; if (a <= .003) return; g.save(); g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
