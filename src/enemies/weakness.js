/* Readable enemy fatigue and adaptive locomotion. Constant-size analytic poses;
 * no physics simulation, textures, geometry allocation or serialized state. */
const EnemyWeakness=(()=>{
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 function sample(p,t,phase=0){
  const c=enemyCondition(p),time=p.renderPoseTime??t,run=p.action==='run',dead=p.alive===false;
  const seed=String(p.id||'').split('').reduce((n,c)=>n+c.charCodeAt(0),0)%17;
  const breath=Math.sin(time*3.1+seed*.31),step=Math.sin(phase),sway=Math.sin(phase*.5);
  const attack=p.telegraph?smooth((time-p.telegraph.started)/Math.max(.001,p.telegraph.at-p.telegraph.started)):p.action==='attack'?1-smooth((time-p.actionStarted)/.75):0;
  const settle=p.action==='attack'&&time-p.actionStarted>=.75?Math.sin(Math.PI*clamp((time-p.actionStarted-.75)/Math.max(.01,p.actionUntil-p.actionStarted-.75),0,1)):0;
  const side=c.rightLeg?-1:c.leftLeg?1:c.rightArm?-1:c.leftArm?1:0;
  const limp=(c.legs===1||c.family==='beast'&&c.arms===1)?1:0;
  const weary=c.fatigue*(1-attack*.55),fall=dead?smooth((time-(p.deathAt??time))/1.1):0;
  return {...c,time,run,dead,phase,step,attack,settle,side,limp,fall,
   bend:weary*(.24+breath*.045)+settle*.14,drop:weary*(.055+breath*.016)+limp*(.04+(run?Math.max(0,step)*.06:0)),
   roll:side*(limp?.11:c.arms===1?.08:0)+(run?sway*(c.fatigue*.07+limp*.045):breath*c.fatigue*.015),
   label:c.crawl?'這いずり':c.drag?'腹ばい':limp?'引きずり':c.arms===2?'両腕喪失':c.arms?'片腕の構え':c.critical?'瀕死':c.fatigue>0?'消耗':'健康'};
 }
 function skeleton(asset,matrices,p,w){
  if(!w.enabled||(!w.fatigue&&!w.legs&&!w.arms))return;
  const ids=asset.weaknessNodes??=Object.fromEntries(asset.g.nodes.map((n,i)=>[n.name,i]));
  const rotate=(name,x=0,z=0)=>{const i=ids[name];matrices[i]=rMultiply(matrices[i],rModel(0,0,0,1,1,1,0,z,x));};
  if(w.crawl){
   // Prone pelvis and low shoulder height replace the standing run entirely.
   matrices[ids.hips]=rModel(0,.12+(w.run?Math.max(0,w.step)*.025:0),0,1,1,1,0,w.dead?w.fall*.30:w.roll*.30,1.22);
   matrices[ids.spine]=rModel(0,.192,0,1,1,1,0,0,-.10-w.attack*.18);
   matrices[ids.chest]=rModel(0,.375,0,1,1,1,0,0,-.06);
   rotate('head',-.68+w.bend*.2);
  }else if(!w.dead){
   // Fatigue comes from the upper body; an intact planted leg remains stable.
   rotate('spine',w.bend,w.roll*.35);rotate('chest',w.bend*.45,w.roll*.65);rotate('head',-w.bend*.40);
   if(w.legs===1){
    // A short, bent support step with the missing side carried low.
    const side=w.rightLeg?'l':'r',cycle=w.run?w.step:0;
    matrices[ids['upperleg.'+side]]=rMultiply(rModel((side==='r'?-.171:.171),.114,0,1,1,1),rModel(0,0,0,1,1,1,0,0,Math.PI-.34-cycle*.22));
    matrices[ids['lowerleg.'+side]]=rModel(0,.227,0,1,1,1,0,0,.58+Math.max(0,cycle)*.35);
   }
   // Lower the weapon between attacks; the contact clip stays sharp.
   if(w.attack===0)for(const side of ['r','l'])if(!w[side==='r'?'rightArm':'leftArm'])rotate('upperarm.'+side,w.fatigue*.18,(side==='r'?1:-1)*w.fatigue*.12);
  }
 }
 // Two-bone analytic support for crawling: bounded solve in model space.
 // It moves the visible hand and its equipment socket together.
 function crawlArms(asset,world,matrices,p,w){
  if(!w.crawl)return;
  const ids=asset.weaknessNodes;
  const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),unit=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const aim=(at,to)=>{const y=unit(sub(to,at)),x=unit(cross(y,[0,0,1])),z=cross(x,y);return new Float32Array([...x,0,...y,0,...z,0,...at,1]);};
  for(const side of ['r','l']){
   const right=side==='r',part=right?'rightArm':'leftArm';if(w[part])continue;
   const attacking=right||w.rightArm;
   if(attacking&&w.attack>.05&&!w.dead)continue;
   const upper=ids['upperarm.'+side],lower=ids['lowerarm.'+side],wrist=ids['wrist.'+side],hand=ids['hand.'+side],socket=ids['handslot.'+side];
   const s=right?-1:1,phase=w.phase+(right?0:Math.PI),reach=w.run&&!w.dead?Math.sin(phase):0;
   const start=Array.from(world[upper].subarray(12,15)),target=[s*.30,.085+Math.max(0,reach)*.11,.73+Math.cos(phase)*(w.run?.13:0)];
   const dir=unit(sub(target,start)),d=Math.min(.575,Math.max(.06,Math.hypot(...sub(target,start)))),a=.242,b=.334;
   const along=(d*d+a*a-b*b)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
   const pole=[s,0,-.15],bend=unit(pole.map((v,i)=>v-dir[i]*dot(pole,dir)));
   const elbow=start.map((v,i)=>v+dir[i]*along+bend[i]*height),end=start.map((v,i)=>v+dir[i]*d),fore=unit(sub(end,elbow));
   world[upper]=aim(start,elbow);world[lower]=aim(elbow,end);
   world[wrist]=aim(elbow.map((v,i)=>v+fore[i]*.260),end);
   world[hand]=aim(end,[end[0],end[1]-.015,end[2]+.12]);world[socket]=rMultiply(world[hand],matrices[socket]);
  }
 }
 function root(w,scale=1,skinned=false){
  if(w.crawl)return {y:0,pitch:skinned?0:1.05,roll:0};
  if(w.dead)return {y:0,pitch:0,roll:0};
  if(w.family==='beast')return {y:-(w.drag?.28:w.drop)*scale,pitch:w.drag?(w.legs===2?-.35:.35):w.bend*.30,roll:w.roll};
  if(w.family==='spirit')return {y:-w.fatigue*.42*scale,pitch:w.bend*.5,roll:w.roll+Math.sin(w.time*2)*w.fatigue*.07};
  return {y:-w.drop*scale,pitch:0,roll:w.roll*.4};
 }
 return {sample,skeleton,crawlArms,root};
})();
