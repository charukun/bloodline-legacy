# Automated develop integration — reference

The common policy remains [v7](COMMON_DEVELOPMENT_POLICY.md). This document describes
the implementation in this tree, not proof that the automation is already installed.

## Runtime

`automated-integration.yml` is a short-lived GitHub Actions reconciler. Ready PR,
PR update, CI completion and a 15-minute recovery schedule wake it. It reloads the
current queue; no ChatGPT session, ChatGPT scheduled task, dummy PR, external server,
PAT or paid merge queue is required. The GitHub schedule can be delayed; it is a
recovery mechanism, not a latency guarantee. No PR means no merge or deployment.

The repository is personally owned. GitHub's merge queue is currently available
for organization repositories, and ordinary auto-merge does not analyze dependency
or shared-boundary interactions. The reconciler uses the standard protected PR
merge API with an expected head SHA and the job-scoped `GITHUB_TOKEN`.

## One-time activation

1. Review and merge the implementation PR into `develop` through the normal process.
2. Set the repository's **default branch to `develop`** in GitHub settings. The
   default is currently `main`; GitHub loads `pull_request_target`, `workflow_run`
   and scheduled listeners from the default branch. A develop-only PR cannot
   change this setting. This changes neither main's code nor its deployment.
3. Confirm `Automated develop integration` appears in Actions. Its next matching
   event or scheduled run processes the existing queue; a manual run is also
   available. Inspect the first run's `integration.json` before claiming activation.

The alternative to step 2 is installing just the listener on the existing default
branch through its normal reviewed release process. That is a separate main change
and can trigger the existing Production pipeline; do not copy game changes to main
as an integration setup shortcut. This WORK's deliverable is a develop PR.

No branch protection is disabled or bypassed. The runtime reads classic protection
through GraphQL and effective ruleset rules through REST. Missing permission or
incomplete evidence blocks mutation. If GitHub rejects the ordinary merge operation,
report the concrete blocker; do not add an administrator bypass. The API connection
used by a WORK and the Actions job token can have different read permissions.

Set repository variable `AUTOMATED_INTEGRATION_PAUSED=true` to stop future mutation
runs. Already running final validation/deployment should be allowed to finish.
GitHub can disable schedules after inactivity; PR/CI event listeners remain the
primary wake-up mechanism while the workflows are enabled.

## Decision and batching

| Evidence | Behavior |
| --- | --- |
| Open, Ready, develop, same repository, writer-authored | Candidate |
| Draft, closed, staging or main | Excluded |
| Fork/untrusted author, unknown protection, incomplete files | Human blocker |
| Conflict, change request, unresolved discussion or hold label | Human blocker |
| Pending, unstable, behind or unknown effective merge state | Wait, never treat as green |
| Exact-head general CI, Character and published Review Lab | Required; retain existing check names |
| Other current-head failed/pending workflow, status or check | Block/wait; required contexts also checked |
| Dependency not merged into develop | Wait; topology orders the current queue |
| Closed-unmerged/self/cyclic/malformed dependency | Human blocker |
| Changed file or shared domain also changed on develop since the PR branch point | Require a current head/base-bound review |
| CI, automation, deployment, dependency or policy control changes | Require the same bound review; never self-approve |
| Independent candidates | Merge up to eight, refreshing develop and PR state for each |
| Save/network, shared state/input/registry, combat/animation or rendering change | End the batch after this PR; run the necessary intermediate final checks |

The controller reads GitHub metadata and never executes PR code or imports PR
artifacts. Only merged develop controller code runs with write permissions. PR
contract tests and live audit use read-only permissions and no deployment secrets.
Renames include both paths; a capped/incomplete comparison is UNKNOWN. Semantic
overlap is conservatively flagged by shared-domain/file intersections. This is a
deterministic gate, not an AI specification or art-quality reviewer.

The canonical dependency field is a standalone PR-body line:

```text
Depends-On: #123, #124
```

Use `Depends-On: none` when appropriate. Omitted declarations mean no declared
dependencies; ambiguous dependency prose is flagged, not executed as instructions.
The controller also checks the changes independently of the declaration.

When a control change or shared overlap needs human review, a repository writer
can add this standalone PR conversation-comment line after reviewing both revisions:

```text
Integration-Approved: <40-character-current-head-SHA> <40-character-current-develop-SHA>
```

Only an exact pair from a current writer and a non-bot account counts. An approval
does not waive failing checks, conflict, a change request, unresolved threads,
dependencies or GitHub protection. A new head or develop SHA requires re-evaluation.
`integration:hold` and `do-not-merge` labels explicitly hold a PR.

## Final validation and recovery

GitHub suppresses push/closed workflow events caused by `GITHUB_TOKEN` merges.
The controller therefore explicitly dispatches **the existing deploy workflow** at
develop, passing the final SHA, the batch's original develop SHA and merged PRs.
Intermediate bot merges do not start full CI/DEV/Character/Review deployment loops.

That dispatch checks exact ref/SHA identity, performs full regression and Workers
durability, deploys the tested DEV artifact and verifies HTTP/manifest/hash identity.
It calls the existing Character workflow with the **whole-batch baseline** and the
existing Review Lab browser/build/publish workflow. Applicable Character changes
retain Full Review; documentation-only batches do not force Character rendering.
Review Lab verifies exact-sha desktop/mobile behavior and published access denial.
Its cleanup removes only closed PRs' isolated previews, compensating for the
suppressed `closed` events. DEV HTTP is not proof of real-device WebGL performance.

`Record integrated develop result` fails if any required job failed, was cancelled,
or was skipped, or develop moved. A normal manual dispatch with no integration SHA
still validates without deploying. No integration dispatch can deploy staging/main.
The next batch waits for the previous final result. Failures require repair or an
explicit rerun of that failed workflow; a scheduled run does not loop expensive
failed builds indefinitely or turn a failure into success.

Each bot merge commit stores an immutable `Bloodline-Integration` JSON marker with
the original baseline and merged PR list. If the process stops after merge or the
dispatch response is lost, the next invocation locates the exact-SHA workflow or
recovers its missing dispatch from the marker. A completed/queued matching final
run prevents re-merging that batch. Actions concurrency serializes controllers and
preserves deployments; existing superseded revision and PR-cancellation guards remain.

GitHub's REST merge API atomically guards the PR head, but has no expected-base
argument. The controller checks base immediately before merge and verifies both
merge parents afterwards. External/manual merges during a batch are therefore a
detected race, not guaranteed exclusion. The batch stops and requires final
validation; it never force-pushes or automatically rolls back shared history.

Evidence is in Actions summaries and `integration.json` artifacts (base/head/merge
SHA, decision, dependencies/impact, checks and final dispatch). A green read-only
audit is **not** proof of real merge authority, dispatch, deployment or activation.
The implementation PR must report those stages separately as VERIFIED/UNVERIFIED.

## References

- [GitHub merge queue availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [Workflow events and default-branch behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GITHUB_TOKEN event suppression and dispatch](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Existing validation ownership](CI_VALIDATION.md), [Review Lab](REVIEW_LAB.md)
