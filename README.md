# Taskify

Taskify is being redesigned as a lightweight, personal, single-user task manager with a query-first Inbox-style interface.

**Status (5 November 2026):** Slice 5 workspace provisioning is implemented and
published to [dev](https://taskify-dev-dpdhole--dev-por3atkf.web.app/) as app **0.2.0**,
from clean pushed commit `02458ff`. Initialization Rules and compatibility contract
revision 2/server release 2 are published; older clients are intentionally blocked.
Hosted artifact/gate checks pass. The owner verified sign-in → Workspace ready →
refresh → Logout on mobile and desktop after removing previous Firebase Auth
identities. **Slice 5 is owner-accepted and closed.** See the
[closure record](docs/slices/05-workspace-provisioning-closure.md) and
[deployment report](docs/slices/05-workspace-provisioning-preview.md).

Slices 1–2 are implemented; Slice 3 Google/Microsoft personal-account workflows
were owner-accepted on 2 November. Microsoft work/school testing remains deferred.
**Slice 4 remains open, on hold and unaccepted** for its verification/linking issue;
provisioning uses a single-provider session and does not depend on linking.
Slice 5 local/affected-boundary testing was authorized and passed; it does not
constitute full Slice 4 acceptance. See the [hold/handoff](docs/slices/04-identity-linking-hold.md).

Slice 5A readiness review is complete; the owner accepted the implementation
preparation contracts and fresh registration after Auth removal while the old
UID remains fenced. [Technical contract DA1](docs/slices/05A-delete-account-contract.md)
defines the implementation target. The [first local checkpoint](docs/slices/05A-delete-account-domain.md)
implements strict domain/inventory validation and Rules admission. The
[operator checkpoint](docs/slices/05A-delete-account-operator.md) adds discovery,
leases and cleanup. [Auth finalization](docs/slices/05A-delete-account-auth-finalization.md)
now reaches awaiting_retirement with explicit reconciliation and a retained fence;
proof/adapters and UI remain. Complete T1–T8 before Slice 6 navigation. See the
[preparation checkpoint](docs/slices/05A-delete-account.md#accepted-implementation-preparation--5-november-2026).
Later accepted slice designs remain implementation work. Task workflows are not
yet implemented or deployed. Live promotion still requires explicit owner approval.
Overall platform feasibility remains INCONCLUSIVE; diagnostics remain during development.

## Documentation

- [Project status and current discussion baseline](docs/project_status.md) — canonical entry point, agreed direction and open decisions.
- [Working product specification](docs/product_spec.md) — consolidated simplified product behavior and explicitly open decisions.
- [Architecture, stack and deployment strategy](docs/architecture.md) — agreed layers, stack boundaries, client/schema compatibility, release/rollback policies and remaining slice/validation work.
- [Implementation slice plan](docs/implementation_plan.md) — agreed small feature-focused sequence, onboarding Tasks and documentation/provisioning work per slice; not execution authorization.
- [Slice2 compatibility detailing](docs/slices/02-compatibility-gate.md) — accepted database contract, runtime gate, Rules/operator boundaries and acceptance matrix.
- [Hosting channels](docs/hosting_channels.md) — dev/QC/UAT roles, explicit destination requirements and promotion policy.
- [Slice2 preview](docs/slices/02-compatibility-preview.md) — historical compatibility preview evidence.
- [Current dev preview](docs/slices/05-workspace-provisioning-preview.md) — clean Slice 5 provisioning release, compatibility floor and hosted checks.
- [Slice2 validation](docs/slices/02-compatibility-validation.md) — executed local/cloud checks, evidence and remaining release gates.
- [Slice3 provider sign-in detailing](docs/slices/03-provider-sign-in.md) — accepted Google/Microsoft session, gate, Logout and isolation baseline; Apple deferred; owner-accepted; closure prepared, work/school testing deferred.
- [Slice3 Auth/session](docs/slices/03-provider-sign-in-session.md) — restoration, compatibility integration, Logout and local/emulator evidence.
- [Slice3 configuration](docs/slices/03-provider-sign-in-configuration.md) — Web App/domains, client settings and provider callback verification steps.
- [Slice3 login presentation](docs/slices/03-provider-sign-in-presentation.md) — shared responsive sign-in, keyboard recovery and local browser evidence.
- [Slice3 real-provider acceptance](docs/slices/03-provider-sign-in-acceptance.md) — observed Google desktop checks, owner-verified Microsoft personal results and remaining gates.
- [Slice4 identity-linking detailing](docs/slices/04-identity-linking.md) — accepted Google/Microsoft linking; provider status and popup/redirect current-account verification and explicit linking implemented locally; linking validation is unit-only, with full regression held.
- [Slice5 workspace-provisioning detailing](docs/slices/05-workspace-provisioning.md) — approved catalogues/icons, default Views, safe initialization and recovery; implemented and deployed to dev as 0.2.0; owner-accepted and closed.
- [Slice5A Delete Account detailing](docs/slices/05A-delete-account.md) — approved deletion scope and Option 3 operator-run trusted finalizer; concrete safety contracts require implementation validation.
- [Slice6 responsive-navigation detailing](docs/slices/06-responsive-navigation.md) — accepted mobile drawer, desktop rail/sidebar, contextual routing, accessibility and feature-availability boundaries; implementation pending.
- [Slice7 Quick Create/basic list detailing](docs/slices/07-quick-create-basic-list.md) — accepted Draft capture, Title validation, cloud-confirmed recovery and minimal Category-grouped All Tasks; implementation pending.
- [Slice8 Task Detail/metadata detailing](docs/slices/08-task-detail-metadata.md) — accepted explicit editors, tri-state preferences, plain-text GFM editing/rendering, Refresh/Stay conflict recovery and Back protection; implementation pending.
- [Slice8A Advanced Create detailing](docs/slices/08A-advanced-create.md) — accepted one-way More Details expansion, optional metadata/GFM source, atomic creation and recovery; implementation pending.
- [Slice9 onboarding Tasks/manual detailing](docs/slices/09-onboarding-tasks-manual.md) — N1–N8 accepted with blocking provisioning and link amendments; revised G1–G8 accepted, implementation pending.
- [Developer setup](docs/development.md) — pinned toolchain, local commands, architecture boundaries and troubleshooting.
- [Foundation validation](docs/slices/01-foundation-validation.md) — executed local checks, exact evidence and limitations.
- [Firebase clean start](docs/slices/firebase-clean-start.md) — completed legacy application-resource reset and verified empty baseline.
- [Hosting deployment results](docs/slices/hosting-deployment.md) — verified HTTPS preview, mobile/desktop checks, update/restoration and final resource evidence.
- [Hosting deployment plan](docs/hosting_deployment_plan.md) — Hosting-only checkpoint using the verified PoC project after the owner-authorized clean start; preview published, verified and restored after rehearsal.
- [Completed Foundation readiness check](docs/slices/readiness-check.md) — pre-implementation findings and candidate dependency evidence; historical inputs for the implemented Foundation slice.
- [Legacy product specification](docs/product_spec_legacy.md) — historical reference only; not requirements for the redesign.
- [Firebase Gate 1–4 findings](docs/feasibility/firebase-validation-results.md) — qualified local results, failures and unresolved feasibility blockers.
- [Latest verification assessment for decision](docs/feasibility/firebase-verification-assessment.md) — query/workload findings and the passing client query/compatibility follow-on.
- [Firebase experiments and evidence](verification/firebase/README.md) — isolated source, pinned dependencies, tests and reproduction guidance.

The approved PoC/beta direction is a responsive browser client using Firebase Spark Authentication, browser-direct Firestore and static Hosting through provider-independent persistence interfaces. Google and Microsoft are the active Slice3 sign-in providers under the 23 October owner amendment; Apple authentication is deferred. Google and Microsoft personal-account workflows are owner-verified on desktop/mobile; work/school testing is deferred until features mature. Secure linking is implemented locally but remains unaccepted and on hold with an unresolved verification defect. Local feasibility experiments and the Foundation Hosting preview checkpoint have run; overall feasibility remains INCONCLUSIVE. Foundation and the Slice2 compatibility gate are implemented; product features and live publication remain pending. Product specification §§17–21 govern the current architecture and UX.

The approved policy consolidation is recorded in product specification §22 and the architecture overview. TypeScript business logic is separated from UI and persistence for possible future server reuse; no server tier is approved. User-driven backup/recovery is **FUTURE**, not a PoC/beta prerequisite.

## Historical implementation

Earlier Firebase/Firestore code, verified Category work, tests, architectural decisions (DEC-001–DEC-082) and verification evidence remain available in repository Git history. Removing them from the active tree does not delete deployed resources or imply migration.

The project owner alone approves material decisions and project-changing actions.
