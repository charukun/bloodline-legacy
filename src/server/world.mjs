import {LiveContract,clientCompatible,safePlayer} from '../live/contract.mjs';
import {engines,currentRules} from './engines/registry.mjs';
import {Accounts} from './accounts.mjs';

const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const uuid=()=>crypto.randomUUID();
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const SESSION_MS=30*86400000;

// One serialized, durable authority per environment/mode. Never acknowledge or
// stream state before its checkpoint has committed. No client-supplied player IDs.
export class GameWorld {
  constructor(ctx,env,options={}) {
    this.ctx=ctx;this.env=env;this.engines=options.engines||engines;this.target=options.rules||currentRules;
    this.contract=options.contract||LiveContract;this.now=options.now||Date.now;
    this.streams=new Map();this.tail=Promise.resolve();this.timer=null;this.tickBusy=false;this.accounts=new Accounts(this);
    this.ready=ctx.blockConcurrencyWhile(async()=>{
      const saved=await ctx.storage.get('checkpoint');
      if(saved){
        if(saved.format!==1||!this.engines[saved.rules]){this.failure='RECOVERY_REQUIRED';return;}
        try{
          this.sim=this.engines[saved.rules].restoreLive(saved.world);this.rules=saved.rules;
          this.sessions=new Map(saved.sessions);this.epoch=saved.epoch;this.revision=saved.revision;
          this.pending=saved.pending||null;
          // Reboot/redeploy fences all in-flight commands. Resume issues a fresh lease.
          for(const session of this.sessions.values())session.lease=null;
        }catch{this.failure='MIGRATION_FAILED';return;}
      }else{
        this.fresh=true;this.rules=this.target;this.sim=new this.engines[this.rules]({mode:env.WORLD_MODE||'normal'});
        this.sessions=new Map();this.epoch=uuid();this.revision=0;
      }
      try{await this.accounts.load();}catch{this.failure='ACCOUNT_RECOVERY_REQUIRED';}
      this.lastTick=this.now();
    });
  }
  serial(fn){const job=this.tail.then(fn);this.tail=job.catch(()=>{});return job;}
  checkpoint(){return {format:1,rules:this.rules,epoch:this.epoch,revision:this.revision,
    world:this.sim.exportState({live:true}),sessions:[...this.sessions],pending:this.pending||null};}
  async persist(){
    try{await this.ctx.storage.put('checkpoint',this.checkpoint());}
    catch(error){this.failure='SAVE_UNAVAILABLE';this.closeStreams('SAVE_UNAVAILABLE');throw error;}
  }
  closeStreams(code){for(const stream of this.streams.values()){try{stream.controller.enqueue(this.encode({control:code}));stream.controller.close();}catch{}}this.streams.clear();clearInterval(this.timer);this.timer=null;}
  encode(data){return new TextEncoder().encode('data: '+JSON.stringify(data)+'\n\n');}
  version(){return {...this.contract,rules:this.rules,targetRules:this.target,graceUntil:this.pending?.until||null};}
  packet(session,recovery=false){
    const snapshot=this.sim.snapshot(session.playerId,recovery?this.sim.seq:session.eventSeq||0);
    session.eventSeq=this.sim.seq;
    return {snapshot,epoch:this.epoch,revision:this.revision,ack:session.ack,lease:session.lease,
      compatibility:this.version(),recovery,updateRequired:!session.client.supportedRules?.includes(this.rules)};
  }
  allSafe(){return ![...this.streams.keys()].some(k=>this.sessions.get(k)?.busyUntil>this.now())&&
    [...this.sim.players.values()].every(p=>safePlayer(p,this.sim.getRoom(p),this.sim.time));}
  async rollForward(){
    if(this.rules===this.target){this.pending=null;return;}
    this.pending??={rules:this.target,until:this.now()+this.contract.graceMs};
    if(this.pending.rules!==this.target)this.pending={rules:this.target,until:this.now()+this.contract.graceMs};
    if(!this.allSafe())return;
    const lagging=[...this.streams.keys()].some(key=>!this.sessions.get(key)?.client.supportedRules?.includes(this.target));
    if(lagging&&this.now()<this.pending.until)return;
    const before=this.checkpoint();let next;
    try{next=this.engines[this.target].restoreLive(before.world);}catch{this.migrationFailed=true;return;}
    // Backup and replacement are one storage transaction; rollback never guesses at
    // a newer save or silently restores an older checkpoint over newer progress.
    const epoch=uuid(),updated={...before,rules:this.target,world:next.exportState({live:true}),epoch,revision:this.revision+1,pending:null};
    updated.sessions=structuredClone(before.sessions);
    for(const [,session] of updated.sessions)session.lease=null;
    const handoff=[...this.streams].map(([key,stream])=>({stream,packet:this.packet(this.sessions.get(key))}));
    await this.ctx.storage.transaction(async tx=>{await tx.put('migration-backup',before);await tx.put('checkpoint',updated);});
    for(const {stream,packet} of handoff)try{stream.controller.enqueue(this.encode(packet));}catch{}
    this.sim=next;this.rules=this.target;this.epoch=epoch;this.revision=updated.revision;
    this.sessions=new Map(updated.sessions);this.pending=null;this.closeStreams('RESYNC_REQUIRED');
  }
  startClock(){
    if(this.timer)return;this.lastTick=this.now();
    this.timer=setInterval(()=>{
      if(this.tickBusy)return;this.tickBusy=true;
      this.serial(async()=>{
        if(this.failure||!this.streams.size)return;
        const steps=Math.min(9,Math.floor((this.now()-this.lastTick)/(1000/30)));
        if(!steps)return;this.lastTick=this.now();
        for(let n=0;n<steps;n++)this.sim.tick(1/30);
        this.revision++;await this.rollForward();await this.persist();
        for(const [key,stream] of this.streams){
          // A slow reader receives a new full snapshot after reconnect; never retain
          // an unbounded queue or let one device block the shared world.
          if(stream.controller.desiredSize<=0){try{stream.controller.close();}catch{}this.streams.delete(key);continue;}
          try{stream.controller.enqueue(this.encode(this.packet(this.sessions.get(key))));}catch{this.streams.delete(key);}
        }
      }).catch(()=>{this.failure='SAVE_UNAVAILABLE';this.closeStreams('SAVE_UNAVAILABLE');})
        .finally(()=>{this.tickBusy=false;if(!this.streams.size){clearInterval(this.timer);this.timer=null;}});
    },100);
    this.timer.unref?.();
  }
  async body(request,limit=16384){
    if(!request.body)return {};
    const reader=request.body.getReader(),decoder=new TextDecoder();let text='',size=0;
    while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>limit){await reader.cancel();throw Object.assign(Error('REQUEST_TOO_LARGE'),{status:413});}
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
    try{return JSON.parse(text);}catch{throw Object.assign(Error('INVALID_REQUEST'),{status:400});}
  }
  async fetch(request){
    await this.ready;
    return this.serial(async()=>{
      try{
        if(this.failure)return reply({code:this.failure},503);
        if(this.fresh){this.sim=new this.engines[this.rules]({mode:request.headers.get('X-Bloodline-Mode')||'normal'});this.fresh=false;}
        const url=new URL(request.url),client=JSON.parse(request.headers.get('X-Bloodline-Client')||'null');
        const token=request.headers.get('X-Aerin-Session'),key=token?await digest(token):null;
        let session=key&&this.sessions.get(key);
        if(!clientCompatible(client,this.contract))return reply({code:'UPDATE_REQUIRED',compatibility:this.version(),progressProtected:!!session},426);
        if(!Array.isArray(client.supportedRules)||client.supportedRules.length>32)return reply({code:'INVALID_CLIENT'},400);
        if(url.pathname.startsWith('/api/account/'))return reply(await this.accounts.handle(request,{key,session,client}));
        if(token&&(!session||(session.expires<=this.now()&&url.pathname!=='/api/join')))return reply({code:'SESSION_EXPIRED'},401);
        if(url.pathname==='/api/join'&&request.method==='POST'){
          const body=await this.body(request);
          if(!client.supportedRules.includes(this.rules))return reply({code:'UPDATE_REQUIRED',compatibility:this.version(),progressProtected:!!session},426);
          let issued=token,sessionKey=key;
          if(!session){
            if(this.sessions.size>=200)return reply({code:'WORLD_FULL'},503);
            issued=uuid()+uuid();sessionKey=await digest(issued);
            session={owner:uuid(),ack:0,receipts:[],expires:this.now()+SESSION_MS};
          }
          const existing=this.sim.players.get(session.playerId);
          if(!existing||(body.beginLife&&!existing.alive&&existing.legacyChoice?.state!=='pending')){
            const config=body.config||{},inherit=Array.isArray(config.inherit)?config.inherit:[];
            if(inherit.some(id=>!this.sim.legacy(session.owner).archive.includes(id)))return reply({code:'INVALID_INHERITANCE'},400);
            const p=this.sim.addPlayer(uuid(),{...config,owner:session.owner,mode:this.sim.mode});session.playerId=p.id;
          }
          session.client=client;session.lease=uuid();session.expires=this.now()+SESSION_MS;session.eventSeq=this.sim.seq;session.busyUntil=body.busy?this.now()+60000:0;
          this.sessions.set(sessionKey,session);this.revision++;
          this.sim.command(session.playerId,{type:'move',x:0,z:0});
          const previous=this.streams.get(sessionKey);if(previous){try{previous.controller.enqueue(this.encode({control:'SESSION_REPLACED'}));previous.controller.close();}catch{}this.streams.delete(sessionKey);}
          await this.rollForward();await this.persist();
          session=this.sessions.get(sessionKey);
          if(!session.lease){session.lease=uuid();await this.persist();}
          return reply({token:issued,playerId:session.playerId,...this.packet(session,true)});
        }
        if(!session)return reply({code:'SESSION_REQUIRED'},401);
        if(!session.lease||request.headers.get('X-Bloodline-Lease')!==session.lease)return reply({code:'RESYNC_REQUIRED'},409);
        if(!client.supportedRules.includes(this.rules))return reply({code:'UPDATE_REQUIRED',compatibility:this.version(),progressProtected:true},426);
        if(url.pathname==='/api/presence'&&request.method==='POST'){
          const body=await this.body(request);if(typeof body.busy!=='boolean')return reply({code:'INVALID_REQUEST'},400);
          session.busyUntil=body.busy?this.now()+60000:0;await this.persist();return reply({ok:true});
        }
        if(url.pathname==='/api/events'&&request.method==='GET'){
          const old=this.streams.get(key);if(old){try{old.controller.close();}catch{}}
          const record={},streamLease=session.lease;const stream=new ReadableStream({start:controller=>{
            record.controller=controller;this.streams.set(key,record);controller.enqueue(this.encode(this.packet(session,true)));
          },cancel:()=>{if(this.streams.get(key)!==record)return;this.streams.delete(key);this.serial(async()=>{if(this.sessions.get(key)!==session||session.lease!==streamLease)return;this.sim.command(session.playerId,{type:'move',x:0,z:0});await this.persist();}).catch(()=>{});}});
          this.startClock();return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
        }
        if(url.pathname==='/api/command'&&request.method==='POST'){
          const body=await this.body(request);
          if(body.epoch!==this.epoch||body.lease!==session.lease)return reply({code:'RESYNC_REQUIRED'},409);
          if(!Number.isSafeInteger(body.sequence)||body.sequence<1||typeof body.id!=='string'||body.id.length>80)return reply({code:'INVALID_COMMAND'},400);
          const fingerprint=await digest(JSON.stringify(body.command));
          if(body.sequence<=session.ack){
            const receipt=session.receipts.find(r=>r.sequence===body.sequence&&r.id===body.id&&r.fingerprint===fingerprint);
            return receipt?reply({ack:session.ack,accepted:receipt.accepted,duplicate:true}):reply({code:'STALE_COMMAND'},409);
          }
          if(body.sequence!==session.ack+1)return reply({code:'RESYNC_REQUIRED'},409);
          if(!body.command||typeof body.command.type!=='string')return reply({code:'INVALID_COMMAND'},400);
          if(this.now()-(session.lastCommandAt||0)<35)return reply({code:'RATE_LIMITED'},429);
          const accepted=this.sim.command(session.playerId,body.command);session.lastCommandAt=this.now();
          session.ack=body.sequence;session.receipts.push({sequence:body.sequence,id:body.id,fingerprint,accepted});
          session.receipts=session.receipts.slice(-32);this.revision++;await this.persist();
          return reply({ack:session.ack,accepted});
        }
        if(url.pathname==='/api/checkpoint'&&request.method==='POST'){
          const p=this.sim.players.get(session.playerId);
          if(!safePlayer(p,this.sim.getRoom(p),this.sim.time))return reply({code:'WAIT_FOR_SAFE_POINT'},409);
          this.sim.command(p.id,{type:'move',x:0,z:0});this.revision++;await this.persist();
          return reply({saved:true,...this.packet(session,true)});
        }
        return reply({code:'NOT_FOUND'},404);
      }catch(error){return reply({code:error.status?error.message:'RECOVERY_REQUIRED'},error.status||503);}
    });
  }
}
