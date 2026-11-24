import {THREE,MAT,roundedBox,orbit,P,lerp,atext,g,FONT,accent} from '../../../engine.mjs';
export function studio(stage){stage.floor.visible=false;stage.lights.key.castShadow=false;stage.lights.hemi.intensity=.9;stage.lights.key.position.set(2,5,7)}
export function camera(stage,az=13,dist=13){stage.scene.userData.staticKey='ep34';orbit(stage.camera,[.12,1.05,0],dist,az,9)}
export function bar(stage,width=.42){
 const root=new THREE.Group(),base=new THREE.Mesh(roundedBox(1,.045,2),MAT.aluminium()),cap=new THREE.Mesh(roundedBox(1,.045,2),MAT.ceramicWhite());root.add(base,cap);stage.root.add(root);
 return {root,base,cap,pose(x,height=1.8,extra=.6,separate=0,visibility=1){root.position.set(x,.05,0);root.rotation.set(0,0,0);root.scale.setScalar(Math.max(.001,visibility));root.visible=visibility>.002;base.position.set(0,height/2,0);base.scale.set(width,height,.42);cap.position.set(0,height+extra/2+separate,0);cap.scale.set(width,Math.max(.001,extra),.42);cap.visible=extra>.002}};
}
export function txt(text,y,t0,t,st,size=78,extra={}){atext(text,500,y,t0,t,{size,col:st.stage.ink,...extra})}
export function pill(t,t0){const p=P(t,t0,.7);if(p<.003)return;g.save();g.globalAlpha=p;g.fillStyle=accent();g.beginPath();g.roundRect(230,1160,540,90,45);g.fill();g.font=`600 38px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText('Подписаться на L³',500,1205);g.restore()}
export function hline(x1,x2,y,col,alpha=1,dash=[]){g.save();g.globalAlpha=alpha;g.strokeStyle=col;g.lineWidth=3;g.setLineDash(dash);g.beginPath();g.moveTo(x1,y);g.lineTo(x2,y);g.stroke();g.restore()}
export function point(x,y,col,r=9,a=1){g.save();g.globalAlpha=a;g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.restore()}
