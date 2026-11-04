# Slice 7 — Quick Create and basic list

Status: **detailing accepted by owner on 4 November 2026; implementation pending**.
The owner approved the proposed workflow, initial Task contract and all twelve
recommendations. This records agreement, not implemented/tested behavior. No
executable changes, dependencies, staging, commit, push or cloud actions occur.

Authority: [product specification](../product_spec.md), [architecture](../architecture.md),
[slice plan](../implementation_plan.md), [provisioning](05-workspace-provisioning.md),
[account deletion](05A-delete-account.md) and [navigation](06-responsive-navigation.md).

## Objective and boundaries

Capture a user-owned Draft Task and show cloud-confirmed Tasks in a minimal
All Tasks workspace. Implement Quick Create with Title, Category and Location,
active-classification selection, submission/recovery and Category-grouped list.
Do not implement Advanced Create, Task Detail/editing, Search, scheduling,
lifecycle actions, the complete query engine/editor, Dashboard charts or Saved
View execution. Ordinary Saved Views retain honest shells rather than run through
the limited All Tasks implementation. No creation Activity Event is recorded;
Created timestamp records creation. Later audited operations retain their required
atomic events; no event viewer or speculative event family is introduced here.

Slice5/5A/6 detailing exists locally, but their implementation/integration is not
established by this document. Admission requires authenticated UID/current session
and compatibility, completed provisioning, connectivity and no deletion fence.
Linking/provider-status verification is not a prerequisite. Slice4 remains held;
respect its existing test restrictions when planning integration checks.

## Form, defaults and validation

| Input | Accepted behavior |
|---|---|
| Title | Trim outer whitespace; require nonblank single-line text, at most 255 Unicode code points; preserve internal spaces; duplicates allowed |
| Category | Exactly one active Category, initially protected Uncategorized |
| Location | Optional active Location; initially absent, displayed as Unspecified |

Pickers use active records and stable IDs, with alphabetical names followed by
Uncategorized/Unspecified last. Do not infer defaults from the current View or
hidden predicates. Archive/deletion/name changes while the form is open must
reconcile safely: revalidate actual assignment on submission, preserve input and
ask for a valid choice rather than silently substitute a classification.

Unicode code-point counting is not UTF-16 length or grapheme counting. Define the
single-line/whitespace rejection set and prove identical normalization/length
semantics in the domain and deployed Rules. Include astral symbols, combining
marks, boundary lengths and line separators. If equivalent enforcement is not
feasible, return the conflict for decision; do not silently change the approved
counting rule or substitute a 255-byte limit. Category/Location name limits retain
their separately agreed grapheme semantics.

## Responsive create behavior

Below 960 CSS px, expose Create on Home/Task Views through the accepted mobile
FAB and open a bottom sheet. At/above 960px, top-of-navigation Create opens a
centered modal. No Create on Settings/Task Detail. Omit **More** until Advanced
Create has its own complete implementation; this incremental boundary does not
remove the final product requirement for it.

Provide accessible labels, validation messages and progress, initial Title focus,
modal focus containment/background handling, keyboard/touch access and reduced
motion. Closing an unchanged form is immediate; changed input prompts Discard /
Stay. Preserve inputs on recoverable errors. While pending/unknown, closing must
not imply cancellation of a submitted write; reconcile outcome before allowing a
new logical attempt. Do not provide an offline write queue.

Implement the accepted mobile FAB behavior: extended initially, label collapsed
on ordinary scrolling, approximately 20% icon opacity during sustained/rapid
scrolling, recovery on reversal/idle. Keep its effective hit area stable and
usable, avoid gesture interception, and hide the FAB while its sheet is active.
Measure/document scroll thresholds during implementation and validate accessibility
and reduced-motion behavior without changing the intended interaction silently.

## Initial Task contract

| Field | Initial value / invariant |
|---|---|
| Task identity/owner | Stable Task ID in authenticated UID namespace; identity/ownership immutable |
| Title | Validated explicit input |
| Category | Selected active stable ID, default Uncategorized |
| Location | Selected active stable ID or absent |
| Lifecycle | Draft |
| Pause | Not paused |
| Important / Urgent | Both Unset, distinct from No |
| Created | Cloud-confirmed timestamp |
| Planned Start / Due / Actual Start / Actual End / Deleted Date | Absent |
| Closure outcome | Absent |
| Versions | Independent record schema and concurrency versions |
| Creation recovery | Stable operation identity and enough validated correlation to reconcile the original intent |

Introduce only fields required here. Later description/Reference/editing use
explicit meaning-preserving schema evolution; do not populate speculative fields.
No obsolete DOW/TOD preferences, independent deletion Boolean or stored View
membership. Accepted Task path is users/{uid}/tasks/{taskId}, initial record schema
and concurrency version are 1, and introduced optional fields use physical nulls
decoding to semantic absence. Final required keys/Rules contracts must align with
Slice5 and compatibility policy.

## Submission, acknowledgement and recovery

Allocate stable Task/operation identity before submission and bind it to UID,
session generation and validated intent. Explicit Create admits one attempt;
disable duplicate submissions while pending/unknown. Enforce create-only identity,
allowed fields/defaults and current classification assignment in Rules. Capture
cloud-confirmed success, not cache/local pending-write visibility.

A lost acknowledgement is an unknown outcome. Read/reconcile that exact identity
and operation correlation authoritatively before retry. A matching confirmed
record is the original success; an absent record permits operation-specific safe
retry with the same identity only after authoritative resolution. A mismatched or
malformed existing record is a conflict, never success or permission to overwrite.
Do not generate a fresh ID merely because acknowledgement was lost. Preserve
sufficient nonsecret recovery correlation across reload to prevent duplicate
logical creation; bind it to UID and validate it before use. Exact retention and
payload-handling mechanics require implementation review; credentials never enter
recovery storage. Different explicitly requested Tasks may have identical titles.

Gate revocation/offline/account changes block new writes. Reconcile already
submitted operations; clearing old-account UI does not roll back commits. Never
publish late old-account results into a new session. Revalidate inputs if the user
changes intent after a confirmed failure rather than retry an earlier payload
under the same operation ID.

On cloud-confirmed success, close the form, announce creation and reconcile shared
Task state without manual Refresh. Stay at the current destination; do not imply
new membership in its Saved View. Provide **Show Task**, which opens All Tasks and
expands/scrolls to the Task's Category group. Offer **Open All Tasks** where useful.
Neither action navigates to a fake Task Detail page before Slice8.

## Minimal All Tasks workspace

Load complete open, nondeleted metadata for this UID and the classification labels
needed to render it. No partial first page is labeled complete; resolve population
loading/error/recovery before showing authoritative counts or empty inventory.
Cache-only data does not prove fresh completeness. Exclude documents with local
pending writes from confirmed rows/counts; an initial listener result containing
pending writes cannot establish a wholly confirmed population. Reconcile listener
and create acknowledgement races by Task ID so one confirmed Task appears once.
Do not label a new Task confirmed merely because the SDK emits its local snapshot.
Shared normalized state feeds rows/group membership/counts; confirmed local
changes reconcile reactively.

Mandatory Category grouping follows global provisioned/user order. Include empty
Category groups under the established zero-group semantics. Normal entry starts
all groups collapsed, independently toggleable; counts are independent of expansion.
The explicit Show Task action expands its target group without inventing a query
filter. Use Slice6 route/guard contracts and retain in-memory group/scroll state
across opening/closing Quick Create; ordinary fresh View entry remains collapsed.
If Show Task refers to a record no longer eligible, explain its unavailability
rather than manufacture a row. If Category changed, use the confirmed current
Category when resolving the action. All Tasks retains its protected persisted definition; no Save/editor here.

Default sorting is Due ascending, missing Due last. Equal/missing Due sorts by
Title, then stable Task ID. Define a deterministic text comparator shared by all
readers in the query contract; no locale-dependent silent ordering differences.
All Tasks must safely reject unsupported records rather than treat unknown
lifecycle/deletion metadata as eligible. Creating only Draft Tasks does not justify
removing open/nondeleted eligibility checks.

Show Title and Location; Category is expressed by group. Existing Tasks may retain archived Category or
Location references; those remain readable and keep their authoritative labels.
Picker eligibility for new assignments must not hide existing Tasks/groups merely
because their classification is archived. A truly missing/invalid reference is
an integrity/recovery error, not silent Uncategorized/Unspecified substitution. Use a responsive table/
labeled narrow-row presentation without changing sorting/eligibility. No fake
Detail link, lifecycle buttons, configurable columns or broader query controls.
There is no claim of complete Saved View execution or Dashboard readiness.

## Persistence, Rules, compatibility and deletion

Extend client capabilities and authoritative schema-family policy deliberately
before Task admission; no cloud publication is implied here. Add explicit UID-owned
Task permissions only, including protected immutable fields, valid initial state,
classification integrity and duplicate-ID rejection. Task creation records no
Activity Event, and Rules must not invent one to reuse a later lifecycle operation.
Future updates must preserve mandatory audited-event boundaries when introduced.

Update Slice5A's operator inventory, data verification and cleanup regressions
alongside introducing Tasks. Never leave new owned data outside account deletion
or assume deleting a Task parent recursively removes future child collections.
Deletion fences block creation across clients. No administrative credentials enter
browser artifacts and no hosted backend is added by this slice.

## Gap review — 4 November 2026

The accepted functional scope is unchanged. This review clarifies safety contracts
and separates unresolved implementation details from product decisions; it does
not certify implementation readiness.

| ID | Gap / conflict | Required resolution before acceptance |
|---|---|---|
| G1 | Exact Title comparator and whitespace/line-separator sets are unspecified; Unicode code-point length must match Rules. | Publish precise validation vectors and deterministic comparator, then prove domain/Rules agreement. The accepted comparator below resolves locale/case/accent behavior; no silent fallback to UTF-16 length. |
| G2 | Logical absent dates/Location versus Firestore physical query representation. | Specify codec representation and query/index strategy together. Demonstrate complete open/nondeleted loading including records with absent fields; do not assume a negative predicate includes missing fields. Any explicit physical null/sentinel must decode to the approved semantic absence and be reflected in Rules/schema policy. |
| G3 | Create/list listeners may expose local pending writes or publish the same Task twice. | Only confirmed records affect confirmed rows/counts. Reconcile by Task ID, test both acknowledgement/listener ordering and rejection/unknown outcomes. |
| G4 | Reload recovery and account-state cleanup can conflict. | Preserve a validated same-UID operation reference while invalidating old session callbacks; reacquire current admission before reconciliation. Do not reuse an old session ticket after refresh. Delete local recovery state on verified resolution; specify retention/explicit-reset behavior without persisting credentials. If required recovery storage fails, prevent submission until a safe recovery path is available. |
| G5 | A previous request may still commit after an authoritative read reports absence. | Absence is not proof the original request was cancelled. Retry remains create-only under the same ID; classify a resulting already-existing record by authoritative correlation, never overwrite it. Clear per-attempt UI without discarding unresolved logical operation identity. |
| G6 | Classification checks can race with archival or deletion fencing. | Rules validate current assignment/fence state at commit, not only picker selection. Test concurrent archive and deletion-intent commits; ordering must leave either a valid confirmed create followed by cleanup, or a rejected create. The finalizer must verify quiescence/completeness rather than rely on an earlier inventory page. |
| G7 | Minimal list completeness, archived references and reconnect handling are underspecified. | Keep readable archived labels/groups, distinguish missing references, revoke current/completeness claims on account/gate/network changes and verify the complete eligible population before restoring them. Document listener/page lifecycle and relevant cost evidence. |
| G8 | Quick Create can reset navigation state, and Show Task can become stale. | Preserve underlying group/scroll state while modal is open, use real route/guard semantics and resolve Show Task against current confirmed eligibility/Category. No fake Task Detail origin. |
| G9 | More is deferred from Slice7. | Resolved by owner-approved Slice8A after Slice8/before Slice9. Detail its fields/behavior separately; do not expand Slice8 silently. |
| G10 | Faded mobile FAB may be difficult to perceive. | Validate focus/hover/touch usability and contrast in the actual design; keep effective hit area/accessible name and reduced-motion handling. Return any conflict between accepted opacity and accessibility for owner decision rather than silently weakening either. |
| G11 | Slice5/5A/6 are not implemented locally; Task schema, Rules and deletion contracts do not exist yet. | Resolve concrete persistence/version/operation/inventory interfaces against implemented dependencies. Update authoritative policy only with separate cloud authorization and compatible rollout evidence. |
| G12 | Necessary integration tests overlap held Slice4 scope. | Separate pure/local checks from shared Auth/browser/regression checks, identify overlap and obtain applicable authorization before held execution. No primary-flow isolation or provider acceptance is inferred. |

For G4, a same-UID recovery reference may be resumed after sign-in with a new
session generation, but no callback/admission from the old generation may publish.
Local recovery metadata identifies a possible submitted operation; it never
independently authorizes a write, proves cloud success or overrides a deletion fence.
Define behavior if a previously created Task was later deleted: no automatic
recreation just because a delayed retry cannot find it. Maintain sufficient
server-side operation/deletion semantics when later delete/purge features arrive.

Technical design choices above may be resolved in implementation review within
the accepted scope. Any changed product behavior, revised Title semantics, added
creation fields or expanded Advanced Create scope returns for owner approval.

## Accepted gap resolutions — 4 November 2026

The owner accepted all recommendations below on 4 November 2026. These choices
are the agreed baseline; exact enforcement/receipt contracts and evidence remain
implementation gates.

The owner requested continuing the gap work and subsequently accepted the
recommendations. These refine G1–G12; acceptance is not an implemented guarantee.

| Decision | Recommended concrete baseline | Review / evidence boundary |
|---|---|---|
| Title whitespace | Reject line breaks before trimming, including CR, LF, NEL, Unicode line/paragraph separators. Trim a documented Unicode whitespace set at the edges; reject remaining control characters and malformed Unicode. Preserve ordinary internal spaces and accepted characters. | Publish an exact code-point table and Rules/domain vectors before implementation; do not silently strip invalid characters. |
| Text order | Compare NFC-normalized lowercase Title keys by Unicode code-point order, then original Title by code-point order, then stable Task ID. Preserve stored Title text; no accent stripping or device-locale collation. | Case/accent behavior is owner-approved. Pin/verify normalization behavior across supported environments. This is deterministic ordering, not a claim of every language's dictionary order. |
| Task physical record | Use users/{uid}/tasks/{taskId}, record schema 1 and concurrency version 1 at creation. Represent optional Location and introduced date/outcome fields explicitly as null on disk, decoding to semantic absence. | Accepted path/schema/null baseline; finalize required keys and validate migration/compatibility matrix; no speculative Description/Reference fields added. Null representation changes no approved initial Task meaning. |
| Eligible population | Query the validated open lifecycle set with nondeleted physical representation, explicitly including Draft and In Progress; validate every returned record and load required labels/order before complete state. | Final query/index shape and missing/null handling need actual adapter/Rules evidence; no silent filtering of malformed records or truncation. Client sorting uses the exact shared comparator. |
| Recovery reference | Persist minimal UID/project-scoped Task ID, operation ID and recovery-format version before submission. No Title, profile, credentials or form payload in persistent recovery storage. Keep payload only in current form memory. | Test storage availability before submit; warn/block when durable recovery cannot be established. Metadata is account-related even without content, and requires cleanup/isolation. |
| Recovery after reload | Reacquire current admission and check the recorded identity. Matching authoritative operation correlation confirms success. If absent/unknown, do not auto-resubmit; show unresolved status and a deliberate safe-retry/re-entry path under the same identity. | Define exact retry-intent correlation before implementation. Metadata alone does not reconstruct a lost form or authorize changing the old logical request. Never label storage deletion or timeout as cloud cancellation. |
| Recovery lifecycle | Retain unresolved references until authoritative resolution; remove resolved references and clear visible old-account state on Logout. New UID cannot inspect another account's reference; same UID may resume under a fresh session. | No automatic expiry that causes fresh-ID replay. Explicit reset must explain lost recovery linkage and cannot promise cancellation. Test partial metadata writes and multiple tabs. |
| Multi-tab submission | Coordinate pending UI locally where available, but enforce correctness through stable create-only IDs and server operation correlation. Two deliberate different-ID creates with the same Title remain legitimate. | Do not deduplicate by Title or claim local locking prevents all races. Choose transactional operation-receipt representation and retention only with schema/deletion review. |
| Advanced Create checkpoint | Deliver separately detailed Slice8A after Task Detail/metadata editing and before onboarding. Reuse supported metadata/validation without expanding Slice8 silently. | Owner-approved placement, preserving other slice identifiers. Slice7 continues to omit More. |
| Pending/unknown form | Keep Create disabled and show checking/retry guidance. A close request may dismiss presentation only with explicit pending-outcome guidance; recovery reference survives and another logical create is blocked until resolved. | Final accessible control/copy must not present Discard as undoing a submitted write. Logout remains available and invalidates UI admission. |
| Deletion integration | Task and operation-receipt inventory evolve together; retain server correlation long enough to prevent later stale retries recreating physically deleted Tasks. Finalizer fences first and verifies inventory after writes are quiescent. | Exact receipt retention/retirement belongs to the concrete Task/deletion contract; no new permanent tombstone or backend is approved. |

The recommendations intentionally distinguish recoverable operation metadata from
a durable draft. This slice does not promise recovery of unsaved Title/input after
browser restart. Reconstructing or retaining full drafts would require a separate
explicit data-retention/UX decision; safe unknown-outcome handling remains mandatory.

Before coding, specify exact validation vectors/required fields within the accepted
comparator/schema baseline, plus the operation/receipt contract and deletion integration. Before acceptance, prove
Rules/query/Unicode behavior and obtain authority for tests overlapping the existing
Slice4 hold. No technical review may silently weaken these requirements.

## Acceptance and documentation

| Area | Required evidence |
|---|---|
| Form | Exact defaults, required/Unicode Title boundaries, duplicates, active picker ordering, changed-form dismissal |
| Responsive | Mobile sheet/FAB, desktop modal, focus, keyboard/touch, reduced motion and resize |
| State | Draft/unpaused/Unset/no dates or closure outcome, authoritative Created, no creation event |
| Recovery | Double click, pending listener/ack races, lost acknowledgement, reload/new session, storage failure, late original commit, conflict identity, safe same-ID retry, input preservation |
| Isolation | Cross-account denial, Logout/account switch during submit, late callbacks and deletion fence |
| Classifications | Rename/archive/change races, invalid references and no silent reassignment |
| List | Complete eligible population including absent fields, pending-write exclusion, archived labels, reconnect completeness, empty/error/cache states, Category groups, collapsed entry, counts and deterministic sorting |
| Navigation | Create from Home/All Tasks, current destination preserved, Show Task expansion and honest Saved View shells |
| Integrity | Adversarial direct writes, immutable ownership/identity, schema compatibility and account-deletion coverage |

Use focused domain/component, adapter/Rules and browser checks; distinguish local
proof from separately authorized live provider/index/Rules evidence. Resolve overlap
with held Slice4 checks before executing that scope. Measure representative retained
population load and create/recovery costs without speculative account caps or
silent truncation. Existing accepted navigation/Auth/provisioning behavior requires
relevant regression evidence; detailing itself runs no tests.

Update available-feature guidance and applicable new-account templates without
adding starter Tasks before Slice9 or backfilling existing workspaces. No fabricated
manual URLs or publication. Readiness still requires concrete schema/codec/Rules,
operation-recovery and comparator contracts plus implementation validation.

## Review checkpoint

All twelve recommendations and the concrete gap resolutions are owner-approved,
including the 255-code-point Title rule, no creation Activity Event, omission of
More in Slice7 and separate Advanced Create as Slice8A. Documentation is complete and staged for commit review at owner request.
Implementation, commit, push, deployment and cloud provisioning remain separate
actions. This
specification changes no frozen experiments/legacy files and claims no passing
checks or platform-wide feasibility; overall feasibility remains INCONCLUSIVE.

## Commit-review readiness — 4 November 2026

Documentation review reconciled accepted gap decisions, Advanced Create placement
and Task schema/null/comparator baseline across the product spec, architecture,
plan, status, README and Slice5A inventory guidance. No open product-scope decision
is concealed by this checkpoint. Exact single-line/whitespace vectors, Rules/query
proof, operation-receipt/retention representation, dependency implementations and
held-test authorization remain explicitly required before implementation acceptance.

Documentation-only whitespace and local-link checks are performed; no application
tests/builds or provider/cloud checks are claimed. The staged set contains seven
documentation files only. Suggested commit: docs: accept Slice 7 Quick Create and
basic list detailing. No commit or push is performed by preparing this review.
