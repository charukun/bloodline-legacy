# Lineage flow revision — 2026-09-09

Base: `develop` @ `b8c3183a681c8eb01911c8123e16ee1e21153856`.
Sources: Common Development Policy v5, Implementation Prompt v2, and the user's
approved review of the deployed lineage screen (2026-09-09). User authorization
for branch/push/Ready PR supersedes the older prompt's handoff-only workflow.

## Behavior

- Living player: the current life alone is the main subject. Resume has no
  inheritance/newborn side effect. Historical browsing has an explicit return to
  the current life, including Escape, and cannot edit the living player's memory.
- Next life: unique archived skills are immediately selectable in the main
  screen (six per page, with skill search). A tap previews its actual donor record;
  the main action commits that experience and opens name/race preparation.
  Merely previewing a different skill does not replace a committed draft.
- History: ascending generations left to right, shared by card ordering, dial,
  page buttons, keyboard and swipe. The main stage follows the selected record.
  Only three cards/six search results are mounted; all generations remain reachable.
- Initial life: the approved prologue, race/name entry and existing onboarding.
  No ancestor or inherited experience is invented. Empty later archives have a
  direct route to preparation without asking for an unavailable skill.
- Repeated unlabeled counters and duplicate central arrows removed. Background
  motion is an option. Blank portrait sheets had no height; explicit dimensions
  fix the crop. Historical thumbnails use named record seals, and large racial
  illustrations are explicitly identified as illustrative rather than portraits.
- The parchment, existing button materials, transition effects and single video
  decoder remain. Flowing text protects long mobile content from overlap; small
  viewports may scroll rather than shrink controls below their useful size.

## Clear scope and persistence

The clan options expose `系譜をクリア`. A separate confirmation states that this
owner's historical lives, archived skills and current life (inventory/equipment/
progress included) will be erased to restart at generation 1. Draft name,
inheritance and village-code invitation are cleared. Race preference, audio,
quality and other settings remain; other owners and their history remain.

The UI adapter prepares a simulation copy using existing export/restore and
removePlayer APIs. It stores a portable-format backup at
`aerin.tactics.v3.backup.lineage.<unique-id>`, then writes world/profile before
replacing the in-memory simulation. Backup/save failure aborts; a partial write
is rolled back. If rollback itself fails, autosave is blocked and the error
explains that the backup is retained. No real user save was cleared during QA.

Clear is unavailable during gameplay (return to the clan first), while saving
is blocked, or for online state. The current repository has no deployed online
backend and no authenticated reset endpoint (`deploy/worker.mjs` returns 501).
The UI therefore never deletes a local token/cache and claims a server reset.
No server functionality, combat/growth/skill rules, character model, or shared
save schema was added or changed.

## Verification

Node/JSDOM button paths cover first birth, generation 1001, explicit experience
selection, preview vs committed state, donor deduplication/missing records,
current vs historical subject, ascending timeline/keyboard/pages, resume,
state refresh, stale-archive rejection, offline retry, cancellation, reset and
save restore, storage failure/rollback, online guards, focus and input isolation.
All existing UI/skill/simulation tests and deployment build checks are run.
Actual device/browser visual checks, screenshot comparisons, HTTP save/reload
and frame-pacing measurements remain paused at the user's request. DOM tests
are not browser layout, video-decoder or device performance evidence.

Integration contacts: `src/ui/lineage.js`, `src/ui/lineage/theatre.js`,
`src/ui/lineage/view.html`, `src/ui/lineage/view.css`, and their UI/lineage tests.
No changes to shared Game, Simulation, input, or server modules.

## Concurrent develop integration

Merged develop `7c7924345c4e27266b31e811864cb8c0acc50592` into the work
branch to retain concurrent UI-polish/canopy changes. Resolved overlapping
lineage edits by retaining symbol-only selection seals and `aria-pressed`,
while keeping the new chronology and separated resume/inheritance flows.
The UI-polish test now enters inheritance through the visible skill search.
