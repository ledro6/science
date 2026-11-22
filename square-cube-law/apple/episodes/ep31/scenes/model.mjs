import {defineScene,makeStage,Wd,P,atext} from '../../../engine.mjs';
import {studio,diagram,diagramCamera,txt} from './objects.mjs';
defineScene('model',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);return{stage,paths:diagram(stage)}},
 update(t,s,st){st.paths.pose(P(t,s.start+.2,1.6));st.paths.turn.visible=t>=Wd('m1','разворот');diagramCamera(st.stage);st.stage.scene.userData.staticKey=t>s.start+1.8?(t>=Wd('m1','разворот')?'model-turn':'model-no-turn'):null},
 draw2d(t,s,st){const speed=Wd('m2','восемьдесят');txt('Идеальная модель',350,Wd('m1','идеальная'),t,st,84,{out:speed-.5,outDur:.35});txt('0,8c',460,speed,t,st,174);txt('скорость на двух участках',530,Wd('m2','процентов'),t,st,38,{col:st.stage.sub});atext('Время ↑',175,800,Wd('m1','модель'),t,{size:34,col:st.stage.sub});atext('Пространство →',680,1220,Wd('m1','модель'),t,{size:34,col:st.stage.sub});atext('Земля',240,990,Wd('m1','модель'),t,{size:36,col:st.stage.sub});atext('Туда',650,1170,Wd('m2','обоих'),t,{size:34,col:st.stage.sub});atext('Обратно',740,780,Wd('m2','участках'),t,{size:34,col:st.stage.sub});txt('Без гравитации',590,Wd('m1','гравитацию'),t,st,34,{col:st.stage.sub});txt('Разворот пренебрежимо короткий',1270,Wd('m1','коротким'),t,st,32,{col:st.stage.sub})},
 sfx(add){add(Wd('m2','восемьдесят'),'chime',.13,.8)}
});
