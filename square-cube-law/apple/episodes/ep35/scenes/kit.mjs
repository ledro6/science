import {THREE,orbit,P,atext,g,FONT,accent} from '../../../engine.mjs';
import {makePasta} from './pasta-geometry.mjs';
export function setupPasta(stage){stage.floor.visible=false;stage.lights.key.castShadow=false;const pasta=makePasta(THREE);stage.root.add(pasta.object);return pasta}
export function camera(stage,t,s,{detail=false}={}){orbit(stage.camera,[.13,1.55,0],detail?12.7:15.4,detail?-3:5,detail?0:8)}
export function text(str,y,t0,t,stage,size=86,opt={}){atext(str,500,y,t0,t,{size,col:stage.ink,...opt})}
export function note(t,t0,stage,str='3D-схема · время замедлено'){atext(str,500,1260,t0,t,{size:29,col:stage.sub,blur:4,dy:10})}
export function pill(t,t0){const p=P(t,t0,.7);if(p<.003)return;g.save();g.globalAlpha=p;g.fillStyle=accent();g.beginPath();g.roundRect(230,1160,540,90,45);g.fill();g.font=`600 38px ${FONT}`;g.fillStyle='#fff';g.textBaseline='middle';g.textAlign='center';g.fillText('Подписаться на L³',500,1205);g.restore()}
export function ring(stage){const mesh=new THREE.Mesh(new THREE.TorusGeometry(.11,.014,8,32),new THREE.MeshBasicMaterial({color:stage.accent,transparent:true,opacity:0}));stage.root.add(mesh);return mesh}
