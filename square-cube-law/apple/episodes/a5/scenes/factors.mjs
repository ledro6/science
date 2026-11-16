import {defineScene,makeStage,atext,P,Wd,lerp,eInOut,THREE,MAT} from '../../../engine.mjs';
import {makeTyre,frame} from '../kit.mjs';
defineScene('factors',{
 setup(){
  const stage=makeStage({bg:'white',shadow:.3}),fresh=makeTyre(),worn=makeTyre({worn:true});
  fresh.group.position.set(-1.25,.77,0);worn.group.position.set(1.25,.77,0);
  fresh.group.scale.setScalar(.69);worn.group.scale.setScalar(.69);
  stage.root.add(fresh.group,worn.group);
  const rows=[];
  for(let side=0;side<2;side++){
   const mat=side?MAT.graphite():MAT.aluminium();
   const tray=new THREE.Group();
   for(let i=0;i<4;i++){
    const block=new THREE.Mesh(new THREE.BoxGeometry(.25,side?.12:.35,.45),mat);
    block.position.set((i-1.5)*.35,side?.06:.175,0);tray.add(block);
   }
   tray.position.set(side?1.25:-1.25,.08,1.1);stage.root.add(tray);rows.push(tray);
  }
  return {stage,fresh,worn,rows,wear:Wd('f2','Изношенные')};
 },
 update(t,s,{stage,fresh,worn,rows,wear}){
  fresh.spin.rotation.z=-t*.16;worn.spin.rotation.z=-t*.16;
  const p=P(t,wear-.2,.8,eInOut);
  rows.forEach(r=>{r.visible=p>.001;r.scale.y=Math.max(.001,p);});
  frame(stage.camera,[0,.60,0],19.2,lerp(17,10,P(t,s.start,s.end-s.start)),lerp(15,24,p),520,890);
 },
 draw2d(t,s,{stage,wear}){
  const cut=Wd('f2','Поэтому')-.3;
  atext('Важны условия',520,353,Wd('f1','зависит')-.1,t,{size:100,col:stage.ink,out:cut});
  atext('Скорость · вода · шины',520,456,Wd('f1','скорости')-.1,t,{size:49,w:500,col:stage.sub,out:cut});
  atext('Единого порога нет',520,353,Wd('f2','единственной')-.1,t,{size:98,col:stage.ink});
  atext('Глубокие канавки',285,1224,wear-.1,t,{size:43,w:500,col:stage.sub});
  atext('Изношенные',765,1224,wear-.1,t,{size:43,w:500,col:stage.sub});
 },
 sfx(add){add(Wd('f1','скорости'),'tick',.14,.9);add(Wd('f1','глубины'),'tick',.14,.98);add(Wd('f2','единственной'),'thud',.18,.8);add(Wd('f2','Изношенные'),'click',.17,.94);}
});
