/* The local simulation remains fixed at 30 Hz. Only rendered transforms use
 * the interval between its last two ticks (at most one tick of visual delay).
 * Copy the pre-tick coordinates: local snapshots share live Simulation objects.
 */
class MotionInterpolation {
 constructor(){this.previous=new Map();}
 reset(){this.previous.clear();this.room=null;this.playerId=null;}
 capture(sim,playerId){
  const player=sim.players.get(playerId),room=player&&sim.getRoom(player);
  if(!room){this.reset();return;}
  if(this.room!==room.id||this.playerId!==playerId)this.reset();
  this.room=room.id;this.playerId=playerId;this.time=sim.time;
  const remember=e=>{
   let old=this.previous.get(e.id);
   if(!old){old={};this.previous.set(e.id,old);}
   Object.assign(old,{x:e.x,z:e.z,dir:e.dir,baseY:e.baseY,alive:e.alive,
    prologue:e.prologue,time:sim.time});
  };
  for(const e of room.actors)remember(e);
  for(const e of sim.players.values())if(e.room===room.id)remember(e);
  for(const [id,old]of this.previous)if(old.time!==sim.time)this.previous.delete(id);
 }
 sample(snapshot,alpha){
  const gap=snapshot.t-this.time;
  if(snapshot.room.id!==this.room||snapshot.player.id!==this.playerId||
     !(gap>0&&gap<=1/30+1e-7))return snapshot;
  alpha=Math.max(0,Math.min(1,alpha));
  const pose=e=>{
   const old=this.previous.get(e.id);
   // New lives, room transfers and teleports must appear at their destination.
   if(!old||old.alive!==e.alive||old.prologue!==e.prologue||
      Math.hypot(e.x-old.x,e.z-old.z)>2)return e;
   const p={...e,x:old.x+(e.x-old.x)*alpha,z:old.z+(e.z-old.z)*alpha,
    renderPoseTime:this.time+gap*alpha};
   if(Number.isFinite(old.dir)&&Number.isFinite(e.dir)){
    const angle=Math.atan2(Math.sin(e.dir-old.dir),Math.cos(e.dir-old.dir));
    p.dir=old.dir+angle*alpha;
   }
   if(Number.isFinite(old.baseY)&&Number.isFinite(e.baseY))p.baseY=old.baseY+(e.baseY-old.baseY)*alpha;
   return p;
  };
  const player=pose(snapshot.player);
  return {...snapshot,player,players:snapshot.players.map(e=>e.id===player.id?player:pose(e)),
   actors:snapshot.actors.map(pose)};
 }
}
