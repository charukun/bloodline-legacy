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
