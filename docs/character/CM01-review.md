# Young protagonist CM01 review

Status: ready for integration review. Visual and regression evidence is available; hardware performance remains unverified, so unconditional Golden Master acceptance is not claimed.

## Authority and scope

- Project Sources: Common Development Policy v5 (Ready PR), implementation prompt v2.0, references A–D, and the current Character WORK request.
- Implementation base: `develop` at `4f928f133ea56310d63dbf32af6a3295f2446fcb`, refreshed after the concurrent GS02/Tilt-Shift integration. The original work started at `9ee25afc5f67e142adc313813b4289d157d47935`.
- Work branch: `work/character-golden-master-gs02-20260909`. No merge is authorized for this WORK.
- Only the local human male player aged 18–34, outside the prologue, uses CM01. Other ages, portraits, races, genders, NPCs and enemies retain the existing pipeline.

The previous recovery HTML is not an implementation source. The original CM01 asset/generator and selected presentation code were inspected against this base and individually integrated. Previous PASS reports are not current verification results.

## Integration

The current custom WebGL2 renderer, GoldenArt/VillageArt, RigRenderer, Tilt-Shift pass and simulation remain in place. A character module after the existing rig module loads one embedded GLB and submits its weighted skin through the current render and shadow passes. Equipment uses the original attachment geometry and trail registration. Armor and missing limbs retain their existing state masks.

The GLB has 31 joints, up to four weights, two LODs and one 512² atlas material with base color, ORM and normal maps. Source geometry and texture generation are in `tools/generate_character.py`; provenance and mesh budgets are in `public/assets/character/`.

Animation follows existing `artPose`, `hitPose`, actions and clocks. Foot phase follows observed displacement. Ground sampling, support anchors, two-bone IK and pelvis compensation write presentation state only. Player position, collision, movement speed, attack timing and saved state are not changed. GS02 paving contributes to the existing visual ground sampler; character textures use units 7–9 so the Golden Slice atlas on unit 6 is preserved.

## Current verification

- `node build.mjs`: PASS, 23 modules, 5,473,403 bytes.
- `npm test`: PASS, 79 tests (20 character/numeric/regression, eight Golden Slice, 22 Tilt-Shift, six deployment infrastructure, 23 UI).
- `python tests/character_asset_validation.py`: PASS, 22 asset checks.
- Cloud preview: HTTP delivery works; its browser cannot create WebGL2. No visual PASS is claimed from that environment.
- Repository CI browser test: 36/36 checks passed on GS02 head `9416816ef4a50352fb9590ff500ac06ca3d63e17`, including native save/reload, scope, equipment and limb loss. Visual review subsequently identified the rapid-turn pelvis issue, and the corrected head `4854a4a33d30db845e936304500810b7f22aa201` passed the focused browser recheck (11/11). Maximum reversal pelvis drop is now 0.0501 rather than 0.7864 units, with planted-sole displacement below 0.000001 units. Earlier runs on the original base are historical diagnostics only.
- Sustained SwiftShader comparison: discontinued after the user requested cutting costly, low-value tasks. It is not a performance PASS. The full manual workflow remains available.
- Pixel Fold hardware and native desktop GPU performance: UNVERIFIED.

Numeric runtime tests use a mocked graphics API; they do not validate shader compilation or the rendered appearance. Asset validation checks structural integrity, not commercial visual quality.

Four further defects were reproduced and fixed during review: grounded soles sliding up to 0.141 game units per sample when stopping, and stride phase restarting when the same 30 Hz simulation snapshot was rendered twice. Stopping now uses a lifted recovery step; duplicate render samples preserve gait state. Acceleration also recreated planted anchors when the gait switched from walking to running, shifting a support sole by 0.189 units in the browser trace. Existing anchors now survive gait transitions, and the initial phase includes observed displacement. A full-speed reversal could also drop the pelvis by 0.786 units as an old support became unreachable. The foot now releases into a short recovery swing before exceeding reach, with a stronger reversal test. All four failures have regression tests. These changes affect presentation only.

`source-audit.json` records 35 byte-identical pre-existing source/asset files and the six current Project Sources. `asset-reproduction.json` records a fresh, independent regeneration matching all five generated asset files exactly.

## Evidence protocol

`tests/character-browser.mjs` records the exact base/head, GPU identity, viewport, screenshots, video and JSON checks. The young-player fixture is explicitly set to age 24, human male, time 12, clear weather and medium quality. Both revisions use the same gameplay camera and input sequence, with the existing diorama mode explicitly set to NORMAL. Additional inspection cameras are separate from the gameplay comparison.

Performance samples use actual render submission timestamps: 10 seconds warm-up, at least 30 seconds measurement and 12 frame intervals (up to 90 seconds for slow software rendering), three village runs, plus rain and combat. The viewport and rendering workload stay identical. Both revisions run on the same runner without video capture during performance measurement. Functional verification retains video; contact combat samples all 150 simulation ticks and renders every third tick plus the first charge and peak attack. Software results cannot certify real-device frame-rate targets.

Push verification runs on the work branch before a Ready PR is created, as required by policy v5. CI artifacts retain screenshots and video for 30 days; `verification.json` records the exact artifact, image hashes and review findings. To reduce the cost of repeated verification, normal character CI checks the changed movement poses; the full comparison remains available through manual `full_review` dispatch. Existing deployment CI is unchanged. A numeric CI success alone is not Golden Master acceptance.

The initial work branch remains as history. The final branch was created directly from the refreshed develop SHA; no merge or wholesale old-tree replacement was performed. The work branch was rebased for the later Golden UI conflict; its previous remote history is preserved in `archive/character-before-ui-refresh-20260909`. All inherited GS02, Tilt-Shift, UI and deployment changes are preserved.

Final motion CI: https://github.com/charukun/bloodline-legacy/actions/runs/34272867392

Full GS02 functional evidence: https://github.com/charukun/bloodline-legacy/actions/runs/34269501297/artifacts/10073879788
