# Skill Motion WORK

BASE_BRANCH: `develop`  
BASE_COMMIT: `460d51d0cbfbe497bbb2e9fb02c58ae4a14d8e20`  
Rebased onto: `4b9693364c5687ffc04bf57101c80394738fe59c` (camera and landscape panel integration)

## Sources and scope

Read the supplied Common Development Policy **v5 / Ready PR** and Implementation
Prompt **v2.0** (2026-09-08), the three supplied visual references and the gameplay
recording. The explicit Skill Motion request and v5 supersede the older prompt's
handoff-only GitHub workflow. The attached standalone game is historical context;
implementation and observed gameplay contracts come from the fixed develop above.
No separate current specification document was supplied beyond these sources.

The combat reference communicates intention through a lowered center of mass,
separated feet, torso rotation and a readable weapon silhouette. A still image
cannot establish hit timing. The implementation therefore keeps Simulation's
charge/swing/recovery durations and **.43 of each hit interval** as authoritative.

## Changes

- `src/legacy/motion.js`: presentation-only `SkillMotion`; charge, contact,
  follow-through and return keys; hips lead shoulders; articulated elbows/wrists;
  deliberate stance and weight transfer. Classic fists, polearm, heavy strikes,
  kicks and palm strike receive appropriate motion instead of the slash fallback.
  Catalog family accents and phase/weight scaling distinguish small and large arts.
- `src/legacy/art.js`: torso pivots above the pelvis; forearms and equipment follow
  elbows/hands. Original age/race rigs use planted feet through attack and recovery.
- `src/character/rig.js`: shared world foot targets and two-bone leg solve for the
  original rigs, including a pelvis adjustment for both feet. Avoid a second matrix
  crossfade delaying the weapon during an active hit; retain charge/exit blending.
- `src/character/golden-master.runtime.js`: apply the same pose and footing to CM01;
  preserve the supporting leg's IK for kicks and land leaps by contact; do not low
  pass the authored hand rotation past the hit. Locomotion's existing IK is retained.
- `src/render/combat-presentation.js`: read the same beat clock and motion family;
  returning cuts reverse their arc. Existing real weapon-tip trails are retained.

Internal multi-hit boundaries interpolate into the next loaded pose. A one-handed
weapon stays in its equipped hand for the returning cut. World foot anchors follow
actual snapshot displacement, including collision-clipped lunges; only raised feet
reposition, and an impact stop pauses an in-progress plant. A leap's flight occurs
before contact, followed by grounded compression. The short visual weight offset
does not move the simulation root, collider, reach or target.

No changes to skill definitions, damage, hit events, cooldowns, input, UI, saving,
age/growth, or rule enforcement. No extra texture, model, draw pass or VFX budget.
Ground surface indexing is shared between both rigs. Foot state is renderer-owned
and pruned; it is never serialized with the game.

## Verification

- Initial develop: `npm test` **133 PASS**.
- After rebasing onto the integrated camera/UI develop: `npm test` **153 PASS**
  (including build). The 10 added motion tests cover all retained skill curves,
  release/beat continuity, 30/60/120 Hz contact hand positions, weapon matrices,
  leap landing, kick support, collision-clipped stepping, hitstop, original rigs
  at ages 7/14/24/75 and four races, recovery, and simulation/save immutability.
- Confirmed real automatic dummy contacts while sampling a frozen player copy;
  the full serialized Simulation and events remain unchanged by visual updates.
- Inspected CPU projections of the actual GLB skin matrices and original rig
  geometry, before/after at matched charge/contact/follow-through poses for six
  representative arts and both age 14 / CM01. VFX were absent. This exposed short
  leg reach in spins/leaps and prompted the two-foot pelvis correction.
- Pose-only CPU sampling (2,280 warm frames) remained below 0.5 ms p95 in the
  final local sample. GL calls were stubbed; this is **not game FPS, GPU timing,
  or a Pixel Fold performance result**. No claim of a measured speedup is made.
- Cloud Browser navigation to the local game was rejected with
  `ERR_BLOCKED_BY_CLIENT`. No policy bypass or alternate browser automation was
  used. CPU projections do not validate shaders, texture appearance, browser
  animation playback or touch input. The existing Character CI browser workflow
  remains enabled and its result must be checked by Integration WORK.
- Pixel Fold and desktop hardware-GPU performance remain unverified.

Reproduce targeted checks with:

```sh
node --test tests/skill-motion.test.mjs tests/character-runtime.test.mjs
npm test
```

## Integration notes

New files: this document, `tests/skill-motion-harness.mjs`,
`tests/skill-motion.test.mjs`. Deleted files: none.

Character Visual WORK also owns CM01 appearance/locomotion. Preserve its assets and
eligibility rules while retaining the motion channels and grounding integration.
The original rigs must continue to support age 14 and other races/genders; CM01
alone is insufficient. Keep `legacy/motion.js` loaded before the two rig adapters
and combat presentation. No build-order change is required.

Ready PR targets develop. Integration WORK reviews and merges; this WORK does not
merge or deploy. Browser/gameplay visual approval and target-device pacing are the
remaining external validation, rather than a claimed commercial-quality pass.
