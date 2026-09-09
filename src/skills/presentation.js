/* Discovery stays beside the consciousness button, outside the combat view. */
const SkillPresentation = (() => {
 function ensure(ui) {
  const button=document.querySelector('[data-menu="skills"]');if(!button)return null;
  const el=ui.skillReveal||document.createElement('span');el.className='skill-revelation';el.id='skill-revelation';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  if(el.parentElement!==button)button.appendChild(el);ui.skillReveal=el;
  return el;
 }
 function clear(ui) { if(ui.skillReveal){ui.skillReveal.classList.remove('visible');ui.skillReveal.textContent='';}ui.skillRevealEvent=null; }
 function event(ui,e) {
  if(e.player!==ui.g.playerId)return false;
  if(e.type==='death'){clear(ui);return false;}
  if(e.type==='skillconnection') { ui.floatLines.push({...e,born:e.t,shown:performance.now(),text:'繋がった'});ui.floatLines=ui.floatLines.slice(-16);return true; }
  if(!['insight','passive'].includes(e.type)||!BL_SKILL_CATALOG.byId.has(e.id))return false;
  const el=ensure(ui);if(!el)return true;
  ui.skillRevealEvent={...e,shown:performance.now()};el.textContent='閃き';el.classList.add('visible');return true;
 }
 function update(ui,s) {
  if(s.player.skillLifeNotice&&ui.skillNoticeLife!==s.player.id){ui.skillNoticeLife=s.player.id;ui.toast(s.player.skillLifeNotice);}
  document.querySelector('[data-menu="skills"]')?.classList.toggle('has-insight',!!s.player.skillLife?.unread?.length);
  if(!ui.skillRevealEvent)return;
  const e=ui.skillRevealEvent,elapsed=performance.now()-e.shown;
  if(!s.player.alive||e.player!==s.player.id||elapsed>=2200){clear(ui);return;}
  if(!ui.skillReveal.isConnected){const el=ensure(ui);if(el){el.textContent='閃き';el.classList.add('visible');}}
 }
 function opened(ui) { clear(ui);ui.g.command({type:'skill-read'});ui.g.saveWorld(); }
 function rendered(ui) {
  const node=document.getElementById('skills-content');if(!node)return;
  const note=document.createElement('p');note.className='skill-life-note';note.textContent='閃いた技は、使う段で印を灯す。';node.prepend(note);
  const p=ui.g.snapshot.player;
  if(!p.skills.some(id=>BL_SKILL_CATALOG.byId.has(id)))note.textContent='暮らしの中で、まだ知らない技の種を。';
 }
 function describe(ui,id) {
  const d=BL_SKILL_CATALOG.byId.get(id),el=document.getElementById('skill-detail'),p=ui.g.snapshot?.player;
  if(!d||!el||!p||![...p.skills,...p.passives].includes(id))return false;
  const memory=p.skillLife?.discovered.find(x=>x.id===id);
  const connections=Object.entries(p.skillLife?.connections||{}).filter(([key])=>key.split(':').map(Number).includes(id)).slice(-3).map(([key])=>key.split(':').map(n=>skillById(+n)?.name).join(' → '));
  el.innerHTML=`<strong>${ESC(d.names.ja)}</strong><span>${ESC(d.descriptions.ja)}</span>${d.passive?'':costMarks(skillById(id))}${memory?`<p class="skill-memory">${memory.reasons.map(ESC).join('<br>')}</p>`:''}${connections.length?`<small class="skill-memory">戦いで繋がった<br>${connections.map(ESC).join('<br>')}</small>`:''}`;
  return true;
 }
 function sound(audio,e) {
  if(!audio.enabled||!audio.ctx||audio.background)return false;
  const d=BL_SKILL_CATALOG.byId.get(e.id??e.skill),t=audio.ctx.currentTime;
  if(d&&['insight','passive'].includes(e.type)) { [62,69,76].forEach((n,i)=>audio.tone(n,t+[0,.23,.45][i],.65,.08,'triangle',false,audio.fxBus));return true; }
  if(e.type==='skillconnection') {audio.tone(74,t,.16,.055,'triangle',false,audio.fxBus);return true;}
  return false;
 }
 return {event,update,opened,rendered,describe,clear,sound};
})();
