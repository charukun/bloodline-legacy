# Reference camera follow preview

Base: current develop `bf955ba` (PR #14 and current sharp skill FX included).
Branch: `work/reference-camera-follow-20260909`.
Reference: user attachment `file_000000004fa08206847d9893485abe3d.png`.
The reference is a still: its movement response cannot be measured. Follow
behavior below is an authored interpretation for the user's device review.

## Scope and behavior

- Lower the gameplay elevation from approximately 45° to 30° (.52 radians),
  with a stable .30-radian azimuth, emphasizing building facades.
- On a 540×960 phone view, reduce orthographic view height from 30.0 to 22.0
  world units. Preserve useful width on narrow screens and height in landscape.
- Place the player's feet at 62% of screen height when stationary, leaving
  space ahead. Existing wheel zoom, explicit QA yaw/freeze, portraits and clan
  presentation keep their contracts. Optional `anchorY` supports camera framing
  requests from UI without changing UI code.
- Use actual displacement for bounded directional look-ahead (maximum 1.25
  units, maximum lead adjustment 2.5 units/s) and critically damped follow.
  The damping integrates a linear target over the frame, rather than applying
  a frame-rate-dependent Euler clamp. Facing changes alone do not pan.
- Keep the reference angle during combat. Bias composition toward the live
  opponent and expand the frame when needed; no abrupt encounter orbit or
  automatic zoom-in. Movement and combat rules remain unchanged.
- Snap safely on new player/room, teleport and time discontinuity. Frontline
  geometry chunk changes do not reset follow. No asset/character changes.

## Verification

Build and **135 tests PASS**. Six added camera tests cover portrait/landscape
framing, 30/60/120 Hz movement/reversal/stop, actual-direction look-ahead,
combat framing, room/teleport recovery, and ground projection/input parity.
The current terrain culling, building label, character, skill FX, save and UI
regressions remain in the suite. One initial reversal overspeed was corrected
by limiting lead changes and using the proper moving-target spring solution.

Same-position EGL captures use seed 7349, player (1.8,16), age 14, clear weather,
540×960. The Before uses the prior settled gameplay camera; After calls the
actual new `updateCamera`. Both omit DOF to isolate framing, and use the same
art/shaders. Character poses are exported as rigid parts by the diagnostic.
See the supplied `Bloodline_Legacy_Camera_Comparison.html`.

At that view, submitted scene+shadow triangles change 940,882→918,916;
scene+shadow calls 66→67, steady scene calls 45→46. There are no new GPU passes,
textures or buffers. Counts vary with visible content; these are not FPS.
Browser visuals, device input feel, hardware frame pacing and foreground
occlusion at every possible location remain UNVERIFIED. Tilt-Shift is retained.
The user reviewed the standalone preview and requested PR submission.

## PR preparation

Refreshed develop to `07f44280de7304adfb8ffba3129a6bd9bbead59d`, retaining
the portrait/bottom and landscape/right consciousness panels from PRs #15/#16.
Resolved the render-loop conflict in this order: ordinary follow → panel
composition → projection. Both behaviors and the updated ground picking are
preserved. An added integration regression covers both orientations and panel
closing with the new reference angle. Build and **143/143 tests PASS**.
