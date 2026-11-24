import {defineScene,makeStage,Wd,P,MAT,atext} from '../../../engine.mjs';
import {studio,dots,txt} from './objects.mjs';
defineScene('screen',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,a:dots(stage,9,MAT.aluminium(),.078),b:dots(stage,99,MAT.ceramicWhite(),.044),miss:dots(stage,1,MAT.graphite(),.075)}},
 update(t,s,st){st.a.grid(3,.23,.23,-.83,-.10,0,P(t,Wd('s1','девятерых'),.8));st.b.grid(11,.115,.115,.55,-.10,0,P(t,Wd('s2','девяносто'),1));st.miss.grid(1,.2,.2,-.83,-.8,0,P(t,Wd('s1','десяти'),.8));st.stage.scene.userData.staticKey=t>Wd('s2','девяносто')+1.1?'screen-all':t<Wd('s2','девяносто')&&t>Wd('s1','девятерых')+.9?'screen-nine':null},
 draw2d(t,s,st){const false0=Wd('s2','ложноположительный');txt('Чувствительность 90%',350,Wd('s1','Чувствительность'),t,st,71,{out:false0-.4});txt('Ложноположительных 10%',350,false0,t,st,65);atext('9',255,665,Wd('s1','девятерых'),t,{size:169,col:st.stage.ink});atext('99',700,665,Wd('s2','девяносто'),t,{size:169,col:st.stage.ink});atext('из 10 с болезнью',255,1130,Wd('s1','девятерых'),t,{size:34,col:st.stage.sub});atext('из 990 без неё',700,1130,Wd('s2','человек'),t,{size:34,col:st.stage.sub});txt('Тест пропустит одного',1230,Wd('s1','девятерых'),t,st,34,{col:st.stage.sub})},
 sfx(add){add(Wd('s1','девятерых'),'click',.12);add(Wd('s2','девяносто'),'chime',.13)}
});
