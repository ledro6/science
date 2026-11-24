import {THREE,MAT,P,lerp,orbit,g,atext,FONT} from '../../../engine.mjs';
export {makeJar,makeDisplay} from './jars.mjs';
export function frame(cam,target,dist,az,el,sx=510,sy=920){orbit(cam,target,dist,az,el);cam.setViewOffset(1080,1920,540-sx,960-sy,1080,1920);cam.updateMatrixWorld()}
export function settle(stage,t,a,d,key){stage.scene.userData.staticKey=t>=a+d?key:null}
export function pill(t,t0){const p=P(t,t0,.8);if(p<.001)return;g.save();g.globalAlpha=p;g.fillStyle='#FF453A';g.beginPath();g.roundRect(205,1170+(1-p)*25,610,108,54);g.fill();g.font=`600 43px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#FFFFFF';g.fillText('Подписаться на L³',510,1224+(1-p)*25);g.restore()}
export function pointGrid(t,t0,x,y,percent,ink,accent){const p=P(t,t0,.9);g.save();g.globalAlpha=p;for(let i=0;i<100;i++){g.fillStyle=i<percent?accent:ink;g.globalAlpha=p*(i<percent?1:.17);g.beginPath();g.arc(x+(i%10)*25,y+Math.floor(i/10)*25,5.5,0,Math.PI*2);g.fill()}g.restore()}
export function studyStack(){const group=new THREE.Group(),cards=[];const geo=new THREE.BoxGeometry(1.65,.04,2.1);for(let i=0;i<9;i++){const mesh=new THREE.Mesh(geo,i%2?MAT.aluminium():MAT.ceramicWhite());group.add(mesh);cards.push(mesh)}return{group,cards}}
