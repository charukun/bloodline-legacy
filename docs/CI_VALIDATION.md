# CI validation ownership — reference

The common policy is [v7](COMMON_DEVELOPMENT_POLICY.md). This document describes the validation selector and workflows in this tree; current run results and branch protection must be checked on GitHub. Game specifications remain in Project Sources.

## Automatic validation

| Input | Validation |
| --- | --- |
| develop PR: documentation only | Build and deployable artifact checks; no unrelated simulation tests |
| develop PR: CSS under src/ui, src/skills or src/live | UI, lineage, notices, interaction and save/update unit tests |
| develop PR: character implementation/assets | Character, rig, clips, motion, injury, traversal, combat, save and shader compilation unit tests; separate character asset/browser workflow |
| develop PR: network/server contract implementation | Save/update compatibility and infrastructure tests, lifetime simulation, Workers-runtime durability |
| develop PR: direct changes to known test files | Changed tests and validation-selector regression |
| Mixed recognized changes | Deduplicated union of their checks |
| Shared simulation/rendering, build/dependency/CI changes, unknown paths, missing diff | Full suite, lifetime simulation and applicable runtime checks |
| Current develop push, staging/main PR or push, workflow_dispatch | Full suite and existing environment-specific gates |

The plan uses `base SHA -> checked-out PR merge tree`, including conflict-resolution changes. Renames include their removed and added paths. Unknown impact selects full coverage, never an empty set. Tests are discovered from the same directories as the existing full command. `deploy/build-info.test.mjs` is already imported by infrastructure tests and is not executed twice.

The plan, commit, changed paths and selected tests are recorded in `deploy/evidence/ci-plan.json` and the CI summary. New domains or changed shared helpers fall back to full coverage until deliberately mapped.

## Local WORK usage

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run build
node --test tests/<relevant-test>.test.mjs
```

Replace the example with relevant existing tests when local verification is needed under v7. Keep fixtures, built assets, jsdom/native EGL and other prerequisites. Select screen, input, motion and performance verification according to change risk, and reuse equivalent current-SHA CI evidence. Unit tests do not prove browser visuals or device performance.

`npm test` remains full Build + regression. CI uses `tools/ci/validation-plan.mjs` and `tools/ci/run-validation.mjs` after Build, avoiding another implicit Build. Lifetime simulation and Workers durability remain additional gates where selected. A manual workflow run requests full verification and never deploys.

## Duplicate work removed

- Work/feature branch pushes no longer trigger general CI; PR creation and updates do. Use local checks or workflow_dispatch before PR creation. Character branch push/PR double triggering is also removed.
- General CI owns unit/regression/shader tests. Character CI owns asset and actual browser evidence, without a second full `npm test`.
- Infrastructure and tilt-shift tests run once through the selected/full suite, not individually and again globally.
- Character evidence is uploaded once at the end, including functional/performance output and failure evidence.
- npm download caches use lockfiles/runtime; dependency installation still respects the lockfile.
- Native EGL and Playwright system dependencies use the hosted runner's signed Ubuntu sources through a temporary per-command APT configuration. Unrelated third-party package indexes cannot block these checks; signature/hash verification and dependency failures remain enforced.
- At workflow start, outdated develop pushes are recorded as superseded and skip expensive validation/deployment. PRs, current develop and release/manual runs retain their gates. Running deployments are not cancelled.

Workflow event counts are not guaranteed to be one per integration batch. The early revision check reduces wasted work on superseded queued commits; skipped verification is not reported as a test pass. Updates arriving later remain subject to the existing deployment-head guard.

## Gates retained

- Job names `Build and verify` and `Character build, input and visual evidence` remain. Their required status depends on current GitHub protection settings; this document does not establish or waive those settings.
- Unknown/shared/high-risk changes fall back to full regression. Semantic review can require additional intermediate validation.
- Full regression on final develop, lifetime simulation, Workers durability, environment/SHA/artifact checks and rollout protection remain.
- DEV deploys the tested artifact and uses HTTP/manifest/HTML-hash verification. STAGING/PRODUCTION retain browser smoke. HTTP does not verify WebGL/input.
- Environment/Version-embedded deployment Build remains separate; its output is not assumed identical to the local Build.
- Character functional browser assertions remain. Baseline/head visual, video and software-performance evidence runs on relevant develop pushes or explicit `full_review`; it is never proof of Pixel Fold FPS.

Integration follows the final develop SHA's Build/Test/deployment result and necessary browser/device evidence. A green workflow because an old SHA was skipped is not integration completion.

## Character turnaround

PRs check the actual head SHA. General CI continues checking the PR merge tree and
owns regression/rig/motion/combat/save/shader tests. Character CI uses a fail-closed
change plan: runtime/shared/dependency/unknown changes require browser verification;
authored character assets also require GLB validation. Documentation and isolated
non-character unit-test changes defer to general CI. Missing diffs require browser
verification. The plan and exact tested head are uploaded even when not applicable.

`CHARACTER_MODE=gate node tests/character-browser.mjs` needs only `dist/index.html`.
There is no baseline checkout/build/read, video encoder or performance loop. Native
onboarding, keyboard/pointer movement, every existing motion/contact sample, rest,
talk, contact combat, injury, renderer immutability, dispatch boundaries, equipment,
limb loss, save/reload and mobile checks remain. The production renderer still runs
for every existing sample; WebGL rasterizer discard suppresses repeated fragment
shading only. Gameplay, peak attack, equipment and mobile checkpoints restore full
rasterization and invalidate static shadows before rendering. These retain the
normal 1000x900 / 393x852 viewport, DPR, quality, shaders and village geometry.
Failure screenshots are retained. No game source or production setting changes.

Relevant develop pushes and explicit Full Review run the original fully rasterized
functional paths, complete screenshots/video and before/after steady-state software
performance samples. Baseline defaults to the push's previous commit or the selected
commit's parent; a manual `baseline_sha` can choose an earlier integration boundary.
No fixed historical SHA is assumed. Baseline dependencies use its own lockfile.
Use Full Review for art acceptance and raster-only changes; the PR gate is functional
and structural evidence, not a claim of exhaustive visual equivalence or device FPS.
The full report records measured frame data for human comparison; no new arbitrary
performance pass threshold is introduced.

The performance probe synchronizes each fully rasterized frame with a 1-pixel
readback, including warm-up. Completed-frame intervals include software GPU time;
submission queues cannot accumulate across samples or screenshots. Each of the five
scenarios still requires at least 30 seconds and 12 intervals within the existing
90-second sampling timeout. The probe stops the native loop at completion and
restores the renderer before the next scenario. Insufficient samples, context loss
and an incomplete sustained window fail; viewport, quality and workload are unchanged.

Superseded PR/develop Character runs cancel; queued stale develop work is skipped
with an explicit NOT RUN summary. Deployment's existing revision and rollout guards
are unchanged. Integration must use the final develop SHA's completed Full Review,
not a cancelled or skipped prior run.
