# Visual Golden Slice — GS02

Status: **VALIDATION_PENDING**. Environment implementation and available validation
are complete; native Browser gameplay, hardware GPU, Pixel Fold and animation
crossfades require the Integration WORK's environment. This is not a release pass.

Implementation base: `charukun/bloodline-legacy`, `develop`,
`9ee25afc5f67e142adc313813b4289d157d47935`.
Working branch: `work/visual-golden-slice-20260908`. Do not merge automatically.
The supplied v4 common policy and implementation prompt v2.0 were read. Reference
A is the supplied 21.83-second video; B is village atmosphere, C/D are outside this
WORK's remit. No reference pixels or rules are included in the game assets.

## Scope and implementation

The render-only district occupies `-16 < x < 16`, `-14 < z < 22`: the well square
and the adjoining central street and school frontages. The existing map, building
positions, interaction positions and collision data are consumed without writes.
Trees can extend their canopies past the district edge. The distant outer forest,
other environments, UI and Character specialization are not redesigned.

`GoldenArt extends VillageArt` is installed in the existing adapter. The previous
GS01 files/ZIP were not used as implementation source. Existing lanterns, grass,
school-role props, roughness pipeline, weather and instancing are retained. The
existing well already had rope, axle and bucket: these are preserved as concepts
while rebuilding its hollow stone annulus. No hero/gait overrides are introduced.

- Connected irregular courses of bevelled flagstones, dark joints, low relief,
  restrained moss and a transition into existing dirt paths.
- Thin overlapping slate with physical row separation, ridge and eaves, plaster
  gables, timber framing, stone quoins, masonry courses and recessed warm windows.
- Open well coping and inner wall with water below the rim; one nearby lantern
  enters the existing nearest-light selection, with unchanged intensity/bloom.
- Asymmetric planted edges, retaining stones, raised soil pockets, benches,
  barrels, cart and flowers, plus broadleaf/conifer height variation. Crossroads
  and existing interaction approaches stay open.
- Four shared native meshes and one original 512×512 pigment/roughness atlas.
  Grout is consolidated into a single low polygon mesh. Other repeated elements
  use the existing instanced draw path. No new runtime dependency is shipped.

Surface IDs 20–23 select flagstone/masonry/timber/slate. Texture unit **6** is used;
unit **5** remains the existing Character bone palette. Existing surface IDs and
Character vertex shaders retain their behavior. The atlas adds approximately
1.33 MiB of texture storage with mipmaps; this is an estimate, not GPU telemetry.
The native `renderer-base.js`, Character rig, camera and post processing are unchanged.

## Visual iterations

1. Baseline: isolated white stepping stones, puffy roof tiles, a filled-looking
   well, weak material separation and empty ground around the square.
2. Connected paving, open well, thin roofs, window/gable details and grouped
   planting establish a readable central place. Review found regular tiling,
   checker-like roof color variation and overly symmetric tree placement.
3. Vary course width/depth, reduce roof color jumps, separate overlapping rows,
   darken joints, offset planted edges and add low banks. Consolidate grout to
   remove hundreds of extra instance submissions.
4. Add conifer branch silhouettes, preserve existing flowers (a broad green-color
   classifier was corrected), protect the Character texture unit, and retest.
5. Initial timing found a 16% offline slowdown. Remove the redundant legacy color
   atlas fetch for authored materials, skip zero-intensity local-light BRDF work,
   and simplify the stone outline to six chipped sides. Retain bevels, normal
   detail, lighting and placement; repeat the same capture and timing protocol.
6. Skip local-light BRDF work beyond its existing zero-contribution radius. The
   clear capture is pixel-identical before/after this optimization; retime both
   weather presets. No light radius, intensity or visible result is reduced.

The same-camera comparisons show a substantial reduction in the original gaps
in ground continuity, roof thickness, well structure and scene grouping. Remaining
Reference A differences include its broader forest enclosure, more varied terrain
silhouette and more detailed Character assets. Those are not concealed with fog,
DOF, stronger bloom or particle density. Visual assessment is qualitative; it is
not a numerical image-similarity measurement or proof of hardware performance.

## Reproduce

```sh
npm ci
npm test
python3 tools/author_golden.py
```

`npm test` builds the actual standalone output, then runs eight environment tests
and six existing infrastructure tests. The real DEV deployment build and embedded-asset integrity check are also run
locally. It does not call the legacy Playwright
smoke, which is not an acceptable boot assertion in this environment.

Acquire a separate frozen GitHub base checkout and run the differential replay:

```sh
node tests/compare_golden.mjs /absolute/path/to/base-checkout
```

It checks 16 protected source files, exact initial map/snapshot/Character draw data,
frontier art, 1,200 simulation ticks with movement/dash/rest/talk/attack commands,
and save/restore equality. Pickup/equip without an eligible target return false
in both versions; this does **not** claim successful pickup/equip UI coverage.

## Alternative visual verification

The available normal Browser reports WebGL2 unavailable on both base and candidate.
No replacement rendering mode is inserted into the game. The diagnostic route is
**offline OpenGL/EGL llvmpipe**, not Browser QA or a hardware/device emulator.

`export_scene.mjs` executes the actual scene authoring, assets, camera, weather,
local-light selection, culling, LOD and `drawBatches`. `render_offline.py` draws those
instances with the actual game shaders, shadow maps, rain pass and post processing.
The GLSL ES 300 headers become GLSL 330; depth attachments use the desktop driver's
format. The existing Character pose is flattened into rigid instances. The skin
vertex/material program is also linked, but bone-palette transitions are unverified.

Install Python requirements and an EGL-capable Mesa runtime (Ubuntu packages
`libegl1`, `libegl-mesa0`, `libgl1-mesa-dri`), then:

```sh
python3 -m pip install -r tests/offline-requirements.txt
LIBGL_ALWAYS_SOFTWARE=1 node tests/capture_golden.mjs /absolute/base /absolute/evidence
LIBGL_ALWAYS_SOFTWARE=1 python3 tests/render_offline.py /absolute/evidence/after-gameplay-rain public/assets --benchmark --seconds 30 --runs 3
```

`GOLDEN_EGL_LIBRARY` optionally specifies `libEGL.so.1` for a user-local EGL runtime.
`LD_LIBRARY_PATH` and `__EGL_VENDOR_LIBRARY_FILENAMES` may be needed for that runtime.
On this WORK's Ubuntu environment those two official packages were hash-verified
and extracted into scratch; no system privilege or browser flags were changed.

Captures use seed 7349, time 0, medium quality, yaw .42 and pitch .68. Gameplay:
hero `(1.8,16)`, camera `(1.8,14.5)`, zoom 16, 960×720. Street: hero `(0,-1)`, zoom
16. Portrait: 780×1000, same gameplay position; this is an aspect-ratio diagnostic,
not Pixel Fold emulation. Overview zoom 23 is explicitly a diagnostic wider view.

Performance records: 10-second warmup, three 30-second runs for each of Before/
After × clear/rain, identical fixed camera and existing animated wind/rain. Every
frame is submitted and completed (`ctx.finish`); recording is disabled. Raw frame
intervals, percentiles, >100ms counts and per-run totals are retained. This measures
offline scene rendering, not Browser frame pacing, native GPU time or game input.
Static shadow refresh counts are distinguished from stationary frame draw counts.
`profile_golden_cpu.mjs` separately measures the real culling/packing code with a
fake GL sink, and observes Node heap around eight identical scene rebuilds. These
are diagnostics, not native driver/GPU or Browser heap measurements.
`capture_golden_walk.mjs` replays existing Simulation movement and gait into a
15 fps offline review clip. Its export rate is not game FPS. Inspect foot contact
and scene overlap there; GPU bone-palette crossfades still require the Browser.
Browser heap/GC and device thermals cannot be inferred from this renderer.

## Integration gates

Review on a branch from latest develop. If the base moved, compare each overlapping
change; never copy the old entire snapshot over newer Character or renderer work.
Review `build.mjs`, asset decode, shared material shader, texture unit 6 and adapter
construction as the likely integration points. No deployment settings are changed. `deploy/check-build.mjs` now checks the exact
six-asset set, including the new atlas, rather than the previous five-asset count.

On a WebGL2-capable preview/DEV, verify normal start, walk through the square and
street, facility approaches, camera movement/occlusion, foot contact and Character
transitions, clear/rain, context restore, and the existing save/restore, growth,
generation, interaction and combat smoke. Measure actual Desktop and Pixel Fold
FPS/p95/p99/long frames and memory through a several-minute route. Use the prompt's
60/30 FPS budgets and pacing gates. Mark only those genuinely run as PASS.

The normal Browser evidence in this handoff is the WebGL2 startup error; all scene
images are explicitly offline captures. GitHub branch creation returned 403
`Resource not accessible by integration`; the fallback package is for review and
integration, not a claim that develop, CI, DEV or a PR contains this change.
