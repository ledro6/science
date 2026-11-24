export default function(THREE,{MAT,roundedBox}){
 const object=new THREE.Group();
 const coin=new THREE.Group();coin.position.set(-.45,.3,.35);coin.rotation.set(.18,-.2,-.12);object.add(coin);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.14,48),MAT.aluminium());body.rotation.x=Math.PI/2;coin.add(body);
 const face=new THREE.Mesh(new THREE.CylinderGeometry(.64,.64,.02,48),MAT.graphite());face.rotation.x=Math.PI/2;face.position.z=.08;coin.add(face);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.68,.024,8,48),MAT.aluminium());ring.position.z=.09;coin.add(ring);
 const crest=new THREE.Group();crest.position.z=.10;coin.add(crest);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.1,20,12),MAT.aluminium());head.scale.z=.25;head.position.y=.15;crest.add(head);
 for(const s of [-1,1])for(let i=0;i<4;i++){const w=new THREE.Mesh(new THREE.BoxGeometry(.35-i*.045,.045,.024),MAT.aluminium());w.position.set(s*.16,.11-i*.09,0);w.rotation.z=s*(.25+i*.12);crest.add(w)}
 for(let i=0;i<4;i++){const h=.18*2**i;const m=new THREE.Mesh(roundedBox(1,.04,2),MAT.aluminium());m.position.set(.52+i*.26,-.55+h/2,-.15);m.scale.set(.18,h,.3);object.add(m)}
 return{object,cam:{az:10,el:10,dist:8.4,target:[.05,.1,0],fov:24},floor:false};
}
