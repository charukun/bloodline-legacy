# Skill Motion WORK

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

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

## Choreography follow-up

Started from develop `010f2d9615ac0492d3a118f7057a313667455df1`, after the first
Skill Motion and Damage Motion integration. Rebased onto
`be5f92ceb734cee7ed5d9860c2202b974f142f24`, preserving the carry-walking and
parent-world-pose changes from the minor-polish integration. This is also the
default comparison baseline. The approved follow-up focuses on six
families (slash, thrust, slam, kick, spin, cast), inter-skill continuity, supporting
feet and two-handed grips. The supplied v5 policy, implementation prompt and combat
reference remain the sources; skill definitions and Simulation remain authoritative.

- Authored asymmetric preparation, counterbalancing free arms, family-specific
  stance widths and leads, chamber/extension/rechamber for kicks, and alternating
  raised steps with support pivots in spins. Catalog variants inherit these bases.
- Monotone Hermite interpolation carries nonzero angular velocity through the
  existing `.43` contact instead of stopping at each key. Hips initiate before the
  chest/hands. Heavy arts use a later acceleration and longer follow-through within
  the existing swing; no combat duration changes.
- Renderer-owned pose history carries the previous cut into the next charge and
  then the real recovery. It is independent per renderer, pruned, and reset on room
  changes, time discontinuities and teleports. Head orientation counterbalances the
  torso toward the existing facing/target; it does not retarget an attack.
- Analytic two-arm grip constrains the hands to the actual shaft and limb lengths.
  Broad original rigs protract the shoulders slightly; CM01 retains its skeleton.
  Shields and missing arms disable this grip. No additional meshes or draw passes.
- Polearm/axe/staff tips join the existing real weapon-tip tracking. Armed strikes
  use this path instead of a second synthetic arc. Trail lifetime, width and maximum
  point count stay unchanged. The Damage Motion functions and gameplay rules are
  preserved.

### Reproducible review

After a normal build, run:

```sh
node tools/build-skill-motion-review.mjs <full-comparison-base-sha>
```

This creates `dist/Bloodline_Legacy_Skill_Motion_Review.html`. It embeds the built
game runtime/assets once and swaps the five motion-related modules for the fixed
base when choosing Before. Both variants use the same scene, camera and timeline.
The review includes six representative skills plus a Jo/Ha/Kyu chain, adult/age 14,
normal/quarter speed, pause/seek, three angles, game-scale/close view and VFX on/off.
Seeking reconstructs renderer history; A/B retains the selected point in the cycle.
Only one iframe/GL context runs at a time. It creates synthetic snapshots using
the game's `actionTiming`, without constructing Game, saving or connecting online.
The `.18` review step and contact sparks are fixtures, not simulation validation.

Added regression checks cover contact velocity, two-handed chain/recovery boundaries,
real supporting-palm/weapon matrices and unchanged arm lengths, broad/young/old rigs,
loss/shields and renderer isolation. Review controls and fixed contact timestamps
are checked separately. Full tests at the starting base: **178 PASS** (171 baseline). After the
rebase, **194 PASS**, including the well collision and minor-polish regressions.
Build and review JavaScript syntax checks pass.

CPU projection review covers both rigs for all six families without VFX. A warm
pose-only sample across six equipped/unarmed skills measured after-change p95
**0.48–0.64 ms** per CM01 character (GL calls stubbed). This is a local CPU sample,
not mobile FPS; the shared host makes before/after timing noisy. Mesh counts,
textures, draw passes and the existing trail budget are unchanged.

Cloud Browser rejected the review URL with `ERR_BLOCKED_BY_CLIENT`. Local DOM tests
and CPU projections of the actual skin matrices are not browser playback approval.
The existing Character CI remains enabled; Pixel Fold GPU/frame pacing and aesthetic
approval in the browser remain unverified. Normal development does not load the
review files or its baseline copy.

Changed runtime areas: `SkillMotion`, the two doll adapters, `RigRenderer.end`,
weapon tip registration and `CombatPresentation.update`. New files: the three
review tools and `tests/skill-motion-review.test.mjs`. Existing tests/documentation
are extended. No files deleted, asset replacements, skill/UI/core/save changes,
new dependencies or CI gate changes.
