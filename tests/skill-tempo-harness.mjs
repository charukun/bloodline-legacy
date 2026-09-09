// Real Simulation snapshots for motion regression and offline comparison.
export function tempoCombat(api,ids=[60050,60051,60052],race=0){
 const sim=new api.Simulation({seed:93}),p=sim.addPlayer('tempo',{owner:'tempo',race}),room=sim.getRoom(p);
 Object.assign(p,{prologue:false,age:24,gender:[0,1,0,1][race],ageFraction:0,introUntil:-100,releaseAt:-100,farewellStage:3,stun:0,cooldown:0,x:0,z:-38,dir:0,weapon:0,stamina:100,staminaCap:100});
 room.waveAt=100000;const target=sim.actor('dummy',0,-37);target.cooldown=10000;target.hp=target.hpMax=500;room.actors=[target];p.autoFight=target.id;
 for(const id of ids)sim.learn(p,id);
 p.phaseWeights=[0,1,2].map(b=>Object.fromEntries(ids.filter(id=>api.skillById(id).band===b).map(id=>[id,100])));
 return {sim,p,target};
}
