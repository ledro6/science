import {defineScene,P,Wd,atext,E,project,line,dot,lerp,eInOut,clamp} from '../../../engine.mjs';
import {orbitSetup,poseOrbit,header,label,foot,CY} from './shared.mjs';
function theta(t){const q=P(t,Wd('s2','четверть'),2.7,eInOut),r=P(t,Wd('s3','Один'),3.15,eInOut);return Math.PI*.5*q+Math.PI*1.5*r;}
defineScene('sync',{
 setup(){return orbitSetup('white');},
 update(t,s,st){const a=theta(t);poseOrbit(st,a,a,t>=Wd('s1','Красная'));const moving=(t>Wd('s2','четверть')&&t<Wd('s2','четверть')+2.7)||(t>Wd('s3','Один')&&t<Wd('s3','Один')+3.15);st.stage.scene.userData.staticKey=moving?null:`sync-${a.toFixed(6)}-${st.moon.mark.visible}`;},
 draw2d(t,s,st){
  const T=Wd('s3','Один');header(t,Wd('s1','Земля'),st,'Одна сторона','к Земле',T-.45);
  const [ex,ey]=project(st.stage.camera,0,CY,0);label(t,'Земля',ex,ey+160,Wd('s1','Земля'),st);
  foot(t,Wd('s1','центре'),st);
  label(t,'¼ орбиты = ¼ оборота',500,1210,Wd('s2','четверть',1),st,{size:43,col:st.stage.ink,out:T-.4});
  atext('1 = 1',500,365,T,t,{size:170,w:600,col:st.stage.ink});label(t,'Круг по орбите = оборот вокруг оси',500,438,Wd('s3','оборот'),st,{size:36,col:st.stage.ink});
  // A thin sightline is explicit about which side faces Earth.
  const [mx,my]=project(st.stage.camera,st.moon.group.position.x,st.moon.group.position.y,0);const p=P(t,Wd('s1','метка'),.7);line(lerp(ex,mx,.31),lerp(ey,my,.31),lerp(ex,mx,.74),lerp(ey,my,.74),st.stage.sub,.65*p,2,[6,8]);
 },
 sfx(add){add(Wd('s1','метка'),'click',.13);add(Wd('s3','Один'),'chime',.18,.75);}
});
