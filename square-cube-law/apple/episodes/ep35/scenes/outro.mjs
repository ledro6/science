import {defineScene,makeStage,Wd,P,atext} from '../../../engine.mjs';
import {setupPasta,camera,text,note,pill} from './kit.mjs';
defineScene('outro',{
 setup(){const stage=makeStage({bg:'black'});return{stage,pasta:setupPasta(stage)}},
 update(t,s,st){st.pasta.pose({release:.025,gap:.08});camera(st.stage,t,s);st.pasta.object.rotation.set(0,0,0);st.pasta.object.position.set(0,0,0);st.pasta.object.scale.setScalar(.85);st.stage.scene.userData.staticKey='outro-two-pieces'},
 draw2d(t,s,st){const card=Wd('o2','Один');text('Второй разлом',350,Wd('o1','второй'),t,st.stage,88,{out:card-.35});text('не гарантирован',450,Wd('o1','не'),t,st.stage,79,{out:card-.35});text('Парадокс спагетти',350,card,t,st.stage,77);text('Разлом → волна → разлом?',460,Wd('o2','волну'),t,st.stage,44,{col:st.stage.sub});pill(t,Wd('o2','Подпишись'));atext('Мир в кубе',500,1285,Wd('o2','Мир'),t,{size:31,col:st.stage.sub})},
 sfx(add){add(Wd('o2','Подпишись'),'click',.12,.8)}
});
