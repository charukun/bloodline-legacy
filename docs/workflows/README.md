# Production Workflows

制作対象に応じて使う標準工程。共通運用は [v7](../COMMON_DEVELOPMENT_POLICY.md)、確定仕様はProject Sourcesを参照する。この文書群は制作手順と品質ゲートのみを定め、ゲーム仕様・数値・CIルールを複製しない。

## 対象を選ぶ

| WORKの対象 | 使用するWorkflow |
| --- | --- |
| キャラクター・装備・環境などの3Dモデル制作／改修 | [3D Model Creation](3D_MODEL_CREATION.md) |
| 技・戦闘モーション・それに同期する演出の制作／改修 | [Skill / Combat Motion Creation](SKILL_COMBAT_MOTION_CREATION.md) |
| 敵の新規制作・外見や動作の改修 | [Enemy Creation](ENEMY_CREATION.md) |

敵制作はEnemyを主工程とし、モデル工程は3D、技工程はSkillの該当ゲートを参照する。同じ成果物・Reviewを複数文書向けに作り直さない。対象外WORKに全Workflowの読込を要求しない。

## 工程の進め方と証拠

各工程で中間成果物を作り、表の合格条件に照らしてReviewしてから次へ進む。高いreasoning level、生成回数、テストのgreen自体を制作品質の保証にしない。セルフReviewも、実際に確認した成果物と判断理由を残す。通常の工程Reviewごとにユーザーの承認待ちを追加しない。

- 着手時に対象ID、変更目的、必要な確定仕様への参照、使用する実装・アセット、比較Referenceと達成条件を定める。見た目の評価はシルエット、接地、接触など観察可能な項目にする。
- 新規制作は全工程を辿る。部分改修は既存成果物を再利用し、影響しない工程は理由と参照先を付けて `N/A` にできる。変更で前提が崩れた工程は再Reviewする。必須証拠がない状態を `N/A` にしない。
- 不合格なら原因の工程へ戻り、修正後に影響範囲を再確認する。回数固定の反復はしない。確認環境が使えない場合は代替で確認できた範囲と `UNVERIFIED` を分け、必要な品質ゲートを通過済みにしない。
- 編集可能な制作元・生成スクリプト・Referenceを再現可能な参照先に残す。外部素材は出典と利用条件、生成Referenceはプロンプトと採用画像を残す。大きな証拠はPRやartifactへのリンクで参照する。

PRまたは領域別の短い制作記録に、次の表を一つ置く。共通ポリシーや長い作業日誌は貼り直さない。

| 工程 | 成果物・版／SHA | Review条件・証拠 | 判定と理由／残課題 |
| --- | --- | --- | --- |
| 対象工程 | ファイルまたは再現可能なリンク | 視点・速度・端末など、比較を再現できる条件 | PASS / FAIL / N/A / UNVERIFIED |

最終Reviewは配信物のSHA / Build Versionと対象IDを照合する。[Review Lab](../REVIEW_LAB.md)の実在する対象Deep Link、修正前後の比較、必要な計測を記録する。静止画は時間的品質、単体snapshotは実戦Simulation、ソフトウェアGPUは実機性能の証拠を代替しない。CIとの分担は [CI validation](../CI_VALIDATION.md) を参照し、PRの機能ゲートだけでアート品質を承認しない。
