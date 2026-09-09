"""Render exact pose exports with neutral diagnostic shading; not Browser QA."""
import json, os, sys, numpy as np, moderngl
from PIL import Image,ImageDraw
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else 'verification/damage-motion')
args={'backend':'egl'}
if os.getenv('GOLDEN_EGL_LIBRARY'): args['libegl']=os.environ['GOLDEN_EGL_LIBRARY']
ctx=moderngl.create_standalone_context(**args)
p=ctx.program(vertex_shader='''#version 330
in vec3 pos;in vec3 nor;in vec3 col;uniform mat4 vp;out vec3 n;out vec3 c;out vec3 w;
void main(){gl_Position=vp*vec4(pos,1);n=nor;c=col;w=pos;}''',fragment_shader='''#version 330
in vec3 n;in vec3 c;in vec3 w;out vec4 color;
void main(){float d=max(0.,dot(normalize(n),normalize(vec3(-.7,1.,.8))));vec3 light=vec3(.4,.46,.5)+vec3(.65,.61,.5)*d;color=vec4(pow(c*light,vec3(.65)),1);}''')
fbo=ctx.simple_framebuffer((300,300));ctx.enable(moderngl.DEPTH_TEST)
def geometry(f):
 if f.get('cm'):
  a=f['attrs'];P=np.array(a['POSITION']).reshape(-1,3);N=np.array(a['NORMAL']).reshape(-1,3);C=np.array(a['COLOR_0']).reshape(-1,4)[:,:3];J=np.array(a['JOINTS_0'],int).reshape(-1,4);W=np.array(a['WEIGHTS_0']).reshape(-1,4)
  M=np.array(f['palette']).reshape(-1,4,4).transpose(0,2,1);blended=(M[J]*W[:,:,None,None]).sum(axis=1)
  pos=np.einsum('nij,nj->ni',blended,np.c_[P,np.ones(len(P))])[:,:3];nor=np.einsum('nij,nj->ni',blended[:,:3,:3],N)
  ix=np.array(f['indices']);return np.c_[pos,nor,C][ix].astype('f4')
 rows=[]
 for typ,m,c in zip(f['vertices'],f['matrices'],f['colors']):
  g=f['geometries'][typ];M=np.array(m).reshape(4,4).T;P=np.array(g['p']).reshape(-1,3);N=np.array(g['n']).reshape(-1,3)
  pos=(np.c_[P,np.ones(len(P))]@M.T)[:,:3];nor=N@np.linalg.inv(M[:3,:3]);rows.append(np.c_[pos,nor,np.tile(c[:3],(len(P),1))])
 return np.concatenate(rows).astype('f4')
for variant in (sys.argv[2:] or ['before','after']):
 d=json.loads((root/(variant+'.json')).read_text());p['vp'].write(np.array(d['camera'],'f4').tobytes());sheets=[]
 for model in ['cm01','legacy','soldier']:
  sheet=Image.new('RGB',(1800,960),'#20272d');draw=ImageDraw.Draw(sheet)
  for row,case in enumerate(x for x in d['all'] if x['kind']==model):
   for f in case['frames']:
    fbo.use();fbo.clear(.075,.10,.12,1)
    # Precise plane + grid establishes world contact without particles/shake.
    plane=np.array([[-5,.09,-5,0,1,0,.10,.13,.15],[5,.09,-5,0,1,0,.10,.13,.15],[5,.09,5,0,1,0,.10,.13,.15],[-5,.09,-5,0,1,0,.10,.13,.15],[5,.09,5,0,1,0,.10,.13,.15],[-5,.09,5,0,1,0,.10,.13,.15]],'f4')
    data=np.concatenate([plane,geometry(f)]);buf=ctx.buffer(data);vao=ctx.vertex_array(p,[(buf,'3f 3f 3f','pos','nor','col')]);vao.render();im=Image.frombytes('RGB',fbo.size,fbo.read(components=3)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    col=f['index'];sheet.paste(im,(col*300,row*320));draw.text((col*300+12,row*320+300),f"{variant} / {model} / {case['part']} / {f['t']-1:+.2f}s",fill='white');vao.release();buf.release()
  sheet.save(root/(variant+'-'+model+'.png'))
print(ctx.info['GL_RENDERER'])
