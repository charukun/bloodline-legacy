# Minor Fix / Polish — 2026-09-09

> **HISTORICAL — 過去WORKの実装・検証記録。** 以下の旧ポリシー、命令形の統合手順、PR/branch状態、SHA、検証条件・結果は当時の記録であり、現行命令や現在headの成功証拠ではありません。担当調査に必要な場合だけ参照してください。[現行の文書案内](README.md)。

BASE_BRANCH: develop
BASE_COMMIT: fad97fcc91f13f76adacb21c9257b6496396dfca
BRANCH: work/minor-polish-20260909

The user's nine requested fixes authorize carried movement and removing the
carried-item selector. Project Sources policy v5 governs publication as a ready
PR to develop. Integration WORK owns merge.

## Changes and causes

- Unify displayed title, canvas accessibility label, family-book labels,
  exported save filename and build manifest as 血脈の系譜. Persistent storage
  keys, portable save format, network protocol and CI build-version generation
  retain compatibility.
- Accept tap, drag and keyboard walking while carried. Both input and simulation
  previously discarded it. Parent legs walk while arms keep the carrying pose.
  Release uses the current location, retains the 30-second opening and age-4
  transition, and supports existing saves. No infant dash/combat/equipment changes.
- Remove the gift selection tray; retain the existing 降ろして action. Existing
  inventory and legacy gift data/commands remain readable.
- Reduce dialogue dimensions; choose upper-left/right from projected facing and
  available viewport space. Hide dialogue when the speaker leaves the actual
  viewport or the parent model expires. Parent drawing and dialogue share the
  same walk-home pose.
- Project dialogue every render frame from the same interpolated snapshot as
  characters, using fractional transforms. HUD data stays throttled to 80 ms.
- Move pickup control above its authoritative item coordinates. Hide immediately
  after collection/out of range. Connect the previously undrawn loose-item data
  to small existing instanced primitives; no new textures, lights or render pass.
- Allow walking/dashing to slide along scenery by retaining the unblocked axis.
  Existing hulls and body collision remain; attack lunges and retreats still
  stop on contact. This does not introduce automatic pathfinding: direct movement
  into a wall remains blocked.

## Validation

- Baseline: 153 existing tests PASS.
- Direct baseline reproduction: carried +X movement for 1/30s = 0 units;
  diagonal movement at house edge = 0 tangential units. Fixed results:
  0.139333 units and 0.300000 units respectively.
- Final `npm test`: build + 162/162 tests PASS, including nine new regressions.
  Covers pointer/keyboard/cancel, release and restored saves, wall/body collision,
  attack behavior, dialogue sides/visibility/subpixel motion, parent departure,
  pickup placement/collection/rendering, and frame-to-pose synchronization.
- Updated three test fixtures to provide the new world-presentation frame hook.
  Existing camera, interpolation, building labels, skills, UI and save tests pass.
- `git diff --check`: PASS.
- Browser visual verification: UNVERIFIED. Cloud Browser rejected localhost;
  shared standalone HTML was also rejected by the browser URL security policy.
  No browser-policy workaround was attempted. Pixel Fold appearance, touch feel
  and GPU FPS are not claimed as tested.

## Integration notes

CHANGED_FILES:
- build.mjs
- src/shell.html
- src/legacy/core.js
- src/legacy/game.js
- src/legacy/motion.js
- src/legacy/art.js
- src/legacy/ui.js
- src/render/renderer-base.js
- src/ui/interaction.css
- src/ui/lineage.js
- tests/ui-fixture.cjs
- tests/building-labels.test.mjs
- tests/motion-interpolation.test.mjs

NEW_FILES:
- tests/minor-polish.test.mjs
- docs/MINOR_POLISH_REVIEW.md

DELETED_FILES: none

TOUCHED_AREAS: Simulation.command/tick/releaseFromParent/moveAttackStep;
Game.installInput/frame/exportSave/importSave; parentWorldPose;
ArtDirector.doll/parentScene; Renderer.drawLooseItems/render;
UI.update/updateWorld/updateMother/updateWorldLabels/updateContext;
UILineage labels and world-overlay CSS.

Parallel UI opening work may touch lineage titles, shell, UI and CSS; preserve
both intents. Motion work may touch art/motion; the only pose change here is
carried locomotion plus the shared parent position. Rendering work may touch
renderer-base; preserve drawLooseItems between entity submission and combat FX.
Merge is intentionally left to Integration WORK.
