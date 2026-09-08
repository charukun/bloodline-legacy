# Motion preview: skill-menu follow-up

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

Do not create a PR until the user approves the revised preview. Do not merge.
