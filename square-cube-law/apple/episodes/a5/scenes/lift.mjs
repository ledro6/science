import {defineScene,makeStage,atext,P,Wd,lerp,eInOut,project,line} from '../../../engine.mjs';
import {makeTyre,road,frame,arrow} from '../kit.mjs';
defineScene('lift',{
 setup(){
  const stage=makeStage({bg:'black',shadow:.5}),tyre=makeTyre(),path=road(true);
  stage.root.add(path.group,tyre.group);
  return {stage,tyre,path,rise:Wd('l1','растёт'),lift:Wd('l2','приподнимается'),contact:Wd('l2','контакт')};
 },
 update(t,s,{stage,tyre,path,rise,lift}){
  const p=P(t,rise-.6,1.2,eInOut),q=P(t,lift-.2,1.2,eInOut);
  tyre.group.position.y=1.08+.23*q;tyre.spin.rotation.z=-t*.63;
  path.wedge.scale.y=Math.max(.001,p);path.stripe.scale.x=lerp(1,.12,q);
  frame(stage.camera,[.07,.86,0],lerp(14.2,13.7,P(t,s.start,s.end-s.start)),9,7,520,886);
 },
 draw2d(t,s,{stage,rise,lift,contact}){
  atext('Вода не успевает уйти',520,356,Wd('l1','успевает')-.1,t,{size:86,col:stage.ink,out:contact-.3});
  atext('Меньше контакта',520,356,contact-.05,t,{size:99,col:stage.accent});
  const p=P(t,lift-.2,.75),[x,y]=project(stage.camera,.58,.25,0);
  arrow(x,y+70,x,y+70-130*p,stage.ink,p,3,16);
  const [a,b]=[project(stage.camera,-.5,.09,.34),project(stage.camera,.5,.09,.34)];
  const k=1-P(t,lift,1.3,eInOut);
  line(a[0],a[1],a[0]+(b[0]-a[0])*Math.max(.12,k),b[1],stage.accent,P(t,contact-.08,.5),6);
 },
 sfx(add){add(Wd('l1','растёт')-.2,'riser',.16,.8);add(Wd('l2','приподнимается'),'whoosh',.21,.85);add(Wd('l2','контакт'),'impact',.25,.9);}
});
