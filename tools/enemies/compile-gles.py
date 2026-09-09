"""Compile unchanged GLSL ES 300 with native EGL/GLES (not browser/device QA).

Input: JSON array of {name, vertex, fragment}. Uses Python's standard library
and Mesa libEGL on Linux; deliberately never translates to desktop GLSL.
"""
import ctypes as C
import json
import sys


def main():
    programs = json.load(sys.stdin)
    egl = C.CDLL('libEGL.so.1')
    egl.eglGetProcAddress.restype = C.c_void_p
    egl.eglGetProcAddress.argtypes = [C.c_char_p]

    def proc(name, result, *args):
        address = egl.eglGetProcAddress(name.encode())
        if not address:
            raise RuntimeError('Missing EGL/GLES entry point: ' + name)
        return C.CFUNCTYPE(result, *args)(address)

    integer, uint, ptr = C.c_int, C.c_uint, C.c_void_p
    ints = C.POINTER(integer)
    get_display = proc('eglGetPlatformDisplay', ptr, uint, ptr, ptr)
    initialize = proc('eglInitialize', uint, ptr, ints, ints)
    bind_api = proc('eglBindAPI', uint, uint)
    choose = proc('eglChooseConfig', uint, ptr, ints, C.POINTER(ptr), integer, ints)
    create_surface = proc('eglCreatePbufferSurface', ptr, ptr, ptr, ints)
    create_context = proc('eglCreateContext', ptr, ptr, ptr, ptr, ints)
    make_current = proc('eglMakeCurrent', uint, ptr, ptr, ptr, ptr)
    destroy_surface = proc('eglDestroySurface', uint, ptr, ptr)
    destroy_context = proc('eglDestroyContext', uint, ptr, ptr)
    terminate = proc('eglTerminate', uint, ptr)
    display = get_display(0x31DD, None, None)  # EGL_PLATFORM_SURFACELESS_MESA
    if not display or not initialize(display, None, None):
        raise RuntimeError('Unable to initialize surfaceless EGL')
    surface = context = None
    try:
        if not bind_api(0x30A0):  # EGL_OPENGL_ES_API, never EGL_OPENGL_API
            raise RuntimeError('Unable to bind OpenGL ES')
        config, count = ptr(), integer()
        attrs = (integer * 9)(0x3033, 1, 0x3040, 0x40, 0x3024, 8, 0x3023, 8, 0x3038)
        if not choose(display, attrs, C.byref(config), 1, C.byref(count)) or count.value != 1:
            raise RuntimeError('No GLES3 pbuffer configuration')
        surface = create_surface(display, config, (integer * 5)(0x3057, 1, 0x3056, 1, 0x3038))
        context = create_context(display, config, None, (integer * 3)(0x3098, 3, 0x3038))
        if not surface or not context or not make_current(display, surface, surface, context):
            raise RuntimeError('Unable to create a GLES3 context')

        get_string = proc('glGetString', C.c_char_p, uint)
        version = get_string(0x1F02).decode()
        language = get_string(0x8B8C).decode()
        if not version.startswith('OpenGL ES 3') or 'GLSL ES 3' not in language:
            raise RuntimeError('Unexpected context: ' + version + ' / ' + language)
        create_shader = proc('glCreateShader', uint, uint)
        shader_source = proc('glShaderSource', None, uint, integer, C.POINTER(C.c_char_p), ints)
        compile_shader = proc('glCompileShader', None, uint)
        shader_iv = proc('glGetShaderiv', None, uint, uint, ints)
        shader_log = proc('glGetShaderInfoLog', None, uint, integer, ints, ptr)
        delete_shader = proc('glDeleteShader', None, uint)
        create_program = proc('glCreateProgram', uint)
        attach_shader = proc('glAttachShader', None, uint, uint)
        link_program = proc('glLinkProgram', None, uint)
        program_iv = proc('glGetProgramiv', None, uint, uint, ints)
        program_log = proc('glGetProgramInfoLog', None, uint, integer, ints, ptr)
        delete_program = proc('glDeleteProgram', None, uint)

        def log(handle, get_iv, get_log):
            size = integer()
            get_iv(handle, 0x8B84, C.byref(size))
            buffer = C.create_string_buffer(max(1, size.value))
            get_log(handle, len(buffer), None, buffer)
            return buffer.value.decode(errors='replace')

        results = []
        for entry in programs:
            shaders, failures = [], []
            program = create_program()
            try:
                for stage, kind in [('vertex', 0x8B31), ('fragment', 0x8B30)]:
                    source = entry[stage]
                    if not source.startswith('#version 300 es'):
                        raise ValueError(entry['name'] + ': expected unchanged GLSL ES 300')
                    shader = create_shader(kind)
                    shaders.append(shader)
                    encoded = C.c_char_p(source.encode())
                    shader_source(shader, 1, C.byref(encoded), None)
                    compile_shader(shader)
                    ok = integer()
                    shader_iv(shader, 0x8B81, C.byref(ok))
                    if not ok.value:
                        failures.append({'stage': stage, 'log': log(shader, shader_iv, shader_log)})
                    attach_shader(program, shader)
                if not failures:
                    link_program(program)
                    ok = integer()
                    program_iv(program, 0x8B82, C.byref(ok))
                    if not ok.value:
                        failures.append({'stage': 'link', 'log': log(program, program_iv, program_log)})
                results.append({'name': entry['name'], 'passed': not failures, 'failures': failures})
            finally:
                delete_program(program)
                for shader in shaders:
                    delete_shader(shader)
        print(json.dumps({'backend': version, 'language': language,
                          'renderer': get_string(0x1F01).decode(), 'programs': results}, indent=2))
        return 0 if results and all(r['passed'] for r in results) else 1
    finally:
        make_current(display, None, None, None)
        if context:
            destroy_context(display, context)
        if surface:
            destroy_surface(display, surface)
        terminate(display)


if __name__ == '__main__':
    sys.exit(main())
