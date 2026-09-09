/* Direct Web Audio playback: no HTML media element / OS transport controls.
 * Decode only the current six-second chunk and the next one. */
class GameMusicDeck {
 constructor(ctx,output,catalog,assets){
  this.ctx=ctx;this.output=output;this.catalog=catalog;this.assets=assets;
  this.id=null;this.chunks=[];this.duration=0;this.position=0;this.startedAt=null;
  this.paused=true;this.error=null;this.generation=0;this.nodes=new Map();this.buffers=new Map();
  this.decodeQueue=Promise.resolve();this.pumping=null;this.disposed=false;
 }
 get currentTime(){return Math.min(this.duration,this.position+(this.startedAt===null?0:Math.max(0,this.ctx.currentTime-this.startedAt)));}
 set currentTime(value){this.pause();this.position=Math.max(0,Math.min(this.duration,value));}
 get ended(){return this.duration>0&&this.currentTime>=this.duration-1e-5;}
 load(id){this.pause();this.id=id;this.chunks=this.catalog.get(id).chunks;this.duration=this.chunks.reduce((s,c)=>s+c.duration,0);this.position=0;this.error=null;this.buffers.clear();}
 async decode(index,ticket){
  if(this.buffers.has(index))return this.buffers.get(index);
  // Serialize even across quick mute/re-enable and track changes. Stale work is
  // discarded before decoding, and cannot retain a whole playlist of PCM.
  const job=this.decodeQueue.then(async()=>{
   if(ticket!==this.generation||this.paused||this.disposed)return null;
   if(this.buffers.has(index))return this.buffers.get(index);
   const text=atob(this.assets[this.id][index]),bytes=new Uint8Array(text.length);
   for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i);
   const buffer=await this.ctx.decodeAudioData(bytes.buffer);
   if(ticket!==this.generation||this.paused||this.disposed)return null;
   if(Math.abs(buffer.duration-this.chunks[index].duration)>2/this.ctx.sampleRate)throw Error('Music chunk length mismatch');
   this.buffers.set(index,buffer);return buffer;
  });
  this.decodeQueue=job.then(()=>{},()=>{});return job;
 }
 async fill(ticket){
  let index=this.chunks.findIndex(c=>this.currentTime<c.start+c.duration-1e-5);
  if(index<0)return;
  for(const key of this.buffers.keys())if(key<index||key>index+1)this.buffers.delete(key);
  for(let i=index;i<Math.min(this.chunks.length,index+2);i++){
   if(this.nodes.has(i))continue;
   const buffer=await this.decode(i,ticket);
   if(!buffer||ticket!==this.generation||this.paused)return;
   if(this.startedAt===null)this.startedAt=this.ctx.currentTime+.05;
   const c=this.chunks[i],when=this.startedAt+c.start-this.position,at=Math.max(this.ctx.currentTime,this.startedAt,when),offset=Math.max(0,at-when);
   const duration=Math.min(c.duration,buffer.duration)-offset;
   if(duration<=0){this.buffers.delete(i);continue;}
   const node=this.ctx.createBufferSource();node.buffer=buffer;node.connect(this.output);this.nodes.set(i,node);
   node.onended=()=>{node.disconnect();if(this.nodes.get(i)===node)this.nodes.delete(i);if(ticket===this.generation){this.buffers.delete(i);if(!this.paused)void this.pump();}};
   node.start(at,offset,duration);
  }
 }
 pump(){
  if(this.paused||this.disposed)return Promise.resolve();
  if(this.pumping?.ticket===this.generation)return this.pumping.promise;
  const ticket=this.generation;
  const promise=this.fill(ticket).catch(error=>{if(ticket===this.generation){this.pause();this.error=error;}throw error;}).finally(()=>{if(this.pumping?.ticket===ticket)this.pumping=null;});
  // Background replenishment errors are observed by CelticMusic.tick.
  promise.catch(()=>{});this.pumping={ticket,promise};return promise;
 }
 async play(){
  if(this.disposed)throw Error('Music deck disposed');
  if(!this.paused)return this.pump();
  this.paused=false;this.error=null;++this.generation;return this.pump();
 }
 pause(){
  this.position=this.currentTime;this.startedAt=null;this.paused=true;++this.generation;
  for(const node of this.nodes.values()){node.onended=null;node.stop();node.disconnect();}this.nodes.clear();
 }
 dispose(){this.pause();this.disposed=true;this.buffers.clear();}
}
