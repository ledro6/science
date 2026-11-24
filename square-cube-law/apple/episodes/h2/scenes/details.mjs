import * as T from 'three';
import {kit} from './props.mjs';
const K=kit(T);
const sphere=(r,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(new T.SphereGeometry(r,20,12),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o};
export function mitten(){
 const o=new T.Group(),m=K.standard(0x456b91,.06,.74),thread=K.standard(0xaaa8a2,.1,.8);
 o.add(sphere(.60,m,0,.04,0,.64,.94,.24),sphere(.23,m,.35,.02,.02,.75,1,.67),K.box(.51,.21,.20,m,0,-.54,0));
 // The crooked hand sewn repair is the identifying detail, not decoration.
 for(let i=0;i<5;i++){const b=K.box(.10,.018,.018,thread,.25+i*.032,-.13+i*.065,.145);b.rotation.z=i%2?-.6:.7;o.add(b)}
 return o;
}
export function hand(){
 const o=new T.Group(),m=K.standard(0x97969a,.05,.67);
 o.add(sphere(.48,m,0,-.08,0,.72,.68,.30));
 for(let i=0;i<4;i++)o.add(sphere(.115,m,-.23+i*.15,.33-i*.018,0,.50,2.52-i*.15,.68));
 const thumb=sphere(.13,m,.37,-.03,.02,.6,1.8,.7);thumb.rotation.z=-.6;o.add(thumb);
 return o;
}
export function mother(){
 const o=K.silhouette(),hair=K.standard(0x9b9da3,.1,.65);
 o.add(sphere(.25,hair,0,.73,-.065,.92,1.2,.75));
 o.add(K.box(.16,.53,.18,hair,-.18,.48,-.09),K.box(.16,.53,.18,hair,.18,.48,-.09));
 return o;
}
export function child(){
 const o=K.silhouette();o.scale.setScalar(.61);
 const glove=mitten();glove.scale.setScalar(.29);glove.position.set(-.36,-.08,.15);o.add(glove);
 const arm=new T.Group(); arm.position.set(.29,.26,.04);
 arm.add(K.box(.13,.62,.14,K.standard(0x34383d),0,-.22,0));
 const palm=hand();palm.scale.setScalar(.23);palm.position.set(0,-.55,.02);arm.add(palm);o.add(arm);
 return {object:o,arm};
}
export function apartment(){
 const object=new T.Group(),wall=K.standard(0x373b42,.08,.75),silver=K.standard(0x777d87,.38,.5);
 object.add(K.box(3.8,4.8,.3,wall,0,0,-.45));
 object.add(K.box(2.5,4,.08,K.glow(0x0b0c10),0,-.1,-.25));
 for(const x of [-1.35,1.35])object.add(K.box(.13,4.2,.31,silver,x,-.1,0));
 object.add(K.box(2.85,.14,.31,silver,0,2,0),K.box(5,.08,3.4,K.standard(0x858991,.12,.73),0,-2.23,1.3));
 const pivot=new T.Group();pivot.position.set(-1.26,-.1,.04);object.add(pivot);
 const leaf=K.box(2.52,4,.15,K.standard(0x4b4a4d,.15,.6),1.26,0,0);pivot.add(leaf);
 pivot.add(K.box(.09,.28,.13,silver,2.23,0,.15));
 return {object,pivot};
}
