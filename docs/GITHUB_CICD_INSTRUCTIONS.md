# GITHUB_CICD_INSTRUCTIONS — GitHub反映WORKの初回CI/CD作業

対象: `charukun/bloodline-legacy`（Private）。設計・コードは同梱済み。Cloudflare Desktop App/Pluginは不要。

## 現在地と完了条件

2026-09-08、CI/CD WORKが認証済みWeb UIで以下を実行・確認した。

- PR #1 `Import current Bloodline Legacy game handoff` はOpen/未merge、main向けのhistorical import PR。変更していない。
- `work/current-handoff` HEADは `383a1eef7adde83c22073c74982052b3a75a2b5c`。mainより13 commits/34ファイル追加。
- 同HEADから `develop` を作成し、GitHub画面で指定SHAへの一致をread-back確認した。その後CI/CD専用ファイルの追加を開始した。元ゲーム35ファイルへの変更なし。
- 全35ファイルの再取得・SHA256照合はGitHub Actions内で成功済み（commit `52409ba735fb495c10252bc9eb060ca351745d1b`、[run](https://github.com/charukun/bloodline-legacy/actions/runs/34174723377)）。handoff35/develop35の一致、履歴保持、生成物不在、main/PR #1保持を確認。正式Source of Truthはdevelop。Cloud BrowserのZIP取得制限は回避せず、外部転送なしの検証で完了した。
- staging未作成、mainはREADMEのみのまま。Cloudflareはセキュリティ検証画面で停止、Worker/URL/Secret未設定。
- 復旧ソースBuild、DEV/STAGING asset byte照合、本番待機ページBuild、基盤テスト5件はPASS。GitHub ActionsでもBuild/基盤5テスト/asset照合はPASS。WebGL smokeのガイド操作timeoutは修正後[run #3](https://github.com/charukun/bloodline-legacy/actions/runs/34175045157)でPASS。公開検証は未実施。

CI/CD設定20ファイルはdevelopへ反映済み。初回read-backも成功したため初回専用stepと追加PR読取権限を通常workflowから削除した。公開ゲートCICD_ENABLED=falseはread-back確認済み。残作業はCloudflare接続、DEV実URL検証、その後のstaging作成と本番待機基盤。

この文書の「未完了」は初回引継ぎ時点。必ず現在のGitHub状態を読み、既に反映されたファイルを重複commitしない。

## A. ソースの移行確認

利用可能な認証済みGitHub経路を使う。Connectorの404をRepository不存在と扱わない。同じ失敗経路を反復せず、認証済みWeb UI/CLI/integrationを使う。

1. main/handoff/develop/staging各ref、PR #1、既存workflowとHosting設定を読む。別WORKの追加があれば保持する。
2. `work/current-handoff` のHEADが指定SHAなら継続。進んでいれば最新内容を確認し、古い復旧ファイルで上書きしない。
3. developが存在しなければ指定SHAから新規refを作成する。既存developは保持。今回作成済みなので再作成・巻戻しは不要。
4. developが指定SHAを祖先に持つこと、元35ファイルの内容一致、不要な生成物不在を検証する。

認証済み `gh` とNodeがある場合、同梱設定をcheckoutへ配置して次を実行する（Secret値は引数不要）。

```bash
node deploy/migrate-branches.mjs --audit
node deploy/migrate-branches.mjs --verify-develop
```

未作成の場合のみ `node deploy/migrate-branches.mjs --develop` を使う。verify-developは書込せず、履歴の祖先関係と全35 blobを再取得して `docs/RECOVERY_SOURCE_SHA256.json` のSHA256/bytesと照合する。`deploy/evidence/migration/verify-develop.json` のcompleted=trueとverifiedFiles=35を確認。refが照合中に進んだら停止して再監査する。

初回はGitHub Actions内の一時的なread-back stepで成功した。このstepは通常workflowから削除済み。再監査が必要な場合は上記CLI scriptを使用する。

または同じ検証を認証済み経路で実施する。Git treeのrecursive一覧で元35パスを確認し、blobを再取得しSHA256/bytesを照合する。追加CI/CDファイルは許容するが、元ゲーム35ファイルの一致と `dist/`, `node_modules/`, `deploy/out/`, `deploy/evidence/` の不在を確認する。主要ファイルは `build.mjs`, `package.json`, `src/bootstrap.js`, `src/render/renderer-base.js`, `public/assets/village-kit.glb`。単なるbranch名表示だけで全ファイルread-back成功と報告しない。

成功した時点で `docs/BRANCH_STRATEGY.md` に検証SHAと日時を記録し、**develop = 正式なDevelopment / Implementation Source of Truth** に切り替える。通常実装セッションもdevelopを取得する。

## B. 追加ファイルと配置先

配布ZIPの相対パスをRepositoryルートへそのまま配置する。既存ファイルがあれば差分を読み統合し、ゲーム35ファイルを入れ替えない。

| 配置先 | 内容 |
| --- | --- |
| `.github/workflows/deploy.yml` | Build/Test → Deploy → 公開WebGL smokeのworkflow |
| `deploy/.gitignore` | out/evidence/node_modules/local Secretsの除外 |
| `deploy/package.json`, `deploy/package-lock.json` | Node24、固定Wrangler/Playwright依存 |
| `deploy/config.mjs` | branchと環境の固定mapping |
| `deploy/build.mjs`, `deploy/check-build.mjs` | 原buildを使う配信物生成、JS/asset byte検証 |
| `deploy/worker.mjs` | 現版のオフラインAPI応答、環境情報 |
| `deploy/wrangler.dev.json` | bloodline-legacy-dev、out/dev、APP_ENV=dev |
| `deploy/wrangler.staging.json` | bloodline-legacy-staging、out/staging、APP_ENV=staging |
| `deploy/wrangler.production.json` | bloodline-legacy-production、out/production、APP_ENV=production |
| `deploy/release.json` | 初期production=false。本番は待機ページ |
| `deploy/smoke.mjs`, `deploy/infrastructure.test.mjs` | 公開/ローカルWebGL smoke、基盤5テスト |
| `deploy/migrate-branches.mjs` | 初回branch移行と全35ファイルread-back |
| `docs/DEPLOYMENT.md`, `docs/BRANCH_STRATEGY.md` | 配信運用・正式branch方針 |
| `docs/GITHUB_WORK_HANDOFF.md`, `docs/GITHUB_CICD_INSTRUCTIONS.md` | 通常反映と初回作業の手順 |
| `docs/RECOVERY_SOURCE_SHA256.json` | 元35ファイルの検証manifest |

`DELIVERY_MANIFEST.json`は配布検証用。Repositoryへのcommitは必須でない。zip本体、復旧ソースコピー、node_modules、生成HTML、スクリーンショット、Secretはcommitしない。

## C. GitHub Repository Settings

- Settings → Actions → General: Actionsを有効にし、`actions/checkout`, `setup-node`, `upload-artifact`, `download-artifact` の実行を許可。通常workflowはcontents:readのみを使用する。不要なwrite権限を付けない。
- Settings → Secrets and variables → Actions → Variables: 下表のRepository variablesを登録。
- 同ページのSecrets: 下表のRepository secretsを登録。値をsource/チャット/ログへ貼らない。
- `CICD_ENABLED` は初期false。Cloudflare既存資産確認、全URL確認、Secrets登録、ソース照合が完了してからtrue。
- default branch mainは変更不要。実装の参照先は文書でdevelopと指定する。
- 利用プランで可能ならstaging/mainのbranch rulesでPRとBuild and verifyを要求する。有料機能導入や請求承認を勝手に行わない。

| 種別 | 名称 | 値の決定元 |
| --- | --- | --- |
| Variable | CICD_ENABLED | 初期false、接続準備完了後true |
| Variable | CLOUDFLARE_ACCOUNT_ID | 対象Cloudflare accountの実ID |
| Variable | FIXED_URL_DEV | DEV Workerの実在workers.dev固定URL |
| Variable | FIXED_URL_STAGING | STAGING Workerの実在workers.dev固定URL |
| Variable | FIXED_URL_PRODUCTION | PRODUCTION Workerの実在workers.dev固定URL |
| Secret | CLOUDFLARE_API_TOKEN_DEV | 対象accountのWorkers配信用token |
| Secret | CLOUDFLARE_API_TOKEN_STAGING | STAGING用token |
| Secret | CLOUDFLARE_API_TOKEN_PRODUCTION | PRODUCTION用token |

環境別token名は分けるが、Cloudflare Workers権限はaccount単位となることがある。名前の違いだけでWorker単位のIAM分離とは扱わない。

## D. Cloudflareとの接続順序

採用方式はGitHub Actions → Cloudflare Workers Static Assets、独立した3 Worker。Cloudflare側Git自動Buildを同時に有効にして二重配信しない。Private GitHubソースの取得はActionsのGITHUB_TOKENが担当するためCloudflareのGitHub App authorizationは本方式には必須ではない。

CI/CD WORK側でDashboardのセキュリティ検証/ログイン完了後、対象account、既存Workers/Pages/domain、名前の衝突、workers.dev subdomainを調査する。衝突がなければ下記3 WorkerのURLを確定しGitHub Variablesへ登録する。既存Productionを置換しない。

| Branch | 環境 | Worker |
| --- | --- | --- |
| develop | DEVELOPMENT | bloodline-legacy-dev |
| staging | STAGING | bloodline-legacy-staging |
| main | PRODUCTION | bloodline-legacy-production |

subdomainは推測しない。独立hostnameによりlocalStorageのセーブを隔離する。DB/API/storage/analytics/SWを今回のために追加しない。

## E. Build、DEV公開、STAGING作成

```bash
npm ci --prefix deploy --ignore-scripts --no-audit --no-fund
npm test --prefix deploy
node deploy/build.mjs dev
node deploy/check-build.mjs dev
deploy/node_modules/.bin/playwright install --with-deps chromium
node deploy/smoke.mjs dev --local
```

原ゲームbuildは `node build.mjs`、出力 `dist/index.html`。配信対象はadapter生成の `deploy/out/dev/` のみ。元package.jsonのplaceholder testを本テストと取り違えない。

1. 上記設定をdevelopへcommit/push。まずBuild and verify成功を確認する。
2. Cloudflareの準備完了後CICD_ENABLED=trueとし、developへ検証記録等の通常commitをpush。手動Run workflowはCIのみなので初回Deployの起点にしない。
3. pushした**完全なSHA**の `Bloodline Legacy CI and deployment` を確認。Build and verify、Deploy and verify devの両方successが必要。skippedを成功扱いしない。
4. Actions summaryのDEV固定URLを開く。version.jsonのcommit=push SHA、environment=dev、mode=game、HTML hashを確認。
5. 一族画面→開始→ガイド→ゲーム/HUD。WebGL2、console/page/network error、画像decode、画面表示、mobile393×852を確認。smoke artifactのJSONとPNGを確認し結果を記録する。
6. **DEV検証成功後のみ**次を実行しstagingを現在の検証済みdevelop SHAから作成する。

```bash
node deploy/migrate-branches.mjs --staging
```

この初回スクリプトは同SHAの成功ActionsとDEV公開version/hashを確認する。既存stagingと不一致なら強制更新しない。staging pushによるBuild/Test/Deploy and verify staging成功と固定STAGING URLのゲーム起動を確認する。

## F. mainのProduction基盤

mainへゲームをmergeしない。CI/CD専用の上記ファイルだけをmainからの新しい基盤branchに追加する。PR #1は使わない。production=falseでBuild/Testを通し、インフラ専用差分（src/public/build.mjs/package.json等のゲーム追加がない）を確認してmainへ通常反映する。mainへのpushがProduction待機ページのみを配信する。固定URLで待機文、version.environment=production、mode=holding、commitを確認する。

初回正式リリースは別の明示的な昇格指示で、検証済みstagingのゲームをmainへ昇格しproductionをboolean trueに変更する。DEV/STAGING反映に伴う自動Production昇格は行わない。

## G. GitHubへの反映後のread-back

1. GitHubからbranch/ref、workflow全内容、deploy/14ファイル、docs/5ファイルを再取得し、手元の配布manifestと内容照合。上記全パスが配置先どおりか確認。
2. --verify-developを実行し元35ファイルが保持されていることを再確認。
3. source/workflowsにSecret値や不要生成物がないことを確認。
4. historical handoffのHEADとPR #1 Open/未merge、mainの意図しないゲーム追加なしを確認。
5. docsの実績欄へ各SHA、run URL、固定URL、Build/Test/公開smoke結果を記録。

## H. 失敗・日常反映・禁止事項

Build/Test失敗時はneeds:buildでDeployを止める。失敗assertを削除して通さず、原因修正→push→再検証。公開後smoke失敗は配信済みの場合があるため昇格を止め、原因修正または対象branchへの新しいrevert commitで復旧する。古いworkflow再実行はcurrent HEAD guardで拒否する。

通常のGitHub反映WORKは、handoff差分→develop→同SHAのCI/DEV→固定URL→ゲームsmoke→結果報告まで。staging/mainは別途昇格指示がある時だけ。

禁止: force push、history rewrite、branch削除、PR #1の勝手なmerge/close、mainへの開発版直接投入、既存Production/domain/data破壊、Secret埋込み。404をRepository不存在と断定しない。

最新CI実績: commit `ec44df84d04ab1a31756f7a35a399db033ddac8a`、[run #3](https://github.com/charukun/bloodline-legacy/actions/runs/34175045157)、Build/Test/ローカルWorkers配信のdesktop/mobile WebGL smoke PASS。公開ゲートfalseのためDeploy skipped。固定URLでの公開検証は未実施。

設定上の残件: Repository variable VERIFY_INITIAL_HANDOFF=trueが残っている。Web UIでの値更新・削除が保存されなかったため、完了済みの初回専用stepをworkflowから削除して参照を終了した。この変数は通常CI/CDに影響しない。後続WORKで不要変数として整理できる。
