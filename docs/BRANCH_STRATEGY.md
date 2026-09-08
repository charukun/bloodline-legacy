# Bloodline Legacy — 正式Branch Strategy

指定方針: 2026-09-08 JST。**develop作成済み・全35ファイルの独立したread-back待ち**。

| Branch | 移行後の正式な役割 | 現在の実施状態 |
| --- | --- | --- |
| develop | Development / Implementation Source of Truth、DEV配信 | 基準commitから作成しHEAD一致確認済み。全35ファイルの再取得照合は未完了 |
| staging | Pre-production、STAGING配信 | 未作成 |
| main | Production、PRODUCTION配信 | READMEのみ（ユーザーからの確認情報）。変更なし |
| work/current-handoff | Initial handoff import / historical branch | 保持。移行が確認されるまでは既存コードの復旧元 |

基準commit: `383a1eef7adde83c22073c74982052b3a75a2b5c`。
PR #1 `Import current Bloodline Legacy game handoff`: Open / 未merge（認証済みWeb UIでも確認）。本セッションからmerge/close/変更していない。

## 切替の成立条件

1. GitHub上でhandoff branchのHEAD、mainとの差分、PR #1、35ファイルを再取得して確認する。
2. 新規develop refを指定commitに作成する。既存developが見つかった場合は上書きしない。
3. develop refと35ファイルをGitHubから再取得し、基準との完全一致と生成物の不在を確認する。
4. このread-backが成功した時点で、Implementation Source of Truthを **develop** に切り替える。単に設定文書を作った段階では切り替え済みと報告しない。
5. developへCI/CD設定を反映し、Build/Test/DEV固定URLのWebGL smokeを成功させる。
6. 検証済みdevelopのcommitからstagingを作成し、STAGINGの公開検証を実施する。
7. mainにはProduction用インフラ・待機ページのみを導入できる。開発途中のゲームを無条件に入れない。

## 再開用の実行スクリプト

`deploy/migrate-branches.mjs` は認証済み `gh` が利用できる環境で実行する。tokenを引数やファイルへ書く必要はない。ネットワーク認証が復旧するまでは実行未確認。

```bash
node deploy/migrate-branches.mjs --audit
node deploy/migrate-branches.mjs --verify-develop
```

auditとverify-developは読取のみ。現在はdevelop作成済みなのでverify-developを使用し、全35ファイルのblobを再取得してSHA256照合する。--developはdevelopが未作成の場合の初回作成専用で、既存developを上書きしない。main/handoff refとPR #1を保持する。途中で別WORKが変更した場合はその状態を調査し、forceで突破しない。

CI/CDをdevelopへ導入し、DEV公開smoke合格後に:

```bash
node deploy/migrate-branches.mjs --staging
```

staging作成は、develop HEADに対する成功workflow、Deploy and verify dev job、公開version/HTML hashの一致を要求する。既存stagingを強制更新しない。Migration証跡は `deploy/evidence/migration/` に出力する。このスクリプトは初回移行用で、通常の昇格はPR/通常mergeで行う。

## 実装セッションへの正式引継ぎ

移行read-back成功後の正式な参照先:

```text
Repository: charukun/bloodline-legacy
Branch: develop
Role: Development / Implementation Source of Truth
```

mainやwork/current-handoffを恒久的な実装参照先にしない。通常handoffの反映先はdevelopのみ。検証後の別指示でstaging、さらにmainへ昇格する。

Private Repositoryの404は不存在の証拠ではない。認証・選択repo権限・branchを確認する。既存コードを推測で作り直さない。

PR #1は初期搬入のhistorical import PRとしてOpenのまま残す方針。移行後も自動でclose/mergeせず、必要なら後の明示的な整理判断の対象にする。
