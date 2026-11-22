export default function(THREE,{MAT}){
 const object=new THREE.Group(),mat=MAT.ceramicWhite();
 const central=new THREE.Mesh(new THREE.SphereGeometry(.34,32,24),mat);central.position.set(-1,0,.1);object.add(central);
 for(let i=0;i<5;i++){
  const y=1.1-i*.55,card=new THREE.Group(),geo=new THREE.BoxGeometry(1.5,.38,.05);
  card.add(new THREE.Mesh(geo,MAT.glass(.16)));
  card.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:'#FFFFFF',transparent:true,opacity:.45})));
  const n=new THREE.Mesh(new THREE.SphereGeometry(.125,28,18),mat);n.position.set(-.45,0,.1);card.add(n);
  const line=new THREE.Mesh(new THREE.BoxGeometry(.6,.025,.02),MAT.aluminium());line.position.set(.15,.06,.06);card.add(line);
  const line2=line.clone();line2.scale.x=.65;line2.position.set(.045,-.06,.06);card.add(line2);
  card.position.set(.45,y,0);object.add(card);
 }
 return {object,floor:false,cam:{az:12,el:7,dist:9.7,target:[0,0,0],fov:24}};
}
