# Game audio lifecycle

BASE_BRANCH: develop  
BASE_COMMIT: `4cb02927826b9a877d4f61e4877732840df8cd6a`  
Publication rebase: `6cdbacdb627bd10bccf9fb4a06f771881cc5dd3a`; retains the newer UI material stylesheet and build asset substitution order.  
Sources: supplied Common Development Policy v5, Implementation Prompt v2 Audio/lifecycle sections, and the user's Android notification screenshot/request. The explicit current request extends this WORK to the audio issue. Policy v5 and the user's Ready PR workflow supersede the older prompt's handoff-only restrictions.

The BGM used two `HTMLAudioElement`s through `createMediaElementSource`. Chrome exposes long-playing media elements as notification/lock-screen transports, explaining the reported music-player card. Direct Web Audio does not use that notification path ([Chrome documentation](https://developer.chrome.com/blog/media-notifications/)). This change does not manipulate Android settings or request notification permissions.

## Changes

- `GameMusicDeck` plays independent six-second MP3 chunks through `AudioBufferSourceNode` into the existing music bus and limiter. The full-track MP3s remain as authoring/listening sources but are no longer embedded into the game alongside the chunks.
- Keep the four compositions, stereo content, area playlists, three-second crossfades, boundary hysteresis and sound toggle. No musical-note synthesis or new external request is introduced.
- Each of two decks keeps at most two decoded chunks in its window and serializes its decoding work. Playback is scheduled on the audio clock, including the next chunk, rather than started at each rendered frame. At 48 kHz stereo, four six-second cached buffers account for at most 9,216,000 bytes (8.79 MiB); decoder working memory and browser overhead are additional. This is a cache budget, not measured device memory.
- Blur, hidden document and pagehide stop scheduled BGM nodes, mute the master, stop the scheduling timer and suspend the shared context. Thus FX and ambience also stop. Focus/pageshow resume the same phrase only when visible, focused and sound remains requested. User mute persists.
- Generation checks discard late decode/resume work. A stale enable result cannot turn sound back on. Autoplay rejection retries on the next user gesture without bypassing browser activation rules ([Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/)). A malformed/unsupported decoded chunk fails closed with the existing retry backoff; no HTML media fallback recreates the notification problem.

Gameplay, damage, animation, save schema, UI structure, CI gates and deployment configuration are untouched. No merge or deployment is performed by this WORK.

## Audio assets and cost

`tools/audio/pack_game_music.py` decodes the approved recordings, divides them at exact sample positions and independently encodes gapless MP3 chunks. Encoding compensates the measured LAME gain, and then checks decoded sample counts, RMS and signal-to-error ratio. Each chunk includes its own MP3 metadata; this is not a split of arbitrary compressed byte ranges. Original composition and instrument credits in `public/assets/music/CREDITS.md` still apply.

55 chunks total **5,089,373 bytes**, versus the original 5,037,837 bytes: **51,536 bytes / 1.02%** additional compressed audio. Only the new pack is embedded in the game. The repository retains both the authoring originals and the new pack. Ordinary build/CI needs neither ffmpeg nor NumPy; regenerated music is detected through source hashes and must be repacked explicitly.

All four FFmpeg-decoded reconstructions preserve exact sample counts. RMS change is **0.00024–0.00144 dB**; signal-to-error ratio is **33.05–36.82 dB**. Re-encoding is lossy; these metrics do not prove subjective transparency. See [measurements](game-music-measurements.json). The transient 192 kbps experiment was rejected in favor of this smaller, level-matched pack.

## Verification

- Build and full `npm test` after rebasing onto the publication baseline: **494/494 PASS**. This includes the source-hash build guard and the newer UI regression tests.
- Publication conflict resolved against develop `bd984a847be674825c067e9feec7d45c22458b99`, retaining upstream skill catalog generation and character/enemy modules. Build (23,596,071 bytes / 49 modules) and the 15 audio tests pass on this final integration; the 494-test full run above was on `6cdbacdb627bd10bccf9fb4a06f771881cc5dd3a`.
- 15 audio regression tests cover asset/chunk hashes and embedding, sample-aligned scheduling, bounded cache, exact pause position, serialized late decodes, disposal, malformed buffers, two-deck crossfade/retirement, area hysteresis, hidden/blur/page lifecycle, mute, pending context activation, initial-decode races and gesture retry.
- Source/constructor checks reject `new Audio()` and `createMediaElementSource` in the game BGM route. Existing gameplay/UI/save/skill tests remain intact.
- **Browser / Android device verification: UNVERIFIED.** The Work browser rejected the local built game with `net::ERR_BLOCKED_BY_CLIENT`. An offline diagnostic navigation was also explicitly blocked by its URL policy; no alternate browser execution was used. FFmpeg decoding and an instrumented Web Audio contract harness are not actual Chrome decoder, audible output or Android notification-panel verification.
- Remaining integration/device review: after deploying and reloading the new build, check Pixel Fold notification/lock screen while BGM plays; app-switch/lock/unlock; mute while away; repeated focus changes; all track boundaries/crossfades; audio decoder CPU/memory. An already retained old-build Android media card may need to be dismissed/reloaded independently of this new playback path.

## Reproduction and integration

```sh
# Only after changing the original music; requires ffmpeg and NumPy:
python tools/audio/pack_game_music.py
npm ci --ignore-scripts
npm ci --prefix deploy --ignore-scripts
npm test
```

Changed modules: `build.mjs`, `src/audio/score.js`, `src/audio/buffer-deck.js`, `src/legacy/audio.js`; tests in `tests/music-score.test.mjs` and `tests/game-audio.test.mjs`; music pack/index, authoring script and audio documentation. No deleted files. If parallel WORKs touch audio, retain their FX/music content while preserving the direct-output transport, one shared AudioContext and lifecycle cancellation here. Merge through Integration WORK only.
