# Bloodline Legacy / 血脈の系譜 — Deployment運用

状態: **develop移行/read-back完了・CI/CD設定反映済み・Cloudflare接続待ち・未公開**。2026-09-08 JST。
この文書と設定の存在をCI/CD構築完了と扱わないこと。

## 調査範囲とSource of Truth

GitHubの正本は `charukun/bloodline-legacy`（Private）。Connectorは404だったが、認証済みGitHub Web UIでRepository、PR #1 Open/未merge、handoff HEAD `383a1eef7adde83c22073c74982052b3a75a2b5c`、mainとの差分（13 commits、34追加ファイル、2677行追加）を確認した。READMEを含め35ファイルという別WORKの確認情報と整合する。

2026-09-08にWeb UIでdevelopを同じcommitから作成し、作成後のdevelop HEADが指定commitと完全一致することを確認した。その後、配信用設定をdevelopへ追加している。ゲームソースは変更していない。全35ファイルの再取得・SHA256照合はGitHub Actions内で成功した。検証commit `52409ba735fb495c10252bc9eb060ca351745d1b`、[実行証跡](https://github.com/charukun/bloodline-legacy/actions/runs/34174723377)。ZIPダウンロードはCloud BrowserのURLポリシーで拒否されたが、ソースを外部へ転送せずActions内でGitHubの全blobを再取得する安全な方式で完了した。正式なDevelopment / Implementation Source of Truthは **develop**。原35ファイルはすべて保持され、追加20ファイルはCI/CD設定と文書。

Cloudflare ChatGPT Desktop App/Pluginは使用しない。Cloudflare Dashboardへ到達したが「セキュリティ検証の実行」で停止。アカウント内部、既存Worker/Pages/domain、subdomain、tokenは未確認。人間によるセキュリティ検証・ログインの完了が必要。

Project Sourcesの実装プロンプトを確認し、復旧用 `/bloodline-legacy/work-handoff/current/` の35ファイルを取得して調査・ビルドした。添付のstandalone HTMLも確認した。Visual Referenceの再設計・ゲーム改変は今回の対象外。

| 項目 | 復旧ソースで確認した事実 |
| --- | --- |
| 構成 | `src/`, `public/assets/`, `build.mjs`, `tests/smoke.py`, `tools/generate_assets.py` |
| ビルド | Node標準機能のみ。`node build.mjs`。npm依存なし |
| 成果物 | `dist/index.html`、1,819,339 bytes。19モジュールを結合 |
| 描画 | 独自WebGL2。Three.js依存なし。GLSLはHTML内 |
| アセット | GLB 1点、PNG 4点をbase64埋め込み。別途ラベル画像もコード内 |
| 音声 | Web Audioで生成。外部音源ファイルなし |
| 保存 | localStorage、prefix `aerin.tactics.v3.` |
| API | 任意のオンライン用health/join/command/SSE呼出あり。サーバー実装はhandoffになし |
| ルーティング | `/` 内の画面切替。URLルーターなし |
| SW / Analytics / DB | 対象35ファイル内に実装・bindingなし |
| 環境変数 | ゲームの必須環境変数なし |
| 既存テスト | Python Playwrightのsmoke。`package.json` のtestは初期placeholderで常に失敗する |
| CI・Hosting設定 | 復旧ソース内にはなし。GitHub・アカウント側の有無は未確認 |

## 方式選定

復旧ソースに適合する実装案は **GitHub Actions → Cloudflare Workers Static Assets（3 Worker）**。最新GitHubと既存Hostingの確認後に採用を確定する。

| 候補 | 今回の適合性 |
| --- | --- |
| Workers Static Assets + Actions | 静的WebGL配信、独立したWorker名とURL、成功したテスト成果物のみ配信、必要時にAPI bindingを追加可能 |
| Cloudflare Pages | 静的配信とbranch aliasに適合。3環境を同等に分けるなら3 projectsが明快。現構成に対する決定的優位はない |
| GitHub Pages | 1 repositoryあたり1 siteが基本。3固定環境とPrivate repoの料金条件に合いにくい |
| Vercel | 静的配信可能。Hobbyは非商用個人用途のため将来商用化の費用条件を別途確認する必要あり |

Workersの静的アセット配信リクエストは無料・無制限と案内されているが、`/api/health`などWorker実行分は別の枠。Private repoのGitHub Actionsにはプランごとの実行時間・保存枠がある。請求設定変更・有料契約は行っていない。モバイルは同じCDN/HTTPS配信を利用し、実GPU性能はHosting選択だけでは保証しない。

公式資料（2026-09-08 JST確認）:

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [静的アセットの料金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [WorkersのGitHub Actions連携](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Workers環境分離](https://developers.cloudflare.com/workers/wrangler/environments/)
- [キャッシュ・MIMEヘッダー](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Pages Previewとbranch alias](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [GitHub Pagesのサイト数・Private repo条件](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHubプランとActions枠](https://docs.github.com/get-started/learning-about-github/githubs-products)
- [Vercel Hobby条件](https://vercel.com/docs/plans/hobby)

## 環境と固定URL

| 環境 | Branch | Worker名（設定済み、クラウド作成は未実施） | 実在確認済み固定URL | 状態 |
| --- | --- | --- | --- | --- |
| DEV | develop | bloodline-legacy-dev | 未取得 | 未公開 |
| STAGING | staging | bloodline-legacy-staging | 未取得 | 未公開 |
| PRODUCTION | main | bloodline-legacy-production | 未取得 | 待機ページ設定のみ、未公開 |

Cloudflareが返す各Workerの `workers.dev` URLを確定後、下記 `FIXED_URL_*` に登録する。URLに推測のaccount subdomainを入れない。同一originのパスで3環境を作らない。

3つのホスト名が異なるためlocalStorageはブラウザのorigin単位で分離される。既存キーと既存セーブ内容は変更しない。APIプロキシ、Cookie共有、DB共有、Service Workerは追加しない。`/api/health` は `{online:false, environment:...}` を返し、欠落した共有サーバーの稼働を偽装しない。他の `/api/*` は501。オンライン機能が必要になった時点で別途サーバーを設計し、環境別bindingを設定する。

## GitHub設定（未登録）

Private repoの有料Environments機能を必須にしない構成。設定場所はRepositoryの **Settings → Secrets and variables → Actions**。環境ごとにSecret名を分ける。

| 種別 | 名前 | 用途 |
| --- | --- | --- |
| Variable | CICD_ENABLED | 初期は未設定/false。既存環境調査・接続設定完了後にtrue |
| Variable | CLOUDFLARE_ACCOUNT_ID | 対象アカウントID。Secret値ではない |
| Variable | FIXED_URL_DEV | 実在確認したDEV固定URL |
| Variable | FIXED_URL_STAGING | 実在確認したSTAGING固定URL |
| Variable | FIXED_URL_PRODUCTION | 実在確認したPRODUCTION固定URL |
| Secret | CLOUDFLARE_API_TOKEN_DEV | DEV配信用トークン |
| Secret | CLOUDFLARE_API_TOKEN_STAGING | STAGING配信用トークン |
| Secret | CLOUDFLARE_API_TOKEN_PRODUCTION | PRODUCTION配信用トークン |
| Worker変数 | APP_ENV | 各wrangler設定でdev/staging/productionを指定 |

Cloudflare tokenは指定アカウントのWorkers Scripts編集に必要な最小権限で作成し、値はGitHub Secretsへ直接登録する。ゲームJSやチャットへ貼らない。Workers編集tokenはアカウント内の他Workerにも権限が及ぶ場合があるため、トークン名の分離自体をIAMによる完全分離とは説明しない。Repositoryへの書込者・workflow改変者は信頼できる人に限定する。利用中GitHubプランが対応する場合はbranch rulesとproduction Environmentのmain制限を追加可能。

## 初回セットアップ再開手順

1. `GITHUB_CICD_INSTRUCTIONS.md` に従い、利用可能な認証経路でRepositoryの全branch、commit、workflows、設定、既存Hosting・domain・API依存を調査する。ソースが復旧版と違う場合は配置方式とsmokeを最新構成に合わせる。
2. 全35ファイルのSHA256を `RECOVERY_SOURCE_SHA256.json` と照合し、最新ゲームを持つbranchを確定する。現在のmainがゲームを含まない場合はmainの内容だけを最新版と扱わない。
3. `develop` がない場合は確認済みゲームcommitから新規作成する。存在する場合は更新を破壊せず差分統合する。`staging` はDEVで検証したcommitから作成する。`main`は既存履歴を保つ。
4. このhandoffの新規設定を衝突確認して適用する。既存PR #1は勝手にmergeしない。mainにインフラだけを導入する場合、production待機ページはゲームソースなしでもビルド可能。
5. Cloudflareの既存Workers・Pages・domainsを一覧し、同名衝突がないことを確認。対象accountのworkers.dev subdomainを確認し、3 Workerの固定URLを確定する。独自domainや既存Productionに触れない。
6. GitHubの上記Variables/Secretsを登録。必要な権限付与・ログインは人間操作が必要。Cloudflare側のGit連携ビルドは併用せず、Actionsを唯一の自動デプロイ元にする。
7. `CICD_ENABLED=true` とした後、developへの設定commit/pushでCIを起動。Build → local WebGL smoke → deploy → fixed URL smokeの全ステップ成功を確認する。
8. 合格したdevelopからstagingへ明示的に昇格し、同じ検証を行う。
9. mainへインフラを導入して本番待機ページを配信。実在固定URLで待機画面とversionを確認する。`deploy/release.json` のproductionはfalseを維持し、現開発版は正式公開しない。
10. 公開URLを通常ブラウザでも開き、ゲーム画面のスクリーンショットを目視確認する。本書の未取得URL・未実施欄を実績に置き換える。

## Build / Test / Deploy

Node 24。配信用依存だけを `deploy/` に分離し、package-lockで固定。

```bash
npm ci --prefix deploy --ignore-scripts --no-audit --no-fund
npm test --prefix deploy
node deploy/build.mjs dev
node deploy/check-build.mjs dev
deploy/node_modules/.bin/playwright install --with-deps chromium
node deploy/smoke.mjs dev --local
```

`staging` / `production` も同じ引数体系。元のゲームビルドは `node build.mjs`。配信対象は **deploy/out/環境名/** のみ。リポジトリ全体や `public/` 全体を公開しない。GLB等はHTML内に含まれ、配信時に再生成しない。

通常の更新はbranch pushだけで行う。Workflowは `.github/workflows/deploy.yml`。`feature/**` とPRはCIのみ。手動Run workflowもCIのみ。Preview deploymentは3固定環境完成を優先して無効。

Build/Test失敗時は `needs: build` によりDeploy jobが実行されない。workflowに `continue-on-error` はない。古い実行の再実行はremote branch HEADとの不一致でデプロイ前に停止する。CIで生成・テストしたartifactをそのまま配信し、配信job内でゲームを再ビルドしない。

`deploy/release.json` の `production:false` は本番待機ページ専用。正式公開時だけ、STAGINGで承認されたゲームをmainへ昇格し、この値をboolean trueにする。手動workflow実行やdevelop pushで本番が更新されることはない。

## 昇格とRollback

- DEV → STAGING: DEVの固定URLと対象commitの成功を確認し、developからstagingへのPRまたは通常mergeで明示昇格。stagingへのpushがSTAGINGだけを更新する。
- STAGING → PRODUCTION: STAGINGの対象commitと検証成果物を確認後、stagingからmainへ明示昇格する。初回正式公開だけrelease.production=trueが必要。通常のhandoff反映WORKではこの昇格を行わない。
- Rollback: 対象branchへ不具合commitのrevertを新しいcommitとしてpushし、同じCI/CDを通す。force push、resetによるremote履歴書換、branch削除をしない。
- 緊急のWorker version rollbackを使う場合も対象環境を厳密確認し、その後同じ内容をbranchへrevertして次の自動更新と整合させる。セーブの削除・書換はRollbackに含めない。
- 公開後smokeが失敗した場合、workflowは失敗になるが、すでに公開されたWorkerは自動では戻らない。昇格を止め、対象branchのrevertまたは確認済みWorker versionへ戻して再検証する。

## Verificationとキャッシュ

`deploy/smoke.mjs` はローカルWorkersと公開URLで同じ配信物を検証する。公開検証は `FIXED_URL` を指定して実行。各ブラウザcontextは新規であり、既存ユーザーのセーブを読まない。現構成にはオンラインの保存先がないためテストはlocalStorage内で完結する。

確認項目: HTML 200 / text/html、version.json、期待commit、HTML SHA256、no-cache、dev/staging noindex、オフラインhealth JSON、未知GLBの404、未知APIの501、WebGL2 context、frame進行、通常ボタンによる開始・ガイド通過・HUD表示、framebufferの複数色、画像decode、1280×800 / 393×852、横はみ出し、console/page/network/HTTP error、スクリーンショット。

GLB・textures・shadersは元HTMLの埋込バイト列が保たれているかbuild検証し、ブラウザ起動時にdecode/compileを確認する。独立GLBリクエスト、外部Three.js/CDN、外部音源、CORSは現ビルドでは発生しない。SPA fallbackは設けずmissing assetをHTML 200で隠さない。Worker以外の静的ファイルのMIMEとHTTP圧縮はCloudflare側の配信機能を利用する。現時点で公開URLのContent-Encoding実測は未実施。

すべての配信静的ファイルに `Cache-Control: no-cache` を指定し、毎回再検証する。WorkersのETagと組み合わせる。ゲームが単一HTMLに内包されるため、hashed JSへの分割を今回だけのために追加しない。将来分割ビルドへ変わる時点でhashed assets + immutableへ移行する。Service Workerは追加しない。

## 障害時

| 症状 | 確認箇所 |
| --- | --- |
| GitHub 404 | Private repoの認証・選択repo権限・対象branch。不存在と即断しない |
| CIが起動しない | workflowがpush先branchにあるか、Actions有効化、イベント条件 |
| Deployがskipped | Build結果、CICD_ENABLED、push先branch。PR/手動実行では正常な挙動 |
| Cloudflare認証失敗 | 環境別token名、account ID、token scope、有効期限 |
| Current HEAD不一致 | 古いcommitの再実行。現在HEADを検証し直す |
| 更新されない | version.jsonのcommit、HTML hash、no-cache、固定URLとWorker名、別途存在するSW/CDNルール |
| Asset decode/GLSL失敗 | check-buildのバイト照合、browser console、対応WebGL2環境 |
| API 501 | 現版に共有サーバーはない。DEVを本番APIへ向けて回避しない |
| Smoke失敗 | artifactのsmoke.jsonとPNG。SwiftShaderの描画結果を実機FPS評価に用いない |

## 今回の実測

- 復旧35ファイルの取得、原ビルド: PASS。
- DEV/STAGINGの配信HTMLと原ビルドの完全一致、JS構文、GLB/画像byte一致: PASS。
- 本番待機ページのビルド、ゲーム混入なし: PASS。
- branch/event誤配信防止、environment config、API分離、本番release gate、ビルド失敗時の古い配信物除外: Nodeテストで検証。
- GitHub Actions: 初回read-back、依存インストール、基盤5テスト、ゲームBuild、埋込asset検証はPASS。WebGL smokeはガイド操作の30秒timeoutを検出し、CIの操作待機時間と失敗証跡を修正後、[run #3](https://github.com/charukun/bloodline-legacy/actions/runs/34175045157)でPASS。失敗runのDeployはskipped。
- Wrangler DEV dry-run: 設定・asset4ファイル・bindingの読込とdry-run終了メッセージまで確認。ただしその後のネットワーク許可処理でセッションがキャンセルされ、正常終了コードは未取得。
- ローカルWrangler起動/CLI認証確認: ネットワーク許可が決定前にキャンセルされたため完了せず。
- Cloud BrowserからscratchローカルURLは `net::ERR_BLOCKED_BY_CLIENT`。Actions内のWrangler/ChromiumでHTMLとWebGL起動を確認。ゲーム/HUD・mobile393×852/desktop1280×800、framebuffer、Console/page/network/HTTP error検証は[run #3](https://github.com/charukun/bloodline-legacy/actions/runs/34175045157)でPASS。
- GitHub Web UI: Private/PR #1/handoff HEADを確認。develop作成後、指定commitの一致を確認。配信用設定をdevelopへ導入。
- 全35ファイルread-back: **PASS**。3 Worker作成、固定URL、Cloudflare接続、公開後検証: **未実施**。

最新CI実績: commit `ec44df84d04ab1a31756f7a35a399db033ddac8a`、[run #3](https://github.com/charukun/bloodline-legacy/actions/runs/34175045157)、Build/Test/ローカルWorkers配信のdesktop/mobile WebGL smoke PASS。公開ゲートfalseのためDeploy skipped。固定URLでの公開検証は未実施。

設定上の残件: Repository variable VERIFY_INITIAL_HANDOFF=trueが残っている。Web UIでの値更新・削除が保存されなかったため、完了済みの初回専用stepをworkflowから削除して参照を終了した。この変数は通常CI/CDに影響しない。後続WORKで不要変数として整理できる。
