import { THREE, MAT, P, lerp, eInOut } from '../../engine.mjs';
export { frame, pill } from '../ep18/scenes/kit.mjs';

function flatPart(points, depth, material) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) => i ? shape.lineTo(x, z) : shape.moveTo(x, z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSegments: 2, bevelSize: .035, bevelThickness: .025,
  });
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export function makePlane(T = THREE, materials = MAT) {
  const object = new T.Group();
  const ceramic = materials.ceramicWhite();
  const dark = materials.graphite();
  const fuselage = new T.Mesh(new T.SphereGeometry(1, 32, 20), ceramic);
  fuselage.scale.set(.25, .22, 2.24);
  fuselage.position.y = .40;
  object.add(fuselage);
  const wings = flatPart([[-2.30,.85],[-2.30,.37],[-.24,-.63],[.24,-.63],[2.30,.37],[2.30,.85],[.22,.48],[-.22,.48]], .09, ceramic);
  wings.position.y=.40;
  object.add(wings);
  const tail = flatPart([[-.91,1.89],[-.91,1.65],[-.13,1.23],[.13,1.23],[.91,1.65],[.91,1.89],[0,1.75]], .07, ceramic);
  tail.position.y=.41;
  object.add(tail);
  const fin = new T.Mesh(new T.BoxGeometry(.07,.62,.63), ceramic);
  fin.position.set(0,.78,1.68);fin.rotation.x=-.22;
  object.add(fin);
  const cockpit = new T.Mesh(new T.SphereGeometry(1, 24, 16), dark);
  cockpit.scale.set(.22,.07,.44);cockpit.position.set(0,.59,-1.34);
  object.add(cockpit);
  const engines = [-.79,.79].map(x => {
    const engine = new T.Mesh(new T.CylinderGeometry(.17,.19,.88,24), dark.clone());
    engine.rotation.x=Math.PI/2;engine.position.set(x,.29,-.15);
    engine.castShadow=true;
    object.add(engine);
    const inlet = new T.Mesh(new T.TorusGeometry(.15,.035,8,24), materials.aluminium());
    inlet.position.set(x,.29,-.60);
    object.add(inlet);
    return engine;
  });
  const spots = [
    [-1.88,.67],[-1.44,.39],[-1.09,.45],[-1.64,.62],[-.47,.16],
    [1.72,.65],[1.26,.40],[1.96,.53],[.47,.27],[.07,.99],[-.07,1.48],
  ].map(([x,z]) => {
    const mark = new T.Mesh(new T.CircleGeometry(.045,12), materials.ceramicBlack());
    mark.rotation.x=-Math.PI/2;mark.position.set(x, Math.abs(x)<.26 ? .63 : .417, z);
    object.add(mark);
    return mark;
  });
  const panels = [-.79,.79].map(x => {
    const mesh = new T.Mesh(new T.BoxGeometry(.49,.075,1.01),materials.aluminium());
    mesh.position.set(x,.65,-.15);mesh.castShadow=true;object.add(mesh);
    return mesh;
  });
  panels.forEach(p => p.visible=false);
  return { object, engines, spots, panels };
}

export function posePlane(plane, t, s, reveal, armor = 0) {
  const q=P(t,s.start,s.end-s.start,eInOut);
  plane.object.rotation.y=lerp(-.16,.15,q);
  plane.object.position.y=.06*Math.sin(t*.55);
  plane.spots.forEach((spot,i)=>{
    const p=P(t,reveal+i*.055,.38);
    spot.visible=p>.002;
    spot.scale.setScalar(Math.max(.001,p));
  });
  plane.panels.forEach(panel=>{
    panel.visible=armor>.002;
    panel.position.y=lerp(1.14,.60,armor);
    panel.scale.setScalar(Math.max(.001,armor));
  });
}
