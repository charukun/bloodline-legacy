# Production Workflows

> **REFERENCE — 品質依存度の高い制作作業向けの分野別工程。** ゲーム仕様の正本や共通開発運用ポリシーを置き換えない。[文書案内](../README.md) から、現在の担当に一致するWorkflowだけを選んで参照する。

## 使い方

このディレクトリは全WORKの必読資料ではない。制作物そのものの品質が、中間設計・Visual Reference・実機Reviewに強く依存する場合だけ使う。

| 担当 | 読むWorkflow |
| --- | --- |
| キャラクター、装備、クリーチャー等の3Dモデルを新規制作・大幅改修する | [3D Model Creation](3D_MODEL_CREATION.md) |
| 技、戦闘モーション、技VFX/SFXを新規制作・大幅改修する | [Skill / Combat Motion Creation](SKILL_COMBAT_MOTION_CREATION.md) |
| 敵キャラクターを新規制作・大幅改修する | [Enemy Creation](ENEMY_CREATION.md) |

敵WORKで新規3Dモデルが主要成果になる場合は、Enemy Creationから指定された範囲だけ3D Model Creationも参照する。単純な数値調整、文言修正、CI、保存、UI等のWORKへこれらを読み込ませない。

## 品質ゲートの原則

高いreasoning levelや長い思考時間そのものを品質証拠にしない。各Workflowで定義する**中間成果物とReview結果**を品質ゲートとして扱う。

- 工程を進める前に、その段階で必要な成果物が存在し、次工程の判断に十分か確認する。
- Visual Reference、構造設計、Timing設計など、後工程の品質を左右する中間成果物を省略して最終実装へ飛ばない。
- Reviewで問題が見つかった場合は、問題の原因となった工程まで戻って修正し、影響するゲートから再確認する。無関係な工程を毎回やり直さない。
- 現行developの実装、実際のRenderer / Simulation / Review surfaceを優先し、制作専用の簡易表示だけで本編品質を保証しない。
- 実機、Browser、GPU、対象端末等の必要な確認を実施できない場合は成功扱いにせず、該当ゲートを `UNVERIFIED` としてPRへ残す。
- Workflow本文へ共通ポリシーやゲーム仕様を複製しない。必要な制約はProject Sources、最新develop、担当領域のreferenceから取得する。
