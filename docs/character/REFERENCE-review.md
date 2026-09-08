# Reference character reconstruction

Status: visual comparison in progress. Exact reproduction and unchanged handset frame time are not yet established. This is not Golden Master acceptance.

Implementation base: `develop` at `6e6d4ce1bf11cd8e174b22b2fd0f571e124449e0`.
Work branch: `work/character-reference-master-20260909`.
Comparison baseline: `187bab5b4aae5236e44e9a20f9f0c972d62b3148`, the previous CM01 integrated with that same develop's Skill System and Golden UI.
Reconstruction code/assets: `e4fe53d7b185473f11d100772f8a22e2683e7ebc`.

The upper-left young human male in the user's `1000002803.png` is the design target. Other pictured characters are out of scope. The asset changes head/body proportions, eyes, cheeks, nose, swept hair volumes, material pigments, cloak length, scarf folds, chest straps, skirt panels and boot laces. Animation/IK still uses the prior CM01 runtime. The character-only shadow receiver bias has been adjusted to address visible self-shadow faceting; scene lighting and shadow casters are retained. Mesh and bind joints share the authoring proportion transform; the solved leg chain is retained.

All 40 existing files under `src` and `public/assets` at the develop base remain byte-identical. The build/package integration retains the new Skill System and all its tests. Character tests now load that system and compare native save restoration with and without rendering, including its empty life-notice normalization. No gameplay or save behavior is changed.

| Resource | Previous CM01 | Reference revision |
|---|---:|---:|
| LOD0 vertices / triangles | 13,534 / 24,431 | 13,495 / 24,000 |
| LOD1 vertices / triangles | 6,568 / 11,230 | 6,459 / 10,796 |
| GLB bytes | 2,315,212 | 2,301,780 |
| Bones / weights per vertex | 31 / 4 | 31 / 4 |
| Material / draw per pass | 1 / 1 | 1 / 1 |
| Base / ORM / normal atlas | 512² each | 512² each |

Local validation on the reconstruction tree: build PASS (26 modules); tests 102/102 PASS; asset validation 24/24 PASS; deployment build/integrity PASS. Geometry and transfer limits are enforced against the previous CM01. These limits alone do not prove unchanged frame time.

Browser evidence run: https://github.com/charukun/bloodline-legacy/actions/runs/34278975841
The reference mode captures matched gameplay/close views, native run/turn/stop/walk, contact combat, simulation hit and mobile views, plus 24 warmed, synchronized whole-frame samples per version on the same runner. SwiftShader samples are a bounded comparison, not Pixel Fold or native GPU approval.

The downloadable playtest uses a separate storage prefix and a fresh age-24 male fixture; normal input, movement and combat remain active. Those startup changes are delivery-only, outside production source.

## First comparison and corrective pass

The first reconstruction passed 18/18 browser checks on `e4fe53d7b185473f11d100772f8a22e2683e7ebc`. Evidence: https://github.com/charukun/bloodline-legacy/actions/runs/34278975841/artifacts/10077325000 (ZIP SHA-256 `63dfa1ec3a1f1439aa236de93fd52a39aa132b2867ea38723a42e9cbeb8fb571`).

Visual inspection rejected the thick hair locks, faceted forehead shadows and thin scarf/hand/boot proportions as an exact reference match. The short, concurrently recorded software sample was also worse: median 14.7 -> 18.0 ms, p95 28.3 -> 33.7 ms. This is not a performance PASS. The corrective pass thins and layers fringe locks, authors a folded scarf surface, improves hand/boot volumes, moves the pouch in front of the tunic and adjusts the character receiver bias. It remains inside the original geometry/transfer budgets.

The next check uses no video encoder and alternates old/new contexts in AB/BA order, with six warmups and 24 synchronized whole-frame samples per version. The explicit regression gate allows at most 5% or 0.5 ms in the bounded median; physical handset performance and exact visual reproduction still need acceptance. Results pending.
