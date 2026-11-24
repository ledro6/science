import {defineScene,makeStage,Wd,P,project,callout,atext} from '../../../engine.mjs';
import {setupPasta,camera,text,note,ring} from './kit.mjs';
defineScene('bend',{
 setup(){const stage=makeStage({bg:'white'});return{stage,pasta:setupPasta(stage),ring:ring(stage)}},
 update(t,s,st){const bent=.75+.25*P(t,Wd('b1','сгибаем'),1.8),q=P(t,Wd('b2','освобождает'),1.8);st.pasta.pose({bend:bent,release:.025*q,gap:.055*q});camera(st.stage,t,s);st.pasta.object.rotation.set(0,0,0);st.pasta.object.position.set(0,0,0);st.pasta.object.scale.setScalar(.85);st.ring.position.set(0,1.7,.05);st.ring.material.opacity=P(t,Wd('b2','Первый'),.45)*(1-P(t,Wd('b2','начинают'),.5));st.stage.scene.userData.staticKey=`bend-${bent.toFixed(5)}-${q.toFixed(5)}`},
 draw2d(t,s,st){const crack=Wd('b2','Первый');text('Сгибаем спагеттину',350,Wd('b1','Пока'),t,st.stage,79,{out:Wd('b1','запасает')-.35});text('Запасённая энергия',350,Wd('b1','запасает'),t,st.stage,76,{out:crack-.35});text('Первый разлом',350,crack,t,st.stage,89);text('Новые свободные концы',455,Wd('b2','концы'),t,st.stage,44,{col:st.stage.sub});const[a,b]=project(st.stage.camera,0,1.7,0);callout(a,b,670,660,Wd('b2','освобождает'),t,st.stage.sub);atext('распрямляются',650,630,Wd('b2','распрямляться'),t,{size:36,col:st.stage.ink});note(t,s.start,st.stage)},
 sfx(add){add(Wd('b2','Первый'),'crack',.13,.8)}
});
