# Planned-date schema extension — fixed India app timezone

**Result: PASS for the isolated fixed-India planned-date experiment.**

Executed 2026-10-20. The preceding Task/event experiment remains unchanged in `../taskify-gate1`; its earlier INCONCLUSIVE report is historical. This extension resolves its specific instant-versus-calendar-day mismatch for the supported India-only policy. It does not establish general timezone/DST support or approve production code/schema.

## Agreed behavior used in this experiment

- Travel does not alter the configured Taskify timezone. Device/host timezone is not a date-entry, display or overdue input.
- With app timezone Asia/Kolkata: 20 October EOD means the exclusive boundary at 21 October 00:00 India time; 20 October 16:00 means 16:00 India time. Labels retain India time while travelling to London.
- The account policy is fixed after setup. Timezone relocation/change is unsupported in PoC/beta and recorded as future scope in FUTURE-TIMEZONE.md.
- These are discussion agreements applied to an isolated experiment. Authoritative repository documents were not edited.

## Candidate schema

Immutable account policy (experiment only):

```json
{"ownerUid":"owner","timeZone":"Asia/Kolkata","utcOffsetMinutes":330}
```

Rules permit only this known zone/offset pair and deny policy update/delete. They do not trust a browser-supplied arbitrary offset. Other zones fail closed; this is not a general named-zone resolver. The prototype profile contains only these policy fields; production profile/settings layout remains undecided.

Each non-null plannedStart/due is a map:

```text
at            Firestore Timestamp: resolved instant
 day          Firestore Timestamp: selected civil-date marker at 00:00 UTC
precision     "date" or "time"
endExclusive  Boolean: Due uses the next-midnight boundary for its selected day
```

`day` is a date key encoded in a Timestamp, not the deadline instant or India midnight. Example:

| Input | at (UTC) | day (date key) | precision | endExclusive |
|---|---|---|---|---|
| Start 20 Oct, date-only | 2026-10-19 18:30Z | 2026-10-20 00:00Z | date | false |
| Due 20 Oct, EOD | 2026-10-20 18:30Z | 2026-10-20 00:00Z | date | true |
| Due 20 Oct, 16:00 IST | 2026-10-20 10:30Z | 2026-10-20 00:00Z | time | false |
| Due exactly 21 Oct, 00:00 IST | 2026-10-20 18:30Z | 2026-10-21 00:00Z | time | false |

A Night shortcut ending at next midnight may use time precision plus endExclusive=true; no symbolic TOD slot is persisted. For other exact times endExclusive=false. End-exclusive is allowed only at India midnight. Date-only Start must be India midnight with endExclusive=false; date-only Due must use the end-exclusive boundary.

Rules independently calculate local = at + the policy's verified 330 minutes. They require day to equal local.date(), or (local - 1 nanosecond).date() for an end-exclusive Due. They compare plannedStart.day <= due.day. Types, exact map keys, precision and boundaries are checked. Therefore copying a false day beside a timestamp cannot bypass ordering. One map may be null; both are checked on creation and on every Task update.

Task versioning, immutable owner/createdAt, request-time updatedAt, deterministic version event ID, exact pre/post snapshots, mandatory paired event, and Closed/Deleted restrictions are retained. Profile lookup is via pre-write get(), not a mutable Task offset. Scheduling Pause Until Start uses plannedStart.at, preserving Paused Until as an instant.

## Actual test evidence

| Run | Executed | Passed | Failed |
|---|---:|---:|---:|
| Adapted original regression suite | 71 | 71 | 0 |
| Expanded Rules/adapter suite (`dates-final.log`) | 100 | 100 | 0 |
| Display/travel test (`display-final.log`) | 1 | 1 | 0 |

Final evidence: **101 distinct tests passed across two final commands**, zero failing/skipped/cancelled. The display test was added after the 100-test emulator command started, so it ran separately. Its formatter export was additive; existing adapter conversion functions were unchanged. Future `run.ps1` runs discover both files together.

One earlier launch was blocked from spawning Java; the display runner also encountered sandbox EPERM. Both were rerun outside the sandbox and completed successfully; these environment launch failures are not security denials or passing tests.

The prior test that merely confirmed the known same-day rejection was replaced with a positive success assertion. It now accepts same India-day Start 18:00 / Due 09:00. Additional coverage includes:

- Same UTC day with reversed India calendar dates rejected; same India day with reversed instants accepted.
- EOD previous-day boundary versus exact midnight selected-day distinction; forged EOD day rejected.
- 17 date-map forgery variants, malformed/missing fields, arbitrary offset/zone injection, date precision at the wrong time, impossible boundary flags; rejected writes leave Task and event unchanged.
- Account relocation, offset spoofing, foreign changes and policy deletion denied; Tasks without a policy fail closed.
- Valid/forged dates checked at creation, metadata audit bypass denied, stale writes rejected.
- Leap-day/year rollover conversion and invalid civil-input rejection.
- India EOD and 16:00 instants, EOD label preserves selected 20 October, and deadline reached exactly at its boundary; host timezone switched between India and London without changing results.
- All retained ownership, lifecycle, event pairing/forgery/immutability, race, transaction retry and rollback coverage.

Exact names: test-inventory.md. Data: travel-evidence.json, transaction-evidence.json and budget-evidence.json. Coverage: rule-coverage-summary.json. Hashes: evidence-hashes.json.

## Rules budgets and retry

No 1,000-expression-limit diagnostic occurred in the final emulator run. The policy adds one get() to Task validation: conservative single-pair source count is five lookups before caching (policy, post-event, pre-event existence, pre-Task, post-Task). Individual writes remain below ten accesses.

Measured sweep changed from the earlier 1–10 pairs to **1–9 pairs accepted; 10–12 rejected**, every rejected batch fully rolled back. This is emulator/cache behavior rather than a portable maximum. Keep one Task aggregate per ordinary mutation; do not design bulk operations around cached-access assumptions. Official limits and caching: https://firebase.google.com/docs/firestore/security/rules-conditions .

Bounded adapter retry evidence remains two attempts/two callbacks, final Task version 2, exactly one event v2 after confirmed version drift. Native SDK automatic retries alone remain insufficient for the tested permission-denied conflict.

## Limits and feasibility conclusion

The specific planned-date schema gap is closed by local adversarial evidence **for fixed Asia/Kolkata/+05:30**. Spark remains feasible for the demonstrated Task/event/date mechanism without a paid service or trusted backend.

This experiment does not claim all configurable timezones, DST, historical timezone changes or future timezone-law updates. India is the only supported policy in this probe; generalizing by accepting any client offset would invalidate the security argument. A production timezone list and applicable planning-date range need explicit design and validation. The numeric offset is safe here because Rules fix its value to the named policy; it is not proof of a general IANA conversion system.

Full relative-date/month/DST input calculations, all Task metadata/entity rules, actual browser/Google sign-in, deployed Rules, quotas, backup and hierarchy cleanup remain outside this extension. Calendar/schema production acceptance, creation-event policy and semantic deduplication across separately submitted operations remain as described in the prior report. There is no claim of complete platform feasibility or formal proof over arbitrary requests.

No application code, repository specification, decisions or legacy file changed. No commit, push, provisioning or deployment. Runtime versions remain Node 22.16.0, Java 21.0.12.1, Firebase 11.10.0, Rules Unit Testing 4.0.1, CLI 14.27.0 and CLI-selected emulator 1.19.8. Dependencies are reused through a workspace junction, excluded from the bundle.

## Reproduction

Here: `./run.ps1` discovers tests/*.test.mjs and uses the parent portable runtimes/emulator cache. On another machine: Node 22 and Java 21, `npm ci`, then `npm test`; no Firebase login/live project needed. Demo project and loopback Firestore only. Inspect run.ps1 runtime paths when moving this folder.
