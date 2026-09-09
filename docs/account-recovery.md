# Account linking and device recovery

Source: supplied Common Development Policy v5 and implementation prompt v2, with the explicit account-linking/device-transfer request in this WORK. Initial base: develop `10fb501e635f953c529dfbfc6898d8c0fd21e66c`; integrated develop `56588fe73bb9716cf619afeae1ce128023a0a7f5`, preserving movement interpolation and Chromium-install improvements. Existing gameplay and offline/online authority remain unchanged.

## Player flow

Open Settings → アカウント連携・引き継ぎ. Register a passkey with the browser credential manager and save the 192-bit recovery code somewhere outside the device. Play without linking remains available. On another device, use the passkey or recovery code, inspect the family/name/age/generation and cloud-save time, then explicitly choose the offline or shared journey.

This is a WebAuthn account, not an OAuth Google/Apple login-button integration. It needs no email delivery, OAuth client secret or external identity-service account. Compatible credential managers may sync the passkey or offer cross-device authentication. A device-bound key alone does not guarantee recovery after loss; the UI also provides a recovery code and additional passkeys. Browser/OS credential-manager behavior still needs real-device verification.

The fixed HTTPS hosting origin is the relying-party ID. DEV, STAGING, PRODUCTION and normal/demo mode accounts are separate; the passkey picker includes the mode. Changing the hosting domain requires a passkey registered for that domain or recovery-code verification. No deployment secrets or account IDs are entered by players.

## Identity and takeover

- Registration binds the server's existing anonymous session owner; it never trusts a supplied owner/player ID. Offline-only linking creates an identity without creating a multiplayer character.
- SimpleWebAuthn/server **14.0.1** verifies challenge, origin, RP ID, signature, presence, user verification, user handle and signature counter. Registration requires discoverable credentials and user verification. Algorithms are ES256/RS256; private keys never enter the application/server.
- Short-lived challenges are single-use and memory bounded. Restarting during a challenge requires starting verification again. Authentication produces a durable, origin-bound, five-minute confirmation ticket; it does not immediately replace the current account or local record.
- Confirmation atomically rotates the bearer credential and account reference in the same SQLite transaction. The former credential cannot call `/join` to renew itself. The player's owner, player ID, ACK, receipts, current state and inheritance choice are retained.
- Connected combat/conversation/selection defers another device's takeover. The device confirming its own switch may leave its own settings, but combat safety still applies. A disconnected device can recover its exact in-flight state without waiting for the absent device to finish a prologue or inheritance choice.
- The new random credential is generated and stored locally with the pending confirmation before submitting it. A lost reply can be retried with the same credential/ticket, including across server restart; only hashes are persisted server-side. No abandoned retry creates a new family.
- Adding/removing passkeys and replacing the recovery code require recent passkey verification. The final passkey cannot be deleted. Logout revokes the device credential while retaining account, family and cloud data for later authentication.
- Recovery codes are consumed on confirmation and replaced atomically. The replacement code is prepared locally before confirmation, so a lost reply does not lose the only recovery method. Codes are SHA-256 hashed server-side; plaintext is kept temporarily on the initiating device until the player acknowledges saving it. Tokens, tickets and codes never appear in URLs or logs.
- API requests require an exact Origin, same-site context and the existing client compatibility contract. Requests, challenge counts, passkey counts and rate buckets are bounded. Authenticated clients have separate rate buckets so players sharing an IP do not share the cloud-save quota.

## Offline cloud slot and local protection

Online state stays in the authoritative Simulation checkpoint. The account's separate offline cloud slot cannot be imported into that world or grant online ownership, items or skills.

After linking, successful local saves schedule a cloud copy at most once per minute while visible; Settings also offers an explicit save. Offline/local saving continues when the network is unavailable. The displayed timestamp is the last acknowledged cloud save, not a guarantee that unsent local progress reached another device. No new per-frame loop or periodic polling was added.

Cloud writes validate the retained rules runtime, save schema, mode and offline profile. Each uses an expected revision; a conflict stops automatic uploading without blocking local gameplay or overwriting the newer cloud record. A retry with identical bytes is idempotent. Changing the local family through import also stops automatic upload instead of silently replacing the linked slot.

Cloud content is SHA-256 checked on read, stored in bounded chunks (16,000 characters), and limited to approximately 2 MiB per request. The current manifest/chunks and previous version are committed transactionally; an older previous version is removed. Records too large to sync retain the existing local save/export path. A schema or validation failure leaves the current local record and retry context intact.

Before switching, the device preserves the previous local save, profile and guest credential. The offline record can be exported using the existing portable-save format; an unlinked shared family can be resumed from Settings. Record selection, migration and remote confirmation precede local replacement. Storage failure blocks takeover when the backup cannot be written; a partial local installation retains the backup and pending credential for retry. Families are never automatically merged.

## Storage, deployment and rollback

`LiveContract.account = 1` is independent of build SHA, protocol 1, session 1 and save schema 4. Accounts are versioned sidecar records (`accounts-index`, `account:<id>`, `cloud:<id>:<revision>:<part>`) in the existing GameWorld Durable Object. No new namespace, binding, paid provider or schema migration is required. New Workers can read old checkpoints that lack account data. Unknown account formats or missing indexed records fail closed.

The rollout gate rejects a candidate that removes deployed account support. Compatible rollback must retain this account module, its storage reader and current rollout guard, just as existing rollback must retain deployed rules archives. Never deploy a pre-account worker after linking is enabled or roll the checkpoint back to resurrect revoked credentials. Root production dependencies are installed for Worker bundling in both CI and deployment; server cryptography is not added to the browser bundle.

Known platform limits remain: one world per environment/mode, the existing 200-session capacity, and anonymous accounts cannot be recovered if the player never linked them. This feature is not an email-based support/recovery service and does not prove entitlement from a copied offline save.

## Verification

- Real P-256 software-authenticator fixtures exercise the production verifier: origin/RP/challenge/UV/signature/user-handle/counter failures, replay, cross-family binding, fresh verification, code rotation, expiry, ownership transactions and restart.
- Real UI/Game/Simulation DOM tests cover linking, cancel, preview-before-switch, offline restoration, previous local/guest records, lost replies, migration/quota failure, stale upload, logout, input preservation and bounded autosave.
- Existing gameplay/live-update/save regression suite remains required. Old SSE cancellation is tested not to stop input belonging to the replacement lease.
- `node deploy/live-runtime.test.mjs dev` exercises actual workerd, SQLite, registration/sign-in cryptography, restart, token rotation, offline cloud round-trip and the retained online family in the existing CI runtime gate.
- Browser navigation to local preview was rejected with `ERR_BLOCKED_BY_CLIENT`. DOM tests and software signatures do not claim browser layout, OS passkey prompts, synced-key transfer, or Pixel Fold biometric verification. Integration should exercise those flows on the HTTPS DEV origin after merge.

Implementation references: [SimpleWebAuthn server](https://simplewebauthn.dev/docs/packages/server), [Google server-side passkey registration](https://developers.google.com/identity/passkeys/developer-guides/server-registration), [Google server-side passkey authentication](https://developers.google.com/identity/passkeys/developer-guides/server-authentication).
