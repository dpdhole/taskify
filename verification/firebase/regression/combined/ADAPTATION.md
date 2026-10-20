# Combined harness adaptation record

20 October 2026. Historical inputs are frozen in `../frozen-inputs.json`; exact executed inputs are fingerprinted in `run-inputs.json`. No historical gate source or candidate Rules logic is changed.

| Combined file | Origin | Adaptation |
|---|---|---|
| `firestore.rules` | Gate 3 | Byte-identical candidate; also identical to Gate 4 |
| `tests/01-security.test.mjs` | Gate 2 `security.test.mjs` | Shared demo project; isolated suite bootstrap; inventory writes in pair/child/transaction helpers; comment edits/deletes include zero/negative-delta witnesses; inventory rollback assertions; child budget title/writes updated |
| `tests/02-display.test.mjs` | Gate 2 `display.test.mjs` | Unchanged |
| `tests/03-purge.test.mjs` | Gate 3 | Shared project and clean fixture bootstrap; all 20 original tests retained; seven new cross-gate tests appended |
| `tests/04-read-auth.test.mjs` | Gate 4 | Shared project ID only; all 18 tests retained |
| `counters.mjs` | New test support | Builds required inventory shape, counts, touches, revision and request timestamp |
| Remaining adapters | Gate 3 and Gate 4 | Unchanged |
| Package/runner/config | Gate 4-derived | Demo regression project, sequential test files; same three loopback emulators and pinned dependencies |

## Controls and isolation

All 147 original Gate 2 test names are retained (including the carried-forward Gate 1/date cases); the old triple-write budget title is updated to describe four writes with inventory. No test is removed or changed to an expected failure. The accepted client-only Unicode/grapheme bypass remains explicitly tested as a limitation.

Each ordinary audited Task/event pair now writes an inventory as a third document. Child effects use Task/event/child/inventory. Comment edits/deletes independently write child/inventory. Native transaction fixtures read inventory before writes; bounded retry reconstructs it from the next transaction's read state. Invalid child/event/task cases retain valid witness construction where feasible. Task-only/event-only cases necessarily cannot satisfy every coupled effect simultaneously; valid full-operation controls remain mandatory.

Owner reads construct adversarial fixture snapshots before a foreign actor submits its batch. This mirrors the original harness's setup and does not bypass Rules for the mutation. Batch references always use that batch's client. Runtime operations and denials still execute through client SDK Rules evaluation.

The stale-child-pointer piggyback probe includes a valid zero-delta child inventory witness, preventing a missing inventory from masking the intended Task/child binding violation. Closed-comment field tests and expired comment mutations also include inventory. Budget sweeps assert inventory absence on denied batches, as well as unchanged Task/child/event state.

Test files run sequentially; each stateful file starts with a cleared disposable emulator database. Within each file, individual cases construct their own Task fixtures. Privileged aging, scale/read-model fixtures and operator recovery remain explicitly identified; those assertions do not prove browser creation security. Static Hosting is a fixture, and Google Auth is mocked.

## Seven additional cross-gate tests

1. Fourteen inventory forgery variants around an otherwise valid Start pair: wrong count/delta, negative/phantom count, witness, revision, ownership, Task linkage, timestamp and unknown fields. Each rejection checks complete rollback and is followed by a valid Start control.
2. Ordinary metadata cannot fabricate an inventory touch; valid metadata leaves inventory unchanged.
3. Comment edits require zero-delta inventory witnesses and leave Task version unchanged.
4. One inventory witness cannot authorize physical deletion of two siblings.
5. Purge cancellation cannot piggyback on physical deletion; denied batch leaves job/child/inventory intact, and untouched cancellation followed by Restore succeeds.
6. Completed tombstones have the exact content-free schema; updates, removal and Task ID reuse are denied.
7. Purge freezes metadata/lifecycle/child creation, with no partial inventory effects; authorized purge still completes.

## Evidence boundaries

The first run included the new tests but preceded the final stronger Gate 2 inventory rollback/piggyback assertions. The final run is the acceptance evidence for those assertions. Do not add first/final counts together. No complete account recovery test, live Google session, production index or workload expansion is included.
