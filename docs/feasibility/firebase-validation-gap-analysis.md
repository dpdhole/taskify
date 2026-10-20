# Firebase legacy validation gap analysis — revised Spark PoC/beta

**Current status (2026-10-20):** The four local feasibility experiments have executed. See [Gate 1–4 findings](firebase-validation-results.md) and [source/evidence](../../verification/firebase/README.md). Gates 1–2 have qualified local PASS results; Gates 3–4 and overall platform feasibility remain INCONCLUSIVE. No Firebase cloud provisioning/deployment or production implementation is claimed.

**Historical planning status (2026-10-19):** This document originally recorded a documentation-only handoff before experiment execution. The gate criteria below remain the validation checklist; dated historical evidence is not current browser-direct acceptance.

**Latest update (2026-10-20):** [Query/workload assessment](firebase-verification-assessment.md) executed 237 tests: 236 passed, one valid full Saved View definition failed the 1,000-expression ceiling. This adds a concrete local Gate 4 candidate blocker. Query computation/load evidence and the confirmed workload model do not override that failure; no query cap or client-only integrity relaxation is accepted.

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
- Exercise failure and retry during Task → Todos/Discussion/Activity hierarchy cleanup. **Owner clarification, 2026-10-20:** cancellation and ordinary Restore remain possible before the first physical child deletion (cancel the untouched purge job first). After that point deletion is irreversible and interrupted purge is completed by a subsequent manual run. See [accepted decisions](firebase-validation-decisions.md).
- Define an operationally feasible manual export/recovery plan using only approved Spark capabilities. Do not assume an atomic unlimited-child purge or paid managed backups.
- The owner accepts manual service-owner recovery for development/admin incidents. Complete account/project-loss recovery was not specified or approved as a PoC prerequisite; clarify the manual method's scope before expanding it. Minimal content-free purge tombstone retention is accepted.

### Gate 4 — Authentication, queries and Spark-only operation

- Test actual Google provider sign-in and remembered client session restoration outside emulator-only credential fixtures.
- Validate UID-scoped Firestore rules and missing/foreign ownership cases with current paths.
- Verify whole-eligible-population metadata loading, reactive Saved View results and Search while keeping Discussion/Activity payloads lazy.
- Reassess free quotas, index/query costs, static Firebase Hosting and prohibition of server functions/paid services.

## Handoff and scope boundaries

**Combined security checkpoint (2026-10-20):** [192 tests passed](../../verification/firebase/regression/combined/VALIDATION.md), zero failures/skips, against the unchanged inventory-enabled candidate. This covers represented earlier gate contracts and seven new inventory/purge/tombstone cases. Source-limit sweeps now accept three independent aggregates and deny four or more in the emulator; do not reuse earlier Gate 2 batch boundaries.

**Owner direction:** Full-query persistence is a core feature and intended Taskify differentiator. Prepare findings for commit before careful owner discussion of any de-scoping; no reduction or validation-boundary change is approved. Longer Trash retention is allowed, with duration/cap unspecified. **Next checkpoint after commit:** Owner discussion of the Saved View validation boundary before redesign: complete filter semantics remain required, while the precise depth of Rules validation versus fail-closed client preference validation needs clarification. The tested candidate is not accepted; neither alternative is implicitly approved. Clarify manual recovery scope and cleanup/Trash assumptions. Real Google/session and production index testing require separately scoped cloud authorization. Do not revive obsolete multi-user roles, email ownership, fixed Views, automatic lifecycle, or callable backend contracts.

**Current evidence:** local revised Task/Event, entity, deletion and read-model assertions, including combined represented regressions, are recorded in the findings with exact scope and known limitations. The historical 420-test suite was not rerun or counted. **Still unverified:** full production schema/query coverage, the appropriately scoped manual recovery method, actual Google/session behavior, full query/index workload and Spark deployment. Complete account/project-loss recovery is unapproved scope, not a mandatory PoC blocker. Experiment source is isolated under `verification/firebase`; application code, cloud resources and the legacy specification remain unchanged.
