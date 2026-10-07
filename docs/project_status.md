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

- Architecture and product design are approved through **DEC-055**.
- The concrete Firestore Security Rules design and emulator test matrix are approved; no Rules implementation has yet been formally recorded as implemented or verified.
- No application implementation has been formally recorded as started, implemented, or verified.
- The minimum intended `firestore.indexes.json` composite-index set is approved; no index configuration has yet been formally recorded as implemented or verified.
- Repository architecture is approved as a single workspace/monorepo with `apps/api`, `apps/mobile`, `apps/web`, `packages/api-contracts`, `packages/client-sdk`, `infrastructure/firebase`, shared `docs`, and repository-wide `tooling`. No corresponding implementation directories/workspace configuration have yet been formally created.
- The API-contract boundary is approved: `api-contracts` defines the client/API protocol, `client-sdk` implements the official client abstraction, and backend domain/business logic remains private to `apps/api`.
- The next architecture task is workspace/tooling selection and repository bootstrap structure before internal backend module design.

## Open Questions

- Exact Nearby coarse-proximity distance bands/resolution/query implementation remains deferred to Firebase Architecture.
- Exact autosave-versus-unsaved-change warning behavior remains a detailed interaction-design decision.
- Search implementation details beyond the approved baseline (fuzzy/semantic search, stemming, ranking technology) remain deferred to Firebase Architecture.
- Todo field, lifecycle, and date semantics remain deferred.
- Attachment file-size/type limits remain an implementation/operational decision.

## Implementation Status

No implementation has been formally recorded as started, implemented, or verified.

## Known Issues / Technical Debt

None formally recorded yet.

## Next Actions

- Define workspace/tooling selection and repository bootstrap structure consistent with DEC-055. **Status:** Next design stage.
- After repository bootstrap architecture is frozen, return to internal `apps/api` implementation structure.
- Firestore Rules and index configuration remain approved designs awaiting implementation/verification.

No subsequent material action is considered approved unless explicitly authorized by the project owner.
