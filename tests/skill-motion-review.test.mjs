import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {motionRuntime} from './skill-motion-harness.mjs';
const api=await motionRuntime();
const runtime=fs.readFileSync(new URL('../tools/skill-motion-review-runtime.js',import.meta.url),'utf8');
const review=vm.runInNewContext(runtime+';MotionReview',{skillById:api.skillById,actionTiming:api.actionTiming,clamp:(v,a,b)=>Math.min(b,Math.max(a,v))});

test('review snapshots exercise the six shipped skills and each authoritative contact without changing a player',()=>{
 const p=api.player(),before=JSON.stringify(p);
 for(const key of ['slash','thrust','slam','kick','spin','cast','chain']){
  const seq=review.sequence(key);
  for(const s of seq.segments){
   assert.deepEqual({...s.timing},{...api.actionTiming(api.skillById(s.id))});
   const charge=review.sample(p,key,s.start+.001);assert.equal(charge.p.pendingSkill.id,s.id);
   for(let beat=0;beat<s.hits;beat++){
    const time=s.release+(beat+.43)*s.timing.swing/s.hits,q=review.sample(p,key,time);
    const c=api.SkillMotion.clock(q.p,q.t);assert.equal(c.sk.id,s.id);assert(Math.abs(c.beat-.43)<1e-9);
    assert.equal(q.label,'命中');
   }
  }
  const end=review.sample(p,key,seq.end-.001);assert.equal(end.p.action,'recover');
  assert.notEqual(review.sample(p,key,seq.duration+.001).p.id,p.id);
 }
 assert.equal(JSON.stringify(p),before);
});

test('review chain preserves pose history at skill boundaries and can replay a seek deterministically',()=>{
 const run=()=>{const r=api.renderer(),cm=new api.CM01.Character(r),seq=review.sequence('chain'),p=api.player();
  for(let t=0;t<seq.segments[2].release;t+=1/60){const f=review.sample(p,'chain',t);r.frame++;cm.update(f.p,f.t);}
  const f=review.sample(p,'chain',seq.segments[2].release);r.frame++;cm.update(f.p,f.t);return [...cm.palette];};
 assert.deepEqual(run(),run());
});

test('review controls preserve seek on A/B and send speed, pose, age and FX changes to the isolated renderer',async t=>{
 const template=fs.readFileSync(new URL('../tools/skill-motion-review.html',import.meta.url),'utf8');
 const payload={code:'// SOURCE MODULE: legacy/motion.js\nconst pose="after";\n// SOURCE MODULE: end.js\n',before:{'legacy/motion.js':'const pose="before";'},beforeSha:'a'.repeat(40),afterSha:'b'.repeat(40)};
 const html=template.replace('/*__PAYLOAD__*/',JSON.stringify(payload)),dom=new JSDOM(html,{runScripts:'outside-only',url:'https://review.test'}),w=dom.window;
 t.after(()=>w.close());w.eval(w.document.querySelector('script').textContent);
 await new Promise(resolve=>setTimeout(resolve,10));
 const frame=w.document.querySelector('iframe'),messages=[];
 let session=1;const ready=()=>{frame.contentWindow.postMessage=d=>messages.push(d);w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,data:{type:'motion-review',ready:true,session}}));};
 ready();
 const change=(id,value)=>{const el=w.document.getElementById(id);if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event(id==='seek'?'input':'change'));};
 change('clip','chain');change('age','14');change('speed','0.25');change('fx',true);change('seek','630');
 assert.equal(messages.at(-1).seek,.63);assert.equal(messages.at(-1).config.paused,true);assert.equal(messages.at(-1).config.speed,.25);assert.equal(messages.at(-1).config.fx,true);assert.equal(messages.at(-1).config.age,14);
 w.document.querySelector('[data-version="before"]').click();session++;await new Promise(resolve=>setTimeout(resolve,10));ready();
 assert.match(frame.srcdoc,/const pose="before"/);assert.equal(messages.at(-1).seek,.63);assert.equal(w.document.querySelector('[data-version="before"]').getAttribute('aria-pressed'),'true');
 w.document.getElementById('restart').click();assert.equal(messages.at(-1).seek,0);
 assert(!runtime.includes('new Game('));assert(!runtime.includes('localStorage'));assert(!runtime.includes('fetch('));
});
