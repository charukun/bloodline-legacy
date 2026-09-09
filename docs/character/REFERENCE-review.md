# Reference character reconstruction

Status: visual comparison in progress. Exact reproduction and unchanged handset frame time are not yet established. This is not Golden Master acceptance.

Current implementation base: `develop` at `010f2d9615ac0492d3a118f7057a313667455df1`. Earlier review entries below refer to the former base `6e6d4ce1bf11cd8e174b22b2fd0f571e124449e0`.
Work branch: `work/character-reference-master-current-20260909`. The earlier branch remains preserved.
Comparison baseline: `187bab5b4aae5236e44e9a20f9f0c972d62b3148`, the previous CM01 integrated with that same develop's Skill System and Golden UI.
Latest browser-reviewed code/assets: `17d0c8b870270d32bf6eb0e233542e19e4cbfddf`.

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

Local validation on the reconstruction tree: build PASS (26 modules); tests 102/102 PASS; asset validation 26/26 PASS on that reviewed revision; deployment build/integrity PASS. Geometry and transfer limits are enforced against the previous CM01. These limits alone do not prove unchanged frame time.

Browser evidence run: https://github.com/charukun/bloodline-legacy/actions/runs/34278975841
The reference mode captures matched gameplay/close views, native run/turn/stop/walk, contact combat, simulation hit and mobile views, plus 24 warmed, synchronized whole-frame samples per version on the same runner. SwiftShader samples are a bounded comparison, not Pixel Fold or native GPU approval.

The downloadable playtest uses a separate storage prefix and a fresh age-24 male fixture; normal input, movement and combat remain active. Those startup changes are delivery-only, outside production source.

## First comparison and corrective pass

The first reconstruction passed 18/18 browser checks on `e4fe53d7b185473f11d100772f8a22e2683e7ebc`. Evidence: https://github.com/charukun/bloodline-legacy/actions/runs/34278975841/artifacts/10077325000 (ZIP SHA-256 `63dfa1ec3a1f1439aa236de93fd52a39aa132b2867ea38723a42e9cbeb8fb571`).

Visual inspection rejected the thick hair locks, faceted forehead shadows and thin scarf/hand/boot proportions as an exact reference match. The short, concurrently recorded software sample was also worse: median 14.7 -> 18.0 ms, p95 28.3 -> 33.7 ms. This is not a performance PASS. The corrective pass thins and layers fringe locks, authors a folded scarf surface, improves hand/boot volumes, moves the pouch in front of the tunic and adjusts the character receiver bias. It remains inside the original geometry/transfer budgets.

The next check uses no video encoder and alternates old/new contexts in AB/BA order, with six warmups and 24 synchronized whole-frame samples per version. The explicit regression gate allows at most 5% or 0.5 ms in the bounded median; physical handset performance and exact visual reproduction still need acceptance. The measured median was 13.4 -> 13.0 ms and p95 27.0 -> 19.7 ms; this bounded gate passed. It does not establish unchanged handset performance.


## Latest evidence and remaining gaps

Run https://github.com/charukun/bloodline-legacy/actions/runs/34284026628 passed all six targeted browser checks on `17d0c8b870270d32bf6eb0e233542e19e4cbfddf`. The full 18-state first-pass evidence remains historical; the six-check pass does not rerun all those states. The matching machine-readable report is `reference-verification.json`.

Evidence artifact: https://github.com/charukun/bloodline-legacy/actions/runs/34284026628/artifacts/10078846641 (ZIP SHA-256 `06e6df253c7fb1d2f6b779515d014865563a3ba35c59334eee7777c473fa8069`). It contains the unchanged-environment gameplay, close, quarter, run and mobile screenshots and paired timing report.

Visual review still rejects exact reproduction: hair locks remain too coarse and angular, forehead faceting remains visible, and scarf/clothing structure is simpler than the reference. The quarter view is partly occluded by scene geometry and cannot certify unobstructed all-angle appearance. Facial strokes now preserve their swept cross-section; earlier centreline projection flattened that relief. Neither version had exactly zero-area facial triangles in the separate diagnostic.

A subsequent packaging check found the standalone ORM PNG in the committed tree was truncated, while the GLB-embedded ORM used by the game was intact. The companion PNG has been restored byte-for-byte from the intact authored/embedded copy, and validation now decodes all three companion atlases and compares them to the embedded bytes. This packaging correction does not alter the browser-reviewed GLB or runtime. Local asset validation after this correction: 27/27 PASS.

Golden Master / exact-reference acceptance: NOT MET. Pixel Fold and native GPU performance: UNVERIFIED. This branch has not been promoted to a new Ready PR or merged.


## Surface reconstruction pass (browser review pending)

The outer hair now uses authored cubic curves, split locks and surface-derivative normals; its interior volume is retained. Cloak and scarf surfaces are reconstructed, with shoulder wrap, asymmetric hem, broader leather straps, gathered trousers, thicker boots, relaxed fingers and the pouch on the reference side. LOD1 omits the smallest split strands. `tools/character_sculpture.py` contains the surface authoring, and `tools/render_character_review.py` produces a fast, unposed CPU mesh review without launching a browser. The two sculpture PNGs are neutral-light authoring evidence only, not gameplay captures or GPU performance evidence.

| Resource | Previous CM01 | Surface reconstruction |
|---|---:|---:|
| LOD0 vertices / triangles | 13,534 / 24,431 | 13,493 / 23,622 |
| LOD1 vertices / triangles | 6,568 / 11,230 | 6,182 / 10,208 |
| GLB bytes | 2,315,212 | 2,275,364 |

Normals and split-strand details are authored offline; bone count, material count, texture resolution and draws per pass are unchanged. Character PCF shadow samples now compare each tap to the receiver-plane depth at its offset; the number of texture samples is unchanged. Scene shading and simulation are unchanged. The game-side effect of the shadow correction still requires inspection.

PNG generation now encodes and decodes the complete image in memory before replacing the file. All three atlases and the GLB were regenerated byte-identically; asset checks passed 27/27. All 40 existing source/asset files at the develop base remain byte-identical. The new gameplay/side/back captures use a different open paving position for both versions to avoid the earlier pillar occlusion. Visual acceptance and performance on the new pass remain pending.


## Ambient contact bake and final motion coverage (pending CI)

The next surface pass softens the hair curvature and introduces asymmetric cloth folds without adding vertices. `tools/character_ao.cpp` casts 24 short-range hemisphere rays per vertex into a BVH of visible unarmoured geometry; the existing vertex-colour alpha stores the result. Only ambient illumination consumes it. The game adds no ray tracing, draw calls, texture samples or geometry for this bake. Source regeneration requires a C++17 compiler (`g++`); runtime/deployment do not. The current GLB is 2,275,368 bytes.

Gameplay fixture and existing simulation/input remain unchanged. Separate close/quarter/side/back mesh inspection now uses x=100 outside the village to avoid foreground occlusion; it must not be presented as gameplay/environment evidence. Native village walk/run/stop, contact attack, combat idle, simulation hit and sword attachment are checked in the same recording-free workflow. Their current results are pending.

The preceding surface reconstruction at `a37c1da2d6a0db09fff95339aec8721d9fdac2de` passed all six browser checks. Run: https://github.com/charukun/bloodline-legacy/actions/runs/34290299597 . Artifact: https://github.com/charukun/bloodline-legacy/actions/runs/34290299597/artifacts/10081153454 (SHA-256 `c25d66479ebb3ce6a65347340e4ae3baa2b21dbe038356edb89d759fdad08e5d`). Recording-free alternating median: 13.8 -> 13.4 ms; p95: 23.4 -> 21.7 ms. This is bounded SwiftShader evidence, not native GPU or handset approval. Its quarter gameplay view was obstructed by a tree, so it does not validate unobstructed side appearance.


## Latest-develop integration

A new dedicated branch starts at develop `010f2d9615ac0492d3a118f7057a313667455df1`. Only the presentation delta from the previous CM01 was applied through a three-way patch. Build scripts, package configuration, UI, environment, Skill Motion, Damage Motion, ground sampling and render interpolation are retained from that develop. At integration revision f5016ffe, the CM01 runtime below the fragment shader was byte-identical to the new base. The later proportion pass below changes visual foot spacing and floor footprint only. `reference-current-source-audit.json` records the preserved files. The next browser baseline is this same latest-develop commit, not an older game build. Earlier browser/CPU records remain historical and do not certify this integration.


Latest-develop run `34292088180` at `f5016ffe6178c73562be7bab7708fa94842dad34` passed 171 tests, 27 asset checks and 13 browser checks, including native run/stop/walk, contact attack, combat idle, simulation hit and sword attachment. The fixed base was `010f2d9615ac0492d3a118f7057a313667455df1`. Alternating recording-free SwiftShader median: 6.3 -> 6.1 ms; p95: 11.9 -> 11.9 ms. These values must not be compared directly to earlier runs on a different renderer/base. Full report and artifact identity are in `reference-verification.json`.

Inspection rejected some motion captures as visual evidence because the moving actor left the close camera frame and roofs/foliage obscured other poses. The next pass records a centred, elevated pose-inspection camera for those shots, without changing the simulation state or village. Separate gameplay captures keep the native camera. Head authoring also redistributes the same number of vertices toward the nose/eye area, with analytic surface normals; no new geometry or runtime work is required. These changes are pending browser review. Exact reference acceptance remains unmet.


## Proportion and face correction (pending browser review)

The waist, trousers and boots now have the broader reference silhouette. Eye height, visible fringe ends and scarf volume were corrected without increasing vertex or triangle counts. The head uses redistributed samples and analytic normals to remove the faceted nasal bridge. The atlas iris highlight remains authored pigment, with no extra material/pass.

Foot support is widened to match the new soles. Idle and movement use the same 0.28 half span; the current shared SkillMotion sampler receives a copied, laterally offset presentation root. Two lateral floor samples cover the wider sole edges. No player property, movement speed, collider, attack timing or shared Skill/Damage Motion implementation changes. A numerical test skins the actual sole vertices and checks separation and floor contact.

Current resources: 13,493 vertices / 23,622 triangles at LOD0, 6,182 / 10,208 at LOD1, 31 bones, one material and one draw per pass; 2,275,944-byte GLB. Source regeneration is byte-identical. Browser motion, contact and paired performance review for this correction are pending.


## Crown and cloak correction (pending CI)

Run 34294259623 on d8a824fd2432b29d98708fb125636792e0595dde passed 172 unit/regression tests, 27 asset checks and 13 browser checks. The paired median was 13.2 -> 12.2 ms, p95 23.6 -> 21.6 ms; host timings are variable and only within-run comparisons are meaningful. Captures revealed a crown opening and cloak intersections, so that visual pass was rejected.

The interior hair mass now has a closed cap and the crown locks converge over it. Both LODs have an overhead skin-exposure ray check, with a 1e-7 barycentric boundary tolerance to avoid rejecting shared triangle edges. The cloak wraps from the neck over the shoulders. Its lining uses the same tessellation and an inward radial offset with reversed winding, removing crossing surfaces. Current resource usage remains below original CM01 budgets: 13,524 / 23,706 at LOD0; 6,190 / 10,233 at LOD1; 2,279,720 bytes. Asset validation: 29/29 PASS, regeneration byte-identical.

`node tools/build_character_playtest.mjs <verified-commit> <absolute-output.html>` packages the separate age-24 download fixture. The next CI also opens this exact HTML with a fresh browser storage context and drives live keyboard movement. This does not certify native file-origin behavior or Pixel Fold performance.
