# Slice 9 — Three onboarding Tasks and initial manual

Status: **N1–N8 accepted with owner amendments on 4 November 2026;
revised G1–G8 accepted; implementation pending**. Onboarding is a blocking
provisioning stage. Relative-link restrictions apply only to relative links;
permitted absolute links remain allowed and all permitted links use a new target.
Design agreement is not implementation acceptance.
Baseline: main `cf77bc4`. Documentation only; implementation remains pending.

Authority: [product specification §23](../../product_spec.md#23-starter-tasks-and-documentation-delivery-owner-agreed-2026-10-22),
[slice plan](../../implementation_plan.md), [workspace provisioning](../05-workspace-provisioning/index.md),
[account deletion](../05A-delete-account/index.md), [navigation](../06-responsive-navigation/index.md),
[Quick Create](../07-quick-create-basic-list/index.md), [Task Detail](../08-task-detail-metadata/index.md)
and [Advanced Create](../08A-advanced-create/index.md).

## Summary

Introduce Learn usage, Explore settings and Find Documentation as ordinary starter
Tasks for newly initialized eligible workspaces. Deliver initial manual pages and
usable description links. Resume interrupted provisioning without duplicates,
overwriting user content or resurrecting deleted examples. Teach available features;
Todos and dedicated associated links remain later slices.

## Deliverable and boundaries

Create exactly three ordinary editable Draft Tasks, unpaused, with Uncategorized,
absent Location, empty Reference and Important/Urgent Unset. No planned, actual or
deletion dates, closure outcome or creation Activity Event. Created timestamps are
cloud-confirmed. Use the current compatible Task2/description1 GFM contracts, source
byte limit and safe rendering/link policy; templates are versioned source content,
not a new Task subtype or permanently protected records.

Show them through ordinary All Tasks and Task Detail; counts and future normal
lifecycle/delete/restore behavior apply. No welcome wizard, automatic completion,
new Dashboard, query engine, Settings forms, lifecycle controls, Todos, attachments,
Discussion, associated-link records or Activity viewer is introduced. GFM checkboxes
are inert and must not masquerade as functional Todos. Real checklist creation is
Slice18; dedicated Task-associated links are Slice20.

## Accepted recommendations — N1–N8

| ID | Recommendation |
|---|---|
| N1 | Determine onboarding eligibility once during new workspace initialization. Persist a versioned onboarding decision before workspace completion; completed legacy workspaces with no decision are ineligible, not automatically enrolled. |
| N2 | Pin one immutable template bundle for an eligible onboarding run. Track eligibility and per-Task completion separately, but require all three starter stages and onboarding completion before workspace readiness. Keep the UI blocking with progress and resumable recovery. |
| N3 | Use stable per-UID seed identities and atomic per-Task root/description/creation-receipt/completion-marker writes. Each of three Tasks is independently recoverable; completion requires all three markers. |
| N4 | Retain completion markers independently of Task existence. Never reseed on missing/edited Tasks or template changes. Existing initialized accounts receive no automatic backfill, including accounts predating Slice9. |
| N5 | Serve a small public read-only manual under the application's existing Hosting origin at /manual/ and stable subpaths. Keep manual content in the repository and ship it with the application artifact; no separate service or CMS. |
| N6 | Use same-origin relative manual links in starter Markdown through a narrowly defined manual-route exception to Slice8's non-navigating relative-link rule. Only approved /manual/ relative paths navigate; other relative links remain inert. Permitted absolute links remain allowed. Open every permitted link in a new target tab/window with safe opener handling. |
| N7 | Publish only implemented guidance and an available-settings explanation. Do not teach held linking as accepted or future shells as operational; do not add controls solely to make onboarding text demonstrable. |
| N8 | Reuse existing provisioning recovery, admission, compatibility, mutation receipts and trusted cleanup boundaries. Resolve actual Rules/schema/atomicity contracts and validation authority before implementation acceptance. |

Owner accepted N1–N8 with amendments to N2 and N6. The /manual/ restriction
applies to relative links only; absolute links retain the accepted safe-protocol
allowlist. All permitted links request a new target tab/window. Browsers/OS may
handle mailto/tel through an external application; do not promise a rendered tab
for those schemes. This supersedes Slice8's same-target mailto/tel presentation,
not its protocol/security validation. External publication still requires an
explicit destination under [Hosting policy](../../hosting_channels.md).

## Eligibility, versions and safe resumption

At first initialization after feature activation, durably record eligible status,
bundle version and stable identities before marking workspace initialization
complete. The enrollment write must share the workspace stage concurrency/fence
contract so two devices cannot choose different bundles or retroactively enroll
an already completed workspace. A workspace already initializing at rollout needs
a deterministic rule: enroll only if its committed initialization plan already
includes the onboarding stage; otherwise finish its original plan
without onboarding. Do not infer newness from an empty Task collection.

Onboarding is part of blocking workspace provisioning. After prerequisite
classifications/settings/Views exist, run the three bounded starter stages while
showing Loading and progress (for example, Creating starter Tasks, 1 of 3).
Only verified completion of onboarding and the remaining workspace stages allows
the ready transition. Recovery remains in the blocking setup surface with Retry
for confirmed recoverable failure and Check setup status for unknown outcomes.
No skip, ordinary Task access, offline write queue or background scheduler is added.
Logout remains available; public manual pages remain accessible in a new target.

Persist a bundle version/digest, seed key, stable Task/operation identity and
cloud-confirmed completion per seed. Exact paths are implementation contracts;
use the existing initialization namespace rather than invent another authority.
An interrupted run must retain access to its pinned bundle: keep referenced
historical bundles available, or block safely with an explicit recovery decision.
A new release never substitutes new text into an already started seed operation.

Per Task, atomically commit root, nonempty description, immutable create receipt
and corresponding seed marker. Reuse the Slice8A receipt's complete root/detail
correlation and Rules enforcement. Two devices converge on the same seed identity;
receipt/marker reconciliation precedes retries after unknown acknowledgement.
Do not create then patch descriptions. Overall completion is derived/committed
only after authoritative verification of all three markers.

A committed marker remains success even if the ordinary Task is subsequently
edited, closed, deleted or permanently removed. Do not require it to keep its
original title, description, lifecycle or template digest. Missing Task with a
completed marker is never recreated. A missing marker with an existing seed Task,
malformed control data or inconsistent receipt is an integrity/recovery condition,
not permission to overwrite or issue a new random ID. Duplicate user-created
Titles are allowed and never establish seed identity.

## Proposed starter copy

These are initial copy proposals. The shipped bundle must match implemented
feature availability and link to real packaged routes. Do not persist unresolved
placeholder URLs or describe later features as available.

### Learn usage

> Welcome to Taskify. These three starter Tasks are yours to edit like any other Task.
>
> Capture an idea with Create: enter a Title, choose a Category or Location if useful,
> and create the Task. More Details lets you add a Reference, preferences and a
> Markdown description before creating it.
>
> Open a Task to edit its Title, classification, Reference or description. Use Save
> for a valid change or Cancel to leave that editor. Important and Urgent each have
> Yes, No and Unset choices. Description uses Markdown source; its rendered
> checkboxes are not interactive Todos.
>
> All Tasks groups open Tasks by Category. Your starter Tasks use Uncategorized.
> You can rename this Task or replace these instructions with your own notes.
>
> Read the [getting started guide](/manual/getting-started) for the available workflows.

Do not instruct users to complete/close this Task before lifecycle actions exist.
When those arrive, enrich new-provisioning copy with completion instructions; when
Slice18 arrives, add real Todos and explain their ordinary lifecycle effects.
Never rewrite existing users' descriptions or add checklist items automatically.

### Explore settings

> Taskify uses your workspace settings and default classifications. New Tasks start
> in Uncategorized with Location Unspecified unless you choose another value.
>
> Settings sections become usable as their features are released. A section shown
> as unavailable does not yet offer an editing form. This starter Task does not
> track settings changes or require you to change anything.
>
> See [settings and defaults](/manual/settings) for the settings currently available.

At implementation, replace generic availability language with a truthful inventory
of the actual release. Do not claim timezone/profile editing or management forms
are available merely because their records or navigation shells exist.

### Find Documentation

> Open the [Taskify manual](/manual/) for help with available features. Start with
> [getting started](/manual/getting-started) or [creating and editing Tasks](/manual/tasks).
>
> These are ordinary description links; you can edit or remove them.

## Manual delivery and link contract

Proposed routes: /manual/ (index), /manual/getting-started, /manual/tasks and
/manual/settings. Include capture/defaults, More Details, Task Detail editors,
tri-state preferences, supported Markdown/limits, Save/Cancel, conflicts and
unknown-operation recovery, sign-out/input limitations, and truthful settings
availability. Explain that starter Tasks are editable, are not automatically
backfilled and do not restore deleted examples. No provider credentials, internal
schemas, operator deletion procedure or diagnostics belong in end-user content.

Manual pages should load without Auth/workspace readiness, remain available during
compatibility blocking and avoid accessing account data. Prefer a static entry
independent of the authenticated app boot. Deep links/reload must return the
correct page; unknown paths show a useful not-found page and manual-index link.
Provide responsive typography, keyboard navigation, page titles, focus handling,
readable tables and a return-to-app link. Opening help must not discard an editor:
open every permitted description/manual help link in a new target tab/window
with an accessible indication and noopener noreferrer handling.

For relative links, the N6 exception permits only normalized same-origin paths resolving to registered
manual routes (and validated fragments). Reject protocol-relative paths, encoded
path tricks, backslashes, userinfo/origin changes and script/data schemes; do not
turn arbitrary relative Markdown into links. Absolute http/https/mailto/tel links
remain permitted after Slice8 validation, including external destinations; they
are not restricted to manual routes. Request a new target for all permitted links,
including mailto/tel (actual handler behavior belongs to the browser/OS). Preserve
inert images/raw HTML and noninteractive task lists.
Apply the exception consistently to all Task descriptions, not trusted seeds only.

Validate links against built manual routes before a bundle becomes eligible. The
application artifact must contain the manual pages before onboarding writers are
enabled. Preview URLs can expire; same-origin paths avoid persisting a particular
preview hostname. Links work on the active app origin; permanent external sharing
and old-origin/channel retirement need a later stable public-origin decision.
No publication or claim of a working hosted manual is made by this detailing.

## Integrity and integration gates

Require real validated Slice5/5A/7/8/8A contracts, authenticated UID/session generation,
current compatibility/connectivity and no deletion fence for writes. Revalidate
admission and fencing at commit. Use a narrowly scoped provisioning admission for
seed writes before workspace readiness; ordinary create/edit admission remains
blocked until ready. Never bypass the ready gate for general Task operations. Stop new work after account/session changes and
reconcile unknown operations after fresh admission. Clear old-account content and
invalidate callbacks on Logout/UID switch. Manual reading does not bypass write gates.

Initialization writers may create only legitimate seed records for an eligible
account; they cannot overwrite user edits or reset completion. Prove concurrent
transactions, immutable marker/receipt ownership, field validation, Task defaults,
root/detail correlation, source byte limits and exact allowed write sets. Browser
checks alone are insufficient. If atomic constraints exceed the current Rules or
transaction model, return the concrete conflict before weakening guarantees.

Include onboarding plans/markers, receipts, Task descriptions and all other new
records in Slice5A trusted account cleanup and compatibility/schema inventory.
Permanent Task removal retains onboarding completion outside the Task subtree;
account deletion removes it. Do not retain content copies in receipts or markers.
Declare reader/writer compatibility and a data-aware rollback floor before enabling
new contracts. Diagnostics report minimal operation state, never description text.

## Acceptance evidence required during implementation

| Area | Required evidence |
|---|---|
| New workspace | Exactly three defaults-correct Tasks with complete descriptions and valid manual links; existing workspaces remain unchanged |
| Eligibility | Activation boundary, pre-rollout incomplete plan, two-device enrollment and absent legacy marker do not cause retroactive enrollment |
| Atomicity | Denied/failed writes cannot leave a root without required detail/receipt/marker; adversarial direct writes cannot forge completion |
| Recovery | Interrupt before/after each commit, lost acknowledgement, reconnect/reload/session re-admission and concurrent devices produce one seed per key |
| User ownership | Ordinary access before ready is denied on every device; after readiness, edit/rename/delete/purge never causes overwrite or resurrection, and same-title manual Tasks coexist |
| Version evolution | New bundle affects only new eligible runs; pinned interrupted runs resume safely; malformed/unsupported state blocks rather than resets |
| Security/cleanup | Cross-UID denial, commit-time deletion fence, old-session invalidation, complete trusted cleanup and compatible rollback |
| Manual | All deep links/reloads/build routes, unknown-page handling, available-feature accuracy and unauthenticated access verified |
| Rendering/accessibility | Safe approved manual-route exception, hostile URLs, inert Markdown, mobile/desktop keyboard/focus/new-tab behavior |
| Release/cost | Exact build/template identities, bounded writes/reads/retry evidence, documentation route checks and separately authorized hosted verification |

No tests or implementation evidence are supplied by this document. Slice4 remains
open/on hold; full-slice/regression testing remains held until separately resumed.
Prepare the applicable focused/adversarial/browser checks under actual authorization;
do not infer a hold release from this detailing. Overall platform feasibility remains
INCONCLUSIVE. No dependencies, executable changes, commit, push, cloud configuration or Hosting
deployment are performed. Documentation staging is recorded in the final review checkpoint.

## Gap review — 4 November 2026

Owner accepted revised G1–G8 after reviewing the blocking-provisioning amendment.
The table below records the accepted gap resolutions; implementation proof remains
required. It supersedes the earlier nonblocking recommendations.

| ID | Gap / consequence | Concrete recommendation |
|---|---|---|
| G1 | Enrollment and readiness must be one coherent initialization contract | Persist enrollment/bundle in the original plan. For eligible workspaces, allow ready only after all three immutable markers and onboarding completion are verified. Legacy ready accounts remain ineligible; old incomplete plans finish without retroactive enrollment. Prevent older writers from marking a new plan ready early through compatibility and Rules. |
| G2 | Blocking UI removes normal creation races, but IDs still need collision protection | Keep deterministic seed IDs/mapping and reserve them from ordinary creation in codecs/Rules. Enforce that ordinary Task access is blocked on every device until ready. Treat unexpected existing seed records without valid markers as recovery conditions; never overwrite. |
| G3 | Completion must survive later Task purge | Keep independent immutable markers until account deletion. Initial root/detail/receipt/marker commits atomically; after readiness, Task edit/delete/purge cannot reset the markers or rerun provisioning. |
| G4 | Bundle identity does not attest exact text | Enforce enrollment, identity, initial fields, nonempty description and atomicity in Rules; check exact copy in build/application validation. Tasks become ordinary editable records after readiness. Exact immutable content is not a security boundary. |
| G5 | Public manual must work during blocked setup | Build independent public manual output before the app fallback. Validate deep links, canonical paths, unknown-page handling and access without Auth/ready state. All permitted links request a new target. No Hosting change is performed by detailing. |
| G6 | Shared data can be opened from different releases | Identify the manual's release and preserve stable route aliases. Relative manual links follow the current origin; permitted absolute links retain their explicit destination. Supported writers/gates must prevent an older client bypassing blocking onboarding; do not promise a historical manual per Task. |
| G7 | Blocking setup needs explicit progress and recoverable failure | Show bounded stage progress in the blocking Loading surface; never unlock because of a timeout. Reconcile unknown outcomes before retrying with the same identities. Offer Retry after confirmed recoverable failure, Check setup status for unknown outcomes and Logout. Do not auto-open Tasks when setup completes; continue through the normal post-provisioning route. |
| G8 | Rollback or missing pinned bundle can strand setup | Retain exact bundles/manual routes for supported incomplete plans and establish a rollback floor before activation. A client unable to resume a plan keeps setup blocked with recovery guidance; no silent skip, new bundle or ordinary Task access. Legacy completed workspaces follow their existing valid admission. |

### Accepted minimal state contract

Use an explicit onboarding plan with eligible/bundle identity and three fixed seed
keys; represent no-onboarding explicitly in new initialization plans. Legacy ready
workspaces without a plan remain ineligible. An enrolled run has incomplete or
complete status derived from its immutable per-seed markers; pending/error/unknown
presentation is transient operation state, not an instruction to delete markers.
Require a complete enrolled run before workspace readiness. Do not add a user-visible
Skip or reset action in this slice. Markers may be committed in earlier bounded
transactions; the final ready transition must authoritatively check all required
markers/completion rather than trust a client-supplied count. Ordinary reads/writes
remain gated for all devices; only the narrowly scoped initializer can seed before ready.

For each seed, read the plan and marker under fresh admission. A valid marker ends
that stage successfully regardless of current Task existence. Without a marker,
reconcile the stable operation/Task identity and create only when the authoritative
transaction permits the original complete operation. On a conflict, recheck the
marker/receipt before reporting failure. An absent receipt alone is insufficient
to cancel a possibly pending operation or select a fresh identity. Reconstruct the
original payload only from the exact pinned bundled template and plan; this is
seed recovery, not restoration of a user's unsaved form draft.

Keep the per-seed marker independent of mutable Task state and normal Task cleanup.
After all three markers exist, a completion-summary failure must not trigger any
Task write; safely retry only the summary. An already complete run does no seeding
work on later admission. Classification defaults must still resolve authoritatively:
protected Uncategorized must exist and remain usable, absent Location is allowed,
and onboarding does not inherit current View or user-selected create-form defaults.

### Review outcome

Blocking provisioning simplifies G1 and G7: no eligible workspace becomes usable
until onboarding is verified complete. It also exposes an integration requirement:
Slice7/8A ordinary creation requires workspace readiness, so seeding needs explicit
provisioning-only authorization instead of reusing that admission unchanged.
No security, compatibility or deletion fence is relaxed. G2/G3/G4 remain necessary
for integrity and later ordinary ownership. G5/G6 incorporate the accepted link
amendment; G8 now retains blocking recovery rather than allowing ordinary work.
All revised G1–G8 are accepted. Exact implementation and validation proof remains
required; no executable or cloud action is performed.


## Design closure — 4 November 2026

Owner accepted N1–N8 with link/blocking-provisioning amendments, followed by all
revised G1–G8. All identified Slice9 design decisions are resolved. Eligible new
workspace plans pin a bundle and atomically seed three Tasks with independent
completion markers before readiness. Preserve no-backfill/no-overwrite/no-
resurrection behavior, blocking progress/recovery, narrowly scoped initializer
admission and account/compatibility/deletion safeguards. Public same-origin manual
routes are independent of authenticated app boot. Relative links are limited to
registered manual routes; permitted absolute links remain allowed. Every permitted
link requests a new target with safe opener handling.

Exact codecs/paths, Rules atomicity/readiness enforcement, historical bundle
availability, build/manual routing, trusted cleanup and rollback contracts require
implementation and passing evidence. Proposed starter prose is subject to release
accuracy review; design closure does not claim a published manual or tested feature.
Slice4 hold remains unchanged. Documentation only: no application tests/builds,
implementation, commit, push or cloud actions are performed. Documentation staging
is recorded in the final review checkpoint.


## Final review and staging checkpoint — 4 November 2026

Owner requested final checking and staging preparation. Reviewed accepted N1–N8,
revised G1–G8 and cross-document amendments for blocking readiness, no backfill,
atomic seed completion, independent retention, scoped initializer admission and
relative/absolute link behavior. Clarified that ordinary Task access is denied
between provisioning stages; ownership/edit/delete checks apply after readiness.
Checked documentation targets/anchors and Git whitespace. Seven documentation
files are staged for review. These checks are not application/Rules/browser proof.
No implementation, tests/builds, commit, push or cloud action is performed.
