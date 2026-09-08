# Living Diorama bokeh preview

Base: develop `3d46ff7f036af085058d09a481f572c98728ae9a`.
Branch: `work/living-diorama-bokeh-20260909`.
Includes the motion/skill-menu preview; current building-label and skill WORK
changes are retained. The user authorized PR creation after preview review.
Integration WORK owns the eventual merge to develop.

Reference: user attachment `Bloodline_Legacy_Living_Diorama-1.html`.
Its world-space moving focus and half-resolution processing already existed.
This change brings over signed CoC, a golden-angle circular gather and
foreground coverage. Colors are decoded before averaging and resolved through
the game's existing tone map. It replaces the separable Gaussian blur.

Runtime changes are confined to `src/render/tilt-shift.js` and the DOF composite
in `src/render/shaders.js`. Gameplay focus tracking and NORMAL/OFF behavior remain. The follow-up below
extends eligibility to combat and the frontline. SUBTLE uses 16 samples / 8 CSS pixels;
STRONG uses 32 / 14. Both keep two half-resolution RGBA8 targets and two passes.
The stronger preset was increased from 16 to 32 samples after visible sampling
streaks were found in the first comparison.

Initial bokeh revision validation: build and 93 tests PASS. Native EGL compiled and rendered the actual
scene/material/post shaders in clear and rain. NORMAL/OFF pixel equivalence
passed (maximum tolerance one byte). Same-camera STRONG comparisons are in the
companion `Bloodline_Legacy_Diorama_Comparison.html`. The optional capture tools
are `tests/diorama-offline.mjs` and `tests/diorama_offline.py`.

At 720×900, target storage remains 1,296,000 bytes. Seven post-only samples on
llvmpipe measured STRONG median 9.97→13.56 ms (clear), 10.45→14.86 ms (rain).
These exclude scene rendering and are software-renderer timings, not game FPS
or Pixel Fold predictions. Raw values are in `offline-results.json`.
Actual browser visuals, WebGL frame pacing and hardware performance are
UNVERIFIED. Gameplay now starts with SUBTLE Tilt-Shift. Settings expose only
ぼけの強さ (控えめ / 強め); no user-facing mode or OFF control.

## User-requested continuous tilt-shift

Removed the village-outskirts and combat exclusions. Gameplay in village and
frontline rooms retains the effect through contact, attack and telegraph states.
Combat focus tracks the midpoint of player and live target; the sharp band
protects both subjects during camera rotation and focus settling. Room changes
snap focus without resetting the effect. Clan, portraits, lineage and death
still use their existing presentation exclusions. No gameplay/save changes.

Follow-up build and 21 targeted Tilt-Shift tests PASS. The browser contract now
expects the effect to remain active outside and in combat/frontline; it was
updated but not run here. User device verification remains pending.

## PR preparation

Reconciled with develop `d589d84bd695df6c93c623b08392b53c6759efbc`, retaining
the family-book UI and automatic build identity. The only textual conflict was
the build module order; both lineage and motion modules are included.

The user additionally requested default-on Tilt-Shift and removal of on/off
settings during PR preparation. NORMAL/OFF remain internal QA/error-fallback
paths; default gameplay is SUBTLE without a settings interaction.

## Position-dependent terrain disappearance

Reproduced the reported pale ground near the northern gate at player (0, -29),
640×1000, zoom 16, yaw .42. `slice-terrain` contains the entire village in its
vertex coordinates but has an identity scale. The old visibility test assumed
a 1.75-unit mesh and culled the terrain when its origin left the camera view,
exposing the beige foundation. This defect also exists in the develop base.

Instance culling now projects the mesh's cached local bounding box through its
model matrix and the relevant camera. This preserves distant-object culling,
accounts for offset/rotated/scaled geometry, and works for shadow passes too.
Regenerated geometry replaces its cache entry. Skinned animation envelopes are
unchanged. No terrain, collision, weather, post-processing or game rule changes
are needed to repair the disappearance.

Same-camera EGL captures reproduce the beige foundation before the fix and
restore grass/roads afterward. These terrain captures intentionally use no DOF
and no characters to isolate ground submission; they are in the companion
comparison HTML. At this capture, scene+shadow calls remain 45, submitted
triangles fall from 915,102 to 839,648, and steady scene calls change 24→25
because the terrain now renders. No new render targets, textures or passes.
These are draw counts, not a hardware/frame-time benchmark.

Final build and **106 tests PASS**, including actual terrain draw submission at
8 positions × 2 aspect ratios × 2 camera rotations in both color/shadow passes,
plus retained offscreen culling. Default-on settings, combat/frontline focus,
motion, skill menu/save compatibility and family UI regressions also pass.
Browser/WebGL and Pixel Fold verification of this latest fix remain UNVERIFIED.
