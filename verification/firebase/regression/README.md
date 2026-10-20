# Combined security regression preparation

Prepared 20 October 2026 against repository commit `ea6280eb2bff56175add90890f9285cb8cb9d6b6`, then adapted/executed following the owner's “Proceed.” **Final combined run: 192 passed, 0 failed/skipped.** The matrix below is the preparation checklist; see the [validation report](combined/VALIDATION.md) for exact scope/results and [adaptation record](combined/ADAPTATION.md). Earlier gate reports remain historical snapshots.

Authority: [accepted decisions](../../../docs/feasibility/firebase-validation-decisions.md). Work covers recording decisions and executing local security regressions; it does not implement account-level backup, deploy Rules or commit changes.

## Candidate and provenance

- Candidate: `../gate3/purge-recovery/firestore.rules`; `../gate4/auth-query/firestore.rules` must be byte-identical. Expected SHA-256: `a21a6db3969eb0e703cf75d766d3903472d1ee9ec8ace84123dc3093f5c4c492`.
- Earlier Gate 2 Rules differ intentionally: they do not require inventories and do not represent the latest purge rules. Do not run separate old policies and describe that as combined regression coverage.
- Gate 2 contains the carried-forward Gate 1/date suite. Use its test inventory to map cases; do not count the same Gate 1 cases twice. Preserve earlier sources/evidence unchanged.
- `frozen-inputs.json` fingerprints relevant Gate 2–4 source/config/lockfile inputs for the next run. Changes require deliberate baseline review, not automatic regeneration after a failure.
- `preflight.mjs` uses Node standard libraries only. Run `node verification/firebase/regression/preflight.mjs` from the repository root (or call it by absolute path). It verifies historical/combined source hashes, candidate equality, demo-project commands and historical local-only configs. **Preflight is not a security test.**

## Adaptation checklist

The separate `combined/` harness uses one candidate Rules file and one demo-project configuration. Historical gate folders remain unchanged. No earlier test is dropped; the actual adaptation is described in its validation report.

1. Adapt Gate 2 audited mutation helpers (`paired`, `pairData`/`addPair`, transaction retry, child effect helpers and direct positive-control batches) to include the mandatory inventory record. The same Firestore client instance must own every batch reference.
2. For each audited Task event, increment `activityEvents` count; for each child create/delete adjust that kind's count; for child edits advance inventory revision with zero count delta. Touch witnesses and server timestamps must be exact. Ordinary metadata updates still require version/timestamp integrity but no fictitious event/count.
3. Preserve Task-only/event-only/forgery negatives. Add an otherwise valid inventory when testing a different invariant, so a missing counter cannot accidentally mask a lifecycle/event bug. Add separate missing/forged inventory negatives. Pair each negative family with a valid control.
4. Adapt races and bounded retries to rebuild Task/event/child/inventory from fresh state. Assert one winner, no partial writes and no duplicated mandatory effect. Do not interpret all permission-denied errors as retryable conflicts.
5. Keep exact error checks and post-denial state assertions. Inspect evaluation-limit diagnostics; a desired denial masked by resource exhaustion is not proof of the intended invariant. Do not export huge per-value coverage traces.
6. Run suites sequentially or isolate fixtures/project namespaces; Gate 4's fixture clearing must not erase another suite's data. Rules-disabled fixtures must be identified and never counted as client creation evidence.

## Required regression matrix

| Area | Required cases and assertions | Existing starting point |
|---|---|---|
| Ownership | Owner/foreign/anonymous access; spoofed/missing ownership; parent/job guards; unknown/nested paths | Gate 2 security; Gate 3 purge; Gate 4 ownership |
| Lifecycle and pause | Draft/InProgress/Closed; Start, Schedule, Pause/EditPause, Resume, Done, Close, Reopen, Delete/Restore; empty Actual Start and paused Draft | Gate 2 carried-forward tests |
| Task/event pairing | Missing Task/event, orphan/mismatched/extra/spoofed/replayed events; deterministic version IDs; immutable history outside authorized purge | Gate 2 carried-forward + Gate 3 |
| Metadata/protected fields | No audited-field bypass, immutable ownership/createdAt, request-time updates, valid version progression, no unknown fields | Gate 2 carried-forward |
| India dates | Civil-day/instant consistency, date-only EOD, exact midnight, forgeries, ordering, policy spoofing and travel display | Gate 2 carried-forward + display |
| Children/classifications | Implicit activity, Todo close/reopen, comments' edit window, links/counter, active references, reservations, archive/default/order protection | Gate 2 entity tests |
| Views/settings | Atomic seven-View bootstrap, races, protected All Tasks, order/version, owner isolation and no persisted Search | Gate 2 entity tests |
| Inventory cross-effects | Actual child/event witnesses, count/revision integrity, multiple touched records, absent counters, forged zero counts, child edits without Task version changes | Gate 3 + new cross-gate cases |
| Concurrency/rollback | Competing commands, stale metadata/child writes, native conflict and bounded adapter retry, mixed invalid batches, full rollback | Adapted Gate 2 + Gate 3 |
| Purge/accepted boundary | Cancel untouched job then Restore; first child deletion prevents cancellation/Restore; interruption, manual continuation, duplicate step and competing workers; orphan guards | Gate 3 |
| Tombstones | Completed marker immutable, Task ID reuse denied, no Task content retained, foreign/anonymous denial | Gate 3 + explicit content/immutability negatives |
| Budgets | Largest valid single-aggregate operations with inventory and purge guards; per-operation and total access calls; expression diagnostics; bounded batch rollback | Recalculate Gate 2 estimates; Gate 3 latest schema |
| Mock Auth/read-state | Token-backed UID access, sign-out denial, logout clearing/late snapshot protection, no cache/pending completeness | Gate 4; still not real OAuth evidence |

Manual operator recovery is a separate privileged test category, outside browser Rules guarantees. Preserve existing tests and label them accurately; no complete account/project-loss recovery expansion is included. Full query/workload completeness is also separate from this security regression scope.

## Execution record to produce

After adaptation, record exact command, Node/Java/SDK/CLI/emulator versions, candidate/input hashes, exact executed tests, pass/fail/skip counts, raw safe TAP log, races/rollback state and budget diagnostics. Summarize remaining gaps rather than converting unsupported requirements into passing diagnostics. The accepted Unicode policy bypass remains an explicitly labeled limitation.

This preparation does not certify production indexes, real Google/browser session restoration, numeric production headroom, global command deduplication, full schema or Spark workload capacity. No cloud operation, emulator execution or commit is performed by preflight.
