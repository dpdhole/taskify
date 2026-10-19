# Firebase legacy validation gap analysis — revised Spark PoC/beta

**Status:** Documentation-only handoff and test planning (2026-10-19). No revised Firestore Security Rules, domain operations, Firebase resources, deployment or validation tests have been created or executed.

## Source baseline and evidence provenance

- **Historical repository snapshot:** [commit 46108abcdff3a60ec812170ebd63a8bb3830b7f5](https://github.com/dpdhole/taskify/commit/46108abcdff3a60ec812170ebd63a8bb3830b7f5), before the simplified single-user redesign.
- **Historical evidence documents:** `infrastructure/firebase/category-verification.md`, `infrastructure/firebase/callable-verification.md`, `docs/security_model.md`, `infrastructure/firebase/firestore.rules`, `infrastructure/firebase/firestore.rules.test.ts`, `apps/api/src/tasks/create-task.integration.test.ts` and `infrastructure/firebase/query-plan.md` **at that commit**.
- Historical documented local verification: **420 tests passed** — 116 API unit, 63 Admin SDK Firestore integration, 174 Firestore Security Rules, 39 query/Explain tooling, 28 callable HTTP. Verification was in local emulators/builds; deployed Rules, production Google authentication, and browser workflows were not thereby verified.
- **Current controlling specification:** `docs/product_spec.md` §§17–18, with `docs/project_status.md` as repository entry point. The old `docs/product_spec_legacy.md` remains strictly read-only.

## Architectural change that invalidates direct reuse of legacy security approval

Historical Taskify used a **trusted Firebase callable backend** for creation, lifecycle and Category mutations. Historical Firestore Rules allowed only tightly restricted ordinary Task edits and denied client Task creation/deletion, lifecycle writes, Thread writes and System Changes event writes. Legacy Admin integration tests verified the trusted SDK's transaction rollback/retry behavior; they **did not** establish that a browser can securely perform corresponding transactions with Rules alone.

Current PoC/beta is **Firebase Spark only**: static Firebase Hosting, Google sign-in through Firebase Auth, browser-direct Firestore via a layered client adapter, no hosted API or Cloud Functions. Firestore Security Rules must enforce the revised ownership and permitted writes; client domain code is not a security boundary. Therefore **neither the historical Rules approval nor its test counts validate the current architecture**.

## Reuse / retire / replace matrix

| Historical evidence | Disposition | Revised applicability |
| --- | --- | --- |
| Authenticated/unauthenticated and cross-user Rules tests | **Reuse technique; replace schema assertions** | UID-scoped Task, Discussion, Todo, Activity Log, Saved View, Category, Location and Settings ownership. Do not carry forward email-based participant/role policy. |
| Invalid field, timestamp and protected-attribute Rules tests | **Reuse approach; rewrite** | New Draft/In Progress/Closed lifecycle; independent Pause/outcome/deletion; Reference; immutability and date rules. |
| Admin SDK transactional rollback and injected ABORTED retry tests | **Reuse technique; re-execute via client SDK** | Atomic Task change + required event, conflict protection and operation retries under actual Rules evaluation. |
| System Changes immutable Thread/Entry Rules | **Replace** | Current Activity Log is structured append-only system events; permitted client event creation must be coupled to legitimate Task changes. |
| Fixed query preferences and nine-state lifecycle | **Retire behavior; create new tests** | Saved View CRUD/order/visibility; scope toggles, grouping, date filters and new Task states. |
| Category uniqueness guards and registration via callables | **Re-evaluate** | Direct-client authorization, duplicate prevention, default provisioning and concurrency must work without a trusted backend. |
| Task-owned Thread entry/attachment permissions | **Replace** | Discussion alone owns user comments and external links; Todo has neither; Activity Log is structured immutable events. |
| Historical indexes and preset Explain runs | **Reuse method; rederive queries/indexes** | Complete eligible Task metadata for client-side Views and lightweight Search; no deep Entry search. |
| Callable HTTP/package/deployment verification | **Historical only** | Not applicable to the no-Functions Spark baseline. |
| Historical object-storage/file operations | **Defer** | PoC/beta external Discussion links only; binary files remain future scope. |

## Mandatory targeted validation gates — planned, not executed

### Gate 1 — Task/Event integrity (critical first feasibility gate)

Using a minimal new Task schema, Activity event schema, client SDK and Firestore emulator Security Rules:
1. Allow valid authenticated owner operations for Start, Schedule, Pause, Edit Pause, Resume, Done, Close and Reopen, with the required immutable event in the same atomic transaction/batch.
2. Reject a Task lifecycle or audited-field change **without** the required Activity event.
3. Reject an orphan/mismatched/spoofed Activity event, editing or deleting existing events, falsifying actor/owner or protected timestamps, and otherwise forbidden state transitions.
4. Reject partial writes and unauthorized direct writes; test whether `getAfter()`, stable operation/event identifiers and versioning can enforce mutual consistency within Rules access limits.
5. Exercise conflicting Task writes and retries; demonstrate that stale clients cannot violate lifecycle invariants or duplicate mandatory effects.
6. **Pass criterion:** Demonstrated enforceability of required invariants against malicious/modified client requests, not merely successful normal UI flows. **If this cannot be proven on Spark, stop and seek an owner-approved design/scope/infrastructure decision; do not silently weaken the invariant.**

### Gate 2 — Revised entity authorization and data integrity

- Discussion: add/edit/delete comment within the allowed window; add/edit/remove external links; enforce Task Closed/Deleted read-only rules and any implicit Start effect atomically.
- Todo: create/rename/close/reopen/delete under parent ownership; disallow *all* Todo entries/comments/attachments; coordinate Todo completion and Task Actual Start/activity event as required.
- Activity Log: append-only event schema and legitimate-event linkage; no attachment or user comment operations.
- Categories and Locations: unique normalized names, archive behavior, referenced-entity validation, reorder/default protection and competing operations without the retired callable guards.
- Saved Views: independently owned definitions, All Tasks protected behavior, initial provisioning, reordering, Home visibility and user isolation.

### Gate 3 — Permanent deletion and recovery

- Demonstrate Firestore **does not cascade-delete subcollections**; ensure any partial deletion leaves no exposed records and is idempotently recoverable.
- Exercise failure and retry during Task → Todos/Discussion/Activity hierarchy cleanup; preserve soft Delete/Restore behavior until final purge.
- Define an operationally feasible manual export/recovery plan using only approved Spark capabilities. Do not assume an atomic unlimited-child purge or paid managed backups.

### Gate 4 — Authentication, queries and Spark-only operation

- Test actual Google provider sign-in and remembered client session restoration outside emulator-only credential fixtures.
- Validate UID-scoped Firestore rules and missing/foreign ownership cases with current paths.
- Verify whole-eligible-population metadata loading, reactive Saved View results and Search while keeping Discussion/Activity payloads lazy.
- Reassess free quotas, index/query costs, static Firebase Hosting and prohibition of server functions/paid services.

## Handoff and scope boundaries

**Next implementation checkpoint:** A *separately approved* minimal **Gate 1 security/atomicity feasibility PoC**, then Gate 2 entity rules, Gate 3 deletion, Gate 4 auth/query/Spark. Reuse the historical test-harness design where appropriate, but do not revive obsolete multi-user roles, email ownership, fixed Views, automatic lifecycle, or callable backend contracts.

**Currently verified:** historical 420-test suite in its documented local scope, not rerun here. **Currently unverified:** revised client-side Rules, Task/Event pairing, deletion, actual Google Auth, physical Firestore schema and Spark deployment. No project code, rules, resources or legacy specification changed as part of this handoff.
