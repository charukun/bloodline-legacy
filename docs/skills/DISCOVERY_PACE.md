# Discovery pacing revision 3

BASE_BRANCH: develop
BASE_COMMIT: fad97fcc91f13f76adacb21c9257b6496396dfca
WORK_BRANCH: work/skill-system-discovery-pace-20260909

The user approved slowing newly discovered Jo/Ha/Kyu techniques to roughly one
third, slowing further as the life learns more, while retaining passive pace.

## Rules

Experience recording, duplicate-event suppression, first memento provenance,
weapon eligibility and age-4 discovery eligibility retain their existing rules.
The fast inspiration opportunity keeps its existing charge, probability, RNG
and 30-second minimum interval. A blocked active idea still consumes that
opportunity: it does not turn into an extra passive roll. Passives use this
existing opportunity path directly.

Active discoveries additionally mature their own saved charge and clock:
40% of the existing charge gain; threshold 3.65 + 0.25 per known catalog active
technique (maximum 9.5); minimum interval 105 + 15 seconds per known technique
(maximum 300); cost 4.6 + 0.35 per known technique. The interval is a lower bound,
not a guaranteed periodic unlock. Basic weapon techniques are outside this
catalog pacing and retain their existing equip behavior. There is no skill count
cap, replacement of learned techniques, or automatic phase completion.

When an active opportunity matures, candidate selection uses an independent
saved RNG. Crossed experiences receive an additional 1.6 weight; the last
learned active family receives a 0.35 multiplier. Passive family selection does
not receive these modifiers. Different sources remain necessary for a crossing;
one activity emitting multiple tags does not qualify by itself.

## Verification

157 automated tests PASS. Equal accepted event streams over 96 seeds per plan,
240 seconds each, gave these average new discovery counts:

| Experience pattern | Active before | Active after | Passive before | Passive after |
| --- | ---: | ---: | ---: | ---: |
| Craft repetition | 4.93 | 1.52 | 0 | 0 |
| Combat repetition | 4.93 | 1.52 | 0 | 0 |
| Study + care | 4.45 | 1.60 | 0.85 | 0.80 |
| Mixed life experiences | 4.11 | 1.48 | 1.98 | 1.86 |

Thus active pace is 31–36% of baseline and passive count remains within 10%.
The slower active pool can change which families remain eligible; complete
mixed-pool discovery sequences are not identical to revision 2. A passive-only
catalog does retain the exact old discovery timing and identities, including
when the active clock is blocked. Across 20 minutes of mixed input, active
counts fell from 22.47 to 6.49 while passives stayed at 3.99 versus 3.91.
Full counts / crossings / repeated families / distinct sets: pacing-results.json.

The real Simulation life/combat harness now allows 12 minutes of activities
instead of four to assemble builds at the slower pace, keeping its actual
activity/pickup/weights/combat commands and assertions. Three lives discovered
5 / 5 / 7 techniques including passives, then exercised their builds. The
separate event-only diversity cohorts still use four minutes. No skills were
injected to compensate for slower learning. Results: life-results.json.
CPU verification: performance-results.json (Node only, not rendered/device FPS).
Browser/device play feel is unverified; the existing fast DEV CI checks build,
tests and lives and provides no branch Preview URL. A standalone HTML is provided.

## Saves and integration

World save schema and skill extension version 1 are retained; only the extension
revision advances to 3. Revision-2 records, experience, known skill IDs and zero
loadout weights remain intact. Missing active pacing is initialized from the
old remaining charge at 40% and last discovery time, conservatively avoiding a
migration burst. The new opportunity clock starts at that old discovery time.
Both RNGs, both clocks and charge survive reload. New lives reset them.

Touched areas: skills engine create/restore/observe, pacing tests, life scenario
budgets and verification records. Skill definitions, runtime behavior, combat
numbers, UI and input code are unchanged. Integration WORK owns merging.
