# CM01 asset provenance

CM01のモデル、スキンウェイト、テクスチャは `tools/generate_character.py` によるBloodline Legacyのオリジナル制作物。今回、肩の位置・袖・肩当て・腕のウェイトを調整した。外部キャラクターのメッシュやテクスチャ、Visual Referenceの画像ピクセルは取り込んでいない。武器と盾は既存ゲームの形状を使用する。

## Imported animation data

- Author: Kay Lousberg / KayKit Game Assets
- Repository: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0
- Source commit: `672074b73ba276876a19e8816ecdc5241817ab47`
- Original file: `addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb`
- License: CC0 1.0 Universal; original notice in `tools/character-source/KAYKIT_LICENSE.txt`.
- Retained source: `tools/character-source/kaykit-motion.glb` contains the source hierarchy and six selected animation clips, with source meshes/textures removed.
- Selected clips: `Idle`, `Walking_A`, `Running_A`, `1H_Melee_Attack_Chop`, `1H_Melee_Attack_Slice_Diagonal`, `1H_Melee_Attack_Slice_Horizontal`.

`tools/author_character_clips.py` regenerates the original model, retargets these six animations to CM01's proportions, solves limb lengths and torso clearance offline, and bakes local rotation/translation tracks into the shipped GLB. The retarget and timing markers are project modifications. No new animation physics package runs on the client.

生成環境: Python 3、NumPy、SciPy、Pillow。Blenderは今回の環境で起動できず、使用していない。これらのPythonパッケージは実行時には不要。

GLBには31ボーン、2種類のLODメッシュ、6本の標準glTF Animationを保存する。一般的なglTF Viewerでも焼き込んだクリップを再生できる構造。実戦の速度調整、接地補正、装備/欠損マスク、LOD切替はゲーム側の処理なので、一般Viewerの再生とゲーム内の結果は同一ではない。
