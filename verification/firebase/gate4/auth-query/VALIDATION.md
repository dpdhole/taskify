# Gate 4 — Authentication, queries and Spark-only operation

20 October 2026. **Overall: INCONCLUSIVE. Local subset: 18 passed, 0 failed, 0 skipped.**

Baseline repository `dpdhole/taskify`, main, HEAD `38a7fb7383ae99948f003d68fe7d77e8e4b20dfa`; working tree clean. Authoritative Gate 4 criteria are in `docs/feasibility/firebase-validation-gap-analysis.md`. No `docs/decisions.md` exists at this HEAD. Repository documents and the immutable legacy specification were not modified.

## Actual execution

`gate4-validated.log`: 18 tests, 18 pass, 0 fail, exit 0, test duration 9.870 seconds. Firestore, Authentication and static Hosting ran locally under `demo-taskify-gate4`, then shut down. Earlier runs passed 15/15 and 17/17 before the suite expanded; those totals are not added to the final count.

Exact test titles/assertions are retained in `tests/gate4.test.mjs`:

| # | Test | Result |
|---|---|---|
| 1 | Owner loads all 1,203 Task documents without a page limit | PASS |
| 2 | Anonymous, foreign-UID and cross-user collection-group reads denied | PASS |
| 3 | Missing/forged ownership writes denied | PASS |
| 4 | Even administrator-corrupted ownerUid does not grant a foreign UID access; path owner retains access | PASS |
| 5 | Search finds last record beyond rendered page; no Discussion/Activity reads | PASS |
| 6 | Trimmed case-insensitive contiguous phrase across four metadata fields; structured AND | PASS |
| 7 | Independent Closed/Deleted controls; inactive/reactivated closure reason selections | PASS |
| 8 | OR within supported dimensions, AND across dimensions, grouped dimension ignored as filter | PASS |
| 9 | Ordered category partition, zero groups and exactly-once counts | PASS |
| 10 | Remote Task/classification updates reconcile membership, current labels and counts | PASS |
| 11 | Explicit logout clears data; switching UID cannot publish earlier user's snapshots | PASS |
| 12 | Listener permission failure prevents complete-result claims | PASS |
| 13 | Search submission, empty submission, detail/back and other navigation state | PASS |
| 14 | Profile and Saved View ownership on current paths | PASS |
| 15 | Mock Google Auth credential, token-backed own-path Firestore access, foreign denial, sign-out denial, repeat sign-in | PASS |
| 16 | Actual Rules-authorized browser metadata write reconciles Search; stale version rejected | PASS |
| 17 | Cache-only/pending snapshots cannot be authoritative; late callback after logout ignored | PASS |
| 18 | Static Hosting entrypoint and SPA fallback; no function/API rewrite | PASS |

Most read-model records are deliberately privileged synthetic fixtures. Test 16 separately creates a valid Task and updates it through client Security Rules. No claim is made that the privileged fixture creation validates Task write integrity.

## Changes in the isolated experiment

Copied Gate 3 Rules unchanged. Added a shared full-population metadata store and limited query selectors, three UID-scoped collection listeners, explicit readiness/error state, classification-label reactivity and generation guards on logout/UID switch. No child collection is fetched by the list loader. Category grouping preserves configured zero groups. Added local Auth-to-Firestore integration and a static Hosting smoke fixture, not a Taskify application.

The query strategy deliberately loads all owner Task metadata and applies scope/filters/Search locally. It therefore covers every eligible record, including Closed/Deleted expansions, at the cost of loading ineligible owner metadata too. No persisted search index or derived View membership was added. Search results share the Task/classification state; Search does not mutate Saved View definitions.

## Spark and query assessment

Official sources checked on 20 October 2026:

- [Firebase pricing](https://firebase.google.com/pricing): Spark offers standard Firestore 1 GiB storage, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB/month egress; static Hosting lists 10 GB storage and 360 MB/day transfer. Non-phone Authentication is available; Identity Platform has separate MAU limits. These are service listings, not evidence of a configured project.
- [Firestore billing](https://firebase.google.com/docs/firestore/pricing): listeners incur reads for changes and may incur fresh-query charges on reconnect. Rules-dependent reads and minimum query charges also matter.
- [Rules limits](https://firebase.google.com/docs/firestore/quotas): 10 access calls per operation and 20 per multi-operation request, with caching; 1,000 expressions; source/compiled size limits. Copied Rules source is 30,388 bytes. Compilation/upload to the emulator succeeded; production compiled size/access-budget certification was not performed.
- [Emulator differences](https://firebase.google.com/docs/emulator-suite/connect_firestore): compound indexes and some production limits are not enforced. Emulator success cannot prove production index readiness.
- [Hosting usage](https://firebase.google.com/docs/hosting/usage-quotas-pricing): Hosting usage is shared at project level. Static Hosting must remain distinct from App Hosting or server rewrites.

Illustrative lower-bound reads for the initial synthetic population: 1,203 Tasks + 2 Categories + 1 Location = **1,206 document reads per fresh full load**. Forty-one such loads consume 49,446 reads; 42 consume 50,652, exceeding the daily project quota before auth/profile/View/detail reads, updates or Rules dependencies. This is arithmetic, not measured billing. With 10,000 Tasks + 100 classification documents, five fresh loads would already be 50,500 reads. Multiple users/devices share the project quota. Reconnect frequency, memory, payload growth and beta population require an explicit workload budget; an unbounded listener is not certified safe for arbitrary beta usage.

For the chosen Task-list query there is no compound structured server filter or sort; `firestore.indexes.json` is empty. Client selector support does not imply that every future domain query needs no index. Child/detail, cleanup, time queries and any future constrained metadata strategy must receive a complete production query/index manifest.

No Cloud Function, paid runtime, callable API, App Hosting, Storage upload or live resource was introduced. The Firebase CLI is a development dependency; the probe does not deploy anything.

## Required gaps before PASS

1. **Real Google OAuth and remembered browser sessions:** not executed. The test supplies emulator mock credentials and explicitly uses memory persistence. Repeat sign-in is not browser session restoration. Popup/redirect, browser restart, token refresh/revocation, cross-tab behavior, authorized domains and Google-only provider configuration remain unverified. The approved local-only scope does not authorize provisioning or configuring a live Firebase project.
2. **Query breadth:** prototype selectors cover scope, closure outcomes, Category/Location/Lifecycle filters, phrase Search and category partitioning. Full date buckets, Important/Urgent, pause predicates, all sorts, Dashboard burn-rate and every Saved View definition are not implemented or certified. Gate 2's simplified query schema remains a feasibility schema. No production adapter adoption is authorized.
3. **Readiness coherence:** the store waits for server-backed snapshots of all three collections, but this is not an atomic cross-collection snapshot. A brief mismatch between a Task change and its classification update is possible. No temporal snapshot guarantee is claimed.
4. **Online writes:** one online acknowledged metadata mutation is tested. A complete application-level offline-write prohibition, reconnect mutation policy, auth observer/store wiring and browser end-to-end lifecycle suite remain implementation work. The Firestore SDK's native offline queue was not certified away.
5. **Production operation:** actual indexes, deployment configuration, live SDK behavior, quota exhaustion handling, billing-plan verification and realistic load/bandwidth are not tested. Static Hosting test uses a 262-byte fixture, not an application bundle.
6. **Cross-gate regression:** Gate 3 Rules were reused; all earlier Gate 1–3 suites were not rerun as a combined suite after inventory changes. Gate 3 account-level backup, trusted-operator recovery policy, tombstone retention and partial-purge Restore boundary remain unresolved.

## Conclusion and next approval boundary

The local evidence supports UID isolation, full-population metadata Search and a reactive browser-direct read model. Spark remains a conditional candidate for a bounded PoC/beta workload. Gate 4 and overall feasibility remain INCONCLUSIVE.

Next concrete validation: a separately approved real-Google/browser session exercise against an owner-designated, no-billing Spark test project, followed by a complete query/index and workload validation. Before any live action, identify the project, allowed configuration changes, account creation and whether provisioning/deployment is authorized. No such action has occurred.

## Reproduction

Node 22.16.0, Java 21.0.12.1, Firestore emulator 1.19.8; Firebase 11.10.0, rules-unit-testing 4.0.1, firebase-tools 14.27.0 pinned in lockfile. `run.ps1` uses the existing sibling `../../gate1` runtime/cache and node_modules junction. Portable alternative: install lockfile dependencies using Node 22/Java 21 and run `npm test`. Local ports: Firestore 8080, Auth 9099, Hosting 5000. Tests clear local Firestore fixtures; use a disposable emulator instance. No Firebase cloud project is needed.

Bundle excludes dependencies, emulator/runtime binaries and debug/environment logs; includes source, pinned lockfile, successful final log and report.
