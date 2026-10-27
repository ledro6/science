// Герой обложек ep4: Нептун крупно (графитово-алюминиевый шар с тональными полосами), тонкое кольцо орбиты вокруг,
// маленькое светящееся Солнце вдали. Без пола.
export default function (THREE, { shadowsOn }) {
  const object = new THREE.Group();
  // тональные полосы — та же «газовая» текстура, что в сценах
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  let seed = 46; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#7d8187'); grd.addColorStop(.5, '#a4a8ae'); grd.addColorStop(1, '#7a7e84');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 26; i++) {
    const y = R() * 512, h = 6 + R() * 30, v = Math.round(120 + R() * 70);
    g.globalAlpha = .12 + R() * .18; g.fillStyle = `rgb(${v},${v + 2},${v + 5})`; g.fillRect(0, y, 1024, h);
  }
  g.globalAlpha = .25; g.fillStyle = '#55595f'; g.beginPath(); g.ellipse(600, 300, 68, 28, 0, 0, Math.PI * 2); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const nep = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map: tex, roughness: .5, metalness: .1, clearcoat: .25, clearcoatRoughness: .4 }));
  nep.rotation.set(0, -.6, .45);
  // тонкое кольцо-орбита вокруг (наклонено, как плоскость орбиты)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, .009, 8, 256), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .75, toneMapped: false }));
  ring.rotation.set(Math.PI / 2 - .32, 0, 0);
  // маленькое Солнце вдали + его свет на Нептуне
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.075, 32, 24), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }));
  sun.position.set(-1.75, -1.0, -1.5);
  const pl = new THREE.PointLight('#ffffff', 3.2, 0, 0); pl.position.copy(sun.position);
  object.add(nep, ring, sun, pl);
  shadowsOn(nep);
  object.position.y = 1.1;
  return { object, cam: { az: 18, el: 10, dist: 9.2, target: [-.2, .95, 0], fov: 24, floor: false } };
}
