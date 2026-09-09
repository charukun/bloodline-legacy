# Current follow-up

[Eight additional constructions](WILDBORN_EXPANSION.md) bring the current catalog
to **39 hostile forms + 2 neutral creatures**. The report below records the earlier
31-form milestone.

# Enemy bestiary expansion — 2026-09-09

> **REFERENCE — この領域の技術・実装資料。** ゲームの確定仕様の正本を置き換える文書ではありません。本文の旧ポリシー、WORK固有の指示、PR依存・SHA・検証結果はhistoricalな来歴で、現在の共通運用やGitHub状態には適用しません。[現行の文書案内](../README.md)。

Base: `develop` at `e3502f519dbaea1d399d3a69b274f72f57494059`.
Branch: `work/enemy-bestiary-expansion`. Carries the unmerged enemy work from
PR #45, including its standalone first-frame fix, onto this develop baseline.
Build conflicts were resolved by retaining develop's music, talk fan and skill
effects and adding the enemy modules/assets. No integration branch was merged.

Sources: attached Common Development Policy v5 (native Ready PR flow),
Implementation Prompt v2.0 (visual/performance/compatibility sections), Visual
References and the user's requests to expand beyond 19 forms and avoid palette
swaps. Current user instructions and policy v5 supersede v2's older GitHub ban.

## Scope and identity

**31 hostile appearances across 7 existing combat families**, plus 2 neutral
creatures. Previously there were 7 hostile appearances. These are 24 additions,
not 31 new AI implementations. All 31 can occur in ordinary front spawns;
village waves select forms within their existing family pool. Spawn counts,
family probabilities, tiers, abilities, statuses, reach, cooldowns, damage,
collision radii and boss seal rules are unchanged.

`ENEMY_FORMS` lives in the shared simulation core. An actor gets its immutable
`enemyForm` ID and display name when created. Selection hashes its family and
actor ID without advancing gameplay RNG. Snapshot/save serialization carries
the field. Old actors without it render the original family form; restore does
not assign a random new identity. Unknown IDs fall back within their family.

## Concepts, construction and movement

The ten bone soldiers/executioners use the previously audited CC0 KayKit body
and clips. All other bodies are original articulated geometry. Four new ring
meshes and existing shared meshes keep geometry reusable. Shape reuse supports
the following concepts; no entry consists only of a palette change.

| Family | Form | Construction and motion distinction |
|---|---|---|
| 小鬼 | 森潜みの小鬼 | Broad ears, tuft, wooden thorn club, open stance |
| 小鬼 | 沼鉤の小鬼 | Lean proportions, reed horns, hooked blade, waist flask, twisting stroke |
| 小鬼 | 鉄屑の鉱夫 | Squat body, mining lamp, pickaxe, ore pack, short stride |
| 小鬼 | 骨面の呪兵 | Skull mask, horned ritual club and taller stance; existing melee, no new spell |
| 小鬼 | 菌冠の小鬼 | Uneven fungal caps, mushroom club, heavier body and gait |
| 骨兵 | 盾持ちの異形 | Open sallet, sword and split tower shield |
| 骨兵 | 墓守の鉄衛 | Broad low body, crested helm, cross shield and flanged mace |
| 骨兵 | 燻火の剣兵 | Tall narrow body, short horns, notched blade and round shield |
| 骨兵 | 霜棘の衛兵 | Crystal crest, shoulder shards, ice mace and pointed shield |
| 骨兵 | 破戒の鎖兵 | Barred faceguard, broken chain links, short authored flail curve |
| 執行者 | 冠角の執行者 | Broad branching crown, axe and buckler |
| 執行者 | 茨角の断頭者 | Taller branching thorns, asymmetric axe, long mantle and wider torso sweep |
| 執行者 | 弔鐘の処刑者 | Low broad body, bell helm and heavy capped hammer |
| 執行者 | 墓石の巨兵 | Slab head/shoulders, block hammer, cracked stone shield and short stride |
| 執行者 | 黒紗の決闘者 | Tall lean body, narrow mask, one horn, split veil, narrow blade and wrist guard |
| 蟲 | 鎌脚の蟲 | Six alternating articulated legs, split shell and biting mandibles |
| 蟲 | 琥珀甲の蟲 | Domed shell, thick paired covers and central horn, shorter gait |
| 蟲 | 針鎌の蟲 | Narrow body, raised front scythes, long rear legs and longer stride |
| 蟲 | 洞穴の大蜘蛛 | Eight legs, swollen rear abdomen, extra eyes and dorsal marks |
| 蟲 | 骨尾の蠍 | Five tail segments, forward sting and paired front pincers |
| 獣 | 殻喰い | Overlapping back armor and long tusks |
| 獣 | 石牙の猪 | Broad trunk and nose, upright back bristles and short tusks |
| 獣 | 苔鬣の狼 | Narrow trunk, long muzzle/tail, pointed ears, jaw teeth and longer gait |
| 獣 | 洞窟の鉄熊 | Large shoulder mass, thick neck, round ears and short tail |
| 獣 | 沼鱗の蜥蜴 | Low flat head/body, frill, dorsal scales and long jointed tail |
| 亡霊 | 裂け目の亡霊 | Hood, separate sleeve/hand joints and flowing lower strips |
| 亡霊 | 灯籠の亡霊 | Taller shroud, open cage lantern with warm core and swinging grip |
| 精霊 | 荊籠の精霊 | Open branch ribs, seed core, branching crown and thin wooden arms |
| 浮遊魔物 | 裂界の水母 | Pulsing bell, six segmented tendrils and contraction during movement |
| 浮遊魔物 | 宵羽の魔蝙蝠 | Articulated wing spars/membranes, ears, fangs and flapping cycle |
| 魔王 | 魔王 | Enlarged horned ruler, shoulder armor, mantle and existing four visible seals |
| 中立 | 苔角の獣 | Branching antlers, articulated quadruped gait and muzzle |
| 中立 | 眠る菌傘 | Layered cap, moving stalk/feet and wound-aware cap sections |

Skeletal swing offsets use the sampled source clip time, so windup and recovery
meet at exactly the same pose. Creature attacks likewise map the existing
telegraph deadline to the strike pose. Distance drives land locomotion; bat
wings, jelly pulse and idle breathing use the existing presentation clock.
Hitstop freezes that clock. Hand/limb loss hides corresponding equipment or
articulated segments. VFX contact placement reads the actual creature sockets.
Quadruped death rolls sideways; humanoid/ghost death falls forward.

## Motion sample

`npm run build && node tools/enemies/build-review.mjs` creates
`dist/Bloodline_Legacy_Enemy_Review.html`. Everything needed for rendering is
embedded; the review omits the unrelated embedded music bytes.

- Select any of the 33 forms, or use previous/next.
- Default 13-second sequence: idle, move, telegraph/strike/recovery, guard, hit,
  death. Selecting a form or motion automatically resumes playback.
- Explicit pause/resume, restart, scrub and quarter speed. Scrubbing indicates
  that playback is paused. A priming frame supplies locomotion history on seek.
- Before/after, camera angle, 1/2/8/24 actors and quality are in a collapsible
  settings section. Before shows the previous family model.
- Uses the real shipped modules and renderer with synthetic snapshots. It does
  not create Game or save progress. Initial/frame/context-loss errors remain
  visible, including landscape where the header is hidden.

## Validation and limits

The test suite checks geometry beyond color, finite transforms for every form,
exact attack-boundary continuity, body sockets, lost parts, distance/hitstop
clocks, bounded caches, ordinary spawn coverage and old/new save round trips.
An independent comparison against the pinned develop core checks all gameplay
fields and RNG, omitting only enemy display-name/form metadata.

`tests/enemy-review.test.mjs` executes the generated standalone HTML, embedded
assets and real renderer in Node with native image decoding and recorded GL
calls. It exercises all forms and sequence states plus errors and controls.
This catches JavaScript/asset/entry-point regressions; it cannot validate a GPU
driver or pixels. Native EGL images separately use the actual meshes, body
palettes, equipment, shaders, camera and draw batches. Neither is browser QA.

The user confirmed the previous fixed review displays on their phone. That is
evidence for that previous artifact only. The supported browser's prior explicit
security rejection still prevents this WORK from performing browser validation;
no alternate browser/CDP/Playwright route is used. New live combat browser checks,
Desktop 60 fps, Pixel Fold 30 fps and sustained thermal behavior remain external
verification gates before merge/release. No full commercial-quality claim.

No additional external assets were acquired. CC0 source/license evidence and
SHA hashes remain in `public/assets/enemies`; provenance now lists all ten uses
of that skin and the original creature work. Asset validation verifies the same
743,788-byte body, 23 bones, 8 clips, 1 primitive and no image textures.

No body LOD or new gameplay abilities are added. Shared geometry and small-ring
LOD limit cost; material/texture counts do not grow with the catalogue. Geometry
and CPU-only measurements are in `evidence/bestiary-budget.json`; device FPS
must be measured with the review's export and actual game, not inferred from
these Node/EGL diagnostics.

## Recorded results

- Full build / test: **377 passed, 0 failed, 0 skipped**.
- Deployment build and embedded-asset integrity: PASS.
- Asset/license validation: PASS; GLB bytes unchanged from the audited asset.
- All 33 forms rendered in native EGL at idle, contact, death and limb loss
  (28 family images). Inspected geometry and a grayscale construction sheet.
  Corrected concealed goblin weapons, weak beast proportions, closed lantern
  walls, death grounding and gallery framing from those reviews.
- Added model/detail triangle counts: 1,748–9,452 per full-detail actor including
  skeleton body and equipment. The range is geometry construction, before
  frustum/size culling; shadows can submit another copy. Wraith/critter detail
  costs more than the old primitive version; goblins/elites mostly cost less.
- No new image textures or GLB bytes. Four creature meshes are shared. Small
  chain rings use the existing lower-detail torus.
- Node CPU construction/pose, rerun without concurrent EGL work: at 2 / 8 / 24
  mixed actors, p50 was 0.18 / 1.47 / 4.82 ms; p95 was 0.29 / 2.54 / 12.71 ms.
  At 24, p99 was 35.19 ms. This excludes world drawing, combat and GPU and is
  **not an FPS result**; target-device frame pacing remains unverified.

Evidence: [idle](evidence/bestiary-idle.jpg),
[grayscale](evidence/bestiary-silhouettes.jpg),
[contact](evidence/bestiary-attack.jpg),
[death](evidence/bestiary-death.jpg),
[limb loss](evidence/bestiary-lost.jpg).

Main new module: `src/enemies/bestiary.js`. Main modified interfaces:
`Simulation.actor` and catalogue helpers in `src/legacy/core.js`, sentinel
settings/pose, creature contact sockets, status-marker height and build order.
Existing game UI/input/AI/saves are retained. Review tools and tests are isolated
under `tools/enemies` and `tests/enemies*`; the full changed-file list is the PR
diff against the pinned develop base. No files are deleted.

## 2026-09-09: delivered HTML shader failure

The Pixel Fold screenshot reported GLSL line 75: adding a `highp float` to a
`const int`. The delivered HTML (SHA-256
`a16b7d262ae4a6704dfee1055480fec7d765d2bd2e4dfb25d3b3419c558f4499`)
contained `seed+89` in the shared material fragment shader. Its main, rig and
sentinel material programs failed compilation. This is invalid GLSL ES, not
an unsupported-device diagnosis.

Latest develop was rechecked at `72b889e917ac41dac30cfd69b7858b8c967f9dd6`.
It already contains the exact fix from `20e224dddd0f925c1cbae25bdb483492b389b5ba`:
`seed+89.`. This one-character correction is now carried into the existing,
unmerged #52 branch and its standalone sample. The corrected shader file is
byte-identical to that latest develop file; no gameplay or asset changes.

The earlier native diagnostic converted GLSL ES 300 to desktop GLSL 330,
which permitted the conversion. Mocked GL tests do not compile shaders either.
Those checks missed this defect. The additional gate deliberately retains
`#version 300 es` and compiles/links through native GLES3, without translation
or a browser. It checks the actual embedded HTML shader strings for world,
world shadow, display resolve, rig, rig shadow, sentinel, sentinel shadow,
diorama CoC and diorama blur. Linux CI fails if GLES is unavailable; non-Linux
local runners explicitly skip this native check.

Validation for this correction:

- Original delivered HTML: reproduced the same line 75 failure in GLES3.
- Corrected delivered HTML: all **9 programs compile and link**.
- Negative control: a float-plus-int fragment shader is rejected.
- `node --test tests/enemy-review.test.mjs tests/enemy-shaders.test.mjs`:
  **4 passed, 0 failed, 0 skipped** (including full catalogue/motion controls).
- DEV build, embedded asset integrity and asset/license validation: PASS.
- Full local `npm test` returned without a complete reporter summary in this
  run; no new full-suite count is claimed. The focused results above are
  complete, and the updated PR runs the existing full CI suite.
- [Native GLES compile/link report](evidence/shader-gles-fix.json).
- Browser startup and Pixel Fold rendering/FPS remain unverified here. GLES
  compilation is an additional gate, not browser or device verification.

Reproduce after `npm run build` and `node tools/enemies/build-review.mjs`:
`node tools/enemies/check-shaders.mjs dist/Bloodline_Legacy_Enemy_Review.html`.
The compiler uses Python 3 standard library plus Mesa `libEGL.so.1` on Linux.
No runtime or packaged game dependency is added.

## Staged wounds and persistent breaks

The continued work, latest develop integration, review controls and evidence
are recorded in [DAMAGE_STAGES.md](DAMAGE_STAGES.md). Historical measurements
above remain tied to their original revisions.
