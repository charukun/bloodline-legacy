"""Render the real game shader to a twelve-form motion sheet using native EGL."""
import os,runpy,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
import moderngl
os.environ['FX_REVIEW_DIR']='dist/arcane-review'
ns=runpy.run_path('tests/silk-slash-offline.py')
ctx,program,target,size,out=[ns[k] for k in ['ctx','program','target','size','out']]
frames=[];sheet=None
for line in (out/'animation.jsonl').open():
    sample=json.loads(line)
    if sample['index']==0:sheet=Image.new('RGB',(1200,810),'#10171b')
    target.clear(.009,.012,.014,1)
    for g in sorted(sample['geometry'],key=lambda g:g['additive']):
        ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE if g['additive'] else moderngl.ONE_MINUS_SRC_ALPHA)
        vertices=np.column_stack((np.array(g['positions']).reshape(-1,3),np.array(g['normals']).reshape(-1,3))).astype('f4')
        model=np.array(g['model'],dtype='f4') if 'model' in g else np.eye(4,dtype='f4').flatten();model[12:15]=g['center']
        row=np.concatenate([model,[*g['ink'],g['alpha'],g.get('surface',25.)]]).astype('f4')
        vbo,instance=ctx.buffer(vertices.tobytes()),ctx.buffer(row.tobytes())
        vao=ctx.vertex_array(program,[(vbo,'3f 3f','pos','nor'),(instance,'16f 4f 1f /i','model','ink','surface')]);vao.render(moderngl.TRIANGLES);vao.release();vbo.release();instance.release()
    pixels=np.frombuffer(target.read(components=4),dtype=np.uint8).reshape(size[1],size[0],4)[::-1,:,:3].astype(float)/255
    light=pixels/np.maximum(.015,1-pixels);mapped=np.clip(light*(2.51*light+.03)/(light*(2.43*light+.59)+.14),0,1)**(1/2.2)
    image=Image.fromarray((mapped*255).astype(np.uint8)).resize((300,230))
    x=sample['index']%4*300;y=sample['index']//4*270;sheet.paste(image,(x,y+24));draw=ImageDraw.Draw(sheet);draw.text((x+12,y+7),str(sample['index']+1).zfill(2)+' / '+sample['name'].upper(),fill='#c7e7f3')
    if sample['index']==11:
        sheet.save(out/f"film-{sample['frame']:03d}.png")
        if sample['frame']==10:sheet.save(out/'original-effects.png')
print('Native EGL film: 12 panels, 75 frames')
