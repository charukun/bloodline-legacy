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

/* Presentation only: the existing Simulation owns charge, each .43 contact,
 * travel, hitstop and recovery. No animation state is written into a player.
 * Angles are radians; foot/weight offsets are in adult model units. */
const SkillMotion=(()=>{
 const ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
 const guard={y:-.045,pitch:.025,yaw:0,torso:0,torsoYaw:0,head:0,
  rightArm:-.80,leftArm:-.92,rightArmZ:-.18,leftArmZ:.20,
  rightElbow:-.65,leftElbow:-.7,rightWrist:0,leftWrist:0,
  rightLeg:0,leftLeg:0,rightKnee:0,leftKnee:0,weightX:0,weightZ:0};
 const keys=Object.keys(guard);
 // Family accents: forge weight, careful precision, play, tracking, study,
 // patience, bell, feather, stone, charcoal, sparring, woodland, knotwork.
 const accents=[ [.05,.08,.05],[0,-.08,-.03],[-.02,-.06,.08],
  [.07,-.10,-.04],[.02,0,-.02],[-.035,.12,-.08],[0,-.12,.02],
  [-.04,-.08,.12],[.10,.10,-.06],[.12,.14,.04],[.03,-.04,.03],
  [-.02,.04,.10],[.06,.07,-.04] ];
 const profiles={
  slash:[{yaw:-.24,torsoYaw:-.40,rightArm:-1.20,rightArmZ:-.85,rightElbow:-.85,weightZ:-.07},
   {yaw:.12,torsoYaw:.34,pitch:.09,rightArm:-1.3,rightArmZ:.30,rightElbow:-.18,rightWrist:.14,weightZ:.10},
   {yaw:.22,torsoYaw:.50,rightArm:-.75,rightArmZ:.80,rightElbow:-.35,rightWrist:.22,pitch:.12}],
  thrust:[{yaw:.18,torsoYaw:.24,rightArm:-.65,rightElbow:-1.20,weightZ:-.10},
   {yaw:-.12,torsoYaw:-.23,rightArm:-1.50,rightElbow:-.06,pitch:.08,weightZ:.14},
   {yaw:-.17,torsoYaw:-.30,rightArm:-1.57,rightElbow:-.12,pitch:.11,weightZ:.16}],
  slam:[{y:-.10,rightArm:-2.35,leftArm:-1.25,rightElbow:-1.05,torso:-.10,weightZ:-.10},
   {y:-.14,rightArm:-.92,leftArm:-.7,rightElbow:-.18,torso:.23,pitch:.07,weightZ:.12},
   {y:-.19,rightArm:-.40,leftArm:-.65,rightElbow:-.30,torso:.29,pitch:.09,weightZ:.14}],
  kick:[{y:-.06,rightArm:-1,leftArm:-1.15,weightX:-.10,weightZ:-.05},
   {y:-.09,pitch:-.07,torso:-.09,rightArm:-.6,leftArm:-1.1,weightX:-.14,weightZ:-.03},
   {y:-.06,pitch:-.08,rightArm:-.5,leftArm:-1,weightX:-.14}],
  counter:[{y:-.09,torsoYaw:.20,leftArm:-1.2,leftElbow:-1.05,rightArm:-1.05,weightZ:-.06},
   {y:-.08,torsoYaw:-.18,leftArm:-1.52,leftElbow:-.10,rightArm:-1.05,weightZ:.08},
   {y:-.07,torsoYaw:-.24,leftArm:-1.58,leftElbow:-.2,weightZ:.10}],
  cast:[{y:-.09,torso:-.06,rightArm:-1.1,leftArm:-1.1,rightArmZ:-.4,leftArmZ:.4,rightElbow:-1,leftElbow:-1},
   {y:-.04,torso:.06,rightArm:-1.58,leftArm:-1.58,rightArmZ:-.35,leftArmZ:.35,rightElbow:-.10,leftElbow:-.10,weightZ:.06},
   {y:-.04,rightArm:-1.5,leftArm:-1.5,rightArmZ:-.55,leftArmZ:.55,rightElbow:-.20,leftElbow:-.20}],
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
  const index=Math.min(hits-1,Math.floor(u*hits));return {sk,shape:shape(sk),stage:'attack',u,beat:Math.min(1,u*hits-index),index,hits,duration:duration/hits};
 }
 // Every beat has a wind-up, contact, overshoot and return. The end of an
 // internal beat IS the next wind-up; there is no modulo snap at a hit boundary.
 function keypose(c,kind,index){
  const a=c.shape,base=['double','cross','spin','eclipse'].includes(a)?'slash':['dash','zigzag','slide'].includes(a)?'thrust':['leap','judgement'].includes(a)?'slam':a==='roar'?'cast':a;
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
  if(a==='leap'&&kind===0)pose.y=-.12;
  if(a==='spin'||a==='eclipse'){
   pose.yaw=(index+(kind===0?0:kind===1?.43:.62))*TAU;
   pose.torsoYaw=kind===0?-.25:kind===1?.12:.22;
   pose.rightArmZ=kind===0?-.65:-1.1;pose.rightArm=-1.15;pose.leftArm=-1.0;
  }
  if(c.sk.requires?.includes('leftArm')&&c.sk.requires?.includes('rightArm')&&base==='slam'){
   pose.leftArm=pose.rightArm+.08;pose.leftElbow=pose.rightElbow;pose.rightArmZ=.1;pose.leftArmZ=-.1;
  }
  if(c.sk.id===4101){pose.leftArm=pose.rightArm;pose.leftElbow=pose.rightElbow;pose.leftArmZ=.18;pose.rightArmZ=-.18;}
  return pose;
 }
 function blend(out,a,b,u){for(const k of keys)out[k]=(a[k]??0)+((b[k]??0)-(a[k]??0))*u;return out;}
 function sample(p,t,out){
  const c=clock(p,t);let settled=p.autoFight||p.guard||p.guardUntil>t;
  if(!c){
   if(p.action==='recover'&&p.actionUntil>t){blend(out,guard,settled?guard:{},ease((t-p.actionStarted)/Math.max(.001,p.actionUntil-p.actionStarted)));out.active=true;}
   else if(settled){Object.assign(out,guard);out.active=true;}
   return out;
  }
  out.active=true;out.skillMotion=true;out.motionClock=c;
  const load=keypose(c,0,c.index);
  if(c.stage==='charge')blend(out,p.autoFight||p.combo?.total>1?guard:{},load,ease(c.u));
  else{
   const v=c.beat,hit=keypose(c,1,c.index),follow=keypose(c,2,c.index);
   const next=c.index+1<c.hits?keypose(c,0,c.index+1):{...guard};
   if(['spin','eclipse'].includes(c.shape)&&c.index+1===c.hits)next.yaw=c.hits*TAU;
   const from=v<.43?load:v<.62?hit:follow,to=v<.43?hit:v<.62?follow:next;
   const start=v<.43?.23:v<.62?.43:.62,end=v<.43?.43:v<.62?.62:1;
   blend(out,from,to,ease((v-start)/(end-start)));
   // Hips begin first. Arm extension still reaches the exact contact key.
   if(v<.43){const lead=ease((v-.12)/.31);out.yaw=load.yaw+(hit.yaw-load.yaw)*lead;out.weightZ=load.weightZ+(hit.weightZ-load.weightZ)*lead;}
   if(c.shape==='leap'){
    // Jump and landing fit BEFORE contact, followed by grounded compression.
    const jump=v<.12?0:v<.43?Math.sin(Math.PI*(v-.12)/.31):0;
    out.y+=Math.max(0,jump)*.40;out.air=jump>.05;
   }
  }
  out.head=-out.torso*.35;return out;
 }
 // Shared world-space foot placement for both character renderers. A support
 // anchor never lerps along the floor. Displacement comes from the snapshot,
 // including collision-clipped lunges, and is resolved as a lifted step.
 function foot(p,pose,t,side,state,scale=1){
  const c=pose.motionClock,dir=p.dir||0,cs=Math.cos(dir),sn=Math.sin(dir);
  const world=(x,z)=>[p.x+(cs*x+sn*z)*scale,p.z+(-sn*x+cs*z)*scale];
  let f=state[side===1?0:1],desired=world(side*.24,side*.16);
  if(!f||t<f.t||t-f.t>.35||Math.hypot(f.rootX-p.x,f.rootZ-p.z)>1.5){f=state[side===1?0:1]={anchor:world(side*.21,0),t,rootX:p.x,rootZ:p.z,yaw:dir,lift:0};}
  const dt=p.hitstopUntil>t?0:clamp(t-f.t,0,.1),turn=Math.atan2(Math.sin(dir-f.yaw),Math.cos(dir-f.yaw));
  const distance=Math.hypot(desired[0]-f.anchor[0],desired[1]-f.anchor[1]);
  const stepping=p.attackStep&&p.attackStep.moved>0&&c?.stage==='charge';
  if(!f.step&&(distance>.10*scale||Math.abs(turn)>.3)&&(!c||c.stage==='charge'||c.beat>.65||stepping)){
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
   const v=c.beat,u=v<.43?ease((v-.13)/.30):1-ease((v-.54)/.34);
   if(u>0){const kick=world(.18,.72);ankle=ankle.map((x,i)=>x+(kick[i]-x)*u);lift+=.48*u*scale;swing=true;}
  }
  if(pose.air){lift+=Math.max(0,pose.y)*scale;swing=true;}
  if(c?.stage==='attack'&&['spin','eclipse'].includes(c.shape))f.yaw=dir+pose.yaw;
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
  }return y;
 }
 return {sample,clock,shape,foot,groundAt};
})();

/* Lifestyle poses are kept separate from the combat keys. */
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
 return SkillMotion.sample(p,t,o);
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
