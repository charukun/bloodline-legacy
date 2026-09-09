"""Retarget licensed KayKit clips to CM01; bake glTF local TRS, not runtime IK.

python3 tools/author_character_clips.py --source /path/to/Knight.glb
Subsequent builds can omit --source and use the small checked-in motion source.
No game rules, source character geometry or source textures are imported.
"""
from pathlib import Path
import argparse, copy, hashlib, json, struct, subprocess, sys
import numpy as np
from scipy.spatial.transform import Rotation as R, Slerp

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/character-source/kaykit-motion.glb'
OUTPUT = ROOT / 'public/assets/character/young-human-male-cm01.glb'
SELECT = {
 'Idle': 'ready', 'Walking_A': 'walk', 'Running_A': 'run',
 '1H_Melee_Attack_Chop': 'chop',
 '1H_Melee_Attack_Slice_Diagonal': 'diagonal',
 '1H_Melee_Attack_Slice_Horizontal': 'horizontal',
}

class GLB:
 def __init__(self, path):
  b = Path(path).read_bytes(); size = struct.unpack_from('<I', b, 12)[0]
  self.g = json.loads(b[20:20+size]); self.data = bytearray(b[28+size:])
 def read(self, index):
  a = self.g['accessors'][index]; v = self.g['bufferViews'][a['bufferView']]
  dtype = {5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1'}[a['componentType']]
  width = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
  return np.frombuffer(self.data, dtype=dtype, count=a['count']*width,
    offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],width).copy()
 def add(self, a, kind):
  a = np.asarray(a, dtype='<f4')
  while len(self.data)%4: self.data.append(0)
  v = len(self.g['bufferViews']); self.g['bufferViews'].append({'buffer':0,'byteOffset':len(self.data),'byteLength':a.nbytes})
  self.data.extend(a.tobytes()); i = len(self.g['accessors'])
  acc={'bufferView':v,'componentType':5126,'count':len(a),'type':kind}
  if kind=='SCALAR': acc.update(min=[float(a.min())],max=[float(a.max())])
  self.g['accessors'].append(acc); return i
 def save(self, path):
  self.g['buffers']=[{'byteLength':len(self.data)}]
  j=json.dumps(self.g,separators=(',',':')).encode(); j+=b' '*(-len(j)%4)
  data=self.data+b'\0'*(-len(self.data)%4)
  Path(path).write_bytes(struct.pack('<4sII',b'glTF',2,28+len(j)+len(data))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(data),b'BIN\0')+data)

def reduce_source(path):
 src=GLB(path); out=copy.deepcopy(src);out.data=bytearray()
 out.g={k:copy.deepcopy(src.g[k]) for k in ['asset','nodes','scenes','scene']}
 out.g.update(bufferViews=[],accessors=[],animations=[])
 for n in out.g['nodes']:
  for k in ['mesh','skin','camera']:n.pop(k,None)
 for anim in src.g['animations']:
  if anim['name'] not in SELECT:continue
  anim=copy.deepcopy(anim)
  for s in anim['samplers']:
   for k in ['input','output']:
    old=s[k]; s[k]=out.add(src.read(old),src.g['accessors'][old]['type'])
  out.g['animations'].append(anim)
 out.g['asset']['copyright']='Kay Lousberg, KayKit Adventurers 1.0, CC0. Motion-only subset; see KAYKIT_LICENSE.txt.'
 out.save(SOURCE)

def unit(v):return v/max(1e-9,np.linalg.norm(v))
def from_to(a,b):
 a,b=unit(a),unit(b);dot=np.dot(a,b)
 if dot<-.999999:return R.from_rotvec(unit(np.cross(a,[1,0,0]) if abs(a[0])<.9 else np.cross(a,[0,0,1]))*np.pi)
 q=np.r_[np.cross(a,b),1+dot];return R.from_quat(q/np.linalg.norm(q))

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source');args=parser.parse_args()
 if args.source:reduce_source(args.source)
 # Start from the canonical sculpture on every run; repeated bakes never append
 # stale animation accessors or grow the binary.
 subprocess.run([sys.executable,str(ROOT/'tools/generate_character.py')],check=True,stdout=subprocess.DEVNULL)
 src,dst=GLB(SOURCE),GLB(OUTPUT)
 nodes=src.g['nodes']; ids={n.get('name'):i for i,n in enumerate(nodes)}
 parents={ch:i for i,n in enumerate(nodes) for ch in n.get('children',[])}
 bind=np.array(dst.g['extras']['bindWorldPositions']); names=dst.g['extras']['boneNames']; par=dst.g['extras']['parents']; ni={n:i for i,n in enumerate(names)}
 mirror=np.diag([-1.,1.,1.]); identity=R.identity(); mount=R.from_euler('z',-.06)*R.from_euler('x',np.pi-.12)
 def source_pose(anim,t):
  tr=[np.array(n.get('translation',[0,0,0]),float) for n in nodes]
  qr=[R.from_quat(n.get('rotation',[0,0,0,1])) for n in nodes]
  sc=[np.array(n.get('scale',[1,1,1]),float) for n in nodes]
  if anim:
   for ch in anim['channels']:
    s=anim['samplers'][ch['sampler']];times=src.read(s['input'])[:,0];values=src.read(s['output']);p=ch['target']['path'];i=ch['target']['node'];tt=np.clip(t,times[0],times[-1])
    if p=='rotation':qr[i]=Slerp(times,R.from_quat(values))(tt) if len(times)>1 else R.from_quat(values[0])
    elif p=='translation':tr[i]=np.array([np.interp(tt,times,values[:,k]) for k in range(3)])
    elif p=='scale':sc[i]=np.array([np.interp(tt,times,values[:,k]) for k in range(3)])
  matrices={}
  def world(i):
   if i not in matrices:
    m=np.eye(4);m[:3,:3]=qr[i].as_matrix()*sc[i];m[:3,3]=tr[i]
    matrices[i]=world(parents[i])@m if i in parents else m
   return matrices[i]
  return {name:world(i) for name,i in ids.items()}
 rest=source_pose(None,0)
 def pos(p,name):return mirror@p[name][:3,3]
 def rot(p,name):return R.from_matrix(mirror@p[name][:3,:3]@mirror)
 summaries=[]; dst.g['animations']=[]
 for anim in src.g['animations']:
  name=SELECT[anim['name']]; duration=max(src.read(s['input'])[-1,0] for s in anim['samplers'])
  times=np.linspace(0,duration,round(duration*30)+1); all_q=[];all_t=[]
  for t in times:
   p=source_pose(anim,t); q=[identity for _ in names];wp=bind.copy()
   q[1]=rot(p,'hips');q[2]=rot(p,'spine');q[3]=rot(p,'chest');q[4]=rot(p,'head');q[5]=rot(p,'head')
   wp[1]=bind[1]+(pos(p,'hips')-pos(rest,'hips'))*np.array([1.,1.65,1.])
   for i in range(2,len(names)):
    wp[i]=wp[par[i]]+q[par[i]].apply(bind[i]-bind[par[i]])
    if i not in [2,3,4,5]:q[i]=q[par[i]]
   for side in ['R','L']:
    s=side.lower();a,e,h=[ni[n+'.'+side] for n in ['arm','elbow','hand']]
    A,E,H=[pos(p,n+'.'+s) for n in ['upperarm','lowerarm','wrist']]
    d1,d2=unit(E-A),unit(H-E);pole=d2-d1*np.dot(d1,d2)
    if np.linalg.norm(pole)<.03:pole=rot(p,'upperarm.'+s).apply([0,0,1])
    wp[a]=wp[3]+q[3].apply(bind[a]-bind[3]); l1=np.linalg.norm(bind[e]-bind[a]);l2=np.linalg.norm(bind[h]-bind[e])
    wp[e]=wp[a]+d1*l1
    # Match hand position to torso proportions, then solve fixed-length arms.
    # Direction-only retargeting doubles lateral reach on CM01's longer arms.
    source_local=rot(p,'chest').inv().apply(H-pos(p,'chest'))
    wp[h]=wp[3]+q[3].apply(source_local*np.array([1.4,1.7,1.65]))
    # Clearance is solved during authoring, preserving bone lengths at runtime.
    # Forearm + palm must stay outside the torso in the moving chest frame.
    chest_center=np.array([0,-.19,0]);radii=np.array([.385,.37,.285])
    def clearance(v):return np.linalg.norm((q[3].inv().apply(v-wp[3])-chest_center)/radii)
    local=q[3].inv().apply(wp[h]-wp[3]);relative=local-chest_center
    if clearance(wp[h])<1.12:
     local[2]=max(local[2],.34);wp[h]=wp[3]+q[3].apply(local)
    D=unit(wp[h]-wp[a]);length=np.clip(np.linalg.norm(wp[h]-wp[a]),.05,l1+l2-.002);wp[h]=wp[a]+D*length
    along=(l1*l1-l2*l2+length*length)/(2*length);radius=np.sqrt(max(0,l1*l1-along*along))
    pole=unit(wp[e]-wp[a]-D*np.dot(wp[e]-wp[a],D));perp=unit(np.cross(D,pole));best=None
    for angle in [0,.25,-.25,.5,-.5,.85,-.85,1.2,-1.2,1.65,-1.65,2.3,-2.3,np.pi]:
     candidate=wp[a]+D*along+radius*(pole*np.cos(angle)+perp*np.sin(angle))
     points=[candidate*(1-u)+wp[h]*u for u in [.0,.2,.4,.6,.8,1.]]
     score=max(0,1.04-min(map(clearance,points)))*100+abs(angle)*.015
     if best is None or score<best[0]:best=(score,candidate)
    wp[e]=best[1]
    # Preserve authored twist: a bend-derived frame flips 180 degrees as an
    # elbow straightens, making independently interpolated wrist tracks spin.
    for target,source,direction in [(a,'upperarm.'+s,wp[e]-wp[a]),(e,'lowerarm.'+s,wp[h]-wp[e])]:
     base=rot(p,source)*R.from_euler('x',np.pi)
     q[target]=from_to(base.apply([0,-1,0]),direction)*base
    q[h]=rot(p,'1H_Sword' if side=='R' else '1H_Sword_Offhand')*mount.inv()
    for child in [h+1,h+2]:wp[child]=wp[h]+q[h].apply(bind[child]-bind[h]);q[child]=q[h]
    ti,ki,fi,toi=[ni[n+'.'+side] for n in ['thigh','shin','foot','toe']]
    A,K,F=[pos(p,n+'.'+s) for n in ['upperleg','lowerleg','foot']]
    q[ti]=from_to(bind[ki]-bind[ti],K-A);q[ki]=from_to(bind[fi]-bind[ki],F-K)
    q[fi]=rot(p,'foot.'+s)*rot(rest,'foot.'+s).inv();q[toi]=q[fi]
    wp[ti]=wp[1]+q[1].apply(bind[ti]-bind[1]);wp[ki]=wp[ti]+q[ti].apply(bind[ki]-bind[ti]);wp[fi]=wp[ki]+q[ki].apply(bind[fi]-bind[ki]);wp[toi]=wp[fi]+q[fi].apply(bind[toi]-bind[fi])
   # Bake a grounded pelvis; the runtime only corrects actual terrain/collision.
   floor=min(wp[ni['foot.'+s]][1]-.125 for s in ['R','L']);wp[1:,1]-=floor
   # Keep knee flexion in the target's longer legs. A fully extended retarget
   # leaves no reach margin for world-space plants when the simulation lunges.
   crouch=.10 if name in ['chop','diagonal','horizontal'] else .055
   wp[1:19,1]-=crouch;wp[27:,1]-=crouch
   for side in ['R','L']:
    ti,ki,fi,toi=[ni[n+'.'+side] for n in ['thigh','shin','foot','toe']]
    old_k=wp[ki].copy();F=wp[fi].copy();H=wp[1]+q[1].apply(bind[ti]-bind[1])
    l1=np.linalg.norm(bind[ki]-bind[ti]);l2=np.linalg.norm(bind[fi]-bind[ki]);D=unit(F-H);dist=np.clip(np.linalg.norm(F-H),.05,l1+l2-.001)
    along=(l1*l1-l2*l2+dist*dist)/(2*dist);height=np.sqrt(max(0,l1*l1-along*along));pole=unit(old_k-H-D*np.dot(old_k-H,D))
    K=H+D*along+pole*height;F=H+D*dist
    wp[ti],wp[ki],wp[fi]=H,K,F;wp[toi]=F+q[fi].apply(bind[toi]-bind[fi])
    q[ti]=from_to(bind[ki]-bind[ti],K-H);q[ki]=from_to(bind[fi]-bind[ki],F-K)
   local_q=[];local_t=[]
   for i in range(len(names)):
    parent=par[i];pq=q[parent] if parent>=0 else identity
    local_q.append((pq.inv()*q[i]).as_quat());local_t.append(pq.inv().apply(wp[i]-wp[parent]) if parent>=0 else wp[i])
   all_q.append(local_q);all_t.append(local_t)
  all_q=np.asarray(all_q);all_t=np.asarray(all_t)
  # Keep quaternion signs continuous for deterministic interpolation.
  for f in range(1,len(times)):
   for i in range(len(names)):
    if np.dot(all_q[f-1,i],all_q[f,i])<0:all_q[f,i]*=-1
  # Contact markers are the forward cutting plane, not the maximum tip speed
  # (which occurs past the victim for a diagonal cut). Verified in pose review.
  contact={'chop':.573,'diagonal':.39,'horizontal':.226}.get(name,0)
  clip={'name':'cm01/'+name,'samplers':[],'channels':[],'extras':{'source':anim['name'],'contact':contact,'release':max(.04,contact-.16),'follow':min(.95,contact+.32),'duration':float(duration)}}
  at=dst.add(times,'SCALAR')
  for i in range(len(names)):
   for kind,values,typ in [('rotation',all_q[:,i],'VEC4'),('translation',all_t[:,i],'VEC3')]:
    # Static channels use two keys, avoiding needless palette work/data.
    static=np.max(np.abs(values-values[0]))<1e-5;data=values[[0,-1]] if static else values
    inp=dst.add(times[[0,-1]],'SCALAR') if static else at
    sampler=len(clip['samplers']);clip['samplers'].append({'input':inp,'output':dst.add(data,typ),'interpolation':'LINEAR'});clip['channels'].append({'sampler':sampler,'target':{'node':i,'path':kind}})
  dst.g['animations'].append(clip);summaries.append({'name':name,'duration':float(duration),'contact':contact,'frames':len(times)})
 dst.g['extras']['runtimeAnimation']='Baked glTF clips for one-handed sword CM01; original procedural fallback; terrain foot IK; presentation only'
 dst.g['extras']['motionSource']='KayKit Adventurers 1.0 / CC0; target-rig retarget and clearance: tools/author_character_clips.py'
 dst.save(OUTPUT)
 manifest=ROOT/'public/assets/character/cm01-manifest.json';m=json.loads(manifest.read_text());m.update(bytes=OUTPUT.stat().st_size,sha256=hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),clips=summaries);manifest.write_text(json.dumps(m,indent=2)+'\n')
 print(json.dumps(summaries,indent=2))

if __name__=='__main__':main()
