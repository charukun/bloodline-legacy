// Serialized into the CI-owned page. No production renderer or quality changes.
export function installCharacterPerformanceProbe(app, scope = globalThis) {
  const renderer = app.renderer, original = renderer.render;
  const pixel = new Uint8Array(4);
  let active = false, started = 0, complete = false, frames = [];
  renderer.render = function (...args) {
    const submitted = scope.performance.now();
    const result = original.apply(this, args);
    const gl = this.gl;
    // Submission timestamps can run ahead of SwiftShader. Bound outstanding
    // work to one fully rasterized frame, including during warm-up. readPixels
    // synchronizes the final default framebuffer; no drawing is skipped.
    if (gl.isContextLost()) throw Error('Character performance WebGL context lost');
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const t = scope.performance.now();
    if (active) {
      frames.push({t, submitted, completionMs:t-submitted, calls:this.stats.calls,
        triangles:this.stats.triangles, cpu:this.stats.cpuSubmitMs});
      if (t-started >= 30000 && frames.length >= 13) {
        complete = true; active = false; app.closed = true;
      }
    }
    return result;
  };
  return {
    begin() { frames=[]; complete=false; started=scope.performance.now(); active=true; },
    get complete() { return complete; },
    stop() {
      active=false; app.closed=true; renderer.render=original;
      return {frames, complete, elapsedMs:scope.performance.now()-started,
        stats:renderer.stats};
    },
  };
}
