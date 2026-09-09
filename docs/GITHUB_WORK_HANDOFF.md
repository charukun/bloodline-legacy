# GitHub WORK — reference

通常の進め方とPR記載事項は [共通開発運用ポリシー v7 §3–6](COMMON_DEVELOPMENT_POLICY.md#3-workの基本動作)、環境対応は [Branch roles](BRANCH_STRATEGY.md)、配信確認は [Deployment](DEPLOYMENT.md) を参照する。

旧版の「handoff搬入担当へ渡し、developへ直接push」「各反映ごとに全CI/CD・公開Browserを再実行」という共通手順は廃止した。通常は作業WORKが専用branchからReady for review PRを提出する。

過去handoffが来歴調査に必要な場合も、そのファイル一覧・固定SHA・検証結果は当時の記録である。現在の変更の採否やPR依存は最新developとGitHubの状態で判断する。初回設定の再実行を通常開発の前提にしない。
