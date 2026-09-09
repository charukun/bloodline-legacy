/* Presentation only. Force travels from the contact to the trunk, then the
 * pelvis/support foot. All curves finish within the existing reaction clock. */
function hitPose(p,t,stance={},profile=null){
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
 const chestFront=Math.cos(dir-(p.dir||0)-(stance.turn||0)),chestSide=Math.sin(dir-(p.dir||0)-(stance.turn||0));
 const struck=part.startsWith('left')?-1:part.startsWith('right')?1:Math.abs(side)>.2?-Math.sign(side):((p.hitMotionId||0)%2?1:-1);
 const brace=blocked?.3:leg?1:.65,stepSide=stance.stepSide||(leg?-struck:(Math.abs(side)>.3?Math.sign(side):struck));
 // One lifted catch step becomes the next support anchor. Do not drag it home.
 const step=smooth((u-.13)/.22)*Math.max(0,force-.55)*.28;
 const lift=Math.sin(Math.PI*clamp((u-.13)/.22,0,1))*Math.max(0,force-.55)*.15;
 const o={amount:contact,part,blocked,phase:u,stepSide,stepX:side*step,stepZ:front*step,stepLift:lift,
  x:Math.sin(dir)*balance*.045,z:Math.cos(dir)*balance*.045,
  drop:balance*(blocked?.028:leg?.23:.095)*(1+Math.abs(stance.lean||0)*.3),pitch:(balance*.045-recover)*front,roll:-(balance*.045-recover)*side,
  torso:((part==='torso'?-chestFront*.36:chestFront*.12)-(stance.lean||0)*.20)*body*(blocked?.32:1),
  torsoRoll:-chestSide*body*(arm?.25:.20),yaw:-(struck*(arm?.20:.06)+(stance.turn||0)*.12)*body,
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
 if(profile){
  o.drop*=profile.vertical;o.torso*=profile.torso;o.torsoRoll*=profile.lateral;
  o.head*=profile.head;o.headRoll*=profile.head;
  if(!blocked)for(const s of [-1,1]){
   const arm=s===1?'rightArm':'leftArm';
   o[arm]-=body*(part===arm?.18:.45);o[arm+'Z']-=s*balance*.14;
  }
  // Large heads and short legs need rotation limits, not larger root travel.
  o.pitch=clamp(o.pitch,-.12,.12);o.roll=clamp(o.roll,-.12,.12);
 }
 return o;
}

/* Repeated hits blend from the actually rendered pose, never from bind pose.
 * State lives on the renderer, is bounded and is never serialized into a save. */
class DamageMotion{
 constructor(){this.actors=new Map();}
 sample(p,t,feet,profile){
  const key=p.hitMotionId??p.lastImpactAt??p.hitReactAt;
  let s=this.actors.get(p.id);
  if(s&&(t<s.t||t-s.t>.4||s.room!==p.room||Math.hypot(p.x-s.x,p.z-s.z)>1.5||p.alive===false)){this.actors.delete(p.id);s=null;}
  if(!s){s={key:null,t,x:p.x,z:p.z,room:p.room,velocity:{}};this.actors.set(p.id,s);}
  if(key!==s.key){
   const art=s.art||{},right=feet?.[0]?.lift||0,left=feet?.[1]?.lift||0;
   s.stance={turn:clamp((art.yaw||0)+(art.torsoYaw||0),-.9,.9),lean:clamp((art.pitch||0)+(art.torso||0),-.6,.6),stepSide:Math.max(right,left)>.015?(right>left?1:-1):Math.abs(art.weightX||0)>.06?-Math.sign(art.weightX):0};
   s.from=s.pose?.amount>0?s.pose:null;s.fromVelocity=s.velocity;s.elapsed=0;s.key=key;s.clock=t-(p.hitReactAt||0);
  }
  const pose=hitPose(p,t,s.stance,profile),clock=t-(p.hitReactAt||0),delta=Math.max(0,clock-(s.clock??clock));
  if(s.from){
   // hitReactAt advances with hitstop, so reaction age is the frozen clock.
   s.elapsed+=delta;const mix=clamp(s.elapsed/.09,0,1),w=mix*mix*(3-2*mix);
   if(pose.amount>0&&w<1){for(const k of Object.keys(pose))if(typeof pose[k]==='number'&&!['amount','phase','stepSide'].includes(k)){
    const momentum=clamp(s.fromVelocity[k]||0,-3,3)*.09*mix*(1-mix)**2;
    pose[k]=s.from[k]*(1-w)+pose[k]*w+momentum;
    if(k==='drop'||k.endsWith('Lift'))pose[k]=Math.max(0,pose[k]);
   }}
   else s.from=null;
  }
  if(delta>0&&delta<.15&&s.pose&&pose.amount>0){const v={};for(const k of Object.keys(pose))if(typeof pose[k]==='number')v[k]=(pose[k]-s.pose[k])/delta;s.velocity=v;}
  if(pose.amount<=0)s.velocity={};
  s.clock=t-(p.hitReactAt||0);s.pose=pose;s.t=t;s.x=p.x;s.z=p.z;
  if(this.actors.size>64&&t>=(this.nextPrune||0)){this.nextPrune=t+.5;for(const [id,a]of this.actors)if(t-a.t>.4)this.actors.delete(id);}
  return pose;
 }
}
function damagePose(renderer,p,t,feet,profile){renderer.damageMotion??=new DamageMotion();return renderer.damageMotion.sample(p,t,feet,profile);}

/* Commit contact-relative offsets to the real floor anchor. On a new hit the
 * already blended offset is subtracted, preventing double recoil / teleports. */
function damageFoot(p,reaction,side,foot,scale=1){
 if(!foot)return false;
 if(reaction.amount<=0){foot.damageKey=null;return false;}
 const key=p.hitMotionId??p.lastImpactAt??p.hitReactAt,name=side===1?'rightFoot':'leftFoot';
 const x=(reaction[name+'X']||0)*scale,z=(reaction[name+'Z']||0)*scale;
 if(foot.damageKey!==key){
  foot.damageFrom=[...foot.anchor];foot.damageZero=foot.damageKey!=null?[x,z]:[0,0];foot.damageFacing=p.dir||0;foot.damageKey=key;foot.damageLift=foot.lift||0;foot.damagePhase=reaction.phase;
 }
 const cs=Math.cos(foot.damageFacing),sn=Math.sin(foot.damageFacing),dx=x-foot.damageZero[0],dz=z-foot.damageZero[1];
 foot.anchor=[foot.damageFrom[0]+cs*dx+sn*dz,foot.damageFrom[1]-sn*dx+cs*dz];
 const recoil=p.hitRecoil?.id===key?p.hitRecoil:null,catching=side===reaction.stepSide;
 if(recoil&&catching){foot.anchor[0]+=recoil.x;foot.anchor[1]+=recoil.z;}
 const landing=clamp((reaction.phase-foot.damagePhase)/.18,0,1);
 foot.lift=Math.max((reaction[name+'Lift']||0)*scale,foot.damageLift*(1-landing*landing*(3-2*landing)));foot.swing=foot.lift>1e-6;foot.step=null;foot.settle=null;foot.damageSettled=true;
 if(recoil&&catching){foot.lift=Math.max(foot.lift,Math.sin(Math.PI*clamp(recoil.age/recoil.duration,0,1))*.075*scale);foot.swing=foot.lift>1e-6;}
 return true;
}

/* Preserve the last authored attack pose only when the existing combat rules
 * interrupt it. Its momentum releases beneath the additive impact in 90 ms. */
function damageArtPose(renderer,p,t,pose){
 const s=renderer.damageMotion?.actors.get(p.id);if(!s)return pose;
 const age=t-(p.hitReactAt||0),attacking=!!p.pendingSkill||p.action==='attack';
 if(!attacking&&s.attacking&&s.pose.amount>0){s.attackFrom=s.art;s.attackAge=age;}
 if(s.attackFrom){
  const u=clamp((age-s.attackAge)/.09,0,1),w=(1-u)**2;
  if(s.pose.amount>0&&!attacking&&w>0){for(const k of Object.keys(pose))if(typeof pose[k]==='number')pose[k]+=(s.attackFrom[k]??0)*w;pose.active=true;}
  else s.attackFrom=null;
 }
 s.attacking=attacking;s.art={...pose};return pose;
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

/* Presentation only: the existing Simulation owns charge, each .43 contact,
 * travel, hitstop and recovery. No animation state is written into a player.
 * Angles are radians; foot/weight offsets are in adult model units. */
const SkillMotion=(()=>{
 const ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
 const guard={y:-.045,pitch:.025,yaw:0,torso:0,torsoYaw:0,head:0,headYaw:0,
  rightArm:-.80,leftArm:-.92,rightArmZ:-.18,leftArmZ:.20,
  rightElbow:-.65,leftElbow:-.7,rightWrist:0,leftWrist:0,
  rightLeg:0,leftLeg:0,rightKnee:0,leftKnee:0,weightX:0,weightZ:0,
  footSpread:.24,footLead:.13,footTurn:0,grip:0};
 const keys=Object.keys(guard);
 function ready(p,t){
  return p.alive!==false&&!p.prologue&&!incapacitated(p)&&!p.traversal&&!p.rescueTarget&&!p.seated&&!p.activity&&!(p.standUpUntil>t)&&!['carry','wave','sleep','sit','interact','land'].includes(p.action)&&!['sleep','stun'].some(k=>hasStatus(p,k,t))&&!!(p.autoFight||p.guard||p.guardUntil>t||p.combo||p.focusTarget&&p.focusUntil>t);
 }
 // The pose breathes around planted soles. Its clock/envelope belong to the
 // renderer, so stance animation cannot move a collider or consume simulation RNG.
 function readyPose(p,t,state,engaged){
  const dt=state&&!(p.hitstopUntil>t)?clamp(t-(state.readyAt??t),0,.1):0;
  let weight=engaged?1:0,clock=t;
  if(state){
   state.readyAt=t;state.readyWeight=(state.readyWeight||0)+(weight-(state.readyWeight||0))*(1-Math.exp(-dt*12));
   if(!engaged&&state.readyWeight<.002)state.readyWeight=0;
   state.readyClock??=t;if(!(p.hitstopUntil>t))state.readyClock+=dt;
   weight=state.readyWeight;clock=state.readyClock;
  }
  if(!weight)return {pose:{},weight:0};
  const heavy=[2,4].includes(p.weapon),quiet=heavy?.58:1,phase=clock*(heavy?1.9:2.6)+(String(p.id||'').charCodeAt(0)||0)*.13;
  const sway=(Math.sin(phase)+Math.sin(phase*.61+1.3)*.25)*quiet,breath=Math.sin(clock*1.9+.7),still=['idle','recover','guard'].includes(p.action)?1:0;
  const pose={...guard,y:-.075+breath*.009*still,pitch:.035,torso:.025+breath*.014*still,torsoYaw:sway*.045*still,head:-.025-breath*.012*still,headYaw:-sway*.025*still,
   weightX:sway*.042*still,weightZ:Math.sin(phase+.7)*.018*still,
   rightArm:guard.rightArm+breath*.035*still,leftArm:guard.leftArm+Math.sin(phase+.45)*.045*quiet*still,
   rightElbow:guard.rightElbow+breath*.035*still,leftElbow:guard.leftElbow-breath*.025*still,grip:twoHanded(p)?.85:0};
  for(const key of keys)pose[key]*=weight;
  return {pose,weight};
 }
 // Family accents: forge weight, careful precision, play, tracking, study,
 // patience, bell, feather, stone, charcoal, sparring, woodland, knotwork.
 const accents=[ [.05,.08,.05],[0,-.08,-.03],[-.02,-.06,.08],
  [.07,-.10,-.04],[.02,0,-.02],[-.035,.12,-.08],[0,-.12,.02],
  [-.04,-.08,.12],[.10,.10,-.06],[.12,.14,.04],[.03,-.04,.03],
  [-.02,.04,.10],[.06,.07,-.04] ];
 const profiles={
  // The supporting side loads first; the free arm balances the weapon arc.
  slash:[{yaw:-.30,torsoYaw:-.48,rightArm:-1.85,rightArmZ:-.72,rightElbow:-.82,leftArm:-.85,leftArmZ:.42,weightX:-.04,weightZ:-.09,footLead:.19},
   {yaw:.18,torsoYaw:.24,pitch:.07,rightArm:-1.32,rightArmZ:.18,rightElbow:-.16,leftArm:-.62,leftArmZ:.58,rightWrist:.09,weightX:.06,weightZ:.10,footLead:.19},
   {yaw:.34,torsoYaw:.43,rightArm:-.72,rightArmZ:.67,rightElbow:-.34,leftArm:-.42,leftArmZ:.62,rightWrist:.24,pitch:.12,weightX:.08,weightZ:.13,footLead:.19}],
  thrust:[{yaw:.25,torsoYaw:.20,rightArm:-.50,rightArmZ:-.20,rightElbow:-1.52,leftArm:-1.16,leftElbow:-.8,weightZ:-.12,footLead:.25,footSpread:.22},
   {yaw:-.17,torsoYaw:-.20,rightArm:-1.52,rightArmZ:-.08,rightElbow:-.04,leftArm:-.45,leftArmZ:.40,pitch:.10,weightZ:.17,footLead:.25,footSpread:.22},
   {yaw:-.21,torsoYaw:-.23,rightArm:-1.57,rightArmZ:-.06,rightElbow:-.10,leftArm:-.38,leftArmZ:.46,pitch:.13,weightZ:.19,footLead:.25,footSpread:.22}],
  slam:[{y:-.13,yaw:-.10,rightArm:-2.55,rightArmZ:-.40,leftArm:-2.3,leftArmZ:.35,rightElbow:-.92,torso:-.13,weightZ:-.12,footSpread:.28,footLead:.12},
   {y:-.18,yaw:.04,rightArm:-1.02,rightArmZ:-.33,leftArm:-1.02,rightElbow:-.12,torso:.28,pitch:.06,weightZ:.13,footSpread:.28,footLead:.12},
   {y:-.25,yaw:.08,rightArm:-.50,rightArmZ:-.25,leftArm:-.55,rightElbow:-.28,torso:.35,pitch:.09,weightZ:.16,footSpread:.28,footLead:.12}],
  kick:[{y:-.11,yaw:-.12,torsoYaw:.16,rightArm:-1.18,leftArm:-1.25,leftArmZ:.3,weightX:-.14,weightZ:-.05,footLead:.06},
   {y:-.08,yaw:.16,torsoYaw:-.24,pitch:-.10,torso:-.13,rightArm:-.55,rightArmZ:-.52,leftArm:-1.15,leftArmZ:.52,weightX:-.18,weightZ:-.04,footLead:.06},
   {y:-.10,yaw:.19,torsoYaw:-.27,pitch:-.08,rightArm:-.42,rightArmZ:-.58,leftArm:-1.08,weightX:-.16,footLead:.06}],
  counter:[{y:-.09,torsoYaw:.20,leftArm:-1.2,leftElbow:-1.05,rightArm:-1.05,weightZ:-.06},
   {y:-.08,torsoYaw:-.18,leftArm:-1.52,leftElbow:-.10,rightArm:-1.05,weightZ:.08},
   {y:-.07,torsoYaw:-.24,leftArm:-1.58,leftElbow:-.2,weightZ:.10}],
  cast:[{y:-.10,yaw:-.12,torsoYaw:.12,torso:-.08,rightArm:-.9,leftArm:-1.25,rightArmZ:-.42,leftArmZ:.25,rightElbow:-1.35,leftElbow:-1,footSpread:.26,footLead:.05},
   {y:-.03,yaw:.02,torso:.06,rightArm:-1.6,leftArm:-1.43,rightArmZ:-.25,leftArmZ:.45,rightElbow:-.08,leftElbow:-.25,weightZ:.07,footSpread:.26,footLead:.05},
   {y:-.04,yaw:.05,torso:.09,rightArm:-1.54,leftArm:-1.38,rightArmZ:-.45,leftArmZ:.65,rightElbow:-.17,leftElbow:-.3,weightZ:.08,footSpread:.26,footLead:.05}],
  spin:[{y:-.13,torsoYaw:-.35,rightArm:-1.22,rightArmZ:-.58,rightElbow:-.95,leftArm:-1.12,leftArmZ:.4,weightZ:-.06,footSpread:.22,footLead:.08},
   {y:-.08,torsoYaw:.16,rightArm:-1.48,rightArmZ:-1.04,rightElbow:-.10,leftArm:-.82,leftArmZ:.90,weightZ:0,footSpread:.22,footLead:.08},
   {y:-.13,torsoYaw:.25,rightArm:-1.33,rightArmZ:-1.10,rightElbow:-.18,leftArm:-.72,leftArmZ:.95,footSpread:.22,footLead:.08}],
  bow:[{yaw:-.3,torsoYaw:.2,rightArm:-1.42,rightArmZ:.10,rightElbow:-.07,leftArm:-1.35,leftArmZ:.7,leftElbow:-1.4},
   {yaw:-.3,torsoYaw:.16,rightArm:-1.42,rightArmZ:.10,rightElbow:-.07,leftArm:-1.35,leftArmZ:.9,leftElbow:-1.1},
   {yaw:-.3,torsoYaw:.10,rightArm:-1.4,rightArmZ:.10,rightElbow:-.08,leftArm:-1.3,leftArmZ:1.02,leftElbow:-.9}],
  backflip:[{y:-.16,rightArm:-.6,leftArm:-.7,weightZ:-.05},
   {y:-.04,rightArm:-1,leftArm:-1.1,torso:-.10,weightZ:-.08},
   {y:-.14,rightArm:-.7,leftArm:-.8,torso:.12}],
 };
 function shape(sk){
  if(sk.id===4000)return 'thrust';
  if(sk.id===4003||sk.id===4005||sk.id===4017)return 'slam';
  if(sk.id===4010)return 'kick';
  if(sk.id===4101)return 'thrust';
  if(sk.animation)return sk.animation;
  if(sk.magic)return 'cast';if(sk.resource==='arrows')return 'bow';
  if(sk.retreat)return 'backflip';if(sk.counter)return 'counter';
  if(sk.id===4000||sk.form===2||sk.id===4015)return 'thrust';
  if(sk.id===4010)return 'kick';if(sk.form===6||sk.weapon===2||sk.weapon===4)return 'slam';
  return 'slash';
 }
 function clock(p,t,sk=skillById(p.pendingSkill?.id??p.attackSkill??p.currentSkill)){
  if(!sk||p.alive===false)return null;
  if(p.pendingSkill){const q=p.pendingSkill;return {sk,shape:shape(sk),stage:'charge',u:clamp((t-q.started)/Math.max(.001,q.at-q.started),0,1),beat:0,index:0,hits:sk.hits||1};}
  if(p.action!=='attack'||t>p.actionUntil)return null;
  const hits=sk.hits||1,duration=Math.max(.001,p.actionUntil-p.actionStarted),u=clamp((t-p.actionStarted)/duration,0,1);
  const b=skillBeat(sk,u);return {sk,shape:shape(sk),stage:'attack',u,beat:b.beat,index:b.index,hits,duration:duration*(b.end-b.start)};
 }
 // Every beat has a wind-up, contact, overshoot and return. The end of an
 // internal beat IS the next wind-up; there is no modulo snap at a hit boundary.
 function family(a){return ['double','cross'].includes(a)?'slash':a==='eclipse'?'spin':['dash','zigzag','slide'].includes(a)?'thrust':['leap','judgement'].includes(a)?'slam':a==='roar'?'cast':a;}
 function keypose(c,kind,index){
  const a=c.shape,base=family(a);
  const pose={...guard,...(profiles[base]||profiles.slash)[kind]};
  const phase=skillPhase(c.sk),weight=clamp((c.sk.power||.5)*.15+phase*.08,0,.38);
  const accent=accents[Math.floor((c.sk.id-60000)/10)];
  if(accent){pose.torso+=accent[0];pose.rightArm+=accent[1];pose.rightArmZ+=accent[2];}
  pose.y-=weight*(kind===0?.08:.12);
  pose.torsoYaw*=1+weight;pose.rightArmZ*=1+weight*.35;
  if(['double','cross','zigzag'].includes(a)&&index%2){
   pose.yaw=-pose.yaw;pose.torsoYaw=-pose.torsoYaw;
   // Keep a one-handed weapon in its actual hand on the returning cut.
   if(a!=='zigzag')pose.rightArmZ=-pose.rightArmZ;
  }
  if(a==='slide'){pose.y-=.17;pose.torso+=.13;pose.rightArm+=.18;}
  if(a==='kick'&&c.sk.motionPath==='orbit'){pose.y-=.13;pose.yaw+=(kind===0?-.35:kind===1?.6:1);pose.torsoYaw-=.2;}
  if(a==='leap'&&kind===0)pose.y=-.12;
  if(a==='spin'||a==='eclipse'){
   pose.yaw=(index+(kind===0?0:kind===1?.43:.62))*TAU;
  }
  if(c.sk.requires?.includes('leftArm')&&c.sk.requires?.includes('rightArm')&&base==='slam'){
   pose.leftArm=pose.rightArm+.08;pose.leftElbow=pose.rightElbow;pose.rightArmZ=-.40;pose.leftArmZ=.40;
  }
  if(c.sk.id===4101){pose.leftArm=pose.rightArm;pose.leftElbow=pose.rightElbow;pose.leftArmZ=.18;pose.rightArmZ=-.18;}
  return pose;
 }
 function blend(out,a,b,u){for(const k of keys)out[k]=(a[k]??0)+((b[k]??0)-(a[k]??0))*u;return out;}
 // Monotone Hermite slopes carry momentum THROUGH contact. A smoothstep for
 // each interval would stop the weapon at the hit key, before its follow-through.
 function tangent(a,b,c,ab,bc){const x=(b-a)/ab,y=(c-b)/bc;return x*y<=0?0:2*x*y/(x+y);}
 function curve(a,b,c,d,v,start,follow){
  const times=[start,.43,follow,1],values=[a,b,c,d];
  if(v<=start)return a;
  const i=v<.43?0:v<follow?1:2,h=times[i+1]-times[i],u=clamp((v-times[i])/h,0,1),u2=u*u,u3=u2*u;
  const slopes=[0,tangent(a,b,c,.43-start,follow-.43),tangent(b,c,d,follow-.43,1-follow),0];
  return (2*u3-3*u2+1)*values[i]+(u3-2*u2+u)*h*slopes[i]+(-2*u3+3*u2)*values[i+1]+(u3-u2)*h*slopes[i+1];
 }
 function sample(p,t,out,state){
  const c=clock(p,t),settled=ready(p,t),idle=readyPose(p,t,state,settled);
  if(!c){
   if(p.action==='recover'&&p.actionUntil>t){
    if(state&&!state.recover){state.recover=state.lastPose?{...state.lastPose}:{...guard};state.recover.yaw=Math.atan2(Math.sin(state.recover.yaw),Math.cos(state.recover.yaw));}
    blend(out,state?.recover||guard,idle.pose,ease((t-p.actionStarted)/Math.max(.001,p.actionUntil-p.actionStarted)));out.active=true;out.skillMotion=true;
   }
   else if(idle.weight>0){Object.assign(out,idle.pose);out.active=true;out.combatIdle=!['run','guardWalk','dash'].includes(p.action);}
   if(state){if(p.action!=='recover'){state.carry=null;state.recover=null;}state.lastPose={...out};state.stage=p.action;}
   return out;
  }
  out.active=true;out.skillMotion=true;out.motionClock=c;
  const load=keypose(c,0,c.index);
  if(c.stage==='charge'){
   if(state&&state.stage!=='charge'){
    state.carry=state.lastPose?{...state.lastPose}:null;
    if(state.carry)state.carry.yaw=Math.atan2(Math.sin(state.carry.yaw),Math.cos(state.carry.yaw));
   }
   blend(out,state?.carry||(p.autoFight||p.combo?.total>1?guard:{}),load,ease(c.u));
  }
  else{
   const v=c.beat,hit=keypose(c,1,c.index),follow=keypose(c,2,c.index);
   // Leave an economical ready position in the direction of the last cut.
   // The renderer carries this into the next charge or the real recovery state.
   const next=c.index+1<c.hits?keypose(c,0,c.index+1):blend({},follow,guard,p.combo?.55:.78);
   if(['spin','eclipse'].includes(c.shape)&&c.index+1===c.hits)next.yaw=c.hits*TAU;
   const base=family(c.shape),heavy=base==='slam',spin=base==='spin',phase=skillPhase(c.sk);
   const start=c.index>0?0:heavy?.17+phase*.015:base==='thrust'?.055:base==='cast'?.12:.09;
   const end=heavy?.73:base==='thrust'?.57:.65;
   for(const k of keys){
    // Pelvis initiates, chest follows, the hand arrives last at the fixed hit.
    const lead=['yaw','weightX','weightZ'].includes(k)?.07:k==='torsoYaw'?.035:0;
    out[k]=curve(load[k],hit[k],follow[k],next[k],v,Math.max(0,start-lead),end);
   }
   if(spin){out.yaw=(c.index+ease(v))*TAU;out.footTurn=out.yaw;}
   if(c.shape==='leap'&&c.sk.presentation!=='stormleap'){
    // Jump and landing fit BEFORE contact, followed by grounded compression.
    const jump=v<.12?0:v<.43?Math.sin(Math.PI*(v-.12)/.31):0;
    out.y+=Math.max(0,jump)*.40;out.air=jump>.05;
   }
  }
  if(c.sk.presentation==='stormleap'){
   // Lift during the actual approach; settle before the fixed contact beat.
   const u=c.stage==='charge'?clamp((c.u-.15)/.85,0,1)*.58:.58+clamp(c.beat/.43,0,1)*.42;
   const lift=Math.sin(Math.PI*u)*.58;out.y+=lift;out.air=lift>.045;
  }
  out.head=-out.torso*.35;
  const aim=state?.aim??0;out.headYaw=-.65*Math.sin(out.yaw+out.torsoYaw-aim);
  if(c.stage==='charge'&&state?.carry)out.headYaw=(state.carry.headYaw||0)+(out.headYaw-(state.carry.headYaw||0))*ease(c.u*1.8);
  if(twoHanded(p)&&!['kick','cast','roar','backflip','bow'].includes(c.shape))out.grip=c.stage==='charge'?(state?.carry?.grip||0)*(1-ease(c.u))+ease(c.u):1;
  if(state){state.lastPose={...out};state.stage=c.stage;state.recover=null;}
  return out;
 }
 // History belongs to a renderer, never to a player/save or a global ID cache.
 function stateFor(r,p,t){
  r.skillMotionStates??=new Map();let s=r.skillMotionStates.get(p.id);
  if(!s||s.room!==p.room||t<s.t||t-s.t>.35||Math.hypot(p.x-s.x,p.z-s.z)>1.5){s={room:p.room};r.skillMotionStates.set(p.id,s);}
  Object.assign(s,{t,x:p.x,z:p.z});
  if(incapacitated(p)||p.traversal||p.rescueTarget||p.action==='land'||p.standUpUntil>t){s.lastPose=null;s.carry=null;s.recover=null;s.stage=p.action;}
  if(r.skillMotionStates.size>48)for(const [id,old]of r.skillMotionStates)if(t-old.t>2)r.skillMotionStates.delete(id);
  if(p.pendingSkill&&s.stage!=='charge'){
   const target=r.currentSnapshot?.actors?.find(a=>a.id===p.autoFight&&a.alive);
   s.aim=target?clamp(Math.atan2(Math.sin(Math.atan2(target.x-p.x,target.z-p.z)-(p.dir||0)),Math.cos(Math.atan2(target.x-p.x,target.z-p.z)-(p.dir||0))),-.5,.5):0;
  }
  return s;
 }
 function unarmed(p){return !!(p.pendingSkill||['charge','attack','recover'].includes(p.action))&&!!skillById(p.pendingSkill?.id??p.attackSkill??p.currentSkill)?.unarmed;}
 function twoHanded(p){return !unarmed(p)&&[2,3,4].includes(p.weapon)&&!p.shield&&p.wounds?.rightArm?.severity!=='lost'&&p.wounds?.leftArm?.severity!=='lost';}
 // Analytic two-arm grip. Both rigs pass their actual joint matrices, so the
 // solve respects their limb lengths instead of stretching to an adult target.
 function grip(p,pose,right,left,equipmentY=-.035){
  const weight=pose.grip||0;if(weight<=0||!twoHanded(p))return null;
  const pos=m=>[m[12],m[13],m[14]],sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,n)=>a.map(v=>v*n),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),norm=a=>mul(a,1/(Math.hypot(...a)||1)),lerp=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const R=pos(right.hand),L=pos(left.hand),A=pos(right.arm),LH=pos(left.arm);
  const handle=rMultiply(right.hand,rMultiply(rModel(0,equipmentY,.03,1,1,1,0,-.06,Math.PI-.12),rModel(0,-.20*.84,0)));
  const offset=sub(pos(handle),R),B=sub(LH,offset),ab=sub(B,A),distance=Math.hypot(...ab),axis=norm(ab),center=mul(add(A,B),.5);
  const length=c=>Math.hypot(...sub(pos(c.elbow),pos(c.arm)))+Math.hypot(...sub(pos(c.hand),pos(c.elbow)));
  const ra=length(right)*.985,rb=length(left)*.985,half=distance*.5;
  const lo=Math.max(-ra-half,half-rb),hi=Math.min(ra-half,half+rb);if(lo>hi)return null;
  const relative=sub(R,center),along=clamp(dot(relative,axis),lo,hi),radial=sub(relative,mul(axis,dot(relative,axis)));
  const radius=Math.sqrt(Math.max(0,Math.min(ra*ra-(along+half)**2,rb*rb-(along-half)**2)));
  const target=add(add(center,mul(axis,along)),mul(radial,Math.min(1,radius/(Math.hypot(...radial)||1))));
  // Rotate a joint's existing basis onto a new segment, preserving its twist,
  // scale and the equipment's authored orientation.
  function orient(m,origin,from,to){
   const a=norm(from),b=norm(to),d=clamp(dot(a,b),-1,1);let q=cross(a,b),w=1+d;
   if(w<1e-7){q=norm(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,0,1]));w=0;}
   const len=Math.hypot(...q,w)||1;q=mul(q,1/len);w/=len;const out=[...m];
   for(let i=0;i<3;i++){const v=m.slice(i*4,i*4+3),uv=mul(cross(q,v),2),rot=add(v,add(mul(uv,w),cross(q,uv)));out.splice(i*4,3,...rot);}
   out.splice(12,3,...origin);return out;
  }
  function solve(c,to){
   const H=pos(c.arm),E=pos(c.elbow),F=pos(c.hand),upper=sub(E,H),lower=sub(F,E),a=Math.hypot(...upper),b=Math.hypot(...lower),D=norm(sub(to,H)),d=clamp(Math.hypot(...sub(to,H)),Math.abs(a-b)+.0001,a+b-.0001);
   const x=(a*a-b*b+d*d)/(2*d),h=Math.sqrt(Math.max(0,a*a-x*x));let pole=sub(upper,mul(D,dot(upper,D)));
   if(Math.hypot(...pole)<1e-5){pole=sub([c.arm[8],c.arm[9],c.arm[10]],mul(D,dot([c.arm[8],c.arm[9],c.arm[10]],D)));}
   const K=add(H,add(mul(D,x),mul(norm(pole),h))),end=add(H,mul(D,d)),hand=[...c.hand];hand.splice(12,3,...end);
   return {arm:orient(c.arm,H,upper,sub(K,H)),elbow:orient(c.elbow,K,lower,sub(end,K)),hand};
  }
  const r=solve(right,lerp(R,target,weight)),l=solve(left,lerp(L,add(target,offset),weight));
  // The supporting palm wraps the same shaft. Orthonormalize the blended
  // basis before skinning rather than introducing scale with a matrix lerp.
  const y=norm(lerp(left.hand.slice(4,7),right.hand.slice(4,7),weight)),hint=lerp(left.hand.slice(8,11),right.hand.slice(8,11),weight),x=norm(cross(y,hint)),z=cross(x,y);
  for(const [i,v]of [x,y,z].entries())l.hand.splice(i*4,3,...mul(v,Math.hypot(...left.hand.slice(i*4,i*4+3))));
  return {right:r,left:l,target:add(target,offset),error:Math.hypot(...sub(pos(l.hand),add(pos(r.hand),offset)))};
 }
 // Shared world-space foot placement for both character renderers. A support
 // anchor never lerps along the floor. Displacement comes from the snapshot,
 // including collision-clipped lunges, and is resolved as a lifted step.
 function foot(p,pose,t,side,state,scale=1){
  const c=pose.motionClock,dir=p.dir||0,cs=Math.cos(dir),sn=Math.sin(dir);
  const world=(x,z)=>[p.x+(cs*x+sn*z)*scale,p.z+(-sn*x+cs*z)*scale];
  let f=state[side===1?0:1],desired=world(side*(pose.footSpread||.24),side*(pose.footLead??.13));
  if(!f||t<f.t||t-f.t>.35||Math.hypot(f.rootX-p.x,f.rootZ-p.z)>1.5){f=state[side===1?0:1]={anchor:world(side*.21,0),t,rootX:p.x,rootZ:p.z,yaw:dir,lift:0};}
  const dt=p.hitstopUntil>t?0:clamp(t-f.t,0,.1),turn=Math.atan2(Math.sin(dir-f.yaw),Math.cos(dir-f.yaw));
  const distance=Math.hypot(desired[0]-f.anchor[0],desired[1]-f.anchor[1]);
  const stepping=p.attackStep&&p.attackStep.moved>0&&c?.stage==='charge';
  if(c)f.damageSettled=false;
  if(!f.step&&(distance>(f.damageSettled?.23:.10)*scale||Math.abs(turn)>.3)&&(!c||c.stage==='charge'||c.beat>.65||stepping)){
   const other=state[side===1?1:0];if(!other?.step||distance>.55*scale)f.step={from:[...f.anchor],to:desired,u:0,yaw:f.yaw,turn};
  }
  f.lift=0;
  if(f.step){const s=f.step;s.u=Math.min(1,s.u+dt/(stepping?.10:.18));
   if(stepping)s.to=desired;
   const u=ease(s.u);f.anchor=s.from.map((v,i)=>v+(s.to[i]-v)*u);f.lift=Math.sin(Math.PI*s.u)*.12*scale;f.yaw=s.yaw+s.turn*u;
   if(s.u===1)f.step=null;
  }
  // Only the kicking foot leaves the floor; the supporting leg keeps IK.
  let lift=f.lift,ankle=[...f.anchor],swing=!!f.step;
  if(c?.stage==='attack'&&c.shape==='kick'&&side===1){
   const v=c.beat,chamber=v<.43?ease((v-.04)/.18):1-ease((v-.62)/.30);
   const extension=v<.43?ease((v-.25)/.18):1-ease((v-.49)/.20);
   if(chamber>0){const kick=world(.16,.24+.62*extension);ankle=ankle.map((x,i)=>x+(kick[i]-x)*chamber);lift+=(.42+.12*extension)*chamber*scale;swing=true;}
  }
  if(pose.air){lift+=Math.max(0,pose.y)*scale;swing=true;}
  if(c?.stage==='attack'&&['spin','eclipse'].includes(c.shape)){
   // Alternating lifted reposition and a support-foot pivot, with both soles
   // down at .43. The fixed support anchor does not orbit around the root.
   const v=c.beat,u=side===1?clamp(v/.43,0,1):clamp((v-.54)/.46,0,1),arc=Math.sin(Math.PI*u);
   if(arc>1e-6){lift+=arc*.13*scale;const offset=world(side*(pose.footSpread||.24),side*(pose.footLead??.13)+arc*.13);ankle=ankle.map((x,i)=>x+(offset[i]-desired[i]));swing=true;}
   f.yaw=dir+(pose.footTurn||0);
  }
  // A movement/turn interrupt cannot leave an unreachable fixed foot behind.
  if(distance>.55*scale){ankle=desired.map((v,i)=>v+(ankle[i]-v)*.55*scale/distance);lift=Math.max(lift,.055*scale);swing=true;f.anchor=[...ankle];}
  Object.assign(f,{t,rootX:p.x,rootZ:p.z});return {anchor:ankle,lift,yaw:f.yaw,swing};
 }
 function groundAt(r,x,z){
  let y=r.sceneKey?.startsWith('village')?.10+.007*Math.sin(x*.8)*Math.cos(z*.7):.10;
  if(r.motionGroundKey!==r.sceneKey||!r.motionGroundCells){
   r.motionGroundKey=r.sceneKey;r.motionGroundCells=new Map();
   for(const [type,rows]of r.static||[]){if(!['rbox','box','softbox','golden:stone'].includes(type))continue;
    for(const m of rows){const sx=Math.hypot(m[0],m[2]),sz=Math.hypot(m[8],m[10]),sy=Math.abs(m[5]);
     if(m[13]<.06||m[13]>.32||sy>.26||sx>8||sz>8)continue;
     const radius=(sx+sz)*.5;
     for(let ix=Math.floor(m[12]-radius);ix<=Math.floor(m[12]+radius);ix++)for(let iz=Math.floor(m[14]-radius);iz<=Math.floor(m[14]+radius);iz++){
      const key=ix+','+iz;if(!r.motionGroundCells.has(key))r.motionGroundCells.set(key,[]);r.motionGroundCells.get(key).push(m);
     }
    }
   }
  }
  for(const m of r.motionGroundCells.get(Math.floor(x)+','+Math.floor(z))||[]){const det=m[0]*m[10]-m[8]*m[2];if(Math.abs(det)<1e-8)continue;
   const dx=x-m[12],dz=z-m[14],u=(dx*m[10]-dz*m[8])/det,v=(dz*m[0]-dx*m[2])/det,edge=Math.max(Math.abs(u),Math.abs(v));
   if(edge<.50)y=Math.max(y,m[13]+Math.abs(m[5])*.5-.014*(1-ease((.50-edge)/.09)));
  }return Math.max(y,supportHeight(r.traversalMap,x,z));
 }
 return {sample,clock,shape,foot,groundAt,stateFor,ready,unarmed,twoHanded,grip};
})();

// Collision stays with the rescuer; the body lies across the supporting arms.
function carriedVisualPose(p){if(p.lifeState!=='carried')return p;const d=p.dir||0;return {...p,x:p.x-Math.cos(d)*1.05+Math.sin(d)*.48,z:p.z+Math.sin(d)*1.05+Math.cos(d)*.48,dir:d+Math.PI/2};}
/* Lifestyle poses are kept separate from the combat keys. */
function artPose(p,t,state){
 const o={active:false,y:0,x:0,z:0,yaw:0,pitch:0,roll:0,torso:0,head:0,rightArm:0,leftArm:0,rightArmZ:0,leftArmZ:0,rightLeg:0,leftLeg:0,rightKnee:0,leftKnee:0};
 if(p.alive===false)return o;
 if(p.traversal){const u=p.traversal.progress||0,lift=Math.sin(Math.PI*u);return {...o,active:true,pitch:.30*lift,rightArm:-1.35*lift,leftArm:-.9*lift,rightLeg:-1.25*lift,leftLeg:-.72*lift,rightKnee:1.9*lift,leftKnee:1.5*lift,head:-.08};}
 if(p.action==='land'&&p.actionUntil>t){const u=clamp((t-p.actionStarted)/.16,0,1),bend=Math.sin(Math.PI*u);return {...o,active:true,y:-.1*bend,rightLeg:-.25*bend,leftLeg:-.25*bend,rightKnee:.5*bend,leftKnee:.5*bend};}
 if(incapacitated(p)){
  const u=clamp((t-(p.downedAt??t))/.7,0,1),settle=u*u*(3-2*u),carried=p.lifeState==='carried';
  return {...o,active:true,pitch:carried?1.35:1.48*settle,y:carried?0:-.03,head:.12+Math.sin(t*1.8)*.018,rightArm:-.35,leftArm:-.5,rightLeg:-.12,leftLeg:.15,rightKnee:.25,leftKnee:.2};
 }
 if(p.standUpUntil>t){const u=clamp((t-p.standUpAt)/.8,0,1),rise=u*u*(3-2*u);return {...o,active:true,pitch:1.48*(1-rise),rightArm:-.7*(1-rise),leftArm:-.8*(1-rise),rightKnee:.7*Math.sin(Math.PI*u),leftKnee:.5*Math.sin(Math.PI*u)};}
 if(p.rescueTarget)return {...o,active:true,pitch:.08,rightArm:-1.1,leftArm:-1.1,rightElbow:-.1,leftElbow:-.1,rightArmZ:-.2,leftArmZ:.2};
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
 return SkillMotion.sample(p,t,o,state);
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

function parentWorldPose(p,t){
 if(!p?.alive||(!p.prologue&&t>p.introUntil+5))return null;
 t=p.renderPoseTime??t;
 if(p.prologue)return {x:p.x,z:p.z,dir:p.dir,age:34,race:p.race,alive:true};
 const age=t-(p.releaseAt||0),u=clamp((age-5)/5,0,1),ix=p.introX??p.x,iz=p.introZ??p.z,hx=p.introHomeX??ix-2.8,hz=p.introHomeZ??iz;
 return {x:ix+(hx-ix)*u,z:iz+(hz-iz)*u,dir:age>5?Math.atan2(hx-ix,hz-iz):(p.introDir??p.dir??0),age:34,race:p.race,alive:true};
}
