class LiveUpdate {
  constructor(game){
    this.g=game;this.client={...LiveContract,...LIVE_BUILD};this.ready=false;this.generation=0;
    this.retry=0;this.revision=-1;this.epoch=null;this.checking=null;this.disposed=false;
  }
  headers(){return {'Content-Type':'application/json','X-Bloodline-Client':JSON.stringify(this.client),'X-Bloodline-Mode':this.g.profile.mode,
    ...(this.g.token?{'X-Aerin-Session':this.g.token}:{}),...(this.lease?{'X-Bloodline-Lease':this.lease}:{})};}
  start(){
    if(!/^https?:$/.test(location.protocol))return;
    this.check();
    this.timer=setInterval(()=>{if(!document.hidden){this.check();if(this.requested)this.update();}},90000+Math.random()*15000);
    this.presenceTimer=setInterval(()=>this.presence(),1000);
    this.foreground=()=>{
      this.g.stopInput();this.g.accumulator=0;this.g.lastFrame=performance.now();
      if(document.hidden){this.disconnect();return;}
      this.check();if(this.g.online)this.resume();
    };
    document.addEventListener('visibilitychange',this.foreground);
    window.addEventListener('online',()=>{this.check();if(this.g.online)this.resume();});
    window.addEventListener('pagehide',()=>{this.disconnect();this.g.saveWorld();});
  }
  async check(){
    if(this.checking||this.disposed)return this.checking;
    this.checking=(async()=>{
      try{
        const r=await fetch('/version.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});
        if(!r.ok)return;const v=await r.json();
        if(v.application!=='Bloodline Legacy'||v.environment!==BUILD_INFO.environment||v.mode!=='game'||!v.live||
          !/^[a-f0-9]{40}$/.test(v.commit)||!/^[a-f0-9]{64}$/.test(v.htmlSha256))return;
        this.target=v;
        if(v.commit===BUILD_INFO.commit){this.requested=false;this.notice?.remove();this.notice=null;return;}
        this.show('旅の新しい版が届いている。区切りのよい時に移ろう。',true);
      }catch{/* Version service failure is not a session or protocol failure. */}
      finally{this.checking=null;}
    })();return this.checking;
  }
  show(message,update=false){
    if(!this.notice){
      const box=document.createElement('aside');box.className='live-update-notice';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
      const text=document.createElement('span'),button=document.createElement('button');button.className='pill';button.textContent='記録して更新';
      button.onclick=()=>{this.requested=true;this.update();if(!this.updateTimer)this.updateTimer=setInterval(()=>{if(this.requested)this.update();},1000);};box.append(text,button);document.body.append(box);this.notice=box;
    }
    this.notice.firstChild.textContent=message;this.notice.lastChild.hidden=!update;
  }
  disconnect(){
    this.generation++;this.ready=false;this.g.ui?.talkFan?.cancel();this.abort?.abort();this.abort=null;
    clearTimeout(this.reconnectTimer);this.g.pendingMove=null;this.g.commandBuffer=[];
  }
  async response(response){
    const body=await response.json();if(response.ok)return body;
    const error=Object.assign(Error(body.code||body.error||'CONNECTION_FAILED'),{status:response.status,data:body});throw error;
  }
  fail(error){
    if(error.status===426){this.compatibilityBlocked=true;this.progressProtected=error.data?.progressProtected===true;this.disconnect();this.check();this.show('新しい版への更新が必要です。旅の記録は保持されています。',true);return;}
    if(error.status===401){this.disconnect();this.show('村への合図を確認できません。記録を残したまま入り直してください。');return;}
    if(['MIGRATION_FAILED','RECOVERY_REQUIRED','SAVE_UNAVAILABLE'].includes(error.message)){
      this.disconnect();this.show('村の記録を保護している。復旧を待って、つなぎ直そう。');return;
    }
    this.ready=false;this.show('村とのつながりを取り直している。');this.scheduleReconnect();
  }
  scheduleReconnect(){
    clearTimeout(this.reconnectTimer);if(document.hidden||this.disposed||!this.g.online)return;
    this.reconnectTimer=setTimeout(()=>this.resume(),Math.min(30000,1000*2**Math.min(5,this.retry++))*(.8+Math.random()*.4));
  }
  apply(packet,generation){
    if(generation!==this.generation||!packet.snapshot)return false;
    if(this.epoch===packet.epoch&&packet.revision<this.revision)return false;
    const reset=packet.recovery||this.epoch!==packet.epoch;
    if(this.epoch!==packet.epoch&&!packet.recovery)return false;
    if(reset){this.g.pendingMove=null;this.g.commandBuffer=[];this.g.renderer.effects=[];this.g.motionInterpolation?.reset();this.g.mapCache.clear();}
    this.epoch=packet.epoch;this.revision=packet.revision;this.ack=Math.max(this.ack||0,packet.ack);this.lease=packet.lease;
    this.g.acceptSnapshot(packet.snapshot);this.ready=!packet.updateRequired;this.retry=0;
    if(packet.compatibility?.targetRules!==packet.compatibility?.rules)this.check();
    if(!this.target||this.target.commit===BUILD_INFO.commit){this.notice?.remove();this.notice=null;}
    if(this.requested&&!this.updating)this.update();return true;
  }
  async join(beginLife=false){
    this.disconnect();const generation=this.generation;
    const r=await fetch('/api/join',{method:'POST',headers:this.headers(),cache:'no-store',signal:AbortSignal.timeout(8000),
      body:JSON.stringify({config:this.g.profile,beginLife,busy:!safeGame(this.g)})});
    const body=await this.response(r);if(generation!==this.generation)return false;
    this.g.token=body.token;this.g.playerId=body.playerId;
    if(!writeStore('online.token.'+this.g.profile.mode,body.token))throw Error('村への合図を保存できません。端末の保存先を確認してください。');
    this.compatibilityBlocked=false;this.lastPresence=null;this.apply(body,generation);this.stream(generation);return true;
  }
  async resume(){
    if(this.resuming||document.hidden||!this.g.online)return;
    this.resuming=true;try{await this.join(false);}catch(error){this.fail(error);}finally{this.resuming=false;}
  }
  async stream(generation){
    const abort=new AbortController();this.abort=abort;
    try{
      const r=await fetch('/api/events',{headers:this.headers(),cache:'no-store',signal:abort.signal});
      if(!r.ok){await this.response(r);return;}
      const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='';
      while(generation===this.generation){
        const {value,done}=await reader.read();if(done)throw Error('CONNECTION_CLOSED');
        buffer+=decoder.decode(value,{stream:true});if(buffer.length>4000000)throw Error('INVALID_STREAM');
        let end;while((end=buffer.indexOf('\n\n'))>=0){
          const event=buffer.slice(0,end);buffer=buffer.slice(end+2);if(!event.startsWith('data: '))continue;
          const packet=JSON.parse(event.slice(6));
          if(packet.control){
            if(packet.control==='SESSION_REPLACED'){this.disconnect();this.show('別の画面で旅を再開しました。');return;}
            throw Error(packet.control);
          }
          this.apply(packet,generation);
        }
      }
    }catch(error){if(generation===this.generation&&!abort.signal.aborted)this.fail(error);}
  }
  async send(){
    const g=this.g;if(!this.ready||this.sending||document.hidden)return;
    const command=g.commandBuffer.shift()||g.pendingMove;if(!command)return;if(command===g.pendingMove)g.pendingMove=null;
    this.sending=true;const generation=this.generation;
    const envelope={command,epoch:this.epoch,lease:this.lease,sequence:this.ack+1,id:gameId()};
    try{
      const r=await fetch('/api/command',{method:'POST',headers:this.headers(),signal:AbortSignal.timeout(5000),body:JSON.stringify(envelope)});
      const result=await this.response(r);if(generation!==this.generation)return;
      this.ack=Math.max(this.ack,result.ack);if(!result.accepted&&command.type!=='move')g.ui.toast('今は、その操作をできない');
    }catch(error){if(generation===this.generation){g.pendingMove=null;g.commandBuffer=[];this.fail(error);}}
    finally{this.sending=false;}
  }
  async presence(){
    if(!this.ready||this.presenceSending||document.hidden||!this.g.online)return;
    const busy=!safeGame(this.g),now=Date.now();if(this.lastPresence?.busy===busy&&now-this.lastPresence.at<20000)return;
    this.presenceSending=true;const generation=this.generation;
    try{await this.response(await fetch('/api/presence',{method:'POST',headers:this.headers(),signal:AbortSignal.timeout(5000),body:JSON.stringify({busy})}));
      if(generation===this.generation)this.lastPresence={busy,at:now};
    }catch(error){if(generation===this.generation)this.fail(error);}finally{this.presenceSending=false;}
  }
  async update(){
    if(this.updating||!this.requested)return false;
    if(!safeGame(this.g)||this.sending){this.show('戦闘や会話が落ち着いたら、記録して更新する。',true);return false;}
    this.updating=true;
    try{
      await this.check();const target=this.target;
      if(!target||target.commit===BUILD_INFO.commit)return false;
      // Download/verify only after a requested update. All JS/models/textures are
      // embedded in this document, so one hash covers the complete client build.
      const url=new URL('/index.html',location.href);url.searchParams.set('build',target.commit);
      const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});
      if(!r.ok)throw Error('UPDATE_UNAVAILABLE');const bytes=await r.arrayBuffer();
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==target.htmlSha256)throw Error('UPDATE_UNAVAILABLE');
      // State can change during the download. Recheck at the final boundary.
      if(!safeGame(this.g)||this.sending)return false;
      this.g.stopInput();
      if(this.g.online){
        if(this.compatibilityBlocked){if(!this.progressProtected)return false;}
        else{
          if(!this.ready)return false;
          const checkpoint=await this.response(await fetch('/api/checkpoint',{method:'POST',headers:this.headers(),signal:AbortSignal.timeout(8000)}));
          if(!checkpoint.saved||!safeGame(this.g))return false;
        }
      }else if(!this.g.saveWorld())throw Error('SAVE_UNAVAILABLE');
      this.disconnect();location.assign(url.href);return true;
    }catch(error){this.show(error.message==='SAVE_UNAVAILABLE'?'記録を保存できませんでした。旅を残したまま、保存先を確認してください。':'新しい版の準備を確認できませんでした。しばらくして更新してください。',true);return false;}
    finally{this.updating=false;}
  }
}
