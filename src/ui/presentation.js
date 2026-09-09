/* Read-only presentation models. Gameplay eligibility remains in Simulation.command. */
const UIValue = {
 text(node, value) { const next = String(value ?? ''); if (node && node.textContent !== next) node.textContent = next; },
 html(node, value) { if (node && node.innerHTML !== value) node.innerHTML = value; },
 attr(node, name, value) { const next = String(value); if (node && node.getAttribute(name) !== next) node.setAttribute(name, next); },
 style(node, name, value) { if (node && node.style[name] !== value) node.style[name] = value; }
};
// The same leaf seal marks a choice throughout the game; controls expose state via ARIA.
function uiSelectionSeal(active){return `<span class="selection-seal${active?' lit':''}" aria-hidden="true">${icon('leaf')}</span>`;}
function uiCondition(p, t) {
 const wounds = Object.values(p.wounds || {}), health = p.health ?? 100;
 if (!p.alive) return {text:'命の終わり', tone:'hurt'};
 if (health < 28) return {text:'危篤', tone:'hurt'};
 if (wounds.some(w => w.severity === 'heavy')) return {text:'重傷', tone:'hurt'};
 if (wounds.some(w => w.severity === 'lost')) return {text:'欠損あり', tone:'hurt'};
 if (health < 60 || wounds.some(w => w.severity === 'light')) return {text:'負傷', tone:'warn'};
 if (Object.values(p.statuses || {}).some(s => s.until > t)) return {text:'不調', tone:'status'};
 if (p.seated) return {text:'休息', tone:'well'};
 return {text:p.stamina < 15 ? '疲労' : '良好', tone:p.stamina < 15 ? 'warn' : 'well'};
}
function uiEquipmentNote(p, nearRack) {
 return p.age < EQUIP_AGE ? '武具は7歳から' : !nearRack ? '着替えは武具棚のそばで' : '武具棚で着替えられる';
}
function uiPickup(item, p) {
 const name = ITEMS[item.item]?.name || '品物', full = p.inventory.length >= MAX_ITEMS;
 return {id:'pickup', value:item.id, name:full ? '手荷物が満杯' : '拾う', detail:name, glyph:'hand', disabled:full};
}
function uiActiveStatuses(p, t) {
 return Object.entries(p.statuses || {}).filter(([id, s]) => STATUS_DEFS[id] && s.until > t)
  .map(([id]) => STATUS_DEFS[id].name).join('・');
}
function uiJourneyHints(s){
 const p=s?.player;if(!p)return [];
 const hint=(id,glyph,title,text)=>({id,glyph,title,text});
 if(!p.alive)return [hint('death','leaf','この人生を振り返る','旅の終わりを確かめたら、次の世代へ残す技を選ぼう。')];
 if(incapacitated(p))return [hint('rescue','heart','助けを待とう',p.lifeState==='carried'?'安全な場所へ運んでもらっている。着いたら身体を休めよう。':'今は動けない。救助を待ち、安全な場所で回復しよう。')];
 if(p.prologue)return [hint('carried','hand','お母さんと村を歩こう','指を動かして行き先を伝えよう。さっと払うと走り、地面を触ると止まる。'),hint('tour','book','気になる建物へ','扉や設備の前へ行くと、お母さんが使い方を教えてくれるよ。')];
 const out=[],outside=s.room.kind==='front'||p.z<-26;
 const threat=s.actors.some(a=>a.alive&&enemiesOnly(a)&&!a.neutral&&dist(a,p)<10);
 if((outside||threat)&&p.age<15)out.push(hint('young','shield','村へ戻ろう','まだ身体が小さい。敵から離れて衛兵の後ろへ。村の人形や指南書で学ぼう。'));
 else if(threat&&((p.health??100)<45||p.stamina<20))out.push(hint('retreat','shield','まず距離をとろう','敵のそばで休むのは危険。衛兵や安全な場所まで下がろう。'));
 if(p.stamina<30||p.staminaCap<(p.staminaMax||100)*.65)out.push(hint('rest','rest',p.seated?'そのまま、ひと息':'座って息を整えよう','安全な地面を長押しすると座れる。減った息と、疲れた身体の余裕が戻る。'));
 const wounds=Object.values(p.wounds||{});
 if(wounds.some(w=>w.severity!=='lost')||(p.health??100)<90)out.push(hint('wounds','heart','傷を休ませよう','戦いから離れて座ると、負傷の回復も早くなる。傷ついた部位は身支度で確かめよう。'));
 if(p.rescueTarget)out.push(hint('carry','hand','安全な場所へ運ぼう',s.room.kind==='village'?'村の門の内側まで運び、そこで降ろしてあげよう。':'岸辺の帰還地点まで運び、そこで降ろしてあげよう。'));
 if(p.skillLife?.unread?.length)out.push(hint('discovery','spark','新しい技が芽生えた','意識を開き、気になる技の印を灯してみよう。'));
 if(s.room.kind==='village'){
  const school=nearbyActivity(p,{...s.room,map:s.map});
  if(school){const station=facilityStation(school);out.push(hint('station','book',ACTIVITY_DEFS[school.id].label,p.activity?'続けているうちに、新しい気づきが生まれる。歩くと中断できる。':`${station.name}の前に立っている。足元の「${ACTIVITY_DEFS[school.id].label}」を選ぼう。`));}
  if(p.age>=EQUIP_AGE&&p.weapon<0)out.push(hint('gear','sword','身体に合う武具を','武器庫の外にある武具棚の前へ。借りる武器で、使える技も変わる。'));
  out.push(hint('learn','book','道場でひとつ、覚えよう','道場の書見台で指南書を読もう。かかしのそばでは身体を使って稽古もできる。'));
  out.push(hint('pray','sun','静かに祈ってみよう','教会の扉の前で祈れる。重ねた祈りは、信仰の心得につながる。'));
 }else out.push(hint('front','shield','ひとりで囲まれないように','衛兵や仲間のそばで戦おう。背後の敵にも気を配り、疲れたら下がろう。'));
 return out.slice(0,3);
}
/* Six bounded part pulses and one pain callout; never modifies player speech,
 * chat cooldown, wounds or saves. The confirmed wound event owns all timing. */
class UIDamageFeedback {
 constructor(){this.reset();}
 reset(){this.parts=new Map();this.bark=null;this.nextBark=-Infinity;this.seq=-1;this.variant=0;}
 hit(e,t){
  if(e.type!=='wound'||!BODY_PARTS.includes(e.part)||e.seq!=null&&e.seq<=this.seq)return;
  if(e.seq!=null)this.seq=e.seq;
  const level=({light:1,heavy:2,lost:3,fatal:4})[e.severity];if(!level)return;
  const old=this.parts.get(e.part),life=level>1?.95:.62;
  // A contact cluster holds a single peak, avoiding strobing on rapid repeats.
  const born=old&&t-old.born<.22?old.born:t;
  this.parts.set(e.part,{born,until:t+life,life,level:Math.max(level,old&&t<old.until?old.level:0),upgraded:!!e.upgraded});
  const louder=level>(this.bark?.level||0);
  if(t>=this.nextBark||louder){
   const lines=level===1?['っ！','くっ…！']:level===2?['ぐっ…！','うっ…！']:['ぐあっ！','ああっ！'];
   this.bark={text:lines[this.variant++%lines.length],until:t+(level>1?.95:.65),level};this.nextBark=t+1.15;
  }
 }
 paint(root,t){
  if(!root)return;
  for(const node of root.querySelectorAll('[data-part]')){
   const v=this.parts.get(node.dataset.part);
   if(!v||t>=v.until||t<v.born){if(v)this.parts.delete(node.dataset.part);node.removeAttribute('data-impact');node.style.removeProperty('--hit-pulse');continue;}
   const fade=clamp((v.until-t)/v.life,0,1),pulse=(fade*fade).toFixed(2);
   UIValue.attr(node,'data-impact',v.level>1&&v.upgraded?'injury':'hit');
   if(node.style.getPropertyValue('--hit-pulse')!==pulse)node.style.setProperty('--hit-pulse',pulse);
  }
 }
}
/* One visible notice, bounded pending queue. Life events preempt small discoveries. */
class UINoticeQueue {
 constructor() { this.active = null; this.pending = []; }
 enqueue(notice, now) {
  const same = this.active?.key === notice.key ? this.active : this.pending.find(n => n.key === notice.key);
  if (same) { same.parts = [...new Set([...same.parts, ...notice.parts])]; return; }
  const next = {...notice, parts:[...notice.parts]};
  if (!this.active) this.active = {...next, until:now + 4200};
  else if (next.priority > this.active.priority) {
   this.pending.push({...this.active}); this.active = {...next, until:now + 4200};
  } else this.pending.push(next);
  this.pending.sort((a,b) => b.priority-a.priority); this.pending = this.pending.slice(0,3);
 }
 tick(now) {
  if (this.active && now >= this.active.until) {
   const next = this.pending.shift(); this.active = next ? {...next, until:now + 4200} : null;
  }
  return this.active;
 }
 text() {
  if (!this.active) return '';
  const {parts, prefix = ''} = this.active;
  return prefix + parts.slice(0,2).join('・') + (parts.length > 2 ? ` ほか${parts.length-2}件` : '');
 }
}
