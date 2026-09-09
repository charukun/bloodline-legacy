import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const source=await fs.readFile(new URL('../src/audio/score.js',import.meta.url),'utf8');
const catalog=JSON.parse(await fs.readFile(new URL('../public/assets/music/manifest.json',import.meta.url)));
function setup(){
 const made=[];const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}});
 const ctx={currentTime:0,state:'running',createGain:()=>({gain:param(),connect(){},disconnect(){}}),createMediaElementSource:()=>({connect(){},disconnect(){}})};
 const owner={ctx,musicBus:{},requested:true,background:false};
 const makeAudio=()=>{const a={currentTime:0,duration:NaN,paused:true,ended:false,plays:0,
  load(){},removeAttribute(){},play(){this.paused=false;this.plays++;return Promise.resolve();},pause(){this.paused=true;}};made.push(a);return a;};
 const gestures=new Set(),document={addEventListener:(type,fn)=>gestures.add(fn),removeEventListener:(type,fn)=>gestures.delete(fn)};
 const C=vm.runInNewContext(source+';CelticMusic',{WorldAudio:class{},document});
 const score=new C(owner,catalog,Object.fromEntries(catalog.tracks.map(t=>[t.id,'test'])),makeAudio);
 return {score,owner,ctx,made,gestures};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('four original long-form recordings have distinct, verified embedded assets',async()=>{
 assert.equal(catalog.tracks.length,4);const hashes=new Set();
 const built=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const track of catalog.tracks){
  const file=await fs.readFile(new URL('../public/assets/music/'+track.file,import.meta.url));
  assert.ok(track.duration>=60&&track.duration<=110);assert.equal(track.sections.length,7);
  assert.equal(file.length,track.bytes);assert.equal(createHash('sha256').update(file).digest('hex'),track.sha256);
  hashes.add(track.sha256);assert.ok(built.includes(file.toString('base64')));
 }
 assert.equal(hashes.size,4);assert.ok(built.includes('AudioEngine=CelticScoreAudio'));
});

test('crossfades reuse exactly two decks and retire the old decoder',async()=>{
 const {score,ctx,made}=setup();await score.resume('village');const first=score.active;
 first.media.currentTime=catalog.tracks.find(t=>t.id===first.id).duration-2;
 ctx.currentTime=50;score.tick('village');await flush();
 assert.notEqual(score.active,first);assert.equal(score.active.id,'legacy');assert.equal(first.media.paused,false);
 ctx.currentTime=54;score.tick('village');assert.equal(first.media.paused,true);
 for(let i=0;i<8;i++){ctx.currentTime+=120;score.active.media.ended=true;score.tick('village');await flush();score.active.media.ended=false;}
 assert.equal(made.length,2);
});

test('brief area-boundary crossings do not reset music; sustained travel crossfades',async()=>{
 const {score,ctx}=setup();await score.resume();const first=score.active;
 ctx.currentTime=20;score.tick('outside');ctx.currentTime=21;score.tick('village');
 assert.equal(score.active,first);ctx.currentTime=22;score.tick('outside');ctx.currentTime=25;score.tick('outside');await flush();
 assert.equal(score.area,'outside');assert.equal(score.active.id,'road');
 ctx.currentTime=29;score.tick('front');ctx.currentTime=32;score.tick('front');await flush();assert.equal(score.area,'outside');
 ctx.currentTime=38;score.tick('front');await flush();assert.equal(score.active.id,'battle');
});

test('mute/background pauses media and resumes the same phrase',async()=>{
 const {score,owner,made}=setup();await score.resume();const d=score.active;d.media.currentTime=23;
 owner.background=true;score.pause();score.tick('front');assert.ok(made.every(a=>a.paused));
 owner.background=false;await score.resume();assert.equal(score.active,d);assert.equal(d.media.currentTime,23);assert.equal(d.media.paused,false);
 owner.requested=false;score.pause();score.tick('village');assert.ok(made.every(a=>a.paused));
});

test('late play promises cannot restart sound after mute or pause a newer request',async()=>{
 const {score,made}=setup();const completions=[];made[0].play=function(){this.paused=false;return new Promise(resolve=>completions.push(resolve));};
 const first=score.resume();score.pause();const second=score.resume();
 completions[0]();await first;assert.equal(made[0].paused,false,'stale play must not pause reused deck');
 completions[1]();await second;assert.ok(score.active);assert.equal(score.active.media.paused,false);
 score.pause();score.active=null;const late=score.resume();score.pause();completions[2]();await late;
 assert.ok(made.every(a=>a.paused));assert.equal(score.running,false);
});

test('decoder/autoplay rejection keeps existing music and backs off without a retry storm',async()=>{
 const {score,made,ctx}=setup();await score.resume();const original=score.active;
 made[1].play=()=>Promise.reject(Error('decoder unavailable'));
 ctx.currentTime=20;score.tick('front');ctx.currentTime=23;score.tick('front');await flush();
 assert.equal(score.active,original);assert.equal(original.media.paused,false);assert.ok(score.retryAt>=31);
 const generation=score.generation;for(let i=0;i<100;i++)score.tick('front');assert.equal(score.generation,generation);
});

test('autoplay-denied background resume recovers on the next gesture, and mute removes the hook',async()=>{
 const {score,gestures}=setup();await score.resume();const d=score.active;d.media.currentTime=12;
 score.pause();d.media.play=()=>Promise.reject(Object.assign(Error('gesture required'),{name:'NotAllowedError'}));
 await score.resume();assert.equal(gestures.size,1);
 d.media.play=()=>{d.media.paused=false;return Promise.resolve();};for(const fn of [...gestures])fn();await flush();
 assert.equal(d.media.paused,false);assert.equal(d.media.currentTime,12);assert.equal(gestures.size,0);
 score.pause();d.media.play=()=>Promise.reject(Object.assign(Error(),{name:'NotAllowedError'}));await score.resume();score.pause();assert.equal(gestures.size,0);
});
