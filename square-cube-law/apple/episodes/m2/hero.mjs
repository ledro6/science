// Герой обложки m2: графитовый край стола и керамический бутерброд в падении — уже повернулся,
// масло (графитовый слой) смотрит вбок-вниз; полупрозрачная копия показывают начало поворота.
// Те же модели и физика, что в сценах (scenes/toast.mjs; файл не зависит от движка).
import { makeToast, makeTable, fallSim, TABLE } from './scenes/toast.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const K = 1.6, sim = fallSim({ k: K });
  const table = makeTable(THREE);
  table.children.slice(1).forEach(l => { l.visible = false; });   // ножки ушли бы под подпись закона
  object.add(table);
  const put = (o, tau) => { const p = sim.at(tau); o.position.set(p.x, p.y, 0); o.rotation.set(0, 0, p.phi); o.scale.setScalar(K); };
  [[.12, .26]].forEach(([tau, op]) => { const g = makeToast(THREE, { ghost: op }); put(g, tau); object.add(g); });
  const toast = makeToast(THREE); put(toast, .23); object.add(toast);
  object.traverse(o => { if (o.isMesh && ![].concat(o.material)[0].transparent) { o.castShadow = true; o.receiveShadow = true; } });
  return { object, cam: { az: 30, el: 12, dist: 10.5, target: [.15, TABLE.H - .55, 0], fov: 24, floor: false } };
}
