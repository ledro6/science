export default function(THREE, { MAT, roundedBox }) {
  const object = new THREE.Group();
  const geo = roundedBox(1,.07,2);
  for(let school=0;school<2;school++){
    const h=school?3.7:3.3;
    const bar=new THREE.Mesh(geo,MAT.ceramicWhite());bar.scale.set(1.3,h,.8);bar.position.set(school?1.15:-1.15,h/2,0);object.add(bar);
    const base=new THREE.Mesh(geo,MAT.graphite());base.scale.set(1.7,.2,1.25);base.position.set(school?1.15:-1.15,-.16,0);object.add(base);
    const cap=new THREE.Mesh(geo,MAT.aluminium());cap.scale.set(1.34,.10,.84);cap.position.set(school?1.15:-1.15,h+.08,0);object.add(cap);
  }
  return {object, floor:false, cam:{az:20,el:13,dist:11.8,target:[0,1.7,0],fov:24}};
}
