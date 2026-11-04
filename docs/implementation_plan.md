# Taskify implementation slices

2 November 2026. **Owner-agreed order.** Slice1 implementation/validation and
closure documentation are committed and pushed. Slice2 implementation and preview are committed. Slice3 configuration, Auth/session
and Google/Microsoft flows are owner-accepted on 2 November 2026; closure is prepared. Google and Microsoft personal-account workflows were owner-verified on desktop/mobile; work/school testing is deferred until features mature. See the [closure record](slices/03-provider-sign-in-closure.md). Slice4 implementation is authorized; provider status and popup/redirect current-account verification are implemented locally, with explicit linking now implemented under a unit-only testing instruction; full regression and hosted acceptance remain held. Slice5 provisioning detailing is prepared for review; implementation remains pending. Early Delete Account is inserted as Slice5A before Slice6; Slice6 responsive-navigation detailing is accepted; implementation remains pending. Slices6–30 retain their identifiers. This plan is not blanket execution, commit or cloud deployment authority.

Authority: [product specification §§17–23](product_spec.md),
[architecture](architecture.md) and [project status](project_status.md).

## Current sequencing decision — 2 November 2026

**Slice 4 is open and on hold, not accepted or closed.** The owner deferred the
unresolved local verification-cancellation defect and directed development to
**Slice 5 — Workspace provisioning**. This supersedes the intervening close/commit
request and the earlier sequential dependency on completing linking. Single-provider
Auth suffices for provisioning; no identity/integrity safeguards are relaxed.
See [hold and handoff](slices/04-identity-linking-hold.md). Full-slice/regression
checks remain held; primary-flow isolation is not claimed as tested. Older progress
paragraphs above/below describe historical implementation checkpoints.

Next checkpoints: resolve provisioning record/version contracts and bounded stages;
implement the approved seed catalogues and pure codecs; add persistence/Rules and
initialization orchestration; then the Loading/recovery/ready presentation. Deferred
validation must be explicitly resumed before acceptance or publication claims.

## Slice5 contract progress — 4 November 2026

Ownership/version axes, core fields, per-record numeric ordering, initial query
structure, grouped-field filtering and date buckets are agreed. Separate ordering
documents/family are superseded. See the
[remaining decision register](slices/05-workspace-provisioning.md#remaining-gaps-and-decision-register--4-november-2026)
for open query operators/date edges, exact serialized schemas, name uniqueness,
bounded stages, deletion fence and compatibility rollout. These are contract and
verification gates, not all new product decisions. Production implementation has not begun; Slice4 remains on hold. Subsequent
owner authorization permitted the readiness checks recorded below.

## Slice5 local readiness evidence — 4 November 2026

[Readiness report](slices/05-workspace-provisioning-readiness.md),
[machine evidence](slices/05-workspace-provisioning-readiness-evidence.json) and
[execution log](slices/05-workspace-provisioning-readiness.log) record81 focused unit,
7 existing emulator integration and4 compatibility browser passes, plus type/static
checks and ordinary/compatibility builds. Owner authorized relevant local checks;
older held-test statements describe earlier checkpoints. Slice4 remains held.

Start implementation with exhaustive schemas and Rules/stage feasibility; this is
not Slice5 provisioning acceptance. Candidate family checks demonstrate that an
expanded contract alone does not retire an old client; set deliberate app bounds
and verify rollout/rollback before publication. Schema limits, stage/finalization
proof, fence/runtime integration and new feature verification remain pending in the
[current register](slices/05-workspace-provisioning.md#remaining-gaps-and-decision-register--4-november-2026).

## Delivery approach

**Keep slices small and feature-focused.** Except for the enabling foundation,
deliver narrow end-to-end behavior across the relevant UI, application/domain,
persistence, Rules and tests. Do not build the entire data layer before usable
features. Limited feature scope never permits weakened integrity guarantees.

For each slice: **detail and agree → implement end to end → validate integrity
and browser behavior → benchmark relevant costs → review acceptance → commit when
authorized.** Slice planning is not blanket permission to execute or commit.

Each slice includes applicable responsive/accessibility behavior, compatibility,
runtime validation, conflict/recovery handling, diagnostics, user documentation
and provisioning-template updates. Check existing regressions where affected.
Tools, physical schemas, exact screens and thresholds are detailed in slices;
material domain/security changes return to owner discussion.

## Agreed sequence

Slice1 implementation and validation are **complete**; closure documentation was
committed/pushed as `f2eaf82`. See its [closure review](slices/01-foundation.md#closure-review)
and [validation report](slices/01-foundation-validation.md).
[Slice2 detailing](slices/02-compatibility-gate.md) is accepted, with
implementation/local validation and the approved Firestore checkpoint complete; implementation committed as `67e170e` and clean-source Hosting preview verified; owner closure review pending. [Slice3 detailing](slices/03-provider-sign-in.md) is accepted; implementation is authorized; [configuration](slices/03-provider-sign-in-configuration.md) and [Auth/session](slices/03-provider-sign-in-session.md) steps are implemented. Provider callbacks/account types are visually verified; [Google flow](slices/03-provider-sign-in-google.md) is implemented locally; [Microsoft flow](slices/03-provider-sign-in-microsoft.md) is implemented locally; the [current login presentation](slices/03-provider-sign-in-presentation.md) and Slice3 are owner-accepted. Google and Microsoft personal-account workflows are owner-verified on desktop/mobile; work/school testing is deferred until features mature, with technical diagnostics retained. [Slice4 detailing](slices/04-identity-linking.md) is accepted; implementation is authorized and [read-only provider status](slices/04-identity-linking-status.md) is implemented locally; popup current-account verification is implemented locally; [isolated redirect proof](slices/04-identity-linking-redirect.md) is implemented locally, and [explicit linking](slices/04-identity-linking-implementation.md) is implemented locally with unit-only validation; full-slice/regression testing remains held by owner. Other rows remain planned. Split
broad rows further during detailing.

| Order | Slice | Deliverable |
|---:|---|---|
| 1 | Foundation | Select framework/build/store; establish TypeScript boundaries, emulator setup and reproducible local checks |
| 2 | Compatibility gate | Boot checks, blocking/retry states, resume/reconnect and contract-change handling |
| 3 | [Provider sign-in](slices/03-provider-sign-in.md) | Google/Microsoft feasibility and sign-in, persistent authentication and Logout |
| 4 | [Identity linking](slices/04-identity-linking.md) | Proof-based linking, account-resolution conflicts and cancellation |
| 5 | [Workspace provisioning](slices/05-workspace-provisioning.md) | Retryable initialization of profile/settings, approved Categories/Locations, protected All Tasks and initial Saved Views |
| 5A | [Delete Account](slices/05A-delete-account.md) | Approved deletion scope; Option 3 operator-run trusted finalizer with temporary fencing |
| 6 | [Responsive navigation](slices/06-responsive-navigation.md) | Mobile drawer, desktop rail/sidebar and contextual navigation |
| 7 | Quick Create and basic list | Create a Draft Task and show it in a minimal All Tasks workspace |
| 8 | Task Detail and metadata editing | Title, Reference, classification/preferences, description, Back restoration and conflict choices |
| 9 | Three onboarding Tasks | Initialize Learn usage, Explore settings and Find Documentation; establish evolving templates and initial manual pages |
| 10 | Complete query engine | All supported predicates, grouping, sorting and date semantics over complete metadata |
| 11 | Query workspace controls | Filter/group/sort editing, counts, collapsed groups and responsive rows |
| 12 | Full-query persistence | Save, Save As, Reset, protected All Tasks and safe schema handling |
| 13 | Search | Explicit-submit metadata phrase search and navigation-state restoration |
| 14 | Saved View management | Rename, Dashboard inclusion, delete, reorder and Save Order |
| 15 | Start and scheduling | Start, Schedule, Reschedule, date entry and required Activity Events |
| 16 | Pause and resume | Pause/Edit Pause/Resume, conflict choices and lifecycle effects |
| 17 | Close and reopen | Done, failure closure, warnings, Reopen and history |
| 18 | Todo checklist | CRUD/order, close/reopen effects; add the Learn usage onboarding checklist |
| 19 | Discussion | Post, load more, permitted edit/delete and lifecycle effects |
| 20 | External links | Discussion-owned and independent Task links; enrich Find Documentation |
| 21 | Activity viewer | Readable immutable event history and incremental loading |
| 22 | Dashboard View charts | Responsive chart grid, legends and group drill-down |
| 23 | Burn-rate chart | Global New/Closed calculations, period controls and remembered selection |
| 24 | Category management | Create/edit/archive/order and dependency handling |
| 25 | Location management | Create/edit/archive/order and dependency handling |
| 26 | Preferences and account presentation | Agreed preference fields and profile/provider presentation; unresolved account actions detailed separately |
| 27 | Trash and Restore | Soft deletion, read-only behavior and safe restoration |
| 28 | Closed cleanup | Account-wide eligibility preview and confirmed movement to Trash |
| 29 | Permanent cleanup | Recoverable purge, interruption, progress, partial failure and manual continuation |
| 30 | Beta release integration | Integrated browser/live validation, retained-volume benchmarks and compatible release/rollback rehearsal |

Complete query persistence precedes richer work content/charts to validate the
product differentiator early. Foundation decisions must be tested against a small
architecture proof, not extensive speculative infrastructure.

## Dependency and scope boundaries

- Slice 2 can establish the gate using local authenticated fixtures. Slice 3
  integrates actual authentication; slice 5 routes provisioning through the gate.
  Do not claim real browser/provider readiness from an early fixture check.
- Validate Google/Microsoft feasibility early in slice 3, rather than deferring it to
  final release. Live configuration/testing needs separate authorization. Discovery
  of an unavailable/cost-incompatible provider returns to the owner, not silent omission.
- Provision View definitions in slice 5 without claiming the full query editor or
  persistence workflow before slices 10–14. Slice 7 is an explicitly limited list;
  complete query behavior remains due in the subsequent slices.
- Introduce only the record fields/contracts needed by each slice. Activity event
  recording accompanies each audited operation; slice 21 adds the viewer, not the
  underlying integrity. Design ownership/deletion consistency when entities appear,
  rather than postponing schema safety until slice 29.
- Lifecycle slices must account for their shared invariants: scheduling's pause
  options and pause/start conflicts cannot be implemented with altered semantics.
  Detail common contracts first; expose only complete, valid interactions and
  finish cross-slice integration as dependent actions become available.
- Todo warnings and Discussion/link lifecycle effects are added to the established
  lifecycle implementation as those entities become available. Keep closure and
  concurrency regressions current rather than claiming earlier slice acceptance
  proves interactions with entities not yet implemented.
- Basic Task classification uses provisioned defaults/existing records before
  management screens. Slice 26 adds preference/account forms, not foundational
  identity, version contracts or Logout already needed earlier. Delete Account
  is now an approved early Slice5A checkpoint; its deletion/recovery contract
  requires separate detailing rather than waiting for Slice26.
- Dashboard/settings destinations may be progressively introduced; early shell
  work does not imply completed screens. Navigation must not promise unavailable
  functionality as usable.
- Slice 30 integrates existing evidence and rehearses release; it is not a bucket
  for postponed correctness. Exact projects, regions, domains, operator procedures
  and deployment authorization remain separate decisions.
- Provider access, metadata editing and permanent cleanup especially may need
  smaller sub-slices after detailing. Keep the agreed feature order unless a
  dependency change is discussed; do not expand scope merely to fill a slice.

## Onboarding Tasks and user documentation

Provision three ordinary user-owned Tasks once during account initialization,
demonstrating lean versus detailed Taskify usage:

| Task | Intended content | Introduction / enrichment |
|---|---|---|
| Learn usage | Full description with related Todo/checklist items; instructions explain how to complete it | Description in slice 9; checklist in slice 18; teaching content evolves with available features |
| Explore settings | Medium description, no Todos | Slice 9; describe only available settings, enriching as management/forms arrive |
| Find Documentation | Short description and relevant manual links | Slice 9 with usable documentation URL in description; dedicated Task-associated links in slice 20 |

These are ordinary editable Draft Tasks, unpaused, without imposed due dates,
using applicable defaults. They participate in normal View/Dashboard counts and
normal edit, lifecycle, delete/restore behavior. Checklist completion is manual,
not an automatic cross-feature progress-tracking system. Explain ordinary Todo
lifecycle effects in the learning content. Todo titles remain checklist labels;
detailed instructions belong in the parent description, not a new Todo-description field.

Provisioning is idempotent per starter Task and safely completes interrupted
initialization without duplication. Templates evolve with releases for new
provisioning; never overwrite existing user descriptions, reset completed items
or recreate intentionally deleted starter Tasks. Existing accounts do not receive
automatic content backfills merely because templates change. Exact initialization
markers/template-version handling belong to slices 5/9.

Slice 5 provides provisioning infrastructure; slice 9 introduces the three Tasks
for newly initialized workspaces. During incremental development, checklist/link
structures are introduced with their implementing slices rather than blocking
initialization on the whole application. The three final content forms remain the
target; partial development content must not teach unavailable functionality.

**Documentation is an implementation deliverable:** every feature slice updates
the corresponding user-manual guidance and applicable provisioning templates.
Use real, working links; no fabricated or placeholder manual URLs. Initial guide
pages, publication route/hosting and link handling must be detailed by slice 9.
Publishing documentation externally still needs the relevant authorization.
Manual pages grow with implemented features rather than describing the roadmap
as currently usable behavior. No manual site or publication tool is selected here.

User-driven backup/recovery remains **FUTURE**, outside PoC/beta prerequisites.
This plan does not add it to slice 26 or 30 by implication.

## Historical infrastructure checkpoint

The dated checkpoint and Slice3 amendment below retain their original scope.
Slice4 identity-linking detailing is now accepted; implementation awaits authorization, following
[Slice3 acceptance](slices/03-provider-sign-in-closure.md). Work/school testing is
deferred until product/features mature; no next-slice implementation is authorized
by closure preparation.

The owner also requested a separate [Hosting-only deployment plan](hosting_deployment_plan.md)
for project `taskify-dev-dpdhole` (`243252492098`). The owner authorized step-by-step
implementation, then a [clean start](slices/firebase-clean-start.md): legacy application
resources are removed. The default site now has a verified expiring preview,
tested update and exact original-artifact restoration, built from clean commit
`70fbe98`; see [results](slices/hosting-deployment.md). Live remains empty. This
infrastructure checkpoint does not reorder product slices or validate product
Auth/Firestore behavior.

Readiness, scope/stack, implementation and local validation are complete; the
additional Hosting preview/update/restoration checkpoint passed. Foundation
[closure documentation](slices/01-foundation.md#closure-review) was committed and
pushed as `f2eaf82`. [Slice2 detailing](slices/02-compatibility-gate.md) was accepted
on 23 October 2026, with database policy authority and optional secondary Hosting
use. The owner authorized staging for commit preparation; commit, implementation
and cloud provisioning await their applicable instructions.
Live promotion is deferred until development matures and requires explicit owner
approval; it is not a Foundation closure blocker. Next checkpoint is committing the accepted Slice2 documentation when instructed,
then explicit implementation authorization. GitHub push
succeeded for Foundation; ongoing dependency advisory reassessment remains required.
Overall platform feasibility remains INCONCLUSIVE. Foundation tests are local
proof evidence only; cloud cleanup has occurred, but no new product backend
provisioning or live Hosting publication has occurred. The preview checkpoint
validates static delivery/deployment only.


## Slice 3 detailing checkpoint — 23 October 2026

The owner accepted [provider sign-in detailing](slices/03-provider-sign-in.md) and
authorized documentation in the separate `taskify-slice3` checkout, based on
`f264868`. It covers Google/Microsoft feasibility, persistent sessions, gate integration,
Logout and account isolation. Linking remains Slice 4; provisioning remains Slice 5.
The sibling checkout's uncommitted Slice 2 source is not included or accepted by
this checkpoint. Integrate against reviewed, validated Slice 2 behavior. No provider
feasibility or implementation success is claimed. Implementation, live setup,
staging, commit, push and deployment await their applicable authorization.


## Slice 3 provider amendment — 23 October 2026

Owner added Microsoft and deferred Apple authentication. Google and Microsoft
are the active Slice 3 providers; Apple feasibility/implementation/validation are
deferred and do not block Slice 3 acceptance. See the [updated detailing](slices/03-provider-sign-in.md).
Implementation remains authorized; actual provider feasibility and validation
remain outstanding. Current session checkout: `taskify-slice-detailing`.


## Slice 4 detailing checkpoint — 2 November 2026

Owner accepted [identity-linking detailing](slices/04-identity-linking.md): Google/
Microsoft linking preserves UID and requires fresh current-account reauthentication
and additional-provider proof. Collision recovery restarts provider proof; uncertain
submissions are verified before retry. No unlinking, duplicate-account merging or
provisioning is included. Apple remains deferred. Slice3 acceptance is recorded in its closure document. Linking-specific provider
evidence and integration validation remain outstanding; Microsoft work/school
testing remains deferred until features mature. Owner subsequently authorized documentation updates and staging for review in
`taskify-slice-detailing`. Documentation only; no implementation, commit, push,
cloud setup or deployment is performed by this checkpoint.


## Slice 5 detailing checkpoint — 2 November 2026

Owner approved the provisioning scope/recovery recommendations, amended the legacy
Category catalogue and supplied ten Locations. Categories are alphabetical with
Uncategorized last; Locations alphabetical with synthetic default Unspecified last.
Material Symbols Rounded mappings include wallet for Finance, home_and_garden for
Household and heart_plus for Wellness. Other proposed mappings are approved.
[Slice5 detailing](slices/05-workspace-provisioning.md) records the catalogues,
Views, profile/settings, initialization safety and acceptance matrix for review.
Blocking Loading/progress and first-access guidance accompany safe concurrent
initialization. No starter Tasks or automatic onboarding backfill are added.
User-facing Delete Account is approved for separate Slice5A immediately after
Slice5, preserving existing numbered references. No implementation, staging,
commit, push, cloud operation or deployment is performed by this documentation.


## Slice 5A detailing checkpoint — 2 November 2026

Owner approved user-facing Delete Account scope and requested documentation/conflict
evaluation. [Detailing](slices/05A-delete-account.md) records confirmation, fresh
proof, fenced staged cleanup, Auth deletion last and recoverable interruption.
Browser-only finalization, stale-session protection, marker retention and trusted
enforcement remain unresolved. No backend, retained-marker policy or account
deletion is authorized; implementation readiness is not established. Align Slice5
control-record design before implementing either deletion admission or finalization.

Owner subsequently approved this conflict evaluation and authorized completing
Slice5A documentation and staging for review. State/recovery and enforcement
contracts are documented. Alternative finalizer/retention choices remain open;
no implementation, commit, push or cloud/deletion action is performed.


### Slice5A finalizer choice — 2 November 2026

Owner selected **Option 3: manual trusted finalizer**. Browser submits confirmed
intent and displays status; an explicitly invoked local administrative script
verifies/cleans owned data, deletes Auth last and safely retires the temporary
fence. Completion depends on operator action; no hosted backend, automatic
scheduler, permanent tombstone or automatic TTL is selected. This supersedes the
unresolved architecture alternatives above. Exact safety interval/Rules/control
contracts require validation. Documentation remains staged for review; no script
execution, account deletion, commit or push is performed.


## Slice 6 detailing checkpoint — 2 November 2026

Owner accepted [responsive-navigation detailing](slices/06-responsive-navigation.md)
and all twelve recommendations. Mobile drawer below 960 CSS px; desktop/tablet
rail/sidebar at or above it. Per-tab/account sidebar retention, explicit keyboard/
touch access, overlay focus/scroll handling and truthful feature availability are
agreed. Home/Views are shells until their feature slices; unavailable management
entries are non-actionable and Search/Create controls arrive with implementation.
Shared routing/guard boundaries do not implement future forms or query execution.
Slice5/5A and other relevant implemented dependencies must supply real validated
workspace/account state. Documentation only; no executable edits, tests, staging,
commit, push, cloud operation or deployment.


## Slice5 integration amendment — 2 November 2026

After updating this checkout to origin/main at d013515, owner authorized the
[Slice5 integration amendment](slices/05-workspace-provisioning.md#integration-amendment--main-baseline-d013515-2-november-2026).
Use single-provider session admission independently of held linking/provider-status
work. Wire account-state cleanup, optional profile-photo capture and the shared
workspace runtime; reconcile stages across gate/session changes. Catalogue/default
scope is unchanged. Required integration evidence must respect the existing
Slice4 testing hold until applicable authorization. No code, tests, staging,
commit, push, cloud action or deployment is performed by this documentation update.
