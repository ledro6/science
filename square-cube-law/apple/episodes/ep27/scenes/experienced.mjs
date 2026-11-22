import {defineScene} from '../../../engine.mjs';
import {setup,pose,labels,atext,Wd} from './kit.mjs';
defineScene('experienced',{
 setup(){return setup('black','exp')},update(t,s,st){pose(t,s,st,{entry:Wd('e1','опытных')})},
 draw2d(t,s,st){
  const ink=st.stage.ink,sub=st.stage.sub;
  atext('Опытные',520,335,Wd('e1','опытных'),t,{size:102,col:ink});
  atext('90 %',300,505,Wd('e1','девяносто'),t,{size:108,col:ink});
  atext('80 %',750,505,Wd('e1','восьмидесяти'),t,{size:108,col:ink});
  atext('9 из 10 сдали',300,560,Wd('e1','девяносто'),t,{size:33,col:sub});
  atext('32 из 40 сдали',750,560,Wd('e1','восьмидесяти'),t,{size:33,col:sub});
  labels(t,s.start+.35,st);
  atext('10 учеников',300,1265,Wd('e2','десять'),t,{size:39,col:ink});
  atext('40 учеников',750,1265,Wd('e2','сорок'),t,{size:39,col:ink});
 },sfx(add){add(Wd('e1','девяносто'),'click',.12,1);add(Wd('e1','восьмидесяти'),'click',.12,.9)}
});
