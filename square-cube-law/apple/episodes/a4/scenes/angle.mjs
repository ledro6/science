import { defineScene, makeStage, atext, acount, line, P, Wd, THREE, MAT, lerp, project, eInOut } from '../../../engine.mjs';
import { frame, roundedBoxGeo } from '../../a3/scenes/kit.mjs';

const story = .33, floors = 12;
defineScene('angle', {
  setup() {
    const stage = makeStage({ bg:'white', shadow:.33 });
    const tower = new THREE.Group();
    const slab = roundedBoxGeo(1.63, .295, 1.20, .033);
    const material = MAT.ceramicWhite();
    for (let i=0;i<floors;i++) {
      const deck = new THREE.Mesh(slab,material);
      deck.castShadow = true; deck.receiveShadow = true;
      deck.position.y = story*(i+.5);
      tower.add(deck);
    }
    stage.root.add(tower);
    const T = { time: Wd('g1','время'), value: Wd('g1','тридцать'), calc: Wd('g2','модели'),
      air: Wd('g2','воздух') };
    return { stage, tower, T };
  },
  update(t,s,{stage,tower,T}) {
    const p = P(t,s.start,s.end-s.start,eInOut);
    const reveal = P(t,T.time-.2,.85);
    tower.scale.y = lerp(.88,1,reveal);
    tower.rotation.y = lerp(-.1,.27,p);
    frame(stage.camera,[0,2.05,0],lerp(21.5,20.4,p),lerp(-4,4,p),4,464,945);
  },
  draw2d(t,s,{stage,T}) {
    const { ink, sub, accent, camera } = stage;
    atext('Высота падения',540,393,T.time-.1,t,{size:106,col:ink,track:-.035,out:T.value-.1});
    acount(39,540,470,T.value-.09,t,{size:215,w:600,col:accent,dur:1.0,suffix:' м'});
    atext('h = v² / 2g',540,574,T.calc,t,{size:62,w:500,col:sub});
    const [x0,y0]=project(camera,-1.25,0,.38), [x1,y1]=project(camera,-1.25,story*floors,.38);
    const p=P(t,T.value-.4,.9,eInOut);
    line(x0,y0,lerp(x0,x1,p),lerp(y0,y1,p),ink,p*.8,3);
    line(x0-20,y0,x0+20,y0,ink,p*.8,3);
    line(x1-20,y1,x1+20,y1,ink,P(t,T.value+.35,.5)*.8,3);
    atext('Старт из покоя', 850, 722, T.calc+.45,t,{size:43,w:500,col:sub});
    atext('Без сопротивления', 850, 785, T.air-.08,t,{size:43,w:500,col:sub});
    atext('воздуха', 850, 832, T.air+.10,t,{size:43,w:500,col:sub});
  },
  sfx(add,s) {
    const n=Wd('g1','тридцать');
    add(n-1.5,'riser',.22,1);
    add(n,'impact',.34,.96);
    add(n+.12,'chime',.2,.87);
    add(Wd('g1','тело')-.12,'swell',.19,.8);
    add(Wd('g2','модели'),'tick',.13,1);
    add(Wd('g2','воздух'),'click',.15,.9);
  },
});
