// Review entry point: real Simulation + shipped renderer. No Game, network,
// gameplay save or replacement attack implementation. Explicit trial unlocks.
const CompositionLab=(()=>{
 const $=id=>document.getElementById(id),base={version:1,form:'needle',cadence:'single',footwork:'plant',reaction:'bind',ending:'settle'};
 const examples=[['針の間返し',{cadence:'delay'}],['炉の踏み込み',{form:'hammer',footwork:'drive',reaction:'break',ending:'follow'}],['羽輪の三拍',{form:'wheel',cadence:'triple',footwork:'side',reaction:'push'}],['炭の払い抜け',{form:'rake',cadence:'return',reaction:'drain',ending:'withdraw'}],['静掌の引き足',{form:'palm',footwork:'draw',reaction:'break'}],['結脚の追い打ち',{form:'trip',footwork:'side',cadence:'return',reaction:'bind',ending:'follow'}]];
 let selected={...base,...examples[0][1]},slots=[],trial,renderer,paused=false,last=0,carry=0,seq=0,hits=0,links=0,mode='single',cycleEnded=false,request;
 const def=r=>BL_SKILL_CATALOG.byId.get(SkillComposition.id(r));
 function update(){const d=def(selected);$('name').textContent=d.names.ja;$('name-en').textContent=d.names.en;$('phase').textContent='編成する段：'+PHASES[d.phase];$('description').textContent=d.descriptions.ja;
  const words={close:'近い間合い',rhythm:'拍子',offbalance:'崩れ'};
  $('connection').textContent='繋がる状態：'+(d.entry.map(k=>words[k]||k).join('・')||'単独で始める')+' → '+d.exit.map(k=>words[k]||k).join('・');
  for(const key of Object.keys(SkillComposition.tables))$(key).value=selected[key];$('recipe').value=JSON.stringify({version:1,selected,slots});
  $('slots').replaceChildren(...slots.map((r,i)=>{const b=document.createElement('button');b.textContent=PHASES[i]+' · '+def(r).names.ja;b.className=d.id===def(r).id?'selected':'';b.onclick=()=>{selected={...r};update();};return b;}));
 }
 function clearVisual(){renderer.effects.length=0;renderer.skillMotionStates?.clear();renderer.art.skillFeet?.clear();renderer.damageMotion?.actors.clear();for(const id of renderer.combatPresentation.trails.keys())renderer.combatPresentation.forget(id);renderer.combatPresentation.castSamples.clear();}
 function prepareTrial(config={}){
  const sim=new Simulation({seed:18427}),p=sim.addPlayer('skill-trial',{owner:'skill-trial',race:0}),room=sim.getRoom(p);
  Object.assign(p,{prologue:false,age:24,introUntil:-100,releaseAt:-100,farewellStage:3,x:0,z:0,dir:0,weapon:-1,stamina:100,staminaCap:100});
  room.kind='frontline';room.stage=0;room.actors=[];room.waveAt=1e9;sim.yearSeconds=1e9;
  const kind=config.target||'dummy',distance=config.distance??1.7;
  for(const x of kind==='crowd'?[-1.1,0,1.1]:[0]){const e=sim.actor(kind==='crowd'?'dummy':kind,x,distance);e.cooldown=sim.time+.8;room.actors.push(e);}
  return {sim,p,room};
 }
 function launch(nextMode=mode){mode=nextMode;trial=prepareTrial({target:$('target').value,distance:+$('distance').value});seq=trial.sim.seq;hits=0;links=0;carry=0;cycleEnded=false;clearVisual();
  const {sim,p,room}=trial,chosen=mode==='combo'?slots:[selected];
  for(const recipe of chosen){const d=def(recipe);sim.learn(p,d.id);p.phaseWeights[d.phase]={[d.id]:1};}
  const d=def(chosen[0]);p.combo={band:d.phase,total:0,repeats:0};p.autoFight=mode==='combo'?room.actors[0].id:null;
  sim.beginComboStrike(p,d.id);if(mode==='combo')p.comboQueued=true;paused=false;$('pause').textContent='一時停止';
 }
 function advance(dt){const {sim,p}=trial;sim.tick(dt);
  for(const e of sim.events.filter(e=>e.seq>seq)){if(e.type==='hit'&&e.source===p.id)hits++;if(e.type==='skillconnection')links++;renderer.effect(e,sim.time);}seq=sim.seq;
  if(!p.combo&&!p.pendingSkill&&!cycleEnded){cycleEnded=true;p.autoFight=null;p.autoSuppressedUntil=1e9;}
 }
 async function start(){
  for(const [key,choices]of Object.entries(SkillComposition.tables)){const label=document.createElement('label');label.textContent=({form:'打ち方',cadence:'拍子',footwork:'足運び',reaction:'命中時の作用',ending:'終わり方'})[key];const input=document.createElement('select');input.id=key;for(const c of choices){const option=document.createElement('option');option.value=c.key;option.textContent=c.name+' — '+(c.text||'');input.append(option);}input.onchange=()=>{selected={...selected,[key]:input.value};update();launch('single');};label.append(input);$('parts').append(label);}
  examples.forEach(([name],i)=>{const o=document.createElement('option');o.value=i;o.textContent=name;$('preset').append(o);});$('preset').onchange=()=>{selected={...base,...examples[+$('preset').value][1]};update();launch('single');};
  slots=[{...base,ending:'follow'},{...base,reaction:'bind',ending:'settle'},{...base,reaction:'drain',ending:'withdraw'}];
  $('adopt').onclick=()=>{slots[def(selected).phase]={...selected};update();};$('cast').onclick=()=>launch('single');$('combo').onclick=()=>launch('combo');$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'再生':'一時停止';};
  $('distance').oninput=()=>{$('distanceText').value=(+$('distance').value).toFixed(1);};$('distance').onchange=()=>launch();$('target').onchange=()=>launch();
  const restore=value=>{if(value.version!==1||!Array.isArray(value.slots)||value.slots.length!==3)throw Error('この稽古帳の構成ではありません');def(value.selected);value.slots.forEach((r,i)=>{if(def(r).phase!==i)throw Error('序破急の配置が一致しません');});selected={...value.selected};slots=value.slots.map(r=>({...r}));update();};
  $('save').onclick=()=>{try{restore(JSON.parse($('recipe').value));localStorage.setItem('bloodline-skill-composition-lab-v1',$('recipe').value);$('error').textContent='構成を保存しました';}catch(e){$('error').textContent='保存できません：'+e.message;}};
  $('load').onclick=()=>{try{restore(JSON.parse($('recipe').value));launch();$('error').textContent='構成を読み込みました';}catch(e){$('error').textContent=e.message;}};
  try{const saved=localStorage.getItem('bloodline-skill-composition-lab-v1');if(saved)restore(JSON.parse(saved));}catch{}update();
  await AssetBank.load();installTerrainGeometry();renderer=new SliceRenderer($('world'));renderer.setQuality('medium');renderer.sceneKey='portrait';renderer.art.root=rModel();renderer.art.target=renderer.static;renderer.art.B(0,-.08,0,16,.1,16,'#7b8878');
  for(let z=-4;z<=5;z++)renderer.art.B(0,-.024,z,9,.008,.025,'#bdba98');for(let x=-4;x<=4;x++)renderer.art.B(x,-.024,.5,.025,.008,9,'#bdba98');
  renderer.art.parentScene=()=>{};renderer.art.sources=[];$('loading').hidden=true;$('build').textContent='2,304構成 · '+BUILD_INFO.shortCommit+' · 稽古用に技を開放';launch();
  document.addEventListener('visibilitychange',()=>{last=0;carry=0;});
  function frame(now){request=requestAnimationFrame(frame);if(document.hidden){last=0;return;}const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
   if(!paused){carry+=dt*+$('speed').value;while(carry>=1/60){advance(1/60);carry-=1/60;}}
   const {sim,p}=trial,s=sim.snapshot(p.id,seq);s.map=trial.room.map;
   Object.assign(renderer.camera,{x:p.x*.3,z:.6+p.z*.3,y:1.05,zoom:6.8,yaw:+$('view').value,pitch:.52});renderer.render(s,paused?0:dt*+$('speed').value,{portrait:true,freezeCamera:true});
   $('readout').textContent=(skillById(p.currentSkill??p.attackSkill)?.name||'構え')+' ／ 命中 '+hits+' · 接続 '+links+' ／ '+(incapacitated(p)?'行動不能':({charge:'溜め',attack:'攻撃',recover:'立て直し',idle:'構え'})[p.action]||p.action);
   if(!paused&&sim.time>7&&$('repeat').checked)launch();
  }request=requestAnimationFrame(frame);
  window.CompositionLab={getRecipe:()=>({...selected}),getSlots:()=>slots.map(r=>({...r})),getTrial:()=>trial,prepareTrial,launch,pause:()=>{paused=true;},step:advance,dispose:()=>{cancelAnimationFrame(request);renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();}};
 }
 return {start,prepareTrial};
})();
try{await CompositionLab.start();}catch(e){document.getElementById('loading').textContent='表示できませんでした：'+e.message;console.error(e);}
