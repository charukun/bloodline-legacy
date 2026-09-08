# Golden UI Vertical Slice — UI WORK

Status: **BLOCKED (GitHub WRITE) + VALIDATION_PENDING / Fallback review handoff / DO NOT MERGE**

## Source and scope

- Repository: `charukun/bloodline-legacy`
- BASE_BRANCH: `develop`
- BASE_COMMIT: `9ee25afc5f67e142adc313813b4289d157d47935`
- HEAD_BRANCH: `work/golden-ui-20260908`
- GitHub connector metadata and branch API read succeeded; a fresh git clone matched this SHA.
- Common development policy: Project Sources v4, SHA256 `d877a663810644c9904c2b4da1c4cee5127ca8bae3dd93fdefc085adf8e78d55`.
- Implementation prompt: Project Sources v2.0 (2026-09-08), SHA256 `bea1a3afa6fb07f241f44ada4c5349d1c36142a952eabd82bbdc69e30fcd64ab`.
- The explicit UI WORK instruction and policy v4 supersede the older prompt's no-commit/handoff-only workflow. Commit/push/PR are authorized; merging is not.
- Confirmed UI decisions come from the user's full task. No separate complete specification file was supplied beyond the prompt and references. Unspecified simulation behavior is preserved as observed behavior, not redefined from old HTML.
- References inspected: `02-...png` = combat (D); `03-...png` = genealogy (C); `04-...png` = village (B). `20260908_035546_504.mp4` = gameplay reference A; metadata and a frame at 7s inspected. Continuous video comparison is not verified. Reference art is not shipped as an asset.
- The attached recovery HTML and prior handoffs were not used as implementation sources.

Only UI/HUD, presentation helpers/styles, one input isolation guard, build wiring and tests are changed. Simulation (`src/legacy/core.js`), dialogue/skills, renderer, environment, characters, weather, audio and all assets have zero diff against BASE_COMMIT.

## CURRENT UI AUDIT

The live Cloud Browser could not complete game startup. The baseline screenshot and report were instead retrieved from the pre-existing successful CI run for the exact BASE_COMMIT: [34186777949](https://github.com/charukun/bloodline-legacy/actions/runs/34186777949), artifact `smoke-local-34186777949-1`, ID `10040872205`. This is archived CI evidence, not a playtest performed in this session.

| Area | Baseline evidence | Change |
| --- | --- | --- |
| Identity | 393×852 CI screenshot: portrait obscures name/age at top left | Portrait participates in layout; bounded name, stable age and condition |
| Health | `update` uses health but ignores wounds for condition text | Heavy/lost/light wounds take precedence over “良好” |
| HUD work | Same snapshot repeatedly writes text, SVG attributes, world-label HTML; paints map each update | Compare values, quantized orb fill, map state signature, keyed world-label nodes |
| Interaction | Pickup shows only 拾う; capacity failure learned after tapping | Item name, explicit full state, existing discovery radius and pickup command |
| Equipment | Current names exist; age/distance gating communicated late | Current equipment section, two named inventory slots, age/distance explanation, selected labels |
| Modal | Back always closes; no focus management; backdrop passes pointers | Navigation stack, close button, inert background, Tab/Escape, focus/scroll restoration |
| Input | Movement-key release sends a zero-move command while typing inside a modal | Add `!ui.modal` guard to existing keyup handler only |
| Battle | Nearby enemies all get HP bars; combo/skill separate; world-label HTML rebuilt | Only `player.autoFight` target, own phase/skill callout, actual status text |
| Notices | Own age events ignored; discoveries overlap as float lines | One live notice, life priority, bounded pending queue, discovery grouping |
| Lineage | Rendered `ancestor`/`lineage-list` differ from older CSS selectors | Style actual DOM; record timeline, current life, actual age/cause/skill; unknown generation stays unknown |

## Verification completed

- `npm ci --ignore-scripts --no-audit --no-fund` / Node 24.19.0; JSDOM pinned to 30.0.1, development only, not bundled.
- `npm test`: DOM and real Simulation integration tests. See `tests/ui.test.cjs` and evidence output.
- `node build.mjs`: standalone build succeeds, no runtime dependency added.
- `node deploy/build.mjs dev` and `node deploy/check-build.mjs dev`: build/asset integrity passes.
- `node --test deploy/infrastructure.test.mjs`: existing 6 tests pass.
- Generated JS syntax and `git diff --check`: pass.
- Protected simulation/rendering/asset paths compared against BASE_COMMIT: unchanged.

JSDOM tests cover wound/status presentation, life-event ordering, bounded notifications, pickup/two slots/discard, age/distance equipment rules via actual commands, modal navigation/scroll/focus/Tab/Escape, game-key isolation, existing 480ms long-press and pointer cancellation, talking wakes and broadcasts, engaged target selection, combo/status presentation, skill weight commands/focus/restriction refresh, real lineage/inheritance, localStorage save/restore payload, and repeated HUD construction.

These are **not browser playtests**. JSDOM does not validate layout, inert enforcement, touch rendering, WebGL, frame pacing or actual HTTP persistence. Save/restore uses the actual Game/Simulation methods against JSDOM localStorage, not a real browser reload.

## Performance evidence and limits

`node tests/ui-benchmark.cjs 9ee25afc5f67e142adc313813b4289d157d47935`

100 warm-up updates, 1,000 measured identical snapshot updates, three runs per version. Same simulation/DOM fixtures. Baseline and new UI are compared with drawing methods stubbed. Per-run distributions are in `evidence/dom-benchmark.json`.

- Baseline DOM mutations: 10,000 / 10,000 / 10,000.
- New DOM mutations: 0 / 0 / 0.
- Baseline mean UI update ms: 0.1931 / 0.1819 / 0.1642.
- New mean UI update ms: 0.0334 / 0.0254 / 0.0213.

This is a DOM-only microbenchmark, **not FPS**, GPU time or a frame-pacing result. No commercial-quality or device-performance claim is made.

## Browser limitation and remaining mandatory gates

1. Cloud Browser rejected `http://127.0.0.1:8000` (`ERR_BLOCKED_BY_CLIENT`) and file HTML by URL security policy. No policy bypass or alternate browser control was used.
2. Existing public DEV opened, but game startup reported `WebGL 2 を利用できません。Chromeで開いてください。` in this Cloud Browser. This does not mean DEV is broken on supported browsers.
3. Repository deployment documentation says PR/feature Preview is disabled. This UI WORK does not change deployment policy or deploy over develop.
4. PR CI has not run: remote writes failed, so no PR exists. Once a writable Integration WORK creates a Draft PR, the existing CI can run its HTTP/WebGL smoke. That smoke covers startup at 1280×800 and 393×852; it does not cover the entire Golden UI path.

Before ready-for-review/merge, Integration WORK or a supported browser environment must complete:

- Actual exploration → target discovery → pickup/talk → combat → phase/skill/status → combat end → inventory/equipment playtest.
- Matched BEFORE/AFTER at fixed save/position/camera/weather/age and 320×568, 390×844, 673×841, 844×390, 1440×900. Archived CI initial-state screenshots are only a partial visual comparison: names, elapsed time and animation frame vary.
- Primary target bounds ≥44px, safe areas, narrow screens, landscape, folding/resizing, virtual keyboard. CSS is implemented but full layout measurements remain unverified.
- Real HTTP-origin save → reload → resume, prologue gifts/release, equipped restrictions, injuries/status, combat and lineage persistence.
- Real pointer/touch long press, cancellation, modal backdrop isolation, drag/keyboard pie adjustments, repeated menu cycling and focus restoration.
- Warm-up + 30–60s ×3 actual rendered-frame timing in village, rain, combat and menu cycles; p50/p95/p99/max. Pixel Fold and actual desktop GPU gates are unverified.
- Fix/retest any issues, then mark ready. **Do not merge merely because startup CI passes.**

## Conflict/Integration notes

TOUCHED_AREAS: `UI.constructor`, HUD/`showGame`/`update`, `updateContext`, `updateMother`, `updateWorldLabels`, `toast`/`event`, `open`/`back`/`closeModal`, `renderSkills`/`describeSkill`/`pieMarkup`, `body`/`rack`, `lineage`, `talk`, onboarding navigation; `Game.installInput` keyup guard; build module/style order; UI test step in existing CI.

- Skill WORK must preserve the current phase weights/restrictions and merge presentation signatures semantically. UI does not introduce removed skills or gesture bindings.
- Rendering WORK: world labels consume the existing `renderer.project`/`renderer.labels`; no shader/camera/render change. Portrait API remains unchanged.
- Keep `ui/presentation.js` before `legacy/ui.js`, and `ui/interaction.css` after existing skins in the build.
- New CSS intentionally overrides the existing skin; review breakpoint-specific old rules during future changes.
- CI change adds only root UI tests. Existing deployment triggers, permission policy, protected branches and smoke code are unchanged.
- NEW_FILES: package-lock.json; src/ui/presentation.js; src/ui/interaction.css; tests/ui-fixture.cjs; tests/ui.test.cjs; tests/ui-benchmark.cjs; docs/ui-golden-slice/ and its evidence.
- CHANGED_FILES: .github/workflows/deploy.yml; build.mjs; package.json; src/legacy/game.js; src/legacy/ui.js; src/shell.html.
- DELETED_FILES: none.
- No root WORK_INSTRUCTIONS overwrite: that document belongs to the existing deployment/handoff workflow.

## GitHub WRITE result

- Local implementation commit: `1a1a362c6052eb1478707d99008b21af1080bb27`.
- `git push`: failed because the shell has no GitHub credentials (`could not read Username`).
- GitHub connector `create_blob` and `create_branch`: both returned GitHub HTTP 403 `Resource not accessible by integration`.
- Repository metadata's `permissions.push=true` describes account permissions; it did not establish the integration's actual write access.
- No remote work branch, pushed commit, PR or new CI run was created. No merge was attempted.
- Integration continuation is packaged with fixed-base source payload, patch, portable git bundle, manifest and instructions. Do not treat this as a finished Golden UI playtest.
