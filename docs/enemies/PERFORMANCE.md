# Sentinel pilot performance evidence

Target: Desktop 60 fps / Pixel Fold-class mobile 30 fps. **Neither target is verified in this environment.** Browser security blocked the permitted browser route; native EGL uses llvmpipe software rendering on a shared host. These measurements cannot qualify a device or establish a statistically controlled speedup/regression result.

## Asset and rendering budget

| Metric | Downloaded Skeleton_Warrior | Shipped sentinel |
|---|---:|---:|
| GLB bytes | 4,863,620 | 743,788 (−84.7%) |
| Triangles | 5,934 | 5,104 |
| Primitives / materials | 10 / 1 | 1 / 1 |
| Bones | 41 | 23 deform/socket |
| Clips | 95 | 8 |
| Image textures | 1 × 1024² palette | 0; linear vertex colors |

The standalone build grows from 12,438,720 to 13,451,847 bytes (+1,013,127 bytes, about 8.1%), including the base64-embedded GLB and runtime adapter.

One indexed body VAO and its vertex/index buffers (394,080 bytes total) are shared across all sentinel actors. Each visible actor has a 4×23 RGBA32F skin palette (1,472 bytes), refreshed once per frame, reused for color/shadow. Body records unused for more than two frames release their textures. Gear uses the existing rigid mesh cache. There is one body draw and one equipment draw per actor per relevant pass; blob shadows and combat effects remain shared batches. No new runtime library or texture decoder is introduced.

The source helmet is removed. Small new equipment details use boxes/beads instead of unnecessarily dense rounded meshes. The eight retained clips discard IK channels and collapse constant tracks. Skinning evaluates 23 matrices and uses the existing nonuniform-scale normal handling. Desktop/medium shadows still use full body geometry; a body LOD is not implemented in this pilot.

## Geometry comparison (two enemies, same north-road camera)

The offline exporter groups rigid pieces by geometry type; this differs from the browser's per-actor gear skin draw. Triangle totals include the exported dynamic pieces and the two indexed bodies, excluding the unchanged static world and FX.

| Pass | Before | After | Change |
|---|---:|---:|---:|
| Color dynamic triangles | 13,580 | 14,512 | +6.9% |
| Dynamic shadow triangles | 6,856 | 14,224 | +107.5% |

The shadow increase is a concrete remaining cost: the old primitive renderer selected coarse shapes in its shadow pass. Low quality disables that pass via the existing renderer policy. Do not broaden this approach to large crowds before the real-device gate; consider a lower-detail body shadow mesh or LOD if the measured GPU cost warrants it.

## Native EGL full-world diagnostic

- Backend: llvmpipe (LLVM 20.1.2, 256 bits), **software**.
- View: 1100×760, medium, seed 7349, clear weather, time 2, x=0/z=−33, zoom 10.5, yaw .32, pitch .48; soldier and elite on the north road.
- Before and after rendered sequentially; 10 seconds warmup and three 10-second runs each. No real browser, input, game simulation or GPU timing query is exercised. Values reflect rendered static poses, not ongoing animation cost.
- Raw intervals and options: `evidence/egl-before.json`, `evidence/egl-after.json`.

| Version / run | FPS | p50 ms | p95 ms | p99 ms | Max ms |
|---|---:|---:|---:|---:|---:|
| Before 1 | 11.16 | 74.77 | 166.39 | 234.49 | 280.97 |
| Before 2 | 11.76 | 74.97 | 114.31 | 227.32 | 249.05 |
| Before 3 | 9.76 | 80.26 | 260.95 | 320.37 | 387.11 |
| After 1 | 10.85 | 81.69 | 149.72 | 225.13 | 315.82 |
| After 2 | 6.44 | 134.15 | 342.56 | 406.49 | 450.60 |
| After 3 | 10.84 | 83.89 | 128.69 | 181.18 | 333.24 |

Run variability is large, especially after run 2. The data does not demonstrate an acceptable performance regression envelope. No runs have been hidden to manufacture a favorable result. Earlier iterative measurements were used for diagnosis only; this is the final paired idle scene comparison.

## Node pose sampling diagnostic

Node v24.19.0, 300 warmup frames then 600 frames, mixed soldier/elite running from actual position deltas. This measures pose sampling only, excluding gear, browser, driver, world and simulation. Raw samples: `evidence/pose-cpu.json`.

| Actors | p50 ms | p95 ms | p99 ms | Max ms |
|---|---:|---:|---:|---:|
| 2 | 0.51 | 1.20 | 2.95 | 138.32 |
| 8 | 2.22 | 7.84 | 19.13 | 50.49 |
| 24 | 6.71 | 12.22 | 31.92 | 320.97 |

Long stalls are retained in the evidence. Many per-frame temporary arrays remain in the sampler. If real mobile profiling shows GC pressure, the next bounded optimization is reusable pose/matrix buffers and binary-search/cached animation key indices. Do not extrapolate these Node costs to Pixel Fold frame rates.

## Required completion

Use `npm run build` then `node tools/enemies/build-review.mjs`. The comparison page supports original/replacement, 2/8/24 actors, poses, quality, view angle and raw 40-second measurement export. Also verify actual combat in the game. Record matched desktop and Pixel Fold-class before/after results, live animation and loss/FX behavior, GPU time where available, memory lifecycle and all presentation regressions described in `SESSION_RECORD.md`. Integration must resolve this gate before merge/rollout.
