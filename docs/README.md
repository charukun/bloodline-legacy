# 文書案内

共通運用は新「血脈の系譜」Project Sources の最新版「Bloodline Legacy 共通開発運用ポリシー v7」。Repository内の同期コピーは [COMMON_DEVELOPMENT_POLICY.md](COMMON_DEVELOPMENT_POLICY.md)。現在のユーザー指示を優先し、必要な担当資料だけを読む。

## 区分

| 区分 | 用途 |
| --- | --- |
| 現行入口・共通運用 | [AGENTS.md](../AGENTS.md)、[v7同期コピー](COMMON_DEVELOPMENT_POLICY.md)。[WORK_INSTRUCTIONS.md](../WORK_INSTRUCTIONS.md) は入口への参照のみ |
| reference | 担当領域の技術資料。ゲーム仕様の正本はProject Sources、実装は最新develop。旧ポリシー・WORK固有指示・PR状態・検証結果は当時の来歴 |
| historical | 過去WORKの経緯・実装・証跡。命令や最新状態として実行・採用しない。未検証の記録を成功に読み替えない |

historical化はゲーム仕様や技術上の制約の変更を意味しない。過去の仕様保護・共有境界・未解決の検証事項が今回の変更に関係する場合は、現在の仕様・コード・GitHubの証拠に照らして判断する。

## 運用の技術資料

- [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md): branchの役割
- [DEPLOYMENT.md](DEPLOYMENT.md): 配信実装・確認方法
- [DEV_FAST_CI.md](DEV_FAST_CI.md): DEVのHTTP確認と専用Browser workflowの区別
- [CI_VALIDATION.md](CI_VALIDATION.md): 変更範囲に応じたPR検証と最終developの全体回帰
- [BUILD_VERSION.md](BUILD_VERSION.md): Build Versionの生成と識別
- [GITHUB_WORK_HANDOFF.md](GITHUB_WORK_HANDOFF.md)、[GITHUB_CICD_INSTRUCTIONS.md](GITHUB_CICD_INSTRUCTIONS.md): 上記への参照入口。初回搬入の重複手順は廃止
- [初回移行記録](historical/initial-migration/README.md): 新規作成・main搬入・35ファイル固定を含む旧手順の来歴
- [Game skills](skills/README.md): ゲーム内スキル資料。agent用の `SKILL.md` ではない

- [REVIEW_LAB.md](REVIEW_LAB.md): 開発者用の技・敵・実戦ReviewとPR Preview

## v7同期元

- 原本: 新「血脈の系譜」Project Sourcesの `Bloodline_Legacy_Common_Development_Policy_v7_FINAL.md`
- 文書更新日: 2026-09-10
- 同期コピーは原本とbyte単位で一致。SHA-256: `23f85f9933d53142304e2f40188c7e760d1984e1dbebc05d0d158236c589b5ce`
- 共通ポリシーはこの1コピーへ集約。旧 `COMMON_DEVELOPMENT_POLICY.txt` はこのコピーへの参照のみ。旧版への言及は下記資料のhistoricalな来歴として残している。
- v7への文書整理はCI/CD実装の変更を意味しない。未mergeのworkflow改善は現行として扱わず、対象branchのworkflowとActionsを確認する。

## 技術資料・記録の索引

以下は必要な領域だけを選ぶための索引であり、全件の必読リストではない。既存のゲーム実装説明・数値・画像・証跡を保持し、各文書の先頭に用途を明記した。

| 文書 | 区分 |
| --- | --- |
| [CAMERA_PREVIEW_REVIEW.md](CAMERA_PREVIEW_REVIEW.md) | historical |
| [GOLDEN_SLICE.md](GOLDEN_SLICE.md) | historical |
| [LIVING_CANOPY.md](LIVING_CANOPY.md) | reference |
| [MINOR_POLISH_REVIEW.md](MINOR_POLISH_REVIEW.md) | historical |
| [MOTION_PREVIEW_REVIEW.md](MOTION_PREVIEW_REVIEW.md) | historical |
| [MOVEMENT_FRAME_PACING.md](MOVEMENT_FRAME_PACING.md) | reference |
| [PLAZA_CRAFT.md](PLAZA_CRAFT.md) | reference |
| [PLAZA_SURFACE_PERFORMANCE.md](PLAZA_SURFACE_PERFORMANCE.md) | reference |
| [UI_POLISH_REVIEW.md](UI_POLISH_REVIEW.md) | historical |
| [WARDROBE_FAITH_REVIEW.md](WARDROBE_FAITH_REVIEW.md) | historical |
| [audio/CELTIC_SCORE.md](audio/CELTIC_SCORE.md) | reference |
| [character/CM01-review.md](character/CM01-review.md) | historical |
| [character/MOTION_CLIPS.md](character/MOTION_CLIPS.md) | reference |
| [character/ages/README.md](character/ages/README.md) | reference |
| [character/travelers/MOTION.md](character/travelers/MOTION.md) | reference |
| [character/travelers/README.md](character/travelers/README.md) | reference |
| [combat-life/README.md](combat-life/README.md) | reference |
| [damage-feedback/README.md](damage-feedback/README.md) | reference |
| [damage-motion/README.md](damage-motion/README.md) | reference |
| [damage-travelers/README.md](damage-travelers/README.md) | reference |
| [diorama-bokeh/REVIEW.md](diorama-bokeh/REVIEW.md) | historical |
| [enemies/BESTIARY.md](enemies/BESTIARY.md) | reference |
| [enemies/DAMAGE_STAGES.md](enemies/DAMAGE_STAGES.md) | reference |
| [enemies/PERFORMANCE.md](enemies/PERFORMANCE.md) | historical |
| [enemies/SESSION_RECORD.md](enemies/SESSION_RECORD.md) | historical |
| [enemies/WEAKNESS_MOTION.md](enemies/WEAKNESS_MOTION.md) | reference |
| [live-update/README.md](live-update/README.md) | reference |
| [ship-deck.md](ship-deck.md) | reference |
| [skill-motion-footwork/README.md](skill-motion-footwork/README.md) | reference |
| [skill-motion-tempo/README.md](skill-motion-tempo/README.md) | reference |
| [skills/ARCANE_EFFECTS.md](skills/ARCANE_EFFECTS.md) | reference |
| [skills/BATTLE_PANEL.md](skills/BATTLE_PANEL.md) | reference |
| [skills/COMPOSITION.md](skills/COMPOSITION.md) | reference |
| [skills/DISCOVERY_PACE.md](skills/DISCOVERY_PACE.md) | reference |
| [skills/EFFECT_COMPOSER.md](skills/EFFECT_COMPOSER.md) | reference |
| [skills/FX_TUNING.md](skills/FX_TUNING.md) | reference |
| [skills/LIFE_FEEDBACK.md](skills/LIFE_FEEDBACK.md) | reference |
| [skills/SESSION_RECORD.md](skills/SESSION_RECORD.md) | historical |
| [skills/SILK_SLASH.md](skills/SILK_SLASH.md) | reference |
| [skills/SKILL_MOTION.md](skills/SKILL_MOTION.md) | reference |
| [terrain/README.md](terrain/README.md) | reference |
| [ui-family-book/SESSION_RECORD.md](ui-family-book/SESSION_RECORD.md) | historical |
| [ui-golden-slice/GITHUB_RECOVERY.md](ui-golden-slice/GITHUB_RECOVERY.md) | historical |
| [ui-golden-slice/SESSION_RECORD.md](ui-golden-slice/SESSION_RECORD.md) | historical |
| [ui-lineage/flow-revision.md](ui-lineage/flow-revision.md) | reference |
| [ui-lineage/implementation.md](ui-lineage/implementation.md) | reference |
