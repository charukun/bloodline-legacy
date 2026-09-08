/* Presentation only. Force travels from the contact to the trunk, then the
 * pelvis/support foot. All curves finish within the existing reaction clock. */
function hitPose(p,t){
 const active=p.hitReactUntil>t&&Number.isFinite(p.hitReactAt)&&t>=p.hitReactAt;
 // A completed reaction must not restart from actionStarted during residual stun.
 const legacy=!p.hitSeverity&&['hit','break','stagger'].includes(p.action)&&p.actionUntil>t;
 const start=active?p.hitReactAt:p.actionStarted||0,end=active?p.hitReactUntil:p.actionUntil||0;
 const u=clamp((t-start)/Math.max(.01,end-start),0,1),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 const pulse=peak=>u<peak?.32+.68*smooth(u/peak):1-smooth((u-peak)/(1-peak));
 const on=(active||legacy)&&p.alive!==false,blocked=!!p.hitGuard;
 const force=on?clamp(p.hitStrength??(p.hitSeverity==='lost'?1.15:p.hitSeverity==='heavy'?1:.48),.15,1.25):0;
 const contact=pulse(.075)*force,body=pulse(.19)*force,balance=smooth(u/.29)*(1-smooth((u-.42)/.58))*force;
 const recover=Math.sin(Math.PI*clamp((u-.48)/.52,0,1))*.065*force;
 const part=p.hitPart||'torso',leg=part.endsWith('Leg'),arm=part.endsWith('Arm');
 const dir=Number.isFinite(p.hitDir)?p.hitDir:(p.dir||0)+Math.PI;
 const side=Math.sin(dir-(p.dir||0)),front=Math.cos(dir-(p.dir||0));
 const struck=part.startsWith('left')?-1:part.startsWith('right')?1:Math.abs(side)>.2?-Math.sign(side):((p.hitMotionId||0)%2?1:-1);
 const brace=blocked?.3:leg?1:.65,stepSide=leg?-struck:(Math.abs(side)>.3?Math.sign(side):struck);
 const step=(smooth((u-.13)/.22)-smooth((u-.67)/.33))*Math.max(0,force-.55)*.28;
 const lift=(Math.sin(Math.PI*clamp((u-.13)/.22,0,1))+Math.sin(Math.PI*clamp((u-.67)/.33,0,1)))*Math.max(0,force-.55)*.15;
 const o={amount:contact,part,blocked,phase:u,stepSide,stepX:side*step,stepZ:front*step,stepLift:lift,
  x:Math.sin(dir)*balance*.045,z:Math.cos(dir)*balance*.045,
  drop:balance*(blocked?.028:leg?.23:.095),pitch:(balance*.045-recover)*front,roll:-(balance*.045-recover)*side,
  torso:(part==='torso'?-front*.36:front*.12)*body*(blocked?.32:1),
  torsoRoll:-side*body*(arm?.25:.20),yaw:-struck*body*(arm?.20:.06),
  head:front*contact*(part==='head'?.43:.11)-front*recover,
  headRoll:-side*contact*(part==='head'?.36:.08),
  rightArm:0,leftArm:0,rightArmZ:0,leftArmZ:0,rightLeg:0,leftLeg:0,rightKnee:0,leftKnee:0};
 for(const s of [-1,1]){const a=s===1?'rightArm':'leftArm',l=s===1?'rightLeg':'leftLeg',k=s===1?'rightKnee':'leftKnee';
  o[a]=(part===a?contact*.42:-balance*.24)*(blocked?.45:1);
  o[a+'Z']=-s*balance*.18+(part===a?-side*contact*.25:0);
  o[l]=-balance*brace*(part===l?.46:.16);o[k]=balance*brace*(part===l?.95:.32);
 }
 for(const s of [-1,1]){const key=s===1?'rightFoot':'leftFoot',moves=s===stepSide;o[key+'X']=moves?o.stepX:0;o[key+'Z']=moves?o.stepZ:0;o[key+'Lift']=moves?o.stepLift:0;}
 if(blocked){o.leftArm=contact*.30;o.leftArmZ=side*contact*.10;o.rightArm=-balance*.12;}
 return o;
}

/* Repeated hits blend from the actually rendered pose, never from bind pose.
 * State lives on the renderer, is bounded and is never serialized into a save. */
class DamageMotion{
 constructor(){this.actors=new Map();}
 sample(p,t){
  const pose=hitPose(p,t),key=p.hitMotionId??p.lastImpactAt??p.hitReactAt;
  let s=this.actors.get(p.id);
  if(s&&(t<s.t||t-s.t>.4||s.room!==p.room||Math.hypot(p.x-s.x,p.z-s.z)>1.5||p.alive===false)){this.actors.delete(p.id);s=null;}
  if(!s){s={key,t,x:p.x,z:p.z,room:p.room,pose};this.actors.set(p.id,s);}
  if(key!==s.key){s.from=s.pose.amount>0?s.pose:null;s.elapsed=0;s.key=key;s.clock=t-(p.hitReactAt||0);}
  if(s.from){
   // hitReactAt advances with hitstop, so reaction age is the frozen clock.
   const clock=t-(p.hitReactAt||0),delta=Math.max(0,clock-(s.clock??clock));
   s.elapsed+=delta;const mix=clamp(s.elapsed/.065,0,1),w=mix*mix*(3-2*mix);
   if(pose.amount>0&&w<1){for(const k of Object.keys(pose))if(typeof pose[k]==='number'&&!['phase','stepSide'].includes(k))pose[k]=s.from[k]*(1-w)+pose[k]*w;}
   else s.from=null;
  }
  s.clock=t-(p.hitReactAt||0);s.pose=pose;s.t=t;s.x=p.x;s.z=p.z;
  if(this.actors.size>64&&t>=(this.nextPrune||0)){this.nextPrune=t+.5;for(const [id,a]of this.actors)if(t-a.t>.4)this.actors.delete(id);}
  return pose;
 }
}
function damagePose(renderer,p,t){renderer.damageMotion??=new DamageMotion();return renderer.damageMotion.sample(p,t);}

/* Preserve the last authored attack pose only when the existing combat rules
 * interrupt it. Its momentum releases beneath the additive impact in 90 ms. */
function damageArtPose(renderer,p,t,pose){
 const s=renderer.damageMotion?.actors.get(p.id);if(!s)return pose;
 const age=t-(p.hitReactAt||0),attacking=!!p.pendingSkill||p.action==='attack';
 if(!attacking&&s.attacking&&s.pose.amount>0){s.attackFrom=s.art;s.attackAge=age;}
 if(s.attackFrom){
  const u=clamp((age-s.attackAge)/.09,0,1),w=(1-u)**2;
  if(s.pose.amount>0&&!attacking&&w>0){for(const k of Object.keys(pose))if(typeof pose[k]==='number')pose[k]+=s.attackFrom[k]*w;pose.active=true;}
  else s.attackFrom=null;
 }
 s.attacking=attacking;s.art=attacking?{...pose}:null;return pose;
}

/* Two-link contact correction for the existing rigid dolls. No raycasts, new
 * geometry or simulation displacement. The sole remains on its pre-hit plane. */
function damageLeg(reaction,side,l1,l2,scale=1,facing=0){
 const foot=side===1?'rightFoot':'leftFoot',dx=reaction[foot+'X']-(Math.cos(facing)*reaction.x-Math.sin(facing)*reaction.z)/scale;
 const z=reaction[foot+'Z']-(Math.sin(facing)*reaction.x+Math.cos(facing)*reaction.z)/scale,drop=reaction.drop/scale,lift=reaction[foot+'Lift'];
 const vertical=Math.max(.15,l1+l2-drop-lift),length=Math.min(l1+l2,Math.hypot(vertical,z,dx));
 const bend=Math.acos(clamp((l1*l1+length*length-l2*l2)/(2*l1*length),-1,1));
 return {hip:-Math.atan2(z,vertical)-bend,knee:Math.PI-Math.acos(clamp((l1*l1+l2*l2-length*length)/(2*l1*l2),-1,1)),roll:Math.atan2(dx,vertical)};
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


