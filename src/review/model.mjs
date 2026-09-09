// Review fixtures only. All actions and damage are resolved by the game Simulation.
export function createReviewModel(R) {
 const skills=()=>[...R.book.values()].filter(s=>R.skillById(s.id));
 const enemies=()=>[{id:'dummy',kind:'dummy',name:'かかし'},...Object.values(R.ENEMY_FORMS).flat()];
 function resolveSkill(id){return skills().find(s=>String(s.id)===String(id)||s.skillKey===id);}
 function resolveEnemy(id){return enemies().find(e=>e.id===id);}
 function equip(sim,p,s){
  sim.learn(p,s.id);if(s.weapon>=0)p.weapon=s.weapon;if(s.school==='shield')p.shield=true;
  if(s.requiresPassive)sim.learn(p,s.requiresPassive);
  if(s.resource)p.ammo[s.resource]=Math.max(10,s.amount||1);
  for(const item of [s.item,...(s.items||[])].filter(Boolean))if(!p.inventory.includes(item))p.inventory.push(item);
 }
 function trial({skill,enemy='dummy',distance=2.5,weapon=-1,mode='single',slots=[],seed=18427}={}) {
  const selected=resolveSkill(skill),form=resolveEnemy(enemy);if(!selected)throw Error('この版に技がありません: '+skill);if(!form)throw Error('この版に敵がありません: '+enemy);
  const sim=new R.Simulation({seed}),p=sim.addPlayer('review-lab',{owner:'review-lab',race:0}),room=sim.getRoom(p);
  Object.assign(p,{prologue:false,age:24,introUntil:-100,releaseAt:-100,farewellStage:3,x:0,z:0,dir:0,weapon,stamina:100,staminaCap:100});
  sim.yearSeconds=1e9;room.kind='front';room.stage=0;room.quota=1e9;room.actors=[];room.waveAt=1e9;delete room.map;
  const e=sim.actor(form.kind,0,distance);Object.assign(e,{enemyForm:form.id,name:form.name,cooldown:.8});room.actors.push(e);
  p.phaseWeights=[{},{},{}];
  const combatWeapon=selected.weapon>=0?selected.weapon:weapon;
  const chosen=mode==='combo'?slots.map(resolveSkill).filter(Boolean):mode==='combat'?[0,1,2].map(phase=>{
   if(!selected.passive&&R.skillPhase(selected)===phase)return selected;
   const proposed=resolveSkill(slots[phase]);
   return proposed&&!proposed.passive&&(proposed.weapon<0||proposed.weapon===combatWeapon)?proposed:skills().find(s=>!s.passive&&R.skillPhase(s)===phase&&s.weapon<0);
  }).filter(Boolean):[selected];
  for(const s of chosen){equip(sim,p,s);if(!s.passive)p.phaseWeights[R.skillPhase(s)]={[s.id]:1};}
  // The selected skill chooses its required weapon; fixtures grant prerequisites,
  // never replace costs, injury rules, hit detection or opponent AI.
  equip(sim,p,selected);p.autoSuppressedUntil=mode==='combat'?0:1e9;
  let status='';
  if(selected.passive){status='常時効果を適用中';}
  else {
   p.combo={band:mode==='combo'?0:R.skillPhase(selected),total:0,repeats:0};
   const first=mode==='combo'?chosen.find(s=>R.skillPhase(s)===0):selected;
   if(!first)throw Error('序の技を選んでください');
   const reason=R.skillRestriction(p,first);if(reason)throw Error(reason);
   if(!sim.beginComboStrike(p,first.id))throw Error('この条件では技を開始できません');
   p.comboQueued=mode==='combo';if(mode==='combat'||mode==='combo')p.autoFight=e.id;
  }
  return {sim,p,room,enemy:e,status,mode,skill:selected.id,initial:{player:[p.x,p.z],enemy:[e.x,e.z]},events:[],hits:0,links:0,seq:0};
 }
 function step(t,dt){
  t.sim.tick(dt);
  const events=t.sim.events.filter(e=>e.seq>t.seq);t.seq=t.sim.seq;t.events.push(...events);if(t.events.length>2000)t.events.splice(0,500);
  t.hits+=events.filter(e=>e.type==='hit'&&e.source===t.p.id).length;t.links+=events.filter(e=>e.type==='skillconnection').length;
  if(t.mode!=='combat'&&!t.p.combo&&!t.p.pendingSkill){t.p.autoFight=null;t.p.autoSuppressedUntil=1e9;}
  return events;
 }
 return {skills,enemies,resolveSkill,resolveEnemy,trial,step};
}
export function reviewLink(base,{mode='skills',skill,enemy,sha}={}) {
 if(!['skills','enemies','combat'].includes(mode))throw Error('Unknown review mode');
 const url=new URL('/review/'+mode,base);
 if(skill!==undefined)url.searchParams.set('skill',skill);if(enemy!==undefined)url.searchParams.set('enemy',enemy);if(sha)url.searchParams.set('sha',sha);return url.href;
}
