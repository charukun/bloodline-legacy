"""Compile the pinned CC0 KayKit Skeleton_Warrior GLB for the existing WebGL2 renderer.
Usage: python3 tools/enemies/prepare_asset.py /path/to/Skeleton_Warrior.glb
Requires numpy, Pillow. No Blender or network/runtime decoder dependency.
"""
import sys, json, struct, io, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
raw=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(raw).hexdigest()=='178b6fda810b814c250d8a2010c24dfd9b458b9006dd323353e620b7ff118bbe', 'Source differs from audited KayKit asset'
assert raw[:4]==b'glTF'
n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);binary=raw[n+28:]
T={5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1'};N={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def access(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];d=np.dtype(T[a['componentType']]);stride=v.get('byteStride',N[a['type']]*d.itemsize)
 out=np.ndarray((a['count'],N[a['type']]),d,buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(stride,d.itemsize)).copy()
 if a.get('normalized'):out=out/np.iinfo(d).max
 return out
v=g['bufferViews'][g['images'][0]['bufferView']];im=np.asarray(Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])).convert('RGB'))/255
skin=g['skins'][0];keep_joints=skin['joints'][:23];joint_map={i:i for i in range(23)}
# Keep the deform hierarchy and hand sockets; exclude unused IK controls.
keep_nodes=sorted(set(keep_joints)|{51});remap={i:j for j,i in enumerate(keep_nodes)}
new={'asset':{'version':'2.0','generator':'Bloodline Legacy enemy compiler 1','copyright':'Kay Lousberg — CC0 1.0; Bloodline Legacy adaptations'},'scene':0,'scenes':[{'nodes':[remap[51]]}],'nodes':[], 'meshes':[], 'skins':[], 'animations':[], 'materials':[{'name':'BL bone, leather and iron','pbrMetallicRoughness':{'metallicFactor':0,'roughnessFactor':.8}}], 'bufferViews':[],'accessors':[]}
for i in keep_nodes:
 node={k:v for k,v in g['nodes'][i].items() if k in ('name','translation','rotation','scale','matrix')}
 children=[remap[x] for x in g['nodes'][i].get('children',[]) if x in remap]
 if children:node['children']=children
 new['nodes'].append(node)
buf=bytearray()
def view(b,target=None):
 while len(buf)%4:buf.append(0)
 o=len(buf);buf.extend(b);v={'buffer':0,'byteOffset':o,'byteLength':len(b)}
 if target:v['target']=target
 new['bufferViews'].append(v);return len(new['bufferViews'])-1
def put(a,typ,ct=5126,target=None,bounds=False):
 a=np.asarray(a,dtype=T[ct]).reshape(-1,N[typ]);d={'bufferView':view(a.tobytes(),target),'componentType':ct,'count':len(a),'type':typ}
 if bounds:d.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
 new['accessors'].append(d);return len(new['accessors'])-1
attrs={k:[] for k in ['POSITION','NORMAL','COLOR_0','JOINTS_0','WEIGHTS_0','_REGION','_SURFACE']};indices=[];offset=0;source_tri=0
for m in g['meshes']:
 for p in m['primitives']:
  source_tri+=len(access(p['indices']))//3
  if 'Helmet' in m['name']:continue # Original sallet/crown authored in game, no stock helmet.
  a={k:access(v)for k,v in p['attributes'].items()};pos=a['POSITION'];uv=a['TEXCOORD_0'];count=len(pos)
  x=np.clip(np.rint(uv[:,0]*(im.shape[1]-1)).astype(int),0,im.shape[1]-1);y=np.clip(np.rint(uv[:,1]*(im.shape[0]-1)).astype(int),0,im.shape[0]-1);rgb=im[y,x]
  surface=np.where(np.max(rgb,axis=1)-np.min(rgb,axis=1)<.15,10, np.where(rgb[:,1]>.52,9,8)).astype(float)
  if 'Cloak' in m['name']:surface[:]=0;rgb=np.tile([.62,.57,.48],(count,1))*(.65+rgb.mean(axis=1)[:,None]*.55)
  if 'Eyes' in m['name']:surface[:]=4;rgb=np.tile([.43,.80,.62],(count,1))
  region=next((v for k,v in [('ArmRight',1),('ArmLeft',2),('LegRight',3),('LegLeft',4)]if k in m['name']),0)
  joints=a['JOINTS_0'].astype(int);weights=a['WEIGHTS_0'];assert not np.any((joints>=23)&(weights>.00001));joints[weights<.00001]=0
  weights=weights/weights.sum(axis=1)[:,None]
  for k,val in [('POSITION',pos),('NORMAL',a['NORMAL']),('COLOR_0',np.c_[rgb**2.2,np.ones(count)]),('JOINTS_0',joints),('WEIGHTS_0',weights),('_REGION',np.full((count,1),region)),('_SURFACE',surface[:,None])]:attrs[k].append(val)
  indices.extend((access(p['indices']).reshape(-1)+offset).tolist());offset+=count
formats={'POSITION':'VEC3','NORMAL':'VEC3','COLOR_0':'VEC4','JOINTS_0':'VEC4','WEIGHTS_0':'VEC4','_REGION':'SCALAR','_SURFACE':'SCALAR'}
a={k:put(np.concatenate(v),formats[k],5123 if k=='JOINTS_0' else 5126,34962,k=='POSITION')for k,v in attrs.items()}
new['meshes']=[{'name':'BL Sentinel','primitives':[{'attributes':a,'indices':put(indices,'SCALAR',5123,34963),'material':0,'mode':4}]}]
mesh_node=len(new['nodes']);new['nodes'].append({'name':'BL Sentinel mesh','mesh':0,'skin':0});new['scenes'][0]['nodes'].append(mesh_node)
new['skins']=[{'name':'BL Sentinel rig','joints':[remap[x] for x in keep_joints],'inverseBindMatrices':put(access(skin['inverseBindMatrices'])[:23],'MAT4')}]
clips={'Idle_Combat':'idle','Walking_A':'walk','Running_A':'run','1H_Melee_Attack_Chop':'chop','Block':'guard','Hit_A':'hit','Death_A':'death','Unarmed_Melee_Attack_Punch_A':'unarmed'}
for anim in g['animations']:
 if anim['name']not in clips:continue
 dst={'name':clips[anim['name']],'channels':[],'samplers':[]}
 for ch in anim['channels']:
  i=ch['target']['node']
  if i not in remap:continue
  s=anim['samplers'][ch['sampler']];times=access(s['input']).reshape(-1);values=access(s['output']);path=ch['target']['path'];assert s.get('interpolation','LINEAR')=='LINEAR'
  # Preserve authored keys, collapse constant tracks (IK controls already removed).
  if np.max(np.abs(values-values[0]))<1e-6:times=times[[0,-1]];values=values[[0,-1]]
  si=len(dst['samplers']);dst['samplers'].append({'input':put(times,'SCALAR',bounds=True),'output':put(values,'VEC4'if path=='rotation'else'VEC3'),'interpolation':'LINEAR'});dst['channels'].append({'sampler':si,'target':{'node':remap[i],'path':path}})
 new['animations'].append(dst)
new['extras']={'bloodlineEnemy':1,'sourceSHA256':hashlib.sha256(raw).hexdigest(),'sockets':{k:remap[next(i for i,n in enumerate(g['nodes'])if n.get('name')==v)]for k,v in {'rightHand':'handslot.r','leftHand':'handslot.l','head':'head','chest':'chest'}.items()},'regions':{'rightArm':1,'leftArm':2,'rightLeg':3,'leftLeg':4},'materialPolicy':'COLOR_0 is linear; custom _SURFACE uses existing game shading; no source texture required'}
new['buffers']=[{'byteLength':len(buf)}];j=json.dumps(new,separators=(',',':')).encode();j+=b' '*((-len(j))%4);buf+=bytes((-len(buf))%4)
out=struct.pack('<III',0x46546c67,2,28+len(j)+len(buf))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(buf),0x004e4942)+buf
path=ROOT/'public/assets/enemies/sentinel.glb';path.write_bytes(out)
stats={'sourceBytes':len(raw),'runtimeBytes':len(out),'sourceTriangles':source_tri,'triangles':len(indices)//3,'vertices':offset,'sourceBones':41,'bones':23,'sourceAnimations':len(g['animations']),'animations':list(clips.values()),'sourceTexture':'1024x1024','runtimeTextures':0,'sourcePrimitives':10,'runtimePrimitives':1,'sha256':hashlib.sha256(out).hexdigest(),'sourceSHA256':hashlib.sha256(raw).hexdigest()}
(ROOT/'public/assets/enemies/asset-report.json').write_text(json.dumps(stats,indent=2)+'\n');print(json.dumps(stats,indent=2))
