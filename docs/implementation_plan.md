# Taskify implementation slices

22 October 2026. **Owner-agreed order.** Slice1 Foundation was separately approved
for implementation and is now locally validated, pending owner review. Slices2–30
remain planned, not started. This plan is not blanket execution, commit or cloud
deployment authorization.

Authority: [product specification §§17–23](product_spec.md),
[architecture](architecture.md) and [project status](project_status.md).

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

Slice1 implementation and validation are **complete; closure is prepared for
owner review**. See its [closure review](slices/01-foundation.md#closure-review)
and [validation report](slices/01-foundation-validation.md). Other rows remain planned,
not started. Split broad rows further during detailing.

| Order | Slice | Deliverable |
|---:|---|---|
| 1 | Foundation | Select framework/build/store; establish TypeScript boundaries, emulator setup and reproducible local checks |
| 2 | Compatibility gate | Boot checks, blocking/retry states, resume/reconnect and contract-change handling |
| 3 | Provider sign-in | Google/Apple feasibility and sign-in, persistent authentication and Logout |
| 4 | Identity linking | Proof-based linking, account-resolution conflicts and cancellation |
| 5 | Workspace provisioning | Retryable initialization of defaults, protected All Tasks and initial Saved Views |
| 6 | Responsive navigation | Mobile drawer, desktop rail/sidebar and contextual navigation |
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
- Validate Google/Apple feasibility early in slice 3, rather than deferring it to
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
  semantics are not silently resolved by listing it in the plan.
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

## Next checkpoint

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
[closure documentation](slices/01-foundation.md#closure-review) is prepared for
staging and owner review. No additional commit or Slice2 implementation is implied.
Live promotion is deferred until development matures and requires explicit owner
approval; it is not a Foundation closure blocker. Next planned work is detailing
Slice2 — Compatibility gate. GitHub push and ongoing advisory reassessment remain
separate follow-ups.
Overall platform feasibility remains INCONCLUSIVE. Foundation tests are local
proof evidence only; cloud cleanup has occurred, but no new product backend
provisioning or live Hosting publication has occurred. The preview checkpoint
validates static delivery/deployment only.
