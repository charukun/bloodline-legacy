/* Original 6/8 harp/whistle score and procedural combat foley. No downloads. */
class AudioEngine {
 constructor(){
  this.ctx=null;this.enabled=false;this.requested=false;this.volume=.30;this.nextNote=0;this.step=0;this.front=false;this.area='village';this.pendingArea='village';this.timer=null;
  this.ticket=0;this.background=false;this.voices=new Set();this.lastFX=new Map();this.listener=null;this.foot=null;this.effectCount=0;
 }
 initContext(ctx){
  this.ctx=ctx;this.master=ctx.createGain();this.master.gain.value=0;
  this.musicBus=ctx.createGain();this.musicBus.gain.value=.58;this.musicBus.connect(this.master);
  this.echo=ctx.createDelay(1);this.echo.delayTime.value=.29;this.echoGain=ctx.createGain();this.echoGain.gain.value=.14;this.echoFilter=ctx.createBiquadFilter();this.echoFilter.type='lowpass';this.echoFilter.frequency.value=1800;this.musicBus.connect(this.echo);this.echo.connect(this.echoFilter);this.echoFilter.connect(this.echoGain);this.echoGain.connect(this.master);
  this.fxBus=ctx.createGain();this.fxBus.gain.value=1;this.fxBus.connect(this.master);
  this.limiter=ctx.createDynamicsCompressor();this.limiter.threshold.value=-12;this.limiter.knee.value=9;this.limiter.ratio.value=6;
  this.limiter.attack.value=.003;this.limiter.release.value=.14;this.master.connect(this.limiter);this.limiter.connect(ctx.destination);
  this.noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=this.noiseBuffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 }
 async enable(){
  this.requested=true;const ticket=++this.ticket;
  try{
   if(!this.ctx||this.ctx.state==='closed')this.initContext(new (window.AudioContext||window.webkitAudioContext)());
   if(this.background)return false;
   if(this.ctx.state!=='running')await this.ctx.resume();
   if(ticket!==this.ticket||!this.requested||this.background)return false;
   this.enabled=this.ctx.state==='running';if(!this.enabled)return false;
   this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.035);
   this.nextNote=Math.max(this.ctx.currentTime+.04,this.nextNote);
   if(!this.timer)this.timer=setInterval(()=>this.schedule(),80);
   return true;
  }catch{if(ticket===this.ticket)this.enabled=false;return false;}
 }
 disable(){
  ++this.ticket;this.requested=false;this.enabled=false;clearInterval(this.timer);this.timer=null;
  if(this.ctx&&this.ctx.state!=='closed')this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.025);
 }
 toggle(){if(this.requested){this.disable();return Promise.resolve(false);}return this.enable();}
 visibility(hidden){
  this.background=hidden;
  if(hidden){++this.ticket;this.enabled=false;clearInterval(this.timer);this.timer=null;if(this.ctx&&this.ctx.state!=='closed'){this.master.gain.setValueAtTime(0,this.ctx.currentTime);this.ctx.suspend().catch(()=>{});}}
  else if(this.requested)this.enable();
 }
 setListener(p){this.listener=p?{id:p.id,x:p.x,z:p.z}:null;}
 tone(midi,start,duration,amp=.13,type='sine',whistle=false,bus=null,endMidi=null){
  if(!this.ctx||!this.enabled||this.voices.size>=112)return;
  const c=this.ctx,o=c.createOscillator(),g=c.createGain(),filter=c.createBiquadFilter();
  start=Math.max(c.currentTime,start);duration=Math.max(.025,duration);o.type=type;o.frequency.setValueAtTime(440*2**((midi-69)/12),start);
  if(endMidi!==null)o.frequency.exponentialRampToValueAtTime(440*2**((endMidi-69)/12),start+duration);
  filter.type='lowpass';filter.frequency.setValueAtTime(whistle?2100:2600,start);
  let vibrato=null,depth=null;if(whistle){vibrato=c.createOscillator();depth=c.createGain();vibrato.frequency.value=5.6;depth.gain.setValueAtTime(0,start);depth.gain.linearRampToValueAtTime(3.2,start+Math.min(.13,duration*.4));vibrato.connect(depth);depth.connect(o.frequency);vibrato.start(start);vibrato.stop(start+duration+.03);}
  const attack=Math.min(duration*.25,whistle?.035:.004);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(amp,start+attack);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  o.connect(filter);filter.connect(g);g.connect(bus||this.musicBus);this.voices.add(o);o.start(start);o.stop(start+duration+.03);
  o.onended=()=>{this.voices.delete(o);o.disconnect();filter.disconnect();g.disconnect();vibrato?.disconnect();depth?.disconnect();};
 }
 noise(start,duration,amp,hz=1200,q=.7){
  if(!this.ctx||!this.enabled||this.voices.size>=112)return;
  const c=this.ctx,o=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();o.buffer=this.noiseBuffer;
  f.type='bandpass';f.frequency.setValueAtTime(hz,start);f.frequency.exponentialRampToValueAtTime(Math.max(70,hz*.38),start+duration);f.Q.value=q;
  g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(amp,start+.005);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  o.connect(f);f.connect(g);g.connect(this.fxBus);this.voices.add(o);o.start(start,0,duration+.02);
  o.onended=()=>{this.voices.delete(o);o.disconnect();f.disconnect();g.disconnect();};
 }
 setArea(area){if(['village','outside','front'].includes(area))this.pendingArea=area;}
 schedule(){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running'||this.background||document.hidden)return;
  const c=this.ctx;if(this.nextNote<c.currentTime)this.nextNote=c.currentTime+.04;
  // Three original modal 6/8 themes, changed on a bar boundary rather than an abrupt cut.
  const themes={
   village:{beat:.255,key:0,mel:[74,76,77,81,79,77,76,74,72,74,0,69,72,74,77,79,77,76,74,72,69,72,74,0,77,79,81,84,81,79,77,76,74,76,77,79,81,79,77,76,74,72,69,72,74,0,0,0],chords:[[50,57,62],[48,55,60],[53,57,60],[55,62,65]]},
   outside:{beat:.278,key:0,mel:[69,0,72,74,76,74,72,69,67,69,0,0,72,0,74,76,79,76,74,72,69,67,69,0,76,77,79,81,79,77,76,74,72,74,76,74,72,69,67,64,67,69,72,71,69,0,0,0],chords:[[45,52,57],[43,50,55],[48,52,55],[50,57,60]]},
   front:{beat:.207,key:0,mel:[76,76,79,81,79,76,74,76,79,83,81,79,76,74,71,74,76,79,81,79,76,74,71,0,79,81,83,86,83,81,79,76,74,76,79,81,83,81,79,76,74,71,74,76,79,76,74,71],chords:[[40,47,52],[43,50,55],[45,52,57],[47,54,59]]}
  };
  while(this.nextNote<c.currentTime+.25){
   if(this.step%12===0)this.area=this.pendingArea;
   const theme=themes[this.area],i=this.step%48,ch=theme.chords[Math.floor(i/12)%4],time=this.nextNote,beat=theme.beat;
   // Harp arpeggio, low open fifth, tin whistle and a quiet bowed answering line.
   this.tone(ch[i%3]+12,time,.85,.090,'triangle');
   if(i%6===0){this.tone(ch[0]-12,time,beat*5.4,.13,'sine');this.tone(ch[1],time,beat*4.8,.026,'triangle');}
   const note=theme.mel[i];if(note){this.tone(note,time,beat*1.75,.10,'sine',true);if(this.area==='front')this.tone(note-12,time,beat*1.7,.025,'triangle',true);}
   if(i%12===9)this.tone(ch[1]+24,time,.55,.025,'triangle');
   if(this.area!=='village'&&(i%6===0||i%6===3)){this.tone(i%6===0?34:40,time,.21,this.area==='front'?.22:.11,'sine',false,this.musicBus,26);}
   if(this.area==='front'&&(i%3===2))this.tone(52,time,.07,.04,'triangle',false,this.musicBus,36);
   this.step++;this.nextNote+=beat;
  }
 }

 fx(event){
  if(!this.enabled||!this.ctx||this.background)return false;
  const ev=typeof event==='string'?{type:event}:event,type=ev?.type,t=this.ctx.currentTime;if(!type)return false;
  const l=this.listener,spatial=Number.isFinite(ev.x)&&Number.isFinite(ev.z);
  if(!spatial&&ev.player&&l&&ev.player!==l.id)return false;
  const d=spatial&&l?Math.hypot(ev.x-l.x,ev.z-l.z):0;
  if(d>24)return false;const gain=1/(1+(d/6)**2);
  const localWound=type==='wound'&&ev.player===l?.id,fxKey=localWound?'wound:local':type;
  const gap=type==='step'?.095:localWound?.09:.028;
  if(t-(this.lastFX.get(fxKey)??-100)<gap)return false;
  const tone=(n,delay,dur,a=.2,wave='sine',end=null)=>this.tone(n,t+delay,dur,a*gain,wave,false,this.fxBus,end);
  const noise=(dur,a,hz,q=.7,delay=0)=>this.noise(t+delay,dur,a*gain,hz,q);
  if(type==='swing'||type==='enemySwing'){
   if(ev.skill===4000){noise(.085,.25,650);tone(48,0,.065,.12,'sine',37);}
   else{noise(.14,.36,ev.kind==='mage'||ev.weapon===5?2100:1600);tone(54,0,.10,.075,'triangle',40);}
  }else if(type==='hit'){
   const fist=ev.skill===4000||ev.kind==='practice';noise(.10,.50,430);tone(44,0,.13,.55,'sine',31);
   if(!fist)tone(86,0,.08,.08,'triangle',73);
  }else if(type==='wound'||type==='partbreak'){
   const weight=localWound?(ev.strength??(ev.severity==='light'?.6:1)):1;
   noise(.18,localWound?.48+weight*.16:.60,localWound?470:330);tone(localWound?39:42,0,.23,localWound?.55+weight*.15:.70,'sine',27);tone(57,.018,.10,.08,'triangle',37);
   if(type==='partbreak'||ev.severity==='heavy'||ev.severity==='lost')noise(.09,.38,1100,.8,.025);
  }else if(['clash','armor','guarded','blocked'].includes(type)){
   noise(.09,.35,2400,1.8);tone(90,0,.18,.18,'triangle');tone(97,.008,.11,.10,'sine');tone(43,0,.065,.22);
  }else if(type==='parry'||type==='seal'){
   noise(.10,.22,3200,2);tone(90,0,.28,.23,'triangle');tone(97,.04,.35,.14);
  }else if(type==='step'){
   noise(.075,.24,250);tone(34,0,.085,.26,'sine',27);
  }else if(type==='kill'){
   // The impact event owns the transient; this is only a soft falling-body tail.
   noise(.16,.16,210,.6,.025);tone(32,.04,.18,.15,'sine',25);
  }else if(type==='insight'||type==='passive'){
   [74,78,81,86].forEach((n,i)=>tone(n,i*.085,.8,.22,'triangle'));
  }else if(type==='death'){
   [62,57,50].forEach((n,i)=>tone(n,i*.23,1.4,.17,'triangle'));
  }else if(['depart','victory','returned'].includes(type)){
   [62,69,74,78].forEach((n,i)=>tone(n,i*.20,1,.16,'triangle'));
  }else if(type==='breath'){
   noise(.20,.10,650,.5);noise(.32,.13,480,.45,.28);
  }else if(type==='rescue'){
   tone(86,0,.42,.18);tone(81,.46,.65,.15);
  }else if(type==='skill'&&ev.id>=4030&&ev.id<=4035){
   noise(.4,.18,2600);[62,69,81].forEach((n,i)=>tone(n,i*.045,.55,.12,'triangle'));
  }else return false;
  this.lastFX.set(fxKey,t);this.effectCount++;return true;
 }
 updateFootsteps(p){
  if(!p)return;const old=this.foot;this.foot={x:p.x,z:p.z,distance:old?.distance||0};
  if(!old||!p.alive||!['run','guardWalk'].includes(p.action)){this.foot.distance=0;return;}
  const delta=Math.hypot(p.x-old.x,p.z-old.z);if(delta>1.5){this.foot.distance=0;return;}
  this.foot.distance+=delta;if(this.foot.distance>(p.guard?.52:.92)){this.foot.distance=0;this.fx({type:'step',x:p.x,z:p.z});}
 }
}
