# HISTORICAL — 初回搬入・CI/CD構築

2026-09-08の初期移行の来歴を保存する。現行命令ではなく、通常作業の必読資料でもない。文中の新規Repository作成、main向け搬入、固定branch/PRの維持、35ファイル完全一致、直接push、全Browser再実行は再開手順として使わない。

| 記録 | 役割 |
| --- | --- |
| [IMPORT_HANDOFF.md](IMPORT_HANDOFF.md) | rootの旧 `WORK_INSTRUCTIONS.md`。初期35ファイル一覧・搬入時の検証 |
| [DEPLOYMENT_AUDIT.md](DEPLOYMENT_AUDIT.md) | 旧 `docs/DEPLOYMENT.md`。構成選定・初回接続・当時の検証履歴 |

旧 `BRANCH_STRATEGY.md`、`GITHUB_WORK_HANDOFF.md`、`GITHUB_CICD_INSTRUCTIONS.md` の重複した初回手順は現行ファイルから除去した。個別の旧本文が必要な場合はGit履歴で参照できる。上記2記録に来歴を集約し、移行手順のコピーを増やさない。

`docs/RECOVERY_SOURCE_SHA256.json` と `deploy/migrate-branches.mjs` も初回専用の資料・ツール。固定値は当時の検証対象であり、現在のゲームや文書をその内容に戻す根拠ではない。特にmanifestの旧WORK_INSTRUCTIONSのhashは保存資料の識別であり、更新後の現行入口のhashではない。これらのコード・データは変更していない。

現在の共通運用と文書区分は [文書案内](../../README.md) を参照する。
