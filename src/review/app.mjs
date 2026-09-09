import {createReviewModel,reviewLink} from './model.mjs';
const $=id=>document.getElementById(id);
const fail=e=>{$('error').textContent=e.message;$('loading').textContent='表示できませんでした';console.error(e);};
try {
 const R=await import('./runtime.mjs'),model=createReviewModel(R),params=new URLSearchParams(location.search);
 const mode=location.pathname.split('/').filter(Boolean)[1]||'skills';
 if(!['skills','enemies','combat'].includes(mode))throw Error('存在しないReview画面です');
 if(params.has('sha')&&params.get('sha')!==R.BUILD_INFO.commit)throw Error('URLのcommitと配信中のcommitが異なります。この版の確認を中止しました。');
 $('build').textContent=R.BUILD_INFO.displayVersion;$('sha').textContent=R.BUILD_INFO.commit;
 const skill=model.resolveSkill(params.get('skill')||4001),enemy=model.resolveEnemy(params.get('enemy')||(mode==='skills'?'dummy':'soldier'));
 if(!skill)throw Error('指定された技はこのcommitにありません: '+params.get('skill'));
 if(!enemy||(mode==='enemies'&&enemy.id==='dummy'))throw Error('指定された敵はこのcommitにありません: '+params.get('enemy'));
 $('skill-controls').hidden=mode==='enemies';$('distance-control').hidden=mode==='enemies';$('enemy-controls').hidden=mode!=='enemies';
 $('mode-title').textContent={skills:'技を試す',enemies:'敵を観察する',combat:'実Simulationで戦う'}[mode];
 document.querySelector(`nav [data-mode="${mode}"]`).setAttribute('aria-current','page');
 const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
 for(const e of model.enemies().filter(e=>mode!=='enemies'||e.id!=='dummy'))$('enemy').append(option(e.id,e.name+' · '+e.id));$('enemy').value=enemy.id;
 $('weapon').append(option(-1,'素手'));R.WEAPONS.forEach((w,i)=>$('weapon').append(option(i,w.name)));$('weapon').value=skill.weapon>=0?skill.weapon:-1;
 let listedKey='',slotWeapon=null,needsRender=true;
 for(const event of ['input','change','click'])document.addEventListener(event,()=>{needsRender=true;});
 let selected=skill.id,slots=[0,1,2].map(phase=>model.skills().find(s=>!s.passive&&R.skillPhase(s)===phase&&s.weapon<0).id),history=[],r,trial,paused=false,time=0,last=0,carry=0,seq=0,request,measurement=null,lastReport=0,trialMode=mode==='combat'?'combat':'single';
 const sceneSim=new R.Simulation({seed:7349}),scenePlayer=sceneSim.addPlayer('enemy-review',{owner:'enemy-review'}),scene=sceneSim.snapshot(scenePlayer.id);scene.map=sceneSim.getRoom(scenePlayer).map;
 const templates=Object.fromEntries(Object.keys(R.ENEMY_FORMS).map(k=>[k,sceneSim.actor(k,0,0)]));
 function listSkills(){if(mode==='enemies')return;const q=$('search').value.trim().toLowerCase();const key=q+':'+selected;if(key===listedKey)return;listedKey=key;const items=model.skills().filter(s=>s.id===selected||`${s.name} ${s.id} ${s.skillKey||''}`.toLowerCase().includes(q));$('skill').replaceChildren(...items.map(s=>option(s.id,`${s.name} · ${s.passive?'常時':R.PHASES[R.skillPhase(s)]} · ${s.id}`)));$('skill').value=selected;}
 function links(){
  const state={skill:selected,enemy:$('enemy').value,sha:R.BUILD_INFO.commit};
  historyURL(reviewLink(location.origin,{mode,...state}));
  document.querySelectorAll('nav a').forEach(a=>a.href=reviewLink(location.origin,{mode:a.dataset.mode,...state,enemy:a.dataset.mode==='enemies'&&state.enemy==='dummy'?'soldier':state.enemy}));
 }
 function historyURL(url){window.history.replaceState(null,'',url);}
 function update(){
  const s=model.resolveSkill(selected),def=R.BL_SKILL_CATALOG.byId.get(selected);listSkills();
  $('description').textContent=s.desc||'';$('composition').hidden=!def?.composition;
  if(def?.composition)for(const key of Object.keys(R.SkillComposition.tables))$('part-'+key).value=def.composition[key];
  $('title').textContent=mode==='enemies'?model.resolveEnemy($('enemy').value).name:s.name+(mode==='combat'?' × '+model.resolveEnemy($('enemy').value).name:'');
  $('previous').disabled=!history.length;
  for(let phase=0;mode!=='enemies'&&phase<3;phase++){
   const select=$('slot-'+phase),weapon=+$('weapon').value;
   const available=model.skills().filter(s=>!s.passive&&R.skillPhase(s)===phase&&(s.weapon<0||s.weapon===weapon));
   if(!available.some(s=>s.id===slots[phase]))slots[phase]=available[0]?.id;
   if(slotWeapon!==weapon)select.replaceChildren(...available.map(s=>option(s.id,s.name)));select.value=slots[phase];
  }
  slotWeapon=+$('weapon').value;
  $('single').disabled=s.passive;$('combo').disabled=s.passive;links();
 }
 for(const [key,values]of Object.entries(R.SkillComposition.tables)){
  const label=document.createElement('label');label.textContent={form:'打ち方',cadence:'拍子',footwork:'足運び',reaction:'作用',ending:'終わり方'}[key];
  const select=document.createElement('select');select.id='part-'+key;values.forEach(v=>select.append(option(v.key,v.name)));label.append(select);$('parts').append(label);
  select.onchange=()=>{const def=R.BL_SKILL_CATALOG.byId.get(selected);selectSkill(R.SkillComposition.id({...def.composition,[key]:select.value}));};
 }
 for(let phase=0;phase<3;phase++){const label=document.createElement('label');label.textContent=R.PHASES[phase];const select=document.createElement('select');select.id='slot-'+phase;select.onchange=()=>{slots[phase]=+select.value;};label.append(select);$('slots').append(label);}
 function clearVisual(){r.effects.length=0;r.skillMotionStates?.clear();r.art.skillFeet?.clear();r.damageMotion?.actors.clear();r.enemySentinels?.dispose();r.enemySentinels=null;r.enemyCreatures?.clear();const fx=r.combatPresentation;for(const id of fx.trails.keys())fx.forget(id);fx.castSamples.clear();fx.castSerial=0;fx.clearSilk?.();}
 function launch(next=trialMode){
  if(!r)return;try{needsRender=true;trialMode=next;time=0;carry=0;paused=false;last=0;$('pause').textContent='一時停止';clearVisual();
   r.combatPresentation.previewEnabled=$('effects').checked;
   if(mode!=='enemies')trial=model.trial({skill:selected,enemy:$('enemy').value,distance:+$('distance').value,weapon:+$('weapon').value,mode:next,slots});
   $('error').textContent='';update();
  }catch(e){paused=true;$('error').textContent=e.message;}
 }
 function selectSkill(id,remember=true){if(remember){history.push(selected);if(history.length>32)history.shift();}selected=Number(id);const s=model.resolveSkill(selected);if(s.weapon>=0)$('weapon').value=s.weapon;update();launch();}
 $('search').oninput=listSkills;$('skill').onchange=()=>selectSkill($('skill').value);
 $('previous').onclick=()=>{if(history.length)selectSkill(history.pop(),false);};
 $('random').onclick=()=>{const rows=model.skills().filter(s=>!s.passive);selectSkill(rows[Math.floor(Math.random()*rows.length)].id);};
 $('adopt').onclick=()=>{const s=model.resolveSkill(selected);if(!s.passive)slots[R.skillPhase(s)]=s.id;update();};
 $('single').onclick=()=>launch('single');$('combo').onclick=()=>launch('combo');$('combat').onclick=()=>launch('combat');
 $('weapon').onchange=()=>{const s=model.resolveSkill(selected),w=+$('weapon').value;if(s.weapon>=0&&s.weapon!==w){const next=model.skills().find(s=>!s.passive&&s.weapon===w);if(next)selected=next.id;}update();launch();};
 $('enemy').onchange=()=>{update();launch();};
 $('distance').oninput=()=>{$('distance-value').textContent=$('distance').value;};$('distance').onchange=()=>launch();
 $('fit').onclick=()=>{const s=model.resolveSkill(selected);$('distance').value=Math.max(.8,Math.min(15,s.reach*.8+(s.approach?.distance||0)));$('distance').oninput();launch();};
 $('effects').onchange=()=>{r.combatPresentation.previewEnabled=$('effects').checked;if(!$('effects').checked)clearVisual();};
 $('pose').onchange=()=>launch();$('broken').onchange=clearVisual;$('vitality').oninput=()=>{$('vitality-value').textContent=$('vitality').value+'%';};
 $('count').onchange=clearVisual;$('quality').onchange=()=>r.setQuality($('quality').value);
 $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'再生':'一時停止';};$('restart').onclick=()=>launch();
 $('seek').oninput=()=>{paused=true;$('pause').textContent='再生';time=+$('seek').value/1000*R.EnemyReview.duration($('pose').value);clearVisual();};
 $('copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('copy').textContent='コピーしました';}catch{$('error').textContent='アドレス欄のURLをコピーしてください。';}};
 $('measure').onclick=()=>{if(measurement)return;measurement={start:performance.now(),runs:[[],[],[]],build:R.BUILD_INFO,settings:{mode,skill:selected,enemy:$('enemy').value,pose:$('pose').value,count:+$('count').value,vitality:+$('vitality').value,broken:$('broken').value,quality:r.quality,speed:+$('speed').value},wasPaused:paused};paused=false;document.querySelectorAll('aside button,aside select,aside input').forEach(e=>e.disabled=true);};
 function finishMeasurement(){
  const quantile=(a,q)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*q))]??null;};
  const data={...measurement,device:navigator.userAgent,resolution:[r.canvas.width,r.canvas.height],runs:measurement.runs.map(raw=>({raw,fps:raw.length/(raw.reduce((s,f)=>s+f.frameMs,0)/1000),p50Ms:quantile(raw.map(f=>f.frameMs),.5),p95Ms:quantile(raw.map(f=>f.frameMs),.95),p99Ms:quantile(raw.map(f=>f.frameMs),.99)}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`review-${R.BUILD_INFO.shortCommit}-performance.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);paused=measurement.wasPaused;measurement=null;document.querySelectorAll('aside button,aside select,aside input').forEach(e=>e.disabled=false);update();$('measurement').textContent='計測結果を保存しました';
 }
 await R.AssetBank.load();R.installTerrainGeometry();r=new R.SliceRenderer($('world'));r.setQuality('medium');
 // Both isolated scenes use the real renderer on a small, neutral review floor.
 r.sceneKey='portrait';r.art.root=R.rModel();r.art.target=r.static;r.art.B(0,-.08,-15,85,.1,85,'#7b8878');
 for(let z=-50;z<=20;z+=2)r.art.B(0,-.024,z,60,.008,.025,'#b0b59a');for(let x=-30;x<=30;x+=2)r.art.B(x,-.024,-15,.025,.008,70,'#b0b59a');r.art.parentScene=()=>{};r.art.sources=[];
 update();launch();$('loading').hidden=true;
 function frame(now){try{
  if(r.lost)throw Error('WebGLが切断されました。画面を再読み込みしてください。');
  if(document.hidden){last=0;request=requestAnimationFrame(frame);return;}
  if(paused&&!needsRender&&!measurement){last=now;request=requestAnimationFrame(frame);return;}
  const forced=needsRender;needsRender=false;
  const raw=last?(now-last)/1000:0,dt=Math.min(.05,raw);last=now;
  if(!paused){time+=dt*+$('speed').value;if(mode!=='enemies'&&trial){carry+=dt*+$('speed').value;while(carry>=1/60){const events=model.step(trial,1/60);if($('effects').checked)for(const e of events)r.effect(e,trial.sim.time);carry-=1/60;}}}
  let snapshot,description;
  if(mode==='enemies'){
   const pose=$('pose').value,impact=model.resolveEnemy($('enemy').value).kind==='elite'?1.55:1.35;
   const sampled=R.EnemyReview.sample(templates,{form:$('enemy').value,count:+$('count').value,pose:['windup','strike'].includes(pose)?'attack':pose,time:pose==='windup'?time%impact:pose==='strike'?impact+time%.7:time,vitality:+$('vitality').value,brokenPart:$('broken').value});
   const sampledTime=pose==='windup'?time%impact:pose==='strike'?impact+time%.7:time;
   snapshot={...scene,t:sampledTime,player:null,players:[],actors:sampled.actors,events:[]};description=sampled.label;
   const many=+$('count').value>2,boss=$('enemy').value==='boss';Object.assign(r.camera,{x:0,z:many?-42:-34,y:boss?2.9:1.65,zoom:many?24:boss?13:+$('count').value===1?6.6:10.5,yaw:+$('view').value,pitch:.4});
   if(!paused)$('seek').value=Math.round(time%R.EnemyReview.duration(pose)/R.EnemyReview.duration(pose)*999);
  }else if(trial){
   snapshot=trial.sim.snapshot(trial.p.id,seq);seq=trial.sim.seq;snapshot.map=trial.room.map;
   const p=trial.p,e=trial.room.actors[0],follow=$('follow').checked;Object.assign(r.camera,{x:follow?(p.x+(e?.x||0))/2:0,z:follow?(p.z+(e?.z||0))/2:+$('distance').value*.45,y:1.15,zoom:Math.max(8.4,+$('distance').value*1.7),yaw:+$('view').value,pitch:.52});
   description=`${trial.status||({charge:'溜め',attack:'攻撃',recover:'立て直し',idle:'構え',run:'移動',dead:'行動終了'})[p.action]||p.action} ／ 命中 ${trial.hits} · 接続 ${trial.links}\n生命力 ${Math.round(p.health)} / 100　相手 ${Math.round(e?.hp||0)} / ${e?.hpMax||0}`;
   if(!paused&&!measurement&&time>(trialMode==='combat'?20:7)&&$('repeat').checked)launch();
  }
  if(snapshot)r.render(snapshot,paused?0:dt*+$('speed').value,{portrait:true,freezeCamera:true});
  if(forced||now-lastReport>150){lastReport=now;$('readout').textContent=(paused?'停止中 · ':'')+description;$('stats').textContent=`${r.stats.calls} calls · ${r.stats.triangles.toLocaleString()} tris · CPU ${r.cpuMs.toFixed(1)} ms · GPU ${r.gpuMs?.toFixed(1)??'N/A'} ms`;}
  if(measurement){const elapsed=(now-measurement.start)/1000,index=Math.floor((elapsed-10)/10);$('measurement').textContent=elapsed<10?'準備中 '+Math.ceil(10-elapsed)+'秒':`計測 ${Math.min(3,index+1)} / 3`;if(index>=0&&index<3&&raw>0)measurement.runs[index].push({frameMs:raw*1000,cpuMs:r.cpuMs,gpuMs:r.gpuMs??null,calls:r.stats.calls,triangles:r.stats.triangles});if(elapsed>=40)finishMeasurement();}
  request=requestAnimationFrame(frame);
 }catch(e){fail(e);}}
 document.addEventListener('visibilitychange',()=>{last=0;carry=0;if(document.hidden&&measurement){measurement=null;document.querySelectorAll('aside button,aside select,aside input').forEach(e=>e.disabled=false);update();$('measurement').textContent='画面が非表示になったため計測を中止しました';}});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(request);r.gl.getExtension('WEBGL_lose_context')?.loseContext();},{once:true});
 request=requestAnimationFrame(frame);
}catch(e){fail(e);}
