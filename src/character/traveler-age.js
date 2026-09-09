/* Visual age only. Existing age/ageFraction, release and lifespan remain owned
 * by the simulation. One rest mesh, two LODs, no per-age mesh allocation. */
const TravelerAge=(()=>{
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 // age, leg length, torso length, body width/depth, head width/height/depth
 // Landmarks follow appearanceStage (4/10/18/35/55/72), not new game rules.
 const keys=[
  [0,.34,.43,.48,.52,.59,.56,.60],
  [4,.52,.64,.67,.71,.76,.72,.76],
  [10,.76,.84,.85,.87,.88,.86,.89],
  [18,1,1,1,1,1,1,1],
  [35,1,1,1,1,1,1,1],
  [55,1,1,1.055,1.065,1,.995,1],
  [72,.985,.98,1.045,1.055,.985,.99,1],
  [100,.975,.96,1.02,1.04,.97,.985,.99]
 ];
 function sample(p,t=0){
  const age=Math.max(0,Number.isFinite(p.age)?p.age:24),fraction=Number.isFinite(p.ageFraction)?Math.max(0,Math.min(1,p.ageFraction)):0;
  // During the existing cradle sequence the child fits the parent's arms.
  // The existing lowering clock blends into the age-4 standing proportions.
  const lower=p.prologue?ease((t-((p.releaseAt??t+30)-1.45))/1.45):1;
  const visual=p.prologue?Math.min(1,Math.max(0,(t-(p.born??t))/27))*(1-lower)+4*lower:age+fraction;
  let k=0;while(k<keys.length-2&&visual>keys[k+1][0])k++;
  const a=keys[k],b=keys[k+1],u=ease((visual-a[0])/(b[0]-a[0])),v=a.slice(1).map((x,i)=>x+(b[i+1]-x)*u);
  const old=ease((visual-55)/35),seed=p.appearanceSeed||4;
  const gray=ease((visual-(seed%3===0?60:48))/(seed%3===0?30:32));
  return {age:age+fraction,visual,lower,body:v.slice(0,4),head:v.slice(4),gray,old,
   beard:ease((visual-14)/4),posture:.055*old,young:1-ease(visual/18)};
 }
 function landmarks(asset){return [.47*asset.body[1]*asset.scale,1.01*asset.body[1]*asset.scale];}
 function beardOrigin(asset){const c=TravelerModel.definitions[asset.race];return [0,(1.01*c.body[1]+.35*.8*c.head[1])*asset.scale,(.42*1.05-.018)*c.head[2]*asset.scale];}
 function point(pos,head,profile,asset,beard=false){
  let [x,y,z]=pos;const [leg,torso,width,depth]=profile.body,[hx,hy,hz]=profile.head,[hip,neck]=landmarks(asset);
  if(beard){const o=beardOrigin(asset);x=o[0]+(x-o[0])*profile.beard;y=o[1]+(y-o[1])*profile.beard;z=o[2]+(z-o[2])*profile.beard;}
  const y0=Math.min(y,hip)*leg+Math.max(0,y-hip)*torso;
  return head?[x*hx,hip*leg+(neck-hip)*torso+(y-neck)*hy,z*hz]:[x*width,y0,z*depth];
 }
 // Keep CPU joint/hull mapping and GPU rest-position mapping identical.
 const glsl=`
 uniform vec4 cmAgeBody;uniform vec3 cmAgeHead;uniform vec2 cmAgeLandmarks;
 uniform vec4 cmAgeBeard;
 vec3 agePosition(vec3 p,bool head,bool beard){
  if(beard)p=mix(cmAgeBeard.xyz,p,cmAgeBeard.w);
  float hip=cmAgeLandmarks.x,neck=cmAgeLandmarks.y;
  if(head)return vec3(p.x*cmAgeHead.x,hip*cmAgeBody.x+(neck-hip)*cmAgeBody.y+(p.y-neck)*cmAgeHead.y,p.z*cmAgeHead.z);
  return vec3(p.x*cmAgeBody.z,min(p.y,hip)*cmAgeBody.x+max(0.,p.y-hip)*cmAgeBody.y,p.z*cmAgeBody.w);
 }
 vec3 ageNormal(vec3 n,vec3 p,bool head){
  vec3 scale=head?cmAgeHead:vec3(cmAgeBody.z,p.y<cmAgeLandmarks.x?cmAgeBody.x:cmAgeBody.y,cmAgeBody.w);
  return normalize(n/scale);
 }`;
 return {sample,point,landmarks,beardOrigin,glsl};
})();
