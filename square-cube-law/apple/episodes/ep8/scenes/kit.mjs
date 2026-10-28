// Общие детали выпуска ep8 (парадокс дней рождения): керамические фигурки-капсулы (InstancedMesh + зеркальная копия),
// кольцо из 23 человек, даты, вероятность P(n), пилюля «Подписаться на L³». Не сцена — вспомогательный модуль
// (frame/pill/mirrorFloor скопированы из ep2/lib.mjs).
import * as ENG from '../../../engine.mjs';
import { THREE, W, H, orbit, clamp, lerp, P, eApple, eStd, FONT, rng } from '../../../engine.mjs';

export const ctx = () => ENG.g;
export const TAU = Math.PI * 2;
export const N = 23;
export const PAIR = [3, 14];                 // два человека с одинаковым днём рождения
export const bump = (t, c, w) => { const x = clamp(1 - Math.abs(t - c) / w); return x * x * (3 - 2 * x); };
export const lerp3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

// Вероятность совпадения хотя бы одной пары дней рождения у n человек (365 дней)
export function prob(n) {
  let q = 1; const k = Math.floor(n);
  for (let i = 0; i < k; i++) q *= (365 - i) / 365;
  const f = n - k; if (f > 0) q *= 1 - f * k / 365;   // плавная интерполяция между целыми n
  return 1 - q;
}

// Камера на орбите; точка взгляда выводится в экранную точку (sx, sy) через view offset.
export function frame(cam, target, dist, az, el, sx = 540, sy = 960, fov = 26) {
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  orbit(cam, target, dist, az, el);
  cam.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
  cam.updateMatrixWorld();
}
// Чёрное зеркало: отражения — зеркальные копии под полупрозрачной чёрной плоскостью.
export function mirrorFloor(stage, opacity = .84) {
  stage.floor.visible = false;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity }));
  m.rotation.x = -Math.PI / 2; m.position.y = .002; m.renderOrder = 2;
  stage.root.add(m);
  return m;
}

// Геометрия фигурки: капсула-тело + сфера-голова, стоит на y = 0, высота ≈ 0.94
export const FIG_H = .94;
export function figureGeos(k = 1) {
  const body = new THREE.CapsuleGeometry(.155 * k, .36 * k, 8, 28); body.translate(0, (.155 + .18) * k, 0);
  const head = new THREE.SphereGeometry(.118 * k, 28, 18); head.translate(0, .82 * k, 0);
  return [body, head];
}
// Толпа фигурок: InstancedMesh (тело и голова) + опционально зеркальная копия.
// set(i, x, y, z, s, c) — позиция, масштаб, яркость (множитель цвета инстанса); commit() — после всех set.
export function makeCrowd(count, mat, { mirror = true, k = 1 } = {}) {
  const grp = new THREE.Group();
  const geos = figureGeos(k);
  const mk = () => geos.map(gg => {
    const m = new THREE.InstancedMesh(gg, mat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, new THREE.Color(1, 1, 1));
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    return m;
  });
  const up = mk(); up.forEach(m => grp.add(m));
  let dn = null, mg = null;
  if (mirror) { mg = new THREE.Group(); mg.scale.y = -1; dn = mk(); dn.forEach(m => { m.castShadow = false; mg.add(m); }); grp.add(mg); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), Cc = new THREE.Color();
  return {
    grp, up, dn,
    set(i, x, y, z, s, c = 1, ry = 0) {
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      M.compose(Pv.set(x, y, z), Q, Sv.set(s, s, s)); Cc.setRGB(c, c, c);
      for (const m of up) { m.setMatrixAt(i, M); m.setColorAt(i, Cc); }
      if (dn) for (const m of dn) { m.setMatrixAt(i, M); m.setColorAt(i, Cc); }
    },
    commit() {
      for (const m of [...up, ...(dn || [])]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    },
  };
}
// Кольцо: угол i-го человека (0 — к камере при az = 0)
export const ang = (i, n = N) => TAU * i / n;
export const ringPos = (i, R, n = N) => [R * Math.sin(ang(i, n)), R * Math.cos(ang(i, n))];

// Дни рождения: 23 разных даты, у PAIR — одна и та же
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function dateStr(doy) { let m = 0; while (doy >= DAYS[m]) { doy -= DAYS[m]; m++; } return `${doy + 1} ${MON[m]}`; }
export const DATES = (() => {
  const R = rng(823), used = new Set(), out = [];
  for (let i = 0; i < N; i++) {
    let d; do { d = Math.floor(R() * 365); } while (used.has(d)); used.add(d); out.push(d);
  }
  out[PAIR[1]] = out[PAIR[0]] = 72;        // 14 мар
  return out.map(dateStr);
})();

// Плашка-дата (2D): скруглённая «стеклянная» пилюля с датой; hi — 0..1 вспышка (инверсия в белое)
export function plaque(x, y, s, label, a, hi = 0, dark = true) {
  const g = ctx(); if (a <= .003) return;
  const w = 104 * s, h = 44 * s;
  g.save(); g.globalAlpha *= a; g.translate(x, y);
  const k = 1 + .1 * hi; g.scale(k, k);
  const bgc = dark ? [28, 28, 30] : [255, 255, 255], hic = dark ? [255, 255, 255] : [29, 29, 31];
  const c = bgc.map((v, i) => Math.round(lerp(v, hic[i], hi)));
  g.fillStyle = `rgb(${c})`;
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fill();
  g.strokeStyle = dark ? `rgba(255,255,255,${.22 * (1 - hi)})` : `rgba(0,0,0,${.12 * (1 - hi)})`; g.lineWidth = 1.5; g.stroke();
  const tc = dark ? [255, 255, 255] : [29, 29, 31], tch = dark ? [0, 0, 0] : [255, 255, 255];
  g.fillStyle = `rgb(${tc.map((v, i) => Math.round(lerp(v, tch[i], hi)))})`;
  g.font = `600 ${(25 * s).toFixed(1)}px ${FONT}`; g.letterSpacing = '-0.3px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 0, 1.5 * s);
  g.restore();
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
// Мягкое свечение (аддитивно, для чёрного фона)
export function glow(x, y, R, a = .5) {
  const g = ctx(); if (a <= .003) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.5)');
  gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
}
