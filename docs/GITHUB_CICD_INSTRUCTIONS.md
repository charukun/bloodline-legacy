# CI/CD文書の入口 — reference

共通運用は [v7 §7](COMMON_DEVELOPMENT_POLICY.md#7-cicd)、実装に対応した構成は [Deployment](DEPLOYMENT.md) と [DEV CI](DEV_FAST_CI.md) を参照する。実際の実行条件は対象branchの [.github/workflows](../.github/workflows) とGitHub Actionsで確認する。

旧版の初回branch作成、Secrets初期登録、直接push、過去PRのOpen維持、元35ファイル照合は通常WORKへの指示から除去した。初回の構築経緯は [historical記録](historical/initial-migration/README.md) に集約した。

[deploy/migrate-branches.mjs](../deploy/migrate-branches.mjs) と [RECOVERY_SOURCE_SHA256.json](RECOVERY_SOURCE_SHA256.json) は初回移行用の履歴資料で、最新developの正当性を判定する通常ゲートではない。旧SHAや初期内容に現在のRepositoryを合わせない。これらの実行コード・データはこの文書整理では変更していない。
