# Taskify Project Status

## Documentation Loading Contract

This file is the canonical entry point for Taskify project state.

Whenever `docs/project_status.md` is provided, referenced, or requested as project context, the complete authoritative Taskify specification consists of this file plus every document listed under **Authoritative Document Set** below.

A reader or assistant must load the relevant linked documents before:
- answering questions about existing requirements or architecture;
- proposing changes that depend on existing decisions;
- modifying project specifications;
- implementing project code.

Do not treat this file alone as the complete specification. Each approved fact should have one authoritative home; this file summarizes project state and points to that source.

Where documents conflict, explicit supersession records in `docs/decisions.md` govern. Otherwise, the most recently approved specification governs.

## Authoritative Document Set

- [Product Specification](./product_spec.md) — product vision, requirements, lifecycle, UX/navigation, collaboration model, and MVP scope.
- [Data Model](./data_model.md) — domain entities, physical Firestore schemas, query/retrieval contracts, and persistence semantics.
- [Backend Architecture](./backend_architecture.md) — trusted callables, mutation boundaries, transactions, concurrency, and schedulers.
- [Security Model](./security_model.md) — permission model, Firestore Security Rules contract, and authorization boundaries.
- [Architecture Decisions](./decisions.md) — DEC register, supersession history, and change log.

Referencing `docs/project_status.md` implicitly references this complete authoritative document set.

## Purpose

This file is the single authoritative record of Taskify IT project state.

Chat history is not authoritative unless a decision or change is explicitly approved and recorded here.

## State Model

Use the following states consistently:

- **Discussion** — Being explored; not authoritative.
- **Proposal** — Concrete option awaiting approval.
- **Approved** — Explicitly accepted and part of the project baseline.
- **Implemented** — Built, but not necessarily verified.
- **Verified** — Tested or validated against the approved specification.
- **Superseded** — Previously approved but replaced by a later decision.

Material state transitions require explicit project-owner approval.

## Project Governance

**Status:** Approved

- The project owner is the sole decision-maker, developer, and operator.
- ChatGPT acts as technical product partner, architect, and development assistant.
- No material assumptions should be made when missing information affects a decision.
- No project action should be taken without explicit approval.
- Facts, requirements, proposals, assumptions, decisions, and implemented state must remain distinct.
- Approved decisions remain the project baseline until explicitly changed.
- Responses should be brief, precise, and actionable by default.
- Unnecessary internal reasoning or step-by-step thinking should not be exposed unless explicitly requested.
- New scope, technologies, dependencies, or processes must be identified as proposals before adoption.
- Maintain continuity and execution context in this document's **Current Status** section, with links to authoritative specifications and detailed evidence where needed. Do not create separate handoff documents or handoff directories.

## Current Status

- Architecture and product design are approved through **DEC-082**.
- Category backend and registration completion are Implemented. DEC-078–DEC-082 resolve registration coordination, grapheme counting/code-point ordering, precise concurrency tokens, private persistence and post-commit response observation. Production builds/package passed; executed local results are 116 API unit + 63 API integration + 174 Rules + 39 query/tooling + 28 callable HTTP tests = 420 passing tests. Evidence/limits are recorded in [category-verification.md](../infrastructure/firebase/category-verification.md). Owner approved commit/push on 2026-10-07; formal Verified status remains held.
- Publication/execution context: the owner explicitly released commit/push of the Category implementation, tests and documentation to `origin/main`, including the preserved Category specification commit `add989fe065841aa73d3ff0ff71cf6fed2ddeeab`. The implementation commit descends from that baseline; Git records the exact local/remote tips. Remote `main` was fetched before publication and confirmed an ancestor of the checkout; no force push or history replacement is authorized. No deployment, billing/IAM change, cloud fixture write or cloud resource alteration is authorized.
- Category continuation: formal Verified status remains a separate owner decision. Client registration/readiness integration and production verification are pending. Local execution uses the portable Node 22/pnpm 10.34.6/JDK 21 tools in sibling `verification-tools`; run the shared-port emulator suites sequentially. Exact commands, environment and limits remain in the linked Category evidence.
- Firestore Security Rules and the client-SDK emulator test matrix are Implemented and Verified within the executed scope, with project-owner approval to record and publish that status. All 174 Rules tests passed. The approved list exception, remembered-view capability matrix, and profile-timezone validation limit are recorded in DEC-065–DEC-068.
- API contracts and the initial backend structure are implemented. The `createTask` operation and callable handler retain their recorded verification scope. Local Node 22 ESM build/package preparation and callable HTTP transport are Implemented and Verified within the recorded scope; all 15 transport tests and existing regressions passed, with owner approval to record and publish that status. Production token signatures, real providers, cloud runtime/deployment, and client features remain unverified.
- The approved eight composite indexes and DEC-069 preference single-field collection-group override are Implemented and Verified within the executed local-test/development-service planning scope, with owner approval to record and publish that status. All definitions became READY and matched the manifest; all 13 real-service plan-only query variants selected the intended indexes. Production workload/performance verification remains pending.
- Repository architecture is approved as a single workspace/monorepo with `apps/api`, one responsive browser client at `apps/app`, `packages/api-contracts`, `packages/client-sdk`, `infrastructure/firebase`, shared `docs`, and repository-wide `tooling`. DEC-058 supersedes DEC-055's initial separate `apps/mobile`/`apps/web` split. The workspace skeleton and package boundaries are now implemented.
- The API-contract boundary is approved: `api-contracts` defines the client/API protocol, `client-sdk` implements the official client abstraction, and backend domain/business logic remains private to `apps/api`.
- pnpm is approved as the package/workspace manager and pinned to `pnpm@10.34.6` for standard Corepack selection (DEC-073). No Nx, Turborepo, or other build-orchestration layer is adopted initially; orchestration/caching remains deferred until justified.
- TypeScript, Node.js 22, and ESM are approved as the current language/runtime baseline.
- The browser client technology is approved as React + TypeScript + Vite, to be implemented as a responsive SPA with PWA capability. Full offline synchronization is not an MVP requirement; future native clients remain deferred until justified.
- Repository bootstrap is implemented with pnpm workspace configuration, strict shared TypeScript defaults, `@taskify/*` package naming, and explicit workspace dependencies. Lint/format remain unselected/unimplemented. Firebase Emulator tooling supports backend, client-SDK Rules, preset-query, and Auth/Functions callable suites. Contract/API production builds and a standalone Functions artifact are implemented; no cloud application deployment occurred. Index configuration is deployed to development with successful real-service planning evidence. Vitest remains the approved test runner.
- The approved development environment is `taskify-dev-dpdhole`, Standard/Native `(default)` Firestore in `asia-south1`, with deletion protection enabled and PITR disabled. A `dev` alias is recorded without a default cloud target. Initial client access remains closed; Taskify's Rules and application features have not been deployed. No production environment/region or billing attachment was created. See [development.md](../infrastructure/firebase/development.md) for actual resource settings and access evidence.
- The internal `apps/api` implementation structure is approved as feature-oriented business operations with thin Firebase deployment adapters and narrowly shared infrastructure.

## Open Questions

- Exact Nearby coarse-proximity distance bands/resolution/query implementation remains deferred to Firebase Architecture.
- Category implementation choices are resolved by DEC-078–DEC-082. Client registration/readiness integration remains unimplemented; Firebase Auth creation alone does not complete Taskify registration. Large-collection Reset operational capacity and real cloud/provider/runtime behavior remain unverified. Reset must fail atomically if service limits prevent completion; no batching/cap is approved.
- Exact autosave-versus-unsaved-change warning behavior remains a detailed interaction-design decision.
- Search implementation details beyond the approved baseline (fuzzy/semantic search, stemming, ranking technology) remain deferred to Firebase Architecture.
- Todo field, lifecycle, and date semantics remain deferred.
- Attachment file-size/type limits remain an implementation/operational decision.

## Implementation Status

Repository/workspace bootstrap, API contracts, and the initial backend structure are implemented. The `createTask` vertical slice includes a callable adapter, authenticated canonical email extraction, Firestore transaction, active-category validation, canonical Task initialization, TaskDate normalization, and deterministic System Changes thread creation. The approved runtime-validation correction is implemented and verified within the expanded suites below. No client feature implementation is formally recorded as implemented or verified.

Category backend create/rename/archive/order-reset and registration-default completion are also Implemented under DEC-074–DEC-082, with current executed evidence in category-verification.md. Client registration/readiness behavior remains unimplemented. Owner approved commit/push; Category formal Verified status has not been approved.

### Initial Verification Evidence — 2026-10-07

**Status:** Verified within the recorded test scope; project-owner approval obtained to record this evidence.

- Tested repository: `dpdhole/taskify`, branch `main`, commit `c22e4d143c15797338520233b294f633efaf3cfc`. GitHub `main` still matched this commit after verification.
- All declared workspace dependencies installed successfully using Node.js `22.23.3` and pnpm `10.34.6`. No committed lockfile existed; installation used `--lockfile=false` and did not change manifests or generate a repository lockfile.
- Test environment: Vitest `5.0.3`, Firebase CLI `15.32.1`, Firestore emulator `1.22.0`, and portable Oracle JDK `21.0.12.1`.
- Resolved API runtime dependencies: `firebase-admin` `13.10.0`, `firebase-functions` `6.6.0`, `date-fns` `4.4.0`, and `@date-fns/tz` `1.5.0`.
- Unit command: `corepack pnpm@10 --filter @taskify/api test src/tasks/task-dates.test.ts`. **Result:** 1 file, 4 tests passed; exit code 0; duration 3.39 seconds.
- Integration command: `corepack pnpm@10.34.6 exec firebase emulators:exec --project taskify-local --only firestore 'corepack pnpm@10.34.6 --filter @taskify/api test:integration'`. **Result:** 1 file, 3 tests passed; exit code 0; duration 3.66 seconds. The emulator shut down after successful execution.
- Unit coverage: date-only preservation without an instant, impossible calendar-date rejection, required time/timezone for timed values, and IANA-zoned local-time conversion to the expected UTC instant.
- Integration coverage: canonical root Task and deterministic System Changes thread creation, response/persisted `updated_at` agreement, and rejection of foreign-owned or archived categories without Task creation.
- Environment blockers resolved without repository changes: system Node.js 20 was replaced only for the verification process by portable Node.js 22; Vitest's sandbox `spawn EPERM` was resolved by running outside the sandbox; Firebase CLI's rejection of Java 8 was resolved using portable JDK 21. A Temurin download failed DNS resolution; the Oracle JDK download succeeded. No implementation/test failure remained in the executed suites.

**Limits of the initial run (expanded coverage is recorded below)**

- Integration tests invoke the backend operation directly using the Firebase Admin SDK. They do not exercise the callable transport, authentication/canonical-email extraction, or public error translation.
- Passing creation assertions confirm the resulting Task/thread state; the suite does not inject transaction failures or exercise concurrency/retry behavior to independently verify atomicity under failure.
- Broader malformed-input validation, missing-category rejection, timed-date persistence, and DST edge cases are not covered by these existing suites. Their behavior is not inferred to be Verified.
- Firestore Security Rules were neither implemented nor verified by this run. No Rules file is configured, and the emulator defaults to allowing reads/writes; Admin SDK integration tests do not verify Rules regardless.
- Firestore indexes and query plans were not verified. Deployment and client behavior were not verified.

### Expanded Verification and Validation Correction — 2026-10-07

**Status:** Implemented and Verified within the recorded scope; project-owner approval obtained for the correction, documentation update, commit, and push.

- Tested the approved working-tree changes based on `6d1df4e2a9c3a3e66cb401ada62dee25dbf74ec3`. The correction and expanded tests are committed together with this record. The test environment and resolved dependency versions are unchanged from the initial run.
- Expanded tests initially exposed 11 failing cases: malformed required fields returned `INTERNAL`; invalid priority/date values could be accepted and written; and missing/null/numeric `has_time` values were accepted. These failures were reported before the project owner approved production-code corrections.
- Correction: validate request object shape and required string fields before trimming; require boolean priority when supplied; require category IDs rather than nested paths; validate supplied TaskDate objects and field types; explicitly validate timezone identifiers; persist only canonical date fields. Malformed inputs return `INVALID_ARGUMENT` before transaction writes. No new dependency or architecture decision was introduced.
- Omitted creation dates remain absent intent and persist as null. Explicit null creation-date inputs are rejected according to `CreateTaskRequest`; `updateTaskDates` retains its separate explicit-null clearing contract.
- Unit command: `corepack pnpm@10.34.6 --filter @taskify/api test --exclude '**/*.integration.test.ts'`. **Result:** 2 files, 39 tests passed; exit code 0; duration 2.18 seconds.
- Integration command: `corepack pnpm@10.34.6 exec firebase emulators:exec --project taskify-local --only firestore 'corepack pnpm@10.34.6 --filter @taskify/api test:integration'`. **Result:** 1 file, 25 tests passed; exit code 0; duration 5.88 seconds. The emulator shut down successfully. **Total:** 64 tests passed, no failures.
- Callable-handler unit coverage uses the actual handler with a mocked operation: missing/unusable authentication denial, authenticated email trimming/lowercasing, trusted actor selection, authoritative response passthrough, stable public error mapping, and unexpected-error detail protection.
- TaskDate unit coverage includes malformed field types, date/time validity, timezone validity, canonical-field persistence, date-only semantics, winter/summer offsets, valid local times around the spring DST transition, and rejection of nonexistent spring-gap times.
- Integration coverage uses real Firestore-emulator transactions and the Admin SDK: canonical Task/thread creation, owned active/missing/foreign/archived category behavior, timed Start/Due/End persistence and scalar projections, matching timestamps, real callable-handler invocation with canonical authenticated identity, protected-field spoof resistance, and malformed-request rejection with no Task/thread writes.
- Failure/retry coverage: a deliberately pre-created thread causes a real commit-time create-precondition failure and rolls back the queued Task write; an injected retryable `ABORTED` error after the first callback's queued writes exercises the actual SDK retry path, reuses the Task ID, and produces exactly one Task and one thread.
- Integration setup requires the configured local emulator (`127.0.0.1:8080`); recursive fixture cleanup includes orphan subcollections. Unit execution explicitly excludes integration files. `git diff --check` passed.

**Limits of the expanded API run (the later Rules workstream is recorded below)**

- Callable handlers are invoked via `.run`; HTTP callable transport, Firebase token verification, deployed-function behavior, and client SDK behavior are not exercised.
- The retry test injects a retryable error; it does not establish behavior under every real concurrent-write race or contention scenario.
- Ambiguous local times during the autumn DST overlap were not tested or assigned a new disambiguation policy.
- At that run, Security Rules were a separate pending workstream and no Rules file was configured. Admin SDK tests do not verify Rules. Index/query-plan validation, deployment, and client behavior remain unverified.

## Known Issues / Technical Debt

- Profile timezone Rules deliberately validate identifier shape only, not IANA registry membership (DEC-068).
- Private-record list authorization deliberately relies on canonical identity/containment invariants and permits querying own records without parent access (DEC-067). Direct gets and writes retain their stricter constraints.

### Firestore Security Rules Implementation and Test Evidence — 2026-10-07

**Status:** Implemented and Verified within the executed scope. Project-owner approval obtained to record this status and commit/push the implementation, tests, and documentation. No production deployment is approved or implied.

- Working-tree implementation is based on `1e189359994dbdacc8cee35ef75bcf31a252c05e`.
- Rules source: `infrastructure/firebase/firestore.rules`; configured by the root `firebase.json`. Client-SDK tests: `infrastructure/firebase/firestore.rules.test.ts`; Vitest configuration: `infrastructure/firebase/vitest.rules.config.mts`.
- Approved root development dependencies: `firebase` `12.19.0` and `@firebase/rules-unit-testing` `5.0.2`. Node.js `22.23.3`, pnpm `10.34.6`, Vitest `5.0.3`, Firebase CLI `15.32.1`, Firestore emulator `1.22.0`, and JDK `21.0.12.1` were used. The verification-only pnpm launcher was corrected to invoke portable Node.js 22 explicitly before the final runs; no system runtime was changed.
- `pnpm run test:firestore:rules`: **174 tests passed**, 1 file, exit code 0, duration 16.40 seconds. This executes client-SDK operations with mocked authentication against the actual configured Rules; fixture seeding alone bypasses Rules.
- `pnpm --filter @taskify/api test --exclude '**/*.integration.test.ts'`: **39 tests passed**, 2 files, exit code 0, duration 2.35 seconds.
- `pnpm run test:api:integration`: **25 tests passed**, 1 file, exit code 0, duration 6.77 seconds, with the Rules file configured. These Admin SDK tests remain backend regression checks, not Rules verification. Both emulator commands shut down successfully.
- **Total: 238 tests passed.** `git diff --check` passed. No deployment or index implementation was performed.
- Rules coverage: authenticated/profile isolation and identity/provenance protection; narrow Category reorder; owner-scoped Task reads and ordinary edits; explicit denial for every protected Task field; Category assignment/archive preservation; exact personal-tag schemas, enums, cardinality and duplicate validation; private-state/reminder read isolation and write denial; System Changes read access and immutable thread/entry boundaries; per-preset complete view snapshots, thresholds, staleness, filters, sort, ten-Category ownership limit and Reset; identity-constrained collection groups, bounded Hide Until query, approved orphan-record list behavior, and unmatched-path denial.
- A targeted initial experiment denied both approved positive collection-group queries when UID and parent access were required. DEC-067 was approved before applying the identity-only list exception. Unconstrained, foreign-identity and unauthenticated query denial tests still pass.
- Remaining limits: Firebase token verification is mocked; deployed behavior, client features, exact IANA existence for profile timezones, production index plans/Query Explain, and callable HTTP transport were not verified. Recursive list grants apply to ordinary collection queries too, as explicitly approved in DEC-067.

## Next Actions

- Review Category executed local evidence (DEC-074–DEC-082) for a separate formal Verified status decision. Backend callables/contracts/tests are Implemented and commit/push is owner-approved. Client registration/readiness UX, deployment and production verification remain separate work.

- Local API build/package and callable HTTP work is complete and owner-approved as Verified within the executed scope: contract/API production builds passed, the standalone runtime artifact loaded with dependencies resolving inside it, an unchanged rebuild preserved its lockfile, standard Corepack selected pnpm 10.34.6, and all five test suites passed (292 tests). The owner-approved ApiError message annotation fixed nine compile errors without runtime/public-contract changes. Exact commands, versions, durations and limits are recorded in [callable-verification.md](../infrastructure/firebase/callable-verification.md). Commit/push is owner-approved; cloud deployment remains a separate decision.
- Rules implementation and emulator verification are complete within the recorded scope. Production deployment, real authentication/provider validation, and client workflows remain separate work requiring project-owner authorization.
- Query/index verification is complete and owner-approved as Verified within the executed scope: 39 local tests passed (final regression exit 0, 7.08 seconds), eight development composite indexes plus the preference single-field configuration are READY and match the manifest, and all 13 real-service plan-only variants succeeded. Two Explain passes were executed; the final raw report records exact inputs and metrics. Exact evidence and limits are recorded in [query-plan.md](../infrastructure/firebase/query-plan.md). Owner approved commit/push and archival of the historical [bootstrap proposal](./proposals/firebase-bootstrap-proposal.md); the authoritative resource/decision records remain the current specification. No cloud fixture writes or analyze execution occurred.
- Representative-data performance analysis, cloud Rules/application deployment, cloud Functions region/IAM/billing selection, real authentication/provider validation, browser/mobile workflows, and production setup remain separate work requiring project-owner approval. Local emulator-issued tokens are unsigned and do not establish production token-signature verification.

No subsequent material action is considered approved unless explicitly authorized by the project owner.
