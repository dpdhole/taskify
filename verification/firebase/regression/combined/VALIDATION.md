# Combined local security regression — 20 October 2026

**PASS for the represented combined regression contracts: 192 tests passed, 0 failed, 0 skipped/cancelled. Overall platform feasibility remains INCONCLUSIVE.**

## Exact execution

Repository baseline: `ea6280eb2bff56175add90890f9285cb8cb9d6b6`. Command: `./run.ps1`, executing:

```text
node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-taskify-regression --only firestore,auth,hosting "node --test --test-concurrency=1 tests/*.test.mjs"
```

The tool invocation selected the existing local portable Node/Java and emulator cache through environment variables. No live Firebase project/login was used. Emulators bound loopback ports 8080/9099/5000 and shut down after completion.

| Run | Tests | Passed | Failed | Skipped/cancelled | Test duration | Exit |
|---|---:|---:|---:|---:|---:|---:|
| Initial combined run | 192 | 192 | 0 | 0 | 151.714 s | 0 |
| Final strengthened assertions | 192 | 192 | 0 | 0 | 154.136 s | 0 |

Final evidence: `combined-final.log`; exact names/results: `test-inventory.md`; input hashes: `run-inputs.json`. Do not add initial/final counts. The initial run preceded the stronger inventory rollback and stale-pointer witness assertions in Gate 2's adapted file.

| Final file | Executed | Scope |
|---|---:|---|
| `tests/01-security.test.mjs` | 146 | Carried-forward Gate 1/2 Rules, dates, entities, Views, conflicts, rollback and budgets |
| `tests/02-display.test.mjs` | 1 | India/London travel display |
| `tests/03-purge.test.mjs` | 27 | Original 20 Gate 3 tests + seven new cross-gate tests |
| `tests/04-read-auth.test.mjs` | 18 | Gate 4 read-state/ownership, mocked Auth and static Hosting |
| **Total** | **192** | Includes pure helpers, privileged fixture/recovery tests and the accepted naming-policy limitation; not 192 independent security proofs |

## Candidate and changes

Rules SHA-256: `a21a6db3969eb0e703cf75d766d3903472d1ee9ec8ace84123dc3093f5c4c492`. This is byte-identical to historical Gate 3 and Gate 4. **No Rules fix or weakening was needed.** Historical source, evidence and specifications remain unchanged.

The necessary changes were test-harness integration: inventory writes on Task/event and child mutations, transaction inventory reads, inventory-aware comment updates, full inventory rollback assertions, one shared demo project and sequential isolated fixtures. All 147 original Gate 2 test names remain (one child-budget name describes four writes instead of three). See [adaptation record](ADAPTATION.md).

## Verified combined behavior

- Ownership and authenticated access, represented lifecycle/pause/schedule/close/reopen behavior and fixed-India date validation continue passing under inventory enforcement.
- Task/event pairing, immutable history outside authorized purge, protected fields, metadata bypass prevention, stale version rejection, bounded retry and atomic rollback continue passing.
- Discussion/Todo/link effects, classification/name reservation/default/reference protections and Saved View/settings ownership/provisioning remain covered.
- Fourteen forged-inventory variants around valid Start controls reject atomically. Missing child/event inventories, fabricated metadata touches and invalid count/revision/witness/scope/timestamps cannot leave partial Task/event/inventory changes in tested cases.
- Comment edits require zero-delta inventory witnesses while preserving Task version. The stale child-effect piggyback test includes an otherwise valid inventory, so a missing counter cannot mask the intended binding check.
- Accepted purge semantics pass: untouched cancellation followed by Restore, no cancellation after physical deletion, safe interruption/manual continuation, racing workers and repeated steps. Cancellation piggybacked on physical deletion rolls back completely.
- Completed purge markers have the exact metadata-only schema and reject edits/deletion/ID reuse. One inventory witness cannot authorize two sibling deletions.
- The 505-child synthetic hierarchy again interrupted at 260 deletions and resumed for the remaining 245. This is Rules-protected deletion evidence, not client creation evidence for the privileged fixture.
- Mocked Auth token ownership/sign-out, full metadata population, reactive state and cache/pending readiness guards remain covered; these are not real Google/session tests.

## Limits and budget observations

Both final sweeps accepted **1–3 independent aggregates** and denied **4 and above**, with complete rollback including inventories:

- Task/event/inventory: 3 documents per aggregate; tested 1–12 aggregates.
- Task/event/Todo/inventory: 4 documents per aggregate; tested 1–8 aggregates.

This is materially tighter than earlier Gate 2 policies without inventories (previously 1–9 pairs and 1–6 child triples accepted). Do not reuse those historical boundaries. One aggregate per ordinary mutation remains the supported design direction. Emulator caching/limits do not establish a portable production multi-aggregate maximum, and no exact numeric production headroom is certified. Initial seven-View provisioning and represented single-aggregate operations passed against the same Rules.

The final client log contains no expression-limit/resource-exhaustion diagnostic. Expected permission denials and malformed-document evaluation errors are present; these are not all clean Boolean-false traces. Valid controls and exact permission-denied checks are retained. Large per-value coverage export was not requested; no coverage percentage is claimed. Production indexes/compiled size/performance require separate validation.

## Remaining boundaries

- The explicitly accepted client-only NFC/grapheme bypass remains; this result does not make Unicode normalization server-enforced.
- Creation-event policy, complete production Task/query schema, global intent deduplication beyond accepted versions and payload-size growth remain open.
- Real Google/browser sessions, production indexes and workload/quota behavior are not validated by this run.
- The manual backup/export/recovery requirement still needs its scope agreed. Full account/project-loss recovery is unapproved scope, not a PoC blocker added by this regression. Privileged single-Task emulator recovery remains separately labeled.
- No cloud resource, Function, paid runtime, application architecture change, commit or push occurred during this work.

## Reproduction

Recorded Node 22.16.0, Java 21.0.12.1, Firebase 11.10.0, rules-unit-testing 4.0.1, firebase-tools 14.27.0 and Firestore emulator 1.19.8. With Node 22/Java 21 available, install the pinned lockfile with `npm ci`, then use `./run.ps1` or `npm test`. Use a disposable local emulator; tests clear fixtures between files. The existing dependency junction/runtime/cache is local-only and excluded from repository evidence.

Run `node ../preflight.mjs` to verify the 30 historical and 18 combined input fingerprints. Preflight itself executes zero security tests. Changes to recorded source require a fresh reviewed input snapshot and rerun; do not silently regenerate hashes to conceal drift.
