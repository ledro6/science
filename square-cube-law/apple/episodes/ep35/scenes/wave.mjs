import {defineScene,makeStage,Wd,P,project,callout,atext} from '../../../engine.mjs';
import {setupPasta,camera,text,note,ring} from './kit.mjs';
defineScene('wave',{
 setup(){const stage=makeStage({bg:'black'});return{stage,pasta:setupPasta(stage),ring:ring(stage)}},
 update(t,s,st){const q=P(t,Wd('w1','От'),Math.max(.5,Wd('w2','местах')-Wd('w1','От'))),tau=.0002+.11*q;st.pasta.pose({release:tau,gap:.06});camera(st.stage,t,s);st.pasta.object.rotation.set(0,0,0);st.pasta.object.position.set(0,0,0);st.pasta.object.scale.setScalar(.85);const idx=Math.round(100*(1-Math.sqrt(4*Math.PI*tau)/2.25)),p=st.pasta.points[1][Math.max(0,Math.min(99,idx))];st.ring.position.set((p[0]+.06)*.85,p[1]*.85,.06);st.ring.material.opacity=P(t,Wd('w2','усиливают'),.7);st.stage.scene.userData.staticKey=`wave-${q.toFixed(5)}`},
 draw2d(t,s,st){const peak=Wd('w2','И');text('Не сразу и не везде',350,Wd('w1','распрямление'),t,st.stage,77,{out:Wd('w1','изгибные')-.4});text('Изгибные волны',350,Wd('w1','изгибные'),t,st.stage,91,{out:peak-.35});text('Изгиб становится сильнее',350,peak,t,st.stage,70);text('Временно и локально',455,Wd('w2','временно'),t,st.stage,43,{col:st.stage.sub});const[a,b]=project(st.stage.camera,st.ring.position.x,st.ring.position.y,.05);callout(a,b,725,1005,Wd('w2','усиливают'),t,st.stage.sub);atext('пик кривизны',700,1060,Wd('w2','изгиб'),t,{size:34,col:st.stage.ink});note(t,s.start,st.stage,'3D-схема по модели 2005 года')},
 sfx(add){add(Wd('w1','волны'),'swell',.12,.7);add(Wd('w2','усиливают'),'chime',.12,.8)}
});
