"""Original four-surface district atlas. Seeded; no reference-image pixels.
RGBA = pigment R, signed surface slopes GB, roughness A. 2 x 2 tiles, 8px gutters.
Relief is baked here, so runtime needs one atlas sample instead of two.
"""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[1]/'public/assets'
N=240
y,x=np.mgrid[0:N,0:N]/N
atlas=np.zeros((512,512,4),dtype=np.uint8)
for slot in range(4):
    rng=np.random.default_rng(83010+slot)
    cloud=np.zeros((N,N))
    for size,weight in [(3,.42),(9,.26),(24,.19),(80,.13)]:
        cloud+=np.asarray(Image.fromarray((rng.random((size,size))*255).astype('uint8')).resize((N,N),Image.Resampling.BICUBIC))/255*weight
    grain=rng.random((N,N))
    value=.61+(cloud-.5)*.40+(grain-.5)*.055
    height=cloud*.08
    rough=.88+cloud*.1
    if slot==0: # worn flagstone: mineral seams and fine chips
        vein=np.exp(-np.abs(np.sin(x*9+y*5+cloud*7))*55)
        value-=vein*.07;value+=(grain>.986)*.08
        height-=vein*.008
    elif slot==1: # masonry courses, offset joints, lime and weathered faces
        row=np.floor(y*5);u=(x*3+(row%2)*.5)%1;v=y*5%1
        joint=np.minimum(np.minimum(u,1-u)*3,np.minimum(v,1-v))
        grout=np.clip((.038-joint)/.025,0,1)
        face=np.clip((joint-.03)/.055,0,1)
        value-=grout*.25;value+=face*.06
        height=face*.15+cloud*.025
    elif slot==2: # split timber grain and knots
        grainline=np.sin(x*170+np.sin(y*11)*1.4+cloud*6)
        knot=np.exp(-((x-.38)**2*80+(y-.56)**2*32))
        value+=grainline*.063-knot*.055;rough=.73+cloud*.18
        height=cloud*.04+grainline*.002-knot*.025
    else: # slate cleavage
        value+=np.sin(y*98+cloud*9)*.033
        cleft=np.exp(-np.abs(np.sin(y*17+cloud*2))*65)
        value-=cleft*.075
        height=cloud*.035-cleft*.012
        rough=.71+cloud*.22
    # World-plane slope; bounded to keep the broad bevel normals readable.
    dy,dx=np.gradient(height)
    nx=np.clip(-dx*N*.50,-.48,.48)
    ny=np.clip(-dy*N*.50,-.48,.48)
    tile=np.stack([value,nx*.5+.5,ny*.5+.5,rough],axis=-1)
    tile=(np.clip(tile,0,1)*255).astype('uint8')
    atlas[(slot//2)*256:(slot//2+1)*256,(slot%2)*256:(slot%2+1)*256]=np.pad(tile,((8,8),(8,8),(0,0)),mode='edge')
path=OUT/'golden-surfaces.png';Image.fromarray(atlas).save(path)
(OUT/'golden-assets.json').write_text(json.dumps({'version':2,'district':'Wind-waiting square and central street','source':'tools/author_golden.py and src/world/golden-slice.js','license':'Original procedural art; user may use, modify and redistribute with the game. No third-party pixels or meshes.','atlas':{'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':[512,512],'channels':'R pigment, GB signed relief slope, A roughness','tiles':['flagstone','masonry','timber','slate']},'geometry':'Three shared native triangle meshes; no extra GLB decoder or runtime dependency.'},indent=2)+'\n')
print(path)
