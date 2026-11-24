import {defineScene,makeStage,Wd,P,atext,atextWords} from '../../../engine.mjs';
import {studio,camera,bar,txt,pill} from './objects.mjs';
const extras=[.23,.42,.13,.66,.28,.35,.18];
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,bars:extras.map(()=>bar(stage,.3))}},
 update(t,s,st){const card=P(t,Wd('o2','Регрессия'),.8);st.bars.forEach((b,i)=>{b.pose((i-3)*.43,1.3,extras[i],0,1-card);});camera(st.stage,8,13)},
 draw2d(t,s,st){const card=Wd('o2','Регрессия');txt('Спад не обязателен',340,Wd('o1','не'),t,st,80,{out:Wd('o1','Сравнивай')-.4});txt('Сравнивай серии',340,Wd('o1','Сравнивай'),t,st,89,{out:card-.4});txt('а не один рекорд',445,Wd('o1','рекорд'),t,st,67,{out:card-.4});atextWords('Регрессия',500,545,card,t,{size:108,col:st.stage.ink});atextWords('к среднему',500,670,Wd('o2','среднему'),t,{size:100,col:st.stage.ink});txt('Навык + случайность',850,card+.2,t,st,48,{col:st.stage.sub});txt('Один рекорд ещё не тренд',950,card+.4,t,st,42,{col:st.stage.sub});pill(t,Wd('o2','Подпишись'))},
 sfx(add){add(Wd('o1','Сравнивай'),'bloom',.13,.8);add(Wd('o2','Подпишись'),'click',.12,.9)}
});
