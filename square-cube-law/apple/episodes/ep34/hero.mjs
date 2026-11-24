export default function(THREE,{MAT,roundedBox,shadowsOn}){
 const object=new THREE.Group();
 [1.75,2.65,1.90,1.65,1.98].forEach((height,i)=>{
 const g=new THREE.Group(),base=new THREE.Mesh(roundedBox(1,.045,2),MAT.aluminium()),cap=new THREE.Mesh(roundedBox(1,.045,2),MAT.ceramicWhite());
 base.scale.set(.46,1.55,.52);base.position.y=.775;cap.scale.set(.46,height-1.55,.52);cap.position.y=1.55+(height-1.55)/2+(i===1?.16:0);g.position.x=(i-2)*.65;g.add(base,cap);object.add(g);
 });
 shadowsOn(object);return{object,cam:{az:18,el:10,dist:10.7,target:[0,1.15,0],fov:26},floor:false};
}
