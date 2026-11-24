const graphite = 0x27292d;
const silver = 0x858a92;
const black = 0x101115;
const red = 0xff453a;
const blue = 0x456b91;

export function kit(T) {
  const standard = (color, metalness = .18, roughness = .35) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  const glow = color => new T.MeshBasicMaterial({color});
  const box = (w,h,d,mat,x=0,y=0,z=0) => {
    const o = new T.Mesh(new T.BoxGeometry(w,h,d),mat);
    o.position.set(x,y,z);
    return o;
  };
  const sphere = (r,mat,x,y,z,sx=1,sy=1,sz=1) => {
    const o = new T.Mesh(new T.SphereGeometry(r,24,16),mat);
    o.position.set(x,y,z); o.scale.set(sx,sy,sz);
    return o;
  };

  function doors() {
    const object = new T.Group();
    const frame = standard(silver,.58), panel = standard(0x45474e,.47), wall = standard(black);
    object.add(box(3.7,4.9,.34,wall,0,0,-.55));
    object.add(box(.19,4.5,.40,frame,-1.49,0,.1),box(.19,4.5,.40,frame,1.49,0,.1));
    object.add(box(3.18,.28,.4,frame,0,2.12,.1),box(3.18,.12,.4,frame,0,-2.16,.1));
    const left=box(1.38,4.13,.14,panel,-.693,-.04,.15);
    const right=box(1.38,4.13,.14,panel,.693,-.04,.15);
    object.add(left,right);
    return {object,left,right};
  }

  function corridor() {
    const object = new T.Group();
    const wall = standard(0x43464b), trim=standard(silver,.5), inset=standard(0x202931,.48);
    object.add(box(3.5,4.45,.20,wall,0,0,-1.7));
    object.add(box(.18,4.45,3,wall,-1.78,0,-.2),box(.18,4.45,3,wall,1.78,0,-.2));
    object.add(box(3.5,.15,3,standard(0x343638),0,-2.18,-.2));
    object.add(box(1.05,2.45,.11,trim,.62,.13,-1.53),box(.93,2.32,.05,inset,.62,.13,-1.45));
    object.add(box(.85,1.8,.35,standard(0x4c4844),-.95,-.95,-1.35));
    object.add(box(.8,.026,.06,glow(0xb9bfce),0,2,-1.45));
    object.add(sphere(.28,standard(blue),-1.09,.45,-1.32,.56,.92,.22));
    object.add(sphere(.085,standard(blue),-.94,.47,-1.32,.68,1,.65));
    object.add(box(.21,.08,.08,standard(blue),-1.09,.25,-1.31));
    return object;
  }

  function silhouette() {
    const object = new T.Group(), m=standard(0x151a21);
    object.add(sphere(.23,m,0,.66,0,.83,1.1,.7));
    object.add(sphere(.52,m,0,-.04,0,.85,1.2,.46));
    object.add(box(.45,.77,.25,m,0,-.92,0));
    const arm=box(.11,.59,.12,m,.27,.23,.1); arm.rotation.z=-.48; object.add(arm);
    return object;
  }

  function handset() {
    const o=new T.Group(), mat=standard(0x343238,.16,.23);
    o.add(box(1.9,.19,.31,mat));
    o.add(sphere(.27,mat,-.94,-.03,.02,1,.69,1),sphere(.27,mat,.94,-.03,.02,1,.69,1));
    return o;
  }

  function phone() {
    const object=new T.Group(), mat=standard(0x352c2d,.08,.3);
    object.add(box(2.1,1.47,.60,mat,0,-.18,0));
    const dial=new T.Mesh(new T.TorusGeometry(.46,.063,12,48),standard(silver,.65));
    dial.position.set(0,-.18,.32); object.add(dial);
    object.add(sphere(.15,standard(0x555157),0,-.18,.32,1,1,.21));
    for(let i=0;i<10;i++) {
      const a=i*Math.PI/5;
      object.add(sphere(.060,standard(black),Math.cos(a)*.34,-.18+Math.sin(a)*.34,.32,1,1,.25));
    }
    const receiver=handset(); receiver.position.set(0,.64,.20); object.add(receiver);
    return {object,receiver};
  }

  function mobile() {
    const object=new T.Group();
    object.add(box(1.62,2.88,.17,standard(silver,.58)),box(1.53,2.78,.03,glow(0x16191e),0,0,.096));
    object.add(box(.44,.08,.022,glow(black),0,1.26,.117));
    return object;
  }

  return {box,doors,corridor,silhouette,phone,mobile,standard,glow,red,silver};
}
