# Taskify implementation slices

4 November 2026. **Owner-agreed order.** Slice1 implementation/validation and
closure documentation are committed and pushed. Slice2 implementation and preview are committed. Slice3 configuration, Auth/session
and Google/Microsoft flows are owner-accepted on 2 November 2026; closure is prepared. Google and Microsoft personal-account workflows were owner-verified on desktop/mobile; work/school testing is deferred until features mature. See the [closure record](slices/03-provider-sign-in-closure.md). Slice4 implementation is authorized; provider status and popup/redirect current-account verification are implemented locally, with explicit linking now implemented under a unit-only testing instruction; full regression and hosted acceptance remain held. Slice5 provisioning detailing is prepared for review; implementation remains pending. Early Delete Account is inserted as Slice5A before Slice6; Slice6 responsive-navigation detailing is accepted; implementation remains pending. Slice7 detailing/gap resolutions are accepted and Slice8A Advanced Create is inserted after Slice8/before Slice9. Existing slice identifiers remain stable. This plan is not blanket execution, commit or cloud deployment authority.

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
| 7 | [Quick Create and basic list](slices/07-quick-create-basic-list.md) | Create a Draft Task and show it in a minimal All Tasks workspace |
| 8 | [Task Detail and metadata editing](slices/08-task-detail-metadata.md) | Title, Reference, classification/preferences, description, Back restoration and conflict choices |
| 8A | [Advanced Create](slices/08A-advanced-create.md) | One-way More Details expansion with retained draft; optional Reference/preferences/GFM, atomic root/detail creation |
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


## Slice7 detailing accepted — 4 November 2026

Owner approved [Quick Create/basic list detailing](slices/07-quick-create-basic-list.md)
and all twelve recommendations. Title is trimmed, nonblank, single-line, maximum
255 Unicode code points; duplicate titles allowed. Create a Draft/unpaused Task
with Uncategorized/absent Location defaults, both Important/Urgent Unset and no
planning/actual/deletion dates. Created is cloud-confirmed; no creation Activity
Event. Omit More until Advanced Create is fully implemented. Category-grouped
All Tasks uses Due ascending, missing last, then Title/ID tie-breaking and complete
eligible metadata. Preserve operation identity across unknown acknowledgement;
Show Task expands the new Task's Category group. Extend Rules/schema compatibility
and Slice5A inventory with Tasks. Slice4 remains held. No implementation, tests,
staging, commit, push or cloud actions are performed by documentation.


### Slice7 gap review — 4 November 2026

[Gap register](slices/07-quick-create-basic-list.md#gap-review--4-november-2026)
clarifies confirmed-only list state, creation/listener races, recovery across new
session admission, archived classifications and route preservation. Remaining
contracts include Unicode/collation, absent-field query completeness, operation
retention, commit-time fence races and concrete persistence/deletion integration.
Allocate Advanced Create explicitly in a later scope review; Slice7 omits More
and Slice8 editing must not be silently expanded. Accepted functional scope is
unchanged. No implementation or new validation evidence is added by this review.


### Slice7 concrete proposals for review — 4 November 2026

[Proposed gap resolutions](slices/07-quick-create-basic-list.md#accepted-gap-resolutions--4-november-2026)
specify candidate Unicode comparison, physical absence representation, record
versions and minimal persistent operation references. These are not new approvals.
Advanced Create is proposed for separately detailed Slice8A after metadata editing,
not inserted into the agreed sequence until accepted. Durable form drafts are not
promised; safe unknown-outcome recovery is required. No implementation or tests.


### Slice7 gap resolutions accepted — 4 November 2026

Owner accepted all concrete gap resolutions. Task path users/{uid}/tasks/{taskId},
initial record schema/concurrency version 1, explicit physical nulls decoded as
semantic absence, NFC/lowercase code-point Title ordering with original Title/ID
ties, minimal persistent operation references and no durable form-draft promise
are now agreed baselines. Exact Rules/query/receipt/retention contracts require
implementation validation. **Slice8A Advanced Create** is inserted after Slice8
and before Slice9, preserving existing identifiers. This supersedes proposal/open-
approval wording in the prior review checkpoints. No code, staging or commit.


### Slice7 commit-review preparation — 4 November 2026

Owner requested completion and review for commit. Seven documentation files are
staged, with accepted baseline and technical validation gates distinguished. No
implementation, application tests, commit, push or cloud operation is performed.


## Slice8 detailing accepted — 4 November 2026

Owner accepted [Task Detail/metadata detailing](slices/08-task-detail-metadata.md)
and all eighteen recommendations. Explicit contextual Save/Cancel editors cover
Title, Reference and classification; tri-state preferences commit individually.
Reference uses 255 Unicode code points and empty means absence. Description uses
versioned structured rich text limited to 64 KiB serialized UTF-8, with paragraphs,
headings, bold/italic, lists and links only. Metadata creates no Activity Event or
lifecycle change. Optimistic concurrency preserves local input and offers Reload
latest / Apply my changes / Cancel; description is one conflict field. Mobile page,
desktop panel/full-page, dirty navigation and actual-origin restoration follow
existing contracts. Editor/schema/storage split/security proofs remain concrete
implementation gates. Advanced Create stays separate Slice8A. Documentation only;
no code, tests, staging, commit, push or cloud actions.


### Slice8 gap evaluation and staged review — 4 November 2026

Owner requested evaluation of pending gaps and staging preparation.
[Gap register](slices/08-task-detail-metadata.md#gap-evaluation--4-november-2026)
records editor/node/link policy, size/security enforcement, storage/version/rollout,
conflict/receipt recovery, per-Task mutation serialization, account isolation and
navigation/dependency gates. Scope is accepted; no technical feasibility proof or
new alternative approval is claimed. Seven documentation files staged for review;
no application tests/builds, implementation, commit, push or cloud operation.


### Slice8 Markdown scope reduction — 4 November 2026

Owner removed WYSIWYG. [Slice8](slices/08-task-detail-metadata.md) uses a plain-text
GFM source editor and Task Detail Markdown rendering, with 64 KiB UTF-8 source
limit. D1 editor/schema gap closes through scope reduction; no Tiptap selection.
D2 byte enforcement and D3 safe URI/image policy remain open. No live preview,
formatting toolbar, code execution or interactive Todo behavior is added. This
supersedes the earlier structured-rich-text decisions above. Other metadata/save/
conflict contracts remain. Documentation restaged; no code, tests, commit or push.


### Slice8 D2 approved — 4 November 2026

Owner accepted the Markdown-source byte contract: 65,536 UTF-8 bytes inclusive,
CRLF/CR-to-LF normalization, otherwise preserved content, empty string and no
truncation. Rules check actual UTF-8 bytes; direct-write/Unicode boundary proof
remains pending implementation. D3 safe rendering/URI/image policy is next.


### Slice8 D3 approved — 4 November 2026

Owner approved safe GFM rendering with tel: added to https/http/mailto. Use
react-markdown + remark-gfm, no raw HTML or image fetch, non-navigating relative
labels, inert task lists, escaped code and horizontally contained tables. Exact
versions/security behavior require implementation checks. D4 storage/versioning
is next; no code, tests, commit, push or cloud actions.


### Slice8 D4 agreed — 4 November 2026

Task metadata remains in users/{uid}/tasks/{taskId}; Markdown source is in its
detail/description child. Root version is shared aggregate concurrency; description
Save atomically updates detail and root version, metadata Save patches root only.
Transactional baseline reads avoid incoherent independent listeners. Missing detail
is empty only under a declared schema contract. Update trusted cleanup inventory.
Rules/schema evidence remains pending; D5 compatible rollout is next.


### Slice8 D5 approved — 4 November 2026

Owner approved explicit Task1/2 readers, transactional lazy Task2 upgrade during
first deliberate edit, independently versioned description1/GFM, compatible
readers/Rules before new writers and a data-aware rollback floor. Quick Create
uses Task2 after writer activation. No read rewrites, bulk migration, silent
reset/downgrade or unproven legacy writer coexistence. D6 conflict/no-op is next.


### Slice8 D6 simplified — 4 November 2026

Owner replaced conflict reapplication with stale-save rejection and Refresh/restart
editing (or Stay without saving). Save is enabled only for valid actual changes;
case-only Title/Reference/description edits count as changes, unchanged/reverted
input causes no write/version/schema change. No implicit rebase or Apply my changes
in Slice8. Unknown Save outcome still requires reconciliation; D8 remains separate.


### Slice8 D7 agreed — 4 November 2026

Owner agreed per-Task edit/mutation serialization, Stay/Discard for dirty-editor
switches, direct switch when unchanged, pending/unknown mutation blocking and Check
save status. Preference outcomes distinguish confirmed failure, conflict and
unknown; navigation retains operation tracking and Logout remains available.
D8 acknowledgement recovery is next; no code/tests/commit/push performed.


### Slice8 D8 approved — 4 November 2026

Owner approved stable Save operation identity and minimal immutable completion
receipt atomic with root/detail writes. Verify receipts after timeout/reload,
reuse ID/original version for safe retry and recheck receipt on retry conflict.
Retain with Task initially and include in permanent cleanup. No copied content,
Activity Event or durable draft promise. D9 input/account isolation is next.


### Slice8 D9 accepted — 4 November 2026

Owner accepted temporary-failure in-memory input preservation and strict account/
access isolation. Closed/deleted copying requires continued authorization; access
loss/Logout/UID switch clears visible content. Minimal pending operation tracking
supports authorized verification after re-sign-in, not durable draft restoration.
D10 origin/list restoration is next; no code/tests/commit/push performed.


### Slice8 D10 approved — 4 November 2026

Owner approved real View/group/scroll-anchor restoration, reactive list movement/
removal, nearest surviving position, deleted-origin explanation/All Tasks choice,
actual-history direct links and layout-preserved context. D6–D9 guards still apply.
D11 Closed/deleted read-only boundaries are next; documentation only.


### Slice8 D11 approved — 4 November 2026

Owner approved authorized read-only Closed/deleted Detail, unchanged All Tasks
scope and no early lifecycle/restore/purge controls. Rules enforce editability
and immutable lifecycle/date fields at commit; confirmed access loss removes
cached disclosure. Account deletion fences remain authoritative. D12 dependency/
validation/test-authority boundaries are the final gap; documentation only.


### Slice8 D12/design closure — 4 November 2026

Owner agreed the final dependency/validation baseline. All D1–D12 design gaps are
resolved; actual dependency integration, exact Rules/receipt/codec contracts,
pinned renderer versions and required passing evidence remain implementation work.
Keep Slice4 linking acceptance and held tests unchanged until separately authorized;
cloud publication remains separate. Documentation restaged, no code/test execution,
commit, push or deployment. Design closure is not implementation acceptance.


## Slice8A detailing accepted — 4 November 2026

Owner proceeded with [Advanced Create detailing](slices/08A-advanced-create.md),
amending More to **More Details** and rejecting Less/back-to-compact for the draft.
Retain one draft on mobile full-screen/desktop large-modal expansion. Title remains
the only input the user must supply; Reference/description default empty and
Important/Urgent Unset. All changes submit together through one Create; no individual
preference commits or live Markdown preview. Create Task2 and required nonempty
description1 atomically with complete recovery correlation, no partial Task patching.
No scheduling/lifecycle controls or creation Activity Event. Update trusted cleanup
and actual Rules/operation proofs; implementation and validation remain pending.
Documentation only; no code, tests, staging, commit, push or cloud actions.


### Slice8A A3 approved — 4 November 2026

Owner agreed an immutable creation completion receipt atomic with Task root and
required description, allowing original-operation verification despite timeout or
later edits. Reuse receipt mechanism with type create, no copied description or
Activity Event. Include receipt in trusted cleanup and prove atomic Rules. Other
8A gap recommendations remain for review; no code, tests, staging or commit.


### Slice8A A1–A10 agreed/design closure — 4 November 2026

Owner explicitly agreed every remaining gap recommendation after A3. More Details
is available with invalid/empty Title except pending/unknown creation; focus moves
to Reference with values/errors preserved. One-way dismissal/validity rules,
complete atomic creation receipt correlation, safe changed-intent/reload recovery,
Rules proof and actual dependency/test-authority boundaries are agreed. All ten
design gaps are resolved; implementation evidence remains pending. No staging,
commit, push, code/tests or cloud actions are performed by this documentation.
