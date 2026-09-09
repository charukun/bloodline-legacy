# Branch roles — reference

共通のbranch公開・PR・統合ルールは [v7 §5–6](COMMON_DEVELOPMENT_POLICY.md#5-並列開発とpr) を参照する。

| Branch | 役割 | 配信環境 |
| --- | --- | --- |
| `develop` | Development / Implementation Source of Truth | DEV |
| `staging` | Pre-production | STAGING |
| `main` | Production | PRODUCTION |
| 各WORKの専用branch | 最新developを基準に変更を提案する | 通常は配信なし |

環境対応の実装は [deploy/config.mjs](../deploy/config.mjs)。GitHubのdefault branch設定と、実装の正本であるdevelopは別の概念である。各refの現在HEAD・保護・PR状態はGitHubから取得する。

初期搬入branchや旧handoffは来歴調査用であり、開発正本にはしない。初回移行の成立条件、元35ファイルへの固定、過去PRのOpen維持を通常運用の条件にしない。

通常開発のPR先はdevelop。STAGING / PRODUCTIONへの昇格は明示的なリリース指示に基づき、対象branchの実装と必要な検証を確認して行う。
