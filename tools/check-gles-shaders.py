"""Compile/link original GLSL ES 300 via Mesa EGL, with no browser or GLSL rewrite.

Linux prerequisite: Python 3, libEGL.so.1 and a Mesa EGL driver (libegl-mesa0).
Input: JSON array of {name, vertex, fragment} programs on stdin.
"""
import ctypes as C
import ctypes.util
import json
import os
import sys
import time


def check(programs):
    os.environ.setdefault('EGL_PLATFORM', 'surfaceless')
    os.environ.setdefault('LIBGL_ALWAYS_SOFTWARE', 'true')
    egl = C.CDLL(ctypes.util.find_library('EGL') or 'libEGL.so.1')
    ptr, integer, uint = C.c_void_p, C.c_int, C.c_uint
    ints = C.POINTER(integer)

    def bind(name, result, *args):
        fn = getattr(egl, name)
        fn.restype, fn.argtypes = result, args
        return fn

    display = bind('eglGetDisplay', ptr, ptr)(None)
    initialize = bind('eglInitialize', uint, ptr, ints, ints)
    terminate = bind('eglTerminate', uint, ptr)
    make_current = bind('eglMakeCurrent', uint, ptr, ptr, ptr, ptr)
    destroy = bind('eglDestroyContext', uint, ptr, ptr)
    if not initialize(display, None, None):
        raise RuntimeError('EGL initialization failed; install libegl1 and libegl-mesa0')
    context = None
    try:
        if not bind('eglBindAPI', uint, uint)(0x30A0):  # EGL_OPENGL_ES_API
            raise RuntimeError('Cannot bind OpenGL ES')
        config, count = ptr(), integer()
        attrs = (integer * 5)(0x3040, 0x40, 0x3033, 1, 0x3038)  # ES3, pbuffer
        choose = bind('eglChooseConfig', uint, ptr, ints, C.POINTER(ptr), integer, ints)
        if not choose(display, attrs, C.byref(config), 1, C.byref(count)) or not count.value:
            raise RuntimeError('No OpenGL ES 3 configuration')
        create = bind('eglCreateContext', ptr, ptr, ptr, ptr, ints)
        context = create(display, config, None, (integer * 3)(0x3098, 3, 0x3038))
        if not context or not make_current(display, None, None, context):
            raise RuntimeError('Cannot make the surfaceless OpenGL ES 3 context current')
        address = bind('eglGetProcAddress', ptr, C.c_char_p)

        def gl(name, result, *args):
            entry = address(name.encode())
            if not entry:
                raise RuntimeError('Missing entry point: ' + name)
            return C.CFUNCTYPE(result, *args)(entry)

        get_string = gl('glGetString', C.c_char_p, uint)
        version = get_string(0x1F02).decode()
        if not version.startswith('OpenGL ES 3.'):
            raise RuntimeError('Expected OpenGL ES 3, got ' + version)
        create_shader = gl('glCreateShader', uint, uint)
        source = gl('glShaderSource', None, uint, integer, C.POINTER(C.c_char_p), ints)
        compile_shader = gl('glCompileShader', None, uint)
        shader_status = gl('glGetShaderiv', None, uint, uint, ints)
        shader_log = gl('glGetShaderInfoLog', None, uint, integer, ints, ptr)
        delete_shader = gl('glDeleteShader', None, uint)
        create_program = gl('glCreateProgram', uint)
        attach = gl('glAttachShader', None, uint, uint)
        link = gl('glLinkProgram', None, uint)
        program_status = gl('glGetProgramiv', None, uint, uint, ints)
        program_log = gl('glGetProgramInfoLog', None, uint, integer, ints, ptr)
        delete_program = gl('glDeleteProgram', None, uint)

        def verify(handle, kind, status_fn, log_fn):
            result = integer()
            status_fn(handle, kind, C.byref(result))
            if not result.value:
                size = integer()
                status_fn(handle, 0x8B84, C.byref(size))
                message = C.create_string_buffer(max(1, size.value))
                log_fn(handle, len(message), None, message)
                raise RuntimeError(message.value.decode(errors='replace'))

        results = []
        for program in programs:
            shaders, handle = [], None
            try:
                for key, kind in [('vertex', 0x8B31), ('fragment', 0x8B30)]:
                    text = program[key]
                    if not text.startswith('#version 300 es'):
                        raise RuntimeError(key + ': expected unmodified GLSL ES 300')
                    shader = create_shader(kind)
                    shaders.append(shader)
                    text_pointer = C.c_char_p(text.encode())
                    source(shader, 1, C.byref(text_pointer), None)
                    compile_shader(shader)
                    verify(shader, 0x8B81, shader_status, shader_log)
                handle = create_program()
                for shader in shaders:
                    attach(handle, shader)
                link(handle)
                verify(handle, 0x8B82, program_status, program_log)
                results.append({'name': program['name'], 'ok': True})
            except RuntimeError as error:
                results.append({'name': program['name'], 'ok': False, 'error': str(error)})
            finally:
                if handle:
                    delete_program(handle)
                for shader in shaders:
                    delete_shader(shader)
        return {'backend': version, 'programs': results, 'ok': all(r['ok'] for r in results)}
    finally:
        make_current(display, None, None, None)
        if context:
            destroy(display, context)
        terminate(display)


if __name__ == '__main__':
    start = time.monotonic()
    try:
        result = check(json.load(sys.stdin))
    except (OSError, RuntimeError) as error:
        result = {'ok': False, 'error': str(error)}
    result['milliseconds'] = round((time.monotonic() - start) * 1000, 1)
    print(json.dumps(result))
    sys.exit(0 if result['ok'] else 1)
