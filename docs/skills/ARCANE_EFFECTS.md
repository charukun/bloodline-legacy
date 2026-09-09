# Original layered spell effects

Reference: [ICS MEDIA: RPG save-point magic circle](https://ics.media/entry/11401/),
read 2026-09-09. The transferable techniques are layered open cylinders,
flowing ring surfaces, camera-facing particles, additive blending, no transparent
depth writes, and synchronized envelopes. No source assets or code copied.
This implementation uses the existing WebGL2 renderer; it adds no Three.js/GSAP
runtime or whole-screen postprocessing pass. Existing bloom remains unchanged.

Based on develop `717931fd92271104b89a9c5645ed4792bbf06c2e`, extending the same
WORK's unmerged PR #40. No old recovery core/bootstrap was imported.

| Form | Original silhouette and motion | Existing skill |
|---|---|---|
| 天環 | counter-flowing open double pillar and three ground seals | 4320 神の裁き |
| 巻天 | tapered rising double helix | 4311 風鈴の護り |
| 星砕 | unequal radial light lobes with outward particles | 4310 熔石砕き |
| 蓮華 | opening curved petals and rising pollen | 4303 鈴のまどろみ |
| 双門 | opposing upright seals with bridging bands | 4312 風の縫い目 |
| 彗尾 | long diagonal, layered comet tail | 4030 火の矢 |
| 天牢 | six enclosing ribs, then inward contraction | 4304 結びの手 |
| 潮牙 | broad lifting wave curtain with forward spray | 4031 炎壁 |
| 荊冠 | irregular curved rising thorns | 4302 石鎧の拳 |
| 月蝕 | dark disc, revolving corona and inward particles | 4330 影喰いの頁 |
| 双翼 | paired fans with unequal feather lengths | 4301 風縫い |
| 雷紋 | deterministic branching lightning with terminal pulses | 4313 鳴石の震撃 |

The names above identify VFX presets, not new unlockable skills. All use the same
light palette; distinct shapes and motion are not color variants. The prior six
motifs remain. The lab offers 18 base forms with independent path, rhythm,
contact-shape and release controls. The 12 new forms also support toggling their
seal/body/particle layers. Thickness, flutter and seed remain saved in version-1
recipes; old exports gain default layer settings. No lifetime randomness is drawn
from simulation RNG, and scrubbing reproduces the same effect.

## Runtime contract

`SkillArcane` is a stateless, direct-dispatch builder. `field` carries continuous
UV strips; `motes` carries camera-facing sprites. Material 25 reuses the normal
attribute for UV/phase (particle opacity for sprites), and instance RGB for mask
mode / effect clock / flutter. Its analytic masks remove hard mesh outlines.
Game and HTML WebGL reuse the same GLSL mask source. The Canvas fallback is a
lower-fidelity approximation, not the main quality reference.

Light layers use a dedicated additive batch with depth testing on and depth
writes off. The dark eclipse disc uses the existing alpha batch. The renderer
restores normal blending before weather/impact layers; other materials and
character shaders keep their interfaces. No extra light sources or textures.
Each effect uses at most 302 high / 132 low quads, inside existing shared
512/256 segment and 16/8 mesh-slot budgets. Concurrent effects may omit later
layers when the budget is exhausted. All pooled buffers are released on room
change. Device FPS remains to be measured.

A small casting seal follows the strike clock. Full effects originate only from
confirmed hit events, retain the actual contact point, and lift their ground
layers 0.035 above the sampled terrain. Their release lasts 0.58–0.75 seconds;
the hit-effect retention uses this definition instead of the former 0.55 cutoff.
No changes to damage, collision/reach, stamina, learning, save data or input.

## Review

- `npm run build:skill-fx-lab` → `dist/skill-fx-lab.html` (standalone/offline).
- `node --test tests/skill-arcane.test.mjs tests/skill-effects-composer.test.mjs tests/skill-silk.test.mjs`.
- `node tools/skill-fx-lab/arcane-evidence.mjs` generates real shader input.
- `python3 tools/skill-fx-lab/arcane-film.py` renders with native EGL, including
  the existing skin and HTML preview shader link checks. This is not browser QA.
- `npm test` and DEV deployment integrity remain required gates.

Final checks: 278 tests pass, including 21 focused VFX tests. DEV build and
deployment integrity pass. Native EGL renders 36 lifecycle samples and a
45-frame comparison of all twelve forms; the film synchronizes their impact
start for comparison. The shared game shader, existing skin shader and HTML
preview shader link successfully. Browser/device playback and FPS are unverified.
