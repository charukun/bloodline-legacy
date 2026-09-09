/* The local simulation remains fixed at 30 Hz. Only rendered transforms use
 * the interval between its last two ticks (at most one tick of visual delay).
 * Copy the pre-tick coordinates: local snapshots share live Simulation objects.
 */
class MotionInterpolation {
 constructor(){this.previous=new Map();}
 reset(){this.previous.clear();this.room=null;this.playerId=null;this.remote=null;}
 capture(sim,playerId){
  const player=sim.players.get(playerId),room=player&&sim.getRoom(player);
  if(!room){this.reset();return;}
  if(this.room!==room.id||this.playerId!==playerId)this.reset();
  this.room=room.id;this.playerId=playerId;this.time=sim.time;
  const remember=e=>{
   let old=this.previous.get(e.id);
   if(!old){old={};this.previous.set(e.id,old);}
   Object.assign(old,{x:e.x,z:e.z,dir:e.dir,baseY:e.baseY,alive:e.alive,
    prologue:e.prologue,supportHeight:e.supportHeight||0,verticalOffset:e.verticalOffset||0,time:sim.time});
  };
  for(const e of room.actors)remember(e);
  for(const e of sim.players.values())if(e.room===room.id)remember(e);
  for(const [id,old]of this.previous)if(old.time!==sim.time)this.previous.delete(id);
 }
 sample(snapshot,alpha){
  const gap=snapshot.t-this.time;
  if(snapshot.room.id!==this.room||snapshot.player.id!==this.playerId||
     !(gap>0&&gap<=1/30+1e-7))return snapshot;
  return this.blend(snapshot,this.previous,alpha,this.time+gap*Math.max(0,Math.min(1,alpha)));
 }
 receiveRemote(snapshot,now){
  const r=this.remote,gap=r?snapshot.t-r.snapshot.t:0;
  if(!r)this.previous.clear();
  if(!r||snapshot.room.id!==r.snapshot.room.id||snapshot.player.id!==r.snapshot.player.id||gap<0||gap>.3||now-r.received>500){
   this.remote={snapshot,received:now,span:0};return;
  }
  // Command acknowledgements can repeat the same simulation time. They must
  // update state without restarting a moving pose's interpolation interval.
  if(gap===0){r.snapshot=snapshot;return;}
  const displayed=this.sampleRemote(r.snapshot,now),previous=new Map();
  for(const e of [...displayed.actors,...displayed.players,displayed.player])previous.set(e.id,e);
  this.remote={snapshot,previous,received:now,span:Math.max(1/30,Math.min(.15,gap))*1000,
   time:displayed.player.renderPoseTime??displayed.t};
 }
 sampleRemote(snapshot,now){
  if(this.remote?.snapshot!==snapshot)this.receiveRemote(snapshot,now);
  const r=this.remote;
  if(!r.previous||!r.span)return snapshot;
  const alpha=Math.max(0,Math.min(1,(now-r.received)/r.span));
  // A late/missing packet holds at the known destination: no extrapolation,
  // predicted collision, extra Simulation tick or delayed event dispatch.
  return this.blend(snapshot,r.previous,alpha,r.time+(snapshot.t-r.time)*alpha);
 }
 blend(snapshot,previous,alpha,time){
  alpha=Math.max(0,Math.min(1,alpha));
  const pose=e=>{
   const old=previous.get(e.id);
   // New lives, room transfers and teleports must appear at their destination.
   if(!old||old.alive!==e.alive||old.prologue!==e.prologue||
      Math.hypot(e.x-old.x,e.z-old.z)>2)return e;
   const p={...e,x:old.x+(e.x-old.x)*alpha,z:old.z+(e.z-old.z)*alpha,
    renderPoseTime:time};
   if(Number.isFinite(old.dir)&&Number.isFinite(e.dir)){
    const angle=Math.atan2(Math.sin(e.dir-old.dir),Math.cos(e.dir-old.dir));
    p.dir=old.dir+angle*alpha;
   }
   if(Number.isFinite(old.baseY)&&Number.isFinite(e.baseY))p.baseY=old.baseY+(e.baseY-old.baseY)*alpha;
   p.supportHeight=(old.supportHeight||0)+((e.supportHeight||0)-(old.supportHeight||0))*alpha;p.verticalOffset=(old.verticalOffset||0)+((e.verticalOffset||0)-(old.verticalOffset||0))*alpha;
   return p;
  };
  const player=pose(snapshot.player);
  return {...snapshot,player,players:snapshot.players.map(e=>e.id===player.id?player:pose(e)),
   actors:snapshot.actors.map(pose)};
 }
}
