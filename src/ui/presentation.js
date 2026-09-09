/* Read-only presentation models. Gameplay eligibility remains in Simulation.command. */
const UIValue = {
 text(node, value) { const next = String(value ?? ''); if (node && node.textContent !== next) node.textContent = next; },
 html(node, value) { if (node && node.innerHTML !== value) node.innerHTML = value; },
 attr(node, name, value) { const next = String(value); if (node && node.getAttribute(name) !== next) node.setAttribute(name, next); },
 style(node, name, value) { if (node && node.style[name] !== value) node.style[name] = value; }
};
/* Translate presentation only. Old/offline/server events keep their wire text,
 * IDs and timing; unknown notices (especially save errors) always pass through. */
function uiNoticeText(text) {
 const source=String(text??'');
 if(/^(序|破|急)の技が出せない$/.test(source))return '';
 const copy={
  '手荷物は、ふたつまで':'手荷物が満杯です',
  '武具棚のそばで着替えよう':'装備の変更は武具棚のそばで行えます',
  '武具棚は、七つになってから':'武具を装備できるのは7歳からです',
  '新しい得物の技は、意識から入れ替えよう':`使う技が${MAX_PHASE_SKILLS}つ選ばれています。「意識」で入れ替えられます`,
  'ひとつの段に込める技は、五つまで':`序・破・急それぞれに選べる技は${MAX_PHASE_SKILLS}つまでです`,
  '引き受けられる相手がいない':'気を引ける敵が近くにいない',
  '足払いはこの姿には通じない。':'この相手には足払いが効かない'
 };
 return Object.hasOwn(copy,source)?copy[source]:source;
}
function uiDiscoveryText(names,kind='insight') {
 const unique=[...new Set(names)];if(!unique.length)return '';
 const named=unique.slice(0,2).map(name=>'「'+name+'」').join('・');
 const more=unique.length>2?`ほか${unique.length-2}つの${kind==='passive'?'心得':'技'}`:'';
 return named+more+(kind==='passive'?'を身につけた':'を閃いた');
}
// Old memories stay intact in saves; only the stock narration is rephrased.
function uiMemoryText(text) {
 const copy={
  '鍛冶場で、道具が打ち返す拍子を見た':'鍛冶場で、槌を打つリズムを覚えた',
  '武具を手入れし、力の通り道を確かめた':'武具を手入れして、持ち方を確かめた',
  '庭で遊び、弾む足の拍子を覚えた':'庭を駆け回り、軽やかな足運びを覚えた',
  '狩人の足跡を学び、一歩先を読んだ':'狩人に教わり、足跡の見分け方を学んだ',
  '祈りの間、息と静けさを確かめた':'祈りながら、ゆっくり呼吸を整えた',
  '武具棚で身支度を変え、重心を確かめた':'武具を替え、重さや動きやすさを確かめた',
  '稽古人形に打ち込み、当たる拍子を確かめた':'かかしに打ち込み、手応えを確かめた',
  '敵に打ち込み、押し合う重みを知った':'敵に打ち込み、ぶつかる衝撃を知った',
  '敵とぶつかり、踏みとどまる重みを知った':'敵との打ち合いで、踏ん張る感覚をつかんだ',
  '敵を倒し、最後の間合いを覚えた':'敵を倒し、攻撃が届く距離をつかんだ',
  '歩いて、新しい場所の間合いを覚えた':'新しい場所を歩き、足場を確かめた',
  '道具を扱う手つきが、戦いの手応えと重なる……':'道具を扱った感覚が、戦いにも活かせそうだ……',
  '息を整えると、あの張りつめた一瞬が浮かぶ……':'ひと息つくと、あの戦いが思い浮かぶ……',
  '歩いて覚えた間合いが、狙いを定める感覚に重なる……':'歩いて身についた距離感が、狙いを定める助けになりそうだ……',
  '遊びの拍子が、別の動きの中にも聞こえる……':'遊んでいたときの足運びが、ふとよみがえる……',
  '待つ静けさの中に、あの人と過ごした時間がよみがえる……':'静かに待つ間、家族と過ごした時間を思い出す……',
  '手元の小さな思い出が、今日の動きに結びつきかける……':'手元の品から、新しい使い方を思いつきそうだ……'
 };
 return String(text??'').split('。').map(part=>Object.hasOwn(copy,part)?copy[part]:part).join('。');
}
function uiSkillRestrictionText(p,sk) {
 const reason=skillRestriction(p,sk);
 const copy={
  '眠り':'眠っているため使えない',
  '呼び声を整えている':'もう一度呼びかけるまで少し待とう',
  '異なる武器の技':`${WEAPONS[sk.weapon]?.name||'対応する武器'}を装備すると使える`,
  '残数が足りない':`${({arrows:'矢',stones:'投石用の石',nets:'網',magic:'魔力'})[sk.resource]||'必要な道具'}が足りない`,
  '小物が必要':`${ITEMS[sk.item]?.name||'対応する品物'}を持っていると使える`,
  '小物の組み合わせが違う':`${(sk.items||[]).map(id=>ITEMS[id]?.name||'品物').join('と')}を一緒に持つと使える`,
  'まだ理を知らない':`「${skillById(sk.requiresPassive)?.name||'必要な心得'}」を身につけると使える`
 };
 return Object.hasOwn(copy,reason)?copy[reason]:reason;
}
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
 return p.age < EQUIP_AGE ? '武具を装備できるのは7歳からです' : !nearRack ? '装備の変更は武具棚で行えます' : '武具棚で装備を変更できます';
}
function uiPickup(item, p) {
 const name = ITEMS[item.item]?.name || '品物', full = p.inventory.length >= MAX_ITEMS;
 return {id:'pickup', value:item.id, name:full ? '手荷物が満杯' : '拾う', detail:name, glyph:'hand', disabled:full};
}
function uiActiveStatuses(p, t) {
 return Object.entries(p.statuses || {}).filter(([id, s]) => STATUS_DEFS[id] && s.until > t)
  .map(([id]) => STATUS_DEFS[id].name).join('・');
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
  if (this.active.discoveryKind) return uiDiscoveryText(this.active.parts,this.active.discoveryKind);
  const {parts, prefix = ''} = this.active;
  return prefix + parts.slice(0,2).join('・') + (parts.length > 2 ? ` ほか${parts.length-2}件` : '');
 }
}
