import {defineScene,makeStage,Wd,P,atext,accent} from '../../../engine.mjs';
import {setupPasta,camera,text,note} from './kit.mjs';
defineScene('cascade',{
 setup(){const stage=makeStage({bg:'white'});return{stage,pasta:setupPasta(stage)}},
 update(t,s,st){const q=P(t,Wd('c1','ещё'),.9);st.pasta.pose({release:.11,second:q>.001,split:q,gap:.06});camera(st.stage,t,s);st.pasta.object.rotation.set(0,0,0);st.pasta.object.position.set(0,0,0);st.pasta.object.scale.setScalar(.85);st.stage.scene.userData.staticKey=`cascade-${q.toFixed(5)}`},
 draw2d(t,s,st){const end=Wd('c2','Одоли');text('Предел превышен?',350,Wd('c1','Если'),t,st.stage,82,{out:Wd('c1','возникает')-.3});text('Ещё один разлом',350,Wd('c1','возникает'),t,st.stage,79,{out:Wd('c1','Получается')-.35});text('Каскад разломов',350,Wd('c1','каскад'),t,st.stage,79,{out:end-.35});atext('2005',500,405,end,t,{size:142,col:st.stage.ink});text('Audoly · Neukirch',490,end+.2,t,st.stage,44,{col:st.stage.sub});note(t,s.start,st.stage,'3D-схема · возможный следующий разлом')},
 sfx(add){add(Wd('c1','ещё'),'crack',.16,.85);add(Wd('c2','пятом'),'chime',.10,.75)}
});
