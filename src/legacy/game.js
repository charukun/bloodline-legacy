



const STORAGE_PREFIX='aerin.tactics.v3.';
const readStore=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(STORAGE_PREFIX+key))??fallback;}catch{return fallback;}};
const writeStore=(key,value)=>{try{localStorage.setItem(STORAGE_PREFIX+key,JSON.stringify(value));return true;}catch{return false;}};
const gameId=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const DEBUG_WORLD_SPEEDS=Object.freeze([.25,.5,1,2,4]);
class Game{
 constructor(){this.profile={owner:gameId(),clan:'暁風',name:'',race:0,inherit:[],mode:'normal',online:false,villageCode:'',quality:'auto',sound:true,...readStore('profile',{})};if(this.profile.settingsVersion!==5){this.profile.mode='normal';this.profile.settingsVersion=5;this.profile.race=(this.profile.race||0)%4;}this.profile.inherit=Array.isArray(this.profile.inherit)?this.profile.inherit.filter(id=>skillById(id)).slice(0,1):[];this.screen='clan';this.online=false;this.serverAvailable=false;this.sim=null;this.snapshot=null;this.playerId=null;this.seq=0;this.keys=new Set();this.input={x:0,z:0};this.pendingMove=null;this.commandBuffer=[];this.accumulator=0;this.lastFrame=0;this.lastUI=0;this.sinceSave=0;this.nextNetwork=0;this.mapCache=new Map();this.walkTarget=null;this.closed=false;this.audio=new AudioEngine();this.renderer=new Renderer(document.getElementById('world'));this.renderer.setQuality(this.profile.quality);this.ui=new UI(this);this.loadMode();this.makeClanPreview();Object.assign(this.renderer.camera,{x:0,z:0,zoom:4.2,yaw:.12,pitch:.24});this.ui.showClan();this.installInput();window.addEventListener('resize',()=>this.renderer.resize());window.addEventListener('beforeunload',()=>{this.stopInput();this.saveWorld();});document.addEventListener('visibilitychange',()=>{this.audio.visibility(document.hidden);if(document.hidden){this.stopInput();this.saveWorld();}this.motionInterpolation?.reset();this.lastFrame=performance.now();});this.saveProfile();this.live=typeof LiveUpdate==='undefined'?null:new LiveUpdate(this);this.live?.start();this.checkServer();document.getElementById('loading').classList.add('hidden');this.installQA();requestAnimationFrame(t=>this.frame(t));}
 saveProfile(){return !this.blockSave&&writeStore('profile',this.profile);}
 canSetWorldSpeed(){return !this.online&&!(this.screen==='clan'&&this.profile?.online);}
 worldSpeed(){return this.online?1:DEBUG_WORLD_SPEEDS.includes(this.debugWorldSpeed)?this.debugWorldSpeed:1;}
 setWorldSpeed(speed){
  if(!this.canSetWorldSpeed()||!DEBUG_WORLD_SPEEDS.includes(speed))return false;
  // Session-only debugging: never rewrite a world's year length, save mode or server clock.
  this.debugWorldSpeed=speed;this.accumulator=0;this.motionInterpolation?.reset();this.lastFrame=performance.now();return true;
 }
 loadMode(){
  this.loadedMode=this.profile.mode;this.blockSave=false;let raw=null;
  try{const current=localStorage.getItem(STORAGE_PREFIX+'world4.'+this.loadedMode);raw=current??localStorage.getItem(STORAGE_PREFIX+'world.'+this.loadedMode);this.saveBaseRaw=current;
   this.sim=raw?Simulation.restore(JSON.parse(raw)):new Simulation({seed:7349,mode:this.profile.mode});
   const saved=raw&&JSON.parse(raw);if(saved?._profile)this.profile={...this.profile,...saved._profile};
   if(saved?.schema===3){localStorage.setItem(STORAGE_PREFIX+'backup.schema3.'+this.loadedMode,raw);}
  }catch(e){console.warn('Save protected',e);this.blockSave=true;this.sim=new Simulation({seed:7349,mode:this.profile.mode});this.ui.toast('前の記録を保護しています。新しい版か、記録の読み込みで復旧してください。');}
  this.playerId=[...this.sim.players.values()].find(p=>p.owner===this.profile.owner&&(p.alive||p.legacyChoice?.state==='pending'))?.id||[...this.sim.players.values()].filter(p=>p.owner===this.profile.owner).at(-1)?.id||null;
  this.seq=this.sim.seq;if(this.playerId)this.snapshot=this.decorate(this.sim.snapshot(this.playerId,this.seq));
 }
 decorate(s){if(!s)return s;const revision=s.room.terrainRevision??(this.online?0:1),key=s.room.seed+':'+revision;if(!this.mapCache.has(key))this.mapCache.set(key,makeVillage(s.room.seed,revision));s.map=this.mapCache.get(key);return s;}
 makeClanPreview(){const previewSim=new Simulation({seed:7349,mode:'normal'}),p=previewSim.addPlayer('preview',{race:this.profile.race,owner:'preview',name:'エリン'});Object.assign(p,{kind:'portrait',race:this.profile.race,age:24,appearanceSeed:16,hair:1,gender:0,weapon:-1,armor:0,shield:false,prologue:false,introUntil:-100,x:0,z:0,dir:.05,baseY:.13,action:'idle',alive:true});this.previewCharacter=p;this.clanScene=this.decorate(previewSim.snapshot(p.id));}
 saveWorld(){
  if(!this.sim||this.online||this.blockSave)return false;
  this.saving=true;try{
   const key=STORAGE_PREFIX+'world4.'+this.loadedMode,current=localStorage.getItem(key);
   if(this.saveBaseRaw!==undefined&&current!==this.saveBaseRaw){this.blockSave=true;this.ui.toast('別の画面で記録が進んでいます。この画面からの上書きを止めました。');return false;}
   const raw=JSON.stringify({...this.sim.exportState(),_profile:this.profile});localStorage.setItem(key,raw);
   if(localStorage.getItem(key)!==raw)throw Error('Save verification failed');this.saveBaseRaw=raw;this.saveProfile();return true;
  }catch{this.ui.toast('旅の記録を保存できません。保存先の空きを確認してください。');return false;}finally{this.saving=false;}
 }
 canResume(){return this.profile.online?!!readStore('online.token.'+this.profile.mode,null):[...this.sim.players.values()].some(p=>p.owner===this.profile.owner&&(p.alive||p.legacyChoice?.state==='pending'));}
 getLegacy(){return this.online&&this.snapshot?.legacy?this.snapshot.legacy:this.profile.online?readStore('online.legacy.'+this.profile.mode,{archive:[],records:[],generation:1}):this.sim.legacy(this.profile.owner);}
 async checkServer(){if(!/^https?:$/.test(location.protocol))return;try{const r=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(3000)}),h=await r.json();this.serverCompatibility=h.compatibility;this.serverAvailable=!!h.online&&h.game==='AERIN';}catch{this.serverAvailable=false;}}
 async start(){if(this.starting)return;if(this.blockSave&&!this.profile.online){this.ui.toast('前の記録を保護しています。記録を確認してから再開してください。');return;}if(!this.profile.uiExplained){this.ui.onboarding(()=>{this.profile.uiExplained=true;this.saveProfile();this.start();});return;}if(this.profile.sound)this.audio.enable();const b=document.getElementById('begin-life');if(b)b.disabled=true;this.starting=true;try{this.online=!!this.profile.online;if(this.online){await this.checkServer();if(!this.serverAvailable)throw Error('共有は、同梱サーバーから開いてください');this.token=readStore('online.token.'+this.profile.mode,null);if(!await this.live.join(true))return;}else{this.live?.disconnect();this.events?.close();this.events=null;let p=[...this.sim.players.values()].find(p=>p.owner===this.profile.owner&&(p.alive||p.legacyChoice?.state==='pending'));if(!p)p=this.sim.addPlayer(gameId(),{...this.profile,inherit:this.profile.inherit.filter(id=>this.sim.legacy(this.profile.owner).archive.includes(id))});this.playerId=p.id;this.seq=this.sim.seq;this.snapshot=this.decorate(this.sim.snapshot(p.id,this.seq));}this.screen='game';this.ui.showGame();this.renderer.effects=[];this.renderer.staticShadowDirty=true;this.renderer.camera.x=this.snapshot.player.x;this.renderer.camera.z=this.snapshot.player.z;this.renderer.camera.zoom=14;this.renderer.camera.yaw=.42;this.renderer.camera.pitch=.68;this.motionInterpolation?.reset();this.lastFrame=performance.now();this.saveWorld();}catch(e){this.online=false;this.ui.renderClan();if(this.profile.online)this.live?.fail(e);else this.ui.toast(e.message);}finally{this.starting=false;if(b)b.disabled=false;}}
 acceptSnapshot(s){this.snapshot=this.decorate(s);this.motionInterpolation?.receiveRemote(this.snapshot,performance.now());this.seq=s.seq;const legacyJSON=JSON.stringify(s.legacy);if(legacyJSON!==this.onlineLegacyJSON){writeStore('online.legacy.'+this.profile.mode,s.legacy);this.onlineLegacyJSON=legacyJSON;}for(const e of s.events||[]){this.renderer.effect(e,s.t);this.audio.fx(e);if(this.screen==='game')this.ui.event(e);}this.lastSnapshotAt=performance.now();}
 connectEvents(){return this.live?.resume();}
 command(cmd){if(this.screen!=='game'||!this.snapshot?.player||(!this.snapshot.player.alive&&cmd.type!=='choose-legacy'))return false;if(this.online){if(!this.live?.ready)return false;if(cmd.type==='move'){this.pendingMove=cmd;return true;}if(cmd.type==='weights'){const i=this.commandBuffer.findIndex(c=>c.type==='weights'&&c.phase===cmd.phase);if(i>=0)this.commandBuffer[i]=cmd;else this.commandBuffer.push(cmd);}else if(this.commandBuffer.length<20){if(cmd.type==='dash'){this.pendingMove=null;this.commandBuffer=this.commandBuffer.filter(c=>c.type!=='dash');}this.commandBuffer.push(cmd);};return true;}const ok=this.sim.command(this.playerId,cmd);this.snapshot=this.decorate(this.sim.snapshot(this.playerId,this.seq));if(cmd.type==='choose-legacy'&&ok)this.saveWorld();return ok;}
 sendNetwork(){return this.live?.send();}
 toClan(){this.stopInput();this.saveWorld();this.live?.disconnect();this.screen='clan';this.makeClanPreview();this.renderer.effects=[];this.renderer.staticShadowDirty=true;this.ui.showClan();}
 nearRack(){const p=this.snapshot?.player,r=this.snapshot?.room;if(!p||r.kind!=='village')return false;const rack=this.snapshot.map.schools.find(s=>s.id==='armory');if(!rack)return false;return atFacilityStation(p,rack);}
 resetPointer(){if(this.pointer){clearTimeout(this.pointer.timer);const id=this.pointer.id;this.pointer=null;try{if(this.renderer.canvas.hasPointerCapture(id))this.renderer.canvas.releasePointerCapture(id);}catch{}}this.input={x:0,z:0};document.getElementById('joystick').classList.add('hidden');}
 stopInput(){this.keys.clear();this.walkTarget=null;this.resetPointer();if(this.screen==='game')this.command({type:'move',x:0,z:0});}
 installInput(){
  const canvas=this.renderer.canvas;
  document.addEventListener('pointerdown',()=>{if(this.screen==='game'&&this.profile.sound&&(!this.audio.enabled||this.audio.ctx?.state!=='running'))this.audio.enable();},{passive:true});
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.addEventListener('pointerdown',e=>{
   if(this.screen!=='game'||this.ui.blocksWorldInput()||e.button!==0||this.pointer)return;
   e.preventDefault();const wasDash=!!this.snapshot.player.dash;this.walkTarget=null;
   if(wasDash)this.command({type:'move',x:0,z:0});
   const q={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,started:performance.now(),moved:false,held:false,wasDash};
   q.timer=setTimeout(()=>{if(this.pointer!==q||q.moved||this.snapshot?.player.prologue)return;q.held=true;this.command({type:'sit',active:true});},480);
   this.pointer=q;canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
   const q=this.pointer;if(!q||q.id!==e.pointerId)return;e.preventDefault();q.lastX=e.clientX;q.lastY=e.clientY;
   const dx=e.clientX-q.x,dy=e.clientY-q.y,d=Math.hypot(dx,dy);
   if(d>8){q.moved=true;clearTimeout(q.timer);}if(!q.moved||q.held)return;
   const world=this.renderer.screenToWorld(dx,dy),n=Math.hypot(world.x,world.z)||1;
   this.input={x:world.x/n*Math.min(1,d/40),z:world.z/n*Math.min(1,d/40)};this.command({type:'move',...this.input});
   const joy=document.getElementById('joystick');joy.classList.remove('hidden');joy.style.left=q.x+'px';joy.style.top=q.y+'px';joy.querySelector('i').style.transform=`translate(${dx/Math.max(1,d/23)}px,${dy/Math.max(1,d/23)}px)`;
  });
  const release=e=>{
   const q=this.pointer;if(!q||q.id!==e.pointerId)return;
   const elapsed=performance.now()-q.started,dx=(Number.isFinite(e.clientX)&&e.type==='pointerup'?e.clientX:q.lastX)-q.x,dy=(Number.isFinite(e.clientY)&&e.type==='pointerup'?e.clientY:q.lastY)-q.y,d=Math.hypot(dx,dy);
   this.resetPointer();
   if(e.type!=='pointerup'){this.command({type:'move',x:0,z:0});return;}
   // One recognizer for mouse, pen and touch. Dash persists on the server until a new intent.
   if(!q.held&&d>=32&&elapsed<320&&d/Math.max(1,elapsed)>.18){
    const w=this.renderer.screenToWorld(dx,dy),n=Math.hypot(w.x,w.z)||1;this.command({type:'dash',x:w.x/n,z:w.z/n});return;
   }
   if(q.moved){this.command({type:'move',x:0,z:0});return;}
   if(q.held)return;
   this.command({type:'move',x:0,z:0});
   if(!q.wasDash)this.walkTarget={...this.renderer.pointToWorld(e.clientX,e.clientY),until:performance.now()+8000};
  };
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',e=>{if(this.pointer)release(e);});
  canvas.addEventListener('wheel',e=>{if(this.ui.blocksWorldInput())return;e.preventDefault();this.zoomOffset=clamp((this.zoomOffset||0)+e.deltaY*.006,-4,8);},{passive:false});
  window.addEventListener('keydown',e=>{
   if(e.key==='Escape'){if(this.ui.modal)this.ui.closeModal();else if(this.screen==='game')this.ui.settings();return;}
   if(this.screen!=='game'||this.ui.blocksWorldInput()||e.defaultPrevented||this.ui.root.contains(e.target)||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.repeat)return;
   if(e.code==='KeyR'||e.code==='Space')this.command({type:'sit',active:true});
   if(e.code==='KeyK')this.ui.skills();if(e.code==='KeyB')this.ui.body();if(e.code==='KeyT')this.ui.talk();if(e.code==='KeyE')document.querySelector('[data-context]')?.click();
  });
  window.addEventListener('keyup',e=>{const wasMove=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code);this.keys.delete(e.code);if(wasMove&&!this.ui.blocksWorldInput()&&!this.keys.size&&!this.pointer)this.command({type:'move',x:0,z:0});});window.addEventListener('blur',()=>this.stopInput());
 }
 updateMove(){if(this.screen!=='game'||this.ui.blocksWorldInput())return;let dx=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0),dy=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0);if(dx||dy){this.walkTarget=null;const w=this.renderer.screenToWorld(dx,dy),n=Math.hypot(w.x,w.z)||1;this.command({type:'move',x:w.x/n,z:w.z/n});}else if(this.walkTarget){const p=this.snapshot.player,w=this.walkTarget,d=Math.hypot(w.x-p.x,w.z-p.z);if(d<.3||performance.now()>w.until){this.walkTarget=null;this.command({type:'move',x:0,z:0});}else this.command({type:'move',x:(w.x-p.x)/d,z:(w.z-p.z)/d});}else if(this.pointer?.moved)this.command({type:'move',...this.input});}
 frame(now){if(this.closed)return;const elapsed=this.lastFrame?Math.min(3,(now-this.lastFrame)/1000):.016;this.lastFrame=now;const dt=Math.min(.1,elapsed);let renderedSnapshot=null;try{
 this.updateMove();const motion=this.motionInterpolation??=new MotionInterpolation();if(this.screen!=='game')motion.reset();if(!this.online){this.accumulator+=Math.min(3,elapsed*this.worldSpeed());let loops=0;while(this.accumulator>=1/30&&loops++<90){if(this.screen==='game')motion.capture(this.sim,this.playerId);this.sim.tick(1/30);this.accumulator-=1/30;}if(this.playerId){this.snapshot=this.decorate(this.sim.snapshot(this.playerId,this.seq));for(const e of this.snapshot.events){this.renderer.effect(e,this.snapshot.t);if(this.screen==='game'){this.audio.fx(e);this.ui.event(e);}}this.seq=this.snapshot.seq;}}
 else if(now>this.nextNetwork){this.sendNetwork();this.nextNetwork=now+60;}
 if(this.screen==='clan'){this.clanScene.t=now/1000;this.clanScene.player=this.previewCharacter;this.clanScene.players=[this.previewCharacter];this.renderer.render(this.clanScene,dt,{clan:true,preview:this.previewCharacter});}else if(this.snapshot){this.audio.setListener(this.snapshot.player);this.audio.setArea?.(this.snapshot.room.kind==='front'?'front':this.snapshot.player.z<-28?'outside':'village');this.audio.front=this.snapshot.room.kind==='front';this.audio.updateFootsteps(this.snapshot.player);const rendered=this.online?motion.sampleRemote(this.snapshot,now):motion.sample(this.snapshot,this.accumulator*30);renderedSnapshot=rendered;this.renderer.render(rendered,dt,{zoomOffset:this.zoomOffset||0,skillPanelTop:this.ui.skillPanelTop,skillPanelLeft:this.ui.skillPanelLeft,reducedMotion:this.ui.reducedMotion});this.audio.updateWeather?.(this.renderer.weatherState,this.snapshot,this.renderer.art.sources);if(now-this.lastUI>80){this.ui.update(this.snapshot,false);this.lastUI=now;}this.ui.updateWorld(rendered);}
 // Project building names after both the camera render and any HUD replacement.
 (this.buildingLabels??=new BuildingLabels(document.getElementById('world-labels'))).update(this.screen==='game'?renderedSnapshot:null,this.renderer);
 if(this.ui.portraitQueue.length&&!this.ui.pieDragging){const q=this.ui.portraitQueue.shift();if(q.node.isConnected){const data=this.renderPortrait(q.record);if(data){this.ui.portraits.set(q.key,data);q.node.innerHTML=`<img alt="姿" src="${data}">`;}}}
 this.sinceSave+=elapsed;if(this.sinceSave>7){this.sinceSave=0;this.saveWorld();}
 }catch(e){console.error(e);if(!this.frameError){this.frameError=e;this.ui.toast('動作を中断しました。記録を保存して再読み込みしてください。');}}
 requestAnimationFrame(t=>this.frame(t));}
 renderPortrait(record){
  if(!this.portraitRenderer){const canvas=document.createElement('canvas');this.portraitRenderer=new Renderer(canvas,{width:224,height:280});this.portraitRenderer.setQuality('low');this.portraitRenderer.scale=1;}
  const r=this.portraitRenderer,app=record.appearance||{},sk=skillById(record.skills?.[0]??record.skill),p={...this.previewCharacter,...app,id:'portrait',kind:'portrait',prologue:false,introUntil:-100,alive:true,name:record.name,x:0,z:0,dir:.18,action:record.idle||record.head?'idle':'attack',actionStarted:0,actionUntil:1.5,attackSkill:sk?.id??4000,pendingSkill:null,hitReactUntil:0,statuses:{},seated:false};
  const s={...this.clanScene,t:.66,player:p,players:[p],actors:[]};const age=p.age??24,sc=(age<4?.46:age<10?.64+(age-4)*.022:age<18?.78+(age-10)*.027:age>72?.96:1)*((p.race||0)===2?.86:(p.race||0)===1?1.07:(p.race||0)===3?.95:1);r.camera={x:0,z:0,zoom:record.head?1.30*sc:3.65*sc,yaw:0,pitch:record.head?.07:.20,y:record.head?.18+2.35*sc:.18+1.30*sc};r.render(s,.016,{portrait:true,freezeCamera:true});return r.canvas.toDataURL('image/png');
 }

 exportSave(){if(this.blockSave){this.ui.toast('保護中の記録を空の旅で置き換えることはできません。');return;}if(this.online){this.ui.toast('共有の旅は、サーバーに保存される');return;}this.saveWorld();const data=JSON.stringify({format:'AERIN-portable-1',version:VERSION,profile:this.profile,world:this.sim.exportState()},null,2),blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='血脈の系譜_旅の記録.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.ui.toast('旅の記録を書き出した');}
 async importSave(file){
  if(!file||this.importing)return;if(this.online){this.ui.toast('共有の旅は、サーバーに保存される');return;}
  if(file.size>12000000){this.ui.toast('記録が大きすぎる');return;}this.importing=true;
  try{const j=JSON.parse(await file.text());if(j.format!=='AERIN-portable-1')throw Error('血脈の系譜の記録ではありません');
   const sim=Simulation.restore(j.world);if(!confirm('この記録に切り替えますか？ 今の旅はバックアップします。'))return;
   const profile={...this.profile,...j.profile,online:false,mode:sim.mode,settingsVersion:5};
   if(typeof profile.owner!=='string')throw Error('一族の記録を確認できません。');
   const key=STORAGE_PREFIX+'world4.'+sim.mode,old=localStorage.getItem(key)??localStorage.getItem(STORAGE_PREFIX+'world.'+sim.mode);
   localStorage.setItem(STORAGE_PREFIX+'backup.import.'+Date.now(),JSON.stringify({profile:this.profile,world:old}));
   const raw=JSON.stringify({...sim.exportState(),_profile:profile});localStorage.setItem(key,raw);
   this.stopInput();this.sim=sim;this.profile=profile;this.loadedMode=sim.mode;this.saveBaseRaw=raw;this.blockSave=false;
   this.playerId=[...sim.players.values()].find(p=>p.owner===profile.owner&&(p.alive||p.legacyChoice?.state==='pending'))?.id||null;
   this.snapshot=this.playerId?this.decorate(sim.snapshot(this.playerId,sim.seq)):null;this.seq=sim.seq;this.saveProfile();this.toClan();this.ui.toast('旅の記録を読み込んだ');
  }catch(e){this.ui.toast(e.message);}finally{this.importing=false;}
 }
 installQA(){if(!new URLSearchParams(location.search).has('qa'))return;Object.defineProperty(window,'AERIN_QA',{value:{app:this,sim:()=>this.sim,player:()=>this.sim.players.get(this.playerId),age:age=>{this.sim.players.get(this.playerId).age=age;},place:(x,z)=>{Object.assign(this.sim.players.get(this.playerId),{x,z,prologue:false,introUntil:-100});},learn:id=>this.sim.learn(this.sim.players.get(this.playerId),id),step:n=>{for(let i=0;i<n;i++)this.sim.tick(1/30);this.snapshot=this.decorate(this.sim.snapshot(this.playerId,this.seq));},stats:()=>this.renderer.stats},configurable:false});}
}
