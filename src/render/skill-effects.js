/* Stateless, versioned VFX composition. Local units: Y up, +Z toward contact.
 * Stroke timing comes from SkillMotion; impacts ONLY from confirmed hit events.
 * No simulation writes, random stream consumption or per-frame catalog scan. */
const SkillEffects = (() => {
 const VERSION=1, LIMIT=160;
 const options=Object.freeze({
  family:{blade:'斬面',bell:'残響',stone:'砕石',thread:'張糸',ember:'熾火',shadow:'裂影'},
  path:{sweep:'横薙ぎ',pierce:'貫く',fall:'振り下ろす',orbit:'巻き込む'},
  rhythm:{single:'一閃',double:'二拍・返し',triplet:'三拍・畳みかけ'},
  impact:{cleave:'切り開く',fracture:'砕く',pinch:'締める',ripple:'波紋を送る'},
  release:{vanish:'切れよく消す',drift:'余韻を流す',recoil:'引き戻す'}
 });
 const palettes={blade:['#fff4d7','#b4ccc6','#637c7b'],bell:['#fff4d7','#b9d8d0','#687f85'],stone:['#e1c8a3','#b29772','#655b52'],thread:['#fff1cb','#cccbb9','#737d78'],ember:['#fff0b6','#e79447','#9a4732'],shadow:['#cfcfe1','#626780','#252b40']};
 const presetData=[
  ['薄月','blade','sweep','single','cleave','vanish','滑らかな斬面の外縁が走り、内側の細い筋がほどけて消える。'],
  ['返り鈴','bell','pierce','double','ripple','recoil','離れた波面が遅れて重なり、二拍目へ収束する。'],
  ['礎砕き','stone','fall','single','fracture','drift','地を割り、角のある破片が跳ねて落ちる。'],
  ['綾結び','thread','orbit','triplet','pinch','recoil','交差した糸を張り詰め、結び目から切り離す。'],
  ['炭走り','ember','sweep','double','fracture','drift','這う火種が一か所へ集まり、打点から噴き上がる。'],
  ['影ほどき','shadow','pierce','single','pinch','vanish','影が内へ吸い込まれ、裂けた輪郭が一瞬だけ残る。']
 ];
 function resolve(value={}) {
  if(value.version!==undefined&&value.version!==VERSION)throw Error('この見本では未対応のレシピ形式です');
  const out={version:VERSION};
  for(const [key,choices] of Object.entries(options)){
   const id=value[key]??Object.keys(choices)[0];
   if(!Object.hasOwn(choices,id))throw Error('不明な組み合わせ: '+key);
   out[key]=id;
  }
  if(value.seed!==undefined&&(!Number.isInteger(value.seed)||value.seed<0||value.seed>4294967295))throw Error('seedは0〜4294967295の整数にしてください');
  out.seed=value.seed??73;
  for(const [key,min,max,fallback] of [['flutter',0,1,.65],['thickness',.5,3,2.2]]){
   const v=value[key]??fallback;
   if(!Number.isFinite(v)||v<min||v>max)throw Error(key+'は'+min+'〜'+max+'の数値にしてください');
   out[key]=v;
  }
  return Object.freeze(out);
 }
 const presets=Object.freeze(presetData.map(([name,family,path,rhythm,impact,release,description],i)=>Object.freeze({name,description,recipe:resolve({family,path,rhythm,impact,release,seed:73+i*97})})));
 // Authored bindings: separate IDs retain their own spatial/timing signature.
 // All other skills continue to use the established renderer.
 const bindings={
  60010:['thread','pierce','single','pinch','vanish'],60011:['thread','sweep','double','cleave','recoil'],60012:['thread','orbit','single','pinch','recoil'],
  60040:['blade','pierce','single','cleave','vanish'],60041:['blade','sweep','double','ripple','recoil'],60042:['blade','fall','single','cleave','vanish'],
  60060:['bell','pierce','single','ripple','vanish'],60061:['bell','orbit','double','ripple','recoil'],60062:['bell','fall','single','pinch','drift'],
  60080:['stone','pierce','single','fracture','vanish'],60081:['stone','orbit','double','cleave','recoil'],60082:['stone','fall','single','fracture','drift'],
  60090:['ember','sweep','single','cleave','vanish'],60091:['ember','orbit','double','fracture','recoil'],60092:['ember','fall','single','fracture','drift'],
  60110:['shadow','pierce','single','pinch','vanish'],60111:['shadow','sweep','double','ripple','recoil'],60112:['shadow','orbit','single','cleave','drift']
 };
 const bySkill=new Map(Object.entries(bindings).map(([id,v])=>[Number(id),resolve({family:v[0],path:v[1],rhythm:v[2],impact:v[3],release:v[4],seed:Number(id)})]));
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const hash=(seed,i)=>{let x=(seed^Math.imul(i+1,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);return ((x^(x>>>13))>>>0)/4294967296;};
 const add=(a,b)=>a.map((v,i)=>v+b[i]);
 function pathPoint(path,u){
  if(path==='pierce')return [.10*Math.sin(u*Math.PI),1.12,.2+u*2.1];
  if(path==='fall')return [0,2.6-u*1.9,.35+u*1.92];
  const a=(path==='orbit'?-5:-1.55)+(path==='orbit'?6.4:1.98)*u;
  return [Math.sin(a)*(path==='orbit'?1.45:1.65),1.1+.12*Math.sin(u*Math.PI),.05+Math.cos(a)*1.8];
 }
 function writer(recipe,quality){
  const list=[],colors=palettes[recipe.family],budget=quality==='low'?80:LIMIT;
  const put=p=>{if(list.length<budget&&p.alpha>.008)list.push(p);};
  return {list,colors,
   line:(a,b,width=.025,alpha=1,tone=0)=>put({kind:'line',a,b,width,alpha:clamp(alpha),color:colors[tone]}),
   shard:(p,size,turn=0,alpha=1,tone=1)=>put({kind:'shard',p,size,turn,alpha:clamp(alpha),color:colors[tone]})};
 }
 function ring(w,c,r,alpha,plane='ground',steps=16,turn=0,open=1,width=.017){
  const point=a=>plane==='ground'?[c[0]+Math.cos(a)*r,c[1],c[2]+Math.sin(a)*r]:[c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r,c[2]];
  for(let i=0;i<steps;i++)w.line(point(turn+i/steps*Math.PI*2*open),point(turn+(i+1)/steps*Math.PI*2*open),width,alpha,1);
 }
 function stroke(recipe,u,quality='high',legacyBlade=false){
  if(!Number.isFinite(u)||u<0||u>1)return [];
  if(recipe.family==='blade'&&!legacyBlade&&typeof SkillSilk!=='undefined')return SkillSilk.stroke(recipe,u,quality);
  const w=writer(recipe,quality),n=quality==='low'?9:16,head=pathPoint(recipe.path,u),fade=Math.sin(Math.PI*clamp(u/.94)),rnd=i=>hash(recipe.seed,i);
  if(recipe.family==='blade'){
   for(let j=0;j<n;j++){
    // Overlap tapered segments so the edge reads as a continuous cut, not beads.
    const a=clamp(u-.38+j/n*.38),b=clamp(u-.38+(j+2)/n*.38,0,u),f=Math.sin(j/n*Math.PI);
    w.line(pathPoint(recipe.path,a),pathPoint(recipe.path,b),.006+f*.022,fade*(.3+j/n*.7));
   }
   w.line(add(head,[0,-.10,0]),add(head,[0,.13,0]),.014,fade);
  }else if(recipe.family==='bell'){
   for(let j=0;j<3;j++){
    const q=u-j*.18;if(q<0)continue;
    ring(w,pathPoint(recipe.path,clamp(q)),.13+q*.36,fade*(1-j*.22),'upright',n,q, .86,.012);
   }
  }else if(recipe.family==='stone'){
   for(let j=0;j<6;j++){
    const q=clamp(u-j*.075),p=pathPoint(recipe.path,q),s=.055+rnd(j)*.085;
    w.shard(add(p,[(rnd(j+20)-.5)*.35,-.16,0]),[s,s*1.6,s],u*8+j,fade*(1-j*.08));
    if(j<3)w.line(add(p,[0,.1,-.18]),p,.014,fade*.65,0);
   }
  }else if(recipe.family==='thread'){
   const anchor=[-.5,1,.05];
   for(let j=0;j<4;j++){
    const end=pathPoint(recipe.path,clamp(u+j*.055)),off=(j-1.5)*.14;
    w.line(add(anchor,[off,.2*Math.sin(j),0]),add(end,[-off,off,0]),.009,fade*.8);
    if(u>.45)w.line(add(end,[-off,off,0]),add(head,[off,-off,.18]),.007,fade,1);
   }
   w.shard(head,[.04,.04,.04],u*5,fade,0);
  }else if(recipe.family==='ember'){
   for(let j=0;j<n;j++){
    const q=clamp(u-j*.026),p=pathPoint(recipe.path,q),v=(1-u)*.38;
    const a=add(p,[(rnd(j)-.5)*v,Math.sin(j*2+u*14)*v,(rnd(j+1)-.5)*v]);
    w.line(a,add(a,[.035,.07+j%3*.02,.04]),.018,fade*(1-j/n*.65),j%3===0?0:1);
   }
  }else if(recipe.family==='shadow'){
   for(let j=0;j<5;j++){
    const p=pathPoint(recipe.path,clamp(u-j*.042)),size=(1-u)*.6+.06;
    w.line(add(p,[-size,.12,-.06]),add(p,[size,-.12,.06]),.11,fade*.85,2);
    w.line(add(p,[-size,.135,-.06]),add(p,[size,-.105,.06]),.009,fade*.8,0);
   }
  }
  return w.list;
 }
 function impact(recipe,age,quality='high'){
  if(!Number.isFinite(age)||age<0||age>.55)return [];
  const duration=recipe.release==='vanish'?.24:recipe.release==='recoil'?.36:.50;
  if(age>=duration)return [];
  const w=writer(recipe,quality),u=age/duration,fade=(1-u)**1.5,rnd=i=>hash(recipe.seed,i),n=quality==='low'?8:14;
  const spread=1-(1-u)**3,c=[0,0,0];
  if(recipe.family==='blade'){
   for(let j=0;j<3;j++){const a=-.7+j*.55,rr=.12+spread*.85;w.line([-Math.cos(a)*rr,-Math.sin(a)*rr,0],[Math.cos(a)*rr,Math.sin(a)*rr,0],.018*(1-u)+.003,fade,j===0?0:1);}
  }else if(recipe.family==='bell'){
   for(let j=0;j<3;j++){const q=clamp((u-j*.13)*1.5);if(q>0)ring(w,[0,0,-j*.14],.06+q*.8,fade*(1-j*.18),'upright',n,j*.2,.91,.018);}
  }else if(recipe.family==='stone'){
   for(let j=0;j<(quality==='low'?5:8);j++){
    const a=j*2.399,s=.055+rnd(j)*.09,v=.2+spread*(.3+rnd(j+1)*.5);
    const y=Math.abs(Math.sin(u*Math.PI*1.5))*(1-u)*.65-.45*u;
    w.shard([Math.sin(a)*v,y,Math.cos(a)*v],[s,s*1.35,s],u*8+j,fade,1);
    const p=[Math.sin(a)*spread*.65,-.42,Math.cos(a)*spread*.65];w.line([0,-.42,0],p,.01,fade*.7,2);
   }
  }else if(recipe.family==='thread'){
   const r=.85*(1-clamp(u*1.8))+.1;
   for(let j=0;j<6;j++){const a=j*Math.PI/3,p=[Math.cos(a)*r,Math.sin(a)*r,0],b=[-p[0]*.55,-p[1]*.55,.2];
    if(u<.55)w.line(p,b,.011,fade);else{const d=spread*.3;w.line(add(p,[d,d,0]),add(b,[d,d,0]),.008,fade);}}
  }else if(recipe.family==='ember'){
   for(let j=0;j<n;j++){
    const a=j*2.399,v=spread*(.1+rnd(j)*.5),p=[Math.sin(a)*v,age*(2+rnd(j+10)*3)-age*age*5,Math.cos(a)*v];
    w.line(add(p,[0,-.06-rnd(j)*.15,0]),p,.015+(1-u)*.023,fade,j%3===0?0:1);
   }
  }else if(recipe.family==='shadow'){
   for(let j=0;j<7;j++){
    const a=j/7*Math.PI*2,r=(1-u)**2*.9,p=[Math.cos(a)*r,Math.sin(a)*r,0];
    const end=[Math.cos(a+.4)*r*.32,Math.sin(a+.4)*r*.32,.1];
    w.line(p,end,.08*(1-u)+.012,fade,2);w.line(add(p,[0,.016,0]),add(end,[0,.016,0]),.009,fade,0);
   }
  }
  // Contact morphology is independent of the material motif above.
  if(recipe.impact==='cleave'){
   w.line([-.65*spread,-.3*spread,.05],[.65*spread,.3*spread,.05],.027*fade,fade);
  }else if(recipe.impact==='fracture'){
   for(let j=0;j<4;j++){const a=j*1.55,rr=.25+spread*.7,p=[Math.cos(a)*rr,Math.sin(a)*rr*.5,0],mid=[p[0]*.4+.1,p[1]*.7,0];w.line(c,mid,.013,fade,1);w.line(mid,p,.009,fade,1);}
  }else if(recipe.impact==='pinch'){
   const r=.7*(1-spread)+.06;for(let j=0;j<4;j++){const a=j*Math.PI/2;w.line([Math.cos(a)*r,Math.sin(a)*r,.1],[Math.cos(a+.7)*r*.5,Math.sin(a+.7)*r*.5,.1],.021,fade);}
  }else ring(w,[0,-.35,0],.1+spread*.95,fade*.7,'ground',n,0,.9,.012);
  const tail=clamp((u-.42)/.58);
  if(recipe.release==='recoil')return w.list.map(p=>transform(p,v=>v.map(n=>n*(1-tail*.92))));
  if(recipe.release==='drift')return w.list.map(p=>transform(p,v=>add(v,[tail*.18,tail*.28,tail*.30])));
  return w.list;
 }
 const beats=recipe=>recipe.rhythm==='double'?[.34,.63]:recipe.rhythm==='triplet'?[.30,.48,.70]:[.40];
 const duration=1.5;
 function frame(recipe,time,quality='high',legacyBlade=false){
  if(!Number.isFinite(time))return [];
  const list=[];
  for(const [i,at] of beats(recipe).entries()){
   const u=(time-(at-.18))/.23,mirror=i%2?-1:1;
   for(const p of stroke(recipe,u,quality,legacyBlade))list.push(transform(p,v=>[v[0]*mirror,v[1],v[2]]));
   for(const p of impact(recipe,time-at,quality))list.push(transform(p,v=>[v[0],v[1]+1.1,v[2]+1.85]));
  }
  return list.slice(0,quality==='low'?160:320);
 }
 function transform(p,point){
  if(p.kind==='ribbon')return {...p,sections:p.sections.map(s=>({a:point(s.a),b:point(s.b)}))};
  return p.kind==='line'?{...p,a:point(p.a),b:point(p.b)}:{...p,p:point(p.p)};
 }
 // User-gesture-only audio. All sources have a fixed stop time; no timers or loops.
 function sound(ctx,recipe,when=ctx.currentTime,volume=.12){
  const gain=ctx.createGain();gain.gain.value=clamp(volume,0,.25);gain.connect(ctx.destination);
  const voices={blade:[[1200,180,'sawtooth',.065]],bell:[[880,880,'sine',.23],[1320,1320,'sine',.19]],stone:[[96,38,'triangle',.12],[420,70,'square',.055]],thread:[[1650,310,'triangle',.085],[980,400,'sine',.1]],ember:[[150,520,'sawtooth',.12],[1800,190,'triangle',.075]],shadow:[[240,48,'sine',.19],[410,60,'triangle',.13]]}[recipe.family];
  let remaining=voices.length;
  for(const [start,end,type,length] of voices){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(start,when);o.frequency.exponentialRampToValueAtTime(end,when+length);g.gain.setValueAtTime(.001,when);g.gain.linearRampToValueAtTime(.3/voices.length,when+.006);g.gain.exponentialRampToValueAtTime(.001,when+length);o.connect(g);g.connect(gain);o.start(when);o.stop(when+length+.01);o.onended=()=>{o.disconnect();g.disconnect();if(--remaining===0)gain.disconnect();};}
 }
 return Object.freeze({VERSION,LIMIT,options,presets,resolve,forSkill:id=>bySkill.get(id)||null,stroke,impact,frame,beats,duration,transform,sound});
})();
