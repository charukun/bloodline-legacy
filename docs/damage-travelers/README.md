# Damage motion for the four travelers

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

The four traveler rigs consume the existing damage events, with body proportions, protecting arms, planted recovery and a short authoritative recoil now handled together.

- Source policy: supplied **Common Development Policy v5**, Implementation Prompt v2.0; the explicit user request authorizes this follow-up and the proposed short displacement/contact-spacing changes. Policy v5 and the user's PR instructions supersede v2's older handoff-only workflow.
- BASE_BRANCH: develop
- BASE_COMMIT: `e3502f519dbaea1d399d3a69b274f72f57494059`
- Dependency: **PR #42**, latest checked head `662dcb006475a73f4ca6ff0761589d8b8c112308`. The work branch started from develop and includes this dependency on the work branch only. Integration should process #42 first, then this PR. No develop/staging/main merge or deployment was performed here.
- Tests and evidence use the publicly fetchable dependency commit `c82ef19c8cdde1f77c0a7b849f1a632f16760d94` as their BEFORE. All `src/` files are identical between that commit, the local dependency merge and the latest dependency head; the final upstream update only fixes the browser talk-phrase click and gives software-rendered CI more time. Both upstream fixes are retained here.
- Visual Reference D: source `02-file_00000000ff2c8206a608810096492e6d.png`, inspected for contact, asymmetric loading and silhouette. Reference A was supplied as MP4. No source image was used as a game asset.

## Behavior

- Traveler body depth/width/height control trunk lean, lateral reaction and pelvis drop. Large heads have a bounded reaction. The struck arm folds while the other arm opens and braces; existing attack poses still feed the interruption blend.
- The catch foot includes the **resolved** recoil displacement. Completed support anchors persist until an actual step/turn requires adjustment. The opposite foot stays planted; a following step is permitted when its reach would become excessive.
- Normal incoming force .60 moves a standing player up to **0.08 world units**, force 1.0 up to **0.24**, a physical guard up to **0.025**, over **0.20 seconds of unfrozen simulation**. Walls/other bodies can shorten this. A new contact replaces remaining travel. Downing, rescue, traversal, root, room changes and save restoration cannot replay a stale displacement.
- Player/enemy movement has an additional **0.18-unit contact spacing**. Friendly-player and practice-dummy spacing retain their original radii. Enemy approach shares the existing swept movement bounds; crowd separation resolves overlap with an active player with bounded movement.
- Collision candidates are culled against the sweep once, and substeps compare squared distances. No new physics engine, per-triangle collision solver, raycast, bone, mesh or rendering pass is added by this follow-up.

Damage amounts, wound/death/rescue rules, target selection, skill definitions, attack clocks, hitstop and lock duration are retained. **Spacing and short player displacement are intentional gameplay changes**: they can affect exact range/position. Attack trajectories and weapon-specific surface-contact poses remain owned by Skill Motion WORK; this change does not certify that every weapon penetration is eliminated. Existing barks, HUD pulses, VFX and SE remain on the confirmed damage event path.

## Validation

- `npm test`: final build and **369 tests passed**, including 5 new tests. The added tests cover 30/60/120 Hz displacement and hitstop, protected combat clocks/RNG, wall/body/root constraints, restore/downing/room changes, approach spacing/overlap escape, and 4 races × 6 body parts with attack interruption and opposite repeated hits.
- The 4-race actual bone-palette tests retain frozen snapshots; maximum tested foot-target error < 0.000001, planted horizontal drift < 0.000001 per sample; maximum inter-sample ankle movement < 0.07 and pelvis correction < 0.20 in the selected sequences. These numerical bounds do not substitute for full gameplay visual review.
- CPU, 33 characters (1 traveler + 32 approaching actors), 3 runs, 60 warm-up + 180 measured frames: total p50 **1.258–1.366 ms before / 1.379–1.594 ms after**. Total p95 **2.841–3.358 / 2.949–8.509 ms**; tail variability remains. [Full final measurements](cpu.json); [initial measurement before candidate culling](cpu-before-culling.json). Node v24.19.0 with WebGL submission stubs; this is not GPU time or device FPS.
- [8-second runtime comparison](comparison.mp4) and [contact/recovery poses](contact-review.jpg): actual LOD1 mesh and game bone palettes, normal playback speed, neutral offline EGL/llvmpipe shading, no FX or shake. Columns in the still are BEFORE contact/recovery, AFTER contact/recovery; rows are human, elf, dwarf, fox. Equipment shells are masked for the unarmored fixtures. This is **not a browser gameplay recording**.
- Work cloud Browser could not open the local built game: `net::ERR_BLOCKED_BY_CLIENT`. Live Browser/native-input review is **UNVERIFIED in this WORK**. Existing PR Character visual verification continues to run its functional browser checks; its results must be read from the PR, not inferred from local numeric tests.
- Pixel Fold/native GPU, network latency and all weapon-specific contact poses remain unverified.

## Changed areas and reproduction

Own runtime changes: `src/legacy/core.js`, `src/legacy/motion.js`, `src/character/traveler-runtime.js`. Existing regression normalization: `tests/damage-motion.test.mjs` (the newly authorized recoil state is tested separately; protected damage/timers/RNG assertions remain). New files: `tests/traveler-damage-harness.mjs`, `tests/traveler-damage.test.mjs`, `tests/traveler-damage-evidence.mjs`, `tests/traveler-damage-performance.mjs`, `tests/traveler_damage_offline.py`, and this evidence directory. No deleted files.

```sh
npm ci --ignore-scripts
npm ci --prefix deploy --ignore-scripts
npm test
node tests/traveler-damage-performance.mjs
node tests/traveler-damage-evidence.mjs
# Requires NumPy, Pillow, ModernGL, EGL and ffmpeg:
python tests/traveler_damage_offline.py verification/traveler-damage
```

Integration: preserve the traveler model/rig changes from #42, current core life/rescue/save/skill logic and newer Skill Motion contributions. Keep recoil authoritative in Simulation and the renderer read-only. Inspect `traveler-runtime.js` foot ownership and `core.js` movement at function level if another WORK touches them. After #42 is merged, compare this PR's own change set rather than re-importing an older character snapshot.
