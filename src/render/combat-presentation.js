/* Snapshot-only combat VFX. Strike timing, damage, hitstop and save data stay in
 * Simulation. Short tapered silhouettes emphasize the existing contact pose. */
const COMBAT_FX = Object.freeze({
 skillconnection:{life:.24,color:'#a8ddd1'},
 trailLife:.105, trailWidth:.045, trailPoints:7,
 hit:{life:.21,count:7,color:'#ecd7ab'},
 wound:{life:.34,count:9,color:'#f4b48e'},
 partbreak:{life:.30,count:10,color:'#dfae79'},
 blocked:{life:.17,count:5,color:'#bdced0'},
 guard:{life:.17,count:5,color:'#bdced0'},
 guarded:{life:.17,count:5,color:'#bdced0'},
 parry:{life:.24,count:9,color:'#d8eee8'}
});
class CombatPresentation{
 constructor(r){this.r=r;this.trails=new Map();this.castSamples=new Map();this.castSerial=0;this.room=null;this.compositionBudget=512;this.silkKeys=new Set();this.silkSlot=0;}
 castRecipe(a,skill,t){
  if(typeof SkillEffects==='undefined')return null;
  const base=SkillEffects.forSkill(skill?.id);if(!base){this.castSamples.delete(a.id);return null;}
  let entry=this.castSamples.get(a.id);const active=a.action==='attack',elapsed=t-(a.actionStarted??0);
  if(!entry||entry.id!==skill.id||(active&&(!entry.active||elapsed<entry.elapsed-1e-5))){
   entry={id:skill.id,recipe:SkillEffects.forCast(base,String(a.id)+':'+(++this.castSerial))};this.castSamples.set(a.id,entry);
  }
  entry.active=active;entry.elapsed=elapsed;return entry.recipe;
 }
 hitRecipe(e){
  if(e.type!=='hit'||typeof SkillEffects==='undefined')return null;
  const cast=this.castSamples.get(e.source);
  return e.skillRecipe??=(cast?.active&&cast.id===e.skill?cast.recipe:SkillEffects.forCast(SkillEffects.forSkill(e.skill),String(e.source??'')+':'+String(e.seq??e.born)));
 }
 contact(e,target,x,z,dir){
  const r=this.r,cm=r.characterMaster,part=e.part||'torso';
  if(cm?.owner?.id===target?.id&&cm.lastFrame===r.frame){
   const bone=({head:'head',torso:'chest',rightArm:'elbow.R',leftArm:'elbow.L',rightLeg:'shin.R',leftLeg:'shin.L'})[part];
   const names=cm.asset?.names||CM01.asset.names;
   const alias=({chest:'torso','shin.R':'knee.R','shin.L':'knee.L'})[bone];
   const index=names.includes(bone)?names.indexOf(bone):names.indexOf(alias);
   const m=cm.transforms[index];
   if(m)return [m[12]-Math.sin(dir)*.12,m[13],m[14]-Math.cos(dir)*.12];
  }
  const sentinel=r.enemySentinels?.records.get(target?.id);
  if(sentinel&&sentinel.frame===r.frame){
   const name=({head:'head',torso:'chest',rightArm:'lowerarm.r',leftArm:'lowerarm.l',rightLeg:'lowerleg.r',leftLeg:'lowerleg.l'})[part]||'chest';
   const index=EnemySentinel.asset.g.nodes.findIndex(n=>n.name===name),bone=sentinel.world[index];
   if(bone){const m=rMultiply(sentinel.root,bone),lift=part==='head'?.42:part==='torso'?-.14:0;
    return [m[12]-Math.sin(dir)*.12,m[13]+lift*sentinel.config.scale[1],m[14]-Math.cos(dir)*.12];}
  }
  const creature=r.enemyCreatures?.get(target?.id);
  if(creature&&creature.frame===r.frame&&creature.sockets[part])return [...creature.sockets[part]];
  const age=target?.age??25,race=target?.race||0;
  const scale=target?.bodyScale??(age<4?.46:age<10?.64+(age-4)*.022:age<18?.78+(age-10)*.027:1)*(race===2?.86:race===1?1.07:race===3?.95:1);
  const height=part==='head'?2.4:part.endsWith('Leg')?.55:1.55,side=part.startsWith('right')?1:part.startsWith('left')?-1:0;
  const local=side*(part.endsWith('Arm')?.49:.21)*scale,facing=target?.dir||0,q=r.damageMotion?.actors.get(target?.id)?.pose;
  return [x+Math.cos(facing)*local-Math.sin(dir)*.18*scale+(q?.x||0),(target?.baseY??SkillMotion.groundAt(r,x,z))+height*scale-(q?.drop||0),z-Math.sin(facing)*local-Math.cos(dir)*.18*scale+(q?.z||0)];
 }
 // All needles share one four-triangle mesh; length is the local Y axis.
 needle(from,to,width,color,alpha,mist=0){
  const r=this.r,d=to.map((v,i)=>v-from[i]),len=Math.hypot(...d);if(len<.001||alpha<.015)return;
  if(!RG_CACHE.has('skillfx:needle')){
   const P=[0,-.5,0, 1,0,0, 0,.5,0, 0,-.5,0, 0,.5,0, -1,0,0,
    0,-.5,0, 0,0,1, 0,.5,0, 0,-.5,0, 0,.5,0, 0,0,-1];
   RG_CACHE.set('skillfx:needle',{positions:new Float32Array(P),normals:new Float32Array(P.map((_,i)=>i%3===1?1:0)),count:12,radius:1});
  }
  r.add('skillfx:needle',...from.map((v,i)=>(v+to[i])*.5),width*(1+mist),len,width*(1+mist),color,
   Math.atan2(d[0],d[2]),0,Math.atan2(Math.hypot(d[0],d[2]),d[1]),mist?26+mist*.49:4,alpha,r.fxBatches);
 }
 cut(a,skill,beat,duration,full){
  const r=this.r,shape=SkillMotion.shape(skill),age=(beat-.43)*duration;
  const sample=this.castSamples.get(a.id),recipe=sample?.id===skill.id?sample.recipe:(typeof SkillEffects==='undefined'?null:SkillEffects.forSkill(skill.id));
  if(recipe){
   const dir=a.dir||0,reach=clamp((a.attackReach||skill.reach||1.5)/1.85,.5,1.5),ground=a.baseY??SkillMotion.groundAt(r,a.x,a.z);
   const point=v=>[a.x+(Math.cos(dir)*v[0]+Math.sin(dir)*v[2])*reach,ground+v[1],a.z+(-Math.sin(dir)*v[0]+Math.cos(dir)*v[2])*reach];
   this.composition(SkillEffects.stroke(recipe,(beat-.20)/.30,r.quality),point);return;
  }
  // The pose cuts from .25 to .43 of each beat; no luminous arc in recovery.
  if(beat<.27||age>.085)return;
  const sweep=clamp((beat-.27)/.16,0,1),fade=age<0?.35+sweep*.65:(1-age/.085)**2;
  const reach=clamp(a.attackReach||skill.reach||1.5,.9,2.6),dir=a.dir||0;
  const local=(x,y,z)=>[a.x+Math.cos(dir)*x+Math.sin(dir)*z,y,a.z-Math.sin(dir)*x+Math.cos(dir)*z];
  const color=['slam','leap','judgement'].includes(shape)?'#e1b98c':'#eee2be';
  if(['thrust','dash','slide','zigzag'].includes(shape)){
   const y=shape==='slide'?.48:1.12,end=.6+reach*sweep;
   this.needle(local(0,y,.3),local(0,y,end),.035,color,fade*.85);
   this.needle(local(.13,y+.08,.5),local(.13,y+.08,end*.82),.012,'#fff7e4',fade*.6);return;
  }
  if(['slam','leap','judgement'].includes(shape)){
   this.needle(local(0,2.05,.35),local(0,1.8-sweep*1.35,reach*.8),.055,color,fade*.85);return;
  }
  if(['cast','roar','counter','backflip','bow'].includes(shape))return;
  // Shared, continuous, feather-thin ribbon; both ends taper to a point.
  const spin=shape==='spin'||shape==='eclipse',arc=spin?2.4:1.5;
  const odd=(shape==='cross'||shape==='double')&&Math.floor(full)%2?-1:1;
  const key='skillfx:arc:'+Number(spin);
  if(!RG_CACHE.has(key)){
   const P=[],N=[],segments=18;
   const point=(u,inner)=>{const theta=-arc+arc*u,radius=1-(inner?.035*Math.sin(u*Math.PI):0);return [Math.sin(theta)*radius,0,Math.cos(theta)*radius];};
   for(let j=0;j<segments;j++){
    const u=j/segments,v=(j+1)/segments,aa=point(u,false),bb=point(u,true),cc=point(v,true),dd=point(v,false);
    P.push(...aa,...bb,...cc,...aa,...cc,...dd);for(let k=0;k<6;k++)N.push(0,1,0);
   }
   RG_CACHE.set(key,{positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius:1});
  }
  const head=(-(spin?2.3:1.12)+(spin?4.6:2.25)*sweep)*odd;
  r.add(key,a.x,shape==='kick'?.6:1.13,a.z,reach,reach,reach,color,dir+head,spin?.08:.25*odd,0,4,fade*.88,r.fxBatches);
 }
 composition(primitives,point){
  for(const p of primitives){
   if(this.compositionBudget<=0)break;
   if(p.kind==='field'||p.kind==='motes'){
    const cost=SkillArcane.cost(p),limit=this.r.quality==='low'?8:16;
    if(cost>this.compositionBudget||this.silkSlot>=limit)continue;
    const g=SkillArcane.geometry(p,point,this.r.eye);if(!g)continue;
    this.compositionBudget-=cost;
    const key='skillfx:arcane:'+this.silkSlot++;this.silkKeys.add(key);RG_CACHE.set(key,g);
    const target=p.mode===5?this.r.fxBatches:(this.r.arcaneFX??=new Map());
    this.r.add(key,...g.center,1,1,1,SkillArcane.ink(p),0,0,0,SkillArcane.surface,p.alpha,target);continue;
   }
   if(p.kind==='ribbon'){
    const cost=p.sections.length-1,limit=this.r.quality==='low'?8:16;
    if(cost>this.compositionBudget||this.silkSlot>=limit)continue;
    this.compositionBudget-=cost;
    const key='skillfx:silk:'+this.silkSlot++,g=SkillSilk.geometry(p,point);this.silkKeys.add(key);
    RG_CACHE.set(key,g);this.r.add(key,...g.center,1,1,1,SkillSilk.ink(p),0,0,0,SkillSilk.surface,p.alpha,this.r.fxBatches);continue;
   }
   this.compositionBudget--;
   if(p.kind==='line')this.needle(point(p.a),point(p.b),p.width,p.color,p.alpha,p.mist??0);
   else this.r.add('rbox',...point(p.p),...p.size.map(x=>x*(1+(p.mist??0)*.45)),p.color,p.turn,p.turn*.7,0,p.mist?27+p.mist*.49:4,p.alpha,this.r.fxBatches);
  }
 }
 clearSilk(){
  for(const key of this.silkKeys){const g=this.r.geo?.get(key);if(g){this.r.gl.deleteBuffer(g.vertex);this.r.gl.deleteBuffer(g.instance);this.r.gl.deleteVertexArray(g.vao);this.r.geo.delete(key);}this.r.instanceScratch?.delete(key);RG_CACHE.delete(key);}
  this.silkKeys.clear();this.silkSlot=0;
 }
 forget(id){
  this.trails.delete(id);const key='trail:'+id,r=this.r,g=r.geo?.get(key);
  if(g){r.gl.deleteBuffer(g.vertex);r.gl.deleteBuffer(g.instance);r.gl.deleteVertexArray(g.vao);r.geo.delete(key);}RG_CACHE.delete(key);
 }
 update(s){const r=this.r,t=s.t,p=s.player,list=[...s.actors||[],...s.players||[]];if(p&&!list.some(e=>e.id===p.id))list.push(p);const byId=new Map(list.map(e=>[e.id,e]));
  this.compositionBudget=r.quality==='low'?256:512;
  this.silkSlot=0;
  const room=s.room?.id??p?.room;if(this.room!==room){for(const id of this.trails.keys())this.forget(id);this.clearSilk();this.castSamples.clear();this.room=room;}
  const visible=new Set();
  for(const a of list){if(!a.alive||Math.hypot(a.x-r.camera.x,a.z-r.camera.z)>20)continue;visible.add(a.id);
   const skill=skillById(a.pendingSkill?.id??a.attackSkill);
   if(a.telegraph){const q=a.telegraph,u=clamp((t-q.started)/Math.max(.01,q.at-q.started),0,1);for(let j=0;j<3;j++)r.add('gltf:spark-streak',a.x+Math.sin(q.dir??a.dir)*(.8+j*.22),.28,a.z+Math.cos(q.dir??a.dir)*(.8+j*.22),.45,.24,.2,'#db9c63',-(q.dir??a.dir),0,Math.PI/2,4,.2+u*.42,r.fxBatches);}
   let trail=this.trails.get(a.id);const attacking=a.action==='attack'&&a.actionUntil>t&&skill;
   const silkRecipe=this.castRecipe(a,skill,t);
   // Simulation shifts actionStarted during hitstop. This clock freezes both
   // the sampled blade wake and its noise, and resets cleanly on a new action.
   const trailTime=silkRecipe?.family==='blade'?t-(a.actionStarted??0):t;
   if(trail?.length&&trail[0].t>trailTime+1e-6){this.forget(a.id);trail=null;}
   if(attacking){
    const clock=SkillMotion.clock(a,t,skill);
    const duration=clock.duration,beat=clock.beat,full=clock.index+beat;
    const weaponStrike=!['kick','cast','roar','counter','backflip','bow'].includes(clock.shape)&&!skill.magic;
    const tip=weaponStrike?r.weaponTips?.get(a.id):null;
    // A real blade/shaft uses its own path instead of a second, unrelated arc.
    if(!tip)this.cut(a,skill,beat,duration,full);
    if(tip&&beat>=.18&&beat<=.57){
     if(!trail){trail=[];this.trails.set(a.id,trail);}
     // Sample genuine weapon motion only; a hitstop cannot add more geometry.
     if(!trail.length||Math.hypot(...tip.map((v,i)=>v-trail[0].p[i]))>.04)trail.unshift({p:[...tip],t:trailTime});
    }
   }
   if(!trail)continue;
   while(trail.length&&(trailTime-trail.at(-1).t>COMBAT_FX.trailLife||trail.length>COMBAT_FX.trailPoints))trail.pop();
   if(!trail.length){this.forget(a.id);continue;}
   if(trail.length>=2){
    if(typeof SkillSilk!=='undefined'&&silkRecipe?.family==='blade'){
     const ribbon=SkillSilk.trail(trail,r.eye,trailTime,r.quality,silkRecipe);if(ribbon)this.composition(SkillEffects.decorate([ribbon],silkRecipe),v=>v);continue;
    }
    const center=trail[0].p,P=[],N=[];
    for(let j=0;j<trail.length-1;j++){
     const one=trail[j],two=trail[j+1],a=one.p,b=two.p;
     const tangent=b.map((v,i)=>v-a[i]),view=r.eye?r.eye.map((v,i)=>v-a[i]):[0,10,10];
     const cross=[tangent[1]*view[2]-tangent[2]*view[1],tangent[2]*view[0]-tangent[0]*view[2],tangent[0]*view[1]-tangent[1]*view[0]],len=Math.hypot(...cross)||1,off=cross.map(v=>v/len);
     const width=e=>COMBAT_FX.trailWidth*(1-clamp((t-e.t)/COMBAT_FX.trailLife,0,1))**2;
     const point=(p,sign,w)=>p.map((v,i)=>v-center[i]+off[i]*sign*w);
     const aa=point(a,1,width(one)),bb=point(a,-1,width(one)),cc=point(b,-1,width(two)),dd=point(b,1,width(two));
     P.push(...aa,...bb,...cc,...aa,...cc,...dd);for(let k=0;k<6;k++)N.push(0,1,0);
    }
    const key='trail:'+a.id;RG_CACHE.set(key,{positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius:3,dirty:true});
    r.add(key,...center,1,1,1,'#fff6e0',0,0,0,4,.8*(1-clamp((t-trail[0].t)/COMBAT_FX.trailLife,0,1)),r.fxBatches);
   }
  }
  for(const id of this.trails.keys())if(!visible.has(id))this.forget(id);
  for(const id of this.castSamples.keys())if(!visible.has(id))this.castSamples.delete(id);
  r.effects=r.effects.filter(e=>{
   const composed=this.hitRecipe(e);
   return t-e.born<(composed ? SkillEffects.life(composed) : (COMBAT_FX[e.type]?.life??e.life));
  });
  for(const e of r.effects){
   const profile=COMBAT_FX[e.type];if(!profile||typeof profile!=='object')continue;
   const age=t-e.born;if(age<0)continue;
   // A wound and hit can describe the same contact: do not double the burst.
   if(e.type==='wound'&&r.effects.some(h=>h!==e&&['hit','partbreak'].includes(h.type)&&h.target===e.target&&Math.abs(h.born-e.born)<.025))continue;
   const target=byId.get(e.target||e.player||e.id),source=byId.get(e.source),x=e.x??target?.x,z=e.z??target?.z;
   if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-r.camera.x,z-r.camera.z)>22)continue;
   if(e.type==='skillconnection'){
    const u=age/profile.life,dir=e.dir||0,side=[Math.cos(dir),0,-Math.sin(dir)],forward=[Math.sin(dir),0,Math.cos(dir)];
    const center=[x,1.2,z],strength=e.first?1:.5,fade=(1-u)**2*strength;
    // Two quick converging traces resolve at the actual contact point; no camera shake.
    for(const sign of [-1,1]) {
     const tail=center.map((v,i)=>v+side[i]*sign*(.25+u*.65)-forward[i]*(.3+u*.3));
     this.needle(tail,center,.022*strength,profile.color,fade);
    }
    if(e.first&&r.quality!=='low')this.needle([x,1.03,z],[x,1.4,z],.015,'#fff7da',fade);
    continue;
   }
   const hurt=e.type==='wound',own=hurt&&e.player===p?.id;
   const u=clamp(age/profile.life,0,1),strong=e.type==='partbreak'||hurt&&e.severity!=='light',count=r.quality==='low'?(own?6:4):profile.count;
   const dir=Number.isFinite(e.dir)?e.dir:source?Math.atan2(x-source.x,z-source.z):target?.dir||0;
   // Fix the contact position on the first rendered frame; sparks then travel
   // independently of the body's recoil. Attack VFX retain their existing path.
   const center=hurt||e.type==='guarded'?(e.contact??=this.contact(e,target,x,z,dir)):[x-Math.sin(dir)*.22,1.18,z-Math.cos(dir)*.22];
   const recipe=this.hitRecipe(e);
   if(recipe){
    // A confirmed contact owns its effect; a miss never invents an impact.
    const origin=e.skillContact??=this.contact(e,target,x,z,dir);
    const ground=typeof SkillArcane!=='undefined'&&SkillArcane.has(recipe.family)?SkillMotion.groundAt(r,x,z)-origin[1]+.035:undefined;
    this.composition(SkillEffects.impact(recipe,age,r.quality,ground),v=>[origin[0]+Math.cos(dir)*v[0]+Math.sin(dir)*v[2],origin[1]+v[1],origin[2]-Math.sin(dir)*v[0]+Math.cos(dir)*v[2]]);
    continue;
   }
   for(let j=0;j<count;j++){
    const angle=j*2.399963+(e.seq||0)*.13,speed=3.2+(j%3)*1.1;
    const v=[Math.sin(angle)*.8+Math.sin(dir)*.7,Math.cos(angle*1.3)*.65,Math.cos(angle)*.8+Math.cos(dir)*.7];
    const travel=age*speed,stretch=(.08+.22*(1-u))*(1-u);
    const tip=center.map((c,i)=>c+v[i]*travel-(i===1?age*age*1.2:0));
    this.needle(tip.map((c,i)=>c-v[i]*stretch),tip,(own?(strong?.034:.025):.018)*(1-u)+.003,j%3?profile.color:'#fff9e9',(1-u)**1.6);
   }
   if(age<.075){const f=(1-age/.075)**2,c=r.camera.yaw;
    const side=[Math.cos(c),0,-Math.sin(c)];
    this.needle(center.map((v,i)=>v-side[i]*(own?(strong?.48:.33):strong?.35:.23)*f),center.map((v,i)=>v+side[i]*(own?(strong?.48:.33):strong?.35:.23)*f),own?.045:.027, '#fff9e9',f);
    this.needle([center[0],center[1]-.24*f,center[2]],[center[0],center[1]+.24*f,center[2]],.018,profile.color,f);
   }
   if(strong&&e.severed)r.add('softbox',x+age*1.6,.3+Math.sin(u*Math.PI)*1.1,z-age*.8,.18,.40,.2,'#99866a',age*4,age*7,age*3,19,1-u*.65,r.fxBatches);
  }
  // Rain splashes are in the world, with depth test, and share the wet-ground state.
  if(r.weatherState.rain>.05&&!r.logicalSize){const count=r.quality==='low'?10:30;for(let j=0;j<count;j++){const xx=r.camera.x+Math.sin(j*74.7)*12,zz=r.camera.z+Math.cos(j*27.2)*12,u=(t*1.45+j*.371)%1;if(u<.42)r.add('ring:6.283185307179586',xx,.21,zz,.035+u*.22,1,.035+u*.22,'#94afad',0,0,0,11,(.42-u)*r.weatherState.rain*.55,r.fxBatches);}}
  // Fire/smoke remain local to existing hearths. No new interactable is introduced.
  for(const fire of r.art.sources.filter(x=>x.kind==='fire')){if(Math.hypot(fire.x-r.camera.x,fire.z-r.camera.z)>24)continue;for(let j=0;j<6;j++){const u=(t*.9+j*.17)%1,angle=j*2.4;r.add('leaf',fire.x+Math.sin(angle)*.30,fire.y+u*.8,fire.z+Math.cos(angle)*.21,.12*(1-u),.33*(1-u)+.05,.12*(1-u),j%2?'#f2bb63':'#ec873e',angle,0,0,4,.8*(1-u),r.fxBatches);}for(let j=0;j<5;j++){const u=(t*.14+j*.2)%1;r.add('gltf:leaf-crown',fire.x+u*.9,fire.y+1+u*2.4,fire.z,.15+u*.35,.19+u*.45,.17+u*.3,'#7f8175',0,0,0,17,Math.sin(u*Math.PI)*.055,r.fxBatches);}}
 }
}
