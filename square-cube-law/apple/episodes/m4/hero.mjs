import { makeMirror, makePerson } from './mirror.mjs';
export default function (THREE,{MAT}) {
  const object=new THREE.Group();
  const mirror=makeMirror(THREE,MAT,true);
  const person=makePerson(THREE,MAT), image=makePerson(THREE,MAT,true);
  person.object.position.set(-.16,0,1.25);
  image.object.position.set(-.16,0,-1.25);
  person.arm.rotation.z=1.65; image.arm.rotation.z=1.65; image.object.scale.z=-1;
  object.add(mirror,person.object,image.object);
  return {object,cam:{az:42,el:13,dist:17.8,target:[0,1.5,0],fov:25}};
}
