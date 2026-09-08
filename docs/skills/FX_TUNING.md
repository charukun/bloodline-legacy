# Skill VFX: sharp contact and short afterimage

Base: develop `6e6d4ce` (Skill PR #7, Golden UI and fast DEV CI integrated).
Only `src/render/combat-presentation.js` changes runtime behavior.

- Replace the thick 3D arc with a continuous tapered ribbon. Slash/cross/spin,
  straight thrust/slide, and vertical slam/leap have distinct silhouettes.
- Follow the existing pose/contact interval (.25–.43 of each beat). The cut
  disappears within .085 seconds after the contact phase; recovery stays clear.
- Weapon-tip trails last .105 seconds (previously .19), narrow over time, and
  stop producing geometry during hitstop. Retain at most seven samples.
- Hit sparks last .21 seconds (previously .8); blocks .17, parries .24 and
  part breaks .30. Replace floating chunks with directional tapered needles.
  Suppress duplicate wound bursts for an already drawn contact.
- Remove continuously rising combat dust. Keep enemy telegraphs, depth testing,
  weather/fire, existing impact light and camera response.
- Release transient trail CPU/GPU resources on expiry, actor removal and room
  changes. Three static VFX meshes are shared; no additional rendering pass,
  texture, asset download or dependency.

No changes to Simulation, damage, hitstop duration, stamina, skill definitions,
loadouts, input, save keys or the audio engine.

Validation: npm test 82/82 PASS; deployment build/integrity PASS. All 39 active
slice skills sampled at 60 phases: finite geometry, snapshots unchanged, at
most three attack instances in this diagnostic; trail resources cleared after
room change; hit residue gone at .5 seconds. Existing offline EGL diagnostic
rendered the actual shader/draw-batch output for before/after slash and thrust.
These are pose snapshots, not browser interaction or hardware frame-pacing
measurements. The repository's latest fast DEV CI intentionally skips browser
smoke. Real-device motion/feel should be judged in the supplied standalone HTML.
