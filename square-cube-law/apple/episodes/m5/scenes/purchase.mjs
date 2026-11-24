import {defineScene,makeStage,THREE,atext,P,Wd,lerp} from '../../../engine.mjs';
import {makeJar,frame,pointGrid,settle} from './kit.mjs';
defineScene('purchase',{
 setup(){const stage=makeStage({bg:'black',shadow:.1}),j1=makeJar(THREE,{dark:true}),j2=makeJar(THREE,{dark:true});stage.root.add(j1,j2);return{stage,j1,j2}},
 update(t,s,st){st.j1.visible=false;st.j2.visible=false;st.j1.position.set(-.8,.05,0);st.j2.position.set(.8,.05,0);st.j1.scale.setScalar(.7);st.j2.scale.setScalar(.7);frame(st.stage.camera,[0,.42,0],14,0,7,510,1120);st.stage.scene.userData.staticKey='purchase-hold'},
 draw2d(t,s,st){const c=st.stage.ink,sub=st.stage.sub,red=st.stage.accent,a=Wd('p1','трёх'),b=Wd('p1','тридцати'),important=Wd('p1','Важно');atext('Купили из остановившихся',510,310,Wd('p1','остановившихся'),t,{size:65,col:c});atext('3%',285,550,a,t,{size:153,col:c});atext('≈30%',740,550,b,t,{size:140,col:red});atext('24 сорта',285,635,a,t,{size:39,w:500,col:sub});atext('6 сортов',740,635,b,t,{size:39,w:500,col:sub});pointGrid(t,a,172,710,3,'#FFFFFF','#FFFFFF');pointGrid(t,b,627,710,30,'#FFFFFF','#FF453A');atext('4 / 145',285,1050,a,t,{size:41,col:sub,w:500});atext('31 / 104',740,1050,b,t,{size:41,col:sub,w:500});atext('База: остановившиеся',510,1220,important,t,{size:46,col:c});atext('Точки: доля из 100 · фактические числа выше',510,1285,a+.25,t,{size:25,w:400,col:sub})},
 sfx(add){add(Wd('p1','трёх'),'tick',.14,.8);add(Wd('p1','тридцати'),'chime',.19,.9);add(Wd('p1','Важно'),'thud',.12,.7)}
});
