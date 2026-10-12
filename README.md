# Taskify

Taskify is being redesigned as a lightweight, personal, single-user task manager with a query-first Inbox-style interface.

**Status:** Product and architecture specification migration in progress. The older Firebase implementation is preserved in Git history; the redesigned application has not been implemented or deployed.

## Documentation

- [Project status and current discussion baseline](docs/project_status.md) — canonical entry point, agreed direction and open decisions.
- [Working product specification](docs/product_spec.md) — consolidated simplified product behavior and explicitly open decisions.
- [Legacy product specification](docs/product_spec_legacy.md) — historical reference only; not requirements for the redesign.

The revision considers a responsive browser client, Appwrite Auth/DocumentsDB and a Taskify data-access adapter. These details must be reconciled into approved, implementable specifications before development resumes.

## Historical implementation

Earlier Firebase/Firestore code, verified Category work, tests, architectural decisions (DEC-001–DEC-082) and verification evidence remain available in repository Git history. Removing them from the active tree does not delete deployed resources or imply migration.

The project owner alone approves material decisions and project-changing actions.
