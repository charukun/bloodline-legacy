

const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Keep identity attached to this HTML, never to a separately refreshed manifest.
const buildVersionMarkup=()=>{const b=typeof BUILD_INFO==='undefined'?null:BUILD_INFO;return `<span data-build-version title="${ESC(b?`${b.environment} · ${b.commit}`:'local / unbuilt')}">${ESC(b?.displayVersion || `v${VERSION}-local · unbuilt`)}</span>`;};
const UI_PATH={leaf:'M12 21V8m0 7C3 15 2 9 3 5c7 0 9 3 9 10Zm0-5c0-6 5-8 9-8 1 6-3 9-9 9',sword:'m4 20 3-3m-3-3 6 6M8 16l11-13 2 1-1 4L11 18',bag:'M8 3h8l-2 5c6 2 7 6 6 11-3 3-13 3-16 0-1-5 0-9 6-11Zm1 5h6m-9 6h12',book:'M12 5C8 2 3 3 2 4v16c4-2 7-1 10 1m0-16c4-3 9-2 10-1v16c-4-2-7-1-10 1Zm0 0v16',home:'m2 11 10-8 10 8M5 9v12h5v-7h4v7h5V9',menu:'M4 6h16M4 12h16M4 18h16',close:'m5 5 14 14M5 19 19 5',back:'m14 4-8 8 8 8M6 12h15',shield:'m12 2 8 4-1 10-7 6-7-6L4 6Zm0 4v12',rest:'M11 4a2 2 0 1 0 0 .1M10 9l-1 6 7 0 3 6M9 15l-4 5h8M9 10l5 2 3-3',hand:'M7 21 3 12q1-2 3 0l2 2V5q2-2 3 0v7-9q2-1 3 1v8-8q2-1 3 1v8-5q3-1 3 2v8l-4 3Z',helm:'M4 15V9a8 8 0 0 1 16 0v6l-5 6h-6Zm0-3 7 3v6m9-9-7 3v6',arrow:'m8 4 8 8-8 8',sound:'M3 9h4l5-5v16l-5-5H3Zm13-2q6 5 0 10m-1-7q2 2 0 4',fire:'M12 2c3 7-4 6 1 11 3-1 4-4 4-4 9 10-2 17-9 11-6-5 0-12 4-18Z',star:'m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z',boat:'M4 16 12 20l8-4-3 6H7Zm8-13v12M10 5 3 13h7m4-8 7 8h-7',heart:'M12 21C-6 9 5-3 12 6 19-3 30 9 12 21Z',hammer:'m4 21 9-12m-4-5 4-3 8 8-4 4Z'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="${UI_PATH[name]||UI_PATH.star}"/></svg>`;
const schoolIcon=s=>({unarmed:'hand',heavy:'hammer',light:'feather',shield:'shield',blade:'sword',magic:'star',church:'sun',occult:'moon',sword:'sword'})[s]||'sword';
const label=(text,cls='')=>typeof GAME_LABELS!=='undefined'&&GAME_LABELS[text]?`<img class="ink-label ${cls}" alt="${ESC(text)}" src="${GAME_LABELS[text]}">`:`<span class="${cls}">${ESC(text)}</span>`;

Object.assign(UI_PATH,{
 gear:'m9 2-.5 3-2 1.2-2.8-1-2 3.5L4 11v2l-2.3 2.3 2 3.5 2.8-1 2 1.2.5 3h6l.5-3 2-1.2 2.8 1 2-3.5L20 13v-2l2.3-2.3-2-3.5-2.8 1-2-1.2L15 2ZM16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0',
 mic:'M8 5a4 4 0 0 1 8 0v7a4 4 0 0 1-8 0Zm-3 6v1a7 7 0 0 0 14 0v-1M12 19v4m-4 0h8',
 talk:'M4 3h16q3 0 3 3v10q0 3-3 3H11l-6 4v-4H4q-3 0-3-3V6q0-3 3-3Zm3 7h.1m5 0h.1m5 0h.1',
 map:'m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3Zm6-3v17m8-14v17',
 bell:'M12 2v2m-7 12 2-3V9a5 5 0 0 1 10 0v4l2 3Zm-4 3q-3 4-6 0',
 stone:'m3 17 2-10 9-4 7 8-2 8-10 2Zm2-10 8 5 6 7m-6-7-4 9',
 feather:'M4 21 17 5M6 15C-2 5 15 0 21 2c0 9-5 19-15 13Zm4-6 1 7m4-11 1 5',
 net:'M3 3h18v18H3Zm0 6h18M3 15h18M9 3v18m6-18v18',
 sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M17 12a5 5 0 1 1-10 0 5 5 0 1 1 10 0',
 moon:'M19 17A9 9 0 0 1 9 3a10 10 0 1 0 10 14Z',
 spark:'M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z',
 cloth:'m8 3 4 3 4-3 6 5-4 5-2-2v11H8V11l-2 2-4-5Z',
 boot:'M6 3h9v10l5 3q3 5-2 6H4V11Zm-2 15h17',
 eye:'M2 12q10-14 20 0-10 14-20 0Zm14 0a4 4 0 1 1-8 0 4 4 0 1 1 8 0'
});
const costMarks=s=>`<span class="cost-marks" role="img" aria-label="消耗 ${staminaTier(s)}段階">${Array.from({length:5},(_,i)=>`<i class="${i<staminaTier(s)?'lit':''}"></i>`).join('')}</span>`;
const schoolName=s=>({unarmed:'体術',blade:'剣技',heavy:'剛技',light:'軽業',shield:'盾術',magic:'魔術',church:'信仰',occult:'禁術'})[s]||'武術';
const itemIcon=id=>icon(ITEMS[id]?.icon||'bag');
function anatomy(p,large=false){const color=part=>({light:'#d2ae61',heavy:'#ce7459',lost:'#484340'})[p.wounds?.[part]?.severity]||'#b4c7a2';return `<svg class="anatomy ${large?'large':''}" viewBox="0 0 58 96" role="img" aria-label="部位の傷"><g stroke="#ebdfbb" stroke-width="1.15"><circle data-part="head" cx="29" cy="12" r="9" fill="${color('head')}"/><path data-part="torso" d="M20 25q9-5 18 0l1 30q-10 7-20 0Z" fill="${color('torso')}"/><path data-part="rightArm" d="m17 26-7 2-6 29q0 6 6 4l10-26" fill="${color('rightArm')}"/><path data-part="leftArm" d="m41 26 7 2 6 29q0 6-6 4L38 35" fill="${color('leftArm')}"/><path data-part="rightLeg" d="m20 57-3 31q0 8 9 4l3-33" fill="${color('rightLeg')}"/><path data-part="leftLeg" d="m38 57 3 31q0 8-9 4l-3-33" fill="${color('leftLeg')}"/></g></svg>`;}
function orb(){return `<div class="stamina-orb" role="img" aria-label="息に余裕がある"><svg viewBox="0 0 72 96"><defs><linearGradient id="gold" x2=".8" y2="1"><stop stop-color="#f3dda8"/><stop offset=".36" stop-color="#a3844f"/><stop offset=".56" stop-color="#e4c897"/><stop offset="1" stop-color="#806039"/></linearGradient><radialGradient id="glass" cx=".4" cy=".3"><stop stop-color="#314733"/><stop offset="1" stop-color="#1c302c"/></radialGradient><linearGradient id="water" x2=".1" y2="1"><stop stop-color="#c7eeae"/><stop offset=".23" stop-color="#8fc789"/><stop offset=".6" stop-color="#538e6b"/><stop offset="1" stop-color="#285d50"/></linearGradient><clipPath id="orb-clip"><ellipse cx="36" cy="44" rx="22.8" ry="31"/></clipPath><radialGradient id="orbshine"><stop stop-color="#effada" stop-opacity=".35"/><stop offset="1" stop-color="#effada" stop-opacity="0"/></radialGradient></defs><path d="M36 3q-5 9-13 12C3 22 2 66 24 78q8 4 12 13 4-9 12-13C70 66 69 22 49 15Q41 12 36 3Z" fill="#685c43" stroke="url(#gold)" stroke-width="1.7"/><ellipse cx="36" cy="44" rx="26" ry="35" fill="none" stroke="url(#gold)" stroke-width="2.5"/><ellipse cx="36" cy="44" rx="23" ry="31.5" fill="url(#glass)"/><g clip-path="url(#orb-clip)"><path id="orb-cap" fill="#2c3027" opacity=".75"/><path id="orb-water" fill="url(#water)"/><path id="orb-wave" fill="none" stroke="#e8f7c8" stroke-width="1.1"/><ellipse cx="29" cy="30" rx="15" ry="23" fill="url(#orbshine)"/><circle cx="27" cy="56" r="1.3" fill="#edfadd" opacity=".62"/><circle cx="39" cy="64" r="1.8" fill="#bde4a8" opacity=".4"/><circle cx="45" cy="43" r=".8" fill="#f4ffdd" opacity=".7"/></g><path d="M18 39q1-18 12-22" stroke="#fff5da" stroke-width="2.3" stroke-linecap="round" opacity=".73" fill="none"/><path d="M48 56q-2 13-10 15" stroke="#e1efd4" opacity=".28" stroke-width="1" fill="none"/><g fill="#789269" stroke="#b9ba85" stroke-width=".7"><path d="M23 76Q8 79 8 66 19 63 23 76Z"/><path d="M16 67Q3 65 6 55 15 56 16 67Z"/><path d="M49 76q15 3 15-10-11-3-15 10Z"/><path d="M56 67q13-2 10-12-9 1-10 12Z"/></g><path d="m36 8 3 5-3 4-3-4Zm0 71 4 6-4 6-4-6Z" fill="#acbb80" stroke="#e4c997"/><path d="M29 8Q36-1 43 8M30 89q6 6 12 0" fill="none" stroke="url(#gold)" stroke-width="1.5"/></svg></div>`;}
// Brass edge and padded leather share the scene's upper-left light direction.
// Decorative only: all live identity, stamina and wound data remain in the HUD DOM.
function hudIdentityFrame(){return `<svg class="vitals-frame" viewBox="0 0 270 66" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="vitals-metal" x2="1" y2="1"><stop stop-color="#f3dfa9"/><stop offset=".24" stop-color="#c2a570"/><stop offset=".53" stop-color="#806a43"/><stop offset=".76" stop-color="#c4a571"/><stop offset="1" stop-color="#786241"/></linearGradient></defs><path d="M23 2H239q5 6 20 6l8 23-8 24q-15 0-20 7H23Q9 61 3 51V13Q9 3 23 2Z" transform="translate(0 3)" fill="#50412c" stroke="#353625" stroke-width="2"/><path d="M23 2H239q5 6 20 6l8 23-8 24q-15 0-20 7H23Q9 61 3 51V13Q9 3 23 2Z" fill="url(#vitals-metal)" stroke="#e7ce97"/><path d="M26 7H237q7 6 18 6l7 18-7 19q-11 1-18 7H26Q15 57 8 48V16Q15 7 26 7Z" fill="#4c6040" fill-opacity=".94" stroke="#3e412b" stroke-width="2"/><path d="M28 10H236q7 6 16 6M18 14q-7 5-7 12" fill="none" stroke="#e5dfa8" opacity=".4"/><path d="M26 54H235q7-6 16-6" fill="none" stroke="#233620" stroke-width="2"/><path transform="translate(128 -45)" d="M55 50q24-8 41 0m-24-2q-7-9-13-5 3 7 13 5m9 0q8-9 14-5-4 7-14 5" fill="none" stroke="#c7b079" stroke-width=".9" opacity=".7"/></svg>`;}
class UI {
 constructor(game){this.g=game;this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;this.modal=null;this.phase=0;this.detail=null;this.clan=document.getElementById('clan-screen');this.hud=document.getElementById('hud');this.root=document.getElementById('modal-root');this.lastSkills='';this.lastContext='';this.deathShown='';this.portraits=new Map();this.portraitQueue=[];this.floatLines=[];this.pieDragging=false;this.hudPortrait='';this.lineageView=new UILineage(this);this.navigation=[];this.talkFan=new UITalkFan(this);this.worldNodes=new Map();this.notices=new UINoticeQueue();this.root.addEventListener('keydown',e=>this.modalKey(e));}
 toast(text){this.notify({key:'toast:'+text,parts:[text],priority:1});}
 notify(notice){this.notices.tick(performance.now());this.notices.enqueue(notice,performance.now());this.paintNotices();}
 paintNotices(){this.notices.tick(performance.now());UIValue.text(document.getElementById('toasts'),this.notices.text());const until=this.notices.active?.until||0;if(until!==this.noticeTimerAt){clearTimeout(this.noticeTimer);this.noticeTimerAt=until;if(until)this.noticeTimer=setTimeout(()=>this.paintNotices(),Math.max(1,until-performance.now()));}}
 focusMark(){const n=document.activeElement;if(!this.root.contains(n))return null;return {id:n.id,attrs:[...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])};}
 restoreFocus(mark){if(!mark)return;const n=mark.id?[...this.root.querySelectorAll('[id]')].find(n=>n.id===mark.id):[...this.root.querySelectorAll('button,summary,[tabindex]')].find(n=>mark.attrs.length&&mark.attrs.every(([k,v])=>n.getAttribute(k)===v));if(n&&!n.disabled)n.focus({preventScroll:true});}
 modalKey(e){
  if(!this.modal)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.root.querySelector('.panel-back,.panel-close')?.click();return;}
  if(e.key!=='Tab'||this.modal==='skills')return;
  const nodes=[...this.root.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="file"]),summary,[tabindex="0"]')].filter(n=>!n.closest('[hidden]')&&(!n.closest('details:not([open])')||n.tagName==='SUMMARY'));
  const first=nodes[0],last=nodes.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }
 showClan(){this.talkFan.cancel();SkillPresentation.clear(this);this.closeModal();this.notices=new UINoticeQueue();this.paintNotices();this.worldNodes.clear();this.hud.classList.add('hidden');document.getElementById('world-labels').innerHTML='';this.clan.classList.remove('hidden');this.renderClan();}
 renderClan(){this.lineageView.renderClan();}
 showGame(){this.talkFan.cancel();this.lineageView.showGame();this.damageFeedback=new UIDamageFeedback();this.facilityGroups=new Map();this.lastContext=null;this.hudPortrait='';this.lastWounds=null;this.lastMother=null;this.lastGifts=null;this.pickupKey=null;this.mapSignature=null;this.worldNodes.clear();document.getElementById('world-labels').replaceChildren();this.clan.classList.add('hidden');this.hud.classList.remove('hidden');this.hud.innerHTML=`<section class="player-vitals" aria-label="旅人の状態"><div class="player-mark">${hudIdentityFrame()}<div class="portrait-frame" id="hud-portrait">${icon('leaf')}</div><div class="player-info"><strong id="player-name"></strong><div class="life-line"><span id="age"></span><span id="condition"></span></div></div><div class="orb-wrap">${orb()}</div></div><button class="wound-mark" id="wound-mark" aria-label="傷のある部位"></button></section><div class="place-mark"><div class="day-line">${icon('sun')}<span id="day"></span></div><span id="place"></span></div><button class="mini-map" id="mini-map" aria-label="地図"><canvas id="map-preview" width="200" height="200"></canvas><i>${icon('map')}</i></button><nav class="hud-bottom" aria-label="旅のメニュー"><button data-menu="skills" class="hud-button" aria-controls="game-panel" aria-expanded="false">${icon('leaf')}${label('意識')}</button><button data-menu="body" class="hud-button" aria-controls="game-panel" aria-expanded="false">${icon('bag')}${label('身支度')}</button></nav><button id="hud-settings" data-menu="settings" class="settings-gear" aria-label="設定" title="設定" aria-controls="game-panel" aria-expanded="false">${icon('gear')}</button><div id="context" class="context"></div><div id="facility-actions"></div><button class="talk-button" id="talk-button" aria-label="話す">${icon('talk')}<span>話す</span></button><div id="mother-dialogue"></div><div id="world-pickup"></div>`;
  this.hudDock=this.hud.querySelector('.hud-bottom');this.hudSettings=this.hud.querySelector('#hud-settings');this.hud.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>this.toggleMenu(b.dataset.menu,b));this.talkFan.bind(document.getElementById('talk-button'));document.getElementById('mini-map').onclick=()=>this.map();document.getElementById('wound-mark').onclick=()=>this.wounds();this.deathShown='';
 }
 blocksWorldInput(){return !!this.talkFan.menu||!!this.talkFan.pointer||!!this.modal&&this.modal!=='skills';}
 menuSection(){return ({skills:'skills',body:'body',rack:'body',settings:'settings',lineage:'settings'})[this.navigation[0]?.type||this.modal]||null;}
 toggleMenu(type,button){
  if(this.modal&&this.menuSection()===type){this.returnFocus=button;this.closeModal();return;}
  this.menuSwitch=true;
  try{this.navigation=[];this.returnFocus=button;this[type]();this.navigation=[];this.returnFocus=button;}
  finally{this.menuSwitch=false;}
 }
 mountDock(enabled){
  if(!this.hudDock)return;
  (enabled?this.root.querySelector('.game-panel'):this.hud).appendChild(this.hudDock);
  this.root.classList.toggle('has-dock',enabled);
  const section=this.menuSection();
  this.hudDock.querySelectorAll('[data-menu]').forEach(b=>UIValue.attr(b,'aria-expanded',!!this.modal&&b.dataset.menu===section));
  // Keep the one settings control reachable inside its modal, then return it to
  // the map. Never make the otherwise inert HUD interactive through an overlay.
  this.restoreSettings();
  if(this.hudSettings){
   const active=enabled&&section==='settings',close=this.root.querySelector('.panel-head .panel-close');
   if(active&&close){close.replaceWith(this.hudSettings);this.hudSettings.classList.add('panel-close');}
   UIValue.attr(this.hudSettings,'aria-expanded',active);
   UIValue.attr(this.hudSettings,'aria-label',active?'メニューを閉じる':'設定');
   UIValue.attr(this.hudSettings,'title',active?'メニューを閉じる':'設定');
  }
 }
 restoreSettings(){
  if(this.hudSettings){this.hudSettings.classList.remove('panel-close');this.hud.appendChild(this.hudSettings);}
 }
 open(type,title,html){
  this.talkFan.cancel();
  this.lineageView.beforeOpen(type);
  const current=this.modal,focus=this.focusMark(),scroll=this.root.querySelector('.panel-content')?.scrollTop||0;
  if(!current){this.g.stopInput();this.returnFocus=document.activeElement;this.navigation=[];}
  else if(current!==type&&!this.navigating&&!this.menuSwitch)this.navigation.push({type:current,phase:this.phase,focus,scroll});
  if(current&&current!==type&&type!=='skills')this.g.stopInput();
  this.skillPanelObserver?.disconnect();this.skillPanelTop=null;this.skillPanelLeft=null;
  this.pieDragging=false;this.portraitQueue=this.portraitQueue.filter(q=>q.node.id==='hud-portrait');this.modal=type;if(this.g.renderer.diorama)this.g.renderer.diorama.suspended=type==='lineage';
  for(const n of [this.hud,this.clan])n.inert=true;this.g.renderer.canvas.inert=type!=='skills';
  this.root.className='modal-root visible '+type;
  if(this.hudDock)this.hud.appendChild(this.hudDock);
  this.restoreSettings();
  this.root.innerHTML=`<section id="game-panel" class="game-panel ${['lineage','onboarding','wounds'].includes(type)?'parchment':''}" role="dialog" aria-modal="${type!=='skills'}" aria-label="${ESC(title)}">${['skills','body'].includes(type)?'':`<header class="panel-head"><button class="panel-back" aria-label="戻る">${icon('back')}</button><h2>${label(title)}</h2><button class="panel-close" aria-label="閉じる">${icon('close')}</button></header>`}<div class="panel-content">${html}</div></section>`;
  if(['skills','body'].includes(type)){
   const panel=this.root.querySelector('.game-panel');
   const measure=()=>{
    if(this.modal!==type)return;const canvas=this.g.renderer.canvas,w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight,style=getComputedStyle(this.root);
    if(w>h){const left=panel.offsetWidth?w-panel.offsetWidth-(parseFloat(style.paddingRight)||0):0;this.skillPanelLeft=left>0?clamp(left/w,.25,.88):.54;this.skillPanelTop=null;}
    else{const top=panel.offsetHeight?h-panel.offsetHeight-(parseFloat(style.paddingBottom)||0):0;this.skillPanelTop=top>0?clamp(top/h,.25,.8):.40;this.skillPanelLeft=null;}
   };
   if(typeof ResizeObserver!=='undefined'){this.skillPanelObserver=new ResizeObserver(measure);this.skillPanelObserver.observe(panel);this.skillPanelObserver.observe(this.g.renderer.canvas);}
   queueMicrotask(measure);
  }
  this.mountDock(this.g.screen==='game'&&!['death','onboarding'].includes(type));
  const back=this.root.querySelector('.panel-back'),close=this.root.querySelector('.panel-close');if(back)back.onclick=()=>this.back();if(close&&close!==this.hudSettings)close.onclick=()=>this.closeModal();
  if(current===type)this.root.querySelector('.panel-content').scrollTop=scroll;
  const generation=this.focusGeneration=(this.focusGeneration||0)+1;
  queueMicrotask(()=>{if(this.modal!==type||this.focusGeneration!==generation)return;this.root.querySelector('.panel-back,.panel-close')?.focus({preventScroll:true});if(current===type)this.restoreFocus(focus);});
 }
 back(){
  const previous=this.navigation.pop();if(!previous){this.closeModal();return;}
  this.navigating=true;try{this[previous.type]();if(previous.type==='skills'){this.phase=previous.phase;this.renderSkills();}}finally{this.navigating=false;}
  queueMicrotask(()=>{if(this.modal!==previous.type)return;this.root.querySelector('.panel-content').scrollTop=previous.scroll;this.restoreFocus(previous.focus);});
 }
 closeModal(){
  this.lineageView.closeModal();
  const closing=this.modal,returnId=this.returnFocus?.id;
  this.skillPanelObserver?.disconnect();this.skillPanelTop=null;this.skillPanelLeft=null;
  this.pieDragging=false;this.modal=null;if(this.g.renderer.diorama)this.g.renderer.diorama.suspended=false;this.detail=null;this.navigation=[];this.focusGeneration=(this.focusGeneration||0)+1;
  if(this.hudDock)this.hud.appendChild(this.hudDock);
  this.restoreSettings();
  this.root.replaceChildren();this.root.className='modal-root';this.mountDock(false);
  for(const n of [this.hud,this.clan,this.g.renderer.canvas])n.inert=false;
  this.portraitQueue=this.portraitQueue.filter(q=>q.node?.isConnected);
  if(closing&&this.g.screen==='clan'&&!this.clan.classList.contains('hidden')){this.lineageView.refreshClan();if(returnId)this.returnFocus=document.getElementById(returnId);}
  const target=this.returnFocus?.isConnected?this.returnFocus:this.g.renderer.canvas;this.returnFocus=null;target?.focus({preventScroll:true});
 }
 onboarding(done,index=0){const pages=[
  {title:'歩む、休む',glyph:'hand',text:'地面をタップして、そこへ。<br>ドラッグで歩き、フリックで駆け続ける。<br>タップで止まり、長押しでひと休み。',note:'マウスも指も、同じ操作。'},
  {title:'声を届ける',glyph:'talk',text:'「話す」を長押し。<br>扇の言葉へ指を滑らせ、離す。<br>マイクを選ぶと、声がセリフになる。',note:'中央に戻して離すと、取り消す。'},
  {title:'身体の声',glyph:'heart',text:'左上に、年齢と体調。<br>小さな身体の色が、傷の場所。<br>緑のオーブは、残っている息。',note:'話すか歩くと、休息を終える。'},
  {title:'意識',glyph:'leaf',text:'敵に近づくと、覚えた技で戦う。<br>「序・破・急」の輪を動かして配分。<br>◆が多い技ほど、息を使う。',note:'支度のあいだも、世界は進む。'}
 ];const pg=pages[index];this.open('onboarding','旅の手ほどき',`<div class="guide-emblem">${icon(pg.glyph)}</div><h3 class="guide-title">${pg.title}</h3><p class="guide-text">${pg.text}</p><p class="guide-note">${pg.note}</p><div class="guide-pages">${pages.map((_,i)=>`<i class="${i===index?'on':''}"></i>`).join('')}</div><button id="guide-next" class="begin-button">${index===pages.length-1?'旅を始める':'次へ'}${icon('arrow')}</button>`);document.getElementById('guide-next').onclick=()=>{if(index<pages.length-1)this.onboarding(done,index+1);else{this.closeModal();done?.();}};this.root.querySelector('.panel-back').onclick=()=>{if(this.navigation.length)this.back();else{this.closeModal();done?.();}};this.root.querySelector('.panel-close').onclick=()=>{this.closeModal();done?.();};}
 skills(){this.phase=0;this.detail=null;this.open('skills','意識','<div id="skills-content"></div>');this.renderSkills();SkillPresentation.opened(this);}
 renderSkills(){
  if(this.modal!=='skills')return;const focus=this.focusMark(),listScroll=this.root.querySelector('.skill-list-scroll')?.scrollTop||0,detailScroll=this.root.querySelector('#skill-detail')?.scrollTop||0,p=this.g.snapshot?.player;if(!p)return;
  const passive=this.phase===3,ids=(passive?p.passives:p.skills.filter(id=>skillById(id)&&skillPhase(skillById(id))===this.phase)).filter(id=>skillById(id));
  const weights=passive?{}:p.phaseWeights[this.phase]||{};this.lastSkills=this.skillsSignature(p);
  if(!ids.includes(this.detail))this.detail=ids.find(id=>weights[id]>0)??ids[0]??null;
  const colors=['#9aba8f','#d8b67c','#a8aec6','#c48d75','#86b4b0','#c7bb89','#bc9bba','#a7a286'];
  this.skillColors=Object.fromEntries(ids.map((id,i)=>[id,colors[i%colors.length]]));
  const sum=ids.reduce((n,id)=>n+(weights[id]||0),0),count=phaseSkillCount(weights);
  document.getElementById('skills-content').innerHTML=`<div class="skill-tabs-row"><div class="phase-tabs" role="tablist" aria-label="技の段とパッシブ">${[...PHASES,'パッシブ'].map((name,i)=>`<button role="tab" data-phase="${i}" aria-controls="skill-page" aria-selected="${this.phase===i}" class="${this.phase===i?'chosen':''}"><span class="phase-ribbon-label">${i<3?label(name):'<span>パッシブ</span>'}</span></button>`).join('')}</div><button id="skills-close" class="panel-close" aria-label="閉じる">${icon('close')}</button></div>
   <div id="skill-page" class="skill-overview ${passive?'passive-page':''}" role="tabpanel" aria-label="${passive?'パッシブ':PHASES[this.phase]}">
    <div class="skill-balance">${passive?`<div class="passive-emblem">${icon('leaf')}<strong>身についた心得</strong></div>`:`<div id="pie-wrap"></div><div class="phase-capacity" role="img" aria-label="${PHASES[this.phase]}の技 ${count} / ${MAX_PHASE_SKILLS}">${Array.from({length:MAX_PHASE_SKILLS},(_,i)=>`<i class="${i<count?'lit':''}"></i>`).join('')}</div><p class="balance-hint">輪の境目を動かして配分</p><div id="pie-legend" class="pie-legend visually-hidden"></div>`}</div>
    <div class="skill-description"><div id="skill-detail" class="skill-detail"><span>${passive?'経験から、心得が芽生える。':'この段で使う技を選ぼう。'}</span></div></div>
   </div>
   <div class="skill-list-scroll" tabindex="0" aria-label="習得した技">${[...p.skills,...p.passives].some(id=>!skillById(id))?'<p class="skill-compatibility" role="status">この版では表示できない技があります。技の記録は保持されています。最新版で記録を開いてください。</p>':''}<div class="skill-grid">${ids.length?ids.map((id,i)=>{const sk=skillById(id),locked=!passive&&skillRestriction(p,sk),enabled=passive||weights[id]>0;return`<div class="skill-cell ${enabled?'enabled':''} ${this.detail===id?'selected':''}" style="--ink:${this.skillColors[id]}"><button ${passive?'data-passive':'data-skill'}="${id}" class="skill-tile ${locked?'restricted':''}" aria-pressed="${passive?this.detail===id:enabled}" aria-controls="skill-detail" aria-label="${ESC(sk.name)}${passive?'の説明':''}">${passive?'':`<span class="skill-number">${i+1}</span>`}<span class="skill-sigil">${icon(schoolIcon(sk.school))}</span><span class="skill-name">${ESC(sk.name)}</span><span class="skill-allocation">${uiSelectionSeal(enabled)}${!passive&&enabled?`<span>${Math.round(weights[id]/sum*100)}%</span>`:''}</span></button></div>`;}).join(''):`<div class="phase-empty">${passive?'まだ、心得は芽生えていない。':'まだ、この段の技はない。'}</div>`}</div></div>`;
  document.getElementById('skills-close').onclick=()=>this.closeModal();
  this.root.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{this.phase=+b.dataset.phase;this.detail=null;this.root.querySelector('.skill-list-scroll').scrollTop=0;this.root.querySelector('#skill-detail').scrollTop=0;this.renderSkills();});
  this.root.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>this.selectSkill(+b.dataset.skill));
  this.root.querySelectorAll('[data-passive]').forEach(b=>b.onclick=()=>this.describeSkill(+b.dataset.passive));
  if(!passive)this.drawPie(ids,weights);if(this.detail!==null)this.describeSkill(this.detail);this.root.querySelector('.skill-list-scroll').scrollTop=listScroll;this.root.querySelector('#skill-detail').scrollTop=detailScroll;this.restoreFocus(focus);
 }
 skillsSignature(p){const ids=this.phase===3?p.passives.filter(id=>skillById(id)):p.skills.filter(id=>skillById(id)&&skillPhase(skillById(id))===this.phase);return JSON.stringify([p.skills,ids,p.phaseWeights[this.phase]||{},ids.map(id=>skillRestriction(p,skillById(id))),p.passives]);}
 shortDescription(sk){if(sk.miracle||sk.occult||sk.items||sk.passive)return sk.desc;return (sk.desc||'隙を突く。').split('。')[0].slice(0,29)+'。';}
 describeSkill(id){
  const sk=skillById(id),p=this.g.snapshot?.player,el=document.getElementById('skill-detail');if(!sk||!el||!p||!(sk.passive?p.passives:p.skills).includes(id))return;
  if(this.detail!==id)el.scrollTop=0;this.detail=id;
  if(!SkillPresentation.describe(this,id))el.innerHTML=`<strong>${ESC(sk.name)}</strong><span>${ESC(this.shortDescription(sk))}</span>${sk.passive?'':costMarks(sk)}${sk.items?`<small>${sk.items.map(i=>ESC(ITEMS[i].name)).join(' ＋ ')}</small>`:''}`;
  const restriction=!sk.passive&&skillRestriction(p,sk);if(restriction){const note=document.createElement('small');note.className='skill-restriction';note.textContent=restriction;el.appendChild(note);}
  this.root.querySelectorAll('[data-skill],[data-passive]').forEach(b=>{const selected=+(b.dataset.skill||b.dataset.passive)===id;b.setAttribute('aria-pressed',String(b.dataset.passive?selected:(p.phaseWeights[this.phase]?.[+b.dataset.skill]||0)>0));b.closest('.skill-cell').classList.toggle('selected',selected);});
 }
 selectSkill(id){
  const p=this.g.snapshot?.player,sk=skillById(id);
  if(!p||!sk||sk.passive||this.phase===3||skillPhase(sk)!==this.phase||!p.skills.includes(id))return;
  // Reading details during a render stays read-only; only an explicit tile activation changes the build.
  this.describeSkill(id);
  const weights={...p.phaseWeights[this.phase]};
  if(!(weights[id]>0)&&phaseSkillCount(weights)>=MAX_PHASE_SKILLS){this.toast('ひとつ外すと、新たな技を込められる。');return;}
  weights[id]=weights[id]>0?0:20;
  const accepted=this.g.command({type:'weights',phase:this.phase,weights});
  this.renderSkills();if(accepted)this.g.saveWorld();
 }

 pieMarkup(ids,weights){const entries=ids.filter(id=>weights[id]>0),sum=entries.reduce((n,id)=>n+weights[id],0);this.pieEntries=entries;this.pieAngles=[];let end=-Math.PI/2,paths='',handles='',marks='';const pos=(a,r=67)=>[104+Math.cos(a)*r,100+Math.sin(a)*r];
  const exact=entries.map(id=>weights[id]/sum*100),pct=exact.map(Math.floor);let left=100-pct.reduce((a,b)=>a+b,0);const rem=exact.map((v,i)=>({i,r:v-pct[i]})).sort((a,b)=>b.r-a.r);for(let n=0;n<left&&rem.length;n++)pct[rem[n%rem.length].i]++;
  for(let i=0;i<entries.length;i++){const start=end,delta=weights[entries[i]]/sum*TAU;end+=delta;const a=pos(start),b=pos(end),c=pos((start+end)/2,49),color=this.skillColors[entries[i]];paths+=entries.length===1?`<circle cx="104" cy="100" r="67" fill="${color}"/>`:`<path d="M104 100 L${a[0]} ${a[1]} A67 67 0 ${delta>Math.PI?1:0} 1 ${b[0]} ${b[1]}Z" fill="${color}" stroke="#e8d7b3" stroke-width=".85"/>`;if(delta>.26)marks+=`<text class="pie-index" x="${c[0]}" y="${c[1]+4}" text-anchor="middle">${ids.indexOf(entries[i])+1}</text>`;this.pieAngles.push(end);if(entries.length>1&&i<entries.length-1)handles+=`<g class="pie-handle" data-handle="${i}" role="slider" aria-label="${ESC(skillById(entries[i]).name)}の配分" aria-valuemin="1" aria-valuemax="99" aria-valuenow="${pct[i]}" tabindex="0"><circle cx="${b[0]}" cy="${b[1]}" r="29" fill="transparent"/><path class="handle-diamond" d="M${b[0]} ${b[1]-6}l6 6-6 6-6-6Z" fill="#f4e0a7" stroke="#796548" stroke-width="1.2"/></g>`;}
  const legend=entries.length?entries.map((id,i)=>`<div data-ratio="${id}"><i style="background:${this.skillColors[id]}">${ids.indexOf(id)+1}</i><span>${ESC(skillById(id).name)}</span><b>${pct[i]}<small>%</small></b></div>`).join(''):'<span class="empty-ratio">採用する技を選ぼう</span>';
  return {svg:`<circle cx="104" cy="100" r="89" fill="none" stroke="#c6b18a" stroke-width=".65"/><circle cx="104" cy="100" r="78" fill="none" stroke="#c6b18a" stroke-width=".35"/><circle cx="104" cy="100" r="71" fill="#343a31" stroke="#d3bd90" stroke-width="1.5"/><g opacity=".84">${paths}</g><circle cx="104" cy="100" r="23" fill="#41473b" stroke="#d7c69a"/>${marks}<text x="104" y="108" class="pie-center" text-anchor="middle">${PHASES[this.phase]}</text>${handles}<path d="m104 3 4 6-4 7-4-7Z M104 184l4 6-4 7-4-7Z" fill="#d8c395"/>`,legend};
 }
 drawPie(ids,weights){const markup=this.pieMarkup(ids,weights),wrap=document.getElementById('pie-wrap');wrap.innerHTML=`<svg id="balance-pie" viewBox="0 0 208 200" aria-label="${PHASES[this.phase]}の技の配分">${markup.svg}</svg>`;document.getElementById('pie-legend').innerHTML=markup.legend;const svg=document.getElementById('balance-pie');let drag=null;
  const preview=w=>{const m=this.pieMarkup(ids,w);svg.innerHTML=m.svg;document.getElementById('pie-legend').innerHTML=m.legend;};
  svg.onpointerdown=e=>{const h=e.target.closest('[data-handle]');if(!h||this.pieEntries.length<2)return;e.preventDefault();const entries=[...this.pieEntries],sum=entries.reduce((n,id)=>n+weights[id],0),vals=entries.map(id=>weights[id]/sum),index=+h.dataset.handle;drag={entries,index,vals,before:vals.slice(0,index).reduce((a,b)=>a+b,0),initial:{...weights},pid:e.pointerId};this.pieDragging=true;svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!drag||e.pointerId!==drag.pid)return;e.preventDefault();const r=svg.getBoundingClientRect(),scale=Math.min(r.width/208,r.height/200)||1,x=(e.clientX-r.left-(r.width-208*scale)/2)/scale,y=(e.clientY-r.top-(r.height-200*scale)/2)/scale,a=(Math.atan2(y-100,x-104)+Math.PI/2+TAU)%TAU/TAU,both=drag.vals[drag.index]+drag.vals[drag.index+1],minimum=Math.min(.005,both*.1),v=clamp(a-drag.before,minimum,both-minimum),w={...drag.initial};drag.entries.forEach((id,i)=>w[id]=(i===drag.index?v:i===drag.index+1?both-v:drag.vals[i])*100);drag.pending=w;preview(w);};
  const finish=e=>{if(!drag||e.pointerId!==drag.pid)return;if(e.type==='pointerup'&&drag.pending)this.g.command({type:'weights',phase:this.phase,weights:drag.pending});drag=null;this.pieDragging=false;this.renderSkills();};svg.onpointerup=finish;svg.onpointercancel=finish;svg.onlostpointercapture=e=>{if(drag)finish({...e,type:'pointercancel',pointerId:e.pointerId});};
  svg.onkeydown=e=>{const h=e.target.closest('[data-handle]');if(!h||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();const ent=this.pieEntries,i=+h.dataset.handle,sum=ent.reduce((n,id)=>n+weights[id],0),w=Object.fromEntries(ids.map(id=>[id,(weights[id]||0)/sum*100])),d=e.key==='ArrowRight'?1:-1,both=w[ent[i]]+w[ent[i+1]];w[ent[i]]=clamp(w[ent[i]]+d,.5,both-.5);w[ent[i+1]]=both-w[ent[i]];this.g.command({type:'weights',phase:this.phase,weights:w});this.renderSkills();};
 }
 body(){
  const p=this.g.snapshot?.player;if(!p)return;this.lastBody=this.bodySignature(p);
  this.open('body','身支度',`<div id="wardrobe-content"><div class="wardrobe-heading"><h2>${icon('bag')}${label('身支度')}</h2><button class="panel-close" aria-label="閉じる">${icon('close')}</button></div><div class="wardrobe-overview"><div class="wardrobe-figure" id="wardrobe-figure"></div><div class="wardrobe-description"><div id="wardrobe-detail"></div><div id="wardrobe-choice"></div></div></div><div class="wardrobe-slots" aria-label="装備と手荷物"></div></div>`);
  this.queuePortrait(p,document.getElementById('wardrobe-figure'),'wardrobe');this.describeBelonging(this.bodySlot||'weapon');
 }
 describeBelonging(slot){
  const p=this.g.snapshot?.player;if(!p||this.modal!=='body')return;
  const note=uiEquipmentNote(p,this.g.nearRack()),slots=[
   {id:'weapon',label:'得物',name:p.weapon<0?'素手':WEAPONS[p.weapon]?.name,glyph:p.weapon<0?'hand':'sword',desc:note},
   {id:'armor',label:'防具',name:ARMORS[p.armor]?.name,glyph:'cloth',desc:note},
   {id:'shield',label:'左手',name:p.shield?'木鉄の盾':'空いた手',glyph:'shield',desc:note},
   ...[0,1].map(i=>{const id=p.inventory[i],item=ITEMS[id];return {id:'item'+i,label:'手荷物 '+(i+1),name:item?.name||'空き',glyph:item?.icon||'bag',desc:item?.desc||'旅で見つけた小さな品を、ここにしまえる。',item:i,filled:!!item};})
  ];
  const selected=slots.find(x=>x.id===slot)||slots[0];this.bodySlot=selected.id;
  this.root.querySelector('.wardrobe-slots').innerHTML=slots.map(x=>`<button data-body-slot="${x.id}" class="belonging-slot ${x.item!==undefined?'inventory-slot '+(x.filled?'filled':''):''}" aria-label="${ESC(x.label+'・'+x.name)}" aria-pressed="${selected.id===x.id}" aria-controls="wardrobe-detail"><small>${ESC(x.label)}</small>${icon(x.glyph)}<strong>${ESC(x.name)}</strong></button>`).join('');
  this.root.querySelectorAll('[data-body-slot]').forEach(b=>b.onclick=()=>{this.describeBelonging(b.dataset.bodySlot);this.root.querySelector(`[data-body-slot="${b.dataset.bodySlot}"]`)?.focus({preventScroll:true});});
  document.getElementById('wardrobe-detail').innerHTML=`<small>${ESC(selected.label)}</small><h3>${ESC(selected.name)}</h3><p>${ESC(selected.desc)}</p>${selected.item!==undefined&&p.inventory.length===MAX_ITEMS&&p.passives.includes(4060)?`<p class="wardrobe-affinity">${icon('spark')}${itemAffinity(p).some(s=>s.items.length===2)?'ふたつの理が、響き合う。':'ふたつの品を、見比べる。'}</p>`:''}`;
  document.getElementById('wardrobe-choice').innerHTML=selected.item!==undefined&&selected.filled?`<button data-discard="${selected.item}" aria-label="${ESC(selected.name)}を手放す">${icon('hand')}手放す</button>`:'';
  this.root.querySelector('[data-discard]')?.addEventListener('click',()=>{this.g.command({type:'discard',slot:selected.item});this.body();queueMicrotask(()=>this.root.querySelector(`[data-body-slot="${selected.id}"]`)?.focus({preventScroll:true}));});
 }
 bodySignature(p){return JSON.stringify([p.id,p.inventory,p.weapon,p.armor,p.shield,p.age<EQUIP_AGE,this.g.nearRack(),p.passives]);}
 wounds(){
  const p=this.g.snapshot?.player;if(!p)return;const hurt=Object.entries(p.wounds||{}),figure=anatomy(p,true),list=hurt.length?hurt.map(([k,w])=>`<div><span>${BODY_NAMES[k]}</span><strong class="${w.severity}">${WOUND_NAMES[w.severity]}</strong></div>`).join(''):'<p>傷は、ない。</p>';
  if(this.modal==='wounds'){this.root.querySelector('.wounds-figure').innerHTML=figure;this.root.querySelector('.wound-list').innerHTML=list;return;}
  this.open('wounds','身体の声',`<div class="wounds-figure">${figure}</div><div class="wound-list">${list}</div><div class="wound-key"><span>◆ 軽傷</span><span>◆ 重傷</span><span>◆ 欠損</span></div>`);
 }
 canUseRack(){const p=this.g.snapshot?.player;return this.g.screen==='game'&&canAct(p)&&!p.prologue&&!p.rescueTarget&&!p.traversal&&this.g.nearRack();}
 rack(){if(!this.canUseRack()){if(this.modal==='rack'||this.navigating)this.closeModal();return false;}const p=this.g.snapshot.player,near=true,minor=p.age<EQUIP_AGE,blocked=minor;this.lastGear=[p.weapon,p.armor,p.shield,minor,near].join(':');this.open('rack','武具棚',`<p class="rack-note">${uiEquipmentNote(p,near)}</p><h3>得物</h3><div class="gear-grid">${[{name:'素手',id:-1},...WEAPONS.map((w,i)=>({...w,id:i}))].map(w=>`<button data-slot="weapon" data-value="${w.id}" aria-pressed="${p.weapon===w.id}" class="${p.weapon===w.id?'chosen':''}" ${blocked?'disabled':''}>${icon(w.id<0?'hand':w.id===4?'hammer':'sword')}<span>${w.name}</span>${uiSelectionSeal(p.weapon===w.id)}</button>`).join('')}</div><h3>身を包む</h3><div class="gear-grid">${ARMORS.map((a,i)=>`<button data-slot="armor" data-value="${i}" aria-pressed="${p.armor===i}" class="${p.armor===i?'chosen':''}" ${blocked?'disabled':''}>${icon(i===0?'cloth':'helm')}<span>${a.name}</span>${uiSelectionSeal(p.armor===i)}</button>`).join('')}</div><h3>左手</h3><div class="gear-grid">${[false,true].map(a=>`<button data-slot="shield" data-value="${a}" aria-pressed="${p.shield===a}" class="${p.shield===a?'chosen':''}" ${blocked?'disabled':''}>${icon(a?'shield':'hand')}<span>${a?'盾を持つ':'手を空ける'}</span>${uiSelectionSeal(p.shield===a)}</button>`).join('')}</div><p class="rack-school">今の学び · ${schoolName(gearSchool(p))}</p>`);this.root.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{if(!this.canUseRack()){this.closeModal();return;}const value=b.dataset.slot==='shield'?b.dataset.value==='true':+b.dataset.value;if(this.g.command({type:'equip',slot:b.dataset.slot,value})){this.rack();}});}
 queuePortrait(p,node,suffix=''){const record={id:p.id,name:p.name,appearance:{...p,prologue:false},skills:[suffix==='hud'||suffix==='wardrobe'?null:p.currentSkill||4000],idle:suffix==='hud'||suffix==='wardrobe',head:suffix==='hud'},key=JSON.stringify([suffix,p.id,p.race,Math.floor(p.age/7),p.hair,p.weapon,p.armor,p.shield,p.skin]);if(this.portraits.has(key))node.innerHTML=`<img alt="${ESC(p.name)}の姿" src="${this.portraits.get(key)}">`;else this.portraitQueue.push({key,record,node});}
 lineage(){this.lineageView.open();}
 talk(){this.talkFan.toggle();}
 map(){this.open('map','村の地図','<canvas id="large-map" width="640" height="640"></canvas><div class="map-legend"><span>◆ 今いる場所</span><span>○ 学びの場所</span></div>');this.paintMap(document.getElementById('large-map'),this.g.snapshot,true);}
 paintMap(canvas,s,large=false){if(!canvas||!s)return;const ctx=canvas.getContext('2d'),w=canvas.width;ctx.clearRect(0,0,w,w);const isFront=s.room.kind==='front',map=s.map,cx=isFront?0:0,cz=isFront?-(s.room.stage*44+18):-7,range=large?42:30,point=(x,z)=>[w/2+(x-cx)*w/(range*2),w/2+(z-cz)*w/(range*2)];ctx.fillStyle='#d7d0a5';ctx.fillRect(0,0,w,w);ctx.strokeStyle='#ece0b7';ctx.lineWidth=w*.024;ctx.beginPath();const a=point(0,-48),b=point(0,30);ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();if(!isFront){for(const z of [7,-19]){ctx.beginPath();ctx.moveTo(...point(-32,z));ctx.lineTo(...point(32,z));ctx.stroke();}for(const h of map.houses){const [x,y]=point(h.x,h.z);ctx.fillStyle=['#9aa684','#af9a79','#899f9d','#b4977c'][h.id%4];ctx.fillRect(x-3,y-3,6,6);}for(const school of map.schools){const [x,y]=point(school.x,school.z);ctx.fillStyle=school.color;ctx.strokeStyle='#8b795b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,large?8:5,0,TAU);ctx.fill();ctx.stroke();if(large){ctx.fillStyle='#4d4c36';ctx.font='18px serif';ctx.textAlign='center';ctx.fillText(school.short,x,y+25);}}}for(const a of s.actors.filter(a=>a.alive&&a.kind!=='dummy')){const [x,y]=point(a.x,a.z);ctx.fillStyle=a.kind==='guard'?'#798c9b':'#aa7964';ctx.beginPath();ctx.arc(x,y,large?3:2,0,TAU);ctx.fill();}const [x,y]=point(s.player.x,s.player.z);ctx.save();ctx.translate(x,y);ctx.rotate(-(s.player.dir||0)+Math.PI);ctx.fillStyle='#d6ead2';ctx.strokeStyle='#526f6b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 dioramaSettings(){
  const d=this.g.renderer.diorama;
  if(!d)return '';
  const row=(title,attr,items,current)=>`<div class="setting-row"><span>${title}</span><div class="segments">${items.map(([id,n])=>`<button ${attr}="${id}" class="${current===id?'chosen':''}" aria-pressed="${current===id}">${n}</button>`).join('')}</div></div>`;
  return row('ぼけの強さ','data-diorama-dof',[['subtle','控えめ'],['strong','強め']],d.dof);
 }
 worldSpeedSettings(){
  const enabled=this.g.canSetWorldSpeed(),speed=enabled?this.g.worldSpeed():1;
  return `<details class="world-speed-settings"><summary>デバッグ · 世界速度 ×${speed}</summary><div class="setting-row"><span>世界速度</span><div class="segments" role="group" aria-label="デバッグ用の世界速度">${DEBUG_WORLD_SPEEDS.map(value=>`<button data-world-speed="${value}" class="${speed===value?'chosen':''}" aria-pressed="${speed===value}" ${enabled?'':'disabled'}>×${value}</button>`).join('')}</div></div><p>${enabled?'加齢・移動・戦闘・スキル習得をまとめて変更。この起動中のみ。':'共有の村の速度は変更できません。'}</p></details>`;
 }
 settings(){const p=this.g.profile,room=this.g.screen==='game'&&this.g.snapshot?.room?.kind==='village'?this.g.snapshot.room:null;this.open('settings','旅の支度',`<div class="setting-row"><span>${icon('sound')}音</span><button id="sound-toggle" class="pill">${p.sound?'響かせる':'静かに'}</button></div><div class="setting-row"><span>描画</span><div class="segments">${[['auto','自動'],['high','精細'],['medium','標準'],['low','軽量']].map(([id,n])=>`<button data-quality="${id}" class="${p.quality===id?'chosen':''}">${n}</button>`).join('')}</div></div>${this.dioramaSettings()}${this.worldSpeedSettings()}<button class="full-button" id="lineage-nav">${icon('book')}血脈の系譜${icon('arrow')}</button><button class="full-button" id="help-nav">${icon('hand')}操作の手ほどき${icon('arrow')}</button><button class="full-button" id="export-save">${icon('bag')}記録を持ち出す</button><button class="full-button" id="import-trigger">${icon('book')}記録を読み込む</button><input type="file" id="import-save" accept="application/json,.json" hidden><div class="settings-network"><label><input type="checkbox" id="online-mode" ${p.online?'checked':''}>共有の村へ</label>${room?`<div class="village-coordinate"><span>今いる村の座標</span><strong id="village-coordinate">${ESC(room.code)}</strong></div>`:''}<label for="room-code">村の座標</label><input class="room-code" id="room-code" placeholder="空欄なら、空きのある村へ" value="${ESC(p.villageCode||'')}" maxlength="24" autocapitalize="characters" autocomplete="off" spellcheck="false"><small>${this.g.serverAvailable?'共有サーバーに接続済み':'共有は同梱サーバーから起動'}</small></div>${this.g.screen==='game'?'<button class="full-button" id="to-clan">一族へ戻る</button>':''}<div class="version">${GAME_TITLE} · ${buildVersionMarkup()}</div>`);document.getElementById('sound-toggle').onclick=()=>{p.sound=!p.sound;p.sound?this.g.audio.enable():this.g.audio.disable();this.g.saveProfile();this.settings();};this.root.querySelectorAll('[data-quality]').forEach(b=>b.onclick=()=>{p.quality=b.dataset.quality;this.g.renderer.setQuality(p.quality);this.g.saveProfile();this.settings();});this.root.querySelectorAll('[data-diorama-dof]').forEach(b=>b.onclick=()=>{this.g.renderer.diorama.configure(undefined,b.dataset.dioramaDof);this.settings();});this.root.querySelectorAll('[data-world-speed]').forEach(b=>b.onclick=()=>{if(this.g.setWorldSpeed(Number(b.dataset.worldSpeed))){this.settings();this.root.querySelector('.world-speed-settings').open=true;const selected=this.root.querySelector(`[data-world-speed="${this.g.worldSpeed()}"]`);queueMicrotask(()=>{if(selected.isConnected)selected.focus({preventScroll:true});});}});document.getElementById('lineage-nav').onclick=()=>this.lineage();document.getElementById('help-nav').onclick=()=>this.onboarding(()=>{});document.getElementById('export-save').onclick=()=>this.g.exportSave();document.getElementById('import-trigger').onclick=()=>document.getElementById('import-save').click();document.getElementById('import-save').onchange=e=>this.g.importSave(e.target.files[0]);document.getElementById('online-mode').onchange=e=>{p.online=e.target.checked;this.g.saveProfile();this.settings();};document.getElementById('room-code').onchange=e=>{p.villageCode=cleanText(e.target.value,24).toUpperCase();e.target.value=p.villageCode;this.g.saveProfile();};const c=document.getElementById('to-clan');if(c)c.onclick=()=>this.g.toClan();this.g.account?.mount(this.root);}
 death(p){
  const identity=p.id+':'+p.deathAt,arrival=this.deathAcknowledged!==identity;
  const key=identity+':'+(p.legacyChoice?.state||'recorded')+':'+arrival;if(this.deathShown===key)return;this.deathShown=key;this.g.stopInput();clearTimeout(this.bequestTimer);
  if(arrival){
   const cause=p.cause==='寿命'?'寿命を迎え、息を引き取りました。':p.cause==='トドメを受けた'?(p.wasDownedOnDeath?'深手で動けなくなったところに、トドメを受けました。':'トドメを受け、命を落としました。'):p.cause==='禁術に命を捧げた'?'禁術で残りの寿命を使い果たしました。':p.cause?`死因：${p.cause}`:'死因の記録は残っていません。';
   this.open('death','旅の終わり',`<div class="death-arrival-emblem" aria-hidden="true">${icon('leaf')}</div><h3 class="death-name">${ESC(p.name)}は亡くなりました</h3><p class="death-age">享年 ${Math.floor(p.age)}歳</p><p id="death-cause">${ESC(cause)}</p><button id="death-continue" class="begin-button">この人生を振り返る${icon('arrow')}</button>`);
   this.root.classList.add('death-arrival');this.root.querySelector('.game-panel').setAttribute('aria-describedby','death-cause');
   const next=this.root.querySelector('#death-continue');next.onclick=()=>{
    const current=this.g.snapshot?.player;if(current?.alive||current?.id+':'+current?.deathAt!==identity)return;
    this.deathAcknowledged=identity;this.death(current);
   };
   queueMicrotask(()=>{if(next.isConnected)next.focus({preventScroll:true});});return;
  }
  const pending=p.legacyChoice?.state==='pending',sk=skillById(p.bankedSkills?.[0]);
  const choices=pending?p.legacyChoice.candidates.map(id=>{const s=skillById(id);return `<button class="bequest-token" data-bequest="${id}" aria-pressed="false" aria-controls="bequest-detail" aria-label="${ESC(s?.name||'この版では読めない技')}" ${s?'':'disabled'}><span class="bequest-sigil">${icon(schoolIcon(s?.school))}</span><span class="bequest-name">${ESC(s?.name||'遠い記憶')}</span><span class="bequest-phase">${s?.passive?'心得':PHASES[skillPhase(s)]||''}</span></button>`;}).join(''):'';
  this.open('death','命の灯',`<div class="death-identity"><h3 class="death-name">${ESC(p.name)}</h3><p class="death-age">享年 ${Math.floor(p.age)}歳</p></div>${SkillPresentation.recap(p)}${pending?`<p class="bequest-invitation">ひとつの技を、次の命へ</p><div class="bequest-rite"><div class="bequest-altar"><div class="bequest-memory" id="bequest-memory">${icon('leaf')}</div><div id="bequest-detail" aria-live="polite"><strong>遺す技を選ぶ</strong><p></p></div></div><div class="legacy-bequest" role="group" aria-label="後世へ遺す技" style="--bequest-columns:${Math.max(1,Math.min(4,p.legacyChoice.candidates.length))};--bequest-mobile-columns:${Math.max(1,Math.min(3,p.legacyChoice.candidates.length))}">${choices}</div><button id="bequest-confirm" class="begin-button" disabled>${icon('leaf')}<span>この技を遺す</span>${icon('arrow')}</button></div>`:`<div class="death-leaf">${icon('leaf')}</div><p>${sk?`「${ESC(sk.name)}」を、系譜に刻んだ。`:'静かな灯が、系譜に残った。'}</p><button id="next-life" class="begin-button">次の人生へ${icon('arrow')}</button><button class="full-button" id="view-lineage">系譜をひらく</button>`}`);
  if(pending){
   const buttons=[...this.root.querySelectorAll('[data-bequest]')],confirm=this.root.querySelector('#bequest-confirm');let selected=null,submitting=false;
   buttons.forEach(b=>b.onclick=()=>{
    if(submitting)return;const id=Number(b.dataset.bequest),s=skillById(id);if(!s)return;selected=id;
    buttons.forEach(n=>n.setAttribute('aria-pressed',String(n===b)));
    const memory=this.root.querySelector('#bequest-memory');memory.innerHTML=icon(schoolIcon(s.school));memory.classList.add('lit');
    const detail=this.root.querySelector('#bequest-detail');detail.querySelector('strong').textContent=s.name;detail.querySelector('p').textContent=s.desc;detail.scrollTop=0;
    confirm.disabled=false;confirm.setAttribute('aria-label',s.name+'を後世に遺す');
   });
   confirm.onclick=()=>{
    const current=this.g.snapshot?.player;
    if(submitting||selected===null||current?.id!==p.id||current.alive||current.legacyChoice?.state!=='pending'||!current.legacyChoice.candidates.includes(selected))return;
    if(!this.g.command({type:'choose-legacy',skill:selected}))return;
    submitting=true;confirm.disabled=true;confirm.setAttribute('aria-busy','true');buttons.forEach(b=>b.disabled=true);
    if(!this.g.online){this.death(this.g.snapshot.player);return;}
    // A failed / lost response must not strand the player. The authoritative command is idempotent.
    this.bequestTimer=setTimeout(()=>{if(!confirm.isConnected||this.g.snapshot?.player?.id!==p.id||this.g.snapshot.player.legacyChoice?.state!=='pending')return;submitting=false;confirm.disabled=false;confirm.removeAttribute('aria-busy');buttons.forEach(b=>b.disabled=!skillById(Number(b.dataset.bequest)));},5000);
   };
  }
  const next=this.root.querySelector('#next-life');if(next)next.onclick=()=>this.g.toClan();const view=this.root.querySelector('#view-lineage');if(view)view.onclick=()=>this.lineage();
 }

 event(e){
  if(SkillPresentation.event(this,e))return;
  const own=e.player===this.g.playerId;
  if(own&&e.type==='wound'){
   this.damageFeedback??=new UIDamageFeedback();
   this.damageFeedback.hit(e,this.g.snapshot?.t??e.t);
  }
  if(['progress','speech','miracleQuiet','insight','passive'].includes(e.type)&&(!own||!['insight','passive'].includes(e.type))){const sk=skillById(e.id);this.floatLines.push({...e,born:this.g.snapshot?.t??e.t,shown:performance.now(),text:e.type==='insight'?'閃き · '+(sk?.name||'新たな技'):e.type==='passive'?'心得 · '+(sk?.name||'新たな学び'):e.text});this.floatLines=this.floatLines.slice(-8);}
  if(e.type==='released'&&own){this.g.resetPointer?.();this.g.walkTarget=null;}
  if(!own)return;
  if(e.type==='age')this.notify({key:'age:'+e.age,parts:[e.age+'歳になった'],priority:3});
  if(e.type==='insight'||e.type==='passive'){const sk=skillById(e.id);if(sk)this.notify({key:'discovery',prefix:'新たな学び · ',parts:[sk.name],priority:1});}
  if(e.type==='released')this.notify({key:'released',parts:['自分の足で、歩き始めた'],priority:3});
  if(e.type==='death')this.notify({key:'death',parts:['命を落とした'],priority:4});
  if(own&&['downed','rescueLift','rescueSafe','revived'].includes(e.type))this.notify({key:e.type,parts:[{downed:'倒れた。息を整えて、助けを待とう',rescueLift:'安全な場所へ運んでもらっている',rescueSafe:'安全な場所に着いた',revived:'また、立ち上がれる'}[e.type]],priority:4});
  if(e.type==='notice')this.toast(e.text);if(e.type==='pickup')this.toast(ITEMS[e.item]?.name+'を受け取った');if(e.type==='depart')this.toast('向こう岸へ');if(e.type==='returned')this.toast('ただいま');
 }
 update(s,world=true){
  this.talkFan.check();this.paintNotices();if(this.g.screen!=='game'||!s?.player)return;
  const p=s.player,t=s.t,max=staminaMaximum(p),cap=clamp(p.staminaCap/max,0,1),fill=clamp(p.stamina/max,0,1);
  UIValue.text(document.getElementById('player-name'),p.name);UIValue.attr(document.getElementById('player-name'),'title',p.name);UIValue.text(document.getElementById('age'),Math.floor(p.age)+'歳');
  const state=uiCondition(p,t),condition=document.getElementById('condition');UIValue.text(condition,state.text);UIValue.attr(condition,'data-tone',state.tone);
  const q=document.querySelector('.stamina-orb');UIValue.attr(q,'aria-label',fill<.15?'息が切れそう':fill<.5?'息が浅くなってきた':'息に余裕がある');
  const orbClass='stamina-orb'+(fill<.18?' tired':'')+(p.seated?' recovering':'');UIValue.attr(q,'class',orbClass);
  const y=(75-Math.round(fill*200)/200*62).toFixed(2),ceiling=(75-Math.round(cap*200)/200*62).toFixed(2);
  UIValue.attr(document.getElementById('orb-water'),'d',`M10 ${y}Q24 ${+y-2} 36 ${y}T62 ${y}V81H10Z`);UIValue.attr(document.getElementById('orb-wave'),'d',`M12 ${y}Q24 ${+y-2} 36 ${y}T60 ${y}`);UIValue.attr(document.getElementById('orb-cap'),'d',`M10 8H62V${ceiling}H10Z`);
  UIValue.text(document.getElementById('place'),s.room.kind==='front'?'最前線':p.z<-28?'村の外れ':s.room.name);UIValue.text(document.getElementById('day'),'春の月 '+(Math.floor(t/120)%28+1)+'日');
  const woundsKey=JSON.stringify(Object.entries(p.wounds||{}).map(([part,w])=>[part,w.severity]));if(woundsKey!==this.lastWounds){this.lastWounds=woundsKey;document.getElementById('wound-mark').innerHTML=anatomy(p);UIValue.attr(document.getElementById('wound-mark'),'aria-label',Object.keys(p.wounds||{}).length?'身体の傷を確認':'身体の状態を確認');if(this.modal==='wounds')this.wounds();}
  this.damageFeedback?.paint(document.getElementById('wound-mark'),t);
  const portraitKey=[p.id,Math.floor(p.age/7),p.race,p.armor,p.weapon,p.shield,p.skin,p.hair].join(':');if(portraitKey!==this.hudPortrait){this.hudPortrait=portraitKey;this.queuePortrait(p,document.getElementById('hud-portrait'),'hud');}
  const mapSignature=JSON.stringify([s.room.id,s.room.stage,Math.round(p.x*5),Math.round(p.z*5),Math.round(p.dir*10),s.actors.filter(a=>a.alive).map(a=>[a.id,Math.round(a.x),Math.round(a.z)]),this.modal==='map']);
  if(mapSignature!==this.mapSignature){this.mapSignature=mapSignature;this.paintMap(document.getElementById('map-preview'),s);if(this.modal==='map')this.paintMap(document.getElementById('large-map'),s,true);}
  this.updateContext(s);if(world)this.updateWorld(s);
  this.lineageView.update();SkillPresentation.update(this,s);
  if(this.modal==='skills'&&!this.pieDragging){const signature=this.skillsSignature(p);if(signature!==this.lastSkills)this.renderSkills();}
  if(this.modal==='rack'){const signature=[p.weapon,p.armor,p.shield,p.age<EQUIP_AGE,this.g.nearRack()].join(':');if(!this.canUseRack()||signature!==this.lastGear)this.rack();}
  if(this.modal==='body'&&this.bodySignature(p)!==this.lastBody)this.body();if(!p.alive)this.death(p);
 }
 updateRescueActions(s){
  let node=document.getElementById('rescue-actions');if(!node){node=document.createElement('div');node.id='rescue-actions';node.className='rescue-actions';this.hud.appendChild(node);}
  node.hidden=!!this.modal;const p=s.player;
  const text=incapacitated(p)?p.lifeState==='carried'?'運んでもらっている':p.lifeState==='recovering'?'安全な場所で、息を整えている':'動けない。助けを待ちながら、息を整える':p.rescueTarget?(s.room.kind==='village'?'村の門の内側まで運ぼう':'岸辺の帰還地点まで運ぼう'):'';
  const signature=[text,p.rescueTarget,Math.ceil((1-(p.recoveryProgress||0))*100),this.modal].join(':');if(node._signature===signature)return;node._signature=signature;
  node.innerHTML=(text?`<p role="status">${ESC(text)}${incapacitated(p)&&p.lifeState!=='carried'?`<progress aria-label="復帰までの回復" max="1" value="${p.recoveryProgress||0}"></progress>`:''}</p>`:'')+(canAct(p)&&!p.prologue&&p.rescueTarget?'<button data-drop>ここで降ろす</button>':'');
  const drop=node.querySelector('[data-drop]');if(drop)drop.onclick=()=>this.g.command({type:'rescue-drop'});
 }
 updateContext(s){const p=s.player,t=s.t,school=s.room.kind==='village'?s.map.schools.find(a=>Math.hypot(a.x-p.x,a.z-p.z)<a.r):null,item=s.room.items?.find(i=>i.ready<=t&&Math.hypot(i.x-p.x,i.z-p.z)<2.3),dummy=s.actors.find(a=>a.kind==='dummy'&&a.alive&&Math.hypot(a.x-p.x,a.z-p.z)<4),options=[];
  if(!p.prologue&&canAct(p)&&!p.rescueTarget){
   if(this.g.nearRack())options.push({id:'rack',name:'武具棚',glyph:'sword',facility:'armory'});
   if(school&&p.age>=4){const a=ACTIVITY_DEFS[school.id];if(a)options.push({id:'activity',value:a.id,name:p.activity===a.id?'やめる':a.label,glyph:p.activity===a.id?'close':a.id==='pray'?'sun':a.id==='observe'?'eye':a.id==='play'?'leaf':'book',facility:school.id});}
   if(dummy&&!p.activity)options.push({id:'practice',value:dummy.id,name:p.autoFight===dummy.id?'稽古をやめる':'人形と稽古',glyph:'sword',anchor:{id:'practice:'+dummy.id,kind:'actor',target:dummy.id,height:2.95}});
   const casualty=s.players.find(q=>q.id!==p.id&&q.alive&&q.lifeState==='downed'&&!q.carrierId&&Math.hypot(q.x-p.x,q.z-p.z)<=LIFE_RULES.rescueRange);
   if(casualty)options.push({id:'rescue',value:casualty.id,name:casualty.name+'を救助',glyph:'hand',anchor:{id:'rescue:'+casualty.id,kind:'player',target:casualty.id,height:1.15}});
   if(s.room.kind==='village'&&p.z>22)options.push({id:'boat',name:p.queued?'乗船をやめる':'舟に乗る',glyph:'boat'});
   if(s.room.kind==='front')options.push({id:'return',name:'帰り舟を呼ぶ',glyph:'boat'});
  }
  this.updatePickup(item&&!p.prologue&&canAct(p)&&!p.rescueTarget?item:null,p);
  // Facility use belongs to the player's feet; interactions with a particular
  // actor belong to that actor. Calling a boat has no present world target.
  for(const o of options)if(o.facility||o.id==='boat')o.anchor={id:'feet',kind:'feet'};
  const signature=JSON.stringify(options);if(signature!==this.lastContext){this.lastContext=signature;const node=document.getElementById('context');node.innerHTML=options.filter(o=>!o.anchor).slice(0,3).map(o=>this.contextButton(o)).join('');this.bindContextButtons(node);this.syncFacilityActions(options.filter(o=>o.anchor));}
  this.positionFacilityActions(s);this.updateRescueActions(s);
 }
 contextButton(o){return `<button data-context="${o.id}" data-value="${ESC(o.value||'')}"${o.facility?` data-facility="${ESC(o.facility)}"`:''}${o.id==='rescue'?` data-rescue="${ESC(o.value)}"`:''} ${o.disabled?'disabled':''}>${icon(o.glyph)}<span>${ESC(o.name)}${o.detail?`<small>${ESC(o.detail)}</small>`:''}</span></button>`;}
 bindContextButtons(node){node.querySelectorAll('[data-context]').forEach(b=>b.onclick=()=>this.activateContext(b.dataset.context,b.dataset.value));}
 contextAvailable(o,s){
  const p=s?.player;if(this.g.screen!=='game'||!canAct(p)||p.rescueTarget||p.traversal||p.prologue||this.modal)return false;
  if(o.id==='rack')return this.g.nearRack();
  if(o.id==='activity'){const a=s.room.kind==='village'&&s.map.schools.find(a=>a.id===o.facility);return !!a&&p.age>=4&&Math.hypot(p.x-a.x,p.z-a.z)<a.r;}
  if(o.id==='boat')return s.room.kind==='village'&&p.z>22;
  if(o.id==='practice'){const a=s.actors.find(a=>a.id===o.value);return !!a&&a.kind==='dummy'&&a.alive&&!p.activity&&Math.hypot(p.x-a.x,p.z-a.z)<4;}
  if(o.id==='rescue'){const a=s.players.find(a=>a.id===o.value);return !!a&&a.id!==p.id&&a.alive&&a.lifeState==='downed'&&!a.carrierId&&Math.hypot(p.x-a.x,p.z-a.z)<=LIFE_RULES.rescueRange;}
  return o.id==='return'&&s.room.kind==='front';
 }
 activateContext(id,value){
  const option=[...this.facilityGroups.values()].flatMap(e=>e.items).find(o=>o.id===id&&String(o.value||'')===value);
  if(!this.contextAvailable(option||{id,value},this.g.snapshot))return;
  if(id==='rack'){this.rack();return;}this.g.stopInput();if(id==='activity')this.g.command({type:'activity',activity:value});if(id==='boat')this.g.command({type:'board'});if(id==='return')this.g.command({type:'return'});if(id==='rescue')this.g.command({type:'rescue',target:value});
  if(id==='practice'){const target=this.g.snapshot.actors.find(a=>a.id===value);if(this.g.snapshot.player.autoFight===target.id){this.g.command({type:'sit',active:true});return;}this.g.command({type:'move',x:0,z:0});this.g.walkTarget={x:target.x,z:target.z,until:performance.now()+7000};}
 }
 syncFacilityActions(options){
  const root=document.getElementById('facility-actions'),groups=new Map();for(const o of options){if(!groups.has(o.anchor.id))groups.set(o.anchor.id,[]);groups.get(o.anchor.id).push(o);}this.facilityGroups??=new Map();
  for(const [id,items] of groups){let entry=this.facilityGroups.get(id);if(!entry){const node=document.createElement('div');node.className='facility-context'+(items[0].anchor.kind==='feet'?' foot-context':'');node.dataset.anchor=id;root.appendChild(node);entry={node};this.facilityGroups.set(id,entry);}entry.anchor=items[0].anchor;entry.items=items;const html=items.map(o=>this.contextButton(o)).join('');
   if(entry.html!==html){const focus=entry.node.contains(document.activeElement)?{id:document.activeElement.dataset.context,value:document.activeElement.dataset.value}:null;entry.node.innerHTML=html;entry.html=html;entry.size=null;entry.buttons=[...entry.node.querySelectorAll('[data-context]')];this.bindContextButtons(entry.node);if(focus)entry.buttons.find(b=>b.dataset.context===focus.id&&b.dataset.value===focus.value)?.focus({preventScroll:true});}
  }
  for(const [id,entry] of this.facilityGroups)if(!groups.has(id)){entry.node.remove();this.facilityGroups.delete(id);}
 }
 positionFacilityActions(s){
  const r=this.g.renderer,w=r.width||innerWidth,h=r.height||innerHeight,p=s?.player,blocked=[];
  // Actor actions get their headroom first. The compact facility row stays below
  // the feet, and can move farther down to avoid a nearby target/button.
  const groups=[...(this.facilityGroups?.values()||[])].sort((a,b)=>(a.anchor.kind==='feet')-(b.anchor.kind==='feet'));
  for(const entry of groups){const {node,anchor,items,buttons}=entry,feet=anchor.kind==='feet';
   let enabled=false;items.forEach((o,i)=>{const show=this.contextAvailable(o,s);if(buttons[i].hidden===show){buttons[i].hidden=!show;entry.size=null;}enabled||=show;});
   const actor=feet?p:(anchor.kind==='player'?s.players:s.actors).find(a=>a.id===anchor.target);
   const pos=actor&&r.project(actor.x,(actor.supportHeight||0)+(feet?.2:anchor.height),actor.z);
   const visible=enabled&&pos?.visible&&pos.x>=0&&pos.x<=w&&pos.y>=0&&pos.y<=h;
   UIValue.style(node,'display',visible?'':'none');if(!visible)continue;
   if(!entry.size||entry.size.viewport!==w+'x'+h)entry.size={viewport:w+'x'+h,width:node.offsetWidth||160,height:node.offsetHeight||44};
   const size=entry.size,x=clamp(pos.x-size.width/2,8,Math.max(8,w-size.width-8));let y=feet?pos.y+14:Math.max(8,pos.y-size.height-10);
   if(feet){for(const box of blocked)if(x<box.right+8&&x+size.width>box.left-8&&y<box.bottom+8&&y+size.height>box.top-8)y=box.bottom+8;}
   // Do not pin a departing target to the edge or put a foot action over its body.
   if(y+size.height>h-8){UIValue.style(node,'display','none');continue;}
   UIValue.style(node,'transform',`translate3d(${x}px,${y}px,0)`);
   const pointer=clamp(pos.x-x,8,size.width-8)+'px';if(node.style.getPropertyValue('--anchor-x')!==pointer)node.style.setProperty('--anchor-x',pointer);
   blocked.push({left:x,right:x+size.width,top:y,bottom:y+size.height});
   if(!feet){const base=r.project(actor.x,.2,actor.z),radius=anchor.kind==='actor'?.85:1.25,corners=[];for(const dx of [-radius,radius])for(const dz of [-radius,radius])corners.push(r.project(actor.x+dx,.2,actor.z+dz));blocked.push({left:Math.min(...corners.map(q=>q.x)),right:Math.max(...corners.map(q=>q.x)),top:Math.min(pos.y,base.y),bottom:Math.max(...corners.map(q=>q.y))});}
  }
 }
 updateWorld(s){this.updateMother(s);this.updateWorldLabels(s);this.positionPickup(s);this.positionFacilityActions(s);}
 updatePickup(item,p){
  const node=document.getElementById('world-pickup'),o=item?uiPickup(item,p):null,key=JSON.stringify(o);
  if(key===this.pickupKey)return;this.pickupKey=key;
  node.replaceChildren();if(!o)return;
  const b=document.createElement('button');b.className='world-pickup';b.dataset.context='pickup';b.dataset.value=o.value;b.disabled=o.disabled;
  b.innerHTML=`${icon(o.glyph)}<span>${ESC(o.name)}<small>${ESC(o.detail)}</small></span>`;
  b.onclick=()=>{this.g.stopInput();this.g.command({type:'pickup',id:o.value});this.updateContext(this.g.snapshot);this.positionPickup(this.g.snapshot);};node.appendChild(b);
 }
 positionPickup(s){
  const node=document.getElementById('world-pickup'),b=node?.firstElementChild;if(!b)return;
  const p=s.player,item=s.room.items?.find(i=>i.id===b.dataset.value&&i.ready<=s.t&&Math.hypot(i.x-p.x,i.z-p.z)<2.3),r=this.g.renderer;
  const pos=item&&r.project(item.x,.65,item.z),w=r.width||innerWidth,h=r.height||innerHeight;
  const visible=this.g.screen==='game'&&canAct(p)&&!p.rescueTarget&&!p.traversal&&!p.prologue&&!this.modal&&pos?.visible&&pos.x>=0&&pos.x<=w&&pos.y>=0&&pos.y<=h;
  UIValue.attr(node,'class',visible?'':'hidden');if(visible)UIValue.style(node,'transform',`translate3d(${pos.x}px,${pos.y-8}px,0) translate(-50%,-100%)`);
 }
 updateMother(s){
  const p=s.player,t=s.t,node=document.getElementById('mother-dialogue'),parent=parentWorldPose(p,t),text=p.motherUntil>t&&parent?p.motherText:'';
  if(text!==this.lastMother){this.lastMother=text;node.innerHTML=text?`<small>母</small><p>${ESC(text).replaceAll('\n','<br>')}</p>`:'';node._speechSize=null;}
  UIValue.attr(node,'class','mother-bubble');this.positionSpeech(node,parent,3.05,text);
 }
 positionSpeech(node,a,height,text){
  const r=this.g.renderer,w=r.width||innerWidth,h=r.height||innerHeight,head=a&&r.project(a.x,height,a.z),body=a&&r.project(a.x,height*.5,a.z);
  // Renderer visibility includes an overscan margin. Dialogue uses the actual viewport.
  const visible=!!text&&a&&head?.visible&&body?.visible&&body.x>=0&&body.x<=w&&body.y>=0&&body.y<=h&&head.x>=0&&head.x<=w&&head.y>=0&&head.y<=h;
  UIValue.style(node,'display',visible?'':'none');if(!visible)return;
  const sizeKey=text+'|'+w+'|'+h;
  if(node._speechSize?.key!==sizeKey)node._speechSize={key:sizeKey,w:node.offsetWidth||180,h:node.offsetHeight||60};
  const size=node._speechSize,gap=13,margin=8;
  // A fixed world axis responds to the camera, never to the speaker's walking direction.
  const view=r.project(a.x+1,height,a.z),dx=view.x-head.x;
  let side=node.dataset.side||(dx<0?'left':'right');
  const preferred=dx>6?'right':dx< -6?'left':side,space={right:w-margin-head.x-gap,left:head.x-gap-margin},hysteresis=24;
  if(preferred!==side&&space[preferred]>=size.w+hysteresis)side=preferred;
  const other=side==='right'?'left':'right';
  if(space[side]<size.w&&space[other]>space[side]+hysteresis)side=other;
  UIValue.attr(node,'data-side',side);
  const x=clamp(side==='right'?head.x+gap:head.x-gap-size.w,margin,Math.max(margin,w-size.w-margin)),y=Math.max(margin,head.y-size.h-12);
  UIValue.style(node,'transform',`translate3d(${x}px,${y}px,0)`);
 }
 updateWorldLabels(s,now=performance.now()){
  const p=s.player,t=s.t,r=this.g.renderer,labels=[],head=a=>((a.age??25)<10?2.2:3.15)*(a.race===2?.86:1);
  const add=(key,cls,a,h,text,html='',offset=0)=>{const pos=r.project(a.x,h,a.z);if(!pos.visible)return;labels.push({key,cls,text,html,x:Math.round(clamp(pos.x,70,innerWidth-70)),y:Math.round(clamp(pos.y+offset,115,innerHeight-155))});};
  const target=s.actors.find(a=>a.alive&&a.id===p.autoFight);
  if(p.alive&&p.combo){const band=clamp(p.combo.band,0,2),sk=skillById(p.pendingSkill?.id??p.attackSkill??p.currentSkill);add('combo','combat-callout phase-'+band,p,head(p),'',`<b class="phase-seal">${PHASES[band]}</b><span>${ESC(sk?.name||'')}</span>`,-25);}
  if(target&&Math.hypot(target.x-p.x,target.z-p.z)<15)add('target','target-label',target,target.elite?4.3:head(target),'',`<span>${ESC(target.name||'交戦中')}</span>`,10);
  const statuses=uiActiveStatuses(p,t);if(statuses)add('status','status-caption',p,head(p),statuses,'',-91);
  const pain=this.damageFeedback?.bark;
  if(pain&&t<pain.until)add('pain:'+p.id,'pain-callout'+(pain.level>1?' strong':''),p,head(p),pain.text,'',p.combo?-66:-22);
  for(const a of [...s.players,...s.actors])if(a.alive&&a.speechUntil>t&&a.speech&&Math.hypot(a.x-p.x,a.z-p.z)<13)labels.push({key:'speech:'+a.id,cls:'speech-bubble',a,h:head(a),text:a.speech});
  // Presentation time keeps the rise smooth between simulation/network ticks.
  this.floatLines=this.floatLines.filter(e=>now-e.shown<(e.life??4.6)*1000);
  const latest=new Map();for(const e of this.floatLines)if(e.type!=='speech')latest.set(e.player,e);
  for(const e of latest.values()){
   const a=s.players.find(a=>a.id===e.player);if(!a?.alive||Math.hypot(a.x-p.x,a.z-p.z)>=14||(e.room&&e.room!==s.room.id))continue;
   const pos=r.project(a.x,head(a)+.3,a.z),w=r.width||innerWidth,h=r.height||innerHeight;
   if(!pos.visible||pos.x<0||pos.x>w||pos.y<0||pos.y>h)continue;
   const age=Math.max(0,(now-e.shown)/1000),rise=this.reducedMotion?0:age*7;
   labels.push({key:'progress:'+e.player,cls:'progress-float'+(e.type==='skillconnection'?' skill-connection':e.type==='skillglimpse'?' skill-glimpse':''),text:e.text,x:pos.x,y:pos.y-(p.combo?125:40)-rise,opacity:clamp(Math.min(age/.2,((e.life??4.6)-age)/.8),0,1),floating:true});
  }
  if(p.activity)add('activity','activity-mark',p,head(p),'',icon(p.activity==='pray'?'sun':p.activity==='play'?'leaf':'book'));
  const root=document.getElementById('world-labels'),live=new Set();
  for(const l of labels){live.add(l.key);let n=this.worldNodes.get(l.key);if(!n||!n.isConnected){n=document.createElement('div');this.worldNodes.set(l.key,n);root.appendChild(n);}UIValue.attr(n,'class',l.cls);if(l.html){if(n._uiHTML!==l.html){n.innerHTML=l.html;n._uiHTML=l.html;}}else{UIValue.text(n,l.text);n._uiHTML=null;}if(l.a)this.positionSpeech(n,l.a,l.h,l.text);else if(l.floating){UIValue.style(n,'left','0px');UIValue.style(n,'top','0px');UIValue.style(n,'transform',`translate3d(${l.x}px,${l.y}px,0) translate(-50%,-100%)`);UIValue.style(n,'opacity',String(l.opacity));}else{UIValue.style(n,'left',l.x+'px');UIValue.style(n,'top',l.y+'px');}}
  for(const [key,n] of this.worldNodes)if(!live.has(key)){n.remove();this.worldNodes.delete(key);}
 }
}
