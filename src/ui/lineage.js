/* The family book is a read-only view of actual lives. Only existing profile
 * choices (race, name, one inherited skill, help) are editable here. */
class UILineage {
 constructor(ui){this.ui=ui;this.limit=12;}
 get g(){return this.ui.g;}
 current(){
  const p=this.g.snapshot?.player;
  // A local character is not a preview of the selected online village.
  return p?.alive&&p.owner===this.g.profile.owner&&!!this.g.online===!!this.g.profile.online?p:null;
 }
 generation(value){return Number.isInteger(value)&&value>0?'第'+value+'代':'世代未記録';}
 age(value,ended=false){return Number.isFinite(value)?(ended?'享年 ':'')+Math.floor(value)+'歳':'年齢未記録';}
 gear(p){return `<dl class="book-gear"><div><dt>得物</dt><dd>${ESC(p.weapon===-1?'素手':WEAPONS[p.weapon]?.name||'未記録')}</dd></div><div><dt>衣装</dt><dd>${ESC(ARMORS[p.armor]?.name||'未記録')}</dd></div><div><dt>左手</dt><dd>${p.shield===true?'木鉄の盾':p.shield===false?'空き':'未記録'}</dd></div></dl>`;}
 selection(legacy){
  const id=this.g.profile.inherit?.[0],skill=legacy.archive?.includes(id)?skillById(id):null;
  return `<section class="inheritance-seal" aria-label="次の命への継承"><span class="book-eyebrow">次の命へ · ひとつの技</span><strong>${ESC(skill?.name||'まだ選んでいない')}</strong><p>${skill?'この技を、次の人生の学びに。':'人生の記録から、受け継ぐ技を選べます。'}</p>${skill?'<button class="book-text-button" data-clear-inherit>選択を外す</button>':''}</section>`;
 }
 banners(clan,records,current){
  const p=this.g.profile;
  return `<section class="blood-chapter" aria-label="4つの種族"><div class="chapter-heading"><h3>${clan?'次の命の血筋':'一族を彩る血筋'}</h3><span>4つの種族</span></div><div class="blood-banners">${RACES.map((race,i)=>{
   const count=records.filter(r=>r.appearance?.race===i).length,active=clan?p.race===i:current?.race===i;
   const content=`<span class="banner-pin" aria-hidden="true"></span><span class="banner-glyph" aria-hidden="true">${icon(['leaf','feather','hammer','fire'][i])}</span><strong>${ESC(race.name)}</strong><span class="banner-status">${clan?(active?'選択中':'選ぶ'):(active?'今の血筋':count?count+'人の記録':'記録なし')}</span>`;
   return clan?`<button class="blood-banner blood-banner-${i}" data-race="${i}" aria-pressed="${active}" aria-describedby="blood-description">${content}</button>`:`<div class="blood-banner blood-banner-${i}">${content}</div>`;
  }).join('')}</div>${clan?`<p class="blood-description" id="blood-description">${ESC(RACES[p.race]?.desc||'血筋を選んでください。')}${this.g.canResume()?'<br>血筋と名前の選択は、次に生まれる命に使われます。':''}</p>`:'<p class="chapter-note">種族ごとの記録です。親子関係を表すものではありません。</p>'}</section>`;
 }
 recordsMarkup(records,legacy){
  return `<section class="history-chapter"><div class="chapter-heading"><h3>これまでの歩み</h3><span>${records.length}人の記録</span></div><ol class="lineage-list" aria-label="これまでの人生">${records.slice(0,this.limit).map((r,i)=>{
   const id=r.skills?.[0]??r.skill,sk=skillById(id),available=!!sk&&legacy.archive?.includes(id),selected=available&&this.g.profile.inherit?.includes(id),race=RACES[r.appearance?.race];
   return `<li><article class="life-record"><div class="life-ribbon">${ESC(this.generation(r.gen))}</div><div class="record-overview"><div class="ancestor-portrait" data-portrait="${i}">${icon('leaf')}<small>肖像未記録</small></div><div class="ancestor-meta"><strong>${ESC(r.name||'名もなき旅人')}</strong><span>${ESC(this.age(r.age,true))}${race?' · '+ESC(race.name):''}</span>${r.cause?`<span class="ancestor-cause">${ESC(r.cause)}</span>`:''}<small>系譜に刻まれた技</small><b>${ESC(sk?.name||'技の記録なし')}</b></div></div><button class="ancestor inherit-choice ${selected?'chosen':''}" data-ancestor="${id??''}" data-record="${i}" aria-pressed="${!!selected}" ${available?'':'disabled'}>${icon(selected?'leaf':'book')}<span>${available?(selected?'次の命へ受け継ぐ':'「'+ESC(sk.name)+'」を継承に選ぶ'):sk?'継承可能な記録にはありません':'残された人生の記録'}</span></button><details class="life-details" data-record-details="${i}"><summary>この人生の記録</summary><div>${sk?.desc?`<p>${ESC(sk.desc)}</p>`:''}${Number.isFinite(r.uses)?`<p>刻まれた技を使った回数 · ${r.uses}</p>`:''}${r.appearance?`<h4>最期の装備</h4>${this.gear(r.appearance)}`:'<p>装備の記録はありません。</p>'}</div></details></article></li>`;
  }).join('')||'<li class="empty-lineage"><div class="empty-emblem" aria-hidden="true">'+icon('book')+'</div><strong>まだ、白紙の頁。</strong><p>この先の出会いと学びが、<br>いつか一族の歴史になる。</p><small>生涯を終えた人生が、ここに残ります。</small></li>'}</ol>${records.length>this.limit?`<button class="book-more" data-more-records>以前の歩みを読む · 残り${records.length-this.limit}人${icon('arrow')}</button>`:''}<p class="lineage-note">ここに刻まれた一人ひとりが、<br>いまのあなたをつくっている。</p></section>`;
 }
 currentMarkup(current,clan){
  if(!current)return '';
  return `<section class="living-chapter"><div class="chapter-heading"><h3>今を生きる</h3><span>${ESC(this.generation(current.gen))}</span></div><div class="book-current-portrait" data-current-portrait>${icon('leaf')}</div><div class="book-current-name"><strong>${ESC(current.name)}</strong><span>${ESC(this.age(current.age))} · ${ESC(RACES[current.race]?.name||'種族未記録')}</span></div><h4>現在の装備</h4>${this.gear(current)}<h4>手荷物 · ${current.inventory?.length||0} / ${MAX_ITEMS}</h4><div class="book-inventory">${Array.from({length:MAX_ITEMS},(_,i)=>{const id=current.inventory?.[i];return `<div>${id?itemIcon(id):icon('bag')}<span>${id?ESC(ITEMS[id]?.name||'品物'):'空き'}</span></div>`;}).join('')}</div>${clan?'<p class="chapter-note">装備と手荷物は、旅を再開して確認できます。</p>':'<button class="full-button" data-book-body>身支度をひらく'+icon('arrow')+'</button><p class="chapter-note">着替えは7歳から、武具棚のそばで。</p>'}</section>`;
 }
 markup(clan=false){
  const legacy=this.g.getLegacy(),p=this.g.profile,records=[...(legacy.records||[])].reverse(),current=this.current();
  return `<div class="family-book"><div class="book-title"><span class="book-emblem" aria-hidden="true">${icon('leaf')}</span><div><span class="book-eyebrow">${ESC(p.clan||'一族')}の記録</span><h2>血脈の系譜</h2><p>つながる想いが、あしたをつくる。</p></div></div>${!p.hideLineageHelp?`<aside class="book-guide"><span aria-hidden="true">${icon('book')}</span><div><p>命を終えると、最も使った技がひとつ、系譜に刻まれます。</p><small>受け継がれるのは、技だけじゃない。生きた証だよ。</small><label><input id="hide-lineage-help" type="checkbox">次回から表示しない</label></div><button class="guide-dismiss" data-dismiss-guide aria-label="系譜の説明を閉じる">${icon('close')}</button></aside>`:''}${this.banners(clan,records,current)}<div class="book-spread">${this.recordsMarkup(records,legacy)}<aside class="book-sidebar">${this.selection(legacy)}${this.currentMarkup(current,clan)}${clan?`<section class="birth-chapter"><h3>${this.g.canResume()?'次の命の名前':'新しい命の名前'}</h3><label for="life-name">名</label><input id="life-name" maxlength="12" placeholder="風にまかせる" value="${ESC(p.name)}"><p>名前を空けておくと、風が名付けます。</p></section>`:''}</aside></div></div>`;
 }
 renderClan(){
  const ui=this.ui,scroll=ui.clan.scrollTop;
  ui.portraitQueue=ui.portraitQueue.filter(q=>!ui.clan.contains(q.node));
  ui.clan.classList.add('family-screen');
  ui.clan.innerHTML=`<header class="family-top"><span>${ESC(GAME_TITLE)}<small>一族の書</small></span><button id="clan-settings" class="quiet-button">${icon('menu')}設定</button></header>${this.markup(true)}<footer class="family-footer"><span>${this.g.profile.online?'共有の村':'ひとりの村'} · ${buildVersionMarkup()}</span><button id="begin-life" class="begin-button">${label(this.g.canResume()?'旅を続ける':'この血に生まれる')}${icon('arrow')}</button></footer>`;
  this.bind(ui.clan,true);ui.clan.scrollTop=scroll;
  document.getElementById('clan-settings').onclick=()=>ui.settings();
  document.getElementById('begin-life').onclick=()=>this.g.start();
  document.getElementById('life-name').oninput=e=>{this.g.profile.name=e.target.value;this.g.saveProfile();};
 }
 refreshClan(){
  const mark=document.activeElement?.id,scroll=this.ui.clan.scrollTop;
  this.renderClan();this.ui.clan.scrollTop=scroll;
  if(mark)document.getElementById(mark)?.focus({preventScroll:true});
 }
 open(){
  if(this.ui.modal!=='lineage')this.limit=12;
  this.signature=this.liveSignature();
  this.ui.open('lineage','血脈の系譜',this.markup());this.bind(this.ui.root,false);
 }
 liveSignature(){
  const p=this.current(),l=this.g.getLegacy();
  return JSON.stringify([p&&[p.id,p.name,p.gen,Math.floor(p.age),p.race,p.weapon,p.armor,p.shield,p.inventory],l.records?.length,l.archive,this.g.profile.inherit]);
 }
 update(){if(this.ui.modal==='lineage'&&this.signature!==this.liveSignature())this.refreshOpen?.();}
 bind(container,clan){
  const ui=this.ui,profile=this.g.profile,legacy=this.g.getLegacy(),records=[...(legacy.records||[])].reverse();
  const refresh=()=>{
   const active=document.activeElement,mark={id:active?.id,race:active?.dataset.race,record:active?.dataset.record,more:active?.hasAttribute('data-more-records'),clear:active?.hasAttribute('data-clear-inherit')},opened=[...container.querySelectorAll('details[open]')].map(n=>n.dataset.recordDetails),guideHidden=container.querySelector('.book-guide')?.hidden;
   clan?this.renderClan():this.open();
   if(guideHidden&&container.querySelector('.book-guide'))container.querySelector('.book-guide').hidden=true;
   for(const i of opened)container.querySelector(`[data-record-details="${i}"]`)?.setAttribute('open','');
   const target=mark.id?document.getElementById(mark.id):mark.race!==undefined?container.querySelector(`[data-race="${mark.race}"]`):mark.record!==undefined?container.querySelector(`[data-record="${mark.record}"]`):mark.more?container.querySelector('[data-more-records]'):mark.clear?container.querySelector('.inheritance-seal'):null;
   if(target){if(!target.matches('button,input'))target.tabIndex=-1;target.focus({preventScroll:true});}
  };
  if(!clan)this.refreshOpen=refresh;
  container.querySelectorAll('[data-race]').forEach(b=>b.onclick=()=>{profile.race=+b.dataset.race;this.g.previewCharacter.race=profile.race;this.g.saveProfile();refresh();});
  const help=container.querySelector('#hide-lineage-help');if(help)help.onchange=()=>{profile.hideLineageHelp=help.checked;this.g.saveProfile();};
  const dismiss=container.querySelector('[data-dismiss-guide]');if(dismiss)dismiss.onclick=()=>{dismiss.closest('.book-guide').hidden=true;container.querySelector('[data-race],.inherit-choice:not(:disabled),.panel-back,#life-name')?.focus({preventScroll:true});};
  container.querySelectorAll('[data-ancestor]').forEach(b=>b.onclick=()=>{if(b.disabled)return;const id=+b.dataset.ancestor;if(!legacy.archive?.includes(id)||!skillById(id))return;profile.inherit=profile.inherit?.includes(id)?[]:[id];this.g.saveProfile();refresh();});
  const clear=container.querySelector('[data-clear-inherit]');if(clear)clear.onclick=()=>{profile.inherit=[];this.g.saveProfile();refresh();};
  const more=container.querySelector('[data-more-records]');if(more)more.onclick=()=>{const index=this.limit;this.limit+=12;refresh();container.querySelector(`[data-record="${index}"]`)?.focus({preventScroll:true});};
  const body=container.querySelector('[data-book-body]');if(body)body.onclick=()=>ui.body();
  records.slice(0,this.limit).forEach((record,i)=>{
   // A missing historical appearance must never inherit the current avatar's look.
   if(!record.appearance)return;
   const node=container.querySelector(`[data-portrait="${i}"]`),key='life:'+JSON.stringify([record.id,record.name,record.gen,record.appearance,record.skills,record.skill]);
   node.replaceChildren();
   if(ui.portraits.has(key))node.innerHTML=`<img alt="${ESC(record.name||'旅人')}の記録された姿" src="${ui.portraits.get(key)}">`;
   else ui.portraitQueue.push({key,record,node});
  });
  const current=this.current(),node=container.querySelector('[data-current-portrait]');if(current&&node)ui.queuePortrait(current,node,'wardrobe');
 }
}
