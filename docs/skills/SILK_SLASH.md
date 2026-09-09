# Silk slash: first material-quality slice

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

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

## Flutter and body follow-up (2026-09-09)

User feedback: animate irregular flutter and make the slash visibly thicker.
The blade recipe now accepts `flutter` (0–1, default 0.65) and `thickness`
(0.5–3, default 2.2). These are presentation controls, not damage/reach modifiers.
Old version-1 recipes supply the new defaults; invalid values are rejected.

Two scales of seeded quintic value noise displace the wake and its internal
strands continuously. No per-frame random calls, texture allocations, new
particles, or extra mesh segments. The cutting edge stays anchored. The broader
luminous core and denser translucent wake give the surface body without changing
color or slowing attack timing. The shape seed is saved with the lab recipe.

Material 24 keeps UV/erosion in the existing normal attribute and uses its
instance RGB slots for flutter amount, reduced noise seed and motion clock. Its
ivory pigment is authored in the shader. The other materials still interpret RGB
as color; vertex layouts and character shader interfaces are unchanged. The
Canvas adapter consumes the same noise/mask settings. The EGL check passes these
actual instance values too.

Real blade trails use the simulation-adjusted attack elapsed time. Their samples,
noise and expiry freeze during hitstop, resume afterward, and clear when a new
action resets the clock. The fallback slash already follows `SkillMotion.clock`.
Simulation, save and input code are untouched.

The HTML provides thickness/strength sliders, a saved-seed variation button,
paused-frame editing, and a synchronized comparison against thickness 1 / zero
flutter. The original faceted baseline and arbitrary pinned A/B comparison are
still selectable. These new controls apply to the blade family only.

Focused validation: 16 tests pass, including continuous noise before erosion,
seed/replay determinism, zero-flutter behavior, thicker geometry with the same
cutting edge and segment budget, and a runtime hitstop/resume/new-action test.
Native EGL renders all four paths at three phases and links the shared character
shader. Browser/device rendering and FPS remain unverified.

Final follow-up validation: 273 repository tests pass; DEV build and deployment
integrity pass. The supplied comparison animation runs at half speed to make
flutter easier to inspect; the HTML retains selectable playback speed.
