import * as THREE from 'three';
import {SC,C,E,Wd,WdE,P,atext,defineScene,makeStage,orbit,lerp,line,dot} from '../../../engine.mjs';
import {kit} from './props.mjs';
import {mitten,hand,mother,child,apartment} from './details.mjs';
import {compositeShot,glide} from './cinematography.mjs';
const K=kit(THREE),INK='#f5f5f7',GRAY='#a8adb7',RED='#ff453a';
const mv=(t,a,d)=>glide((t-a)/d);
const txt=(s,y,a,t,size=72,o={})=>atext(s,510,y,a,t,{size,w:650,col:INK,...o});
function card(s,t,label,title){txt(label,292,s.start+.1,t,33,{col:GRAY,track:.08});txt(title,390,s.start+.22,t,76)}
function setup(id){
 const stage=makeStage({fov:28});stage.scene.userData.staticKey='h2-'+id;stage.floor.visible=false;stage.lights.key.castShadow=false;
 const add=o=>stage.root.add(o);let st={stage};
 if(id==='warning'){
  const door=apartment();Object.assign(st,door);add(door.object);
  const neighbor=K.silhouette();neighbor.position.set(.72,-.65,-.15);add(neighbor);st.neighbor=neighbor;
  const own=K.silhouette(),other=K.silhouette();
  const flat=K.glow(0x12141a);for(const p of[own,other]){p.traverse(x=>{if(x.isMesh)x.material=flat});p.rotation.x=-Math.PI/2;p.scale.set(.62,1.02,.018);p.position.y=-2.17;add(p)}
  own.position.set(-.68,-2.17,1.88);other.position.set(.2,-2.16,1.8);st.own=own;st.other=other;
  orbit(stage.camera,[0,-.15,.35],12,4,13);stage.root.scale.setScalar(.68);
 }else if(id==='voice'||id==='descent'){
  const door=K.doors();Object.assign(st,door);add(door.object);
  const woman=mother();woman.position.set(.25,-.56,-.08);add(woman);st.woman=woman;
  // A quiet age cue, no photorealistic facial reveal.
  const button=K.box(.22,.22,.08,K.glow(0x922923),-1.12,.53,.31);add(button);st.button=button;
  orbit(stage.camera,[0,.04,0],12,0,0);stage.root.scale.setScalar(.68);
 }else if(id==='mitten'){
  const palm=hand();palm.rotation.z=-Math.PI/2;palm.position.set(.12,-.15,0);palm.scale.setScalar(1.12);add(palm);
  const glove=mitten();glove.position.set(-.10,.10,.32);glove.rotation.z=-.17;glove.scale.setScalar(.93);add(glove);
  add(K.box(.18,3.5,.40,K.standard(0x737880,.5),-1.51,0,-.36));
  add(K.box(.18,3.5,.40,K.standard(0x737880,.5),1.51,0,-.36));
  st.glove=glove;orbit(stage.camera,[0,.06,0],9,0,0);stage.root.scale.setScalar(.75);
 }else if(id==='truth'){
  const door=K.doors();Object.assign(st,door);add(door.object);
  const woman=mother();woman.position.set(.55,-.6,-.18);add(woman);st.woman=woman;
  const kid=child();kid.object.position.set(-.65,-1.15,.65);add(kid.object);st.kid=kid;
  orbit(stage.camera,[0,-.08,0],12,0,0);stage.root.scale.setScalar(.68);
 }else{
  const hall=K.corridor();add(hall);
  const phone=K.phone();phone.object.position.set(-.78,-.72,-.1);phone.object.scale.setScalar(.42);add(phone.object);st.phone=phone;
  const kid=child();kid.object.position.set(.62,-.83,-.12);add(kid.object);st.kid=kid;
  const button=K.box(.26,.26,.1,K.standard(0x979ca5,.55),1.3,-.30,.4);add(button);st.button=button;
  const door=K.doors();door.object.children[0].visible=false;door.object.position.z=1.1;add(door.object);Object.assign(st,door);
  orbit(stage.camera,[0,-.03,.2],12,0,0);stage.root.scale.setScalar(.68);
 }
 stage.root.position.y=.30;return st;
}
for(const id of ['warning','voice','mitten','truth','descent','yesterday','outro'])defineScene(id,{
 setup:()=>setup(id),composite3d:compositeShot,
 update(t,s,st){
  if(id==='warning'){
   const open=mv(t,Wd('h201','открыл'),1.6),shut=mv(t,Wd('h202','закрылась')-.35,1.35);
   st.pivot.rotation.y=-1.24*(open-shut);
   const drift=mv(t,Wd('h202','скользнула'),2.9),cross=mv(t,Wd('h202','вошла'),1.7);
   st.other.position.set(lerp(.20,.55,drift),-2.16,lerp(1.8,-1.3,cross));
   st.other.scale.set(.62*(1-.35*cross),1.02,.018);
   st.neighbor.position.set(.72,-.65,lerp(-.15,-1.3,cross));
  }else if(id==='voice'){
   const open=.22;st.left.position.x=-.693-open;st.right.position.x=.693+open;
  }else if(id==='truth'){
   const close=mv(t,Wd('h207','осталась'),1.8);st.left.position.x=lerp(-1.64,-.80,close);st.right.position.x=lerp(1.64,.80,close);
   const away=mv(t,Wd('h208','увёз'),2.5);st.kid.object.position.x=lerp(-.65,-1.26,away);
  }else if(id==='descent'){
   const shut=mv(t,Wd('h209','шагнул')+.4,2.3);st.left.position.x=lerp(-1.92,-1.55,shut);st.right.position.x=lerp(1.92,1.55,shut);
   const press=mv(t,Wd('h210','нажала'),.9);st.button.material.color.setHex(press>.5?0xff453a:0x922923);
  }else if(id==='yesterday'||id==='outro'){
   const open=id==='outro'?1:mv(t,Wd('h212','разошлись'),2.25);
   st.left.position.x=-.693-open*1.48;st.right.position.x=.693+open*1.48;
   const reach=id==='outro'?mv(t,Wd('h213','потянулся'),2.1):0;
   st.kid.arm.rotation.z=1.6*reach;
   const look=id==='outro'?mv(t,Wd('h214','посмотрел'),1.35):0;
   st.kid.object.rotation.y=-.30+.30*look;
  }
 },
 draw2d(t,s){
  if(id==='warning'){
   txt('ШЕСТОЙ ЭТАЖ · ЧАСТЬ 2',292,s.start+.1,t,33,{col:GRAY,track:.08,out:C('h202')});
   txt('Оно уже вышло',390,s.start+.22,t,76,{out:C('h202')});
   txt('Художественный вымысел',1280,s.start+.35,t,34,{col:GRAY,out:C('h202')});
  }else if(id==='voice'){
   card(s,t,'ГОЛОС ИЗ ЛИФТА','Мама?');
   txt('Пропала двадцать лет назад',1240,Wd('h204','пропала'),t,45,{col:GRAY});
  }else if(id==='mitten'){
   card(s,t,'ВТОРАЯ ВАРЕЖКА','Тот самый шов');
   const a=Wd('h206','шов');txt('Я зашивал её сам',1220,a,t,45,{col:GRAY});
  }else if(id==='truth'){
   card(s,t,'В ТОТ ДЕНЬ','Ты вышел');
   txt('Я осталась здесь',1220,Wd('h207','осталась'),t,55,{col:GRAY});
  }else if(id==='descent'){
   card(s,t,'ДВАДЦАТЬ ЛЕТ СПУСТЯ','Закрыть двери раньше');
   txt('6',1200,Wd('h210','шестую'),t,85,{col:RED});
  }else if(id==='yesterday'){
   card(s,t,'ПО ТУ СТОРОНУ','Тот самый день');
   txt('Не зови себя',1220,Wd('h211','зови'),t,55,{col:GRAY});
  }else{
   txt('Одна варежка',320,s.start+.15,t,38,{col:GRAY,out:C('h214')-.4});
   txt('Без мамы?',390,Wd('h214','без'),t,77);
   txt('Продолжение следует',620,E('h214')+.25,t,49,{col:GRAY,dur:.6});
  }
 },
 sfx(add,s){
  if(id==='warning'){add(Wd('h201','открыл'),'click',.38,.65);add(Wd('h202','закрылась'),'thud',.44,.61)}
  if(id==='voice')add(Wd('h203','Мама'),'swell',.18,.56);
  if(id==='mitten')add(Wd('h205','варежка'),'swell',.18,.56);
  if(id==='truth')add(Wd('h207','осталась'),'thud',.26,.60);
  if(id==='descent'){add(Wd('h210','нажала'),'click',.35,.63);add(Wd('h210','вниз'),'swell',.24,.53)}
  if(id==='yesterday')for(const d of[.15,.39,1.1,1.34])add(Wd('h211','зазвонил')+d,'chime',.42,1.12);
  if(id==='outro')add(Wd('h214','без'),'thud',.32,.61);
 }
});
