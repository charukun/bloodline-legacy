# Skill action spacing and connected transitions

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

Start develop: `c53f9b2c918ff71525b76ea4b20c8b530429a26e`.
Rebased and verified against develop: `4cb02927826b9a877d4f61e4877732840df8cd6a`.
Work branch: `work/skill-motion-tempo-20260910`.
Sources: Project Sources Common Development Policy v5, Implementation Prompt v2 (2026-09-08), and the user's instruction to retain the overall 序破急 tempo while making individual actions sharper and reflecting existing connection values. The user's explicit branch/Ready PR instruction and policy v5 take precedence over the older prompt's no-GitHub-write paragraph. Reference combat image was inspected; it supplies silhouette/contact intent, not numeric timing. The available gameplay reference was inspected, without treating its recording FPS as a game benchmark.

## Problem and change

The baked sword path stretched release→contact over 43% of every swing and contact→follow-through over the entire remaining 57%. Procedural actions used almost the same timing per shape. Character entry blends also lost the actual displayed skeleton when changing between baked and procedural skills; reusing the same clip did not reliably refresh its entry pose. `SkillMotion.clock` read the base skill rather than the accepted `skillCast`.

- Allocate the cutting and follow-through intervals from the existing swing/power/recovery values, inside the unchanged action clock. Keep a monotone curve through the contact key at `.43`, and finish the fast motion before the action's remaining settling period.
- Read only the matching accepted `skillCast`. Actual linked casts carry more of the outgoing pose into charge; charge/recovery bonuses affect the load and settling curves. No new link is inferred from catalog compatibility, combo number, or a missed hit. Cost-only bonuses remain cost-only.
- Share entry history across clip/procedural routes in both the four traveler rigs and CM01. Capture the previous skeleton, root orientation, and visual root offset on every charge, including repeated clips. Clear it on interruption.
- Keep the terminal pose during the existing combo grace interval. Continue the baked recovery from the already-settled clip position, and freeze pelvis settling during hitstop.
- Share one active EGL context in the offline comparison exporter so the two captures retain separate GPU objects and cannot alias the before/after model data.
- Existing locomotion, equipment sockets, real weapon-tip trail registration, terrain foot constraints and damage routes remain in use. No new assets, bones, shaders, draw passes, simulation fields, skill definitions, input, damage, hit schedules or save formats.

For basic 斬る, the baked cutting interval changes from 0.3354 s to 0.1436 s and follow-through from 0.4446 s to 0.1705 s. **The full action is still 0.78 s and contact is still at 0.3354 s.** The rest is anticipation/settling, not additional attacks. 叩き斬る retains a longer 0.1852 s cut and 0.2200 s follow-through. See `timing.json`.

## Verification

- Starting baseline: Build and 458 tests pass.
- Implementation: Build and 463 tests pass, including native GLSL ES compilation.
- After rebasing onto the updated develop: Build and all 489 tests pass (0 failures/skips).
- Final focused 5 tests pass after simplifying entry bookkeeping and strengthening the real-link fixture.
- Four races × 30/60/120 Hz: contact key and hitstop; actual displayed joints at clip→procedural, procedural→clip, and repeated-clip entries; charge/release continuity; grace and interruption cleanup.
- Real Simulation sequences: accepted charge/recovery bonuses, incompatible pair, full rendering versus no rendering. Events, damage/cost-bearing state, RNG and exported saves match.
- Actual recorded `羽先払い → 絡め返し → 獣道断ち` connects twice in both before/after captures. Event lists and final exported saves match exactly.
- Existing four-race 120 Hz contact suite passes: minimum forearm clearance proxy ≥1.431, maximum foot error <0.000001, planted-foot slip <0.000001, maximum wrist-axis step <0.545 radians. This is a volume proxy check, not exhaustive triangle collision certification.
- `cpu.json`: same Node VM / stub GL sampling workload, 1,020 samples per version. Median 0.456→0.471 ms (~+0.015 ms); p95 2.342→3.138 ms. These shared-host measurements include scheduling variance; they do not measure GPU work or establish Pixel Fold FPS. Geometry and draw counts are unchanged by this patch.
- Build delta on the starting baseline: +3,127 bytes (+0.016%).
- Local Browser navigation was attempted with the supported control-browser runtime; `http://127.0.0.1:8020/index.html` returned `net::ERR_BLOCKED_BY_CLIENT`. Local native-game visual review is not claimed. The existing PR Character visual verification workflow remains enabled for remote functional checks.

## Reproduce

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
node --test tests/skill-tempo.test.mjs
node tools/capture-skill-tempo.mjs /tmp/before.json c53f9b2c918ff71525b76ea4b20c8b530429a26e 0 mixed
node tools/capture-skill-tempo.mjs /tmp/after.json '' 0 mixed
python3 tools/render-character-motion.py /tmp/after.json - /tmp/compare.mp4 --before /tmp/before.json --before-glb - --video
node tools/benchmark-traveler-clips.mjs c53f9b2c918ff71525b76ea4b20c8b530429a26e /tmp/cpu.json
```

Capture choices: `sword` (待ち針→息継ぎ打ち→静の掌), `mixed`, `hammer` (炉打ち→鉄返し→炉底割り), `incompatible` (糸通し→鉄返し→炉底割り). Race 0/1/2/3. The comparison renders real Simulation snapshots and shipped character/equipment palettes offline with simplified lighting and FX disabled; it is not a gameplay recording. New choreography for every skill, all-FX origin adjustment, exhaustive visual approval and physical-device performance remain outside what these checks establish.

Changed areas: `SkillMotion.clock/phrasing/curve/chargeTransition/sample`, `CM01.selectClip/Character.update`, `Travelers.Character.update`; regression fixtures and offline capture tooling. No integration/merge into develop is performed by this WORK.
