"""Exact game mesh/palettes; offline neutral shade, no FX. Not browser QA."""
import json,sys,subprocess,numpy as np,moderngl
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[1]);data=json.loads((root/'poses.json').read_text());ctx=moderngl.create_standalone_context(backend='egl')
prog=ctx.program(vertex_shader='''#version 330
in vec3 pos;in vec3 nor;in vec3 col;out vec3 n;out vec3 c;uniform mat4 vp;
void main(){gl_Position=vp*vec4(pos,1);n=nor;c=col;}''',fragment_shader='''#version 330
in vec3 n;in vec3 c;out vec4 color;
void main(){float d=max(0.,dot(normalize(n),normalize(vec3(-.7,1.,.8))));color=vec4(pow(c*(vec3(.4,.46,.5)+vec3(.65,.61,.5)*d),vec3(.65)),1);}''')
def norm(v):return v/np.linalg.norm(v)
eye=np.array([3.5,3.2,10.]);target=np.array([0,1.3,4.]);z=norm(eye-target);x=norm(np.cross([0,1,0],z));y=np.cross(z,x);view=np.eye(4);view[:3,:3]=[x,y,z];view[:3,3]=-view[:3,:3]@eye
ortho=np.diag([1/1.5,1/1.8,-2/30,1]);ortho[2,3]=-1;prog['vp'].write((ortho@view).T.astype('f4').tobytes());fbo=ctx.simple_framebuffer((400,480));ctx.enable(moderngl.DEPTH_TEST)
plane=np.array([[-5,.095,0],[5,.095,0],[5,.095,8],[-5,.095,0],[5,.095,8],[-5,.095,8]],'f4');plane=np.c_[plane,np.tile([0,1,0,.10,.13,.15],(6,1))]
for v in data:
 for d in v['cases']:
  a=d['attrs'];d['P']=np.c_[np.array(a['POSITION']).reshape(-1,3),np.ones(len(a['POSITION'])//3)];d['N']=np.array(a['NORMAL']).reshape(-1,3);d['C']=np.array(a['COLOR_0']).reshape(-1,4)[:,:3];d['J']=np.array(a['JOINTS_0'],int).reshape(-1,4);d['W']=np.array(a['WEIGHTS_0']).reshape(-1,4);I=np.array(d['indices']).reshape(-1,3);d['I']=I[np.all(np.array(a['_REGION'])[I]<10,axis=1)].flatten()
video=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','800x520','-r','30','-i','-','-an','-c:v','libx264','-crf','22','-pix_fmt','yuv420p',str(root/'comparison.mp4')],stdin=subprocess.PIPE)
review=Image.new('RGB',(1600,1920),'#182127')
for case in range(4):
 for i in range(60):
  pair=Image.new('RGB',(800,520),'#182127');draw=ImageDraw.Draw(pair)
  for col,v in enumerate(data):
   d=v['cases'][case];f=d['frames'][i];M=np.array(f['palette']).reshape(-1,4,4).transpose(0,2,1);B=(M[d['J']]*d['W'][:,:,None,None]).sum(axis=1);P=np.einsum('nij,nj->ni',B,d['P'])[:,:3];N=np.einsum('nij,nj->ni',B[:,:3,:3],d['N']);mesh=np.c_[P,N,d['C']][d['I']]
   buf=ctx.buffer(np.concatenate([plane,mesh]).astype('f4'));vao=ctx.vertex_array(prog,[(buf,'3f 3f 3f','pos','nor','col')]);fbo.use();fbo.clear(.075,.10,.12,1);vao.render();im=Image.frombytes('RGB',fbo.size,fbo.read(components=3)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
   pair.paste(im,(col*400,24));draw.text((col*400+10,7),v['version']+' / '+d['name'],fill='white');vao.release();buf.release()
   if i in [14,29]:review.paste(im,((col*2+(0 if i==14 else 1))*400,case*480))
  draw.text((10,507),'Actual runtime mesh / 1x speed / neutral offline shading / no FX',fill='#aabcc8');video.stdin.write(pair.tobytes())
video.stdin.close();assert video.wait()==0;review.save(root/'contact-review.jpg',quality=90);print(ctx.info['GL_RENDERER'])
