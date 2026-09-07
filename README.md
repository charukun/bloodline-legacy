# Bloodline Legacy / 血脈の系譜

現在開発中の世代継承型 WebGL ゲームの GitHub 反映用ソースです。
現行 Visual Slice は `継ぎ火の谷 VS-01 / simulation v0.6.0` を基準にしています。

## 構成

- `src/` ゲーム本体、UI、レンダリング、天候、キャラクター、戦闘、音声
- `public/assets/` 実行に使用する画像・3Dモデルとアセットライセンス
- `tools/generate_assets.py` オリジナルのテクスチャ / GLB 再生成スクリプト
- `tests/smoke.py` ブラウザー smoke / visual review 用スクリプト
- `build.mjs` ソースとアセットを standalone HTML にまとめるビルド
- `package.json` Node プロジェクト設定

`dist/` はビルド生成物のため handoff には含めていません。

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

## Current verification

2026-09-08 時点:

- `node build.mjs`: PASS
- 生成 JavaScript の `node --check`: PASS
- Chromium 144 + Xvfb + SwiftShader で WebGL2 起動: PASS
- 一族画面 → ゲーム開始 → 村 → 雨天切替: PASS
- 上記 smoke 中の JavaScript page error: 0
- 上記 smoke 中の console error: 0
- Visual review: 村画面まで実施
- Pixel Fold 実機 FPS / 発熱 / 操作感: 未検証
- Desktop 実 GPU 60fps: 未検証

ソフトウェア描画環境の性能値は実機性能として扱わないでください。
