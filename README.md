# Bloodline Legacy / 血脈の系譜

現在開発中の世代継承型 WebGL ゲームのソースです。
現行 Visual Slice は `継ぎ火の谷 VS-01 / simulation v0.6.0` を基準にしています。

## 開発・文書の入口

実装の正本はGitHubの最新 `develop`。共通運用は [AGENTS.md](AGENTS.md) から [v7](docs/COMMON_DEVELOPMENT_POLICY.md) を参照してください。担当領域の技術資料と過去記録は [文書案内](docs/README.md) で区別しています。

## 構成

- `src/` ゲーム本体、UI、レンダリング、天候、キャラクター、戦闘、音声
- `public/assets/` 実行に使用する画像・3Dモデルとアセットライセンス
- `tools/generate_assets.py` オリジナルのテクスチャ / GLB 再生成スクリプト
- `tests/smoke.py` ブラウザー smoke / visual review 用スクリプト
- `build.mjs` ソースとアセットを standalone HTML にまとめるビルド
- `package.json` Node プロジェクト設定

`dist/` はビルド生成物です。

## Build

Node.js が利用できる環境で:

```bash
node build.mjs
```

`dist/index.html` が生成されます。

## Run

ビルド後の `dist/index.html` が standalone のゲーム本体です。
通常ブラウザーで開くか、静的 HTTP サーバーから配信してください。

## Asset regeneration

同梱アセットを再生成する場合のみ Python 3、NumPy、Pillow が必要です。

```bash
python3 tools/generate_assets.py
node build.mjs
```

Visual Reference の画像そのものはゲーム素材に含めていません。
`public/assets/ASSET_LICENSE.txt` も参照してください。

## 検証結果

現在の結果はPRのhead SHAに対応するChecks / Actionsを参照してください。配信確認は [Deployment](docs/DEPLOYMENT.md) に記載しています。2026-09-08の初期build/smoke結果は [historicalの初期搬入記録](docs/historical/initial-migration/IMPORT_HANDOFF.md) に保存し、最新developの成功証拠とは区別しています。
