# Bloodline Legacy development workflow

- Repository: `charukun/bloodline-legacy`. Specification authority: Project Sources; implementation authority: latest `develop`.
- For every new user request, check the latest common policy and specifications relevant to the assignment. The user-authorized v6 policy is mirrored at `docs/COMMON_DEVELOPMENT_POLICY.txt`; read it on adoption or revision. Preserve completed work and valid evidence.
- v6 supersedes historical instructions prohibiting task WORKs from committing/publishing branches, requiring a handoff for every change, or requiring every WORK to repeat full CI, all browser screens and DEV checks. Explicit newer user instructions take precedence.
- Use a dedicated branch from latest develop. Complete the assignment and necessary local validation, then publish a **Ready for review PR to develop**. Authenticated GitHub Plugin/Connector writes are valid; terminal push is not the only path. Draft PRs are not the normal handoff.
- Task WORKs validate the changed area. Integration WORK owns semantic integration, merge, final full CI/regression and necessary DEV verification. Task WORKs do not merge their own PRs or promote staging/main.
- Consult `docs/CI_VALIDATION.md` for executable validation scopes. Unknown/shared changes retain full regression. Required checks and high-risk intermediate verification remain mandatory.
- PRs record purpose, policy version, baseline SHA, touched areas/dependencies, executed checks/evidence, and unverified items with their next owner. Use the diff for file lists; do not create redundant manifests or evidence copies for a normal PR.
- Never overwrite develop with an old snapshot, force push, rewrite history, expose secrets or replace real saves. Initial import/35-file migration records are historical.
- Do not add mandatory multi-agent loops, full asset regeneration or blanket browser/performance sweeps to a bounded task. Reuse valid evidence and rerun only what changed or is at risk.
