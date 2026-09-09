# Bloodline Legacy 共通開発運用ポリシー v7

更新日: 2026-09-10  
対象: `charukun/bloodline-legacy`

## 目的

Bloodline Legacy の並列開発を、品質を維持しつつ、不要なコンテキスト読込・重複検証・確認待ち・古い指示の混入を減らして運用する。

このポリシーは GPT-6 Astra の OpenAI 公式 Model Guidance を設計上の参考にする。ただし、branch、PR、Integration、CI/CD の具体ルールは Bloodline Legacy 固有の運用ルールであり、OpenAI公式仕様そのものではない。

## 1. 正本

- 確定仕様: 新「血脈の系譜」Project Sources の最新版
- 実装: GitHub の最新 `develop`
- GitHub状態: 現在の branch / commit / PR / Checks / Actions
- 配信状態: 実際に配信されている commit SHA / Build Version

過去チャット、過去WORK報告、古いhandoff、過去のCI成功は現在状態の証拠にしない。

PR内の新しいCI・ポリシー変更は、`develop` にmergeされるまで現行ルールとして扱わない。

## 2. Astra向け指示設計

Astra は `AGENTS.md`、skills、その他アクセス可能な指示ファイルの影響を強く受けるため、命令として読める文書を増やしすぎない。

- 恒久ルールは少数の現行ファイルへ集約する。
- 古いPR番号、過去SHA、一時的な移行手順を恒久ルールへ残さない。
- historical文書は現行命令と明確に区別する。
- 同じ共通ルールをWORKプロンプトへ再掲しない。
- 毎回すべてのProject SourcesやRepository全体を読むことを義務化しない。
- 担当作業に十分かつ必要なコンテキストだけ取得する。

明示的な現在のユーザー指示を最優先する。既存の確定仕様と衝突する製品変更は、ユーザーが変更を意図していることが明確な場合に更新対象として扱う。

## 3. WORKの基本動作

実作業を依頼されたWORKは、利用可能な権限とツールの範囲で完了まで進める。

通常は次を行う。

`必要な調査 → 実装 → 必要な検証 → 修正 → branch公開 → Ready for review PR`

routineな不足情報は、現在の依頼、確定仕様、コード、GitHub状態から合理的に補って進める。

結果を大きく変える未確定仕様、不可逆操作、権限上必要な承認だけを確認対象にする。確認が必要でも、それまでに可能な調査・準備は完了してから提示する。

途中報告、設計案、部分実装だけを完了扱いしない。

## 4. テストと検証

変更内容に見合う検証を行う。

- 変更に適したテストとrequired checksを完了する。
- 必要なテストが成功した後は、新しい変更、失敗、未解決の懸念がない限り、同じ検証を広げたり繰り返したりしない。
- CIが同等以上の検証を行う場合、理由なくローカルで重複実行しない。
- Browser / Visual / Performance / 実機検証は、変更リスク上必要な場合に行う。
- 未実施の検証を成功扱いしない。必要なら `UNVERIFIED` とする。
- PRの成功証拠は原則として現在のhead SHAに対する結果を使う。旧headのgreenを現在headのgreenとして扱わない。
- required checksやbranch protectionを権限不足で完全取得できない場合、「存在しない」と推定せず `UNKNOWN / UNVERIFIED` とする。

品質は検証回数ではなく、変更リスクに必要な証拠が揃っているかで判断する。

## 5. 並列開発とPR

各実装WORKは最新 `develop` を基準に専用branchで作業する。

WORK間の連携は原則として、

`Project Sources → develop → branch / PR → Integration`

を使い、他WORKのチャット履歴や未公開変更を前提にしない。

PRには最低限、変更目的、実施した検証、blocker / UNVERIFIED、必要な依存関係を残す。

`develop` / `staging` / `main` への直接push、force pushによる履歴破壊、保護ルール回避は禁止する。

## 6. Integration

Integration WORKは毎回、過去報告ではなく現在のGitHub状態から判断する。

最低限確認するもの:

- 最新 `develop`
- PRの現在head
- conflict / mergeability
- current-head checks
- PR間依存
- 共有領域への相互作用

PRがすでに最新developを含み、競合や目的上の必要がない場合、形式的なrebaseを繰り返さない。

CIや運用基盤を変更するPRは、そのPRがmergeされるまでは後続PRへ適用済みとみなさない。

競合解消では、最新developの有効な変更を不用意に戻さず、双方の変更目的を維持する。特にCI設定、保存互換性、共有State、Input、engine registry、Combat、Animation、Rendering等の共有境界は影響を確認する。

安全に統合できるPRは順次mergeできる。各PRごとに毎回フルCI/CDとDEV確認を完了することは必須にしない。

ただし、高リスクな依存境界では必要な中間検証を行う。対象群の統合後は最終develop SHAを固定し、そのSHAに対する必要な全体回帰とDEV確認を行う。

pending / unstable / failed / UNKNOWN の条件を、証拠なしに成功扱いしてmergeを確定しない。

## 7. CI/CD

現在のCI/CD実態は、対象branchの `.github/workflows` とGitHub Actionsを基準にする。

- ドキュメントに書かれた予定と、実際にmerge済みのworkflowを区別する。
- PRでは変更に必要な検証を優先する。
- 最終develop SHAで必要な回帰検証とDEV配信確認を行う。
- STAGING / PRODUCTIONはDEVより厳格なリリース条件を適用する。
- old SHA、superseded、skipされたrunを最新SHAの成功証拠にしない。
- 同じ検証を複数workflowやWORKで理由なく重複させない。重複自体を直す場合は、別の明示的なCI改善として扱う。

CIの具体的なworkflow名、過去PR番号、固定SHAはこの共通ポリシーに埋め込まない。

## 8. コンテキストとAstra使用量

目的は「最短プロンプト」ではなく、必要な情報を明確にし、不要な情報を繰り返さないこと。

- 共通ルールや長い仕様をWORKプロンプトへコピーしない。
- 状態情報は固定文書へ複製せず、必要時にGitHubから取得する。
- WORKプロンプトは原則 `目的 / 対象 / 固有制約 / 完了条件` に絞る。
- 長い作業日誌を次WORKの必須入力にしない。
- 難易度に対して過剰なreasoningを常用しない。

OpenAI公式では、AstraのWork/Codex使用量はタスク、入出力サイズ、reasoning設定、Fast mode等で変わる。Lower effortは使用量を抑えたい場合の有効な開始点で、Higher effortは常に良い結果を保証しない。

モデルやreasoning levelをユーザーが選択できる場合、routineな実装は低めから始め、難しい競合・設計・デバッグで不足がある場合に上げる。

## 9. 報告

ユーザー向け報告は、次の判断に必要な情報へ絞る。

通常は以下で十分。

- 変更内容
- PR / branch
- 検証結果
- blocker / UNVERIFIED
- 次の操作が必要な場合のみ、その操作

詳細証拠はPR、Checks、Actions等へ残し、同じ内容をチャットへ長文で複製しない。

## 10. WORKプロンプト標準形

```text
Bloodline Legacy の [担当] WORK として作業してください。
Repository: charukun/bloodline-legacy

目的: [達成すること]

最新版の共通開発運用ポリシー、担当に必要な確定仕様、最新developを参照し、
必要な調査・実装・検証・Ready for review PRまで進めてください。

固有制約: [必要なものだけ]
完了条件: [今回固有の条件]
```

共通ポリシーに書かれている内容を再掲しない。

## 11. 採用時の指示ファイル監査

v7採用時に、モデルへ命令として読まれる可能性がある既存文書を監査する。

優先対象:

- `AGENTS.md`
- `WORK_INSTRUCTIONS.md`
- skills / `SKILL.md`
- 旧共通開発ポリシー
- CI/CD指示文書
- 初期移行専用handoff
- 特定PR番号・過去SHA・過去branch状態を前提にした運用文書

現行運用と矛盾するものは、削除、更新、または明確なhistorical化を行う。

---

## OpenAI公式ガイダンスとの関係

設計上の参考:

- GPT-6 Astra Model Guidance  
  https://developers.openai.com/api/docs/guides/latest-model
- ChatGPT Work and Codex  
  https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- Managing usage with GPT-6 Astra in Work and Codex  
  https://help.openai.com/zh-hans-cn/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex

公式ガイダンスから特に反映した点:

- Astraがskillsや`AGENTS.md`等の指示に敏感であるため、アクセス可能な指示ファイルを監査する。
- routineな不足情報で停止せず、意図を推定して完遂するよう調整する。
- コーディングのテスト量を変更に合わせ、成功後の不要な拡大・反復検証を避ける。
- Astraの使用量は入力・出力・タスク・reasoning等で変わり、低めのreasoningは有効な開始点になり得る。

Bloodline Legacy固有のbranch / PR / Integration / CI/CDルールは、OpenAI公式仕様ではない。
