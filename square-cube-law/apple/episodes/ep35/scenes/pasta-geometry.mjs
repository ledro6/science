// Original procedural model. Analytic early release curvature follows Audoly & Neukirch (2005).
// Display time is deliberately slowed; after fracture the detached pieces are illustrative.
const LEN=2.25, N=100, K=.6;
const fs=[0]; const STEP=.005;
for(let i=1;i<=5000;i++){const a=(i-1)*STEP,b=i*STEP;fs[i]=fs[i-1]+STEP*.5*(Math.sin(Math.PI*a*a/2)+Math.sin(Math.PI*b*b/2))}
function fresnel(x){if(x>=25)return .5;const i=x/STEP,j=Math.floor(i);return fs[j]+(fs[j+1]-fs[j])*(i-j)}
export function curvature(s,t){return t<.00001?1:2*fresnel(s/Math.sqrt(2*Math.PI*t))}
export function makePasta(THREE,{dark=false}={}){
 const object=new THREE.Group();
 const mat=new THREE.MeshPhysicalMaterial({color:dark?'#C8C8C6':'#F2F2F0',roughness:.48,clearcoat:.2});
 const geometry=new THREE.CylinderGeometry(.031,.031,1,12,1,true);
 const meshes=[-1,1].map(sign=>{const mesh=new THREE.InstancedMesh(geometry,mat,N);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=false;object.add(mesh);return{mesh,sign}});
 const unit=new THREE.Vector3(0,1,0),d=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),tmp=new THREE.Object3D();
 const points={};
 function pose({release=0,split=0,bend=1,second=false,gap=0}={}){
  const k=K*bend, sx=Math.sin(k*LEN)/(k||.000001),sy=2+(Math.cos(k*LEN)-1)/(k||.000001);
  for(const {mesh,sign} of meshes){
   let x=sx,y=sy,theta=-k*LEN;const p=[[x*sign,y,0]];
   for(let i=0;i<N;i++){const s=LEN-(i+.5)*LEN/N;const kap=k*curvature(s,release);theta+=kap*LEN/N;x-=Math.cos(theta)*LEN/N;y-=Math.sin(theta)*LEN/N;p.push([sign*x,y,0])}
   points[sign]=p;
   for(let i=0;i<N;i++){
    a.fromArray(p[i]);b.fromArray(p[i+1]);
    // A small gap makes the newly free central ends readable without implying travel speed.
    a.x+=sign*gap;b.x+=sign*gap;
    if(second&&sign===1&&i>45){const ang=-split*.32,ox=p[46][0]+gap,oy=p[46][1];for(const v of[a,b]){const vx=v.x-ox,vy=v.y-oy;v.x=ox+Math.cos(ang)*vx-Math.sin(ang)*vy+split*.10;v.y=oy+Math.sin(ang)*vx+Math.cos(ang)*vy+split*.13}}
    d.subVectors(b,a);tmp.position.copy(a).add(b).multiplyScalar(.5);tmp.quaternion.setFromUnitVectors(unit,d.clone().normalize());tmp.scale.set(1,(second&&sign===1&&i===46)?0.00001:d.length()*1.018,1);tmp.updateMatrix();mesh.setMatrixAt(i,tmp.matrix);
   }
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  }
 }
 pose();return {object,pose,points};
}
