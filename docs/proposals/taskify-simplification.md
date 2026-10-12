# Taskify Simplification — Reconciliation Proposal

> **Status: PROPOSED — NOT AUTHORITATIVE (2026-10-12).**
> Owner authorized preparation of specification migration on `docs/simplification-revision-intent-2026-10-12`. This proposal records discussion agreements and unresolved issues. Existing `docs/project_status.md` + its authoritative document set remain the approved repository baseline until coordinated replacement and explicit supersession approval. No implementation, cloud, database, migration, or deployment work is authorized.

## Source and provenance

- Repository: https://github.com/dpdhole/taskify
- Entry point: [project_status.md](../project_status.md)
- Authoritative baseline: [product_spec.md](../product_spec.md), [data_model.md](../data_model.md), [backend_architecture.md](../backend_architecture.md), [security_model.md](../security_model.md), [decisions.md](../decisions.md)
- Prior approved register: DEC-001–DEC-082, including implemented/verified Firebase Category work under the **previous** architecture.
- Discussion source: **Taskify — Simplification Specification Handoff**, prepared 2026-10-12, distributed as downloadable discussion handoff. This document summarizes that handoff; the handoff is **not yet a source of repository authority**.
- Status of decisions in this file: **agreed in discussion**, not yet recorded as superseding approved DEC entries.

## Proposed revised product scope (discussion agreement)

- Single-user Taskify, managing personal responsibilities even if execution occurs externally; no shared accounts, participant authorization, delegation, review collaboration, or communication workflows.
- Responsive browser/mobile-first client. Cloud authoritative, online writes; optional offline read cache only, no offline mutation sync.
- Proposed managed stack: Appwrite Auth + DocumentsDB, accessed through a Taskify-owned client data-access adapter; no custom Taskify backend initially. Social sign-in starts with Google; Apple next; stable internal account identity and secure provider linking.
- Concurrency: client pre-save last-updated check plus conflict warning/refresh/proceed; this is **best effort**, not atomic optimistic concurrency.

## Proposed task and execution model (discussion agreement)

- Lifecycle and global grouping order: `Draft → Planned → In Progress → Waiting → Blocked → On Hold → Done → Cancelled → Unable to Complete`.
- Task creation defaults Draft; Draft → Planned is explicit. Adding user comment/attachment to a user thread or closing a Todo Thread promotes Draft/Planned to In Progress. Creating or renaming Todo Threads does not.
- Interrupted lifecycle states require explicit Resume. Any nonterminal can close directly to a terminal state; reopening a terminal task enters In Progress.
- Parent Task replaces independent subtasks with optional Todo Threads. Every Task has permanent Notes & Comments and immutable System threads. Todo Threads may Open/Close/Reopen; contained user entries/attachments are scoped to threads. Significant system changes have structured immutable history.
- Category: one per Task; immutable protected Uncategorized record; other Categories rename/icon/reorder/archive but do not delete. Archived Category references remain valid on existing Tasks; one global user-defined ordering.
- Remove task-level Priority. Retain personal Important, Urgent, DOW and TOD preferences; separate a date's TOD precision from working-time TOD preference.

## Proposed date and pause rules (Issue 11 closed in discussion)

- User-managed Planned Start and Due; system-managed Actual Start and Actual End (set on lifecycle events, Actual End cleared on reopen).
- Planning dates support date-only, one of six configurable symbolic TOD slots, or exact clock time. The precision is user-visible and replacing one precision replaces the prior one. Timezone is user-configured.
- Overdue derives from Due, not Planned Start. Date-only Due becomes overdue at next calendar day's start. Date + TOD uses slot end. Scheduled dates do not change lifecycle automatically.
- Require Planned Start calendar date <= Due calendar date (when both defined), validating the completed edit. Scheduling can shift either date with an explicit default-OFF option to shift the other by the same number of calendar days.
- Paused Until is separate from planned dates and lifecycle; permits timed or indefinite pauses. Date expiry does **not** erase the recorded pause or change lifecycle. Wait/Block/On Hold may manage pause; finer defaults deferred.
- Resolve includes interrupted states and recorded pauses (including expired). Resume clears pause and transitions interrupted task to In Progress atomically. On closure preserve pause as history but no operational pause effect; reopen clears pause.
- Overdue is visible from planning/scheduling perspective even during an active pause; pause may suppress execution attention. Reminder/notification interaction is deferred.

## Proposed query-first IA (Issue 12 partially decided)

Seven fixed preset queries, default grouped accordion/task list; presentation alternatives (Eisenhower, Calendar, Map) deferred.

| Query | Eligible population / user question | Default grouping | Default within-group sort |
|---|---|---|---|
| Focus | Executable attention; excludes Waiting/Blocked/On Hold; finer pause/date inclusion deferred | Due | Planned Start ascending |
| Resolve | Waiting/Blocked/On Hold **OR** recorded pause on nonterminal Task, including expired | Lifecycle | Paused Until ascending |
| Plan | Draft OR Planned, regardless of planned dates | Lifecycle | Created ascending |
| All Active (working label) | Open non-archived non-deleted; temporary expanded All Tasks scope includes terminal and archived but not deleted | Category | Due ascending |
| Recently Closed | Recently terminal via Actual End | Actual End | Actual End descending |
| Archive (proposed name) | Archived tasks | Archived Date | Archived Date descending |
| Trash (proposed name) | Recoverable deleted tasks | Deleted Date | Deleted Date descending |

- Removed: Prioritize (absorbed by Focus/filters/sort), standalone Paused (absorbed by Resolve), standalone All Tasks (temporary expansion of All Active).
- Final fixed navigation labels are open for All Active, Archive and Trash. Expansion **does not rename** the navigation item and is temporary.
- One Group By: Category, Lifecycle State, or applicable date dimension. The grouped dimension is excluded from filters; changing grouping clears conflicting filter values.
- Category/State/Time filters are multi-select. Within dimension OR, across dimensions AND. Initial state is no restriction / all eligible Tasks.
- DOW/TOD and Important/Urgent remain personal filtering/context controls. Grouped results use global Category order or fixed lifecycle order.
- Each query has independent Near/Medium/Far thresholds and visibly displays actual ranges. Time buckets: Older, Today, Near, Medium, Far, Later, Unspecified, with indefinite/no-pause distinction where applicable.
- Filter counts are supported; exact count semantics deferred. The common filter interface omits inapplicable controls.
- Explicit Remember persists supported per-query grouping, filters, sort and time thresholds; Reset returns to defaults. Retrieval horizons are **fixed per-query product defaults**, temporarily expandable, never silently implying complete results. Resolve must not silently omit old unresolved tasks, Focus includes all qualifying overdue tasks.

## Supersession review matrix — NOT YET EXECUTED

| Original baseline area | Revised direction | Required reconciliation |
|---|---|---|
| DEC-003–DEC-010 product/roles/permissions | Single-user | Rewrite product identity, domain and authorization rules |
| DEC-012 and hierarchy | Todo Threads, no independently browsable subtasks | Replace task hierarchy/storage/query rules |
| Lifecycle and Ready scheduler | Nine-state explicit flow | Remove Ready/Review and scheduled promotion; adjust dates/history |
| Original Start/Due/End and system tags | Planned Start/Due/Actual Start/Actual End, Paused Until, TOD | Canonical date schema and derived projections |
| Per-user Hide Until/reminder | Task-level Paused Until; reminder deferred | Migrate state ownership, don't conflate notifications |
| Original Priority / category defaults | Remove Priority; protected Uncategorized, editable other categories | Review Category DEC-074–082 and deployed code separately |
| Nine query contracts and DEC-066 matrix | Seven query contracts | Revise query scope, filter capabilities, preference schema |
| Firebase backend/Firestore/Rules/auth/email | Appwrite and internal user ID | Specify authorization/data integrity and transactional feasibility |
| Verified Firebase Category implementation | Not verification of Appwrite design | Preserve historical evidence; mark revised implementation pending |

## Material blockers before declaring authoritative replacement

1. Appwrite DocumentsDB permissions, structural integrity, uniqueness, and multi-record atomic activity/system-event requirements need a verified feasibility/consistency contract. A direct-client architecture may not support all earlier guarantees without compromise; do **not** silently assert equivalence.
2. Exact persistence encoding for unset vs indefinite vs timed Paused Until and canonical TOD slots remains open.
3. Final query labels, Focus paused/date eligibility, date bucket default horizons, archival/trash recovery details and alternative presentations remain under discussion/testing.
4. Record management and application features from old baseline (Events, recurrence, location, reminders, attachment storage, archive/delete/purge) must be individually classified retain/defer/remove before omission can be treated as approved.
5. Implementation and migration strategy for existing Firebase code/data is not approved; no existing verified status transfers to the new stack.

## Proposed staged authoritative rewrite — requires explicit approval

1. Resolve material blockers or mark truly deferred features explicitly out of revised baseline.
2. Author revised `docs/product_spec.md` and corresponding supersession register entries (new DEC IDs, never overwrite historical decisions).
3. Reconcile `docs/data_model.md`, `docs/backend_architecture.md`, `docs/security_model.md` as one consistency unit.
4. Update `docs/project_status.md` to point to new approved source of truth, accurately separating approved, implemented, verified, and pending.
5. Review diff, approval, commit/push separately; no deployment is implied.

## Continuation

Issue 11 is closed in discussion; Issue 12 resumes with IA/presentation after controlled migration. Do not treat this proposal as implementing any change.
