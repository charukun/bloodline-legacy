"""Offline authoring: shared material kit, well and woodland cottage.

python3 tools/author_plaza_craft.py
All geometry and texture patterns are original. No authoring dependency at runtime.
Coordinates in the exported GLB are game Y-up. COLOR_0.r carries baked vertex AO.
"""
import math, json, struct, hashlib, io
from PIL import Image
from scipy.spatial import ConvexHull
from scipy.spatial.transform import Rotation
import numpy as np
from scipy.ndimage import gaussian_filter
from pathlib import Path


OUT = Path(__file__).resolve().parents[1] / 'public/assets'
OUT.mkdir(parents=True, exist_ok=True)
TILE = 128
SIZE = 512
MATERIALS = [
    ('limestone', (0.69, .64, .51), .91),
    ('lime plaster', (.79, .74, .61), .96),
    ('aged oak', (.39, .27, .15), .84),
    ('end grain', (.45, .33, .20), .90),
    ('blue slate', (.28, .39, .43), .83),
    ('forged iron', (.22, .23, .21), .46),
    ('rope', (.62, .48, .28), .94),
    ('worn paving', (.72, .69, .59), .96),
    ('sage paint', (.35, .43, .32), .88),
]


def make_atlas():
    """Shared PBR inputs. Tile borders are extended, never transparent decals."""
    col = np.ones((SIZE, SIZE, 4), dtype=np.float32)
    detail = np.ones_like(col)
    detail[:, :, :3] = [.5, .5, 0]
    y, x = np.mgrid[0:TILE, 0:TILE] / TILE
    for k, (name, base, roughness) in enumerate(MATERIALS):
        rng = np.random.default_rng(k + 412)
        noise = np.zeros_like(x)
        for scale, amp in [(2, .6), (5, .24), (13, .12), (31, .04)]:
            for _ in range(3):
                angle, phase = rng.uniform(0, 6.28, 2)
                noise += np.sin((x*math.cos(angle)+y*math.sin(angle))*scale*6.28+phase)*amp/3
        if k in [2, 3, 6, 8]:
            grain = np.sin((x+.018*np.sin(y*9)+.025*noise)*180)
            if k == 3:
                grain = np.sin(np.hypot(x-.35, y-.64)*110+noise*3)
            elif k == 6:
                grain = np.sin(x*80+y*65)
            h = noise*.13+grain*.032
            tone = .92+noise*.16+grain*.048
        elif k == 4:
            seams = np.sin(y*105+noise*9)
            h = noise*.20+seams*.022
            tone = .96+noise*.17+seams*.028
        else:
            # Mineral mottling has no directional grain or repeated sine bands.
            noise = sum(gaussian_filter(rng.normal(size=x.shape), sigma, mode='wrap')*weight
                        for sigma, weight in [(9, 11), (3, 2), (.7, .12)])
            h = noise*(.07 if k==1 else .16)
            tone = .98+noise*(.09 if k==1 else .16)
        rgb = np.clip(np.array(base)[None,None,:]*tone[:,:,None],0,1)
        dx, dy = np.gradient(h)
        normal = np.stack([-dy*5, -dx*5, np.ones_like(h)],-1)
        normal /= np.linalg.norm(normal,axis=2)[:,:,None]
        row, column = divmod(k, 4)
        a = np.dstack([rgb, np.clip(roughness+noise*.025, .2,1)])
        # RG is tangent relief, B metallic. AO is baked per model vertex.
        b = np.dstack([normal[:,:,:2]*.5+.5, np.full_like(h,.78 if k==5 else 0), np.ones_like(h)])
        for dst, tile in [(col,a),(detail,b)]:
            tile[:4] = tile[4]; tile[-4:] = tile[-5]
            tile[:,:4] = tile[:,4:5]; tile[:,-4:] = tile[:,-5:-4]
            dst[row*TILE:(row+1)*TILE,column*TILE:(column+1)*TILE] = tile
    # Export bottom-origin UVs; write rows in the matching image orientation.
    for name, pixels in [('plaza-craft-color.png',col), ('plaza-craft-detail.png',detail)]:
        encoded=io.BytesIO()
        Image.fromarray(np.uint8(np.clip(pixels[::-1]*255,0,255))).save(encoded,format='PNG',optimize=True)
        data=encoded.getvalue();temporary=OUT/(name+'.tmp')
        temporary.write_bytes(data);temporary.replace(OUT/name)
        assert (OUT/name).read_bytes()==data, 'Incomplete texture write: '+name


OBJECTS=[]
class Model:
    def __init__(self,name,points,faces,mat):
        self.name=name;self.points=np.asarray(points,dtype=float);self.faces=faces;self.mat=mat
        self.center=np.zeros(3);self.matrix=np.eye(3)
        OBJECTS.append(self)


def start():
    OBJECTS.clear()


def hull_faces(points):
    hull=ConvexHull(points)
    faces=[]
    for tri,eq in zip(hull.simplices,hull.equations):
        tri=list(map(int,tri));a,b,c=np.asarray(points)[tri]
        if np.dot(np.cross(b-a,c-a),eq[:3])<0:tri.reverse()
        faces.append(tri)
    return faces


def box(name,p,size,mat,bevel=.025,rotation=0):
    dims=np.asarray(size)*.5;b=min(bevel,min(size)*.20)
    if b:
        points=[]
        for axis in range(3):
            for a in [-1,1]:
                for c in [-1,1]:
                    for d in [-1,1]:
                        q=(dims-b)*[a,c,d];q[axis]=dims[axis]*[a,c,d][axis];points.append(q)
    else:points=[dims*[a,b,c]for a in [-1,1]for b in [-1,1]for c in [-1,1]]
    obj=Model(name,points,hull_faces(points),mat);obj.center=np.asarray(p,dtype=float)
    obj.matrix=Rotation.from_rotvec([0,rotation,0]).as_matrix()
    return obj


def mesh(name,p,faces,mat,bevel=0):
    # These authored wedges/slates are convex. Preserve their outline and winding.
    return Model(name,p,hull_faces(p),mat)


def beam(name,a,b,width,mat=2,depth=None):
    obj=box(name,(np.array(a)+b)*.5,(width,math.dist(a,b),depth or width),mat,.018)
    direction=(np.array(b)-a)/math.dist(a,b);u=np.array([0,1,0]);axis=np.cross(u,direction)
    length=np.linalg.norm(axis)
    if length>1e-8:obj.matrix=Rotation.from_rotvec(axis/length*math.acos(np.clip(np.dot(u,direction),-1,1))).as_matrix()
    elif direction[1]<0:obj.matrix=Rotation.from_rotvec([math.pi,0,0]).as_matrix()
    return obj


def cylinder(name,p,radius,height,mat,vertices=12,axis=None):
    points=[(math.sin(a*math.tau/vertices)*radius,y,math.cos(a*math.tau/vertices)*radius)for y in [-height/2,height/2]for a in range(vertices)]
    obj=Model(name,points,hull_faces(points),mat);obj.center=np.asarray(p,dtype=float)
    if axis:
        direction=np.array(axis,dtype=float);direction/=np.linalg.norm(direction);u=np.array([0,1,0]);v=np.cross(u,direction);length=np.linalg.norm(v)
        if length>1e-8:obj.matrix=Rotation.from_rotvec(v/length*math.acos(np.clip(np.dot(u,direction),-1,1))).as_matrix()
    return obj


def wedge(name,a,b,inner,outer,low,high,mat):
    p=[(math.sin(t)*r,y,math.cos(t)*r)for y in [low,high]for r in [inner,outer]for t in [a,b]]
    return mesh(name,p,[],mat)



def roof(width,depth,eave,rise,rows=7):
    for side in [-1,1]:
        # Continuous decking closes the narrow gaps between slate columns.
        # Tiles alone let the scene below leak through as stippled roof pixels.
        mesh('Solid roof decking',[(x,y-d,z) for d in [0,.07] for z in [-depth/2,depth/2]
                                  for x,y in [(0,eave+rise),(side*width/2,eave)]],[],4)
        for j in range(rows):
            u0=j/rows;u1=min(1.035,(j+1.13)/rows)
            cols=max(4,round(depth/.48))
            for k in range(cols):
                z0=-depth/2+k*depth/cols;z1=z0+depth/cols-.018
                lo,hi=side*u0*width/2,side*u1*width/2
                y0=eave+rise*(1-u0)+.028*(rows-j)
                y1=eave+rise*(1-u1)+.028*(rows-j)
                t=.052
                p=[(lo,y0,z0),(hi,y1,z0),(hi,y1,z1),(lo,y0,z1),(lo,y0-t,z0),(hi,y1-t,z0),(hi,y1-t,z1),(lo,y0-t,z1)]
                mesh('Overlapping slate',p,[],4)
        beam('Eaves fascia',(side*width/2,eave-.07,-depth/2),(side*width/2,eave-.07,depth/2),.17)
        for z in [-depth/2,depth/2]:beam('Joined verge',(0,eave+rise+.12,z),(side*width/2,eave-.06,z),.15)
    beam('Ridge cap',(0,eave+rise+.23,-depth/2-.06),(0,eave+rise+.23,depth/2+.06),.19,4,.23)


def well():
    start()
    for row in range(3):
        for k in range(14):
            a=(k+row%2*.5)*math.tau/14+.015;b=a+math.tau/14-.03
            wedge('Limestone voussoir',a,b,.76,1.10,.16+row*.245,.39+row*.245,0)
    for k in range(14):
        a=k*math.tau/14+.012
        wedge('Worn coping',a,a+math.tau/14-.024,.73,1.17,.90,1.10,0)
    for side in [-1,1]:
        box('Post shoe',(side*1.20,.38,0),(.28,.46,.33),0,.04)
        box('Oak upright',(side*1.20,1.77,0),(.19,2.78,.24),2)
        beam('Knee brace',(side*1.2,2.35,0),(side*.72,2.91,0),.115)
        beam('Cross saddle',(side*1.2,2.96,-.74),(side*1.2,2.96,.74),.15)
        box('Axle bearing',(side*1.20,2.04,0),(.27,.28,.30),5,.026)
    cylinder('Windlass',(0,2.04,0),.088,2.80,2,16,(1,0,0))
    for j in range(9):
        cylinder('Coiled hemp',(-.16+j*.041,2.04,0),.113,.033,6,12,(1,0,0))
    beam('Rope',(0,2.03,.105),(0,.49,.105),.026,6)
    beam('Crank',(1.43,2.04,0),(1.43,1.70,.05),.057,5)
    cylinder('Crank handle',(1.55,1.70,.05),.052,.28,2,12,(1,0,0))
    # Hollow bucket, staves and hoops. Its shape remains visible inside the well.
    for k in range(12):
        a=k*math.tau/12
        box('Bucket stave',(.31+math.sin(a)*.20,.57,.21+math.cos(a)*.20),(.102,.34,.035),2,.004,a)
    for y in [.45,.69]:
        for k in range(12):
            a=k*math.tau/12
            box('Bucket hoop',(.31+math.sin(a)*.223,y,.21+math.cos(a)*.223),(.118,.031,.023),5,.003,a)
    for side in [-1,1]:beam('Bucket handle',(.31+side*.21,.69,.21),(.31+side*.16,.91,.21),.026,5)
    beam('Handle grip',(.15,.91,.21),(.47,.91,.21),.029,5)
    roof(2.96,2.02,2.98,.78,5)


def cottage():
    start()
    box('Plinth',(0,.21,0),(5.25,.36,4.30),0,.07)
    # An opening in the front wall, instead of a door pasted onto a solid face.
    box('Rear plaster',(0,1.71,-1.70),(4.6,2.70,.22),1,.045)
    for side in [-1,1]:box('Side plaster',(side*2.23,1.71,0),(.22,2.70,3.4),1,.04)
    box('Front pier left',(-1.47,1.71,1.70),(1.66,2.70,.22),1,.025)
    box('Front pier right',(1.59,1.71,1.70),(1.43,2.70,.22),1,.025)
    box('Door lintel',(.10,2.75,1.70),(1.48,.62,.22),1,.02)
    # Recessed oak door with visible jambs and a shallow lintel arch.
    for j in range(6):box('Door plank',(-.49+j*.22,1.41,1.62),(.208,2.13,.12),2,.008)
    for x in [-.70,.88]:box('Stone jamb',(x,1.38,1.86),(.20,2.28,.32),0,.035)
    for k in range(9):
        a=k*math.pi/8
        obj=box('Arch voussoir',(.09+math.cos(a)*.82,2.47+math.sin(a)*.31,1.88),(.24,.22,.33),0,.02)
        obj.matrix=Rotation.from_rotvec([0,0,a-math.pi/2]).as_matrix()
    for y in [.88,1.92]:box('Door strap',(-.28,y,1.70),(.88,.075,.042),5,.01)
    cylinder('Door latch',(.53,1.39,1.76),.063,.048,5,12,(0,0,1))
    # Wall foundations and quoins use broad stonework that reads in gameplay.
    for side in [-1,1]:
        for j in range(7):box('Corner stone',(side*2.23,.48+j*.36,1.77),(.40+(j%2)*.19,.32,.34),0,.035)
        box('Corner post',(side*2.24,1.86,-1.73),(.17,2.44,.17),2)
        beam('Gable brace',(side*2.13,3.02,1.85),(0,4.19,1.85),.14)
    for z in [-1.79,1.79]:box('Wall plate',(0,3.04,z),(4.72,.22,.20),2)
    for side in [-1,1]:
        for j in range(5):box('Foundation',(-1.92+j*.91,.45,side*1.79),(.85,.35,.25),0,.035)
    # Front and back gables are closed, supported by the wall plate.
    for z in [-1.78,1.78]:
        mesh('Plaster gable',[(-2.23,3.08,z),(2.23,3.08,z),(0,4.29,z),(-2.23,3.08,z-.09),(2.23,3.08,z-.09),(0,4.29,z-.09)],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)],1)
        box('King post',(0,3.63,z+.09),(.16,1.21,.16),2)
    # Side window with a dark recess, sill and slatted shutters.
    for side in [-1,1]:
        x=side*2.365
        box('Window recess',(x,1.84,.22),(.04,1.22,1.0),5,.01)
        for z in [-.39,.83]:box('Window jamb',(x+side*.06,1.84,z),(.18,1.35,.13),2)
        for y in [1.17,2.51]:box('Window rail',(x+side*.06,y,.22),(.18,.13,1.35),2)
        for j in range(6):box('Shutter slat',(x+side*.13,1.29+j*.22,.22),(.055,.18,1.03),8,.007)
        box('Window sill',(x+side*.12,1.11,.22),(.43,.13,1.52),0,.024)
    roof(5.70,4.48,3.14,1.40,7)
    # Chimney courses; opening has a dark bottom well below its stone cap.
    for row in range(5):
        for side in [-1,1]:
            box('Chimney course',(-1.24+side*.29,4.30+row*.25,-.70),(.22,.23,.68),0,.023)
            box('Chimney course',(-1.24,4.30+row*.25,-.70+side*.27),(.42,.23,.17),0,.02)
    box('Chimney soot',(-1.24,5.06,-.70),(.42,.02,.37),5,0)
    for side in [-1,1]:
        box('Cap',(-1.24+side*.34,5.52,-.70),(.25,.16,.93),0,.02)
        box('Cap',(-1.24,5.52,-.70+side*.35),(.45,.16,.24),0,.02)
    for j in range(2):box('Threshold',(.10,.15+j*.085,2.06-j*.23),(1.97-j*.17,.18,1.01-j*.30),0,.04)


def extract(name, bake=True):
    """Face UVs follow each part's local grain. Bake AO against nearby solid parts.

    Deterministic hemisphere visibility rays intersect the convex part hulls.
    No sun direction or changing weather is baked into the model.
    """
    vertices=[];normals=[];uv=[];slots=[];owners=[];solids=[]
    for oi,obj in enumerate(OBJECTS):
        points=obj.points;lo=points.min(axis=0);lengths=np.maximum(points.max(axis=0)-lo,.001)
        world=points@obj.matrix.T+obj.center
        planes=ConvexHull(world).equations
        solids.append((world.min(axis=0),world.max(axis=0),planes))
        for face in obj.faces:
            tri=points[face];n=np.cross(tri[1]-tri[0],tri[2]-tri[0]);n/=np.linalg.norm(n)
            axis=np.argmax(abs(n));axes=[i for i in range(3)if i!=axis]
            if obj.mat in [2,6,8]:axes.sort(key=lambda i:lengths[i])
            for vi in face:
                p=points[vi];vertices.append(world[vi]);normals.append(obj.matrix@n);slots.append(obj.mat);owners.append(oi)
                u=(p[axes[0]]-lo[axes[0]])/lengths[axes[0]];v=(p[axes[1]]-lo[axes[1]])/lengths[axes[1]]
                mat=obj.mat
                uv.append(((mat%4*TILE+6+u*(TILE-13))/SIZE,1-(mat//4*TILE+6+v*(TILE-13))/SIZE))
    ao=[];cache={}
    bounds_lo=np.array([s[0]for s in solids]);bounds_hi=np.array([s[1]for s in solids])
    for p,n,owner in zip(vertices,normals,owners):
        key=tuple(np.round(np.r_[p,n],4))
        if not bake:cache[key]=1.
        if key not in cache:
            nearby=np.flatnonzero(np.all(bounds_hi>=p-.8,axis=1)&np.all(bounds_lo<=p+.8,axis=1))
            tangent=np.cross(n,[0,1,0]if abs(n[1])<.9 else [1,0,0]);tangent/=np.linalg.norm(tangent);bitangent=np.cross(n,tangent)
            t=(np.arange(12)+.5)/12;phi=np.arange(12)*2.399963
            rays=np.sqrt(1-t)[:,None]*n+np.sqrt(t)[:,None]*(np.cos(phi)[:,None]*tangent+np.sin(phi)[:,None]*bitangent)
            distances=np.full(12,.8);origin=p+n*.018
            for index in nearby:
                if index==owner:continue
                planes=solids[index][2];den=rays@planes[:,:3].T;off=planes[:,:3]@origin+planes[:,3]
                parallel=abs(den)<1e-8;safe=np.where(parallel,1,den);times=-off/safe
                enter=np.max(np.where(den< -1e-8,times,-1e6),axis=1)
                leave=np.min(np.where(den>1e-8,times,1e6),axis=1)
                hit=(leave>=np.maximum(enter,0))&~np.any(parallel&(off>0),axis=1)
                distances=np.minimum(distances,np.where(hit,np.maximum(enter,0),.8))
            cache[key]=max(.52,1-np.mean(1-distances/.8)*.72)
        ao.append(cache[key])
    return {'name':name,'p':np.array(vertices,dtype='<f4'),'n':np.array(normals,dtype='<f4'),'uv':np.array(uv,dtype='<f4'),'ao':np.array(ao,dtype='<f4'),'materials':slots}


def export(models):
    doc={'asset':{'version':'2.0','generator':'Bloodline Legacy / deterministic convex mesh authoring'},'buffers':[{}],'bufferViews':[],'accessors':[],'meshes':[],'nodes':[],'scenes':[{'nodes':list(range(len(models)))}],'scene':0}
    data=bytearray()
    def acc(values,kind):
        arr=np.asarray(values,dtype='<f4');index=len(doc['accessors']);view=len(doc['bufferViews']);offset=len(data);data.extend(arr.tobytes())
        doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':arr.nbytes})
        d={'bufferView':view,'componentType':5126,'count':len(arr),'type':kind}
        if kind=='VEC3':d.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
        doc['accessors'].append(d);return index
    report=[]
    for m in models:
        # COLOR_0 remains standards-compliant; the custom environment importer uses R as AO.
        color=np.column_stack((m['ao'],m['ao'],m['ao'],np.ones(len(m['ao']))))
        attrs={'POSITION':acc(m['p'],'VEC3'),'NORMAL':acc(m['n'],'VEC3'),'TEXCOORD_0':acc(m['uv'],'VEC2'),'COLOR_0':acc(color,'VEC4')}
        doc['nodes'].append({'mesh':len(doc['meshes'])});doc['meshes'].append({'name':m['name'],'primitives':[{'attributes':attrs,'mode':4}]})
        p=m['p'].reshape(-1,3,3);area=np.linalg.norm(np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]),axis=1)
        assert area.min()>1e-9,(m['name'],'degenerate triangle',area.min())
        assert np.isfinite(m['p']).all() and np.isfinite(m['n']).all()
        report.append({'mesh':m['name'],'triangles':len(p),'bounds':[m['p'].min(axis=0).tolist(),m['p'].max(axis=0).tolist()],'minimum_double_area':float(area.min()),'ao_min':float(m['ao'].min()),'ao_mean':float(m['ao'].mean()),'material_slots':sorted(set(m['materials']))})
    doc['buffers'][0]['byteLength']=len(data);j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
    blob=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(data))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(data),0x004e4942)+data
    (OUT/'plaza-craft.glb').write_bytes(blob)
    (OUT/'plaza-craft.json').write_text(json.dumps({'author':'Original Bloodline Legacy environment assets','authoring':'Python / NumPy / SciPy convex mesh and AO ray bake','seed':2841,'materials':[{'name':n,'color':c,'roughness':r}for n,c,r in MATERIALS],'models':report,'glb_sha256':hashlib.sha256(blob).hexdigest(),'ao':'12 deterministic hemisphere visibility rays per unique position/normal, 0.8 world unit radius; no sunlight baked'},indent=2))
    print(json.dumps(report))


def shadow_proxy(name):
    start()
    if name=='well':
        for k in range(14):
            wedge('Ring',k*math.tau/14,(k+1)*math.tau/14,.73,1.17,.16,1.10,0)
        for side in [-1,1]:box('Post',(side*1.20,1.77,0),(.19,2.78,.24),2,0)
        width,depth,eave,rise=2.9,2.1,3.03,.70
    else:
        box('Walls',(0,1.57,0),(4.65,3.08,3.6),1,0)
        box('Chimney',(-1.24,4.71,-.70),(.91,1.78,.93),0,0)
        width,depth,eave,rise=5.5,4.3,3.14,1.37
        mesh('Gable',[(x,y,z) for z in [-1.8,1.8] for x,y in [(-2.32,3.1),(2.32,3.1),(0,4.51)]],[],1)
    for side in [-1,1]:
        mesh('Roof shell',[(x,y-d,z) for d in [0,.12] for z in [-depth/2,depth/2]
                          for x,y in [(0,eave+rise+.14),(side*width/2,eave)]],[],4)
    return extract(name+'-shadow',False)


if __name__=='__main__':
    make_atlas()
    well();models=[extract('well')]
    cottage();models.append(extract('cottage'))
    models.extend(shadow_proxy(name) for name in ['well','cottage'])
    export(models)
