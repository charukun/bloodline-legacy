# DEV CI — reference

共通の検証方針は [v7 §4・7](COMMON_DEVELOPMENT_POLICY.md#4-テストと検証)。具体的な実行条件は対象branchの [deploy.yml](../.github/workflows/deploy.yml) を参照する。

このtreeの通常deploy workflowは、DEV対象のPR・push・manual CIでChromiumの準備と公開前Browser smokeを省略する。Build・テスト・JS/Asset整合・対象となるWorkers runtime検証は残る。未mergeのCI効率化PRの検証選択を、現行の動作と混同しない。

DEV公開後は `node deploy/smoke.mjs dev --http-only` が、配布manifest、全文commitと環境、公開HTMLのSHA256、MIME/cache、healthのbuild/互換契約、存在しないAsset、契約のないjoin拒否を確認する。詳細なassertionは同スクリプトを参照する。HTTP成功はWebGL描画・Versionの画面表示・操作感を確認した証拠ではない。

STAGING / PRODUCTIONは既存のBrowser検証を含む。Character・船の専用workflowも対象差分でBrowserを実行する。必要なVisual / Performance / 実機検証は変更リスクに応じて判断する。

旧版のPR番号に結び付いた統合命令と、初期測定の所要時間は現行説明から除去した。公開までの時間はqueueやproviderの状態にも依存する。
