import {defineScene,makeStage,atext,P,Wd,lerp,eInOut,project} from '../../../engine.mjs';
import {makeTyre,road,droplets,poseWater,frame,arrow} from '../kit.mjs';
defineScene('drain',{
 setup(){
  const stage=makeStage({bg:'white',shadow:.3}),tyre=makeTyre(),path=road(false),flow=droplets();
  stage.root.add(path.group,tyre.group,flow.group);path.wedge.visible=false;
  return {stage,tyre,path,flow,water:Wd('d1','воду'),touch:Wd('d2','касается')};
 },
 update(t,s,{stage,tyre,flow,water}){
  tyre.group.position.y=1.08;tyre.spin.rotation.z=-t*.38;
  poseWater(flow,t,water);
  const q=P(t,s.start,s.end-s.start,eInOut);
  frame(stage.camera,[0,.88,0],lerp(14.6,13.7,q),lerp(18,30,q),lerp(17,23,q),520,890);
 },
 draw2d(t,s,{stage,water,touch}){
  const cut=touch-.3;
  atext('Вода уходит в канавки',520,355,Wd('d1','протектор')-.1,t,{size:88,col:stage.ink,out:cut});
  atext('Есть контакт',520,355,touch-.06,t,{size:102,col:stage.ink});
  atext('Есть сцепление',520,461,touch+.4,t,{size:62,w:500,col:stage.sub});
  const p=P(t,water-.1,.75)*(1-P(t,touch-.25,.35));
  const [x,y]=project(stage.camera,0,.14,0);
  arrow(x,y,x-144*p,y+66*p,stage.ink,p,3,14);
  arrow(x,y,x+144*p,y+66*p,stage.ink,p,3,14);
 },
 sfx(add){add(Wd('d1','воду'),'whoosh',.19,.93);add(Wd('d2','касается'),'tick',.16,.9);add(Wd('d2','поворачивают'),'click',.16,1);}
});
