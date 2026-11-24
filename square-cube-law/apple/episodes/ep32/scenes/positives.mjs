import {defineScene,makeStage,Wd,atext,accent} from '../../../engine.mjs';
import {studio,positives,txt} from './objects.mjs';
defineScene('positives',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);return{stage,set:positives(stage)}},
 update(t,s,st){st.set.pose(t,Wd('p1','сто'));st.stage.scene.userData.staticKey=t>Wd('p1','сто')+1.2?'positives':null},
 draw2d(t,s,st){const ratio=Wd('p2','Получаем');txt('108 положительных',350,Wd('p1','сто'),t,st,84,{out:ratio-.4});txt('Только 9 с болезнью',455,Wd('p1','девяти'),t,st,60,{out:ratio-.4});txt('8,33%',440,ratio,t,st,172,{col:accent()});txt('9 / 108',550,Wd('p2','Девять'),t,st,65,{col:st.stage.sub});atext('9 истинных',220,1225,Wd('p1','девяти'),t,{size:37,col:st.stage.ink});atext('99 ложных',690,1225,Wd('p1','результатов'),t,{size:37,col:st.stage.sub})},
 sfx(add){add(Wd('p1','сто'),'click',.13);add(Wd('p2','Получаем'),'chime',.18)}
});
