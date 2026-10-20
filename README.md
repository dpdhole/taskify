# Taskify

Taskify is being redesigned as a lightweight, personal, single-user task manager with a query-first Inbox-style interface.

**Status:** Product and architecture specification migration in progress. The older Firebase implementation is preserved in Git history; the redesigned application has not been implemented or deployed.

## Documentation

- [Project status and current discussion baseline](docs/project_status.md) — canonical entry point, agreed direction and open decisions.
- [Working product specification](docs/product_spec.md) — consolidated simplified product behavior and explicitly open decisions.
- [Legacy product specification](docs/product_spec_legacy.md) — historical reference only; not requirements for the redesign.
- [Firebase Gate 1–4 findings](docs/feasibility/firebase-validation-results.md) — qualified local results, failures and unresolved feasibility blockers.
- [Latest verification assessment for decision](docs/feasibility/firebase-verification-assessment.md) — full query/workload results and the failing Saved View candidate.
- [Firebase experiments and evidence](verification/firebase/README.md) — isolated source, pinned dependencies, tests and reproduction guidance.

The approved PoC/beta direction is a responsive browser client using Firebase Spark Authentication (Google), browser-direct Firestore and static Hosting through provider-independent persistence interfaces. Local feasibility experiments have run; overall feasibility remains INCONCLUSIVE, and no redesigned application or cloud deployment is claimed. Product specification §§17–18 govern the current architecture.

## Historical implementation

Earlier Firebase/Firestore code, verified Category work, tests, architectural decisions (DEC-001–DEC-082) and verification evidence remain available in repository Git history. Removing them from the active tree does not delete deployed resources or imply migration.

The project owner alone approves material decisions and project-changing actions.
