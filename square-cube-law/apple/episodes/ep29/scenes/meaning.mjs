import {E,stage,frame,lists,setLists,listLabels,title,Wd,atext} from './kit.mjs';
E.defineScene('meaning',{
 setup(){const st=stage('black');return {stage:st,L:lists(st)};},
 update(t,s,st){frame(st.stage,13.4,920,0);setLists(st.L,t,s.start-4);st.stage.scene.userData.staticKey='ep29-meaning';},
 draw2d(t,s,st){title('Больше связей','Чаще в выборке',t,Wd('e1','Люди'),st.stage,{size:76});listLabels(st.L,st.stage,t,s.start);atext('Сравнение завышает планку',500,1230,Wd('e1','завышает')-.12,t,{size:43,col:st.stage.ink});},
 sfx(add){add(Wd('e1','чаще'),'click',.13,.85);}
});
