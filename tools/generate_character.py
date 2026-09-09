#!/usr/bin/env python3
"""Bloodline Legacy CM01: original, deterministic skinned character authoring.
No external model, image reference pixel, or network dependency is used.
Run with Python 3, numpy, scipy and Pillow. glTF 2.0, metre-like game units, +Y up/+Z front.
"""
from pathlib import Path
import json, math, struct, io, hashlib, subprocess, tempfile
import numpy as np
from scipy.interpolate import PchipInterpolator
from PIL import Image, ImageDraw
from character_sculpture import hair as sculpture_hair, garments as sculpture_garments
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/character';OUT.mkdir(parents=True,exist_ok=True)
TAU=math.tau
# rest positions in mesh space; parents are strictly before children
BONES=[('root',None,(0,0,0)),('pelvis','root',(0,1.16,0)),('spine','pelvis',(0,1.42,0)),('chest','spine',(0,1.74,0)),('neck','chest',(0,1.94,0)),('head','neck',(0,2.30,0)),('hair','head',(0,2.67,0)),('eye.R','head',(.145,2.365,.315)),('eye.L','head',(-.145,2.365,.315)),
 ('arm.R','chest',(.405,1.80,0)),('elbow.R','arm.R',(.405,1.435,0)),('hand.R','elbow.R',(.405,1.12,.012)),('fingers.R','hand.R',(.405,1.055,.025)),('thumb.R','hand.R',(.358,1.07,.06)),
 ('arm.L','chest',(-.405,1.80,0)),('elbow.L','arm.L',(-.405,1.435,0)),('hand.L','elbow.L',(-.405,1.12,.012)),('fingers.L','hand.L',(-.405,1.055,.025)),('thumb.L','hand.L',(-.358,1.07,.06)),
 ('thigh.R','pelvis',(.165,1.17,0)),('shin.R','thigh.R',(.165,.665,0)),('foot.R','shin.R',(.165,.145,.025)),('toe.R','foot.R',(.165,.08,.22)),
 ('thigh.L','pelvis',(-.165,1.17,0)),('shin.L','thigh.L',(-.165,.665,0)),('foot.L','shin.L',(-.165,.145,.025)),('toe.L','foot.L',(-.165,.08,.22)),
 ('mantle','chest',(0,1.84,-.15)),('mantle.tip','mantle',(-.10,1.40,-.27)),('coat.R','pelvis',(.20,1.16,0)),('coat.L','pelvis',(-.20,1.16,0))]
BI={b[0]:i for i,b in enumerate(BONES)}
def reference_proportion(p,head=False,hand=False,boot=False):
 # Rest mesh and bind joints share this authoring transform. Gameplay height,
 # collider and world position are never changed. Keep the solved leg chain.
 x,y,z=p
 if head:return np.array([x*1.43,1.83+(y-2.005)*1.28,z*1.18])
 if hand:
  centre=.405 if x>0 else -.405;fullness=np.clip((1.15-y)/.10,0,1)
  x=centre+(x-centre)*(1+.35*fullness);z=.012+(z-.012)*(1+.24*fullness);y=1.12+(y-1.12)*1.18
 if boot:
  centre=.165 if x>0 else -.165;x=centre+(x-centre)*1.15
  if y>.15:y=.15+(y-.15)*1.18
 width=1.40-.28*np.clip((y-1.16)/.64,0,1)
 return np.array([x*width,1.16+(y-1.16)*.77 if y>1.16 else y,z])
BP=np.array([reference_proportion(b[2],b[0] in ['head','hair','eye.R','eye.L'],b[0].startswith(('fingers.','thumb.'))) for b in BONES],dtype=float)
COLS=['#f3bd9d','#75432f','#eaddc1','#536042','#754934','#996448','#d2a45b','#939fa0','#ffffff','#39251d','#9d5947','#f5e8ce','#b59a66','#6c624e','#382e29','#db947d']
ROUGH=[.72,.55,.89,.92,.71,.66,.28,.33,.22,.81,.75,.91,.83,.91,.90,.74]
METAL=[0,0,0,0,0,0,.75,.83,0,0,0,0,0,0,0,0]
def rgb(s):return np.array([int(s[i:i+2],16) for i in (1,3,5)],float)
def make_atlas():
 n=512;tile=n//4;yy,xx=np.mgrid[0:tile,0:tile];u=xx/(tile-1);v=yy/(tile-1)
 rng=np.random.default_rng(12504);base=np.zeros((n,n,4),np.uint8);orm=np.zeros_like(base);normal=np.zeros_like(base)
 for k,c in enumerate(COLS):
  noise=rng.normal(0,1,(tile,tile));f=np.ones((tile,tile))
  if k in [2,3,11,12,13]:f+=.012*np.sin(xx*1.5)*np.cos(yy*1.52)+.012*noise+.027*np.sin(u*TAU)
  elif k in [4,5]:f+=.017*noise+.027*np.cos(u*TAU*3)*np.sin(v*TAU*4)
  elif k==1:f+=.070*np.sin(u*TAU*5)+.055*np.sin(u*TAU*11+v*.6)+.035*(1-v)
  elif k in [6,7]:f+=.022*noise+.045*np.sin(u*TAU)
  elif k==0:f+=.012*np.sin(v*math.pi)+.002*noise
  else:f+=.003*noise
  a=np.ones((tile,tile,4))*255;a[:,:,:3]=np.clip(rgb(c)[None,None,:]*f[:,:,None],0,255)
  # Eyes: atlas tile is an iris, with the lower amber sector and dark upper lid reflected in its pigment.
  if k==8:
   dx=(u-.5)*2;dy=(v-.5)*2;r=np.sqrt(dx*dx+dy*dy);ang=np.arctan2(dy,dx)
   col=np.zeros((tile,tile,3));lit=np.clip(.48+.50*dy,0,1);streak=.5+.5*np.cos(ang*53+r*15)
   for z,(top,bot) in enumerate([(43,151),(23,80),(16,37)]):col[:,:,z]=top+(bot-top)*lit+streak*7
   outer=np.clip((r-.77)/.20,0,1);col=col*(1-outer[:,:,None])+np.array([40,33,26])*outer[:,:,None]
   pupil=np.clip((.53-r)/.07,0,1);col=col*(1-pupil[:,:,None])+np.array([22,14,12])*pupil[:,:,None]
   hl=np.exp(-(((dx+.31)/.19)**2+((dy+.34)/.23)**2)*2);col=col*(1-hl[:,:,None])+np.array([253,245,221])*hl[:,:,None]
   hl2=np.exp(-(((dx-.36)/.065)**2+((dy-.35)/.065)**2)*2)*.65;col=col*(1-hl2[:,:,None])+np.array([230,226,158])*hl2[:,:,None]
   a[:,:,:3]=np.clip(col,0,255)
  sl=(slice((k//4)*tile,(k//4+1)*tile),slice((k%4)*tile,(k%4+1)*tile))
  base[sl]=a.astype(np.uint8)
  o=np.ones((tile,tile,4))*255;o[:,:,0]=255;o[:,:,1]=np.clip((ROUGH[k]+noise*.008)*255,0,255);o[:,:,2]=METAL[k]*255;orm[sl]=o.astype(np.uint8)
  norm=np.ones((tile,tile,4))*255;norm[:,:,0]=128;norm[:,:,1]=128;norm[:,:,2]=255
  if k in [2,3,11,12,13]:norm[:,:,0]=128+np.sin(xx*1.5)*4;norm[:,:,1]=128+np.sin(yy*1.52)*4
  if k in [4,5]:norm[:,:,0]=128+noise*2;norm[:,:,1]=128+np.roll(noise,1,0)*2
  if k==1:norm[:,:,0]=128+np.sin(u*TAU*11)*3
  normal[sl]=np.clip(norm,0,255).astype(np.uint8)
 for name,a in [('base',base),('orm',orm),('normal',normal)]:
  # Encode completely in memory, verify decoding, then replace the companion.
  stream=io.BytesIO();Image.fromarray(a).save(stream,format='PNG',optimize=True);payload=stream.getvalue()
  decoded=Image.open(io.BytesIO(payload));decoded.load();assert decoded.size==(n,n)
  target=OUT/f'cm01-{name}.png';temp=target.with_suffix('.png.tmp');temp.write_bytes(payload);temp.replace(target)

HEAD_ROWS=np.array([(2.005,0,.024,.075,.075),(2.045,0,.023,.164,.148),(2.103,0,.014,.242,.207),(2.199,0,.003,.310,.267),(2.285,0,-.005,.336,.287),(2.389,0,-.015,.339,.299),(2.50,0,-.026,.340,.305),(2.608,0,-.045,.314,.289),(2.69,0,-.052,.247,.22),(2.735,0,-.053,.133,.130),(2.75,0,-.051,.028,.029)])
HEAD_IP=PchipInterpolator(HEAD_ROWS[:,0],HEAD_ROWS[:,1:],axis=0)
def head_front(x,y):
 cx,cz,rx,rz=HEAD_IP(np.clip(y,2.005,2.75));front=math.sqrt(max(.0,1-((x-cx)/rx)**2));z=cz+rz*front
 z+=.052*math.exp(-(x/.047)**2-((y-2.265)/.045)**2)*front**8
 z+=.020*math.exp(-(x/.045)**2-((y-2.344)/.10)**2)*front**8
 z-=.018*math.exp(-((abs(x)-.146)/.091)**4-((y-2.367)/.063)**4)*front**4
 z+=.010*math.exp(-((abs(x)-.20)/.10)**2-((y-2.242)/.065)**2)*front**4
 return float(z)

class Mesh:
 def __init__(self,lod=0):self.v=[];self.f=[];self.uv=[];self.color=[];self.joints=[];self.weights=[];self.region=[];self.surf=[];self.lod=lod;self.parts=[];self.normal_hints=[]
 def steps(self,n,minimum=3):return max(minimum,int(n*(.30 if self.lod else .65)))
 def add(self,verts,faces,uvs,tile,weights,region=0,color=None,name='',normals=None):
  start=len(self.v);verts=np.asarray(verts,float);faces=np.asarray(faces,int)
  if name in ['eye socket rim','almond eye white','hazel iris']:
   c=verts[0].copy();bulge={'eye socket rim':.022,'almond eye white':.021,'hazel iris':.008}[name];base={'eye socket rim':.002,'almond eye white':.006,'hazel iris':.025}[name]
   zmin=c[2]-bulge
   for p in verts:p[2]=head_front(p[0],p[1])+base+(p[2]-zmin)
  if name in ['traveller pouch','pouch flap','pouch clasp']:
   verts[:,2]+=.12;verts[:,0]*=-1

  # Weight and pigment authoring stay in the original coordinate system.
  # Transform all head surfaces together so eyes, ears and hair remain seated.
  hand=name.startswith(('palm ','finger ','opposed thumb '));boot=name.startswith(('sculpted boot ','rolled boot cuff ','crossed boot lace','layered sole ','boot toe seam'))
  self.v.extend([reference_proportion(p,region==1,hand,boot) for p in verts]);self.f.extend(faces+start)
  if normals is None:self.normal_hints.extend([[0,0,0]]*len(verts))
  else:
   for p,n in zip(verts,normals):
    scale=np.array([1.43,1.28,1.18]) if region==1 else np.array([1.40-.28*np.clip((p[1]-1.16)/.64,0,1),.77 if p[1]>1.16 else 1,1]);nn=n/scale;self.normal_hints.append(nn/max(np.linalg.norm(nn),1e-9))
  self.uv.extend([((tile%4+.025+float(u)*.95)/4,(tile//4+.025+float(v)*.95)/4) for u,v in uvs])
  for i,p in enumerate(verts):
   wt=weights(p) if callable(weights) else {weights:1} if isinstance(weights,str) else weights
   wt={BI[k] if isinstance(k,str) else k:float(w) for k,w in wt.items() if w>1e-8};pairs=sorted(wt.items(),key=lambda q:-q[1])[:4];s=sum(w for k,w in pairs)
   assert s>0
   pairs=[(k,w/s) for k,w in pairs]+[(0,0)]*(4-len(pairs));self.joints.append([k for k,w in pairs]);self.weights.append([w for k,w in pairs]);self.region.append(region);self.surf.append(tile)
   c=np.asarray(color(p) if callable(color) else color if color is not None else [1,1,1],float);self.color.append(np.clip(c,0,1).tolist()+[1])
  self.parts.append({'name':name,'triangles':len(faces),'region':region})
 def loft(self,rows,tile,weight,region=0,seg=24,rings=15,deform=None,color=None,name=''):
  # rows: y, centreX, centreZ, half-width, half-depth; smooth anatomical cross-sections.
  rows=np.array(rows,float);rows=rows[np.argsort(rows[:,0])];seg=self.steps(seg,8);rings=self.steps(rings,4)
  ip=PchipInterpolator(rows[:,0],rows[:,1:],axis=0);verts=[];uv=[];faces=[];head_normals=[] if name=='sculpted face and cranium' else None
  for j,y in enumerate(np.linspace(rows[0,0],rows[-1,0],rings+1)):
   cx,cz,rx,rz=ip(y)
   for i in range(seg+1):
    a=i/seg*TAU
    if head_normals is not None:
     signed=a if a<=math.pi else a-TAU;a=math.copysign(math.pi*(abs(signed)/math.pi)**1.35,signed)
     def head_surface(yy,aa):
      ccx,ccz,rrx,rrz=ip(yy);q=np.array([ccx+rrx*math.sin(aa),yy,ccz+rrz*math.cos(aa)])
      return deform(q,aa,j/rings)
     eps=1e-5;dy=head_surface(y+eps,a)-head_surface(y-eps,a);da=head_surface(y,a+eps)-head_surface(y,a-eps);nn=np.cross(dy,da);head_normals.append(nn/max(np.linalg.norm(nn),1e-9))
    x=cx+rx*math.sin(a);z=cz+rz*math.cos(a);p=np.array([x,y,z]);
    if deform is not None:p=deform(p,a,j/rings)
    verts.append(p);uv.append((i/seg,j/rings))
  for j in range(rings):
   for i in range(seg):
    a=j*(seg+1)+i;b=a+seg+1;faces.extend([[a,b,a+1],[a+1,b,b+1]])
  # End caps; no repeated zero-area pole rings.
  for j,flip in [(0,True),(rings,False)]:
   idx=len(verts);part=np.asarray(verts[j*(seg+1):(j+1)*(seg+1)]);verts.append(part[:-1].mean(axis=0));uv.append((.5,j/rings))
   if head_normals is not None:head_normals.append([0,0,0])
   for i in range(seg):
    a=j*(seg+1)+i;faces.append([idx,a+1,a] if flip else [idx,a,a+1])
  self.add(verts,faces,uv,tile,weight,region,color,name,normals=head_normals)
 def sweep(self,points,widths,depths,tile,weight,region=0,rings=15,sides=10,normal=(0,0,1),color=None,name=''):
  p=np.array(points,float);t=np.linspace(0,1,len(p));u=np.linspace(0,1,self.steps(rings,5)+1);curve=PchipInterpolator(t,p,axis=0)(u);ww=PchipInterpolator(np.linspace(0,1,len(widths)),widths)(u);dd=PchipInterpolator(np.linspace(0,1,len(depths)),depths)(u)
  if name in ['upper eyelid','eyebrow','mouth expression','lower lip']:
   # Seat the centreline, then sweep its actual thickness. Projecting every
   # finished vertex onto the skin collapses front/back faces onto each other
   # and loses the relief of facial strokes.
   relief={'upper eyelid':.015,'eyebrow':.009,'mouth expression':.006,'lower lip':.008}[name]
   for c in curve:c[2]=head_front(c[0],c[1])+relief
  sides=self.steps(sides,6);verts=[];uv=[];faces=[];ref=np.asarray(normal,float)
  for j,c in enumerate(curve):
   d=curve[min(len(curve)-1,j+1)]-curve[max(0,j-1)];d/=max(np.linalg.norm(d),1e-8);a=np.cross(d,ref)
   if np.linalg.norm(a)<.01:a=np.cross(d,np.array([1,0,0]))
   a/=np.linalg.norm(a);b=np.cross(a,d)
   for i in range(sides+1):
    ph=i/sides*TAU;verts.append(c+a*ww[j]*math.cos(ph)+b*dd[j]*math.sin(ph));uv.append((i/sides,j/(len(curve)-1)))
  for j in range(len(curve)-1):
   for i in range(sides):
    a=j*(sides+1)+i;b=a+sides+1;faces.extend([[a,a+1,b],[a+1,b+1,b]])
  for j,flip in [(0,False),(len(curve)-1,True)]:
   k=len(verts);verts.append(curve[j]);uv.append((.5,j/(len(curve)-1)))
   for i in range(sides):a=j*(sides+1)+i;faces.append([k,a+1,a] if flip else [k,a,a+1])
  self.add(verts,faces,uv,tile,weight,region,color,name)
 def patch(self,fun,tile,weight,region=0,nu=18,nv=10,color=None,name='',cap_end=False,inward=False):
  nu=self.steps(nu,4);nv=self.steps(nv,3);verts=[];uv=[];faces=[]
  for j in range(nv+1):
   for i in range(nu+1):verts.append(fun(i/nu,j/nv));uv.append((i/nu,j/nv))
  for j in range(nv):
   for i in range(nu):a=j*(nu+1)+i;b=a+nu+1;faces.extend([[a,b,a+1],[a+1,b,b+1]])
  if cap_end:
   top=nv*(nu+1);idx=len(verts);verts.append(np.asarray(verts[top:top+nu]).mean(axis=0));uv.append((.5,1.))
   for i in range(nu):faces.append([idx,top+i,top+i+1])
  if inward:faces=[list(reversed(f)) for f in faces]
  self.add(verts,faces,uv,tile,weight,region,color,name)
 def oval(self,c,rx,ry,depth,tile,weight,region=0,tilt=0,name='',color=None):
  # Convex almond/oval surface, not a protruding sphere; UV disk samples the eye atlas.
  sides=self.steps(32,16);rings=self.steps(7,3);c=np.array(c,float);v=[c+[0,0,depth]];uv=[(.5,.5)];f=[]
  for j in range(1,rings+1):
   r=j/rings
   for i in range(sides):
    a=i/sides*TAU;dx=rx*r*math.cos(a);dy=ry*r*math.sin(a)*(abs(math.sin(a))**.22 if 'eye' in name else 1);v.append(c+[dx,dy+dx*tilt,depth*(1-r*r)]);uv.append((.5+r*math.cos(a)/2,.5-r*math.sin(a)/2))
  for i in range(sides):f.append([0,1+i,1+(i+1)%sides])
  for j in range(rings-1):
   for i in range(sides):a=1+j*sides+i;an=1+j*sides+(i+1)%sides;b=a+sides;bn=an+sides;f.extend([[a,b,an],[an,b,bn]])
  self.add(v,f,uv,tile,weight,region,color,name)

def blend_y(y,bones):
 for (ya,a),(yb,b) in zip(bones,bones[1:]):
  if y<=ya:return {a:1}
  if y<yb:
   t=(y-ya)/(yb-ya);t=t*t*(3-2*t);return {a:1-t,b:t}
 return {bones[-1][1]:1}
def body_w(p):return blend_y(p[1],[(1.20,'pelvis'),(1.48,'spine'),(1.76,'chest'),(1.94,'neck')])
def build(lod=0):
 m=Mesh(lod)
 # Tailored torso. Ring curvature defines chest, waist and the flared coat skirts.
 def coat_deform(p,a,t):
  hem=max(0,1-(p[1]-.98)/.24);p[0]+=math.sin(a)*math.cos(a*7)*.012*hem;p[2]+=math.cos(a)*math.cos(a*7)*.012*hem
  front=max(0,math.cos(a));fold=.012*math.sin(p[0]*30+p[1]*10)*math.exp(-((p[1]-1.39)/.24)**2)
  p[2]+=front**2*fold;p[1]+=.008*math.sin(a*3+.8)*hem
  # Raised front centre opening, lower sides/back.
  p[1]+=hem*.055*max(0,math.cos(a))**12
  return p
 m.loft([(.99,0,0,.318,.203),(1.10,0,0,.30,.19),(1.25,0,0,.24,.166),(1.4,0,0,.245,.171),(1.65,0,0,.323,.19),(1.78,0,0,.335,.174),(1.86,0,0,.242,.14),(1.92,0,0,.125,.11)],2,body_w,seg=32,rings=24,deform=coat_deform,color=lambda p:[.97,.97,.97] if p[2]<-.05 else [1,1,1],name='tailored ivory tunic')
 # Open collar and neck, carrying the jaw continuously.
 m.loft([(1.82,0,0,.13,.12),(1.95,0,0,.105,.105),(2.05,0,.015,.125,.11),(2.11,0,.017,.15,.12)],0,lambda p:blend_y(p[1],[(1.91,'neck'),(2.04,'head')]),seg=16,rings=8,name='neck and jaw transition')
 for side in [-1,1]:
  suffix='R' if side==1 else 'L'
  # Twin front vertical welt seams and hem piping are geometry.
  m.sweep([(side*.09,1.77,.205),(side*.065,1.52,.182),(side*.055,1.27,.180),(side*.05,1.045,.212)],[.004,.003,.004],[.003,.002,.003],11,body_w,rings=16,sides=6,name='front tunic seam')
 # Fine woven hem band, just above the cut edge.
 m.loft([(1.004,0,0,.320,.207),(1.02,0,0,.318,.207),(1.033,0,0,.317,.205)],12,{'pelvis':1},seg=36,rings=4,deform=coat_deform,name='hem border')
 # Trouser pelvis connects to the hips under the tailored hem.
 m.loft([(.96,0,-.005,.278,.15),(1.08,0,0,.265,.17),(1.21,0,0,.233,.17)],13,'pelvis',seg=24,rings=9,name='trouser seat')
 for side in [-1,1]:
  s='R' if side==1 else 'L';reg=4 if side==1 else 5;x=side*.165
  leg_w=lambda p,s=s:blend_y(p[1],[(.46,'shin.'+s),(.60,'shin.'+s),(.76,'thigh.'+s),(1.12,'thigh.'+s)])
  def pantfold(p,a,t):
   k=.008+math.exp(-((p[1]-.56)/.18)**2)*.016;off=math.sin(a*3+p[1]*23)*k;p[0]+=math.sin(a)*off;p[2]+=math.cos(a)*off;return p
  m.loft([(.415,x,.008,.102,.110),(.51,x,0,.130,.133),(.665,x,.028,.150,.143),(.81,x,-.006,.154,.150),(1.0,x,0,.151,.156),(1.145,x,0,.132,.134)],13,leg_w,reg,seg=20,rings=21,deform=pantfold,name='shaped trouser '+s)
  bootw=lambda p,s=s:blend_y(p[1],[(.13,'foot.'+s),(.255,'shin.'+s)])
  m.loft([(.027,x,.100,.146,.240),(.054,x,.109,.160,.255),(.108,x,.112,.162,.249),(.177,x,.062,.146,.188),(.21,x,.005,.108,.115),(.32,x,-.01,.103,.105),(.435,x,-.014,.116,.113),(.455,x,-.014,.119,.115)],4,bootw,reg,seg=26,rings=20,name='sculpted boot '+s)
  m.loft([(.020,x,.102,.148,.243),(.036,x,.109,.165,.258),(.066,x,.109,.163,.256)],14,'foot.'+s,reg,seg=28,rings=5,name='layered sole '+s)
  m.loft([(.375,x,-.004,.111,.115),(.415,x,-.010,.153,.150),(.490,x,-.014,.146,.148),(.508,x,-.014,.131,.131)],5,'shin.'+s,reg,seg=22,rings=5,deform=lambda p,a,t:p+np.array([.006*math.sin(a*3),.016*math.sin(a*2+.8)*math.sin(t*math.pi),.005*math.cos(a*3)]),name='rolled boot cuff '+s)
  for y in [.240,.287,.334]:
   for direction in [-1,1]:
    m.sweep([(x-direction*.060,y-.017,.099),(x,y,.127),(x+direction*.060,y+.017,.099)],[.005]*3,[.004]*3,12,'shin.'+s,reg,rings=5,sides=6,name='crossed boot lace')
  # Toe cap stitch follows the actual toe surface.
  m.sweep([(x-.12,.099,.15),(x-.077,.118,.237),(x,.128,.261),(x+.077,.118,.237),(x+.12,.099,.15)],[.004,.004,.004],[.004,.004,.004],12,'foot.'+s,reg,rings=12,sides=6,name='boot toe seam')
  # Sleeves blend to chest at the shoulder and to elbow across the rolled cuff.
  reg=2 if side==1 else 3;x=side*.405
  sleevew=lambda p,s=s:({'chest':max(0,min(.45,(p[1]-1.75)*4)),'arm.'+s:1-max(0,min(.45,(p[1]-1.75)*4))} if p[1]>1.75 else blend_y(p[1],[(1.37,'elbow.'+s),(1.50,'arm.'+s)]))
  m.loft([(1.385,x,0,.104,.109),(1.46,x,-.003,.126,.126),(1.58,x,-.004,.145,.14),(1.72,x-.018*side,0,.154,.144),(1.80,x-.035*side,0,.145,.139),(1.85,x-.07*side,0,.08,.088)],2,sleevew,reg,seg=22,rings=16,deform=lambda p,a,t:p+np.array([math.sin(a)*.007*math.sin(t*15),0,math.cos(a)*.007*math.sin(t*15)]),name='structured sleeve '+s)
  m.loft([(1.37,x,0,.111,.117),(1.40,x,0,.129,.133),(1.445,x,0,.122,.127)],11,{'arm.'+s:.62,'elbow.'+s:.38},reg,seg=24,rings=6,name='turned sleeve cuff '+s)
  m.loft([(1.115,x,.012,.061,.061),(1.20,x,.005,.070,.071),(1.30,x,0,.087,.083),(1.405,x,0,.097,.09)],0,lambda p,s=s:blend_y(p[1],[(1.115,'hand.'+s),(1.215,'elbow.'+s)]),reg,seg=22,rings=14,name='anatomical forearm '+s)
  m.loft([(1.125,x,.013,.067,.07),(1.18,x,.008,.080,.081),(1.27,x,.002,.087,.085)],4,'elbow.'+s,reg,seg=20,rings=10,name='leather wrist wrap '+s)
  m.loft([(1.198,x,.005,.083,.085),(1.224,x,.005,.084,.086)],5,'elbow.'+s,reg,seg=18,rings=3,name='wrist strap')
  # Palm / thenar mass, four individual tapered, flexed digits and a properly opposed thumb.
  m.loft([(1.014,x,.034,.057,.042),(1.05,x,.023,.066,.045),(1.096,x,.018,.065,.050),(1.145,x,.012,.053,.050)],0,'hand.'+s,reg,seg=20,rings=10,name='palm '+s)
  for k in range(4):
   xx=x+(k-1.5)*.031;length=[.080,.100,.093,.072][k]
   m.sweep([(xx,1.04,.032),(xx,1.005,.084),(xx,1.017-length*.55,.099),(xx,1.020,.042)],[.019,.020,.017,.014],[.023,.022,.018,.015],0,{'hand.'+s:.16,'fingers.'+s:.84},reg,rings=8,sides=8,name='finger '+s+str(k))
  m.sweep([(x-side*.047,1.10,.042),(x-side*.085,1.056,.074),(x-side*.071,1.015,.087),(x-side*.045,1.005,.079)],[.029,.027,.021,.015],[.027,.026,.019,.014],0,{'hand.'+s:.22,'thumb.'+s:.78},reg,rings=9,sides=10,name='opposed thumb '+s)
 # Belt follows the waist, not a floating box.
 m.loft([(1.168,0,0,.272,.198),(1.193,0,0,.274,.200),(1.278,0,0,.253,.191),(1.295,0,0,.250,.188)],4,'pelvis',seg=40,rings=8,name='belt')
 m.sweep([(.025,1.264,.193),(.136,1.264,.193),(.152,1.249,.205),(.152,1.194,.216),(.138,1.181,.218),(.032,1.181,.218),(.017,1.195,.219),(.017,1.25,.205),(.025,1.264,.193)],[.010]*9,[.009]*9,6,'pelvis',rings=30,sides=8,name='forged buckle')
 m.sweep([(.04,1.222,.22),(.09,1.222,.224),(.145,1.222,.22)],[.006]*3,[.006]*3,6,'pelvis',rings=6,sides=6,name='buckle tongue')
 m.loft([(.937,.295,.028,.073,.064),(.982,.306,.02,.111,.086),(1.157,.29,.015,.113,.09),(1.19,.271,.014,.080,.059)],5,'pelvis',seg=18,rings=12,name='traveller pouch')
 m.patch(lambda u,v:(.21+u*.18,1.188-v*.095,.061+.045*math.sin(v*math.pi/2)),4,'pelvis',nu=10,nv=6,name='pouch flap')
 m.oval((.295,1.106,.111),.014,.015,.003,6,'pelvis',name='pouch clasp')
 sculpture_garments(m,body_w,blend_y)
 for side in [-1,1]:
  m.patch(lambda u,v,s=side:(s*(.09+.135*u),1.19-v*(.205+.02*u),.179+.038*v+.008*math.sin(u*math.pi)),3,'pelvis',nu=8,nv=6,name='olive tunic facing')
 # Sculpted jaw / cheek / brow / cranium; continuous nasal bridge displacement.
 def face(p,a,t):
  front=max(0,math.cos(a));x,y,z=p
  z+=.052*math.exp(-(x/.047)**2-((y-2.265)/.045)**2)*front**8
  z+=.020*math.exp(-(x/.045)**2-((y-2.344)/.10)**2)*front**8
  # Eye sockets are recessed just behind the applied eye surfaces.
  z-=.018*math.exp(-((abs(x)-.146)/.091)**4-((y-2.367)/.063)**4)*front**4
  z+=.010*math.exp(-((abs(x)-.20)/.10)**2-((y-2.242)/.065)**2)*front**4
  return np.array([x,y,z])
 def facecolor(p):
  blush=math.exp(-((abs(p[0])-.237)/.065)**2-((p[1]-2.267)/.046)**2)*max(0,p[2])/.30
  return [1,1-.14*blush,1-.11*blush]
 m.loft(HEAD_ROWS,0,'head',1,seg=52,rings=40,deform=face,color=facecolor,name='sculpted face and cranium')
 for side in [-1,1]:
  # Ear helix with a smaller inner concha; not a ball glued to the head.
  pts=[(side*.30,2.33,-.015),(side*.367,2.359,.0),(side*.386,2.31,.017),(side*.363,2.244,.03),(side*.33,2.232,.025)]
  m.sweep(pts,[.040,.044,.039,.033,.023],[.030,.024,.024,.021,.018],0,'head',1,rings=15,sides=10,name='ear helix')
  m.oval((side*.356,2.294,.039),.030,.045,.005,15,'head',1,tilt=side*.20,name='ear concha')
  x=side*.145;y=2.365;eye='eye.R' if side==1 else 'eye.L'
  m.oval((x,y,.284),.105,.101,.022,0,eye,1,tilt=side*.1,name='eye socket rim')
  m.oval((x,y+.002,.292),.100,.095,.021,11,eye,1,tilt=side*.10,name='almond eye white')
  m.oval((x-side*.009,y-.003,.313),.066,.087,.008,8,eye,1,tilt=side*.03,name='hazel iris')
  lid=[]
  for i in range(13):
   u=i/12;a=u*math.pi;lid.append((x+.105*math.cos(a),y+.098*math.sin(a)**1.22+side*.01*math.cos(a),.296+.008*math.sin(a)))
  m.sweep(lid,[.007,.008,.004],[.004,.005,.003],9,eye,1,rings=14,sides=6,name='upper eyelid')
  m.sweep([(x-side*.064,2.478,.283),(x,2.493,.282),(x+side*.074,2.47,.260)],[.011,.014,.004],[.005,.005,.003],1,'head',1,rings=12,sides=6,name='eyebrow')
 # Mouth follows muzzle surface rather than disconnected beads.
 m.sweep([(-.070,2.160,.246),(-.041,2.145,.260),(0,2.142,.268),(.041,2.147,.260),(.068,2.163,.247)],[.003,.005,.005,.004,.002],[.003]*5,10,'head',1,rings=18,sides=6,name='mouth expression')
 m.sweep([(-.035,2.131,.253),(0,2.127,.261),(.035,2.133,.253)],[.005,.008,.003],[.004,.005,.002],0,'head',1,rings=10,sides=6,name='lower lip')
 # Organic hair under-mass with an irregular hairline (always beneath separate designed locks).
 def scalp(u,v):
  a=u*TAU;front=max(0,math.cos(a));bottom=2.24+.285*front+.035*math.sin(a*5)
  y=bottom+(2.805-bottom)*v;cy=2.414;rad=math.sqrt(max(.003,1-((y-cy)/.397)**2));x=.368*rad*math.sin(a);z=-.054+.331*rad*math.cos(a)
  return (x,y,z)
 m.patch(scalp,1,'head',1,nu=44,nv=16,color=lambda p:[.92,.92,.92],name='hair interior mass',cap_end=True)
 sculpture_hair(m)
 # Optional existing armor: visible only when the unchanged equipment state requests it.
 def plate(u,v):
  x=(u-.5)*(.58-.15*(1-v));y=1.36+v*.41;z=.194+.040*math.sin(u*math.pi)+.018*math.sin(v*math.pi);return (x,y,z)
 m.loft([(1.335,0,0,.247,.198),(1.37,0,0,.268,.211),(1.49,0,0,.282,.220),(1.65,0,0,.333,.226),(1.75,0,0,.341,.208),(1.805,0,0,.246,.174),(1.829,0,0,.149,.137)],7,body_w,10,seg=20,rings=10,name='formed equipment cuirass')
 m.loft([(1.335,0,0,.252,.203),(1.348,0,0,.260,.210),(1.363,0,0,.270,.215)],7,'spine',10,seg=28,rings=4,name='rolled cuirass lower rim')
 for side in [-1,1]:
  s='R' if side==1 else 'L'
  m.loft([(1.705,side*.418,0,.159,.15),(1.77,side*.405,-.005,.171,.165),(1.83,side*.377,-.01,.115,.119),(1.862,side*.354,-.012,.04,.043)],7,'arm.'+s,11 if side==1 else 12,seg=22,rings=10,name='equipment shoulder '+s)
 return m

def finalize(m):
 v=np.array(m.v,np.float32);f=np.array(m.f,np.uint32);n=np.zeros_like(v)
 # Wind surfaces consistently from local areas; most parametric surfaces have a meaningful exterior.
 q=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
 for k in range(3):np.add.at(n,f[:,k],q)
 n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-9)
 # Weld normals for seam duplicates with the same material/region/skin weights; never weld the real silhouette layers.
 groups={}
 for i,p in enumerate(v):
  key=tuple(np.round(p,6))+(m.surf[i],m.region[i],tuple(m.joints[i]),tuple(np.round(m.weights[i],4)))
  groups.setdefault(key,[]).append(i)
 for ids in groups.values():
  if len(ids)>1:
   a=n[ids].sum(axis=0);ll=np.linalg.norm(a)
   if ll>1e-8:n[ids]=a/ll
 # Determine whether each authored piece needs flipping from a stable centroid test.
 cursor=0;hints=np.array(m.normal_hints)
 for part in m.parts:
  fs=f[cursor:cursor+part['triangles']];ids=np.unique(fs);center=v[ids].mean(axis=0);orientation=np.sum(np.einsum('ij,ij->i',n[ids],v[ids]-center))
  # Open patches and facial decals intentionally face +Z or -Z; loft/sweep surfaces use outward normals.
  if orientation<0 and not any(k in part['name'] for k in ['mantle lining','cloak lining']):n[ids]*=-1;hints[ids]*=-1;f[cursor:cursor+part['triangles']]=fs[:,[0,2,1]]
  cursor+=part['triangles']
 has=np.linalg.norm(hints,axis=1)>.5;n[has]=hints[has]
 return {'POSITION':v,'NORMAL':n.astype(np.float32),'TEXCOORD_0':np.array(m.uv,np.float32),'COLOR_0':np.array(m.color,np.float32),'JOINTS_0':np.array(m.joints,np.uint16),'WEIGHTS_0':np.array(m.weights,np.float32),'_REGION':np.array(m.region,np.float32),'_SURFACE':np.array(m.surf,np.float32)},f.flatten()

def bake_occlusion(attrs,indices):
 # Hidden equipment must not darken the unarmoured protagonist. The bake only
 # affects ambient light, encoded in the existing COLOR_0 alpha channel.
 source=ROOT/'tools/character_ao.cpp';digest=hashlib.sha256(source.read_bytes()).hexdigest()[:12]
 exe=Path(tempfile.gettempdir())/('bloodline-character-ao-'+digest)
 if not exe.exists():subprocess.run(['g++','-O2','-std=c++17',str(source),'-o',str(exe)],check=True)
 faces=indices.reshape(-1,3);faces=faces[attrs['_REGION'][faces[:,0]]<10]
 payload=struct.pack('<II',len(attrs['POSITION']),len(faces))+attrs['POSITION'].astype('<f4').tobytes()+attrs['NORMAL'].astype('<f4').tobytes()+faces.astype('<u4').tobytes()
 out=subprocess.run([str(exe)],input=payload,stdout=subprocess.PIPE,check=True).stdout
 ao=np.frombuffer(out,dtype='<f4');assert len(ao)==len(attrs['POSITION']) and np.isfinite(ao).all()
 attrs['COLOR_0'][:,3]=ao

def export(lods):
 data=bytearray();g={'asset':{'version':'2.0','generator':'Bloodline Legacy CM01 original parametric sculpture','copyright':'Original project asset; authored for Bloodline Legacy, 2026'},'scene':0,'scenes':[{'nodes':[0,len(BONES)]}],'nodes':[],'meshes':[],'skins':[],'materials':[],'textures':[],'images':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],'buffers':[],'bufferViews':[],'accessors':[]}
 def view(blob,target=None):
  while len(data)%4:data.extend(b'\0')
  start=len(data);data.extend(blob);v={'buffer':0,'byteOffset':start,'byteLength':len(blob)}
  if target:v['target']=target
  g['bufferViews'].append(v);return len(g['bufferViews'])-1
 def access(a,typ,target=None):
  a=np.ascontiguousarray(a);a=a.astype(a.dtype.newbyteorder('<'));bv=view(a.tobytes(),target);ct={np.dtype('float32'):5126,np.dtype('uint16'):5123,np.dtype('uint32'):5125}[a.dtype]
  d={'bufferView':bv,'componentType':ct,'count':len(a),'type':typ}
  if typ=='VEC3' and target==34962:d.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
  g['accessors'].append(d);return len(g['accessors'])-1
 for name,parent,pos in BONES:
  i=BI[name];n={'name':name,'translation':(BP[i]-(BP[BI[parent]] if parent else 0)).tolist()};ch=[j for j,b in enumerate(BONES) if b[1]==name]
  if ch:n['children']=ch
  g['nodes'].append(n)
 for k,name in enumerate(['base','orm','normal']):
  bv=view((OUT/f'cm01-{name}.png').read_bytes());g['images'].append({'name':'cm01-'+name,'mimeType':'image/png','bufferView':bv});g['textures'].append({'source':k,'sampler':0})
 g['materials']=[{'name':'CM01 shared atlas / skin hair cloth leather metal','pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicRoughnessTexture':{'index':1},'metallicFactor':1,'roughnessFactor':1},'normalTexture':{'index':2,'scale':.25},'occlusionTexture':{'index':1},'doubleSided':True}]
 ibm=np.tile(np.eye(4),(len(BONES),1,1));ibm[:,:3,3]=-BP;g['skins']=[{'name':'CM01 articulated skeleton','joints':list(range(len(BONES))),'skeleton':0,'inverseBindMatrices':access(ibm.transpose(0,2,1).reshape(-1,16).astype(np.float32),'MAT4')}]
 stats=[]
 for i,m in enumerate(lods):
  attrs,ind=finalize(m);bake_occlusion(attrs,ind);attributes={k:access(a,('SCALAR' if a.ndim==1 else {2:'VEC2',3:'VEC3',4:'VEC4'}[a.shape[1]]),34962) for k,a in attrs.items()}
  idx=access(ind.astype(np.uint16 if len(attrs['POSITION'])<65536 else np.uint32),'SCALAR',34963)
  g['meshes'].append({'name':'CM01_LOD'+str(i),'primitives':[{'attributes':attributes,'indices':idx,'material':0}],'extras':{'screenPixelThreshold':96 if i==1 else 0,'parts':m.parts}})
  stats.append({'lod':i,'vertices':len(attrs['POSITION']),'triangles':len(ind)//3,'parts':len(m.parts)})
 # The second mesh is an application LOD, not an additional visible character in ordinary glTF viewers.
 g['nodes'].append({'name':'CM01 Young Human Male','mesh':0,'skin':0,'extras':{'lodMesh':1,'scope':'local human male age >=18 and <35 only','equipmentRegions':{'10':'chest armor','11':'right pauldron','12':'left pauldron'}}})
 g['extras']={'character':'CM01','boneNames':[b[0] for b in BONES],'bindWorldPositions':BP.tolist(),'parents':[-1 if b[1] is None else BI[b[1]] for b in BONES],'lodStats':stats,'runtimeAnimation':'Distance-driven stance-locked two-bone IK; simulation clocks drive attack and hit; no simulation writes','authoredUnits':'same world units as current runtime'}
 g['buffers']=[{'byteLength':len(data)}]
 j=json.dumps(g,separators=(',',':'),ensure_ascii=True).encode();j+=b' '*((-len(j))%4);data+=b'\0'*((-len(data))%4)
 glb=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(data))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(data),b'BIN\0')+data
 (OUT/'young-human-male-cm01.glb').write_bytes(glb)
 summary={'generator':str(Path(__file__).name),'bones':len(BONES),'drawsPerPass':1,'materials':1,'atlasResolution':512,'lods':stats,'bytes':len(glb),'sha256':hashlib.sha256(glb).hexdigest()};(OUT/'cm01-manifest.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))

if __name__=='__main__':make_atlas();export([build(0),build(1)])
