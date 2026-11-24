import {defineScene,makeStage,Wd,atextWords,accent} from '../../../engine.mjs';
import {studio,positives,txt,pill} from './objects.mjs';
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,set:positives(stage)}},
 update(t,s,st){st.set.pose(t,s.start-2);st.stage.scene.userData.staticKey='outro'},
 draw2d(t,s,st){const card=Wd('o2','Теорема');txt('Частота тоже важна',355,Wd('o1','зависит'),t,st,77,{out:card-.4});txt('Не только свойства теста',455,Wd('o1','часто'),t,st,52,{col:st.stage.sub,out:card-.4});atextWords('Теорема Байеса',500,350,card,t,{size:85,col:st.stage.ink});txt('9 / (9 + 99) = 8,33%',460,card+.2,t,st,57,{col:st.stage.sub});txt('Все числа вымышлены',1130,s.start+.4,t,st,35,{col:st.stage.sub,out:card-.4});pill(t,Wd('o2','Подпишись'))},
 sfx(add){add(Wd('o2','Теорема'),'bloom',.12);add(Wd('o2','Подпишись'),'click',.10)}
});
