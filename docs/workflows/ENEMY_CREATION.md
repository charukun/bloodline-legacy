# Enemy Creation

適用範囲・証拠の形式は [Workflow入口](README.md)。敵の新規制作、外見・動作・戦闘表現の改修に使用する。

## 標準工程

ゲーム上の役割 → Silhouette / Visual設計 → 必要なReference → Modeling → Animation → 被弾・部位破壊・死亡挙動との統合 → Combat Review → Performance Review → 修正

| 工程 | 中間成果物 | 次工程へ進む品質ゲート |
| --- | --- | --- |
| ゲーム上の役割 | 対象ID、役割、既存敵との差、出現・攻撃・弱点など関連仕様への参照 | 外見・動作で表す特徴と本編AI／戦闘仕様が対応。既存種の派生か新系統か、必要な実装境界を識別 |
| Silhouette / Visual設計 | ゲーム距離の輪郭案、体格差、色・素材・特徴部位の設計 | 背景や他の敵に埋もれず、向き・攻撃部位・予兆が識別できる。色だけに識別を依存しない |
| 必要なReference | 三面図・可動部・素材・破壊前後など、構造を確定する画像と出典／生成情報 | 視点間で比率・部品の対応が一致。Animationや部位破壊に必要な接合構造が読める |
| Modeling | 制作元、出力モデル、部品／Material／socket構造と比較画像 | [3D Workflow](3D_MODEL_CREATION.md)の構造設計・Modeling・rig適合・最適化ゲートを満たす。既存geometryを再利用する場合も適合を確認 |
| Animation | 待機・移動・予兆・攻撃・防御・被弾・死亡など、対象の状態／遷移一覧とclipまたは生成動作 | 適用状態で接地・重心・向きが自然。攻撃は [Skill Workflow](SKILL_COMBAT_MOTION_CREATION.md)の軌道・接触・演出ゲートを満たす。非対応状態は理由を記録 |
| 被弾・部位破壊・死亡挙動との統合 | 状態×部位の確認表、registry／Simulation／rendererの接続、関連する回帰証拠 | 生命力による外見変化と実際の部位欠損を区別。欠損部の装備・socket・VFX、死体での欠損維持、死亡後の攻撃停止等が現在仕様に一致。描画が本編状態や乱数を変更しない |
| Combat Review | 敵単体と技×敵のDeep Link、代表技・間合い・負傷状態での実戦証拠 | 単体snapshotと実戦Simulationの両方で外見・予兆・当たり判定・被弾・死亡が整合。繰返し戦闘、複数体、対象の地形条件で破綻せず、本編registryから対象が選べる |
| Performance Review | 同条件の変更前後計測、体数・品質・端末／GPU・画面サイズ・SHAと生データ | 待機だけでなく同時攻撃・VFX・被弾・欠損・死亡の負荷を確認。frame time、draw calls、triangles、メモリ／資源解放を必要に応じて比較し、現行目標に適合。実機未計測をソフトウェアGPUの値で代替しない |
| 修正 | 原因工程への差戻しと再Review | Visual、戦闘統合、性能の問題を修正。最適化で動作や欠損表現が変わればCombat Reviewも再確認 |

## 関連する技術資料

必要に応じて [BESTIARY](../enemies/BESTIARY.md)、[DAMAGE_STAGES](../enemies/DAMAGE_STAGES.md)、[WEAKNESS_MOTION](../enemies/WEAKNESS_MOTION.md)を現在コードと照合する。敵数・数値・過去計測をここへ複製しない。[Review Lab](../REVIEW_LAB.md)には単体・実戦の区別と複数体の計測方法がある。
