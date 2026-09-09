/* Scoped native UI: assets/styles are supplied by the standalone build. */
function createLineageTheatre(host, options) {
 const scope=host.attachShadow({mode:'open'}), lifetime=new AbortController();
 let disposed=false, visible=true;
 scope.innerHTML='<style>'+LINEAGE_VIEW.css+'</style>'+LINEAGE_VIEW.html;
 const MEMORY_FILMS=LINEAGE_VIEW.films;
/* Native lineage presentation. Simulation owns lives, skills and inheritance.
 * The adapter receives one skill ID, never an ancestor ID or a learned skill.
 * Records, archive membership and a living character are separate sources.
 */
'use strict';
const $=s=>scope.querySelector(s),PHASE_NAMES=['序','破','急'];
const races=[{name:'人族',desc:'柔らかな髪。旅を継ぐ人々。',face:'175 5 345 345',full:'65 0 495 650',icon:'leaf'},{name:'森人',desc:'長い耳。細身の森の民。',face:'730 0 410 410',full:'685 0 510 650',icon:'feather'},{name:'山人',desc:'小さく頑丈。豊かな髪と髭。',face:'168 650 350 350',full:'125 650 445 595',icon:'hammer'},{name:'狐人',desc:'獣の耳と、大きな尾。',face:'745 648 385 385',full:'675 648 540 606',icon:'flame'}];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const glyph=id=>`<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
const art=(race,face=false)=>{if(!Number.isInteger(race)||!races[race])return '<div class="missing-portrait">'+glyph('book')+'<span>肖像未記録</span></div>';const [x,y,w,h]=races[race][face?'face':'full'].split(' ').map(Number);return '<span class="art portrait-crop" aria-hidden="true" style="--ratio:'+w+'/'+h+'"><span class="portrait-sheet" style="left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%;width:'+(1254/w*100)+'%;height:'+(1254/h*100)+'%"></span></span>';};
const finite=v=>typeof v==='number'&&Number.isFinite(v),gen=v=>Number.isInteger(v)&&v>0?'第'+v+'代':'世代未記録';
const age=v=>finite(v)?'享年 '+Math.floor(v)+'歳':'年齢未記録';
const phase=s=>s?.passive?'常時':Number.isInteger(s?.phase)?PHASE_NAMES[s.phase]||'未記録':'未記録';
const clone=v=>JSON.parse(JSON.stringify(v)),canon=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('ja');
let model,busy=false,dialogKind='',focusBefore=null,toastTimer=0;
let draft={race:0,name:'',inherit:null},view={active:null,history:false,railPage:0,skillPage:0,query:'',phase:'all',tab:'skills',page:0},lastLaunch=null;
function normalize(raw){
 const source=clone(raw),catalog=new Map((source.catalog||[]).filter(s=>Number.isInteger(s.id)).map(s=>[s.id,s]));
 const archive=new Set((source.legacy?.archive||[]).filter(id=>Number.isInteger(id)&&catalog.has(id)));
 const seen=new Set(),records=(source.legacy?.records||[]).map((r,i)=>{let key=String(r.id??'record-'+i);if(seen.has(key))key+=':'+i;seen.add(key);const skillId=r.skills?.[0]??r.skill??null;return {...r,key,skillId,index:i,name:r.name||'名の記録なし'};}).reverse();
 records.sort((a,b)=>(Number.isInteger(a.gen)&&a.gen>0?a.gen:Infinity)-(Number.isInteger(b.gen)&&b.gen>0?b.gen:Infinity)||a.index-b.index);
 const byRecord=new Map(records.map(r=>[r.key,r])),groups=new Map();
 for(const r of records){if(!groups.has(r.skillId))groups.set(r.skillId,[]);groups.get(r.skillId).push(r);}
 const skills=[...archive].map(id=>({skill:catalog.get(id),records:groups.get(id)||[]}));
 const bySkill=new Map(skills.map(s=>[s.skill.id,s]));
 return {source,catalog,archive,records,byRecord,skills,bySkill,generation:source.legacy?.generation,current:source.current?.alive||source.current?.legacyChoice?.state==='pending'?source.current:source.resumeAvailable?{remote:true}:null};
}
function available(id){return Number.isInteger(id)&&model.archive.has(id)&&model.catalog.has(id);}
function firstLife(){return model.generation===1&&model.records.length===0;}
function active(){
 if(model.current&&!view.history)return {record:null,skill:null,skillId:null};
 if(view.active?.kind==='skill'){
  const group=model.bySkill.get(view.active.id);
  return {record:group?.records.at(-1)||null,skill:group?.skill,skillId:group?.skill.id};
 }
 const record=model.byRecord.get(view.active?.id);
 return {record,skill:model.catalog.get(record?.skillId),skillId:record?.skillId};
}
function animate(node,name){node.classList.remove(name);void node.offsetWidth;node.classList.add(name);}
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},1700);}
function openDialog(kind,title,html){if(!$('#dialog').open){focusBefore=scope.activeElement;$('#dialog').showModal();$('#app').inert=true;}dialogKind=kind;$('#dialog').className='dialog-'+kind;$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;$('#close-dialog').disabled=busy;$('#close-dialog').focus();}
function closeDialog(){if(busy)return;$('#dialog').close();$('#app').inert=false;dialogKind='';const target=focusBefore?.isConnected&&!focusBefore.closest('[hidden]')?focusBefore:$('#begin-life');target.focus({preventScroll:true});}
function load(raw,keepDraft=false){
 const previousCurrent=model?.current;model=normalize(raw);
 if(!keepDraft){draft=options.initialDraft();view={active:null,history:false,railPage:0,skillPage:0,query:'',phase:'all',tab:'skills',page:0};}
 if(!!previousCurrent!==!!model.current){view.history=false;view.active=null;}
 if(draft.inherit!==null&&!available(draft.inherit))draft.inherit=null;
 if(view.active?.kind==='record'&&!model.byRecord.has(view.active.id)||view.active?.kind==='skill'&&!available(view.active.id))view.active=null;
 if(!view.active){
  if(view.history&&model.records.length)view.active={kind:'record',id:model.records.at(-1).key};
  else if(!model.current&&available(draft.inherit))view.active={kind:'skill',id:draft.inherit};
 }
 if(!model.records.length&&!model.skills.length)view.history=false;
 render();
}
function renderHeader(){
 $('#blood').textContent=view.history?'歴代の記録':model.current?'今を生きる':isPrologue()?'まだ、白紙の系譜':'継承する技を選ぶ';
 $('#blood').setAttribute('aria-label',$('#blood').textContent);
 $('#exit-history').hidden=!view.history;
 $('#exit-history').textContent=model.current?'今の人生へ戻る':'技の選択へ戻る';
}
function recordSeal(r){return `<span class="record-seal" aria-hidden="true">${glyph(races[r.appearance?.race]?.icon||'book')}</span>`;}
function recordButton(r){
 const skill=model.catalog.get(r.skillId),selected=view.history&&active().record?.key===r.key;
 return `<li><button class="ancestor" data-record="${esc(r.key)}" aria-pressed="${selected}" aria-label="${esc(gen(r.gen)+' '+r.name+(skill?' · '+skill.name:''))}">${recordSeal(r)}<span class="ancestor-copy"><small>${esc(gen(r.gen))}</small><strong>${esc(r.name)}</strong><span class="skill-mini">${esc(skill?.name||'技の記録なし')}</span></span></button></li>`;
}
function renderRail(){const total=model.records.length;view.railPage=Math.min(view.railPage,Math.max(0,Math.ceil(total/3)-1));const start=view.railPage*3;$('#archive-count').textContent=total+'人';$('#archive').innerHTML=total?model.records.slice(start,start+3).map(recordButton).join(''):'<li class="empty-records">まだ白紙の頁。<br>ここから、一族の物語。</li>';$('#rail-position').textContent=total?(start+1)+'–'+Math.min(start+3,total)+' / '+total:'0人';$('#newer').disabled=view.railPage===0;$('#older').disabled=start+3>=total;$('#rail-controls').hidden=total===0;$('#library-open').textContent='記録を探す';}
function renderScene(motion=false){
 const {record:r,skill:s,skillId}=active(),living=model.current&&!view.history?model.current:null;
 $('#app').dataset.screen=view.history?'history':living?'resume':isPrologue()?'first':'inherit';
 $('#generation').textContent=living?(living.remote?'共有の旅':gen(living.gen)):r?gen(r.gen):s?'一族に刻まれた経験':'次の人生への支度';
 $('#person-name').textContent=living?living.name||'続いている旅':r?r.name:s?'残された記憶':model.skills.length?'受け継ぐ、ひとつの技。':'次の人生へ。';
 $('#person-name').title=$('#person-name').textContent;
 $('#life-meta').textContent=living?(living.remote?'共有の村へ接続して再開します。':(finite(living.age)?Math.floor(living.age)+'歳 · ':'')+(races[living.race]?.name||'')):r?age(r.age)+(races[r.appearance?.race]?' · '+races[r.appearance.race].name:''):s?'この技を刻んだ人物の記録はありません。':'';
 const race=living?.race??r?.appearance?.race;
 $('#person-art').innerHTML=r||living?art(race):`<div class="empty-emblem">${glyph('leaf')}</div>`;
 $('#art-caption').textContent=races[race]?races[race].name+'のイメージ（本人の肖像ではありません）':'';
 $('#skill-eyebrow').textContent=living?'旅の途中':s?phase(s)+' · '+(view.history?'この人生に刻まれた技':'この技を残した人生'):view.history?'この人生の記録':model.skills.length?'下の技から、ひとつ選んでください':'新たな経験を刻む';
 $('#skill-name').textContent=living?'続きを、生きる。':s?.name||(view.history?'技の記録なし':model.skills.length?'経験が、次の命を導く。':'また、ここから。');
 $('#skill-note').textContent=living?'これまでの経験を携えて、今の人生を続けます。':s?.desc||(view.history?'技が残らなかった人生も、一族の歩みに残ります。':model.skills.length?'技を選ぶと、技の説明と、その技を残した人物を確認できます。':'継承できる技はまだありません。次の人生で、新しい経験を重ねられます。');
 $('#inherit-effect').hidden=!!living||view.history||!s;
 $('#inherit-effect').textContent='受け継いだ経験は、次の人生で関連する技を閃くきっかけになります。';
 $('#selected-stamp').hidden=!!model.current||view.history||!available(skillId)||draft.inherit!==skillId;
 $('#life-details').hidden=!!living||(!r&&!s);$('#life-details').textContent='この人生の記録';
 if(s&&!r)$('#life-details').textContent='この技の記録';
 $('#inherit-action').hidden=true;
 renderHeader();syncStage(motion);renderSkills();syncCommand();
}
function renderChoice(){syncCommand();renderSkills();}
function render(){renderHeader();renderRail();renderScene();renderChoice();}
function browseRecord(id){
 if(!model.byRecord.has(id))return;view.history=true;view.active={kind:'record',id};
 view.railPage=Math.floor(model.records.findIndex(r=>r.key===id)/3);renderRail();renderScene(true);
}
function browseSkill(id){
 if(!model.bySkill.has(id))return;view.history=!!model.current;view.active={kind:'skill',id};
 view.skillPage=Math.floor(model.skills.findIndex(g=>g.skill.id===id)/6);if(view.history){view.railPage=Math.floor(model.records.findIndex(r=>r.key===active().record?.key)/3);renderRail();}renderScene(true);
}
function choose(id){
 if(model.current||!available(id))return false;draft.inherit=id;view.history=false;view.active={kind:'skill',id};
 renderScene();renderChoice();notify('「'+model.catalog.get(id).name+'」の経験を選びました。');return true;
}
function filtered(){const tokens=canon(view.query).trim().split(/\s+/).filter(Boolean),numeric=tokens.length===1?tokens[0].match(/^(?:第)?(\d+)(?:代)?$/):null;
 const rows=view.tab==='lives'?model.records.map(r=>({key:r.key,record:r,skill:model.catalog.get(r.skillId)})):model.skills.map(g=>({key:String(g.skill.id),skill:g.skill,records:g.records}));
 return rows.filter(row=>{const s=row.skill;if(view.phase!=='all'&&phase(s)!==view.phase)return false;if(numeric)return row.record?row.record.gen===+numeric[1]:(row.records||[]).some(r=>r.gen===+numeric[1]);const text=canon([row.record?.name,gen(row.record?.gen),s?.name,s?.desc,...(row.records||[]).flatMap(r=>[r.name,gen(r.gen)])].join(' '));return tokens.every(t=>text.includes(t));});
}
function libraryResults(){const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/6));view.page=Math.min(view.page,pages-1);$('#result-count').textContent=rows.length+(view.tab==='lives'?'人':'種の技');$('#library-position').textContent=(view.page+1)+' / '+pages;$('#library-prev').disabled=view.page===0;$('#library-next').disabled=view.page>=pages-1;
 $('#library-results').innerHTML=rows.slice(view.page*6,view.page*6+6).map(row=>{const r=row.record,s=row.skill,valid=available(s?.id),id=r?.key??s.id,kind=r?'record':'skill';return `<li class="index-row"><button class="index-read" data-index-kind="${kind}" data-index-id="${esc(id)}"><span class="index-art">${r?recordSeal(r):glyph(s?.icon||'book')}</span><span><small>${r?esc(gen(r.gen)+' · '+age(r.age)):esc(row.records?.length?row.records.length+'人が刻んだ技':'人物の記録なし')}</small><strong>${esc(r?.name||s?.name||'未記録')}</strong><span>${r?esc(s?.name||'技の記録なし'):esc(s?.desc||'')}</span></span><b class="phase-stamp">${esc(phase(s))}</b></button>${!model.current?`<button class="index-choose" data-choose-id="${esc(s?.id??'')}" aria-pressed="${valid&&draft.inherit===s.id}" ${valid?'':'disabled'} aria-label="${esc(s?s.name+'の経験を継承に選ぶ':'継承できる技の記録なし')}">${glyph(valid?'leaf':'book')}</button>`:''}</li>`;}).join('')||'<li class="empty-index">該当する記録がありません。<button id="reset-search">条件を外す</button></li>';
 const reset=$('#reset-search');if(reset)reset.onclick=()=>{view.query='';view.phase='all';view.page=0;$('#legacy-search').value='';updateFilters();libraryResults();};
}
function updateFilters(){for(const b of scope.querySelectorAll('[data-index-tab]'))b.setAttribute('aria-pressed',String(b.dataset.indexTab===view.tab));for(const b of scope.querySelectorAll('[data-phase]'))b.setAttribute('aria-pressed',String(b.dataset.phase===view.phase));}
function showLibrary(tab){if(typeof tab==='string'){view.tab=tab;view.page=0;}if(!model.records.length&&!model.skills.length){showHelp();return;}openDialog('library',model.current||view.history?'歴代の記録を探す':'継承する技を選ぶ',`<div class="index-tabs"><button data-index-tab="lives">人生から</button><button data-index-tab="skills">技から</button></div><label class="search-label" for="legacy-search">名前・技・世代<input id="legacy-search" type="search" placeholder="例：炉打ち、12代" autocomplete="off"></label><div class="phase-filters" aria-label="技の段で絞る">${['all','序','破','急','常時'].map(p=>`<button data-phase="${p}">${p==='all'?'すべて':p}</button>`).join('')}</div><div class="index-count"><span id="result-count" role="status"></span><small>同じ技は「技から」でひとつにまとまります。</small></div><ol class="index-results" id="library-results"></ol><nav class="index-pages" aria-label="検索結果の頁"><button id="library-prev" aria-label="前の頁">‹</button><span id="library-position"></span><button id="library-next" aria-label="次の頁">›</button></nav>`);
 $('#legacy-search').value=view.query;$('#legacy-search').oninput=e=>{view.query=e.target.value;view.page=0;libraryResults();};for(const b of scope.querySelectorAll('[data-index-tab]'))b.onclick=()=>{view.tab=b.dataset.indexTab;view.page=0;updateFilters();libraryResults();};for(const b of scope.querySelectorAll('[data-phase]'))b.onclick=()=>{view.phase=b.dataset.phase;view.page=0;updateFilters();libraryResults();};
 $('#library-prev').onclick=()=>{view.page--;libraryResults();};$('#library-next').onclick=()=>{view.page++;libraryResults();};$('#library-results').onclick=e=>{const select=e.target.closest('[data-choose-id]');if(select&&!select.disabled){const id=+select.dataset.chooseId;if(choose(id)){browseSkill(id);showPrepare();}return;}const read=e.target.closest('[data-index-kind]');if(read){read.dataset.indexKind==='record'?browseRecord(read.dataset.indexId):browseSkill(+read.dataset.indexId);closeDialog($('#life-details'));}};updateFilters();libraryResults();
}
function showDetails(){const {record:r,skill:s,skillId}=active();if(!r&&!s){showHelp();return;}const count=model.bySkill.get(skillId)?.records.length||0;openDialog('record',r?r.name+'の記録':s.name,`${r?`<p>${esc(gen(r.gen)+' · '+age(r.age))}</p>`:''}<h3>${esc(s?.name||'技の記録なし')}</h3>${s?`<p><b>${esc(phase(s))}</b> · ${esc(s.desc)}</p>`:''}${r?.appearance?options.recordDetails(r):''}${r?.cause?`<p class="dialog-note">最期の記録：${esc(r.cause)}</p>`:''}${finite(r?.uses)?`<p class="dialog-note">この技を使った回数：${r.uses}回</p>`:''}${s?`<p class="inherit-rule">この技の経験が、次の人生で閃く技に影響します。<strong>習得済みの技として持ち込むものではありません。</strong></p><p class="dialog-note">${count?'同じ技を刻んだ人生：'+count+'人。':'人物の記録は残っていません。'}継承は技ごとにひとつの候補です。</p>`:''}${!model.current&&available(skillId)?'<button class="dialog-action" id="detail-choose">この技の経験を継ぐ</button>':''}`);if($('#detail-choose'))$('#detail-choose').onclick=()=>{choose(skillId);showPrepare();};}
function showHelp(){openDialog('help','血脈の系譜の手引き',`<div class="help-person">${art(2)}</div><p>生涯を終えると、<strong>この人生で学んだ技から、遺すひとつを選びます。</strong>選んだ技が、一族の系譜に刻まれます。</p><p>一族の記録を探し、継承したい技の経験をひとつ選びます。名前と血筋を決めたら、次の命へ。</p><p class="inherit-rule">選んだ経験は、次の人生の<strong>閃き</strong>に影響します。選んだ技を習得した状態では始まりません。</p><p class="dialog-note">継承せずに生まれることもできます。旅を再開する場合は、その人生のまま続きます。</p>`);}
function renderPrepareRace(){for(const b of scope.querySelectorAll('[data-birth-race]'))b.setAttribute('aria-pressed',String(+b.dataset.birthRace===draft.race));$('#race-description').textContent=races[draft.race].desc;}
function showPrepare(without=false){if(model.current){resume();return;}if(!without&&!available(draft.inherit)){showLibrary();return;}if(without){draft.inherit=null;renderChoice();renderScene();renderRail();}const s=available(draft.inherit)?model.catalog.get(draft.inherit):null;openDialog('prepare',(Number.isInteger(model.generation)?'第'+model.generation+'代':'次の命')+'を迎える',`<div class="prepare-memory">${glyph(s?.icon||'leaf')}<div><small>受け継ぐ経験</small><h3>${esc(s?.name||'継承なし')}</h3><span>${s?'関連する技の閃きに影響します。':'この人生で、新しい経験を重ねます。'}</span></div>${model.skills.length?'<button id="change-memory">選び直す</button>':''}</div>${s?'<p class="inherit-rule">選んだ技を習得した状態では始まりません。</p>':''}<h3 class="prepare-caption">生まれる血筋</h3><div class="birth-flags">${races.map((r,i)=>`<button class="flag" data-birth-race="${i}">${glyph(r.icon)}<strong>${r.name}</strong><i class="pin" aria-hidden="true"></i></button>`).join('')}</div><p class="dialog-note" id="race-description"></p><label for="life-name">次の人物の名前<input id="life-name" type="text" maxlength="12" placeholder="空欄なら名前をおまかせ" autocomplete="off"></label><p id="start-error" class="start-error" role="alert" hidden></p><div class="prepare-actions"><button id="prepare-back">技の選択に戻る</button><button class="dialog-action" id="confirm-birth">人生を始める</button></div>`);
 $('#life-name').value=draft.name;$('#life-name').oninput=e=>{draft.name=e.target.value.slice(0,12);renderChoice();};for(const b of scope.querySelectorAll('[data-birth-race]'))b.onclick=()=>{draft.race=+b.dataset.birthRace;renderPrepareRace();renderChoice();};const change=$('#change-memory');if(change)change.onclick=()=>{closeDialog();showLibrary();};$('#prepare-back').onclick=closeDialog;$('#confirm-birth').onclick=()=>launch('new');renderPrepareRace();
}
function launchControls(disabled){$('#close-dialog').disabled=disabled;for(const b of scope.querySelectorAll('#dialog-content button,#dialog-content input'))b.disabled=disabled;const confirm=$('#confirm-birth');if(confirm)confirm.textContent=disabled?'村へ向かっています…':'人生を始める';}
async function launch(kind){if(busy)return;if(kind==='new'&&model.current){openDialog('resume-available','続いている旅があります','<p>今の人生を、そのまま続けられます。</p><button class="dialog-action" id="resume-existing">旅を続ける</button>');$('#resume-existing').onclick=resume;return;}if(kind==='new'&&draft.inherit!==null&&!available(draft.inherit)){openDialog('invalid','継承の記録を確認してください','<p>選んでいた技は、現在の継承候補にありません。</p><button class="dialog-action" id="recover-choice">記憶を選び直す</button>');$('#recover-choice').onclick=()=>{draft.inherit=null;render();closeDialog();showLibrary();};return;}
 const payload=kind==='resume'?{kind:'resume',playerId:model.current?.id}:{kind:'new',config:{race:draft.race,name:draft.name.trim(),inherit:draft.inherit===null?[]:[draft.inherit]}};
 if(kind==='resume'&&!model.current)return;busy=true;launchControls(true);
 try{await options.start(clone(payload));if(disposed)return;lastLaunch=clone(payload);busy=false;launchControls(false);
 }catch(e){if(disposed)return;busy=false;launchControls(false);const error=$('#start-error');if(error&&$('#dialog').open){error.textContent=String(e.message||'村に入れませんでした。')+' 選択は保持しています。もう一度試せます。';error.hidden=false;}else{openDialog('start-error','村へ進めませんでした',`<p role="alert">${esc(e.message||'もう一度お試しください。')}</p><p class="dialog-note">名前と継承の選択は保持しています。</p><button class="dialog-action" id="retry-start">もう一度</button>`);$('#retry-start').onclick=()=>model.current?resume():isPrologue()?startFirstLife():showPrepare(draft.inherit===null);}}

}
function resume(){openDialog('resuming','旅を続ける','<p>村へ戻っています…</p>');return launch('resume');}
function showSettings(){
 const reset=options.resetState();
 openDialog('options','一族のオプション',`<div class="lineage-options"><button id="motion-toggle" aria-pressed="${motionWanted}">${motionWanted?'背景動画を停止':'背景動画を再生'}</button><button id="settings-help">系譜の手引き</button><button id="game-settings">音・描画・保存の設定</button><button id="clear-lineage" class="danger-action" ${reset.allowed?'':'disabled'}>系譜をクリア</button><p class="dialog-note">${esc(reset.reason||'歴代の記録と現在の人生を消去し、初代からやり直します。')}</p></div>`);
 $('#motion-toggle').onclick=()=>{motionWanted=!motionWanted;options.saveMotion(motionWanted);applyFilmMotion();$('#motion-toggle').textContent=motionWanted?'背景動画を停止':'背景動画を再生';$('#motion-toggle').setAttribute('aria-pressed',String(motionWanted));};
 $('#settings-help').onclick=showHelp;
 $('#game-settings').onclick=()=>{dismissDialog();options.settings();};
 $('#clear-lineage').onclick=showClear;
}
function showClear(){
 const reset=options.resetState();if(!reset.allowed){notify(reset.reason);return;}
 openDialog('clear','系譜をクリアしますか？',`<p>この端末の一族を、初代からやり直します。</p><ul class="clear-scope"><li>歴代${model.records.length}人の記録と、継承できる${model.skills.length}種の技</li><li>${model.current?'現在の人生「'+esc(model.current.name||'旅人')+'」と、その所持品・装備・成長':'次の人生の名前と継承の選択'}</li></ul><p class="dialog-note">音・描画の設定、ほかの一族の記録は残ります。消去前の記録は端末内にバックアップします。</p><p class="start-error" id="clear-error" role="alert" hidden></p><div class="clear-actions"><button id="cancel-clear">やめる</button><button id="confirm-clear" class="danger-action">消去して初代から</button></div>`);
 $('#cancel-clear').onclick=closeDialog;
 $('#confirm-clear').onclick=()=>{
  if(busy)return;busy=true;launchControls(true);
  try{options.clear();busy=false;dismissDialog();draft=options.initialDraft();view.history=false;view.active=null;load(options.source(),true);options.saveDraft(clone(draft));$('#begin-life').focus({preventScroll:true});}
  catch(e){busy=false;launchControls(false);$('#clear-error').textContent=e.message;$('#clear-error').hidden=false;}
 };
}

$('#archive').onclick=e=>{const b=e.target.closest('[data-record]');if(b)browseRecord(b.dataset.record);};
$('#archive').onkeydown=e=>{const b=e.target.closest('[data-record]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=model.records.findIndex(r=>r.key===b.dataset.record),n=e.key==='Home'?0:e.key==='End'?model.records.length-1:Math.max(0,Math.min(model.records.length-1,i+(e.key==='ArrowRight'?1:-1)));browseRecord(model.records[n].key);[...scope.querySelectorAll('[data-record]')].find(n=>n.dataset.record===view.active.id)?.focus({preventScroll:true});};
$('#newer').onclick=()=>{if(view.railPage>0)browseRecord(model.records[(view.railPage-1)*3].key);};
$('#older').onclick=()=>{if((view.railPage+1)*3<model.records.length)browseRecord(model.records[(view.railPage+1)*3].key);};
$('#library-open').onclick=()=>showLibrary('lives');
$('#life-details').onclick=showDetails;$('#help').onclick=showHelp;$('#settings').onclick=showSettings;
$('#skip-inherit').onclick=()=>showPrepare(true);
$('#dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
const palettes=[['#b3c8ac','#43644f'],['#bfd7d8','#386f7d'],['#e0d1ae','#8a7044'],['#d9c6c7','#865366']];
let previousRecordIndex=-1,gesture=null;
function stageSkin(race){const p=palettes[race]||palettes[0];$('#app').style.setProperty('--wash',p[0]);$('#app').style.setProperty('--accent',p[1]);$('#dialog').style.setProperty('--wash',p[0]);}
function syncStage(motion=false){
 const {record:r}=active(),living=model.current&&!view.history?model.current:null,total=model.records.length;
 const race=isPrologue()?draft.race:r?.appearance?.race??living?.race;
 stageSkin(race);syncFilm(race);
 $('#large-generation').textContent=''; // the actual generation is stated once beside its person
 const index=r?model.records.findIndex(x=>x.key===r.key):-1;
 $('#time-dial').disabled=total<2;$('#time-dial').max=String(Math.max(0,total-1));$('#time-dial').value=String(Math.max(0,index));
 $('#time-dial').setAttribute('aria-valuetext',r?gen(r.gen)+' '+r.name:'記録なし');
 $('#timeline-first').textContent=total?gen(model.records[0].gen):'はじまり';$('#timeline-last').textContent=total?gen(model.records.at(-1).gen):'';
 $('#person-name').style.fontSize=(r?.name||living?.name||'').length>4?'clamp(20px,4vw,38px)':'';
 $('#scene').style.setProperty('--direction',index>=previousRecordIndex?1:-1);previousRecordIndex=index;
 if(living?.legacyChoice?.state==='pending'){$('#skill-eyebrow').textContent='遺す技の選択待ち';$('#skill-name').textContent='ひとつの技を、後世へ。';$('#skill-note').textContent='この人生で学んだ技から、系譜に刻むひとつを選びます。';}
 syncPrologue();if(motion)enterStage(isPrologue());
}
function returnHome(){view.history=false;view.active=available(draft.inherit)?{kind:'skill',id:draft.inherit}:null;render();enterStage();}
function showHistory(){
 if(!model.records.length){showLibrary('skills');return;}
 browseRecord(model.records.at(-1).key);
}
function renderSkills(){
 const show=!model.current&&!view.history&&!isPrologue()&&model.skills.length>0;$('#memory-controls').hidden=!show;
 if(!show)return;
 const count=model.skills.length,pages=Math.max(1,Math.ceil(count/6));view.skillPage=Math.min(view.skillPage,pages-1);
 $('#memory-count').textContent=count+'種の技';
 $('#memory-prev').disabled=view.skillPage===0;$('#memory-next').disabled=view.skillPage>=pages-1;
 $('#memory-pages').hidden=pages===1;$('#memory-page').textContent=(view.skillPage+1)+' / '+pages;
 $('#memory-choices').innerHTML=model.skills.slice(view.skillPage*6,view.skillPage*6+6).map(({skill,records})=>`<button class="memory-choice" data-memory-id="${skill.id}" aria-pressed="${active().skillId===skill.id}" data-committed="${draft.inherit===skill.id}">${glyph(skill.icon||'sword')}<span><strong>${esc(skill.name)}</strong><small>${esc(phase(skill))} · ${records.length?records.length+'人の記憶':'人物の記録なし'}</small></span><i aria-hidden="true">${draft.inherit===skill.id?'✓':''}</i></button>`).join('')||'<p class="empty-memories">まだ継承できる技はありません。</p>';
}
function syncCommand(){
 const a=active(),s=model.catalog.get(draft.inherit),c=model.current;
 $('#skip-inherit').hidden=!!c||view.history||!model.skills.length;
 $('#command-detail').textContent='';
 if(view.history){
  $('#command-eyebrow').textContent='歴代の記録を閲覧中';$('#command-name').textContent=a.record?.name||a.skill?.name||'一族の記憶';
  $('#begin-life').textContent=c?'今の人生へ戻る':'技の選択へ戻る';return;
 }
 if(c){$('#command-eyebrow').textContent=c.legacyChoice?.state==='pending'?'この人生から、後世へ':'今を生きる';$('#command-name').textContent=c.name||'続いている旅';$('#begin-life').textContent=c.legacyChoice?.state==='pending'?'遺す技を選ぶ':options.inGame?'ゲームへ戻る':'旅を続ける';return;}
 if(isPrologue()){$('#command-eyebrow').textContent='最初の命 · '+races[draft.race].name;$('#command-name').textContent=draft.name.trim()||'名前はおまかせ';$('#begin-life').textContent='人生を始める';return;}
 const candidate=available(a.skillId)?a.skill:null,committed=candidate&&draft.inherit===candidate.id;
 $('#command-eyebrow').textContent=committed?'受け継ぐ経験':candidate?'継承候補':'次の人生へ、ひとつの経験';
 $('#command-name').textContent=candidate?.name||(model.skills.length?'技を選んでください':'継承する経験なし');
 $('#begin-life').textContent=committed?'名前・血筋を決める':candidate?'この技の経験を継ぐ':model.skills.length?'技を選ぶ':'次の人生の支度へ';
 if(s&&candidate?.id!==s.id)$('#command-detail').textContent='現在の選択：'+s.name+'（まだ変更していません）';
}
function stepLife(direction){if(!view.history)return;const r=active().record;if(!r)return;const index=model.records.findIndex(x=>x.key===r.key)+direction;if(index>=0&&index<model.records.length)browseRecord(model.records[index].key);}
$('#time-dial').oninput=e=>{const r=model.records[Number(e.target.value)];if(r&&r.key!==active().record?.key)browseRecord(r.key);};
$('#open-index').onclick=showHistory;
$('#exit-history').onclick=returnHome;
$('#memory-choices').onclick=e=>{const b=e.target.closest('[data-memory-id]');if(b){const id=+b.dataset.memoryId;browseSkill(id);scope.querySelectorAll('[data-memory-id]').forEach(n=>{if(+n.dataset.memoryId===id)n.focus({preventScroll:true});});}};
$('#memory-prev').onclick=()=>{view.skillPage--;renderSkills();enter($('#memory-choices'),-8);};
$('#memory-next').onclick=()=>{view.skillPage++;renderSkills();enter($('#memory-choices'),8);};
$('#find-memory').onclick=()=>showLibrary('skills');
$('#scene').addEventListener('pointerdown',e=>{if(!view.history||!e.isPrimary||e.button!==0||e.target.closest('button,input'))return;gesture={x:e.clientX,y:e.clientY,id:e.pointerId};});
$('#scene').addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)stepLife(dx<0?1:-1);});
$('#scene').addEventListener('pointercancel',()=>gesture=null);
$('#begin-life').onclick=()=>{
 if(busy)return;if(view.history){returnHome();return;}if(isPrologue()){startFirstLife();return;}if(model.current){resume();return;}
 if(available(active().skillId)){choose(active().skillId);showPrepare();}
 else if(model.skills.length){$('#memory-choices button')?.focus({preventScroll:true});notify('受け継ぎたい技を選んでください。');}
 else showPrepare(true);
};
const baseOpenDialog=openDialog;
openDialog=function(kind,title,html){baseOpenDialog(kind,title,html);$('#dialog-kicker').textContent=kind==='prepare'?'02 / NEXT LIFE':kind==='library'?'01 / ALL MEMORIES':kind==='record'?'LIFE / ARCHIVE':'BLOODLINE LEGACY';};
const basePrepare=showPrepare;
showPrepare=function(without=false){basePrepare(without);if(dialogKind==='prepare'){const portrait=document.createElement('div');portrait.className='birth-portrait';portrait.id='birth-portrait';portrait.innerHTML='<small>ひとつの記憶から、<br>またひとつの人生。</small>'+art(draft.race);$('#dialog-content').prepend(portrait);$('#dialog').style.setProperty('--wash',palettes[draft.race][0]);}};
const basePrepareRace=renderPrepareRace;
renderPrepareRace=function(){basePrepareRace();const p=$('#birth-portrait');if(p){p.innerHTML='<small>ひとつの記憶から、<br>またひとつの人生。</small>'+art(draft.race);animate(p,'stage-enter');$('#dialog').style.setProperty('--wash',palettes[draft.race][0]);}};
const motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let motionWanted=options.motionEnabled()&&!motionQuery?.matches,filmRace=null;
const film=$('#memory-film');film.muted=true;film.defaultMuted=true;
function updateMotionButton(){if(disposed||!$('#motion-toggle'))return;$('#motion-toggle').textContent=motionWanted?'背景動画を停止':'背景動画を再生';$('#motion-toggle').setAttribute('aria-pressed',String(motionWanted));}
function applyFilmMotion(){if(disposed||!visible||!motionWanted||document.hidden||filmRace===null){film.pause();updateMotionButton();return;}if(film.readyState>=2){const p=film.play();p?.then(()=>{if(disposed||!visible||document.hidden)film.pause();}).catch(()=>{updateMotionButton();});}updateMotionButton();}
function syncFilm(race){const next=Number.isInteger(race)&&MEMORY_FILMS[race]?race:null;if(next===filmRace)return;filmRace=next;$('#scene').classList.remove('has-film');if(next===null){film.pause();film.removeAttribute('src');film.removeAttribute('poster');film.load();}else{film.poster=MEMORY_FILMS[next].poster;film.src=MEMORY_FILMS[next].src;film.load();}updateMotionButton();}
film.addEventListener('loadeddata',()=>{if(!disposed&&filmRace!==null){$('#scene').classList.add('has-film');applyFilmMotion();}});
film.addEventListener('play',updateMotionButton);film.addEventListener('pause',updateMotionButton);
film.addEventListener('error',()=>{$('#scene').classList.remove('has-film');updateMotionButton();});

document.addEventListener('visibilitychange',applyFilmMotion,{signal:lifetime.signal});
motionQuery?.addEventListener('change',e=>{motionWanted=!e.matches;applyFilmMotion();},{signal:lifetime.signal});
$('#settings').onclick=showSettings;
/* First-life presentation and interruption-safe, state-triggered motion.
 * Motion never delays a skill/race selection or writes a game record.
 */
const moving=new WeakMap();
let pendingClose=null,lastRailPage=-1,lastLibraryState='',lastScreen='',lastOriginRace=-1;
function reducedMotion(){return !!motionQuery?.matches;}
function stopTween(node){const old=moving.get(node);if(old){moving.delete(node);old.onfinish=null;old.oncancel=null;old.cancel();}}
function tween(node,frames,options={},done=null){
 if(!node){done?.();return null;}stopTween(node);
 if(reducedMotion()||typeof node.animate!=='function'){done?.();return null;}
 const animation=node.animate(frames,{duration:240,easing:'cubic-bezier(.2,.75,.25,1)',...options});moving.set(node,animation);
 animation.onfinish=()=>{if(moving.get(node)!==animation)return;moving.delete(node);done?.();};
 // Cancellation is a normal result of repeated swipes/taps, never a rejection.
 animation.finished?.catch(()=>{});return animation;
}
function enter(node,offset=16,delay=0){return tween(node,[{opacity:0,transform:`translateY(${offset}px)`},{opacity:1,transform:'translateY(0)'}],{duration:300,delay,fill:'backwards'});}
function enterStage(keepIntroCopy=false){
 $('#scene').classList.remove('stage-enter');
 const direction=Number($('#scene').style.getPropertyValue('--direction'))||1;
 tween($('#person-heading'),[{opacity:0,transform:`translateX(${direction*20}px)`},{opacity:1,transform:'none'}],{duration:300});
 if(keepIntroCopy)stopTween($('.memory'));else enter($('.memory'),14,35);
 tween($('#large-generation'),[{opacity:0,transform:`translateX(${-direction*28}px) rotate(-10deg)`},{opacity:.17,transform:'rotate(-10deg)'}],{duration:390});
 tween($('#person-art'),[{opacity:0,transform:`translateX(${direction*30}px) scale(.97)`},{opacity:1,transform:'none'}],{duration:370});
}
function isPrologue(){return !model.current&&firstLife()&&model.skills.length===0;}
function syncPrologue(){
 const initial=isPrologue(),screen=initial?'first':view.history?'history':model.current?'resume':'inherit';
 $('#app').classList.toggle('is-prologue',initial);$('#prologue-controls').hidden=!initial;$('#history-controls').hidden=!view.history;$('#open-index').hidden=initial||view.history||(!model.records.length&&!model.skills.length);
 if(initial)$('#life-details').hidden=true;
 if(initial){
  $('#blood').innerHTML='<span class="origin-chapter">PROLOGUE <i></i> まだ、白紙の系譜</span>';
  $('#generation').textContent='あなたから始まる、一族の物語';$('#person-name').textContent='最初の命';$('#person-name').style.fontSize='';$('#life-meta').textContent='血筋のイメージ · 人生は0歳から';
  $('#skill-eyebrow').textContent='生きた経験が、次の命を導く';$('#skill-name').innerHTML='ここから、<br>つながっていく。';
  $('#skill-note').textContent='出会い、学び、生きる。その人生で磨いた技が、いつか一族の記憶になる。';
  $('#large-generation').textContent='';$('#art-caption').textContent='';$('#selected-stamp').hidden=true;
  if(!$('#origin-races').children.length){$('#origin-races').innerHTML=races.map((r,i)=>`<button data-origin-race="${i}" aria-pressed="false">${glyph(r.icon)}<span>${r.name}</span><i aria-hidden="true">✓</i></button>`).join('');}
  for(const b of scope.querySelectorAll('[data-origin-race]'))b.setAttribute('aria-pressed',String(+b.dataset.originRace===draft.race));
  $('#origin-race-description').textContent=races[draft.race].desc;
  if(scope.activeElement!==$('#origin-name'))$('#origin-name').value=draft.name;
  if(lastOriginRace!==draft.race||!$('#person-art .portrait-crop')){$('#person-art').innerHTML=art(draft.race);lastOriginRace=draft.race;}
 }else lastOriginRace=-1;
 if(lastScreen!==screen){enter($('#scene'),20);enter(initial?$('#prologue-controls'):view.history?$('#history-controls'):$('#memory-controls'),14,50);enter($('.commands'),9,85);lastScreen=screen;}
}
$('#origin-races').onclick=e=>{const b=e.target.closest('[data-origin-race]');if(!b||+b.dataset.originRace===draft.race)return;draft.race=+b.dataset.originRace;syncStage(true);syncCommand();tween(b,[{transform:'translateY(-4px)'},{transform:'translateY(0)'}],{duration:220});enter($('#origin-race-description'),5);};
$('#origin-name').oninput=e=>{draft.name=e.target.value.slice(0,12);syncCommand();};
$('#origin-name').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();e.target.blur();$('#begin-life').focus({preventScroll:true});}};
$('#origin-name').addEventListener('change',()=>{draft.name=$('#origin-name').value.slice(0,12);syncCommand();enter($('#command-name'),5);});
function startFirstLife(){
 if(busy||!isPrologue())return;draft.name=$('#origin-name').value.slice(0,12);draft.inherit=null;
 openDialog('starting','最初の命を迎える',`<div class="birth-sign">${glyph(races[draft.race].icon)}</div><p class="origin-start-name"></p><p class="dialog-note">0歳から、最初の人生が始まります。</p><p id="start-error" class="start-error" role="alert" hidden></p><button id="confirm-birth" class="dialog-action">人生を始める</button>`);
 $('.origin-start-name').textContent=(draft.name.trim()||'名前はおまかせ')+' · '+races[draft.race].name;$('#confirm-birth').onclick=()=>launch('new');return launch('new');
}
// Existing dialogs keep native focus/inert behavior throughout their exit motion.
const instantClose=closeDialog;
function finishClose(){if(!pendingClose)return;const job=pendingClose;pendingClose=null;stopTween($('#dialog'));$('#dialog').classList.remove('is-closing');$('#dialog').inert=false;instantClose();if(job.target?.isConnected)job.target.focus({preventScroll:true});enter($('#scene'),-9);}
closeDialog=function(destination=null){
 if(busy||pendingClose||!$('#dialog').open)return;
 pendingClose={target:destination?.nodeType===1?destination:null};$('#dialog').classList.add('is-closing');$('#dialog').inert=true;
 const shift=window.innerWidth<700?'translateY(28px)':'translateX(38px)';
 tween($('#dialog'),[{opacity:1,transform:'none'},{opacity:0,transform:shift}],{duration:170,easing:'ease-in'},finishClose);
};
$('#close-dialog').onclick=()=>closeDialog();
const openWithTheatre=openDialog;
openDialog=function(kind,title,html){
 const swapping=$('#dialog').open&&!pendingClose,oldKind=dialogKind;
 if(pendingClose)finishClose();
 openWithTheatre(kind,title,html);$('#dialog').inert=false;
 $('#dialog-kicker').textContent=kind==='prepare'?'02 / NEXT LIFE':kind==='library'?'01 / ALL MEMORIES':kind==='starting'?'PROLOGUE / FIRST LIFE':kind==='launched'?'A NEW CHAPTER':'BLOODLINE LEGACY';
 if(swapping){stopTween($('#dialog'));enter($('#dialog-content'),kind==='library'?-20:20);enter($('#dialog-title'),oldKind===kind?5:12);}
 else{enter($('#dialog-content'),18,65);}
 if(kind==='launched'){const seal=document.createElement('div');seal.className='birth-sign';seal.innerHTML=glyph('leaf');$('#dialog-content').prepend(seal);tween(seal,[{opacity:0,transform:'scale(.6) rotate(-18deg)'},{opacity:1,transform:'scale(1) rotate(0)'}],{duration:420});}
};
// Small content changes animate locally; typing does not replay the whole sheet.
const railWithTheatre=renderRail;
renderRail=function(){const page=view.railPage,changed=page!==lastRailPage;railWithTheatre();if(changed){const direction=page>=lastRailPage?1:-1;tween($('#archive'),[{opacity:0,transform:`translateX(${direction*22}px)`},{opacity:1,transform:'none'}],{duration:260});lastRailPage=page;}else{tween($('#archive [aria-pressed="true"]'),[{opacity:.65,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:180});}};
const resultsWithTheatre=libraryResults;
libraryResults=function(){const key=[view.tab,view.phase,view.page].join('|'),major=key!==lastLibraryState;resultsWithTheatre();Array.from(scope.querySelectorAll('.index-row')).forEach((n,i)=>enter(n,major?14:3,major?i*22:0));lastLibraryState=key;enter($('#result-count'),3);};
const chooseWithTheatre=choose;
choose=function(id){const ok=chooseWithTheatre(id);if(ok){enter($('#selected-stamp'),-8);tween($('#begin-life'),[{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:220});enter($('#command-name'),6);}return ok;};
const prepareRaceWithTheatre=renderPrepareRace;
renderPrepareRace=function(){prepareRaceWithTheatre();const p=$('#birth-portrait');if(p){p.classList.remove('stage-enter');enter(p.querySelector('.art'),10);enter($('#race-description'),4);}};
// One decoder. A short-lived captured frame bridges source changes; rapid input
// cancels the previous bridge and never queues playback of an obsolete person.
let filmBridge=null;
const changeFilm=syncFilm;
function discardBridge(){if(filmBridge){stopTween(filmBridge);filmBridge.remove();filmBridge=null;}}
syncFilm=function(race){
 const next=Number.isInteger(race)&&MEMORY_FILMS[race]?race:null;if(next===filmRace)return;
 discardBridge();let bridge=null;
 if(!reducedMotion()&&filmRace!==null){
  if(film.readyState>=2&&film.videoWidth){try{const c=document.createElement('canvas');c.width=film.videoWidth;c.height=film.videoHeight;c.getContext('2d').drawImage(film,0,0);bridge=c;}catch{bridge=null;}}
  if(!bridge){bridge=document.createElement('div');bridge.style.backgroundImage=`url("${film.poster}")`;}
  bridge.className='film-bridge';bridge.setAttribute('aria-hidden','true');$('#scene').append(bridge);filmBridge=bridge;
 }
 changeFilm(race);
 if(next!==null){$('#scene').classList.add('has-film');tween(film,[{opacity:.4,transform:'scale(1.025)'},{opacity:1,transform:'scale(1)'}],{duration:330});}
 if(bridge){const captured=bridge;tween(bridge,[{opacity:1},{opacity:0}],{duration:310},()=>{captured.remove();if(filmBridge===captured)filmBridge=null;});}
};
film.addEventListener('error',discardBridge);
motionQuery?.addEventListener('change',()=>{if(reducedMotion()){discardBridge();finishClose();for(const n of scope.querySelectorAll('#app *,#dialog *'))stopTween(n);}},{signal:lifetime.signal});
const oldLaunchControls=launchControls;
launchControls=function(disabled){oldLaunchControls(disabled);$('#dialog').classList.toggle('is-starting',disabled);if(!disabled&&$('#start-error'))enter($('#start-error'),6);};

 function dismissDialog(){
  pendingClose=null;stopTween($('#dialog'));$('#dialog').classList.remove('is-closing');
  $('#dialog').inert=false;if($('#dialog').open)$('#dialog').close();$('#app').inert=false;dialogKind='';
 }
 function persistDraft(){if(!disposed&&!model.current)options.saveDraft(clone(draft));}
 scope.addEventListener('input',persistDraft);
 scope.addEventListener('change',persistDraft);
 scope.addEventListener('click',persistDraft);
 scope.addEventListener('keydown',e=>{
  // Keep gameplay shortcuts outside this component. Native dialog handles its own focus.
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if($('#dialog').open){closeDialog();}else if(!busy){if(view.history)returnHome();else options.back();}return;}
  if(e.key==='Tab'&&!$('#dialog').open){
   const nodes=[...scope.querySelectorAll('#app button:not(:disabled),#app input:not(:disabled)')].filter(n=>!n.closest('[hidden]')&&getComputedStyle(n).display!=='none');
   if(e.shiftKey&&scope.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}
   else if(!e.shiftKey&&scope.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}
  }
  e.stopPropagation();
 });
 scope.addEventListener('keyup',e=>e.stopPropagation());
 $('#return-game').hidden=!options.inGame;
 $('#return-game').onclick=()=>options.back();
 $('#lineage-build').textContent=options.buildLabel;$('#lineage-build').title=options.buildTitle||options.buildLabel;
 load(options.source());enterStage();
 return {
  scope,
  refresh(){if(disposed)return;load(options.source(),true);},
  getDraft:()=>clone(draft),
  setVisible(value){visible=value;if(!value)dismissDialog();$('#app').inert=busy||$('#dialog').open;applyFilmMotion();},
  focus(){($('#return-game').hidden?$('#begin-life'):$('#return-game')).focus({preventScroll:true});},
  getState:()=>clone({draft,view,busy,dialogKind}),
  destroy(){if(disposed)return;disposed=true;lifetime.abort();clearTimeout(toastTimer);dismissDialog();discardBridge();film.pause();film.removeAttribute('src');film.removeAttribute('poster');film.load();for(const n of scope.querySelectorAll('*'))stopTween(n);scope.replaceChildren();}
 };
}
