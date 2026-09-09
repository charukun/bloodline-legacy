# UI Minor Polish — 2026-09-09

## Scope and sources

- Repository: `charukun/bloodline-legacy`, base branch `develop`.
- Initial inspected base: `be5f92ceb734cee7ed5d9860c2202b974f142f24`.
- Project Sources: `Bloodline_Legacy_Common_Development_Policy_v5_Ready_PR(1).txt` (v5), `Bloodline_Legacy_Implementation_Prompt-1.txt` (v2), current user's five correction requests.
- Visual reference: attached family ledger image `file_000000008e08820693ee766cb1158bb3.png`; cloth markers, warm metal edging and stitched material treatment. Existing authored `cloth-panel.png` is reused; reference pixels are not used as assets.
- Common policy v5 and the user's explicit Ready PR workflow govern publication. No merge is performed here.

## Changes and causes

1. Facility activity sentences still arrived as `progress` events, but the label layer placed them at fixed coordinates with no rise/fade. The shared floating-text path now rises and fades for 4.6 seconds using presentation time, keeps the rendered actor's position, reuses its DOM node and hides offscreen. Repeated identical phrases restart by event time. Reduced-motion mode keeps the fade without vertical travel.
2. The carried introduction still exposed a manual `降ろして` button. The button, its current wrapper and handler are removed. Existing automatic release timing, carried movement and save/command compatibility remain intact.
3. Speech placement used the character's facing direction every frame. Turning while walking changed its side immediately. It now uses a projected fixed world axis, so camera rotation can change the side while character turns do not. A 24px margin between switching thresholds prevents repeated flips near screen edges.
4. Repeated selection-state captions are replaced with one shared leaf seal. ARIA retains the state for assistive technology.
5. The four consciousness tabs used one connected rectangular control. They now use four cloth bookmarks with stitched edges, earth colors and a solid illuminated edge for the active page. The existing four pages, five-column list, pie, descriptions, panel positions and command behavior remain.

## Horizontal audit of state captions

| Area | Observed caption | Change |
| --- | --- | --- |
| Active skill list | 未採用 / adoption shown by allocation | Empty / lit leaf seal; allocation percentage retained |
| Passive list and detail | 常 / 常時有効 / 常に働く力 | Lit seal; redundant visible captions removed |
| Equipment rack | 装備中 / 選択中 | Shared seal plus existing chosen frame and `aria-pressed` |
| Latest lineage screen | この経験を選択中 / 選択中 in the memory index | Leaf stamp / lit leaf button with accessible state |
| Latest first-life race choices | Existing checkmark and frame | Retained; the older text-labelled race banners have been replaced upstream |
| Skill pages and settings choices | Existing chosen styling | Retained; no duplicate state caption present |
| Skill activation button | 編成から外す / 序に組み込む | Retained as action instructions |
| Wounds, poison and other conditions | Actual condition names and severity | Retained as gameplay information, rather than selection badges |
| Restrictions, empty records and full inventory | Why an operation is unavailable or data absent | Retained so their meaning is not lost |

UI state changes do not change skill weights, passive behavior, equipment eligibility, inheritance rules or saved data.

## Validation

- Baseline: 187 tests passed. Prior code reproduces direction-dependent parent bubble flips, the leave button, fixed activity-text position and the visible unadopted caption.
- `tests/ui-polish.test.mjs` covers the seven real facility actions and their emitted text; continuous rise/fade; repeated text; offscreen/dead-speaker cleanup; reduced motion; parent turns; camera rotation; screen-edge hysteresis; automatic release without the button; adoption/passive/race/equipment state; and saved-state invariance.
- Existing carry and equipment tests retain their gameplay assertions and now expect the requested presentation.
- Final test count and branch/tree verification are recorded in the PR.
- Browser access to local/shared game files was rejected by this session's URL security policy. No alternate browser route was used. DOM/CPU tests do not establish GPU appearance, visual acceptance or Pixel Fold touch quality; those are unverified.

## Integration

Rebased onto `7bd8263` after the lineage-theatre integration (#23). The new theatre lifecycle is preserved; the horizontal audit was applied to its current memory controls instead of restoring the obsolete race-banner component.

The current branch changes presentation and regression tests. `core.js`, the skill catalog, combat rules and persistent save formats are unchanged.

The facility-anchor PR #24 and other UI work may touch the same long `showGame` line or adjacent label rendering. Preserve facility anchors, remove only the carried leave control, retain the shared floating-text motion, and keep the existing four-page consciousness layout when resolving conflicts.
