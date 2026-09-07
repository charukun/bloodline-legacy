"""Original village material/mesh authoring. No reference-image pixels are used.
Rebuildable, seeded 512px atlases; embedded-binary glTF 2.0 modular geometry.
"""
from pathlib import Path
import numpy as np, math, json, struct, hashlib
from PIL import Image,ImageFilter,ImageDraw
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/assets'; OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(42143); N=128
y,x=np.mgrid[0:N,0:N]/N

def noise(seed):
    rr=np.random.default_rng(seed); out=np.zeros((N,N))
    for size,w in [(4,.4),(8,.24),(16,.18),(32,.10),(128,.08)]:
        a=Image.fromarray((rr.random((size,size))*255).astype('uint8')).resize((N,N),Image.Resampling.BICUBIC)
        out+=np.array(a)/255*w
    return out
A=np.zeros((512,512,4),np.uint8);B=A.copy()
for k in range(16):
    n=noise(7349+k); fine=rng.random((N,N));h=n*.25; pigment=n;rough=.8+fine*.15
    if k==0: # wool, fine alternating weave
        weave=(np.sin(x*N*math.pi)*.3+np.cos(y*N*math.pi)*.3)
        h=n*.14+weave*.09; pigment=.56+n*.16+weave*.045;rough=np.ones_like(n)*.96
    elif k in [1,7,11]:
        grain=np.sin((x*34+np.sin(y*6)*.16+np.sin(y*20)*.045)*math.pi)
        knots=np.sin(np.sqrt(((x-.63)*1.1)**2+((y-.33)*.36)**2)*90)
        h=grain*.15+n*.1+(knots*.1 if k==1 else 0);pigment=.49+grain*.09+n*.17;rough=.65+n*.25
    elif k in [2,8,9,10]:
        grains=(fine>.98)*.12; h=n*.48+grains; pigment=.32+n*.44;rough=.80+n*.18
        if k==10: h+=np.sin(x*12)*.025; pigment=.44+n*.26
    elif k==3:
        h=n*.075+np.sin(x*140)*.012;pigment=.5+n*.20;rough=.48+n*.2
    elif k==4:
        h=n*.01;pigment=np.ones_like(n)*.64;rough=n*.3+.3
    elif k==5:
        veins=np.sin(x*30+y*8);h=n*.10+veins*.012;pigment=.46+n*.28;rough=n*.12+.85
    elif k==6:
        h=n*.012;pigment=.60+n*.08;rough=.65+n*.15
    else: pigment=.5+n*.2
    nx=-np.gradient(h,axis=1)*4;ny=-np.gradient(h,axis=0)*4;nz=np.ones_like(nx)
    mag=np.sqrt(nx*nx+ny*ny+nz*nz);norm=np.stack([nx/mag,ny/mag,nz/mag],axis=-1)*.5+.5
    sy,sx=k//4*128,k%4*128
    A[sy:sy+128,sx:sx+128,:3]=(np.clip(pigment,0,1)[...,None]*255).astype('uint8')
    A[sy:sy+128,sx:sx+128,3]=(np.clip(rough,0,1)*255).astype('uint8')
    B[sy:sy+128,sx:sx+128,:3]=(norm*255).astype('uint8');B[sy:sy+128,sx:sx+128,3]=(np.clip(.80+n*.2,0,1)*255).astype('uint8')
Image.fromarray(A).save(OUT/'material-atlas.png');Image.fromarray(B).save(OUT/'detail-atlas.png')
# Hand-made-looking parchment/fabric UI textures, independent of all references.
p=np.zeros((256,256,3),np.uint8);n=np.array(Image.fromarray((noise(345)*255).astype('uint8')).resize((256,256),Image.Resampling.BICUBIC))/255
p[:]=np.clip(np.array([231,214,177])[None,None,:]+((n-.5)*22)[...,None]+(rng.random((256,256,1))-.5)*7,0,255)
Image.fromarray(p).save(OUT/'parchment.png')
f=(rng.random((128,128))*9+68).astype(np.uint8);f[::2]+=3;f[:,::2]+=3
Image.merge('RGB',(Image.fromarray(f+5),Image.fromarray(f+3),Image.fromarray(f-12))).save(OUT/'cloth-panel.png')

meshes=[]
def mesh(name,fun,nu,nv,wrapu=False):
    pts=[];uv=[]
    for v in range(nv+1):
        for u in range(nu+1):pts.append(fun(u/nu,v/nv));uv.append([u/nu,v/nv])
    pts=np.array(pts,dtype=np.float32);inds=[]
    for v in range(nv):
        for u in range(nu):
            a=v*(nu+1)+u;b=a+1;c=a+nu+2;d=a+nu+1;inds.extend([[a,c,b],[a,d,c]])
    inds=np.array(inds,np.uint16);norm=np.zeros_like(pts)
    for a,b,c in inds:
        nn=np.cross(pts[b]-pts[a],pts[c]-pts[a]);norm[[a,b,c]]+=nn
    norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-9)
    if wrapu:
        for v in range(nv+1):
            a=v*(nu+1);b=a+nu;nn=norm[a]+norm[b];nn/=max(np.linalg.norm(nn),1e-9);norm[a]=norm[b]=nn
    meshes.append((name,pts,norm,np.array(uv,np.float32),inds.flatten()))

def ball(u,v):
    lon=u*math.tau;lat=v*math.pi;r=1+.055*math.sin(lon*5+lat*3)+.035*math.cos(lon*9-lat*7)
    return [math.sin(lat)*math.sin(lon)*r,math.cos(lat)*r,math.sin(lat)*math.cos(lon)*r]
mesh('stone-sculpt',ball,12,8,True)
def canopy(u,v):
    a=u*math.tau;b=v*math.pi;r=1+.07*math.sin(a*7+b*4)+.06*math.cos(a*3-b*5)
    return [math.sin(b)*math.sin(a)*r,math.cos(b)*(.83+.05*math.sin(a*4))*r,math.sin(b)*math.cos(a)*r]
mesh('leaf-crown',canopy,14,9,True)
def pine(u,v):
    a=u*math.tau;r=(math.sin(v*math.pi*.5)**1.3)*(.97+.04*math.sin(a*9))
    return [math.sin(a)*r,.5-v+.14*math.sin(v*math.pi),math.cos(a)*r]
mesh('pine-tier',pine,16,5,True)
def tile(u,v):
    xx=(u-.5);zz=v-.5
    yy=.12*math.sin(v*math.pi)-.075*math.cos(u*math.pi*2)+.055*math.sin(v*math.pi*2)
    return [xx*(.96+.04*math.sin(v*math.pi)),yy,zz]
mesh('roof-shingle',tile,4,5)
def grass(u,v):
    a=(u-.5)*(1-v)*.4
    return [a+v*v*.25,v-.1,v*v*.16]
mesh('grass-blade',grass,2,4)
def trail(u,v):
    a=-1.75+u*2.95;r=1.-math.sin(u*math.pi)*.20*(1-v)
    return [math.sin(a)*r,math.sin(u*math.pi)*.11*(1-v),math.cos(a)*r]
mesh('arc-ribbon',trail,28,2)
def spark(u,v):return [(u-.5)*math.sin(math.pi*v)*.12,v-.5,math.sin(v*math.pi)*.026]
mesh('spark-streak',spark,2,4)
# Compact authored cloth cape with two-joint blending. Skin metadata included in GLB.
def cape(u,v):
    x=(u-.5)*(.55+v*.46);yy=1.93-v*.90;z=-.27-v*v*.23+.035*math.cos(u*math.pi*8)*v
    return[x,yy,z]
mesh('cloth-cape',cape,12,12)
blob=bytearray();views=[];access=[]
def add(arr,typ,component=5126,target=34962):
    while len(blob)%4:blob.append(0)
    view=len(views);views.append({'buffer':0,'byteOffset':len(blob),'byteLength':arr.nbytes,'target':target});blob.extend(arr.tobytes())
    a={'bufferView':view,'componentType':component,'count':len(arr),'type':typ}
    if typ=='VEC3':a['min']=arr.min(axis=0).astype(float).tolist();a['max']=arr.max(axis=0).astype(float).tolist()
    access.append(a);return len(access)-1
nodes=[];gmeshes=[]
for name,pts,norm,uv,ind in meshes:
    attrs={'POSITION':add(pts,'VEC3'),'NORMAL':add(norm,'VEC3'),'TEXCOORD_0':add(uv,'VEC2')}
    ni=len(nodes);nodes.append({'name':name,'mesh':len(gmeshes)})
    if name=='cloth-cape':
        weights=np.clip((1.93-pts[:,1])/.9,0,1);j=np.tile(np.array([0,1,0,0],np.uint16),(len(pts),1));w=np.stack([1-weights,weights,np.zeros_like(weights),np.zeros_like(weights)],axis=1).astype(np.float32)
        attrs['JOINTS_0']=add(j,'VEC4',5123);attrs['WEIGHTS_0']=add(w,'VEC4');nodes[-1]['skin']=0
    gmeshes.append({'name':name,'primitives':[{'attributes':attrs,'indices':add(ind,'SCALAR',5123,34963)}]})
basebones=len(nodes);nodes.extend([{'name':'cape-shoulders','children':[basebones+1]},{'name':'cape-hem'}])
ibm=add(np.tile(np.eye(4,dtype=np.float32).flatten(),(2,1)),'MAT4')
j={'asset':{'version':'2.0','generator':'Tsugibi original asset authoring 1.0'},'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':access,'meshes':gmeshes,'nodes':nodes,'skins':[{'joints':[basebones,basebones+1],'inverseBindMatrices':ibm,'skeleton':basebones}],'scenes':[{'nodes':list(range(basebones))+[basebones]}],'scene':0}
jb=json.dumps(j,separators=(',',':')).encode();jb+=b' ' *((-len(jb))%4);blob+=b'\0'*((-len(blob))%4)
glb=struct.pack('<III',0x46546c67,2,12+8+len(jb)+8+len(blob))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(blob),0x004e4942)+blob
(OUT/'village-kit.glb').write_bytes(glb)
(OUT/'ASSET_LICENSE.txt').write_text('These textures and meshes are original procedural artworks authored for this project. No Visual Reference pixels or third-party art are incorporated. The user may use, modify and redistribute these assets with the game. No font files are included.\n')
print('GLB',len(glb),'meshes',len(meshes),'atlases',A.shape)
