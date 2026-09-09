/* Canvas inspection adapter for the SAME world-space primitives used in-game.
 * This small neutral stage is an effect study, not a replacement game renderer. */
const SkillFxStage=(()=>{
 const mix=(a,b,t)=>a+(b-a)*t;
 function draw(ctx,width,height,recipe,time,{mono=false,quality='high',label='',still=false,legacyBlade=false,close=false}={}){
  const scale=Math.min(width/5.6,height/3.8),project=v=>[width*.40+(v[0]*.76+v[2]*.74)*scale,height*.69+(v[2]*.23-v[0]*.20-v[1]*.82)*scale];
  ctx.save();ctx.fillStyle='#111b20';ctx.fillRect(0,0,width,height);
  const wash=ctx.createRadialGradient(width*.52,height*.58,0,width*.52,height*.58,width*.68);wash.addColorStop(0,'#263436');wash.addColorStop(1,'#11191f');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
  const line=(a,b,color,w=1)=>{const A=project(a),B=project(b);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.stroke();};
  for(let i=-4;i<=4;i++){line([i,0,-3],[i,0,5],'#314043',.5);line([-4,0,i],[4,0,i],'#314043',.5);}
  function shadow(p,r){const q=project(p);ctx.fillStyle='#090f1399';ctx.beginPath();ctx.ellipse(q[0],q[1],r*scale,r*scale*.28,0,0,Math.PI*2);ctx.fill();}
  const beats=SkillEffects.beats(recipe),recent=beats.reduce((a,b)=>time>=b?b:a,-10),hitAge=time-recent,hit=hitAge>=0&&hitAge<.16?(1-hitAge/.16)**2:0;
  const prep=beats.reduce((v,t)=>Math.max(v,Math.max(0,1-Math.abs(time-(t-.07))/.18)),0);
  shadow([0,0,0],.37);shadow([0,0,1.85],.30);
  // Articulated practice silhouettes keep the origin and confirmed contact legible.
  const pose=(z,dummy)=>{
   const lean=dummy?hit*.15:prep*.12,base=[0,0,z];
   const segment=(a,b,w,color)=>line([a[0],a[1],a[2]+z],[b[0],b[1],b[2]+z+lean],color,w*scale);
   if(dummy){segment([0,0,0],[0,1.55,0],.09,'#9a8264');segment([-.33,1.03,0],[.33,1.03,0],.07,'#b6a186');segment([0,.65,0],[0,1.17,0],.28,'#756957');for(let j=0;j<3;j++)segment([-.14,.76+j*.1,0],[.14,.76+j*.1,0],.017,'#bda783');}
   else{segment([-.14,0,-.12],[-.10,.67,0],.10,'#728887');segment([.14,0,.17],[.09,.67,0],.10,'#52686a');segment([0,.64,0],[0,1.2,.04],.26,'#a5b6b0');segment([-.15,1.10,0],[-.22,.8,.1],.075,'#758c8b');segment([.15,1.10,0],[.12,1.0,.24+prep*.38],.075,'#b4c0b5');segment([.12,1,.24+prep*.38],[.12,1.22,.72+prep*.46],.035,'#d8dbce');segment([-.12,1.2,0],[.12,1.2,.02],.065,'#ce8052');}
   const h=project([base[0],1.39,z+lean]);ctx.fillStyle=dummy?'#bba180':'#c8c6b5';ctx.beginPath();ctx.ellipse(h[0],h[1],.10*scale,.12*scale,0,0,Math.PI*2);ctx.fill();
  };
  pose(0,false);pose(1.85,true);
  const primitives=SkillEffects.frame(recipe,time,quality,legacyBlade);
  const gray=color=>{const c=color.slice(1).match(/../g).map(v=>parseInt(v,16)),v=Math.round(c[0]*.2126+c[1]*.7152+c[2]*.0722);return `rgb(${v},${v},${v})`;};
  // Each line tapers to points; darkness remains visible (no all-additive blend).
  for(const p of primitives){
   ctx.globalAlpha=p.alpha;ctx.fillStyle=mono?gray(p.color):p.color;
   if(p.kind==='ribbon'){
    // Continuous translucent bands: the same UV mask as the game shader,
    // approximated with gradients for an offline Canvas inspection surface.
    const bands=quality==='low'?18:32,sections=p.sections.map(s=>({a:project(s.a),b:project(s.b)}));
    const at=(s,v)=>[mix(s.a[0],s.b[0],v),mix(s.a[1],s.b[1],v)];
    const start=at(sections[0],.5),end=at(sections.at(-1),.5);
    for(let band=0;band<bands;band++){
     const v0=band/bands,v1=(band+1)/bands,v=(v0+v1)*.5,g=ctx.createLinearGradient(...start,...end);
     for(let j=0;j<=24;j++){
      const u=j/24,m=SkillSilk.mask(u,v,p.age,p.material),c=mono?[245,245,245]:[255,240,212];
      g.addColorStop(u,`rgba(${c.join(',')},${m.alpha})`);
     }
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(...at(sections[0],v0));
     for(let j=1;j<sections.length;j++)ctx.lineTo(...at(sections[j],v0));
     for(let j=sections.length-1;j>=0;j--)ctx.lineTo(...at(sections[j],v1));
     ctx.closePath();ctx.fill();
    }
    // Preserve subpixel leading-edge coverage as the WebGL fwidth path does.
    const edge=ctx.createLinearGradient(...start,...end);
    for(let j=0;j<=32;j++){const u=j/32,alpha=SkillSilk.mask(u,.16,p.age,p.material).alpha;edge.addColorStop(u,`rgba(${mono?'250,250,250':'255,244,224'},${alpha*.85})`);}
    ctx.strokeStyle=edge;ctx.lineWidth=quality==='low'?.85:1.15;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(...at(sections[0],.16));
    for(let j=1;j<sections.length;j++)ctx.lineTo(...at(sections[j],.16));ctx.stroke();
   }else if(p.kind==='line'){
    const a=project(p.a),b=project(p.b),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,w=Math.max(.55,p.width*scale),nx=-dy/len*w,ny=dx/len*w;
    ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(mix(a[0],b[0],.35)+nx,mix(a[1],b[1],.35)+ny);ctx.lineTo(...b);ctx.lineTo(mix(a[0],b[0],.65)-nx,mix(a[1],b[1],.65)-ny);ctx.closePath();ctx.fill();
   }else{
    const a=project(p.p),sx=p.size[0]*scale,sy=p.size[1]*scale;ctx.save();ctx.translate(...a);ctx.rotate(p.turn);ctx.beginPath();ctx.moveTo(-sx,0);ctx.lineTo(-sx*.1,-sy);ctx.lineTo(sx,sy*.2);ctx.lineTo(sx*.3,sy*.7);ctx.closePath();ctx.fill();ctx.strokeStyle=mono?'#c4c4c4':'#ead8ba';ctx.lineWidth=.5;ctx.stroke();ctx.restore();
   }
  }
  ctx.globalAlpha=1;
  ctx.font='11px sans-serif';ctx.fillStyle='#90a09f';ctx.fillText(label||'EFFECT STUDY / 01',22,27);
  ctx.fillStyle='#82928f';ctx.font='10px sans-serif';ctx.fillText('CAST',project([0,0,0])[0]-12,project([0,0,0])[1]+28);ctx.fillText('CONTACT',project([0,0,1.85])[0]-23,project([0,0,1.85])[1]+28);
  if(!still){ctx.fillStyle='#b4c2bb';ctx.font='11px monospace';ctx.fillText(`${Math.round(time*1000).toString().padStart(4,'0')} ms`,width-87,27);}
  ctx.restore();return primitives.length;
 }
 return {draw};
})();
