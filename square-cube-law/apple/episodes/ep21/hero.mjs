import { makeCup } from './cup.mjs';
export default function (THREE, { MAT }) {
  const object=new THREE.Group();
  const {cup,water}=makeCup(THREE,MAT);
  water.material.opacity=.07;
  object.add(cup);
  const geometry=new THREE.SphereGeometry(1,10,6),material=MAT.graphite();
  for(let i=0;i<25;i++){
    const leaf=new THREE.Mesh(geometry,material),a=i*2.399963,r=.34*Math.sqrt((i+.5)/25);
    leaf.position.set(r*Math.cos(a),.25,r*Math.sin(a));
    leaf.scale.set(.07,.014,.026);leaf.rotation.y=a;leaf.castShadow=true;cup.add(leaf);
  }
  return {object,cam:{az:2,el:40,dist:9.1,target:[0,.62,0],fov:25}};
}
