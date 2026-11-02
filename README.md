# Taskify

Taskify is being redesigned as a lightweight, personal, single-user task manager with a query-first Inbox-style interface.

**Status:** Foundation implementation, local acceptance checks and the additional Hosting preview checkpoint are complete; closure documentation is committed and pushed. Slice2 compatibility is implemented and locally validated; its approved Firestore checkpoint passed. The clean committed Slice2 Hosting preview is published and verified; owner closure review remains. Slice3 is owner-accepted on 2 November 2026 and closure is prepared: Google and Microsoft personal-account login workflows were owner-verified on desktop/mobile; Microsoft work/school testing is deferred until product/features mature. Technical diagnostics remain during slice development. See the [closure record](docs/slices/03-provider-sign-in-closure.md). Slice4 identity-linking detailing is accepted; implementation is pending. Slice5 provisioning detailing is prepared for review, with approved catalogues and icons. Live promotion is deferred until development matures and requires explicit owner approval. Product features are not implemented or deployed. Overall platform feasibility remains INCONCLUSIVE; earlier Firebase implementation remains in Git history.

## Documentation

- [Project status and current discussion baseline](docs/project_status.md) — canonical entry point, agreed direction and open decisions.
- [Working product specification](docs/product_spec.md) — consolidated simplified product behavior and explicitly open decisions.
- [Architecture, stack and deployment strategy](docs/architecture.md) — agreed layers, stack boundaries, client/schema compatibility, release/rollback policies and remaining slice/validation work.
- [Implementation slice plan](docs/implementation_plan.md) — agreed small feature-focused sequence, onboarding Tasks and documentation/provisioning work per slice; not execution authorization.
- [Slice2 compatibility detailing](docs/slices/02-compatibility-gate.md) — accepted database contract, runtime gate, Rules/operator boundaries and acceptance matrix.
- [Hosting channels](docs/hosting_channels.md) — dev/QC/UAT roles, explicit destination requirements and promotion policy.
- [Slice2 preview](docs/slices/02-compatibility-preview.md) — historical compatibility preview evidence.
- [Current dev preview](docs/slices/03-provider-sign-in-preview.md) — clean Google/Microsoft Auth release and hosted verification.
- [Slice2 validation](docs/slices/02-compatibility-validation.md) — executed local/cloud checks, evidence and remaining release gates.
- [Slice3 provider sign-in detailing](docs/slices/03-provider-sign-in.md) — accepted Google/Microsoft session, gate, Logout and isolation baseline; Apple deferred; owner-accepted; closure prepared, work/school testing deferred.
- [Slice3 Auth/session](docs/slices/03-provider-sign-in-session.md) — restoration, compatibility integration, Logout and local/emulator evidence.
- [Slice3 configuration](docs/slices/03-provider-sign-in-configuration.md) — Web App/domains, client settings and provider callback verification steps.
- [Slice3 login presentation](docs/slices/03-provider-sign-in-presentation.md) — shared responsive sign-in, keyboard recovery and local browser evidence.
- [Slice3 real-provider acceptance](docs/slices/03-provider-sign-in-acceptance.md) — observed Google desktop checks, owner-verified Microsoft personal results and remaining gates.
- [Slice4 identity-linking detailing](docs/slices/04-identity-linking.md) — accepted Google/Microsoft linking, fresh reauthentication, collision recovery and outcome verification; implementation pending.
- [Slice5 workspace-provisioning detailing](docs/slices/05-workspace-provisioning.md) — approved catalogues/icons, default Views, safe initialization and recovery; concrete specification prepared for review, implementation pending.
- [Slice5A Delete Account detailing](docs/slices/05A-delete-account.md) — approved deletion scope and Option 3 operator-run trusted finalizer; concrete safety contracts require implementation validation.
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

The approved PoC/beta direction is a responsive browser client using Firebase Spark Authentication, browser-direct Firestore and static Hosting through provider-independent persistence interfaces. Google and Microsoft are the active Slice3 sign-in providers under the 23 October owner amendment; Apple authentication is deferred. Google and Microsoft personal-account workflows are owner-verified on desktop/mobile; work/school testing is deferred until features mature. Secure linking remains unimplemented. Local feasibility experiments and the Foundation Hosting preview checkpoint have run; overall feasibility remains INCONCLUSIVE. Foundation and the Slice2 compatibility gate are implemented; product features and live publication remain pending. Product specification §§17–21 govern the current architecture and UX.

The approved policy consolidation is recorded in product specification §22 and the architecture overview. TypeScript business logic is separated from UI and persistence for possible future server reuse; no server tier is approved. User-driven backup/recovery is **FUTURE**, not a PoC/beta prerequisite.

## Historical implementation

Earlier Firebase/Firestore code, verified Category work, tests, architectural decisions (DEC-001–DEC-082) and verification evidence remain available in repository Git history. Removing them from the active tree does not delete deployed resources or imply migration.

The project owner alone approves material decisions and project-changing actions.
