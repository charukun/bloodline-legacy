# Silk slash: first material-quality slice

## Direction and scope

Follow-up to the effect composer: preserve its configurable recipes while removing
the exposed polygon/diamond appearance of the blade family. Latest develop at
start was `7c7924345c4e27266b31e811864cb8c0acc50592`. The unmerged PR #38
composer was brought forward explicitly; no recovery/bootstrap replacement.
The subsequent combat/life update `717931fd92271104b89a9c5645ed4792bbf06c2e`
was incorporated before final validation, without conflicts.

The accepted production sequence is: effect plot, generated six-frame art
direction, layer/geometry design, implementation, optimization. The first quality
target is one slash, applied across its four paths and the three authored contest
skill IDs (60040–60042). The other five material families keep their existing
appearance. This is not a claim that all six families received final art assets.

## Plot and six keyframes

1. A fine filament gathers tension.
2. The leading tip accelerates; a narrow curve grows behind it.
3. An asymmetrical crescent opens: bright outer edge, translucent inner wake.
4. Actual contact supplies the small impact accent; the arc follows through.
5. Fine internal strands erode and separate.
6. The last filaments disappear without a lingering solid plate.

The design sheet was created using the built-in image generation tool. It is a
visual target, not a flipbook pasted into the game. The implementation uses a
continuous procedural mask, avoiding discontinuity between generated images.

Generation prompt:

> Design one elegant sword slash for Bloodline Legacy as six consecutive keyframes,
> in a 3-column by 2-row sheet, at the same three-quarter gameplay angle. Only the
> magical blade wake; no character, sword prop or UI. Quiet charcoal background.
> Fine filament, advancing tip, asymmetrical ivory crescent, compact contact,
> eroded wisps, near disappearance. Premium hand-painted stylized RPG VFX,
> calligraphic motion, silk-thin light, razor-bright outer edge and soft irregular
> inner erosion. No polygon faces, triangular chunks, repeated diamonds, thick
> plastic crescents, shockwave spam, rainbow colors, bloom fog or giant stars.

## Structure

- One tapered continuous surface plus one/two fine inner filaments.
- UV-based bright edge, translucent strands and smooth time-dependent erosion.
- `SkillSilk.stroke` constructs the curve. `SkillSilk.mask` is the Canvas
  approximation of the game's analytic material 24.
- Actual equipped-weapon trails are resampled from the existing blade-tip history;
  interpolation preserves real endpoints and freezes during hitstop.
- No changes to attack timing, damage, reach calculations, movement, discovery,
  camera or save data. Recipes remain version 1 and previous exports still load.

Material 24 reuses its mesh normal attribute for longitudinal UV, transverse UV
and erosion phase. RVERT redirects only that surface into `vLocal` and supplies a
fixed normal. The shared RFRAG early-return path draws it without terrain/PBR
sampling. No vertex layout or existing character shader interface changed.

The renderer keeps at most 16 ribbon mesh slots (8 on low), reusing GPU buffers.
Ribbon segments count against the existing 512/256 composition budget. Low mode
uses 24+12 segments for a synthetic slash; no extra texture allocation or particle
simulation is introduced. Room changes release vertex/instance buffers, VAOs,
cache entries and instance scratch storage.

## Review and validation

The HTML now has “旧版と質感を比較”. Both sides use the same recipe and playback
clock. The previous blade renderer remains available only as the comparison
baseline. Motif/path/rhythm/contact/ending controls, import/export, scrubbing,
grayscale and pinned configuration comparison remain available.

```sh
npm run build:skill-fx-lab
node --test tests/skill-silk.test.mjs tests/skill-effects-composer.test.mjs
node tools/skill-fx-lab/silk-evidence.mjs
python3 tests/silk-slash-offline.py
npm test
```

Validation: 270 repository tests pass, including 13 focused composer/silk tests.
DEV build and deployment integrity check pass. Native EGL compiled the actual
game shaders, linked the unchanged skin shader, and rendered 12 samples spanning
all four trajectories and three lifecycle points. The Canvas comparison was
visually inspected and tuned for small-scale edge coverage.

Canvas inspection approximates the shader with continuous gradient strips; EGL
uses the real game GLSL with only the ES-to-desktop header adaptation. Neither
is browser/device QA. Pixel Fold playback/FPS and listening remain unverified.
The generated art direction is richer than the current runtime material; it
remains the target for subsequent material polish, not a claimed exact match.
