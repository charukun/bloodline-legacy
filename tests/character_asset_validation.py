#!/usr/bin/env python3
"""Validate the authored GLB without network packages or renderer assumptions."""
from pathlib import Path
import json,struct,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1]
b=(root/'public/assets/character/young-human-male-cm01.glb').read_bytes()
assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
assert len(b)==struct.unpack_from('<I',b,8)[0]
n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);off=28+n
sizes={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];start=off+v.get('byteOffset',0)+a.get('byteOffset',0);dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];num=a['count']*sizes[a['type']]
 assert start+num*np.dtype(dt).itemsize<=len(b)
 return np.frombuffer(b,dtype=dt,count=num,offset=start).reshape(a['count'],sizes[a['type']])
checks=[]
def check(name,ok,details=None):
 checks.append({'test':name,'pass':bool(ok),'details':details})
check('one shared material',len(g['materials'])==1)
check('31 correctly ordered joints',len(g['skins'][0]['joints'])==31 and all(p<i for i,p in enumerate(g['extras']['parents'])))
for lod,m in enumerate(g['meshes']):
 p=m['primitives'][0];a={k:acc(v) for k,v in p['attributes'].items()};idx=acc(p['indices']).ravel();v=a['POSITION'];w=a['WEIGHTS_0'];j=a['JOINTS_0'];nor=a['NORMAL'];faces=idx.reshape(-1,3)
 check(f'LOD{lod} finite attributes',all(np.isfinite(x).all() for x in a.values()))
 check(f'LOD{lod} valid triangle indices',idx.max()<len(v) and len(idx)%3==0)
 check(f'LOD{lod} normalized four-bone weights',np.max(np.abs(w.sum(axis=1)-1))<1e-6 and w.min()>=0)
 check(f'LOD{lod} joint indices in range',j.max()<31)
 lengths=np.linalg.norm(nor,axis=1);check(f'LOD{lod} unit normals',np.min(lengths)>.99 and np.max(lengths)<1.01,{'min':float(lengths.min()),'max':float(lengths.max())})
 check(f'LOD{lod} atlas UV bounds',a['TEXCOORD_0'].min()>=0 and a['TEXCOORD_0'].max()<=1)
 check(f'LOD{lod} GPU index optimization',idx.max()<65536)
 check(f'LOD{lod} region labels constant within triangles',all(np.all(a['_REGION'][f]==a['_REGION'][f[0]]) for f in faces))
 check(f'LOD{lod} weighted deforming vertices exist',np.count_nonzero((w>0).sum(axis=1)>1)>500)
check('LOD geometry reduction',len(acc(g['meshes'][1]['primitives'][0]['indices']))<len(acc(g['meshes'][0]['primitives'][0]['indices']))*.55)
check('asset hash matches manifest',hashlib.sha256(b).hexdigest()==json.loads((root/'public/assets/character/cm01-manifest.json').read_text())['sha256'])
print(json.dumps({'checks':checks,'passed':sum(c['pass'] for c in checks),'total':len(checks)},indent=2))
assert all(c['pass'] for c in checks),'Asset validation failed'
