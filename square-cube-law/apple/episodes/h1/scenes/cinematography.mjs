import {C,Wd,SC,lerp,clamp,W,H} from '../../../engine.mjs';

const SIX=Wd('h01','шестом'), EXTRA=Wd('p02','ещё'), GLOVE=Wd('a01','варежка');
const BELL=Wd('t01','зазвонил'), MIRROR=Wd('t02','отражение');
const CLOSE=Wd('e02','закрытия'), PLAYBACK=Wd('m02','запись');

// [time, zoom, focus x, focus y] in the original 1080×1920 frame.
const cues={
  hook:[[0,1.11,554,833],[SIX,1.35,544,617],[C('h02'),1.10,540,848]],
  panel:[[SC.panel.start,1.16,540,921],[Wd('p01','дёрнулся'),1.29,538,876],
    [C('p02'),1.10,540,879],[EXTRA,1.62,537,680]],
  hall:[[SC.hall.start,1.10,540,875],[GLOVE,1.53,374,802],
    [C('a02'),1.17,550,888],[Wd('a02','двадцать'),1.33,614,854]],
  phone:[[SC.phone.start,1.22,408,837],[BELL,1.54,323,914],
    [Wd('t01','зеркале'),1.11,544,863],[MIRROR,1.39,847,806],
    [Wd('t02','трубку'),1.17,545,855]],
  escape:[[SC.escape.start,1.20,556,861],[Wd('e01','открытыми'),1.42,581,801],
    [C('e02'),1.13,543,899],[CLOSE,1.28,557,847]],
  morning:[[SC.morning.start,1.07,540,870],[Wd('m01','спросил'),1.11,540,858],
    [C('m02'),1.06,540,870],[PLAYBACK,1.14,540,867]],
  outro:[[SC.outro.start,1.08,540,870],[Wd('o31','звякнул'),1.18,543,857],
    [Wd('o32','оборачивайся'),1.29,540,844],[SC.outro.end,1.38,540,835]]
};

export function glide(value) {
  const u=clamp(value);
  return u*u*u*(u*(u*6-15)+10);
}

export function compositeShot(t,scene,state,ctx,canvas) {
  const list=cues[scene.id];
  const index=Math.max(0,list.findLastIndex(c=>c[0]<=t));
  const [start,z,x,y]=list[index];
  const [end,nextZ,nextX,nextY]=list[index+1]??[scene.end,z+.045,x,y-10];
  const f=glide((t-start)/Math.max(.01,end-start));
  const zoom=lerp(z,nextZ,f);
  const fx=lerp(x,nextX,f),fy=lerp(y,nextY,f);
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,W,H);
  const centering=Math.min(.77, .16+(zoom-1)*1.07);
  ctx.drawImage(canvas,fx*(1-zoom)+(W/2-fx)*centering,
    fy*(1-zoom),W*zoom,H*zoom);
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
  if(scene.id==='outro') {
    ctx.fillStyle=`rgba(0,0,0,${glide((t-state.blackout)/.22)})`;
    ctx.fillRect(0,0,W,H);
  }
}
