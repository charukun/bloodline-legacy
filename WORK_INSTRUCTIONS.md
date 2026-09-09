# WORK_INSTRUCTIONS

通常開発は [共通開発運用ポリシーv6](docs/COMMON_DEVELOPMENT_POLICY.txt) と [AGENTS.md](AGENTS.md) に従う。

- 正本：仕様はProject Sources、実装はlatest develop。
- 作業別WORK：専用branchで実装・局所検証を完了し、Ready for review PRをdevelopへ提出。
- Integration WORK：意味的レビュー・統合、最終SHAの全体CI／必要なRegressionとDEV確認。
- GitHub WRITE不能時だけFallback Handoff。通常PRへZIP・全ファイル再取得・再Buildを重ねない。
- 新しいユーザー依頼ごとにポリシー版を確認し、既存成果・branch・有効な証拠を引き継ぐ。

検証コマンドとCIの責任分担は [CI_VALIDATION.md](docs/CI_VALIDATION.md)。通常Buildは `npm run build`。`npm test` はBuildを含む全体テストなので、局所検証として機械的に実行しない。

以前のRepository新規作成、base=main、35ファイル限定の指示は初回搬入用で、通常運用では無効。初回記録が必要なときだけGit履歴を参照する。
