# Traveler sword motion: connect #35 and #42

#35's clips originally lived only in `CM01.Character`. #42 replaces that character
with `Travelers.Character` for four approved young-adult samples, so merging both
PRs did not make those clips play on the new models. This change connects the
actual `VillageArt.doll` dispatch to retargeted traveler animation.

## Baseline and dependency

- Started from develop `e3502f519dbaea1d399d3a69b274f72f57494059`.
- Branch: `work/traveler-skill-motion-20260909`.
- Depends on new-model PR #42. Its `c82ef19c8cdde1f77c0a7b849f1a632f16760d94`
  model/runtime is the visual and performance baseline.
- Subsequent #42 head `662dcb006475a73f4ca6ff0761589d8b8c112308` changes its browser
  test and CI timeout only; those updates are retained in the work branch.
- Review/integrate #42 before this PR. This work branch contains the dependency
  for buildability; it does not merge either PR into develop.
- Sources: Common Development Policy v5, Implementation Prompt v2, the user's
  request to connect the approved new models to Skill Motion. Gameplay, damage,
  input, UI, collision, saves, skill selection and hit timing are unchanged.

## Motion and asset boundaries

- Human male, elf female, dwarf male, fox female; local player age 18–34, as in #42.
- Three one-handed sword cuts (diagonal, horizontal, chop), combat ready stance,
  entry from movement and recovery. Existing combo count selects the cuts.
- Existing `CM01.selectClip` now accepts a clip collection. Both rigs use this
  same selector, exclusions and Hermite mapping to the existing `.43` hit beat.
- Traveler walking/running remains distance-driven. Other weapons, multi-hit or
  non-slash skills, guard, damage, activities, loss and rescue keep their current
  motion routes. Unsupported skills clear the preceding cut before recovery.
- The mesh and approved appearance are unchanged. The existing root can rotate
  about the anatomical pelvis through baked translation, without adding bones.
- Offline authoring fits fixed-length arms to each body, keeps forearms around
  the shirt, retains source twist, and adds a wider stance, hip/chest wind-up and
  follow-through. Head rotation trails the torso. Short legs keep knee bend.
- Planted feet persist across transitions. A lifted foot shortens its step when
  the old anchor is unreachable; it does not pull the body toward that anchor.
- Weapon and shield still use the real hand sockets and original geometry;
  weapon-tip registration continues to supply the existing effect path.

Source motion: Kay Lousberg / KayKit Adventurers 1.0, CC0-1.0, original revision
`672074b73ba276876a19e8816ecdc5241817ab47`. The four clips are extracted from the
same motion-only source as #35. See `tools/character-source/KAYKIT_LICENSE.txt`
and `public/assets/character/ASSET_PROVENANCE.md`. No source character mesh or
texture is imported. This is glTF/Python authoring, not a Blender project.

## Cost and validation

- Same 16/17 bones, 4 weights, two LODs, one body draw per pass. No additional
  textures, shaders, post-processing or per-frame retargeting.
- The packed four-race motion file is 158,351 bytes. Only the selected race is
  decoded with its model; the existing two-model cache bound is maintained.
- Build: 19,578,597 → 19,741,359 bytes at the measured implementation revision
  (about +0.83%, before documentation / test-only changes).
- Full `npm test`: 367 passed. Focused traveler tests additionally exercise the
  actual doll dispatch and hand-attached blade, fixed arm lengths, torso proxy
  clearance, normal/blocked steps, three contacts and unsupported-state exits.
- 120 Hz trace over four races: foot target error below 0.000001 world units;
  no planted-foot jump over 0.003. Torso clearance uses a volume proxy, not
  an exhaustive mesh collision proof.
- Deterministic packed-data regeneration checked. CPU evidence: [cpu.json](motion/cpu.json).
  Node VM/stub GL median 0.304 → 0.414 ms; p95 4.359 → 3.101 ms. CPU cost increased
  about 0.11 ms at the median. This noisy software measurement is not device FPS.
- Browser local navigation returned `net::ERR_BLOCKED_BY_CLIENT` in this WORK.
  Browser rendering, native-input visual acceptance and Pixel Fold GPU/FPS are
  UNVERIFIED. #42's browser evidence does not verify these new clips.
- [Four-race pose review](motion/four-races.jpg) and the comparison video use real
  runtime palettes, mesh and equipment in offline EGL with simplified lighting.
  They are not recordings of gameplay or proof of commercial reference parity.

## Reproduce and review

```sh
npm ci
python3 tools/author_traveler_clips.py
npm test
node tools/build-traveler-motion-review.mjs c82ef19c8cdde1f77c0a7b849f1a632f16760d94
node tools/capture-traveler-motion.mjs /tmp/after.json
node tools/capture-traveler-motion.mjs /tmp/before.json c82ef19c8cdde1f77c0a7b849f1a632f16760d94
python3 tools/render-character-motion.py /tmp/after.json - /tmp/comparison.mp4 --before /tmp/before.json --before-glb - --video
node tools/benchmark-traveler-clips.mjs c82ef19c8cdde1f77c0a7b849f1a632f16760d94 /tmp/cpu.json
```

The review HTML switches before/after runtime and model together. It includes
four-race selection, normal/quarter speed, pause/seek, game/close camera, three
angles and FX off/on. It uses synthetic snapshots on the existing clocks, not
an independent combat simulation. Validate in the game after #42 integration:
normal contact combat, chained slashes, guard/damage interruption, movement
resume, weapon changes, loss, age transitions, save/reload, and mobile performance.
Other weapons and the full skill catalog have not received new choreography.
