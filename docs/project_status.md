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

## Current Status

- Architecture and product design are approved through **DEC-064**.
- The concrete Firestore Security Rules design and emulator test matrix are approved; no Rules implementation has yet been formally recorded as implemented or verified.
- API contracts and the initial backend structure are implemented. The `createTask` operation is verified within the existing unit and Firestore-emulator test scope recorded below; its callable adapter/authentication remain implemented but unverified. No client feature implementation is formally recorded as implemented or verified.
- The minimum intended `firestore.indexes.json` composite-index set is approved; no index configuration has yet been formally recorded as implemented or verified.
- Repository architecture is approved as a single workspace/monorepo with `apps/api`, one responsive browser client at `apps/app`, `packages/api-contracts`, `packages/client-sdk`, `infrastructure/firebase`, shared `docs`, and repository-wide `tooling`. DEC-058 supersedes DEC-055's initial separate `apps/mobile`/`apps/web` split. The workspace skeleton and package boundaries are now implemented.
- The API-contract boundary is approved: `api-contracts` defines the client/API protocol, `client-sdk` implements the official client abstraction, and backend domain/business logic remains private to `apps/api`.
- pnpm is approved as the package/workspace manager. No Nx, Turborepo, or other build-orchestration layer is adopted initially; orchestration/caching remains deferred until justified.
- TypeScript, Node.js 22, and ESM are approved as the current language/runtime baseline.
- The browser client technology is approved as React + TypeScript + Vite, to be implemented as a responsive SPA with PWA capability. Full offline synchronization is not an MVP requirement; future native clients remain deferred until justified.
- Repository bootstrap is implemented with pnpm workspace configuration, strict shared TypeScript defaults, `@taskify/*` package naming, and explicit workspace dependencies. Lint/format remain unselected/unimplemented. Firebase Emulator tooling is implemented and verified for the existing backend integration suite; Rules and index configuration remain pending. Vitest is approved as the test runner baseline and the initial API unit suite has passed.
- The internal `apps/api` implementation structure is approved as feature-oriented business operations with thin Firebase deployment adapters and narrowly shared infrastructure.

## Open Questions

- Exact Nearby coarse-proximity distance bands/resolution/query implementation remains deferred to Firebase Architecture.
- Exact autosave-versus-unsaved-change warning behavior remains a detailed interaction-design decision.
- Search implementation details beyond the approved baseline (fuzzy/semantic search, stemming, ranking technology) remain deferred to Firebase Architecture.
- Todo field, lifecycle, and date semantics remain deferred.
- Attachment file-size/type limits remain an implementation/operational decision.

## Implementation Status

Repository/workspace bootstrap, API contracts, and the initial backend structure are implemented. The `createTask` vertical slice includes a callable adapter, authenticated canonical email extraction, Firestore transaction, active-category validation, canonical Task initialization, TaskDate normalization, and deterministic System Changes thread creation. Verification is limited to the executed suites below; the callable adapter/authentication are not covered. No client feature implementation is formally recorded as implemented or verified.

### Verification Evidence — 2026-10-07

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

**Verification limits**

- Integration tests invoke the backend operation directly using the Firebase Admin SDK. They do not exercise the callable transport, authentication/canonical-email extraction, or public error translation.
- Passing creation assertions confirm the resulting Task/thread state; the suite does not inject transaction failures or exercise concurrency/retry behavior to independently verify atomicity under failure.
- Broader malformed-input validation, missing-category rejection, timed-date persistence, and DST edge cases are not covered by these existing suites. Their behavior is not inferred to be Verified.
- Firestore Security Rules were neither implemented nor verified by this run. No Rules file is configured, and the emulator defaults to allowing reads/writes; Admin SDK integration tests do not verify Rules regardless.
- Firestore indexes and query plans were not verified. Deployment and client behavior were not verified.

## Known Issues / Technical Debt

None formally recorded yet.

## Next Actions

- Existing TaskDate unit and `createTask` Firestore integration verification is complete within the scope recorded above. Further coverage for callable authentication/transport, malformed inputs, and transaction failure/retry behavior remains a proposed follow-up requiring project-owner approval before repository changes.
- Firestore Rules and index configuration remain approved designs awaiting implementation/verification; implementation actions require project-owner authorization. Security Rules verification is a separate workstream using the approved Rules implementation/test matrix.

No subsequent material action is considered approved unless explicitly authorized by the project owner.
