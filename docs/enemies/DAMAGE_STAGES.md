# Enemy damage presentation — 2026-09-09

Implements the user's request for gradual wounds/dirt and lasting post-break
appearance across all **31 hostile forms and 2 neutral creatures**. This branch
carries the complete unmerged enemy work from #52. Created from develop
`c53f9b2c918ff71525b76ea4b20c8b530429a26e`, then synchronized with develop
`8ade374c84709e9ebcdfc77944b76ead87c0c8ba` (plaza craft integration). No merge
into develop is performed here.

## Existing combat data, presentation only

`src/enemies/damage.js` consumes existing `hp / hpMax`, six `wounds` and six
`damageMarks` records. It writes no actor/save fields, advances no RNG, and adds
no damage, AI, break probability, injury penalty, hitbox or timing rule.

For each part, normalized injury is the maximum of existing wound severity
(light .22, heavy .70, lost 1), accumulated depth / 5 and hit count × .16.
The existing record limits remain authoritative. Stages are clean, light
(positive), medium (≥ .40) and heavy (≥ .70). Overall wear uses lost HP and
bounded accumulated part injury. A part can be badly damaged while the actor
still has plenty of HP; low HP alone does not invent a severed limb.

| Family | Local injury | Accumulated wear / break |
|---|---|---|
| Goblin / ruler | Shallow then wider dried scars | Uneven dirt islands; closed torn joint, attached shoulder armor removed |
| Bone soldiers / executioners | Bind-space bone/armor fractures | Dark patina, torn mantle hems, chipped crest, lost shoulder armor and weapon |
| Crawlers / stone forms | Pale-edged shell cracks | Muted deposits and jagged rigid joint rim |
| Beasts / bat / neutral flesh | Fur/membrane scratches then deep scars | Mud on limbs/body; closed joint after limb/wing loss |
| Spirits / wraith / jelly | Dark fissures, brighter internal seams | Faded shroud/core patches; luminous torn joint edge |
| Fungus | Cap/stalk tears | Dirt on cap/feet, cut cap lobe and exposed rim |

These are stylized, non-graphic marks; they do not use gore textures. Ordinary
combat, attack clips, hitstop, guard, death and wounded poses use the same
presentation clock and deformation/part transforms as before. Broken geometry
and marks remain while the corpse is rendered. Retained limbs keep their
original VFX contact sockets. Lost creature limbs provide no active socket.

The three opaque mark meshes are shared and instanced with existing batches.
Large curved surfaces use a cached ray-to-face placement on the existing
shared mesh, then transform with the part. This corrected floating marks found
in the first native captures. There are no projected world-space textures,
additional transparent passes, per-actor geometry buffers, new bones or clips.
Low quality limits dirt islands and cuts to one each per part. Bone bodies add
two uniform vectors to their existing material shader, with a clean-body early
return; no new shader program is introduced.

## Review sample

`npm run build && node tools/enemies/build-review.mjs`

Open the generated `dist/Bloodline_Legacy_Enemy_Review.html` and use **損傷** and
**部位**. Light / medium / heavy fixtures use 18% / 48% / 78% HP loss plus staged
local wound records. The 82% break fixture applies to limbs; choosing break
while head/torso is selected switches the selector to right arm. Percentages
are sample HP-loss fixtures, not new gameplay thresholds or severing rules.

Damage selection retains playback position and pause state. Sequence, attack,
run, guard, hit and death continue to work. Pause/seek allows pose comparisons.
"動作に合わせる" retains the original demo's motion-specific fixtures. Before
uses the old family model; after uses the expanded enemy and damage renderer.
The performance JSON records the selected damage and part. The sample never
creates Game or saves progress.

## Compatibility and provenance

The only simulation difference inherited from #52 is the existing deterministic
appearance/name metadata for spawns. Latest develop now requires immutable
simulation archives, so the merged source is registered as
`4a4d9e684f5172142308358ae6a41a1d2854121571c08ebdb045beb44919d7be` using
`node tools/archive-simulation.mjs`. Prior archives and schema migration remain
intact. No damage-presentation fields are added to the save schema.

New damage geometry/shader code is original project work. The ten bone forms
continue to use the audited **CC0-1.0 KayKit Skeleton Warrior**, 743,788 bytes,
23 bones, 8 clips, 5,104 triangles and no image textures. GLB/source/license
bytes are unchanged. See `public/assets/enemies/provenance.json`, the retained
CC0 text and source license. No new external assets or license assumptions.

## Evidence and remaining gates

- `tests/enemy-damage.test.mjs`: all forms × six parts × stages, finite marks,
  actor immutability, actual weapon contacts, limb closure and removal,
  moving/frozen/dead poses, legacy data, save restoration and repeated combat
  HP/wound/event/RNG equivalence against pinned develop.
- `tests/enemy-review.test.mjs`: actual generated HTML, decoded embedded assets
  and renderer submissions in Node/JSDOM with recorded GL. All forms/motions,
  stage/part controls, pause/resume, render errors and 24-actor quality switches.
- Native GLES checks compile/link the actual embedded shader strings unchanged
  as GLSL ES. The float-plus-int negative control remains rejected. This
  specifically protects against the user's previous mobile shader failure.
- Native EGL captures use the real meshes, skin palettes, uniforms, world
  shaders and draw batches. They are visual diagnostics, **not browser QA**.

[Staged injuries](evidence/damage-stages.jpg) ·
[Broken parts and death](evidence/damage-breaks.jpg) ·
[CPU / geometry data](evidence/damage-budget.json) ·
[Native GLES results](evidence/damage-gles.json) ·
[Asset/license check](evidence/damage-asset-validation.json).

The supported browser's explicit security rejection prevents browser execution
in this WORK; no alternate browser, Playwright or CDP route is used. The user's
prior display confirmation concerns the earlier HTML. New live-combat browser
rendering, Pixel Fold sustained 30 fps and desktop 60 fps remain **UNVERIFIED**
and must be checked before integration/release. CPU construction measurements
exclude world drawing, combat, GPU and browser. They are not FPS results.

## Recorded integrated results

- Full `npm test`: **490 passed, 0 failed, 0 skipped**. DEV deployment build and
  embedded asset integrity: PASS. Native enemy GLES: **9 / 9**, plus the
  existing wider renderer GLES tests and negative controls in the full suite.
- Nine final native captures after the plaza merge cover representative skin,
  shell, fur, spirit and fungus injury stages, damaged attacks, lost parts and
  corpses. All 33 forms are additionally exercised by the automated checks.
- Shared damage geometry: **2,232 bytes**, 3 meshes; zero new image textures,
  model downloads, bones, clips or per-actor geometry resources.
- Maximum all-six-parts damage: **342 extra triangles / actor** at medium;
  **66** at low. Break rims use the third shared mesh. At most three additional
  rigid batch types per world/shadow pass globally, independent of actor count.
- Node construction/pose at 24 mixed actors: medium clean p50/p95
  **7.48 / 13.37 ms**; every part heavily wounded **10.69 / 20.48 ms**.
  Low-detail heavy p50/p95 was **10.50 / 47.67 ms**, with substantial GC/shared
  executor outliers; reduced geometry is not evidence of faster frame pacing.
  These CPU-only figures do **not** establish either project FPS target.
- No per-body LOD or device-specific tuning is added. Sustained full-game
  performance, broken-edge appearance at every device angle and native mobile
  browser startup remain Integration's review gates.

[Full test log](evidence/damage-tests.txt) ·
[Validation/source hashes](evidence/damage-validation.json).
