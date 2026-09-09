# Build Version — reference

共通運用は [v7](COMMON_DEVELOPMENT_POLICY.md)。この文書はBuild Versionの実装説明で、特定PRへの統合命令ではない。

各WORKはVersion表示を手動更新しない。正式なbase versionは `deploy/release.json` の `baseVersion` 一箇所で管理する（値は同ファイルを参照）。PRの回数で自動加算しない。

| Branch | Environment | 表示例 |
| --- | --- | --- |
| develop | DEV | `v0.6.0-dev · abcdef0` |
| staging | STAGING | `v0.6.0-rc · abcdef0` |
| main | PRODUCTION | `v0.6.0 · abcdef0` |

上表のversionと短縮SHAは表示形式の例で、配信状態の証拠ではない。

`deploy/build.mjs` が既存CIの対象環境と `GITHUB_SHA` を受け取り、`deploy/build-info.mjs` で生成する。root buildへ渡した同じ情報をHTML内の `BUILD_INFO` と生成物 `version.json` に保存する。全文SHAはmetadataと表示のtitle属性、先頭7桁は一族画面・設定画面の既存Version欄に表示する。

表示はそのHTMLに埋め込まれた情報を使用する。Live Updateはversion.jsonを低頻度で確認するが、表示中のVersionを上書きしない。開いたままの旧版が新しいcommitを名乗ることはない。新しい版への移動は、更新通知から安全な区切りで保存した後に行う。詳細は [Live Update](live-update/README.md) を参照。HTML/manifestの既存no-cache方針を維持する。7桁表示は省略表記であり、厳密な識別は全文SHAで行う。

既存ActionsはBuild/Test済みartifactをそのままdeployし、公開HTMLのhashとmanifestを確認する。Browser smokeを実行する経路では、一族画面・設定画面の表示とmanifestの一致も確認する。DEVの通常CIはHTTP検証のため、この画面assertionは実行しない。PR検証のSHAはGitHubのPR merge refの場合があるが、PRからはdeployしない。Integration WORKがdevelopへmergeした後のpushでは、そのdevelop commitを新しくBuildしてDEVへdeployする。STAGING/PRODUCTIONも同じ流れ。

通常の `npm run build` は `local` とgit HEADを使用する。Git情報がない場合や未buildのソース実行は `local / unbuilt` と区別する。手元の未commit変更を含むビルドは公開済みcommitの証明には使用しない。

Productionが `production: false` の場合、holding pageにもBuild Versionを表示する。正式リリース時はRelease用PRで `baseVersion` をMAJOR.MINOR.PATCHへ更新し、検証後にstaging→mainへ昇格する。ゲーム正式公開を許可する既存production flagの操作は別判断とする。simulation内部の `VERSION` やpackage.jsonのpackage versionはこの表示の更新先ではない。

## 変更内容に応じた検証の参照例

- `npm test --prefix deploy`: 環境対応、commit変更、入力検証と既存基盤テスト。
- `GITHUB_SHA=<全文SHA> node deploy/build.mjs dev` （staging/productionも同様）。
- `node deploy/check-build.mjs dev`: 埋め込み情報とmanifest、HTML同一性・Asset整合。
- `node deploy/smoke.mjs dev --local`: Desktop/MobileでWebGL起動と2箇所のVersion表示。
- 公開後のCIは `FIXED_URL` 指定で、DEVは `--http-only`、STAGING / PRODUCTIONはBrowser smokeを実行する。全コマンドを毎WORKで再実行するチェックリストではない。

## 変更時の参照先

Version表示を変更する場合は `buildVersionMarkup` と一族・設定の既存表示箇所、metadata生成とmanifestの整合を確認する。通常WORKで表示Versionを手動加算しない。配信確認は [Deployment](DEPLOYMENT.md) と対象SHAのActionsを参照する。
