# Living Diorama bokeh preview

Base: develop `3d46ff7f036af085058d09a481f572c98728ae9a`.
Branch: `work/living-diorama-bokeh-20260909`.
Includes the pending motion/skill-menu preview; latest building-label and skill
WORK changes are retained. No PR or develop merge before user approval.

Reference: user attachment `Bloodline_Legacy_Living_Diorama-1.html`.
Its world-space moving focus and half-resolution processing already existed.
This change brings over signed CoC, a golden-angle circular gather and
foreground coverage. Colors are decoded before averaging and resolved through
the game's existing tone map. It replaces the separable Gaussian blur.

Runtime changes are confined to `src/render/tilt-shift.js` and the DOF composite
in `src/render/shaders.js`. Existing village eligibility, combat bypass, focus
tracking and NORMAL/OFF behavior remain. SUBTLE uses 16 samples / 8 CSS pixels;
STRONG uses 32 / 14. Both keep two half-resolution RGBA8 targets and two passes.
The stronger preset was increased from 16 to 32 samples after visible sampling
streaks were found in the first comparison.

Validation: build and 93 tests PASS. Native EGL compiled and rendered the actual
scene/material/post shaders in clear and rain. NORMAL/OFF pixel equivalence
passed (maximum tolerance one byte). Same-camera STRONG comparisons are in the
companion `Bloodline_Legacy_Diorama_Comparison.html`. The optional capture tools
are `tests/diorama-offline.mjs` and `tests/diorama_offline.py`.

At 720×900, target storage remains 1,296,000 bytes. Seven post-only samples on
llvmpipe measured STRONG median 9.97→13.56 ms (clear), 10.45→14.86 ms (rain).
These exclude scene rendering and are software-renderer timings, not game FPS
or Pixel Fold predictions. Raw values are in `offline-results.json`.
Actual browser visuals, WebGL frame pacing and hardware performance are
UNVERIFIED. User preview: 設定 → 村の見え方 → TILT-SHIFT → DOF SUBTLE.
