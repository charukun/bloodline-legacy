# Plaza collision, surfaces and rendering cost

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](README.md)。

Base: develop `4b9693364c5687ffc04bf57101c80394738fe59c` (camera PR #17 merged).
Branch: `work/plaza-surface-performance-20260909`.
Project Sources: Common Development Policy v5; Implementation Prompt v2; user reference `1000002824.png` and explicit request to fix well collision and improve visual quality/rendering cost. The user's GitHub workflow and v5 supersede the older implementation prompt's handoff-only rule. User reviewed the supplied playable preview and explicitly requested PR creation on 2026-09-09. PR-time develop is `fad97fc` (Skill Motion PR #18); its changed files do not overlap this work. Integration and CI should verify the combined result.

## Changes

- The square (`dance`) was excluded from building collision and had no well collider. Add a 1.30 world-unit circular well/post footprint plus the existing body radius. Ordinary movement, dash, attack steps and knockback use the existing swept substeps. Normal bounds correction also recovers older saves inside the well. The square's activity radius remains unchanged.
- Warmer limestone, recessed masonry courses, packed material-specific relief, timber grain and slate cleavage. The same 512×512 atlas now packs pigment in R, slopes in GB, roughness in A. Golden materials use one surface texture lookup instead of two. Existing terrain AO and wet response remain active.
- Slightly wider earth joints, irregular worn areas and edge spacing break up uniform paving. Larger bevelled slate pieces make roof thickness readable with fewer pieces. Changes to art stay inside the established Golden District.
- Static roofs use their existing solid roof shells for shadows; omit overlapping tiles and very low paving from the shadow pass. Rounded scenery and rings use shared lighter meshes at small projected sizes or in static shadows. Character main/shadow geometry is unchanged.
- Reuse per-mesh typed instance buffers instead of allocating a new large Float32Array for each batch/pass/frame. Only populated rows are uploaded.
- No change to camera follow, default tilt-shift, settings, skills, character assets, combat timing, movement speeds, save schema, fog, bloom or render resolution.

## Research and decisions

Pocketpair's own development account confirms late-stage optimization work, but does not provide a transferable breakdown of rendering techniques or comparable mobile performance: [Pocketpair development account](https://note.com/pocketpair/n/n54f674cccc40).

[Official Epic content-performance guidance](https://dev.epicgames.com/documentation/en-us/unreal-engine/performance-guidelines-for-artists-and-designers?application_version=4.27) recommends simpler geometry/LOD, limiting shadow casters, shared/batched content, mipmaps and fewer texture samples. These are general techniques, **not verified claims about Palworld's internal implementation**. We selected only techniques justified by this renderer's measured workload. No Unreal migration, Nanite, Lumen or DLSS dependency was introduced.

Rejected after measurement: caching a second world-AABB representation of every static instance. It gave only a small/noisy CPU benefit, added memory and slightly expanded culling. The existing geometry-aware culling remains intact. A first ring-LOD attempt added two steady draw calls; the final thresholds and smoother 20×6 ring mesh retain the baseline steady call count.

## Same-condition evidence

Seed 7349; age 14; player (1.8, 16); 540×960; medium; default gameplay camera; clear/rain; same time (0). Native EGL renders use the actual game geometry, materials, lighting and draw batches. **Tilt-shift is excluded from comparison images/timings to expose surface detail; it remains enabled in the playable build.** The reference image is a visual target, not in-game evidence.

| Metric | Develop | Changed |
|---|---:|---:|
| Triangles including static-shadow refresh | 918,916 | 515,350 (−43.9%) |
| Static-shadow triangles | 742,134 | 369,486 (−50.2%) |
| Steady triangles, static shadow cached | 176,782 | 145,864 (−17.5%) |
| Draw calls including shadow refresh + resolve | 67 | 64 |
| Steady draw calls including resolve | 46 | 46 |
| Visible instances | 2,830 | 2,711 |
| Shared mesh source bytes | 1,008,000 | 1,029,600 |
| Atlas PNG bytes | 372,576 | 497,013 |

The atlas's GPU dimensions and channel format are unchanged; encoded download grows about 122 KiB. Reusable CPU upload capacity in this scene is about 1.03 MiB. This trades retained scratch capacity for eliminating repeated large typed-array allocations; it is not a claim of lower total heap usage.

Native EGL / llvmpipe LLVM 20.1.2: 5 warm frames + 40 samples per case, synchronous completion. These measurements exclude UI, browser scheduling, bone-palette transitions and tilt-shift. They are **not desktop GPU or Pixel Fold FPS**.

| Frame case | Before median / p95 ms | After median / p95 ms |
|---|---:|---:|
| Clear, static shadow cached | 76.87 / 124.80 | 56.88 / 67.10 |
| Clear, static shadow refreshed | 121.28 / 147.09 | 89.96 / 106.63 |
| Rain, static shadow cached | 60.68 / 67.95 | 61.69 / 78.02 |
| Rain, static shadow refreshed | 119.38 / 141.00 | 93.42 / 107.71 |

An earlier run had a clear baseline median of 59.56 ms: normal-frame timing is noisy, and rain's steady timing did **not** improve. The supported improvement is lower submitted geometry and shorter shadow-refresh frames (about 22–26% in the final run), not a blanket FPS gain. Node/fake-GL CPU submission (90 samples) was 17.34 → 17.00 ms median and 18.99 → 18.85 ms p95, effectively similar. The repeatable CPU-side saving is allocation reuse, not a proven large timing gain. Raw measurements are in [plaza-metrics.json](evidence/plaza-metrics.json) and the preview comparison.

## Validation

- `npm test`: build and 150 tests PASS, including gameplay/save/skill/character/camera/panel regression tests.
- New collision tests: 3 village seeds × 16 approach directions, ordinary move and dash commands, backing away, complete square perimeter, old-save recovery, actor knockback radius and front-room isolation.
- Rendering tests: finite geometry, deterministic art, district bounds and walking relief, roof shadow retained, unchanged character passes, upload-buffer reuse and correct live-row counts, terrain submission across positions/camera angles/aspect ratios.
- Native EGL links main, depth, post, rain and character material shaders; clear/rain renders inspected.
- UNVERIFIED: live browser WebGL2, Pixel Fold GPU/frame pacing, touch feel and on-device collision/visual confirmation. This environment has no local Chromium executable; existing tests and native EGL were used as authorized. The downloadable preview runs the actual built game; the user approved it for PR submission. This is not a measured hardware FPS result.

Reproduction: `node tests/export_scene.mjs <checkout> <output> '{"width":540,"height":960,"x":1.8,"z":16,"age":14,"gameplayCamera":true}'`; add `"weather":"rain"` for rain. `tests/render_offline.py` consumes those exports and the matching checkout's assets. Never render a baseline with the changed packed atlas.
