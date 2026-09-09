/* Two bounded Web Audio decks keep the approved recordings and crossfades.
 * No HTML media elements, full-track PCM or per-note music synthesis. */
class CelticMusic {
 constructor(owner,catalog=MUSIC_CATALOG,assets=MUSIC_ASSETS,makeDeck=(ctx,gain)=>new GameMusicDeck(ctx,gain,this.catalog,assets)){
  this.owner=owner;this.ctx=owner.ctx;this.catalog=new Map(catalog.tracks.map(t=>[t.id,t]));this.assets=assets;
  this.playlists={village:['hearth','legacy'],outside:['road','legacy'],front:['battle','road']};
  this.rotation={village:0,outside:0,front:0};this.active=null;this.running=false;this.loading=false;
  this.generation=0;this.area='village';this.pending='village';this.pendingAt=0;this.lastSwitch=-100;
  this.retryAt=0;this.fade=3;this.switchingUntil=0;
  this.decks=Array.from({length:2},()=>{const gain=this.ctx.createGain(),media=makeDeck(this.ctx,gain);gain.gain.value=0;gain.connect(owner.musicBus);
   return{media,gain,id:null,retireAt:Infinity};});
 }
 pick(area){const ids=this.playlists[area]||this.playlists.village;let id=ids[this.rotation[area]++%ids.length];
  if(id===this.active?.id&&ids.length>1)id=ids[this.rotation[area]++%ids.length];return id;}
 level(deck,value,seconds=0){const p=deck.gain.gain,t=this.ctx.currentTime;
  if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}
  if(seconds)p.linearRampToValueAtTime(value,t+seconds);else p.setValueAtTime(value,t);
 }
 allowed(){return this.running&&this.owner.requested&&!this.owner.background;}
 async resume(area='village'){
  this.running=true;this.pending=area;this.pendingAt=this.ctx.currentTime;
  const ticket=++this.generation;this.loading=false;
  // Resume the same phrase after mute/background, instead of restarting the theme.
  if(this.active&&!this.active.media.ended){
   try{await this.active.media.play();if(ticket!==this.generation||!this.allowed()){if(!this.allowed())this.active.media.pause();return false;}
    this.level(this.active,1,.18);return true;
   }catch(error){if(ticket===this.generation){this.retryAt=this.ctx.currentTime+8;if(error?.name==='NotAllowedError')this.onGesture(()=>this.resume(area));}return false;}
  }
  return this.play(this.pick(area),area,.22);
 }
 async play(id,area,fade=this.fade){
  if(!this.allowed()||this.loading||!this.catalog.has(id))return false;
  const deck=this.decks.find(d=>d!==this.active),old=this.active,ticket=++this.generation;
  this.loading=true;this.level(deck,0);deck.retireAt=Infinity;deck.ticket=ticket;
  if(deck.id!==id){deck.id=id;deck.media.load(id);}
  deck.media.currentTime=0;
  try{
   await deck.media.play();
   if(ticket!==this.generation||!this.allowed()){if(deck.ticket===ticket)deck.media.pause();return false;}
   this.active=deck;this.area=area;this.lastSwitch=this.ctx.currentTime;this.switchingUntil=this.lastSwitch+fade;
   this.level(deck,1,fade);
   if(old){this.level(old,0,fade);old.retireAt=this.lastSwitch+fade;}
   return true;
  }catch(error){
   if(deck.ticket===ticket){
    deck.media.pause();this.level(deck,0);this.retryAt=this.ctx.currentTime+8;
    if(error?.name==='NotAllowedError')this.onGesture(()=>this.play(id,area,fade));
   }return false;
  }finally{if(ticket===this.generation)this.loading=false;}
 }
 pause(){
  this.running=false;++this.generation;this.loading=false;this.clearUnlock();
  for(const d of this.decks){d.media.pause();this.level(d,0);d.retireAt=Infinity;}
  this.switchingUntil=0;
 }
 clearUnlock(){if(this.unlock&&typeof document!=='undefined')document.removeEventListener('pointerdown',this.unlock);this.unlock=null;}
 onGesture(action){if(typeof document==='undefined')return;this.clearUnlock();this.unlock=()=>{this.clearUnlock();this.retryAt=0;if(this.owner.requested&&!this.owner.background)void action();};document.addEventListener('pointerdown',this.unlock,{once:true});}
 dispose(){this.pause();for(const d of this.decks){d.media.dispose();d.gain.disconnect();}}
 tick(area){
  if(!this.allowed()||this.ctx.state!=='running')return;
  const t=this.ctx.currentTime;
  for(const d of this.decks)if(d!==this.active&&d.retireAt<=t){d.media.pause();d.retireAt=Infinity;this.level(d,0);}
  if(!this.playlists[area])area='village';
  if(area!==this.pending){this.pending=area;this.pendingAt=t;}
  if(this.loading||t<this.retryAt||t<this.switchingUntil)return;
  if(!this.active){void this.play(this.pick(area),area);return;}
  // Boundary wobble must not repeatedly restart songs. Sustained area changes fade.
  if(area!==this.area&&t-this.pendingAt>=2.5&&t-this.lastSwitch>=12){void this.play(this.pick(area),area);return;}
  const a=this.active,track=this.catalog.get(a.id),duration=Number.isFinite(a.media.duration)?a.media.duration:track.duration;
  if(a.media.error){this.retryAt=t+8;void this.play(this.pick(this.area),this.area);return;}
  if(a.media.paused&&!a.media.ended){void this.resume(this.area);return;}
  for(const d of this.decks)if(!d.media.paused)void d.media.pump();
  if(a.media.ended||a.media.currentTime>=duration-this.fade-.1)void this.play(this.pick(this.area),this.area);
 }
}

class CelticScoreAudio extends WorldAudio{
 constructor(){
  super();this.pageGone=false;this.focused=typeof document==='undefined'||document.hasFocus();
  this.background=typeof document!=='undefined'&&(document.hidden||!this.focused);
  if(typeof window!=='undefined'){
   window.addEventListener('blur',()=>{this.focused=false;this.visibility(document.hidden);});
   window.addEventListener('focus',()=>{this.focused=true;this.visibility(document.hidden);});
   window.addEventListener('pagehide',()=>{this.pageGone=true;this.visibility(true);});
   window.addEventListener('pageshow',()=>{this.pageGone=false;this.focused=document.hasFocus();this.visibility(document.hidden);});
  }
 }
 initContext(ctx){this.score?.dispose();super.initContext(ctx);this.echoGain.gain.value=0;this.score=new CelticMusic(this);}
 async enable(){
  // Only AudioContext needs activation now; request it in the gesture turn.
  const activation=super.enable(),ticket=this.ticket,enabled=await activation;
  if(ticket!==this.ticket)return false;
  if(enabled){this.score?.clearUnlock();await this.score?.resume(this.pendingArea);}
  else{this.score?.pause();if(this.requested&&!this.background)this.score?.onGesture(()=>this.enable());}
  return enabled&&ticket===this.ticket&&this.enabled&&!this.background;
 }
 disable(){super.disable();this.score?.pause();}
 visibility(hidden){
  const blocked=hidden||this.pageGone||!this.focused;if(blocked===this.background)return;
  if(blocked)this.score?.pause();super.visibility(blocked);
 }
 schedule(){this.score?.tick(this.pendingArea);}
}
