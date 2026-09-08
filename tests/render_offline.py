"""Render an export_scene.mjs capture with the game's own GLSL and draw batches.

This is a diagnostic OpenGL/EGL renderer, not a browser or an emulated Pixel Fold.
GLSL ES 300 headers become GLSL 330 headers; depth attachments are driver floats.
No browser, UI, input, saving, or bone-palette crossfade is claimed verified.
"""
import argparse
import json
import os
from pathlib import Path
import re
import time
import statistics

import moderngl
import numpy as np
from PIL import Image


def desktop_glsl(source):
    source = source.replace('#version 300 es', '#version 330 core')
    return re.sub(r'precision\s+(?:highp|mediump|lowp)\s+\w+\s*;', '', source)


class OfflineScene:
    def __init__(self, scene_dir, asset_dir):
        self.directory = Path(scene_dir)
        self.data = json.loads((self.directory / 'scene.json').read_text())
        args = {'backend': 'egl'}
        if os.getenv('GOLDEN_EGL_LIBRARY'):
            args['libegl'] = os.environ['GOLDEN_EGL_LIBRARY']
        self.ctx = ctx = moderngl.create_standalone_context(**args)
        d = self.data
        self.size = (d['options']['width'], d['options']['height'])
        shaders = d['shaders']
        self.main = ctx.program(vertex_shader=desktop_glsl(shaders['vertex']),
                                fragment_shader=desktop_glsl(shaders['fragment']))
        self.shadow = ctx.program(vertex_shader=desktop_glsl(shaders['vertex']),
                                  fragment_shader=desktop_glsl(shaders['depth']))
        self.post = ctx.program(vertex_shader=desktop_glsl(shaders['postVertex']),
                                fragment_shader=desktop_glsl(shaders['postFragment']))
        self.rain = ctx.program(vertex_shader=desktop_glsl(d['rainShaders']['vertex']),
                                fragment_shader=desktop_glsl(d['rainShaders']['fragment']))
        # Link the unchanged character vertex shader to the updated material shader too.
        self.skin_check = ctx.program(vertex_shader=desktop_glsl(shaders['skinVertex']),
                                      fragment_shader=desktop_glsl(shaders['fragment']))
        self.resources = []
        self.textures = {}
        for name, file in [('materialAtlas', 'material-atlas.png'), ('detailAtlas', 'detail-atlas.png')]:
            self.textures[name] = self.image_texture(Path(asset_dir) / file)
        if (Path(asset_dir) / 'golden-surfaces.png').exists():
            self.textures['goldenAtlas'] = self.image_texture(Path(asset_dir) / 'golden-surfaces.png')
        self.textures['terrainMap'] = self.image_texture(self.directory / 'terrain.png')
        self.static_depth = self.depth_texture((1536, 1536))
        self.dynamic_depth = self.depth_texture((1024, 1024))
        self.static_shadow = ctx.framebuffer(depth_attachment=self.static_depth)
        self.dynamic_shadow = ctx.framebuffer(depth_attachment=self.dynamic_depth)
        self.color = ctx.texture(self.size, 4)
        self.normals = ctx.texture(self.size, 4)
        self.depth = self.depth_texture(self.size)
        self.target = ctx.framebuffer([self.color, self.normals], self.depth)
        self.output_texture = ctx.texture(self.size, 4)
        self.output = ctx.framebuffer([self.output_texture])
        self.post_vao = ctx.vertex_array(self.post, [])
        self.rain_vao = ctx.vertex_array(self.rain, [
            (ctx.buffer(np.array(d['rainSeeds'], np.float32).tobytes()), '4f /i', 'seed')])
        self.vaos = {}
        for name, batches in d['passes'].items():
            program = self.shadow if 'Shadow' in name else self.main
            self.vaos[name] = []
            for batch in batches:
                g = d['geometries'][batch['mesh']]
                vertices = np.column_stack((np.array(g['positions']).reshape(-1, 3),
                                            np.array(g['normals']).reshape(-1, 3))).astype('f4')
                vbo = ctx.buffer(vertices.tobytes())
                instances = ctx.buffer(np.array(batch['rows'], np.float32).tobytes())
                vf, va = ('3f 3f', ['pos', 'nor']) if 'nor' in program else ('3f 12x', ['pos'])
                fmt, attrs = ('16f 4f 1f /i', ['model', 'ink', 'surface']) if 'ink' in program else ('16f 16x 1f /i', ['model', 'surface'])
                vao = ctx.vertex_array(program, [(vbo, vf, *va), (instances, fmt, *attrs)])
                self.resources.extend([vbo, instances, vao])
                self.vaos[name].append((vao, batch['count'], batch['instances']))
        self.render(static_shadow=True)

    def image_texture(self, path):
        image = Image.open(path).convert('RGBA')
        tex = self.ctx.texture(image.size, 4, image.tobytes())
        tex.build_mipmaps()
        tex.filter = (moderngl.LINEAR_MIPMAP_LINEAR, moderngl.LINEAR)
        tex.repeat_x = tex.repeat_y = False
        return tex

    def depth_texture(self, size):
        tex = self.ctx.depth_texture(size)
        tex.compare_func = ''
        tex.filter = (moderngl.NEAREST, moderngl.NEAREST)
        tex.repeat_x = tex.repeat_y = False
        return tex

    @staticmethod
    def uniform(program, name, value):
        if name not in program:
            return
        if isinstance(value, list) and len(value) == 16:
            program[name].write(np.array(value, np.float32).tobytes())
        else:
            program[name].value = tuple(value) if isinstance(value, list) else value

    def draw(self, name):
        for vao, vertices, instances in self.vaos[name]:
            vao.render(vertices=vertices, instances=instances)

    def render(self, static_shadow=False, time_override=None):
        d, ctx, w = self.data, self.ctx, self.data['weather']
        t = d['options']['time'] if time_override is None else time_override
        ctx.enable_only(moderngl.DEPTH_TEST)
        ctx.depth_func = '<='
        ctx.depth_mask = True
        for p in [self.shadow, self.main]:
            self.uniform(p, 'lightVP', d['lightVP'])
            self.uniform(p, 'time', t)
            self.uniform(p, 'wind', w['wind'])
        if d['options']['quality'] != 'low':
            self.uniform(self.shadow, 'vp', d['lightVP'])
            if static_shadow:
                self.static_shadow.use(); self.static_shadow.clear(depth=1)
                self.draw('staticShadow')
            self.dynamic_shadow.use(); self.dynamic_shadow.clear(depth=1)
            self.draw('dynamicShadow')
        self.target.use(); ctx.viewport = (0, 0, *self.size)
        self.target.clear(*w['fog'], 1, depth=1)
        p = self.main
        for name, value in d['uniforms'].items():
            if name not in ['shadowTex', 'dynamicShadow', 'materialAtlas', 'detailAtlas', 'terrainMap', 'goldenAtlas']:
                self.uniform(p, name, value)
        for name, value in [('vp', d['vp']), ('eye', d['eye']), ('focus', [d['camera']['x'], d['camera']['z']]),
                            ('time', t), ('shadows', int(d['options']['quality'] != 'low'))]:
            self.uniform(p, name, value)
        for i, (name, tex) in enumerate([('shadowTex', self.static_depth), ('dynamicShadow', self.dynamic_depth), *self.textures.items()]):
            tex.use(i); self.uniform(p, name, i)
        self.draw('static'); self.draw('dynamic')
        ctx.enable(moderngl.BLEND)
        ctx.blend_func = moderngl.SRC_ALPHA, moderngl.ONE_MINUS_SRC_ALPHA
        ctx.depth_mask = False
        self.draw('ground'); self.draw('fx')
        if w['rain'] > .01:
            for name, value in [('vp', d['vp']), ('time', t), ('focus', [d['camera']['x'], d['camera']['z']]), ('wind', w['wind']), ('rain', w['rain'])]:
                self.uniform(self.rain, name, value)
            count = 260 if d['options']['quality'] == 'low' else 1100 if d['options']['quality'] == 'high' else 600
            self.rain_vao.render(vertices=6, instances=count)
        ctx.depth_mask = True
        ctx.enable_only(0)
        self.output.use(); ctx.viewport = (0, 0, *self.size)
        for i, (name, tex) in enumerate([('image', self.color), ('depth', self.depth), ('normals', self.normals)]):
            tex.use(i); self.uniform(self.post, name, i)
        low = d['options']['quality'] == 'low'
        for name, value in [('texel', [1/self.size[0], 1/self.size[1]]), ('occlusion', .35 if low else 1),
                            ('bloom', 0 if low else .22), ('exposure', w['exposure']), ('portrait', 0)]:
            self.uniform(self.post, name, value)
        self.post_vao.render(vertices=3)

    def save(self, path):
        self.ctx.finish()
        image = Image.frombytes('RGB', self.size, self.output.read(components=3, alignment=1))
        image.transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(path)

    def benchmark(self, seconds=30, runs=3):
        results=[]
        warmup=time.perf_counter()
        while time.perf_counter()-warmup<10:
            self.render(); self.ctx.finish()
        for run in range(runs):
            values=[]; start=last=time.perf_counter()
            while time.perf_counter()-start<seconds:
                self.render(time_override=time.perf_counter()-start)
                self.ctx.finish()
                now=time.perf_counter(); values.append((now-last)*1000); last=now
            elapsed=last-start
            results.append({'run':run+1,'seconds':elapsed,'frames':len(values),'fps':len(values)/elapsed,
                'p50_ms':float(np.percentile(values,50)),'p95_ms':float(np.percentile(values,95)),
                'p99_ms':float(np.percentile(values,99)),'max_ms':max(values),'frames_over_100ms':sum(v>100 for v in values),
                'raw_frame_intervals_ms':values})
        return results


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('scene');p.add_argument('assets');p.add_argument('--benchmark',action='store_true')
    p.add_argument('--seconds',type=float,default=30);p.add_argument('--runs',type=int,default=3)
    args=p.parse_args(); start=time.perf_counter();scene=OfflineScene(args.scene,args.assets)
    scene.save(Path(args.scene)/'render.png')
    result={'renderer':scene.ctx.info['GL_RENDERER'],'version':scene.ctx.info['GL_VERSION'],
            'backend':'offline EGL / same game shaders and drawBatches / not browser',
            'initial_compile_upload_render_seconds':time.perf_counter()-start,'options':scene.data['options'],
            'game_drawBatches_stats_including_shadow_refresh':scene.data['stats'],
            'steady_scene_draw_calls':sum(len(v) for k,v in scene.data['passes'].items() if k!='staticShadow')+1+(scene.data['weather']['rain']>.01),
            'unverified':['browser interaction','native WebGL frame pacing','hardware GPU','Pixel Fold','bone palette transitions']}
    if args.benchmark:result['runs']=scene.benchmark(args.seconds,args.runs)
    (Path(args.scene)/'offline-render.json').write_text(json.dumps(result,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='runs'}),flush=True)
