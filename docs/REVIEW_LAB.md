# Review Lab — reference

開発者がPRの実装を操作するための独立した稽古場。共通運用はProject Sourcesのv7と [同期コピー](COMMON_DEVELOPMENT_POLICY.md) を参照する。

## 確認画面

- `/review/skills?skill=<id-or-key>`: 単発・序破急・武器・間合い・相手・構成変更・エフェクト・速度・カメラ・同条件の反復。
- `/review/enemies?enemy=<form-id>`: 待機・移動・予兆・攻撃・防御・被弾・死亡・生命力・欠損・視点・1/2/8/24体の負荷計測。
- `/review/combat?skill=<id-or-key>&enemy=<form-id>`: 実Simulation上の戦闘。技の必要武器・小物・弾数・パッシブは試行開始時に付与し、その後の消費・負傷・接触判定・敵AIは本編のルールで処理する。

新しい技・敵は本編の `book` / `BL_SKILL_CATALOG` / `ENEMY_FORMS` へ登録すれば一覧に現れる。新しい敵系統そのものは本編側のSimulationとrenderer対応が必要。削除済み技は表示しない。未登録IDは別の対象へ置き換えずエラーにする。常時技は付与状態を確認する。

「URLをコピー」は対象と全文SHAを含める。URLのSHAと配信物が違えばサーバーと画面の両方で拒否する。序破急の各段を選ぶことができ、実Simulationで中断された場合は中断した状態を表示する。実戦では選択技をその段に採用し、残る段には編成の使用可能な技（未編成なら本編の素手技）を使う。生命力・負傷・位置を保って進行し、「同じ条件で連続確認」で20秒ごとにリセットする。

敵の動作単体は `tools/enemies/review-scenes.js` の観察用snapshotを本編rendererへ渡す。「技 × 敵」は同snapshotの再生ではなく `Simulation.tick` による対戦。負荷測定は10秒の準備と10秒×3回、rawフレーム間隔・CPU/GPU・draw calls・triangles・対象・SHAをJSONに記録。画面を隠した計測は破棄する。ソフトウェアGPUの結果を実機FPSの証拠にしない。

## コードとセーブの境界

`tools/runtime-sources.mjs` のモジュール順・アセット一覧をゲームbuildとReview buildが共有する。Review HTMLは小さいshellのみ。外部 `runtime.mjs` を同じsourceから生成し、GLB/画像は `public/assets` からそのまま外部配信する。既存バイナリloader向けの変換は読込境界だけで行い、巨大HTMLやモデル実装の手動コピーは使わない。

Reviewでは `bootstrap.js` を含めず、`Game`・本編ネットワーククライアント・保存処理を起動しない。Simulationはメモリ内だけで保持する。通常ゲームとは別origin・別Worker、Durable Objectsなし、APIルートなし。CSPの接続先は同一originのみ。本編のセーブ・アカウント・オンラインworldへ接続しない。

## URLの生成と公開範囲

`Review Lab Preview` workflowはdevelop向けPRの**head SHAを明示checkout**する。GitHubの合成merge commitは使わない。buildしたアセットとhash manifestをpublish jobへ渡し、公開直前にPRの現在headとopen状態を確認する。

- PR: `bl-review-pr-<PR番号>-<head SHA先頭16桁>.<account subdomain>.workers.dev`
- 固定DEV: `bloodline-review-dev.<account subdomain>.workers.dev`

各PreviewはPRとSHAの組み合わせごとに別Worker。PR更新後も以前のURLが別のSHAを表示することはない。close/merge時にはそのPR番号に属するPreviewだけを削除する。固定DEVはdevelopへのpushで更新し、古いdevelopの公開は直前のHEAD確認で拒否する。

実在URLはActionsのSummaryと `review-links-<SHA>` artifactの `review-published.json` に記録する。各WORKはそこで成功を確認し、対象IDを付けたURLを完了報告へ載せる。公開待ち・失敗時に予定URLを配信成功と扱わない。

このworkflowがdevelopへmergeされるまでは、固定DEVへの更新と他PRへの恒久適用は未導入。初回の本PR自身はPR workflowでPreviewを確認できる。fork PRには配信用secretを渡さず、build/testまで。`pull_request_target` は使わない。

通常ゲームのDEV/STAGING/PRODUCTION設定・配信物・導線にReviewを追加しない。Review buildはProduction/Staging指定を拒否し、専用WorkerもReview環境以外では404を返す。全アセットをWorkerの認証より後に配信し、匿名でURLを知っていても利用できない。

## 開発者認証

HTTPSのブラウザ認証ダイアログでGitHubユーザー名とGitHub tokenを入力する。tokenはReview WorkerからGitHubの固定repository metadata endpointだけへ送信し、repositoryの `push` / `maintain` / `admin` 権限を確認する。公開リポジトリのread権限だけでは入れない。認証情報をURLやPR、チャット、計測JSONに含めない。

専用の短期限tokenを利用し、このrepository以外の権限を付けない。GitHubの権限応答でwriteアクセスを確認できないtokenは拒否する。tokenの文字列をサーバーに保存せず、SHA-256 digestと成功期限（最大60秒）のみメモリに保持する。権限削除・token失効は最大60秒で反映する。GitHub障害時は認証を省略しない。ブラウザのBasic認証情報を破棄するにはプライベートウィンドウを閉じる。

配信用Cloudflare secretは既存DEVと同じGitHub secretを利用し、画面へ送信しない。既存tokenが新Workerの作成・列挙・削除を許可していない場合、workflowは失敗する。権限変更や無認証公開で回避しない。

## ローカル確認

`npm ci` → `npm run build:review` → `npm run dev`。ローカルViteの `/review/skills` 等は配信認証の検証ではない。実配信では別Workerが全パスを認証する。

`node --test tests/review-lab.test.mjs tests/review-worker.test.mjs tests/review-ui.test.mjs` は登録一覧、実戦、編成、保存隔離、認証、SHA照合と実rendererへの描画指示を検証する。GLモックを使うUIテストはVisual成功を意味しない。PR workflowの `tests/review-browser.mjs` が実WebGLとデスクトップ/モバイル幅、Deep Link、保存隔離、負荷測定のダウンロードを検証する。Pixel Fold実機性能と実GitHubユーザーによる認証後の操作は別の確認事項。
