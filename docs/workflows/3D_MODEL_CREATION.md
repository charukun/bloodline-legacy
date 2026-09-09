# 3D Model Creation Workflow

> **REFERENCE — 3Dモデル制作担当向け。** 共通運用やゲーム仕様の正本ではない。現在の依頼、Project Sources、最新develop、担当領域のreferenceを前提に、この制作工程だけを補助線として使う。

## 適用範囲

キャラクター、敵、装備、クリーチャー等で、形状・Topology・Material・Rig適合・描画負荷が品質へ強く影響する新規3Dモデルまたは大幅改修に適用する。小さな既存Mesh調整や数値変更だけなら、このWorkflow全体を適用しない。

## 標準工程

### 1. コンセプト・プロット作成

最初に、モデルの役割と見た目の核を短いConcept Sheetへ落とす。

最低限決めるもの:

- ゲーム内での役割と、プレイ距離から最初に読ませたい特徴
- Silhouette、体格、重心、主要な形状言語
- サイズ感と既存キャラクター／敵／装備との相対Scale
- 必須の装備、可動部、壊れる部位、見せ場
- 世界観・既存Visual Directionとの接続

**Gate 1 — Concept:** 一文の説明とSilhouetteだけで他の主要Assetと区別でき、次のReference制作で迷う主要事項が残っていない。

### 2. 必要なVisual Reference生成

Modeling前に、制作に必要なReferenceを揃える。人型や複雑な立体物では原則として前・横・後の三面図を用意し、必要に応じて斜め、顔、手、装備、破損状態、Material close-upを追加する。

Referenceには必要に応じて以下を含める。

- Front / Side / Backの整合したTurnaround
- 比率・Scaleの基準
- 関節位置と可動域を判断できる情報
- Material、硬軟、発光、透過等のCallout
- 装備や付属物の接続位置
- 部位破壊や変形がある場合の通常／変化後

**Gate 2 — Visual Reference:** 各View間で比例・装備位置・形状が矛盾せず、Modelerが重要形状を推測で補わなくてよい。Reference不足がある場合はModelingへ進む前に補う。

### 3. モデル構造・Topology・Material構成設計

造形前にRuntimeへ入る形を設計する。

確認項目:

- Mesh分割と親子関係
- Rig / Skeleton / Bind Poseとの契約
- 肩、肘、膝、股関節、口、翼等の変形域に必要なEdge Flow
- Socket、武器、VFX、被弾・部位破壊で必要な接続点
- Material slot数、Texture方針、共有Material／Atlasの可否
- LOD、Instancing、Culling、Shadow対象
- 座標系、Scale、Naming、Export形式と既存Loaderとの互換
- Triangle、Bone、Material、Texture、Draw submission等の予算

**Gate 3 — Structure:** 既存Renderer / Rig / Asset pipelineで扱える構造になっており、後から大きな作り直しを生む未決定事項がない。品質とPerformanceの予算が測定可能な形で決まっている。

### 4. Modeling

Referenceと構造設計に沿って、Graybox → Primary Forms → Secondary Forms → Detailの順で造形する。早い段階から本編Camera距離でSilhouetteと比率を確認し、細部だけを先に作り込まない。

Materialも最終のLighting条件を意識し、色差だけで個性を作らない。必要な法線、粗さ、発光、透過等は既存Rendererの実装範囲へ合わせる。

**Gate 4 — Model:** Graybox時点とDetail後の両方で、Concept / Referenceからの形状ドリフトがなく、本編Camera距離でも主要特徴が読める。

### 5. Rig / Animation適合確認

Rigged assetは静止画だけで合格にしない。実際に使用するSkeleton、Animation、IK、Socketへ接続して確認する。

最低限の確認例:

- Bind PoseとBone mapping
- Weightと主要関節の潰れ／伸び
- Idle / Locomotion / Attack等の大きいPose
- Hit / Damage / Death、必要なら部位破壊
- 武器・装備・VFX Socketの追従
- 足接地、手のGrip、体積保持、Clipping

**Gate 5 — Rig / Animation:** 代表的な極端Poseでも破綻せず、モデル固有の問題がAnimation側の補正で隠されていない。Animationから要求されるSocketや部位が正しく追従する。

### 6. ゲーム向け最適化

品質を保ったまま、実際の同時表示数と対象端末を前提にCostを削る。

確認するもの:

- 不要面、過密Topology、過剰Bone、見えないDetail
- Material / Texture / Shader variantの増加
- LODまたは距離別簡略化
- Shared geometry / Instancingの利用可能性
- Shadow、透明、Particle、Skinned mesh等の高Cost要素
- Asset bytes、Decode / Upload、Runtime cache

**Gate 6 — Optimization:** 測定値が事前の予算内、または超過理由と改善判断が明示されている。最適化によってSilhouette、変形、主要Material表現を壊していない。

### 7. 実機またはRendererでVisual / Performance Review

最終品質は制作画面だけで判断しない。現行developの実際のRendererまたは担当用Review surfaceへ入れ、ゲームと同じLighting、Camera、Animation、Effectとの組み合わせで確認する。

Visual Reviewでは少なくとも以下を見る。

- 本編距離とClose viewの両方
- 前後左右と主要な斜め角度
- Idleと代表Animation
- 背景、Lighting、Fog等に入れた時の輪郭
- 装備、VFX、Damage表現等との重なり

Performance Reviewでは、変更に応じて代表的な同時表示数、Quality、CPU/GPU負荷、Draw/Material/Geometry/Asset budgetを確認する。対象端末確認が品質ゲート上必要なら実機結果を使う。

**Gate 7 — Visual / Performance:** 実際のRendererでConceptの意図が読め、Animation時にも破綻せず、必要なPerformance証拠が揃っている。実機等を確認できていない場合は `UNVERIFIED` を明示する。

### 8. 問題修正・再確認

Reviewで見つけた問題を、原因となった工程へ戻して直す。

- Silhouette / 比率 → Concept / Reference / Modeling
- 関節破綻 → Topology / Weight / Rig contract
- Materialの読みにくさ → Material設計 / Lighting適合
- Draw cost / GPU cost → 構造設計 / 最適化
- Socketずれ / 部位破壊不整合 → 構造設計 / Rig統合

修正後は、影響を受けるGateから最終Reviewまで再確認する。無関係な工程を機械的に繰り返さない。

## 完了時に残す証拠

PRには制作物そのものに加え、今回必要だった範囲で以下を残す。

- Conceptと使用した主要Visual Reference
- 構造／Topology／Materialの重要判断
- Rig / Animation適合の確認結果
- Geometry / Material / Asset等の測定値
- Renderer / 実機Visual Review結果
- Performance Review結果
- `UNVERIFIED` の項目

これらの中間成果とReviewが品質証拠であり、reasoning levelの高さは代替にならない。
