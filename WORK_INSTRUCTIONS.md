# WORK_INSTRUCTIONS

## GitHub反映先

- 対象リポジトリ: `charukun/bloodline-legacy`
- リポジトリ: **新規作成すること**
- Visibility: **Private**
- ベースブランチ: `main`
- 反映対象ブランチ: `work/current-handoff`
- 既存の別リポジトリへ誤って反映しないこと
- このhandoffのファイル内容を勝手に再設計・書き換えしないこと

## Commit / Pull Request

- commit message: `chore: import current Bloodline Legacy game handoff`
- Pull Request: **作成する**
- PR base: `main`
- PR head: `work/current-handoff`
- PRタイトル: `Import current Bloodline Legacy game handoff`
- **PRはmergeしないこと**
- 同名PRがすでに存在する場合のみ、新規PRを重複作成せず既存PRを更新すること

## 反映対象ファイル

以下が完全な反映対象です。これ以外の一時ファイル、キャッシュ、`node_modules/`、
ビルド生成物 `dist/`、検証時のスクリーンショット / JSON 出力は反映しないこと。

- `README.md`
- `WORK_INSTRUCTIONS.md`
- `build.mjs`
- `package.json`
- `public/assets/ASSET_LICENSE.txt`
- `public/assets/cloth-panel.png`
- `public/assets/detail-atlas.png`
- `public/assets/material-atlas.png`
- `public/assets/parchment.png`
- `public/assets/village-kit.glb`
- `src/assets/loader.js`
- `src/audio/ambience.js`
- `src/bootstrap.js`
- `src/character/rig.js`
- `src/legacy/art.js`
- `src/legacy/audio.js`
- `src/legacy/core.js`
- `src/legacy/dialogue.js`
- `src/legacy/game.js`
- `src/legacy/labels.js`
- `src/legacy/motion.js`
- `src/legacy/render_math.js`
- `src/legacy/renderer.js`
- `src/legacy/ui.js`
- `src/render/adapter.js`
- `src/render/combat-presentation.js`
- `src/render/renderer-base.js`
- `src/render/shaders.js`
- `src/shell.html`
- `src/ui/base.css`
- `src/ui/world-skin.css`
- `src/weather/weather.js`
- `src/world/environment.js`
- `tests/smoke.py`
- `tools/generate_assets.py`

合計: 35 ファイル

## 実行方法

Node.js が利用できる環境で:

```bash
node build.mjs
```

これにより `dist/index.html` が生成される。

ゲーム実行は生成された `dist/index.html` を通常ブラウザーで開くか、
静的HTTPサーバーから配信する。

アセットを再生成する必要がある場合のみ:

```bash
python3 tools/generate_assets.py
node build.mjs
```

`tools/generate_assets.py` の実行には Python 3 / NumPy / Pillow が必要。

## 現在確認済みの build / test / visual review

確認日: 2026-09-08

### Build
- `node build.mjs`: PASS
- 19 source modules から standalone HTML を生成
- 生成HTMLサイズ: 1,819,339 bytes
- 生成JavaScriptの `node --check`: PASS

### Browser / smoke
- Chromium 144 + Xvfb + SwiftShader
- WebGL2 boot: PASS
- 一族画面表示: PASS
- ゲーム開始: PASS
- 村描画: PASS
- 雨天切替 / 描画: PASS
- JavaScript page errors: 0
- console errors: 0

### Visual review
- 村画面まで目視確認済み
- Visual Reference に対する商用品質到達を示す合格判定ではない
- Pixel Fold実機FPS / 発熱 / 操作感は未検証
- Desktop実GPU 60fpsは未検証
- SwiftShaderの性能計測値を実GPU性能として扱わないこと

## GitHub反映後の検証

反映後、PR上のファイルが上記「反映対象ファイル」と完全一致することを確認する。

その後:

1. `node build.mjs`
2. 生成された `dist/index.html` の存在確認
3. 生成JavaScriptの構文確認
4. Chromiumでゲームを起動
5. 一族画面 → ゲーム開始 → 村描画まで確認
6. 雨天へ切り替えて Weather 経路を確認
7. console error / page error が0件であることを確認
8. `tests/smoke.py` を利用できる環境では smoke / visual review を再実行
9. PRのFiles changedに `dist/`, `node_modules/`, cache, 一時スクリーンショット等が混入していないことを確認

検証で問題を発見した場合はPRをmergeせず、原因を記録して修正すること。

## 禁止

- PRをmergeしない
- force pushしない
- `main`へ直接commitしない
- ゲーム仕様をGitHub反映作業の都合で変更しない
- Visual Reference画像をゲームアセットとして追加しない
