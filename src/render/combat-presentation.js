/* Read-only VFX. Damage and hitstop belong exclusively to Simulation.
 * Trail ribbons follow the current weapon silhouette; impacts use event timestamps.
 */
class CombatPresentation{
 constructor(r){this.r=r;this.trails=new Map();}
 update(s){const r=this.r,t=s.t,p=s.player,list=[...s.actors||[],...s.players||[]];if(p&&!list.some(e=>e.id===p.id))list.push(p);const byId=new Map(list.map(e=>[e.id,e]));
  for(const a of list){if(!a.alive||Math.hypot(a.x-r.camera.x,a.z-r.camera.z)>20)continue;const skill=skillById(a.pendingSkill?.id??a.attackSkill);if(a.telegraph){const q=a.telegraph,u=clamp((t-q.started)/Math.max(.01,q.at-q.started),0,1);for(let j=0;j<3;j++)r.add('gltf:spark-streak',a.x+Math.sin(q.dir||a.dir)*(.8+j*.22),.28,a.z+Math.cos(q.dir||a.dir)*(.8+j*.22),.45,.24,.2,'#db9c63',-(q.dir||a.dir),0,Math.PI/2,4,.2+u*.42,r.fxBatches);}
   if(a.autoFight&&r.weatherState.rain<.7){for(let j=0;j<(r.quality==='low'?3:6);j++){const u=(t*.52+j/6)%1,theta=j*2.40+t*.2;r.add('gltf:stone-sculpt',a.x+Math.sin(theta)*(.6+u*.4),.18+u*.3,a.z+Math.cos(theta)*(.6+u*.4),.17+u*.14,.07+u*.08,.13+u*.14,'#bbaa87',theta,0,0,17,(1-u)*.14,r.fxBatches);}}
   let trail=this.trails.get(a.id);if(!trail){trail=[];this.trails.set(a.id,trail);}const attacking=a.action==='attack'&&a.actionUntil>t&&skill;
   if(attacking){const u=clamp((t-a.actionStarted)/Math.max(.01,a.actionUntil-a.actionStarted),0,1),beat=(u*(skill.hits||1))%1;
    if(beat>.15&&beat<.80){const ang=a.dir+(beat-.46)*3.6,tip=r.weaponTips?.get(a.id),point=tip||[a.x+Math.sin(ang)*1.5,.95+Math.sin(beat*Math.PI)*.60,a.z+Math.cos(ang)*1.5];if(!trail.length||Math.hypot(point[0]-trail[0].p[0],point[1]-trail[0].p[1],point[2]-trail[0].p[2])>.025)trail.unshift({p:[...point],t});
     // A narrow swept 3D volume supplies a readable edge even at a low refresh rate.
     const blunt=['slam','judgement','roar'].includes(skill.animation),color=blunt?'#d8aa72':'#f1d596';r.add('gltf:arc-ribbon',a.x,1.20,a.z,blunt?1.2:1.65,.52,blunt?1.2:1.65,color,ang,Math.sin(u*Math.PI)*.62,(skill.animation==='spin'?.30:1.0),4,Math.sin((beat-.15)/.65*Math.PI)*.52,r.fxBatches);
    }}
   while(trail.length&&(t-trail[trail.length-1].t>.19||trail.length>9))trail.pop();
   if(trail.length>=2){const center=trail[0].p,P=[],N=[];for(let j=0;j<trail.length-1;j++){const a=trail[j].p,b=trail[j+1].p,w=.105*(1-j/trail.length),wn=.105*(1-(j+1)/trail.length),tangent=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],view=r.eye?r.eye.map((v,i)=>v-a[i]):[0,10,10],cross=[tangent[1]*view[2]-tangent[2]*view[1],tangent[2]*view[0]-tangent[0]*view[2],tangent[0]*view[1]-tangent[1]*view[0]],len=Math.hypot(...cross)||1,off=cross.map(v=>v/len),point=(p,sign,width)=>p.map((v,i)=>v-center[i]+off[i]*sign*width),aa=point(a,1,w),bb=point(a,-1,w),cc=point(b,-1,wn),dd=point(b,1,wn);P.push(...aa,...bb,...cc,...aa,...cc,...dd);for(let k=0;k<6;k++)N.push(0,1,0);}const key='trail:'+a.id;RG_CACHE.set(key,{positions:new Float32Array(P),normals:new Float32Array(N),count:P.length/3,radius:3,dirty:true});r.add(key,...center,1,1,1,'#fff1cc',0,0,0,4,.66,r.fxBatches);}
  }
  r.effects=r.effects.filter(e=>t-e.born<e.life);
  for(const e of r.effects){const target=byId.get(e.target||e.player||e.id),source=byId.get(e.source),x=e.x??target?.x,z=e.z??target?.z;if(!Number.isFinite(x)||!Number.isFinite(z))continue;const age=t-e.born,u=clamp(age/e.life,0,1),hit=['hit','wound','partbreak','blocked','parry','guard'].includes(e.type);if(!hit)continue;let hx=x,hz=z;if(source){const d=Math.hypot(source.x-x,source.z-z)||1;hx+=(source.x-x)/d*.28;hz+=(source.z-z)/d*.28;}const strong=e.type==='partbreak',count=r.quality==='low'?7:strong?18:12;
   for(let j=0;j<count;j++){const angle=j*2.3999+(e.seq||0)*.1,vel=1.9+(j%4)*.60,dx=Math.sin(angle)*age*vel,dz=Math.cos(angle*1.71)*age*vel,yy=1.2+Math.cos(angle)*age*vel-age*age*3.1;
    const fragment=strong&&j%4===0;const scale=(1-u);r.add(fragment?'gltf:stone-sculpt':'gltf:spark-streak',hx+dx,yy,hz+dz,fragment?.085:.70,.09+scale*(fragment?.07:.42),fragment?.08:.70,fragment?'#b89b70':j%3?'#f9d28e':'#fff3c9',angle,angle*.7+age*3,angle*1.2,fragment?10:4,Math.min(1,scale*2),r.fxBatches);
   }
   if(age<.12){r.add('star',hx,1.18,hz,.16*(1-age/.12),.29*(1-age/.12),.09,'#fff6d2',r.camera.yaw,.2,-r.camera.pitch,4,.91,r.fxBatches);}
   if(strong&&e.severed)r.add('softbox',hx+age*1.6,.3+Math.sin(u*Math.PI)*1.1,hz-age*.8,.18,.40,.2,'#99866a',age*4,age*7,age*3,19,1-u*.65,r.fxBatches);
  }
  // Rain splashes are in the world, with depth test, and share the wet-ground state.
  if(r.weatherState.rain>.05&&!r.logicalSize){const count=r.quality==='low'?10:30;for(let j=0;j<count;j++){const xx=r.camera.x+Math.sin(j*74.7)*12,zz=r.camera.z+Math.cos(j*27.2)*12,u=(t*1.45+j*.371)%1;if(u<.42)r.add('ring:6.283185307179586',xx,.21,zz,.035+u*.22,1,.035+u*.22,'#94afad',0,0,0,11,(.42-u)*r.weatherState.rain*.55,r.fxBatches);}}
  // Fire/smoke remain local to existing hearths. No new interactable is introduced.
  for(const fire of r.art.sources.filter(x=>x.kind==='fire')){if(Math.hypot(fire.x-r.camera.x,fire.z-r.camera.z)>24)continue;for(let j=0;j<6;j++){const u=(t*.9+j*.17)%1,angle=j*2.4;r.add('leaf',fire.x+Math.sin(angle)*.30,fire.y+u*.8,fire.z+Math.cos(angle)*.21,.12*(1-u),.33*(1-u)+.05,.12*(1-u),j%2?'#f2bb63':'#ec873e',angle,0,0,4,.8*(1-u),r.fxBatches);}for(let j=0;j<5;j++){const u=(t*.14+j*.2)%1;r.add('gltf:leaf-crown',fire.x+u*.9,fire.y+1+u*2.4,fire.z,.15+u*.35,.19+u*.45,.17+u*.3,'#7f8175',0,0,0,17,Math.sin(u*Math.PI)*.055,r.fxBatches);}}
 }
}
