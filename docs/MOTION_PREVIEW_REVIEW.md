# Motion preview: skill-menu follow-up

> **HISTORICAL — 過去WORKの実装・検証記録。** 以下の旧ポリシー、命令形の統合手順、PR/branch状態、SHA、検証条件・結果は当時の記録であり、現行命令や現在headの成功証拠ではありません。担当調査に必要な場合だけ参照してください。[現行の文書案内](README.md)。

The user reported missing combat animation at age 14 and an empty 心の采配
modal. The supplied screenshot also shows 稽古をやめる, indicating contact
was recognized. The affected user's save has not been supplied.

The original standalone preview reproduces the empty modal when `p.skills`
contains an undefined/removed ID: `renderSkills` reads `null.name`. If the
enabled skills are all undefined, `chooseSkill` also returns null. This is a
reproduced failure condition, not a confirmed diagnosis of the user's save.
The first motion change did not edit skill records or this UI path.

This revision incorporates develop `6e6d4ce1bf11cd8e174b22b2fd0f571e124449e0`,
including the integrated Skill System catalog, and retains motion interpolation.
The skills modal now renders recognized skills and explains incompatible
records without deleting skills, resetting weights, or enabling disabled skills.

Validation: build PASS; 52 targeted motion, UI, skill, and standalone-preview
tests PASS. The standalone test evaluates the actual generated HTML/catalog,
restores a new skill, and observes advancing attack poses against the training
dummy at age 14 through Game.frame. GPU startup is skipped; actual rendered
pixels and the user's symptom remain UNVERIFIED pending user review.

The user has now authorized PR creation for the combined motion/diorama preview.
Merge remains the responsibility of Integration WORK.
