// Passkeys use the browser's credential manager. No provider secret or private
// key enters game code. Offline cloud records never enter the multiplayer world.
class AccountLink {
 constructor(game){this.g=game;this.message='';this.syncing=false;this.busy=false;this.bindMode();}
 key(name){return 'account.'+name+'.'+this.mode;}
 bindMode(){if(this.mode===this.g.profile.mode)return;this.mode=this.g.profile.mode;this.token=readStore('online.token.'+this.mode,null);this.meta=readStore(this.key('link'),null);this.info=null;this.lastSync=0;this.lastUploaded=null;this.proposal=null;this.recoveryCode=null;}
 joined(token){this.bindMode();if(this.token!==token){this.token=token;this.info=null;if(this.meta)this.pauseSync();}}
 start(){
  this.storageChanged=e=>{if(e.key===STORAGE_PREFIX+'online.token.'+this.mode&&readStore('online.token.'+this.mode,null)!==this.token)this.sessionLost();};
  window.addEventListener('storage',this.storageChanged);
  this.onOnline=()=>this.maybeSave();window.addEventListener('online',this.onOnline);
 }
 destroy(){window.removeEventListener('storage',this.storageChanged);window.removeEventListener('online',this.onOnline);}
 static bytes(value){return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
 static encoded(value){return btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
 static secret(){return AccountLink.encoded(crypto.getRandomValues(new Uint8Array(32)));}
 static code(){return Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{6}/g).join('-');}
 static response(c){
  const r=c.response,out={id:c.id,rawId:AccountLink.encoded(c.rawId),type:c.type,clientExtensionResults:c.getClientExtensionResults(),response:{clientDataJSON:AccountLink.encoded(r.clientDataJSON)}};
  if(r.attestationObject){out.response.attestationObject=AccountLink.encoded(r.attestationObject);out.response.transports=r.getTransports?.()||[];}
  else Object.assign(out.response,{authenticatorData:AccountLink.encoded(r.authenticatorData),signature:AccountLink.encoded(r.signature),userHandle:r.userHandle?AccountLink.encoded(r.userHandle):null});
  return out;
 }
 supported(){return !!(window.isSecureContext&&window.PublicKeyCredential&&navigator.credentials);}
 store(name,value){if(!writeStore(this.key(name),value))throw Error('LOCAL_SAVE_FAILED');}
 async api(path,body={},token=this.token){
  const mode=this.mode,r=await fetch('/api/account/'+path,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(path.startsWith('cloud-')?15000:10000),
   headers:{'Content-Type':'application/json','X-Bloodline-Mode':mode,'X-Bloodline-Client':JSON.stringify(this.g.live.client),...(token?{'X-Aerin-Session':token}:{})},body:JSON.stringify(body)});
  const data=await r.json();if(this.g.profile.mode!==mode)throw Error('MODE_CHANGED');if(!r.ok)throw Object.assign(Error(data.code||'CONNECTION_FAILED'),{status:r.status});return data;
 }
 error(e){
  const messages={NotAllowedError:'本人確認をキャンセルしました。もう一度試せます。',InvalidStateError:'この端末には登録済みのパスキーがあります。引き継ぎから本人確認してください。',
   AUTH_FAILED:'本人確認ができませんでした。パスキーまたは復旧コードを確認してください。',AUTH_EXPIRED:'本人確認の時間が切れました。もう一度お試しください。',
   SESSION_EXPIRED:'この端末の連携を確認できません。パスキーか復旧コードで引き継いでください。',ACCOUNT_REQUIRED:'パスキーで連携してからお試しください。',
   REAUTH_REQUIRED:'パスキーで本人確認してから、もう一度操作してください。',PASSKEY_ALREADY_LINKED:'そのパスキーは登録済みです。引き継ぎから本人確認してください。',
   WAIT_FOR_SAFE_POINT:'戦闘や会話が終わってから、もう一度引き継いでください。接続中の端末での操作が優先されます。',
   CLOUD_CONFLICT:'別の記録が保存されています。上書きを止めました。パスキーで引き継ぎ直すと、保存済みの記録を選べます。',
   CLOUD_RECOVERY_REQUIRED:'保存済みの記録を確認できません。端末の記録は残したまま、復旧をお待ちください。',
   LOCAL_SAVE_FAILED:'端末に記録を保管できないため、切り替えを止めました。保存先の空きを確認してください。',
   UPDATE_REQUIRED:'引き継ぐ記録に対応したゲームへの更新が必要です。',INVALID_SAVE:'この記録を読み込めません。現在の記録は保持しています。',
   LAST_PASSKEY:'最後のパスキーは削除できません。先に別のパスキーを追加してください。',RATE_LIMITED:'少し待ってから、もう一度お試しください。',
   EMPTY_SAVE:'旅を始めると、記録の自動保存が始まります。',MODE_CHANGED:'遊び方が変わりました。設定を開き直してください。'};
  this.message=messages[e.name]||messages[e.message]||'接続できませんでした。記録は保持しています。通信を確認して再試行してください。';
  if(['CLOUD_CONFLICT','SESSION_EXPIRED','ACCOUNT_REQUIRED'].includes(e.message))this.pauseSync();this.render(!this.busy);
 }
 pauseSync(){if(this.meta){this.meta={...this.meta,auto:false};writeStore(this.key('link'),this.meta);}}
 sessionLost(){this.pauseSync();this.message='別の端末や画面で再開されたため、この画面からの自動保存を止めました。';this.render();}
 async run(fn){if(this.busy)return;this.busy=true;this.message='';this.render();try{await fn();}catch(e){this.error(e);}finally{this.busy=false;this.render();}}
 mount(root){
  this.bindMode();let node=root.querySelector('#account-link');if(!node){node=document.createElement('section');node.id='account-link';node.className='account-link';node.setAttribute('aria-label','アカウント連携と引き継ぎ');root.querySelector('#export-save')?.before(node);}
  this.node=node;this.render();if(this.token&&!this.busy)this.run(async()=>{this.info=await this.api('status');const code=readStore(this.key('recovery'),null);if(code&&this.info.linked&&(await this.api('recovery-check',{code})).valid)this.recoveryCode=code;});
 }
 render(passive=false){
  if(!this.node?.isConnected)return;const node=this.node;
  if(passive&&node.contains(document.activeElement)&&document.activeElement.matches('input,textarea')){const status=node.querySelector('.account-status');if(status)status.textContent=this.message;return;}
  node.replaceChildren();
  const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;node.append(e);return e;};
  const button=(label,fn)=>{const b=text('button',label,'full-button');b.type='button';b.disabled=this.busy;b.onclick=()=>this.run(fn);return b;};
  text('h3','アカウント連携・引き継ぎ');
  text('p',this.info?.linked?'パスキー連携済み。機種変更後も同じ一族で再開できます。':'パスキーを登録すると、端末を替えても同じ一族で再開できます。');
  const status=text('p',this.busy?'確認しています…':this.message,'account-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  if(this.recoveryCode){
   text('p','復旧コードを、この端末以外の安全な場所に保存してください。パスキーを使えないときに必要です。人には教えないでください。');
   const code=text('textarea',this.recoveryCode,'account-code');code.readOnly=true;code.setAttribute('aria-label','復旧コード');
   button('復旧コードを保存',()=>this.download('血脈の系譜_復旧コード.txt',this.recoveryCode));
   button('保存しました',()=>{this.recoveryCode=null;localStorage.removeItem(STORAGE_PREFIX+this.key('recovery'));});
  }
  const pending=readStore(this.key('pending'),null);
  if(pending){text('p','前回の引き継ぎが途中です。保管した記録を使って再試行できます。');button('引き継ぎを再試行',()=>this.finish(pending));}
  if(this.proposal){
   const a=this.proposal.account;const describe=s=>`${s.clan||'一族'} / ${s.name||'旅人'} / ${Math.floor(s.age||0)}歳 / 第${s.generation||1}世代`;
   text('p','引き継ぐ記録を選んでください。この端末の記録は、切り替える前に別に保管します。');
   if(a.cloud){text('p','ひとりの旅：'+describe(a.cloud.summary)+'（'+new Date(a.cloud.updatedAt).toLocaleString()+' 保存）');button('ひとりの旅を引き継ぐ',()=>this.activate('offline'));}
   if(a.online){text('p','共有の旅：'+describe(a.online));button('共有の旅を引き継ぐ',()=>this.activate('online'));}
   if(!a.cloud&&!a.online)button('連携してこの端末の旅を続ける',()=>this.activate('keep'));
   button('キャンセル',()=>{this.proposal=null;});return;
  }
  if(!this.supported())text('p','パスキーは対応ブラウザのHTTPSページで利用できます。登録済みなら、下の復旧コードでも引き継げます。');
  else{
   if(!this.info?.linked)button('この一族をパスキーで連携する',()=>this.register());
   button('パスキーで引き継ぐ',()=>this.signIn());
   if(this.info?.linked){
    if(!this.info.canManage)button('本人確認して連携を管理',()=>this.signIn(true));
    else{button('パスキーを追加する',()=>this.register());button('復旧コードを再発行する',()=>this.newCode());
     if(this.info.passkeys.length>1)for(const c of this.info.passkeys)button(new Date(c.createdAt).toLocaleDateString()+' 登録のパスキーを削除',async()=>{
      if(!confirm('このパスキーを削除しますか？ 別のパスキーは残ります。'))return;this.info=(await this.api('remove-passkey',{id:c.id})).account;});
    }
    text('p','パスキー '+this.info.passkeys.length+'件。'+(this.info.passkeys.some(c=>c.backedUp)?'同期済みのパスキーがあります。':'端末を失う場合に備え、復旧コードも保存してください。'));
   }
  }
  const details=document.createElement('details');node.append(details);const label=document.createElement('summary');label.textContent='復旧コードで引き継ぐ';details.append(label);
  const input=document.createElement('input');input.type='password';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','保存した復旧コード');details.append(input);
  const recover=document.createElement('button');recover.type='button';recover.className='full-button';recover.textContent='復旧コードを確認する';recover.disabled=this.busy;details.append(recover);
  recover.onclick=()=>{const code=input.value;input.value='';this.run(async()=>{this.proposal={...await this.api('recover',{code},null),recovery:true};});};
  if(this.info?.linked){
   text('p',this.g.online?'共有の旅はサーバーへ保存されます。':this.meta?.auto?'ひとりの旅は約1分ごとに自動保存します。端末内の保存はこれまでどおり続きます。':'ひとりの旅の自動保存は停止中です。');
   if(this.meta?.savedAt)text('small','最後のクラウド保存：'+new Date(this.meta.savedAt).toLocaleString());
   if(this.meta?.auto)button('今すぐクラウドに保存する',()=>this.upload(true));
   button('この端末からログアウト',()=>this.logout());
  }
  const backup=readStore(this.key('previous'),null);
  if(backup?.token&&!backup.link&&(backup.wasOnline||backup.profile?.online))button('切り替え前の共有の旅に戻る',()=>this.previousOnline(backup));
  if(backup?.raw)button('切り替え前の記録を持ち出す',()=>{const saved=JSON.parse(backup.raw);this.download('血脈の系譜_切替前の記録.json',JSON.stringify({format:'AERIN-portable-1',profile:saved._profile||backup.profile,world:saved}));});
 }
 async register(){
  this.bindMode();if(!this.supported())throw Error('NotSupportedError');
  if(!this.g.online&&!this.g.saveWorld())throw Error('LOCAL_SAVE_FAILED');
  if(!this.token){const data=await this.api('guest');if(!writeStore('online.token.'+this.mode,data.token))throw Error('LOCAL_SAVE_FAILED');this.token=data.token;}
  const options=await this.api('register-options'),publicKey={...options.options,user:{...options.options.user,id:AccountLink.bytes(options.options.user.id)},challenge:AccountLink.bytes(options.options.challenge),excludeCredentials:options.options.excludeCredentials.map(c=>({...c,id:AccountLink.bytes(c.id)}))};
  const credential=await navigator.credentials.create({publicKey});if(!credential)throw Object.assign(Error(),{name:'NotAllowedError'});
  const code=this.info?.linked?null:AccountLink.code();if(code)this.store('recovery',code);
  this.info=(await this.api('register-verify',{id:options.id,response:AccountLink.response(credential),recoveryCode:code})).account;
  if(code){this.recoveryCode=code;this.meta={id:this.info.id,revision:0,owner:this.g.profile.owner,auto:!this.info.cloud};this.store('link',this.meta);}
  this.message='連携しました。';if(this.meta?.auto&&!this.g.online)await this.upload(true);
 }
 async signIn(reauth=false){
  const options=await this.api('login-options',{},null),publicKey={...options.options,challenge:AccountLink.bytes(options.options.challenge)};
  const credential=await navigator.credentials.get({publicKey});if(!credential)throw Object.assign(Error(),{name:'NotAllowedError'});
  const result=await this.api('login-verify',{id:options.id,response:AccountLink.response(credential)},null);
  if(reauth){if(result.account.id!==this.info?.id)throw Error('AUTH_FAILED');this.info=(await this.api('reauth',{proof:result.proof})).account;this.message='本人確認ができました。';}
  else this.proposal=result;
 }
 async newCode(){const code=AccountLink.code();this.store('recovery',code);await this.api('recovery-code',{code});this.recoveryCode=code;this.message='以前の復旧コードは無効になりました。新しいコードを保存してください。';}
 safeSwitch(){
  const g=this.g;if(g.saving||g.importing||g.starting||g.ui?.talkFan?.recognition||g.commandBuffer?.length)throw Error('WAIT_FOR_SAFE_POINT');
  if(g.screen==='game'&&(!g.online||g.live?.ready)&&!safePlayer(g.snapshot?.player,g.snapshot,g.snapshot?.t||0))throw Error('WAIT_FOR_SAFE_POINT');
 }
 backup(){
  if(!this.g.online&&!this.g.blockSave&&!this.g.saveWorld())throw Error('LOCAL_SAVE_FAILED');
  this.store('previous',{raw:localStorage.getItem(STORAGE_PREFIX+'world4.'+this.mode),profile:this.g.profile,token:this.token,link:this.meta,wasOnline:this.g.online});
 }
 async activate(kind){
  this.safeSwitch();this.backup();
  const pending={...this.proposal,kind,token:AccountLink.secret(),recoveryCode:this.proposal.recovery?AccountLink.code():null};
  this.store('pending',pending);await this.finish(pending);
 }
 async finish(pending){
  this.safeSwitch();let active;
  try{active=await this.api('status',{},pending.token);}catch(e){if(e.status!==401)throw e;}
  if(!active?.linked)active=(await this.api('activate',{proof:pending.proof,token:pending.token,recoveryCode:pending.recoveryCode})).account;
  if(active.id!==pending.account.id)throw Error('AUTH_FAILED');
  let raw,sim,profile;
  if(pending.kind==='offline'){
   const {cloud}=await this.api('cloud-load',{},pending.token);if(!cloud)throw Error('INVALID_SAVE');
   try{const saved=JSON.parse(cloud.raw);sim=Simulation.restore(saved);profile={...this.g.profile,...saved._profile,online:false,settingsVersion:5};
    if(sim.mode!==this.mode||profile.mode!==this.mode||typeof profile.owner!=='string')throw Error();raw=JSON.stringify({...sim.exportState(),_profile:profile});
   }catch{throw Error('INVALID_SAVE');}
   active.cloud={...cloud,raw:undefined};
  }
  // All network and migration checks finish before the local record is replaced.
  // Preserve any progress made while a prior network/migration attempt failed.
  // Once installation starts, retries must retain the original backup instead.
  if(!pending.installing){this.backup();pending={...pending,installing:true};this.store('pending',pending);}
  if(raw)localStorage.setItem(STORAGE_PREFIX+'world4.'+this.mode,raw);
  if(!writeStore('online.token.'+this.mode,pending.token))throw Error('LOCAL_SAVE_FAILED');
  this.g.live?.disconnect();if(this.g.live)Object.assign(this.g.live,{ack:0,revision:-1,epoch:null,lease:null});this.g.online=false;this.token=this.g.token=pending.token;this.info=active;
  if(sim){this.g.sim=sim;this.g.profile=profile;this.g.saveBaseRaw=raw;this.g.blockSave=false;}
  else this.g.profile={...this.g.profile,online:pending.kind==='online'};
  this.meta={id:active.id,revision:active.cloud?.revision||0,owner:this.g.profile.owner,auto:pending.kind!=='online',savedAt:active.cloud?.updatedAt||null};
  this.store('link',this.meta);if(!this.g.saveWorld())throw Error('LOCAL_SAVE_FAILED');this.g.saveProfile();
  if(pending.recoveryCode){this.store('recovery',pending.recoveryCode);this.recoveryCode=pending.recoveryCode;}
  localStorage.removeItem(STORAGE_PREFIX+this.key('pending'));this.proposal=null;
  this.g.playerId=null;this.g.snapshot=null;this.g.seq=this.g.sim.seq;this.g.mapCache.clear();this.g.motionInterpolation?.reset();this.g.accumulator=0;
  this.g.screen='clan';this.g.makeClanPreview();this.g.ui.showClan();
  if(pending.kind==='online'&&active.online){await this.g.live.join(false);this.g.live.disconnect();}
  this.message='引き継ぎました。一族の画面から旅を再開できます。';this.g.ui.settings();
 }
 maybeSave(){
  this.bindMode();if(!this.meta?.auto||this.busy||this.syncing||document.hidden||Date.now()-this.lastSync<60000)return;
  this.upload().catch(e=>this.error(e));
 }
 async upload(force=false){
  if(this.syncing||!this.meta?.auto||this.g.online||this.g.profile.online||this.g.blockSave)return;
  if(this.meta.owner!==this.g.profile.owner){this.pauseSync();throw Error('CLOUD_CONFLICT');}
  if(force){this.syncing=true;try{if(!this.g.saveWorld())throw Error('LOCAL_SAVE_FAILED');}finally{this.syncing=false;}}
  const raw=this.g.saveBaseRaw;if(!raw||raw===this.lastUploaded)return;
  if(![...this.g.sim.players.values()].some(p=>p.owner===this.g.profile.owner)){if(force)throw Error('EMPTY_SAVE');return;}
  this.syncing=true;this.lastSync=Date.now();const mode=this.mode,token=this.token;
  try{const result=await this.api('cloud-save',{raw,revision:this.meta.revision,rules:this.g.live.client.rules});
   if(mode!==this.mode||token!==this.token)return;
   this.meta={...this.meta,revision:result.revision,savedAt:result.updatedAt};this.store('link',this.meta);this.lastUploaded=raw;
   this.message='クラウドに保存しました。';this.render(true);
  }finally{this.syncing=false;}
 }
 async logout(){
  this.safeSwitch();if(!confirm('ログアウトしますか？ この端末の記録は残ります。再連携にはパスキーか復旧コードが必要です。'))return;
  if(!this.g.online){if(!this.g.saveWorld())throw Error('LOCAL_SAVE_FAILED');await this.upload(true);}
  try{await this.api('logout');}catch(e){if(e.status!==401)throw e;}
  this.g.live?.disconnect();this.g.online=false;this.g.token=this.token=null;this.meta=null;this.info=null;this.recoveryCode=null;
  for(const name of ['link','recovery','pending'])localStorage.removeItem(STORAGE_PREFIX+this.key(name));
  localStorage.removeItem(STORAGE_PREFIX+'online.token.'+this.mode);this.g.profile.online=false;this.g.saveProfile();
  this.g.screen='clan';this.g.loadMode();this.g.profile.online=false;this.g.makeClanPreview();this.g.ui.showClan();this.message='ログアウトしました。';this.g.ui.settings();
 }
 async previousOnline(previous){
  this.safeSwitch();await this.api('status',{},previous.token);
  if(!this.g.online&&!this.g.saveWorld())throw Error('LOCAL_SAVE_FAILED');
  if(!writeStore('online.token.'+this.mode,previous.token))throw Error('LOCAL_SAVE_FAILED');
  this.g.live?.disconnect();Object.assign(this.g.live,{ack:0,revision:-1,epoch:null,lease:null});
  this.token=this.g.token=previous.token;this.meta=null;this.info=null;localStorage.removeItem(STORAGE_PREFIX+this.key('link'));
  this.g.online=false;this.g.profile={...previous.profile,online:true};this.g.saveProfile();this.g.screen='clan';
  await this.g.live.join(false);this.g.live.disconnect();this.g.makeClanPreview();this.g.ui.showClan();this.message='切り替え前の共有の旅に戻りました。';this.g.ui.settings();
 }
 download(name,data){const url=URL.createObjectURL(new Blob([data],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
