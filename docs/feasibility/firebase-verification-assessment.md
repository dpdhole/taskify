# Firebase verification assessment for owner decision

20 October 2026. **HOLD complete query acceptance. Overall Firebase Spark feasibility remains INCONCLUSIVE; the core browser-direct security mechanism remains conditionally supported.**

## Evidence across the four gates

| Gate | Verified evidence | Qualified assessment |
|---|---|---|
| 1: Task/event integrity | 101 tests after India-date correction; carried forward through later regressions | PASS for represented atomic mutation/event, ownership, versions, concurrency and fixed-India date contracts. General timezone changes, final creation-event policy and global intent deduplication are not established. |
| 2: entities | 147 tests, including Gate 1; retained in later runs | PASS for represented child/classification/View/settings contracts with explicitly accepted client-only NFC/grapheme enforcement. Full query persistence was not certified by this minimal schema. |
| 3: deletion/recovery | Original 20 tests; seven added cross-gate cases; 505-child interruption/resumption | Represented deletion/inventory/tombstone mechanism passes. Irreversible boundary, manual service-owner recovery approach and metadata retention are accepted. Appropriate manual recovery method scope/evidence still needs agreement; complete account/project recovery is not a new PoC prerequisite. |
| 4: authentication/query/Spark | Original 18 local tests; new full query/workload experiment | Client query semantics and normal workload mechanisms pass represented tests, but **complex Saved View persistence fails the Rules expression limit**. Real Google/session and production index validation remain unexecuted. |

The preserved combined candidate passed **192/192**. The latest extended query/workload candidate executed **237 tests: 236 passed, 1 failed, 0 skipped**, exit 1. It retained all 192 inherited cases. Counts overlap; neither the successive suites nor the historical 420 callable-backend tests may be summed as new proof.

Full details: [latest validation report](../../verification/firebase/query-workload/VALIDATION.md), [test inventory](../../verification/firebase/query-workload/test-inventory.md), [accepted decisions](firebase-validation-decisions.md), [prior combined regression](../../verification/firebase/regression/combined/VALIDATION.md).

## Decision-driving issue

**The tested single-document Saved View query representation is not acceptable for the complete filter contract.** Test 228 attempts a valid definition with all eight date ranges active, other dimensions and the grouped dimension excluded from filtering. The emulator rejects its valid save at the **1,000-expression ceiling**. Later assertions in that case do not run. Sparse invalid-query probes reject, but that does not compensate for a valid operation being unavailable.

Named ranges and more compact encodings were investigated; direct nested arrays are unsupported, and the final scalar-slot encoding still fails the positive case. A legitimate paused-Todo regression caused by the first preference extension was fixed without weakening its invariant; all inherited cases now pass. The known-good candidate and historical evidence remain unchanged.

This is a failed physical representation/validation design, not proof that Spark cannot support any complete-query design. No functionality was capped or silently moved to client-only enforcement to obtain a PASS.

**Requirement versus implementation choice:** saving/reloading complete valid Views is a product requirement. Validating every filter's internal semantics inside Security Rules is the experiment's design choice; its precise security-critical scope is not separately specified. Query filters are not authorization: Task access/mutation Rules must remain correct regardless of any View definition. Do not promote the failed strict validator into a new mandatory product requirement without clarifying that boundary.

## Workload findings

Confirmed inputs: **10–12 users; 3–5 new Tasks/user/day; expected 20–30 active Tasks/user; 2–3 Discussion entries mainly per active Task/week; 4–6 opens/day on one device/tab; no uploads; Closed retention three calendar months after closure, manually maintained.** Unfinished Tasks do not automatically expire. Trash may retain expired Closed Tasks longer; same-session permanent purge is not required. No Trash duration or cap is agreed.

Measured locally with 12 users and 500 retained Tasks/user:

- 72 complete cold loads delivered **36,504 server-backed metadata documents**, with no Discussion/Activity loading in lists.
- Local readiness median **1.375 s**, p95 **1.973 s**; 1,400 View/Search evaluations took **124.5 ms total**, with no extra Firestore queries. These are emulator/laptop measurements, not production guarantees.
- The 500/account count is a fixture, not an approved cap or guaranteed steady-state count.

| Capacity scenario | Reads/day estimate | Conservative write-access-budget estimate | Writes/day |
|---|---:|---:|---:|
| Lower workload | 15,144 | 17,704 | 521 |
| Upper workload | 40,752 | 45,792 | 1,122 |
| Upper + 10 detail pages/user/day | 42,936 | 47,976 | 1,122 |
| Upper + 3 additional cold reconnects/user/day | 59,436 | 64,476 | 1,122 |

The model includes explicit ancillary/detail/operation assumptions and Rules dependency sensitivities; it is not billed usage. Normal sizing fits the listed project-wide **50,000 reads/day and 20,000 writes/day** conditionally, before manual cleanup. [Official pricing](https://firebase.google.com/pricing).

Allowing an illustrative 799 additional pre-commit helper reads/day raises the upper scenario to about **41,551 / 46,591 reads/day**, before cleanup/conflicts beyond that pattern. No production caching/transform saving is certified.

Read quota is the main operating constraint. Large cleanup can consume it even when writes/deletes fit: an illustrative 250-Task purge with eight children/Task adds about **21,000 estimated reads**; a 1,000-Task backlog adds about **84,000**. These are workload sensitivities, not approved schedules/limits. Resumable deletion remains necessary. Extra devices/reconnects, retained Trash and persistent unfinished backlog also increase reads. Longer Trash retention is accepted. The 500-Task/account fixture is therefore not an upper bound derived from three-month retention; capacity remains conditional on total retained metadata, including Trash. No automatic cleanup is introduced.

Formula-based storage for representative prototype data is approximately **580 MB with default indexing** at 1 KB comment text, versus **154 MB with proposed snapshot/text index exemptions**. At 12 KB text, estimates are about 750 MB/310 MB. These exclude unspecified Todos, links, Trash, backups and final content fields; full before/after events duplicate data. The exemptions have not been deployed or production-validated. Full production payload/storage is not certified.

The generic one-shot direct Firestore REST commit prototype demonstrates known-offline rejection, cloud-authoritative acknowledgement, lost-ack reconciliation and stale replay rejection without a client SDK write queue. Production app wiring and actual Google/browser sessions remain outside the local evidence.

## Owner direction after assessment

**Full-query persistence is a core Taskify feature and intended differentiator over other Todo/Task managers.** The complete supported query must remain saveable and reloadable. This is owner-stated product positioning, not a verified market comparison. No de-scoping or alternative validation boundary is accepted. Prepare the findings for commit first; analyse any de-scoping carefully with the owner after that commit. The proposals below remain unapproved discussion alternatives, not authorization for redesign.

## Recommended decision

1. **Retain Firebase Spark as the candidate platform; hold approval of the latest full-query persistence design.** Current evidence does not justify introducing a backend, Functions or a paid upgrade.
2. **Decide the Saved View validation boundary before further redesign.** Option A retains strict server validation of all filter internals and tests a smaller per-dimension representation with version linkage/read-budget checks. Option B keeps ownership, protected All Tasks, version/order and definition-envelope checks in Rules, with strict fail-closed client validation of filter semantics. Option B must leave Task security independent of View data and handle malformed owner-authored definitions safely. Neither option has been approved or implemented; all query functionality is retained in both.
3. For user-owned View preferences, Option B is the simpler proposal to discuss; it is a new validation-boundary choice, not an already accepted compromise. Choose Option A if complete server-side preference semantics are required. A functional filter deferral is another explicit scope change and is not recommended by default.
4. After the local blocker is resolved, separately authorize a small live Google/session/index exercise. Before beta, agree the manual recovery-method scope and validate actual usage/cleanup behavior. Complete account-level recovery is not silently reintroduced.

The owner is deciding the next experiment, not approving production deployment. All changes are local and uncommitted; there was no cloud provisioning, deployment, push, paid dependency or change to product/legacy specifications. Git baseline remains `ea6280e`.

## Evidence limits

This is finite adversarial/functional evidence over candidate schemas, not a formal proof or a completed Taskify application. Local fixture creation and operator restore use explicitly privileged emulator setup; mock Google credentials do not validate real OAuth. The final harness uses explicit cleanup plus Node `--test-force-exit` for retained SDK/HTTP handles; this does not hide the failed assertion or prove browser lifecycle behavior. Source fingerprints, safe logs, model inputs and earlier failures are retained under `verification/firebase/query-workload`.
