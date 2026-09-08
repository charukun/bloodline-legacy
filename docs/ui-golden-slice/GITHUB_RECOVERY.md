# GitHub write recovery — UI WORK

## Preserved state

- Repository: `charukun/bloodline-legacy`
- Local branch: `work/golden-ui-20260908`
- Base develop commit: `9ee25afc5f67e142adc313813b4289d157d47935`
- Existing HEAD: `266ddec32ace5f62837d8c761ad0ee6fc34e9a17`
- Fetch and push remote: `https://github.com/charukun/bloodline-legacy.git`
- Existing commits, in order:
  - `1a1a362c6052eb1478707d99008b21af1080bb27`
  - `6ccdbe250f26c680f32f1d00b5088fec00388208`
  - `266ddec32ace5f62837d8c761ad0ee6fc34e9a17`
- No reset, rebase, cherry-pick, force push, or merge was performed.

## Reproduced failures

Command:

```sh
git push --set-upstream origin work/golden-ui-20260908
```

Complete stderr (exit 128):

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

This shell attempt did not return HTTP 403: it lacked HTTPS credentials.

The separate authenticated connector attempt to create the same remote branch from the recorded base returned:

```text
GitHub API error 403: {"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/git/refs#create-a-reference","status":"403"}
```

A separate attempt to create a Git blob containing the existing `src/ui/presentation.js`, without touching any branch, returned:

```text
GitHub API error 403: {"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/git/blobs#create-a-blob","status":"403"}
```

The collaborator-permission endpoint also returned:

```text
GitHub API error 403: {"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/collaborators/collaborators#get-repository-permissions-for-a-user","status":"403"}
```

## Diagnosis

| Check | Observed result |
| --- | --- |
| Existing code and commits | Preserved; tracked worktree clean before this report |
| `git fetch origin develop` | Succeeded; develop still equals the recorded base |
| Shell credentials | No configured credential helper, extra HTTP authorization header, `GH_TOKEN`, `GITHUB_TOKEN`, `GIT_ASKPASS`, or SSH agent |
| Connector identity | Authenticated as `charukun` |
| Repository metadata | Public, not archived; account permissions include admin and push |
| Plugin status | GitHub installed and enabled |
| App installations exposed by connector | Empty installation list and empty installed-account list |
| Remote work branch | Not found by connector search or public branch API |
| Rules applying to work branch | Public `/rules/branches/work%2Fgolden-ui-20260908` returned HTTP 200 and `[]` |
| Repository rulesets | Public `/rulesets` returned HTTP 200 and `[]` |
| develop protection | Protected; no direct push was attempted |
| Branch-independent Contents write | Git blob creation denied with HTTP 403 |
| PR write | Not independently tested; no remote head exists from which to create the requested PR |

The two independently reproduced blockers are absent shell authentication and insufficient effective integration permissions. Repository ownership permissions do not establish the connector token's effective permissions. A branch-independent blob rejection means changing the branch name or relaxing develop protection would not resolve the observed authorization problem.

GitHub documents this error as insufficient token permissions: [REST API troubleshooting](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#resource-not-accessible).

The installation list is evidence about what this connection exposes. It does not prove that no GitHub App is installed anywhere on the account, nor reveal the exact OAuth token type or missing permission grant. Connector responses do not expose the `X-Accepted-GitHub-Permissions` response header.

## Recovery in progress

The exposed plugin tools cannot install a GitHub App, approve its repository permissions, refresh OAuth credentials, or provide Git credentials to this shell. ChatGPT action-confirmation settings are not GitHub OAuth scopes; changing them would not fix the server-side 403.

Official GitHub CLI v2.100.0 was downloaded from `cli/cli` and verified against its published checksums (Linux amd64 archive SHA-256 `e4d4bb4498e8d007abe545b6568926793ace1b6447da598294a610018cb164be`). Its supported device authorization flow was started successfully and issued a one-time code. Authentication is waiting for the account owner at `https://github.com/login/device`; no access token has been obtained. The one-time code is intentionally not stored in this report.

The CLI uses a dedicated, mode-0700 temporary configuration directory outside the repository and handoff. It requests HTTPS Git authentication and the additional `workflow` scope because this existing branch changes `.github/workflows/deploy.yml`. No SSH key is generated or uploaded. This route preserves the existing checkout and commits. No passwords or tokens should be pasted into this report, a PR, or a handoff.

See the official [GitHub CLI authentication documentation](https://cli.github.com/manual/gh_auth_login). The remaining owner authentication is a real GitHub authorization requirement; it is not an additional approval imposed by the development policy.

After successful authentication, push only the existing work branch, create a PR with base `develop`, then validate the resulting CI. No merge is authorized. Remaining browser, matched screenshot, mobile and frame-pacing gates remain as recorded in `SESSION_RECORD.md` until actually executed against this work branch.

## Follow-up after the owner completed device authorization

The owner reported successful entry of this session's device code. Retrieving the CLI completion then failed at the execution boundary:

```text
Unified exec process failed: Network access to "https://api.github.com:443" was blocked by policy.
```

A read-only GitHub API connectivity probe was requested with escalated execution permission. The execution policy rejected that request because `sandbox_approval`, `rules`, `skill_approval`, and `request_permissions` are disabled. The probe did not execute. The dedicated CLI `hosts.yml` was absent when checked, so this WORK cannot claim that CLI credentials were persisted or that authentication completed in the shell.

The separately authorized managed connector was rechecked: identity remained `charukun`, its exposed installations list remained empty, and this exact work branch was still absent. Its attempt to create `work/golden-ui-20260908` from the recorded base again returned the complete refs HTTP 403 error quoted above.

This is now blocked by both the execution environment's network policy and the connector's effective GitHub write permissions. No new device code was requested from the owner because that would not resolve the observed network policy denial. No token, alternate host, proxy, copied credential from another WORK, or browser workaround was used to circumvent it.

The original three commits, the recovery-diagnosis commit `34c5c61`, and this follow-up remain on the same local branch. The fallback bundle is updated to preserve all commits, plus the complete patch and source snapshot. This is an authorization/environment blocker, not completion of the UI acceptance gates. Once an authorized environment can reach GitHub, resume from the preserved branch and follow the push → PR → CI → browser verification flow without resetting the work.
