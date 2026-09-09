# Damage motion

Base: `develop` at `4b9693364c5687ffc04bf57101c80394738fe59c`.
Branch: `work/damage-motion-20260909`. Integration owns merge.

## Scope and sources

This change improves receiving a hit and regaining balance. Damage values,
AI, skill attacks, targeting, stun, cooldown, hitstop, collision, input and
save schema retain their existing rules.

Reviewed Project Sources: Common Development Policy **v5** (Ready PR),
Implementation Prompt **v2.0**, and the supplied original HTML as historical
context. Current user instructions and v5 supersede the old prompt's
handoff-only GitHub restrictions. No separate authoritative numeric damage
specification was attached; current develop behavior is explicitly preserved.
References: A is `20260908_035546_504.mp4` (motion sampled across the clip);
B is `file_000000004fa08206847d9893485abe3d.png` (village);
C is `file_000000008e08820693ee766cb1158bb3.png` (lineage);
D is `file_00000000ff2c8206a608810096492e6d.png` (combat).
D's contact, asymmetric torso recoil and weight-bearing stance inform these
poses; a still image does not establish exact animation timing.
The base SHA was confirmed through authenticated GitHub READ, then checked
out from matching cached git objects into this isolated branch.

## Behavior

- Contact leads immediately; chest and pelvis follow with distinct curves.
  Head, torso, either arm and either leg produce different silhouettes.
  Front/back/side directions are expressed in the receiver's local frame.
- Actual attack power supplies visual force independently of accumulated
  wound severity. Light, intermediate and strong impacts scale continuously.
- Strong leg hits lower the pelvis and bend the knees while the opposite
  support leg takes a short recovery step. The glTF master uses its existing
  ground IK; rigid people and humanoid monsters use a two-link correction
  and level boots. Character positions/colliders are not displaced.
- Successful physical blocks recoil through the shield arm without adding
  stun or hitstop. Magical wards and misses do not gain a physical reaction.
- Repeated hits retain the currently rendered pose, blending within 65 ms
  of reaction time. First contact is immediate, including during hitstop.
  Both foot targets blend separately to avoid switching/teleporting soles.
- An attack already cancelled by the combat rules releases its last authored
  pose beneath the reaction over 90 ms. Committed attacks remain committed.
  Finished reactions do not replay during remaining stun. Death/teleport,
  time rewinds and absent actors clear stale presentation state.
- The original hit/wound/block events, SE, camera shake and effect timing are
  retained. No extra particle bursts, GPU passes, assets or randomness.

Full knockdowns, sitting falls and new get-up locks are deliberately not
introduced: the current rules have no new knockdown state to justify them.
Nonhumanoid creatures continue to use their existing anatomy and the shared
directional force curve; humanoid limb articulation is not imposed on them.
Existing skill knockback remains owned by collision/Simulation.

## Verification

- `node build.mjs` PASS; standalone build 5,658,785 bytes.
- Full repository test selection: **156/156 PASS**, including 13 added tests.
  Existing skill, UI, save, camera, terrain and character tests remain intact.
- Differential tests execute current and fixed-base Simulation against the
  same seeds, powers and body parts. All gameplay fields, RNG state and
  event counts match, allowing only documented presentation metadata.
- Support-foot contact, four directions, repeated hits, hitstop, guard,
  interrupted attacks and bounded presentation state are covered.
- Offline EGL pose inspection uses the actual mesh/pose outputs under neutral
  diagnostic shading, with no effects or camera shake. This is not a browser
  or device test. [Before CM01](before-cm01.jpg), [After CM01](after-cm01.jpg),
  [rigid people](after-legacy.jpg), [humanoid enemy](after-soldier.jpg).
- CPU diagnostic, 32 simultaneous reacting characters, Node v24.19.0,
  three warmed runs: baseline median 3.10–3.16 ms, changed median
  3.98–4.06 ms per group. Added pose submission cost is about 0.8 ms/32
  characters on this host. No geometry or GPU pass increase. This does not
  establish Pixel Fold FPS. [Raw measurements](cpu.json).
- Local Browser Verification could not open the served build:
  `net::ERR_BLOCKED_BY_CLIENT` at `http://terminal.local:4186/`.
  No alternate browser was used to bypass that restriction. Browser behavior,
  actual gameplay motion review and Pixel Fold frame pacing remain unverified;
  the existing PR character browser workflow is retained for Integration.

Reproduce tests:

```sh
node build.mjs
node --test tests/skills-preview.test.cjs tests/skills/*.test.mjs tests/*.test.mjs deploy/infrastructure.test.mjs tests/ui.test.cjs
node tests/damage-motion-performance.mjs
node tests/damage-motion-evidence.mjs verification/damage-motion
python3 tests/damage_motion_offline.py verification/damage-motion
```

The offline renderer uses `tests/offline-requirements.txt`; a host with an
alternate EGL installation can provide `GOLDEN_EGL_LIBRARY`. It measures pose
shape, not the complete game rendering/material pipeline.

## Integration / conflicts

`src/legacy/motion.js`: only receiving-hit helpers; preserve Skill Motion's
`artPose` work. `src/legacy/art.js`: doll/monster damage composition, boots,
head and torso hierarchy. `src/character/golden-master.runtime.js`: additive
reaction, arm transition and existing foot IK. `src/legacy/core.js`:
`reactToHit` metadata plus existing damage/physical block event call sites.

Merge these areas semantically with simultaneous Character/Skill Motion PRs.
Do not replace newer files with this branch's snapshots. New QA files and
this documentation are separate from runtime code. No deleted files.
