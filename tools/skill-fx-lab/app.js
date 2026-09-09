(()=>{
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const icons=['<path d="M4 25Q13 0 36 5Q18 8 4 25ZM10 26L32 9"/>','<ellipse cx="12" cy="16" rx="5" ry="10"/><ellipse cx="22" cy="16" rx="5" ry="8"/><ellipse cx="31" cy="16" rx="4" ry="5"/>','<path d="M6 21L9 10L18 16L13 24ZM22 22L18 10L29 4L35 16ZM15 28L22 24L28 28"/>','<path d="M4 3L34 26L8 24L33 4L20 28L4 3ZM3 16L37 16"/>','<path d="M10 27Q0 15 14 10Q9 20 18 20Q27 17 23 2Q40 19 29 27M19 28Q11 23 20 17"/>','<path d="M5 5L18 12L13 16L31 26L21 15L26 11L5 5ZM5 25L13 19M29 9L35 3"/>'];
 for(const d of SkillArcane.definitions)icons.push(({pillar:'<path d="M9 26V7M31 26V7M15 23V3M25 23V3"/><ellipse cx="20" cy="26" rx="16" ry="4"/>',vortex:'<path d="M5 27Q40 24 12 19Q1 15 29 11Q37 5 17 2"/>',nova:'<path d="M20 0L22 12L38 3L27 15L40 18L26 21L31 32L20 24L8 32L13 21L0 16L14 13L8 1Z"/>'}[d.id])||`<path d="M4 25Q8 3 20 5Q32 3 36 25M8 26L20 13L32 26M20 5V30"/><text x="20" y="24" text-anchor="middle" font-size="12" stroke="none" fill="currentColor">${d.name[0]}</text>`);
 let recipe=(SkillEffects.presets[6]||SkillEffects.presets[0]).recipe,presetIndex=6,pinned=null,compare=false,time=0,playing=!reduced,last=null,audio=null,cssW=700,cssH=430;
 let castIndex=0,previewRecipe=recipe,previewPinned=null;
 const controls=Object.keys(SkillEffects.options),storageKey='bloodline-skill-fx-lab-v1';
 try{const saved=localStorage.getItem(storageKey);if(saved){const data=JSON.parse(saved);recipe=SkillEffects.resolve(data);restoreView(data);}}catch{/* Offline storage is optional. Never read/write the game's save. */}
 for(const key of controls){for(const [value,label] of Object.entries(SkillEffects.options[key])){const option=document.createElement('option');option.value=value;option.textContent=label;$(key).append(option);}}
 for(const [value,[label]] of Object.entries(SkillEffects.colorways)){const o=document.createElement('option');o.value=value;o.textContent=label;$('palette').append(o);}
 const presetOrder=[...SkillEffects.presets.map((p,i)=>({p,i})).slice(6),...SkillEffects.presets.map((p,i)=>({p,i})).slice(0,6)];
 presetOrder.forEach(({p,i})=>{const b=document.createElement('button');b.className='preset';b.dataset.index=String(i);b.innerHTML=`<svg viewBox="0 0 40 32" aria-hidden="true">${icons[i]}</svg><span>${p.name}</span>`;b.title=p.description;b.addEventListener('click',()=>{presetIndex=i;setRecipe(p.recipe);});$('presets').append(b);});
 function restoreView(data){castIndex=Number.isInteger(data.previewCast)&&data.previewCast>=0&&data.previewCast<=4294967295?data.previewCast:0;$('vary-cast').checked=data.previewVary!==false;}
 const config=()=>({...recipe,previewCast:castIndex,previewVary:$('vary-cast').checked});
 function announce(s){$('notice').textContent=s;}
 function update(){
  for(const key of controls)$(key).value=recipe[key];
  for(const key of ['flutter','thickness','afterglow','variation','mist'])$(key).value=recipe[key];
  $('flutter-value').textContent=Math.round(recipe.flutter*100)+'%';$('thickness-value').textContent=recipe.thickness.toFixed(1)+'×';
  $('mist-value').textContent=Math.round(recipe.mist*100)+'%';
  $('palette').value=recipe.palette;$('afterglow-value').textContent=recipe.afterglow.toFixed(2)+'×';$('variation-value').textContent=Math.round(recipe.variation*100)+'%';
  previewRecipe=$('vary-cast').checked?SkillEffects.forCast(recipe,castIndex):recipe;previewPinned=pinned&&($('vary-cast').checked?SkillEffects.forCast(pinned,castIndex):pinned);
  $('cast-label').textContent='発動 '+(castIndex+1)+' · 厚み '+previewRecipe.thickness.toFixed(2)+'× · 命中後 '+SkillEffects.life(previewRecipe).toFixed(2)+'秒';
  const layered=SkillArcane.has(recipe.family);$('silk-controls').disabled=false;$('flutter').disabled=recipe.family!=='blade'&&!layered;$('baseline').disabled=false;for(const o of $('baseline').options)o.disabled=o.value!=='mist'&&recipe.family!=='blade';if(recipe.family!=='blade')$('baseline').value='mist';
  $('layer-controls').disabled=!layered;for(const k of ['sigil','body','motes'])$('layer-'+k).checked=recipe.layers[k];
  const exact=SkillEffects.presets.findIndex(p=>controls.every(k=>p.recipe[k]===recipe[k]));
  if(exact>=0)presetIndex=exact;
  const p=SkillEffects.presets[presetIndex];
  $('effect-name').textContent=exact>=0?p.name:'組み替えた一手';
  $('family-label').textContent=SkillEffects.options.family[recipe.family];
  $('description').textContent=exact>=0?p.description:SkillEffects.presets.find(p=>p.recipe.family===recipe.family).description;
  [...$('presets').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(Number(b.dataset.index)===exact)));
  $('recipe-text').textContent=controls.map(k=>SkillEffects.options[k][recipe[k]]).join(' / ');
  $('beat-marks').replaceChildren();for(const at of SkillEffects.beats(recipe)){const m=document.createElement('i');m.style.left=at/SkillEffects.duration*100+'%';$('beat-marks').append(m);}
  $('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'一時停止':'再生');
  $('compare').disabled=!pinned;$('compare').setAttribute('aria-pressed',String(compare));
  $('surface-compare').disabled=false;
  canvas.parentElement.classList.toggle('comparing',compare||$('surface-compare').checked);
  $('mode-label').textContent=$('surface-compare').checked?'輪郭の比較':compare?'A 記録した構成 / B いまの構成':'演出見本';
  try{localStorage.setItem(storageKey,JSON.stringify(config()));}catch{}
 }
 function setRecipe(next){recipe=SkillEffects.resolve(next);announce('');replay();}
 function replay(){time=0;last=null;playing=true;update();draw();}
 function resize(){const box=canvas.parentElement.getBoundingClientRect();cssW=Math.max(1,box.width);cssH=Math.max(1,box.height);const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
 function draw(){
  const opts={mono:$('mono').checked,quality:cssW<500?'low':'high'};
  const surfaceCompare=$('surface-compare').checked;
  const legacy=surfaceCompare&&$('baseline').value==='legacy',edgeComparison=$('baseline').value==='mist',baseline=legacy?SkillEffects.resolve({...previewRecipe,mist:0}):SkillEffects.resolve({...previewRecipe,...(edgeComparison?{mist:0}:{flutter:0,thickness:1,mist:0})});
  if(surfaceCompare||compare&&pinned){
   const stacked=cssW<520,w=stacked?cssW:cssW/2,h=stacked?cssH/2:cssH;
   ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();SkillFxStage.draw(ctx,w,h,surfaceCompare?baseline:previewPinned,time,{...opts,legacyBlade:legacy,label:surfaceCompare?(legacy?'A / 初期の斬面':edgeComparison?'A / 霧なし':'A / 揺れなし・厚み 1.0×'):'A / 記録した構成'});ctx.restore();
   ctx.save();ctx.translate(stacked?0:w,stacked?h:0);SkillFxStage.draw(ctx,w,h,previewRecipe,time,{...opts,label:surfaceCompare?'B / 霧 '+Math.round(recipe.mist*100)+'%':'B / いまの構成'});ctx.restore();
   ctx.fillStyle='#5b6664';if(stacked)ctx.fillRect(0,h,w,1);else ctx.fillRect(w,0,1,h);
  }
  else SkillFxStage.draw(ctx,cssW,cssH,previewRecipe,time,opts);
  $('timeline').value=String(Math.round(time*1000));
  const beats=SkillEffects.beats(recipe),lastBeat=beats.at(-1);let phase=time<beats[0]-.18?'構え':time>lastBeat+SkillEffects.life(previewRecipe)?'余韻の終わり':'技の軌道';
  if(beats.some(t=>Math.abs(time-t)<.08))phase='命中';else if(time>lastBeat+.08&&time<=lastBeat+SkillEffects.life(previewRecipe))phase='消え際';
  $('phase').textContent=phase;
 }
 for(const key of ['sigil','body','motes'])$('layer-'+key).addEventListener('change',()=>{recipe=SkillEffects.resolve({...recipe,layers:{...recipe.layers,[key]:$('layer-'+key).checked}});update();draw();});
 for(const key of controls)$(key).addEventListener('change',()=>setRecipe({...recipe,[key]:$(key).value}));
 // Keep the current frame while tuning: paused inspection must not jump away.
 for(const key of ['flutter','thickness','afterglow','variation','mist'])$(key).addEventListener('input',()=>{recipe=SkillEffects.resolve({...recipe,[key]:Number($(key).value)});update();draw();});
 $('reseed').addEventListener('click',()=>{recipe=SkillEffects.resolve({...recipe,seed:(recipe.seed+97)>>>0});update();draw();});
 $('palette').addEventListener('change',()=>{recipe=SkillEffects.resolve({...recipe,palette:$('palette').value});update();draw();});
 $('next-cast').addEventListener('click',()=>{castIndex++;replay();});
 $('vary-cast').addEventListener('change',()=>{update();draw();});
 $('baseline').addEventListener('change',()=>{update();draw();});
 $('reset').addEventListener('click',()=>setRecipe(SkillEffects.presets[presetIndex].recipe));
 $('shuffle').addEventListener('click',()=>{const next={...recipe};for(const key of controls){const values=Object.keys(SkillEffects.options[key]);next[key]=values[Math.floor(Math.random()*values.length)];}next.thickness=.5+Math.random()*2.5;next.afterglow=.6+Math.random()*1.4;next.variation=.65;next.palette=Object.keys(SkillEffects.colorways)[Math.floor(Math.random()*6)];next.seed=Math.floor(Math.random()*4294967296);setRecipe(next);});
 $('play').addEventListener('click',()=>{playing=!playing;if(playing&&time>=SkillEffects.duration)time=0;last=null;update();});
 $('replay').addEventListener('click',replay);
 $('step').addEventListener('click',()=>{playing=false;time=Math.min(SkillEffects.duration,time+1/60);update();draw();});
 $('timeline').addEventListener('input',()=>{playing=false;time=Number($('timeline').value)/1000;update();draw();});
 $('mono').addEventListener('change',draw);
 $('surface-compare').addEventListener('change',()=>{compare=false;update();draw();});
 $('pin').addEventListener('click',()=>{pinned=recipe;$('surface-compare').checked=false;$('pin-label').textContent='A: '+SkillEffects.options.family[pinned.family]+' / '+SkillEffects.options.path[pinned.path];update();draw();});
 $('compare').addEventListener('click',()=>{if(pinned){compare=!compare;$('surface-compare').checked=false;update();draw();}});
 $('sound').addEventListener('change',async()=>{
  if(!$('sound').checked)return;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error();audio??=new AC();await audio.resume();replay();}catch{$('sound').checked=false;announce('この環境では音を再生できません。');}
 });
 $('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(config(),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bloodline-effect-recipe.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('構成をJSONに保存しました。読込で再現できます。');
 });
 $('import').addEventListener('click',()=>$('file').click());
 $('file').addEventListener('change',async()=>{
  const file=$('file').files[0];if(!file)return;
  try{if(file.size>8192)throw Error('8KB以下の構成ファイルを選んでください');const data=JSON.parse(await file.text()),next=SkillEffects.resolve(data);restoreView(data);setRecipe(next);announce('保存した構成を読み込みました。');}catch(e){announce('読込できません: '+e.message);}finally{$('file').value='';}
 });
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||/^(INPUT|SELECT|BUTTON|A)$/.test(e.target.tagName))return;e.preventDefault();replay();});
 document.addEventListener('visibilitychange',()=>{last=null;});
 function tick(now){
  if(!document.hidden&&playing){
   const previous=time,dt=last===null?0:Math.min(.06,(now-last)/1000);time+=dt*Number($('speed').value);
   if($('sound').checked&&audio?.state==='running')for(const at of SkillEffects.beats(recipe)){if(previous<at&&time>=at)SkillEffects.sound(audio,recipe);}
   const endOf=r=>SkillEffects.beats(r).at(-1)+SkillEffects.life(r)+.35,loopEnd=Math.max(endOf(previewRecipe),compare&&previewPinned?endOf(previewPinned):0);
   if(time>($('loop').checked?loopEnd:SkillEffects.duration)){if($('loop').checked){time=0;if($('vary-cast').checked)castIndex++;update();}else{time=SkillEffects.duration;playing=false;update();}}
   draw();
  }
  last=now;requestAnimationFrame(tick);
 }
 $('build-id').textContent=FX_LAB_BUILD;update();resize();new ResizeObserver(resize).observe(canvas.parentElement);requestAnimationFrame(tick);
 // Inspection API for headless DOM verification and user-authored configurations.
 window.SkillFxLab=Object.freeze({getRecipe:()=>({...recipe}),setRecipe,getCast:()=>({...previewRecipe}),getConfig:config,seek:t=>{playing=false;time=Math.max(0,Math.min(SkillEffects.duration,t));update();draw();}});
})();
