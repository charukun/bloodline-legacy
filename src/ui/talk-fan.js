// A single pointer gesture owns the fan; speech still uses the shared chat command.
class UITalkFan {
 constructor(ui){
  this.ui=ui;this.g=ui.g;this.selected=-1;
  this.options=[{text:'助けて'},{text:'よろしく'},{text:'ありがとう'},{text:'マイク',mic:true}];
  this.lifecycle=new AbortController();const signal=this.lifecycle.signal;
  window.addEventListener('blur',()=>this.cancel(),{signal});
  window.addEventListener('pagehide',()=>this.cancel(),{signal});
  window.addEventListener('resize',()=>this.cancel(),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancel();},{signal});
  document.addEventListener('keydown',e=>this.key(e),{capture:true,signal});
 }
 bind(button){
  this.cancel();this.binding?.abort();this.binding=new AbortController();this.button=button;
  const signal=this.binding.signal,on=(name,fn)=>button.addEventListener(name,fn,{signal});
  button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-controls','talk-fan');button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','話す（長押ししてフリック）');
  on('contextmenu',e=>e.preventDefault());
  on('pointerdown',e=>{
   if(e.button!==0||e.isPrimary===false||this.pointer||!this.available())return;
   e.preventDefault();e.stopPropagation();this.ignoreClick=true;
   if(this.recognition||this.menu){this.cancel();return;}
   this.g.stopInput();this.owner=this.identity();
   const q=this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};
   try{button.setPointerCapture(e.pointerId);}catch{}
   q.timer=setTimeout(()=>{this.check();if(this.pointer===q){this.open(false);this.highlight(this.hit(q.x,q.y));}},360);
  });
  on('pointermove',e=>{const q=this.pointer;if(!q||q.id!==e.pointerId)return;e.preventDefault();q.x=e.clientX;q.y=e.clientY;if(this.menu)this.highlight(this.hit(q.x,q.y));});
  on('pointerup',e=>{
   if(this.pointer?.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();
   const opened=!!this.menu,index=opened?this.hit(e.clientX,e.clientY):-1;
   this.releasePointer();
   // A short tap also opens a latched fan, for click / assistive input.
   if(!opened){this.open(true);return;}
   this.choose(index);
  });
  for(const type of ['pointercancel','lostpointercapture'])on(type,e=>{if(this.pointer?.id===e.pointerId)this.cancel();});
  on('click',e=>{if(this.ignoreClick&&e.detail!==0){this.ignoreClick=false;return;}this.ignoreClick=false;this.toggle();});
 }
 available(){const p=this.g.snapshot?.player;return this.g.screen==='game'&&!this.ui.modal&&p&&canAct(p);}
 identity(){return this.g.playerId+':'+this.g.snapshot?.room?.id;}
 check(){if((this.pointer||this.menu||this.recognition)&&(!this.available()||(this.owner&&this.owner!==this.identity())))this.cancel();}
 toggle(){if(this.menu||this.recognition)this.cancel(true);else this.open(true);}
 open(focus=false){
  if(this.menu||!this.available())return;
  this.g.stopInput();this.g.command({type:'talk'});this.owner=this.identity();
  const b=this.button.getBoundingClientRect();
  this.cx=b.left+b.width/2;this.cy=b.top+b.height/2;
  const r=this.radius=Math.max(64,Math.min(156,this.cy-8,(innerHeight-this.cy-8)*2,this.cx-8));
  // 120 degrees, opening inward and upward from the HUD's right-hand edge.
  const point=(angle,rad)=>{const a=angle*Math.PI/180;return [r+Math.cos(a)*rad,r+Math.sin(a)*rad];};
  const menu=this.menu=document.createElement('div');menu.id='talk-fan';menu.className='talk-fan';menu.setAttribute('role','menu');menu.setAttribute('aria-label','周囲に話す');
  Object.assign(menu.style,{left:this.cx-r+'px',top:this.cy-r+'px',width:r*2+'px',height:r*2+'px'});
  menu.innerHTML=this.options.map((o,i)=>{
   const start=-210+i*30,end=start+30,a=point(start,r-2),b=point(end,r-2),c=point(end,32),d=point(start,32),pos=point(start+15,r*.78);
   const edge=Array.from({length:9},(_,j)=>point(start+j*30/8,r));
   const clip=[point(start,30),...edge,point(end,30)].map(p=>p.map(n=>n/(2*r)*100+'%').join(' ')).join(',');
   return `<button type="button" role="menuitem" data-talk="${i}" tabindex="-1" ${o.mic&&!this.recognizer()?'aria-disabled="true" title="このブラウザでは音声入力を使えません"':''} style="clip-path:polygon(${clip})"><svg viewBox="0 0 ${r*2} ${r*2}" aria-hidden="true"><path d="M${a} A${r-2},${r-2} 0 0 1 ${b} L${c} A32,32 0 0 0 ${d} Z"/></svg><span style="left:${pos[0]}px;top:${pos[1]}px">${o.mic?icon('mic'):o.text}</span><span class="visually-hidden">${o.mic?'音声で話す':''}</span></button>`;
  }).join('');
  this.ui.hud.appendChild(menu);this.button.classList.add('fan-open');this.button.setAttribute('aria-expanded','true');
  this.menuEvents=new AbortController();const signal=this.menuEvents.signal;
  menu.querySelectorAll('[data-talk]').forEach((node,i)=>{
   node.addEventListener('click',()=>this.choose(i),{signal});
   node.addEventListener('pointerenter',()=>{if(!this.pointer)this.highlight(i);},{signal});
   node.addEventListener('focus',()=>this.highlight(i),{signal});
  });
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&!this.button.contains(e.target)){this.cancel();if(e.target===this.g.renderer.canvas){e.preventDefault();e.stopPropagation();}}},{capture:true,signal});
  if(focus)this.focusItem(0);
 }
 hit(x,y){
  const dx=x-this.cx,dy=y-this.cy,d=Math.hypot(dx,dy);if(d<32||d>this.radius)return -1;
  let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>0)angle-=360;
  return angle>=-210&&angle<=-90?Math.min(3,Math.floor((angle+210)/30)):-1;
 }
 highlight(index){
  if(this.selected===index)return;this.selected=index;
  this.menu?.querySelectorAll('[data-talk]').forEach((n,i)=>n.classList.toggle('selected',i===index));
 }
 focusItem(index){const nodes=this.menu?.querySelectorAll('[data-talk]');if(!nodes)return;nodes.forEach((n,i)=>n.tabIndex=i===index?0:-1);nodes[index]?.focus({preventScroll:true});}
 key(e){
  if(!this.menu&&!this.pointer&&!this.recognition)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.cancel(true);return;}
  if(!this.menu)return;
  // Keyboard navigation selects existing choices; it never accepts typed chat.
  e.stopPropagation();
  if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Tab','Home','End'].includes(e.key)){
   e.preventDefault();let i=this.selected<0?0:this.selected;
   if(e.key==='Home')i=0;else if(e.key==='End')i=3;
   else i=(i+((['ArrowDown','ArrowLeft'].includes(e.key)||e.key==='Tab'&&e.shiftKey)?3:1))%4;
   this.focusItem(i);
  }else if(e.key==='Enter'||e.key===' '){e.preventDefault();this.choose(this.selected);}
 }
 releasePointer(){const q=this.pointer;if(!q)return;this.pointer=null;clearTimeout(q.timer);try{if(this.button.hasPointerCapture(q.id))this.button.releasePointerCapture(q.id);}catch{}}
 close(focus=false){
  this.releasePointer();const hadMenu=!!this.menu;this.menuEvents?.abort();this.menu?.remove();this.menu=null;this.selected=-1;
  this.button?.classList.remove('fan-open');this.button?.setAttribute('aria-expanded','false');
  if(focus&&hadMenu&&this.button?.isConnected)this.button.focus({preventScroll:true});
 }
 choose(index){
  const choice=this.options[index],valid=this.available()&&this.owner===this.identity();this.close(true);
  if(!choice||!valid)return;if(choice.mic)this.listen();else this.say(choice.text);
 }
 say(text){if(this.available()&&this.owner===this.identity()&&!this.g.command({type:'chat',text}))this.ui.toast('少し間をあけて、もう一度');}
 recognizer(){return window.SpeechRecognition||window.webkitSpeechRecognition;}
 listen(){
  const Recognition=this.recognizer();if(!Recognition){this.ui.toast('このブラウザでは音声入力を使えません');return;}
  try{
   const rec=this.recognition=new Recognition();rec.lang='ja-JP';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
   this.button.classList.add('listening');this.button.setAttribute('aria-label','音声入力を取り消す');this.button.innerHTML=icon('mic')+'<span class="visually-hidden">音声入力を取り消す</span>';
   rec.onresult=e=>{
    if(this.recognition!==rec)return;
    const result=e.results[e.resultIndex||0];if(!result?.isFinal)return;
    const text=result[0]?.transcript?.trim();this.stopListening();if(text)this.say(text);
   };
   rec.onerror=e=>{
    if(this.recognition!==rec)return;this.stopListening();
    if(e.error!=='aborted')this.ui.toast(['not-allowed','service-not-allowed'].includes(e.error)?'マイクの利用が許可されていません':e.error==='no-speech'?'声を聞き取れませんでした':'音声入力を使えませんでした');
   };
   rec.onend=()=>{if(this.recognition===rec)this.stopListening();};
   this.micTimer=setTimeout(()=>{if(this.recognition===rec)this.stopListening();},12000);
   rec.start();
  }catch{this.stopListening();this.ui.toast('音声入力を使えませんでした');}
 }
 stopListening(){
  clearTimeout(this.micTimer);const rec=this.recognition;this.recognition=null;
  if(rec){rec.onresult=rec.onerror=rec.onend=null;try{rec.abort();}catch{}
   this.button?.classList.remove('listening');this.button?.setAttribute('aria-label','話す（長押ししてフリック）');if(this.button)this.button.innerHTML=icon('talk')+'<span>話す</span>';
  }
 }
 cancel(focus=false){this.close(focus);this.stopListening();this.owner=null;}
 destroy(){this.cancel();this.binding?.abort();this.lifecycle.abort();}
}
