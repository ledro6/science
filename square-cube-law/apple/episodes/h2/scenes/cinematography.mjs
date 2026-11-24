import {C,E,Wd,SC,lerp,clamp,W,H} from '../../../engine.mjs';
export function glide(v){const u=clamp(v);return u*u*u*(u*(u*6-15)+10)}
// Camera is a continuous smooth pan/zoom over the 3D render, as in h1 v3.
const cues={
 warning:[[0,1.12,540,900],[Wd('h201','открыл'),1.26,605,872],[Wd('h202','вторая'),1.41,550,1050],[Wd('h202','вошла'),1.22,561,970]],
 voice:[[SC.voice.start,1.20,540,859],[Wd('h203','Мама'),1.48,536,815],[C('h204'),1.32,540,830]],
 mitten:[[SC.mitten.start,1.13,540,866],[Wd('h205','варежка'),1.38,526,840],[Wd('h206','шов'),1.74,597,836],[Wd('h206','смеялась'),1.45,545,865]],
 truth:[[SC.truth.start,1.13,540,867],[Wd('h207','вышел'),1.32,429,959],[Wd('h207','осталась'),1.39,621,833],[C('h208'),1.19,540,870]],
 descent:[[SC.descent.start,1.15,540,872],[Wd('h209','постарела'),1.55,585,828],[C('h210'),1.30,525,859],[Wd('h210','нажала'),1.44,420,795],[Wd('h210','вниз'),1.24,540,865]],
 yesterday:[[SC.yesterday.start,1.20,540,865],[Wd('h211','телефон'),1.47,400,965],[Wd('h212','разошлись'),1.16,540,866],[Wd('h212','мальчик'),1.51,631,929]],
 outro:[[SC.outro.start,1.33,540,915],[Wd('h213','потянулся'),1.55,663,918],[C('h214'),1.44,625,879],[Wd('h214','без'),1.61,627,863]]
};
export function compositeShot(t,s,state,ctx,canvas){
 const a=cues[s.id],i=Math.max(0,a.findLastIndex(c=>c[0]<=t));
 const [start,z,x,y]=a[i],[end,nz,nx,ny]=a[i+1]??[s.end,z+.025,x,y-5];
 const f=glide((t-start)/Math.max(.01,end-start)),zoom=lerp(z,nz,f),fx=lerp(x,nx,f),fy=lerp(y,ny,f);
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 const centering=Math.min(.77,.16+(zoom-1)*1.07);
 const lift=s.id==='warning'?-325*glide((t-Wd('h202','скользнула')+.8)/2):0;
 ctx.drawImage(canvas,fx*(1-zoom)+(W/2-fx)*centering,fy*(1-zoom)+lift,W*zoom,H*zoom);
 const top=ctx.createLinearGradient(0,260,0,590);top.addColorStop(0,'rgba(0,0,0,.83)');top.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=top;ctx.fillRect(0,0,W,590);
 const floor=ctx.createLinearGradient(0,1190,0,1500);floor.addColorStop(0,'rgba(0,0,0,0)');floor.addColorStop(1,'rgba(0,0,0,.92)');ctx.fillStyle=floor;ctx.fillRect(0,1190,W,730);
}
