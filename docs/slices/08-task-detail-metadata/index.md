# Slice 8 — Task Detail and metadata editing

Status: **detailing accepted by owner on 4 November 2026; implementation pending**.
The owner accepted the proposed scope and all eighteen recommendations, then
replaced WYSIWYG/structured rich text with plain-text GFM source and Task Detail
Markdown rendering. This later amendment controls wherever earlier wording differs. This
records design agreement, not implemented/tested behavior. No executable changes,
dependencies, staging, commit, push, cloud configuration or deployment occur.

Authority: [product specification](../../product_spec.md), [architecture](../../architecture.md),
[slice plan](../../implementation_plan.md), [navigation](../06-responsive-navigation/index.md),
[Task creation](../07-quick-create-basic-list/index.md) and [account deletion](../05A-delete-account/index.md).

## Objective and boundaries

Open existing owned Tasks and edit Title, Reference, Category, Location, Important,
Urgent and a description edited as plain-text GitHub Flavored Markdown (GFM). Display available lifecycle/pause/date metadata
read-only; no unconstrained status setter, scheduling, Start/Resume/Close or other
lifecycle operations are added. Todos, Discussion, external-link management and
Activity viewer arrive with their slices, not inert controls/fake data here.
Advanced Create remains separately detailed Slice8A.

Require current authenticated UID/session admission, compatibility and applicable
workspace readiness; a deletion fence prevents ordinary access/mutations. Loading
and edits are independent of provider verification/linking; Slice4 remains held.
Implemented dependency behavior and test authority are not established by detailing.

## Responsive Task Detail

Below 960 CSS px, render full-page Task Detail with contextual Back header. At/above
960px, entry from a workspace opens a side panel over its actual origin, expandable
to full page. Use accepted responsive header/content hierarchy: contextual actions,
Title/Reference, available status/planning metadata, description and preferences.
Do not introduce blank future sections, lifecycle action menus or pretend history.
Direct entry has no fabricated workspace underneath; use a standalone detail shell
with expand behavior only where meaningful.

Preserve accessible names, keyboard order, focus entry/return and usable touch
controls. Resize/expansion changes presentation without losing dirty input or
origin identity. No global Create in Task Detail. Link activation from the list
becomes real only once ownership/loading/editability checks are implemented.

## Metadata editors and validation

| Field | Accepted editing contract |
|---|---|
| Title | Contextual explicit Save/Cancel; identical Slice7 255-code-point single-line validation, trimming and duplicate policy |
| Reference | Optional single-line text, maximum 255 Unicode code points; trim outer whitespace; empty decodes to absence; duplicates allowed |
| Category | Exactly one stable Category ID; explicit Save/Cancel, new assignment active only |
| Location | Optional stable Location ID; explicit Save/Cancel, clearing means Unspecified |
| Important / Urgent | Labeled Yes/No/Unset, each explicit selection is an individual committed action |
| Description | Plain-text GFM source editor with explicit Save/Cancel; render Markdown in Task Detail only |

Allow one unsaved editor at a time. Switching editor must resolve the current
dirty editor through Save/Cancel or Stay/Discard, not silently replace its input.
Prevent concurrent preference submissions from bypassing this rule or erasing
another editor's changes. A pending preference selection is visibly unconfirmed;
a completed change is not a form draft that later Discard can undo.

Reference is ordinary text, not a modeled relationship, URL or automatic hyperlink.
Use the agreed Unicode counting rule; specify exact line/whitespace vectors and
prove domain/Rules agreement. Physically represent absence through the accepted
Task codec, not a new empty-string/null ambiguity. Existing archived Category/
Location references stay readable and may remain unchanged; new assignments must
be active. Missing/invalid references cause recovery, not silent reassignment.

Metadata/description changes require no explanation or Activity Event and never
implicitly Start/Resume, set actual dates, change pause or modify lifecycle.

## Description — plain-text GFM source and rendered detail

**Owner amendment, 4 November 2026:** remove WYSIWYG support. Users write GitHub
Flavored Markdown syntax in a plain-text editor; scope is Markdown rendering in
Task Detail, not an authoring framework. Tiptap was suggested but never approved
or installed; do not add it or another rich-text editor dependency.

Use a normal multiline text editor with explicit Save/Cancel and existing dirty
protection. No formatting toolbar, visual block/node editing, live split preview,
rich-text paste conversion or custom Markdown-authoring tools are required.
Paste inserts plain text. Preserve Markdown source rather than round-trip it
through rendered HTML or a structured editor tree. Empty source is an empty
description; no canonical empty-paragraph JSON document is needed.

Task Detail renders GFM, including headings, emphasis, lists, links, tables,
strikethrough, fenced code and task-list notation. This replaces the earlier
restricted rich-text formatting list; it does not add executable code, Discussion
links, uploads or real Todo records. Code blocks are display-only, no execution
or syntax-highlighting dependency required. Rendered task-list checkboxes are
noninteractive document content, not Task-owned checklist mutations.

Keep the initial two-line plain-text description preview and expanded Markdown
rendering. Extract the preview from parsed text without executing raw markup;
never replace stored source with preview text. Do not include description in
lightweight list loading or expand Search scope.

Store Markdown source text with an explicit format/version discriminator in the
chosen detail schema. Renderer output/HTML is derived and not authoritative stored
content. Do not store unrestricted HTML or an editor AST. The existing 64 KiB
(65,536-byte) UTF-8 limit now bounds persisted Markdown source, not the abandoned
JSON document serialization. Do not silently truncate; exact newline/UTF-8 size
validation and security-boundary enforcement remain D2 implementation evidence.

Select a maintained GFM renderer/parser after checking licensing, compatibility,
security and bundle impact; pin versions during authorized implementation. Disable
raw HTML interpretation and validate links at rendering, including hostile stored
source. The approved D3 policy below fixes URI/image/resource handling and renderer
family. Do not fetch images or invent binary-upload support. Exact dependency
versions and security behavior still require implementation checks. Malformed Markdown is source text to render
safely according to the supported dialect, not content to silently rewrite/delete.
Unknown persisted format versions block unsafe editing rather than reinterpret
source as a different language.

## D2 accepted — Markdown source byte contract

Owner approved this contract on 4 November 2026. Maximum stored Markdown source is
65,536 UTF-8 bytes inclusive, counting spaces, line breaks and Markdown syntax.
Normalize CRLF and CR to LF before saving/counting; do not trim description content
or apply Unicode normalization. Empty description is the empty string. Reject
malformed surrogate sequences before encoding; never silently replace or truncate.

The client reports size and blocks oversized submission. Rules require a string
and directly check source.toUtf8().size() <= 65536, alongside the other ownership,
version and editability constraints. Do not trust a client-provided byte count or
substitute character/UTF-16 length. Markdown syntax need not be validated in Rules;
render safety is D3. The client rejection of malformed source is not a claim that
Rules can observe a JavaScript surrogate sequence before transport serialization.

Boundary/direct-write tests must cover 65,536 bytes, one byte over, emoji, combining
characters, multiline text and normalized line endings. This closes the D2 design
decision; actual project Rules/emulator enforcement remains implementation evidence.
References: [Rules String](https://firebase.google.com/docs/reference/rules/rules.String)
and [Rules Bytes](https://firebase.google.com/docs/reference/rules/rules.Bytes).

## D3 accepted — safe GFM rendering

Owner approved the recommendations on 4 November 2026, adding tel: links.
Use react-markdown with remark-gfm; exact versions remain subject to dependency,
license/advisory and compatibility checks during implementation. No installation
is performed by this documentation. Do not enable raw HTML or HTML-parsing plugins.

Link/autolink protocols are https:, http:, mailto: and tel: only. Validate parsed
URLs after control/encoding handling; do not use a permissive prefix test that lets
obfuscated unsafe schemes through. Reject protocol-relative navigation. Relative
links retain their labels but do not navigate because no document-relative base is
defined. HTTP(S) links open a new tab with noopener noreferrer; no prefetch or
automatic navigation. Mailto/tel are user-activated browser/OS handlers and are not
forced into a new tab. Show useful link labels/destination context; preserve source.

Do not render/fetch images. Show available alt text as “Image: …” or a clear
non-fetching image placeholder for empty alt text, preserving Markdown source.
Task-list checkboxes display checked state but are noninteractive and do not mutate
Todos. Code blocks are escaped display text, not executable code/Mermaid; no syntax
highlighting dependency. Tables scroll horizontally within their container on narrow
screens rather than overflow the page. Stored content uses the same safe renderer;
no reliance on authoring controls to establish safety.

Test unsafe/obfuscated schemes, relative/protocol-relative URLs, mailto/tel handlers,
image syntax without any network request, raw HTML, task-list immutability, code
escaping, mobile table containment and source round-trip. D3 design is closed;
implementation/security/browser evidence remains required.
References: [react-markdown](https://github.com/remarkjs/react-markdown) and
[remark-gfm](https://github.com/remarkjs/remark-gfm).

## Loading, storage and schema evolution

Load description only when Task Detail requires it; do not pull Markdown source into the
lightweight list/Dashboard/search population. The approved D4 split below keeps description in a detail child document. Reads
must establish coherent versions and Save must enforce atomic intended effects
without rewriting unrelated metadata. Runtime decoders reject unknown/malformed content safely.

Introduce Reference/description via explicit compatible codecs and family/schema
policy. Slice7's schema 1 has no speculative fields: do not silently assume it
already permits these fields. Define retained-record readability, chosen writer
schema, allowed fields and rollback floor; no bulk migration or cloud policy
publication is authorized. Preserve stable Task ID/UID and Created timestamp.
Schema versions, Markdown format versions and concurrency counters remain
independent. Update trusted deletion inventory/verification if new detail or
operation records are introduced; no orphaned description family is acceptable.

## D4 accepted — separate description and aggregate concurrency

Owner agreed on 4 November 2026. Lightweight metadata stays at
users/{uid}/tasks/{taskId}; Markdown source is stored separately at
users/{uid}/tasks/{taskId}/detail/description. Load the latter on Task Detail entry,
never as part of normal list population. Include it in Slice5A's explicit cleanup.

Use the root Task version as the aggregate optimistic-concurrency counter.
Description Save atomically writes the detail source and increments root version;
metadata Save patches intended root fields and increments root version without
rewriting description. Keep record/schema/Markdown-format versions independent
of this shared concurrency counter. Do not add Activity Events for either Save.

Obtain the editing baseline with a read-only transaction over root and description
(or an equivalently proven version-validated read); independent listeners alone
are not an atomic snapshot. Prefer the transaction to avoid a misleading rule
that every metadata update must rewrite an unchanged description version. The
root version is captured with the content actually read. Later metadata-only
changes may leave description unchanged and still create an aggregate conflict.

Missing description decodes to empty only for declared compatible schemas allowing
absence. A malformed/unknown record is an error, never permission to replace it
with empty content. Persisted description fields/version and exact root/detail
Rules relationships remain implementation contracts. Test adversarial detail-only
writes, root-version bypass, malformed missing states and concurrent root/detail
saves. Aggregate conflicts, including disjoint edits, use the accepted Refresh/
Stay flow below; no reapplication or automatic overwrite.

## D5 accepted — compatible schema evolution

Owner approved on 4 November 2026. Retain explicit Task schema1 readers and introduce
Task schema2 for optional Reference plus the separate-description contract. Decode
schema1 Reference/description as empty without writing during reads. First deliberate
legacy edit transactionally applies the intended edit and upgrades root schema to2,
preserving UID/Task ID, Created and unrelated data under expected-version checks.
No bulk migration, lossy downgrade or read-triggered rewrite is authorized.

Description record schema starts independently at1, with an explicit GFM format/
version. Schemas1 and2 permit a missing description child as empty; a description
Save creates/updates the child atomically with root version and any required root
schema upgrade. Unknown/malformed root/detail/format versions block unsafe
interpretation/editing, not silent reset. Quick Create writes schema2 once that
writer is enabled, with semantic empty Reference and no description child; exact
physical absence representation follows the accepted codec contract.

Roll out compatible readers/Rules before enabling schema2 writers. Every supported
client must read the retained schema population. Retire schema1-only writers before
new writes unless preservation of new fields/detail invariants is explicitly proved.
Publish corresponding independent family/format capabilities and allowed writes
through the authoritative compatibility contract only with applicable deployment
authority. Root/detail Rules must enforce the upgraded operation atomically.

Record a rollback floor: deploy only a build that reads every retained schema and
obeys current writer policy. A UI rollback does not undo upgraded data. Test mixed
schemas, lazy-upgrade concurrency/interruption, legacy Quick Create, incompatible
writers and unknown child-format versions. Design approval is not rollout/test
execution; no cloud policy publication is performed.

## D6 accepted — valid-change Save and simple conflict recovery

Owner simplified conflict handling and specified valid-change gating on
4 November 2026. This supersedes earlier Apply my changes/reapplication proposals
for Slice8 Task metadata/description editing; it does not silently redefine later
lifecycle operation conflict contracts.

Capture confirmed editor values and root version as a fixed baseline. Enable
**Save** only when input is valid, differs from that baseline under the field's
accepted storage normalization, current admission/editability permits submission,
and no pending/unknown operation blocks it. With no changes, invalid changes or a
change subsequently reverted to baseline, Save stays disabled. Cancel closes the
editor; no special no-op dialog, database write, version increment or schema
upgrade is performed. A disabled Save is not a reason to fetch cloud state merely
to prove no-op equality.

Compare user-defined text case-sensitively. Case-only changes to Title, Reference
or description are real changes. Do not reuse case-insensitive sort/search keys
for dirty detection. Title/Reference retain their agreed outer-whitespace rules;
Markdown source retains D2 line-ending normalization and preserves other content.
Thus case/meaningful source whitespace changes remain valid, while a change erased
by the field's approved normalization does not enable Save. Category/Location
changes compare stable IDs/absence; tri-state controls compare their actual values.

An enabled actual Save still checks the expected cloud root version and patches
only permitted intended fields. On an authoritative version conflict reject the
stale submission and show:

“A newer version of this Task is available. Refresh to load it, then restart your edit.”

| Choice | Required effect |
|---|---|
| Refresh | Explicitly discard current unsaved edit, load latest coherent root/detail state and establish a new editing baseline |
| Stay | Retain authorized local input without saving; stale Save stays blocked until refresh/restart |

No Apply my changes, automatic field merge, conflict diff/reapplication workflow
or automatic overwrite. Users restart edits after refresh. Explain the discard
before Refresh; Stay does not adopt a new base version under old input. The same
flow applies to conflicts on description, metadata and individual preference
mutations. Do not weaken concurrency checks because conflicts are uncommon in a
single-user account; multiple tabs/devices can still conflict.

If the Task is now uneditable, Refresh shows its permitted read-only/missing state
rather than enabling a stale edit. Unknown Save acknowledgement must be reconciled
before classifying it as a version conflict; this simple UI is not a substitute for
operation-outcome verification. D8 still specifies that recovery contract.

Remote changes may refresh read-only presentation, not dirty editor input. Only
cloud-confirmed snapshots/acknowledgements update confirmed presentation and shared
metadata; pending local writes must not falsely signal success or discard the
editor. Reconcile listener/save races by Task/operation/version rather than double
apply a mutation or advance the visible version twice. If a
Task becomes Closed, deleted or otherwise uneditable, block Save and retain local
input for recovery/discard. Render accessible Closed/deleted Tasks read-only where
permitted; no Reopen/Restore/purge actions are added early. A missing/deleted or
access-denied detail response never discloses another UID's data or substitutes a
fresh Task. Define user guidance and local-input handling when access is lost. Retaining input
for a same-account editability conflict is distinct from account isolation: Logout,
UID change or confirmed loss of access clears/hides user-scoped editor content and
invalidates callbacks. Do not expose old dirty content in another account or
persist a durable description draft without a separately approved retention contract.

Save success requires cloud acknowledgement or authoritative reconciliation.
Retain stable operation identity, prevent accidental duplicate submission and
reconcile unknown outcomes before retry or conflict choices. Timeout is not a
confirmed failure. Already submitted writes cannot be cancelled by closing the
editor; account/gate changes invalidate callbacks but do not roll back commits.
Reuse Slice7 recovery boundaries where appropriate, without claiming a universal
exactly-once guarantee or durable draft restoration.

## D7 accepted — one edit/mutation per Task

Owner agreed on 4 November 2026. While an editor has dirty input, opening another
editor or selecting Important/Urgent offers Stay / Discard Changes. Stay keeps the
current editor; Discard drops its unsaved input before switching/starting the new
action. An unchanged editor switches directly without a prompt. This preserves
the single-dirty-editor rule without silently dropping input.

A pending Save disables competing Task mutations and duplicate submission until
its outcome is known. An unknown outcome offers **Check save status** and keeps
new mutations blocked; Discard is never represented as undoing submitted work.
Important/Urgent submit one selected Yes/No/Unset value, visibly pending until
confirmed. A confirmed failure restores the confirmed preference and shows its
error; a version conflict uses D6 Refresh / Stay. An unknown preference outcome
is not labeled failure and does not restore a value as though rollback were proved.

Navigation may leave pending presentation with clear save-verification guidance,
but operation recovery tracking survives; returning to the same Task cannot bypass
the pending/unknown mutation block. Logout remains available and invalidates account
callbacks. Previously confirmed changes are never undone by Discard on a later
editor. Focus restoration and accessibility must reflect disabled/pending controls,
not trap users in a spinner or unexpectedly move focus after a late callback.

## D8 accepted — immutable Save completion receipts

Owner approved on 4 November 2026. Allocate a unique operation ID before Save and
retain minimal UID/Task/operation association for recovery across navigation/reload.
On success atomically persist an immutable completion receipt with root/detail
changes. Receipt contains operation ID, Task association, operation type, resulting
version and cloud-confirmed timestamp, not copied content/description or credentials.
Exact path/field representation and Rules atomic correlation require implementation
review; this approval does not introduce an unchecked client completion flag.

A timeout is **Save status unknown**, with Check save status and D7 mutation blocking.
Read the exact receipt authoritatively under fresh session/gate admission. A valid
matching receipt confirms the original Save even if later edits changed current
Task values/version. Missing/malformed/mismatched receipts do not prove success;
malformed/collision records require safe recovery, never overwrite.

An absent receipt alone does not prove cancellation. A safe retry reuses the same
operation identity, original expected version and original intent, never a new ID
or silently rebased patch. If a retry meets a version conflict, reconcile the
receipt again before concluding the original Save did not commit: a simultaneous
completion may have created it after the earlier read. Without a matching receipt,
use D6 Refresh/restart rather than automatic reapplication. Root/detail/receipt
atomicity prevents multiple commits under the same operation ID.

After reload, restore minimal operation tracking and check status when authorized.
Do not persist a full Markdown/form draft or promise to reconstruct lost input;
when original intent is unavailable, verification remains possible but no blind
payload replay is allowed. A verified operation success does not restore access
to data after account/access loss. Rules still enforce UID, editability, fencing,
expected versions and the exact receipt/mutation relationship.

Retain receipts with the Task initially and explicitly include them in permanent
Task/account cleanup. No automatic expiry or retention bypass that permits stale
replay. Metadata Saves update existing Tasks only; a missing Task is never recreated
by retry. These are recovery records, not Activity Events or a user-visible audit
viewer. Test late original completion, subsequent edits, concurrent retry, lost
acknowledgement, reload, missing Task, forged receipts and finalizer races.

## D9 accepted — unsaved input and account isolation

Owner accepted on 4 November 2026. Keep authorized editor input in memory during
temporary network/compatibility failure, disabling Save until readiness returns.
Same-account conflict Stay preserves input; Refresh explicitly discards and loads
latest. If a Task becomes Closed/deleted, input may remain visible for copying
only while access to that Task remains authorized; Save stays disabled. Do not
automatically restore/reapply the input or enable future lifecycle actions.

Confirmed loss of access hides/clears Task content and editor input and shows
access unavailable. Logout/UID switching clears visible Task/editor content,
subscriptions and old-session callbacks, never showing drafts to the next account.
This takes precedence over same-account input-preservation guidance.

There is no durable draft-content promise across reload/browser close; existing
leave warnings remain best-effort. A pending Save during Logout may retain only
minimal UID/project/Task/operation tracking for later authorized D8 verification,
not content. Same-UID sign-in under a fresh session can check status, not resurrect
discarded editor content. Never let persisted recovery metadata grant access or
reuse stale admission. Test temporary failure versus confirmed access loss, late
callbacks after account switch and pending Save reconciliation without draft leaks.

## D10 accepted — originating list restoration

Owner approved on 4 November 2026. Opening Task Detail captures actual origin View
ID, expanded groups and scroll anchor. Back/panel close restores that View and its
still-valid navigation context after dirty/pending guards. Confirmed edits update
shared list position/group/membership immediately; never retain a stale row merely
to reproduce its former location.

If the anchor moved/disappeared, restore the nearest surviving list position,
not a forced jump to the edited Task. If the Task no longer matches, remove it
while preserving remaining context. If the originating View was deleted, explain
unavailability and offer All Tasks; do not silently substitute another View.
Direct links honor actual browser history and may offer a separately labeled
All Tasks link without fabricating an origin.

Panel expansion and responsive resizing preserve Task identity, dirty input and
origin without adding navigation history merely for layout changes. Search state
restoration applies once Search is implemented, not early scope expansion. Use
stable IDs/anchors, not mutable names or stale row indexes as identity. Test moved/
removed anchors, Category changes, deleted origin View, direct entry and dirty/
pending guards across panel/full-page/resize transitions.

## Unsaved protection and Back restoration

Protect Task switching, contextual/browser Back, panel close and route changes
with Stay / Discard Changes whenever local Task input is dirty. Stay cancels the
navigation; Discard removes only uncommitted editor changes. A committed preference
change remains committed. Pending/unknown submissions use explicit outcome
recovery guidance, not a Discard action pretending to undo a write. Browser/tab
close prompts are best-effort and do not promise save or preservation.

Use Slice6's shared navigation guard and actual origin identity. Return to the
origin View with its applicable groups, search state when implemented and scroll.
Confirmed edits immediately reconcile shared metadata/list membership/sorting;
do not keep a stale row fixed merely to retain its position. If the row/group
changes, restore the origin context as far as valid and explain unavailable content
rather than fabricate eligibility. Detail Back restores the origin, not discarded
View query edits.

Unsaved View configuration and unsaved Task content are distinct protections.
Entering Detail resolves View-setting changes under the existing View warning;
that warning never discards Task content. Direct links use actual browser history
without inventing a View origin; provide separately labeled All Tasks navigation
where useful. Preserve state across panel/full-page and breakpoint changes without
creating duplicate navigation entries or losing dirty content.

## D11 accepted — Closed/deleted read-only boundaries

Owner approved on 4 November 2026. An authorized Closed Task shows read-only
metadata/rendered description with a clear Closed indicator. An authorized soft-
deleted Task similarly shows read-only content with Deleted indication. All Tasks
continues excluding Closed/deleted records; detail reading does not expand list
scope or introduce Reopen, Restore, Permanent Delete or other future actions.

If closure/deletion arrives while editing, block Save when observed and preserve
input for copying only while access remains authorized under D9. Rules reject
metadata/description changes if editability is lost at commit, even before the
client observes the change. A metadata request cannot mutate lifecycle, pause,
closure outcome or system dates; only permitted metadata/detail fields, approved
schema transition and required concurrency/operation fields may change.

A permanently removed or access-denied Task shows unavailable guidance, never a
replacement record or cached disclosure after confirmed access loss. Read-only
access still requires the correct UID and applicable account-deletion fence;
deleted Task visibility is not a bypass of an account-level deletion block.
Test permitted read-only entry, remote editability loss, save races, cross-UID
reads, missing Task and absence of future lifecycle controls.

## D12 accepted — dependencies and validation authority

Owner agreed to proceed on 4 November 2026. Implement against actual Slice5/5A/6/7
contracts; their documentation alone is not dependency acceptance. Require focused
domain/component, adversarial Rules/integration and browser evidence for editing,
conflicts, Save recovery and navigation. Explicitly test ownership/version/editability
bypasses, Markdown source-size enforcement, atomic detail/root/receipt writes and
delete-finalizer coverage. Validate mixed schemas, lazy upgrade, writer policy and
rollback compatibility.

Slice4 linking investigation/acceptance stays held. Identify any shared Auth/browser/
regression checks overlapping that hold and obtain separate applicable authority
before executing them; this agreement is the validation baseline, not a release
of the hold. No Rules publication, provider changes or deployment without separate
authorization. Close Slice8 only after required implementation evidence passes,
not because design gaps are resolved or documentation staged.

## Security and acceptance

Rules enforce UID ownership, allowed changed fields, immutable identity/Created,
valid versions, current editability, active new assignments and deletion fences.
A metadata write must not forge lifecycle/date changes or evade later audited
operation boundaries. If a detail split or operation receipt is introduced,
validate required atomic relationships rather than rely on UI sequencing.

| Area | Required validation |
|---|---|
| Editors | Save enabled only for valid changes/current admission, case-only text changes, reverted-baseline Save disabled, one dirty editor, tri-state transitions and pending display |
| Text | Title/Reference Unicode boundaries, optional Reference, no accidental auto-linking |
| Markdown | Plain-text editing/paste, GFM rendering, noninteractive task lists, code display only, raw-HTML suppression, link/image policy, source preservation, format version and UTF-8 limits |
| Concurrency | Stale root-version rejection, Refresh discards/restarts, Stay preserves input without rebasing, no reapplication/merge/overwrite |
| Remote state | Changes while dirty, archived references, closure/deletion/access loss and input recovery |
| Recovery | Lost acknowledgement, retry identity, double submission, gate/Logout/account switching and stale callbacks |
| Navigation | Mobile page, desktop panel/full-page, direct links, Back, Task switching, dirty guards and origin restoration |
| Integrity | No implicit lifecycle/date effects or Activity Event, immutable fields, adversarial direct writes and deletion inventory |
| Read model | Description on demand, confirmed shared metadata update and no stale eligibility/counts |

Run meaningful domain/component, adapter/Rules and browser checks within applicable
authority. Slice4's held-test scope remains unchanged; identify overlaps before
executing held checks. Local evidence does not establish real provider/index or
hosted behavior; cloud/publication authority remains separate. Measure detail/read
and save costs, renderer bundle size and relevant payload behavior; no speculative
account-volume cap or silent truncation.

Update feature guidance/templates only for available fields, preserving existing
user content and no-backfill policy. Do not create starter Tasks before Slice9 or
invent manual URLs. Frozen experiments/legacy spec are unchanged. No new passing
tests or platform-wide readiness is claimed.

## Gap evaluation — 4 November 2026

Accepted scope is unchanged. Documentation can be reviewed/committed with these
explicit gates; functional implementation readiness is not established by staging.

| ID | Pending gap | Required closure / review boundary |
|---|---|---|
| D1 | Closed by owner scope reduction: no WYSIWYG/editor schema. | Use a plain-text GFM source editor, empty string for empty content and render GFM only in Task Detail. No rich-text dependency/toolbar/live preview. react-markdown/remark-gfm are selected under D3; exact versions remain dependency checks. |
| D2 | Design closed by owner-approved source byte contract above; implementation evidence pending. | Normalize CRLF/CR to LF, preserve other source, empty string for empty content; client UTF-8 check and Rules source.toUtf8().size() <= 65536. Test exact boundaries and direct writes. |
| D3 | Design closed by approved safe GFM policy above; implementation evidence pending. | react-markdown + remark-gfm; https/http/mailto/tel only, no raw HTML/relative navigation/image fetch, inert task lists, escaped code and contained tables. Test hostile stored source and browser handlers. |
| D4 | Design closed by approved separate detail path/shared root counter; enforcement evidence pending. | Root metadata plus detail/description, transactional baseline read, atomic description/root-version Save and metadata-only root Save. Test Rules atomicity and add explicit deletion coverage. |
| D5 | Design closed by approved mixed-schema/lazy-upgrade contract; rollout evidence pending. | Read Task1/2, write Task2 when permitted, description schema1/GFM format; transactional upgrade on deliberate edit, no read rewrites, compatible readers before writers and explicit rollback floor. |
| D6 | Closed by owner simplification and valid-change gating above; implementation evidence pending. | Save only valid actual changes, case-sensitive user text, no unchanged writes/upgrades; stale Save rejects with Refresh/Stay, no reapplication or implicit rebase. |
| D7 | Design closed by agreed per-Task edit/mutation serialization above; evidence pending. | Dirty editor switches use Stay/Discard; unchanged switches directly. Pending/unknown blocks mutations, Check save status reconciles, preference failures/conflicts are classified and leaving retains tracking; Logout available. |
| D8 | Design closed by approved immutable atomic Save receipt contract; evidence pending. | Stable operation ID, atomic receipt plus mutation, authoritative verification after timeout/reload, same-ID/original-version retry, reread receipt before conflict, retention with Task and explicit cleanup. No Activity Event or copied content. |
| D9 | Closed by accepted in-memory input/account-isolation contract; evidence pending. | Temporary failure preserves input, Closed/deleted copying only while authorized; access loss/Logout/UID switch clears content. Minimal D8 tracking survives for authorized status verification, not draft restoration. |
| D10 | Closed by approved stable-origin/list-restoration contract; evidence pending. | Capture real View/groups/anchor, reconcile moved/removed Tasks, nearest surviving position, deleted origin guidance/All Tasks choice, direct-link history and layout-preserved context; Search only when implemented. |
| D11 | Closed by approved read-only/immutable-lifecycle contract; evidence pending. | Authorized Closed/deleted Detail is read-only; All Tasks scope unchanged, no future actions, Rules reject lost editability at commit and no cached disclosure after confirmed access loss. |
| D12 | Design closed by agreed dependency/validation baseline; execution evidence/authority pending. | Integrate actual Slice5/5A/6/7, test focused/adversarial/browser/rollout/deletion behavior, respect Slice4 hold and separate cloud authority; acceptance follows passing evidence only. |

D1–D12 design decisions are now resolved by the owner agreements above. Concrete
implementation details and evidence remain: dependency versions, exact record/
receipt fields and Rules atomicity, codecs, supported rollout and test authority.
These are proof/engineering gates, not unresolved product alternatives. They are not new accepted product alternatives. Essential
integrity/security failures return for owner decision; no implementation may
silently weaken accepted Markdown safety, explicit-save or conflict guarantees.

## Remaining concrete contracts

Before coding, pin/check the selected GFM renderer dependencies, implement/test
the accepted URL/image and UTF-8 source policies, enforce the agreed metadata/detail placement
and settle versioned atomic Save/receipt
contracts and schema rollout. These implement the accepted design, not reopened
product choices. If a provider/security constraint cannot enforce an essential
invariant, return a concrete conflict rather than weaken it. Implementation,
commit, push and deployment remain pending their applicable instructions.
Documentation staging for review was subsequently authorized.

## Commit-review preparation — 4 November 2026

Owner requested gap evaluation and preparation for staging. Seven documentation
files record accepted Slice8 scope, the explicit gap register, project alignment
and Slice5A inventory impact. Whitespace, conflict-marker and local-link checks
cover documentation only. No application tests/builds, dependency installation, cloud
checks, commit, push or deployment are performed. Accepted product scope is
consistent; pending technical contracts above remain visible implementation gates.

## Markdown scope amendment — 4 November 2026

Owner removed WYSIWYG in favor of plain-text GFM authoring and rendered Markdown
in Task Detail. D1 is closed by scope reduction, not editor-package approval.
D2 now concerns source bytes; D3 concerns safe Markdown links/images/HTML handling.
Other concurrency, loading, deletion and explicit-save guarantees remain. Updated
related documentation is restaged under the existing review-preparation authority;
no dependency installation, application tests, commit or push is performed.

## Design closure and staged review — 4 November 2026

All twelve reviewed design gaps are resolved. Controlling baseline: plain-text GFM
source; 65,536 UTF-8 bytes with LF normalization; safe https/http/mailto/tel links
and no HTML/image loading; separate description child/shared root version; Task1/2
compatible rollout; Save enabled only for valid case-sensitive changes; simple
Refresh/Stay conflict recovery; per-Task mutation serialization; atomic immutable
Save receipts; account-safe in-memory drafts; real origin restoration; authorized
Closed/deleted read-only behavior; and evidence-based acceptance respecting holds.

Earlier WYSIWYG/reapplication proposals are superseded. No automatic merge,
permanent audit service, durable draft promise, new backend or future lifecycle
feature is introduced. Exact physical receipt fields, Rules relationships, pinned
dependencies and tests remain implementation work within the accepted baseline.
Seven documentation files are staged for review; no code, tests/builds, commit,
push or cloud action is performed. Design closure is not implementation acceptance.


## Slice9 accepted link amendment — 4 November 2026

Owner accepted Slice9 N6 with amendments: the registered /manual/ route restriction
applies only to relative links. Other relative links remain inert; permitted
absolute http/https/mailto/tel links remain allowed after the existing security
validation. Every permitted link requests a new target tab/window with safe opener
handling, superseding the earlier mailto/tel same-target rule. Browser/OS handling
may launch an external application. No unsafe protocol, image fetch or raw HTML is
allowed. See [Slice9](../09-onboarding-tasks-manual/index.md#manual-delivery-and-link-contract).
No implementation or rendering validation is claimed.
