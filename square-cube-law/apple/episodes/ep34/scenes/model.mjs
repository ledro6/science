import {defineScene,makeStage,Wd,P,lerp,atext,project,callout} from '../../../engine.mjs';
import {studio,camera,bar,txt} from './objects.mjs';
defineScene('model',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);return{stage,bars:[bar(stage,.55),bar(stage,.55),bar(stage,.55)]}},
 update(t,s,st){const focus=P(t,Wd('m2','Вот'),1);const caps=[.12,.6,.3];st.bars.forEach((b,i)=>{const a=i===1?1:1-focus;b.pose((i-1)*.85*(1-focus),1.4,caps[i],i===1?.35*P(t,Wd('m2','случайность'),1):0,a)});camera(st.stage,14-8*focus,13-.5*focus)},
 draw2d(t,s,st){const m2=Wd('m2','Вот');txt('Результат = навык + случайность',335,Wd('m1','модель'),t,st,53,{out:m2-.4});txt('Навык пока постоянен',435,Wd('m1','меняется'),t,st,59,{out:m2-.4});txt('Обычный уровень',335,m2,t,st,75);txt('Плюс удачная случайность',435,Wd('m2','случайность'),t,st,57);const a=P(t,Wd('m2','уровень'),.8),b=P(t,Wd('m2','случайность'),.8);const [x,y]=project(st.stage.camera,0,.8,0);callout(x-20,y,170,1000,Wd('m2','уровень'),t,st.stage.sub,a);atext('Навык',170,1055,Wd('m2','уровень'),t,{size:38,col:st.stage.sub});const [cx,cy]=project(st.stage.camera,0,2.05,0);callout(cx+30,cy,815,725,Wd('m2','случайность'),t,st.stage.sub,b);atext('Случайность',770,680,Wd('m2','случайность'),t,{size:35,col:st.stage.sub});txt('Упрощённая модель',535,Wd('m1','модель'),t,st,31,{col:st.stage.sub,out:m2-.4})},
 sfx(add){add(Wd('m2','случайность'),'click',.13,.9)}
});
