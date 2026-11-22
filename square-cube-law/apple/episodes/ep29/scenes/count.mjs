import {E,stage,frame,entries,setEntries,entryLabels,title,Wd,atext} from './kit.mjs';
E.defineScene('count',{
 setup(){const st=stage('white');return {stage:st,en:entries(st)};},
 update(t,s,st){frame(st.stage,12.2,940,0);setEntries(st.en,t,Wd('c1','Пять'),Wd('c1','и'));st.stage.scene.userData.staticKey=t>Wd('c1','и')+1.1?'ep29-count':null;},
 draw2d(t,s,st){
  title('Считаем записи',null,t,Wd('c1','Пять'),st.stage);
  entryLabels(st.en,st.stage,t,Wd('c1','пятью'),Wd('c1','одним'));
  const t0=Wd('c1','Среднее');
  atext('3',330,640,Wd('c1','три')-.1,t,{size:172,col:st.stage.accent});
  atext('1,67',735,625,t0,t,{size:104,col:st.stage.sub});
  atext('по записям',330,710,t0,t,{size:36,col:st.stage.sub});atext('по людям',735,710,t0,t,{size:36,col:st.stage.sub});
  atext('10 записей в списках друзей',500,810,Wd('c1','одним'),t,{size:37,col:st.stage.sub});
 },
 sfx(add){add(Wd('c1','три'),'chime',.18,.9);}
});
