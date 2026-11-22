import {defineScene} from '../../../engine.mjs';
import {setup,pose,labels,atext,Wd} from './kit.mjs';
defineScene('novices',{
 setup(){return setup('white','nov')},update(t,s,st){pose(t,s,st,{entry:Wd('n1','новичков')})},
 draw2d(t,s,st){
  const ink=st.stage.ink,sub=st.stage.sub;
  atext('Новички',520,335,Wd('n1','новичков'),t,{size:102,col:ink});
  atext('60 %',300,505,Wd('n1','шестьдесят'),t,{size:108,col:ink});
  atext('50 %',750,505,Wd('n1','пятьдесят'),t,{size:108,col:ink});
  atext('24 из 40 сдали',300,560,Wd('n1','шестьдесят'),t,{size:33,col:sub});
  atext('5 из 10 сдали',750,560,Wd('n1','пятьдесят'),t,{size:33,col:sub});
  labels(t,s.start+.35,st);
  atext('40 учеников',300,1265,Wd('n2','сорок'),t,{size:39,col:ink});
  atext('10 учеников',750,1265,Wd('n2','десять'),t,{size:39,col:ink});
 },sfx(add){add(Wd('n1','шестьдесят'),'click',.12,1);add(Wd('n1','пятьдесят'),'click',.12,.9)}
});
