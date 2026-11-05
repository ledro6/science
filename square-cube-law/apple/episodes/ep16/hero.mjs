// Герой обложки № 16: две звезды-сферы из сцен (scenes/kit.mjs, тот же шейдер): слева обычная «T»
// (тусклее, чуть тёплый серый), справа вдвое горячее: белая, в широкой короне и в густом облаке фотонов
// (их в 16 раз больше, чем у соседки). Корона — аддитивные полупрозрачные оболочки. Без пола.
import { makeStar } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const R = .82, X = 1.42;
  const cool = makeStar({ seed: 1.3 }); cool.scale.setScalar(R); cool.set({ heat: .12, b: .8, t: 0 });
  const hot = makeStar({ seed: 7.9 }); hot.scale.setScalar(R); hot.set({ heat: 1, b: 1.06, t: 3 });
  cool.position.set(-X, 0, 0); hot.position.set(X, 0, 0);
  object.add(cool, hot);
  // мягкая корона: спрайт с радиальным градиентом (аддитивно), начинается от края диска
  const crownTex = (edge) => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 256 * edge, 256, 256, 256);
    gr.addColorStop(0, 'rgba(255,255,255,.62)'); gr.addColorStop(.1, 'rgba(255,255,255,.42)'); gr.addColorStop(.4, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(256, 256, 256 * edge * .985, 0, Math.PI * 2); g.fill();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  };
  const crown = (c, kMax, a) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: crownTex(1 / kMax), transparent: true, opacity: a, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.scale.setScalar(2 * R * kMax); sp.position.copy(c); sp.renderOrder = 2; object.add(sp);
  };
  crown(cool.position, 1.9, .3);
  crown(hot.position, 3.3, .85);
  // фотоны: 8 у обычной звезды, 128 у горячей
  let seed = 1607; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dotM = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
  const geo = new THREE.SphereGeometry(.028, 10, 8);
  const cloud = (c, n) => {
    const m = new THREE.InstancedMesh(geo, dotM, n), M = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = R * (1.2 + 1.3 * Math.pow(rnd(), .8));
      const sc = .7 + .6 * rnd();
      M.makeScale(sc, sc, sc).setPosition(c.x + s * Math.cos(a) * r, c.y + u * r, c.z + s * Math.sin(a) * r);
      m.setMatrixAt(i, M);
    }
    return m;
  };
  object.add(cloud(cool.position, 8), cloud(hot.position, 128));
  return { object, cam: { az: 0, el: 4, dist: 13.4, target: [0, -.1, 0], fov: 24, floor: false } };
}
