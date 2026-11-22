// Independent hero module: no browser / timeline / engine dependencies
export default function(THREE,{roundedBox}){
 const object=new THREE.Group(),geo=roundedBox(.25,.016,1),mat=new THREE.MeshStandardMaterial({color:'#ECECEA',roughness:.32,metalness:.12}),graphite=new THREE.MeshStandardMaterial({color:'#636367',roughness:.32,metalness:.2});
 const dummy=new THREE.Object3D();
 for(const [cx,n,material] of [[-.95,100,graphite],[.95,200,mat]]){
  const mesh=new THREE.InstancedMesh(geo,material,n);mesh.frustumCulled=false;
  for(let i=0;i<n;i++){dummy.position.set(cx+(i%5-2)*.27,Math.floor(i/25)*.27+.125,(Math.floor(i/5)%5-2)*.27);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}object.add(mesh);
 }
 return {object,cam:{az:20,el:17,dist:12,target:[0,1,0],fov:26,floor:false}};
}
