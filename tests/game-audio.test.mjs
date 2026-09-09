import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const read=p=>fs.readFile(new URL('../src/'+p,import.meta.url),'utf8');
const [deckSource,base,ambience,scoreSource]=await Promise.all(['audio/buffer-deck.js','legacy/audio.js','audio/ambience.js','audio/score.js'].map(read));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const param=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(v){this.value=v;}});
const node=()=>({gain:param(),frequency:param(),delayTime:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),playbackRate:param(),connect(){},disconnect(){},start(){},stop(){}});
function setup(){
 const nodes=[],decoded=[],timers=new Set(),events=new Map(),gestures=new Set();
 const ctx={currentTime:0,state:'running',sampleRate:48000,destination:{},createGain:node,createDelay:node,createBiquadFilter:node,createDynamicsCompressor:node,
  createBuffer:(channels,length,rate)=>({duration:length/rate,getChannelData:()=>new Float32Array(length)}),
  createMediaElementSource(){throw Error('HTML media must not be used');},
  createBufferSource(){const n=node();n.start=(at=0,offset=0,duration=Infinity)=>{n.at=at;n.offset=offset;n.end=at+duration;};n.stop=()=>{n.stopped=true;};nodes.push(n);return n;},
  decodeAudioData:async bytes=>{decoded.push(bytes.byteLength);return {duration:6,numberOfChannels:2,length:288000,sampleRate:48000};},
  resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();}};
 const catalog={tracks:['hearth','road','legacy','battle'].map(id=>({id,duration:72,chunks:Array.from({length:12},(_,i)=>({start:i*6,duration:6}))}))};
 const assets=Object.fromEntries(catalog.tracks.map(t=>[t.id,Array(12).fill('AAAA')]));
 const document={hidden:false,focused:true,hasFocus(){return this.focused;},addEventListener:(name,fn)=>gestures.add(fn),removeEventListener:(name,fn)=>gestures.delete(fn)};
 const window={AudioContext:function(){return ctx;},addEventListener:(name,fn)=>events.set(name,fn)};
 const context=vm.createContext({document,window,atob,Float32Array,MUSIC_CATALOG:catalog,MUSIC_ASSETS:assets,
  setInterval(fn){const token={fn};timers.add(token);return token;},clearInterval:id=>timers.delete(id),Audio:function(){throw Error('HTML media must not be used');}});
 vm.runInContext([base,ambience,deckSource,scoreSource].join('\n'),context);
 const Deck=vm.runInContext('GameMusicDeck',context),Engine=vm.runInContext('CelticScoreAudio',context);
 const deck=new Deck(ctx,{},new Map(catalog.tracks.map(t=>[t.id,t])),assets);deck.load('hearth');
 return{deck,Engine,ctx,nodes,decoded,timers,events,gestures,document};
}

test('direct audio schedules adjacent chunks without gaps and keeps only a two-chunk window',async()=>{
 const {deck,ctx,nodes,decoded}=setup();await deck.play();
 assert.equal(decoded.length,2);assert.equal(nodes[0].end,nodes[1].at);
 for(let t=1;t<=68;t++){
  ctx.currentTime=t;for(const n of nodes)if(!n.stopped&&!n.finished&&n.end<=t){n.finished=true;n.onended?.();}
  await deck.pump();assert.ok(deck.nodes.size<=2);assert.ok(deck.buffers.size<=2);
 }
 assert.equal(decoded.length,12);assert.ok(deck.currentTime>67);
 deck.dispose();assert.equal(deck.nodes.size,0);assert.equal(deck.buffers.size,0);
});

test('pause stops scheduled audio immediately; resume uses the same exact song position',async()=>{
 const {deck,ctx,nodes}=setup();await deck.play();ctx.currentTime=3.05;deck.pause();
 assert.equal(deck.currentTime,3);assert.ok(nodes.every(n=>n.stopped));
 ctx.currentTime=30;await deck.play();const resumed=nodes.at(-2);
 assert.equal(resumed.at,30.05);assert.equal(resumed.offset,3);assert.equal(deck.currentTime,3);
 ctx.currentTime=32.05;assert.ok(Math.abs(deck.currentTime-5)<1e-8);
});

test('late decodes cannot create sound after background or dispose; rapid toggles serialize decoding',async()=>{
 const {deck,ctx,nodes}=setup();const pending=[];let inFlight=0,peak=0;
 ctx.decodeAudioData=()=>{peak=Math.max(peak,++inFlight);return new Promise(resolve=>pending.push(()=>{inFlight--;resolve({duration:6});}));};
 const old=deck.play();await flush();deck.pause();const newer=deck.play();await flush();assert.equal(pending.length,1);
 pending.shift()();await old;await flush();assert.equal(nodes.length,0);
 pending.shift()();await flush();assert.equal(nodes.length,1);
 deck.dispose();pending.shift()();await newer;assert.equal(deck.nodes.size,0);assert.equal(deck.buffers.size,0);assert.equal(peak,1);
});

test('bad or truncated chunks fail closed rather than silently adding a gap',async()=>{
 const {deck,ctx,nodes}=setup();ctx.decodeAudioData=async()=>({duration:5.5});
 await assert.rejects(deck.play(),/length mismatch/);assert.equal(deck.paused,true);assert.equal(nodes.length,0);
});

test('real engine suspends all buses on blur/pagehide and resumes only while focused and visible',async()=>{
 const {Engine,ctx,document,events,timers}=setup(),audio=new Engine();await audio.enable();
 const active=audio.score.active;ctx.currentTime=2.05;document.focused=false;events.get('blur')();
 assert.equal(document.hidden,false);assert.equal(audio.background,true);assert.equal(audio.enabled,false);assert.equal(ctx.state,'suspended');assert.equal(timers.size,0);assert.equal(audio.master.gain.value,0);
 assert.ok(audio.score.decks.every(d=>d.media.paused));
 document.focused=true;events.get('focus')();await flush();assert.equal(audio.enabled,true);assert.equal(audio.score.active,active);assert.ok(Math.abs(active.media.currentTime-2)<1e-8);assert.equal(timers.size,1);
 events.get('pagehide')();events.get('focus')();await flush();assert.equal(audio.background,true);assert.equal(timers.size,0);
 events.get('pageshow')();await flush();assert.equal(audio.enabled,true);
 document.hidden=true;audio.visibility(true);audio.disable();document.hidden=false;audio.visibility(false);await flush();assert.equal(audio.requested,false);assert.equal(audio.enabled,false);assert.equal(timers.size,0);
});

test('a pending AudioContext resume cannot re-enable sound after focus loss',async()=>{
 const {Engine,ctx,events,timers}=setup();ctx.state='suspended';let release;
 ctx.resume=()=>new Promise(resolve=>{release=resolve;});const audio=new Engine(),enabled=audio.enable();
 events.get('blur')();release();assert.equal(await enabled,false);assert.equal(audio.enabled,false);assert.equal(timers.size,0);assert.ok(audio.score.decks.every(d=>d.media.paused));
});

test('focus loss during the initial music decode also invalidates the enable result',async()=>{
 const {Engine,ctx,events}=setup();let release;ctx.decodeAudioData=()=>new Promise(resolve=>{release=resolve;});
 const audio=new Engine(),enabled=audio.enable();await flush();events.get('blur')();release({duration:6});
 assert.equal(await enabled,false);assert.equal(audio.enabled,false);assert.ok(audio.score.decks.every(d=>d.media.nodes.size===0));
});

test('autoplay failure retries in the next gesture, and explicit mute removes the retry',async()=>{
 const {Engine,ctx,gestures}=setup();ctx.state='suspended';ctx.resume=()=>Promise.reject(Error('gesture required'));
 const audio=new Engine();assert.equal(await audio.enable(),false);assert.equal(gestures.size,1);
 ctx.resume=()=>{ctx.state='running';return Promise.resolve();};for(const fn of [...gestures])fn();await flush();assert.equal(audio.enabled,true);assert.equal(gestures.size,0);
 audio.disable();ctx.state='suspended';ctx.resume=()=>Promise.reject(Error('gesture required'));await audio.enable();audio.disable();assert.equal(gestures.size,0);
});
