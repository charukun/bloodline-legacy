"""Render actual runtime palettes. Neutral shading; not browser / device QA."""
import json,sys,os,numpy as np,moderngl
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[1]);data=json.loads((root/'poses.json').read_text())
options={'backend':'egl'}
if os.getenv('GOLDEN_EGL_LIBRARY'):options['libegl']=os.environ['GOLDEN_EGL_LIBRARY']
ctx=moderngl.create_standalone_context(**options)
prog=ctx.program(vertex_shader='''#version 330
in vec3 pos;in vec3 nor;in vec3 col;out vec3 n;out vec3 c;uniform mat4 vp;
void main(){gl_Position=vp*vec4(pos,1);n=nor;c=col;}''',fragment_shader='''#version 330
in vec3 n;in vec3 c;out vec4 color;
void main(){float d=max(0.,dot(normalize(n),normalize(vec3(-.7,1.,.8))));color=vec4(pow(c*(vec3(.4,.46,.5)+vec3(.65,.61,.5)*d),vec3(.65)),1);}''')
def normalize(v):return v/np.linalg.norm(v)
eye=np.array([4,3.4,7]);target=np.array([0,1.35,0]);z=normalize(eye-target);x=normalize(np.cross([0,1,0],z));y=np.cross(z,x)
view=np.eye(4);view[:3,:3]=[x,y,z];view[:3,3]=-view[:3,:3]@eye
ortho=np.diag([1/1.6,1/1.8,-2/30,1]);ortho[2,3]=-1
prog['vp'].write((ortho@view).T.astype('f4').tobytes())
fbo=ctx.simple_framebuffer((400,450));ctx.enable(moderngl.DEPTH_TEST)
for d in data:
 a=d['attrs'];d['P']=np.c_[np.array(a['POSITION']).reshape(-1,3),np.ones(len(a['POSITION'])//3)];d['N']=np.array(a['NORMAL']).reshape(-1,3);d['C']=np.array(a['COLOR_0']).reshape(-1,4)[:,:3];d['J']=np.array(a['JOINTS_0'],int).reshape(-1,4);d['W']=np.array(a['WEIGHTS_0']).reshape(-1,4);d['I']=np.array(d['indices'])
plane=np.array([[-5,.09,-5],[5,.09,-5],[5,.09,5],[-5,.09,-5],[5,.09,5],[-5,.09,5]],'f4');plane=np.c_[plane,np.tile([0,1,0,.10,.13,.15],(6,1))]
frames=[];review=Image.new('RGB',(1600,1800),'#182127')
for case in range(4):
 for i in range(60):
  pair=Image.new('RGB',(800,490),'#182127');draw=ImageDraw.Draw(pair)
  for col,d in enumerate(data):
   f=d['cases'][case]['frames'][i];M=np.array(f['palette']).reshape(-1,4,4).transpose(0,2,1);B=(M[d['J']]*d['W'][:,:,None,None]).sum(axis=1)
   P=np.einsum('nij,nj->ni',B,d['P'])[:,:3];N=np.einsum('nij,nj->ni',B[:,:3,:3],d['N']);mesh=np.c_[P,N,d['C']][d['I']]
   buf=ctx.buffer(np.concatenate([plane,mesh]).astype('f4'));vao=ctx.vertex_array(prog,[(buf,'3f 3f 3f','pos','nor','col')]);fbo.use();fbo.clear(.075,.10,.12,1);vao.render()
   im=Image.frombytes('RGB',fbo.size,fbo.read(components=3)).transpose(Image.Transpose.FLIP_TOP_BOTTOM);pair.paste(im,(col*400,30));draw.text((col*400+12,10),d['version']+' / '+d['cases'][case]['name'],fill='white');vao.release();buf.release()
   if i in [16,24]:review.paste(im,((col*2+(0 if i==16 else 1))*400,case*450))
  draw.text((12,476),'Runtime mesh + animation / neutral offline shading / no FX or camera shake',fill='#abbfc9');frames.append(pair)
frames[0].save(root/'comparison.gif',save_all=True,append_images=frames[1:],duration=33,loop=0,optimize=False)
review.save(root/'contact-review.jpg',quality=90)
print(ctx.info['GL_RENDERER'])
