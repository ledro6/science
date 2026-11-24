import {defineScene,makeStage,Wd,P,accent} from '../../../engine.mjs';
import {studio,plus,txt} from './objects.mjs';
defineScene('hook',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,test:plus(stage)}},
 update(t,s,st){const p=P(t,.1,1);st.test.position.set(.1,-.20,0);st.test.scale.setScalar(.9+.1*p);st.test.rotation.set(-.08,-.14+.14*p,0);st.stage.scene.userData.staticKey=t>1.1?'hook':null},
 draw2d(t,s,st){const ans=Wd('h1','восемь'),warn=Wd('h2','Все');txt('Тест положительный',350,Wd('h1','Положительный'),t,st,82,{out:ans-.4});txt('Болезнь почти наверняка?',455,Wd('h1','болезнь'),t,st,60,{out:ans-.4});txt('≈8%',440,ans,t,st,184,{col:accent()});txt('в нашем примере',525,ans+.2,t,st,43,{col:st.stage.sub});txt('Учебная модель',1120,warn,t,st,56);txt('Все числа вымышлены',1190,Wd('h2','вымышлены'),t,st,39,{col:st.stage.sub});txt('Не медицинская рекомендация',1260,Wd('h2','медицинская'),t,st,32,{col:st.stage.sub})},
 sfx(add){add(Wd('h1','Положительный'),'bloom',.14);add(Wd('h1','восемь'),'chime',.16)}
});
