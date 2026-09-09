# Eight additional enemy constructions

Started from develop `56588fe73bb9716cf619afeae1ce128023a0a7f5` on
`work/enemy-wildborn-expansion`. The approved weakness work from PR #58 was
retained, then its merged develop `ac9eb52d3853aa70c126209e158ef4a8d8cabf3a`
was incorporated without further source changes. No develop merge by this WORK.
Sources: attached common policy v5, implementation prompt visual/performance
sections, supplied diorama references and the user's explicit request for more
species with minimal palette-only reuse.

## Scope

**8 additions: 39 hostile forms + 2 neutral creatures = 41 total.** These are
independent constructions and motions within the existing combat families,
not eight newly invented AI systems. No family probability, spawn quota,
damage, reach, cooldown or drop-rate changes in this follow-up. The weakness
rules already approved in PR #58 remain intact.

| New form / ID | Existing combat family | Construction and motion | Healthy triangles |
|---|---|---|---:|
| 根抱きの古木 / root-treant | goblin | Split bark trunk, hollow mouth, uneven crown, long branch arms and root steps | 3,596 |
| 灰嘴の走鳥 / ash-raptor | goblin | Narrow neck, hooked beak, reverse-jointed legs, folded wings and feather tail; bobbing peck | 3,856 |
| 泥袋の大蛙 / mire-toad | maw | Broad low body, raised eyes, throat sac and folded rear legs; squat spring and jaw snap | 2,624 |
| 食らう聖櫃 / reliquary-mimic | maw | Wooden box, metal bands, rear-hinged toothed lid and four articulated supports; opens then bites | 4,660 |
| 崩壁の大蟹 / rubble-crab | crawler | Broad rubble shell, stalked eyes, unequal pincers, six side legs; raised claw closure | 2,548 |
| 鎖殻の百足 / iron-centipede | crawler | Five linked shells, ten staggered legs, antennae and mandibles; traveling body/leg phase | 2,908 |
| 石環の偶像 / cairn-idol | wraith | Six separated ring stones, small luminous core, suspended head/fists/feet; floating stone strike | 3,248 |
| 弔花の魔草 / mourning-bloom | wraith | Thick six-petal cup, throat, stalk and separate vine appendages; petals close at contact | 4,564 |

[Native lineup](evidence/fauna-lineup.jpg) ·
[Anticipation/contact](evidence/fauna-contact.jpg).
Geometry reuse is below the body-construction level. No new form is solely a
palette change or an equipment swap on an existing complete body.

## Integration

- `EnemyCreatures.register` extends the existing renderer/record/resource
  lifecycle. `src/enemies/fauna.js` owns the eight profiles and constructions.
- All six body regions have presentation sockets and damage anchors. Missing
  limbs remove their appendages and leave break surfaces. The crab's three
  walking legs per side form one leg region; the centipede's first two pairs
  map to arm regions and the remaining three pairs to leg regions. These are
  the existing six-region damage rules, not individual-leg simulation.
- HP-driven wear and fatigue remain independent of actual part loss. Bark,
  chest wood, stone and plant stems receive suitable cut/break colors. The
  raptor has a lower crawl pose that keeps its head above ground; the other
  forms use the shared low posture/drag/float system as appropriate.
- Gait uses distance, secondary motion uses the frozen pose clock, and contact
  matches the existing telegraph deadline exactly. No motion-driven extra hit
  or collider is introduced. The mimic remains an ordinary visible enemy;
  this is not a new loot interaction or ambush system.
- New actors choose forms through the existing ID hash without consuming RNG.
  Saved form IDs stay stable. Legacy/unknown IDs fall back to the original
  family appearance. All 39 hostile forms are reachable by ordinary spawns.
- New immutable simulation archive:
  `85dfa7bfd2a243202431489dc534d3318b17eefe8a121845889829374363ae59`.
  Previous archives are unchanged; live worlds retain their pinned rules
  until the compatibility flow migrates them. No save schema addition.

## Review sample

`npm run build && node tools/enemies/build-review.mjs` builds the self-contained
HTML. New forms appear first under **今回追加した敵**; the initial form is the
treant and the arrows traverse all eight before the previous catalog.
Select **一通り再生**, **移動**, or **予兆 → 攻撃**; use the HP and independent
part-break controls for weakness. The mixed collection includes all 41 forms
(the old five-row limit has been removed).

The legacy-family comparison control is retained; it is not an exact replay
of a historical develop build. The sample uses the real current render modules
and does not create a game/save or require a CDN.

## Authorship and licenses

All eight entries in the table are original project-authored procedural source
in `src/enemies/fauna.js`, created for Bloodline Legacy in this work. Distribution
and source are this repository. No externally acquired models, textures or
animations are used for these eight forms; acquisition date and external asset
license/attribution therefore do not apply. Their geometry can be modified
directly in source and is covered by the project's code terms, with no added
third-party asset conditions. References guide art direction and are not
embedded assets.

The existing KayKit Skeleton Warrior is unchanged, CC0-1.0, with its previously
stored individual provenance and license. [Asset/license gate](evidence/fauna-assets.json)
passed. No new downloaded asset or changed external-license obligation.

## Verification and performance

Build PASS. [Focused suite](evidence/fauna-tests.txt): **73 PASS / 0 FAIL /
0 SKIP**, including all form silhouettes, ordinary spawn reachability, save/RNG
compatibility, terrain support, attack boundary, frozen motion, all sixteen
appendage-loss combinations for the additions, immutable archive/live update,
and the delivered HTML's Node/JSDOM first-frame/control submission checks.
[Native GLSL ES gate](evidence/fauna-gles.json): **9 programs compile/link PASS**.
No new shader code. The previously reported float/int failure remains covered.

New constructions reuse existing meshes: **0 new geometry resources, textures,
bones, downloads or render passes**. All new healthy bodies stay below 5,000
triangles and use 4–9 shared mesh types (instances are batched across actors).
The mimic's trim was simplified from 5,908 to 4,660 triangles after inspection.

[Paired CPU/geometry data](evidence/fauna-budget.json): same runtime and 24
actors, alternating previous-family and new-form scenes, 60 warm-up plus 120
measured frames. Healthy p50/p95: **4.23/8.36 → 5.23/10.44 ms**. At 20% HP with
one leg group lost: **7.98/13.46 → 8.33/15.54 ms**. This measures Node pose and
batch construction only, excluding GPU, background, combat, browser and draw
submission; it does not establish device FPS or a full-game improvement.

Native EGL images were visually reviewed for all eight healthy forms,
forest-form weakness/both-leg loss, and ruins-form anticipation/contact. This
is not browser verification. The supported browser's earlier explicit
security rejection remains respected; no alternate browser route was used.
Device startup, movement readability at gameplay distance, full-game rendering
and Desktop 60fps / Pixel Fold 30fps remain Integration/release checks.

Source and evidence hashes: [validation record](evidence/fauna-validation.json).
