# Approved lineage theatre integration

Base: `develop` at `fad97fcc91f13f76adacb21c9257b6496396dfca`.
Branch: `work/ui-lineage-theatre-20260909`.

## Intent and source

Integrate the approved standalone lineage rough, version 8, into the current
module-based game. Preserve its parchment surface, existing-game button styling,
silent background films, first-life introduction and state-triggered transitions.
The rough is the visual/interaction reference only; the implementation and all
life/skill/save contracts were rechecked against the above develop commit.
Project Sources: Common Development Policy v5 and Implementation Prompt v2.0;
the user's explicit GitHub PR instructions supersede the older handoff-only
instructions. The former task branch and the approved rough remain preserved.

## Implementation boundaries

- `src/ui/lineage/theatre.js`: native view inside a ShadowRoot, isolating its
  typography, CSS, SVG identifiers and keyboard events from live-game panels.
- `src/ui/lineage/view.html` and `view.css`: approved layout and materials.
- `src/ui/lineage.js`: reads `Game.getLegacy`, `Game.canResume`, live players,
  `skillById` and `skillPhase`. Passes choices to existing profile fields and
  `Game.start`. No copied gameplay logic or mock success path.
- `src/legacy/ui.js`: view lifecycle hooks and the lineage navigation label.
- `tools/build-lineage.mjs`, `build.mjs`: embed assets once in the downloadable
  and deployed HTML; embedded font license travels with the HTML.

The bottom dock retains consciousness / wardrobe / settings and its existing
section-toggle behavior. Character-play HUD and equipment management are not
added to the clan screen. Historical equipment is readable in record details.
Race illustrations are explicitly presented as bloodline imagery, not actual
recorded appearances. Missing appearance data stays unrecorded. No parent-child
links are inferred.

## Game and lifecycle contracts

- Fresh save: no invented history, four existing races, optional name, original
  onboarding, then an actual age-zero character through Game.start.
- Later generations: bounded three-record rail and six-result library, indexed
  by recorded generation, with searchable life/skill pages. No three-generation
  cap, and duplicate donors do not duplicate a skill candidate.
- Inheritance: only archived, still-known skill IDs; one experience; revalidated
  before starting. The chosen skill is not granted as already learned.
- Living player: resume only. An online token is a resumable remote session,
  not fabricated local character data. Joining remains server-authoritative.
- Failure: keep the draft, release the launch lock, display retry. The existing
  native onboarding/settings panel cannot be hidden behind a nested dialog.
- The save prefix, world schema, ages, combat, skills, equipment/inventory rules,
  simulation and character models are unchanged.
- One native video decoder per visible view. Pause on hidden document/settings;
  destroy its source, listeners, timers and animations on exit. Respect reduced
  motion; fixed first-life explanation stays still during race selection.

## Verification

- `npm test`: 162/162 PASS (build, UI, skill, simulation, motion, deployment tests).
- `node --test tests/lineage.test.mjs tests/ui.test.cjs`: 42/42 PASS after final
  lifecycle/fallback changes.
- `node tests/skills/lives.mjs`: PASS, existing multi-life simulation assertions.
- New integrated DOM tests call the real Game.start via visible controls and
  compare actual Simulation/save state: first birth + onboarding, generation
  1001 + one inherited experience, live resume, no-inheritance start, missing
  donor records, stale archive, online failure/offline retry, online token,
  nested Escape, disposal and gameplay input isolation.
- Existing family-ledger DOM assertions were updated for the approved
  interaction changes: current lives are read-only; equipment stays in details;
  the history list is bounded; help opens on demand.

These are Node/JSDOM and simulation checks, not browser or device visual tests.
Full device/browser resolutions, screenshot comparisons, HTTP save/reload and
frame-pacing measurements remain paused by user instruction. No browser-policy
workaround was attempted. CI retains the repository's existing required gates.
The separate raw HTML rough is not shipped, and no fixture selector or fixture
history is included in the game.
