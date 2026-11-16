import { THREE, MAT, roundedBox, P, clamp, lerp } from '../../engine.mjs';
export { frame, pill, arrow } from '../a3/scenes/kit.mjs';

export function makeTyre({worn=false}={}) {
  const group=new THREE.Group(), spin=new THREE.Group();
  group.add(spin);
  const rubber=MAT.ceramicBlack(); rubber.color.set('#222226'); rubber.roughness=.61;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.96,.96,.64,48),rubber);
  body.rotation.x=Math.PI/2; spin.add(body);
  const sideGeo=new THREE.TorusGeometry(.72,.25,12,48);
  for(const z of [-.27,.27]) {
    const side=new THREE.Mesh(sideGeo,rubber);side.position.z=z;side.scale.z=.43;spin.add(side);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.49,.49,.035,36),MAT.aluminium());
    rim.rotation.x=Math.PI/2;rim.position.z=z*1.42;spin.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.06,24),MAT.graphite());
    hub.rotation.x=Math.PI/2;hub.position.z=z*1.55;spin.add(hub);
  }
  const blockGeo=new THREE.BoxGeometry(.115,worn?.012:.058,.16);
  const tread=new THREE.InstancedMesh(blockGeo,rubber,48*3);
  const tmp=new THREE.Object3D();let i=0;
  for(let row=0;row<3;row++)for(let n=0;n<48;n++){
    const a=n/48*Math.PI*2+(row%2)*.045;
    tmp.position.set(Math.sin(a)*.976,Math.cos(a)*.976,(row-1)*.207);
    tmp.rotation.set(0,0,-a);tmp.updateMatrix();tread.setMatrixAt(i++,tmp.matrix);
  }
  tread.castShadow=true;spin.add(tread);
  spin.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return {group,spin};
}
export function road(dark=true) {
  const group=new THREE.Group();
  const mat=MAT.graphite();mat.color.set(dark?'#18181D':'#C8C8CE');
  const slab=new THREE.Mesh(roundedBox(1,.025),mat);slab.scale.set(4.5,.1,2.2);slab.position.y=.02;slab.receiveShadow=true;group.add(slab);
  const waterMat=new THREE.MeshStandardMaterial({color:dark?'#C7CAD0':'#9299A3',roughness:.24,metalness:.15,transparent:true,opacity:.34,depthWrite:false});
  const layer=new THREE.Mesh(new THREE.BoxGeometry(4.45,.028,2.15),waterMat);layer.position.y=.085;group.add(layer);
  const shape=new THREE.Shape();shape.moveTo(-.1,0);shape.lineTo(1.85,0);shape.lineTo(1.85,.02);shape.lineTo(.35,.30);shape.lineTo(-.1,.18);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.66,bevelEnabled:false});geo.translate(0,0,-.33);
  const wedge=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:'#B5BAC3',roughness:.26,metalness:.12,transparent:true,opacity:.55,depthWrite:false}));
  wedge.position.y=.086;group.add(wedge);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.95,.013,.65),new THREE.MeshBasicMaterial({color:'#FFFFFF'}));
  stripe.position.y=.095;group.add(stripe);
  return {group,wedge,stripe,layer};
}
export function droplets() {
  const group=new THREE.Group(), beads=[];
  const mat=MAT.aluminium();
  for(let i=0;i<18;i++){
    const bead=new THREE.Mesh(new THREE.SphereGeometry(.034,10,8),mat);
    group.add(bead);beads.push(bead);
  }
  return {group,beads};
}
export function poseWater(flow,t,start,clear=1) {
  flow.beads.forEach((b,i)=>{
    const progress=((t-start)*.58+i/18)%1;
    const sign=i%2?-1:1;
    b.position.set(.38-progress*.30,.13+Math.sin(progress*Math.PI)*.07,sign*(.02+progress*.98)*clear);
    b.scale.setScalar(.75+.25*Math.sin(progress*Math.PI));
  });
}
