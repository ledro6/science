export default function(THREE,{MAT}){
 const object=new THREE.Group();
 for(const [x,y,ang] of [[-.72,.12,-10/12*Math.PI*2],[.72,-.12,-6/12*Math.PI*2]]){
 const c=new THREE.Group();c.position.set(x,y,0);object.add(c);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.20,48),MAT.aluminium());body.rotation.x=Math.PI/2;c.add(body);
 const face=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.025,48),MAT.ceramicWhite());face.rotation.x=Math.PI/2;face.position.z=.12;c.add(face);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.59,.03,8,48),MAT.graphite());ring.position.z=.14;c.add(ring);
 const tmp=new THREE.Object3D(),ticks=new THREE.InstancedMesh(new THREE.BoxGeometry(.018,.06,.015),MAT.graphite(),12);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;tmp.position.set(.48*Math.sin(a),.48*Math.cos(a),.15);tmp.rotation.set(0,0,-a);tmp.updateMatrix();ticks.setMatrixAt(i,tmp.matrix)}c.add(ticks);
 const h=new THREE.Mesh(new THREE.BoxGeometry(.028,.40,.03),MAT.graphite());h.position.set(-Math.sin(ang)*.16,Math.cos(ang)*.16,.17);h.rotation.z=ang;c.add(h);
 const pin=new THREE.Mesh(new THREE.SphereGeometry(.045,16,10),MAT.aluminium());pin.position.z=.19;c.add(pin);
 }
 return{object,cam:{az:8,el:9,dist:7.5,target:[0,0,0],fov:24},floor:false};
}
