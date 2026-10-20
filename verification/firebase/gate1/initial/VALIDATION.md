# Gate 1 local validation — 2026-10-20

**Verdict: INCONCLUSIVE for full Gate 1 acceptance.** The isolated Task/Activity Event integrity mechanism passed the executed adversarial checks. A known product date-validation mismatch prevents claiming the candidate implements all required Task integrity semantics. No essential atomic-pairing impossibility or need for a trusted backend was found.

## Provenance and boundaries

- Repository `dpdhole/taskify`, `main`, HEAD `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`, clean before/after. Clone is `../../taskify` relative to this experiment.
- Read project status, current specification including §§17–18, and feasibility gap analysis. `docs/decisions.md` is absent from this commit; no substitute authority was invented.
- Input: `../../sources/taskify-gate1-experiment.zip`, SHA256 `09B6CF64065BBBF5C0FD3A82371BAF92FE163E460A0E642F6931596B3197FDD7`. Original Rules/test sources retained beside revised sources.
- ZIP contains 13 tests, not the reported 12. Its included log records missing Firebase CLI; it does not itself contain the reported DNS failure.
- Experiment is outside the Git checkout. No app code, authoritative documents or legacy specification changed. No commit, push, provisioning or deployment.
- Only Firestore emulator, project `demo-taskify-gate1`, loopback `127.0.0.1:8080`. UID fixtures; no real Google authentication or cloud database.

## Actual execution evidence

| Run | Executed | Passed | Failed | Explanation |
|---|---:|---:|---:|---|
| Original Rules/tests after dependency/Windows command repair | 13 | 12 | 1 | Unauthorized-write case failed on an unhandled forbidden read before its write assertion. |
| Original Rules plus regressions | 16 | 14 | 2 | Same harness error plus accepted unversioned ordinary metadata write. |
| Revised Rules/initial regressions | 16 | 16 | 0 | Metadata version/timestamp integrity and harness repaired. |
| Expanded suite | 67 | 66 | 1 | Native transaction did not retry a Rules permission-denied conflict. |
| Expanded suite with retry model and date checks | 71 | 70 | 1 | Rescheduling fixture accidentally inverted planned/due instants under the retained prototype check. |
| Final suite | 71 | 71 | 0 | Fixture corrected; all observed-behavior assertions passed. |

`final.log` contains final TAP names/results; `test-inventory.md` lists the exact executed tests. No skipped/cancelled tests. One passing test explicitly confirms a known noncompliant domain behavior; 71 green assertions do not constitute full product acceptance. The 420 historical callable-backend tests were neither run nor counted.

## Experimentally supported invariants

- Owner/anonymous/foreign Task and event access; unmatched paths denied.
- Draft/InProgress/Closed operations: Start, both Schedule variants, Pause/Edit Pause, Resume Only/Resume & Start, Start Only/Start & Resume, Done, all five failure outcomes, Reopen, audited date edits, Delete/Restore. Independent Pause and preserved/empty Actual Start checked.
- Each of the 11 operation types tested with Task-only rejection, event-only rejection, unchanged Task/no event after rejection, then accepted exact pair.
- Bidirectional consistency: Task requires a new event through `getAfter()` and pre-write absence; event requires incremented post-write Task, exact pre/post snapshots, actor/owner/Task linkage and version-derived ID `v<version>`.
- Rejected orphan, cross-parent, extra, mismatched, forged, replayed and mutable events. Event update/delete/set-over-existing are denied. No independently appended arbitrary event is permitted.
- Ordinary title/reference edits cannot change audited state, ownership, creation timestamp, event ID or unknown fields. All updates increment version and use request-time updatedAt. Stale metadata/audited writes are denied.
- Malformed/protected-field and timestamp attacks roll back both documents. Nested server timestamps in event snapshots resolve consistently in successful pairs.
- Concurrent same-version batches commit one state effect and one event. Mixed valid/invalid multi-Task batches roll back all writes.
- Native transaction conflict: concurrent version drift produced permission-denied, one callback, zero audited effects. Do not rely solely on native SDK retry.
- Proposed bounded adapter retry: re-read from server after permission-denied; retry only on confirmed version drift; reconstruct/revalidate operation, maximum three outer attempts. Forced conflict test: two attempts/two callbacks, final version 2, exactly one event `v2`. Invalid transitions are not swallowed, repeated conflict stops at its bound. See `transaction-evidence.json`.

These are finite emulator observations, not a formal proof of all possible requests or deployed-policy behavior.

## Rules limits

- Original Rules hit the 1,000-expression ceiling on several rejected requests, obscuring intended rejection reasons. Revised Rules route operation validation by type and avoid repeated shape/operation evaluation on both sides. Final suite contains no 1,000-expression-limit diagnostic.
- Source-level conservative bound for one audited pair: Task rule `getAfter(event)` + `exists(event)`; event rule `get(Task)` + `getAfter(Task)` = four access calls before caching. No individual operation approaches the documented limit of ten.
- Empirical batch sweep: 1–10 independent pairs accepted; 11–12 denied, with every denied Task still at version 0 and no events. See `budget-evidence.json`. This boundary is emulator/cache behavior, not a portable bulk-write guarantee; use one aggregate per mutation and budget without relying on caching.
- Coverage evaluation output is summarized in `rule-coverage-summary.json`; it is branch/value execution evidence, not an exact per-request maximum-expression counter. Expression headroom for a larger production schema is unmeasured.
- Official limits: ten access calls per operation, twenty per atomic multi-document request, caching may reduce counted calls; 1,000 evaluated expressions per request. Sources: https://firebase.google.com/docs/firestore/security/rules-conditions and https://firebase.google.com/docs/firestore/security/rules-structure#security_rule_limits .

## Changes confined to experiment

- Repaired incompatible package pairing (Rules Unit Testing 5 requested Firebase 12 while ZIP requested Firebase 11). Pinned Rules Unit Testing 4.0.1, Firebase 11.10.0, Firebase CLI 14.27.0; added package lock.
- Repaired Windows quoting and unauthorized-read harness bug; rejection assertions require permission-denied.
- Added version/request-time checks to ordinary writes, deterministic event IDs, soft Delete/Restore and Closed/Deleted restrictions, stricter shape/operation checks and no-op rejection. Fixed Resume conditional; its suspected original bypass was masked by expression-limit rejection, so no successful original Resume exploit is claimed.
- Added explicit inactive-pause consistency and open/Closed outcome/end consistency; bounded prototype payload sizes.
- Reduced redundant cross-document Rules validation; Task and event rules still mutually require the paired write.
- Expanded to 71 tests, real conflict/retry evidence, batch-limit sweep and coverage summary.
- Portable Node 22.16.0 and Java 21.0.12.1 installed only in parent experiment workspace. CLI selected Firestore emulator 1.19.8. Cached 1.22.0 was discovered but is not the tested emulator version.

## Remaining gaps and owner decisions

1. **Known domain/schema mismatch:** supplied Rules enforce `plannedStart <= due` as instants. Specification §4.1, retained by §17.4, requires configured-calendar-date ordering. A same-day 18:00 Planned Start / 09:00 Due must be permitted by that ordering rule but is rejected here; final test 71 confirms this gap. The stricter check was retained rather than silently deleting ordering validation. Configured timezone/DST date representation and validation require a separate schema experiment/design decision. Potential direction: model authoritative civil-date components suitable for Rules validation; validate timezone conversion contract before adopting it. No conclusion that Rules cannot secure a redesigned representation is claimed.
2. Creation is Draft-only without a creation event, as in the ZIP. Final creation audit contract requires agreement before production.
3. Exactly one required event per accepted audited Task version is supported. General semantic deduplication across separately submitted requests/new versions is not proven; a durable stable-command receipt design would need its own experiment if required. Do not reinterpret version-derived IDs as global exactly-once intent.
4. Minimal Task schema only; full categories/location references, description payloads and remaining metadata need later slices. Discussion/Todo implicit activity and their additional records belong to Gate 2. Arbitrary hierarchy purge, auth/provider flows, quotas/query cost/backup remain Gates 3–4.
5. Full Task snapshots duplicate data in events. Document-size, history/read cost and bounded production payloads remain unresolved; prototype title/comment/version bounds are experimental choices, not new approved product limits.
6. Emulator UID fixtures and finite concurrency schedules are not production Google sign-in/deployed Rules evidence. Full arbitrary-request security proof and numeric expression headroom are not claimed.
7. Installation audit reported 22 dependency findings (9 moderate, 12 high, 1 critical), in the pinned development dependency tree; dependency modernization remains before adopting this toolchain beyond the isolated experiment.

**Spark assessment:** conditionally feasible for the demonstrated browser-direct Task/event pairing mechanism. No paid service, Function, hosted API or trust in browser domain code was needed. Full approved-product feasibility remains unresolved because of the date representation gap and later gates. No architecture change is authorized or recommended as an automatic consequence of this experiment.

**Next owner checkpoint:** resolve the planned-date schema contract and creation-event policy, then approve any production schema/adapter work separately. Local results support continuing Spark feasibility; they do not authorize production implementation. No separate approval is needed merely to review these artifacts.

## Reproduction

In this directory run `./run.ps1`. It selects the portable runtimes from the parent workspace, uses the pinned CLI and local emulator, and executes `node --test tests/*.test.mjs`. To capture output: `./run.ps1 *> rerun.log`.

On another machine: install compatible Node 22 and Java 21, run `npm ci`, then `npm test` (update runtime paths in run.ps1 or run npm with those runtimes on PATH). No Firebase login or live project is needed. Ensure port 8080 is free. Downloads require network access; test data stays local. Source/evidence ZIP omits node_modules, runtime binaries and large raw coverage output.
