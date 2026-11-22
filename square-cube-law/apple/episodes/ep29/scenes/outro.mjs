import {E,stage,frame,network,setNetwork,title,Wd,atext,atextWords,pill,P} from './kit.mjs';
E.defineScene('outro',{
 setup(){const st=stage('black');return {stage:st,n:network(st)};},
 update(t,s,st){frame(st.stage,15.8,850,10);setNetwork(st.n,t,s.start-3);st.stage.scene.userData.staticKey='ep29-outro';},
 draw2d(t,s,st){
  const card=Wd('o2','Парадокс');
  title('Не у каждого',null,t,Wd('o1','Это'),st.stage,{out:card-.12,size:86});
  atext('Не мера твоей ценности',500,475,Wd('o1','ценность')-1.2,t,{size:58,col:st.stage.sub,out:card-.12});
  atextWords('Парадокс дружбы',500,345,card,t,{size:81,col:st.stage.ink});
  atext('Один человек в пяти списках',500,450,card+.5,t,{size:41,col:st.stage.sub});
  pill(t,Wd('o2','Подпишись'),Wd('o2','кубе'));
 },
 sfx(add){add(Wd('o2','Парадокс'),'bloom',.15,.8);add(Wd('o2','кубе'),'click',.18,.85);}
});
