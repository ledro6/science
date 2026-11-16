import { defineScene,makeStage,atext,P,Wd,lerp,eInOut,THREE,MAT } from '../../../engine.mjs';
import { rbox,settings } from '../models.mjs';
const labels=[['Инвестиции','инвестиции'],['Образование','образование'],['Правила','правила']];
defineScene('conditions',{
 setup(){
  const stage=makeStage({bg:'white',shadow:.3});
  const groups=labels.map((_,i)=>{
   const g=new THREE.Group();g.position.x=(i-1)*1.38;
   const base=new THREE.Mesh(rbox(.90,.14,.86,.035),MAT.graphite());base.position.y=.07;g.add(base);
   if(i===0){for(let j=0;j<4;j++){const c=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.12,32),MAT.aluminium());c.position.set(0,.22+j*.14,0);g.add(c);}}
   if(i===1){for(let j=0;j<3;j++){const b=new THREE.Mesh(rbox(.68,.14,.52,.025),MAT.ceramicWhite());b.position.set(0,.24+j*.18,0);b.rotation.y=(j-1)*.16;g.add(b);}}
   if(i===2){for(let j=0;j<3;j++){const b=new THREE.Mesh(rbox(.44,.12,.62,.025),MAT.ceramicWhite());b.position.set(0,.24+j*.18,0);g.add(b);}}
   g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   stage.root.add(g);return g;
  });
  return{stage,groups,times:labels.map(([,word])=>Wd('c1',word))};
 },
 update(t,s,{stage,groups,times}){
  groups.forEach((o,i)=>{const p=P(t,times[i]-.13,.65,eInOut);o.visible=p>.001;o.position.y=(1-p)*.4;o.scale.setScalar(Math.max(.001,p));});
  settings(stage,t,s,{distance:24.3,sy:900,target:[0,.35,0],az:12});
 },
 draw2d(t,s,{stage,times}){
  atext('Рост требует условий',540,355,Wd('c1','доход'),t,{size:88,col:stage.ink,out:Wd('c2','условиях')-.35});
  atext('При подходящих условиях',540,449,Wd('c2','условиях')-.07,t,{size:72,col:stage.ink});
  labels.forEach(([name],i)=>atext(name,245+i*295,1140,times[i],t,{size:41,col:stage.ink}));
 },
 sfx(add){labels.forEach(([,word],i)=>add(Wd('c1',word),'click',.16,.85+i*.1));add(Wd('c2','условиях'),'chime',.18,.95);}
});
