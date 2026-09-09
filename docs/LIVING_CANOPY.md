# Living canopy and planted edges

Source at implementation start: develop `573f48a36da38bf0c976f89e6ff30c14f0abc4b8`,
then the explicitly approved, then-open PR #22 (`9f6de49ccd184d0ef30c05c2d921695cfde73d51`).
The combined baseline is `a374fbf40ca6158d56d96715db34a981bdb53c82`.
PR #22 was a pending dependency when the comparison was captured. Current damage and
skill motion changes are present in this checkout. Policy v5 and the supplied
Reference A apply. Branch: `work/plaza-living-canopy-20260909`.

PR submission: the user approved the playable preview and requested a PR on
2026-09-09. PR #22 is now merged. Fetched and merged develop
`cd5f0344a176802dbfbfd3e9d28edadcd98a9907`, preserving the newer UI, facility actions,
skill discovery and choreography changes. `npm test` rebuilt the combined game
and passed **210/210 tests**. The PR diff against that develop contains only the
four canopy implementation/test/evidence files. The visual measurements below
remain the original controlled comparison, not new measurements of all intervening
develop changes. The approved canopy code is unchanged by this integration.

## Visual changes

- Golden District broadleaf trees have asymmetric boughs with small folded leaves,
  exposed forks, and planted roots. A small opaque interior prevents distant
  pinholes; the leaf perimeter breaks up the old rounded crown silhouette.
- Side-wall trellises and climbing plants, layered shrubs along stone borders,
  and low flower pockets connect architecture, paving and grass. Doorways and the
  well approach retain their existing clearance.
- Five petals share one 20-triangle mesh instead of five spheres. Each new bough
  uses 192 triangles versus 252 for the previous solid crown mesh. These are
  original procedural meshes, reused through existing opaque instancing.
- No extra textures, renderer passes, post processing, simulation writes,
  character overrides, collision or save changes in this iteration.

First iteration had oversized pointed leaves; they were reduced and given a
compact interior before final capture. The foliage is still stylized geometry;
Reference A's fine leaf/stone craftsmanship and richer composition remain gaps.
This is a further bounded environment improvement, not a claim of reference parity.

## Validation and cost

`npm test`: build and **175 tests PASS**. Existing deterministic authoring,
simulation isolation, terrain culling, well collision, skills, damage, camera and
save regression tests pass. The new mesh test verifies opacity, shared geometry
budgets and absence from character batches. Existing small flower heads are
excluded from the new-high-prop obstruction check now that they use a golden mesh.

Actual game meshes/materials/camera rendered with native EGL / llvmpipe LLVM 20.1.2.
Seed 7349, age 14, 540×960, medium, time 0; plaza (1.8,16), garden (-3.5,13).
Clear/rain plaza and clear garden have matching before/after conditions.
Tilt-shift is excluded from diagnostic captures/timings to expose geometry; it
remains enabled in the playable build. No capture is a generated target image.

| Plaza metric | Combined baseline | This change |
|---|---:|---:|
| Triangles including static shadow refresh | 515,350 | 501,778 |
| Steady triangles | 145,864 | 143,748 |
| Calls including refresh and resolve | 64 | 68 |
| Steady calls including resolve | 46 | 48 |
| Visible instances | 2,711 | 2,589 |
| Instance upload bytes/frame | 235,284 | 225,036 |
| Retained instance buffer capacity, bytes | 1,075,456 | 944,384 |
| Shared geometry source bytes | 1,029,600 | 1,044,864 |

Garden-view triangles: 540,418 → 521,998; steady: 152,268 → 145,304.
Two new shared mesh batches increase draw calls while fewer flower instances
reduce geometry and uploads. This does not imply lower total heap or faster FPS.

Native EGL timing, 5 warm frames + 25 samples, median/p95 milliseconds:

| Case | Before | After |
|---|---:|---:|
| Clear steady | 56.35 / 65.56 | 57.39 / 65.27 |
| Clear shadow refresh | 90.05 / 101.28 | 88.23 / 97.52 |
| Rain steady, initial run | 60.83 / 72.49 | 67.47 / 81.13 |
| Rain shadow refresh | 91.22 / 95.95 | 93.65 / 117.03 |
| Rain steady recheck, reversed order, 8 warm + 35 samples | 63.15 / 72.76 | 64.04 / 72.54 |

The initial rain result prompted one targeted recheck, which did not reproduce
the larger difference. CPU submission to a fake GL sink (90 samples) was
18.59/28.76 → 18.64/25.10 ms median/p95. Timing is effectively similar, not a
demonstrated speed gain. All raw results, including the worse initial rain run,
are retained in `docs/evidence/canopy-metrics.json`.

UNVERIFIED: browser WebGL2, mobile touch feel, Pixel Fold/desktop GPU frame pacing,
tilt-shift timing and bone-palette transitions. Native software results do not
measure those. Playable review is provided before opening the new visual PR,
as requested. The user has now approved PR submission; develop merging remains
the responsibility of Integration WORK.
