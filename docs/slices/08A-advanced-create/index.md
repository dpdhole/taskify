# Slice 8A — Advanced Create

Status: **detailing accepted with owner amendments on 4 November 2026;
implementation pending**. The owner directed proceeding after changing the expansion
action to **More Details**, prohibiting return to Less, and confirming no additional
required fields lack defaults. This documents the expanded creation baseline,
not an implemented/tested feature. No executable changes, dependencies, staging,
commit, push, cloud configuration or deployment are performed.

Authority: [product specification](../../product_spec.md), [slice plan](../../implementation_plan.md),
[navigation](../06-responsive-navigation/index.md), [Quick Create](../07-quick-create-basic-list/index.md),
[Task Detail/metadata](../08-task-detail-metadata/index.md) and [account deletion](../05A-delete-account/index.md).
Deliver after Slice8 and before Slice9, preserving existing slice identifiers.

## Objective and exclusions

Extend the same unsaved Quick Create draft with supported metadata before creating
one Draft Task. Reuse Slice7 validation/recovery, Slice8 Reference/preferences/
Markdown contracts and the actual implemented workspace/navigation/deletion gates.
Do not implement scheduling, planned dates, pause, Start, closure, Todos, Discussion,
links management, Activity viewer, uploads or complete Saved View execution.
There is no WYSIWYG editor, Markdown live preview or persistent draft-content promise.

## Fields and defaults

| Field | Default | Validation / requirement |
|---|---|---|
| Title | Empty | Only field requiring user input; required, trimmed, nonblank single-line, maximum 255 Unicode code points under Slice7 contract |
| Category | Protected Uncategorized | Exactly one active stable Category ID; picker order per approved defaults |
| Location | Absent, displayed Unspecified | Optional active stable Location ID; Unspecified last |
| Reference | Empty / semantic absence | Optional, trimmed single-line, maximum 255 Unicode code points, duplicates allowed |
| Important | Unset | Yes / No / Unset |
| Urgent | Unset | Yes / No / Unset |
| Description | Empty | Optional plain-text GFM source, D2 LF normalization and maximum 65,536 UTF-8 bytes |

No additional field in More Details requires input without an available default.
Do not inherit hidden View predicates or Task scheduling from the origin. Active
classification/uniqueness/protected-default rules remain unchanged. Revalidate
assignments at commit and preserve form input on failure instead of silently
substituting another classification.

Created Task starts Draft, unpaused, with no planned/actual/deletion dates or
closure outcome. Important/Urgent use explicit selected values, initially Unset.
Created timestamp is cloud-confirmed; identity and ownership are immutable.
Creation records no Activity Event. Reuse Task schema2 and independently versioned
description schema1/GFM contract once permitted by current compatibility policy.

## One-way expansion and responsive behavior

Add **More Details** to Quick Create only when this complete feature is available.
It expands the existing draft without writing a Task, changing operation identity
or dropping any current input. There is no Less control, collapse-back interaction
or alternate route back to compact Quick Create for that draft. Browser/contextual
Back must not be repurposed to bypass the one-way rule; it follows normal close/
unsaved navigation protection instead. A new deliberate draft starts compact. More Details is available even with empty/
invalid Title; it does not validate/submit. Disable expansion while create is
pending/unknown, without bypassing operation recovery.

Below 960 CSS px, the bottom sheet expands into a full-screen form. At/above
960px, the centered Quick Create modal expands into a large centered internally
scrollable modal, not a full-screen page or separate creation route. Resizing
preserves expanded state, all input, validation, focus context and submission state.
Do not revert to compact presentation because the viewport changes.

Keep the same Title/Category/Location values and expose Reference, Important,
Urgent and Description. Expansion itself is not a content edit and must not make
an otherwise unchanged draft dirty. Preserve entered values and visible validation, focus the first additional field
Reference, and announce expansion meaningfully. Preserve modal/background handling and accessible
keyboard/touch controls from Slice6/7, with reduced-motion behavior. No Create FAB
behind an open create surface.

## One draft, one Create action

All fields are part of one unsaved creation draft. Preference choices do not
persist independently as in existing Task Detail. Use one **Create** action,
enabled when required inputs and any supplied optional values are valid, admission
is current and no submission/unknown outcome blocks it. Unlike editing, creation
does not require a difference against an existing Task baseline. An empty optional
field is valid; no user must toggle a preference or add a description.

Dirty detection compares against initial form defaults and preserves case-sensitive
user text changes and meaningful Markdown whitespace. Apply only field-approved
normalization: Title/Reference trim outer whitespace; Markdown source only normalizes
line endings. Opening More Details alone does not cause a discard prompt.

Close an unchanged draft directly. A changed draft offers Stay / Discard; Discard
removes unsubmitted draft input only. Pending/unknown submissions use clear outcome
tracking, never pretend Discard cancels a committed create. Keep recovery tracking
across presentation dismissal; Logout stays available and clears visible user content.
No credential or form-content persistence is added. Browser reload/close cannot
promise restoration of unsaved advanced input.

## Markdown description

Use the same plain-text source editor/validation as Slice8. Render Markdown only
after creation in Task Detail, with the accepted GFM renderer and safe-link/image
policy; no live creation preview or new authoring tools. Empty normalized source
omits the description child. Nonempty source creates the D4 detail/description
record in the same atomic operation as root creation. Whitespace-only source is
not silently trimmed to empty; honor the source-preservation contract.

Description is not a Todo/discussion/external-link record. GFM task lists are
noninteractive content and code blocks do not execute. Reference remains text,
not automatic navigation or a relation.

## Atomic creation and recovery

Create root metadata and every required nonempty description child atomically.
Never create a partial Task then patch advanced fields as separate successful
operations. Rules must enforce initial state, owner/identity, exact allowed fields,
active assignments, description size/format and the required root/detail relationship.
Use create-only identity and aggregate initial concurrency version; no temporary
Task, post-create version bump or Activity Event is needed to reveal advanced UI.

Allocate stable creation Task/operation identity under Slice7 recovery. Bind intent
to the entire submitted root/detail operation. A root record alone is insufficient
to establish success when a description child was required. Define complete
correlation and authoritative verification together; do not persist full Markdown
locally merely to reconstruct recovery. Missing/malformed/mismatched root/detail
or correlation is not success or permission to overwrite.

After lost acknowledgement, reuse identity and original intent for any safe retry;
verify the original complete outcome before declaring success. If reload loses
original form content, verification may resume through minimal operation references
but blind payload replay cannot. No fresh Task ID solely because acknowledgement
was lost. Test late original commit, duplicate clicks, root/detail receipt races,
classification archival and deletion fences. Reuse the approved A3 creation receipt design below, but do not assume Slice8
Save receipt code already implements creation: finalize create-specific atomic
correlation/Rules and trusted deletion inventory.

## A3 accepted — atomic creation completion receipt

Owner agreed on 4 November 2026 after reviewing the lost-acknowledgement example.
Persist a small immutable creation completion receipt in the same atomic operation
as Task root and any required description child. All required effects succeed or
none do. Reuse the operation-receipt mechanism with operation type create, rather
than introduce a creation Activity Event or user-visible history entry.

The receipt identifies the original UID/Task/operation and confirmed completion,
with timestamp/version correlation sufficient to verify that exact create. Do not
copy the description or credentials into it. Its existence confirms original
completion despite subsequent Task edits; checking current root values alone is
insufficient. Validate the receipt's identity/type/schema authoritatively, not
just any record at a client-selected path.

Creation retry uses the original operation identity and complete intent. Read the
receipt before retry and again after an already-existing/conflict response, because
the original request may have committed after the previous read. Absence alone
never proves cancellation or permits overwrite/new-ID duplicate creation. Missing/
malformed/mismatched records require safe reconciliation. No metadata retry may
recreate a physically removed Task.

Exact receipt fields/path and Rules relationship are implementation contracts.
Include creation receipts in trusted enumeration/verification and permanent Task/
account cleanup with the shared receipt retention safeguards; no permanent audit
service or backend change. Test root/detail/receipt all-or-none writes, forged
receipts, duplicate clicks, late original completion, later Task edits, missing
Task and reload status recovery. This approval does not execute or validate code.

## Accepted gap resolutions — A1–A10

Owner explicitly agreed all remaining recommendations on 4 November 2026, after
A3 approval. All ten design gaps are resolved. The table records agreed behavior
and required engineering evidence; it does not claim implementation acceptance.

| ID | Gap | Recommendation / required proof |
|---|---|---|
| A1 | Expansion with invalid/empty Title or pending creation | Allow More Details even with invalid/empty Title; expansion does not submit. Disable it only during pending/unknown create. |
| A2 | Focus after expansion | Preserve values, focus Reference and announce expanded form; do not hide existing validation errors. |
| A3 | Original create cannot be proved from current edited root alone | Accepted: atomic immutable creation receipt above, no Activity Event. |
| A4 | Description omission versus incomplete operation | Bind expected description presence to operation correlation and verify original complete operation via receipt. Exact Rules enforcement needs proof. |
| A5 | Editing intent after failure | Only after authoritative original-outcome resolution may user change input/start a new attempt; never change unresolved payload under the same ID. |
| A6 | Reload loses draft but keeps tracking | Permit minimal-ID status checking, no promised draft restoration or blind replay without original intent. |
| A7 | Valid-create gating differs from no-op edit Save | Valid defaults permit creation; dirty state controls dismissal, not a requirement to change optional fields. |
| A8 | Back/Escape/Close could collapse the form | Route through dismissal/dirty/pending protection, never return expanded draft to compact mode. |
| A9 | Atomicity/security contracts | Define and adversarially prove root/detail/receipt links, UID/initial fields, fences and denial of partial writes/forged receipts. |
| A10 | Dependencies/test authority | Integrate actual Slice5/5A/6/7/8 contracts and respect held Slice4 tests/separate cloud authority. |

## Success and destination behavior

Cloud-confirmed success closes the form and updates shared metadata once. Preserve
the originating destination; creation does not imply membership in a Saved View.
Reuse confirmation feedback, Open All Tasks where useful and Show Task opening
All Tasks/expanding its current confirmed Category group. Do not auto-open Task
Detail or reintroduce a fake detail link. User can open the real Task Detail normally
after its implementation. Keep incomplete Saved View/query shells honest.

## Security, schema and deletion integration

Require initialized same-UID session/admission, compatible writer policy, complete
workspace initialization, connectivity and no account-deletion fence. Linking and
provider-status verification are not prerequisites; held Slice4 boundaries remain.
Retain late-callback isolation and current-state validation during submission.

Use permitted Task2/description1 readers/writers and existing rollout policy; no
new schema version is needed solely because UI exposes already supported fields.
Any additional physical fields or create-receipt family require explicit codecs,
Rules, compatibility review and deletion coverage. Extend Slice5A's manual trusted
finalizer with description/create-recovery records and verification of interrupted
advanced creation; do not rely on parent deletion to remove subcollections.
No hosted backend or expanded cloud authority is implied.

## Acceptance matrix

| Area | Required evidence |
|---|---|
| Fields | Only Title requires user input, defaults retained, optional validation, case-sensitive dirty detection and active pickers |
| Expansion | More Details label, same draft, no Less/back-to-compact, expansion alone not dirty |
| Responsive | Mobile full-screen, desktop large modal, scroll/focus/resize retention and accessibility |
| Draft | Preferences remain uncommitted, one Create, unchanged close and changed Stay/Discard |
| Description | GFM source only, UTF-8/line endings, empty omission, whitespace preservation and no creation preview |
| Atomicity | Root+required detail+creation receipt commit together or neither; description-presence correlation and direct partial/forged receipt writes denied |
| Recovery | Double submit, lost acknowledgement, reload tracking, complete correlation, late original commit and no duplicate Task |
| Isolation | Account switch/Logout/gate change, archived assignment and deletion-intent races |
| Outcome | Draft/unpaused/system dates unchanged, selected preferences, no Activity Event and shared-state update once |
| Navigation | Origin preserved, Show Task current group, no automatic Detail navigation or query claims |
| Cleanup | Trusted finalizer covers introduced records and incomplete/unknown creation outcomes |

Validate against actual implemented dependencies, not documentation alone. Focused
domain/component, Rules/adapter and browser evidence is required; obtain authority
for overlap with held Slice4 checks. Cloud/provider/publication authority remains
separate and local tests do not establish hosted or production readiness.
Update available-feature guidance/templates without adding starter Tasks before
Slice9, overwriting user content or backfilling existing workspaces. Measure
relevant payload/write/listener costs without speculative account caps.

## Review checkpoint

Accepted scope includes all initial recommendations except the superseded More/
Less interaction: label is More Details and expansion is one-way. All optional
advanced fields have empty/Unset defaults; Title is the only required user input.
Concrete operation correlation/receipt representation and Rules atomicity proof
remain implementation contracts, not new approved product alternatives. No tests,
code, stage, commit, push or cloud changes are performed by this documentation.

## Design closure — 4 November 2026

Owner agreed all A1–A10 recommendations. More Details may open with invalid/empty
Title, focuses Reference after announcing expansion and never returns to compact
mode. Create requires validity, not changed optional defaults. Back/Escape/Close
use dismissal guards; expansion itself is not dirty. Root, required description
and creation receipt commit atomically with complete-operation correlation.
Input may change/start a new attempt only after original-outcome resolution;
minimal-ID reload checking does not promise draft recovery or blind replay.

Exact record/receipt fields, Rules atomic links, dependency integration and tests
remain implementation requirements. This closes design decisions, not feature
acceptance or the held Slice4 testing scope. Documentation review/whitespace/link
checks are not application validation. No code, tests, staging, commit, push or
cloud actions are performed.
