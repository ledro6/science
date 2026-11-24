import {defineScene,makeStage,Wd,P,MAT,atext} from '../../../engine.mjs';
import {studio,dots,txt} from './objects.mjs';
defineScene('cohort',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);return{stage,a:dots(stage,10,MAT.graphite(),.075),b:dots(stage,990,MAT.aluminium(),.024)}},
 update(t,s,st){const p=P(t,Wd('c1','процента'),1.2);st.a.grid(2,.21,.21,-.91,-.17,.04,p);st.b.grid(33,.049,.049,.54,-.17,0,P(t,Wd('c1','тысячу'),1.2));st.stage.scene.userData.staticKey=t>Wd('c1','процента')+1.3?'cohort':null},
 draw2d(t,s,st){const split=Wd('c1','процента');txt('1 000 человек',355,Wd('c1','тысячу'),t,st,94);txt('1% с болезнью',455,split,t,st,60);atext('10',220,650,Wd('c1','десяти'),t,{size:142,col:st.stage.ink});atext('990',695,650,Wd('c2','девятисот'),t,{size:142,col:st.stage.ink});atext('болезнь есть',220,1130,Wd('c1','десяти'),t,{size:37,col:st.stage.sub});atext('болезни нет',695,1130,Wd('c2','нет'),t,{size:37,col:st.stage.sub});txt('Одна точка = один человек',1240,split,t,st,34,{col:st.stage.sub})},
 sfx(add){add(Wd('c1','тысячу'),'whoosh',.12);add(Wd('c1','десяти'),'click',.12)}
});
