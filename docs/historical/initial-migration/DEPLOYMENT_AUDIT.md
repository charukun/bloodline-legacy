# HISTORICAL — docs/DEPLOYMENT.md（初回移行記録）

> 2026-09-08の初期搬入・配信構築時点の記録。以下の命令形、PR状態、SHA、権限・接続・検証結果は当時のものです。現在の実行指示や成功証拠ではありません。
> 通常作業からこの手順を再実行せず、必要な来歴調査時だけ参照してください。現行の入口は[文書案内](../../README.md)です。

原パス: `docs/DEPLOYMENT.md`。移行時の本文を以下に保存します。

---

# Current online/update architecture

The original deployment audit below describes the pre-server baseline. The current API, environment-isolated Durable Object, save schema 4, rollout gate and required compatibility checks are defined in [Live Update](../../live-update/README.md). The former API 501 behavior remains only when the world binding is unavailable; production holding mode does not open a shared world.

# Bloodline Legacy / 血脈の系譜 — Deployment運用

状態: **develop移行/read-back完了。DEV・STAGINGの固定URLで公開WebGL smoke成功。PRODUCTIONの固定URLで待機ページ公開・smoke成功。3環境の自動配信を接続済み**。2026-09-08 JST。ゲームの正式Productionリリースは実施していない。

## 調査範囲とSource of Truth

GitHubの正本は `charukun/bloodline-legacy`（Private）。Connectorは404だったが、認証済みGitHub Web UIでRepository、PR #1 Open/未merge、handoff HEAD `383a1eef7adde83c22073c74982052b3a75a2b5c`、mainとの差分（13 commits、34追加ファイル、2677行追加）を確認した。READMEを含め35ファイルという別WORKの確認情報と整合する。

2026-09-08にWeb UIでdevelopを同じcommitから作成し、作成後のdevelop HEADが指定commitと完全一致することを確認した。その後、配信用設定をdevelopへ追加している。ゲームソースは変更していない。全35ファイルの再取得・SHA256照合はGitHub Actions内で成功した。検証commit `52409ba735fb495c10252bc9eb060ca351745d1b`、[実行証跡](https://github.com/charukun/bloodline-legacy/actions/runs/34174723377)。ZIPダウンロードはCloud BrowserのURLポリシーで拒否されたが、ソースを外部へ転送せずActions内でGitHubの全blobを再取得する安全な方式で完了した。正式なDevelopment / Implementation Source of Truthは **develop**。原35ファイルはすべて保持され、追加20ファイルはCI/CD設定と文書。

Cloudflare ChatGPT Desktop App/Pluginは使用しない。Cloud Browserはセキュリティ検証がループするため、ユーザーの通常Chromeからアカウント設定を実施。Workers & Pagesの提供スクリーンショットでプロジェクト未作成、account ID `980d243c0a980bdc2ddbbee89e901db5`、subdomain `c-okamoto.workers.dev` を確認。3環境のtokenはユーザーがGitHub Secretsへ直接登録し、3つのSecret名の存在をWeb UIでread-back確認した。token値の取得・表示は行わない。

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
| CI・Hosting設定 | 復旧ソース内にはなし。GitHubの既存CIなし、ユーザーのWorkers & Pages画面で既存プロジェクトなしを確認 |

## 方式選定

採用方式は **GitHub Actions → Cloudflare Workers Static Assets（3 Worker）**。最新GitHubとWorkers & Pagesの状態を確認し、DEVの自動デプロイと公開後WebGL smokeに成功した。

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

| 環境 | Branch | Worker名 | 固定URL（公開状態は右列） | 状態 |
| --- | --- | --- | --- | --- |
| DEV | develop | bloodline-legacy-dev | https://bloodline-legacy-dev.c-okamoto.workers.dev | 公開済み・公開後WebGL smoke PASS |
| STAGING | staging | bloodline-legacy-staging | https://bloodline-legacy-staging.c-okamoto.workers.dev | 公開済み・公開後WebGL smoke PASS |
| PRODUCTION | main | bloodline-legacy-production | https://bloodline-legacy-production.c-okamoto.workers.dev | 待機ページ公開済み・公開後smoke PASS（正式ゲーム未公開） |

実際のaccount subdomainを確認し、下記 `FIXED_URL_*` の登録値をGitHubから再取得して一致を確認済み。3つの公開URLを実際に開き、CIの公開後検証の成功も確認した。同一originのパスで3環境を作らない。

3つのホスト名が異なるためlocalStorageはブラウザのorigin単位で分離される。既存キーと既存セーブ内容は変更しない。APIプロキシ、Cookie共有、DB共有、Service Workerは追加しない。`/api/health` は `{online:false, environment:...}` を返し、欠落した共有サーバーの稼働を偽装しない。他の `/api/*` は501。オンライン機能が必要になった時点で別途サーバーを設計し、環境別bindingを設定する。

## GitHub設定

Private repoの有料Environments機能を必須にしない構成。設定場所はRepositoryの **Settings → Secrets and variables → Actions**。環境ごとにSecret名を分ける。

| 種別 | 名前 | 用途 |
| --- | --- | --- |
| Variable | CICD_ENABLED_DEV / CICD_ENABLED_STAGING / CICD_ENABLED_PRODUCTION | 各環境の公開スイッチ。対象環境の接続準備完了後にtrue。未設定/falseはその環境だけDeployを停止 |
| Variable | CLOUDFLARE_ACCOUNT_ID | 対象アカウントID。Secret値ではない |
| Variable | FIXED_URL_DEV | 実在確認したDEV固定URL |
| Variable | FIXED_URL_STAGING | STAGING固定URL（公開検証済み） |
| Variable | FIXED_URL_PRODUCTION | PRODUCTION固定URL（待機ページ公開検証済み） |
| Secret | CLOUDFLARE_API_TOKEN_DEV | DEV配信用トークン |
| Secret | CLOUDFLARE_API_TOKEN_STAGING | STAGING配信用トークン |
| Secret | CLOUDFLARE_API_TOKEN_PRODUCTION | PRODUCTION配信用トークン |
| Worker変数 | APP_ENV | 各wrangler設定でdev/staging/productionを指定 |

Cloudflare tokenは指定アカウントのWorkers Scripts編集に必要な最小権限で作成し、値はGitHub Secretsへ直接登録する。ゲームJSやチャットへ貼らない。Workers編集tokenはアカウント内の他Workerにも権限が及ぶ場合があるため、トークン名の分離自体をIAMによる完全分離とは説明しない。Repositoryへの書込者・workflow改変者は信頼できる人に限定する。利用中GitHubプランが対応する場合はbranch rulesとproduction Environmentのmain制限を追加可能。

## 初回セットアップ手順（完了項目は再実行不要）

1. `GITHUB_CICD_INSTRUCTIONS.md` に従い、利用可能な認証経路でRepositoryの全branch、commit、workflows、設定、既存Hosting・domain・API依存を調査する。ソースが復旧版と違う場合は配置方式とsmokeを最新構成に合わせる。
2. 全35ファイルのSHA256を `RECOVERY_SOURCE_SHA256.json` と照合し、最新ゲームを持つbranchを確定する。現在のmainがゲームを含まない場合はmainの内容だけを最新版と扱わない。
3. `develop` がない場合は確認済みゲームcommitから新規作成する。存在する場合は更新を破壊せず差分統合する。`staging` はDEVで検証したcommitから作成する。`main`は既存履歴を保つ。
4. このhandoffの新規設定を衝突確認して適用する。既存PR #1は勝手にmergeしない。mainにインフラだけを導入する場合、production待機ページはゲームソースなしでもビルド可能。
5. Cloudflareの既存Workers・Pages・domainsを一覧し、同名衝突がないことを確認。対象accountのworkers.dev subdomainを確認し、3 Workerの固定URLを確定する。独自domainや既存Productionに触れない。
6. GitHubの上記Variables/Secretsを登録。必要な権限付与・ログインは人間操作が必要。Cloudflare側のGit連携ビルドは併用せず、Actionsを唯一の自動デプロイ元にする。
7. `CICD_ENABLED_DEV=true` とした後、developへの設定commit/pushでCIを起動。Build → local WebGL smoke → deploy → fixed URL smokeの全ステップ成功を確認する。
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
| Deployがskipped | Build結果、環境別CICD_ENABLED_*、push先branch。PR/手動実行では正常な挙動 |
| Cloudflare認証失敗 | 環境別token名、account ID、token scope、有効期限 |
| Current HEAD不一致 | 古いcommitの再実行。現在HEADを検証し直す |
| 更新されない | version.jsonのcommit、HTML hash、no-cache、固定URLとWorker名、別途存在するSW/CDNルール |
| Asset decode/GLSL失敗 | check-buildのバイト照合、browser console、対応WebGL2環境 |
| API 501 | 現版に共有サーバーはない。DEVを本番APIへ向けて回避しない |
| Smoke失敗 | artifactのsmoke.jsonとPNG。SwiftShaderの描画結果を実機FPS評価に用いない |

## 今回の実測と公開証跡

2026-09-08 JST。ゲームソースを変更せず、次を実施した。

- develop移行と全35ファイルのGitHub blob再取得・SHA256/bytes照合: **PASS**。[初回read-back run](https://github.com/charukun/bloodline-legacy/actions/runs/34174723377)。元履歴・historical branch・PR #1を保持。
- DEV初回公開: commit `f07c632db03af2d5cb2fb1f25e01431b8d4ff085`、[run #6](https://github.com/charukun/bloodline-legacy/actions/runs/34182505263)。Build and verify 3m39s、Deploy and verify dev 4m08s、ともに **success**。公開後smoke自体は3m20s。
- 同runで基盤5テスト、原ビルド/JS構文/5アセットbyte照合、ローカルWorkersのWebGL smoke、公開固定URLの同commit/同HTML hash、PC1280×800・モバイル393×852のゲーム/HUD到達とWebGL描画が **PASS**。console/page/network/HTTP error検査も合格。
- 公開ゲームHTML: 1,819,339 bytes、SHA256 `f791f5099440f186a45614e5b6dd1978804356ff9e1bee36a5bb2e26658c814a`。
- 証跡: run #6の `smoke-published-34182505263-1` artifact（smoke.json、PC/モバイルPNG、3ファイル）。生成・アップロード成功をログで確認。Cloud Browserでartifactダウンロードイベントを取得できず、このWORK内でPNG目視までは実施していない。
- Cloud Browserでも実DEV・STAGING固定URLを開いてHTML/JS読込を確認したが、このブラウザにはWebGL2がなく起動画面で停止。公開後の描画検証はCIのChromium + SwiftShaderが実URLにアクセスして実施した。実機FPS・発熱・操作感の評価とは区別する。
- stagingはDEV公開検証合格後、上記f07c632 commitから作成し、GitHubからstagingの同SHAとゲーム/設定ディレクトリをread-back確認。通常ゲーム更新を無検証でstagingへ直送しない。
- mainにはCI/CD基盤と待機ページ生成のみを追加。READMEと既存履歴を保持し、src/public/原ゲームbuild/packageの追加なし。`production:false`を保持。
- STAGING初回公開: commit `f07c632db03af2d5cb2fb1f25e01431b8d4ff085`、[run #7 attempt 2](https://github.com/charukun/bloodline-legacy/actions/runs/34183140509)。Build 4m11s、Deploy/公開検証3m41s、全体 **success**。公開WebGL smoke 2m58s。PC・モバイル両viewportでゲーム/HUD、描画、asset、console/HTTP検査に合格。
- PRODUCTION初回公開検証成功: commit `bebd7c13d27304188a0e8b3773d6e9822c19dfcf`、[run #12](https://github.com/charukun/bloodline-legacy/actions/runs/34186408137)。Build 56s、Deploy/公開smoke45s、全体 **success**。mode=holding、ゲームなし、PC/モバイルで待機ページ・同SHA・HTML hash・console/HTTP検査に合格。Cloud Browserでも待機文を目視確認。
- 3つのSecret名、account ID、固定URL Variablesをread-back確認。`CICD_ENABLED_DEV` / `CICD_ENABLED_STAGING` / `CICD_ENABLED_PRODUCTION` はすべてtrue。通常運用は正しいbranchへのpushのみ。
- Productionの初回run #11はモバイル読込時のroot 404で失敗した。Workerに到達したroot/indexリクエストを汎用404へ返す経路を修正し、実アセットへ `env.ASSETS.fetch(request)` で委譲。status/headers/bytes保持・本当に存在しないassetは404のまま、という回帰テストを追加して基盤テストは6件。未修正の再実行はせず、新しい修正commitのrun #12で同じ公開smokeが成功した。Cloudflare内部で最初の404に至った詳細要因は未確定。参考: [ASSETS binding](https://developers.cloudflare.com/workers/static-assets/binding/)。
- 公開実績のcommitはその時点の証跡。後続の文書・基盤更新を含む現在HEADの状態はActionsで完全SHAを照合する。文書に自分自身のcommitを追記するためだけの再commitは行わない。

## 接続後の運用

3環境の初回接続は完了。Cloudflare管理画面を毎回操作する必要はない。通常開発はdevelopへのpush、同SHAのCIとDEV公開後smoke確認まで。staging/mainへの昇格は別の明示的な指示で行う。ゲームの正式Production公開はSTAGING検証後、release.production=trueへの変更を伴う。

tokenの失効・交換時だけ [GitHub Actions Secrets](https://github.com/charukun/bloodline-legacy/settings/secrets/actions) の該当環境Secretを更新する。値は取得・表示しない。Cloudflare Desktop Appは不要。

未使用Variables: `VERIFY_INITIAL_HANDOFF=true` と旧 `CICD_ENABLED=false` はWeb UI更新・削除が保存されなかった。初回監査stepは完了後削除し、workflowは環境別CICD_ENABLED_*へ移行済みなので参照されない。不要変数として後日整理できるが通常CIに影響しない。

トークンの有効期限なしはユーザーの選択を採用。失効・ローテーション・権限変更時には対応するGitHub Secretを更新する。値をチャット/ソース/ログへ表示しない。

Production基盤CI: commit `3dd66907e5368e6b96e9dc3225409498e751da59`、[run #8](https://github.com/charukun/bloodline-legacy/actions/runs/34183224349)。mainへのpushでBuild and verify（基盤テスト・holding build・ローカル配信smoke）が成功。Cloudflare接続前のためDeployはskipped。ゲームの正式リリースは行っていない。
