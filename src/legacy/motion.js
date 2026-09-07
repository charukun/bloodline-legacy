
/* Additive hit reactions never cancel a committed enemy attack by themselves. */
function hitPose(p,t){
 const active=p.hitReactUntil>t&&Number.isFinite(p.hitReactAt);
 const legacy=!active&&['hit','break','stagger'].includes(p.action)&&p.actionUntil>t;
 const start=active?p.hitReactAt:p.actionStarted||0,end=active?p.hitReactUntil:p.actionUntil||0;
 const u=clamp((t-start)/Math.max(.01,end-start),0,1);
 const shape=u<.18?Math.sin(u/.18*Math.PI/2):((1-u)/.82)**2;
 const severity=p.hitSeverity==='lost'?1.22:p.hitSeverity==='heavy'?1.1:1;
 const amount=(active||legacy)&&p.alive!==false?shape*severity:0;
 const part=p.hitPart||'torso',leg=part.endsWith('Leg'),dir=Number.isFinite(p.hitDir)?p.hitDir:(p.dir||0)+Math.PI;
 const side=Math.sin(dir-(p.dir||0)),front=Math.cos(dir-(p.dir||0));
 return {amount,part,x:Math.sin(dir)*amount*.10,z:Math.cos(dir)*amount*.10,
  drop:amount*(leg?.18:.018),pitch:amount*front*.14,roll:-amount*side*.14,
  head:part==='head'?-.42*amount:0,torso:part==='torso'?.24*amount:0,
  rightArm:part==='rightArm'?.58*amount:part==='torso'?-.18*amount:0,
  leftArm:part==='leftArm'?.58*amount:part==='torso'?-.18*amount:0,
  rightLeg:part==='rightLeg'?-.62*amount:leg?-.12*amount:0,
  leftLeg:part==='leftLeg'?-.62*amount:leg?-.12*amount:0,
  rightKnee:part==='rightLeg'?.98*amount:leg?.26*amount:0,
  leftKnee:part==='leftLeg'?.98*amount:leg?.26*amount:0};
}

/* Curves share the actual strike clock. Multi-hit motion has a separate beat per hit. */
function artPose(p,t){
 const o={active:false,y:0,x:0,z:0,yaw:0,pitch:0,roll:0,torso:0,head:0,rightArm:0,leftArm:0,rightArmZ:0,leftArmZ:0,rightLeg:0,leftLeg:0,rightKnee:0,leftKnee:0};
 if(p.alive===false)return o;
 if(p.seated){const settle=clamp((t-(p.sitSince??t))/.25,0,1);return {...o,active:true,y:-.65*settle,pitch:.06,head:.07+Math.sin(t*1.4)*.035,rightArm:-.72,leftArm:-.72,rightArmZ:-.13,leftArmZ:.13,rightLeg:-1.5*settle,leftLeg:-1.5*settle,rightKnee:1.62*settle,leftKnee:1.62*settle};}
 if(p.activity){
  const u=t-(p.activitySince||0),breath=Math.sin(u*1.6),page=Math.sin(u*.75);
  Object.assign(o,{active:true,head:.22+breath*.025,rightArm:-1.12,leftArm:-1.12,rightArmZ:-.12,leftArmZ:.12});
  if(p.activity==='pray'){Object.assign(o,{y:-.25,pitch:.12,head:.35,rightArm:-1.6,leftArm:-1.6,rightArmZ:.28,leftArmZ:-.28,rightLeg:-.45,leftLeg:-.45,rightKnee:.95,leftKnee:.95});}
  else if(p.activity==='read'||p.activity==='study'){o.rightArm=-1.2+Math.max(0,page)**8*.22;o.leftArm=-1.15;o.head=.18+Math.sin(u*.53)*.06;if(p.activity==='study'){o.rightLeg=-.16;o.leftLeg=.14;o.yaw=Math.sin(u*.36)*.08;}}
  else if(p.activity==='play'){const hop=Math.max(0,Math.sin(u*2.8));Object.assign(o,{y:hop*.32,rightLeg:-hop*.75,leftLeg:Math.sin(u*2.8+1)*.26,rightKnee:hop*.75,leftKnee:.18,rightArm:-.65+Math.sin(u*2.8)*.35,leftArm:-.65-Math.sin(u*2.8)*.35,rightArmZ:-.6,leftArmZ:.6,yaw:Math.sin(u*.7)*.45,head:-.04});}
  else if(p.activity==='observe'){o.head=.12+Math.sin(u*.7)*.12;o.yaw=Math.sin(u*.35)*.15;o.rightArm=-.45;o.leftArm=-.4;o.rightArmZ=-.3;}
  else if(p.activity==='track'){Object.assign(o,{y:-.32,pitch:.26,head:.32,rightArm:-1.0,leftArm:-.7,rightLeg:-.7,rightKnee:1.3,leftLeg:-.25,leftKnee:.5});}
  else if(p.activity==='care'){o.rightArm=-1.2+Math.sin(u*2.5)*.26;o.leftArm=-1.1;o.rightArmZ=.15+Math.sin(u*2.5)*.12;o.head=.28;}
  return o;
 }
 const sk=skillById(p.pendingSkill?.id??p.attackSkill??p.currentSkill);if(!sk)return o;
 const charge=!!p.pendingSkill,attack=p.action==='attack'&&p.actionUntil>t;
 if(!charge&&!attack)return o;
 const duration=Math.max(.01,p.actionUntil-(p.actionStarted||0)),u=clamp((t-(p.actionStarted||0))/duration,0,1),hits=sk.hits||1;
 const beat=clamp(u*hits,0,hits-.0001),v=beat%1,odd=Math.floor(beat)%2?-1:1,s=Math.sin(v*Math.PI),whole=Math.sin(u*Math.PI);
 const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);},cut=smooth((v-.25)/.18),returning=smooth((v-.58)/.42);
 o.active=true;const a=sk.animation||'slash';
 if(charge){const q=p.pendingSkill,f=clamp((t-q.started)/Math.max(.01,q.at-q.started),0,1);o.y=-.10*f;o.pitch=-.09*f;o.torso=-.08*f;o.rightArm=-1.2-f*.65;o.leftArm=-.55-f*.45;o.rightLeg=-.18*f;o.leftLeg=.14*f;o.rightKnee=.25*f;o.leftKnee=.25*f;
  if(['cast','roar','counter'].includes(a)){o.rightArm=-1.0-f*.25;o.leftArm=-1.0-f*.25;o.rightArmZ=-.45*f;o.leftArmZ=.45*f;}
  if(['leap','slam'].includes(a)){o.rightArm=-2.5*f;o.leftArm=-2.3*f;o.y=-.15*f;o.rightKnee=.42*f;o.leftKnee=.42*f;}
  return o;
 }
 // A sharp thrust follows through, then yields to the next distinct strike.
 o.rightArm=-1.8+v*2.05;o.leftArm=-.35;o.rightLeg=-.2*s;o.leftLeg=.12*s;o.pitch=.12*s;o.y=-.035*s;o.rightKnee=.16*s;
 if(a==='double'||a==='cross'){
  o.yaw=odd*(a==='cross'?.72:.30)*Math.sin(v*Math.PI*1.2);o.torso=odd*.14*s;
  o.rightArm=odd>0?-1.9+v*2.3:-.45;o.leftArm=odd<0?-1.9+v*2.3:-.45;
  o.rightArmZ=-odd*.45*s;o.leftArmZ=-odd*.45*s;o.rightLeg=-.25*s;o.leftLeg=.18*s;
 }else if(a==='spin'){
  o.yaw=u*Math.PI*2*Math.max(1,Math.ceil(hits/2));o.rightArm=-1.35;o.leftArm=-1.3;o.rightArmZ=-1.0;o.leftArmZ=1.0;o.y=.12*whole;o.rightLeg=-.25;o.leftLeg=.32;o.leftKnee=.55;
 }else if(a==='leap'){
  o.y=whole*.85;o.pitch=-.18+u*.6;o.rightArm=-2.6+u*2.8;o.leftArm=-2.35+u*2.6;o.rightLeg=-.5*whole;o.leftLeg=-.3*whole;o.rightKnee=1.4*whole;o.leftKnee=1.3*whole;
 }else if(a==='slam'){
  const smash=clamp(u/.40,0,1);o.rightArm=-2.9+smash*3.6;o.leftArm=-2.7+smash*3.4;o.pitch=whole*.45;o.y=-.15*whole;o.rightKnee=.5*whole;o.leftKnee=.5*whole;o.rightLeg=-.18;o.leftLeg=-.18;
 }else if(a==='dash'||a==='zigzag'){
  o.pitch=.35;o.rightArm=-.9;o.leftArm=.45;o.rightLeg=-.8*Math.sin(u*TAU*2);o.leftLeg=.8*Math.sin(u*TAU*2);o.rightKnee=.65*Math.max(0,Math.sin(u*TAU*2));o.leftKnee=.65*Math.max(0,-Math.sin(u*TAU*2));o.yaw=a==='zigzag'?Math.sin(u*TAU*1.5)*.65:0;o.roll=a==='zigzag'?Math.sin(u*TAU*1.5)*.18:0;
 }else if(a==='backflip'){
  o.y=whole*.6;o.pitch=-whole*1.0;o.yaw=u*Math.PI*1.7;o.rightArm=-.7;o.leftArm=-.7;o.rightArmZ=-.6;o.leftArmZ=.6;o.rightLeg=-.7*whole;o.leftLeg=-.45*whole;o.rightKnee=1.4*whole;o.leftKnee=1.2*whole;
 }else if(a==='slide'){
  o.y=-.37*whole;o.pitch=-.2;o.rightLeg=-1.6*whole;o.rightKnee=.16;o.leftLeg=-.1;o.leftKnee=1.65*whole;o.rightArm=-.8;o.leftArm=.35;o.roll=-.1;
 }else if(a==='kick'){
  o.pitch=-.22*s;o.rightLeg=-1.8*s;o.rightKnee=.2*s;o.leftLeg=.15;o.rightArm=-.45;o.leftArm=-.75;o.rightArmZ=-.35;o.leftArmZ=.35;
 }else if(a==='counter'){
  o.y=-.06;o.pitch=-.1;o.rightArm=-1.05;o.leftArm=-1.25;o.rightArmZ=-.22;o.leftArmZ=.3;o.yaw=-.4*whole;
 }else if(a==='cast'||a==='roar'){
  o.y=.06*whole;o.pitch=-.15*whole;o.rightArm=-1.2-whole*.35;o.leftArm=-1.2-whole*.35;o.rightArmZ=-.7*whole;o.leftArmZ=.7*whole;o.head=-.18*whole;
 }else if(a==='thrust'){
  const jab=cut*(1-returning*.8);o.rightArm=-1.03-jab*.65;o.leftArm=-.45;o.pitch=.28*jab;o.yaw=.35-.48*jab;o.rightLeg=-.38*jab;o.leftLeg=.18*jab;
 }else if(a==='slash'){
  o.yaw=-.58+cut*1.14-returning*.38;o.torso=-.12+cut*.23;
  o.rightArm=-1.28+cut*.58+returning*.28;o.rightArmZ=-1.0+cut*1.85-returning*.5;
  o.leftArm=-.56-cut*.16;o.leftArmZ=.36;o.pitch=.17*cut*(1-returning*.8);
  o.rightLeg=-.26*cut;o.leftLeg=.18*cut;o.rightKnee=.28*cut;
 }
 if(sk.id===4101){
  const jab=smooth((v-.28)/.15),release=smooth((v-.6)/.4);
  o.y=.04*Math.sin(v*Math.PI);o.yaw=-.28+jab*.3;o.pitch=.15*jab-.20*release;
  o.rightArm=-.9-jab*.64+release*.54;o.leftArm=-.9-jab*.64+release*.54;o.rightArmZ=-.18;o.leftArmZ=.18;
  o.rightLeg=-.30+release*.58;o.leftLeg=.22-release*.45;o.rightKnee=.2;o.leftKnee=.35*release;
 }
 if(a==='judgement'||a==='eclipse'){
  o.rightArm=-2.65;o.leftArm=-1.30;o.rightArmZ=-.30;o.leftArmZ=.7;o.head=-.25;o.y=whole*.16;o.pitch=-.12*whole;
 }

 return o;
}

function ailmentPose(p,t){
 const o={y:0,pitch:0,roll:0,head:0,arm:0,knee:0};if(p.alive===false)return o;
 const has=k=>hasStatus(p,k,t);
 if(has('sleep')){o.y=-.24;o.pitch=.45;o.head=.45+Math.sin(t*1.5)*.08;o.arm=.23;o.knee=.5;}
 else if(has('stun')){o.roll=Math.sin(t*5)*.12;o.head=Math.sin(t*6)*.20;o.arm=-.2;}
 if(has('root')){o.knee+=.2+Math.sin(t*7)*.08;o.y-=.07;o.roll+=Math.sin(t*5)*.025;}
 if(has('slow')){o.pitch+=.13;o.arm+=Math.sin(t*2)*.04;}
 if(has('weak')){o.head+=.16;o.pitch+=.18;o.y-=.06;o.arm+=.2;}
 if(has('poison')){o.pitch+=.15;o.roll+=Math.sin(t*19)*.028;o.head+=.1;}
 if(has('burn')){o.roll+=Math.sin(t*20)*.035;o.arm-=Math.max(0,Math.sin(t*11))*.18;}
 if(has('blind')){o.head+=Math.sin(t*3)*.14;o.arm-=.15;}
 if(has('bleed')){o.pitch+=.04;o.head+=.04;}
 return o;
}


