import {defineScene,P,Wd,atext,eInOut,project,line} from '../../../engine.mjs';
import {orbitSetup,poseOrbit,header,label,foot,CY} from './shared.mjs';
function turn(t){return Math.PI*P(t,Wd('c1','Метка'),4.55,eInOut);}
defineScene('counter',{
 setup(){return orbitSetup('black');},
 update(t,s,st){const theta=turn(t);poseOrbit(st,theta,0);const a=Wd('c1','Метка'),b=a+4.55;st.stage.scene.userData.staticKey=t>a&&t<b?null:`counter-${theta.toFixed(6)}`;},
 draw2d(t,s,st){
  header(t,Wd('c1','отключим'),st,'Без осевого','вращения');foot(t,Wd('c1','оси'),st);
  const [ex,ey]=project(st.stage.camera,0,CY,0);label(t,'Земля',ex,ey+160,Wd('c1','А'),st);
  label(t,'Метка не меняет направление',500,1210,Wd('c1','одном'),st,{size:39,out:Wd('c2','другую')-.4});
  label(t,'Земля видит другую сторону',500,1210,Wd('c2','другую'),st,{size:43,col:st.stage.ink});
 },
 sfx(add){add(Wd('c1','отключим'),'click',.16,.7);add(Wd('c2','другую'),'thud',.16,.8);}
});
