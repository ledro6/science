import {C,Wd,SC,lerp,P,W,H} from '../../../engine.mjs';

const SIX=Wd('h01','шестом'), EXTRA=Wd('p02','ещё'), GLOVE=Wd('a01','варежка');
const BELL=Wd('t01','зазвонил'), MIRROR=Wd('t02','отражение');
const CLOSE=Wd('e02','закрытия'), PLAYBACK=Wd('m02','запись'), NUMBER=Wd('o01','номер');

// [time, zoom, focus x, focus y, drift x, drift y] in the original 1080×1920 frame.
const cues={
  hook:[[0,1.11,554,833,-16,15],[SIX,1.35,544,617,17,-17],[C('h02'),1.10,540,848,18,-12]],
  panel:[[SC.panel.start,1.16,540,921,9,-22],[Wd('p01','дёрнулся'),1.29,538,876,-12,-15],
    [C('p02'),1.10,540,879,2,-18],[EXTRA,1.62,537,680,12,-5]],
  hall:[[SC.hall.start,1.10,540,875,-16,-15],[GLOVE,1.53,374,802,15,-12],
    [C('a02'),1.17,550,888,16,-9],[Wd('a02','двадцать'),1.33,614,854,-12,-12]],
  phone:[[SC.phone.start,1.22,408,837,-14,8],[BELL,1.54,323,914,15,-14],
    [Wd('t01','зеркале'),1.11,544,863,13,-8],[MIRROR,1.39,847,806,-13,-16],
    [Wd('t02','трубку'),1.17,545,855,12,-20]],
  escape:[[SC.escape.start,1.20,556,861,22,-20],[Wd('e01','открытыми'),1.42,581,801,-14,-19],
    [C('e02'),1.13,543,899,16,-19],[CLOSE,1.28,557,847,-16,9]],
  morning:[[SC.morning.start,1.07,540,870,16,-13],[Wd('m01','спросил'),1.11,540,858,-14,-14],
    [C('m02'),1.06,540,870,14,-16],[PLAYBACK,1.14,540,867,11,-11]],
  outro:[[SC.outro.start,1.07,540,876,15,-15],[Wd('o01','два'),1.12,540,849,11,-14],
    [NUMBER,1.17,540,818,-10,-11]]
};

const joltEvents=[Wd('p01','дёрнулся'),SIX,CLOSE+1.66];

export function compositeShot(t,scene,state,ctx,canvas) {
  const list=cues[scene.id];
  const index=list.findLastIndex(c=>c[0]<=t);
  const [start,z,x,y,dx,dy]=list[Math.max(0,index)];
  const end=list[index+1]?.[0]??scene.end;
  const f=P(t,start,Math.max(.6,end-start));
  const zoom=lerp(z,z+.055,f);
  let jitter=0;
  for(const event of joltEvents){
    const a=t-event;
    if(a>=0&&a<.52)jitter+=Math.sin(a*54)*16*Math.exp(-a*9);
  }
  const fx=x+f*dx, fy=y+f*dy;
  // Interface text and captions stay fixed. Only the picture moves.
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,W,H);
  const centering=Math.min(.77, .16+(zoom-1)*1.07);
  ctx.drawImage(canvas,fx*(1-zoom)+(W/2-fx)*centering+jitter,
    fy*(1-zoom)+jitter*.62,W*zoom,H*zoom);
  const shade=ctx.createLinearGradient(0,260,0,600);
  shade.addColorStop(0,'rgba(0,0,0,.80)');
  shade.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shade;
  ctx.fillRect(0,0,W,600);
  const floor=ctx.createLinearGradient(0,1165,0,1510);
  floor.addColorStop(0,'rgba(0,0,0,0)');
  floor.addColorStop(1,'rgba(0,0,0,.88)');
  ctx.fillStyle=floor;
  ctx.fillRect(0,1165,W,755);
}
