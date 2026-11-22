import {defineScene,makeStage,Wd,atext,accent} from '../../../engine.mjs';
import {studio,diagram,diagramCamera,pair,pairCamera,pill,txt} from './objects.mjs';
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black'});studio(stage);return{stage,paths:diagram(stage),clocks:pair(stage)}},
 update(t,s,st){const card=t>=Wd('o2','Парадокс');st.paths.pose(1);st.paths.root.visible=!card;st.clocks.pose(t,10,6,.85);st.clocks.earth.root.visible=st.clocks.ship.root.visible=card;if(card)pairCamera(st.stage);else diagramCamera(st.stage);st.stage.scene.userData.staticKey=card?'outro-card':'outro-diagram'},
 draw2d(t,s,st){const card=Wd('o2','Парадокс');txt('Время накапливается',350,Wd('o1','накапливается'),t,st,76,{out:Wd('o1','Два')-.4});txt('во время полёта',445,Wd('o1','полёте'),t,st,67,{out:Wd('o1','Два')-.4});txt('Два пути',350,Wd('o1','Два'),t,st,94,{out:card-.4});txt('Разное время',450,Wd('o1','разное'),t,st,80,{out:card-.4});atext('Старт',340,1240,Wd('o1','событиями'),t,{size:33,col:st.stage.sub,out:card-.35});atext('Встреча',340,625,Wd('o1','событиями'),t,{size:33,col:st.stage.sub,out:card-.35});txt('Парадокс',330,card,t,st,103);txt('близнецов',445,Wd('o2','близнецов'),t,st,103);atext('10',270,640,card,t,{size:135,col:st.stage.ink});atext('6',730,640,card,t,{size:135,col:accent()});txt('0,8c · 10 лет и 6 лет',1115,card+.25,t,st,40,{col:st.stage.sub});pill(t,Wd('o2','Подпишись'))},
 sfx(add){add(Wd('o1','разное'),'bloom',.14,.8);add(Wd('o2','Подпишись'),'click',.12,.8)}
});
