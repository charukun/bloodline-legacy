# CM01 asset provenance

CM01の新しいモデル、スキンウェイト、テクスチャは、この依頼で `tools/generate_character.py` により制作した。外部配布モデル、既存作品のキャラクター、Visual Referenceの画像ピクセルは取り込んでいない。

既存ゲームの武器・盾・Environmentは変更していない。それらの既存の出典・ライセンスは元プロジェクトのものを維持する。

生成環境: Python 3、NumPy、SciPy（PCHIP曲線）、Pillow（アトラス）。Blenderは使用していない。実行時にはこれらのPythonパッケージを必要としない。

GLBには31ボーンのスキンと2種類のLODメッシュを保存する。通常のglTF Viewerで表示される既定SceneはLOD0の1体のみ。ゲーム固有の装備/欠損マスク、LOD切替、6状態のAnimationはCM01 Runtime側で処理するため、GLB単体を一般Viewerで開いただけでは再現されない。
