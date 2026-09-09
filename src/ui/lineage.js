/* Real game adapter for the approved lineage view. No simulation copy or demo data. */
class UILineage {
 constructor(ui){this.ui=ui;this.home=null;this.modalView=null;this.starting=false;}
 get g(){return this.ui.g;}
 current(){
  const g=this.g;
  if(g.profile.online){const p=g.online?g.snapshot?.player:null;return p?.alive&&p.owner===g.profile.owner?p:null;}
  return [...g.sim.players.values()].find(p=>p.owner===g.profile.owner&&p.alive)||null;
 }
 source(){
  const legacy=this.g.getLegacy(),ids=new Set([...(legacy.archive||[]),...(legacy.records||[]).map(r=>r.skills?.[0]??r.skill)]);
  const catalog=[...ids].map(id=>skillById(id)).filter(Boolean).map(s=>({id:s.id,name:s.name,desc:s.desc||'',phase:skillPhase(s),passive:!!s.passive,icon:s.passive?'leaf':'sword'}));
  return {legacy,catalog,current:this.current(),resumeAvailable:this.g.canResume()};
 }
 key(){return [this.g.profile.owner,this.g.profile.mode,!!this.g.profile.online].join('|');}
 initialDraft(){
  const p=this.g.profile,id=p.inherit?.[0],archive=this.g.getLegacy().archive||[];
  return {name:String(p.name||'').slice(0,12),race:Number.isInteger(p.race)&&p.race>=0&&p.race<4?p.race:0,inherit:archive.includes(id)&&skillById(id)?id:null};
 }
 saveDraft(draft){
  if(this.g.canResume())return;
  const p=this.g.profile,next={name:draft.name,race:draft.race,inherit:draft.inherit===null?[]:[draft.inherit]};
  if(p.name===next.name&&p.race===next.race&&JSON.stringify(p.inherit)===JSON.stringify(next.inherit))return;
  Object.assign(p,next);if(this.g.previewCharacter)this.g.previewCharacter.race=next.race;this.g.saveProfile();
 }
 recordDetails(record){
  const a=record.appearance;if(!a)return '';
  const weapon=Number.isInteger(a.weapon)?a.weapon===-1?'素手':WEAPONS[a.weapon]?.name:null;
  const armor=Number.isInteger(a.armor)?ARMORS[a.armor]?.name:null;
  return `<p class="dialog-note">最期の装備：${ESC(weapon||'得物未記録')}・${ESC(armor||'衣装未記録')}${typeof a.shield==='boolean'?'・'+(a.shield?'木鉄の盾':'盾なし'):''}</p>`;
 }
 mount(container,inGame){
  const host=document.createElement('div');host.className='lineage-theatre-host';container.replaceChildren(host);
  const view=createLineageTheatre(host,{
   inGame,source:()=>this.source(),initialDraft:()=>this.initialDraft(),saveDraft:d=>this.saveDraft(d),
   motionEnabled:()=>this.g.profile.lineageMotion!==false,
   saveMotion:enabled=>{this.g.profile.lineageMotion=enabled;this.g.saveProfile();},
   recordDetails:r=>this.recordDetails(r),
   buildLabel:typeof BUILD_INFO==='undefined'?'BLOODLINE LEGACY':BUILD_INFO.displayVersion,
   start:payload=>this.start(payload,inGame),
   settings:()=>{this.focusBeforeSettings=view.scope.activeElement;this.ui.settings();},
   back:()=>{if(inGame)this.ui.back();else this.ui.settings();}
  });
  return view;
 }
 renderClan(){
  const key=this.key();
  if(this.home&&this.homeKey!==key){this.home.destroy();this.home=null;}
  this.ui.clan.classList.add('lineage-home');
  if(!this.home){this.home=this.mount(this.ui.clan,false);this.homeKey=key;}
  else this.home.refresh();
  this.home.setVisible(this.g.screen==='clan'&&!this.ui.modal);
 }
 refreshClan(){
  this.renderClan();
  if(this.focusBeforeSettings){const node=this.focusBeforeSettings;this.focusBeforeSettings=null;queueMicrotask(()=>{if(!this.ui.modal&&node.isConnected)node.focus({preventScroll:true});});}
 }
 open(){
  if(this.g.screen==='clan'){this.ui.closeModal();this.refreshClan();this.home.focus();return;}
  this.ui.open('lineage','血脈の系譜','');
  this.ui.mountDock(false);
  this.modalView=this.mount(this.ui.root.querySelector('.panel-content'),true);
  this.signature=this.liveSignature();
  queueMicrotask(()=>this.modalView?.focus());
 }
 liveSignature(){
  const l=this.g.getLegacy(),p=this.current();
  return JSON.stringify([this.key(),p?.id,l.generation,l.records?.length,l.archive]);
 }
 update(){
  if(this.modalView&&this.signature!==this.liveSignature()){
   this.signature=this.liveSignature();this.modalView.refresh();
  }
 }
 beforeOpen(type){
  this.home?.setVisible(false);
  if(this.modalView){this.modalView.destroy();this.modalView=null;}
 }
 closeModal(){if(this.modalView){this.modalView.destroy();this.modalView=null;}}
 showGame(){this.home?.destroy();this.home=null;this.closeModal();}
 async start(payload,inGame){
  if(this.starting)return;
  if(inGame&&payload.kind==='resume'&&this.current()){this.ui.closeModal();return;}
  const source=this.source();
  if(payload.kind==='new'&&source.resumeAvailable){this.home?.refresh();this.modalView?.refresh();throw Error('続いている旅があります。「旅を続ける」から再開してください。');}
  if(payload.kind==='resume'&&!source.resumeAvailable){this.home?.refresh();this.modalView?.refresh();throw Error('この人生は生涯を終えました。系譜から次の命へ進んでください。');}
  if(payload.kind==='new'){
   const {race,name,inherit}=payload.config;
   if(!Number.isInteger(race)||race<0||race>=RACES.length||inherit.length>1||inherit.some(id=>!source.legacy.archive.includes(id)||!skillById(id))){this.home?.refresh();this.modalView?.refresh();throw Error('継承の記録が変わりました。選び直してください。');}
   this.saveDraft({race,name,inherit:inherit[0]??null});
  }
  this.starting=true;
  try{
   // Existing Game.start owns online join, living-player reuse and newborn creation.
   // The existing onboarding remains in front; no native nested dialog obscures it.
   this.home?.setVisible(false);this.modalView?.setVisible(false);
   if(inGame)this.g.toClan();
   if(!this.g.profile.uiExplained){
    await new Promise(resolve=>this.ui.onboarding(()=>{this.g.profile.uiExplained=true;this.g.saveProfile();resolve();}));
   }
   await this.g.start();
   if(this.g.screen!=='game')throw Error('村に入れませんでした。設定を確認して、もう一度お試しください。');
  }finally{
   this.starting=false;
   if(this.g.screen==='clan')this.home?.setVisible(!this.ui.modal);
  }
 }
}
