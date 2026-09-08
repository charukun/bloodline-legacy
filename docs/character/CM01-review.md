# Young protagonist CM01 review

Status: implementation candidate; visual and device acceptance pending.

## Authority and scope

- Project Sources: Common Development Policy v5 (Ready PR), implementation prompt v2.0, references A–D, and the current Character WORK request.
- Implementation base: `develop` at `9ee25afc5f67e142adc313813b4289d157d47935`, fetched from GitHub at work start.
- Work branch: `work/character-golden-master-20260909`. No merge is authorized for this WORK.
- Only the local human male player aged 18–34, outside the prologue, uses CM01. Other ages, portraits, races, genders, NPCs and enemies retain the existing pipeline.

The previous recovery HTML is not an implementation source. The original CM01 asset/generator and selected presentation code were inspected against this base and individually integrated. Previous PASS reports are not current verification results.

## Integration

The current custom WebGL2 renderer, VillageArt, RigRenderer and simulation remain in place. A character module after the existing rig module loads one embedded GLB and submits its weighted skin through the current render and shadow passes. Equipment uses the original attachment geometry and trail registration. Armor and missing limbs retain their existing state masks.

The GLB has 31 joints, up to four weights, two LODs and one 512² atlas material with base color, ORM and normal maps. Source geometry and texture generation are in `tools/generate_character.py`; provenance and mesh budgets are in `public/assets/character/`.

Animation follows existing `artPose`, `hitPose`, actions and clocks. Foot phase follows observed displacement. Ground sampling, support anchors, two-bone IK and pelvis compensation write presentation state only. Player position, collision, movement speed, attack timing and saved state are not changed.

## Current verification

- `node build.mjs`: PASS, 20 modules, 4,930,675 bytes.
- `npm test`: PASS, 20 tests (14 character/numeric/regression, six deployment infrastructure).
- `python tests/character_asset_validation.py`: PASS, 22 asset checks.
- Cloud preview: HTTP delivery works; its browser cannot create WebGL2. No visual PASS is claimed from that environment.
- Repository CI browser test: pending first execution. It runs both the fixed base and this branch with the same fixture, HTTP origin, native localStorage, real input handlers and SwiftShader.
- Pixel Fold hardware and native desktop GPU performance: UNVERIFIED.

Numeric runtime tests use a mocked graphics API; they do not validate shader compilation or the rendered appearance. Asset validation checks structural integrity, not commercial visual quality.

## Evidence protocol

`tests/character-browser.mjs` records the exact base/head, GPU identity, viewport, screenshots, video and JSON checks. The young-player fixture is explicitly set to age 24, human male, time 12, clear weather and medium quality. Both revisions use the same gameplay camera and input sequence. Additional inspection cameras are separate from the gameplay comparison.

Performance samples use actual render submission timestamps: 10 seconds warm-up, 30 seconds measurement, three village runs, plus rain and combat. Software results compare revisions under the same harness, with video overhead on both, and cannot certify real-device frame-rate targets.

Push verification runs on the work branch before a Ready PR is created, as required by policy v5. CI artifacts retain the evidence for 30 days; accepted comparison images and a final review will be committed after inspection. A numeric CI success alone is not Golden Master acceptance.
