# GitHub反映WORKへの追加指示

対象: `charukun/bloodline-legacy` / Bloodline Legacy（血脈の系譜）。

完了済みの初回移行の基準はcommit `383a1eef7adde83c22073c74982052b3a75a2b5c`。`BRANCH_STRATEGY.md` と `deploy/migrate-branches.mjs` でdevelop作成と全35ファイルread-backを完了し、正式なImplementation Source of Truthはdevelopへ切替済み。mainはProduction、stagingはPre-production、work/current-handoffは初期搬入のhistorical branchとする。

**DEVは固定URLへの自動公開と公開後PC/モバイルWebGL smokeに成功。stagingは検証済みDEVから作成済み。STAGING/PRODUCTIONの公開は専用Secret登録待ち。実績はDEPLOYMENT.mdを参照。**
初回作業の正確な順序・反映一覧は `GITHUB_CICD_INSTRUCTIONS.md` を使用してください。
通常の開発反映は以下のDEV運用を使う。STAGING/PRODUCTIONの初回接続は `DEPLOYMENT.md` の残作業に従い、DEV成功と全3環境完成を区別する。

## 初回の設定反映

1. 最新Repositoryを認証付きで取得し、branch/commit/workflows/既存Hostingを調査する。
2. 復旧35ファイルは `RECOVERY_SOURCE_SHA256.json` にハッシュ記録済み。最新GitHubとの差を確認し、古いゲームコードを上書きしない。
3. 今回の配布物は新規の `.github/workflows/deploy.yml`, `deploy/`, `docs/` のみ。ゲームソース35ファイルは含めず、変更しない。
4. 同名設定が既にある場合は盲目的に上書きせず統合する。`work/current-handoff` の既存PRを勝手にmainへmergeしない。
5. `develop`/`staging`を安全に用意し、配信先とSecretsを設定する。環境ごとの接続確認が完了するまで、対応するCICD_ENABLED_DEV / CICD_ENABLED_STAGING / CICD_ENABLED_PRODUCTIONをtrueにしない。
6. 本番初期値は `deploy/release.json` のproduction=false。本番基盤と待機URLは用意するが開発版を正式公開しない。
7. `docs/DEPLOYMENT.md` の実績欄を更新し、接続済みURLと検証commitを記録する。

## 基盤完成後の通常反映

1. implementation handoffの基準commit・全対象ファイル・build/test結果を確認する。
2. 現在のdevelopとの差を確認してhandoffを反映。今回のCI/CD設定やSecrets名を過去のhandoffで巻き戻さない。
3. 通常更新先は **develop**。pushした完全なcommit SHAを記録する。
4. そのSHAの `Bloodline Legacy CI and deployment` を確認する。単に最新のgreenなrunがあるだけでは不十分。
5. `Build and verify` と `Deploy and verify dev` の両jobがsuccessであることを確認。skipped / queued / cancelled は公開完了としない。
6. Actions summaryのDEV固定URLを開き、`version.json` のcommitがpushしたSHAと同じか確認する。
7. 一族画面 → 開始 → ガイド → ゲーム/HUDに到達。WebGL描画、主要asset、console/page error、mobile viewportを確認し、smoke artifactも確認する。
8. branch、commit、Actions run URL、deploy job結果、DEV固定URL、検証結果、未解決事項を報告する。

STAGING / PRODUCTIONへは通常反映から自動昇格させない。別の明示的な昇格指示と検証結果に基づいて行う。

## 必須の失敗時動作

- Build / test失敗: deployしない。修正→push→再検証。
- 公開後smoke失敗: 完了と報告しない。対象環境を確認して原因修正またはrevertし、再検証。
- current HEAD不一致: 古いrunを再公開せず、現在HEADを再検証。
- ゲームコードのArchitectureが更新され、単一HTML/埋込asset方式でなくなった場合: 配信build/check-build/smokeを新方式に更新する。旧assertを削除して成功扱いにしない。

## 反映しないもの

`dist/`, `deploy/out/`, `deploy/node_modules/`, `deploy/evidence/`, `.wrangler/`, cache、一時ログ、元Visual Reference、Secret値。

削除、force push、Git履歴改変、既存branch削除、既存Production/domain解除は行わない。
