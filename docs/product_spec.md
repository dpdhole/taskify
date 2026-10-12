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

## 7. Query-first Inbox information architecture — Issue 12 closed

### 7.1 Shared query interaction contract

- Seven fixed query destinations, not user-created saved views. **Home is a separate contextual workspace**; Global Search is a separate search workspace.
- Candidate eligibility belongs to the query. The user refines the returned population with applicable multi-select Category, Lifecycle State and Time filters; OR within each dimension and AND across dimensions. Additional DOW/TOD and Important/Urgent modifiers are exposed where meaningful.
- **One Group By** dimension at a time: Category, Lifecycle State or an applicable task date. The Group By dimension is omitted from the simultaneous filters; changing Group By clears conflicting filter selections.
- All queries and Global Search use consistent **Group By / Filter / Sort** semantics and controls, **only offering applicable dimensions**. Search itself defaults to ungrouped results and can group by Category.
- **View-global sort**, chosen through sortable table column headers, applies to every accordion group; it does not change group order. Changing sort **preserves expanded/collapsed groups**. A view's remembered sorting preference applies at entry.
- Group order is user-defined global Category order, fixed lifecycle order (§3.1), or calendar/time-bucket order. All group headers show matching counts; empty groups remain visible. On entry and filter changes, only the first nonempty group expands; Back from Task Detail restores exact expansion state.
- Time buckets support Older, Today, Near, Medium, Far, Later, Unspecified. Configure Near/Medium/Far boundaries **per view**; explicit **Remember** persists the choice, Reset restores that view's defaults. Display concrete date ranges.
- For **Paused Until** grouping, order is **Expired → chronological upcoming buckets → Indefinite → Unspecified**. A missing date is **Unspecified**, always last, for other date dimensions as well.
- Filter controls and table rows are shared across query views, with context-sensitive visible fields. **Omit the Group By field from individual task rows**, since the group header already supplies it. Keep fields relevant to the question each view answers.
- **Remember** saves supported Group By, filtering, global sort and time thresholds only when explicitly invoked. **Reset** returns to defaults. Temporary scroll/accordion state is never remembered across visits/devices.
- No automatic query refresh after task edits. An explicit **Refresh** reapplies eligibility, filters, group membership, sorting and counts and clears the edit indicator. See §7.4 for in-place edit feedback.

### 7.2 Seven query contracts

| Query | User question and eligibility | Default Group By | Default sort |
|---|---|---|---|
| **Focus** | What can I work on? Executable nonterminal tasks excluding Waiting, Blocked, On Hold and **future or indefinite recorded pauses**. **Expired pauses do not exclude**; Planned Start does not affect eligibility. Due/overdue alone does not override an effective pause. | Due | Planned Start ↑ |
| **Resolve** | What is interrupted/deferred? All nonterminal Waiting, Blocked, On Hold **OR** any recorded pause (expired, future, indefinite), including paused In Progress tasks. | Lifecycle | Paused Until ↑ |
| **Plan** | What needs clarification/planning? All Draft and Planned tasks, regardless of planned dates. | Lifecycle | Created ↑ |
| **All Active** | What's my outstanding workload? Default nonterminal nonarchived nondeleted tasks. Explicit temporary expansion includes terminal and archived, **not deleted** tasks. | Category | Due ↑ |
| **Recently Closed** | What did I close recently? Terminal Done, Cancelled or Unable to Complete tasks by Actual End. | Actual End | Actual End ↓ |
| **Archive** | What have I archived? Tasks by Archived Date. | Archived Date | Archived Date ↓ |
| **Trash** | What can I restore? Recoverable deleted tasks by Deleted Date. | Deleted Date | Deleted Date ↓ |

- **Names retained:** Focus, Resolve, Plan, All Active, Recently Closed, Archive, Trash. The name **All Active** does not change when scope is expanded.
- **No retrieval pagination** for Focus, Resolve, Plan or All Active in the current design; assume roughly 50–100 active tasks per user and revisit if performance or usage warrants.
- Recently Closed, Archive and Trash initially include records within the **last 15 days** of Actual End, Archived Date and Deleted Date, respectively. Each supports **explicit temporary expansion** of its date window; expansion is not Remember-saved.
- The original 60-day staleness rules for Plan and All Active are **superseded** by complete eligible-task loading.
- Prioritize is not a separate query; Paused is incorporated into Resolve; standalone All Tasks becomes the All Active expansion.
- Query Quick Search: temporary, **title-only** refinement applied to the current query and its filters, preserving grouping, updating counts and hiding unmatched rows; cleared on switching queries and not remembered.

### 7.3 Task row and contextual actions

- The **task title is always a link to Task Detail**, regardless of view. Row columns/treatment are shared, omitting the current Group By field while showing contextually useful information.
- A **visible primary action** is chosen by **hybrid relevance**: the query ranks useful actions, and the task state limits which are valid. When no meaningful contextual action applies, use **Edit** as the generic primary action.
- An **overflow menu** shows up to **two other valid and relevant lifecycle actions**, then standard actions, with separators as appropriate; never duplicate the visible primary action.
- Standard actions, when valid: **Edit**, **Change Category**, **Change Dates**, **Add Comment**, **Attach File**, **Archive/Restore**, **Delete**. Lifecycle/deferral actions such as Resume, Extend and Clear Pause are contextual, not universal.
- **Resolve:** prioritize **Resume** where the state is interrupted, **Clear Pause** for already In Progress tasks with a recorded pause, and **Extend** where applicable. Extend supports a later Paused Until or a change to **Indefinite**, without changing lifecycle. Only valid actions appear.
- **Add Comment** uses a lightweight popover targeting the permanent **Notes & Comments** thread. **Attach File** uses a lightweight file-select/upload popover targeting that same thread. Both honor existing lifecycle transitions (Draft/Planned → In Progress on successful comment/attachment; terminal tasks do not reopen).
- Closing either popover with unsaved content warns **Stay / Discard**; successful submission closes without warning.

### 7.4 Post-edit feedback and explicit refresh

- After a successful edit, **keep the task in its present row position** (do not immediately re-sort, regroup, or reapply filters) and highlight its background subtly. Only the latest edited task retains the highlight, until another edit or refresh.
- **Exception:** if the edited task is no longer eligible for the current workspace/filter, animate it vanishing. Update the affected group count immediately; otherwise **counts remain unchanged until Refresh**.
- No automatic repositioning, auto-scrolling to an updated row or background workspace refresh.
- Show a subtle actionable prompt, e.g. **“3 tasks changed. Refresh view”**. Count **distinct tasks changed since the last refresh**. Explicit Refresh reconciles rows/ordering/groups/counts and clears the counter and highlight.
- This interaction is user-controlled and distinct from **Home's automatic contextual refresh when returning to Home** (§8.6).

## 8. Home — HERE + NOW contextual workspace (Issue 12 decisions)

Home is a **contextual task-discovery workspace**, distinct from Focus's broader executable-work query. It has three permanently visible sections in this order:

1. **HERE + NOW** — tasks satisfying **both** the HERE and NOW matching rules.
2. **HERE** — tasks matching the selected location/proximity context, regardless of DOW/TOD.
3. **NOW** — tasks matching the current DOW/TOD context, regardless of location.

A task may appear in multiple sections. The sections do not consume or deduplicate one another. There is **no fixed 3–5-item cap**, and Taskify does not invent a relevance score.

### 8.1 Home eligibility and user controls

- **Initial lifecycle scope:** work in progress (In Progress, Waiting, Blocked, On Hold). **Do not exclude interrupted states**: blocked or waiting work can be contextually relevant.
- Users may expand lifecycle scope and refine **Category, dates and lifecycle status**. Changes are temporary unless explicitly saved through **Remember**; **Reset** restores Home defaults. The precise scope-expansion UI is still to be designed.
- DOW/TOD matching uses **user-set task preferences**, not inferred activity or Taskify-assigned priorities. Important/Urgent preferences remain available for task context; an Eisenhower Home presentation is not implied by these three sections.

### 8.2 HERE context

- HERE and HERE + NOW share a **single selected location and configurable proximity radius**.
- Start from the device's current location when permission is available; otherwise permit selection of a saved location or manual location choice.
- Support both coarse proximity matching and user-saved locations/places. A task needs matching location data to qualify for **HERE** or **HERE + NOW**.
- If no location context is available, both location-dependent sections stay visible with an empty state and a location-selection prompt. NOW remains independently functional.
- Match location/proximity at a **coarse resolution**; do not continuously relocate/recalculate the task list.

### 8.3 NOW matching and sorting

NOW uses the user's current local day-of-week and time-of-day slot.

A task qualifies when:
- **DOW + TOD** both match; or
- **TOD** matches and DOW is **absent**; or
- **DOW** matches and TOD is **absent or does not match**.

A configured **DOW mismatch excludes** the task even when TOD matches. A task with **neither** DOW nor TOD specified is excluded.

NOW default order is **(1) DOW + TOD match, (2) TOD-only match, (3) DOW-only match, then Task Title A–Z** within each level.

### 8.4 HERE / HERE + NOW sorting

- **HERE:** Distance ascending → Task Title A–Z.
- **HERE + NOW:** Distance ascending → NOW match class (DOW + TOD, TOD-only, DOW-only) → Task Title A–Z.
- Distance is the primary sort for HERE + NOW even when NOW match classes differ. User-defined sort changes may be exposed through Home configuration and Remember; no automatic composite relevance scoring.
- NOW does **not** use distance, including for tasks without location.

### 8.5 Home sections and shared accordion rules

- Each section always appears, even if empty, and its header displays the matching task **count**.
- When Home opens, **expand only the first section containing tasks**, following HERE + NOW → HERE → NOW; collapse the remaining sections. If none contain tasks, all sections are collapsed with empty-state indicators visible.
- Users may manually expand/collapse sections. Expansion state is **not** saved with Remember.
- When Home filters change, reset expansion to the first nonempty section.

These same **count / visible empty groups / first-nonempty-expanded / filter-change reset** behaviors apply to query-view Group By accordions. **Whether sorting changes reset accordion expansion is deferred to the query-views discussion**, not determined by Home rules.

### 8.6 Home refresh and navigation

- While Home remains visible, the user **manually refreshes** results. Returning to Home triggers an **automatic refresh**.
- Context resolution is coarse for both location and DOW/TOD. Do not continuously poll GPS or rerank results while Home remains open.
- Show location and freshness **separately**, e.g. **“Current location · Updated 5 min ago”**, alongside Refresh. Do **not** show distance moved since last refresh.
- Further responsive navigation/persistence behavior is pending Issue 12 discussion.

## 9. Navigation, Search, Create and Task Detail (Issue 12)

### 9.1 Application navigation

- Use a **Gmail-inspired responsive navigation model**: a persistent, collapsible desktop sidebar and the same hierarchy in a mobile navigation drawer.
- **Home** is the contextual HERE + NOW workspace (§8); **Tasks** contains the seven predefined query views (§7). Home is not an eighth query.
- **Calendar and Nearby are removed as separate workspaces.** Task scheduling dates and task locations remain supported, including Home's HERE contexts.
- **Potential future enhancement (not a current requirement):** a map presentation for Search results.
- **Global Search** is accessible from the application header and displays results in the main workspace.
- **Global Create** is prominent and independent of navigation, creating Tasks only; **Events are removed**.
- **Query Quick Search** searches titles within the current query, combines with its temporary filters, retains grouping, updates group counts, and clears on switching queries. It is not remembered.
- Settings is separated as application configuration; finer hierarchy is open.
- Eisenhower and other optional presentation concepts remain separate future design discussions, not a commitment to restore Calendar, Nearby, Events, or a View Builder.

### 9.2 Workspace retention versus navigation reset

The intended interaction is **choose a workspace, configure it, and work within it**.

- **Open Task from workspace → Back/Close:** restore the originating workspace's exact query, filters, sort, Group By, scroll position and manually expanded/collapsed groups.
- **Select a workspace using application navigation** (including a previously visited workspace): enter fresh using its explicitly **Remember**-saved configuration or product defaults. Do not restore temporary filters/scroll/expansion from a prior workspace visit.
- **New browser session:** initialize from remembered configuration or defaults; do not synchronize temporary workspace context across devices/clients.
- Remember saves eligible query/Home configuration, **not scroll position or accordion expansion**.
- A Task opened directly through a bookmark/external URL follows normal browser history and application navigation; do not invent a workspace-of-origin.
- Task Detail and workspaces should have stable, directly accessible routes. Browser Back and Taskify Back must behave consistently with the actual navigation origin.

### 9.3 Task Detail interaction

- **Mobile:** Task Detail opens full-page.
- **Desktop:** Task Detail opens as a **side panel** over the originating workspace, which remains visible for context, not simultaneous work. The user may **expand** to full page for intensive editing and optionally collapse back to the panel.
- **Working UX assumption, subject to usage validation:** most interactions are Workspace → side panel quick work → Back; full-page desktop usage is less frequent.
- Opening another task from the workspace while the panel is open switches the panel to that task **after handling any unsaved changes**. The panel is a focused task interaction; returning to the workspace closes it rather than encouraging concurrent workspace editing.
- Side-panel detail is **not** a different domain state or edit contract from full page. Every new desktop Task Detail entry starts in a side panel; prior expansion is not remembered.
- **Back/Close** from either side panel or expanded full-page detail returns directly to the origin workspace with exact context restored, rather than requiring an intermediate Collapse step.
- **Unsaved edits:** warn on leaving Task Detail, switching tasks, or returning to workspace. Offer **Stay** or **Discard Changes**; no automatic save. Stay cancels the navigation.
- Do not add next/previous task controls or nested task-to-task navigation without a demonstrated use case. Todo Threads are part of the parent Task.

### 9.4 Shared query accordion behavior

- Group headers always show matching task counts. **Empty groups remain visible.**
- On entering a query, expand **only the first nonempty group** in query group order; collapse all others. If every group is empty, keep all collapsed with visible empty-state indicators.
- Users can expand/collapse groups manually. **Changing filters** resets expansion to first nonempty; navigating to a workspace starts from this default. Opening a Task and returning via Back restores the exact existing group expansion.
- Accordion expansion is temporary and not remembered. **Behavior on sort changes remains open** for the query-views discussion.

### 9.5 Global Search — text only

Global Search uses the application-header Search entry, **not** a Text/Map switcher or geospatial search action. **Map Search is a possible future enhancement**, not current scope.

- **Explicit Search action**, no live query while typing; nonempty search text requires **at least 3 characters**. An empty text string is not a List search.
- **Cumulative depth selector**, labeled **Title** (default: task title), **Description** (adds task description and Todo Thread titles), and **All Content** (adds user comments and attachment filenames). Routine System Changes are excluded from full-text content.
- **Default scope:** active, nonarchived and nondeleted tasks; the user can explicitly expand scope to include terminal and archived tasks. Deleted tasks stay within Trash/recovery workflows.
- A **Filter icon** opens a popover with the applicable shared Category/lifecycle/scope filters. Filtering is independent from Text depth. **Apply** commits the current mode's selections; **Clear** clears the pending draft and requires Apply; **Cancel** or outside click discards unapplied changes. Indicate when filters are active.
- Search results display as a **tabular List** with **Title, Category, Status, Planned Start, Due and Match**. Default sort is **Task Title A–Z**. Users sort by clicking column headers; one view-global sort column at a time (ascending/descending), also used within optional Category groups. Category Group By is optional and **off by default**; when enabled, order categories globally and omit repeated Category field in grouped rows.
- **Match** indicates where the query matched; show highlighted title text, a short description/comment excerpt, a matching Todo Thread title, or an attachment filename as applicable. Shared Task Detail navigation applies.
- **Explicit Load More**, initially **10 results**, loading 10 more each time while preserving scroll/sort. More than two additional loads used frequently is a **UX validation signal**, not a reason to adopt infinite scrolling.
- On mobile, use standard responsive compact results/cards preserving key data and matching context; offer a compact sort control rather than imposing horizontal scrolling as the only interaction.
- Global Search supports explicit **Remember / Reset** for its eligible configuration, consistent with query views. Fresh navigation starts from remembered options/defaults; Back from Task Detail restores exact search text, filters, depth, results, scroll and grouping.
- Global Search and query Quick Search serve separate intents: **Global Search** searches progressively deeper content; **Quick Search** searches titles within a selected query. The shared Group By/Filter/Sort model is used only where meaningful.

## 10. Remaining presentation work

- Grouped accordion/list remains the primary query presentation; rows expose state, scheduling and Important/Urgent cues.
- Alternative Eisenhower presentation remains to be considered separately; a stand-alone Calendar workspace and Nearby workspace are excluded from the revised scope.
- Full Task Detail content hierarchy, Search result behavior, responsive sizing/breakpoints and accessibility mechanics remain for detailed design; do not infer Event or collaboration behavior from the legacy specification.
- Workspace-specific actions are projections of shared task-domain operations, not separate query implementations.

## 11. Archive / Trash bulk management and remaining legacy scope

- Archive and Trash are independent of task lifecycle. Archived tasks can be found in Archive or expanded All Active; deleted tasks can be recovered in Trash while eligible.
- **Manual-only bulk actions** in the respective workspace overflow menus:
  - **Archive:** **Delete older than N days/months** based on Archived Date, moving eligible tasks to Trash (soft delete).
  - **Trash:** **Purge older than N days/months** based on Deleted Date, permanently removing eligible tasks.
  - Choose N from a days/months dropdown; show the count of affected tasks and require explicit confirmation.
- No automatic scheduled cleanup. Retention periods, purge implementation and restore invariants remain architecture/record-management open issues.
- **Events, stand-alone Calendar and Nearby workspaces are removed** from the redesigned product. Task dates and locations remain. Recurrence, reminder delivery, notifications, external links and other historical scope require later explicit decisions.



- Archive/Trash are independent from task lifecycle. Archived tasks remain retrievable through Archive or expanded All Active. Deleted tasks are excluded from the expanded All Active population and may appear in Trash while recoverable.
- Exact archive/delete/restore/retention invariants and permissions remain **open**; do not infer them from the legacy Firebase specification.
- **Events are removed**. Recurrence, standalone Nearby, Calendar, reminder delivery, notifications, external secure links and other legacy features remain to be reconciled; the location capability required by Home HERE is retained.

## 12. Remaining non-IA design and implementation questions

Issue 12's product-level IA interaction decisions are **closed**. The following are **not** implementation approvals or silently resolved requirements:

1. Detailed TOD clock boundaries, reminder delivery and time calculations.
2. Precise persistence schema, filters/count computation feasibility, performance and responsive/accessibility implementation.
3. Archive/Trash retention, restoration constraints, purge mechanics and safety controls.
4. Identity linking, backup/operations and Appwrite DocumentsDB authorization, data integrity, multi-record event atomicity, and concurrent writes.
5. Whether legacy recurrence, external links and notification features are retained, deferred or removed, plus any future Eisenhower or Map Search presentation.

## 13. Specification governance

- This document is the **current working simplified product baseline**, grounded in explicit owner discussion decisions, and may be refined by later decisions.
- `docs/project_status.md` is the canonical entry point for actual project state and implementation status.
- `docs/product_spec_legacy.md` is **historical source material only** and must not override this document.
- Detailed data, architecture and security specifications remain to be written and approved. Previous Firebase verification does not certify the revised product.
- Updating this document does **not** authorize code changes, database migration, cloud configuration or deployment.
