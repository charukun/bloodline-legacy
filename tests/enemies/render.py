"""Actual game GLSL/scene diagnostic on EGL. Never reported as browser/device QA."""
import sys,os,time,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from render_offline import OfflineScene,desktop_glsl
import numpy as np,moderngl
class EnemyScene(OfflineScene):
 def draw(self,name):
  super().draw(name)
  e=self.data.get('enemies')
  if not e or name not in ('dynamic','dynamicShadow'):return
  if not hasattr(self,'enemy_programs'):
   self.enemy_programs={};self.enemy_vaos={};a=e['attrs'];self.enemy_textures=[]
   for depth in (False,True):
    p=self.ctx.program(vertex_shader=desktop_glsl(e['shaders']['vertex']),fragment_shader=desktop_glsl(e['shaders']['depth' if depth else 'fragment']))
    buffers=[]
    for k,n,attr in [('POSITION',3,'pos'),('NORMAL',3,'nor'),('COLOR_0',4,'color'),('JOINTS_0',4,'joints'),('WEIGHTS_0',4,'weights'),('_REGION',1,'region'),('_SURFACE',1,'surface')]:
     if attr in p:buffers.append((self.ctx.buffer(np.array(a[k],'f4').tobytes()),str(n)+'f',attr))
    self.enemy_programs[depth]=p;self.enemy_vaos[depth]=self.ctx.vertex_array(p,buffers,index_buffer=self.ctx.buffer(np.array(e['indices'],'u2').tobytes()),index_element_size=2)
   for s in e['skins']:
    tx=self.ctx.texture((4,23),4,np.array(s['palette'],'f4').tobytes(),dtype='f4');tx.filter=(moderngl.NEAREST,moderngl.NEAREST);self.enemy_textures.append(tx)
  depth=name=='dynamicShadow';p=self.enemy_programs[depth]
  for k,v in self.data['uniforms'].items():self.uniform(p,k,v)
  self.uniform(p,'vp',self.data['lightVP' if depth else 'vp']);self.uniform(p,'lightVP',self.data['lightVP']);self.uniform(p,'eye',self.data['eye']);self.uniform(p,'focus',[self.data['camera']['x'],self.data['camera']['z']]);self.uniform(p,'shadows',int(self.data['options']['quality']!='low'))
  # Binding 5 is reserved for skin palettes. Match the game's actual sampler map.
  for i,(k,tx)in enumerate([('shadowTex',self.static_depth),('dynamicShadow',self.dynamic_depth),('materialAtlas',self.textures['materialAtlas']),('detailAtlas',self.textures['detailAtlas']),('terrainMap',self.textures['terrainMap'])]):tx.use(i);self.uniform(p,k,i)
  self.textures['goldenAtlas'].use(6);self.uniform(p,'goldenAtlas',6)
  for unit,key in [(7,'craftColor'),(8,'craftDetail')]:
   if key in self.textures:self.textures[key].use(unit);self.uniform(p,key,unit)
  for s,tx in zip(e['skins'],self.enemy_textures):
   tx.use(5);self.uniform(p,'enemyBones',5);self.uniform(p,'enemyCloth',s['cloth']);self.uniform(p,'enemyMetal',s['metal']);self.uniform(p,'enemyVariation',s['variation']);self.uniform(p,'enemyLoss',s['loss']);self.uniform(p,'enemyDamageBody',s.get('damageBody',[0,0,0]));self.uniform(p,'enemyDamageLimbs',s.get('damageLimbs',[0,0,0,0]));self.enemy_vaos[depth].render()
  # Restore the regular scene texture units consumed by subsequent effects.
  for i,(k,tx)in enumerate([('shadowTex',self.static_depth),('dynamicShadow',self.dynamic_depth),*self.textures.items()]):tx.use(i);self.uniform(self.main,k,i)
if __name__=='__main__':
 scene=EnemyScene(sys.argv[1],Path(__file__).resolve().parents[2]/'public/assets');scene.render(static_shadow=True);scene.save(sys.argv[2]);print(scene.ctx.info['GL_RENDERER'])
 if len(sys.argv)>3:
  result={'backend':scene.ctx.info['GL_RENDERER'],'browser':False,'gpuTime':None,'options':scene.data['options'],'runs':scene.benchmark(seconds=float(sys.argv[3]),runs=3)};Path(sys.argv[2]+'.json').write_text(json.dumps(result,indent=2))
