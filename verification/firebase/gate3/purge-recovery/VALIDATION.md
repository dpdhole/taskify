# Gate 3 — local validation, 20 October 2026

**Overall: INCONCLUSIVE. Deletion experiment: PASS within the tested schema.**

Baseline: `dpdhole/taskify`, main, `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`. Repository working tree clean. All implementation is isolated here; no application/specification/decision changes, commits, provisioning or deployment.

## Executed evidence

`gate3-expanded.log`: **20 tests, 20 passed, 0 failed, 0 skipped**, process exit 0, 56.086 seconds. Exact test titles and assertions are in `tests/gate3.test.mjs`. This is a new Gate 3 suite; the earlier 147-test Gate 2 suite was not rerun against the changed Rules.

Tests cover:

1. Atomic child/event inventory; omitted and forged counters denied.
2. Soft Delete/Restore retains hierarchy before purge.
3. Purge freezes edits; early completion denied; cancellation only before child deletion.
4. Normal event immutability and prohibition of child hard deletion outside purge.
5. Interrupted purge resumes and repeated execution is idempotent.
6. Completed tombstone prevents ID reuse; completed hierarchy inaccessible.
7. Owner, foreign user and anonymous access to jobs, inventories and children.
8. Non-cascading privileged parent deletion; marked orphan cleanup; unmarked orphan denial.
9. Typed export round trip, nested nanosecond timestamps and record counts.
10. Concurrent comment edit forces export retry despite unchanged Task version.
11. Continuously changing export fails explicitly; export during purge rejected.
12. Checksum, scope, duplicate/path injection, missing-record and live-overwrite rejection.
13. Ordinary browser historical import rejected.
14. Interrupted operator recovery, hidden staging, exact child preservation, stale-client rejection and subsequent normal mutations.
15. Lost acknowledgement/repeated deletion does not decrement twice; premature finalization denied.
16. Forged purge transitions, zero counts and metadata changes denied.
17. Strict age threshold equality, lifecycle/deletion independence and leap/month-end clamping.
18. Concurrent purge workers: both fulfilled; final counters zero; repeated completion harmless.
19. Interrupted recovery cannot switch archives; staging remains unpublished.
20. Privileged synthetic scale fixture: 505 records; interruption after 260; resume deletes remaining 245. Two documents per child-delete batch. Fixture creation is not evidence of browser creation security.

## Design and changes

- Added per-Task inventories with four counts and a monotonic revision. Rules require actual before/after child witnesses for counter changes and couple child/event changes to the inventory atomically. Comment edits also advance the revision.
- Added independent purge jobs, bounded child deletion and atomic parent removal/completion after all counts reach zero. Completed metadata-only tombstones prohibit accidental ID reuse.
- Added explicit parent/job read guards to prevent exposure of orphaned child collections. A draining owner can enumerate and finish a marked orphan; foreign/anonymous clients cannot.
- Added single-Task consistent export with bounded retries, typed timestamp serialization, integrity checksum and archive preflight.
- Added an emulator-only privileged recovery simulation. It stages hidden children, publishes the root last, advances version past the purge high-water mark and adds an administrative recovery event. It never grants browser historical import permission.
- Added India-zone age-cutoff eligibility calculations. This tests policy, not an implemented bulk-action UI or persisted thresholds. Internal contention retries do not implement automatic reruns of failed bulk actions.

Initial harness defects were fixed: references from different Firestore instances, and Rules attempting to read a nonexistent initial inventory. Earlier failed runs are not counted as security evidence. No full coverage export was used.

## Limits and unresolved decisions

1. **Recovery trust boundary:** a checksum detects corruption; it does not authenticate browser-supplied history. The privileged emulator restore is deliberately outside browser Rules. A separately authorized offline project-owner operator procedure is a candidate, not an approved or production-validated capability. No credentials or live administrative APIs were used.
2. **Backup scope:** export/recovery covers one Task and its four child collections. Whole-account/project-loss recovery, classifications/settings dependency restoration, backup storage custody and a usable operator runbook remain unvalidated. Recovery currently requires an existing matching completed purge marker. It cannot establish a version high-water mark after project loss.
3. **Restore boundary:** ordinary soft Restore works before purge. Once a child is physically deleted, cancellation/ordinary Restore is rejected. The gap-analysis phrase “preserve soft Delete/Restore behavior until final purge” needs clarification if it requires restoration throughout partial physical deletion. This experiment does not provide that stronger behavior.
4. **Schema assumption:** counters cover only the four permitted collections and legitimate Rules-enforced writes. Arbitrary out-of-band administrative writes can violate this invariant. Unknown/unmarked administrative orphans require operator investigation.
5. **Limits/cost:** tested two-document deletion batches passed emulator evaluation, including the 505-record scenario. No unlimited batch claim, exact Rules access-budget characterization, production quota/load/cost measurement or live Spark eligibility verification is made. Existing normal-operation Rules need a combined regression/access-budget run before adoption of inventories.
6. **Retention:** metadata-only purge tombstones persist. Approve their retention semantics before implementation.

## Feasibility and next decision

The tested deletion design is compatible with browser-direct Firestore and requires no hosted backend. Full Spark feasibility remains conditional on Gate 4 and a validated manual backup/recovery plan. No paid service or Cloud Function was introduced.

Do not advance Gate 3 to PASS yet. Choose whether to permit a separately approved, offline trusted-owner recovery procedure and complete account-level backup validation, or require a browser-verifiable/attested backup design. Also resolve the partial-purge Restore boundary above. Neither choice has been implemented in production.

## Reproduction

Pinned dependencies: Firebase 11.10.0, rules-unit-testing 4.0.1, firebase-tools 14.27.0; Node 22.16.0, Java 21.0.12.1, Firestore emulator 1.19.8. `run.ps1` uses sibling `../../gate1` runtime/cache and the installed node_modules junction. Alternatively install the pinned lockfile dependencies with Node 22 and Java 21, then run `npm test`. Project ID is `demo-taskify-gate3`; emulator binds 127.0.0.1:8080; no cloud project is required. Tests clear their local emulator data.

The distributable includes source, lockfile, successful test log and synthetic evidence. It excludes node_modules, runtimes, emulator binaries, debug/environment logs and scratch files.
