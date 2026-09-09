/* Review-only entry point. Synthetic snapshots; never creates Game or writes a save. */
(async()=>{
 const $=id=>document.getElementById(id),status=$('status');
 const fail=e=>{status.textContent='表示できませんでした: '+e.message;if($('phase'))$('phase').textContent=status.textContent;console.error(e);document.querySelectorAll('button,select,input').forEach(el=>el.disabled=true);};
 try{
  await AssetBank.load();installTerrainGeometry();
  const r=new SliceRenderer($('world'));r.setQuality('medium');
  const sim=new Simulation({seed:7349}),base=sim.addPlayer('review',{owner:'review'}),snapshot=sim.snapshot(base.id);
  // Match Game.decorate: Simulation snapshots omit the renderer's map data.
  snapshot.map=makeVillage(snapshot.room.seed);
  const templates=Object.fromEntries(Object.keys(ENEMY_FORMS).map(kind=>[kind,sim.actor(kind,0,0)]));
  for(const[kind,forms]of Object.entries(ENEMY_FORMS)){const group=document.createElement('optgroup');group.label=({goblin:'小鬼',soldier:'骨兵',elite:'執行者',crawler:'蟲',maw:'獣',wraith:'亡霊・浮遊魔物',boss:'魔王',stag:'中立の獣',mushroom:'中立の菌'})[kind];for(const f of forms){const option=document.createElement('option');option.value=f.id;option.textContent=f.name;group.append(option);}$('form').append(group);}$('form').value='soldier';
  const replacement=VillageArt.prototype.monster,original=ENEMY_PREVIOUS_MONSTER;
  let time=0,last=0,paused=false,version='after',lastReport=-Infinity,measurement=null,needsPrime=true;
  const clearHistory=()=>{r.enemySentinels?.dispose();r.enemySentinels=null;r.enemyCreatures?.clear();needsPrime=true;r.damageMotion?.actors.clear();r.effects.length=0;};
  $('version').onchange=()=>{version=$('version').value;r.art.monster=version==='after'?replacement:original;clearHistory();};
  $('quality').onchange=()=>r.setQuality($('quality').value);
  const restart=()=>{time=0;paused=false;$('pause').textContent='⏸ 停止';clearHistory();};
  $('pose').onchange=restart;$('form').onchange=restart;$('replay').onclick=restart;
  const damageChange=()=>{if($('damage').value==='lost'&&['head','torso'].includes($('part').value))$('part').value='rightArm';clearHistory();lastReport=-Infinity;};
  $('damage').onchange=damageChange;$('part').onchange=damageChange;
  const next=direction=>{const rows=EnemyReview.forms,i=rows.findIndex(f=>f.id===$('form').value);$('form').value=rows[(i+direction+rows.length)%rows.length].id;restart();};$('prev').onclick=()=>next(-1);$('next').onclick=()=>next(1);
  $('count').onchange=clearHistory;
  $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ 再生':'⏸ 停止';};
  $('seek').oninput=()=>{paused=true;$('pause').textContent='▶ 再生';time=Number($('seek').value)/1000*EnemyReview.duration($('pose').value);clearHistory();};
  const sample=t=>EnemyReview.sample(templates,{form:$('form').value,count:Number($('count').value),pose:$('pose').value,time:t,damage:$('damage').value,part:$('part').value});
  // Exports raw frame intervals plus renderer CPU/GPU counters. Target-device
  // pass/fail is deliberately left to the reviewer; no software-FPS extrapolation.
  $('measure').onclick=()=>{if(measurement)return;paused=false;$('pause').textContent='⏸ 停止';measurement={start:performance.now(),runs:[[],[],[]],config:{version,form:$('form').value,pose:$('pose').value,count:$('count').value,quality:r.quality,damage:$('damage').value,part:$('part').value}};document.querySelectorAll('button,select,input').forEach(e=>e.disabled=true);};
  function reportMeasurement(now,dt){if(!measurement)return;const elapsed=(now-measurement.start)/1000,run=Math.floor((elapsed-10)/10);status.textContent=elapsed<10?'測定準備 10秒':`測定 ${Math.min(3,run+1)}/3`;
   if(run>=0&&run<3)measurement.runs[run].push({frameMs:dt*1000,cpuMs:r.cpuMs,gpuMs:r.gpuMs??null,calls:r.stats.calls,triangles:r.stats.triangles});
   if(elapsed<40)return;
   const quantile=(a,q)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*q))]??null;};
   const data={...measurement,base:'__BASE_SHA__',browser:navigator.userAgent,renderer:r.gl.getParameter(r.gl.RENDERER),resolution:[r.canvas.width,r.canvas.height],runs:measurement.runs.map(rows=>({fps:rows.length/(rows.reduce((s,x)=>s+x.frameMs,0)/1000),p50Ms:quantile(rows.map(x=>x.frameMs),.5),p95Ms:quantile(rows.map(x=>x.frameMs),.95),p99Ms:quantile(rows.map(x=>x.frameMs),.99),raw:rows}))};
   const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='enemy-'+version+'-performance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);measurement=null;document.querySelectorAll('button,select,input').forEach(e=>e.disabled=false);
  }
  function frame(now){try{
   if(r.lost)throw Error('WebGL の接続が失われました。ファイルを開き直してください。');
   const raw=last?(now-last)/1000:0,dt=Math.min(.05,raw);last=now;if(!paused)time+=dt*Number($('speed').value);
   const sampled=sample(time),s={...snapshot,t:time,player:null,players:[],actors:sampled.actors,events:[]};
   const many=Number($('count').value)>2,boss=$('form').value==='boss';
   Object.assign(r.camera,{x:0,z:many?-42:-34,y:boss?2.9:1.65,zoom:many?24:boss?13:Number($('count').value)===1?6.6:10.5,yaw:Number($('angle').value),pitch:.40});
   if(needsPrime){const earlier=Math.max(0,time-1/60);r.render({...s,t:earlier,actors:sample(earlier).actors},0,{freezeCamera:true});needsPrime=false;}
   r.render(s,paused?0:dt,{freezeCamera:true});
   if(measurement)reportMeasurement(now,raw);else if(now-lastReport>200){lastReport=now;$('seek').value=String(Math.round(time%sampled.duration/sampled.duration*1000));$('phase').textContent=(paused?'停止中 · ':'再生中 · ')+sampled.label;$('enemy-name').textContent=$('form').value==='all'?'敵の集合':sampled.actors[0].name;status.textContent=`${version==='after'?'改善後':'変更前'} · ${r.stats.calls} calls · ${r.stats.triangles.toLocaleString()} tris · CPU ${r.cpuMs.toFixed(1)} ms · GPU ${r.gpuMs?.toFixed(1)??'N/A'} ms`;}
   requestAnimationFrame(frame);
  }catch(e){fail(e);}
  }
  document.addEventListener('visibilitychange',()=>{last=0;});
  status.textContent='描画を準備中…';requestAnimationFrame(frame);
 }catch(e){fail(e);}
})();
