"""Bake CC0 KayKit motion onto all four approved traveler proportions.
No geometry or rules are imported. Run: python3 tools/author_traveler_clips.py
Requires numpy/scipy; the source asset/license are shared with CM01.
"""
from pathlib import Path
import base64, json, subprocess
import numpy as np
from scipy.spatial.transform import Rotation as R, Slerp
from author_character_clips import GLB, unit, from_to, ROOT, SOURCE, SELECT

src=GLB(SOURCE); nodes=src.g['nodes']; ids={n.get('name'):i for i,n in enumerate(nodes)}
parents={ch:i for i,n in enumerate(nodes) for ch in n.get('children',[])}
mirror=np.diag([-1.,1.,1.]); identity=R.identity()
def source_pose(anim):
 tracks=[]
 if anim:
  for ch in anim['channels']:
   s=anim['samplers'][ch['sampler']];ts=src.read(s['input'])[:,0];v=src.read(s['output']);kind=ch['target']['path']
   tracks.append((ch['target']['node'],kind,ts,v,Slerp(ts,R.from_quat(v)) if kind=='rotation' and len(ts)>1 else None))
 def sample(t):
  tr=[np.array(n.get('translation',[0,0,0]),float) for n in nodes];qr=[R.from_quat(n.get('rotation',[0,0,0,1])) for n in nodes];sc=[np.array(n.get('scale',[1,1,1]),float) for n in nodes]
  for i,kind,ts,v,slerp in tracks:
   tt=np.clip(t,ts[0],ts[-1])
   if kind=='rotation':qr[i]=slerp(tt) if slerp else R.from_quat(v[0])
   else:(tr if kind=='translation' else sc)[i]=np.array([np.interp(tt,ts,v[:,k]) for k in range(3)])
  matrices={}
  def world(i):
   if i not in matrices:
    m=np.eye(4);m[:3,:3]=qr[i].as_matrix()*sc[i];m[:3,3]=tr[i];matrices[i]=world(parents[i])@m if i in parents else m
   return matrices[i]
  return {name:(mirror@world(i)[:3,3],R.from_matrix(mirror@world(i)[:3,:3]@mirror)) for name,i in ids.items()}
 return sample
rest=source_pose(None)(0)
rigs=json.loads(subprocess.check_output(['node','tools/export-traveler-rig.mjs'],cwd=ROOT))
clips={}; reports=[]
for anim in src.g['animations']:
 name=SELECT[anim['name']]
 # Traveler's distance-driven walk/run already fit its short legs. Preserve them.
 if name in ['walk','run']:continue
 duration=float(max(src.read(s['input'])[-1,0] for s in anim['samplers']));times=np.linspace(0,duration,round(duration*30)+1)
 sample=source_pose(anim);poses=[sample(t) for t in times];bakes=[]
 for rig in rigs:
  bind=np.array(rig['bind']);par=rig['parents'];body=np.array(rig['body']);n=len(bind);frames=[]
  hip=np.array([0,.49*1.5*body[1],0]);sole=bind[11,1]-.027*body[1]
  for frame_index,p in enumerate(poses):
   u=times[frame_index]/duration
   contact={'chop':.573,'diagonal':.39,'horizontal':.226}.get(name,0)
   wind=0.
   if contact:
    stops=[0,max(.04,contact-.16),contact,min(.95,contact+.32),1];values=[0,1,0,-.85,0]
    k=min(3,max(0,np.searchsorted(stops,u,side='right')-1));f=np.clip((u-stops[k])/(stops[k+1]-stops[k]),0,1);f=f*f*(3-2*f);wind=values[k]*(1-f)+values[k+1]*f
   pos=lambda k:p[k][0];rot=lambda k:p[k][1]
   q=[identity for _ in range(n)];wp=bind.copy();q[0]=R.from_euler('yx',[-.42*wind,.10*wind])*rot('hips');q[1]=R.from_euler('yx',[-.65*wind,.14*wind])*rot('chest');q[2]=R.from_euler('y',-.25*wind)*rot('head');q[15]=q[1]
   if n>16:q[16]=q[0]
   # Rotate the pelvis about its anatomical location, not the ground origin.
   wp[0]=np.array([.025*wind*body[0],-.065*abs(wind)*body[1],-.075*wind*body[2]])+hip-q[0].apply(hip)+(pos('hips')-rest['hips'][0])*np.array([.72*body[0],.90*body[1],.72*body[2]])
   for i in range(1,n):
    wp[i]=wp[par[i]]+q[par[i]].apply(bind[i]-bind[par[i]])
    if i not in [1,2,15]:q[i]=q[par[i]]
   for side,a in [('r',3),('l',6)]:
    e,h=a+1,a+2;A,E,H=[pos(k+'.'+side) for k in ['upperarm','lowerarm','wrist']]
    l1=np.linalg.norm(bind[e]-bind[a]);l2=np.linalg.norm(bind[h]-bind[e]);ratio=(l1+l2)/(np.linalg.norm(E-A)+np.linalg.norm(H-E))
    local=rot('chest').inv().apply(H-A)*ratio
    # The shirt is a volume: forearm/palm paths stay around its front/side.
    target=wp[a]+q[1].apply(local);center=np.array([0,.09*body[1],0]);radii=np.array([.36,.35,.29])*body
    def clearance(v):return np.linalg.norm((q[1].inv().apply(v-wp[1])-center)/radii)
    if clearance(target)<1.17:
     local=q[1].inv().apply(target-wp[1]);local[2]=max(local[2],.35*body[2]);target=wp[1]+q[1].apply(local)
    D=unit(target-wp[a]);dist=np.clip(np.linalg.norm(target-wp[a]),.035,l1+l2-.003);wp[h]=wp[a]+D*dist
    along=(l1*l1-l2*l2+dist*dist)/(2*dist);rad=np.sqrt(max(0,l1*l1-along*along));pole=E-A;pole=unit(pole-D*np.dot(pole,D));perp=unit(np.cross(D,pole));best=None
    for angle in [0,.2,-.2,.4,-.4,.7,-.7,1.1,-1.1,1.6,-1.6,2.2,-2.2,np.pi]:
     elbow=wp[a]+D*along+rad*(pole*np.cos(angle)+perp*np.sin(angle));points=[elbow*(1-u)+wp[h]*u for u in [0,.2,.4,.6,.8,1]]
     score=max(0,1.10-min(map(clearance,points)))*100+abs(angle)*.018
     if best is None or score<best[0]:best=(score,elbow)
    wp[e]=best[1]
    for index,source,delta,targetdir in [(a,'upperarm.'+side,bind[e]-bind[a],wp[e]-wp[a]),(e,'lowerarm.'+side,bind[h]-bind[e],wp[h]-wp[e])]:
     base=q[1]*rot('chest').inv()*rot(source)*R.from_euler('x',np.pi);q[index]=from_to(base.apply(delta),targetdir)*base
    mount=R.from_euler('z',-.06)*R.from_euler('x',np.pi-.12)
    q[h]=q[1]*rot('chest').inv()*rot('1H_Sword' if side=='r' else '1H_Sword_Offhand')*mount.inv()
   for side,ti in [('r',9),('l',12)]:
    ki,fi=ti+1,ti+2;A,K,F=[pos(k+'.'+side) for k in ['upperleg','lowerleg','foot']]
    q[ti]=from_to(bind[ki]-bind[ti],K-A);q[ki]=from_to(bind[fi]-bind[ki],F-K);q[fi]=rot('foot.'+side)*rest['foot.'+side][1].inv()
    wp[ti]=wp[0]+q[0].apply(bind[ti]);wp[ki]=wp[ti]+q[ti].apply(bind[ki]-bind[ti]);wp[fi]=wp[ki]+q[ki].apply(bind[fi]-bind[ki])
   floor=min(wp[11,1],wp[14,1])-sole;wp[:,1]-=floor
   # Keep bend reserve in short legs for collision-shortened attack steps.
   drop=(.055 if name!='ready' else .025)*body[1]
   for i in [0,1,2,3,4,5,6,7,8,15]+([16] if n>16 else []):wp[i,1]-=drop
   for ti in [9,12]:
    ki,fi=ti+1,ti+2;H=wp[0]+q[0].apply(bind[ti]);F=wp[fi].copy();F[0]+=(1 if ti==9 else -1)*.055*body[0];F[2]+=(.085 if ti==9 else -.065)*body[1];oldK=wp[ki];l1=np.linalg.norm(bind[ki]-bind[ti]);l2=np.linalg.norm(bind[fi]-bind[ki]);D=unit(F-H);dist=np.clip(np.linalg.norm(F-H),.035,l1+l2-.002);along=(l1*l1-l2*l2+dist*dist)/(2*dist);pole=unit(oldK-H-D*np.dot(oldK-H,D));K=H+D*along+pole*np.sqrt(max(0,l1*l1-along*along));F=H+D*dist
    wp[ti],wp[ki],wp[fi]=H,K,F;q[ti]=from_to(bind[ki]-bind[ti],K-H);q[ki]=from_to(bind[fi]-bind[ki],F-K)
   frame=[]
   for i in range(n):
    parent=par[i];pq=q[parent] if parent>=0 else identity
    rotation=(pq.inv()*q[i]).as_quat();offset=pq.inv().apply(wp[i]-wp[parent])-(bind[i]-bind[parent]) if parent>=0 else wp[i]
    frame.append(np.r_[rotation*32767,offset*10000])
   frames.append(frame)
  data=np.array(frames)
  for f in range(1,len(times)):
   for i in range(n):
    if np.dot(data[f-1,i,:4],data[f,i,:4])<0:data[f,i,:4]*=-1
  assert np.max(np.abs(data))<=32768
  bakes.append(base64.b64encode(np.rint(data).astype('<i2').tobytes()).decode())
 contact={'chop':.573,'diagonal':.39,'horizontal':.226}.get(name,0)
 clips[name]={'duration':duration,'contact':contact,'release':max(.04,contact-.16),'follow':min(.95,contact+.32),'frames':len(times),'rigs':bakes}
 reports.append({'name':name,'frames':len(times),'duration':duration})
output=ROOT/'src/character/traveler-clip-data.js'
output.write_text('// Generated by tools/author_traveler_clips.py; KayKit CC0, see tools/character-source/KAYKIT_LICENSE.txt.\nconst TRAVELER_CLIP_DATA='+json.dumps(clips,separators=(',',':'))+';\n')
print(json.dumps({'bytes':output.stat().st_size,'clips':reports}))
