# Whole-body skill footwork

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

Source: Common Development Policy v5, Implementation Prompt v2 (2026-09-08), and the user's follow-up approval to add full-body travel, weight transfer and connected foot placement while retaining the current skill rules. The combat reference was previously inspected for silhouette and weight-transfer intent. The user's GitHub publication instruction and policy v5 govern this work.

Latest develop at start: `6cdbacdb627bd10bccf9fb4a06f771881cc5dd3a`.
Updated terrain develop integrated and verified before publication: `8050da52899d5fd3761ca1f51383be2aea80c99d`.
Concurrent age-model develop integrated before the final update: `10fb501e635f953c529dfbfc6898d8c0fd21e66c`. Its age retargeting is preserved; the shared skill entry transition remains authoritative.
Existing PR62 head: `35d7ef9b5797c641b5b9dd467e64a1ed5907180f`.
Work branch: `work/skill-motion-tempo-20260910` (continuation of the same unmerged PR).
Local baseline `d43626e2cac13e8748471b6e0d1c7c7cadd1472a` merges those two inputs. Its motion, model and simulation sources are identical to the previous PR62 head; only the integrated UI files differ. No merge into develop is performed here.

## Change

The simulation already makes a collision-limited attack step during charge. The new traveler choreography couples that motion with a rear-leg load, pelvis travel, a lifted leading-foot plant before contact, and a trailing-foot gather. Slash, thrust, heavy/slam and grounded multi-hit families use different load and follow-through distances. Consecutive attacks alternate the leading foot, using the previous world-space plants instead of resetting to a generic stance. Existing charge/recovery link bonuses still supply their real action clock.

The new root offset is presentation state only. The existing swept movement/bounds functions are evaluated on a disposable position against the current snapshot and map. They constrain the resulting visual pelvis, including the original clip root translation. No real player, opponent, collision hull, attack range, cost, hit schedule, network field or save is changed.

Foot anchors stay fixed while planted. The pelvis is constrained by the actual rig's leg reach before IK. Lifted steps and kicks are shortened to reachable targets rather than stretching a limb. Transitions into the existing kick/cast paths inherit the current foot plants and fade the previous root offset through charge. Recovery repositions one foot at a time. Multi-hit body motion ends each internal beat at the next load pose. Hitstop freezes the stepping body; interruptions, room changes and invalid states discard the choreography.

Age-specific rigs transfer onto the leading foot at contact and gather the rear foot through follow-through. Only supporting feet constrain horizontal pelvis reach; lifted feet adapt to the corrected pelvis. The previous reach correction releases gradually when support changes, preventing a root snap. This repairs over-spreading in the shortest child rig without changing its body proportions or animation contact key.

This follow-up targets the four new traveler rigs. It does not add new CM01 choreography. Aerial/spin/cast actions retain their existing movement vocabulary. The existing hand-attached equipment and weapon-tip FX registration consume the resulting transforms.

## Verification

- Baseline Build / 491 tests pass. Final Build / all 496 tests pass (0 failures/skips), including native GLSL ES compilation.
- After integrating the updated terrain develop: Build / all 509 tests pass (0 failures/skips). An additional 724-frame four-race check on a 1.2-unit raised landing preserves the ledge bound and planted soles (maximum foot error <0.000001).
- After integrating the age-model develop and adapting support transfer: Build / all 515 tests pass (0 failures/skips).
- Six targeted tests: four races × 30/60/120 Hz with two real links; repeated sword clips and alternating leading feet; age-specific supporting contacts; enemy spacing and scenery bounds; hitstop/interruption/room reset; multi-hit boundary continuity.
- In the actual linked mixed sequence, loaded torso → contact travel is 0.471–0.535 world units across body types/frame rates. Maximum foot target error and planted-foot drift are below 0.000001 world units in these fixtures. These are rig/contact checks, not exhaustive triangle collision certification.
- Four races × ages 4/10/80 at 60 Hz preserve supporting contacts throughout approach, three slashes and recovery. Maximum target error 0.004798 and planted-foot drift 0.002722 world units, both in the shortest child rig.
- Existing traveler arm-length/forearm-clearance/ground-contact suites pass; the existing tempo/contact tests pass.
- Actual `羽先払い → 絡め返し → 獣道断ち` simulation events and exported saves match latest age-model develop `10fb501` exactly, with two accepted links in both captures.
- Visible sword mesh tip versus registered FX tip: 1,200 frames across four races, maximum difference 0.000001908 world units. This verifies weapon trail attachment, not every independent skill effect.
- `cpu.json`: 1,200 recorded samples per version, alternating latest develop `10fb501` and this PR with real snapshots and collision-query scene. Median 0.423 → 0.893 ms (~+0.470 ms); p95 1.538 → 4.050 ms on this shared Node host. Settled reach passes skip redundant collision sweeps. GL is stubbed; these timings are host-dependent and do not certify mobile performance. No new geometry, bones, shaders or draw passes. Physical-device FPS remains unmeasured.
- Browser navigation through the supported runtime was retried; localhost returned `net::ERR_BLOCKED_BY_CLIENT`. Local native-game visual verification is not claimed. The PR's existing remote functional browser workflow remains the browser verification path.
- Before/after comparison was rendered from shipped meshes, equipment palettes and actual combat snapshots, viewed at close/game/side scale with FX off. Simplified offline lighting; not a gameplay recording. The capture now retains true scene coordinates and the collision snapshot; the export floor is centered on the captured scene.

## Reproduce

```sh
npm test
node --test tests/skill-footwork.test.mjs tests/skill-tempo.test.mjs tests/traveler-clips.test.mjs
node tools/capture-skill-tempo.mjs /tmp/before.json 35d7ef9b5797c641b5b9dd467e64a1ed5907180f 0 mixed
node tools/capture-skill-tempo.mjs /tmp/after.json '' 0 mixed
python3 tools/render-character-motion.py /tmp/after.json - /tmp/footwork.mp4 --before /tmp/before.json --before-glb - --video
node tools/benchmark-skill-footwork.mjs 35d7ef9b5797c641b5b9dd467e64a1ed5907180f /tmp/cpu.json
```

Changed areas: `Travelers.bodyDrive / driveFoot / clipDrive / Character.update`; actual-scene capture and offline floor positioning; contact regression tests and CPU evidence. Remaining review: native game visuals, physical-device performance, and future choreography for the excluded aerial/spin/cast families.
