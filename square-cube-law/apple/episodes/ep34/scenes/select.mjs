import {defineScene,makeStage,Wd,P,lerp,atext,project,g,accent} from '../../../engine.mjs';
import {studio,camera,bar,txt,hline} from './objects.mjs';
const extras=[.15,.70,.33,.84,.08,.76,.4],chosen=[1,3,5];
defineScene('select',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,bars:extras.map(()=>bar(stage,.30))}},
 update(t,s,st){const select=P(t,Wd('s1','специально'),1),renew=P(t,Wd('s2','гарантирована'),1);st.bars.forEach((b,i)=>{const k=chosen.indexOf(i),a=k<0?1-select:1;const dest=k<0?(i-3)*.43:(k-1)*.85;b.pose(lerp((i-3)*.43,dest,select),1.4,extras[i]*(1-renew),0,a)});camera(st.stage,10,13)},
 draw2d(t,s,st){const s2=Wd('s2','При');txt('Выберем только рекорды',340,Wd('s1','выберем'),t,st,72,{out:s2-.4});txt('Отбор крайних значений',445,Wd('s1','отобрали'),t,st,52,{col:st.stage.sub,out:s2-.4});txt('Удача не гарантирована',340,Wd('s2','удача'),t,st,69);txt('Навык остаётся тем же',445,Wd('s2','гарантирована'),t,st,55,{col:st.stage.sub});const a=P(t,Wd('s1','высокие'),.8)*(1-P(t,Wd('s1','специально'),.5));if(a>.001){chosen.forEach(i=>{const [x,y]=project(st.stage.camera,(i-3)*.43,1.4+extras[i]+.05,0);g.save();g.globalAlpha=a;g.strokeStyle=accent();g.lineWidth=3;g.beginPath();g.roundRect(x-35,y-35,70,70,14);g.stroke();g.restore()})}},
 sfx(add){add(Wd('s1','выберем'),'click',.12,.9);add(Wd('s2','гарантирована'),'whoosh',.12,.8)}
});
