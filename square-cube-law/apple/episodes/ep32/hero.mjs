export default function(THREE,{MAT,roundedBox}){
 const object=new THREE.Group();const tray=new THREE.Mesh(roundedBox(1,.05,3),MAT.graphite());tray.scale.set(2.80,2.25,.12);tray.rotation.x=.02;object.add(tray);
 const bead=new THREE.SphereGeometry(.067,20,14),tmp=new THREE.Object3D();
 const trueDots=new THREE.InstancedMesh(bead,MAT.graphite(),9),falseDots=new THREE.InstancedMesh(bead,MAT.ceramicWhite(),99);
 for(let i=0;i<9;i++){tmp.position.set(-1.12,(4-i)*.21,.14);tmp.updateMatrix();trueDots.setMatrixAt(i,tmp.matrix)}
 for(let i=0;i<99;i++){tmp.position.set(-.88+(i%11)*.21,(4-Math.floor(i/11))*.21,.14);tmp.updateMatrix();falseDots.setMatrixAt(i,tmp.matrix)}
 object.add(trueDots,falseDots);return{object,cam:{az:-7,el:10,dist:9.5,target:[0,0,0],fov:24,floor:false},floor:false};
}
