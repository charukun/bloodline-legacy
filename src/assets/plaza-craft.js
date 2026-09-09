/* Separate environment import contract. Existing character GLBs/rigs are untouched.
 * Exported triangle lists, float POSITION/NORMAL/TEXCOORD_0/COLOR_0, no external URI.
 */
const PlazaCraft={
 load(){
  const encoded=VISUAL_ASSETS['plaza-craft.glb'];if(!encoded)throw Error('Missing plaza craft GLB');
  const bin=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),v=new DataView(bin.buffer);
  if(v.byteLength<28||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==bin.length||v.getUint32(16,true)!==0x4e4f534a)throw Error('Invalid plaza GLB');
  const size=v.getUint32(12,true),off=28+size;
  if(off>bin.length||v.getUint32(off-4,true)!==0x004e4942||v.getUint32(off-8,true)!==bin.length-off)throw Error('Invalid plaza BIN');
  const doc=JSON.parse(new TextDecoder().decode(bin.subarray(20,20+size)));
  const read=(index,components)=>{const a=doc.accessors[index],b=doc.bufferViews[a?.bufferView];
   if(!a||!b||a.componentType!==5126||a.type!==({2:'VEC2',3:'VEC3',4:'VEC4'}[components])||b.buffer!==0||b.byteStride||a.sparse||!Number.isInteger(a.count)||a.count<=0)throw Error('Unsupported plaza accessor');
   const start=off+(b.byteOffset||0)+(a.byteOffset||0),bytes=a.count*components*4;
   if(start%4||start<off||start+bytes>bin.length||(a.byteOffset||0)+bytes>b.byteLength)throw Error('Plaza accessor bounds');
   const out=new Float32Array(bin.buffer.slice(start,start+bytes));if(!out.every(Number.isFinite))throw Error('Nonfinite plaza geometry');return out;};
  const staged=[];
  for(const m of doc.meshes){if(!['well','cottage','well-shadow','cottage-shadow'].includes(m.name)||m.primitives.length!==1)throw Error('Unsupported plaza mesh');
   const p=m.primitives[0],a=p.attributes;if(p.mode!==4||p.indices!=null)throw Error('Unsupported plaza primitive');
   const positions=read(a.POSITION,3),normals=read(a.NORMAL,3),uv=read(a.TEXCOORD_0,2),colors=read(a.COLOR_0,4),count=positions.length/3;
   if(count%3||normals.length!==count*3||uv.length!==count*2||colors.length!==count*4)throw Error('Plaza attribute count');
   const craft=new Float32Array(count*3);for(let i=0;i<count;i++){if(uv[i*2]<0||uv[i*2]>1||uv[i*2+1]<0||uv[i*2+1]>1||colors[i*4]<0||colors[i*4]>1)throw Error('Plaza UV/AO bounds');craft.set([uv[i*2],uv[i*2+1],colors[i*4]],i*3);}
   staged.push(['craft:'+m.name,{positions,normals,craft,count,radius:6,shadowMesh:m.name.endsWith('-shadow')?null:'craft:'+m.name+'-shadow'}]);
  }
  if(staged.length!==4||new Set(staged.map(x=>x[0])).size!==4)throw Error('Missing plaza models');
  for(const [name,g]of staged)RG_CACHE.set(name,g);
 },
 paving(){
  if(RG_CACHE.has('craft:paving'))return;
  const source=rGeometry('golden:stone'),craft=new Float32Array(source.count*3);
  for(let i=0;i<source.count;i++){const x=source.positions[i*3],y=source.positions[i*3+1],z=source.positions[i*3+2];craft.set([(3*128+6+(x+.5)*115)/512,1-(128+6+(z+.5)*115)/512,y>.48?1:.82],i*3);}
  RG_CACHE.set('craft:paving',{...source,craft});
 }
};
