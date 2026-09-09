# Skill VFX: sharp contact and short afterimage

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

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

## Follow-up: visible dojo forecourt

The dojo now sits beside the front of the square (base x=-6.5, z=17.7),
with the practice dummy three units in front. Seed mirroring and jitter remain;
other schools, houses, shore bounds and RNG consumption are unchanged.
Map-driven art, collisions and building labels follow the same position.
Existing saves move the same dummy (including its home anchor) to the forecourt,
preserving its ID, wounds and the player's skills/loadout. This follow-up touches
`src/legacy/core.js`; it does not change combat timing or damage.

Two regression tests cover both mirrored layouts, eight approach directions,
actual contact-led practice combat and repeated old-save restore. Offline EGL
captures of both layouts confirm that roofs stay behind the training area.
Latest develop `6f3101a` was merged into this WORK branch before the relocation;
the approved sharper VFX remains included in the standalone build.
