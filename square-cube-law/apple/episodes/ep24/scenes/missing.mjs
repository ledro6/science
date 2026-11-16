import { defineScene, makeStage, atext, P, Wd, lerp, eInOut, THREE } from '../../../engine.mjs';
import { frame, makePlane, posePlane } from '../kit.mjs';
defineScene('missing', {
  setup() {
    const stage=makeStage({bg:'black',shadow:.5}),plane=makePlane();
    const rings=plane.engines.map(engine=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.31,.018,8,40),new THREE.MeshBasicMaterial({color:stage.accent}));
      ring.rotation.x=-Math.PI/2;ring.position.set(engine.position.x,.67,engine.position.z);
      plane.object.add(ring);return ring;
    });
    stage.root.add(plane.object);
    return {stage,plane,rings,why:Wd('m2','попадания'),engine:Wd('m2','двигатель')};
  },
  update(t,s,{stage,plane,rings,why}) {
    posePlane(plane,t,s,s.start-1);
    const p=P(t,why-.1,.85);
    rings.forEach(ring=>{ring.visible=p>.002;ring.scale.setScalar(lerp(.7,1,p));});
    frame(stage.camera,[0,.32,-.30],lerp(26,20,P(t,why-.4,1.4,eInOut)),lerp(12,-7,P(t,s.start,s.end-s.start,eInOut)),63,520,908);
  },
  draw2d(t,s,{stage,why,engine}) {
    atext('Чистое место',520,350,Wd('m1','чистое'),t,{size:101,col:stage.ink,out:why-.35});
    atext('Ещё не значит безопасное',520,455,Wd('m1','безопасное')-.2,t,{size:61,w:500,col:stage.sub,out:why-.35});
    atext('Попадание могло быть',520,350,why,t,{size:82,col:stage.ink});
    atext('критическим',520,455,engine-.2,t,{size:95,col:stage.accent});
    atext('Схема, а не историческая карта пробоин',520,1248,s.start+.2,t,{size:31,w:500,col:stage.sub});
  },
  sfx(add,s){
    add(s.start+.14,'swell',.22,.7);add(Wd('m2','попадания'),'whoosh',.2,.8);
    add(Wd('m2','двигатель'),'impact',.25,.88);
  },
});
