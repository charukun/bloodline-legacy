/* Traveler-only presentation. No simulation writes, texture swaps or extra bones.
 * Rest-space face deformation runs before skinning (and before age deformation).
 * Injury overlays yield to attack/contact, traversal, rescue and incapacitation. */
const TravelerExpression=(()=>{
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const severity=w=>w?.severity==='heavy'?1:w?.severity==='light'?.35:0;
 const active=(p,k,t)=>p.statuses?.[k]?.until>t;
 const parts=['head','torso','rightArm','leftArm','rightLeg','leftLeg'];
 function target(p,t){
  const wounds=parts.map(k=>severity(p.wounds?.[k])),pain=Math.max(...wounds),sleep=active(p,'sleep',t)||p.action==='sleep',down=p.alive===false||['downed','carried','recovering'].includes(p.lifeState);
  const hit=p.hitReactUntil>t,ill=['poison','weak','burn','bleed'].some(k=>active(p,k,t));
  const combat=!!(p.pendingSkill||p.action==='attack'||p.autoFight||p.guard||p.guardUntil>t),talk=!!(p.speech&&p.speechUntil>t);
  let name='calm',face=[1,0,1,0];
  if(down||sleep){name=down?'downed':'sleep';face=[.055,.12,.1,0];}
  else if(hit){name='pain';face=[.22,.26,-.65,.25];}
  else if(pain||ill){name='hurt';face=[1-.48*Math.max(pain,.45),.20*Math.max(pain,.45),-.40,.02];}
  else if(combat){name='focused';face=[.82,-.18,.05,0];}
  else if(talk){name='talk';face=[.90,.04,1.15,.15+.45*Math.pow(Math.sin(t*9),2)];}
  else if(p.seated){name='rest';face=[.75,.07,1.1,0];}
  const protectedPose=down||sleep||p.prologue||p.traversal||p.rescueTarget||p.activity||p.standUpUntil>t||hit||p.pendingSkill||p.action==='attack'||p.action==='recover'||p.guard||p.guardUntil>t;
  return {name,face,wounds,bodyWeight:protectedPose?0:1};
 }
 function update(p,t,dt,previous){
  const goal=target(p,t),a=previous?1-Math.exp(-Math.max(0,dt)*12):1;
  const state=previous||{face:[...goal.face],wounds:[...goal.wounds],bodyWeight:goal.bodyWeight};
  for(let i=0;i<4;i++)state.face[i]+=(goal.face[i]-state.face[i])*a;
  for(let i=0;i<6;i++)state.wounds[i]+=(goal.wounds[i]-state.wounds[i])*a;
  // Action ownership must change immediately; healing/entering blends smoothly.
  state.bodyWeight=goal.bodyWeight===0?0:state.bodyWeight+(1-state.bodyWeight)*a;
  state.name=goal.name;
  const seed=((p.appearanceSeed||0)%97)*.037,period=3.6+((p.appearanceSeed||0)%7)*.23,cycle=((t+seed)%period+period)%period;
  const blink=cycle<.16?Math.abs(cycle/.08-1):1;
  state.uniform=[Math.max(.045,state.face[0]*blink),state.face[1],state.face[2],state.face[3]];
  return state;
 }
 function body(state,phase,moving){
  const w=state.wounds,k=state.bodyWeight,asym=w[5]-w[4],pulse=moving?Math.cos(phase):0;
  return {weight:k,pitch:(w[1]*.075+(w[4]+w[5])*.016)*k,roll:(asym*.035+asym*pulse*.012)*k,head:(w[0]*.12+w[1]*.03)*k,
   rightArm:w[2]*k,leftArm:w[3]*k,rightLeg:w[4]*k,leftLeg:w[5]*k};
 }
 // CPU equivalent used by geometry/normal review, never a per-frame mesh rewrite.
 function deform(p,region,face){
  const q=[...p],side=region%2===0?1:-1;
  if(region>=20&&region<=23){q[1]=1.491+(p[1]-1.491)*face[0];}
  else if(region===24||region===25){const x=p[0]-side*.168,y=p[1]-1.595,a=-side*face[1];q[0]=side*.168+Math.cos(a)*x-Math.sin(a)*y;q[1]=1.595+Math.sin(a)*x+Math.cos(a)*y;}
  else if(region===26){const curve=Math.pow(p[0]/.056,2),thick=1+face[3]*8*Math.sqrt(Math.max(0,1-curve));q[1]=1.348+.021*face[2]*curve+(p[1]-1.348-.021*curve)*thick;}
  return q;
 }
 const glsl=`uniform vec4 cmFace;uniform vec3 cmFaceScale;uniform vec3 cmFaceOffset;
 void travelerFace(inout vec3 p,inout vec3 n,float region){
  if(region<20.||region>26.)return;
  p=(p-cmFaceOffset)/cmFaceScale;n*=cmFaceScale;
  if(region<24.){p.y=1.491+(p.y-1.491)*cmFace.x;n.y/=cmFace.x;}
  else if(region<26.){float side=region==24.?1.:-1.,a=-side*cmFace.y,c=cos(a),s=sin(a);mat2 m=mat2(c,s,-s,c);p.xy=m*(p.xy-vec2(side*.168,1.595))+vec2(side*.168,1.595);n.xy=m*n.xy;}
  else{float curve=pow(p.x/.056,2.);p.y=1.348+.021*cmFace.z*curve+(p.y-1.348-.021*curve)*(1.+cmFace.w*8.*sqrt(max(0.,1.-curve)));}
  p=p*cmFaceScale+cmFaceOffset;n=normalize(n/cmFaceScale);
 }`;
 return {target,update,body,deform,glsl,parts};
})();
