/* Offline-retargeted TRS. The shared CM01 selector owns the existing hit clock;
 * this decoder only supplies the compact rig's data, never simulation state. */
const TravelerClips=(()=>{
 function prepare(race,bones){
  return new Map(Object.entries(TRAVELER_CLIP_DATA).map(([name,clip])=>{
   const bytes=Uint8Array.from(atob(clip.rigs[race]),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
   if(bytes.length!==clip.frames*bones*7*2)throw Error('Traveler motion: invalid rig data');
   const keys=new Float32Array(clip.frames*bones*7);
   for(let i=0;i<keys.length;i++)keys[i]=view.getInt16(i*2,true)/(i%7<4?32767:10000);
   return [name,{duration:clip.duration,release:clip.release,contact:clip.contact,follow:clip.follow,frames:clip.frames,keys,bones}];
  }));
 }
 function sample(clip,u,q,offset,Q){
  const time=clamp(u,0,1)*(clip.frames-1),lo=Math.floor(time),hi=Math.min(lo+1,clip.frames-1),f=time-lo,stride=clip.bones*7;
  for(let i=0;i<clip.bones;i++){
   const a=lo*stride+i*7,b=hi*stride+i*7;
   q[i]=Q.slerp(clip.keys.subarray(a,a+4),clip.keys.subarray(b,b+4),f);
   const length=Math.hypot(...q[i]);q[i]=q[i].map(v=>v/length);
   for(let k=0;k<3;k++)offset[i][k]=clip.keys[a+4+k]*(1-f)+clip.keys[b+4+k]*f;
  }
 }
 return {prepare,sample};
})();
