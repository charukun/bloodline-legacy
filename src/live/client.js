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
        if(v.commit===BUILD_INFO.commit){
          if(['available','waiting'].includes(this.noticeState?.kind)){this.cancelUpdate();this.clearNotice();}return;
        }
        this.showAvailable();
      }catch{/* Version service failure is not a session or protocol failure. */}
      finally{this.checking=null;}
    })();return this.checking;
  }
  showAvailable(){
    if(this.compatibilityBlocked){if(!this.noticeState)this.show('プレイを再開するには、新しいバージョンへの更新が必要です。',true,'required');return;}
    if(!this.noticeState||this.noticeState.kind==='available')
      this.show('新しいバージョンがあります。今のままプレイを続けられます。',true,'available');
  }
  show(message,update=false,kind='connection'){
    const previous=this.noticeState;
    if(previous?.message===message&&previous.update===update&&previous.kind===kind)return;
    this.noticeState={message,update,kind};this.renderNotice();
    // Routine updates stay in Settings. A stopped connection still explains itself
    // once through the existing bounded notice queue, without a persistent overlay.
    if(['connection','required','error'].includes(kind))this.g.ui?.toast?.(message+' 詳細は設定で確認できます。');
  }
  clearNotice(){this.noticeState=null;this.notice?.remove();this.notice=null;this.renderNotice();}
  renderNotice(){
    const state=this.noticeState,ui=this.g.ui;
    const scopes=[document,ui?.lineageView?.home?.scope,ui?.lineageView?.modalView?.scope].filter(Boolean);
    for(const scope of scopes)for(const button of scope.querySelectorAll('[data-menu="settings"],#settings')){
      if(state){
        if(button===ui?.hudSettings)button.dataset.liveLabel=ui.modal&&ui.menuSection()==='settings'?'メニューを閉じる':'設定';
        if(!button.hasAttribute('data-live-label'))button.dataset.liveLabel=button.getAttribute('aria-label')||button.textContent.trim();
        const badge=state.kind==='required'?'要更新':state.kind==='waiting'?'更新待ち':state.update?'更新':'通信';
        button.dataset.liveNotice=badge;button.setAttribute('aria-label',button.dataset.liveLabel+'：'+badge);
      }else if(button.hasAttribute('data-live-label')){
        button.setAttribute('aria-label',button.dataset.liveLabel);delete button.dataset.liveLabel;delete button.dataset.liveNotice;
      }
    }
    const slot=document.getElementById('live-update-slot');if(!slot)return;
    if(!state){slot.replaceChildren();return;}
    // Keep the same controls while their state changes, preserving keyboard focus.
    if(!this.notice||this.notice.parentNode!==slot){
      const box=document.createElement('section');box.className='live-update-notice';box.setAttribute('aria-label','更新・接続のお知らせ');
      const title=document.createElement('strong'),text=document.createElement('p'),actions=document.createElement('div');
      title.className='live-update-title';text.setAttribute('role','status');text.setAttribute('aria-live','polite');
      actions.className='live-update-actions';
      const update=document.createElement('button'),later=document.createElement('button');
      update.className=later.className='pill';update.onclick=()=>this.requestUpdate();
      later.onclick=()=>{if(this.requested){this.cancelUpdate();this.noticeState=null;this.showAvailable();}else ui.closeModal();};
      actions.append(update,later);box.append(title,text,actions);slot.replaceChildren(box);this.notice=box;
    }
    const [title,text,actions]=this.notice.children;
    title.textContent=state.update?'ゲームの更新':'接続状況';
    if(text.textContent!==state.message)text.textContent=state.message;
    actions.hidden=!state.update;
    actions.firstChild.textContent=this.requested?'更新を待っています…':'保存して更新する';
    actions.firstChild.disabled=!!this.requested;
    actions.lastChild.textContent=this.requested?'更新を取り消す':'あとで';
    actions.lastChild.hidden=state.kind==='required';
  }
  cancelUpdate(){this.requested=false;clearInterval(this.updateTimer);this.updateTimer=null;}
  requestUpdate(){
    this.requested=true;
    // Settings is a modal and correctly blocks safeGame. Close it through the
    // normal UI path before testing safety; do not weaken the safety contract.
    if(this.g.ui?.modal==='settings')this.g.ui.closeModal();
    this.update();
    if(!this.updateTimer)this.updateTimer=setInterval(()=>{if(this.requested)this.update();},1000);
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
    if(error.status===426){this.compatibilityBlocked=true;this.progressProtected=error.data?.progressProtected===true;this.disconnect();this.check();this.show('プレイを再開するには、新しいバージョンへの更新が必要です。',true,'required');return;}
    if(error.status===401){this.disconnect();this.show('接続の認証に失敗しました。この画面を開き直して、再接続してください。');return;}
    if(['MIGRATION_FAILED','RECOVERY_REQUIRED','SAVE_UNAVAILABLE'].includes(error.message)){
      this.disconnect();this.show('保存データを確認できないため、接続を停止しました。時間をおいて、この画面を開き直してください。');return;
    }
    this.ready=false;this.show('接続が切れました。自動で再接続しています。');this.scheduleReconnect();
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
    if(this.noticeState?.kind==='connection'){this.clearNotice();if(this.target?.commit!==BUILD_INFO.commit&&this.target)this.showAvailable();}
    if(this.requested&&!this.updating)this.update();return true;
  }
  async join(beginLife=false){
    this.disconnect();const generation=this.generation;
    const r=await fetch('/api/join',{method:'POST',headers:this.headers(),cache:'no-store',signal:AbortSignal.timeout(8000),
      body:JSON.stringify({config:this.g.profile,beginLife,busy:!safeGame(this.g)})});
    const body=await this.response(r);if(generation!==this.generation)return false;
    this.g.token=body.token;this.g.playerId=body.playerId;this.g.account?.joined(body.token);
    if(!writeStore('online.token.'+this.g.profile.mode,body.token))throw Error('接続に必要な情報を保存できません。ブラウザの保存設定と端末の空き容量を確認してください。');
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
            if(packet.control==='SESSION_REPLACED'){this.disconnect();this.g.account?.sessionLost();this.show('別の画面でプレイを開始したため、この画面の接続を終了しました。');return;}
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
    if(!safeGame(this.g)||this.sending){this.show('安全に保存できるまで待っています。戦闘・会話・移動を終え、メニューを閉じると更新します。',true,'waiting');return false;}
    this.updating=true;
    try{
      await this.check();const target=this.target;
      if(!this.requested||!target||target.commit===BUILD_INFO.commit)return false;
      // Download/verify only after a requested update. All JS/models/textures are
      // embedded in this document, so one hash covers the complete client build.
      const url=new URL('/index.html',location.href);url.searchParams.set('build',target.commit);
      const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});
      if(!r.ok)throw Error('UPDATE_UNAVAILABLE');const bytes=await r.arrayBuffer();
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==target.htmlSha256)throw Error('UPDATE_UNAVAILABLE');
      // State can change during the download. Recheck at the final boundary.
      if(!this.requested||!safeGame(this.g)||this.sending)return false;
      this.g.stopInput();
      if(this.g.online){
        if(this.compatibilityBlocked){if(!this.progressProtected)return false;}
        else{
          if(!this.ready)return false;
          const checkpoint=await this.response(await fetch('/api/checkpoint',{method:'POST',headers:this.headers(),signal:AbortSignal.timeout(8000)}));
          if(!this.requested||!checkpoint.saved||!safeGame(this.g))return false;
        }
      }else if(!this.g.saveWorld())throw Error('SAVE_UNAVAILABLE');
      this.disconnect();location.assign(url.href);return true;
    }catch(error){this.cancelUpdate();this.show(error.message==='SAVE_UNAVAILABLE'?'保存に失敗したため、更新を中止しました。ブラウザの保存設定と端末の空き容量を確認してください。':'更新データを取得・確認できませんでした。時間をおいて、もう一度お試しください。',true,'error');return false;}
    finally{this.updating=false;}
  }
}
