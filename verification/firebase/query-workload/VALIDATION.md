# Complete local query/workload assessment — 20 October 2026

**Final candidate: FAIL for full Saved View persistence. 237 tests executed: 236 passed, 1 failed, 0 skipped/cancelled. Overall platform feasibility remains INCONCLUSIVE.**

This is a failed candidate, not a production Rules/configuration package. The known-good 192-test combined candidate is preserved unchanged in `../regression/combined`.

## Actual execution and provenance

Baseline repository commit `ea6280eb2bff56175add90890f9285cb8cb9d6b6`. Final immutable inputs: `final-assessment-inputs.json`. Final Rules SHA-256: `2a4e633f092c1b66c1e098b68daf26f181043a3f0b40ff22bb583e5bf38b1c5d`.

Final command: `./run.ps1`, invoking the local Firebase CLI with demo project `demo-taskify-query-workload`, Firestore/Auth/Hosting emulators and `node --test --test-force-exit --test-concurrency=1 tests/*.test.mjs`.

`final-assessment.log`: **237 tests; 236 pass; 1 fail; 0 skip/cancel; 168.002 seconds; exit 1**. The CLI shut down all emulators. Exact test names/statuses are in `test-inventory.md`. The failure is **test 228**, `full Saved View filters/date buckets persist while malformed and search/membership payloads are denied`.

| File | Executed | Passed | Failed |
|---|---:|---:|---:|
| 01: inherited security | 146 | 146 | 0 |
| 02: inherited travel display | 1 | 1 | 0 |
| 03: inherited purge/cross-gate | 27 | 27 | 0 |
| 04: inherited read/Auth/Hosting | 18 | 18 | 0 |
| 05: new query/behavior helpers | 32 | 32 | 0 |
| 06: persistence/load/write integration | 9 | 8 | 1 |
| 07: storage/codec/capacity helpers | 4 | 4 | 0 |
| **Total** | **237** | **236** | **1** |

Counts overlap earlier runs and must not be added to them. Historical 420-test callable-backend evidence is excluded. These include pure helpers, explicitly privileged fixtures/recovery and mocked identity, not 237 independent security proofs.

## Failing requirement and precise outcome

The client query engine supports all represented filter dimensions, but **saving a complex valid query fails in the Rules**. The final probe groups by Lifecycle, does not filter that grouped dimension, enables Include Closed/Deleted, and activates all eight supported calendar-date ranges plus Category, Location, Priority and Pause selections. All eight date predicates use integer calendar-day bounds and Is Set.

Six preceding sparse malformed-query writes are denied as expected. The next, valid full-query update is rejected with `PERMISSION_DENIED` and the emulator diagnostic **maximum of 1000 expressions to evaluate has been reached**. The test then stops: later rename, reconfiguration and large-malformed-query assertions in that case did **not** execute. Do not count them as passed coverage. An empty result under contradictory date predicates is not prohibited by the product; type-valid zero-result Views must remain possible.

This demonstrates a failure of the tested single-document query representation/validation, not impossibility of every Spark design. No filter limit, client-only integrity exception, paid service or backend was introduced to make the test green. Redesign is required before full query persistence can be accepted.

## Candidate changes and investigation

- Added optional tri-state Important/Urgent Task fields, supported ordinary metadata edits without Activity events, and rejected invalid values, Closed edits and smuggling preference changes through audited operations.
- Added provider-independent filtering, exclusive grouping, sorting, Search, all seven default definitions and current-state burn-rate calculations. Calendar calculations remain fixed India; test bucket boundaries are supplied values, not approved UI defaults.
- Corrected Deleted Date vocabulary to persisted `notSet` rather than the earlier selector's `unset`.
- Added structured persisted filters/bucket configuration and a provider codec. Location Unspecified uses an explicit Boolean beside selected IDs; an empty map key was rejected by the SDK and removed.
- The initial preference validation caused one valid paused-Todo operation to exceed the expression ceiling. Validation now occurs at creation and ordinary preference edits; audited changed-field whitelists prohibit changing/removing those fields. All inherited cases subsequently passed. Bootstrap View query duplication was reduced while preserving the exact seven-definition manifest/registry invariant.
- Explored named date maps, date triples, a fixed-slot nested-array candidate and the final scalar-slot representation. Direct nested arrays were rejected by Firestore. The final 29-slot scalar/map encoding with enum masks preserves the logical interface and server types, but still fails the all-active date-filter case.
- `query-codec.mjs` is experimental and is not approved for production. No historical gate source was modified.

Earlier logs retain development failures and targeted probes. Some integration attempts completed assertions but retained Node/SDK background handles and were interrupted; they are not full-run success evidence. The final harness explicitly closes SDK clients/Auth/HTTP transport and uses Node's supported `--test-force-exit` after tests/hooks complete. This does not turn failed assertions into successes; exit remains 1. It also does not establish a leak-free browser application. The stale `run-inputs.json`/`assessment-inputs.json` describe intermediate snapshots; only `final-assessment-inputs.json` identifies final executed source.

## What the query tests establish

- Independent Include Closed/Deleted controls, all six closure outcomes and inactive closure selections.
- OR within dimensions, AND across dimensions, grouped-dimension exclusion and clearing its conflicting filter.
- Nine Important/Urgent combinations into the five approved classes; independent recorded/timed/expired/indefinite pause conditions without lifecycle mutation.
- Inclusive lower/exclusive upper calendar-date ranges and presence filters for all eight date dimensions. EOD Due uses its selected civil date, not next-midnight grouping.
- Exclusive date/priority/lifecycle/classification groups; configured order, zero groups and Unspecified last; all supported grouping/sort combinations maintain a complete partition. Null sort values remain last with deterministic ties.
- Trimmed case-insensitive contiguous-phrase Search over metadata/current labels; full eligible population; ephemeral Search and detail/back navigation behavior.
- Seven default View semantics and current-state distinct-Task burn rate, with deleted exclusion, reopen behavior, India day/week/month boundaries, leap/year cases and N complete periods plus current partial.
- Acknowledged preference edits update shared results; label changes reconcile Search; history is fetched only on demand with bounded pages.

These are computation/read-model results. Persistence of the most complex definition failed. No full UI, final production schema, cross-client settings UI or real Google session is claimed.

## Measured local load

Confirmed planning inputs: 10–12 users, 3–5 new Tasks/user/day, 20–30 active Tasks/user, 2–3 Discussion entries mainly per active Task/week, 4–6 daily opens on one device/tab, no uploads and three-calendar-month Closed retention with manual cleanup. The 80% weekly burn rate does not mathematically guarantee a steady active population.

Synthetic fixture: **12 users × 500 retained Tasks = 6,000 Tasks**, four Categories and three Locations/user; 60 comments and 60 synthetic events under one Task/user for lazy-detail probes. Privileged fixture creation is not browser creation evidence. The 500/account count is a sizing fixture, **not an approved cap**, and assumes retained history is actually bounded; unfinished work and Trash may add more.

- 72 cold loads (six/user) delivered **36,504 server-backed metadata documents** over 216 collection subscriptions, with **zero child reads during list loading**.
- Local readiness latency: median **1,374.8 ms**, p95 **1,972.9 ms**, maximum **2,188.0 ms**. These emulator/laptop values are not cloud/browser/mobile latency guarantees.
- 1,400 View/Search evaluations over 500 Tasks took **124.5 ms total** and made zero additional Firestore queries.
- Task metadata JSON averaged **686.8 bytes/Task**. This is serialization footprint, not measured billed wire bytes or browser heap.

See `artifacts/load-evidence.json`, `selector-evidence.json` and `task-metadata-sample.json`.

## Quota model: estimates, not billing measurements

The model explicitly adds ancillary reads, root listener changes, detail pages and write Rules dependencies. Representative dependency estimates are 5/create, 5/audited Task mutation, 6/comment mutation and 2/metadata update. The conservative column uses successful-request access budgets 10/20/20/10 instead. Neither is a production billing measurement. Inputs not supplied by the owner (detail pages, metadata edits, sizes, ancillary documents and operation mix) are labeled sensitivities in the artifact.

| Scenario | Estimated reads/day | Conservative request-budget reads/day | Writes/day |
|---|---:|---:|---:|
| Lower confirmed workload; 310 retained/account fixture | 15,144 | 17,704 | 521 |
| Upper confirmed workload; 500 retained/account fixture | 40,752 | 45,792 | 1,122 |
| Upper workload, 10 detail pages/user/day | 42,936 | 47,976 | 1,122 |
| Three extra cold reconnects/user/day | 59,436 | 64,476 | 1,122 |
| Two devices/tabs causing 12 fresh loads/user/day | 78,120 | 83,160 | 1,122 |
| One-year unfinished carryover; 733 retained/account | 57,528 | 62,568 | 1,122 |

Normal sizing fits the listed Spark 50,000 reads/day and 20,000 writes/day **conditionally**, before cleanup/other activity. Reconnects can repeat query charges. Actual project usage is shared; emulator delivery counts do not certify quota consumption. [Pricing](https://firebase.google.com/pricing), [read/Rules billing](https://firebase.google.com/docs/firestore/pricing).

Extra pre-commit/version-conflict reads are not measured by that model. Applying the existing helpers' illustrative reread pattern (two/audited mutation, three/comment, one/metadata edit) adds approximately **799 reads/day** at the upper workload, yielding roughly **41,551 estimated / 46,591 conservative reads/day** before cleanup. Production adapters may reuse authoritative state or use transforms, but no saving is assumed as proven.

The base model excludes manual cleanup. Illustrative cleanup at eight children/Task (including the Delete event at purge start): 60 parents adds 780 writes, 540 deletes and about 5,040 source-estimated reads; 250 adds 3,250 writes, 2,250 deletes and 21,000 estimated reads; 1,000 adds 13,000 writes, 9,000 deletes and 84,000 estimated reads. These are example backlogs, not a cleanup schedule or approved limit. Large manual purges can exhaust daily reads well before write/delete quotas; the tested resumable purge helps interruption, but production quota exhaustion itself was not emulated.

Owner clarification after the run: Trash may retain expired Closed Tasks longer; same-session permanent purge is not required. No Trash duration or cap is agreed. Three-month Closed retention therefore does not bound total retained metadata; 500 Tasks/account remains a scenario, not a capacity ceiling. Longer Trash retention increases metadata reads and storage. Recorded test results and model inputs are unchanged. No automatic cleanup or new retention rule is assumed. See `artifacts/workload-model.json` for every input, formula and stress case.

## Storage, indexes and Hosting

Document/index sizing uses documented formulas and representative prototype Task/Event data. Unit tests reproduce the official simple-document and single-field-index examples. Automatic map indexing can multiply full before/after snapshot storage. Proposed index exemptions remove snapshot/effect maps and Discussion text from automatic indexes while retaining needed timeline/ID indexes; they were not deployed. [Storage formula](https://firebase.google.com/docs/firestore/storage-size), [index behavior/exemptions](https://firebase.google.com/docs/firestore/query-data/index-overview).

| Comment text sizing | Default-index estimate | With proposed exemptions |
|---|---:|---:|
| 100 bytes | 541.3 MB | 141.2 MB |
| 1,000 bytes | 579.6 MB | 154.0 MB |
| 12,000 bytes | 749.9 MB | 310.2 MB |

These are not a storage guarantee: they exclude unspecified Todo/link counts, Trash, backups, final description/content fields and full production payload growth. The earlier blanket 2×/4× multipliers are only sensitivities; use the detailed formula estimates for this candidate. Index exemptions need production validation; the emulator does not enforce index availability.

The illustrative normal transfer model is about 1.145 GB/month with 1 KB Task/comment and 2.4 KB event inputs, below the listed 10 GiB Firestore egress allowance. These sizes are scenarios, not measured transport. Static Hosting only serves the small fixture. For comparison, a hypothetical 2 MB cold application bundle × 72 opens is 144 MB/day before other assets, versus the listed 360 MB/day allowance; no real bundle has been built or measured.

## Online write feasibility

The generic one-shot browser-direct REST commit port avoids the Firestore SDK offline queue. Tests reject known-offline calls before transport, use Auth/Rules for an acknowledged update, simulate cloud commit with lost acknowledgement, reread cloud state and reject stale replay. Unknown outcomes remain unknown until reconciled; timeout/abort does not prove the server did not commit. No hosted API is introduced. This demonstrates a local adapter approach, not completed production/UI wiring.

## Decision and remaining boundaries

**Do not approve this candidate for complete query persistence.** First clarify the validation boundary: full View functionality is required, but every filter semantic being enforced by Rules is an experimental choice, not a separately specified mandatory invariant. Owner-authorized alternatives are (A) retain strict Rules semantics and test smaller per-dimension records with version linkage, or (B) keep Rules ownership/All Tasks/version/order/envelope checks and validate filter semantics strictly/fail-closed in the client, with Task authorization independent of View data. Neither is approved or implemented. No functionality reduction is implied. A trusted backend/paid upgrade is not justified by this failed representation alone.

The underlying Spark browser-direct Task/event mechanism remains supported in represented scope, with the accepted client-only NFC/grapheme policy and fixed-India scope. Full Gate 4 remains INCONCLUSIVE/blocked by this local failure and unexecuted real Google/session/production-index tests. Manual recovery method scope remains to be agreed; complete account/project recovery is not added as a requirement.

No commit/push, production specification/legacy change, provisioning/deployment, paid runtime or Cloud Function occurred. Reproduction uses pinned Node 22.16.0, Java 21.0.12.1, Firebase 11.10.0, rules-unit-testing 4.0.1, CLI 14.27.0 and emulator 1.19.8. Install the lockfile, provide Node/Java, and run `./run.ps1` on disposable local ports 8080/9099/5000. **Expected current exit: 1**, not a passing suite.
