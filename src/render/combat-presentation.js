/* Snapshot-only combat VFX. Strike timing, damage, hitstop and save data stay in
 * Simulation. Short tapered silhouettes emphasize the existing contact pose. */
const COMBAT_FX = Object.freeze({
 trailLife:.105, trailWidth:.045, trailPoints:7,
 hit:{life:.21,count:7,color:'#ecd7ab'},
 wound:{life:.21,count:7,color:'#ecd7ab'},
 partbreak:{life:.30,count:10,color:'#dfae79'},
 blocked:{life:.17,count:5,color:'#bdced0'},
 guard:{life:.17,count:5,color:'#bdced0'},
 parry:{life:.24,count:9,color:'#d8eee8'}
});
class CombatPresentation{
 constructor(r){this.r=r;this.trails=new Map();this.room=null;}
 // All needles share one four-triangle mesh; length is the local Y axis.
 needle(from,to,width,color,alpha){
  const r=this.r,d=to.map((v,i)=>v-from[i]),len=Math.hypot(...d);if(len<.001||alpha<.015)return;
  if(!RG_CACHE.has('skillfx:needle')){
   const P=[0,-.5,0, 1,0,0, 0,.5,0, 0,-.5,0, 0,.5,0, -1,0,0,
    0,-.5,0, 0,0,1, 0,.5,0, 0,-.5,0, 0,.5,0, 0,0,-1];
   RG_CACHE.set('skillfx:needle',{positions:new Float32Array(P),normals:new Float32Array(P.map((_,i)=>i%3===1?1:0)),count:12,radius:1});
  }
  r.add('skillfx:needle',...from.map((v,i)=>(v+to[i])*.5),width,len,width,color,
   Math.atan2(d[0],d[2]),0,Math.atan2(Math.hypot(d[0],d[2]),d[1]),4,alpha,r.fxBatches);
 }
 cut(a,skill,beat,duration,full){
  const r=this.r,shape=skill.animation||'slash',age=(beat-.43)*duration;
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
  if(['cast','roar','counter','backflip'].includes(shape))return;
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
  const head=-(spin?2.3:1.12)+(spin?4.6:2.25)*sweep;
  r.add(key,a.x,shape==='kick'?.6:1.13,a.z,reach,reach,reach,color,dir+head,spin?.08:.25*odd,0,4,fade*.88,r.fxBatches);
 }
 forget(id){
  this.trails.delete(id);const key='trail:'+id,r=this.r,g=r.geo?.get(key);
  if(g){r.gl.deleteBuffer(g.vertex);r.gl.deleteBuffer(g.instance);r.gl.deleteVertexArray(g.vao);r.geo.delete(key);}RG_CACHE.delete(key);
 }
 update(s){const r=this.r,t=s.t,p=s.player,list=[...s.actors||[],...s.players||[]];if(p&&!list.some(e=>e.id===p.id))list.push(p);const byId=new Map(list.map(e=>[e.id,e]));
  const room=s.room?.id??p?.room;if(this.room!==room){for(const id of this.trails.keys())this.forget(id);this.room=room;}
  const visible=new Set();
  for(const a of list){if(!a.alive||Math.hypot(a.x-r.camera.x,a.z-r.camera.z)>20)continue;visible.add(a.id);
   const skill=skillById(a.pendingSkill?.id??a.attackSkill);
   if(a.telegraph){const q=a.telegraph,u=clamp((t-q.started)/Math.max(.01,q.at-q.started),0,1);for(let j=0;j<3;j++)r.add('gltf:spark-streak',a.x+Math.sin(q.dir??a.dir)*(.8+j*.22),.28,a.z+Math.cos(q.dir??a.dir)*(.8+j*.22),.45,.24,.2,'#db9c63',-(q.dir??a.dir),0,Math.PI/2,4,.2+u*.42,r.fxBatches);}
   let trail=this.trails.get(a.id);const attacking=a.action==='attack'&&a.actionUntil>t&&skill;
   if(attacking){
    const duration=Math.max(.01,(a.actionUntil-a.actionStarted)/(skill.hits||1));
    const full=(t-a.actionStarted)/duration,beat=full%1;
    this.cut(a,skill,beat,duration,full);
    const tip=r.weaponTips?.get(a.id);
    if(tip&&beat>=.25&&beat<=.48){
     if(!trail){trail=[];this.trails.set(a.id,trail);}
     // Sample genuine weapon motion only; a hitstop cannot add more geometry.
     if(!trail.length||Math.hypot(...tip.map((v,i)=>v-trail[0].p[i]))>.04)trail.unshift({p:[...tip],t});
    }
   }
   if(!trail)continue;
   while(trail.length&&(t-trail.at(-1).t>COMBAT_FX.trailLife||trail.length>COMBAT_FX.trailPoints))trail.pop();
   if(!trail.length){this.forget(a.id);continue;}
   if(trail.length>=2){const center=trail[0].p,P=[],N=[];
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
  r.effects=r.effects.filter(e=>t-e.born<(COMBAT_FX[e.type]?.life??e.life));
  for(const e of r.effects){
   const profile=COMBAT_FX[e.type];if(!profile||typeof profile!=='object')continue;
   const age=t-e.born;if(age<0)continue;
   // A wound and hit can describe the same contact: do not double the burst.
   if(e.type==='wound'&&r.effects.some(h=>h!==e&&['hit','partbreak'].includes(h.type)&&h.target===e.target&&Math.abs(h.born-e.born)<.025))continue;
   const target=byId.get(e.target||e.player||e.id),source=byId.get(e.source),x=e.x??target?.x,z=e.z??target?.z;
   if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-r.camera.x,z-r.camera.z)>22)continue;
   const u=clamp(age/profile.life,0,1),strong=e.type==='partbreak',count=r.quality==='low'?4:profile.count;
   const dir=source?Math.atan2(x-source.x,z-source.z):target?.dir||0;
   const center=[x-Math.sin(dir)*.22,1.18,z-Math.cos(dir)*.22];
   for(let j=0;j<count;j++){
    const angle=j*2.399963+(e.seq||0)*.13,speed=3.2+(j%3)*1.1;
    const v=[Math.sin(angle)*.8+Math.sin(dir)*.7,Math.cos(angle*1.3)*.65,Math.cos(angle)*.8+Math.cos(dir)*.7];
    const travel=age*speed,stretch=(.08+.22*(1-u))*(1-u);
    const tip=center.map((c,i)=>c+v[i]*travel-(i===1?age*age*1.2:0));
    this.needle(tip.map((c,i)=>c-v[i]*stretch),tip,.018*(1-u)+.003,j%3?profile.color:'#fff9e9',(1-u)**1.6);
   }
   if(age<.075){const f=(1-age/.075)**2,c=r.camera.yaw;
    const side=[Math.cos(c),0,-Math.sin(c)];
    this.needle(center.map((v,i)=>v-side[i]*(strong?.35:.23)*f),center.map((v,i)=>v+side[i]*(strong?.35:.23)*f),.027, '#fff9e9',f);
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
