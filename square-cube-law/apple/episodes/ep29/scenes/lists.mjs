import {E,stage,frame,lists,setLists,listLabels,title,Wd,atext} from './kit.mjs';
E.defineScene('lists',{
 setup(){const st=stage('black');return {stage:st,L:lists(st)};},
 update(t,s,st){frame(st.stage,13.4,965,0);setLists(st.L,t,Wd('l1','Популярный'));st.stage.scene.userData.staticKey=t>Wd('l1','Популярный')+2.1?'ep29-lists':null;},
 draw2d(t,s,st){title('Все списки друзей',null,t,Wd('l1','списки'),st.stage,{size:78});atext('×5',500,585,Wd('l1','пять'),t,{size:144,col:st.stage.accent});atext('один человек в пяти списках',500,655,Wd('l1','пять')+.1,t,{size:36,col:st.stage.sub});listLabels(st.L,st.stage,t,Wd('l1','Популярный'));},
 sfx(add){add(Wd('l1','Популярный'),'whoosh',.12,.8);add(Wd('l1','пять'),'click',.15,.9);}
});
