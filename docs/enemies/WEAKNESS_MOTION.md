# Readable enemy weakness and broken-limb motion

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

The user approved making weakness visible primarily through posture, gait and
recovery, and explicitly allowed the matching gameplay changes. Wound/dirt
layers remain supplementary. This extends PR #58 and retains Integration's
candidate `6660376`, including current develop `10fb501`, age models, terrain,
frame pacing and verified Chromium setup. This WORK does not merge develop.

## Behavior

| Condition | Presentation |
|---|---|
| Healthy | Existing upright stance and authored locomotion |
| Below 70% HP | Increasing forward bend, dropped shoulders, stronger breathing |
| 25% HP or less | Maximum fatigue; pronounced stoop and post-strike settling |
| One arm lost | Asymmetric balance and surviving-hand attack |
| One leg lost | Short bent support steps, missing-side lean and dragging gait |
| Both legs lost, bone soldiers | Low prone pelvis; alternating analytic hand support, low attacks |
| Both legs lost, other humanoids | Prone trunk and surviving-arm ground strokes |
| Two front or rear legs lost, beasts | Belly held low; remaining legs pull/push the body |
| Spirits at low HP | Lower and less stable floating posture |

Primary visual review covers bone soldiers and wolves. The shared bone path
also covers all ten soldier/elite forms, and the quadruped path covers maw,
boar, wolf, bear, lizard and stag. All 33 forms receive a condition from existing
HP and lost-part flags; remaining families use the simpler posture offsets.
Detailed unique crawling for insect leg groups and fungal bodies remains a
future refinement. Missing parts are never invented by low HP.

`EnemyWeakness` is a presentation consumer. Poses use the existing frozen
render clock and distance-based gait. Crawling shortens the stride; hands use
one bounded two-bone analytic solve per surviving support arm. No ragdoll,
iterative physics, new clip download, bones, meshes or textures are added.
Weapons and damage/VFX contacts follow the resulting skeletal/part sockets.
Status marker height follows lowered bone-enemy posture and terrain.

## Approved gameplay delta

`enemyCondition` in `src/legacy/core.js` derives all values without new actor
fields or RNG calls. It applies to the existing enemy-form families; players,
guards, villagers and dummies retain their previous rules.

- Fatigue = clamp((0.70 − hp/hpMax) / 0.45, 0, 1).
- HP fatigue multiplies enemy movement by 1 − fatigue × 0.16.
- Existing limb multipliers remain: each lost leg already multiplies movement
  by 0.48. This implementation does not apply that loss penalty twice.
- Additional post-strike recovery = fatigue × 0.55 seconds, plus 0.16 for one
  lost leg or 0.40 for two, plus 0.10 per lost arm.
- The same extra time extends action lock and cooldown. Windup deadlines,
  impact time, damage, target selection and attack reach are unchanged.
- The authored strike/retraction still occupies the original 0.75 seconds;
  the extra interval shows settling rather than slowing the whole attack.

A new immutable simulation archive is registered:
`a383e782cea44fe92cc45194ce15f1265ea52d8eb7102cb15730b9cb6147419e`.
All previously published archives remain byte-for-byte intact. Saved HP/lost
flags recreate the new poses; no save-schema change. Existing live sessions
continue under their pinned rules engine until the compatibility flow moves
them, so a new renderer does not silently rewrite an old world's simulation.

## Review sample

Build with `npm run build && node tools/enemies/build-review.mjs`.
The single embedded HTML remains usable without a CDN.

- Choose **移動**, then **部位破壊 → 両脚・後脚** to see crawling/dragging.
- Compare **右脚・後脚** and **右腕・前脚** with **なし**.
- Lower **生命力** to 50% or 20% for fatigue without losing any limb.
- Choose **予兆 → 攻撃** to inspect low strikes and extended recovery.
- Pause/seek to compare a fixed time. HP and break controls retain the position.

Synthetic movement applies the same injury/HP speed multipliers as the game.
The UI also offers both arms and a mixed arm/leg case. It never creates Game or
writes a save. Both raw performance settings are already exported in JSON.

## Verification and limitations

[Pose comparison](evidence/weakness-motion.jpg) ·
[Focused tests](evidence/weakness-tests.txt) ·
[Native GLES](evidence/weakness-gles.json) ·
[Asset/license gate](evidence/weakness-assets.json) ·
[CPU/geometry data](evidence/weakness-budget.json) ·
[Validation hashes](evidence/weakness-validation.json).

Build and the focused suite passed: **69 tests, 0 failures, 0 skips**.
Nine native GLSL ES programs compiled and linked successfully.

Tests cover all 16 skeletal loss combinations, global HP progression, lowered
head/chest/hand positions, frozen and moving hands, exact windup/impact pose
continuity, real AI speed/recovery/single-hit behavior, saved state and old
live-engine compatibility. Existing asset/license checks still pass: KayKit
Skeleton Warrior remains CC0-1.0 and unchanged; new motion code is project work.

Node pose/batch construction for 12 soldiers + 12 wolves measured median
**5.94 ms healthy / 9.11 ms critical / 9.25 ms crawling**. p95 was
**14.48 / 49.25 / 69.63 ms**, with substantial shared-runtime/GC outliers.
These are scenarios, not a before/after code benchmark. New motion adds zero
meshes, textures, bones or draw passes; the critical/broken scene still uses
the pre-existing wear/break layers. GPU/world/combat/browser are excluded.

The supported browser's earlier explicit security rejection remains in force;
no alternative browser execution was used. Native EGL images and Node/JSDOM
submission checks are not browser QA. Real-device startup, motion readability
at game distance, full-game frame pacing, Desktop 60 fps and Pixel Fold 30 fps
remain unverified and are Integration/release review items.
