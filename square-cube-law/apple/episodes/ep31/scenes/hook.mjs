import {defineScene,makeStage,Wd,P,atext,lerp} from '../../../engine.mjs';
import {studio,pair,pairCamera,txt} from './objects.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,clocks:pair(stage)}},
 update(t,s,st){const p=P(t,Wd('h1','вернулся'),1.6);st.clocks.pose(t,10*p,6*p,lerp(.92,1,P(t,.2,1.2)));pairCamera(st.stage);st.stage.scene.userData.staticKey=t>3?'hook-hold':null},
 draw2d(t,s,st){txt('Вернулся моложе',370,Wd('h1','моложе'),t,st,96);txt('Как такое возможно?',475,Wd('h1','Как'),t,st,60,{col:st.stage.sub,out:Wd('h2','Возьмём')-.4});txt('Двое одинаковых часов',475,Wd('h2','двое'),t,st,55,{col:st.stage.sub});atext('Земля',270,1160,Wd('h2','Земле'),t,{size:45,col:st.stage.sub});atext('Корабль',730,1160,Wd('h2','другие'),t,{size:45,col:st.stage.sub})},
 sfx(add){add(Wd('h1','моложе'),'bloom',.18,.8)}
});
