# Skill System life slice — implementation and verification record

> **HISTORICAL — 過去WORKの実装・検証記録。** 以下の旧ポリシー、命令形の統合手順、PR/branch状態、SHA、検証条件・結果は当時の記録であり、現行命令や現在headの成功証拠ではありません。担当調査に必要な場合だけ参照してください。[現行の文書案内](../README.md)。

## Sources and scope

- Repository: `charukun/bloodline-legacy`.
- BASE_BRANCH: `develop`.
- BASE_COMMIT: `9ee25afc5f67e142adc313813b4289d157d47935` (fetched and checked again 2026-09-08 UTC).
- WORK_BRANCH: `work/skill-system-life-slice-20260908`.
- During verification, develop advanced to `07352ad8b46ef5d39b18ac0082c854bab7e4309e` (Tilt-Shift). This commit was merged **into the WORK branch**. Both module sets, UI hooks and independent browser suites are retained; develop itself was not changed.
- The next develop update, `4f928f133ea56310d63dbf32af6a3295f2446fcb` (Visual Golden Slice GS02), was also merged into this branch. Its atlas, district, shaders and asset contract remain intact. The existing scene diagnostic now optionally loads the Skill dependencies of its target checkout. Root `npm test` runs all 59 skill/render/environment/infrastructure cases; CI installs the pinned existing root dependencies.
- Specification authority: this WORK's user instruction (life experience / inspiration / combo / bloodline constraints); attached Common Development Policy **v5 Ready PR** (`libfile_4c6a969ad0208191b8cdef61320275dc`); Implementation Prompt v2.0 (`libfile_84e08a1e3d6481918c7eb33574935e32`) applies to technical verification. Its older no-GitHub/handoff-only policy is superseded by the user and v5. No newer game-spec text was found in the available source search.
- Legacy reference: `Bloodline_Legacy_Skill_Slice_Handoff.zip`, Library version 1, `libfile_c5efeb9e9d8c8191a9a7097d5a6ccaaf`; archive CRC verified. Its recovery core/bootstrap/build were not used as implementation authority. The catalog, pure-engine design and regression cases were reviewed and adapted; the narrow integration was implemented against the exact develop core.
- Existing standalone source, UI and renderer architecture remain. No environment, shader, rig, input recognizer or bootstrap replacement.

## Changes and design decisions

43 authored discoveries (39 active, 4 passive), plus the existing weapon basics and compatibility catalog. The previous 40 definitions provide the starting content; three net-inspired techniques make the fifth existing object meaningful. Stable numeric IDs and localized names are authored in `src/skills/catalog-source.json`, checked by the build compiler. Rarity controls encounter weight, never power.

`experience` records accepted observations; `inspiration` records the route/proof behind the selected idea. Maturity is internal, not a visible XP bar, spendable currency, or choice screen. Mainstream, crossing and deviation candidates remain grounded in experienced concepts. A crossing requires witnesses of different kinds: two tags on one repeated action cannot manufacture it. Item provenance is preserved separately from later associations and survives discarding the item. Once learned, a technique does not require carrying its inspiring object.

A saved life seed gives bounded family preferences. A separate saved inspiration RNG never consumes the world/combat RNG. Equipped weapon restrictions, witnessed family/object history, known phases, recent experiences, family repetition and selected ancestry influence discovery. Death records the history; ancestry biases ideas rather than granting the previous skill. The existing one-most-used-skill archive/portrait/generation behavior remains.

The old age grants, fixed activity thresholds and direct inherited-skill unlock were replaced for new lives. Previously learned legacy techniques remain in old saves and retain their base behavior. This is the physical-technique discovery slice, not a rewrite of every legacy spell or a new magic/weapon class system.

The original contact auto combat and phase weights remain. A new skill's ending state is recorded only after real contact, and handed over when its action finishes. Entry conditions check target, phase, time, distance and actual imbalance. Cast-local data varies windup, recovery, stamina, reach, tracking, stagger and pushback; there is no universal power bonus. Misses, blocks, interruption, death, changed target and failed spending do not announce a successful connection. Observed combinations are remembered in skill details.

Presentation: a nonmodal memory → name revelation, bounded synthesized audio, unread mark, original three phase/pie interface and discoverable qualitative details. Unknown catalog contents and exact action numbers are not exposed. No extra attack/guard input.

## Architecture map / conflict review

- `src/skills/engine.js`: pure event/candidate/save logic.
- `src/skills/runtime.js`: explicit Simulation event, strike, lifecycle and save adapters; no prototype patches or extra game loop.
- `src/skills/presentation.js`, `skills.css`: discovery presentation hooks.
- `src/legacy/core.js`: event dispatch, old grant removal, cast/ending hooks, new-skill pushback, save extension and bank history. Preserve these hooks semantically when integrating another core PR.
- `src/legacy/ui.js`: discovery and detail hooks; phase controls preserved.
- `src/audio/ambience.js`: delegates only skill-specific sound before existing sounds.
- `build.mjs`: compile catalog and append modules/CSS; existing assets/bootstrap unchanged.
- `tests/skills/`, `tools/skill-catalog.mjs`: validation and repeatable fixtures.
- CI: add this WORK branch to existing build-only push triggers, run skill tests and generate fixtures, extend the existing disposable-origin smoke test. Deployment still excludes work/feature/PR events.

## Verification before first push

- `node build.mjs`: PASS; 22 modules, ~1.88 MB standalone.
- `node deploy/build.mjs dev` / `node deploy/check-build.mjs dev`: PASS; embedded asset identity and JS syntax checked.
- `npm test`: 29 PASS (23 skill/compatibility cases + 6 deployment infrastructure cases).
- `node tests/skills/lives.mjs`: PASS. Three adult/location fixtures, real activity commands over equal 240-second budgets; controlled 288-seed input simulations; separate saved-state combat comparisons. Not 288 manual browser lives.
- `node tests/skills/performance.mjs`: PASS. Node 24/Linux CPU only. 5,400 timed ticks each; skill p95 ~0.012 ms vs baseline ~0.009 ms in this run. Synthetic 10,000-definition candidate p95 ~7.1 ms; catalog lookup runs only on accepted events, never each frame. These are not device/render FPS claims.
- Exact detailed measurements: `life-results.json`, `performance-results.json`.
- Normal mode/storage schema 3 and the `aerin.tactics.v3.*` keys preserved. Corrupt extension fields are sanitized; malformed extension snapshots are retained separately and surfaced as a recovery notice. Existing learned skills/weights/world are retained.

## Playtest findings and tuning

The first restricted-input test converged to the same three contest techniques after four minutes. This was a real content-pool defect. Rhythmic repetition now also feeds footwork, and tense exchanges feed patient timing, with bounded per-life family affinity. Final 96-seed distinct sets: combat 36; craft 45; mixed 96. Mean discoveries: 4.95 / 4.95 / 5.81. Multi-activity advantage remains modest rather than turning facility cycling into a count reward.

The comparison harness initially reused mutable restored objects between fights, contaminating later comparisons. Fixed by cloning the same save for each matchup and asserting that replaying the same loadout produces the exact same result.

Three lives acquired distinct explained sets. A life is allowed to lack one phase; it is not silently gifted a finisher. Footsteps/play life: changing learned loadout from `羽先払い → 綾返し → 夕凪返し` to `羽先払い → 追い枝 → 夕凪返し` changed crawler win time from 12.0s/health65 to 10.6s/health100. It had fewer successful links, showing that link count alone is not the win condition. Across another common pool, the best elite result used a different middle skill than the best crawler/soldier result; another legal combination lost. No global optimal build is claimed from these fixtures.

## External gates / limitations

First branch CI exposed a shallow-checkout issue: the fixed baseline used by compatibility tests was unavailable. The checkout now fetches history. Skill tests and build then passed on GitHub. After incorporating Tilt-Shift, local skill/render tests passed 45/45; the combined standalone contains 23 modules (~1.89 MB). The deployment tests add six cases. Final CI evidence is linked in the Ready PR.

The next browser run rendered an explained discovery but its 6.8-second nonmodal notification expired while SwiftShader captured the screenshot. The test now holds the already-revealed frame during still capture/menu checks, then reloads into the normal RAF for save/combat checks; the game's reveal duration is unchanged. Skill screenshots use the existing medium quality. With GS02, all 59 local tests and deployment integrity pass, and the standalone is 2,401,652 bytes / 24 modules. The expanded CI budget is 25 minutes; no assertion or deployment gate was removed.

Agent Cloud Browser rejected local HTTP URLs and the shared file URL under its URL policy. No policy-bypassing local browser execution was used. Agent-managed local Browser/Visual verification is therefore unverified. The repository CI's own existing smoke workflow is the independent build/test gate; its extension covers real gift/activity/revelation/loadout/detail, origin save reload, and three learned-life combat fixtures at desktop/mobile viewports. Its result must be recorded from the actual run before Ready PR submission.

Pixel Fold hardware, desktop real GPU frame pacing, thermal behavior, and a human's desire to replay remain unverified. The four experiential goals are supported by observable mechanics/tests, not certified subjective enjoyment. No claim that existing environment/character visual quality reaches Reference A is made.

The existing deployment workflow does not provision a branch Preview URL. Do not merge or deploy into develop merely to create a Preview. Integration WORK owns merging.
