# Taskify — Product Specification

> **WORKING SIMPLIFIED BASELINE · 2026-10-12.** This document consolidates product decisions explicitly agreed in the Taskify simplification discussion. It is the current **working product specification** on the revision branch, **not evidence of implementation** and not a blanket approval of unresolved design details. The historic, previously approved requirements are preserved in [product_spec_legacy.md](./product_spec_legacy.md) and Git history. [project_status.md](./project_status.md) records status and outstanding decisions.

## 1. Product vision and boundaries

Taskify is a responsive, mobile-first, **single-user personal responsibility and task manager**, not project-management or team-collaboration software. A task can involve people or work performed externally, but they do not receive Taskify accounts, permissions, task assignments or communications through the product.

- One person's task inventory and task-level personal working preferences.
- One browser experience across mobile and desktop, with future mobile application capability deferred.
- Cloud is authoritative. Creating and changing data requires connectivity. Optional offline **reading** may be cached; no offline writes, queued mutations or sync-conflict reconciliation.
- Avoid heavyweight workflow machinery, hidden automatic lifecycle transitions, redundant per-view action semantics and unnecessary configuration.
- AI assistance, participant workflows and additional advanced features are deferred unless explicitly reapproved.

## 2. Identity and overall behavior

- User signs in with a social identity provider, with Google first and Apple planned next. Remembered device sessions are desirable.
- Taskify maintains a stable internal account identifier rather than treating email addresses as immutable identity.
- Linking identities requires verified, provider-supported safe linkage; matching or hidden email values alone are not sufficient.
- Appwrite Auth and DocumentsDB, with a Taskify-owned data-access abstraction and no custom backend initially, are **architectural direction requiring feasibility reconciliation**, not a fully validated implementation contract.
- Client-side pre-save version checks and user warnings are best effort; they are not atomic concurrency control.

## 3. Task domain and lifecycle

### 3.1 Canonical lifecycle and order

| Stage | Lifecycle states |
|---|---|
| Upcoming | Draft, Planned |
| Active | In Progress, Waiting, Blocked, On Hold |
| Terminal | Done, Cancelled, Unable to Complete |

**Global fixed natural order:** Draft → Planned → In Progress → Waiting → Blocked → On Hold → Done → Cancelled → Unable to Complete.

- New tasks default to **Draft**. Draft represents an intent without sufficiently defined scope; Planned means high-level scope is understood even if details will change.
- **Draft → Planned is an explicit user decision**. Assigning planning dates never performs it.
- Adding a user comment or attachment in Notes & Comments or Todo Thread, or closing a Todo Thread, promotes Draft/Planned to In Progress. Creating/renaming a Todo Thread alone does not.
- Waiting, Blocked and On Hold do **not** automatically resume when someone comments, an attachment is added, a pause expires or any planned date arrives. **Resume** is explicit.
- A nonterminal task may close directly into any terminal state without first entering In Progress. Reopen from any terminal state enters In Progress.
- A task that has entered execution does not transition backwards into Draft/Planned.
- User activity on a terminal task does not silently reopen it.

### 3.2 System-managed actual dates

- **Actual Start** is recorded when the task first enters In Progress, if absent, and preserved through interruptions and reopening.
- A task closed directly from Draft/Planned can legitimately have no Actual Start.
- **Actual End** is set when entering a terminal lifecycle state and cleared on reopening; significant old values are represented in immutable System Changes.
- Planned Start and Due are never overwritten by actual timestamps.

## 4. Dates, scheduling and attention

### 4.1 Planned dates

- **Planned Start**: user-managed suggested commencement date.
- **Due** (planned completion/deadline): user-managed commitment date.
- Both support date-only, date plus a symbolic Time-of-Day (TOD) slot, or date plus exact clock time. Selected precision must always be visible to the user. Changing precision **replaces**, rather than adds to, the existing precision.
- Six continuous, configurable symbolic slots: Morning, Mid Morning, Afternoon, Evening, Night, Late Night. Slot boundaries and presets are open for detailed design. The task stores a symbolic slot and dynamically adopts the user's current configured slot boundary.
- Interpret relative dates and slots in the user's configured timezone.
- **Planned Start calendar date ≤ Due calendar date** when both are set; compare dates, not TOD/exact times. Validate the completed pair on save, so both fields can be edited together.
- Scheduling and rescheduling use the **same planning workflow**. When shifting either planned date, the user may explicitly elect to shift the other by the same number of calendar days, preserving interval and retaining the corresponding clock precision. This option is **OFF by default** in both directions.
- Planned dates have no automatic effect on lifecycle.

### 4.2 Derived timing

- **Overdue is determined by Due, not Planned Start.** Date-only Due becomes overdue at the start of the next local calendar date. Date+TOD uses the selected slot's end boundary. Exact time uses the specified instant.
- Terminal tasks are excluded from operational overdue classification.
- Planned Start reaching/passing its window can inform planning or attention views, but does not itself constitute Overdue.
- Overdue and scheduling visibility must remain independent of attention deferral.

### 4.3 Paused Until

- A task may have **no pause**, a **timed pause**, or an **indefinite pause**; these three cases must be distinguishable in the data model.
- Wait, Block and On Hold workflows can manage deferral. A Blocked task qualifies for Resolve whether or not it is paused.
- A timed pause ceases active suppression when its time expires, but its recorded pause remains until the user explicitly acts. Indefinite pause remains until cleared/resumed.
- **Resume** atomically changes an interrupted task to In Progress and clears its pause. Clearing an expired pause on a task already In Progress does not require another lifecycle transition.
- Paused Until can extend beyond Due: give a nonblocking warning; Overdue remains derived from Due. Rescheduling planned dates does not automatically rewrite Paused Until.
- Terminal closure preserves the pause value as historical context but it has no operational effect; reopening clears it and returns to In Progress.
- Execution-focused views may suppress deferred work, while planning/scheduling views preserve visibility of deadlines and overdue work. Fine-grained Focus/Resolve overlap is deferred to user testing.
- Reminder generation and its relationship to Snooze/Paused Until are deferred.

## 5. Task content and Todo Threads

- Each Task has two permanent threads: **Notes & Comments** (user content) and **System** (structured, immutable significant system changes).
- Optional user-created **Todo Threads** represent actionable work instead of independently browsable subtasks. A Task can have zero or many Todo Threads.
- Thread display order: Notes & Comments first; Todo Threads by creation order; System last. Open/Closed Todo status is displayed without moving or striking through threads.
- Todo Threads can be opened/closed/reopened. Close records system-managed `closed_at`; reopen clears it. Creating or renaming a thread does not initiate execution; closing a Todo Thread can initiate execution from Draft/Planned.
- Todo Thread rename is permitted even when closed or on a terminal parent; System records previous and new titles.
- On a terminal parent, comments/attachments remain allowed. Creating a Todo Thread or reopening a closed one requires confirmation to reopen the parent to In Progress.
- A Todo Thread can be deleted only if it **currently** contains no comments or attachments; deletion is recorded in System Changes.
- User comments and attachments belong to their original entry/thread, not a generic task-level history bucket. Unified task activity may show User and System entries in chronological order with independent user/system toggles.
- User-authored comments can be edited or deleted within 30 minutes of creation; edited entries retain original position/timestamp and show Edited. System events are immutable. Whether this client-enforced limit is security-critical remains a deliberate accepted limitation of the simplified approach.
- Exact storage representation, large-history behavior and cross-record transaction requirements need architectural verification.

## 6. Categories and task preferences

### 6.1 Categories

- Every task references exactly one Category; new tasks default to **Uncategorized**.
- Uncategorized is a permanent record with stable ID, fixed label/icon and no archival.
- Other starter and custom categories can be renamed, assigned a curated Material Symbols Rounded icon, reordered or archived; Categories are not deleted.
- Archiving a Category prevents new assignment while preserving all existing task references and task editability. Changing an existing task's Category uses an active Category.
- Category names: at most 30 grapheme clusters, Unicode NFC/trim normalization, case-insensitive uniqueness across active and archived categories.
- One global display order controls Category grouping in every query. Reset Alphabetical and insertion placement affect this single order. Uncategorized Top/Bottom placement is a view preference, not a separate global Category order.
- Details of initial starter catalogue are subject to final product-spec reconciliation.

### 6.2 Preferences

- Retain the user's **Important, Urgent, preferred Day-of-Week (DOW), and preferred Time-of-Day (TOD)** signals. These are separate from the task's scheduling TOD precision.
- Urgent/Important are independently identifiable by icon/treatment in lists; a dedicated Eisenhower matrix is a separate presentation discussion.
- **Remove task-level Priority** as an unnecessary legacy collaboration/execution field.
- Category is task classification metadata, not a lifecycle or scheduling operation.

## 7. Query-first Inbox information architecture

### 7.1 Common interaction contract

Taskify provides **seven fixed named query destinations**, each initially presented as a grouped accordion/list. Queries determine candidate task eligibility. Applicable filters refine results; one Group By organizes them; sorting determines row order. Query names are not action names.

- Category, Lifecycle State and Time-bucket filters are **multi-select**. Selections combine with OR within a dimension and AND across dimensions. Default filters = All / no additional restriction.
- One primary Group By dimension: Category, lifecycle, or a supported date dimension (Planned Start, Due, Actual End, Paused Until, archived/deleted date as applicable).
- The selected Group By dimension is **not available as a filter**. Switching Group By clears the newly conflicting filter selections; they are not restored on switching back.
- Category groups follow the global user-defined order. Lifecycle groups follow the fixed order in §3.1.
- Common time-bucket concepts: Older/Before Today, Today, Near, Medium, Far, Later, Unspecified. The user may customize Near/Medium/Far boundaries **per query**, and actual ranges must be clearly indicated. For Paused Until, additionally distinguish indefinite from no pause.
- DOW/TOD/Important/Urgent controls remain part of the query working-context filtering system, where applicable; detailed selection and rememberability rules remain for further review.
- **Remember** explicitly persists a query's supported grouping, filters, sorting and time thresholds; absent Remember, changes remain temporary. **Reset** restores product defaults.
- Provide a consistent filter interface with inapplicable controls unavailable and filter option counts visible. Count semantics are deferred to detailed UX design.
- Retrieval is **query-specific and bounded where appropriate**, with fixed product default limits and explicit **temporary expansion**. Expansion is not remembered. Do not suggest that a partially loaded set is complete. Resolve should not silently omit unresolved work; Focus should include all qualifying overdue work.
- No standalone saved-view builder or separate user-created query definitions are currently required.

### 7.2 Seven queries and confirmed defaults

| Query (working navigation label) | User question / eligibility | Default Group By | Default sort within group |
|---|---|---|---|
| **Focus** | What executable work merits attention now? Excludes Waiting, Blocked, On Hold; exact pause and Planned Start inclusion deferred | Due | Planned Start ↑ |
| **Resolve** | What work is interrupted or deferred? Includes nonterminal Waiting, Blocked, On Hold **OR** a recorded pause, even when expired | Lifecycle | Paused Until ↑ |
| **Plan** | What needs scope clarification or planning? All Draft and Planned, whether or not planned dates exist | Lifecycle | Created ↑ (oldest first) |
| **All Active** *(fixed label subject to final naming)* | What open work exists? Default nonterminal nonarchived tasks; explicit temporary expansion to **all nondeleted tasks**, including terminal/archived | Category | Due ↑ |
| **Recently Closed** | What closed recently? Terminal tasks selected by Actual End in a bounded retrospective window | Actual End | Actual End ↓ |
| **Archive** *(working label)* | What is archived and may need restoration? | Archived Date | Archived Date ↓ |
| **Trash** *(working label)* | What deleted tasks can still be recovered? | Deleted Date | Deleted Date ↓ |

- **Prioritize** removed as a redundant standalone query (available through Focus, filtering, Due grouping and working preferences).
- **Paused** merged into Resolve, not a separate query.
- **All Tasks** merged into All Active as temporary scope expansion; the navigation label does **not** change dynamically.
- Recently Closed, Archive and Trash remain distinct.
- Possible initial horizons discussed but **not finally approved**: Recently Closed 15 days; Archive 30 days. Exact per-query limits remain open.

## 8. Presentations, search and navigation

- The grouped accordion/list is the primary query result presentation; each row exposes clear state, schedule and Important/Urgent context.
- **Eisenhower, Calendar and Map** are distinct presentation-design discussions, not new task entities or implicitly approved query modes.
- Global Search and task-detail navigation are still required at the conceptual level, but exact UI hierarchy, controls, search implementation, and alternative presentation semantics are to be finalized.
- Actions are owned by domain operations, **not duplicated per query**. The query supplies a user's question and makes contextually relevant decisions/actions discoverable.
- Task detail interaction design and record-level management actions will be specified in a separate discussion.

## 9. Record management and deferred legacy scope

- Archive/Trash are independent from task lifecycle. Archived tasks remain retrievable through Archive or expanded All Active. Deleted tasks are excluded from the expanded All Active population and may appear in Trash while recoverable.
- Exact archive/delete/restore/retention invariants and permissions remain **open**; do not infer them from the legacy Firebase specification.
- Events, recurrence, locations, Nearby, reminder delivery, notifications, external secure links and related legacy features are **unreconciled**: retain, defer or remove only by explicit decision.

## 10. Outstanding decisions and implementation constraints

The following are not silently resolved by this working baseline:

1. Precise Focus eligibility with past/future pauses and scheduled-but-not-due tasks, and cross-query visibility after expiration.
2. TOD slot clock boundaries; reminder behavior; time-bucket handling/labels for absent, expired and indefinite pauses.
3. Final navigation names, fixed query retrieval horizons and detailed filters/counts; presentation modes and task details.
4. Identity linking, service free-tier constraints, data backup/retention and exact Appwrite DocumentsDB structure.
5. Direct-client data integrity and authorization feasibility, atomic thread/system-history transitions, optimistic concurrency limitations, and migration away from Firebase.
6. Legacy Event/recurrence/location/notification features and final record recovery semantics.

## 11. Specification governance

- This document is the **current working simplified product baseline**, grounded in explicit owner discussion decisions, and may be refined by later decisions.
- `docs/project_status.md` is the canonical entry point for actual project state and implementation status.
- `docs/product_spec_legacy.md` is **historical source material only** and must not override this document.
- Detailed data, architecture and security specifications remain to be written and approved. Previous Firebase verification does not certify the revised product.
- Updating this document does **not** authorize code changes, database migration, cloud configuration or deployment.
