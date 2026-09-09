// Real Simulation and shipped renderer; draws and storage belong only to this lab.
const CompositionLab=(()=>{
 const $=id=>document.getElementById(id),base={version:1,form:'needle',cadence:'single',footwork:'plant',reaction:'bind',ending:'settle'};
 const examples=[['針の踏み込み',{cadence:'delay',footwork:'drive'}],['炉の踏み込み',{form:'hammer',footwork:'drive',reaction:'break',ending:'follow'}],['羽輪の三拍',{form:'wheel',cadence:'triple',footwork:'side',reaction:'push'}],['炭の払い抜け',{form:'rake',cadence:'return',reaction:'drain',ending:'withdraw'}],['静掌の引き足',{form:'palm',footwork:'draw',reaction:'break'}],['結脚の追い打ち',{form:'trip',footwork:'side',cadence:'return',reaction:'bind',ending:'follow'}]];
 const native=[...book.values()].filter(s=>!s.passive&&s.weapon>=0&&s.weapon<6&&s.trigger==='combo'&&!s.magic&&!s.resource&&!s.item&&!s.items&&!s.requiresPassive&&!s.sacrifice);
 const english={4001:'Slash',4002:'Rending Cut',4003:'Heavy Cleave',4004:'Thrust',4005:'Axe Strike',4006:'Staff Strike',4016:'Coiling Cut',4017:'Bamboo Splitter',4019:'Leg Sever'};
 let selected={...base,...examples[0][1]},slots=[],weapon=-1,trial,renderer,paused=false,last=0,carry=0,seq=0,hits=0,links=0,mode='single',cycleEnded=false,request,travel=0,history=[];
 let drawSeed=(Date.now()^0x45d9f3b)>>>0;
 const random=()=>{drawSeed=(Math.imul(drawSeed,1664525)+1013904223)>>>0;return drawSeed/4294967296;};
 const pick=items=>items[Math.floor(random()*items.length)];
 function def(r){
  if(r?.skillId!==undefined){const sk=native.find(s=>s.id===r.skillId);if(!sk)throw Error('稽古帳にない武器技です');return {id:sk.id,names:{ja:sk.name,en:english[sk.id]||''},descriptions:{ja:sk.desc},phase:skillPhase(sk),entry:[],exit:[],action:sk};}
  const d=BL_SKILL_CATALOG.byId.get(SkillComposition.id(r));if(!d)throw Error('不明な構成技です');return d;
 }
 const canonical=r=>{const d=def(r);return d.composition?{...d.composition}:{skillId:d.id};};
 function generate(phase){const r={version:1};for(const [key,choices]of Object.entries(SkillComposition.tables))r[key]=pick(choices).key;
  if(phase!==undefined){const p=SkillComposition.resolve(r);r.ending=SkillComposition.tables.ending.find(e=>(p.form.code+p.cadence.code+e.phase)%3===phase).key;}return r;
 }
 const available=(w,phase)=>native.filter(s=>s.weapon===w&&(phase===undefined||skillPhase(s)===phase));
 const effect=d=>typeof SkillEffects==='undefined'?null:SkillEffects.forSkill(d.id);
 function effectText(d){const fx=effect(d);return fx?['family','path','impact','release'].map(k=>SkillEffects.options[k][fx[k]]).join(' / '):'武器の軌跡と命中の火花';}
 function update(){
  const d=def(selected);$('name').textContent=d.names.ja;$('name-en').textContent=d.names.en;$('phase').textContent='編成する段：'+PHASES[d.phase];$('description').textContent=d.descriptions.ja;
  $('connection').textContent=d.composition?'繋がる状態：'+(d.entry.map(k=>({close:'近い間合い',rhythm:'拍子',offbalance:'崩れ'})[k]||k).join('・')||'単独で始める')+' → '+d.exit.map(k=>({close:'近い間合い',rhythm:'拍子'})[k]||k).join('・'):'持っている武器で放つ技。ほかの段には構成技も組み込めます。';
  $('weapon').value=weapon;$('weapon-choice').hidden=weapon<0;
  $('weapon-skill').replaceChildren(...[{id:'',name:'構成技を使う'},...available(weapon)].map(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name;return o;}));$('weapon-skill').value=d.composition?'':d.id;
  $('parts').disabled=!d.composition;for(const key of Object.keys(SkillComposition.tables))$(key).value=(d.composition||base)[key];
  $('equipment-note').textContent=d.composition?(weapon<0?'拳・掌・脚で放つ構成技。':'構成技では武器を背に預け、拳・掌・脚を使います。'):WEAPONS[weapon].name+'を手に持ち、武器の先端から軌跡を描きます。';
  $('fx-summary').textContent='この技の演出：'+effectText(d);$('previous').disabled=!history.length;
  $('recipe').value=JSON.stringify({version:2,selected,slots,weapon,drawSeed});
  $('slots').replaceChildren(...slots.map((r,i)=>{const b=document.createElement('button');b.textContent=PHASES[i]+' · '+def(r).names.ja;b.className=d.id===def(r).id?'selected':'';b.onclick=()=>{remember();selected=canonical(r);update();launch('single');};return b;}));
 }
 function remember(){history.push({selected:canonical(selected),slots:slots.map(canonical),weapon,drawSeed});if(history.length>12)history.shift();}
 function randomize(seed){if(Number.isInteger(seed))drawSeed=seed>>>0;remember();const old=def(selected).id;do{selected=generate();}while(def(selected).id===old);update();fitDistance();launch('single');}
 function randomCombo(){remember();slots=[0,1,2].map(phase=>{const armed=available(weapon,phase);return armed.length&&random()<.6?{skillId:pick(armed).id}:generate(phase);});selected=canonical(slots[0]);update();fitDistance();launch('combo');}
 function fitDistance(){const d=def(selected),a=d.action,w=d.composition?.footwork;
  const distance=w==='drive'?a.reach*.72+a.approach.distance:w==='draw'?Math.max(1,a.reach*.9-a.approach.distance):w==='side'?Math.max(1.4,Math.sqrt(Math.max(0,(a.reach*.94)**2-a.approach.distance**2))):Math.max(1,a.reach*.8);
  $('distance').value=Math.min(5,distance).toFixed(1);$('distanceText').value=$('distance').value;
 }
 function clearVisual(){renderer.effects.length=0;renderer.skillMotionStates?.clear();renderer.art.skillFeet?.clear();renderer.damageMotion?.actors.clear();const fx=renderer.combatPresentation;for(const id of fx.trails.keys())fx.forget(id);fx.castSamples.clear();fx.castSerial=0;fx.clearSilk?.();}
 function prepareTrial(config={}){
  const sim=new Simulation({seed:18427}),p=sim.addPlayer('skill-trial',{owner:'skill-trial',race:0}),room=sim.getRoom(p);
  Object.assign(p,{prologue:false,age:24,introUntil:-100,releaseAt:-100,farewellStage:3,x:0,z:0,dir:0,weapon:config.weapon??-1,stamina:100,staminaCap:100});
  room.kind='frontline';room.stage=0;room.actors=[];room.waveAt=1e9;sim.yearSeconds=1e9;
  const kind=config.target||'dummy',distance=config.distance??2.5;
  for(const x of kind==='crowd'?[-1.1,0,1.1]:[0]){const e=sim.actor(kind==='crowd'?'dummy':kind,x,distance);e.cooldown=sim.time+.8;room.actors.push(e);}
  return {sim,p,room};
 }
 function launch(nextMode=mode){if(!renderer)return;mode=nextMode;trial=prepareTrial({target:$('target').value,distance:+$('distance').value,weapon});seq=trial.sim.seq;hits=0;links=0;travel=0;carry=0;cycleEnded=false;clearVisual();renderer.combatPresentation.previewEnabled=$('effects').checked;
  const {sim,p,room}=trial,chosen=mode==='combo'?slots:[selected];
  if(mode==='ready'){p.focusTarget=room.actors[0].id;p.focusUntil=sim.time+30;paused=false;$('pause').textContent='一時停止';return;}
  for(const recipe of chosen){const d=def(recipe);sim.learn(p,d.id);p.phaseWeights[d.phase]={[d.id]:1};}
  const d=def(chosen[0]);p.combo={band:d.phase,total:0,repeats:0};p.autoFight=mode==='combo'?room.actors[0].id:null;
  if(!sim.beginComboStrike(p,d.id))throw Error('技を使えません：'+skillRestriction(p,skillById(d.id)));if(mode==='combo')p.comboQueued=true;paused=false;$('pause').textContent='一時停止';
 }
 function advance(dt){const {sim,p}=trial,x=p.x,z=p.z;sim.tick(dt);travel+=Math.hypot(p.x-x,p.z-z);
  for(const e of sim.events.filter(e=>e.seq>seq)){if(e.type==='hit'&&e.source===p.id)hits++;if(e.type==='skillconnection')links++;if($('effects').checked)renderer.effect(e,sim.time);}seq=sim.seq;
  if(!p.combo&&!p.pendingSkill&&!cycleEnded){cycleEnded=true;p.autoFight=null;p.autoSuppressedUntil=1e9;}
 }
 function restore(value){
  if(![1,2].includes(value.version)||!Array.isArray(value.slots)||value.slots.length!==3)throw Error('この稽古帳の構成ではありません');
  const next=canonical(value.selected),nextSlots=value.slots.map(canonical),nextWeapon=value.version===1?-1:value.weapon;
  if(!Number.isInteger(nextWeapon)||nextWeapon< -1||nextWeapon>5)throw Error('不明な武器です');
  nextSlots.forEach((r,i)=>{if(def(r).phase!==i)throw Error('序破急の配置が一致しません');});
  for(const r of [next,...nextSlots])if(!def(r).composition&&def(r).action.weapon!==nextWeapon)throw Error('持つ武器と技が一致しません');
  if(value.drawSeed!==undefined&&(!Number.isInteger(value.drawSeed)||value.drawSeed<0||value.drawSeed>4294967295))throw Error('不明な抽選記録です');
  selected=next;slots=nextSlots;weapon=nextWeapon;if(value.drawSeed!==undefined)drawSeed=value.drawSeed;update();
 }
 async function start(){
  for(const [key,choices]of Object.entries(SkillComposition.tables)){const label=document.createElement('label');label.textContent=({form:'打ち方',cadence:'拍子',footwork:'足運び',reaction:'命中時の作用',ending:'終わり方'})[key];const input=document.createElement('select');input.id=key;for(const c of choices){const option=document.createElement('option');option.value=c.key;option.textContent=c.name+' — '+(c.text||'');input.append(option);}input.onchange=()=>{remember();selected={...selected,[key]:input.value};update();launch('single');};label.append(input);$('parts').append(label);}
  examples.forEach(([name],i)=>{const o=document.createElement('option');o.value=i;o.textContent=name;$('preset').append(o);});$('preset').onchange=()=>{remember();selected={...base,...examples[+$('preset').value][1]};update();fitDistance();launch('single');};
  slots=[{...base,footwork:'drive',ending:'follow'},{...base,reaction:'bind',ending:'settle'},{...base,reaction:'drain',ending:'withdraw'}];
  $('random').onclick=()=>randomize();$('random-combo').onclick=randomCombo;$('previous').onclick=()=>{const prev=history.pop();if(prev){restore({version:2,...prev});fitDistance();launch('single');}};
  $('weapon').onchange=()=>{remember();weapon=+$('weapon').value;if(!def(selected).composition)selected=weapon<0?generate():{skillId:available(weapon)[0].id};slots=slots.map((r,i)=>def(r).composition||def(r).action.weapon===weapon?r:generate(i));update();launch('single');};
  $('weapon-skill').onchange=()=>{remember();selected=$('weapon-skill').value?{skillId:+$('weapon-skill').value}:generate();update();fitDistance();launch('single');};
  $('adopt').onclick=()=>{slots[def(selected).phase]=canonical(selected);update();};$('cast').onclick=()=>launch('single');$('combo').onclick=()=>launch('combo');$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'再生':'一時停止';};
  $('ready').onclick=()=>launch('ready');
  $('effects').onchange=()=>launch();$('fit-distance').onclick=()=>{fitDistance();launch();};$('distance').oninput=()=>{$('distanceText').value=(+$('distance').value).toFixed(1);};$('distance').onchange=()=>launch();$('target').onchange=()=>launch();
  $('save').onclick=()=>{try{restore(JSON.parse($('recipe').value));localStorage.setItem('bloodline-skill-composition-lab-v1',$('recipe').value);$('error').textContent='構成を保存しました';}catch(e){$('error').textContent='保存できません：'+e.message;}};
  $('load').onclick=()=>{try{restore(JSON.parse($('recipe').value));launch();$('error').textContent='構成を読み込みました';}catch(e){$('error').textContent=e.message;}};
  try{const saved=localStorage.getItem('bloodline-skill-composition-lab-v1');if(saved)restore(JSON.parse(saved));}catch{}update();
  await AssetBank.load();installTerrainGeometry();renderer=new SliceRenderer($('world'));renderer.setQuality('medium');renderer.sceneKey='portrait';renderer.art.root=rModel();renderer.art.target=renderer.static;renderer.art.B(0,-.08,0,20,.1,20,'#7b8878');
  for(let z=-5;z<=7;z++)renderer.art.B(0,-.024,z,12,.008,.025,'#bdba98');for(let x=-6;x<=6;x++)renderer.art.B(x,-.024,1,.025,.008,12,'#bdba98');
  renderer.art.parentScene=()=>{};renderer.art.sources=[];$('loading').hidden=true;$('build').textContent='2,304構成・6武器9技 · '+BUILD_INFO.shortCommit+' · 稽古用に技を開放';launch();
  document.addEventListener('visibilitychange',()=>{last=0;carry=0;});
  function frame(now){request=requestAnimationFrame(frame);if(document.hidden){last=0;return;}const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
   if(!paused){carry+=dt*+$('speed').value;while(carry>=1/60){advance(1/60);carry-=1/60;}}
   const {sim,p}=trial,s=sim.snapshot(p.id,seq);s.map=trial.room.map;const follow=$('follow-camera').checked;
   Object.assign(renderer.camera,{x:follow?p.x*.3:0,z:follow?.6+p.z*.3:+$('distance').value*.45,y:1.05,zoom:8.4,yaw:+$('view').value,pitch:.52});renderer.render(s,paused?0:dt*+$('speed').value,{portrait:true,freezeCamera:true});
   const active=skillById(p.pendingSkill?.id??p.currentSkill??p.attackSkill),fx=active?effectText({id:active.id}):'';
   $('readout').textContent=(active?.name||'構え')+' ／ 命中 '+hits+' · 接続 '+links+' · 移動 '+travel.toFixed(1)+' ／ '+(incapacitated(p)?'行動不能':({charge:'溜め',attack:'攻撃',recover:'立て直し',idle:'構え'})[p.action]||p.action)+($('effects').checked?' ／ '+fx:' ／ 演出OFF');
   if(!paused&&sim.time>7&&$('repeat').checked)launch();
  }request=requestAnimationFrame(frame);
  window.CompositionLab={getRecipe:()=>canonical(selected),getSlots:()=>slots.map(canonical),getTrial:()=>trial,getRenderer:()=>renderer,prepareTrial,randomize,randomCombo,launch,pause:()=>{paused=true;},step:advance,dispose:()=>{cancelAnimationFrame(request);renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();}};
 }
 return {start,prepareTrial};
})();
try{await CompositionLab.start();}catch(e){document.getElementById('loading').textContent='表示できませんでした：'+e.message;console.error(e);}
