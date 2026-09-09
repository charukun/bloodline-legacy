import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './ui-fixture.cjs';

function setup(t){
 const f=fixture(t),{w,d,ui,g}=f,button=d.getElementById('talk-button');
 Object.defineProperties(w,{innerWidth:{value:390,writable:true},innerHeight:{value:844,writable:true}});
 button.getBoundingClientRect=()=>({left:w.innerWidth-60,top:w.innerHeight-134,width:48,height:52});
 let capture=null;button.setPointerCapture=id=>{capture=id;};button.hasPointerCapture=id=>id===capture;
 button.releasePointerCapture=()=>{capture=null;};
 g.installInput();
 const pointer=(type,x=w.innerWidth-36,y=w.innerHeight-108,id=1,primary=true)=>{
  const e=new w.MouseEvent(type,{button:0,clientX:x,clientY:y,bubbles:true,cancelable:true});
  Object.defineProperties(e,{pointerId:{value:id},isPrimary:{value:primary}});button.dispatchEvent(e);
 };
 const aim=i=>{const a=(-195+i*30)*Math.PI/180,r=ui.talkFan.radius*.78;return [ui.talkFan.cx+Math.cos(a)*r,ui.talkFan.cy+Math.sin(a)*r];};
 const held=async()=>{pointer('pointerdown');await new Promise(r=>setTimeout(r,390));};
 return {...f,button,pointer,aim,held,capture:()=>capture};
}
function microphone(w,prefix=false){
 const instances=[];
 class Recognition {constructor(){instances.push(this);}start(){this.started=true;}abort(){this.aborted=true;}}
 w[prefix?'webkitSpeechRecognition':'SpeechRecognition']=Recognition;return instances;
}
function finalResult(text,isFinal=true){return {resultIndex:0,results:[Object.assign([{transcript:text}],{isFinal})]};}

test('hold, flick and release selects each phrase exactly once without world rest or movement',async t=>{
 const {g,ui,d,p,sim,button,pointer,held,aim,capture}=setup(t);
 for(const [i,text]of ['助けて','よろしく','ありがとう'].entries()){
  sim.time+=3;g.snapshot=g.decorate(sim.snapshot(p.id,sim.seq));g.keys.add('KeyW');g.walkTarget={x:10,z:10};
  await held();assert.ok(d.getElementById('talk-fan'));assert.equal(g.keys.size,0);assert.equal(g.walkTarget,null);assert.equal(capture(),1);
  pointer('pointermove',...aim(i));assert.equal(d.querySelector('.selected').dataset.talk,String(i));
  pointer('pointerup',...aim(i));button.dispatchEvent(new button.ownerDocument.defaultView.MouseEvent('click',{detail:1,bubbles:true}));
  assert.equal(p.speech,text);assert.equal(ui.talkFan.menu,null);assert.equal(capture(),null);assert.equal(p.seated,false);assert.equal(g.pointer,undefined);
  assert.equal(sim.events.filter(e=>e.type==='speech'&&e.text===text).length,1);
 }
 assert.equal(d.querySelector('#chat-text,#chat-form,[data-say],#mother-down'),null);
});

test('center, outside sector and outside radius releases cancel instead of speaking',async t=>{
 const {ui,p,pointer,held,button,w}=setup(t);await held();pointer('pointerup');assert.equal(p.speech,'');assert.equal(ui.talkFan.menu,null);
 for(const coords of [[w.innerWidth-4,w.innerHeight-100],[5,5]]){
  button.click();pointer('pointerdown'); // Close the latched menu; start a fresh hold.
  await held();pointer('pointerup',...coords);assert.equal(p.speech,'');assert.equal(ui.talkFan.menu,null);
 }
});

test('pointercancel, lost capture and a second finger cannot commit or leave a hold timer',async t=>{
 const {ui,p,pointer,held,aim,button}=setup(t);
 pointer('pointerdown');pointer('pointercancel');await new Promise(r=>setTimeout(r,390));assert.equal(ui.talkFan.menu,null);
 await held();pointer('pointermove',...aim(1),2,false);pointer('pointerup',...aim(1),2,false);assert.ok(ui.talkFan.menu);
 pointer('lostpointercapture');assert.equal(ui.talkFan.menu,null);assert.equal(p.speech,'');
 pointer('pointerdown',undefined,undefined,2,false);assert.equal(ui.talkFan.pointer,null);
 button.click();assert.ok(ui.talkFan.menu);
});

test('short tap opens choices, Escape cancels, and keyboard selection never opens typed chat',t=>{
 const {ui,g,d,w,p,pointer,button}=setup(t);pointer('pointerdown');pointer('pointerup');
 button.dispatchEvent(new w.MouseEvent('click',{detail:1,bubbles:true}));assert.ok(ui.talkFan.menu);
 d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(ui.modal,null);assert.equal(ui.talkFan.menu,null);
 button.click();d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
 assert.equal(d.activeElement.dataset.talk,'1');d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
 assert.equal(p.speech,'よろしく');assert.equal(ui.talkFan.menu,null);assert.equal(g.keys.size,0);assert.equal(d.activeElement,button);
 assert.equal(d.querySelector('#chat-text,textarea,#chat-form'),null);
});

test('outside world tap only dismisses; next world gesture remains available',t=>{
 const {ui,g,w,button}=setup(t);button.click();
 g.renderer.canvas.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,bubbles:true,cancelable:true}));
 assert.equal(ui.talkFan.menu,null);assert.ok(!g.pointer);assert.equal(g.walkTarget,null);assert.equal(ui.blocksWorldInput(),false);
});

test('mic starts only after explicit selection, sends only one final result through shared chat',t=>{
 const {ui,w,d,p,sim,button}=setup(t),instances=microphone(w);button.click();assert.equal(instances.length,0);
 d.querySelector('[data-talk="3"]').click();const rec=instances[0],callback=rec.onresult;
 assert.equal(rec.started,true);assert.equal(rec.lang,'ja-JP');assert.equal(rec.interimResults,false);assert.equal(rec.continuous,false);assert.ok(button.classList.contains('listening'));
 callback(finalResult('途中',false));assert.equal(p.speech,'');callback(finalResult('  向こうへ行こう  '));callback(finalResult('重複'));
 assert.equal(p.speech,'向こうへ行こう');assert.equal(sim.events.filter(e=>e.type==='speech').length,1);assert.equal(rec.aborted,true);assert.equal(ui.talkFan.recognition,null);assert.ok(!button.classList.contains('listening'));
});

test('unsupported, denied and failed mic leave quick phrases usable',t=>{
 const {w,ui,d,p,button}=setup(t);button.click();assert.equal(d.querySelector('[data-talk="3"]').getAttribute('aria-disabled'),'true');
 d.querySelector('[data-talk="3"]').click();assert.equal(ui.talkFan.recognition,null);assert.match(d.getElementById('toasts').textContent,/音声入力/);
 const instances=microphone(w,true);button.click();d.querySelector('[data-talk="3"]').click();instances[0].onerror({error:'not-allowed'});
 assert.equal(ui.talkFan.recognition,null);assert.ok(!button.classList.contains('listening'));button.click();d.querySelector('[data-talk="2"]').click();assert.equal(p.speech,'ありがとう');
 w.webkitSpeechRecognition=class{start(){throw Error('device unavailable');}abort(){}};button.click();d.querySelector('[data-talk="3"]').click();assert.equal(ui.talkFan.recognition,null);assert.ok(!button.classList.contains('listening'));
});

test('mic aborts on cancel, navigation, visibility, blur, death or room change and rejects late callbacks',t=>{
 const {w,ui,d,g,p,button,sync}=setup(t),instances=microphone(w);
 const exits=[()=>button.click(),()=>ui.body(),()=>w.dispatchEvent(new w.Event('blur')),()=>w.dispatchEvent(new w.Event('pagehide')),()=>{Object.defineProperty(d,'hidden',{value:true,configurable:true});d.dispatchEvent(new w.Event('visibilitychange'));},()=>{p.alive=false;sync();},()=>{g.snapshot.room.id='another-room';ui.talkFan.check();},()=>{p.lifeState='downed';sync();}];
 for(const leave of exits){
  p.alive=true;p.lifeState='active';Object.defineProperty(d,'hidden',{value:false,configurable:true});ui.closeModal();sync();
  button.click();d.querySelector('[data-talk="3"]').click();const rec=instances.at(-1),late=rec.onresult;leave();late(finalResult('送信しない'));
  assert.equal(rec.aborted,true);assert.equal(ui.talkFan.recognition,null);assert.equal(p.speech,'');
 }
});

test('speech retains server cooldown, text sanitation and online command transport',t=>{
 const {g,ui,d,p,sim,button,w}=setup(t);button.click();d.querySelector('[data-talk="1"]').click();assert.equal(p.speech,'よろしく');
 button.click();d.querySelector('[data-talk="0"]').click();assert.equal(p.speech,'よろしく');
 sim.time+=3;g.snapshot=g.decorate(sim.snapshot(p.id,sim.seq));const instances=microphone(w);button.click();d.querySelector('[data-talk="3"]').click();instances[0].onresult(finalResult('あ'.repeat(80)));assert.equal(p.speech.length,60);
 g.online=true;g.live={ready:true};g.commandBuffer=[];button.click();d.querySelector('[data-talk="2"]').click();
 assert.equal(g.commandBuffer.filter(c=>c.type==='chat').length,1);assert.equal(g.commandBuffer.find(c=>c.type==='chat').text,'ありがとう');assert.equal(p.speech,'あ'.repeat(60));
});

test('fan fits portrait, landscape and safe-area button positions; sectors agree with rendered choices',t=>{
 const {w,ui,button,aim}=setup(t);
 for(const [width,height,safe]of [[320,568,0],[390,844,34],[844,390,21],[568,320,0],[360,240,0]]){
  w.innerWidth=width;w.innerHeight=height;button.getBoundingClientRect=()=>({left:width-60-safe,top:height-134-safe,width:48,height:52});button.click();
  const fan=ui.talkFan,r=fan.radius;assert.ok(fan.cx-r>=8);assert.ok(fan.cy-r>=8);assert.ok(fan.cy+r*.5<=height-8);
  for(let i=0;i<4;i++)assert.equal(fan.hit(...aim(i)),i);assert.equal(fan.hit(fan.cx,fan.cy),-1);assert.equal(fan.hit(fan.cx+50,fan.cy),-1);ui.talkFan.cancel();
 }
});

test('carried childhood preserves parent dialogue without a chat form or get-down button',t=>{
 const {g,p,sim,ui,d,button}=setup(t);Object.assign(p,{prologue:true,age:0,introUntil:sim.time+100});g.snapshot=g.decorate(sim.snapshot(p.id,sim.seq));
 button.click();assert.ok(p.motherText);assert.ok(ui.talkFan.menu);assert.equal(d.querySelector('#mother-down,#chat-text,#chat-form'),null);
 d.querySelector('[data-talk="0"]').click();assert.equal(p.prologue,true);assert.equal(p.speech,'助けて');
});


test('mic can be selected by the held pointer, and silence or the session deadline releases it',async t=>{
 const {ui,w,d,button,p,pointer,held,aim}=setup(t),instances=microphone(w);
 const original=w.setTimeout;let deadline;
 w.setTimeout=(fn,ms,...args)=>{if(ms===12000)deadline=fn;return original(fn,ms,...args);};
 await held();assert.equal(instances.length,0);pointer('pointermove',...aim(3));pointer('pointerup',...aim(3));
 assert.equal(instances[0].started,true);assert.equal(ui.talkFan.menu,null);const late=instances[0].onresult;
 deadline();late(finalResult('期限後'));assert.equal(instances[0].aborted,true);assert.equal(p.speech,'');
 button.click();d.querySelector('[data-talk="3"]').click();instances[1].onend();assert.equal(ui.talkFan.recognition,null);assert.ok(!button.classList.contains('listening'));
});


test('room transition during the hold cannot open a fan in the next room',async t=>{
 const {g,ui,p,pointer}=setup(t);pointer('pointerdown');g.snapshot.room.id='next-room';
 await new Promise(r=>setTimeout(r,390));assert.equal(ui.talkFan.menu,null);assert.equal(ui.talkFan.pointer,null);assert.equal(p.speech,'');
});
