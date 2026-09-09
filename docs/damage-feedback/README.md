# Player damage feedback and grounded recovery

BASE_BRANCH: develop

BASE_COMMIT: b0174532818b078a9bc59dec83c11b9e06b00bad

BRANCH: work/damage-feedback-recovery-20260909

Sources: supplied Common Development Policy v5, Implementation Prompt v2.0,
Visual References A–D (combat D reviewed again), and the user's follow-up:
make received damage recognizable through pain text, contact VFX and the body
diagram, and make fatal injury occur relatively quickly. This explicitly
authorizes the player wound balance change below. The v5 Ready PR workflow
supersedes the implementation prompt's older handoff-only instructions.

## Behavior

- A confirmed local wound produces one short pain callout, a pulse on the exact
  body-diagram part, and a body-positioned contact burst. Heavy damage preempts
  light pain. Calls have a 1.15-second interval; rapid repeats hold a single
  pulse instead of strobing. Chat text and cooldown remain independent.
- A pulse follows the confirmed injury event even if the HUD SVG is replaced.
  It fades in 0.62 seconds for light wounds / 0.95 seconds for heavier wounds.
  Existing injury color returns afterward. No new injury state is invented.
- Both explicit fatal wounds and depletion of health emit one wound event before
  death. Previously the latter could bypass wound feedback altogether.
- Contact effects use CM01 bone positions when available, otherwise a scaled
  body-part position. The spawn position stays fixed as the character recoils.
  Actual `guarded` events now reach the renderer, with physical guards anchored
  to the receiving arm. Local damage audio cannot be throttled by a remote hit.
- Reactions inherit the preceding authored torso orientation and load, prefer
  an already lifted foot, and preserve body velocity through a 90 ms rehit blend.
  Hitstop freezes that blend. One lifted catch step becomes a support anchor;
  the model does not automatically drag that foot home. Rehits subtract their
  starting offset so an existing foot displacement cannot be applied twice.
- Existing attack definitions, interruption decisions, stun, hitstop, action
  duration, AI, movement/collision and save schema are preserved. No new
  knockdown/rescue state or control lock is added.

## Approved balance change

Player wound health costs: light **19 → 30**, heavy **30 → 46**, lost **40 → 56**.
Existing armor factors (1 / .85 / .70), resistance, vital-part surcharge, wound
escalation and death rules still apply. Incoming ordinary impact strength is
separate from accumulated injury, so reopening a wound does not automatically
produce the strongest physical recoil.

Deterministic examples with no healing, passive resistance or successful guard:

| Contact pattern | Before | After |
| --- | ---: | ---: |
| Ordinary hits cycling four limbs, no armor | 5 | 4 |
| Same pattern, heavy armor | 7 | 5 |
| Ordinary repeated torso hits | 3 | 3 |
| Elite repeated torso hits | 2 | 2 |

Counts are fatal-contact counts, not time-to-kill promises. Ordinary mixed vital
and limb contacts can kill in 3 hits. The earlier 2-hit elite vital escalation
already existed; the change chiefly makes dispersed injury dangerous sooner.

## Validation

- Build: PASS, 5,684,552 bytes; no asset or dependency added to the game bundle.
- Full prescribed Node suite: **190 / 190 PASS**. Includes 10 new tests for
  feedback, fatal event ordering, balance, actual master/legacy grounding,
  repeated-hit continuity, bounded VFX, and local audio priority.
- Regression comparison retains the fixed baseline, with an explicit 11-point
  ordinary-wound delta assertion; all other simulation fields and RNG are
  compared. Enemy damage remains unchanged.
- [Contact frames](contact-review.jpg) and [moving comparison](comparison.mp4):
  actual runtime palettes and CM01 mesh, neutral offline EGL shading, no VFX or
  camera shake. Rows/cases: side impact, attack interruption, opposite rehit,
  guard. Still columns: before early/later, after early/later. The character has
  a stable support stance; the second hit redirects the trunk without doubling
  the planted foot offset. These are diagnostic frames, not gameplay captures.
- [CPU measurements](cpu.json): Node 24.19.0, 32 reacting actors, 3 runs.
  Median before 4.406–4.477 ms / after 4.489–4.665 ms. p95 varies with the host
  (before 5.875–8.565 / after 5.614–9.162 ms). No new rig bones, meshes, render
  passes or raycasts. Local low-quality wound burst is bounded at 8 needles.
- Browser / Pixel Fold: **UNVERIFIED**. Supervised browser navigation to the
  local built app returned `net::ERR_BLOCKED_BY_CLIENT`. Vite also encountered
  `uv_interface_addresses`; a static server served the build, but the browser
  restriction remained. DOM tests do not establish final browser layout, and
  host CPU / llvmpipe measurements do not establish mobile FPS or commercial
  visual acceptance. These checks remain with integration / playable review.

Reproduce:

```sh
node build.mjs
node --test tests/skills-preview.test.cjs tests/skills/*.test.mjs tests/*.test.mjs deploy/infrastructure.test.mjs tests/ui.test.cjs
node tests/damage-recovery-performance.mjs
node tests/damage-recovery-evidence.mjs verification/damage-recovery
python tests/damage_recovery_offline.py verification/damage-recovery
```

Offline dependencies are in `tests/offline-requirements.txt`; an alternate EGL
installation may use `GOLDEN_EGL_LIBRARY`, `LD_LIBRARY_PATH` and
`__EGL_VENDOR_LIBRARY_FILENAMES`. Output GIF can be converted to MP4 with ffmpeg.

## Integration

CHANGED_FILES: `src/legacy/{core,motion,art,audio,ui}.js`,
`src/character/{rig,golden-master.runtime}.js`,
`src/render/{combat-presentation,renderer-base}.js`,
`src/ui/{presentation.js,interaction.css}`, `tests/damage-motion.test.mjs`.

NEW_FILES: `tests/damage-{feedback,effects,recovery}.test.mjs`,
`tests/damage-recovery-{evidence,performance}.mjs`,
`tests/damage_recovery_offline.py`, and this directory's README / evidence.

DELETED_FILES: none.

TOUCHED_AREAS: Simulation.hitPlayer/inflictWound metadata and wound cost;
DamageMotion / damageFoot / damageArtPose; master and legacy support anchors;
UIDamageFeedback / wound HUD / pain label; received-hit VFX and audio.

Develop advanced to be5f92ceb734cee7ed5d9860c2202b974f142f24 during work (#22).
Its well collision and rendering changes touch core.js and renderer-base.js in
different areas: preserve those additions. Preserve any newer Skill WORK stance,
clock and footwork; damage should compose with those rather than replace them.
If Combat WORK adds incapacitation/rescue, carry the cost and wound-notification
changes into its authoritative path instead of reinstating the older death path.
Merge remains Integration WORK's responsibility.
