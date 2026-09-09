"""Native EGL check of the shipped game vertex/fragment shaders, not Browser QA."""
import json
from pathlib import Path
import re
import moderngl
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
import os
out = root / os.environ.get('FX_REVIEW_DIR', 'dist/silk-review')
d = json.loads((out / 'egl-input.json').read_text())
def glsl(s):
    return re.sub(r'precision\s+(?:highp|mediump|lowp)\s+\w+\s*;', '', s.replace('#version 300 es', '#version 330 core'))
ctx = moderngl.create_standalone_context(backend='egl')
program = ctx.program(vertex_shader=glsl(d['vertex']), fragment_shader=glsl(d['fragment']))
skin = ctx.program(vertex_shader=glsl(d['skin']), fragment_shader=glsl(d['fragment']))
if 'lab' in d:
    lab = ctx.program(vertex_shader=glsl(d['lab']['vertex']), fragment_shader=glsl(d['lab']['fragment']))
size = (720, 500)
color, normal = ctx.texture(size,4), ctx.texture(size,4)
target = ctx.framebuffer([color,normal], ctx.depth_renderbuffer(size))
target.use()
program['vp'].write(np.array(d['vp'],np.float32).tobytes())
program['lightVP'].write(np.eye(4,dtype=np.float32).tobytes())
program['eye'].value = tuple(d['eye'])
for key,value in {'skyStrength':1.,'sunStrength':1.,'skyColor':(.4,.5,.6),'groundColor':(.2,.2,.2),'sunColor':(1.,.9,.75)}.items():
    if key in program:program[key].value=value
white = ctx.texture((1,1),4,bytes([255,255,255,255]));white.use(0)
ctx.enable(moderngl.BLEND)
ctx.blend_func = moderngl.SRC_ALPHA, moderngl.ONE_MINUS_SRC_ALPHA
measurements = []
for frame in d['frames']:
    target.clear(.009,.012,.014,1)
    for g in sorted(frame['geometry'],key=lambda g:g.get('additive',False)):
        ctx.blend_func = (moderngl.SRC_ALPHA, moderngl.ONE) if g.get('additive') else (moderngl.SRC_ALPHA, moderngl.ONE_MINUS_SRC_ALPHA)
        vertices=np.column_stack((np.array(g['positions']).reshape(-1,3),np.array(g['normals']).reshape(-1,3))).astype('f4')
        model=np.array(g['model'],dtype='f4') if 'model' in g else np.eye(4,dtype='f4').flatten();model[12:15]=g['center']
        row=np.concatenate([model,[*g['ink'],g['alpha'],g.get('surface',25. if 'additive' in g else 24.)]]).astype('f4')
        vbo,instance=ctx.buffer(vertices.tobytes()),ctx.buffer(row.tobytes())
        vao=ctx.vertex_array(program,[(vbo,'3f 3f','pos','nor'),(instance,'16f 4f 1f /i','model','ink','surface')])
        vao.render(moderngl.TRIANGLES)
        vao.release();vbo.release();instance.release()
    pixels=np.frombuffer(target.read(components=4),dtype=np.uint8).reshape(size[1],size[0],4)[::-1]
    light=pixels[:,:,:3].astype(float)/255;decoded=light/np.maximum(.015,1-light)
    mapped=np.clip((decoded*(2.51*decoded+.03))/(decoded*(2.43*decoded+.59)+.14),0,1)**(1/2.2)
    image=(mapped*255).astype(np.uint8)
    lit=int(np.count_nonzero(image.max(axis=2)>100))
    assert lit>10, f"invisible ribbon: {frame['path']} {frame['u']}"
    Image.fromarray(image).save(out/f"egl-{frame['path']}-{frame['u']}.png")
    measurements.append({'path':frame['path'],'phase':frame['u'],'litPixels':lit})
result={'backend':'native EGL, game GLSL, not browser','gameShader':'PASS','existingSkinLink':'PASS','frames':measurements}
(out/'egl-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
