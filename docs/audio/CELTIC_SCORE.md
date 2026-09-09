# Celtic music revision

The composition and source recordings below are retained. The HTML media-deck
runtime described here is superseded by [game audio lifecycle](GAME_AUDIO_LIFECYCLE.md),
which uses bounded Web Audio chunks to avoid mobile media transport controls.

Base: latest develop at start, `cd5f0344a176802dbfbfd3e9d28edadcd98a9907`.
Branch: `work/celtic-score-20260909`. Project Sources policy v5 and implementation
prompt were consulted. The user explicitly expanded this WORK's scope to music,
asking for more Celtic BGM patterns and grandeur. Gameplay, UI and visual assets
are unchanged. A listening page and playable build are provided before a new PR.

The old scheduler has three 48-eighth-note themes lasting roughly 10–13 seconds,
played through sine/triangle oscillators with a short delay. That source remains
as a legacy implementation for its existing sound-effects methods, but the normal
bootstrap selects CelticScoreAudio and never calls that procedural music scheduler.

The four original sample-rendered recordings are 73, 82, 98 and 61 seconds long:

| Track | Musical role |
|---|---|
| 風待ちの広場 | Mixolydian village tune, harp, flute and fiddle answers |
| 遥かな丘を越えて | Dorian journey theme, broader strings, horn answers and a quiet pipe passage |
| 受け継がれる灯 | Restrained harp/flute opening, sustained string and horn climax |
| 血脈の旗のもとに | Faster minor battle theme, percussion, fiddle and orchestral responses |

Every track has intro, A, answering variation, B climax, quieter bridge, expanded
return and coda. Written melodies, triadic voicings, hand-adjusted register/roles,
small deterministic timing/velocity variations and string expression arches replace
the same short equal-length electronic note loop. Stereo room response and final
loudness processing are baked offline. These are sample-based arrangements, not
live Celtic/orchestral performances. Musical quality is subject to user audition;
waveform measurements do not establish that artistic judgement.

## Runtime

- Two reusable HTMLAudioElement decks and two GainNodes feed the existing music
  bus, master volume and limiter. No SoundFont, musical note scheduling or full-track
  decoded AudioBuffers are added to the client. Existing positional FX/rain/wind
  remain on their current paths; the old music echo is disabled for the new masters.
- Village alternates hearth/legacy; outside road/legacy; front battle/road. Track
  tails crossfade for 3 seconds. Area changes require 2.5 seconds of persistence
  and 12 seconds since the previous switch to avoid boundary reset loops.
- Mute/background pauses both decks; reactivation resumes the current phrase.
  Generation tickets protect against late play promises. Decoder/autoplay failure
  uses an 8-second retry backoff; denied playback also retries on the next gesture.
- MP3 is embedded for offline downloadable HTML, so no streaming host, API key or
  third-party network request is needed. At most two music decks play during fades.

## Cost and verification

Four 128-kbps stereo MP3s total **5,037,837 bytes**. Embedded base64 adds about
6.72 MB before compression; the initial download/HTML size increases. This is a
tradeoff for richer prerecorded sound and bounded runtime playback, not a claim
that memory usage or mobile FPS improved. Rendering passes and meshes are unchanged.

All four assets decoded with ffmpeg, durations checked against their manifest,
SHA-256 verified, no clipped samples detected. Decoded RMS is approximately
−21.3 dBFS; peaks range −7.6 to −5.0 dBFS at the measurement sample rate. Real
stereo differences and phrase dynamics remain; see `measurements.json` for raw data.
Authoring normalizes towards −19 LUFS with headroom for existing game effects.

Tests cover embedded asset identity, two-deck rotation/crossfade retirement,
area hysteresis, pause/resume position, stale promise races and retry backoff.
`npm test`: build and **216/216 tests PASS**, including the existing gameplay/save/UI/motion suite and autoplay-denied resume recovery. The listening page's eight start/climax controls and single-track playback were checked with a DOM harness.

UNVERIFIED: Pixel Fold playback/decoder CPU and memory, device speaker/headphone
balance, live browser autoplay/crossfade feel, and subjective music quality.
The authoring and decoder checks are not a claim of real-device listening QA.

## Reproduction

Check out the pinned GeneralUser GS and TinySoundFont revisions recorded in
`public/assets/music/CREDITS.md`, then run:

```
python3 tools/audio/author_score.py --soundfont /path/GeneralUser-GS.sf2 --tsf /path/TinySoundFont
python3 tools/audio/pack_game_music.py
npm test
```

Authoring requires gcc, ffmpeg, Python numpy/scipy. Normal build and client execution
use only the checked-in recordings and do not need these authoring dependencies.
No third-party demo composition was used. See the complete sample license alongside
the recordings; original melody authorship is distinct from instrument ownership.
