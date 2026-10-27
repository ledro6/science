// Общие помощники выпуска ep3 (экспонента): бумага, Луна, кадрирование камеры.
// Модуль не зависит от движка (получает THREE параметром) — его использует и hero.mjs обложки.

// Камера на орбите вокруг цели; цель выводится в экранную точку (sx, sy) через view offset (кадр 1080×1920).
export function frame(cam, target, dist, azDeg, elDeg, sx = 540, sy = 960) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(el) * Math.sin(az), target[1] + dist * Math.sin(el), target[2] + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(target[0], target[1], target[2]);
  cam.setViewOffset(1080, 1920, 540 - sx, 960 - sy, 1080, 1920);
  cam.updateMatrixWorld();
}

// Текстура торца стопки: каждая полоса = один лист (светлая бумага + тонкая тень между листами).
// repeat.y = число листов; mip-карты сами «усредняют» тысячи листов в ровный тон.
export function paperTexture(THREE, dark = false) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = dark ? '#E9E9E6' : '#FBFBF9'; g.fillRect(0, 0, 4, 32);
  g.fillStyle = dark ? '#B9B9B5' : '#CFCFCB'; g.fillRect(0, 28, 4, 4);
  g.fillStyle = dark ? '#D4D4D0' : '#E4E4E0'; g.fillRect(0, 26, 4, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
// Материалы стопки: бока полосатые (листы), верх/низ — чистая бумага. Порядок граней BoxGeometry: +x −x +y −y +z −z.
export function stackMaterials(THREE, tex, o = {}) {
  const side = new THREE.MeshStandardMaterial({ color: '#FFFFFF', map: tex, roughness: .78, ...o });
  const face = new THREE.MeshStandardMaterial({ color: o.faceColor || '#F4F4F1', roughness: .7 });
  if (o.transparent) { face.transparent = true; }
  return { side, face, list: [side, side, face, face, side, side] };
}

// Керамическая Луна: сфера с мягкими кратерами (вмятины + невысокий вал), детерминированная.
export function moonGeometry(THREE, seg = 64, seed = 7, n = 22) {
  let s = seed >>> 0;
  const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const cr = [];
  for (let i = 0; i < n; i++) {
    const u = R() * 2 - 1, th = R() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    cr.push({ d: [r * Math.cos(th), u, r * Math.sin(th)], r: .1 + R() * .26, h: .018 + R() * .03 });
  }
  const geo = new THREE.SphereGeometry(1, seg, Math.round(seg * .75));
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let k = 0;
    for (const c of cr) {
      const a = Math.acos(Math.max(-1, Math.min(1, v.x * c.d[0] + v.y * c.d[1] + v.z * c.d[2])));
      const x = a / c.r;
      if (x < 1) k -= c.h * (1 - x * x) * (1 - x * x) * 1.25;
      else if (x < 1.6) { const q = (x - 1) / .6; k += c.h * .32 * Math.sin(Math.PI * q) * (1 - q); }
    }
    v.multiplyScalar(1 + k); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
export const moonMaterial = THREE => new THREE.MeshPhysicalMaterial({ color: '#E8E7E3', roughness: .62, clearcoat: .15, clearcoatRoughness: .5 });

// Число по-русски с пробелами-разделителями (неразрывный узкий пробел не нужен — Inter рисует обычный)
export const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ');
export const smooth = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
