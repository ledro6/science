import { THREE, MAT, P, lerp, eInOut } from '../../../engine.mjs';
import { makeCrowd } from '../../ep8/scenes/kit.mjs';
export { frame, pill } from '../../ep18/scenes/kit.mjs';
export { makeCrowd, prob } from '../../ep8/scenes/kit.mjs';

export function people(count = 70, dark = true) {
  const crowd = makeCrowd(count, dark ? MAT.ceramicWhite() : MAT.graphite(), { mirror: false, lo: true });
  return crowd;
}
export function gridPosition(i, count = 70) {
  const columns = count === 23 ? 6 : 10;
  const rows = Math.ceil(count / columns);
  return [(i % columns - (columns - 1) / 2) * .45, (Math.floor(i / columns) - (rows - 1) / 2) * .5];
}
export function poseCrowd(crowd, t, start, count = 70, scale = .65) {
  for (let i = 0; i < count; i++) {
    const [x, z] = gridPosition(i,count);
    const p = P(t,start+i*.014,.64,eInOut);
    crowd.set(i,x,(1-p)*.14,z,Math.max(.0001,scale*p),1);
  }
  crowd.commit();
}
export function numberedDisc() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.11,48),MAT.graphite());
  body.castShadow=true; body.receiveShadow=true;
  group.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.69,.012,8,64),MAT.aluminium());
  rim.rotation.x=-Math.PI/2; rim.position.y=.065; group.add(rim);
  const ticks = new THREE.Group();
  for (let i=0;i<24;i++) {
    const a=i*Math.PI/12;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(.012,.012,i%6===0?.12:.06),MAT.aluminium());
    tick.position.set(.6*Math.sin(a),.07,.6*Math.cos(a));tick.rotation.y=a;ticks.add(tick);
  }
  group.add(ticks);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.025,.025,.49),MAT.ceramicWhite());
  needle.geometry.translate(0,0,.245); needle.position.y=.09;group.add(needle);
  return { group, needle };
}
