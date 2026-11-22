// Episode-local geometry, also imported by the cover hero. No shared engine changes.
export function moonModel(THREE, {marker=true, accent='#FF453A'}={}) {
 const group=new THREE.Group();
 const base=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshStandardMaterial({color:'#C8C8C6',roughness:.92}));group.add(base);
 const N=54, rim=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.13,6,24),new THREE.MeshStandardMaterial({color:'#BDBDBB',roughness:1}),N);
 const pit=new THREE.InstancedMesh(new THREE.CircleGeometry(1,24),new THREE.MeshStandardMaterial({color:'#91918F',roughness:1}),N);
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),z=new THREE.Vector3(0,0,1),n=new THREE.Vector3(),p=new THREE.Vector3(),sc=new THREE.Vector3();
 for(let i=0;i<N;i++){
  const zz=1-2*(i+.5)/N, ang=i*2.3999632297, rr=Math.sqrt(1-zz*zz);n.set(rr*Math.cos(ang),rr*Math.sin(ang),zz);q.setFromUnitVectors(z,n);
  const r=.045+.066*(.5+.5*Math.sin(i*16.41));p.copy(n).multiplyScalar(.997);sc.set(r,r,r*.28);matrix.compose(p,q,sc);rim.setMatrixAt(i,matrix);
  p.copy(n).multiplyScalar(1.001);sc.set(r*.82,r*.82,r);matrix.compose(p,q,sc);pit.setMatrixAt(i,matrix);
 }
 group.add(pit,rim);
 const mark=new THREE.Group();
 const disc=new THREE.Mesh(new THREE.CircleGeometry(.14,32),new THREE.MeshBasicMaterial({color:accent}));
 disc.position.set(-.88,0,.48);disc.quaternion.setFromUnitVectors(z,new THREE.Vector3(-.88,0,.48).normalize());mark.add(disc);
 mark.visible=marker;group.add(mark);
 return {group,mark};
}
export function earthModel(THREE){
 const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.SphereGeometry(.62,40,28),new THREE.MeshStandardMaterial({color:'#555559',roughness:.55,metalness:.12})));
 const lineMat=new THREE.LineBasicMaterial({color:'#A8A8AC',transparent:true,opacity:.7});
 for(const y of [-.31,0,.31]){const r=Math.sqrt(.63*.63-y*y),pts=[];for(let i=0;i<=64;i++){let a=i/64*Math.PI*2;pts.push(new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)))}group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineMat))}
 for(const a of [0,Math.PI/3,Math.PI*2/3]){const pts=[];for(let i=0;i<=64;i++){let t=i/64*Math.PI*2;pts.push(new THREE.Vector3(.63*Math.sin(t)*Math.cos(a),.63*Math.cos(t),.63*Math.sin(t)*Math.sin(a)))}group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineMat))}
 return group;
}
