# CM01 authored motion slice

成人の人間男性CM01の片手剣に、既存モーションを体格に合わせて移植した6本のglTFクリップを導入。接近、構え、斜め斬り・横斬り・斬り下ろし、連続技からの復帰を確認するための改修。商用品質や参照動画と同等の品質を自動テストだけで承認したものではない。

## Design and boundaries

- 参照動画の読みやすさを、全身のひねり、支持脚、腕と胴体の隙間、振り出しと振り抜きの速度差として適用。
- 肩と袖・肩当ての位置を外側へ0.06調整。肩付近の胸ウェイトを下げ、腕を振った際の袖の引き潰れを軽減。
- 元の短い腕の動きを、CM01の長い腕の方向だけに適用すると横へ伸び過ぎる。手の位置を胸の座標系と体格比で移し、骨の長さを変えずに肘を解く。
- 肘の曲がりから捩れを計算すると伸展時に180度反転するため、元のアニメーションの捩れを保持する。
- 斬撃の命中点は剣が正面を横切るフレーム。glTFの時間を既存の攻撃時計へ写像し、`.43`の命中を変更しない。時間の補間は命中前後で速度を連続にする。
- 接地した足は技の切替でもワールド座標を保持。必要な位置修正は足を持ち上げる0.12秒の一歩へ移す。膝の方向は元クリップを保つ。
- ゲームの移動座標・衝突・ダメージ・スキル定義・UI・保存は変更しない。ゲームルールとしての新しいコンボや攻撃は追加していない。
- 適用範囲はCM01の片手剣と単発slash。連撃回数で3種類の斬り方を選ぶ。多段技、他武器、被弾、ガード、活動、状態異常、欠損は既存のモーションへ戻す。別年齢・種族のモデルは今回のクリップ対象外。
- 既存31ボーン専用のglTF読み込み。任意のBlenderリグをそのまま差し替えられる汎用インポーターではない。

## Reproduce

```sh
npm ci
python3 tools/author_character_clips.py
npm test
node tools/build-skill-motion-review.mjs b8c3183a681c8eb01911c8123e16ee1e21153856
```

初回の素材抽出を再実行する場合だけ `--source /path/to/Knight.glb` を指定。通常の再生成には、リポジトリ内のモーションのみのglTFを使用する。毎回モデルから再生成するため、古いAnimationバッファが蓄積しない。必要な制作依存はNumPy / SciPy / Pillow。

比較HTMLは変更前のコードと**変更前のGLB**を組にして切り替える。通常速度・1/4速度・停止・シーク・正面/斜め/横・ゲーム距離・FX切替に対応する。既存ゲームのRendererで、同じ比較用スナップショットを描く。移動量は実際の `attackStepDistance` と同じだが、衝突のない動作確認であり実戦の録画ではない。

オフライン動画の再生成（moderngl、EGL、ffmpegも必要）:

```sh
node tools/capture-character-motion.mjs /tmp/after.json
# 比較元のGLBは git show BASE:public/assets/character/young-human-male-cm01.glb で取得
node tools/capture-character-motion.mjs /tmp/before.json BASE /tmp/before.glb
python3 tools/render-character-motion.py /tmp/after.json public/assets/character/young-human-male-cm01.glb /tmp/comparison.mp4 --before /tmp/before.json --before-glb /tmp/before.glb --video
```

動画は実装の姿勢行列、スキン、装備形状をオフラインOpenGLで描画する。**ゲームブラウザの録画ではなく、照明も簡略化している**。ゲーム距離、通常速度、FXなしも収録する。

## Validation and outstanding review

develop 66198eb（UI改修PR #27を含む）を取り込んだBuild / Testは234件成功、GLB検証は22件成功。詳細はこの改修の `motion-clips-verification.json` を参照。前のCM01レビュー記録と今回の検証を混同しない。

- Blenderの導入は環境の権限/ネットワーク制約で完了しなかったため、今回はglTFを直接扱うオフライン制作経路。
- Browserのlocalhost画面は `net::ERR_BLOCKED_BY_CLIENT` により開けなかった。HTMLの構文・操作メッセージのテストを、WebGLの目視確認済みとして扱わない。
- Pixel等のモバイル実機FPSとゲーム本編の目視確認は未実施。比較HTMLを実機で開いて最終判断する必要がある。
- 参照動画と同等の商用品質の承認、他キャラ/他武器への展開は残る。今回のPRは代表キャラのクリップ基盤と改修のレビュー単位。

CPU姿勢計算の比較は `node tools/benchmark-character-clips.mjs BASE_SHA OUTPUT.json` で再実行できる。今回のNode VM測定では中央値が変更前0.323ms / 変更後0.295ms、p95が0.738ms / 0.679ms。描画回数・ボーン数・三角形数は同じ。GLBは183,280バイト（約7.9%）増加。GPU時間とモバイルFPSの測定値ではない。
