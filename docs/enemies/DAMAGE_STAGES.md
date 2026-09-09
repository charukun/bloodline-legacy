# Enemy damage presentation — vitality correction, 2026-09-09

The subsequent user-approved [weakness-motion revision](WEAKNESS_MOTION.md)
adds posture/gait and enemy speed/recovery changes. This document describes
the earlier damage-layer scope; the motion document governs the current delta.

All **31 hostile forms and 2 neutral creatures** use the enemy's remaining
vitality to drive whole-body scratches, fractures and dirt. This corrects the
initial per-part interpretation following the user's clarification. PR #58 is
synchronized with develop `8050da52899d5fd3761ca1f51383be2aea80c99d`, including
the integrated enemy expansion, plaza materials and raised terrain. This WORK
does not merge into develop.

## Authoritative inputs

`src/enemies/damage.js` computes wear as **1 − clamp(hp / hpMax, 0, 1)**.
Every retained body region receives that same damage amount. There is no
contribution from local wound severity, hit count, damage depth or accumulated
wound totals. Missing/invalid HP data defaults to clean appearance.

| Remaining HP | Whole-body presentation |
|---|---|
| 100% or above | Clean |
| Below 100%, above 60% | Small scratches grow with lost HP; dirt starts at 90% |
| 60% to above 30% | More scratches, edged cracks, spreading dirt and worn cloth |
| 30% to 0% | Broad scars, deeper fractures, most extensive dirt |

These are **visual thresholds only**. Mark size and shader strength scale with
HP loss within each stage. Existing `wounds[part].severity === 'lost'` alone
controls that part's missing geometry, attached equipment and broken joint rim.
Low HP never creates limb loss. Restoring HP reduces wear but does not repair
an actually destroyed part. Broken limbs remain broken on corpses.

No actor/save fields are written, no RNG is consumed, and no damage, AI,
break probability, injury penalty, collision, socket reach or combat timing
rule changes. The final diff has no simulation/core/archive changes against
the pinned develop. Raised ground placement from #54 is preserved.

## Species-specific appearance and motion

| Family | Whole-body wear | Actual break |
|---|---|---|
| Goblins / ruler | Dried scratches and uneven dirt | Closed torn joint; attached armor removed |
| Bone soldiers / executioners | Bind-space fractures, patina, torn mantle, chipped crest | Missing limb, shoulder armor and associated weapon |
| Crawlers / stone forms | Pale-edged shell cracks and deposits | Jagged rigid rim |
| Beasts / bat / neutral flesh | Fur/membrane scratches and mud | Closed limb/wing joint |
| Spirits / jelly | Dark fissures and luminous inner seams | Luminous torn edge |
| Fungus | Cap/stalk tears and dirt | Cut lobe and exposed rim |

The same global amount drives each family; color and material response match
its flesh, shell, bone or spirit concept. These are stylized non-graphic marks.
Per-part attachment transforms are retained so surface marks follow animation,
hitstop and death. They locate marks; they do not determine damage severity.
Retained weapon/VFX contact sockets and animation timing are unchanged.

Three opaque mark meshes are shared and instanced with existing batches.
Cached ray-to-face placement keeps marks on curved procedural surfaces.
Skinned bodies reuse their material shader with two uniform vectors. No new
programs, textures, transparent passes, per-actor geometry, bones or clips.
Low quality bounds dirt and cuts to one each per retained part.

## Review sample

`npm run build && node tools/enemies/build-review.mjs`

Open `dist/Bloodline_Legacy_Enemy_Review.html`:

1. Move **生命力** from 100% toward 0% to increase whole-body wounds and dirt.
2. Select **部位破壊** independently; **なし** keeps all limbs intact at any HP.
3. Select attack, movement, guard, hit or death; pause/seek to compare a fixed pose.

Vitality, broken part and motion are independent preview settings. HP changes
retain pause/position and do not recreate shader/skin resources. The sample
never creates Game or saves progress. Performance JSON records remaining
vitality and the broken part separately. The old combined stage/part selectors
and automatic loss motion were replaced to remove their misleading coupling.
The standalone HTML embeds its resources and needs no external CDN.

## Assets and licensing

This correction adds no external assets. The ten bone forms retain the audited
**CC0-1.0 KayKit Skeleton Warrior**: 743,788 bytes, 23 bones, 8 clips, 5,104
triangles and no image textures. Original project meshes provide the remaining
forms and all wear geometry. Asset, source and license bytes are unchanged;
see `public/assets/enemies/provenance.json` and the retained license texts.

## Current verification

Build: PASS. Focused enemy/review/shader/terrain tests: **42 passed, 0 failed,
0 skipped**. Asset/license gate: PASS. Native GLES: **9 / 9** programs.

- Whole-body HP mapping, all 33 forms, actual limb loss, moving/frozen/dead
  poses, actor immutability, save restoration and repeated combat equivalence
  against develop `8050da5` are covered by the enemy tests.
- The delivered HTML is executed in Node/JSDOM with decoded embedded images
  and recorded GL submissions. Checks cover all models, motions, HP/break
  controls, paused scrubbing, errors and 24-actor quality switches.
- Unchanged embedded GLSL ES strings compile/link in native GLES, including
  the float-plus-int rejection control for the previous mobile shader error.
- Native EGL captures show the same wolf, soldier and wraith at remaining HP
  **100 / 82 / 52 / 22 / 0%**, with empty local wound records and no broken limbs.

[HP comparison](evidence/vitality-stages.jpg) ·
[Focused test log](evidence/vitality-tests.txt) ·
[Native GLES](evidence/vitality-gles.json) ·
[Asset/license validation](evidence/vitality-asset-validation.json) ·
[CPU / geometry](evidence/vitality-budget.json) ·
[Source hashes and results](evidence/vitality-validation.json).

Shared damage geometry remains **2,232 bytes**. Peak intact-body overhead is
**342 triangles / actor** at medium and **114** at low, unchanged from the
previous all-parts worst case. At most three shared rigid batch types are added
per world/shadow pass, independent of actor count.

The new CPU-only sample at 24 mixed enemies recorded medium clean p50/p95
**7.37 / 28.91 ms**, versus **16.84 / 48.64 ms** at 22% HP. Large GC/shared-host
outliers are present. This measures pose and batch construction only; it
excludes world, combat, GPU and browser and does **not** establish frame rate.
More actors now visibly wear at low HP even without local wound records; this
is intentional but warrants sustained device measurement.

Browser execution is unavailable following the supported browser's explicit
security rejection; no alternate browser/Playwright/CDP route is used. These
native and Node diagnostics are **not browser QA**. Actual full-game rendering,
Pixel Fold sustained 30 fps and desktop 60 fps remain **UNVERIFIED** before
integration/release. Prior `damage-*` evidence (including the 492-test run)
describes the earlier per-part revision, not this correction.
