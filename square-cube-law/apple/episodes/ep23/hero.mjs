import { makeCoffeeCup } from './coffee.mjs';
export default function(THREE,{MAT}){
  const object=new THREE.Group();
  for(let i=0;i<2;i++){
    const {group,surface}=makeCoffeeCup(THREE,MAT);
    group.position.x=i===0?-1.55:1.55;
    group.rotation.y=i===0?.18:-.13;
    surface.material.color.set(i===0?'#9A9A9E':'#19191C');
    surface.position.y=i===0?1.13:.95;
    object.add(group);
  }
  return {object,cam:{az:7,el:37,dist:17,target:[0,.67,0],fov:25}};
}
