// Stable, curated variation generation. Array order never defines runtime identity.
import {SkillComposition,createSkillComposition} from '../src/skills/composition.mjs';
export function catalogProgram(data){
 const authored=compileCatalog(data,{composed:false});
 return `const SkillComposition=(${createSkillComposition.toString()})();\nconst BL_SKILL_DEFINITIONS=${JSON.stringify(authored)};\nBL_SKILL_DEFINITIONS.push(...SkillComposition.expand(BL_SKILL_DEFINITIONS));\n`;
}
export function compileCatalog(data,{composed=true}={}){
 const result=[];
 for(const f of data.families){for(const v of f.variants){
  const a={...f.action,...v.action};
  const s={...f,...v,id:v.id,key:`bl.skill.${f.key}.${v.key}`,family:f.key,phase:v.phase??0,action:a,tags:[...new Set([...(f.tags||[]),...(v.tags||[])])],names:{ja:v.ja,en:v.en},descriptions:{ja:v.desc,en:v.descEn},entry:v.entry||[],exit:v.exit||[],rarity:v.rarity??f.rarity??1,requiresExperience:v.requiresExperience||f.requiresExperience};
  delete s.variants;result.push(s);
 }}
 for(const p of data.passives)result.push({...p,key:`bl.skill.${p.key}`,family:p.key,phase:0,passive:true,entry:[],exit:[],names:{ja:p.ja,en:p.en},descriptions:{ja:p.desc,en:p.descEn},rarity:p.rarity??.8});
 if(composed)result.push(...SkillComposition.expand(result));
 validateCatalog(result);return result;
}
export function validateCatalog(defs){
 const ids=new Set(),keys=new Set();
 const motions=new Set(['slam','double','thrust','cross','slide','kick','spin','zigzag','slash','counter','leap']);
 for(const d of defs){
  if(!Number.isSafeInteger(d.id)||d.id<60000||ids.has(d.id)||keys.has(d.key))throw Error('Duplicate/invalid skill identity '+d.key);
  ids.add(d.id);keys.add(d.key);
  if(typeof d.key!=='string'||!d.key.startsWith('bl.skill.')||!d.names?.ja||!d.names?.en||!d.descriptions?.ja||!d.descriptions?.en||!d.requiresExperience?.length||!Number.isFinite(d.rarity)||d.rarity<=0||d.rarity>4)throw Error('Incomplete skill '+d.key);
  if(!Array.isArray(d.requiresExperience)||d.requiresExperience.some(g=>!Array.isArray(g)||!g.length||g.some(t=>typeof t!=='string'))||!Array.isArray(d.entry)||!Array.isArray(d.exit)||!Array.isArray(d.tags))throw Error('Invalid tags or conditions '+d.key);
  for(const [key,value] of Object.entries(d.connection||{})){const bounds={charge:[.5,1],recovery:[.5,1],cost:[.6,1],reach:[0,.5],tracking:[0,1],knockback:[0,.5],breakPower:[0,.5]}[key];if(!bounds||!Number.isFinite(value)||value<bounds[0]||value>bounds[1])throw Error('Invalid connection '+d.key);}
  if(![0,1,2].includes(d.phase))throw Error('Invalid sequence phase');
  if(d.composition){
   if(SkillComposition.id(d.composition)!==d.id)throw Error('Unstable composition identity');
   const a=d.action,cuts=a.beatCuts;
   if(!Array.isArray(cuts)||cuts.length!==a.hits+1||cuts[0]!==0||cuts.at(-1)!==1||cuts.some((n,i)=>!Number.isFinite(n)||(i&&n-cuts[i-1]<.2)))throw Error('Invalid beat timeline');
   for(const step of [a.approach,a.finishStep])if(!step||!Number.isFinite(step.distance)||step.distance<0||step.distance>2.25||!Number.isFinite(step.angle)||Math.abs(step.angle)>Math.PI)throw Error('Invalid composed step');
   if(!Number.isFinite(a.approach.turn)||a.approach.turn<0||a.approach.turn>1)throw Error('Invalid approach turn');
  }
  for(const key of ['stagger','knockback','tracking'])if(d.action?.[key]!==undefined&&(!Number.isFinite(d.action[key])||d.action[key]<0||d.action[key]>1.5))throw Error('Invalid motion effect '+d.key);
  if(!d.passive){for(const k of ['cost','charge','swing','recovery','reach','arc','power'])if(!Number.isFinite(d.action[k])||d.action[k]<0)throw Error('Invalid '+k+' '+d.key);
   if(!motions.has(d.action.anim)||!Number.isInteger(d.action.hits)||d.action.hits<1||!Number.isFinite(d.action.fatigue)||d.action.fatigue<0||(d.action.breakPower!==undefined&&!Number.isFinite(d.action.breakPower))||d.action.breakPower<0||d.action.cost<3||d.action.hits>4||d.action.reach>4||d.action.power>2.5||d.action.breakPower>3.2)throw Error('Action outside reviewed envelope '+d.key);
  }else if(!['regen','capRegen','clash','heavyCost','faith'].includes(d.effect)||!Number.isFinite(d.value)||d.value<0||d.value>({regen:1,capRegen:.25,clash:.15,heavyCost:.2,faith:2}[d.effect]??0))throw Error('Unknown passive operator');
 }
 return true;
}
