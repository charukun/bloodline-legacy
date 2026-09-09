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

The names above identify VFX presets, not new unlockable skills. Shapes and
choreography remain the identity; color/width/noise variants are not counted as
additional skills or distinct forms. The prior six
motifs remain. The lab offers 18 base forms with independent path, rhythm,
contact-shape and release controls. The 12 new forms also support toggling their
seal/body/particle layers. Version-1 recipes now also carry palette, afterglow
and variation. Missing fields preserve native color, 1x afterglow and no per-cast
variation. New authored presets enable bounded variation at 65%. The lab stores
its preview sample index in export/view metadata so importing reproduces the
sample. No randomness is drawn from simulation RNG; seeking is deterministic.

## Runtime contract

`SkillArcane` is a stateless, direct-dispatch builder. `field` carries continuous
UV strips; `motes` carries camera-facing sprites. Material 25 reuses the normal
attribute for UV/phase (particle opacity for sprites), and instance RGB for mask
packed mask+palette / effect clock / flutter. Material 24 similarly packs its
palette with flutter without changing the vertex/instance layout. Its analytic masks remove hard mesh outlines.
Game and HTML WebGL reuse the same GLSL mask source. The Canvas fallback is a
lower-fidelity approximation, not the main quality reference.

Light layers use a dedicated additive batch with depth testing on and depth
writes off. The dark eclipse disc uses the existing alpha batch. The renderer
restores normal blending before weather/impact layers; other materials and
character shaders keep their interfaces. No extra light sources or textures.
Default effects use at most 382 high / 156 low quads (422/180 with optional
extra seals), inside existing shared
512/256 segment and 16/8 mesh-slot budgets. Concurrent effects may omit later
layers when the budget is exhausted. All pooled buffers are released on room
change. Device FPS remains to be measured.

Casting follows the strike clock. Only pillar/gate default to seals; other forms
gather on the weapon, run along the ground or fold at the hand. Full effects
originate only from confirmed hit events, retain their contact point, and lift
ground layers 0.035 above sampled terrain. Afterglow leaves the first 120ms
unchanged, then scales the cosmetic tail by 0.5–2.4x. Retention uses the same
resolved lifetime; damage/recovery timing is never stretched.
No changes to damage, collision/reach, stamina, learning, save data or input.

## Review

- `npm run build:skill-fx-lab` → `dist/skill-fx-lab.html` (standalone/offline).
- `node --test tests/skill-arcane.test.mjs tests/skill-effects-composer.test.mjs tests/skill-silk.test.mjs tests/skill-expression.test.mjs`.
- `node tools/skill-fx-lab/arcane-evidence.mjs` generates real shader input.
- `python3 tools/skill-fx-lab/arcane-film.py` renders with native EGL, including
  the existing skin and HTML preview shader link checks. This is not browser QA.
- `npm test` and DEV deployment integrity remain required gates.

Final checks: 283 tests pass, including 26 focused VFX tests. DEV build and
deployment integrity pass. Native EGL renders 36 lifecycle samples and a
75-frame comparison of all twelve forms; the film synchronizes their impact
start for comparison. The shared game shader, existing skin shader and HTML
preview shader link successfully. Browser/device playback and FPS are unverified.

## Follow-up: signature and expression

The earlier universal seal → rising body → motes sequence caused repetition.
The twelve forms now have authored growth/release timings and different particle
routes: explosion, convergence, spiral absorption, forward spray, drifting pollen,
or detached feathers. Thorns start with ground fissures and stagger their growth;
eclipse opens/closes a dark slit; nova sheds its center; comet retracts its tail;
lotus opens successive petals. These are presentation cues, not extra hit events.

The composer adds five two-color transitions plus native color, actual luminous
surface width (0.5–3x), afterglow (0.5–2.4x), and variation (0–100%). Flutter uses
continuous seeded noise, not independent random values each frame. Variation
samples seed/width/lifetime once per cast; maximum deviations are ±18% width and
±22% afterglow, scaled by the control and clamped to allowed bounds. Geometry
irregularity/particle scatter also follows that seed. Palette and main silhouette
stay fixed across casts so the same Skill ID remains recognizable. Color evolves
from core to tail rather than choosing an unrelated hue every frame.

Runtime caches samples per visible actor, shares them with matching confirmed
hits, freezes the sampled blade during hitstop, clears on room change and removes
stale samples on switching to an unbound basic skill. Existing impact samples keep
their recipe when the actor starts another action. No save schema changes.

The lab supports next-cast, fixed-sample replay, zero variation, A/B comparison,
monochrome review, JSON import/export and independent layers. Repeat playback
waits only a short gap after the actual tail. The 3s scrub range accommodates
maximum afterglow. Browser/device interaction, FPS and human judgement of
perceptual novelty remain unverified; geometry tests are not a claim that every
combination feels like a different skill.

## Fog-edge material follow-up

All 18 composed forms now default to `mist: 0.85`, with a 0–1 control retained
in version-1 exports. Zero restores the previous material boundary. The HTML
lab can compare mist-off and mist-on for every family using the same cast sample.

Silk and spell strips gain transparent support padding without adding vertices.
Three advected noise samples create moving density and wispy erosion; alpha fades
to zero before the mesh boundary. The main path, impact silhouette, palette,
contact time, afterglow and cast seed are unchanged. Camera-facing motes use a
cloud-like falloff in place of the crisp star cross. Ordinary composed light
needles and debris also get local haze materials (26/27); other combat needles
keep their original material. This uses no screen blur, new texture, depth copy,
additional particle or extra draw call. Wider transparent coverage and noise add
fragment work; device FPS is still unmeasured.

Packed palette/mist metadata keeps the existing vertex/instance layout. The
native validation now captures actual `CombatPresentation.composition` output,
including instance transforms and all four VFX material types, rather than only
spell geometry. `FX_MIST_COMPARE=1 node tools/skill-fx-lab/arcane-evidence.mjs`
followed by `python3 tools/skill-fx-lab/arcane-film.py` produces a six-family,
twelve-panel before/after study. Canvas fallback remains an approximation.

Validation for this follow-up: 286 tests pass (29 focused VFX tests), including
support-boundary opacity, temporal continuity, unchanged geometry budgets,
metadata decoding, ordinary-combat isolation and the lab's mist control.
Native EGL checks game, skin and lab shader links plus 36 comparison samples.
Browser/device playback and FPS remain unverified.
