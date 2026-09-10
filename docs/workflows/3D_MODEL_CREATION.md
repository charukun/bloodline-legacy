# 3D Model Creation

適用範囲・証拠の形式は [Workflow入口](README.md)。キャラクター、敵、装備、環境モデルの制作・改修に使用する。

## 標準工程

コンセプト・プロット → 三面図などのVisual Reference生成 → モデル構造・Topology・Material構成設計 → Modeling → Rig / Animation適合確認 → ゲーム向け最適化 → Renderer / 実機Review → 修正・再確認

| 工程 | 中間成果物 | 次工程へ進む品質ゲート |
| --- | --- | --- |
| コンセプト・プロット | 役割、体格・形状、素材感、ゲーム距離での特徴、Referenceとの差を記した短い制作案 | 確定仕様と整合し、優先する特徴と完成時の比較条件が具体的 |
| Visual Reference生成 | 正面・側面・背面の三面図。必要に応じて装備、接合部、素材の詳細図。生成プロンプトと採用画像 | 各面で比率・装備位置・左右・構造が一致し、画像の矛盾を解消。雰囲気だけでなくモデリングに必要な形状が読める |
| 構造・Topology・Material設計 | 部品分割、関節周辺の辺構成、UV、Material、socket、LOD／共有化方針、対象機器に対する予算 | 変形・装備・部位破壊など適用対象の境界と既存loader／rendererの制約を満たす。予算は現行仕様と同等条件の計測を根拠にする |
| Modeling | 編集可能な制作元とゲーム用出力、三面・斜め・ゲーム距離の比較画像 | 比率とシルエットがReferenceに一致。意図しない穴・法線反転・貫通・UV破綻がなく、実際の照明で素材が判別できる |
| Rig / Animation適合確認 | bone・weight・bind pose・socket確認、代表clipによる可動域確認 | 肩／肘／膝などの潰れ、足滑り、装備ずれ、clip切替の跳ねがない。現行rigへ適合し、対象の年齢・体格・欠損状態でも確認。静的モデルは非適用理由を記録 |
| ゲーム向け最適化 | 最適化前後のtriangles、draw calls、Material／texture量、bone数、容量と比較画像 | 不要geometry・Material・texture等を整理し、採用するLODや共有化でシルエット・変形・接触点が崩れない。未対応の圧縮形式を導入しない |
| Renderer / 実機Review | 本編rendererでゲーム距離・通常速度・実照明の確認、必要な端末計測 | Referenceの主要特徴、接地、陰影、装備、動作中の可読性を満たし、適用する性能目標を満たす。DCC内の表示のみで通過させない |
| 修正・再確認 | 差分と再Review結果 | 問題の原因工程へ戻り、影響する後工程を再確認して必要ゲートが揃う |

## 関連する技術資料

既存キャラクターのclip適合は [MOTION_CLIPS](../character/MOTION_CLIPS.md)、年齢モデルは [ages](../character/ages/README.md)、敵の接合部は [DAMAGE_STAGES](../enemies/DAMAGE_STAGES.md) を必要時だけ参照する。そこに残る特定モデル・過去SHAの制約を全モデルへ一般化せず、対象の現在実装と照合する。

Blender等のDCCを使う場合も、コードでgeometryやglTFを生成する場合も同じ成果物とゲートを満たす。ツールが使えないことを、構造設計やVisual Reviewを省略する理由にしない。
