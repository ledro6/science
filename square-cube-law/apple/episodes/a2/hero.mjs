// Герой обложки a2: тот же седан-силуэт, что в сценах и на обложке a1 (белая керамика, графитовый купол, колёса со спицами),
// вид сзади 3/4 на длиннофокусной камере: горят стоп-сигналы, из темноты к машине тянутся два следа торможения.
import { makeCar, brakeLights, TAIL } from './scenes/kit.mjs';

function fadeTex(THREE, stops) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 8;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 256, 0);
  stops.forEach(([p, a]) => gr.addColorStop(p, `rgba(255,255,255,${a})`));
  g.fillStyle = gr; g.fillRect(0, 0, 256, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTex(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.5)'); gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function (THREE) {
  const object = new THREE.Group();
  const car = brakeLights(makeCar({ dark: true }));
  car.brake(1); car.spin(.3);
  object.add(car);
  // следы торможения: графитовые полосы, гаснут к дальнему концу
  const L = 13, tex = fadeTex(THREE, [[0, 0], [.55, .55], [.93, .9], [1, .9]]);
  const sm = new THREE.MeshBasicMaterial({ color: '#5A5A5E', map: tex, transparent: true, depthWrite: false, toneMapped: false });
  for (const z of [-.82, .82]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, .26), sm);
    m.rotation.x = -Math.PI / 2; m.position.set(-1.45 - L / 2 + .2, .004, z); m.renderOrder = 1;
    object.add(m);
  }
  // мягкое свечение стоп-сигналов
  const gm = new THREE.MeshBasicMaterial({ map: glowTex(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: .55 });
  for (const p of TAIL) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), gm);
    s.position.set(p[0] - .06, p[1], p[2]); s.rotation.y = -Math.PI / 2; s.renderOrder = 4;
    object.add(s);
  }
  return { object, cam: { az: -120, el: 11, dist: 14.6, target: [-1.3, .55, 0], fov: 24 } };
}
