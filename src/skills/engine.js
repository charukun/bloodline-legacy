/* Event-driven life experience. Uses its own saved RNG; never the combat/world RNG. */
const BloodlineSkills = (() => {
 'use strict';
 const REVISION = 3, MAX_JOURNAL = 96, MAX_CONTEXTS = 192;
 const ACTIVE_PACING = Object.freeze({gain:.4,threshold:3.65,perKnown:.25,maxThreshold:9.5,cooldown:105,perKnownSeconds:15,maxCooldown:300,cost:4.6,perKnownCost:.35});
 const TAGS = new Set(['weight','rhythm','craft','care','patience','play','light','explore','track','precision','combat','tension','observe','rest','study','pray','read','memory','bell','feather','stone','charcoal','net','cross','family','defeat','weapon']);
 const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
 const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
 const list = v => Array.isArray(v) ? v : [];
 const validTags = v => [...new Set(list(v).filter(t => TAGS.has(t)))];
 function hash(value) { let h=2166136261; for (const c of String(value)) { h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0||1; }
 function next(state) { let x=state.rng>>>0; x^=x<<13; x^=x>>>17; x^=x<<5; state.rng=x>>>0||1; return state.rng/4294967296; }
 function pick(items, weight, state) {
  const weights=items.map(d=>Math.max(0,finite(weight(d)))), total=weights.reduce((a,b)=>a+b,0);
  if (!total) return null;
  let n=next(state)*total;
  for(let i=0;i<items.length;i++) { n-=weights[i]; if(n<0) return items[i]; }
  return items.at(-1);
 }
 function create(seed, life) {
  return {version:1,revision:REVISION,life:String(life),lifeSeed:hash(seed+':'+life),rng:hash(seed+':'+life),experience:{},recent:{},contexts:{},acceptedAt:{},journal:[],discovered:[],memories:{},charge:0,lastDiscovery:-100,lastOpportunity:-100,activeInspiration:{charge:0,lastDiscovery:-100,rng:hash(seed+':'+life+':active')},lastEvent:-100,serial:0,unread:[],seenRegions:[],sampleAt:0,sampleX:null,sampleZ:null,connections:{},equipmentSeen:[],inheritedTags:[],inspiration:{route:null,sourceSerials:[]}};
 }
 function restore(raw,seed,life) {
  const s=create(seed,life);
  if(!raw || raw.version!==1) return s;
  s.lifeSeed=Number.isInteger(raw.lifeSeed)&&raw.lifeSeed>0?raw.lifeSeed>>>0:s.lifeSeed;
  s.rng=Number.isInteger(raw.rng)&&raw.rng>0?raw.rng>>>0:s.rng;
  for(const field of ['experience','recent']) for(const [k,v] of Object.entries(object(raw[field]))) if(TAGS.has(k)&&Number.isFinite(v)&&v>=0) s[field][k]=Math.min(v,10000);
  for(const field of ['contexts','acceptedAt']) s[field]=Object.fromEntries(Object.entries(object(raw[field])).filter(([k,v])=>k.length<120&&Number.isFinite(v)&&v>=0).slice(-MAX_CONTEXTS));
  s.journal=list(raw.journal).filter(e=>e&&Number.isFinite(e.at)&&Array.isArray(e.tags)&&typeof e.text==='string').slice(-MAX_JOURNAL).map(e=>({at:e.at,serial:finite(e.serial),kind:String(e.kind).slice(0,32),context:String(e.context).slice(0,110),tags:validTags(e.tags),text:e.text.slice(0,180)}));
  s.discovered=list(raw.discovered).filter(e=>e&&Number.isInteger(e.id)&&typeof e.key==='string').slice(-1024).map(e=>({id:e.id,key:e.key.slice(0,100),family:String(e.family||'').slice(0,64),at:finite(e.at),trigger:finite(e.trigger),route:['main','cross','deviation'].includes(e.route)?e.route:'main',reasons:list(e.reasons).slice(0,4).map(x=>String(x).slice(0,180)),tags:validTags(e.tags),sourceSerials:list(e.sourceSerials).filter(Number.isInteger).slice(0,4)}));
  s.unread=[...new Set(list(raw.unread).filter(Number.isInteger))].slice(-1024);
  for(const [k,m] of Object.entries(object(raw.memories))) if(TAGS.has(k)&&m&&typeof m.text==='string') s.memories[k]={text:m.text.slice(0,180),at:finite(m.at),origin:m.origin==='family'?'family':'found'};
  for(const k of ['charge','lastDiscovery','lastEvent','serial','sampleAt']) s[k]=finite(raw[k],s[k]);
  s.charge=Math.max(0,Math.min(s.charge,12));s.serial=Math.max(0,Math.floor(s.serial));
  s.lastOpportunity=finite(raw.lastOpportunity,s.lastDiscovery);
  const active=object(raw.activeInspiration);
  s.activeInspiration={charge:Math.max(0,Math.min(finite(active.charge,s.charge*ACTIVE_PACING.gain),12)),lastDiscovery:finite(active.lastDiscovery,s.lastDiscovery),rng:Number.isInteger(active.rng)&&active.rng>0?active.rng>>>0:hash(s.lifeSeed+':active')};
  for(const k of ['sampleX','sampleZ']) s[k]=Number.isFinite(raw[k])?raw[k]:null;
  s.seenRegions=list(raw.seenRegions).filter(x=>typeof x==='string').slice(-96);
  s.inheritedTags=validTags(raw.inheritedTags).slice(0,6);s.equipmentSeen=list(raw.equipmentSeen).filter(x=>typeof x==='string').slice(0,64);
  s.connections=Object.fromEntries(Object.entries(object(raw.connections)).filter(([k,v])=>/^\d+:\d+$/.test(k)&&Number.isFinite(v)&&v>0).slice(-256).map(([k,v])=>[k,Math.min(10000,v)]));
  s.inspiration={route:['main','cross','deviation'].includes(raw.inspiration?.route)?raw.inspiration.route:null,sourceSerials:list(raw.inspiration?.sourceSerials).filter(Number.isInteger).slice(0,4)};
  return s;
 }
 // A crossing needs distinct kinds of experience, not two tags emitted by one task.
 function witnesses(def,state) {
  const groups=def.requiresExperience;
  const memories=Object.entries(state.memories).map(([tag,m])=>({...m,kind:'memento',tags:[tag,'memory'],serial:0}));
  const choices=groups.map(group=>[...state.journal].reverse().concat(memories).filter(r=>r.tags.some(t=>group.includes(t))));
  if(choices.some(xs=>!xs.length)) return [];
  if(groups.length===1) return [choices[0][0]];
  for(const first of choices[0]) {
   const result=[first];
   for(const xs of choices.slice(1)) {
    const found=xs.find(r=>result.every(other=>r.kind!==other.kind));
    if(found) result.push(found);
   }
   if(result.length===groups.length) return result;
  }
  return [];
 }
 class Catalog {
  constructor(defs) {
   this.defs=defs;this.byId=new Map();this.byKey=new Map();this.families=new Map();this.index=new Map();this.metrics={events:0,evaluated:0,pools:0};
   for(const d of defs) {
    if(this.byId.has(d.id)||this.byKey.has(d.key)) throw Error('Duplicate skill identity');
    this.byId.set(d.id,d);this.byKey.set(d.key,d);
    if(!this.families.has(d.family)) this.families.set(d.family,[]);
    this.families.get(d.family).push(d);
    for(const tag of new Set(d.requiresExperience.flat())) { if(!this.index.has(tag))this.index.set(tag,new Set());this.index.get(tag).add(d.family); }
   }
  }
  search(text,locale='ja',limit=30) { const q=String(text).toLowerCase().slice(0,100);return this.defs.filter(d=>(d.names[locale]||d.names.ja).toLowerCase().includes(q)||d.key.includes(q)).slice(0,Math.max(0,Math.min(100,limit))); }
  pool(state,event,context={}) {
   const families=new Set();
   for(const tag of event.tags) for(const family of this.index.get(tag)||[]) families.add(family);
   const learned=new Set([...(context.known||[]),...state.discovered.map(d=>d.id)]),result=[];
   for(const family of families) {
    const variants=[];
    for(const d of this.families.get(family)) {
     this.metrics.evaluated++;
     if(learned.has(d.id)||!d.requiresExperience.every(group=>group.some(t=>(state.experience[t]||0)>=(state.memories[t]?1:1.25))))continue;
     if(d.action?.school==='shield'&&!context.shield||d.action?.weapon>=0&&d.action.weapon!==context.weapon||(d.action?.requires||[]).some(part=>context.lost?.includes(part)))continue;
     const proof=witnesses(d,state);if(!proof.length)continue;
     variants.push({def:d,proof});
    }
    if(variants.length)result.push({family,variants});
   }
   this.metrics.pools++;return result;
  }
  observe(state,event,context={}) {
   this.metrics.events++;
   const at=finite(event.at),tags=validTags(event.tags),key=String(event.context||event.kind).slice(0,110);
   if(!tags.length||typeof event.text!=='string'||at<state.lastEvent)return null;
   if(at-(state.acceptedAt[key]??-100)<3.8)return null;
   const n=state.contexts[key]||0,gain=Math.max(.06,1/Math.sqrt(1+n*.8));
   state.contexts[key]=n+1;state.acceptedAt[key]=at;
   for(const field of ['contexts','acceptedAt']) { const keys=Object.keys(state[field]);if(keys.length>MAX_CONTEXTS)delete state[field][keys[0]]; }
   for(const tag of Object.keys(state.recent))state.recent[tag]*=.89;
   for(const tag of tags){state.experience[tag]=Math.min(10000,(state.experience[tag]||0)+gain);state.recent[tag]=Math.min(12,(state.recent[tag]||0)+gain);}
   // Inspiration matures from accepted experience; it is not XP or a level-up currency.
   const inspirationGain=.35+.5*gain;
   state.lastEvent=at;state.serial++;state.charge=Math.min(12,state.charge+inspirationGain);
   const active=state.activeInspiration;active.charge=Math.min(12,active.charge+inspirationGain*ACTIVE_PACING.gain);
   const record={at,kind:String(event.kind),context:key,tags,text:event.text.slice(0,180),serial:state.serial};
   state.journal.push(record);if(state.journal.length>MAX_JOURNAL)state.journal.shift();
   if(event.memento&&TAGS.has(event.memento)&&!state.memories[event.memento])state.memories[event.memento]={text:record.text,at,origin:event.origin||'found'};
   state.inheritedTags=validTags(context.inheritedTags).slice(0,6);
   if(context.age<4||context.prologue||state.charge<3.65||at-state.lastOpportunity<30)return null;
   const pool=this.pool(state,{...event,tags},context);if(!pool.length)return null;
   const chance=Math.min(.92,.24+Math.max(0,state.charge-3.65)*.14+Math.max(0,at-state.lastOpportunity-90)*.001);
   if(next(state)>chance)return null;
   const recentFamilies=state.discovered.slice(-5).map(d=>d.family);
   const routeFor=v=>v.def.requiresExperience.length>1?'cross':v.def.tags.some(t=>tags.includes(t)&&!['memory','patience','rhythm'].includes(t))?'main':'deviation';
   const familyWeight=f=>{
    const d=f.variants[0].def,basis=d.requiresExperience.flat(),route=routeFor(f.variants[0]);
    const focus=basis.reduce((n,t)=>n+(state.recent[t]||0),0)/basis.length,history=basis.reduce((n,t)=>n+Math.sqrt(state.experience[t]||0),0)/basis.length;
    const inherited=basis.some(t=>state.inheritedTags.includes(t))?1+Math.min(.35,d.inheritance?.bias??.22):1;
    const affinity=(d.affinities||[]).some(t=>(state.experience[t]||0)>1)?1.25:1;
    const lifeBias=.7+(hash(state.lifeSeed+':'+f.family)%1000)/1000*.6;
    const familiar=1/(1+recentFamilies.filter(x=>x===f.family).length*.6);
    return d.rarity*(.55+focus*.35+history*.1)*({main:1,cross:1.7,deviation:.28}[route])*inherited*familiar*affinity*lifeBias;
   };
   let family=pick(pool,familyWeight,state);if(!family)return null;
   const phases=new Set([0,...(context.known||[]).map(id=>this.byId.get(id)).filter(d=>d&&!d.passive).map(d=>d.phase)]);
   const variantWeight=v=>(!v.def.passive&&!phases.has(v.def.phase)?1.5:1)*v.def.rarity;
   let selected=pick(family.variants,variantWeight,state);
   // Preserve the original opportunity cadence and mixed pool for passives.
   // A still-maturing active idea spends this opportunity, never grants a passive instead.
   state.lastOpportunity=at;state.charge=Math.max(0,state.charge-4.6);
   if(!selected.def.passive){
    const known=new Set([...(context.known||[]),...state.discovered.map(d=>d.id)]),count=[...known].filter(id=>{const d=this.byId.get(id);return d&&!d.passive;}).length;
    const threshold=Math.min(ACTIVE_PACING.maxThreshold,ACTIVE_PACING.threshold+count*ACTIVE_PACING.perKnown),interval=Math.min(ACTIVE_PACING.maxCooldown,ACTIVE_PACING.cooldown+count*ACTIVE_PACING.perKnownSeconds);
    if(active.charge<threshold||at-active.lastDiscovery<interval)return null;
    const lastFamily=state.discovered.findLast(d=>!this.byId.get(d.id)?.passive)?.family;
    const activePool=pool.map(f=>({...f,variants:f.variants.filter(v=>!v.def.passive)})).filter(f=>f.variants.length);
    family=pick(activePool,f=>familyWeight(f)*(routeFor(f.variants[0])==='cross'?1.6:1)*(f.family===lastFamily?.35:1),active);
    selected=pick(family.variants,variantWeight,active);
    active.charge=Math.max(0,active.charge-ACTIVE_PACING.cost-count*ACTIVE_PACING.perKnownCost);active.lastDiscovery=at;
   }
   const d=selected.def;
   const proof=[...selected.proof];
   for(const tag of tags)if(state.memories[tag]&&proof.length<3&&!proof.some(r=>r.text===state.memories[tag].text))proof.push({...state.memories[tag],serial:0});
   const discovery={id:d.id,key:d.key,family:d.family,at,reasons:[...new Set(proof.map(r=>r.text))],trigger:record.serial,tags:[...d.tags],route:routeFor(selected),sourceSerials:proof.map(r=>r.serial).filter(Boolean)};
   state.discovered.push(discovery);state.unread.push(d.id);state.lastDiscovery=at;
   state.inspiration={route:discovery.route,sourceSerials:discovery.sourceSerials};return discovery;
  }
 }
 function connection(def,link,target,time,band) { return !!(def&&link&&link.target===target&&link.until>=time&&link.band<band&&def.entry.some(tag=>link.tags.includes(tag))); }
 return {Catalog,create,restore,hash,next,connection,witnesses,REVISION};
})();
