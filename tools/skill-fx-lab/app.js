(()=>{
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const icons=['<path d="M4 25Q13 0 36 5Q18 8 4 25ZM10 26L32 9"/>','<ellipse cx="12" cy="16" rx="5" ry="10"/><ellipse cx="22" cy="16" rx="5" ry="8"/><ellipse cx="31" cy="16" rx="4" ry="5"/>','<path d="M6 21L9 10L18 16L13 24ZM22 22L18 10L29 4L35 16ZM15 28L22 24L28 28"/>','<path d="M4 3L34 26L8 24L33 4L20 28L4 3ZM3 16L37 16"/>','<path d="M10 27Q0 15 14 10Q9 20 18 20Q27 17 23 2Q40 19 29 27M19 28Q11 23 20 17"/>','<path d="M5 5L18 12L13 16L31 26L21 15L26 11L5 5ZM5 25L13 19M29 9L35 3"/>'];
 let recipe=SkillEffects.presets[0].recipe,presetIndex=0,pinned=null,compare=false,time=0,playing=!reduced,last=null,audio=null,cssW=700,cssH=430;
 const controls=Object.keys(SkillEffects.options),storageKey='bloodline-skill-fx-lab-v1';
 try{const saved=localStorage.getItem(storageKey);if(saved)recipe=SkillEffects.resolve(JSON.parse(saved));}catch{/* Offline storage is optional. Never read/write the game's save. */}
 for(const key of controls){for(const [value,label] of Object.entries(SkillEffects.options[key])){const option=document.createElement('option');option.value=value;option.textContent=label;$(key).append(option);}}
 SkillEffects.presets.forEach((p,i)=>{const b=document.createElement('button');b.className='preset';b.innerHTML=`<svg viewBox="0 0 40 32" aria-hidden="true">${icons[i]}</svg><span>${p.name}</span>`;b.title=p.description;b.addEventListener('click',()=>{presetIndex=i;setRecipe(p.recipe);});$('presets').append(b);});
 function announce(s){$('notice').textContent=s;}
 function update(){
  for(const key of controls)$(key).value=recipe[key];
  const exact=SkillEffects.presets.findIndex(p=>controls.every(k=>p.recipe[k]===recipe[k]));
  if(exact>=0)presetIndex=exact;
  const p=SkillEffects.presets[presetIndex];
  $('effect-name').textContent=exact>=0?p.name:'組み替えた一手';
  $('family-label').textContent=SkillEffects.options.family[recipe.family];
  $('description').textContent=exact>=0?p.description:SkillEffects.presets.find(p=>p.recipe.family===recipe.family).description;
  [...$('presets').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===exact)));
  $('recipe-text').textContent=controls.map(k=>SkillEffects.options[k][recipe[k]]).join(' / ');
  $('beat-marks').replaceChildren();for(const at of SkillEffects.beats(recipe)){const m=document.createElement('i');m.style.left=at/SkillEffects.duration*100+'%';$('beat-marks').append(m);}
  $('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'一時停止':'再生');
  $('compare').disabled=!pinned;$('compare').setAttribute('aria-pressed',String(compare));
  canvas.parentElement.classList.toggle('comparing',compare);
  $('mode-label').textContent=compare?'A 記録した構成 / B いまの構成':'演出見本';
  try{localStorage.setItem(storageKey,JSON.stringify(recipe));}catch{}
 }
 function setRecipe(next){recipe=SkillEffects.resolve(next);announce('');replay();}
 function replay(){time=0;last=null;playing=true;update();draw();}
 function resize(){const box=canvas.parentElement.getBoundingClientRect();cssW=Math.max(1,box.width);cssH=Math.max(1,box.height);const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
 function draw(){
  const opts={mono:$('mono').checked,quality:cssW<500?'low':'high'};
  if(compare&&pinned){
   const stacked=cssW<520,w=stacked?cssW:cssW/2,h=stacked?cssH/2:cssH;
   ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();SkillFxStage.draw(ctx,w,h,pinned,time,{...opts,label:'A / 記録した構成'});ctx.restore();
   ctx.save();ctx.translate(stacked?0:w,stacked?h:0);SkillFxStage.draw(ctx,w,h,recipe,time,{...opts,label:'B / いまの構成'});ctx.restore();
   ctx.fillStyle='#5b6664';if(stacked)ctx.fillRect(0,h,w,1);else ctx.fillRect(w,0,1,h);
  }
  else SkillFxStage.draw(ctx,cssW,cssH,recipe,time,opts);
  $('timeline').value=String(Math.round(time*1000));
  const beats=SkillEffects.beats(recipe),lastBeat=beats.at(-1);let phase=time<beats[0]-.18?'構え':time>lastBeat+.5?'余韻の終わり':'技の軌道';
  if(beats.some(t=>Math.abs(time-t)<.08))phase='命中';else if(time>lastBeat+.08)phase='消え際';
  $('phase').textContent=phase;
 }
 for(const key of controls)$(key).addEventListener('change',()=>setRecipe({...recipe,[key]:$(key).value}));
 $('reset').addEventListener('click',()=>setRecipe(SkillEffects.presets[presetIndex].recipe));
 $('shuffle').addEventListener('click',()=>{const next={version:1,seed:recipe.seed};for(const key of controls){const values=Object.keys(SkillEffects.options[key]);next[key]=values[Math.floor(Math.random()*values.length)];}setRecipe(next);});
 $('play').addEventListener('click',()=>{playing=!playing;if(playing&&time>=SkillEffects.duration)time=0;last=null;update();});
 $('replay').addEventListener('click',replay);
 $('step').addEventListener('click',()=>{playing=false;time=Math.min(SkillEffects.duration,time+1/60);update();draw();});
 $('timeline').addEventListener('input',()=>{playing=false;time=Number($('timeline').value)/1000;update();draw();});
 $('mono').addEventListener('change',draw);
 $('pin').addEventListener('click',()=>{pinned=recipe;$('pin-label').textContent='A: '+SkillEffects.options.family[pinned.family]+' / '+SkillEffects.options.path[pinned.path];update();draw();});
 $('compare').addEventListener('click',()=>{if(pinned){compare=!compare;update();draw();}});
 $('sound').addEventListener('change',async()=>{
  if(!$('sound').checked)return;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error();audio??=new AC();await audio.resume();replay();}catch{$('sound').checked=false;announce('この環境では音を再生できません。');}
 });
 $('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(recipe,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bloodline-effect-recipe.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('構成をJSONに保存しました。読込で再現できます。');
 });
 $('import').addEventListener('click',()=>$('file').click());
 $('file').addEventListener('change',async()=>{
  const file=$('file').files[0];if(!file)return;
  try{if(file.size>8192)throw Error('8KB以下の構成ファイルを選んでください');const next=SkillEffects.resolve(JSON.parse(await file.text()));setRecipe(next);announce('保存した構成を読み込みました。');}catch(e){announce('読込できません: '+e.message);}finally{$('file').value='';}
 });
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||/^(INPUT|SELECT|BUTTON|A)$/.test(e.target.tagName))return;e.preventDefault();replay();});
 document.addEventListener('visibilitychange',()=>{last=null;});
 function tick(now){
  if(!document.hidden&&playing){
   const previous=time,dt=last===null?0:Math.min(.06,(now-last)/1000);time+=dt*Number($('speed').value);
   if($('sound').checked&&audio?.state==='running')for(const at of SkillEffects.beats(recipe)){if(previous<at&&time>=at)SkillEffects.sound(audio,recipe);}
   if(time>SkillEffects.duration){if($('loop').checked)time=0;else{time=SkillEffects.duration;playing=false;update();}}
   draw();
  }
  last=now;requestAnimationFrame(tick);
 }
 $('build-id').textContent=FX_LAB_BUILD;update();resize();new ResizeObserver(resize).observe(canvas.parentElement);requestAnimationFrame(tick);
 // Inspection API for headless DOM verification and user-authored configurations.
 window.SkillFxLab=Object.freeze({getRecipe:()=>({...recipe}),setRecipe,seek:t=>{playing=false;time=Math.max(0,Math.min(SkillEffects.duration,t));update();draw();}});
})();
