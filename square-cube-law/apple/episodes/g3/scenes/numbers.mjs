import { defineScene,makeStage,atext,P,Wd,eInOut,lerp,MAT,THREE } from '../../../engine.mjs';
import { makeBar,settings } from '../models.mjs';
defineScene('numbers',{
 setup(){
  const stage=makeStage({bg:'black',shadow:.5});
  const base=[],plus=[];
  for(const x of [-1.03,1.03]){
   const b=makeBar(.72,.72,MAT.ceramicWhite()),p=new THREE.Mesh(new THREE.BoxGeometry(.72,1,.72),MAT.aluminium());
   p.geometry.translate(0,.5,0);
   b.position.x=p.position.x=x;stage.root.add(b,p);base.push(b);plus.push(p);
  }
  return{stage,base,plus,first:Wd('n1','десяти'),percent:Wd('n1','процентов'),second:Wd('n2','тысяче'),one:Wd('n2','один')};
 },
 update(t,s,{stage,base,plus,first,second}){
  const grow=P(t,first-.1,.7,eInOut),q=P(t,second,.7,eInOut);
  const heights=[.25,2.5];
  base.forEach((b,i)=>{const p=i===0?P(t,s.start,.7):q;b.setH(Math.max(.03,heights[i]*p));});
  plus.forEach((b,i)=>{const k=i===0?grow:q;const h=.025*k;b.scale.y=Math.max(.0001,h);b.position.y=heights[i];b.visible=k>.04;});
  settings(stage,t,s,{distance:22,sy:830,target:[0,1.1,0],az:15});
 },
 draw2d(t,s,{stage,first,percent,second,one}){
  atext('Одинаковая прибавка',540,350,Wd('n1','база'),t,{size:88,col:stage.ink});
  atext('+10',540,475,first,t,{size:137,col:stage.accent});
  atext('100 → 110',300,1148,first,t,{size:50,col:stage.ink});
  atext('10%',300,1242,percent-.03,t,{size:68,col:stage.ink});
  atext('1000 → 1010',770,1148,second,t,{size:47,col:stage.ink});
  atext('1%',770,1242,one,t,{size:68,col:stage.ink});
  atext('Условный числовой пример',540,565,Wd('n1','Условный'),t,{size:37,w:500,col:stage.sub});
 },
 sfx(add){add(Wd('n1','десяти')-.2,'thud',.22,.82);add(Wd('n1','процентов'),'tick',.15,.9);add(Wd('n2','один'),'chime',.18,1);}
});
