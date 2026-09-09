/* Discovery stays beside the consciousness button, outside the combat view. */
const SkillPresentation = (() => {
 function ensure(ui) {
  const button=document.querySelector('[data-menu="skills"]');if(!button)return null;
  const el=ui.skillReveal||document.createElement('span');el.className='skill-revelation';el.id='skill-revelation';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  if(el.parentElement!==button)button.appendChild(el);ui.skillReveal=el;
  return el;
 }
 function paint(ui){
  const el=ensure(ui),e=ui.skillRevealEvent;if(!el||!e)return;
  const names=e.ids.map(id=>skillById(id)?.name).filter(Boolean);
  el.innerHTML=`<span class="revelation-rays" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--ray:${i};--angle:${i*30}deg"></i>`).join('')}</span><svg class="revelation-crest" viewBox="0 0 260 90" aria-hidden="true" fill="none" stroke="currentColor"><path d="M6 47 58 38 82 45M254 47 202 38 178 45M24 57 68 49 82 53M236 57 192 49 178 53"/><ellipse cx="130" cy="44" rx="49" ry="34"/><ellipse cx="130" cy="44" rx="44" ry="30" stroke-opacity=".45"/><path d="m130 2 4 11-4 5-4-5Zm0 68 4 5-4 12-4-12Z" fill="currentColor"/></svg><strong class="revelation-word">${e.ids.every(id=>skillById(id)?.passive)?'心得':'閃き'}</strong><span class="revelation-name">${ESC(names.slice(0,2).join('・'))}${names.length>2?` ＋${names.length-2}`:''}</span>`;
  el.classList.add('visible');
 }
 function clear(ui) { if(ui.skillReveal){ui.skillReveal.classList.remove('visible');ui.skillReveal.textContent='';}ui.skillRevealEvent=null; }
 function event(ui,e) {
  if(e.player!==ui.g.playerId)return false;
  if(e.type==='death'){clear(ui);return false;}
  if(e.type==='skillconnection') {
   if(e.first) {ui.floatLines.push({...e,born:e.t,shown:performance.now(),life:2.3,text:connectionText(e.connectionKind)});ui.floatLines=ui.floatLines.slice(-16);}
   return true;
  }
  if(e.type==='skillglimpse') {
   if(!ui.skillRevealEvent) {ui.floatLines.push({...e,born:e.t,shown:performance.now(),life:4.6,text:uiMemoryText(e.text)});ui.floatLines=ui.floatLines.slice(-16);}
   return true;
  }
  if(!['insight','passive'].includes(e.type)||!skillById(e.id))return false;
  if(e.seq!=null&&ui.skillRevealOwner===e.player&&e.seq<=ui.skillRevealSeq)return true;
  if(e.seq!=null){ui.skillRevealOwner=e.player;ui.skillRevealSeq=e.seq;}
  const el=ensure(ui);if(!el)return true;
  const now=performance.now(),previous=ui.skillRevealEvent;
  const same=previous&&previous.player===e.player&&now<previous.until;
  ui.skillRevealEvent={...e,shown:same?previous.shown:now,until:Math.min((same?previous.shown:now)+4200,now+3000),ids:[...new Set([...(same?previous.ids:[]),e.id])].slice(-16)};
  paint(ui);return true;
 }
 function update(ui,s) {
  if(s.player.skillLifeNotice&&ui.skillNoticeLife!==s.player.id){ui.skillNoticeLife=s.player.id;ui.toast(s.player.skillLifeNotice);}
  document.querySelector('[data-menu="skills"]')?.classList.toggle('has-insight',!!s.player.skillLife?.unread?.length);
  if(!ui.skillRevealEvent)return;
  const e=ui.skillRevealEvent,elapsed=performance.now()-e.shown;
  if(!s.player.alive||e.player!==s.player.id||performance.now()>=e.until){clear(ui);return;}
  if(!ui.skillReveal.isConnected)paint(ui);
 }
 function opened(ui) { clear(ui);ui.g.command({type:'skill-read'});ui.g.saveWorld(); }
 function rendered(ui) {
  const node=document.getElementById('skills-content');if(!node)return;
  const note=document.createElement('p');note.className='skill-life-note';note.textContent='使う技を選び、円グラフで使う割合を調整できます。';node.prepend(note);
  const p=ui.g.snapshot.player;
  if(!p.skills.some(id=>BL_SKILL_CATALOG.byId.has(id)))note.textContent='暮らしや戦いの経験が、技を閃くきっかけになります。';
 }
 function describe(ui,id) {
  const d=BL_SKILL_CATALOG.byId.get(id),el=document.getElementById('skill-detail'),p=ui.g.snapshot?.player;
  if(!d||!el||!p||![...p.skills,...p.passives].includes(id))return false;
  const memory=p.skillLife?.discovered.find(x=>x.id===id);
  const connections=Object.entries(p.skillLife?.connections||{}).filter(([key])=>key.split(':').map(Number).includes(id)).slice(-3).map(([key])=>key.split(':').map(n=>skillById(+n)?.name).join(' → '));
  el.innerHTML=`<strong>${ESC(d.names.ja)}</strong><small class="skill-name-en" lang="en">${ESC(d.names.en)}</small><span>${ESC(d.descriptions.ja)}</span>${d.passive?'':costMarks(skillById(id))}${memory?`<p class="skill-memory">${memory.reasons.map(uiMemoryText).map(ESC).join('<br>')}</p>`:''}${connections.length?`<small class="skill-memory">組み合わせて使った技<br>${connections.map(ESC).join('<br>')}</small>`:''}`;
  return true;
 }
 function connectionText(){return '技がつながった';}
 function recap(p) {
  const history=SkillSystem.remember(p),names=history.signature.map(id=>skillById(id)?.name).filter(Boolean);
  const pair=Object.entries(history.connections).filter(([key])=>key.split(':').every(id=>skillById(+id))).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
  const memory=p.skillLife?.discovered.find(d=>d.id===history.signature[0])||history.discoveries.findLast(d=>d.route==='cross')||history.discoveries.at(-1);
  if(!names.length&&!memory&&!pair)return '';
  const row=(caption,text)=>`<div><small>${caption}</small><p>${ESC(text)}</p></div>`;
  return `<section class="skill-life-recap" aria-label="この人生の戦い方">${names.length?row('手に馴染んだ技',names.join(' · ')):''}${pair?row('組み合わせて使った技',pair[0].split(':').map(id=>skillById(+id).name).join(' → ')):''}${memory?.reasons?.length?row('「'+ESC(skillById(memory.id)?.name||'技')+'」を'+(skillById(memory.id)?.passive?'身につけた':'閃いた')+'きっかけ',memory.reasons.slice(0,2).map(uiMemoryText).join('。')):''}</section>`;
 }
 function sound(audio,e) {
  if(!audio.enabled||!audio.ctx||audio.background)return false;
  const t=audio.ctx.currentTime;
  // All discoveries share AudioEngine's spatial, muted and bounded flourish.
  if(e.type==='skillconnection') {
   if(e.signal==='quiet')return true;
   if(e.first) [74,81,86].forEach((n,i)=>audio.tone(n,t+i*.045,.12,.035,'triangle',false,audio.fxBus));
   else audio.tone(81,t,.085,.018,'triangle',false,audio.fxBus);
   return true;
  }
  return false;
 }
 return {event,update,opened,rendered,describe,clear,sound,recap,connectionText};
})();
