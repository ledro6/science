import {defineScene,makeStage,Wd,P,atext} from '../../../engine.mjs';
import {studio,diagram,diagramCamera,txt} from './objects.mjs';
defineScene('turn',{
 setup(){const stage=makeStage({bg:'white'});studio(stage);return{stage,paths:diagram(stage)}},
 update(t,s,st){const change=t>=Wd('t2','меняет');st.paths.pose(1,change);st.paths.turn.scale.setScalar(1+.25*P(t,Wd('t2','развороте'),.8));diagramCamera(st.stage);st.stage.scene.userData.staticKey=t>=Wd('t2','развороте')+.8?'turn-frames':t<Wd('t2','развороте')?'turn-before':null},
 draw2d(t,s,st){const explain=Wd('t2','Путешественник');txt('Движение относительно',355,Wd('t1','движение'),t,st,75,{out:Wd('t1','Почему')-.4});txt('Можно поменять местами?',355,Wd('t1','поменять'),t,st,65,{out:explain-.4});txt('Две системы отсчёта',355,Wd('t2','меняет'),t,st,78);txt('У Земли одна',450,Wd('t2','одной'),t,st,53,{col:st.stage.sub});atext('Туда',690,1170,Wd('t2','меняет'),t,{size:34,col:st.stage.sub});atext('Обратно',760,800,Wd('t2','систему'),t,{size:34,col:st.stage.sub});txt('Симметрии нет',1290,Wd('t2','Симметрии'),t,st,74)},
 sfx(add){add(Wd('t2','меняет'),'click',.14,.8)}
});
