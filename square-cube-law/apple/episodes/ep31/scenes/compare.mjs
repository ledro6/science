import {defineScene,makeStage,Wd,atext,accent} from '../../../engine.mjs';
import {studio,pair,pairCamera,txt} from './objects.mjs';
defineScene('compare',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,clocks:pair(stage)}},
 update(t,s,st){st.clocks.pose(t,10,6);pairCamera(st.stage);st.stage.scene.userData.staticKey='compare'},
 draw2d(t,s,st){txt('От старта до встречи',350,Wd('c1','стартом'),t,st,78);atext('10',270,630,Wd('c1','десять'),t,{size:218,col:st.stage.ink});atext('6',730,630,Wd('c2','шесть'),t,{size:218,col:accent()});atext('лет на Земле',270,1145,Wd('c1','Земле'),t,{size:38,col:st.stage.sub});atext('лет в корабле',730,1145,Wd('c2','корабле'),t,{size:38,col:st.stage.sub});txt('3 + 3 года в корабле',1250,Wd('c2','три'),t,st,50,{col:st.stage.sub})},
 sfx(add){add(Wd('c1','десять'),'chime',.12,.8);add(Wd('c2','шесть'),'chime',.16,.9)}
});
