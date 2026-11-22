import { THREE, MAT, roundedBox, makeStage, orbit, P, Wd, atext, g, FONT, lerp, eApple, eStd } from '../../../engine.mjs';
export { P, Wd, atext };
export const DATA={A:{nov:[40,24],exp:[10,9]},B:{nov:[10,5],exp:[40,32]}};
const dummy=new THREE.Object3D();
export function setup(bg, mode){
 const stage=makeStage({bg});stage.floor.visible=false;stage.lights.key.castShadow=false;
 const geo=roundedBox(1,.09,2), mesh=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({roughness:.4,metalness:.14}),100);
 stage.root.add(mesh);stage.root.position.x=-.14;
 const trays=[];
 for(let j=0;j<2;j++){
  const tray=new THREE.Mesh(geo,bg==='white'?MAT.aluminium():MAT.graphite());tray.scale.set(1.65,2.8,.09);tray.position.set(j?1.28:-1.28,0,-.16);stage.root.add(tray);trays.push(tray);
 }
 const color=new THREE.Color();
 let i=0;
 for(const school of ['A','B'])for(const group of ['nov','exp']){
  const [n,pass]=DATA[school][group];for(let k=0;k<n;k++)mesh.setColorAt(i++,color.set(k<pass?(bg==='white'?'#444448':'#F2F2F0'):(bg==='white'?'#CACACF':'#363639')));
 }
 return {stage,mesh,trays,mode};
}
export function pose(t,s,st,{merge=0,entry=s.start,scale=1}={}){
 const {stage,mesh,mode}=st;const p=P(t,entry,.9);let i=0;
 for(let j=0;j<2;j++){
  const school=j?'B':'A', novice=DATA[school].nov[0];
  for(const group of ['nov','exp']){
   const n=DATA[school][group][0];for(let k=0;k<n;k++){
    const global=group==='nov'?k:k+novice;
    let active=mode==='all'||(mode==='nov'&&group==='nov')||(mode==='exp'&&group==='exp');
    let col,row,y;
    if(mode==='all'){
     col=global%5;row=Math.floor(global/5);y=1.25-row*.275+(group==='nov'?.18:-.18)*(1-merge);
    }else{col=k%5;row=Math.floor(k/5);y=-.97+(Math.ceil(n/5)-1-row)*.31;}
    const q=P(t,entry+(global%5)*.045,.85);
    dummy.position.set((j?1.28:-1.28)+(col-2)*.285, y-.24*(1-q), .10+.13*(1-q));
    dummy.scale.set(.245*scale*q,.245*scale*q,.135*scale*q);if(!active)dummy.scale.setScalar(0);
    dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix);
   }
  }
  st.trays[j].visible=mode==='all';st.trays[j].scale.set(1.65*p,2.8*p,.09);
 }
 mesh.instanceMatrix.needsUpdate=true;
 stage.root.scale.setScalar(scale);stage.root.rotation.set(0,-.06,0);stage.root.position.set(-.14,0,0);
 orbit(stage.camera,[0,.12,0],22,0,9);
 // All 3D inputs settle after the entrance and merge; 2D remains independent
 stage.scene.userData.staticKey=(t>entry+1.2&&(merge===0||merge===1))?`${mode}:${merge}:${scale}`:null;
}
export function labels(t,t0,st){
 for(const [name,x]of [['А',300],['Б',750]])atext('Школа '+name,x,635,t0,t,{size:45,col:st.stage.ink,w:600,dy:20});
}
export function legend(t,t0,st,y=1270){
 atext('1 фишка = 1 ученик',525,y,t0,t,{size:30,w:500,col:st.stage.sub,dy:14});
}
export function pill(t,at,press){
 const p=P(t,at,.8),dn=P(t,press,.14,eStd),up=P(t,press+.14,.6,eApple),k=(1-.055*dn+.055*up)*lerp(1.04,1,p);
 if(p<.003)return;g.save();g.globalAlpha=p;g.translate(520,1205+(1-p)*34);g.scale(k,k);g.fillStyle='#FF453A';g.beginPath();g.roundRect(-300,-56,600,112,56);g.fill();g.fillStyle='#FFFFFF';g.font=`600 44px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.letterSpacing='-.4px';g.fillText('Подписаться на L³',0,2);g.restore();
}
