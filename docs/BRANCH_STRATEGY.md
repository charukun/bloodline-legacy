> 通常運用は [共通ポリシーv6](COMMON_DEVELOPMENT_POLICY.txt) と [CI検証責任](CI_VALIDATION.md) を優先する。以下の初回搬入・移行手順や過去実績を、毎回の作業として再実行しない。

# Bloodline Legacy — 正式Branch Strategy

指定方針: 2026-09-08 JST。**develop移行・全35ファイルread-back完了。正式Source of Truthはdevelop**。

| Branch | 移行後の正式な役割 | 現在の実施状態 |
| --- | --- | --- |
| develop | Development / Implementation Source of Truth、DEV配信 | 基準commitから作成。GitHub Actionsで全35ファイルSHA256照合成功 |
| staging | Pre-production、STAGING配信 | DEV公開検証済みf07c632から作成、同SHAをread-back。固定URLで公開WebGL smoke PASS |
| main | Production、PRODUCTION配信 | 既存README/履歴を保持。固定URLで待機ページ公開・smoke PASS。正式ゲーム未公開 |
| work/current-handoff | Initial handoff import / historical branch | 保持。初期handoffのhistorical branch。新規開発の正本には使わない |

基準commit: `383a1eef7adde83c22073c74982052b3a75a2b5c`。
PR #1 `Import current Bloodline Legacy game handoff`: Open / 未merge（認証済みWeb UIでも確認）。本セッションからmerge/close/変更していない。

## 移行実績

検証commit: `52409ba735fb495c10252bc9eb060ca351745d1b`。[Actions証跡](https://github.com/charukun/bloodline-legacy/actions/runs/34174723377)。
`completed=true`, handoff verifiedFiles=35/totalFiles=35、develop verifiedFiles=35/totalFiles=55、sourceOfTruth=developをログで確認。追加20ファイルはCI/CD設定・運用文書。指定handoff履歴の保持、生成物不在、main ref不変、PR #1 Open/未mergeもscriptで確認した。
初回照合stepは成功後に通常workflowから削除した。移行スクリプトと成功ログは保持。Repository variable VERIFY_INITIAL_HANDOFFはUI更新・削除が保存されずtrueのままだが、通常workflowから参照しないため動作に影響しない。後続WORKは不要変数として整理できる。通常開発時に元35ファイルの内容を固定し続けない。

DEV公開検証はcommit `f07c632db03af2d5cb2fb1f25e01431b8d4ff085` の [run #6](https://github.com/charukun/bloodline-legacy/actions/runs/34182505263) で成功。staging初期refは同じ完全SHAに作成しread-backした。以降の基盤文書更新ではゲーム内容を変更しない。

## 切替の成立条件（実施手順）

1. GitHub上でhandoff branchのHEAD、mainとの差分、PR #1、35ファイルを再取得して確認する。
2. 新規develop refを指定commitに作成する。既存developが見つかった場合は上書きしない。
3. develop refと35ファイルをGitHubから再取得し、基準との完全一致と生成物の不在を確認する。
4. このread-backが成功した時点で、Implementation Source of Truthを **develop** に切り替える。単に設定文書を作った段階では切り替え済みと報告しない。
5. developへCI/CD設定を反映し、Build/Test/DEV固定URLのWebGL smokeを成功させる。
6. 検証済みdevelopのcommitからstagingを作成し、STAGINGの公開検証を実施する。
7. mainにはProduction用インフラ・待機ページのみを導入できる。開発途中のゲームを無条件に入れない。

## 再開用の実行スクリプト

`deploy/migrate-branches.mjs` は認証済み `gh` が利用できる環境で実行する。tokenを引数やファイルへ書く必要はない。GitHub Actions内で--verify-developの実行成功を確認済み。

```bash
node deploy/migrate-branches.mjs --audit
node deploy/migrate-branches.mjs --verify-develop
```

auditとverify-developは読取のみ。初回内容を再監査する場合はverify-developを使用し、全35ファイルのblobを再取得してSHA256照合する。--developはdevelopが未作成の場合の初回作成専用で、既存developを上書きしない。main/handoff refとPR #1を保持する。途中で別WORKが変更した場合はその状態を調査し、forceで突破しない。

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
