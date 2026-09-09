# Live Update / Multiplayer Compatibility

## Audit and sources

- Project Sources: Common Development Policy **v5** and Implementation Prompt **v2 (2026-09-08)**, supplied with this WORK. The explicit WORK request and policy v5 supersede the prompt's older handoff-only GitHub restrictions.
- Initial implementation: `develop @ be5f92ceb734cee7ed5d9860c2202b974f142f24`. Rebased onto `cd5f034` after the lineage UI, facility buttons and skill choreography merged; all three were retained.
- Available reference HTML has `/api/join`, `/api/command`, EventSource, local save schema 3, and the existing Simulation. No additional standalone confirmed multiplayer specification was retrieved. Preserve the current Simulation's gameplay; this change supplies its missing server boundary.
- The baseline deployment explicitly returned `online:false` and 501 for game APIs. There was **no deployed multiplayer server**, durable session, reconnect recovery, protocol negotiation, or live-build detection to harden. There is no pre-existing server data to migrate on first activation.
- Browser references describe rendering; this WORK does not claim a visual-reference upgrade.

## Versions and authority

| Identity | Definition | Lifetime / decision |
| --- | --- | --- |
| Build | existing CI environment + full commit SHA | Display the identity embedded in the current HTML. Never replace it with fetched metadata. |
| Protocol | `LiveContract.protocol = 1` | HTTP command envelope and SSE framing. Mismatch is HTTP 426, not a network outage. |
| Snapshot | 1 | Full authoritative state contract. |
| Session | 1 | Persisted anonymous bearer credential, owner, player, ACK and connection lease. |
| Save | 4, reads 3–4 | Validated, non-destructive schema-3 migration; unknown schemas stop. |
| Rules | SHA-256 of compiled Simulation + skill catalog/runtime + dialogue | Immutable server runtime retained for worlds already running it. |
| World epoch | random UUID at rules activation | Fences commands from a previous rules incarnation. |
| Connection lease | new UUID on every join/resume | Fences in-flight requests, replaced tabs and pre-deploy connections. |
| Revision / ACK | persisted monotonic counters | Reject stale snapshots, sequence gaps and conflicting command replays. |

The authoritative game logic is generated from the **same existing Simulation sources**. `tools/archive-simulation.mjs` stores its immutable server bundle in `src/server/engines/`. No second implementation of combat, damage, progression, skills or inheritance was written. The browser still runs the existing Simulation for offline play; shared play only renders server snapshots.

When any Simulation input changes, run `node tools/archive-simulation.mjs` and commit the new archive/registry along with that change. Build validates its content hash and refuses an unregistered runtime. Do not rewrite or delete a deployed archive. Client snapshots retain the existing unknown-skill fallback; removing a gameplay field or its interpretation requires an explicit snapshot-contract release, not a cosmetic build.

## Playing through deployment

- Compatible visual/build changes coexist indefinitely. A small parchment notice offers **記録して更新**. There is no automatic reload.
- Poll `/version.json` every 90–105 seconds while visible, and on foreground/network restoration. Failed or incomplete manifests never interrupt gameplay.
- Different game rules remain pinned to the existing saved runtime. A new client retains compatibility with the registered old runtime and can join immediately after deployment.
- A changed rules runtime starts a **five-minute grace period**. Activation waits for all world actors to be safe and active clients' conversation/menu/save presence to be clear. The grace deadline never overrides combat safety.
- Before the deadline, all active clients must support the target rules. After the deadline, an old client may be disconnected **only at the safe world checkpoint** and receives update/resync guidance; stale commands cannot enter the new epoch. A final old-contract safe snapshot is sent before closing the old stream.
- Safety excludes attacks, combos, pending skills, injury reactions, nearby hostile actors, movement, dash, prologue, speech, queued boarding, rescue and facility activity. Death must be recorded. Client presence also excludes conversation, inheritance/menu selection, start, import and save processing.
- The notice's update request waits for safety. It downloads and SHA-256 verifies the complete candidate HTML, rechecks safety **after** download, obtains a durable checkpoint (or an explicit protected-progress compatibility rejection), then navigates. A failed save or wrong asset hash leaves the current page intact.
- JS, textures and models remain embedded in one HTML document. Document and metadata responses revalidate; an explicit `?build=<SHA>` navigation is rejected if the release changed again. No service worker or mixed external asset cache was introduced.

## Reconnect, sessions and commands

`GameWorld` is a SQLite-backed Durable Object, isolated by deployment environment and game mode. A serialized queue owns all mutations. It runs the existing 30 Hz Simulation and emits full snapshots at approximately 10 Hz; it commits the checkpoint before a response or snapshot is sent. A slow SSE reader is disconnected rather than accumulating unbounded memory.

Sessions are random bearer credentials. The server persists their SHA-256 digest, binds the authoritative owner/player itself, and ignores client ownership claims. Tokens stay in the existing per-mode client storage; SSE uses `fetch` with headers, so credentials are not placed in URLs. There is no account/password service in the baseline. Possession of the credential renews an idle 30-day session with the same family; an unknown credential does not silently create a replacement family.

Every join/resume issues a new lease and a complete snapshot with epoch, revision and last committed ACK. Reconnection clears movement, queued commands, transient presentation effects, map/interpolation caches and stale event replay. An uncertain command is not blindly replayed; its outcome is recovered from the authoritative state/ACK. Receipt history makes identical retries idempotent and rejects a different command with the same sequence. Commands cannot set player IDs, damage, position snapshots or family data directly; the existing Simulation validates game actions.

Backgrounding closes the stream and releases input. Foreground resets frame accumulation, checks deployment metadata and resumes the same session before accepting commands. Network retries use exponential backoff with jitter. 401 (credential), 409 (lease/state), 426 (compatibility), and 503 (storage/recovery) have separate handling. An active shared world continues while someone is connected; an empty world does not simulate a wall-clock backlog on restart. Persisted in-flight combat and RNG are restored exactly, not reset to idle during a server restart.

## Save migration and rollback

Offline schema 3 is read from the original `aerin.tactics.v3.world.<mode>` key. Before writing schema 4, its exact bytes are backed up. Schema 4 uses `aerin.tactics.v3.world4.<mode>` and bundles its associated profile in the same atomic value. The old key remains readable and untouched: a cached pre-foundation JS tab cannot overwrite the new-format journey. Same-generation stale writes are detected against the loaded bytes. Unknown/corrupt records block new gameplay and writes; they are never replaced with a blank world. Import validates and backs up before swapping the journey.

Server migration constructs and validates a separate Simulation, then stores the previous checkpoint and replacement in one storage transaction. Failure retains the old runtime and data. A missing runtime or unreadable checkpoint fails closed; it does not create a replacement world. Storage failure prevents ACK and streaming of uncommitted state.

`deploy/check-rollout.mjs` runs **before Wrangler deploy**. It rejects a candidate that cannot read the deployed save format, drops a retained runtime, replaces an active game with a holding page, or directly changes wire/session/snapshot versions. Future major wire changes must first add a retained adapter through an expand/contract release; merely incrementing the integer is deliberately not deployable. Supported rollbacks apply old rules to the **latest** save using the retained runtime, never the pre-migration backup. A forward fix must retain any runtime/schema that was already written.

The platform can deliver new Worker and old Durable Object code concurrently, and can close connections on code updates. This is why the implementation pins rules and does not rely on a shutdown save hook. See [Cloudflare lifecycle](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/) and [storage](https://developers.cloudflare.com/durable-objects/api/legacy-kv-storage-api/).

## Verification and integration

- `npm test`: existing gameplay/UI regressions plus live compatibility and actual Game save tests.
- `node deploy/build.mjs dev` / `node deploy/check-build.mjs dev`: embedded build identity, compatibility manifest, immutable runtime and asset-byte integrity.
- `node deploy/live-runtime.test.mjs dev`: real workerd/SQLite, two players, command ACK, SSE advancement, worker restart, same-session recovery and stale-lease rejection. Runs in CI after the deployment artifact is built, without adding DEV browser tests.
- `node tests/skills/lives.mjs`: existing multi-life progression regression.
- Added scenario coverage: same-version players, mixed compatible builds, rejected protocol mismatch, rules grace/activation, combat deploy, immediate join, disconnect/deploy/reconnect, mobile lifecycle, stale/repeated commands and snapshots, schema migration, credential renewal, migration/storage failure, conversation presence, cache mismatch, requested safe update, save quota failure and rollback gates.
- Local baseline after fetching historical test commits: 187 existing tests. Local implementation before latest-develop integration: **218/218 PASS**, including **31 new live/save/rollout scenarios**. Final integrated results are recorded in the PR.
- Node 24 measurement, 30 simulated players, 100 batches of three ticks plus checkpoint serialization: p50 **1.75 ms**, p95 **5.55 ms**, max **15.14 ms**, checkpoint **114,956 bytes**. This is CPU-only, not deployed storage latency or device FPS.
- Browser navigation to the local game was rejected with `ERR_BLOCKED_BY_CLIENT`. Local Wrangler reported `uv_interface_addresses` failure; local workerd startup could not complete in this environment. These are **not** browser/runtime passes; the runtime gate remains required in CI.

Initial-rollout boundary: pages already open before this foundation have no update detector and require one normal reload to acquire it. No new code can retroactively add handlers to already-running old JS. Their legacy save key is isolated from new writes. Do not roll hosting back to a pre-foundation release after new-format saves exist.

Integration must merge this branch through develop and verify the runtime CI gate before deployment. Production's existing holding flag remains false. Real Cloudflare deployment interruption and Pixel Fold foreground/visual behavior still require post-merge environment verification. Anonymous credential loss, multi-device account recovery, production capacity/load testing and eventual retirement of old runtime archives are not an existing account/backend capability and are not claimed complete here.
