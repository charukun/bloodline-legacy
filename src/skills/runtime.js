/* Explicit adapters to the existing Simulation. No prototype overrides or extra loop. */
const BL_SKILL_CATALOG = new BloodlineSkills.Catalog(BL_SKILL_DEFINITIONS);
for (const def of BL_SKILL_DEFINITIONS) {
 const a=def.action||{};
 art(def.id,def.names.ja,{...a,animation:a.anim||'slash',travel:a.step??.25,form:['slam','leap'].includes(a.anim)?6:['thrust','zigzag'].includes(a.anim)?2:a.hits>1?3:0,status:a.status?{id:a.status,duration:a.duration}:null,school:a.anim==='slam'?'heavy':a.school||'life',band:def.phase,passive:!!def.passive,trigger:def.passive?'passive':'combo',effect:def.effect,value:def.value,color:def.color,desc:def.descriptions.ja,motion:def.names.ja,skillKey:def.key});
}
const SkillSystem = (() => {
 const activities={
  observe:{tags:['craft','weight','rhythm'],text:'鍛冶場で、道具が打ち返す拍子を見た'},
  care:{tags:['care','craft','patience'],text:'武具を手入れし、力の通り道を確かめた'},
  play:{tags:['play','light','rhythm'],text:'庭で遊び、弾む足の拍子を覚えた'},
  track:{tags:['track','explore','precision'],text:'狩人の足跡を学び、一歩先を読んだ'},
  study:{tags:['study','combat','patience'],text:'指南書と稽古で、構えの意味を学んだ'},
  read:{tags:['read','patience','rhythm'],text:'書物を読み、繰り返す形に気づいた'},
  pray:{tags:['pray','rest','patience'],text:'祈りの間、息と静けさを確かめた'}
 };
 const names={bell:'鈴',stone:'小石',feather:'羽根',charcoal:'炭の欠片',net:'糸の網'};
 const legacyTags={heavy:['weight','craft'],light:['light','explore'],blade:['combat','precision'],unarmed:['combat','rhythm'],shield:['patience','combat'],church:['rest','patience'],magic:['patience','rhythm']};
 const identity=p=>p.id+':'+p.gen+':'+p.appearanceSeed;
 function prepare(sim,p) {
  if(!p.skillLife) { p.skillLife=BloodlineSkills.create(sim.seed,identity(p));p.skillLife.sampleAt=sim.time;p.skillLife.equipmentSeen.push(p.weapon+':'+p.armor+':'+p.shield); }
  p.skillLifeNotice??='';
 }
 function restore(sim,p) {
  const raw=p.skillLife;p.skillLifeNotice='';
  if(raw&&(raw.version!==1||!Array.isArray(raw.journal)||!Array.isArray(raw.discovered)||typeof raw.experience!=='object')){p.skillLifeBackup??={raw:JSON.parse(JSON.stringify(raw)),reason:'invalid-skill-extension'};p.skillLifeNotice='技の記憶を修復しました。元の記録は別に保管しています。';}
  p.skillLife=BloodlineSkills.restore(raw,sim.seed,identity(p));
  p.skillLife.discovered=p.skillLife.discovered.filter(d=>BL_SKILL_CATALOG.byId.get(d.id)?.key===d.key&&(p.skills.includes(d.id)||p.passives.includes(d.id)));
  p.skillLife.unread=p.skillLife.unread.filter(id=>p.skills.includes(id)||p.passives.includes(id));
  reset(p);
 }
 function reset(p) { p.skillLink=null;p.skillCast=null;p.skillExit=null; }
 function withMemento(p,event) {
  const held=(p.inventory||[]).filter(id=>names[id]);if(!held.length)return event;
  const id=held[p.skillLife.serial%held.length];
  return {...event,tags:[...event.tags,id,'memory'],text:event.text+'。手元には'+names[id]+'があった'};
 }
 function record(sim,p,event) {
  if(!p?.alive)return;prepare(sim,p);
  const inherited=[...new Set((p.inherit||[]).flatMap(id=>BL_SKILL_CATALOG.byId.get(id)?.tags||legacyTags[skillById(id)?.school]||['combat']))];
  // A witnessed defeat influences a future idea, never grants the parent's technique.
  const ancestor=sim.legacy(p.owner).records.findLast(r=>(p.inherit||[]).includes(r.skill));
  if(ancestor?.skillHistory?.defeat)inherited.push('tension','patience');
  const serial=p.skillLife.serial;
  const d=BL_SKILL_CATALOG.observe(p.skillLife,{...event,at:sim.time},{age:p.age,prologue:p.prologue,known:[...p.skills,...p.passives],weapon:p.weapon,shield:p.shield,lost:Object.entries(p.wounds||{}).filter(([,v])=>v.severity==='lost').map(([k])=>k),inheritedTags:inherited});
  if(d)sim.learn(p,d.id);
  else if(p.skillLife.serial!==serial&&!p.prologue&&p.age>=4&&!p.autoFight) {
   const glimpse=BloodlineSkills.glimpse(p.skillLife,sim.time);
   if(glimpse)sim.emit('skillglimpse',{player:p.id,room:p.room,x:p.x,z:p.z,...glimpse});
  }
 }
 function onEvent(sim,e) {
  const p=sim.players.get(e.player||e.source);if(!p)return;
  prepare(sim,p);
  if(['insight','passive'].includes(e.type)) { e.discovery=p.skillLife.discovered.find(d=>d.id===e.id);return; }
  if(['wound','death','clash','depart','returned','released','sit'].includes(e.type))reset(p);
  if(!p.alive)return;
  let event=null;
  if(e.type==='progress'&&activities[p.activity])event={kind:p.activity,context:'work:'+p.activity,...activities[p.activity]};
  if(e.type==='pickup'&&names[e.item]) {
   const origin=e.gift?'family':'found',text=(e.gift?'家族から受け取った':'道で拾った')+names[e.item];
   // First provenance stays intact after discard/reacquisition and holding in later activities.
   p.skillLife.memories[e.item]??={origin,text,at:sim.time};
   event={kind:'memento',context:'pickup:'+e.item,tags:[e.item,'memory',...(e.gift?['family']:['explore'])],text,memento:e.item,origin};
  }
  if(e.type==='mother'&&p.prologue)event={kind:'family',context:'family:mother',tags:['family','patience'],text:'腕の中で、母の声を聞いた'};
  if(e.type==='equipped'&&!p.skillLife.equipmentSeen.includes(p.weapon+':'+p.armor+':'+p.shield)){p.skillLife.equipmentSeen.push(p.weapon+':'+p.armor+':'+p.shield);event={kind:'equipment',context:'gear:'+p.weapon+':'+p.armor+':'+p.shield,tags:['weapon','care',...(p.weapon===2||p.armor===2?['weight']:['precision'])],text:'武具棚で身支度を変え、重心を確かめた'};}
  if(e.type==='hit'&&e.source===p.id) {
   const def=BL_SKILL_CATALOG.byId.get(e.skill),target=sim.getRoom(p)?.actors.find(a=>a.id===e.target);
   if(target)event={kind:'contact',context:'contact:'+target.kind,tags:['combat','rhythm',...(target.kind==='dummy'?['patience']:['tension','weight'])],text:target.kind==='dummy'?'稽古人形に打ち込み、当たる拍子を確かめた':'敵に打ち込み、押し合う重みを知った'};
  }
  if(e.type==='wound'&&e.severity!=='fatal')event={kind:'setback',context:'combat:wound',tags:['combat','tension','defeat'],text:'傷を負い、攻め終わりの隙を思い知った'};
  if(e.type==='clash')event={kind:'clash',context:'combat:clash',tags:['combat','weight','tension'],text:'敵とぶつかり、踏みとどまる重みを知った'};
  if(e.type==='kill')event={kind:'victory',context:'combat:win',tags:['combat','precision'],text:'敵を倒し、最後の間合いを覚えた'};
  if(e.type==='landed'&&e.profile===1)event={kind:'traversal',context:'traversal:'+e.room+':'+(e.obstacle||'ledge'),tags:['light','precision'],text:e.kind==='vault'?'低い障害物を飛び越え、着地の拍子を覚えた':'縁に手をかけてよじ登り、体を支える足運びを覚えた'};
  if(e.type==='returned')event={kind:'return',context:'journey:return',tags:['explore','rest','tension'],text:'最前線から帰り、村の静けさを知った'};
  if(event)record(sim,p,withMemento(p,event));
 }
 function contact(sim,p,target,sk) {
  const def=BL_SKILL_CATALOG.byId.get(sk.id);if(!def)return;
  // Called after the original damage / reaction resolution, never on a miss or guard.
  if(target.alive&&sk.stagger&&target.kind!=='boss') {
   target.stun=Math.max(target.stun,sim.time+sk.stagger/(target.elite?1.65:1));
   target.actionUntil=Math.max(target.actionUntil,target.stun);target.telegraph=null;
  }
  const cast=p.skillCast;
  if(cast?.linked&&cast.id===def.id&&cast.target===target.id&&!cast.announced) {
   cast.announced=true;const key=cast.from+':'+def.id;
   p.skillLife.connections[key]=Math.min(10000,(p.skillLife.connections[key]||0)+1);
   const first=p.skillLife.connections[key]===1,signal=first?'discovery':sim.time-(p.skillConnectionAt??-100)>=6?'echo':'quiet';
   if(signal!=='quiet')p.skillConnectionAt=sim.time;
   sim.emit('skillconnection',{player:p.id,room:p.room,id:def.id,from:cast.from,target:target.id,x:target.x,z:target.z,dir:p.dir,connectionKind:cast.connectionKind,first,signal});
  }
  if(!target.alive){p.skillExit=null;return;}
  const tags=def.exit.filter(tag=>tag!=='offbalance'||target.kind==='dummy'||target.stun>sim.time||target.exposedUntil>sim.time).filter(tag=>tag!=='close'||dist(target,p)<=2.4);
  p.skillExit={id:def.id,target:target.id,tags,until:sim.time+5,band:p.combo?.band??0};
 }
 function sample(sim,p) {
  const s=p.skillLife;if(p.prologue||p.age<4||sim.time<s.sampleAt)return;
  s.sampleAt=sim.time+5;
  const moved=s.sampleX!==null&&Math.hypot(p.x-s.sampleX,p.z-s.sampleZ)>3;
  s.sampleX=p.x;s.sampleZ=p.z;
  if(p.activity)return;
  if(moved&&!p.autoFight) {
   const region=p.room+':'+(p.z<-28?'outskirts':sim.getArea(p)),fresh=!s.seenRegions.includes(region);
   if(fresh)s.seenRegions.push(region);if(s.seenRegions.length>96)s.seenRegions.shift();
   record(sim,p,withMemento(p,{kind:'explore',context:'walk:'+region,tags:['explore','light',...(fresh?['precision']:[])],text:fresh?'歩いて、新しい場所の間合いを覚えた':'歩き慣れた道の、足の運びを確かめた'}));
  } else if(p.seated&&sim.time-p.lastExertion<35)record(sim,p,withMemento(p,{kind:'rest',context:'rest:'+sim.getArea(p),tags:['rest','patience'],text:'動いたあとに腰を下ろし、息を整えた'}));
 }
 function prepareCast(sim,p,sk) {
  p.skillCast=null;
  const d=BL_SKILL_CATALOG.byId.get(sk.id);if(!d){p.skillLink=null;return sk;}
  const target=sim.getRoom(p)?.actors.find(e=>e.id===p.autoFight&&e.alive),link=p.skillLink;p.skillLink=null;
  if(!target||dist(target,p)>sk.reach+.8||!BloodlineSkills.connection(d,link,target.id,sim.time,p.combo?.band??0))return sk;
  if(d.entry.includes('offbalance')&&link.tags.includes('offbalance')&&target.kind!=='dummy'&&!(target.stun>sim.time||target.exposedUntil>sim.time))return sk;
  const bonus=d.connection||{},cast={id:sk.id,from:link.id,linked:true,target:target.id,announced:false,connectionKind:d.entry.find(tag=>link.tags.includes(tag))};
  for(const key of ['charge','recovery','cost'])if(bonus[key]!==undefined)cast[key]=sk[key]*bonus[key];
  for(const key of ['reach','breakPower','knockback','tracking'])if(bonus[key]!==undefined)cast[key]=(sk[key]||0)+bonus[key];
  p.skillCast=cast;return {...sk,...cast};
 }
 function active(p,id) { const sk=skillById(id);return sk&&p.skillCast?.id===id?{...sk,...p.skillCast}:sk; }
 function complete(sim,p) {
  p.skillLink=p.skillExit&&p.skillExit.id===p.currentSkill?p.skillExit:null;p.skillExit=null;
 }
 function remember(p) {
  return {revision:BloodlineSkills.REVISION,defeat:p.cause!=='寿命'&&!!p.cause,families:[...new Set(p.skillLife.discovered.map(d=>d.family))],discoveries:p.skillLife.discovered.slice(-8).map(d=>({id:d.id,reasons:d.reasons,route:d.route})),connections:{...p.skillLife.connections},signature:Object.entries(p.skillUses||{}).filter(([id,n])=>Number.isFinite(n)&&n>0&&skillById(+id)&&!skillById(+id).passive).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0])).slice(0,3).map(([id])=>Number(id))};
 }
 return {prepare,restore,reset,record,onEvent,contact,sample,prepareCast,active,complete,remember};
})();
