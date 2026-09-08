/* Discovery is a short, nonmodal event. Catalog contents stay unknown until learned. */
const SkillPresentation = (() => {
 function ensure(ui) {
  if(ui.skillReveal)return ui.skillReveal;
  const el=document.createElement('aside');el.className='skill-revelation';el.id='skill-revelation';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<span class="reveal-overline">記憶が、技になる</span><p class="reveal-memory"></p><div class="reveal-name"></div><small class="reveal-english"></small><button class="reveal-open">心の采配へ</button>';
  document.body.appendChild(el);ui.skillReveal=el;
  el.querySelector('button').onclick=()=>{const d=BL_SKILL_CATALOG.byId.get(ui.skillRevealEvent?.id);ui.skills();if(d&&!d.passive){ui.phase=d.phase;ui.renderSkills();ui.describeSkill(d.id);}clear(ui);};
  return el;
 }
 function clear(ui) { ui.skillReveal?.classList.remove('visible');ui.skillRevealEvent=null; }
 function event(ui,e) {
  if(e.player!==ui.g.playerId)return false;
  if(e.type==='death'){clear(ui);return false;}
  if(e.type==='skillconnection') { ui.floatLines.push({...e,born:e.t,text:'繋がった'});ui.floatLines=ui.floatLines.slice(-16);return true; }
  if(!['insight','passive'].includes(e.type)||!BL_SKILL_CATALOG.byId.has(e.id))return false;
  const el=ensure(ui),d=BL_SKILL_CATALOG.byId.get(e.id);
  ui.skillRevealEvent={...e,shown:performance.now()};el.classList.remove('named');
  el.querySelector('.reveal-memory').textContent=e.discovery?.reasons?.slice(0,2).join('。')||'この人生の記憶が、ひとつにつながった';
  el.querySelector('.reveal-name').textContent='';el.querySelector('.reveal-english').textContent='';el.classList.add('visible');return true;
 }
 function update(ui,s) {
  if(s.player.skillLifeNotice&&ui.skillNoticeLife!==s.player.id){ui.skillNoticeLife=s.player.id;ui.toast(s.player.skillLifeNotice);}
  document.querySelector('[data-menu="skills"]')?.classList.toggle('has-insight',!!s.player.skillLife?.unread?.length);
  if(!ui.skillRevealEvent)return;
  const e=ui.skillRevealEvent,elapsed=performance.now()-e.shown;
  if(!s.player.alive||e.player!==s.player.id||elapsed>6800){clear(ui);return;}
  if(elapsed>450&&!ui.skillReveal.classList.contains('named')) {
   const d=BL_SKILL_CATALOG.byId.get(e.id);ui.skillReveal.querySelector('.reveal-name').textContent=d.names.ja;ui.skillReveal.querySelector('.reveal-english').textContent=d.names.en;ui.skillReveal.classList.add('named');
  }
 }
 function opened(ui) { ui.g.command({type:'skill-read'});ui.g.saveWorld(); }
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
