"""Optional native EGL shader/pixel review. Not WebGL or hardware-GPU timing."""
import json
import sys
import time
from pathlib import Path
import moderngl
import numpy as np
from render_offline import OfflineScene, desktop_glsl

out,assets=map(Path,sys.argv[1:3])
reports=[]
for weather in ['clear','rain']:
    folder=out/weather
    scene=OfflineScene(folder,assets)
    ctx=scene.ctx
    # Match the browser's clamp-to-edge scene attachments before either resolve.
    for tex in [scene.color,scene.normals]:
        tex.filter=(moderngl.LINEAR,moderngl.LINEAR)
        tex.repeat_x=tex.repeat_y=False
    scene.render()
    scene.save(folder/'normal.png')
    normal=np.frombuffer(scene.output.read(components=3),dtype=np.uint8).astype(float)
    programs=json.loads((folder/'kernels.json').read_text())
    for revision,k in programs.items():
        make=lambda shader:ctx.program(vertex_shader=desktop_glsl(k['vertex']),fragment_shader=desktop_glsl(shader))
        blur,post=make(k['blur']),make(k['post'])
        coc=make(k['coc']) if k['coc'] else None
        half=tuple((v+1)//2 for v in scene.size)
        textures=[ctx.texture(half,4) for _ in range(2)]
        for tex in [scene.color,*textures]:
            tex.filter=(moderngl.LINEAR,moderngl.LINEAR)
            tex.repeat_x=tex.repeat_y=False
        targets=[ctx.framebuffer([tex]) for tex in textures]
        vaos={p:ctx.vertex_array(p,[]) for p in [blur,post,*([coc] if coc else [])]}
        uniform=scene.uniform
        def resolve(enabled):
            scene.output.use();ctx.viewport=(0,0,*scene.size)
            for i,(name,tex) in enumerate([('image',scene.color),('depth',scene.depth),('normals',scene.normals),('dioramaBlur',textures[1])]):
                tex.use(i);uniform(post,name,i)
            for name,value in {**k['focus'],'texel':[1/v for v in scene.size],
                               'occlusion':1,'exposure':scene.data['weather']['exposure'],
                               'bloom':.22,'portrait':0,'dioramaDebug':0,
                               'dioramaAmount':k['strength'] if enabled else 0}.items():
                uniform(post,name,value)
            vaos[post].render(vertices=3)
        def draw():
            ctx.enable_only(0)
            for i in range(2):
                p=coc if coc and i==0 else blur
                targets[i].use();ctx.viewport=(0,0,*half)
                (scene.color if i==0 else textures[0]).use(0);uniform(p,'image',0)
                scene.depth.use(1);uniform(p,'depth',1)
                for name,value in k['focus'].items():uniform(p,name,value)
                uniform(p,'blurRadius',[k['radius']/v for v in scene.size]);uniform(p,'diskSamples',k.get('samples',16))
                uniform(p,'blurStep',[k['radius']/scene.size[0]/4,0] if i==0 else [0,k['radius']/scene.size[1]/4])
                vaos[p].render(vertices=3)
            resolve(True)
        draw();ctx.finish()
        scene.save(folder/f'{revision}.png')
        pixels=np.frombuffer(scene.output.read(components=3),dtype=np.uint8).astype(float)
        assert np.isfinite(pixels).all() and np.std(pixels)>5
        # Measure only these post passes against an identical frozen scene.
        samples=[]
        for _ in range(7):
            start=time.perf_counter();draw();ctx.finish();samples.append((time.perf_counter()-start)*1000)
        resolve(False);ctx.finish()
        off=np.frombuffer(scene.output.read(components=3),dtype=np.uint8).astype(float)
        assert np.max(np.abs(off-normal))<=1,f'OFF changed the normal resolve: {np.max(abs(off-normal))}, mean {np.mean(abs(off-normal))}'
        assert ctx.error=='GL_NO_ERROR'
        reports.append({'weather':weather,'revision':revision,'backend':ctx.info['GL_RENDERER'],
                        'extra_passes':2,'target_bytes':half[0]*half[1]*8,
                        'normal_difference_mean':float(np.mean(abs(pixels-normal))),
                        'post_only_median_ms':float(np.median(samples)),'post_only_samples_ms':samples})
        for obj in [*vaos.values(),*targets,*textures,blur,post,*([coc] if coc else [])]:obj.release()
    ctx.release()
(out/'results.json').write_text(json.dumps({'samples':reports,'unverified':['browser interaction','real WebGL frame pacing','Pixel Fold GPU']},indent=2))
print(json.dumps([{k:v for k,v in r.items() if k!='post_only_samples_ms'} for r in reports]))
