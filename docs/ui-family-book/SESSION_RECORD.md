# Family book and three-button navigation

> **HISTORICAL — 過去WORKの実装・検証記録。** 以下の旧ポリシー、命令形の統合手順、PR/branch状態、SHA、検証条件・結果は当時の記録であり、現行命令や現在headの成功証拠ではありません。担当調査に必要な場合だけ参照してください。[現行の文書案内](../README.md)。

## Source / scope

- Repository: `charukun/bloodline-legacy`
- BASE_BRANCH: `develop`
- BASE_COMMIT: `4f928f133ea56310d63dbf32af6a3295f2446fcb`
- BRANCH: `work/ui-lineage-navigation-20260908`
- Project Sources: common development policy v5; implementation prompt v2.0. The newer policy and explicit user instructions authorize branch/commit/Ready PR, never merge to develop.
- Current user request: bottom buttons 意識 → 身支度 → 設定; tap again to close; redesign the clan/family screen using the attached parchment genealogy reference, with flexibility for the real game concept.
- User explicitly deferred real-device playtests, matched screenshots, HTTP save/reload and frame-pacing work to reduce cost. These gates remain deferred, not passed. No attempt to restart that work was made.
- The attached reference is visual direction only. Its invented characters, family links, six inventory slots, quantities and blue numeric stamina are not game specifications and are not imported.

## Dependency integration

At task start prior UI PR #6 (`ccf0b1a0bb71980bac6c0363973b3105a10ae872`) was still open. This branch starts at latest develop and merges that prior UI branch into the work branch only. Original local branches and commits are retained.

Resolved build ordering (Tilt-Shift + GS02 + UI), test/dependency composition, and UI navigation/settings conflicts. Preserved Tilt-Shift settings and lineage suspension, import accessibility, and prior UI fixes. No render, simulation, environment, asset or character source is changed against the recorded develop base. `Game.installInput` retains the prior PR's one keyup isolation guard.

Integration WORK: this PR includes #6 as an ancestor dependency. Integrate #6 first if still appropriate; otherwise review the combined tree. Do not blindly reapply old UI files or revert GS02/Tilt-Shift. No prior PR is closed or merged by this task.

## Implementation

- Three persistent dock buttons in the requested order. Re-tap closes the active section (including nested pages); switching sections resets the top-level history.
- Reuse the same dock DOM inside the active dialog so touch/keyboard access remains available without re-enabling the game canvas or background HUD. Selected state, focus trap, Escape/back and focus return are preserved.
- Clan home becomes a paper family ledger: four actual species banners, life history, one inherited-skill seal, current equipment/two inventory slots, and existing next-life name/race/start/resume controls.
- In-game Settings → 血の系譜 opens the same record presentation. The map remains reachable through the minimap.
- Life cards use only stored generation, age, cause, appearance, equipment and skill usage. Missing metadata is explicitly unrecorded; no parent-child graph or portrait fallback to the current avatar is fabricated.
- Historical details expand inline. Only 12 records mount initially; older records remain available through pagination. Current age/gear refresh on state changes without idle DOM rewrites. Open details and scroll are retained.
- New UI-only module `src/ui/lineage.js` and stylesheet `src/ui/lineage.css`; reuse existing parchment and renderer portraits. No added runtime dependency, new character model, simulation rule or save schema.

## Validation

- `npm test`: 69/69 PASS (33 UI/real-Simulation DOM tests, 22 Tilt-Shift, 8 environment, 6 infrastructure).
- `node deploy/build.mjs dev`: PASS.
- `node deploy/check-build.mjs dev`: PASS.
- `git diff --check`: PASS.
- Regression includes dock order/toggle/switching, inert separation, focus, real `Game.start` new life with single inheritance, truthful missing records, historic/current equipment separation, two slots, long history/paging/queue lifecycle, help preference, state-driven updates, existing movement/rest/chat/save behavior and Tilt-Shift settings/suspension.
- Existing CI browser smoke is left enabled; its result will be reported on the PR. It is not the deferred full visual/device acceptance suite.
- Existing Tilt-Shift browser test now asserts Escape restores Settings, then closes Settings through the active dock button before its unchanged movement checks. This updates the navigation precondition without weakening movement, framebuffer, save or rendering assertions.

## Changed responsibilities

NEW_FILES: `src/ui/lineage.js`, `src/ui/lineage.css`, this record.

CHANGED_FILES for this follow-up: `src/legacy/ui.js`, `build.mjs`, `tests/ui-fixture.cjs`, `tests/ui.test.cjs`.

Dependency integration additionally resolves `.github/workflows/deploy.yml`, `package.json`, `package-lock.json`, and carries PR #6's files. No deletion.

TOUCHED_AREAS: `UI.renderClan`, `lineage`, `showGame`, `open`, `closeModal`, `modalKey`, `restoreFocus`, `update`, dock section switching; existing Tilt-Shift UI settings; standalone module/style order; DOM test fixture.

Delivery: build `dist/index.html` into a named standalone HTML for the user. It represents this PR's combined branch, not a claim of develop deployment or merge.
