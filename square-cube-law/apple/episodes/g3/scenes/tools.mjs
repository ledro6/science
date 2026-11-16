import { defineScene,makeStage,atext,P,Wd,lerp,eInOut,THREE,MAT } from '../../../engine.mjs';
import { machine,floorPlate,settings,makeBar } from '../models.mjs';
defineScene('tools',{
 setup(){
  const stage=makeStage({bg:'white',shadow:.32}),machines=[];
  stage.root.add(floorPlate(4.5,1.65));
  for(let i=0;i<6;i++){
   const m=machine();m.object.scale.setScalar(.55);m.object.position.set(-1.8+i*.72,.1,0);stage.root.add(m.object);machines.push(m);
  }
  const bars=[];
  for(let i=0;i<6;i++){const b=makeBar(.28,.28,MAT.aluminium());b.position.set(-1.8+i*.72,0,.90);stage.root.add(b);bars.push(b);}
  return{stage,machines,bars,extra:Wd('t1','ещё'),adopt:Wd('t2','перенимать')};
 },
 update(t,s,{stage,machines,bars,extra,adopt}){
  const p=P(t,extra-.1,.85,eInOut);
  machines.forEach((m,i)=>{const k=i<5?1:p;m.object.visible=k>.001;m.object.scale.setScalar(Math.max(.001,.55*k));m.pose(t+i*.7);});
  bars.forEach((b,i)=>{const k=P(t,extra+.3+i*.13,.75,eInOut);b.setH(Math.max(.03,[.50,.34,.25,.18,.13,.09][i]*k));});
  settings(stage,t,s,{distance:25.8,sy:900,target:[0,.35,0],az:13});
  stage.lights.rimR.intensity=1.0+P(t,adopt,.9);
 },
 draw2d(t,s,{stage,extra,adopt}){
  atext('Каждый следующий',540,359,extra-.15,t,{size:96,col:stage.ink,out:adopt-.35});
  atext('даёт меньше',540,469,extra+.03,t,{size:108,col:stage.ink,out:adopt-.35});
  atext('Известные технологии',540,360,adopt,t,{size:86,col:stage.ink});
  atext('Можно перенимать',540,456,adopt+.23,t,{size:61,col:stage.sub});
  atext('Схема убывающей отдачи',540,1238,extra+.9,t,{size:38,w:500,col:stage.sub});
 },
 sfx(add){add(Wd('t1','ещё')-.2,'whoosh',.21,.9);add(Wd('t1','меньшую'),'tick',.16,.9);add(Wd('t2','перенимать'),'chime',.18,.9);}
});
