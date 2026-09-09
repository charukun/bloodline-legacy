/* Review-only entry point. Uses the shipped renderer, rigs and actionTiming.
 * Synthetic snapshots exercise animation; no Game instance, save or network. */
const MotionReview=(()=>{
 const clips={slash:[4001],thrust:[4004],slam:[4003],kick:[60020],spin:[60021],cast:[4300],chain:[60000,60001,60002]};
 const weapons={slash:0,thrust:3,slam:2,kick:-1,spin:0,cast:-1,chain:2};
 function sequence(key){
  const ids=clips[key]||clips.slash,segments=[];let cursor=.35,travel=0;
  ids.forEach((id,index)=>{const sk=skillById(id),timing=actionTiming(sk),start=cursor,release=start+timing.charge,end=release+timing.swing;
   segments.push({id,index,start,release,end,travel,timing,hits:sk.hits||1});cursor=end;travel+=.18;
  });
  const last=segments.at(-1),end=last.end+last.timing.recovery;
  return {segments,end,duration:end+.35};
 }
 function sample(base,key,time,age=24){
  const seq=sequence(key),cycle=Math.floor(time/seq.duration),t=time-cycle*seq.duration;
  const p={...base,id:'motion-review-'+cycle,age,gender:0,race:0,prologue:false,introUntil:-100,x:0,z:0,dir:0,weapon:weapons[key]??0,armor:0,shield:false,autoFight:'review-target',action:'idle',actionStarted:0,actionUntil:0,pendingSkill:null,combo:null,attackStep:null,hitReactUntil:0,hitstopUntil:0,wounds:{},statuses:{},input:{x:0,z:0},alive:true};
  const s=seq.segments.find(s=>t>=s.start&&t<s.end);let label='構え',beat=0,index=-1;
  if(s){
   index=s.index;Object.assign(p,{attackSkill:s.id,currentSkill:s.id,combo:{total:s.index+1},z:s.travel});
   if(t<s.release){const u=clamp((t-(s.release-.12))/.12,0,1),m=.18*u*u*(3-2*u);Object.assign(p,{action:'charge',actionStarted:s.start,actionUntil:s.release,pendingSkill:{id:s.id,started:s.start,at:s.release},z:s.travel+m,attackStep:{moved:m}});label='溜め';}
   else{Object.assign(p,{action:'attack',actionStarted:s.release,actionUntil:s.end,z:s.travel+.18});const full=(t-s.release)/(s.end-s.release)*s.hits;beat=full-Math.floor(full);label=beat<.35?'振り出し':beat<.50?'命中':beat<.75?'振り抜き':'次の構え';}
  }else if(t>=seq.segments.at(-1).end){const last=seq.segments.at(-1);Object.assign(p,{z:last.travel+.18,attackSkill:last.id,currentSkill:last.id,action:t<seq.end?'recover':'idle',actionStarted:last.end,actionUntil:seq.end});label=t<seq.end?'立て直し':'構え';}
  return {p,t,cycle,index,beat,label,seq};
 }
 async function start(session){
  const loading=document.getElementById('loading');
  try{
   await AssetBank.load();installTerrainGeometry();
   const r=new SliceRenderer(document.getElementById('world'));r.setQuality('medium');
   r.sceneKey='portrait';r.art.root=rModel();r.art.target=r.static;
   r.art.B(0,.05,0,9,.10,9,'#aaa58d');r.art.B(0,.102,1.8,1.4,.012,.025,'#d9c49c');
   r.art.statuses=()=>{};r.art.parentScene=()=>{};r.art.sources=[];
   const sim=new Simulation({seed:7349}),base=sim.addPlayer('review',{owner:'review'}),snapshot=sim.snapshot(base.id);
   let config={clip:'slash',age:24,speed:1,paused:false,fx:false,view:'close',angle:.9},time=0,last=0,request=0,disposed=false,lastReport=0,lastContact='',previousCycle=0;
   const post=data=>parent.postMessage({type:'motion-review',session,...data},'*');
   const clearFX=()=>{r.effects.length=0;for(const id of r.combatPresentation.trails.keys())r.combatPresentation.forget(id);lastContact='';};
   const reset=()=>{r.skillMotionStates?.clear();r.art.skillFeet?.clear();r.damageMotion?.actors.clear();clearFX();if(r.characterMaster)r.characterMaster.state=null;for(const rec of r.rigs.records.values()){rec.parts=null;rec.from=null;rec.state=null;}};
   // Reconstruct renderer history on a seek/A-B switch. Sampling just the final
   // frame would omit the previous cut, foot plants and transition into charge.
   const prime=()=>{
    reset();const q=sample(base,config.clip,time,config.age),start=time-q.t;
    for(let t=start;t<time;t+=1/60){const f=sample(base,config.clip,t,config.age);r.frame++;r.currentTime=f.t;r.currentSnapshot={...snapshot,t:f.t,player:f.p,actors:[],players:[f.p]};r.rigs.active.length=0;r.dynamic.clear();r.fxBatches.clear();r.art.doll(f.p,f.t,true);}
    previousCycle=q.cycle;
   };
   const combatFX=r.combatFX.bind(r);r.combatFX=(s,t)=>{if(config.fx)combatFX(s,t);};
   addEventListener('message',e=>{
    if(e.source!==parent||e.data?.type!=='motion-control')return;const d=e.data;
    if(d.dispose){disposed=true;cancelAnimationFrame(request);r.gl.getExtension('WEBGL_lose_context')?.loseContext();return;}
    if(d.config){const old=config;config={...config,...d.config};if(config.clip!==old.clip||config.age!==old.age){time=0;previousCycle=0;reset();}if(config.fx!==old.fx)clearFX();}
    if(Number.isFinite(d.seek)){time=clamp(d.seek,0,.999999)*sequence(config.clip).duration;prime();}
    last=0;
   });
   document.addEventListener('visibilitychange',()=>{last=0;});
   function frame(now){
    if(disposed)return;request=requestAnimationFrame(frame);if(document.hidden){last=0;return;}
    const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!config.paused)time+=dt*config.speed;
    const q=sample(base,config.clip,time,config.age),s={...snapshot,t:q.t,player:q.p,players:[q.p],actors:[],events:[]};
    if(q.cycle!==previousCycle){reset();previousCycle=q.cycle;}
    Object.assign(r.camera,{x:0,z:q.p.z+.2,y:1.10,zoom:config.view==='game'?13.5:4.9,yaw:Number(config.angle),pitch:config.view==='game'?.68:.38});
    if(config.fx&&q.p.action==='attack'&&q.beat>=.43){const contact=q.cycle+':'+q.index+':'+Math.floor((q.t-q.p.actionStarted)/(q.p.actionUntil-q.p.actionStarted)*(skillById(q.p.attackSkill).hits||1));if(contact!==lastContact){lastContact=contact;r.effect({type:'hit',source:q.p.id,target:'review-target',x:0,z:q.p.z+1.45,seq:Math.floor(time*1000)},q.t);}}
    r.render(s,dt*config.speed,{portrait:true,freezeCamera:true});
    if(now-lastReport>100){lastReport=now;post({progress:q.t/q.seq.duration,label:q.label,skill:skillById(q.p.attackSkill)?.name||'',calls:r.stats.calls});}
   }
   loading.hidden=true;post({ready:true});request=requestAnimationFrame(frame);
  }catch(e){loading.textContent='表示できませんでした: '+e.message;parent.postMessage({type:'motion-review',session,error:e.message},'*');console.error(e);}
 }
 return {sequence,sample,start};
})();
