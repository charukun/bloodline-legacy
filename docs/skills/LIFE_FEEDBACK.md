# Skill life feedback

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

BASE_BRANCH: develop
BASE_COMMIT: 57bc1b36b15bce4b5cc3ff86bedea89dba38dfaf
WORK_BRANCH: work/skill-system-life-feedback-20260909
INTEGRATED_DEVELOP: cd5f0344a176802dbfbfd3e9d28edadcd98a9907 (PR #25 skill choreography retained)

The slower discovery pace leaves more time to notice how a life forms a fighting style. This change makes actual connections, lived contrasts and the completed life visible without changing technique behaviors or the discovery lottery.

## Behavior

- A confirmed landed connection carries its actual entry/exit tag and target position. The first occurrence of each ordered pair in a life produces three short notes, two converging mint traces (plus one small accent at higher quality), and one 2.3-second phrase describing the connection. Existing connection counts remember first occurrences across reload.
- Repeated connections omit text. A quieter note and half-strength traces are limited to once per six seconds per player; all other repetitions allocate no sound panners or VFX entries. Contact, damage, hitstop, animation and combo conditions are unchanged. Traces expire after 0.24 seconds and reuse the existing shared needle mesh and bounded effect queue.
- Six authored qualitative glimpses recognize contrasting experiences. They require distinct lived source kinds, at least eight accepted experiences, recent journal evidence (180 seconds) or retained memento provenance, and 120 seconds between glimpses. Each contrast appears at most once per life. Combat, prologue and the 30 seconds following a discovery suppress them. They contain no pending skill ID, probability, progress bar or promised outcome. Repeated single activities and idle time do not produce them. They do not mutate either discovery RNG, world RNG, charge or unlock timing.
- The existing death panel gains a compact remembrance: up to three actually used active techniques, the most successful known connection, and the origin of a discovery. No new screen or confirmation is added. Unused techniques/passives do not determine the signature; empty lives retain the original panel. The archive stores the signature with existing history. Inheritance rules remain unchanged.

## Save and integration

Skill extension version remains 1; revision is 4. `skillLife.glimpses` adds bounded `seen` keys and `lastAt`; restore accepts old saves and sanitizes invalid values. New lives reset them. Existing `connections` supply first-occurrence identity. `skillHistory.signature` is additive metadata. World save schema, learned skills, loadout weights and bloodline selection are unchanged.

Changed files:
- `src/skills/engine.js`: glimpse state, sanitation and event-only evidence selection.
- `src/skills/runtime.js`: experience feedback, connection event metadata, used-technique signature.
- `src/skills/presentation.js`: first-connection words/audio, glimpse float, death remembrance.
- `src/skills/skills.css`: bounded text and remembrance styling.
- `src/legacy/ui.js`: existing death content hook; float class/lifetime support.
- `src/render/renderer-base.js`: accented connection effect admission.
- `src/render/combat-presentation.js`: shared needle rendering.
- `src/audio/ambience.js`: skip silent feedback before panner allocation.

New files: this document; `tests/skills/feedback.test.mjs`.
Deleted files: none.

Integration should retain concurrent death/inheritance changes and use the `SkillPresentation.recap(p)` content hook without replacing the death flow. UI and audio hooks are additive to current facility actions, lineage theatre, motion and camera behavior.

## Validation

- `npm test`: 216 passed after integrating current skill choreography, 0 failed/skipped, including seven new feedback tests, real simulation combat/activity paths, reload, death/archive, DOM controls/escaping, no-RNG/no-learning-change comparison and bounded VFX draw collection.
- New CPU glimpse check: 96 journal records, 1,000 measured calls after warmup; p95 0.071 ms, max 0.217 ms in this environment. This is CPU-only, not a device FPS claim.
- `git diff --check`: passed.
- Browser/device visual and listening assessment remains unverified. The prior browser URL security restriction is respected; no local-browser workaround was used. The HTML is provided for user evaluation. Existing required CI checks remain enabled.
