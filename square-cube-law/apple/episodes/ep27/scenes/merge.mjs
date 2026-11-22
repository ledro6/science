import {defineScene,accent,line} from '../../../engine.mjs';
import {setup,pose,labels,atext,P,Wd} from './kit.mjs';
defineScene('merge',{
 setup(){return setup('white','all')},
 update(t,s,st){pose(t,s,st,{merge:P(t,Wd('m1','Объединим'),1.5)})},
 draw2d(t,s,st){
  const ink=st.stage.ink,sub=st.stage.sub,at=Wd('m1','шестьдесят'),bt=Wd('m1','семьдесят'),note=Wd('m2','перевернулся');
  atext('Общий результат',520,335,Wd('m1','Объединим'),t,{size:86,col:ink,out:note-.1});
  atext('Разные доли групп',520,335,note,t,{size:80,col:ink});
  atext('66 %',300,505,at,t,{size:108,col:ink});
  atext('74 %',750,505,bt,t,{size:108,col:ink});
  atext('<',525,505,bt,t,{size:100,col:accent()});
  atext('33 из 50 сдали',300,560,at,t,{size:33,col:sub});
  atext('37 из 50 сдали',750,560,bt,t,{size:33,col:sub});
  labels(t,s.start+.25,st);
  atext('20 % опытных',300,1265,Wd('m2','опытных'),t,{size:35,col:ink});
  atext('80 % опытных',750,1265,Wd('m2','опытных'),t,{size:35,col:ink});
 },sfx(add){add(Wd('m1','Объединим'),'whoosh',.18,.7);add(Wd('m1','семьдесят'),'chime',.2,.9)}
});
