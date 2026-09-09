/* Review-only entry point. Synthetic snapshots; never creates Game or writes a save. */
(async()=>{
 const $=id=>document.getElementById(id),status=$('status');
 const fail=e=>{status.textContent='表示できませんでした: '+e.message;console.error(e);document.querySelectorAll('button,select,input').forEach(el=>el.disabled=true);};
 try{
  await AssetBank.load();installTerrainGeometry();
  const r=new SliceRenderer($('world'));r.setQuality('medium');
  const sim=new Simulation({seed:7349}),base=sim.addPlayer('review',{owner:'review'}),snapshot=sim.snapshot(base.id);
  // Match Game.decorate: Simulation snapshots omit the renderer's map data.
  snapshot.map=makeVillage(snapshot.room.seed);
  const templates={soldier:sim.actor('soldier',0,0),elite:sim.actor('elite',0,0)};
  const replacement=VillageArt.prototype.monster,original=ENEMY_PREVIOUS_MONSTER;
  let time=0,last=0,paused=false,version='after',lastReport=-Infinity,measurement=null;
  const clearHistory=()=>{r.enemySentinels?.dispose();r.enemySentinels=null;r.damageMotion?.actors.clear();r.effects.length=0;};
  $('version').onchange=()=>{version=$('version').value;r.art.monster=version==='after'?replacement:original;clearHistory();};
  $('quality').onchange=()=>r.setQuality($('quality').value);
  $('pose').onchange=()=>{time=0;clearHistory();};
  $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'再生':'一時停止';};
  $('seek').oninput=()=>{paused=true;$('pause').textContent='再生';time=Number($('seek').value)/1000*3.6;clearHistory();};
  function actors(t){const mode=$('pose').value,count=Number($('count').value),period=3.6,cycle=Math.floor(t/period),local=t%period;
   return Array.from({length:count},(_,i)=>{const kind=i%2?'elite':'soldier',at=kind==='elite'?1.55:1.35,p={...templates[kind],id:'review-'+i,kind,alive:true,elite:kind==='elite',x:(i%4-1.5)*3.4,z:-34-Math.floor(i/4)*3.8,dir:.15,action:'idle',wounds:{},statuses:{}};
    if(count===2)p.x=(i-.5)*4;
    if(mode==='attack'||mode==='lost'){
     if(local<at)Object.assign(p,{action:'windup',telegraph:{started:cycle*period,at:cycle*period+at}});
     else if(local<at+.75)Object.assign(p,{action:'attack',actionStarted:cycle*period+at,actionUntil:cycle*period+at+.75});
     if(mode==='lost')p.wounds={rightArm:{severity:'lost'},leftLeg:{severity:'lost'}};
    }
    if(mode==='run'){p.action='run';p.x+=Math.sin(t*.65)*2;p.dir=Math.cos(t*.65)>0?Math.PI/2:-Math.PI/2;}
    if(mode==='guard')p.guard=true;
    if(mode==='hit')Object.assign(p,{hitReactAt:cycle*period,hitReactUntil:cycle*period+.7,hitSeverity:'heavy',hitDir:.8,wounds:{head:{severity:'heavy'}},damageMarks:{head:{hits:2,depth:2}}});
    if(mode==='death')Object.assign(p,{alive:false,deathAt:cycle*period});
    return p;
   });
  }
  // Exports raw frame intervals plus renderer CPU/GPU counters. Target-device
  // pass/fail is deliberately left to the reviewer; no software-FPS extrapolation.
  $('measure').onclick=()=>{if(measurement)return;paused=false;$('pause').textContent='一時停止';measurement={start:performance.now(),runs:[[],[],[]],config:{version,pose:$('pose').value,count:$('count').value,quality:r.quality}};document.querySelectorAll('button,select,input').forEach(e=>e.disabled=true);};
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
   const list=actors(time),s={...snapshot,t:time,player:null,players:[],actors:list,events:[]};
   Object.assign(r.camera,{x:0,z:Number($('count').value)>2?-40:-33,y:1.4,zoom:Number($('count').value)>2?22:10.5,yaw:Number($('angle').value),pitch:.48});
   r.render(s,paused?0:dt,{freezeCamera:true});
   if(measurement)reportMeasurement(now,raw);else if(now-lastReport>200){lastReport=now;$('seek').value=String(Math.round(time%3.6/3.6*1000));status.textContent=`${version==='after'?'改善後':'変更前'} · ${r.stats.calls} calls · ${r.stats.triangles.toLocaleString()} tris · CPU ${r.cpuMs.toFixed(1)} ms · GPU ${r.gpuMs?.toFixed(1)??'N/A'} ms`;}
   requestAnimationFrame(frame);
  }catch(e){fail(e);}
  }
  status.textContent='描画を準備中…';requestAnimationFrame(frame);
 }catch(e){fail(e);}
})();
