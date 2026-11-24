import {defineScene,makeStage,Wd,P,lerp,atext,accent} from '../../../engine.mjs';
import {studio,camera,bar,txt} from './objects.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return {stage,bars:[bar(stage,.7),bar(stage,.7)]}},
 update(t,s,st){const p=P(t,Wd('h1','результаты'),.9);st.bars[0].pose(-.65,1.5,.75,0,P(t,.1,1));st.bars[1].pose(.65,1.5,lerp(.75,.10,p),0,P(t,Wd('h1','результаты'),.8));camera(st.stage,15-4*P(t,Wd('h2','Возможно'),1.2));},
 draw2d(t,s,st){const q=Wd('h2','регрессия');txt('После рекорда',340,Wd('h1','После'),t,st,91,{out:q-.4});txt('ты стал хуже?',445,Wd('h1','хуже'),t,st,88,{out:q-.4});txt('Регрессия',340,q,t,st,101);txt('к среднему',445,Wd('h2','среднему'),t,st,91);atext('РЕКОРД',310,525,Wd('h1','рекордной'),t,{size:33,col:st.stage.sub});atext('СЛЕДОМ',720,525,Wd('h1','результаты'),t,{size:33,col:st.stage.sub})},
 sfx(add){add(.2,'bloom',.15,.8);add(Wd('h2','регрессия'),'chime',.15,.8)}
});
