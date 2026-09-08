#!/usr/bin/env python3
"""Offline GLB sculpture review. CPU rasterization only; not gameplay/GPU evidence."""
from pathlib import Path
import argparse,json,struct,io
import numpy as np
from PIL import Image

def read(path,lod=0):
 raw=Path(path).read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);offset=28+n
 def acc(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']]
  return np.frombuffer(raw,dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']],count=a['count']*{'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']],offset=offset+v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],-1).astype(float)
 p=g['meshes'][lod]['primitives'][0];a={k:acc(i) for k,i in p['attributes'].items()};f=acc(p['indices']).astype(int).reshape(-1,3)
 im=g['images'][0];v=g['bufferViews'][im['bufferView']];a['atlas']=np.asarray(Image.open(io.BytesIO(raw[offset+v['byteOffset']:offset+v['byteOffset']+v['byteLength']]))).astype(float)/255
 return a,f

def unit(v):return v/np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-10)
def frame(direction):
 z=unit(np.array(direction,float));x=unit(np.cross([0.,1.,0.],z));y=np.cross(z,x);return np.array([x,y,z])
def raster(a,f,size,yaw,pitch):
 v=a['POSITION'];norm=a['NORMAL'];camera=frame([np.sin(yaw)*np.cos(pitch),np.sin(pitch),np.cos(yaw)*np.cos(pitch)])
 centre=np.array([0,1.53,0]);q=(v-centre)@camera.T;scale=size/3.48
 screen=np.c_[q[:,0]*scale+size*.5,-q[:,1]*scale+size*.51,q[:,2]]
 depth=np.full((size,size),-1e9);rgb=np.full((size,size,3),[.91,.895,.865]);light=unit(np.array([-.48,.85,.42]));atlas=a['atlas'];texh,texw=atlas.shape[:2]
 for face in f:
  if a['_REGION'][face[0],0]>=10:continue
  t=screen[face];xmin=max(0,int(np.floor(t[:,0].min())));xmax=min(size-1,int(np.ceil(t[:,0].max())));ymin=max(0,int(np.floor(t[:,1].min())));ymax=min(size-1,int(np.ceil(t[:,1].max())))
  if xmin>xmax or ymin>ymax:continue
  x,y=np.meshgrid(np.arange(xmin,xmax+1)+.5,np.arange(ymin,ymax+1)+.5)
  den=(t[1,1]-t[2,1])*(t[0,0]-t[2,0])+(t[2,0]-t[1,0])*(t[0,1]-t[2,1])
  if abs(den)<1e-10:continue
  w0=((t[1,1]-t[2,1])*(x-t[2,0])+(t[2,0]-t[1,0])*(y-t[2,1]))/den
  w1=((t[2,1]-t[0,1])*(x-t[2,0])+(t[0,0]-t[2,0])*(y-t[2,1]))/den;w2=1-w0-w1
  z=w0*t[0,2]+w1*t[1,2]+w2*t[2,2];old=depth[ymin:ymax+1,xmin:xmax+1];mask=(w0>=0)&(w1>=0)&(w2>=0)&(z>old)
  if not mask.any():continue
  w=np.stack([w0[mask],w1[mask],w2[mask]],axis=1);N=unit(w@norm[face]);uv=w@a['TEXCOORD_0'][face];colour=w@a['COLOR_0'][face,:3]
  tx=np.clip(uv[:,0]*texw,0,texw-1);ty=np.clip(uv[:,1]*texh,0,texh-1);ix=tx.astype(int);iy=ty.astype(int);dx=(tx-ix)[:,None];dy=(ty-iy)[:,None]
  tex=(atlas[iy,ix,:3]*(1-dx)+atlas[iy,np.minimum(ix+1,texw-1),:3]*dx)*(1-dy)+(atlas[np.minimum(iy+1,texh-1),ix,:3]*(1-dx)+atlas[np.minimum(iy+1,texh-1),np.minimum(ix+1,texw-1),:3]*dx)*dy
  base=np.power(tex*colour,2.2);surf=int(round(a['_SURFACE'][face[0],0]));rough=[.72,.55,.89,.92,.71,.66,.28,.33,.22,.81,.75,.91,.83,.91,.9,.74][surf]
  lam=np.maximum(0,N@light);hemi=(.42+.16*N[:,1])*(w@a['COLOR_0'][face,3]);h=unit(light+camera[2]);spec=np.power(np.maximum(0,N@h),max(4,2/rough**2))*((.12 if surf in [6,7] else .022)/rough)
  lit=base*(hemi[:,None]+lam[:,None]*np.array([.83,.77,.68]))+spec[:,None]
  out=np.clip(np.power(lit,1/2.2),0,1);old[mask]=z[mask];rgb[ymin:ymax+1,xmin:xmax+1][mask]=out
 return Image.fromarray(np.uint8(np.clip(rgb*255,0,255)))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('glb');p.add_argument('output');p.add_argument('--yaw',type=float,default=.22);p.add_argument('--pitch',type=float,default=.12);p.add_argument('--size',type=int,default=640);p.add_argument('--lod',type=int,default=0);args=p.parse_args();a,f=read(args.glb,args.lod);raster(a,f,args.size,args.yaw,args.pitch).save(args.output)
