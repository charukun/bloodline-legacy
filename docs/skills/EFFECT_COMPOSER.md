# Skill effect composition / review lab

This WORK starts from `develop` `66198ebc1b926f040e37d376399353f63af8a776`.
The subsequent canopy update `7c7924345c4e27266b31e811864cb8c0acc50592`
was incorporated before final validation, without conflicts.
Project Sources common policy v5 applies. Integration WORK owns merging.

## What is implemented

`src/render/skill-effects.js` is a stateless, versioned composition module shared
by the game's WebGL presentation and a standalone Canvas inspection stage.
It outputs bounded world-space line/shard primitives. There are six genuinely
different motion motifs: tapered cut surfaces, delayed resonant wavefronts,
ballistic stone fragments, tensioned crossing threads, crawling/erupting embers,
and inward torn shadow silhouettes. No palette control or color-only variants.

The lab exposes six motifs, four paths, three beat patterns, four contact
morphologies and three endings. The 864 supported parameter combinations are
**effect configurations, not 864 authored skills or validated combat actions**.
The long-term thousands-of-skills generation system remains a separate task.

Six authored presets can be edited, replayed at 1×/0.5×/0.25×, scrubbed, stepped
at 1/60 second, compared with a pinned A configuration, or inspected in grayscale.
Portrait A/B is stacked. Export/import uses a versioned JSON recipe including seed.
The lab's optional synthesized sounds have distinct envelopes/voice structures;
they require a user gesture and use bounded, explicitly stopped Web Audio sources.
They do not replace the game's existing damage/guard audio.

## Game integration

Eighteen authored IDs have explicit stable recipe bindings: thread 60010–60012,
contest 60040–60042, bell 60060–60062, stone 60080–60082, ember 60090–60092,
unexpected 60110–60112. Lookup is a Map, not a catalog scan or seed reroll.
Other IDs keep their established presentation. Every bound ID has a distinct
composition even after ignoring seed.

`CombatPresentation.cut` uses the existing SkillMotion beat for the new motifs.
Actual weapon-tip trails retain their existing path. Contact motifs are only
created by confirmed `hit` events, using event skill ID, direction and frozen
body contact position. Guard/parry, damage, stamina, movement, camera, discovery,
save/restore and choreography timing are unchanged. New contact effects expire
within 0.55 s and share the existing bounded event queue.

Per-renderer composition budget: 512 primitives per frame, 256 at low quality.
No new per-skill geometry cache, GPU buffers, polling loop or game save extension.
Render needles and boxes reuse the established mesh resources. The sample's
faceted 2D shard adapter is a diagnostic representation of the same primitives;
it is not a screenshot of the full game's WebGL renderer.

## Reproduce

```sh
npm ci
npm run build:skill-fx-lab
node --test tests/skill-effects-composer.test.mjs
npm test
```

Open `dist/skill-fx-lab.html` directly. It embeds all CSS/JS, makes no network
requests and only uses optional `bloodline-skill-fx-lab-v1` local storage.
It never opens or changes a game save. Invalid/oversized recipe imports leave
the current recipe intact.

`node tools/skill-fx-lab/evidence.mjs` produces native Canvas review frames using
the same inspection adapter. These are offline rendering evidence, **not browser
or physical-device verification**. Browser automation for local URLs is blocked
in this environment; visual browser playback and listening remain user review.

Tests cover all compositions for finite/bounded geometry, deterministic import
and seeking, grayscale geometry differences, ending motion, stable ID binding,
confirmed-hit-only integration, frozen impact positions, expiry, frame budget,
sound lifetime, and DOM controls (edits, seek, step, A/B, reset, isolated storage).

Validation on 2026-09-09: 236/236 repository tests passed, including eight focused
composer tests. DEV build and deployment integrity check passed. A native CPU
sample of six simultaneous effects (1,000 measured frames after 100 warmups)
was 0.51 ms at p95. This measures primitive generation only, not GPU/browser FPS.
