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
- Terminal and deleted Tasks are **read-only**, including comments and attachments. Reopen before making changes. Direct terminal-to-terminal transitions are prohibited: reopen to In Progress, then close to the desired outcome.
- Closing as **Done** with any open Todo Threads always warns, listing the count and names, with Proceed/Cancel; this does not block closure or change thread states. No such warning for Cancelled or Unable to Complete; no separate system history event is necessary. Close/Reopen otherwise require no confirmation.

### 3.2 System-managed actual dates

- **Actual Start** is recorded when the task first enters In Progress, if absent, and preserved through interruptions and reopening.
- A task closed directly from Draft/Planned can legitimately have no Actual Start.
- **Actual End** is the most recent closure timestamp, cleared on reopen; earlier closure times/outcomes remain in immutable System Changes. **Actual Start** remains the original.
- Planned Start and Due survive closure and reopening unchanged and are never overwritten by actual timestamps.

## 4. Dates, scheduling and attention

### 4.1 Planned dates

- **Planned Start**: user-managed suggested commencement date.
- **Due** (planned completion/deadline): user-managed commitment date.
- Both support date-only, date plus a symbolic Time-of-Day (TOD) slot, or date plus exact clock time. Selected precision must always be visible to the user. Changing precision **replaces**, rather than adds to, the existing precision.
- Six **fixed nonconfigurable** symbolic slots (start-inclusive/end-exclusive, user's configured timezone): Late Night 00:00–05:00, Morning 05:00–08:00, Mid Morning 08:00–12:00, Afternoon 12:00–16:00, Evening 16:00–20:00, Night 20:00–00:00. They cover 24 hours without overlap; Task stores the symbolic slot.
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
- Closing to any terminal state **clears Paused Until**, retaining its previous value in System Changes; reopening returns to In Progress without restoring the pause.
- Execution-focused views may suppress deferred work, while planning/scheduling views preserve visibility of deadlines and overdue work. Fine-grained Focus/Resolve overlap is deferred to user testing.
- Reminder generation and its relationship to Snooze/Paused Until are deferred.

## 5. Task content and Todo Threads

- Each Task has two permanent threads: **Notes & Comments** (user content) and **System** (structured, immutable significant system changes).
- Optional user-created **Todo Threads** represent actionable work instead of independently browsable subtasks. A Task can have zero or many Todo Threads.
- Thread display order: Notes & Comments first; Todo Threads by creation order; System last. Open/Closed Todo status is displayed without moving or striking through threads.
- Todo Threads can be opened/closed/reopened. Close records system-managed `closed_at`; reopen clears it. Creating or renaming a thread does not initiate execution; closing a Todo Thread can initiate execution from Draft/Planned.
- Todo Thread rename is permitted only while its parent and the Todo Thread are editable; System records previous and new titles.
- Terminal/deleted parent Tasks and closed Todo Threads are read-only. To edit a terminal Task, the user must explicitly reopen it first.
- A Todo Thread can be deleted only if it currently contains no comments, file attachments, or external links; deletion is recorded in System Changes.
- Comments belong to their original thread; **attachments belong to thread headers**, not individual comments. In Task Detail, comments are compact chronological plain-text entries, composed and posted inline within Notes & Comments or the expanded Todo; editing is inline when permitted. Notes & Comments and open Todo Threads accept attachments; the System thread never does. A consolidated attachments section is deferred. Unified activity can show User/System entries with independent toggles.
- User comments can be edited/deleted within 30 minutes only when their parent Task/thread is editable; edited entries retain their original position/timestamp and show Edited. System events are immutable. Whether this client-enforced limit is security-critical remains a deliberate accepted limitation of the simplified approach.
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

- Retain the user's **Important, Urgent, preferred Day-of-Week (DOW), and preferred Time-of-Day (TOD)** signals. Important/Urgent are tri-state (Yes/No/Unset); DOW/TOD are multi-valued (possibly empty). These are separate from scheduling TOD precision. See Issue 16 in §13.4.
- Urgent/Important are independently identifiable by icon/treatment in lists; a dedicated Eisenhower matrix is a separate presentation discussion.
- **Remove task-level Priority** as an unnecessary legacy collaboration/execution field.
- Category is task classification metadata, not a lifecycle or scheduling operation.

## 7. Query-first Inbox information architecture — Issue 12 amended by Issue 14

### 7.1 Shared query interaction contract

- Six fixed query destinations, not user-created saved views. **Home is a separate contextual workspace**; Global Search is a separate search workspace.
- Candidate eligibility belongs to the query. The user refines the returned population with applicable multi-select Category, Lifecycle State, Time, and five-class Important/Urgent filters; OR within each dimension and AND across dimensions. DOW/TOD modifiers are exposed where meaningful. The Important/Urgent filter is supported by all six Task views.
- **One Group By** dimension at a time: Category, Lifecycle State, an applicable task date, or **Important/Urgent classification**. The active Group By dimension is omitted from simultaneous filters; changing Group By clears conflicting filter selections. Important/Urgent grouping and filtering use the same five classes (§13.7) across all six Task views.
- All queries and Global Search use consistent **Group By / Filter / Sort** semantics and controls, **only offering applicable dimensions**. Search itself defaults to ungrouped results and can group by Category.
- **View-global sort**, chosen through sortable table column headers, applies to every accordion group; it does not change group order. Changing sort **preserves expanded/collapsed groups**. A view's remembered sorting preference applies at entry.
- Group order is user-defined global Category order, fixed lifecycle order (§3.1), calendar/time-bucket order, or fixed Important/Urgent classification order (§13.7). All group headers show matching counts; empty groups remain visible. On entry and filter changes, only the first nonempty group expands; Back from Task Detail restores exact expansion state.
- Time buckets support Older, Today, Near, Medium, Far, Later, Unspecified. Configure Near/Medium/Far boundaries **per view**; explicit **Remember** persists the choice, Reset restores that view's defaults. Display concrete date ranges.
- For **Paused Until** grouping, order is **Expired → chronological upcoming buckets → Indefinite → Unspecified**. A missing date is **Unspecified**, always last, for other date dimensions as well.
- Filter controls and table rows are shared across query views, with context-sensitive visible fields. **Omit the Group By field from individual task rows**, since the group header already supplies it. Keep fields relevant to the question each view answers.
- **Remember** saves supported Group By, filtering, global sort and time thresholds only when explicitly invoked. **Reset** returns to defaults. Temporary scroll/accordion state is never remembered across visits/devices.
- No automatic query refresh after task edits. An explicit **Refresh** reapplies eligibility, filters, group membership, sorting and counts and clears the edit indicator. See §7.4 for in-place edit feedback.

### 7.2 Six query contracts (Issue 14 supersession)

| Query | Eligibility | Default Group By | Default sort |
|---|---|---|---|
| **Focus** | Executable nonterminal, excluding Waiting/Blocked/On Hold and future/indefinite pauses; expired pauses ignored; Planned Start does not restrict eligibility. | Due | Planned Start ↑ |
| **Resolve** | Nonterminal Waiting/Blocked/On Hold OR any recorded pause, including expired. | Lifecycle | Paused Until ↑ |
| **Plan** | Draft/Planned regardless of dates. | Lifecycle | Created ↑ |
| **All Active** | All nonterminal nondeleted, expandable to terminal nondeleted Tasks. | Category | Due ↑ |
| **Closed** | **All** terminal nondeleted Tasks, latest Actual End. | Actual End | Actual End ↓ |
| **Trash** | **All** recoverable deleted Tasks, Deleted Date; lifecycle unchanged. | Deleted Date | Deleted Date ↓ |

- **Recently Closed and Archive merge into Closed.** There is no separate archived state, Archived Date, or Archive/Unarchive action. Closing enters Closed automatically; reopening exits it.
- **All** Closed and Trash Tasks appear by default, without 15-day horizons. Historical grouping uses **Today → Near → Medium → Far → Older**, with Unspecified last when needed. Each view has independent Remember-saved Near/Medium/Far boundaries.
- Focus/Resolve/Plan/All Active continue to load all eligible Tasks; the old 60-day staleness and 15-day historical limits are superseded. All Active retains its name when expanded.
- Query Quick Search is temporary, title-only within query filters and cleared on switching queries.

### 7.3 Task row and contextual actions

- The **task title is always a link to Task Detail**, regardless of view. Row columns/treatment are shared, omitting the current Group By field while showing contextually useful information.
- A **visible primary action** is chosen by **hybrid relevance**: the query ranks useful actions, and the task state limits which are valid. When no meaningful contextual action applies, use **Edit** as the generic primary action.
- An **overflow menu** shows up to **two other valid and relevant lifecycle actions**, then standard actions, with separators as appropriate; never duplicate the visible primary action.
- Standard actions where valid: **Edit**, **Change Category**, **Change Dates**, **Add Comment**, **Attach File**, **Close/Reopen**, **Delete**, plus **Restore/Permanently Delete** in Trash. Archive/Unarchive are removed. Lifecycle/deferral actions such as Resume, Extend and Clear Pause are contextual, not universal.
- **Resolve:** prioritize **Resume** where the state is interrupted, **Clear Pause** for already In Progress tasks with a recorded pause, and **Extend** where applicable. Extend supports a later Paused Until or a change to **Indefinite**, without changing lifecycle. Only valid actions appear.
- **Add Comment** targets Notes & Comments; **Attach File** targets that thread's header (or the header of an open Todo Thread when editing Task Detail). Successful content activity can promote Draft/Planned to In Progress; terminal/deleted Tasks and closed Todo Threads remain read-only.
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

Each Task may select multiple weekdays and multiple TOD slots. Within each dimension, values match using **OR**. Across DOW and TOD, use **AND when both are configured**:

- If both are selected: current weekday must match one selected DOW **and** the current slot must match one selected TOD.
- If only one dimension is configured: that dimension must match.
- If neither is configured: Task is excluded from NOW.

A matching weekday alone does **not** qualify a Task when a configured TOD fails to match (and vice versa). This explicitly **supersedes** Issue 12's earlier DOW-only fallback on TOD mismatch. For example, a Monday/Wednesday + Morning Task matches only Monday or Wednesday mornings.

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
- **Home** is the contextual HERE + NOW workspace (§8); **Tasks** contains the six predefined query views (§7). Home is not an eighth query.
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
- **Default scope:** nonterminal nondeleted Tasks; scope can explicitly expand to terminal Closed Tasks. Trash is separate. Deleted tasks stay within Trash/recovery workflows.
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
- Task Detail's high-level hierarchy and action model are specified in §12 (Issue 15); responsive sizing/breakpoints, accessibility mechanics and usability validation remain. Search result refinements likewise remain for later design; do not infer Event or collaboration behavior from the legacy specification.
- Workspace-specific actions are projections of shared task-domain operations, not separate query implementations.

## 11. Attachments, Closed and Trash — Issue 14 scope decisions

### 11.1 Rich text and thread-level attachments

- Task descriptions use a WYSIWYG rich-text editor, with familiar formatting; users need not edit raw Markdown. Comments use short-form plain text and a compact inline composer, with no rich-text toolbar or hard character limit. Long-form content generally belongs in the Task description, but this is guidance rather than validation. Exact description storage/editor mechanics remain later design.
- The permanent **Notes & Comments** thread supports files, external links and comments even with zero Todo Threads. **Open Todo Threads** support attachments in their headers. Closed Todo Threads retain readable, noneditable attachments. The **System thread never supports attachments**.
- Files/links are attached to their owning thread header, independent of individual comments; no consolidated Task attachments section for now (future possibility). Each attachment has one owning thread.
- **Per-Task limits across all threads:** 5 MB per uploaded file; 25 MB combined uploaded files; 10 total file/link attachments. Upload one file at a time. Allow common images, PDFs, text, Office documents and archives; prohibit executables/scripts and dangerous file types. External links consume an attachment slot, not file bytes.
- Files open externally (browser or associated application), with no in-app preview; external links open in a new tab. URLs have optional display titles.
- **Rename** file display name or link title without confirmation; **replace** uploaded file or link URL/title and **remove** with confirmation. Replacement retains attachment slot/order/thread; failure preserves original. No moving attachments between threads. Record changes in System Changes.
- Removing a file immediately deletes its storage content **before** removing the database record; external-link removal deletes only the Taskify reference. System Changes retains name/action/time but not removed content. Safe retry/concurrency details are architecture work.
- Task-level **Download All** creates a ZIP using a sanitized Task title, containing uploaded files from all threads in **one flat folder** (disambiguate repeated filenames), optional `Task Description.txt` and `External Links.txt` (title, URL, owning thread), **no comments**. Generated text files are ZIP-only; uploaded files can also be downloaded individually.
- Download All is enabled on readable active/Closed/Trash Tasks when **any** description, uploaded file or link exists, even if no file exists. Otherwise disable it.

### 11.2 Closing and deletion

- Close/Reopen are lifecycle operations without ordinary confirmation. Done with open Todo Threads always warns with count/names but permits Proceed. Closure clears Paused Until, preserves planned dates, Actual Start and Todo Thread statuses; reopening clears Actual End, enters In Progress, and does not restore pauses. Previous closure outcomes/dates remain in System Changes.
- **Soft Delete** requires confirmation for any Task lifecycle. It changes **only deletion flag and deleted timestamp**, not lifecycle or other domain data. Deleted Tasks are readable but otherwise immutable in Trash.
- **Individual Restore** requires confirmation and clears only deletion metadata. Previously active Tasks return to their applicable query; terminal Tasks return to Closed. Record delete/restore in System Changes.
- **Permanent Delete** is allowed **only in Trash**, individually or via bulk purge, with explicit irreversible-deletion warning/confirmation but no typed DELETE. Permanently remove uploaded files **before** deleting associated database records. No Taskify recovery.
- Closed supports manual **Move to Trash older than N days/months**, using Actual End. Trash supports manual **Purge older than N days/months**, using Deleted Date. Each action retains an independent age threshold, separate from query time-bucket boundaries. These bulk actions apply to **all** qualifying Tasks regardless of view filters/grouping, remain located in their respective views (not Settings), show threshold and affected count, no preview, and require confirmation.
- Bulk actions may partially succeed; report success/failure counts, preserve completed changes, and leave failures for a subsequent **manual rerun** (no automatic retries or Retry Failed button). No scheduled cleanup or purge.

### 11.3 Legacy scope

- **Retain:** thread-level file and URL references, WYSIWYG descriptions/comments, Task locations and saved places, Important/Urgent/DOW/TOD.
- **Defer:** recurrence (independent new occurrence and use of Paused Until explored, but not designed or approved), reminders/notifications, related Tasks, possible Eisenhower and Map Search.
- **Remove:** Events, independent Calendar/Nearby, task collaboration/delegation/participant secure links, independent subtasks (Todo Threads replace them), Priority and View Builder.

## 12. Task Detail UX — Issue 15 closed (2026-10-13)

**Scope:** Approved product-level information hierarchy, responsive presentation and primary interactions. This is a specification decision, **not implemented or usability-verified**. Fine-grained forms, visual treatment, accessibility mechanics and technical contracts remain later work.

### 12.1 Shared hierarchy and navigation

Task Detail presents the same domain information and actions in a desktop side panel (expandable to full page) and mobile full page, following the already-approved origin-workspace restoration, direct-link navigation and unsaved-change protection rules in §9.3. Every new desktop entry starts in a side panel. Narrow screens wrap metadata badges and keep the action bar prominent; there are no mobile-only business workflows. These responsive choices are **subject to usage verification**.

Display sections, in order:

1. **Title**, clickable to edit inline with Save/Cancel when editable.
2. **Status and Dates**, displayed as clickable badges; show pertinent Planned Start, Due, lifecycle and Paused Until information contextually, without conflating planned and actual dates.
3. **Classification and User Preferences**, using clickable fields/badges for Category, Location and DOW/TOD; simple Important/Urgent preference changes can be direct labeled toggles.
4. **Task Action Bar**, with state-dependent primary action, secondary Close where applicable and tertiary **More** menu.
5. **Description**, initially a two-line **plain-text preview**; **More** expands to render the formatted description. **Edit** opens a WYSIWYG editing overlay with explicit Save/Cancel and unsaved-content protection.
6. **Notes & Comments**, expanded by default, showing compact thread-header file/link attachments and chronological plain-text comments.
7. **Todos**, displayed in creation order; each header shows Open/Closed status, and each Todo starts collapsed and can expand independently to show its own attachments/comments.
8. **+ Add Todo**, after existing Todo entries and before the log.
9. **Activity Log**, low prominence, collapsed by default and view-only.

**User-facing terminology:** **Todo** refers to an existing *Todo Thread*, not an independently browsable subtask or Task. **Activity Log** is the UI name for the immutable System thread/System Changes. These labels do not rename or alter their underlying domain semantics.

### 12.2 Task actions and contextual editing

The **Manage Task State** capability is a family of explicit business actions, not one unconstrained status setter. The interface chooses actions according to the Task's current persisted lifecycle:

| Current lifecycle | Primary action | Secondary |
|---|---|---|
| Draft | **Ready** (explicit Draft → Planned) | Close |
| Planned | **Start** (→ In Progress) | Close |
| In Progress | **Pause** (choose Waiting, Blocked or On Hold; manage Paused Until) | Close |
| Waiting / Blocked / On Hold | **Resume** (→ In Progress and clear Paused Until) | Close |
| Done / Cancelled / Unable to Complete | **Reopen** (→ In Progress) | None |

- **Ready** is an action label, **not a lifecycle state**. Setting or editing Planned Start/Due does **not** imply Draft → Planned; the transition remains explicit. Previously established implicit execution promotions from substantive Notes/Todo activity (§3.1) remain in force.
- **Pause** coordinates interruption status and Paused Until in the same workflow. In interrupted states, Resume remains immediately available; status and Paused Until badges can open contextual editing. Extending or clearing a pause may leave lifecycle unchanged. Pause expiry alone never resumes the Task.
- **Close** selects a terminal outcome (Done, Cancelled, Unable to Complete), retaining existing closure rules and the open-Todo warning for Done. Read-only restrictions apply to terminal/deleted Tasks.
- The tertiary **More** menu contains only valid **secondary Task-level actions** (such as Download All or Delete); it does not duplicate metadata edits or actions already exposed as primary/secondary controls.
- Most editing actions appear as **overlays over Task Detail**, preserving its context. Simple Title editing is inline; Category/Location may be inline fields, and non-interruptive add/remove preference changes may be labeled toggles. Context determines which inputs and actions are visible. An overlay action uses Save/Cancel as applicable; there is no universal Edit Task page requirement.
- Task Detail retains explicit-save and Stay/Discard protection for unsaved changes. A completed direct toggle is an individually committed action rather than a persistent unsaved form.

### 12.3 Notes, Todos, attachments and activity

- **Notes & Comments** is expanded on entry. Plain-text comments use a short, compact, tweet-like inline composer with explicit Post; no character limit is imposed. Entries display chronologically and support inline edits within the existing 30-minute edit/delete window, subject to editability. Comment content has no WYSIWYG/Markdown formatting. The previously specified WYSIWYG **comments** rule from Issue 14 is **superseded**; WYSIWYG **Task descriptions** remain.
- Files and external links display compactly in the owning Notes & Comments or Todo **header**, separate from comments. **+ Attach** opens an overlay for File or Link. Existing Task-wide attachment quotas, editability and ownership contracts (§11.1) apply unchanged.
- Existing Todos are ordered by creation; Open/Closed appears without reordering, and individual contents start collapsed. **+ Add Todo** opens a lightweight title-entry overlay with Add/Cancel, appends an initially collapsed Todo and **does not itself start execution**. Creating a Todo is not creating an independent Task.
- Activity Log is the read-only presentation of immutable System Changes and remains collapsed by default.

### 12.4 Deliberately left for later design

Precise form composition, per-transition comment requirements, exact badge layouts, responsive breakpoints, accessibility behavior, detailed attachment failure handling, storage/API contracts and usability-driven refinements are not settled by Issue 15. Issue 15 is **closed at product-specification level**, not implementation or UX-validation level.

## 13. Domain business rules — Issue 16 in progress (2026-10-13)

These are agreed specification rules, **not implementation evidence**. Issue 16 remains open for domain-invariant reconciliation. Todo and Activity Log are user-facing names for Todo Thread and immutable System Changes.

### 13.1 Interruption states

- **Waiting:** External time-based dependency.
- **Blocked:** Conflict, obstacle or unavailability.
- **On Hold:** User intent not to proceed for now.
- Transitions directly among these three states are permitted, require an explanation and are logged, without resuming execution. Preserve original Actual Start and current Paused Until unless explicitly changed.
- Paused Until is optional for all three states (no value, timed or indefinite). Expiry does not change lifecycle. Resume returns to In Progress and clears the pause.

### 13.2 Transition explanations

The natural path is **Draft → Planned → In Progress → Done**. Explicit deviations require an explanation unless they return to that path. An explanation is stored on the same immutable Activity Log entry as the lifecycle transition, not as a separate user comment. Every lifecycle transition has an Activity Log entry; explanations may also be supplied optionally.

| Transition | Explanation |
|---|---|
| Draft → Planned (Ready), Planned → In Progress (Start), In Progress → Done | Not required |
| Nonterminal → Waiting / Blocked / On Hold | **Required** |
| Waiting ↔ Blocked ↔ On Hold | **Required** |
| Waiting / Blocked / On Hold → In Progress (Resume) | Not required |
| Nonterminal → Cancelled / Unable to Complete | **Required** |
| Draft / Planned → Done directly | **Required** |
| Done / Cancelled / Unable to Complete → In Progress (Reopen) | **Required** |

Previously approved implicit promotions from meaningful comments/attachments or closing a Todo do **not** require an additional comment. The full transition matrix remains part of the open invariant review. Existing actual-date and closure rules are unchanged.

### 13.3 Planned Start, Due and Paused Until

- Provide **relative-date shortcuts** (e.g. Tomorrow, Next Monday, In 10 Days, In 2 Weeks) and a conventional date/time picker for all three. Resolve relative choices at confirmation in the configured timezone, keeping existing date-only, TOD-slot and exact-time precision. Free-text natural-language input is deferred. Indefinite is additionally available for Paused Until.
- Adding, modifying or clearing dates/pause requires **no explanation**, but permits an optional explanation; the Activity Log records old and new values and any explanation. Changing Paused Until need not change status.
- Planned date changes alone do **not** transition Draft → Planned. Ready remains explicit.

### 13.4 Classification and preferences

- **Category:** Single required classification; empty/default/reset assignment is the protected **Uncategorized**, not a null or new Unclassified Category. **Location:** Optional; missing/cleared displays **Unspecified**. Both use contextual single-value editing.
- **Important** and **Urgent** are independent tri-state user preferences: **Yes**, **No**, **Unset** (the default). Unset is distinct from No. A Task is Eisenhower **Unclassified** whenever **either** value is Unset; only two explicit values place it in a quadrant. The matrix UI remains deferred.
- **DOW** supports zero or more of seven weekdays; **TOD** zero or more of the six fixed slots. Within each dimension, selected values match using **OR**; empty means **no preference**, not all days/times. When both dimensions are configured, **both must match** (AND). When only one is configured, it alone determines a NOW match. Neither configured excludes the Task from NOW. This supersedes the earlier DOW-match override of TOD mismatches; see §8.3.
- Important/Urgent may use labeled tri-state tag controls, DOW/TOD add/remove tags. Category, Location, preferences changes require **no comments and no Activity Log entries**.

### 13.5 Ordinary content and activity recording

| Business operation | Explanation required | Activity Log |
|---|---|---|
| Change Task title or description | No | No |
| Change Category, Location, Important, Urgent, DOW or TOD | No | No |
| Post/edit/delete ordinary comment | No | No separate entry |
| Create Todo | No | No required entry |
| Rename Todo | No | Yes: old/new title |
| Close/reopen Todo | No | Yes: transition |
| Delete eligible empty Todo | No | Yes: deletion |
| Add/rename/replace/remove attachment or link | No | Yes: operation |
| Soft Delete / Restore Task | No | Yes: action |
| Permanently Delete Task | No | Task and its history removed |

- Ordinary comments retain their own timestamp/Edited presentation and 30-minute edit/delete window. If posting a comment implicitly promotes Draft/Planned to In Progress, log the resulting **lifecycle transition**, not a duplicate comment action.
- Todo creation does not start execution; closing a Todo may do so. Todo deletion remains restricted to Todos with no comments, uploaded attachments or external links. Parent/closed read-only restrictions stay in effect.
- Existing attachment ownership, quotas, confirmation rules, Task Delete/Restore confirmations and permanent file-before-record deletion remain unchanged.

### 13.6 Confirmed domain invariants and autonomy principle

- **Personal autonomy:** The user is accountable only to themselves. Taskify is a working repository of activity, history and knowledge, **not a compliance audit system**. Enforce logical invariants with minimal friction. Retain the specifically agreed mandatory lifecycle explanations as useful historical context.
- **Actual Start:** System-managed, assigned on the **first** entry to In Progress, including Reopen from a terminal Task that never previously started. Once assigned, preserve through Resume, Close and Reopen; a Task closed directly from Draft/Planned may have no Actual Start.
- **Actual End:** System-managed, assigned upon each closure as the latest closure timestamp, cleared on Reopen. Prior outcomes/times remain in Activity Log. Actual Start/End are **not directly editable, clearable or backdateable** by the user.
- **Planned Start and Due:** User intentions, not lifecycle gates. Task may begin before/after Planned Start or close before/after the planned dates; lifecycle actions do not modify them. The existing Planned Start calendar-date ≤ Due calendar-date validation remains. Paused Until may exceed Due (including when already overdue), with a nonblocking warning; overdue remains independent of pause.
- **Task versus Todos:** Only the user decides when a parent Task is Done. Closing all Todos never closes the Task automatically; closing a Task with open Todos retains the existing warning. Todo states persist on Task Close/Reopen. A closed Todo can reopen while its parent is nonterminal and nondeleted; a terminal parent must first be Reopened, and a deleted parent Restored.
- **Todo creation/deletion:** Adding a Todo is valid in any nonterminal, nondeleted parent state and does not change lifecycle. Keep the prohibition on deleting a Todo with comments, files or links.
- **Implicit execution promotion:** Adding a comment or file/link attachment in the relevant editable thread, or closing a Todo, moves Draft/Planned to In Progress and assigns Actual Start if absent; record the lifecycle transition without an extra required comment. Creating/renaming Todos alone does not promote, and content activity never automatically resumes Waiting/Blocked/On Hold.

### 13.7 Important/Urgent grouping and filtering (Issue 16)

- **One combined five-class dimension** is available as **Group By** and **multi-select Filter** across **all six Task views** (Focus, Resolve, Plan, All Active, Closed, Trash). Existing default groupings remain unchanged. The same dimension cannot simultaneously group and filter.
- Fixed, **nonconfigurable** bucket order and user-facing labels:

| Order | Label | Important | Urgent |
|---|---|---|---|
| 1 | **Do First** | Yes | Yes |
| 2 | **Schedule** | Yes | No |
| 3 | **Delegate** | No | Yes |
| 4 | **Eliminate** | No | No |
| 5 | **Unclassified** | Unset in either dimension | Unset in either dimension |

- Unclassified means **either** preference is Unset, including both Unset; every Task maps to exactly one bucket.
- Multi-select filter uses OR within the five classes and AND with other applicable filter dimensions. Same five buckets, counts, empty-group display, global sorting, Group By filter exclusion, and Remember/Reset contract as existing grouping (§7.1). The ordering remains fixed unlike user-defined Category order.
- **Delegate** and **Eliminate** are names of preference classifications, **not** operations to delegate work or delete Tasks. No collaboration, deletion, lifecycle or scheduling effects. Eisenhower Matrix UI remains deferred.
- **Architecture direction (proposal to validate):** Favor one configuration-driven query-view implementation with shared filtering, grouping, sorting and presentation mechanics, while retaining per-view eligibility and domain-operation differences. This is not an implemented or approved technology/API design. The five-class dimension can be hidden in a view later if needed without changing its underlying semantics.

### 13.8 Issue 16 closure

**Issue 16 is closed at the product/business-rule specification level (2026-10-13).** Fine-grained transition availability, Appwrite/data model, authorization, concurrency, immutable event atomicity, query execution strategy, timezone/DST specifics and actual implementation validation are **not** claimed complete. These are next-stage domain/architecture reconciliation and design tasks.

## 14. Remaining non-IA design and implementation questions

Issue 12 IA is closed, but Issues 13–14 **supersede its conflicting archive, historical-view, terminal-edit and deletion rules**. These are specification decisions, not implementation evidence.

1. Fixed TOD timezone/DST behavior; reminders/notifications and recurrence details deferred.
2. Task Detail visual/accessibility/usability verification and unresolved rich-text/attachment implementation details; Issue 15 high-level interaction hierarchy is closed.
3. Design and verify storage/query contracts (including multi-valued DOW/TOD and the five Important/Urgent classes), safe file-before-database deletion, partial failure and concurrency, ZIP export and query performance; product-level Issue 16 decisions are closed.
4. Appwrite permissions, integrity, atomic multi-document activity, identity linking, backup and migration.
5. Related Tasks, Eisenhower, Map Search and other deferred features subject to separate decisions.

## 15. Specification governance

- This document is the **current working simplified product baseline**, grounded in explicit owner discussion decisions, and may be refined by later decisions.
- `docs/project_status.md` is the canonical entry point for actual project state and implementation status.
- `docs/product_spec_legacy.md` is **historical source material only** and must not override this document.
- Detailed data, architecture and security specifications remain to be written and approved. Previous Firebase verification does not certify the revised product.
- Updating this document does **not** authorize code changes, database migration, cloud configuration or deployment.
