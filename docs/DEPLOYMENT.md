# Deployment — reference

共通運用は [v7 §6–7](COMMON_DEVELOPMENT_POLICY.md#6-integration)。この文書はRepository内の配信実装を説明する資料であり、現在の配信成功・設定値・PR状態を証明するものではない。実行条件は対象branchのworkflow、結果は対象SHAのActionsと配信物から確認する。

## 環境と実装

| Branch | 環境 | Worker（`deploy/config.mjs`） |
| --- | --- | --- |
| `develop` | DEV | `bloodline-legacy-dev` |
| `staging` | STAGING | `bloodline-legacy-staging` |
| `main` | PRODUCTION | `bloodline-legacy-production` |

GitHub ActionsがCloudflare Workersへ、検証済みの `deploy/out/<environment>/` を配信する。ゲームHTML・アセット・Build Versionは [deploy/build.mjs](../deploy/build.mjs) で生成し、[deploy/check-build.mjs](../deploy/check-build.mjs) で整合を確認する。Versionの仕組みは [BUILD_VERSION.md](BUILD_VERSION.md) を参照。

[deploy/release.json](../deploy/release.json) の `production` が本番ゲーム公開を制御する。falseは待機ページ。develop内の設定を、現在mainで配信している内容の証拠にしない。

オンラインAPI、保存互換性、環境別Durable Object、保持するengineは [Live Update](live-update/README.md) と現在の `src/server/`、`deploy/wrangler.*.json` を参照する。初期構築時の「常時offline / API 501 / サーバーなし」は現行構成の説明として使わない。

## 対象branchのworkflowを読む

| Workflow | この文書と同じtreeの実装 |
| --- | --- |
| [deploy.yml](../.github/workflows/deploy.yml) | 環境選択、Build・テスト・Asset照合。配信は対応する環境branchへのpushかつ公開ゲートがtrueの場合のみ。PR/manualは配信しない |
| [character-visual.yml](../.github/workflows/character-visual.yml) | 対象パスのdevelop向けPR等でCharacterの機能・Browser検証。完全な性能比較はmanualの `full_review` 条件 |
| [ship-deck.yml](../.github/workflows/ship-deck.yml) | 対象パスのdevelop向けPR等で船・甲板の検証 |

DEVの通常deploy workflowでは公開前Browserを省略し、公開後はHTTP検証を行う。STAGING / PRODUCTIONはBrowser検証を含む。Character・船の専用workflowは別条件でBrowserを実行するため、「DEV関連はすべてBrowserなし」とは扱わない。

上表はrequired checksの設定一覧ではない。保護ルールとrequired checksはGitHubで別途確認する。未mergeのCI改善PRにある省略・差分テストを適用済みとみなさない。

## 設定名の参照

| 種別 | 名前 | 用途 |
| --- | --- | --- |
| Variables | `CICD_ENABLED_DEV` / `CICD_ENABLED_STAGING` / `CICD_ENABLED_PRODUCTION` | 環境別の公開ゲート |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | 対象account |
| Variables | `FIXED_URL_DEV` / `FIXED_URL_STAGING` / `FIXED_URL_PRODUCTION` | 公開後検証先 |
| Secrets | `CLOUDFLARE_API_TOKEN_DEV` / `CLOUDFLARE_API_TOKEN_STAGING` / `CLOUDFLARE_API_TOKEN_PRODUCTION` | 環境別配信用token |

これは設定済みであるとの報告や変更依頼ではない。設定変更が依頼範囲に含まれる場合に現在値・対象環境を確認する。Secret値はsource・PR・ログへ記録しない。

## 配信確認と失敗の扱い

統合対象群の最終develop SHAを固定し、必要な回帰結果、deploy job、公開 `version.json` の全文commitとHTML hashを照合する。確認方法は [deploy/smoke.mjs](../deploy/smoke.mjs)。HTTP検証成功をBrowser・Visual・実機性能の成功と読み替えない。画面のBuild Versionは読み込んだHTMLの識別であり、新しいmanifestに置き換えない。

Build失敗では配信に進まない。配信前にbranch/URL/current HEADと [check-rollout.mjs](../deploy/check-rollout.mjs) による保存・保持engine・契約互換性を確認する。公開後の検証失敗は既に配信済みの場合があるため、その事実を報告し、原因と影響を確認する。修正・revertも現在のPR運用と許可された範囲で行う。

旧runやsuperseded・skippedのrunを最新配信の成功証拠にしない。実際に失敗した箇所の証拠を確認してから必要な再検証を行う。STAGING / PRODUCTIONは明示された昇格と、その環境のリリース条件を確認する。

初回構築の比較・接続・検証記録は [historicalの配信監査](historical/initial-migration/DEPLOYMENT_AUDIT.md) に保存している。
