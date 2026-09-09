"""Offline EGL pose review. Uses captured runtime palettes; NOT a browser capture.
Requires numpy, Pillow, moderngl and ffmpeg. Does not run the game or certify FPS.
"""
import argparse,io,json,math,struct,subprocess
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import moderngl
from author_character_clips import GLB

def unit(v):return v/np.linalg.norm(v)
def camera(yaw,pitch,height,aspect,focus):
 z=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),math.cos(yaw)*math.cos(pitch)])
 x=unit(np.cross([0,1,0],z));y=np.cross(z,x);eye=np.array(focus)+z*12
 v=np.eye(4);v[:3,:3]=[x,y,z];v[:3,3]=-v[:3,:3]@eye
 o=np.diag([2/(height*aspect),2/height,-2/50,1]);o[2,3]=-1
 return (o@v).astype('f4').T.tobytes()
class Render:
 def __init__(self,capture,glb,size=640):
  self.cap=json.loads(Path(capture).read_text());self.glb=GLB(glb);self.size=size
  c=self.c=moderngl.create_standalone_context(backend='egl');self.fbo=c.simple_framebuffer((size,size),components=4,samples=4);self.out=c.simple_framebuffer((size,size),components=4)
  vertex='''#version 330
in vec3 pos;in vec3 nor;in vec2 uv;in vec4 color;in vec4 joints;in vec4 weights;in float region;
uniform mat4 vp;uniform mat4 bones[31];out vec3 N;out vec3 W;out vec2 U;out vec4 C;flat out int R;
void main(){mat4 m=bones[int(joints.x)]*weights.x+bones[int(joints.y)]*weights.y+bones[int(joints.z)]*weights.z+bones[int(joints.w)]*weights.w;vec4 w=m*vec4(pos,1);W=w.xyz;N=normalize(mat3(m)*nor);U=uv;C=color;R=int(region+.5);gl_Position=vp*w;}
'''
  fragment='''#version 330
in vec3 N;in vec3 W;in vec2 U;in vec4 C;flat in int R;uniform sampler2D atlas;uniform bool textured;uniform bool silhouette;uniform vec2 focusXZ;out vec4 frag;
void main(){if(R>=10)discard;vec3 p=C.rgb;if(textured)p*=texture(atlas,U).rgb;float light=.48+.50*max(0.,dot(normalize(N),normalize(vec3(-.48,.85,.42))));if(R==9){float grid=step(.965,fract(W.x))+step(.965,fract(W.z));p*=1.-.15*min(1.,grid);float shadow=exp(-dot(W.xz-focusXZ,W.xz-focusXZ)*1.8);p*=1.-.15*shadow;}frag=vec4(silhouette&&R!=9?vec3(.06):p*light,1.);}
'''
  self.prog=c.program(vertex_shader=vertex,fragment_shader=fragment);self.prog['atlas'].value=0
  g=self.glb.g;prim=g['meshes'][0]['primitives'][0];a={k:self.glb.read(i) for k,i in prim['attributes'].items()}
  self.mesh=self.vao(a['POSITION'],a['NORMAL'],a['TEXCOORD_0'],a['COLOR_0'],a['JOINTS_0'],a['WEIGHTS_0'],a['_REGION'],self.glb.read(prim['indices']).astype('u4').tobytes())
  im=g['images'][0];v=g['bufferViews'][im['bufferView']];img=Image.open(io.BytesIO(self.glb.data[v['byteOffset']:v['byteOffset']+v['byteLength']])).convert('RGBA')
  self.tex=c.texture(img.size,4,img.tobytes());self.tex.filter=(moderngl.LINEAR,moderngl.LINEAR)
  self.parts={}
  for key,geo in self.cap['geometry'].items():
   p=np.array(geo['positions']).reshape(-1,3);n=np.array(geo['normals']).reshape(-1,3);self.parts[key]=self.simple(p,n,[1,1,1,1])
  floor=np.array([[-8,.10,-8],[-8,.10,8],[8,.10,8],[-8,.10,-8],[8,.10,8],[8,.10,-8]])
  self.floor=self.simple(floor,np.tile([0,1,0],(6,1)),[.65,.69,.60,1],9)
 def vao(self,p,n,uv,col,j,w,reg,index=None):
  data=np.column_stack([p,n,uv,col,j,w,reg]).astype('f4');b=self.c.buffer(data.tobytes());ib=self.c.buffer(index) if index else None
  return self.c.vertex_array(self.prog,[(b,'3f 3f 2f 4f 4f 4f 1f','pos','nor','uv','color','joints','weights','region')],ib,index_element_size=4)
 def simple(self,p,n,col,region=0):
  count=len(p);return self.vao(p,n,np.zeros((count,2)),np.tile(col,(count,1)),np.zeros((count,4)),np.tile([1,0,0,0],(count,1)),np.full((count,1),region))
 def render(self,index,yaw=.9,pitch=.38,height=4.5,silhouette=False):
  self.fbo.use();self.c.enable(moderngl.DEPTH_TEST);self.fbo.clear(.23,.28,.26,1,depth=1)
  frame=self.cap['frames'][index];x,z=frame['p']['x'],frame['p']['z'];self.prog['vp'].write(camera(yaw,pitch,height,1,[x,1.25,z+.1]));self.prog['silhouette'].value=silhouette;self.prog['focusXZ'].value=(x,z)
  identity=np.tile(np.eye(4,dtype='f4').flatten(),31);self.prog['bones'].write(identity.tobytes());self.prog['textured'].value=False;self.floor.render()
  self.prog['bones'].write(np.array(frame['palette'],dtype='f4').tobytes());self.prog['textured'].value=True;self.tex.use();self.mesh.render()
  self.prog['textured'].value=False
  for part in frame['parts']:
   matrix=np.array(part['m'],dtype='f4');identity[:16]=matrix;self.prog['bones'].write(identity.tobytes())
   # Equipment shares exact game geometry/matrices; its material tint is baked in a separate VAO.
   key=part['type']+str(part['c']);
   if key not in self.parts:
    geo=self.cap['geometry'][part['type']];p=np.array(geo['positions']).reshape(-1,3);n=np.array(geo['normals']).reshape(-1,3);self.parts[key]=self.simple(p,n,part['c'])
   self.parts[key].render()
  self.c.copy_framebuffer(self.out,self.fbo)
  return Image.frombytes('RGBA',(self.size,self.size),self.out.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('capture');ap.add_argument('glb');ap.add_argument('output');ap.add_argument('--before');ap.add_argument('--before-glb');ap.add_argument('--video',action='store_true');args=ap.parse_args()
 after=Render(args.capture,args.glb);before=Render(args.before,args.before_glb) if args.before else None
 font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
 if args.video:
  w=1280 if before else 640;h=720
  proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r','60','-i','-','-an','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',args.output],stdin=subprocess.PIPE)
  for mode,yaw,pitch,height in [('CLOSE / 1x',.9,.38,4.5),('GAME SCALE / 1x',.9,.68,13.5),('SIDE / 1x',1.5708,.28,4.5)]:
   for i in range(len(after.cap['frames'])):
    sheet=Image.new('RGB',(w,h),'#242c29');d=ImageDraw.Draw(sheet)
    for col,(r,label) in enumerate([(before,'BEFORE') ,(after,'AFTER')] if before else [(after,'AFTER')]):
     sheet.paste(r.render(min(i,len(r.cap['frames'])-1),yaw,pitch,height),(col*640,40));d.text((col*640+20,10),f'{label}  /  {mode}',font=font,fill='#ecdfbc')
    d.text((20,686),'OFFLINE runtime poses / effects OFF / browser verification pending',font=font,fill='#c2c8bc');proc.stdin.write(sheet.tobytes())
  proc.stdin.close();proc.wait();assert proc.returncode==0
 else:
  times=[1.05,1.3,1.58,1.76,1.95,2.17,2.43,2.66,2.9,3.22,3.55,3.93,4.2,4.48,4.83,5.3];size=320;sheet=Image.new('RGB',(size*4,350*4),'#242c29');d=ImageDraw.Draw(sheet)
  for k,t in enumerate(times):
   i=min(len(after.cap['frames'])-1,round(t*after.cap['hz']));im=after.render(i).resize((size,size));x=k%4*size;y=k//4*350;sheet.paste(im,(x,y));d.text((x+8,y+322),f'{t:.2f}s  {(after.cap["frames"][i].get("clip") or {}).get("name","")} / {(after.cap["frames"][i].get("clip") or {}).get("stage","")}',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12),fill='white')
  sheet.save(args.output)
 print(args.output)
if __name__=='__main__':main()
