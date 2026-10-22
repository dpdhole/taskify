# Taskify

Taskify is being redesigned as a lightweight, personal, single-user task manager with a query-first Inbox-style interface.

**Status:** Foundation static skeleton and isolated architecture proof are implemented and locally validated, pending review. Product features are not implemented or deployed. Overall platform feasibility remains INCONCLUSIVE; earlier Firebase implementation remains in Git history.

## Documentation

- [Project status and current discussion baseline](docs/project_status.md) — canonical entry point, agreed direction and open decisions.
- [Working product specification](docs/product_spec.md) — consolidated simplified product behavior and explicitly open decisions.
- [Architecture, stack and deployment strategy](docs/architecture.md) — agreed layers, stack boundaries, client/schema compatibility, release/rollback policies and remaining slice/validation work.
- [Implementation slice plan](docs/implementation_plan.md) — agreed small feature-focused sequence, onboarding Tasks and documentation/provisioning work per slice; not execution authorization.
- [Developer setup](docs/development.md) — pinned toolchain, local commands, architecture boundaries and troubleshooting.
- [Foundation validation](docs/slices/01-foundation-validation.md) — executed local checks, exact evidence and limitations.
- [Completed Foundation readiness check](docs/slices/readiness-check.md) — pre-implementation findings and candidate dependency evidence; historical inputs for the implemented Foundation slice.
- [Legacy product specification](docs/product_spec_legacy.md) — historical reference only; not requirements for the redesign.
- [Firebase Gate 1–4 findings](docs/feasibility/firebase-validation-results.md) — qualified local results, failures and unresolved feasibility blockers.
- [Latest verification assessment for decision](docs/feasibility/firebase-verification-assessment.md) — query/workload findings and the passing client query/compatibility follow-on.
- [Firebase experiments and evidence](verification/firebase/README.md) — isolated source, pinned dependencies, tests and reproduction guidance.

The approved PoC/beta direction is a responsive browser client using Firebase Spark Authentication, browser-direct Firestore and static Hosting through provider-independent persistence interfaces. Google and Apple sign-in intent is recorded in §21.5; provider feasibility and secure linking remain unverified. Local feasibility experiments have run; overall feasibility remains INCONCLUSIVE, and only the Foundation proof is implemented; no product feature or cloud deployment is claimed. Product specification §§17–21 govern the current architecture and UX.

The approved policy consolidation is recorded in product specification §22 and the architecture overview. TypeScript business logic is separated from UI and persistence for possible future server reuse; no server tier is approved. User-driven backup/recovery is **FUTURE**, not a PoC/beta prerequisite.

## Historical implementation

Earlier Firebase/Firestore code, verified Category work, tests, architectural decisions (DEC-001–DEC-082) and verification evidence remain available in repository Git history. Removing them from the active tree does not delete deployed resources or imply migration.

The project owner alone approves material decisions and project-changing actions.
