/* Narrow, validated embedded glTF 2.0 loader: indexed triangle meshes, normals, UV,
 * skin joints and weights. No external URLs, no hidden CDN or runtime dependency. */
const AssetBank={meshes:new Map(),images:{},async load(){
 const bin=Uint8Array.from(atob(VISUAL_ASSETS['village-kit.glb']),c=>c.charCodeAt(0));const view=new DataView(bin.buffer);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('Invalid village GLB');
 const n=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(bin.slice(20,20+n)));const offset=20+n+8;
 const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array};
 const accessor=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],C=types[a.componentType];if(!C)throw Error('GLB component unsupported');const len=a.count*components[a.type],start=offset+(v.byteOffset||0)+(a.byteOffset||0);if(start+len*C.BYTES_PER_ELEMENT>bin.length)throw Error('GLB accessor bounds');return new C(bin.buffer.slice(start,start+len*C.BYTES_PER_ELEMENT));};
 for(const m of json.meshes){const p=m.primitives[0],pos=accessor(p.attributes.POSITION),nor=accessor(p.attributes.NORMAL),ind=p.indices==null?Array.from({length:pos.length/3},(_,i)=>i):accessor(p.indices);const P=new Float32Array(ind.length*3),N=P.slice();for(let i=0;i<ind.length;i++){P.set(pos.subarray(ind[i]*3,ind[i]*3+3),i*3);N.set(nor.subarray(ind[i]*3,ind[i]*3+3),i*3);}const g={positions:P,normals:N,count:ind.length,radius:2};if(p.attributes.JOINTS_0!=null){const j=accessor(p.attributes.JOINTS_0),w=accessor(p.attributes.WEIGHTS_0);g.joints=new Float32Array(ind.length*4);g.weights=g.joints.slice();for(let i=0;i<ind.length;i++){g.joints.set(j.subarray(ind[i]*4,ind[i]*4+4),i*4);g.weights.set(w.subarray(ind[i]*4,ind[i]*4+4),i*4);}}
 RG_CACHE.set('gltf:'+m.name,g);this.meshes.set(m.name,g);}
 this.gltf=json;
 PlazaCraft.load();
 await Promise.all(['plaza-craft-color.png','plaza-craft-detail.png','golden-surfaces.png','material-atlas.png','detail-atlas.png','parchment.png','cloth-panel.png'].map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images[name]=im;resolve();};im.onerror=()=>reject(Error('Asset decode: '+name));im.src='data:image/png;base64,'+VISUAL_ASSETS[name];})));
 }};
